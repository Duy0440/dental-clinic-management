import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";

const initialInvoiceForm = {
  patient_id: "",
  appointment_id: "",
  payment_method: "Tiền mặt",
};

const createEmptyDetail = () => ({
  service_id: "",
  custom_description: "",
  quantity: 1,
  unit_price: "",
  discount_amount: 0,
});

// admin invoices page (lap hoa don va in phieu thu)
function AdminInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [invoiceForm, setInvoiceForm] = useState(initialInvoiceForm);
  const [details, setDetails] = useState([createEmptyDetail()]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerResults, setShowCustomerResults] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // fetch invoice data (lay hoa don, khach hang, dich vu)
  const fetchData = async () => {
    try {
      const [invoiceResponse, customerResponse, serviceResponse] =
        await Promise.all([
          axiosClient.get("/invoices"),
          axiosClient.get("/patients"),
          axiosClient.get("/services/admin"),
        ]);

      setInvoices(invoiceResponse.data.data || []);
      setCustomers(customerResponse.data.data || []);
      setServices(serviceResponse.data.data || []);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Không thể tải dữ liệu hóa đơn.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatMoney = (value) => {
    return `${Number(value || 0).toLocaleString("vi-VN")} VNĐ`;
  };

  // calculate subtotal (tinh tien tung dong dich vu)
  const calculateDetailSubtotal = (detail) => {
    const quantity = Number(detail.quantity || 0);
    const unitPrice = Number(detail.unit_price || 0);
    const discountAmount = Number(detail.discount_amount || 0);
    const subtotal = quantity * unitPrice - discountAmount;

    return subtotal > 0 ? subtotal : 0;
  };

  const totalAmount = details.reduce((total, detail) => {
    return total + calculateDetailSubtotal(detail);
  }, 0);
  const normalizedCustomerSearch = customerSearch.trim().toLowerCase();
  const selectedCustomer = customers.find(
    (customer) => Number(customer.id) === Number(invoiceForm.patient_id),
  );
  // customer autocomplete (tim khach khi lap hoa don)
  const filteredCustomers = customers
    .filter((customer) => {
      if (!normalizedCustomerSearch) return true;

      return [customer.full_name, customer.phone]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(normalizedCustomerSearch),
        );
    })
    .slice(0, 8);

  const handleInvoiceChange = (event) => {
    setInvoiceForm({
      ...invoiceForm,
      [event.target.name]: event.target.value,
    });
  };

  // handle detail row (cap nhat dong dich vu trong hoa don)
  const handleDetailChange = (index, event) => {
    const { name, value } = event.target;

    setDetails(
      details.map((detail, detailIndex) => {
        if (detailIndex !== index) {
          return detail;
        }

        return {
          ...detail,
          [name]: value,
        };
      }),
    );
  };

  const addDetailRow = () => {
    setDetails([...details, createEmptyDetail()]);
  };

  const removeDetailRow = (index) => {
    if (details.length === 1) {
      return;
    }

    setDetails(details.filter((_, detailIndex) => detailIndex !== index));
  };

  const resetForm = () => {
    setInvoiceForm(initialInvoiceForm);
    setDetails([createEmptyDetail()]);
    setCustomerSearch("");
    setShowCustomerResults(false);
    setShowForm(false);
  };

  const chooseCustomer = (customer) => {
    setInvoiceForm({
      ...invoiceForm,
      patient_id: String(customer.id),
    });
    setCustomerSearch(`${customer.full_name} - ${customer.phone || "Chưa có SĐT"}`);
    setShowCustomerResults(false);
  };

  // submit invoice (tao hoa don kem chi tiet)
  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setErrorMessage("");

    if (!invoiceForm.patient_id) {
      setSaving(false);
      setErrorMessage("Vui lòng chọn khách hàng từ danh sách gợi ý.");
      return;
    }

    try {
      const payload = {
        patient_id: Number(invoiceForm.patient_id),
        appointment_id: invoiceForm.appointment_id
          ? Number(invoiceForm.appointment_id)
          : null,
        payment_method: invoiceForm.payment_method,
        details: details.map((detail) => ({
          service_id: detail.service_id ? Number(detail.service_id) : null,
          custom_description: detail.custom_description,
          quantity: Number(detail.quantity || 1),
          unit_price: Number(detail.unit_price || 0),
          discount_amount: Number(detail.discount_amount || 0),
        })),
      };

      await axiosClient.post("/invoices", payload);

      setMessage("Lập hóa đơn thành công.");
      resetForm();
      await fetchData();
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Không thể lập hóa đơn.",
      );
    } finally {
      setSaving(false);
    }
  };

  // delete invoice (xoa hoa don)
  const deleteInvoice = async (invoice) => {
    const confirmed = window.confirm(
      `Xóa hóa đơn ${invoice.invoice_code || `HD${invoice.id}`}? Thao tác này dùng để dọn hóa đơn nhập sai hoặc dữ liệu test.`,
    );

    if (!confirmed) {
      return;
    }

    setMessage("");
    setErrorMessage("");

    try {
      await axiosClient.delete(`/invoices/${invoice.id}`);
      setMessage("Đã xóa hóa đơn.");
      await fetchData();
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Không thể xóa hóa đơn.",
      );
    }
  };

  const getDetailName = (detail) => {
    return detail.custom_description || detail.service_name || "Dịch vụ";
  };

  // print invoice (mo cua so in phieu thu)
  const printInvoice = (invoice) => {
    const total = Number(invoice.total_amount || 0);

    const detailsHtml = (invoice.details || [])
      .map(
        (detail) => `
          <tr>
            <td>${getDetailName(detail)}</td>
            <td style="text-align:center">${detail.quantity}</td>
            <td style="text-align:right">${formatMoney(detail.unit_price)}</td>
            <td style="text-align:right">${formatMoney(detail.discount_amount)}</td>
            <td style="text-align:right">${formatMoney(detail.subtotal)}</td>
          </tr>
        `,
      )
      .join("");

    const printWindow = window.open("", "_blank", "width=430,height=720");

    printWindow.document.write(`
      <html>
        <head>
          <title>In hóa đơn</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 18px;
              color: #111827;
            }

            .receipt {
              width: 340px;
              margin: 0 auto;
            }

            .center {
              text-align: center;
            }

            h2 {
              margin: 0;
              font-size: 20px;
            }

            .muted {
              color: #6b7280;
              font-size: 12px;
            }

            .line {
              border-top: 1px dashed #999;
              margin: 12px 0;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
            }

            th, td {
              padding: 6px 0;
              border-bottom: 1px dashed #ddd;
              vertical-align: top;
            }

            th {
              text-align: left;
            }

            .money-row {
              display: flex;
              justify-content: space-between;
              margin-top: 8px;
              font-size: 14px;
            }

            .total {
              font-size: 16px;
              font-weight: bold;
            }

            .thanks {
              margin-top: 18px;
              text-align: center;
              font-size: 13px;
            }

            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="center">
              <h2>NHA KHOA V</h2>
              <div class="muted">Chăm sóc nha khoa rõ ràng, hiện đại và thân thiện</div>
              <div class="muted">Hotline: 1900 6899</div>
              <div class="muted">Địa chỉ: Thành phố Cần Thơ</div>
            </div>

            <div class="line"></div>

            <div><strong>Mã hóa đơn:</strong> ${invoice.invoice_code || `HD${invoice.id}`}</div>
            <div><strong>Khách hàng:</strong> ${invoice.patient_name || ""}</div>
            <div><strong>SĐT:</strong> ${invoice.patient_phone || "Chưa cập nhật"}</div>
            <div><strong>Ngày lập:</strong> ${new Date(invoice.created_at).toLocaleString("vi-VN")}</div>
            <div><strong>Phương thức:</strong> ${invoice.payment_method || "Chưa cập nhật"}</div>

            <div class="line"></div>

            <table>
              <thead>
                <tr>
                  <th>Dịch vụ</th>
                  <th>SL</th>
                  <th style="text-align:right">Giá</th>
                  <th style="text-align:right">Giảm</th>
                  <th style="text-align:right">Tiền</th>
                </tr>
              </thead>
              <tbody>
                ${detailsHtml}
              </tbody>
            </table>

            <div class="line"></div>

            <div class="money-row total">
              <span>Tổng thanh toán</span>
              <span>${formatMoney(total)}</span>
            </div>
            <div class="money-row">
              <span>Trạng thái</span>
              <span>Đã thanh toán</span>
            </div>

            <div class="line"></div>

            <div class="thanks">
              Cảm ơn quý khách đã sử dụng dịch vụ.<br />
              Hẹn gặp lại quý khách!
            </div>
          </div>

          <script>
            window.print();
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h2>Quản lý hóa đơn</h2>
          <p>
            Mỗi hóa đơn là một phiếu thu cho số tiền khách thanh toán trong lần đó.
            Nếu khách quay lại trả tiếp, lễ tân lập hóa đơn mới.
          </p>
        </div>

        <button
          type="button"
          className="admin-primary-button"
          onClick={() => setShowForm(true)}
        >
          Lập hóa đơn
        </button>
      </div>

      {message && <p className="admin-success-message">{message}</p>}
      {errorMessage && <p className="admin-error-message">{errorMessage}</p>}

      {loading ? (
        <p>Đang tải danh sách hóa đơn...</p>
      ) : invoices.length === 0 ? (
        <p>Chưa có hóa đơn nào.</p>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã hóa đơn</th>
                <th>Khách hàng</th>
                <th>Nội dung thu</th>
                <th>Số tiền</th>
                <th>Phương thức</th>
                <th>Ngày lập</th>
                <th>Xử lý</th>
              </tr>
            </thead>

            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td>
                    <strong>{invoice.invoice_code || `HD${invoice.id}`}</strong>
                    <span>#{invoice.id}</span>
                  </td>

                  <td>
                    <strong>{invoice.patient_name}</strong>
                    <span>{invoice.patient_phone || "Chưa cập nhật SĐT"}</span>
                  </td>

                  <td>
                    {invoice.details?.length > 0 ? (
                      invoice.details.map((detail) => (
                        <span key={detail.id}>
                          {getDetailName(detail)}: {detail.quantity} x{" "}
                          {formatMoney(detail.unit_price)}
                        </span>
                      ))
                    ) : (
                      <span>Chưa có chi tiết</span>
                    )}
                  </td>

                  <td>
                    <strong>{formatMoney(invoice.total_amount)}</strong>
                  </td>

                  <td>
                    <span>{invoice.payment_method || "Chưa cập nhật"}</span>
                    <span className="appointment-status confirmed">Đã thanh toán</span>
                  </td>

                  <td>
                    <span>{new Date(invoice.created_at).toLocaleDateString("vi-VN")}</span>
                  </td>

                  <td>
                    <div className="admin-action-group">
                      <button
                        type="button"
                        className="admin-action-button"
                        onClick={() => printInvoice(invoice)}
                      >
                        In hóa đơn
                      </button>
                      <button
                        type="button"
                        className="admin-danger-button"
                        onClick={() => deleteInvoice(invoice)}
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="admin-modal-overlay">
          <div className="admin-modal admin-modal-wide">
            <div className="admin-modal-header">
              <div>
                <h3>Lập hóa đơn</h3>
                <p>
                  Nhập nội dung điều trị và số tiền thực tế khách thanh toán trong lần này.
                </p>
              </div>

              <button type="button" onClick={resetForm}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label className="smart-customer-field">
                Khách hàng
                <input
                  required
                  value={customerSearch}
                  onChange={(event) => {
                    setCustomerSearch(event.target.value);
                    setShowCustomerResults(true);
                    setInvoiceForm({
                      ...invoiceForm,
                      patient_id: "",
                    });
                  }}
                  onFocus={() => setShowCustomerResults(true)}
                  placeholder="Nhập tên hoặc số điện thoại khách hàng..."
                />

                {showCustomerResults && (
                  <div className="smart-customer-results">
                    {filteredCustomers.length === 0 ? (
                      <div className="smart-customer-empty">
                        Không tìm thấy khách phù hợp
                      </div>
                    ) : (
                      filteredCustomers.map((customer) => (
                        <button
                          type="button"
                          key={customer.id}
                          onClick={() => chooseCustomer(customer)}
                        >
                          <strong>{customer.full_name}</strong>
                          <span>{customer.phone || "Chưa cập nhật SĐT"}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}

                {selectedCustomer && (
                  <small className="smart-customer-selected">
                    Đã chọn hồ sơ #{selectedCustomer.id}
                  </small>
                )}
              </label>

              <label>
                Phương thức thanh toán
                <select
                  name="payment_method"
                  value={invoiceForm.payment_method}
                  onChange={handleInvoiceChange}
                >
                  <option value="Tiền mặt">Tiền mặt</option>
                  <option value="Chuyển khoản">Chuyển khoản</option>
                </select>
              </label>

              <div className="invoice-detail-box">
                <div className="invoice-detail-header">
                  <strong>Chi tiết hóa đơn</strong>
                  <button type="button" onClick={addDetailRow}>
                    + Thêm dòng
                  </button>
                </div>

                {details.map((detail, index) => (
                  <div className="invoice-detail-row flexible" key={index}>
                    <select
                      name="service_id"
                      value={detail.service_id}
                      onChange={(event) => handleDetailChange(index, event)}
                    >
                      <option value="">Nhóm dịch vụ</option>
                      {services.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.service_name}
                        </option>
                      ))}
                    </select>

                    <input
                      required
                      name="custom_description"
                      value={detail.custom_description}
                      onChange={(event) => handleDetailChange(index, event)}
                      placeholder="Ví dụ: Chữa tủy răng 36 lần 1"
                    />

                    <input
                      required
                      type="number"
                      min="1"
                      name="quantity"
                      value={detail.quantity}
                      onChange={(event) => handleDetailChange(index, event)}
                      placeholder="SL"
                    />

                    <input
                      required
                      type="number"
                      min="1"
                      name="unit_price"
                      value={detail.unit_price}
                      onChange={(event) => handleDetailChange(index, event)}
                      placeholder="Số tiền"
                    />

                    <input
                      type="number"
                      min="0"
                      name="discount_amount"
                      value={detail.discount_amount}
                      onChange={(event) => handleDetailChange(index, event)}
                      placeholder="Giảm"
                    />

                    <strong>{formatMoney(calculateDetailSubtotal(detail))}</strong>

                    <button
                      type="button"
                      onClick={() => removeDetailRow(index)}
                      disabled={details.length === 1}
                    >
                      Xóa
                    </button>
                  </div>
                ))}

                <div className="invoice-total">
                  <div>
                    Tổng thanh toán: <strong>{formatMoney(totalAmount)}</strong>
                  </div>
                </div>
              </div>

              <div className="admin-modal-actions">
                <button type="button" onClick={resetForm}>
                  Đóng
                </button>

                <button type="submit" disabled={saving}>
                  {saving ? "Đang lưu..." : "Lưu hóa đơn"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminInvoices;

import { useEffect, useMemo, useState } from "react";
import axiosClient from "../../api/axiosClient";

const todayText = () => new Date().toISOString().slice(0, 10);

const initialPaymentForm = {
  amount: "",
  payment_method: "Tiền mặt",
  payment_date: todayText(),
  appointment_id: "",
  note: "",
};

const initialPaymentProfileForm = {
  patient_id: "",
  appointment_id: "",
  discount_amount: "",
  discount_reason: "",
  first_payment_amount: "",
  first_payment_method: "Tiền mặt",
  first_payment_date: todayText(),
  note: "",
};

const createEmptyDetail = () => ({
  service_id: "",
  treatment_group: "",
  custom_description: "",
  quantity: 1,
  unit_price: "",
});

const statusLabels = {
  Unpaid: "Chưa thanh toán",
  PartiallyPaid: "Còn công nợ",
  Paid: "Đã thanh toán",
  Cancelled: "Đã hủy",
};

const statusClasses = {
  Unpaid: "cancelled",
  PartiallyPaid: "pending",
  Paid: "confirmed",
  Cancelled: "cancelled",
};

const digitsOnly = (value) => String(value ?? "").replace(/\D/g, "");

const parseMoneyInput = (value) => {
  const digits = digitsOnly(value);
  return digits ? Number(digits) : 0;
};

const formatMoneyInput = (value) => {
  const digits = digitsOnly(value);
  return digits ? Number(digits).toLocaleString("vi-VN") : "";
};

const formatDisplayDate = (value, fallbackValue = "") => {
  const parseParts = (source) => {
    const text = String(source || "").trim();
    const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
    const displayMatch = text.match(/^(\d{2})\/(\d{2})\/(\d{4})/);

    if (isoMatch) {
      return { year: Number(isoMatch[1]), month: isoMatch[2], day: isoMatch[3] };
    }
    if (displayMatch) {
      return { year: Number(displayMatch[3]), month: displayMatch[2], day: displayMatch[1] };
    }
    return null;
  };

  const primary = parseParts(value);
  const fallback = parseParts(fallbackValue);
  const parts =
    primary && primary.year >= 2000 && primary.year <= 2100
      ? primary
      : fallback && fallback.year >= 2000 && fallback.year <= 2100
        ? fallback
        : primary;

  if (!parts) return "Chưa cập nhật";
  return `${parts.day}/${parts.month}/${String(parts.year).padStart(4, "0")}`;
};

const sanitizeFileName = (value) =>
  String(value || "khach-hang")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "khach-hang";

const hasDebt = (record) =>
  Number(record?.remaining_amount || 0) > 0 &&
  ["Unpaid", "PartiallyPaid"].includes(record?.payment_status);

const getExportErrorMessage = async (error, fallback) => {
  const data = error.response?.data;
  if (typeof Blob !== "undefined" && data instanceof Blob) {
    const text = await data.text();
    try {
      return JSON.parse(text).message || fallback;
    } catch {
      return text || fallback;
    }
  }

  return error.response?.data?.message || fallback;
};

function AdminInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [formData, setFormData] = useState(initialPaymentProfileForm);
  const [details, setDetails] = useState([createEmptyDetail()]);
  const [paymentForm, setPaymentForm] = useState(initialPaymentForm);
  const [filters, setFilters] = useState({ search: "", status: "" });
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerResults, setShowCustomerResults] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentInvoice, setPaymentInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exportingId, setExportingId] = useState(null);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const fetchData = async () => {
    try {
      const [invoiceResponse, customerResponse, serviceResponse, appointmentResponse] =
        await Promise.all([
          axiosClient.get("/invoices"),
          axiosClient.get("/patients"),
          axiosClient.get("/services/admin"),
          axiosClient.get("/appointments"),
        ]);

      setInvoices(invoiceResponse.data.data || []);
      setCustomers(customerResponse.data.data || []);
      setServices(serviceResponse.data.data || []);
      setAppointments(appointmentResponse.data.data || []);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Không thể tải dữ liệu thanh toán.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatMoney = (value) =>
    `${Number(value || 0).toLocaleString("vi-VN")} VNĐ`;

  const getDetailName = (detail) =>
    detail.custom_description ||
    detail.treatment_group ||
    detail.service_name ||
    "Nội dung điều trị";

  const calculateDetailSubtotal = (detail) => {
    const quantity = parseMoneyInput(detail.quantity || 0);
    const unitPrice = parseMoneyInput(detail.unit_price || 0);
    return Math.max(quantity * unitPrice, 0);
  };

  const subtotal = details.reduce(
    (total, detail) => total + calculateDetailSubtotal(detail),
    0,
  );
  const discountAmount = parseMoneyInput(formData.discount_amount);
  const totalAmount = Math.max(subtotal - discountAmount, 0);
  const firstPaymentAmount = parseMoneyInput(formData.first_payment_amount);
  const firstRemainingAmount = Math.max(totalAmount - firstPaymentAmount, 0);
  const normalizedInvoiceSearch = filters.search.trim().toLowerCase();

  const paymentStats = useMemo(() => {
    const stats = {
      total: invoices.length,
      unpaid: 0,
      partial: 0,
      paid: 0,
      cancelled: 0,
      revenue: 0,
      remaining: 0,
    };

    invoices.forEach((invoice) => {
      if (invoice.payment_status === "Unpaid") stats.unpaid += 1;
      if (invoice.payment_status === "PartiallyPaid") stats.partial += 1;
      if (invoice.payment_status === "Paid") stats.paid += 1;
      if (invoice.payment_status === "Cancelled") stats.cancelled += 1;

      if (invoice.payment_status !== "Cancelled") {
        stats.revenue += Number(invoice.paid_amount || 0);
        stats.remaining += Number(invoice.remaining_amount || 0);
      }
    });

    return stats;
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesStatus = !filters.status || invoice.payment_status === filters.status;
      const searchableText = [
        invoice.invoice_code,
        invoice.patient_name,
        invoice.patient_phone,
        invoice.created_by_username,
        ...(invoice.details || []).map(getDetailName),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!normalizedInvoiceSearch || searchableText.includes(normalizedInvoiceSearch));
    });
  }, [filters.status, invoices, normalizedInvoiceSearch]);

  const selectedCustomer = customers.find(
    (customer) => Number(customer.id) === Number(formData.patient_id),
  );
  const customerAppointments = appointments.filter(
    (appointment) =>
      Number(appointment.patient_id) ===
      Number(formData.patient_id || paymentInvoice?.patient_id),
  );
  const normalizedCustomerSearch = customerSearch.trim().toLowerCase();
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

  const paymentPreview = useMemo(() => {
    if (!paymentInvoice) return null;
    const amount = parseMoneyInput(paymentForm.amount);
    return {
      paidAfter: Number(paymentInvoice.paid_amount || 0) + amount,
      remainingAfter: Math.max(
        Number(paymentInvoice.remaining_amount || 0) - amount,
        0,
      ),
    };
  }, [paymentForm.amount, paymentInvoice]);
  const paymentAmount = parseMoneyInput(paymentForm.amount);
  const paymentAmountError = paymentInvoice
    ? paymentAmount <= 0
      ? "Số tiền thanh toán phải lớn hơn 0."
      : paymentAmount > Number(paymentInvoice.remaining_amount || 0)
        ? "Số tiền thanh toán không được vượt quá số tiền còn lại."
        : ""
    : "";

  const resetForm = () => {
    setFormData(initialPaymentProfileForm);
    setDetails([createEmptyDetail()]);
    setCustomerSearch("");
    setShowCustomerResults(false);
    setShowForm(false);
  };

  const resetPaymentForm = () => {
    setPaymentForm(initialPaymentForm);
    setPaymentInvoice(null);
  };

  const chooseCustomer = (customer) => {
    setFormData((current) => ({
      ...current,
      patient_id: String(customer.id),
      appointment_id: "",
    }));
    setCustomerSearch(`${customer.full_name} - ${customer.phone || "Chưa có SĐT"}`);
    setShowCustomerResults(false);
  };

  const handleDetailChange = (index, event) => {
    const { name, value } = event.target;
    const normalizedValue =
      name === "unit_price"
        ? formatMoneyInput(value)
        : name === "quantity"
          ? digitsOnly(value)
          : value;

    setDetails((currentDetails) =>
      currentDetails.map((detail, detailIndex) =>
        detailIndex === index
          ? {
              ...detail,
              [name]: normalizedValue,
              ...(name === "service_id"
                ? {
                    treatment_group:
                      services.find((service) => String(service.id) === normalizedValue)
                        ?.service_name || "",
                  }
                : {}),
            }
          : detail,
      ),
    );
  };

  const addDetailRow = () => setDetails((current) => [...current, createEmptyDetail()]);

  const removeDetailRow = (index) => {
    if (details.length === 1) return;
    setDetails((current) => current.filter((_, detailIndex) => detailIndex !== index));
  };

  const validateProfile = () => {
    if (!formData.patient_id) return "Vui lòng chọn khách hàng từ danh sách gợi ý.";
    if (subtotal <= 0) return "Tạm tính phải lớn hơn 0.";
    if (discountAmount < 0) return "Giảm giá không được âm.";
    if (discountAmount > subtotal) return "Giảm giá không được lớn hơn tạm tính.";
    if (firstPaymentAmount < 0) return "Thanh toán lần đầu không được âm.";
    if (firstPaymentAmount > totalAmount) {
      return "Thanh toán lần đầu không được lớn hơn thành tiền.";
    }
    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setErrorMessage("");

    const validation = validateProfile();
    if (validation) {
      setSaving(false);
      setErrorMessage(validation);
      return;
    }

    try {
      await axiosClient.post("/invoices", {
        patient_id: Number(formData.patient_id),
        appointment_id: formData.appointment_id
          ? Number(formData.appointment_id)
          : null,
        discount_amount: discountAmount,
        discount_reason: formData.discount_reason,
        first_payment_amount: firstPaymentAmount,
        first_payment_method: formData.first_payment_method,
        first_payment_date: formData.first_payment_date,
        note: formData.note,
        details: details.map((detail) => ({
          service_id: detail.service_id ? Number(detail.service_id) : null,
          treatment_group: detail.treatment_group,
          custom_description: detail.custom_description,
          quantity: Number(digitsOnly(detail.quantity) || 1),
          unit_price: parseMoneyInput(detail.unit_price),
        })),
      });

      setMessage("Đã tạo hồ sơ thanh toán.");
      resetForm();
      await fetchData();
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Không thể tạo hồ sơ thanh toán.",
      );
    } finally {
      setSaving(false);
    }
  };

  const openPaymentModal = (invoice) => {
    setPaymentInvoice(invoice);
    setPaymentForm({
      ...initialPaymentForm,
      payment_date: todayText(),
      amount: formatMoneyInput(invoice.remaining_amount),
    });
  };

  const submitPayment = async (event) => {
    event.preventDefault();
    if (!paymentInvoice) return;

    if (paymentAmountError) {
      setErrorMessage(paymentAmountError);
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setErrorMessage("");

      const response = await axiosClient.post(
        `/invoices/${paymentInvoice.id}/payments`,
        {
          amount: paymentAmount,
          payment_method: paymentForm.payment_method,
          payment_date: paymentForm.payment_date,
          appointment_id: paymentForm.appointment_id
            ? Number(paymentForm.appointment_id)
            : null,
          note: paymentForm.note,
        },
      );

      setMessage("Đã ghi nhận thanh toán.");
      setSelectedInvoice(response.data.data);
      resetPaymentForm();
      await fetchData();
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Không thể ghi nhận thanh toán.",
      );
    } finally {
      setSaving(false);
    }
  };

  const cancelInvoice = async (invoice) => {
    const accepted = window.confirm(
      "Bạn chắc chắn muốn hủy hồ sơ thanh toán này?",
    );
    if (!accepted) return;

    try {
      setMessage("");
      setErrorMessage("");
      await axiosClient.patch(`/invoices/${invoice.id}/cancel`);
      setMessage("Đã hủy hồ sơ thanh toán.");
      setSelectedInvoice(null);
      await fetchData();
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Không thể hủy hồ sơ thanh toán.",
      );
    }
  };

  const exportInvoice = async (invoice) => {
    if (!hasDebt(invoice)) {
      setErrorMessage("Hồ sơ này đã được thanh toán đầy đủ, không có công nợ để xuất.");
      return;
    }

    try {
      setExportingId(invoice.id);
      setErrorMessage("");
      const response = await axiosClient.get(`/invoices/${invoice.id}/export`, {
        responseType: "blob",
      });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `cong-no-${sanitizeFileName(invoice.patient_name)}-${invoice.invoice_code || invoice.id}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      setErrorMessage(await getExportErrorMessage(error, "Không thể xuất bảng công nợ."));
    } finally {
      setExportingId(null);
    }
  };

  const printPaymentReceipt = (invoice, payment) => {
    const details = (invoice.details || []).map(getDetailName).join("; ");
    const printWindow = window.open("", "_blank", "width=520,height=760");

    printWindow.document.write(`
      <html>
        <head>
          <title>Phiếu thanh toán</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 22px; color: #111827; }
            .receipt { max-width: 460px; margin: 0 auto; }
            .center { text-align: center; }
            h2 { margin: 0; font-size: 21px; }
            h3 { margin: 10px 0 0; font-size: 16px; }
            .muted { color: #6b7280; font-size: 12px; }
            .line { border-top: 1px dashed #9ca3af; margin: 14px 0; }
            .row { display: flex; justify-content: space-between; gap: 14px; margin: 8px 0; font-size: 13px; }
            .row strong:last-child, .row span:last-child { text-align: right; }
            .total { font-size: 16px; font-weight: bold; }
            .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-top: 36px; text-align: center; font-size: 13px; }
            .note { margin-top: 20px; color: #6b7280; font-size: 12px; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="center">
              <h2>NHA KHOA V</h2>
              <div class="muted">Hotline: 1900 6899 - Thành phố Cần Thơ</div>
              <h3>PHIẾU XÁC NHẬN THANH TOÁN</h3>
            </div>
            <div class="line"></div>
            <div class="row"><strong>Mã hồ sơ</strong><span>${invoice.invoice_code || `TT${invoice.id}`}</span></div>
            <div class="row"><strong>Mã lần thanh toán</strong><span>#${payment.id}</span></div>
            <div class="row"><strong>Khách hàng</strong><span>${invoice.patient_name || ""}</span></div>
            <div class="row"><strong>SĐT</strong><span>${invoice.patient_phone || "Chưa cập nhật"}</span></div>
            <div class="row"><strong>Nội dung điều trị</strong><span>${details || "Chưa cập nhật"}</span></div>
            <div class="line"></div>
            <div class="row"><span>Tạm tính</span><strong>${formatMoney(invoice.subtotal)}</strong></div>
            <div class="row"><span>Giảm giá</span><strong>${formatMoney(invoice.discount_amount)}</strong></div>
            <div class="row"><span>Thành tiền</span><strong>${formatMoney(invoice.total_amount)}</strong></div>
            <div class="row total"><span>Thanh toán lần này</span><strong>${formatMoney(payment.amount)}</strong></div>
            <div class="row"><span>Tổng đã thanh toán</span><strong>${formatMoney(payment.cumulative_paid)}</strong></div>
            <div class="row"><span>Còn lại</span><strong>${formatMoney(payment.remaining_after)}</strong></div>
            <div class="row"><span>Phương thức</span><strong>${payment.payment_method}</strong></div>
            <div class="row"><span>Ngày thanh toán</span><strong>${formatDisplayDate(payment.payment_date || payment.payment_date_display, payment.created_at)}</strong></div>
            <div class="row"><span>Người ghi nhận</span><strong>${payment.created_by_username || ""}</strong></div>
            <div class="row"><span>Ghi chú</span><strong>${payment.note || ""}</strong></div>
            <div class="signatures"><div>Khách hàng<br/><br/><br/>________________</div><div>Người ghi nhận<br/><br/><br/>________________</div></div>
            <p class="note">Phiếu xác nhận thanh toán nội bộ, không thay thế hóa đơn điện tử hoặc chứng từ thuế.</p>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const renderPaymentStatus = (invoice) => (
    <span className={`appointment-status ${statusClasses[invoice.payment_status] || "pending"}`}>
      {statusLabels[invoice.payment_status] || invoice.payment_status}
    </span>
  );

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h2>Quản lý thanh toán</h2>
          <p>
            Theo dõi tổng chi phí điều trị, các lần khách hàng thanh toán và số
            tiền còn lại.
          </p>
        </div>

        <button
          type="button"
          className="admin-primary-button"
          onClick={() => setShowForm(true)}
        >
          Tạo hồ sơ thanh toán
        </button>
      </div>

      {message && <p className="admin-success-message">{message}</p>}
      {errorMessage && <p className="admin-error-message">{errorMessage}</p>}

      <div className="payment-summary-grid">
        <article className="payment-summary-card accent">
          <span>Tổng hồ sơ</span>
          <strong>{paymentStats.total}</strong>
          <small>{paymentStats.unpaid + paymentStats.partial} hồ sơ còn cần thu</small>
        </article>
        <article className="payment-summary-card">
          <span>Đã thu</span>
          <strong>{formatMoney(paymentStats.revenue)}</strong>
          <small>{paymentStats.paid} hồ sơ đã tất toán</small>
        </article>
        <article className="payment-summary-card warning">
          <span>Còn công nợ</span>
          <strong>{formatMoney(paymentStats.remaining)}</strong>
          <small>{paymentStats.partial} thanh toán một phần</small>
        </article>
        <article className="payment-summary-card muted">
          <span>Chưa thanh toán</span>
          <strong>{paymentStats.unpaid}</strong>
          <small>{paymentStats.cancelled} hồ sơ đã hủy</small>
        </article>
      </div>

      <div className="payment-filter-panel">
        <input
          className="admin-search-input payment-search-input"
          value={filters.search}
          onChange={(event) =>
            setFilters((current) => ({ ...current, search: event.target.value }))
          }
          placeholder="Tìm theo mã hồ sơ, tên khách, SĐT hoặc nội dung điều trị..."
        />
        <select
          value={filters.status}
          onChange={(event) =>
            setFilters((current) => ({ ...current, status: event.target.value }))
          }
        >
          <option value="">Tất cả trạng thái</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        {(filters.search || filters.status) && (
          <button
            type="button"
            className="admin-secondary-button payment-reset-filter"
            onClick={() => setFilters({ search: "", status: "" })}
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {loading ? (
        <p>Đang tải danh sách thanh toán...</p>
      ) : invoices.length === 0 ? (
        <p>Chưa có hồ sơ thanh toán nào.</p>
      ) : filteredInvoices.length === 0 ? (
        <p className="payment-empty-state">
          Không tìm thấy hồ sơ thanh toán phù hợp với bộ lọc hiện tại.
        </p>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã hồ sơ</th>
                <th>Khách hàng</th>
                <th>Nội dung điều trị</th>
                <th>Thành tiền</th>
                <th>Đã thanh toán</th>
                <th>Còn lại</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td>
                    <strong>{invoice.invoice_code || `TT${invoice.id}`}</strong>
                    <span>#{invoice.id}</span>
                  </td>
                  <td>
                    <strong>{invoice.patient_name}</strong>
                    <span>{invoice.patient_phone || "Chưa cập nhật SĐT"}</span>
                  </td>
                  <td className="payment-treatment-cell">
                    {(invoice.details || []).slice(0, 2).map((detail) => (
                      <span key={detail.id} title={`${getDetailName(detail)}: ${detail.quantity} x ${formatMoney(detail.unit_price)}`}>
                        {getDetailName(detail)}: {detail.quantity} x{" "}
                        {formatMoney(detail.unit_price)}
                      </span>
                    ))}
                  </td>
                  <td className="payment-money-cell"><strong>{formatMoney(invoice.total_amount)}</strong></td>
                  <td className="payment-money-cell">{formatMoney(invoice.paid_amount)}</td>
                  <td className="payment-money-cell">{formatMoney(invoice.remaining_amount)}</td>
                  <td>{renderPaymentStatus(invoice)}</td>
                  <td>{new Date(invoice.created_at).toLocaleDateString("vi-VN")}</td>
                  <td>
                    <div className="admin-action-group payment-action-row">
                      <button
                        type="button"
                        className="admin-action-button"
                        onClick={() => setSelectedInvoice(invoice)}
                      >
                        Xem chi tiết
                      </button>
                      {hasDebt(invoice) && (
                        <button
                          type="button"
                          className="admin-action-button"
                          onClick={() => openPaymentModal(invoice)}
                        >
                          Ghi nhận thanh toán
                        </button>
                      )}
                      {hasDebt(invoice) && (
                        <button
                          type="button"
                          className="admin-action-button"
                          onClick={() => exportInvoice(invoice)}
                          disabled={exportingId === invoice.id}
                        >
                          {exportingId === invoice.id ? "Đang xuất..." : "Xuất bảng công nợ"}
                        </button>
                      )}
                      {invoice.payment_status !== "Cancelled" && (
                        <button
                          type="button"
                          className="admin-danger-button"
                          onClick={() => cancelInvoice(invoice)}
                        >
                          Hủy hồ sơ
                        </button>
                      )}
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
                <h3>Tạo hồ sơ thanh toán</h3>
                <p>Nhập nội dung điều trị, giảm giá và khoản thanh toán lần đầu nếu có.</p>
              </div>
              <button type="button" onClick={resetForm}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="payment-section-heading">
                <span>A</span>
                <div>
                  <strong>Thông tin khách hàng</strong>
                  <small>Chọn đúng hồ sơ khách và lịch hẹn liên quan nếu có.</small>
                </div>
              </div>

              <label className="smart-customer-field">
                Khách hàng
                <input
                  required
                  value={customerSearch}
                  onChange={(event) => {
                    setCustomerSearch(event.target.value);
                    setShowCustomerResults(true);
                    setFormData((current) => ({ ...current, patient_id: "", appointment_id: "" }));
                  }}
                  onFocus={() => setShowCustomerResults(true)}
                  placeholder="Nhập tên hoặc số điện thoại khách hàng..."
                />
                {showCustomerResults && (
                  <div className="smart-customer-results">
                    {filteredCustomers.length === 0 ? (
                      <div className="smart-customer-empty">Không tìm thấy khách phù hợp</div>
                    ) : (
                      filteredCustomers.map((customer) => (
                        <button type="button" key={customer.id} onClick={() => chooseCustomer(customer)}>
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
                Lịch hẹn liên quan
                <select
                  value={formData.appointment_id}
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, appointment_id: event.target.value }))
                  }
                >
                  <option value="">Không gắn lịch hẹn</option>
                  {customerAppointments.map((appointment) => (
                    <option key={appointment.id} value={appointment.id}>
                      #{appointment.id} - {appointment.service_name} -{" "}
                      {appointment.appointment_date}
                    </option>
                  ))}
                </select>
              </label>

              <div className="payment-section-heading">
                <span>B</span>
                <div>
                  <strong>Nội dung điều trị</strong>
                  <small>Có thể thêm nhiều dòng chi phí cho cùng một hồ sơ.</small>
                </div>
              </div>

              <div className="invoice-detail-box payment-detail-editor">
                <div className="invoice-detail-header">
                  <strong>Nội dung điều trị</strong>
                  <button type="button" onClick={addDetailRow}>+ Thêm dòng</button>
                </div>

                {details.map((detail, index) => (
                  <div className="invoice-detail-row flexible" key={index}>
                    <select name="service_id" value={detail.service_id} onChange={(event) => handleDetailChange(index, event)}>
                      <option value="">Nhóm dịch vụ</option>
                      {services.map((service) => (
                        <option key={service.id} value={service.id}>{service.service_name}</option>
                      ))}
                    </select>
                    <input
                      required
                      name="custom_description"
                      value={detail.custom_description}
                      onChange={(event) => handleDetailChange(index, event)}
                      placeholder="Nội dung chi tiết"
                    />
                    <input required type="text" inputMode="numeric" name="quantity" value={detail.quantity} onChange={(event) => handleDetailChange(index, event)} placeholder="SL" />
                    <div className="money-input-wrap">
                      <input required type="text" inputMode="numeric" name="unit_price" value={detail.unit_price} onChange={(event) => handleDetailChange(index, event)} placeholder="Đơn giá" />
                      <span>VNĐ</span>
                    </div>
                    <strong>{formatMoney(calculateDetailSubtotal(detail))}</strong>
                    <button type="button" onClick={() => removeDetailRow(index)} disabled={details.length === 1}>Xóa</button>
                  </div>
                ))}
              </div>

              <div className="payment-section-heading">
                <span>C</span>
                <div>
                  <strong>Giảm giá</strong>
                  <small>Ghi rõ lý do để tiện đối soát về sau.</small>
                </div>
              </div>

              <div className="admin-form-row">
                <label>
                  Giảm giá (VNĐ)
                  <div className="money-input-wrap">
                    <input
                    type="text"
                    inputMode="numeric"
                    value={formData.discount_amount}
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, discount_amount: formatMoneyInput(event.target.value) }))
                    }
                    placeholder="0"
                  />
                    <span>VNĐ</span>
                  </div>
                </label>
                <label>
                  Lý do giảm giá
                  <input
                    value={formData.discount_reason}
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, discount_reason: event.target.value }))
                    }
                    placeholder="Ví dụ: ưu đãi khách hàng thân thiết"
                  />
                </label>
              </div>

              <div className="payment-section-heading">
                <span>D</span>
                <div>
                  <strong>Thanh toán lần đầu</strong>
                  <small>Có thể để 0 nếu khách chưa thanh toán.</small>
                </div>
              </div>

              <div className="admin-form-row">
                <label>
                  Số tiền thanh toán lần đầu
                  <div className="money-input-wrap">
                    <input
                    type="text"
                    inputMode="numeric"
                    value={formData.first_payment_amount}
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, first_payment_amount: formatMoneyInput(event.target.value) }))
                    }
                    placeholder="0"
                  />
                    <span>VNĐ</span>
                  </div>
                </label>
                <label>
                  Phương thức thanh toán lần đầu
                  <select
                    value={formData.first_payment_method}
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, first_payment_method: event.target.value }))
                    }
                    disabled={firstPaymentAmount <= 0}
                  >
                    <option value="Tiền mặt">Tiền mặt</option>
                    <option value="Chuyển khoản">Chuyển khoản</option>
                  </select>
                </label>
                <label>
                  Ngày thanh toán lần đầu
                  <input
                    type="date"
                    value={formData.first_payment_date}
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, first_payment_date: event.target.value }))
                    }
                    disabled={firstPaymentAmount <= 0}
                  />
                </label>
              </div>

              <div className="payment-section-heading">
                <span>E</span>
                <div>
                  <strong>Ghi chú và tổng kết</strong>
                  <small>Kiểm tra lại số tiền trước khi lưu hồ sơ.</small>
                </div>
              </div>

              <label>
                Ghi chú
                <textarea
                  rows={3}
                  value={formData.note}
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, note: event.target.value }))
                  }
                  placeholder="Ghi chú nội bộ cho hồ sơ thanh toán..."
                />
              </label>

              <div className="invoice-total payment-summary-box">
                <div>Tạm tính: <strong>{formatMoney(subtotal)}</strong></div>
                <div>Giảm giá: <strong>{formatMoney(discountAmount)}</strong></div>
                <div>Thành tiền: <strong>{formatMoney(totalAmount)}</strong></div>
                <div>Thanh toán lần đầu: <strong>{formatMoney(firstPaymentAmount)}</strong></div>
                <div>Còn lại: <strong>{formatMoney(firstRemainingAmount)}</strong></div>
              </div>

              <div className="admin-modal-actions">
                <button type="button" onClick={resetForm}>Đóng</button>
                <button type="submit" disabled={saving}>
                  {saving ? "Đang lưu..." : "Lưu hồ sơ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedInvoice && (
        <div className="admin-modal-overlay">
          <div className="admin-modal admin-modal-wide payment-detail-modal">
            <div className="admin-modal-header">
              <div>
                <h3>Chi tiết hồ sơ thanh toán</h3>
                <p>{selectedInvoice.invoice_code || `TT${selectedInvoice.id}`} - {selectedInvoice.patient_name}</p>
              </div>
              <button type="button" onClick={() => setSelectedInvoice(null)}>×</button>
            </div>

            <div className="payment-detail-layout">
              <div className="payment-detail-main">
                <section className="payment-detail-section">
                  <div className="payment-section-heading compact">
                    <span>A</span>
                    <div>
                      <strong>Thông tin khách hàng</strong>
                      <small>Thông tin định danh của hồ sơ thanh toán.</small>
                    </div>
                  </div>
                  <article className="medical-record-card payment-info-card payment-customer-card">
                    <div>
                      <span>Mã khách hàng</span>
                      <strong>#{selectedInvoice.patient_id}</strong>
                    </div>
                    <div>
                      <span>Họ tên</span>
                      <strong>{selectedInvoice.patient_name}</strong>
                    </div>
                    <div>
                      <span>Số điện thoại</span>
                      <strong>{selectedInvoice.patient_phone || "Chưa cập nhật"}</strong>
                    </div>
                    <div>
                      <span>Trạng thái</span>
                      {renderPaymentStatus(selectedInvoice)}
                    </div>
                  </article>
                </section>

                <section className="payment-detail-section">
                  <div className="payment-section-heading compact">
                    <span>B</span>
                    <div>
                      <strong>Nội dung điều trị</strong>
                      <small>Các dòng chi phí đã ghi nhận trong hồ sơ.</small>
                    </div>
                  </div>
                  <article className="medical-record-card payment-treatment-card">
                    {(selectedInvoice.details || []).length <= 1 ? (
                      (selectedInvoice.details || []).map((detail) => (
                        <div key={detail.id || getDetailName(detail)} className="payment-treatment-single">
                          <div className="payment-treatment-name">
                            <span>Tên dịch vụ</span>
                            <strong>{getDetailName(detail)}</strong>
                            <small>{detail.treatment_group || detail.service_name || "Nội dung điều trị"}</small>
                          </div>
                          <div className="payment-treatment-metrics">
                            <p><span>Số lượng</span><b>{detail.quantity}</b></p>
                            <p><span>Đơn giá</span><b>{formatMoney(detail.unit_price)}</b></p>
                            <p><span>Thành tiền</span><b>{formatMoney(detail.subtotal)}</b></p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="payment-treatment-table-wrap">
                        <table className="payment-treatment-table">
                          <thead>
                            <tr>
                              <th>Tên dịch vụ / nội dung</th>
                              <th>Số lượng</th>
                              <th>Đơn giá</th>
                              <th>Thành tiền</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(selectedInvoice.details || []).map((detail) => (
                              <tr key={detail.id || getDetailName(detail)}>
                                <td>
                                  <strong>{getDetailName(detail)}</strong>
                                  <span>{detail.treatment_group || detail.service_name || "Nội dung điều trị"}</span>
                                </td>
                                <td>{detail.quantity}</td>
                                <td className="payment-money-cell">{formatMoney(detail.unit_price)}</td>
                                <td className="payment-money-cell"><strong>{formatMoney(detail.subtotal)}</strong></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {(!selectedInvoice.details || selectedInvoice.details.length === 0) && (
                      <p className="ops-muted">Chưa có dòng điều trị trong hồ sơ này.</p>
                    )}
                  </article>
                </section>
              </div>

              <aside className="payment-detail-side">
                <div className="payment-section-heading compact">
                  <span>C</span>
                  <div>
                    <strong>Tổng quan thanh toán</strong>
                    <small>Đối soát tổng tiền, đã thu và công nợ còn lại.</small>
                  </div>
                </div>
                <article className="medical-record-card payment-overview-card">
                  <div className="payment-overview-row"><span>Tạm tính</span><strong>{formatMoney(selectedInvoice.subtotal)}</strong></div>
                  <div className="payment-overview-row"><span>Giảm giá</span><strong>{formatMoney(selectedInvoice.discount_amount)}</strong></div>
                  <div className="payment-overview-row is-note"><span>Lý do giảm giá</span><strong>{selectedInvoice.discount_reason || "Không có"}</strong></div>
                  <div className="payment-overview-row is-emphasis"><span>Thành tiền</span><strong>{formatMoney(selectedInvoice.total_amount)}</strong></div>
                  <div className="payment-overview-row"><span>Đã thanh toán</span><strong>{formatMoney(selectedInvoice.paid_amount)}</strong></div>
                  <div className="payment-overview-row is-danger"><span>Còn lại</span><strong>{formatMoney(selectedInvoice.remaining_amount)}</strong></div>
                </article>
              </aside>
            </div>

            <div className="invoice-detail-box payment-history-box mt-3">
              <div className="payment-section-heading compact">
                <span>D</span>
                <div>
                  <strong>Lịch sử thanh toán</strong>
                  <small>Mỗi dòng là một lần khách đã thanh toán.</small>
                </div>
              </div>
              <div className="admin-table-wrapper">
                <table className="admin-table payment-history-table">
                  <thead>
                    <tr>
                      <th>Lần</th>
                      <th>Ngày</th>
                      <th>Số tiền</th>
                      <th>Phương thức</th>
                      <th>Người ghi nhận</th>
                      <th>Đã trả lũy kế</th>
                      <th>Còn lại</th>
                      <th>Ghi chú</th>
                      <th>In phiếu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedInvoice.payments || []).map((payment) => (
                      <tr key={payment.id}>
                        <td>#{payment.payment_number}</td>
                        <td className="payment-date-cell">
                          {formatDisplayDate(
                            payment.payment_date || payment.payment_date_display,
                            payment.created_at,
                          )}
                        </td>
                        <td className="payment-money-cell">{formatMoney(payment.amount)}</td>
                        <td>{payment.payment_method}</td>
                        <td>{payment.created_by_username || "Chưa xác định"}</td>
                        <td className="payment-money-cell">{formatMoney(payment.cumulative_paid)}</td>
                        <td className="payment-money-cell">{formatMoney(payment.remaining_after)}</td>
                        <td className="payment-note-cell">{payment.note || "—"}</td>
                        <td>
                          <button type="button" className="admin-action-button" onClick={() => printPaymentReceipt(selectedInvoice, payment)}>
                            In phiếu
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(!selectedInvoice.payments || selectedInvoice.payments.length === 0) && (
                      <tr><td colSpan="9">Chưa phát sinh lần thanh toán nào.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="admin-modal-actions">
              {hasDebt(selectedInvoice) && (
                <button type="button" className="admin-primary-button" onClick={() => exportInvoice(selectedInvoice)} disabled={exportingId === selectedInvoice.id}>
                  {exportingId === selectedInvoice.id ? "Đang xuất..." : "Xuất bảng công nợ"}
                </button>
              )}
              {hasDebt(selectedInvoice) && (
                <button type="button" className="admin-secondary-button" onClick={() => openPaymentModal(selectedInvoice)}>Ghi nhận thanh toán</button>
              )}
              <button type="button" onClick={() => setSelectedInvoice(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {paymentInvoice && (
        <div className="admin-modal-overlay">
          <div className="admin-modal payment-collect-modal">
            <div className="admin-modal-header">
              <div>
                <h3>Ghi nhận thanh toán</h3>
                <p>{paymentInvoice.invoice_code || `TT${paymentInvoice.id}`}</p>
              </div>
              <button type="button" onClick={resetPaymentForm}>×</button>
            </div>

            <form onSubmit={submitPayment}>
              <div className="invoice-total payment-summary-box">
                <div>Tổng chi phí: <strong>{formatMoney(paymentInvoice.subtotal)}</strong></div>
                <div>Giảm giá: <strong>{formatMoney(paymentInvoice.discount_amount)}</strong></div>
                <div>Thành tiền: <strong>{formatMoney(paymentInvoice.total_amount)}</strong></div>
                <div>Đã thanh toán trước đó: <strong>{formatMoney(paymentInvoice.paid_amount)}</strong></div>
                <div>Còn lại sau thanh toán: <strong>{formatMoney(paymentPreview?.remainingAfter || 0)}</strong></div>
              </div>

              <label>
                Số tiền thanh toán lần này
                <div className="money-input-wrap">
                  <input
                    required
                    type="text"
                    inputMode="numeric"
                    className={paymentAmountError ? "is-invalid" : ""}
                    value={paymentForm.amount}
                    onChange={(event) => setPaymentForm((current) => ({ ...current, amount: formatMoneyInput(event.target.value) }))}
                    placeholder="Nhập số tiền"
                  />
                  <span>VNĐ</span>
                </div>
                {paymentAmountError && <small className="payment-field-error">{paymentAmountError}</small>}
              </label>
              <label>
                Phương thức
                <select value={paymentForm.payment_method} onChange={(event) => setPaymentForm((current) => ({ ...current, payment_method: event.target.value }))}>
                  <option value="Tiền mặt">Tiền mặt</option>
                  <option value="Chuyển khoản">Chuyển khoản</option>
                </select>
              </label>
              <label>
                Ngày thanh toán
                <input type="date" value={paymentForm.payment_date} onChange={(event) => setPaymentForm((current) => ({ ...current, payment_date: event.target.value }))} />
              </label>
              <label>
                Lịch hẹn liên quan
                <select value={paymentForm.appointment_id} onChange={(event) => setPaymentForm((current) => ({ ...current, appointment_id: event.target.value }))}>
                  <option value="">Không gắn lịch hẹn</option>
                  {customerAppointments.map((appointment) => (
                    <option key={appointment.id} value={appointment.id}>
                      #{appointment.id} - {appointment.service_name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Ghi chú
                <textarea rows={3} value={paymentForm.note} onChange={(event) => setPaymentForm((current) => ({ ...current, note: event.target.value }))} />
              </label>

              <div className="admin-modal-actions">
                <button type="button" onClick={resetPaymentForm}>Đóng</button>
                <button type="submit" disabled={saving || Boolean(paymentAmountError)}>
                  {saving ? "Đang lưu..." : "Lưu thanh toán"}
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

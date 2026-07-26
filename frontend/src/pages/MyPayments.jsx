import { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";

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

function MyPayments() {
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [exportingId, setExportingId] = useState(null);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await axiosClient.get("/invoices/my");
        setInvoices(response.data.data || []);
      } catch (error) {
        setMessage(
          error.response?.data?.message || "Không thể tải thanh toán của bạn.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  const formatMoney = (value) =>
    `${Number(value || 0).toLocaleString("vi-VN")} VNĐ`;

  const getDetailName = (detail) =>
    detail.custom_description ||
    detail.treatment_group ||
    detail.service_name ||
    "Nội dung điều trị";

  const exportInvoice = async (invoice) => {
    if (!hasDebt(invoice)) {
      setMessage("Hồ sơ này đã được thanh toán đầy đủ, không có công nợ để xuất.");
      return;
    }

    try {
      setExportingId(invoice.id);
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
      setMessage(await getExportErrorMessage(error, "Không thể xuất bảng công nợ."));
    } finally {
      setExportingId(null);
    }
  };

  const renderStatus = (invoice) => (
    <span className={`appointment-status ${statusClasses[invoice.payment_status] || "pending"}`}>
      {statusLabels[invoice.payment_status] || invoice.payment_status}
    </span>
  );

  return (
    <div className="medical-results-page container py-5">
      <div className="medical-results-hero mb-4">
        <h2 className="mb-1">Thanh toán của tôi</h2>
        <p className="text-secondary mb-0">
          Theo dõi chi phí điều trị, các lần đã thanh toán và số tiền còn lại.
        </p>
      </div>

      {loading && <p className="text-center">Đang tải thanh toán...</p>}
      {!loading && message && <div className="alert alert-warning rounded-4">{message}</div>}
      {!loading && !message && invoices.length === 0 && (
        <div className="alert alert-light border rounded-4 text-center">
          Hiện chưa có hồ sơ thanh toán nào.
        </div>
      )}

      {!loading && invoices.length > 0 && (
        <div className="row g-4">
          {invoices.map((invoice) => (
            <div className="col-12" key={invoice.id}>
              <article className="medical-result-card card border-0 shadow-sm rounded-4">
                <div className="medical-result-card-body card-body p-4">
                  <div className="medical-result-header d-flex justify-content-between gap-3 flex-wrap">
                    <div>
                      <p className="text-secondary small mb-1">
                        Mã hồ sơ {invoice.invoice_code || `TT${invoice.id}`}
                      </p>
                      <h4 className="mb-0">{getDetailName(invoice.details?.[0] || {})}</h4>
                    </div>
                    {renderStatus(invoice)}
                  </div>

                  <div className="medical-result-grid">
                    <div><strong>Tạm tính</strong><p>{formatMoney(invoice.subtotal)}</p></div>
                    <div><strong>Giảm giá</strong><p>{formatMoney(invoice.discount_amount)}</p></div>
                    <div><strong>Thành tiền</strong><p>{formatMoney(invoice.total_amount)}</p></div>
                    <div><strong>Đã thanh toán</strong><p>{formatMoney(invoice.paid_amount)}</p></div>
                    <div><strong>Còn lại</strong><p>{formatMoney(invoice.remaining_amount)}</p></div>
                    <div><strong>Ngày tạo</strong><p>{new Date(invoice.created_at).toLocaleDateString("vi-VN")}</p></div>
                  </div>

                  <div className="admin-action-group">
                    <button type="button" className="admin-action-button" onClick={() => setSelectedInvoice(invoice)}>
                      Xem chi tiết
                    </button>
                    {hasDebt(invoice) && (
                      <button type="button" className="admin-action-button" onClick={() => exportInvoice(invoice)} disabled={exportingId === invoice.id}>
                        {exportingId === invoice.id ? "Đang xuất..." : "Xuất bảng công nợ"}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            </div>
          ))}
        </div>
      )}

      {selectedInvoice && (
        <div className="image-preview-overlay" onClick={() => setSelectedInvoice(null)}>
          <div className="customer-payment-modal" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="image-preview-close" onClick={() => setSelectedInvoice(null)}>×</button>
            <h3>Chi tiết thanh toán</h3>
            <p>{selectedInvoice.invoice_code || `TT${selectedInvoice.id}`} - {selectedInvoice.patient_name}</p>

            <div className="medical-result-grid">
              <div><strong>Tạm tính</strong><p>{formatMoney(selectedInvoice.subtotal)}</p></div>
              <div><strong>Giảm giá</strong><p>{formatMoney(selectedInvoice.discount_amount)}</p></div>
              <div><strong>Lý do giảm giá</strong><p>{selectedInvoice.discount_reason || "Không có"}</p></div>
              <div><strong>Thành tiền</strong><p>{formatMoney(selectedInvoice.total_amount)}</p></div>
              <div><strong>Đã thanh toán</strong><p>{formatMoney(selectedInvoice.paid_amount)}</p></div>
              <div><strong>Còn lại</strong><p>{formatMoney(selectedInvoice.remaining_amount)}</p></div>
            </div>

            <h4 className="mt-4">Lịch sử thanh toán</h4>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Lần</th>
                    <th>Ngày</th>
                    <th>Số tiền</th>
                    <th>Phương thức</th>
                    <th>Còn lại</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedInvoice.payments || []).map((payment) => (
                    <tr key={payment.id}>
                      <td>#{payment.payment_number}</td>
                      <td>{payment.payment_date_display}</td>
                      <td>{formatMoney(payment.amount)}</td>
                      <td>{payment.payment_method}</td>
                      <td>{formatMoney(payment.remaining_after)}</td>
                    </tr>
                  ))}
                  {(!selectedInvoice.payments || selectedInvoice.payments.length === 0) && (
                    <tr><td colSpan="5">Chưa phát sinh lần thanh toán nào.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyPayments;

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
    try {
      setExportingId(invoice.id);
      const response = await axiosClient.get(`/invoices/${invoice.id}/export`, {
        responseType: "blob",
      });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `bang-thanh-toan-${invoice.patient_name || "khach-hang"}-${invoice.invoice_code || invoice.id}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Không thể xuất bảng thanh toán.",
      );
    } finally {
      setExportingId(null);
    }
  };

  const printReceipt = (invoice, payment) => {
    const treatment = (invoice.details || []).map(getDetailName).join("; ");
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
            .row span:last-child, .row strong:last-child { text-align: right; }
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
            <div class="row"><strong>Nội dung điều trị</strong><span>${treatment || "Chưa cập nhật"}</span></div>
            <div class="line"></div>
            <div class="row"><span>Tạm tính</span><strong>${formatMoney(invoice.subtotal)}</strong></div>
            <div class="row"><span>Giảm giá</span><strong>${formatMoney(invoice.discount_amount)}</strong></div>
            <div class="row"><span>Thành tiền</span><strong>${formatMoney(invoice.total_amount)}</strong></div>
            <div class="row total"><span>Thanh toán lần này</span><strong>${formatMoney(payment.amount)}</strong></div>
            <div class="row"><span>Tổng đã thanh toán</span><strong>${formatMoney(payment.cumulative_paid)}</strong></div>
            <div class="row"><span>Còn lại</span><strong>${formatMoney(payment.remaining_after)}</strong></div>
            <div class="row"><span>Phương thức</span><strong>${payment.payment_method}</strong></div>
            <div class="row"><span>Ngày thanh toán</span><strong>${payment.payment_date_display}</strong></div>
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
                    <button type="button" className="admin-action-button" onClick={() => exportInvoice(invoice)} disabled={exportingId === invoice.id}>
                      {exportingId === invoice.id ? "Đang xuất..." : "Xuất bảng thanh toán"}
                    </button>
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
                    <th>In</th>
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
                      <td>
                        <button type="button" className="admin-action-button" onClick={() => printReceipt(selectedInvoice, payment)}>
                          In phiếu
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!selectedInvoice.payments || selectedInvoice.payments.length === 0) && (
                    <tr><td colSpan="6">Chưa phát sinh lần thanh toán nào.</td></tr>
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

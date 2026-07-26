const paymentStatusClass = (status) =>
  `payment-detail-status payment-detail-status--${String(status || "unpaid").toLowerCase()}`;

function PaymentDetailModal({
  exportingId,
  formatDate,
  formatMoney,
  getDetailName,
  hasDebt,
  invoice,
  onClose,
  onExport,
  onOpenPayment,
  onPrintReceipt,
  statusLabels,
}) {
  const details = invoice.details || [];
  const payments = [...(invoice.payments || [])].sort((left, right) => {
    const numberDifference =
      Number(left.payment_number || 0) - Number(right.payment_number || 0);
    if (numberDifference !== 0) return numberDifference;

    return String(left.payment_date || "").localeCompare(String(right.payment_date || ""));
  });

  return (
    <div className="payment-detail-overlay" role="presentation">
      <div
        className="payment-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-detail-title"
      >
        <header className="payment-detail-header">
          <div>
            <span className="payment-detail-eyebrow">Hồ sơ thanh toán</span>
            <h3 id="payment-detail-title">Chi tiết hồ sơ thanh toán</h3>
            <p>
              {invoice.invoice_code || `TT${invoice.id}`} • {invoice.patient_name}
            </p>
          </div>
          <button
            type="button"
            className="payment-detail-close"
            onClick={onClose}
            aria-label="Đóng chi tiết hồ sơ thanh toán"
          >
            ×
          </button>
        </header>

        <div className="payment-detail-layout">
          <div className="payment-detail-primary">
            <section className="payment-detail-section payment-detail-customer">
              <header className="payment-detail-section__header">
                <span>A</span>
                <div>
                  <h4>Thông tin khách hàng</h4>
                  <p>Thông tin định danh của hồ sơ thanh toán.</p>
                </div>
              </header>

              <div className="payment-detail-customer__grid">
                <div>
                  <span>Mã khách hàng</span>
                  <strong>#{invoice.patient_id}</strong>
                </div>
                <div>
                  <span>Họ tên</span>
                  <strong>{invoice.patient_name}</strong>
                </div>
                <div>
                  <span>Số điện thoại</span>
                  <strong>{invoice.patient_phone || "Chưa cập nhật"}</strong>
                </div>
                <div>
                  <span>Trạng thái</span>
                  <strong className={paymentStatusClass(invoice.payment_status)}>
                    {statusLabels[invoice.payment_status] || invoice.payment_status}
                  </strong>
                </div>
              </div>
            </section>

            <section className="payment-detail-section payment-detail-treatment">
              <header className="payment-detail-section__header">
                <span>B</span>
                <div>
                  <h4>Nội dung điều trị</h4>
                  <p>Các dịch vụ và chi phí đã ghi nhận trong hồ sơ.</p>
                </div>
              </header>

              {details.length === 0 ? (
                <p className="payment-detail-empty">Chưa có dòng điều trị trong hồ sơ này.</p>
              ) : (
                <div className="payment-detail-treatment__table-wrap">
                  <table className="payment-detail-treatment__table">
                    <thead>
                      <tr>
                        <th>Dịch vụ</th>
                        <th>Nội dung</th>
                        <th>Số lượng</th>
                        <th>Đơn giá</th>
                        <th>Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {details.map((detail) => (
                        <tr key={detail.id || getDetailName(detail)}>
                          <td data-label="Dịch vụ">
                            {detail.service_name ||
                              detail.treatment_group ||
                              "Dịch vụ khác"}
                          </td>
                          <td data-label="Nội dung">
                            <strong>{getDetailName(detail)}</strong>
                          </td>
                          <td data-label="Số lượng">{detail.quantity}</td>
                          <td data-label="Đơn giá" className="payment-detail-money">
                            {formatMoney(detail.unit_price)}
                          </td>
                          <td data-label="Thành tiền" className="payment-detail-money">
                            <strong>{formatMoney(detail.subtotal)}</strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          <aside className="payment-detail-section payment-detail-summary">
            <header className="payment-detail-section__header">
              <span>C</span>
              <div>
                <h4>Tổng quan thanh toán</h4>
                <p>Đối soát tổng tiền, đã thu và số còn lại.</p>
              </div>
            </header>

            <div className="payment-detail-summary__card">
              <div className="payment-detail-money-row">
                <span>Tạm tính</span>
                <strong>{formatMoney(invoice.subtotal)}</strong>
              </div>
              <div className="payment-detail-money-row">
                <span>Giảm giá</span>
                <strong>{formatMoney(invoice.discount_amount)}</strong>
              </div>
              <div className="payment-detail-money-row payment-detail-money-row--reason">
                <span>Lý do giảm giá</span>
                <strong>{invoice.discount_reason || "Không có"}</strong>
              </div>
              <div className="payment-detail-money-row payment-detail-money-row--total">
                <span>Thành tiền</span>
                <strong>{formatMoney(invoice.total_amount)}</strong>
              </div>
              <div className="payment-detail-money-row">
                <span>Đã thanh toán</span>
                <strong>{formatMoney(invoice.paid_amount)}</strong>
              </div>
              <div className="payment-detail-money-row payment-detail-money-row--remaining">
                <span>Còn lại</span>
                <strong>{formatMoney(invoice.remaining_amount)}</strong>
              </div>
            </div>
          </aside>
        </div>

        <section className="payment-detail-section payment-detail-history">
          <header className="payment-detail-section__header">
            <span>D</span>
            <div>
              <h4>Lịch sử thanh toán</h4>
              <p>Các lần thanh toán được sắp xếp từ đầu đến hiện tại.</p>
            </div>
          </header>

          <div className="payment-detail-history__scroll">
            <table className="payment-detail-history__table">
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
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>#{payment.payment_number}</td>
                    <td className="payment-detail-date">
                      {formatDate(
                        payment.payment_date || payment.payment_date_display,
                        payment.created_at,
                      )}
                    </td>
                    <td className="payment-detail-money">{formatMoney(payment.amount)}</td>
                    <td>{payment.payment_method}</td>
                    <td>{payment.created_by_username || "Chưa xác định"}</td>
                    <td className="payment-detail-money">
                      {formatMoney(payment.cumulative_paid)}
                    </td>
                    <td className="payment-detail-money">
                      {formatMoney(payment.remaining_after)}
                    </td>
                    <td className="payment-detail-history__note">{payment.note || "—"}</td>
                    <td>
                      <button
                        type="button"
                        className="payment-detail-print"
                        onClick={() => onPrintReceipt(invoice, payment)}
                      >
                        In phiếu
                      </button>
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan="9" className="payment-detail-empty">
                      Chưa phát sinh lần thanh toán nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="payment-detail-actions">
          {hasDebt(invoice) && (
            <button
              type="button"
              className="payment-detail-button payment-detail-button--primary"
              onClick={() => onExport(invoice)}
              disabled={exportingId === invoice.id}
            >
              {exportingId === invoice.id ? "Đang xuất..." : "Xuất bảng công nợ"}
            </button>
          )}
          {hasDebt(invoice) && (
            <button
              type="button"
              className="payment-detail-button payment-detail-button--secondary"
              onClick={() => onOpenPayment(invoice)}
            >
              Ghi nhận thanh toán
            </button>
          )}
          <button
            type="button"
            className="payment-detail-button payment-detail-button--close"
            onClick={onClose}
          >
            Đóng
          </button>
        </footer>
      </div>
    </div>
  );
}

export default PaymentDetailModal;

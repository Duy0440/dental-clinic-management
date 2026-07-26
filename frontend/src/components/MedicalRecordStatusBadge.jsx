const STATUS_CONFIG = {
  PendingConfirmation: {
    label: "Chờ nha sĩ xác nhận",
    className: "pending",
  },
  Confirmed: {
    label: "Đã xác nhận",
    className: "confirmed",
  },
};

function MedicalRecordStatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.PendingConfirmation;

  return (
    <span className={`medical-record-status-badge ${config.className}`}>
      {config.label}
    </span>
  );
}

export default MedicalRecordStatusBadge;

import { useEffect, useMemo, useState } from "react";
import axiosClient from "../../api/axiosClient";
import { getAssetUrl } from "../../api/urlHelpers";
import DentalChart from "../../components/DentalChart";
import MedicalRecordStatusBadge from "../../components/MedicalRecordStatusBadge";
import MedicalRecordForm from "../../components/admin/MedicalRecordForm";
import { extractMedicalRecordTeeth } from "../../utils/dentalChart";

const RECORD_TABS = [
  { value: "PendingConfirmation", label: "Chờ xác nhận" },
  { value: "Confirmed", label: "Đã xác nhận" },
];

const isImageFile = (fileType) => {
  return fileType?.startsWith("image/");
};

function DentistMedicalRecords() {
  const [records, setRecords] = useState([]);
  const [tabCounts, setTabCounts] = useState({
    PendingConfirmation: 0,
    Confirmed: 0,
  });
  const [activeStatus, setActiveStatus] = useState("PendingConfirmation");
  const [viewingRecord, setViewingRecord] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [message, setMessage] = useState("");
  const [confirmingId, setConfirmingId] = useState(null);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get("/medical-records");
      setRecords(response.data.records || response.data.data || []);
      setTabCounts({
        PendingConfirmation: response.data.counts?.PendingConfirmation || 0,
        Confirmed: response.data.counts?.Confirmed || 0,
      });
    } catch (error) {
      setRecords([]);
      setTabCounts({
        PendingConfirmation: 0,
        Confirmed: 0,
      });
      setErrorMessage(
        error.response?.data?.message || "Không thể tải hồ sơ điều trị.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const filteredRecords = useMemo(
    () => records.filter((record) => record.status === activeStatus),
    [records, activeStatus],
  );

  const formatDate = (date) => {
    if (!date) return "Chưa hẹn tái khám";
    const [year, month, day] = String(date).slice(0, 10).split("-");
    return `${day}/${month}/${year}`;
  };

  const formatTime = (time) => {
    if (!time) return "";
    return ` lúc ${String(time).slice(0, 5)}`;
  };

  const formatAppointmentDate = (record) => {
    if (record.appointment_date_display) {
      return record.appointment_time
        ? `${record.appointment_date_display} ${String(record.appointment_time).slice(0, 5)}`
        : record.appointment_date_display;
    }

    return record.created_at
      ? new Date(record.created_at).toLocaleDateString("vi-VN")
      : "Chưa cập nhật";
  };

  const closeEditForm = () => {
    setEditingRecord(null);
  };

  const handleSaved = async (savedRecord) => {
    await fetchRecords();
    setEditingRecord(null);
    setViewingRecord(savedRecord || null);
    setMessage("Đã lưu cập nhật bệnh án.");
  };

  const handleConfirm = async (record) => {
    const accepted = window.confirm(
      "Sau khi xác nhận, bệnh án sẽ được khóa và khách hàng có thể xem kết quả. Bạn chắc chắn muốn xác nhận?",
    );

    if (!accepted) {
      return;
    }

    try {
      setConfirmingId(record.id);
      setMessage("");
      setErrorMessage("");

      const response = await axiosClient.post(
        `/medical-records/${record.id}/confirm`,
      );
      const confirmedRecord = response.data.data;

      await fetchRecords();
      setViewingRecord(confirmedRecord);
      setActiveStatus("Confirmed");
      setMessage("Đã xác nhận hồ sơ và hoàn tất lịch khám.");
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Không thể xác nhận hồ sơ điều trị.",
      );
    } finally {
      setConfirmingId(null);
    }
  };

  const renderRecordDetail = (record) => (
    <div className="dentist-record-detail">
      <div className="dentist-record-detail-grid">
        <div>
          <span>Khách hàng</span>
          <strong>{record.patient_name}</strong>
          <p>{record.patient_phone || "Chưa cập nhật số điện thoại"}</p>
        </div>
        <div>
          <span>Nha sĩ phụ trách</span>
          <strong>{record.dentist_name}</strong>
        </div>
        <div>
          <span>Người nhập dữ liệu</span>
          <strong>{record.entered_by_username || "Chưa xác định"}</strong>
        </div>
        <div>
          <span>Tái khám đề xuất</span>
          <strong>
            {formatDate(record.re_examination_date)}
            {formatTime(record.re_examination_time)}
          </strong>
        </div>
      </div>

      <div className="dentist-record-detail-section">
        <span>Lý do khám</span>
        <p>{record.chief_complaint || "Chưa cập nhật."}</p>
      </div>
      <div className="dentist-record-detail-section">
        <span>Khám lâm sàng</span>
        <p>{record.clinical_examination || "Chưa cập nhật."}</p>
      </div>
      <div className="dentist-record-detail-section">
        <span>Chẩn đoán</span>
        <p>{record.diagnosis || "Chưa cập nhật."}</p>
      </div>
      <div className="dentist-record-detail-section">
        <span>Nội dung điều trị</span>
        <p>{record.treatment || "Chưa cập nhật."}</p>
      </div>
      <div className="dentist-record-detail-section">
        <span>Hướng điều trị</span>
        <p>{record.treatment_plan || "Chưa cập nhật."}</p>
      </div>
      <div className="dentist-record-detail-section">
        <span>Ghi chú</span>
        <p>{record.note || "Không có ghi chú."}</p>
      </div>

      <DentalChart
        mode="view"
        teeth={extractMedicalRecordTeeth(record)}
      />

      {record.attachments?.length > 0 && (
        <div className="dentist-record-detail-section">
          <span>File đính kèm</span>
          <div className="dentist-attachment-list">
            {record.attachments.map((file) => {
              const fileUrl = getAssetUrl(file.file_url);

              if (isImageFile(file.file_type)) {
                return (
                  <button
                    type="button"
                    key={file.id}
                    className="dentist-attachment-item"
                    onClick={() => setSelectedImage({ ...file, fileUrl })}
                  >
                    <img src={fileUrl} alt={file.file_name} />
                    <strong>{file.file_name}</strong>
                  </button>
                );
              }

              return (
                <a
                  key={file.id}
                  href={fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="dentist-attachment-item"
                >
                  <div className="dentist-pdf-file">PDF</div>
                  <strong>{file.file_name}</strong>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="dentist-page dentist-records-page">
      <div className="dentist-page-header">
        <div>
          <span className="dentist-eyebrow">Theo dõi điều trị</span>
          <h2>Hồ sơ điều trị</h2>
          <p>
            Xem, chỉnh sửa trước xác nhận và xác nhận bệnh án thuộc lịch phụ
            trách của bạn.
          </p>
        </div>
      </div>

      <div className="medical-record-tabbar" role="tablist">
        {RECORD_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={activeStatus === tab.value ? "active" : ""}
            onClick={() => setActiveStatus(tab.value)}
          >
            {tab.label}
            <span>{tabCounts[tab.value] || 0}</span>
          </button>
        ))}
      </div>

      {loading && <p className="dentist-muted-text">Đang tải hồ sơ điều trị...</p>}
      {!loading && errorMessage && <p className="admin-error-message">{errorMessage}</p>}
      {!loading && message && <p className="admin-success-message">{message}</p>}

      {!loading && !errorMessage && filteredRecords.length === 0 && (
        <div className="dentist-empty-state">
          <strong>Không có bệnh án trong mục này</strong>
          <p>Đổi bộ lọc trạng thái để xem các bệnh án khác.</p>
        </div>
      )}

      {!loading && !errorMessage && filteredRecords.length > 0 && (
        <div className="dentist-record-grid">
          {filteredRecords.map((record) => (
            <article className="dentist-record-card" key={record.id}>
              <div className="dentist-record-top">
                <div>
                  <span>Hồ sơ #{record.id}</span>
                  <h3>{record.patient_name}</h3>
                </div>
                <div className="dentist-record-owner">
                  <strong>{record.dentist_name}</strong>
                  <MedicalRecordStatusBadge status={record.status} />
                </div>
              </div>

              <div className="dentist-record-section">
                <span>Ngày khám</span>
                <p>{formatAppointmentDate(record)}</p>
              </div>

              <div className="dentist-record-section">
                <span>Chẩn đoán</span>
                <p>{record.diagnosis || "Chưa cập nhật chẩn đoán."}</p>
              </div>

              <div className="dentist-record-section">
                <span>Nội dung điều trị</span>
                <p>{record.treatment || "Chưa cập nhật nội dung điều trị."}</p>
              </div>

              <div className="dentist-record-footer">
                <span>Người nhập dữ liệu</span>
                <strong>{record.entered_by_username || "Chưa xác định"}</strong>
              </div>

              <div className="dentist-record-actions">
                <button
                  type="button"
                  className="dentist-small-button"
                  onClick={() => setViewingRecord(record)}
                >
                  Xem bệnh án
                </button>

                {record.status === "PendingConfirmation" && (
                  <button
                    type="button"
                    className="dentist-small-button secondary"
                    onClick={() => setEditingRecord(record)}
                  >
                    Chỉnh sửa
                  </button>
                )}

                {record.status === "PendingConfirmation" && (
                  <button
                    type="button"
                    className="dentist-record-confirm-button"
                    onClick={() => handleConfirm(record)}
                    disabled={confirmingId === record.id}
                  >
                    {confirmingId === record.id
                      ? "Đang xác nhận..."
                      : "Xác nhận bệnh án"}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {viewingRecord && (
        <div
          className="dentist-modal-backdrop"
          onClick={() => setViewingRecord(null)}
        >
          <div
            className="dentist-modal dentist-record-detail-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="dentist-modal-header">
              <div>
                <span className="dentist-eyebrow">Bệnh án #{viewingRecord.id}</span>
                <h3>{viewingRecord.patient_name}</h3>
                <MedicalRecordStatusBadge status={viewingRecord.status} />
              </div>
              <button type="button" onClick={() => setViewingRecord(null)}>
                ×
              </button>
            </div>

            {renderRecordDetail(viewingRecord)}

            <div className="dentist-record-actions">
              {viewingRecord.status === "PendingConfirmation" && (
                <button
                  type="button"
                  className="dentist-small-button secondary"
                  onClick={() => {
                    setEditingRecord(viewingRecord);
                    setViewingRecord(null);
                  }}
                >
                  Chỉnh sửa
                </button>
              )}
              {viewingRecord.status === "PendingConfirmation" && (
                <button
                  type="button"
                  className="dentist-record-confirm-button"
                  onClick={() => handleConfirm(viewingRecord)}
                  disabled={confirmingId === viewingRecord.id}
                >
                  {confirmingId === viewingRecord.id
                    ? "Đang xác nhận..."
                    : "Xác nhận bệnh án"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {editingRecord && (
        <MedicalRecordForm
          customerId={editingRecord.patient_id}
          appointments={[]}
          dentists={[
            {
              id: editingRecord.dentist_id,
              full_name: editingRecord.dentist_name,
              specialty: "",
            },
          ]}
          record={editingRecord}
          mode="edit"
          onClose={closeEditForm}
          onSaved={handleSaved}
        />
      )}

      {selectedImage && (
        <div className="dentist-image-preview" onClick={() => setSelectedImage(null)}>
          <div className="dentist-image-preview-content" onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => setSelectedImage(null)}>×</button>
            <img src={selectedImage.fileUrl} alt={selectedImage.file_name} />
            <p>{selectedImage.file_name}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default DentistMedicalRecords;

import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import { getAssetUrl } from "../../api/urlHelpers";

const isImageFile = (fileType) => {
  return fileType?.startsWith("image/");
};

// dentist records page (xem ho so dieu tri da cap nhat)
function DentistMedicalRecords() {
  const [records, setRecords] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [message, setMessage] = useState("");
  const [confirmingId, setConfirmingId] = useState(null);

  useEffect(() => {
    // fetch records (lay danh sach ho so dieu tri)
    const fetchRecords = async () => {
      try {
        const response = await axiosClient.get("/medical-records");
        setRecords(response.data.data || []);
      } catch (error) {
        setErrorMessage(
          error.response?.data?.message || "Không thể tải hồ sơ điều trị.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, []);

  const formatDate = (date) => {
    if (!date) return "Chưa hẹn tái khám";
    const [year, month, day] = date.split("-");
    return `${day}/${month}/${year}`;
  };

  const formatTime = (time) => {
    if (!time) return "";
    return ` lúc ${time.slice(0, 5)}`;
  };

  const getStatusLabel = (status) => {
    const labels = {
      Draft: "Bản nháp",
      PendingConfirmation: "Chờ xác nhận",
      Confirmed: "Đã xác nhận",
    };

    return labels[status] || "Chờ xác nhận";
  };

  // confirm record (nha si xac nhan ho so do le tan lap)
  const handleConfirm = async (recordId) => {
    try {
      setConfirmingId(recordId);
      setMessage("");
      setErrorMessage("");

      const response = await axiosClient.post(`/medical-records/${recordId}/confirm`);
      const confirmedRecord = response.data.data;

      setRecords((current) => current.map((record) => (
        record.id === confirmedRecord.id ? confirmedRecord : record
      )));
      setMessage("Đã xác nhận hồ sơ và hoàn tất lịch khám.");
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Không thể xác nhận hồ sơ điều trị.",
      );
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <div className="dentist-page dentist-records-page">
      <div className="dentist-page-header">
        <div>
          <span className="dentist-eyebrow">Theo dõi điều trị</span>
          <h2>Hồ sơ điều trị</h2>
          <p>Xem lại các chẩn đoán, nội dung điều trị, lịch tái khám và file hình ảnh đã cập nhật.</p>
        </div>
      </div>

      {loading && <p className="dentist-muted-text">Đang tải hồ sơ điều trị...</p>}
      {!loading && errorMessage && <p className="admin-error-message">{errorMessage}</p>}
      {!loading && message && <p className="admin-success-message">{message}</p>}

      {!loading && !errorMessage && records.length === 0 && (
        <div className="dentist-empty-state">
          <strong>Chưa có hồ sơ điều trị</strong>
          <p>Sau khi cập nhật kết quả khám, hồ sơ của khách hàng sẽ được lưu tại đây.</p>
        </div>
      )}

      {!loading && !errorMessage && records.length > 0 && (
        <div className="dentist-record-grid">
          {records.map((record) => (
            <article className="dentist-record-card" key={record.id}>
              <div className="dentist-record-top">
                <div>
                  <span>Hồ sơ #{record.id}</span>
                  <h3>{record.patient_name}</h3>
                </div>
                <div className="dentist-record-owner">
                  <strong>{record.dentist_name}</strong>
                  <span className={`dentist-record-status ${record.status || "PendingConfirmation"}`}>
                    {getStatusLabel(record.status)}
                  </span>
                </div>
              </div>

              <div className="dentist-record-section">
                <span>Chẩn đoán</span>
                <p>{record.diagnosis || "Chưa cập nhật chẩn đoán."}</p>
              </div>

              <div className="dentist-record-section">
                <span>Nội dung điều trị</span>
                <p>{record.treatment || "Chưa cập nhật nội dung điều trị."}</p>
              </div>

              <div className="dentist-record-section">
                <span>Ghi chú chuyên môn</span>
                <p>{record.note || "Không có ghi chú."}</p>
              </div>

              <div className="dentist-record-footer">
                <span>Tái khám đề xuất</span>
                <strong>
                  {formatDate(record.re_examination_date)}
                  {formatTime(record.re_examination_time)}
                </strong>
              </div>

              {record.status !== "Confirmed" && (
                <button
                  type="button"
                  className="dentist-record-confirm-button"
                  onClick={() => handleConfirm(record.id)}
                  disabled={confirmingId === record.id}
                >
                  {confirmingId === record.id ? "Đang xác nhận..." : "Xác nhận hồ sơ"}
                </button>
              )}

              {record.attachments?.length > 0 && (
                <div className="dentist-record-section">
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
            </article>
          ))}
        </div>
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

import { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";
import { getAssetUrl } from "../api/urlHelpers";

function MedicalResults() {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    const fetchMedicalResults = async () => {
      try {
        const response = await axiosClient.get(
          `/medical-records/patient/${user.patient_id}`,
        );

        setRecords(response.data.data || []);
      } catch (error) {
        setMessage(
          error.response?.data?.message || "Không thể tải kết quả điều trị.",
        );
      } finally {
        setLoading(false);
      }
    };

    if (user?.patient_id) {
      fetchMedicalResults();
      return;
    }

    setLoading(false);
    setMessage("Tài khoản chưa có hồ sơ khách hàng.");
  }, [user?.patient_id]);

  const formatTime = (time) => {
    return time ? time.slice(0, 5) : "";
  };

  const getFileUrl = (fileUrl) => {
    return getAssetUrl(fileUrl);
  };

  const isImageFile = (fileType) => {
    return fileType?.startsWith("image/");
  };

  return (
    <div className="container py-5">
      <div className="mb-4">
        <h2 className="mb-1">Kết quả điều trị</h2>

        <p className="text-secondary mb-0">
          Xem lại chẩn đoán, nội dung điều trị và khuyến nghị tái khám từ phòng
          khám.
        </p>
      </div>

      {loading && <p className="text-center">Đang tải kết quả điều trị...</p>}

      {!loading && message && (
        <div className="alert alert-warning rounded-4">{message}</div>
      )}

      {!loading && !message && records.length === 0 && (
        <div className="alert alert-light border rounded-4 text-center">
          Hiện chưa có kết quả điều trị nào.
        </div>
      )}

      {!loading && !message && records.length > 0 && (
        <div className="row g-4">
          {records.map((record) => (
            <div className="col-lg-6" key={record.id}>
              <article className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between gap-3 mb-4">
                    <div>
                      <p className="text-secondary small mb-1">
                        Kết quả #{record.id}
                      </p>

                      <h4 className="mb-0">{record.dentist_name}</h4>
                    </div>

                    <span className="result-status-badge">Đã cập nhật</span>
                  </div>

                  <div className="mb-3">
                    <strong>Chẩn đoán</strong>
                    <p className="text-secondary mb-0 mt-1">
                      {record.diagnosis || "Chưa cập nhật"}
                    </p>
                  </div>

                  <div className="mb-3">
                    <strong>Nội dung điều trị</strong>
                    <p className="text-secondary mb-0 mt-1">
                      {record.treatment || "Chưa cập nhật"}
                    </p>
                  </div>

                  <div className="mb-3">
                    <strong>Ghi chú chuyên môn</strong>
                    <p className="text-secondary mb-0 mt-1">
                      {record.note || "Không có ghi chú thêm."}
                    </p>
                  </div>

                  <div className="border rounded-4 p-3 bg-light-subtle">
                    <strong>Tái khám đề xuất</strong>

                    <p className="mb-0 mt-1">
                      {record.re_examination_date_display ||
                        "Chưa có đề xuất tái khám"}

                      {record.re_examination_time &&
                        ` lúc ${formatTime(record.re_examination_time)}`}
                    </p>

                    {record.attachments?.length > 0 && (
                      <div className="mt-3">
                        <strong>Hình ảnh / tài liệu đính kèm</strong>

                        <div className="record-attachment-list mt-2">
                          {record.attachments.map((file) => (
                            <div
                              className="record-attachment-item"
                              key={file.id}
                            >
                              {isImageFile(file.file_type) ? (
                                <button
                                  type="button"
                                  className="record-image-button"
                                  onClick={() =>
                                    setPreviewImage(getFileUrl(file.file_url))
                                  }
                                >
                                  <img
                                    src={getFileUrl(file.file_url)}
                                    alt={file.file_name}
                                  />
                                </button>
                              ) : (
                                <a
                                  href={getFileUrl(file.file_url)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="btn btn-outline-secondary btn-sm"
                                >
                                  Xem file PDF
                                </a>
                              )}

                              <span>{file.file_name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {record.attachment_url && (
                    <a
                      href={record.attachment_url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline-primary mt-3"
                    >
                      Xem tài liệu đính kèm
                    </a>
                  )}
                </div>
              </article>
            </div>
          ))}
        </div>
      )}
      {previewImage && (
        <div
          className="image-preview-overlay"
          onClick={() => setPreviewImage(null)}
        >
          <button
            type="button"
            className="image-preview-close"
            onClick={() => setPreviewImage(null)}
          >
            ×
          </button>

          <img src={previewImage} alt="Hình ảnh điều trị" />
        </div>
      )}
    </div>
  );
}

export default MedicalResults;

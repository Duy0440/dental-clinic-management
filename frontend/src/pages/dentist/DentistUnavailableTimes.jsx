import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";

// dentist unavailable page (nha si bao lich ban/nghi)
function DentistUnavailableTimes() {
  const [unavailableTimes, setUnavailableTimes] = useState([]);
  const [formData, setFormData] = useState({
    unavailable_date: "",
    start_time: "",
    end_time: "",
    reason: "",
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "null");

  // fetch unavailable times (lay lich ban cua nha si)
  const fetchUnavailableTimes = async () => {
    try {
      setLoading(true);

      if (!user?.dentist_id) {
        setErrorMessage("Tài khoản nha sĩ chưa có hồ sơ nha sĩ tương ứng.");
        return;
      }

      const response = await axiosClient.get(
        `/dentist-unavailable-times/dentist/${user.dentist_id}`,
      );
      setUnavailableTimes(response.data.data || []);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Không thể tải lịch bận của nha sĩ.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnavailableTimes();
  }, []);

  // handle form (cap nhat ngay gio ban)
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // submit unavailable time (gui thong bao lich ban cho admin)
  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setErrorMessage("");

    if (!user?.dentist_id) {
      setErrorMessage("Không tìm thấy hồ sơ nha sĩ của tài khoản này.");
      return;
    }

    try {
      await axiosClient.post("/dentist-unavailable-times", {
        dentist_id: user.dentist_id,
        unavailable_date: formData.unavailable_date,
        start_time: formData.start_time || null,
        end_time: formData.end_time || null,
        reason: formData.reason,
      });

      setMessage("Đã cập nhật lịch bận thành công.");
      setFormData({
        unavailable_date: "",
        start_time: "",
        end_time: "",
        reason: "",
      });

      fetchUnavailableTimes();
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Không thể thêm lịch bận.",
      );
    }
  };

  const formatDate = (date) => {
    if (!date) return "Cả ngày";
    const [year, month, day] = date.split("-");
    return `${day}/${month}/${year}`;
  };

  const formatTimeRange = (startTime, endTime) => {
    if (!startTime && !endTime) return "Cả ngày";
    if (startTime && !endTime) return `Từ ${startTime.slice(0, 5)}`;
    if (!startTime && endTime) return `Đến ${endTime.slice(0, 5)}`;
    return `${startTime.slice(0, 5)} - ${endTime.slice(0, 5)}`;
  };

  return (
    <div className="dentist-page dentist-unavailable-page">
      <div className="dentist-page-header">
        <div>
          <span className="dentist-eyebrow">Lịch cá nhân</span>
          <h2>Lịch bận</h2>
          <p>Báo trước ngày hoặc khung giờ bận để lễ tân không phân công lịch khám vào thời gian đó.</p>
        </div>
      </div>

      <div className="dentist-two-columns">
        <form className="dentist-form-card" onSubmit={handleSubmit}>
          <h3>Thêm lịch bận</h3>

          <label>Ngày bận</label>
          <input
            type="date"
            name="unavailable_date"
            value={formData.unavailable_date}
            onChange={handleChange}
            required
          />

          <div className="dentist-form-grid">
            <div>
              <label>Giờ bắt đầu</label>
              <input
                type="time"
                name="start_time"
                value={formData.start_time}
                onChange={handleChange}
              />
            </div>

            <div>
              <label>Giờ kết thúc</label>
              <input
                type="time"
                name="end_time"
                value={formData.end_time}
                onChange={handleChange}
              />
            </div>
          </div>

          <label>Lý do</label>
          <textarea
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            placeholder="Ví dụ: nghỉ phép, đi hội thảo, lịch phẫu thuật ngoài..."
            rows="4"
          />

          <button type="submit">Lưu lịch bận</button>

          {message && <p className="admin-success-message">{message}</p>}
          {errorMessage && <p className="admin-error-message">{errorMessage}</p>}
        </form>

        <div className="dentist-list-card">
          <div className="dentist-list-card-header">
            <div>
              <span className="dentist-eyebrow">Đã báo với lễ tân</span>
              <h3>Danh sách lịch bận</h3>
            </div>
            <strong>{unavailableTimes.length}</strong>
          </div>

          {loading && <p className="dentist-muted-text">Đang tải lịch bận...</p>}

          {!loading && unavailableTimes.length === 0 && (
            <div className="dentist-empty-state compact">
              <strong>Chưa có lịch bận</strong>
              <p>Khi cần nghỉ hoặc bận một khung giờ, bác sĩ cập nhật tại form bên trái.</p>
            </div>
          )}

          {!loading && unavailableTimes.map((item) => (
            <div className="dentist-unavailable-item" key={item.id}>
              <strong>{formatDate(item.unavailable_date)}</strong>
              <span>{formatTimeRange(item.start_time, item.end_time)}</span>
              <p>{item.reason || "Không có ghi chú."}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DentistUnavailableTimes;

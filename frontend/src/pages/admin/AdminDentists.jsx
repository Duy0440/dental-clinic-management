import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import PasswordField from "../../components/PasswordField";

const initialFormData = {
  full_name: "",
  specialty: "",
  phone: "",
  email: "",
  username: "",
  password: "",
};

function AdminDentists() {
  const [dentists, setDentists] = useState([]);
  const [unavailableNotifications, setUnavailableNotifications] = useState([]);
  const [formData, setFormData] = useState(initialFormData);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const fetchDentists = async () => {
    try {
      const response = await axiosClient.get("/dentists");
      setDentists(response.data.data || []);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Không thể tải danh sách nha sĩ.",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchUnavailableNotifications = async () => {
    try {
      const response = await axiosClient.get("/dentist-unavailable-times/recent");
      setUnavailableNotifications(response.data.data || []);
    } catch {
      setUnavailableNotifications([]);
    }
  };

  useEffect(() => {
    fetchDentists();
    fetchUnavailableNotifications();
  }, []);

  const filteredDentists = dentists.filter((dentist) => {
    const keyword = searchKeyword.toLowerCase();

    return (
      dentist.full_name?.toLowerCase().includes(keyword) ||
      dentist.specialty?.toLowerCase().includes(keyword) ||
      dentist.phone?.toLowerCase().includes(keyword) ||
      dentist.username?.toLowerCase().includes(keyword)
    );
  });

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setShowForm(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setErrorMessage("");

    try {
      await axiosClient.post("/dentists", formData);

      setMessage("Tạo tài khoản nha sĩ thành công.");
      resetForm();
      await fetchDentists();
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Không thể tạo tài khoản nha sĩ.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleChangeActiveStatus = async (dentist) => {
    const nextStatus = !dentist.is_active;

    const confirmMessage = nextStatus
      ? `Kích hoạt lại nha sĩ ${dentist.full_name}?`
      : `Ngưng hoạt động nha sĩ ${dentist.full_name}?`;

    const isConfirmed = window.confirm(confirmMessage);

    if (!isConfirmed) {
      return;
    }

    setMessage("");
    setErrorMessage("");

    try {
      await axiosClient.patch(`/dentists/${dentist.id}/active-status`, {
        is_active: nextStatus,
      });

      setMessage(
        nextStatus ? "Đã kích hoạt lại nha sĩ." : "Đã ngưng hoạt động nha sĩ.",
      );

      await fetchDentists();
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          "Không thể cập nhật trạng thái nha sĩ.",
      );
    }
  };

  const formatTimeRange = (startTime, endTime) => {
    if (!startTime || !endTime) {
      return "Cả ngày";
    }

    return `${String(startTime).slice(0, 5)} - ${String(endTime).slice(0, 5)}`;
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h2>Quản lý nha sĩ</h2>
          <p>
            Tạo tài khoản đăng nhập, tra cứu và quản lý trạng thái làm việc của
            nha sĩ.
          </p>
        </div>

        <button
          type="button"
          className="admin-primary-button"
          onClick={() => setShowForm(true)}
        >
          Thêm nha sĩ
        </button>
      </div>

      <div className="admin-toolbar">
        <input
          type="text"
          value={searchKeyword}
          onChange={(event) => setSearchKeyword(event.target.value)}
          placeholder="Tìm theo tên, chuyên môn, số điện thoại hoặc tài khoản..."
        />
      </div>

      <section className="dashboard-panel admin-dentist-unavailable-panel">
        <div className="dashboard-panel-title">
          <h3>Thông báo lịch bận từ nha sĩ</h3>
          <span>Hiển thị tại trang Nha sĩ để lễ tân tránh phân công nhầm lịch</span>
        </div>

        {unavailableNotifications.length === 0 ? (
          <p className="dashboard-empty-text">
            Chưa có nha sĩ nào báo lịch bận gần đây.
          </p>
        ) : (
          <div className="dashboard-recent-list">
            {unavailableNotifications.map((item) => (
              <div className="dashboard-recent-item" key={item.id}>
                <div>
                  <strong>{item.dentist_name}</strong>
                  <span>{item.specialty || "Chưa cập nhật chuyên môn"}</span>
                </div>
                <div>
                  <strong>{item.unavailable_date_display}</strong>
                  <span>{formatTimeRange(item.start_time, item.end_time)}</span>
                </div>
                <div>
                  <strong>Lý do</strong>
                  <span>{item.reason || "Bác sĩ không ghi lý do."}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {message && <p className="admin-success-message">{message}</p>}
      {errorMessage && <p className="admin-error-message">{errorMessage}</p>}

      {loading ? (
        <p>Đang tải danh sách nha sĩ...</p>
      ) : filteredDentists.length === 0 ? (
        <p>Không tìm thấy nha sĩ phù hợp.</p>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Nha sĩ</th>
                <th>Chuyên môn</th>
                <th>Tài khoản</th>
                <th>Liên hệ</th>
                <th>Trạng thái</th>
                <th>Xử lý</th>
              </tr>
            </thead>

            <tbody>
              {filteredDentists.map((dentist) => (
                <tr key={dentist.id}>
                  <td>#{dentist.id}</td>

                  <td>
                    <strong>{dentist.full_name}</strong>
                  </td>

                  <td>{dentist.specialty || "Chưa cập nhật"}</td>

                  <td>{dentist.username || "Chưa có tài khoản"}</td>

                  <td>
                    <div>{dentist.phone}</div>
                    <span>{dentist.email || "Chưa có email"}</span>
                  </td>

                  <td>
                    <span
                      className={`admin-status-badge ${
                        dentist.is_active ? "success" : "warning"
                      }`}
                    >
                      {dentist.is_active ? "Đang hoạt động" : "Tạm ngưng"}
                    </span>
                  </td>

                  <td>
                    <div className="admin-action-group">
                      <Link
                        to={`/admin/dentists/${dentist.id}`}
                        className="admin-action-button"
                      >
                        Chi tiết
                      </Link>

                      <button
                        type="button"
                        className={
                          dentist.is_active
                            ? "admin-danger-button"
                            : "admin-secondary-button"
                        }
                        onClick={() => handleChangeActiveStatus(dentist)}
                      >
                        {dentist.is_active ? "Ngưng" : "Kích hoạt"}
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
          <div className="admin-modal">
            <div className="admin-modal-header">
              <div>
                <h3>Thêm nha sĩ</h3>
                <p>Tạo tài khoản đăng nhập kèm hồ sơ nha sĩ.</p>
              </div>

              <button type="button" onClick={resetForm}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label>
                Họ và tên
                <input
                  required
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Ví dụ: BS. Nguyễn Minh Khoa"
                />
              </label>

              <label>
                Chuyên môn
                <input
                  type="text"
                  name="specialty"
                  value={formData.specialty}
                  onChange={handleChange}
                  placeholder="Ví dụ: Nha khoa tổng quát"
                />
              </label>

              <div className="admin-form-row">
                <label>
                  Số điện thoại
                  <input
                    required
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="0908888999"
                  />
                </label>

                <label>
                  Email
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="doctor@gmail.com"
                  />
                </label>
              </div>

              <div className="admin-form-row">
                <label>
                  Tên đăng nhập
                  <input
                    required
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="nhasi02"
                  />
                </label>

                <label>
                  Mật khẩu
                  <PasswordField
                    required
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="123456"
                    className=""
                    autoComplete="new-password"
                  />
                </label>
              </div>

              <div className="admin-form-hint">
                Tài khoản này sẽ được dùng để nha sĩ đăng nhập và xử lý lịch
                khám.
              </div>

              <div className="admin-modal-actions">
                <button type="button" onClick={resetForm}>
                  Đóng
                </button>

                <button type="submit" disabled={saving}>
                  {saving ? "Đang lưu..." : "Tạo nha sĩ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDentists;

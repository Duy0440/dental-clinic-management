import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../../api/axiosClient";

const initialForm = {
  full_name: "",
  phone: "",
  gender: "",
  birth_date: "",
  address: "",
};

function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await axiosClient.get("/patients");
        setCustomers(response.data.data || []);
      } catch (error) {
        setMessage(
          error.response?.data?.message ||
            "Không thể tải danh sách khách hàng.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      const response = await axiosClient.post("/patients", {
        ...formData,
        user_id: null,
      });

      setCustomers((currentCustomers) => [
        response.data.data,
        ...currentCustomers,
      ]);

      setFormData(initialForm);
      setShowForm(false);
      setMessage("Thêm khách hàng thành công.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Không thể thêm khách hàng.");
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const keyword = searchText.trim().toLowerCase();

    return (
      customer.full_name.toLowerCase().includes(keyword) ||
      customer.phone.includes(keyword)
    );
  });

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h2>Quản lý khách hàng</h2>
          <p>Tra cứu khách hàng có tài khoản và khách đến trực tiếp.</p>
        </div>

        <button
          type="button"
          className="admin-primary-button"
          onClick={() => setShowForm(true)}
        >
          Thêm khách hàng
        </button>
      </div>

      <input
        type="search"
        className="admin-search-input"
        placeholder="Tìm theo họ tên hoặc số điện thoại..."
        value={searchText}
        onChange={(event) => setSearchText(event.target.value)}
      />

      {message && <p className="admin-success-message">{message}</p>}

      {loading && <p>Đang tải danh sách khách hàng...</p>}

      {!loading && filteredCustomers.length === 0 && (
        <p>Không tìm thấy khách hàng phù hợp.</p>
      )}

      {!loading && filteredCustomers.length > 0 && (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Khách hàng</th>
                <th>Giới tính</th>
                <th>Ngày sinh</th>
                <th>Địa chỉ</th>
                <th>Loại khách</th>
                <th>Hồ sơ</th>
              </tr>
            </thead>

            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td>#{customer.id}</td>

                  <td>
                    <strong>{customer.full_name}</strong>
                    <span>{customer.phone}</span>
                  </td>

                  <td>{customer.gender || "Chưa cập nhật"}</td>

                  <td>{customer.birth_date_display || "Chưa cập nhật"}</td>

                  <td>{customer.address || "Chưa cập nhật"}</td>

                  <td>
                    {customer.user_id ? "Có tài khoản" : "Khách vãng lai"}
                  </td>

                  <td>
                    <Link
                      to={`/admin/customers/${customer.id}`}
                      className="admin-action-button"
                    >
                      Xem hồ sơ
                    </Link>
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
                <h3>Thêm khách hàng</h3>
                <p>Dành cho khách đến trực tiếp tại phòng khám.</p>
              </div>

              <button type="button" onClick={() => setShowForm(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label>
                Họ và tên
                <input
                  required
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                />
              </label>

              <label>
                Số điện thoại
                <input
                  required
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </label>

              <label>
                Giới tính
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="">Chưa cập nhật</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </label>

              <label>
                Ngày sinh
                <input
                  type="date"
                  name="birth_date"
                  value={formData.birth_date}
                  onChange={handleChange}
                />
              </label>

              <label>
                Địa chỉ
                <input
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                />
              </label>

              <div className="admin-modal-actions">
                <button type="button" onClick={() => setShowForm(false)}>
                  Đóng
                </button>

                <button type="submit">Lưu khách hàng</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCustomers;

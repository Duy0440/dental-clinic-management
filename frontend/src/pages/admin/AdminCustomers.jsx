import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import PasswordField from "../../components/PasswordField";

const initialCustomerForm = {
  full_name: "",
  phone: "",
  gender: "",
  birth_date: "",
  address: "",
};

const initialAccountForm = {
  username: "",
  password: "",
  email: "",
};

function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerForm, setCustomerForm] = useState(initialCustomerForm);
  const [accountForm, setAccountForm] = useState(initialAccountForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const fetchCustomers = async () => {
    try {
      const response = await axiosClient.get("/patients");
      setCustomers(response.data.data || []);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Không thể tải danh sách khách hàng.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter((customer) => {
    const keyword = searchText.trim().toLowerCase();

    return (
      customer.full_name?.toLowerCase().includes(keyword) ||
      customer.phone?.includes(keyword)
    );
  });

  const handleCustomerChange = (event) => {
    setCustomerForm({
      ...customerForm,
      [event.target.name]: event.target.value,
    });
  };

  const handleAccountChange = (event) => {
    setAccountForm({
      ...accountForm,
      [event.target.name]: event.target.value,
    });
  };

  const closeCustomerForm = () => {
    setCustomerForm(initialCustomerForm);
    setShowCustomerForm(false);
  };

  const closeAccountForm = () => {
    setAccountForm(initialAccountForm);
    setSelectedCustomer(null);
    setShowAccountForm(false);
  };

  const openAccountForm = (customer) => {
    setSelectedCustomer(customer);
    setAccountForm({
      username: "",
      password: "123456",
      email: "",
    });
    setShowAccountForm(true);
  };

  const handleCreateCustomer = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setErrorMessage("");

    try {
      await axiosClient.post("/patients", {
        ...customerForm,
        user_id: null,
      });

      setMessage("Thêm khách hàng thành công.");
      closeCustomerForm();
      await fetchCustomers();
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Không thể thêm khách hàng.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAccount = async (event) => {
    event.preventDefault();

    if (!selectedCustomer) {
      return;
    }

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    try {
      await axiosClient.post(
        `/patients/${selectedCustomer.id}/create-account`,
        accountForm,
      );

      setMessage("Tạo tài khoản cho khách hàng thành công.");
      closeAccountForm();
      await fetchCustomers();
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          "Không thể tạo tài khoản cho khách hàng.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h2>Quản lý khách hàng</h2>
          <p>
            Tra cứu khách hàng có tài khoản, khách vãng lai và hỗ trợ tạo tài
            khoản khi cần.
          </p>
        </div>

        <button
          type="button"
          className="admin-primary-button"
          onClick={() => setShowCustomerForm(true)}
        >
          Thêm khách hàng
        </button>
      </div>

      <div className="admin-toolbar">
        <input
          type="search"
          placeholder="Tìm theo họ tên hoặc số điện thoại..."
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
        />
      </div>

      {message && <p className="admin-success-message">{message}</p>}
      {errorMessage && <p className="admin-error-message">{errorMessage}</p>}

      {loading ? (
        <p>Đang tải danh sách khách hàng...</p>
      ) : filteredCustomers.length === 0 ? (
        <p>Không tìm thấy khách hàng phù hợp.</p>
      ) : (
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
                <th>Xử lý</th>
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
                    <span
                      className={`admin-status-badge ${
                        customer.user_id ? "success" : "warning"
                      }`}
                    >
                      {customer.user_id ? "Có tài khoản" : "Khách vãng lai"}
                    </span>
                  </td>

                  <td>
                    <div className="admin-action-group">
                      <Link
                        to={`/admin/customers/${customer.id}`}
                        className="admin-action-button"
                      >
                        Xem hồ sơ
                      </Link>

                      {!customer.user_id && (
                        <button
                          type="button"
                          className="admin-secondary-button"
                          onClick={() => openAccountForm(customer)}
                        >
                          Tạo tài khoản
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCustomerForm && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <div>
                <h3>Thêm khách hàng</h3>
                <p>Dành cho khách đến trực tiếp tại phòng khám.</p>
              </div>

              <button type="button" onClick={closeCustomerForm}>
                ×
              </button>
            </div>

            <form onSubmit={handleCreateCustomer}>
              <label>
                Họ và tên
                <input
                  required
                  name="full_name"
                  value={customerForm.full_name}
                  onChange={handleCustomerChange}
                />
              </label>

              <label>
                Số điện thoại
                <input
                  required
                  name="phone"
                  value={customerForm.phone}
                  onChange={handleCustomerChange}
                />
              </label>

              <label>
                Giới tính
                <select
                  name="gender"
                  value={customerForm.gender}
                  onChange={handleCustomerChange}
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
                  value={customerForm.birth_date}
                  onChange={handleCustomerChange}
                />
              </label>

              <label>
                Địa chỉ
                <input
                  name="address"
                  value={customerForm.address}
                  onChange={handleCustomerChange}
                />
              </label>

              <div className="admin-modal-actions">
                <button type="button" onClick={closeCustomerForm}>
                  Đóng
                </button>

                <button type="submit" disabled={saving}>
                  {saving ? "Đang lưu..." : "Lưu khách hàng"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAccountForm && selectedCustomer && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <div>
                <h3>Tạo tài khoản khách hàng</h3>
                <p>
                  Gắn tài khoản đăng nhập cho khách hàng{" "}
                  <strong>{selectedCustomer.full_name}</strong>.
                </p>
              </div>

              <button type="button" onClick={closeAccountForm}>
                ×
              </button>
            </div>

            <form onSubmit={handleCreateAccount}>
              <label>
                Tên đăng nhập
                <input
                  required
                  name="username"
                  value={accountForm.username}
                  onChange={handleAccountChange}
                  placeholder="Ví dụ: khachhang01"
                />
              </label>

              <label>
                Mật khẩu
                <PasswordField
                  required
                  name="password"
                  value={accountForm.password}
                  onChange={handleAccountChange}
                  placeholder="123456"
                  className=""
                  autoComplete="new-password"
                />
              </label>

              <label>
                Email
                <input
                  type="email"
                  name="email"
                  value={accountForm.email}
                  onChange={handleAccountChange}
                  placeholder="Có thể bỏ trống"
                />
              </label>

              <div className="admin-form-hint">
                Sau khi tạo tài khoản, khách hàng có thể đăng nhập để xem lịch
                hẹn, kết quả điều trị và ưu đãi.
              </div>

              <div className="admin-modal-actions">
                <button type="button" onClick={closeAccountForm}>
                  Đóng
                </button>

                <button type="submit" disabled={saving}>
                  {saving ? "Đang tạo..." : "Tạo tài khoản"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCustomers;

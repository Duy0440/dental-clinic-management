import { useState } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import PasswordField from "../components/PasswordField";

// forgot password form (du lieu dat lai mat khau)
const initialForm = {
  username: "",
  phone: "",
  new_password: "",
  confirm_password: "",
};

// forgot password page (quen mat khau don gian)
function ForgotPassword() {
  const [formData, setFormData] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleChange = (event) => {
    // update form (nhap thong tin tai khoan)
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    // reset password (doi mat khau bang username va sdt)
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setIsError(false);

    if (formData.new_password !== formData.confirm_password) {
      setSaving(false);
      setIsError(true);
      setMessage("Mật khẩu xác nhận chưa khớp.");
      return;
    }

    try {
      await axiosClient.post("/auth/forgot-password", {
        username: formData.username,
        phone: formData.phone,
        new_password: formData.new_password,
      });

      setFormData(initialForm);
      setMessage("Đổi mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.");
    } catch (error) {
      setIsError(true);
      setMessage(
        error.response?.data?.message ||
          "Không thể đổi mật khẩu. Vui lòng kiểm tra lại thông tin.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow-sm border-0 rounded-4">
            <div className="card-body p-4 p-lg-5">
              <h2 className="text-center mb-2">Quên mật khẩu</h2>
              <p className="text-center text-secondary mb-4">
                Nhập tên đăng nhập và số điện thoại đã đăng ký để đặt lại mật khẩu.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Tên đăng nhập</label>
                  <input
                    required
                    type="text"
                    name="username"
                    className="form-control"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Ví dụ: khachhang01"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Số điện thoại</label>
                  <input
                    required
                    type="tel"
                    name="phone"
                    className="form-control"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Số điện thoại đã lưu trong tài khoản"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Mật khẩu mới</label>
                  <PasswordField
                    required
                    minLength="6"
                    name="new_password"
                    value={formData.new_password}
                    onChange={handleChange}
                    placeholder="Ít nhất 6 ký tự"
                    autoComplete="new-password"
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label">Nhập lại mật khẩu mới</label>
                  <PasswordField
                    required
                    minLength="6"
                    name="confirm_password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    autoComplete="new-password"
                  />
                </div>

                <button type="submit" className="btn btn-primary w-100" disabled={saving}>
                  {saving ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
                </button>
              </form>

              {message && (
                <p className={`mt-3 text-center mb-0 ${isError ? "text-danger" : "text-success"}`}>
                  {message}
                </p>
              )}

              <p className="text-center mt-4 mb-0">
                Nhớ mật khẩu rồi? <Link to="/login">Quay lại đăng nhập</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;

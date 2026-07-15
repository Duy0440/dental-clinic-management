import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import PasswordField from "../components/PasswordField";

// register page (khach tao tai khoan)
function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    phone: "",
    email: "",
    password: "",
    gender: "",
    birth_date: "",
    address: "",
  });
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (event) => {
    // update form (nhap thong tin dang ky)
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    // submit register (tao user va patient)
    event.preventDefault();
    setMessage("");
    setIsSuccess(false);

    try {
      const response = await axiosClient.post("/auth/register", {
        ...formData,
        role: "customer",
      });

      setIsSuccess(true);
      setMessage(response.data.message);

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (error) {
      setMessage(error.response?.data?.message || "Đăng ký thất bại");
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-7">
          <div className="card shadow-sm border-0 rounded-4">
            <div className="card-body p-4 p-lg-5">
              <h2 className="text-center mb-2">Đăng ký tài khoản khách hàng</h2>
              <p className="text-center text-secondary mb-4">
                Sau khi đăng ký, hệ thống sẽ tự tạo hồ sơ bệnh nhân cho tài khoản này.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Họ và tên</label>
                    <input
                      type="text"
                      name="full_name"
                      className="form-control"
                      value={formData.full_name}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Tên đăng nhập</label>
                    <input
                      type="text"
                      name="username"
                      className="form-control"
                      value={formData.username}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Số điện thoại</label>
                    <input
                      type="text"
                      name="phone"
                      className="form-control"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Mật khẩu</label>
                  <PasswordField
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                  />
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Giới tính</label>
                    <select
                      name="gender"
                      className="form-select"
                      value={formData.gender}
                      onChange={handleChange}
                    >
                      <option value="">Chọn giới tính</option>
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                    </select>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Ngày sinh</label>
                    <input
                      type="date"
                      name="birth_date"
                      className="form-control"
                      value={formData.birth_date}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Địa chỉ</label>
                  <input
                    type="text"
                    name="address"
                    className="form-control"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>

                <button type="submit" className="btn btn-primary w-100">
                  Đăng ký tài khoản
                </button>
              </form>

              {message && (
                <p
                  className={`mt-3 text-center mb-0 ${
                    isSuccess ? "text-success" : "text-danger"
                  }`}
                >
                  {message}
                </p>
              )}

              <p className="text-center mt-4 mb-0">
                Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;

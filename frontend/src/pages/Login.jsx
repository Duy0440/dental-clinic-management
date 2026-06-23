import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setIsError(false);

    try {
      const response = await axiosClient.post("/auth/login", formData);
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      setMessage("Đăng nhập thành công");

      if (response.data.user.role === "admin") {
        navigate("/admin");
        return;
      }

      if (response.data.user.role === "dentist") {
        navigate("/dentist");
        return;
      }

      navigate("/");

      navigate("/");
    } catch (error) {
      setIsError(true);
      setMessage(error.response?.data?.message || "Đăng nhập thất bại");
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow-sm border-0 rounded-4">
            <div className="card-body p-4 p-lg-5">
              <h2 className="text-center mb-2">Đăng nhập</h2>
              <p className="text-center text-secondary mb-4">
                Đăng nhập bằng tên đăng nhập và mật khẩu đã đăng ký.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Tên đăng nhập</label>
                  <input
                    type="text"
                    name="username"
                    className="form-control"
                    value={formData.username}
                    onChange={handleChange}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Mật khẩu</label>
                  <input
                    type="password"
                    name="password"
                    className="form-control"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>

                <button type="submit" className="btn btn-primary w-100">
                  Đăng nhập
                </button>
              </form>

              {message && (
                <p className={`mt-3 text-center mb-0 ${isError ? "text-danger" : "text-success"}`}>
                  {message}
                </p>
              )}

              <p className="text-center mt-4 mb-0">
                Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;

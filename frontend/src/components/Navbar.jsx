import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user") || "null"),
  );
  const [searchKeyword, setSearchKeyword] = useState("");

  const canViewDashboard = user && ["admin", "dentist"].includes(user.role);
  const canViewCustomerMenu =
    user && user.role === "customer" && user.patient_id;

  useEffect(() => {
    setUser(JSON.parse(localStorage.getItem("user") || "null"));
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    if (!searchKeyword.trim()) {
      return;
    }

    navigate(`/services?keyword=${encodeURIComponent(searchKeyword.trim())}`);
  };

  return (
    <header className="site-header">
      <div className="topbar-strip">
        <div className="container topbar-strip-inner">
          <span>
            Đặt lịch nhanh, theo dõi hồ sơ và nhận hỗ trợ nha khoa dễ dàng
          </span>
          <a href="tel:19006899" className="topbar-hotline">
            Đường dây nóng: 1900 6899
          </a>
        </div>
      </div>

      <div className="header-main">
        <div className="container header-main-inner">
          <Link className="navbar-brand custom-brand" to="/">
            <span className="brand-mark">VD</span>
            <span className="brand-text-group">
              <span className="brand-title">Phòng khám nha khoa V</span>
              <span className="brand-subtitle">
                Chăm sóc nha khoa rõ ràng, hiện đại và thân thiện
              </span>
            </span>
          </Link>

          <form className="header-search-form" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              className="header-search-input"
              placeholder="Tìm dịch vụ, bác sĩ hoặc thông tin cần xem"
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
            />
            <button type="submit" className="header-search-button">
              Tìm
            </button>
          </form>

          <div className="header-actions">
            <a href="tel:19006899" className="header-hotline-button">
              Gọi ngay
            </a>

            {user ? (
              <button
                type="button"
                className="btn custom-login-btn"
                onClick={handleLogout}
              >
                Đăng xuất
              </button>
            ) : (
              <Link className="btn custom-login-btn" to="/login">
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </div>

      <nav className="navbar navbar-expand-lg custom-navbar">
        <div className="container">
          <button
            className="navbar-toggler custom-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#mainNavbar"
            aria-controls="mainNavbar"
            aria-expanded="false"
            aria-label="Mở menu"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="mainNavbar">
            <ul className="navbar-nav custom-nav-list">
              <li className="nav-item">
                <Link className="nav-link custom-nav-link" to="/">
                  Trang chủ
                </Link>
              </li>

              <li className="nav-item dropdown custom-hover-dropdown">
                <button
                  className="nav-link custom-nav-link dropdown-toggle custom-menu-button"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Giới thiệu
                </button>
                <ul className="dropdown-menu custom-dropdown-menu">
                  <li>
                    <a className="dropdown-item" href="/#clinic-story">
                      Về phòng khám
                    </a>
                  </li>
                  <li>
                    <a className="dropdown-item" href="/#doctor-team">
                      Đội ngũ bác sĩ
                    </a>
                  </li>
                  <li>
                    <a className="dropdown-item" href="/#clinic-story">
                      Hệ thống phòng khám
                    </a>
                  </li>
                </ul>
              </li>

              <li className="nav-item">
                <Link className="nav-link custom-nav-link" to="/services">
                  Dịch vụ
                </Link>
              </li>

              <li className="nav-item">
                <Link className="nav-link custom-nav-link" to="/?booking=open">
                  Đặt lịch
                </Link>
              </li>

              {canViewCustomerMenu && (
                <li className="nav-item">
                  <Link className="nav-link custom-nav-link" to="/my-appointments">
                    Lịch đã đặt
                  </Link>
                </li>
              )}

              {canViewCustomerMenu && (
                <li className="nav-item">
                  <Link className="nav-link custom-nav-link" to="/medical-results">
                    Kết quả khám
                  </Link>
                </li>
              )}

              {canViewCustomerMenu && (
                <li className="nav-item">
                  <Link className="nav-link custom-nav-link" to="/offers">
                    Ưu đãi của bạn
                  </Link>
                </li>
              )}

              <li className="nav-item">
                <Link className="nav-link custom-nav-link" to="/chatbot">
                  Hỏi đáp AI
                </Link>
              </li>

              {canViewDashboard && (
                <li className="nav-item">
                  <Link className="nav-link custom-nav-link" to="/dashboard">
                    Bảng điều khiển
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;

import { NavLink, Outlet, useNavigate } from "react-router-dom";
import BrandLogo from "../components/BrandLogo";
import "../dentist.css";

function DentistLayout() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const doctorName = user?.dentist_name || user?.full_name || user?.username || "nha sĩ";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="dentist-layout">
      <aside className="dentist-sidebar">
        <div className="dentist-brand">
          <BrandLogo className="dentist-logo" />

          <div>
            <strong>Nha khoa V</strong>
            <span>Khu vực nha sĩ</span>
          </div>
        </div>

        <div className="dentist-sidebar-note">
          <span>Ca làm việc</span>
          <strong>Theo lịch được phân công</strong>
          <p>Cập nhật hồ sơ điều trị sau khi hoàn tất thăm khám.</p>
        </div>

        <nav className="dentist-menu">
          <NavLink to="/dentist" end>
            <span>LK</span>
            Lịch khám của tôi
          </NavLink>

          <NavLink to="/dentist/unavailable-times">
            <span>LB</span>
            Lịch bận
          </NavLink>

          <NavLink to="/dentist/medical-records">
            <span>HS</span>
            Hồ sơ điều trị
          </NavLink>
        </nav>

        <div className="dentist-sidebar-actions">
          <button type="button" onClick={() => navigate("/")}>Xem website</button>
          <button type="button" onClick={handleLogout}>Đăng xuất</button>
        </div>
      </aside>

      <main className="dentist-main">
        <header className="dentist-header">
          <div>
            <p>Trang làm việc của nha sĩ</p>
            <h1>Quản lý lịch khám và điều trị</h1>
          </div>

          <span>Xin chào, {doctorName}</span>
        </header>

        <section className="dentist-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}

export default DentistLayout;

import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "../admin.css";

function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <strong>Nha khoa V</strong>
          <span>Trang quản trị</span>
        </div>

        <nav className="admin-menu">
          <NavLink to="/admin" end>
            Tổng quan
          </NavLink>

          <NavLink to="/admin/appointments">Lịch hẹn</NavLink>
          
          <NavLink to="/admin/customers">Quản lý khách hàng</NavLink>

          <NavLink to="/admin/dentists">Nha sĩ</NavLink>

          <NavLink to="/admin/services">Dịch vụ</NavLink>

          <NavLink to="/admin/medical-records">Hồ sơ điều trị</NavLink>

          <NavLink to="/admin/invoices">Hóa đơn</NavLink>
        </nav>

        <button type="button" onClick={handleLogout}>
          Đăng xuất
        </button>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1>Hệ thống quản lý phòng khám</h1>
            <p>Xin chào, quản trị viên</p>
          </div>
        </header>

        <section className="admin-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}

export default AdminLayout;
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import BrandLogo from "../components/BrandLogo";
import "../admin.css";
import "../mobile-overrides.css";

const menuGroups = [
  {
    title: "Quản lý chính",
    items: [
      { to: "/admin", label: "Tổng quan", icon: "TQ", end: true },
      { to: "/admin/appointments", label: "Lịch hẹn", icon: "LH" },
      { to: "/admin/customers", label: "Khách hàng", icon: "KH" },
      { to: "/admin/reviews", label: "Đánh giá", icon: "DG" },
    ],
  },
  {
    title: "Danh mục và thanh toán",
    items: [
      { to: "/admin/dentists", label: "Nha sĩ", icon: "NS" },
      { to: "/admin/services", label: "Dịch vụ", icon: "DV" },
      { to: "/admin/invoices", label: "Hóa đơn", icon: "HD" },
    ],
  },
];

const pageInfo = {
  "/admin": {
    eyebrow: "Tổng quan",
    title: "Tổng quan phòng khám",
    description: "Theo dõi lịch hẹn, khách hàng, doanh thu và các việc cần xử lý trong ngày.",
  },
  "/admin/appointments": {
    eyebrow: "Lịch hẹn",
    title: "Quản lý lịch hẹn",
    description: "Xác nhận lịch, phân công nha sĩ và ghi chú phản hồi cho khách hàng.",
  },
  "/admin/customers": {
    eyebrow: "Khách hàng",
    title: "Quản lý khách hàng và hồ sơ điều trị",
    description: "Tra cứu thông tin, lịch hẹn, kết quả điều trị và hỗ trợ tạo tài khoản khi cần.",
  },
  "/admin/reviews": {
    eyebrow: "Đánh giá",
    title: "Phản hồi của khách hàng",
    description: "Theo dõi mức độ hài lòng và nhận xét sau khi khách hoàn thành điều trị.",
  },
  "/admin/dentists": {
    eyebrow: "Nha sĩ",
    title: "Quản lý nha sĩ",
    description: "Theo dõi tài khoản, lịch bận và khả năng tiếp nhận lịch khám của từng nha sĩ.",
  },
  "/admin/services": {
    eyebrow: "Dịch vụ",
    title: "Quản lý dịch vụ nha khoa",
    description: "Cập nhật nhóm dịch vụ để khách hàng chọn khi đặt lịch và tìm hiểu trên website.",
  },
  "/admin/invoices": {
    eyebrow: "Hóa đơn",
    title: "Quản lý hóa đơn",
    description: "Lập hóa đơn theo giá thực tế sau tư vấn, theo dõi thanh toán từng phần và in phiếu thu.",
  },
};

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const currentInfo =
    Object.entries(pageInfo)
      .sort((a, b) => b[0].length - a[0].length)
      .find(([path]) => location.pathname === path || location.pathname.startsWith(`${path}/`))?.[1] ||
    pageInfo["/admin"];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="admin-layout admin-shell-v2">
      <aside className="admin-sidebar admin-sidebar-v2">
        <div className="admin-brand admin-brand-v2">
          <BrandLogo className="admin-brand-mark" />
          <div>
            <strong>Nha khoa V</strong>
            <span>Khu vực quản trị</span>
          </div>
        </div>

        <div className="admin-slogan-panel">
          <span>Thông điệp</span>
          <strong>Chăm sóc rõ ràng, phục vụ tận tâm.</strong>
          <small>Mỗi hồ sơ khách hàng cần được theo dõi đầy đủ và chính xác.</small>
        </div>

        <nav className="admin-menu admin-menu-v2">
          {menuGroups.map((group) => (
            <div className="admin-menu-group" key={group.title}>
              <p>{group.title}</p>
              {group.items.map((item) => (
                <NavLink to={item.to} end={item.end} key={item.to}>
                  <span className="admin-menu-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <button type="button" className="admin-website-button" onClick={() => navigate("/")}>Xem website</button>
          <button type="button" className="admin-logout-button" onClick={handleLogout}>Đăng xuất</button>
        </div>
      </aside>

      <main className="admin-main admin-main-v2">
        <header className="admin-header admin-topbar-v2">
          <div>
            <span className="admin-topbar-eyebrow">{currentInfo.eyebrow}</span>
            <h1>{currentInfo.title}</h1>
            <p>{currentInfo.description}</p>
          </div>

          <div className="admin-topbar-status admin-topbar-slogan">
            <span>Nha khoa V</span>
            <strong>Tận tâm trong từng lần hẹn</strong>
          </div>
        </header>

        <section className="admin-content admin-content-v2">
          <Outlet />
        </section>
      </main>
    </div>
  );
}

export default AdminLayout;

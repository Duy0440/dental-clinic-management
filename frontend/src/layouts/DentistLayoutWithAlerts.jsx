import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import BrandLogo from "../components/BrandLogo";
import "../dentist.css";

const getStoredNumber = (key) => Number(localStorage.getItem(key) || 0);
const getMaxId = (items = []) =>
  items.reduce((maxId, item) => Math.max(maxId, Number(item.id || 0)), 0);
const countItemsAfterSeenId = (items = [], storageKey) =>
  items.filter((item) => Number(item.id || 0) > getStoredNumber(storageKey)).length;

const DENTIST_SEEN_APPOINTMENT_KEY = "dentist_seen_confirmed_appointment_id";
const DENTIST_SEEN_RECORD_KEY = "dentist_seen_record_needed_appointment_id";

function DentistLayoutWithAlerts() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const [sidebarAlerts, setSidebarAlerts] = useState({
    appointments: 0,
    records: 0,
  });

  const doctorName = user?.dentist_name || user?.full_name || user?.username || "nha sĩ";

  useEffect(() => {
    let isMounted = true;

    const fetchSidebarAlerts = async () => {
      try {
        const response = await axiosClient.get("/appointments/dentist/my-schedule");
        const appointments = response.data.data || [];
        const confirmedAppointments = appointments.filter(
          (appointment) => appointment.status === "Confirmed",
        );
        const needRecordAppointments = confirmedAppointments.filter(
          (appointment) => !appointment.has_medical_record,
        );

        if (!isMounted) return;

        if (location.pathname === "/dentist") {
          localStorage.setItem(
            DENTIST_SEEN_APPOINTMENT_KEY,
            String(getMaxId(confirmedAppointments)),
          );
        }

        if (location.pathname.startsWith("/dentist/medical-records")) {
          localStorage.setItem(
            DENTIST_SEEN_RECORD_KEY,
            String(getMaxId(needRecordAppointments)),
          );
        }

        setSidebarAlerts({
          appointments:
            location.pathname === "/dentist"
              ? 0
              : countItemsAfterSeenId(
                  confirmedAppointments,
                  DENTIST_SEEN_APPOINTMENT_KEY,
                ),
          records: location.pathname.startsWith("/dentist/medical-records")
            ? 0
            : countItemsAfterSeenId(
                needRecordAppointments,
                DENTIST_SEEN_RECORD_KEY,
              ),
        });
      } catch {
        if (!isMounted) return;

        setSidebarAlerts({
          appointments: 0,
          records: 0,
        });
      }
    };

    fetchSidebarAlerts();
    const intervalId = window.setInterval(fetchSidebarAlerts, 30000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const renderBadge = (count) => {
    if (!count) return null;

    return (
      <span className="dentist-sidebar-badge" title="Có việc mới cần xử lý">
        {count > 9 ? "9+" : count}
      </span>
    );
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
            <span className="dentist-menu-icon">LK</span>
            <span className="dentist-menu-label">Lịch khám của tôi</span>
            {renderBadge(sidebarAlerts.appointments)}
          </NavLink>

          <NavLink to="/dentist/unavailable-times">
            <span className="dentist-menu-icon">LB</span>
            <span className="dentist-menu-label">Lịch bận</span>
          </NavLink>

          <NavLink to="/dentist/medical-records">
            <span className="dentist-menu-icon">HS</span>
            <span className="dentist-menu-label">Hồ sơ điều trị</span>
            {renderBadge(sidebarAlerts.records)}
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

export default DentistLayoutWithAlerts;

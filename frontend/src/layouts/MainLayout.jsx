import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import Navbar from "../components/NavbarClean";
import Footer from "../components/FooterClinicClean";
import FloatingSupport from "../components/FloatingSupportClinic";
import ScrollToTopButton from "../components/ScrollToTopButton";

// public layout (khung trang khach hang: navbar, footer, support)
function MainLayout() {
  const location = useLocation();

  useEffect(() => {
    // track visit (moi phien mo website chi tinh 1 luot)
    if (sessionStorage.getItem("clinic_visit_tracked")) {
      return;
    }

    sessionStorage.setItem("clinic_visit_tracked", "true");

    axiosClient
      .post("/dashboard/visit", {
        path: location.pathname,
      })
      .catch(() => {
        sessionStorage.removeItem("clinic_visit_tracked");
      });
  }, []);

  useEffect(() => {
    if (location.hash) {
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location.pathname, location.search, location.hash]);

  return (
    <>
      <Navbar />
      <main className="min-vh-100">
        <Outlet />
      </main>
      <FloatingSupport />
      <ScrollToTopButton />
      <Footer />
    </>
  );
}

export default MainLayout;

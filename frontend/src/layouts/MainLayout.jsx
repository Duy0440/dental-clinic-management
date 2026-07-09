import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import Navbar from "../components/NavbarClean";
import Footer from "../components/FooterClinicClean";
import FloatingSupport from "../components/FloatingSupportClinic";
import ScrollToTopButton from "../components/ScrollToTopButton";

function MainLayout() {
  const location = useLocation();

  useEffect(() => {
    axiosClient
      .post("/dashboard/visit", {
        path: location.pathname,
      })
      .catch(() => {
        // Không chặn người dùng nếu việc ghi nhận lượt truy cập bị lỗi.
      });
  }, [location.pathname]);

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

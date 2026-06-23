import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FloatingSupport from "../components/FloatingSupport";

function MainLayout() {
  return (
    <>
      <Navbar />
      <main className="min-vh-100">
        <Outlet />
      </main>
      <FloatingSupport />
      <Footer />
    </>
  );
}

export default MainLayout;
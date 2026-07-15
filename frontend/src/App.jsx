import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayoutWithAlerts";
import DentistLayout from "./layouts/DentistLayoutWithAlerts";
import RoleRoute from "./routes/RoleRoute";

import Home from "./pages/HomePublic";
import AboutClinic from "./pages/AboutClinicPublic";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Search from "./pages/SearchSmart";
import Services from "./pages/ServicesInfo";
import ServiceDetail from "./pages/ServiceDetail";
import Pricing from "./pages/PricingPage";
import PromotionDetail from "./pages/PromotionDetail";
import Booking from "./pages/Booking";
import Chatbot from "./pages/ChatbotConsultantV3";
import Dashboard from "./pages/Dashboard";
import MyAppointments from "./pages/MyAppointments";
import MedicalResults from "./pages/MedicalResults";

import AdminAppointments from "./pages/admin/AdminAppointments";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminCustomerDetail from "./pages/admin/AdminCustomerDetail";
import AdminDentists from "./pages/admin/AdminDentists";
import AdminDentistDetail from "./pages/admin/AdminDentistDetail";
import AdminReviews from "./pages/admin/AdminReviews";

import DentistUnavailableTimes from "./pages/dentist/DentistUnavailableTimes";
import DentistAppointments from "./pages/dentist/DentistAppointments";
import DentistMedicalRecords from "./pages/dentist/DentistMedicalRecords";

import AdminServices from "./pages/admin/AdminServices";
import AdminInvoices from "./pages/admin/AdminInvoices";

// protected customer route (khach phai dang nhap moi xem du lieu ca nhan)
function ProtectedCustomerRoute({ children }) {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "customer" || !user.patient_id) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// app routes (khai bao route public, admin, nha si)
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Trang dành cho khách hàng */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<AboutClinic />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="search" element={<Search />} />
          <Route path="services" element={<Services />} />
          <Route path="services/:slug" element={<ServiceDetail />} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="promotions/:slug" element={<PromotionDetail />} />
          <Route path="booking" element={<Booking />} />
          <Route path="chatbot" element={<Chatbot />} />

          <Route
            path="my-appointments"
            element={
              <ProtectedCustomerRoute>
                <MyAppointments />
              </ProtectedCustomerRoute>
            }
          />

          <Route
            path="medical-results"
            element={
              <ProtectedCustomerRoute>
                <MedicalResults />
              </ProtectedCustomerRoute>
            }
          />
        </Route>

        {/* Trang dành riêng cho admin */}
        <Route
          path="/admin"
          element={
            <RoleRoute allowedRoles={["admin"]}>
              <AdminLayout />
            </RoleRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="appointments" element={<AdminAppointments />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route
            path="customers/:customerId"
            element={<AdminCustomerDetail />}
          />
          <Route path="dentists" element={<AdminDentists />} />
          <Route path="dentists/:dentistId" element={<AdminDentistDetail />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="services" element={<AdminServices />} />
          <Route path="invoices" element={<AdminInvoices />} />
        </Route>

        {/* Trang dành riêng cho nha sĩ */}
        <Route
          path="/dentist"
          element={
            <RoleRoute allowedRoles={["dentist"]}>
              <DentistLayout />
            </RoleRoute>
          }
        >
          <Route index element={<DentistAppointments />} />
          <Route path="unavailable-times" element={<DentistUnavailableTimes />} />
          <Route path="medical-records" element={<DentistMedicalRecords />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

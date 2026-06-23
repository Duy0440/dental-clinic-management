import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayout";
import RoleRoute from "./routes/RoleRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Services from "./pages/Services";
import Booking from "./pages/Booking";
import Chatbot from "./pages/Chatbot";
import Dashboard from "./pages/Dashboard";
import MyAppointments from "./pages/MyAppointments";
import MedicalResults from "./pages/MedicalResults";
import AdminAppointments from "./pages/admin/AdminAppointments";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminCustomerDetail from "./pages/admin/AdminCustomerDetail";

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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Các trang dành cho khách hàng */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="services" element={<Services />} />
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

        {/* Các trang dành riêng cho Admin */}
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
          <Route path="customers/:customerId" element={<AdminCustomerDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

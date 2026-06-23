import { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";

function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await axiosClient.get("/services");
        setServices(response.data.data || []);
      } catch (error) {
        setErrorMessage("Khong the tai danh sach dich vu.");
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  return (
    <section className="services-page py-5">
      <div className="container">
        <div className="services-hero text-center mb-5">
          <span className="services-badge">Dental Care Services</span>
          <h1 className="display-5 fw-bold mt-3">
            Dich vu nha khoa tai phong kham
          </h1>
          <p className="services-subtitle mx-auto mt-3">
            Danh sach dich vu duoc trinh bay ro rang de khach hang de dang tim
            hieu, so sanh va dat lich kham phu hop.
          </p>
        </div>

        {loading && (
          <div className="text-center">
            <p className="fs-5">Dang tai du lieu...</p>
          </div>
        )}

        {!loading && errorMessage && (
          <div className="alert alert-danger text-center">{errorMessage}</div>
        )}

        {!loading && !errorMessage && services.length === 0 && (
          <div className="alert alert-warning text-center">
            Hien tai chua co dich vu nao.
          </div>
        )}

        {!loading && !errorMessage && services.length > 0 && (
          <div className="row g-4">
            {services.map((service) => (
              <div className="col-lg-4 col-md-6" key={service.id}>
                <div className="service-card h-100">
                  <div className="service-card-top">
                    <p className="service-label mb-2">Service #{service.id}</p>
                    <h3 className="service-title">{service.service_name}</h3>
                  </div>

                  <p className="service-description">
                    {service.description || "Chua co mo ta cho dich vu nay."}
                  </p>

                  <div className="service-meta">
                    <div className="service-meta-item">
                      <span className="meta-title">Gia niem yet</span>
                      <strong>
                        {Number(service.price).toLocaleString("vi-VN")} VND
                      </strong>
                    </div>

                    <div className="service-meta-item">
                      <span className="meta-title">Thoi luong</span>
                      <strong>
                        {service.duration_minutes
                          ? `${service.duration_minutes} phut`
                          : "Dang cap nhat"}
                      </strong>
                    </div>
                  </div>

                  <div className="mt-4">
                    <span
                      className={`service-status ${
                        service.is_active ? "active" : "inactive"
                      }`}
                    >
                      {service.is_active ? "Dang hoạt động" : "Tạm ngưng"}
                    </span>
                  </div>

                  <button className="btn btn-primary w-100 mt-4">
                    Dat lich dich vu nay
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default Services;
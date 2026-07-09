import { Link, useSearchParams } from "react-router-dom";
import { serviceCategories } from "../data/serviceInfo";

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");

function ServicesInfo() {
  const [searchParams] = useSearchParams();
  const keyword = searchParams.get("keyword") || "";
  const normalizedKeyword = normalizeText(keyword);

  const filteredServices = normalizedKeyword
    ? serviceCategories.filter((service) =>
        normalizeText(`${service.title} ${service.eyebrow} ${service.summary} ${service.highlights.join(" ")}`).includes(
          normalizedKeyword,
        ),
      )
    : serviceCategories;

  return (
    <main className="service-info-page">
      <section className="service-info-hero">
        <div className="container service-info-hero-inner">
          <div>
            <span>Dịch vụ nha khoa</span>
            <h1>Tìm hiểu các nhóm dịch vụ trước khi đặt lịch</h1>
            <p>
              Trang này dùng để khách hàng đọc thông tin, xem hình ảnh và hiểu
              sơ bộ từng nhóm điều trị. Phần chọn dịch vụ trong form đặt lịch vẫn
              giữ riêng theo dữ liệu quản trị của phòng khám.
            </p>
          </div>
          <Link to="/?booking=open">Đặt lịch tư vấn</Link>
        </div>
      </section>

      <section className="service-info-section">
        <div className="container">
          {keyword.trim() && (
            <div className="service-info-search-note">
              Kết quả tìm kiếm cho: <strong>{keyword}</strong>
            </div>
          )}

          {filteredServices.length === 0 ? (
            <div className="service-info-empty">
              Không tìm thấy nhóm dịch vụ phù hợp. Bạn có thể hỏi chatbot hoặc đặt lịch để được tư vấn.
            </div>
          ) : (
            <div className="service-info-grid">
              {filteredServices.map((service, index) => (
                <article className={`service-info-card ${service.accent}`} key={service.slug}>
                  <Link className="service-info-image" to={`/services/${service.slug}`}>
                    <img src={service.image} alt={service.title} />
                    <span>{String(index + 1).padStart(2, "0")}</span>
                  </Link>

                  <div className="service-info-card-body">
                    <span>{service.eyebrow}</span>
                    <h2>{service.title}</h2>
                    <p>{service.summary}</p>

                    <div className="service-info-tags">
                      {service.highlights.slice(0, 3).map((highlight) => (
                        <small key={highlight}>{highlight}</small>
                      ))}
                    </div>

                    <div className="service-info-actions">
                      <Link to={`/services/${service.slug}`}>Xem thêm</Link>
                      <Link to="/?booking=open">Đặt lịch</Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default ServicesInfo;

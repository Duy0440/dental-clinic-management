import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Booking from "./Booking";
import "../home.css";

const slides = [
  {
    label: "Nha khoa hiện đại tại Cần Thơ",
    title: "Nụ cười khỏe mạnh bắt đầu từ một lần thăm khám đúng lúc",
    text: "Thăm khám rõ ràng, kế hoạch điều trị phù hợp và hồ sơ được theo dõi xuyên suốt.",
    image: "/images/clinic-hero-care.png",
  },
  {
    label: "Ưu đãi dành cho thành viên",
    title: "Khám tổng quát và tư vấn chăm sóc răng miệng",
    text: "Đăng ký tài khoản để theo dõi lịch hẹn, xem kết quả khám và nhận thông tin ưu đãi.",
    image: "/images/clinic-hero-offer.png",
  },
  {
    label: "Công nghệ hỗ trợ điều trị",
    title: "Thiết bị hiện đại giúp chẩn đoán chính xác hơn",
    text: "Quy trình được số hóa từ tiếp nhận, thăm khám đến lưu hồ sơ và theo dõi tái khám.",
    image: "/images/clinic-hero-technology.png",
  },
];

const services = [
  ["01", "Khám và tư vấn", "Kiểm tra tổng quát và đề xuất hướng chăm sóc phù hợp."],
  ["02", "Nha khoa tổng quát", "Cạo vôi, trám răng, nhổ răng và chăm sóc định kỳ."],
  ["03", "Nha khoa thẩm mỹ", "Tư vấn phục hình, tẩy trắng và cải thiện nụ cười."],
  ["04", "Tái khám và theo dõi", "Theo dõi kết quả điều trị và hồ sơ bệnh án lâu dài."],
];

const doctors = [
  ["BS. Trần Minh", "Phục hình răng - Tiểu phẫu", "8 năm kinh nghiệm", "/images/doctor-tran-minh.png"],
  ["BS. Lê Hoài An", "Nha khoa thẩm mỹ", "6 năm kinh nghiệm", "/images/doctor-le-hoai-an.png"],
  ["BS. Nguyễn Thu Hà", "Nha khoa tổng quát", "7 năm kinh nghiệm", "/images/doctor-nguyen-thu-ha.png"],
];

const milestones = [
  ["2021", "Bắt đầu từ chăm sóc minh bạch", "Giúp khách hàng hiểu rõ tình trạng và hướng điều trị."],
  ["2024", "Đầu tư thiết bị và quy trình", "Chuẩn hóa tiếp nhận, chẩn đoán và lưu hồ sơ điều trị."],
  ["2026", "Kết nối trải nghiệm số", "Đặt lịch, xem kết quả khám và nhận hỗ trợ trên website."],
];

function Home() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSlide, setActiveSlide] = useState(0);
  const [showBooking, setShowBooking] = useState(false);

  useEffect(() => {
    const timer = setInterval(
      () => setActiveSlide((current) => (current + 1) % slides.length),
      6000,
    );
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    document.body.style.overflow = showBooking ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showBooking]);

  useEffect(() => {
    if (new URLSearchParams(location.search).get("booking") === "open") {
      setShowBooking(true);
    }
  }, [location.search]);

  const closeBooking = () => {
    setShowBooking(false);
    if (location.search) {
      navigate("/", { replace: true });
    }
  };

  const slide = slides[activeSlide];

  return (
    <main className="clinic-home">
      <section className="clinic-hero" aria-label="Thông tin nổi bật">
        <img className="clinic-hero-image" src={slide.image} alt="Không gian chăm sóc nha khoa" />
        <div className="clinic-hero-overlay" />
        <div className="container clinic-hero-inner" key={slide.title}>
          <div className="clinic-hero-copy">
            <span className="clinic-eyebrow">{slide.label}</span>
            <h1>{slide.title}</h1>
            <p>{slide.text}</p>
            <div className="clinic-hero-actions">
              <button className="btn clinic-solid-button" onClick={() => setShowBooking(true)}>
                Đặt lịch thăm khám
              </button>
              <a className="btn clinic-ghost-button" href="#clinic-story">Tìm hiểu thêm</a>
            </div>
          </div>
        </div>
        <button
          className="clinic-slide-arrow previous"
          onClick={() => setActiveSlide((activeSlide - 1 + slides.length) % slides.length)}
          aria-label="Slide trước"
        >‹</button>
        <button
          className="clinic-slide-arrow next"
          onClick={() => setActiveSlide((activeSlide + 1) % slides.length)}
          aria-label="Slide sau"
        >›</button>
        <div className="clinic-slide-dots">
          {slides.map((item, index) => (
            <button
              key={item.title}
              className={index === activeSlide ? "active" : ""}
              onClick={() => setActiveSlide(index)}
              aria-label={`Chuyển đến slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      <section className="clinic-action-bar">
        <div className="container clinic-action-grid">
          <button onClick={() => setShowBooking(true)}>
            <span>01</span><div><strong>Đặt lịch khám</strong><small>Chọn ngày giờ phù hợp</small></div>
          </button>
          <Link to="/services">
            <span>02</span><div><strong>Tìm hiểu dịch vụ</strong><small>Xem các nhóm điều trị</small></div>
          </Link>
          <Link to="/chatbot">
            <span>03</span><div><strong>Hỏi đáp nha khoa</strong><small>Kiến thức cơ bản cùng AI</small></div>
          </Link>
          <a href="tel:19006899">
            <span>04</span><div><strong>1900 6899</strong><small>Đường dây hỗ trợ</small></div>
          </a>
        </div>
      </section>

      <section className="clinic-section clinic-services" id="clinic-services">
        <div className="container">
          <div className="clinic-section-heading">
            <div>
              <span className="clinic-kicker">Dịch vụ nha khoa</span>
              <h2>Chăm sóc phù hợp cho từng nhu cầu</h2>
            </div>
            <Link to="/services">Xem tất cả dịch vụ →</Link>
          </div>
          <div className="clinic-service-grid">
            {services.map(([number, title, description]) => (
              <article className="clinic-service-card" key={number}>
                <span>{number}</span><h3>{title}</h3><p>{description}</p>
                <Link to="/services">Xem chi tiết</Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="clinic-section clinic-team" id="doctor-team">
        <div className="container">
          <div className="clinic-section-heading centered">
            <div>
              <span className="clinic-kicker">Đội ngũ bác sĩ</span>
              <h2>Chuyên môn vững vàng, đồng hành tận tâm</h2>
              <p>Mỗi bác sĩ phụ trách một nhóm chuyên môn để quá trình tư vấn và điều trị rõ ràng hơn.</p>
            </div>
          </div>
          <div className="clinic-doctor-grid">
            {doctors.map(([name, specialty, experience, image]) => (
              <article className="clinic-doctor-card" key={name}>
                <div className="clinic-doctor-photo"><img src={image} alt={name} /></div>
                <div className="clinic-doctor-info">
                  <small>{experience}</small><h3>{name}</h3><p>{specialty}</p>
                  <button onClick={() => setShowBooking(true)}>Đặt lịch với bác sĩ</button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="clinic-section clinic-story" id="clinic-story">
        <div className="container clinic-story-grid">
          <div className="clinic-story-media">
            <img src="/images/clinic-story-equipment.png" alt="Không gian và thiết bị tại phòng khám" />
            <div className="clinic-story-badge"><strong>5+</strong><span>Năm xây dựng và phát triển</span></div>
          </div>
          <div className="clinic-story-content">
            <span className="clinic-kicker">Hệ thống phòng khám</span>
            <h2>Từ một phòng khám tận tâm đến quy trình chăm sóc hiện đại</h2>
            <p>Phòng khám phát triển dựa trên đội ngũ có chuyên môn, thiết bị hỗ trợ chẩn đoán và quy trình theo dõi hồ sơ rõ ràng.</p>
            <div className="clinic-timeline">
              {milestones.map(([year, title, description]) => (
                <div className="clinic-timeline-item" key={year}>
                  <strong>{year}</strong><div><h3>{title}</h3><p>{description}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="clinic-section clinic-technology">
        <div className="container">
          <div className="clinic-section-heading centered">
            <div>
              <span className="clinic-kicker">Trang thiết bị và kỹ thuật</span>
              <h2>Công nghệ phục vụ chẩn đoán và theo dõi điều trị</h2>
            </div>
          </div>
          <div className="clinic-technology-grid">
            <div><strong>01</strong><h3>Chẩn đoán hình ảnh</h3><p>Hỗ trợ bác sĩ đánh giá tình trạng trước khi lên kế hoạch điều trị.</p></div>
            <div><strong>02</strong><h3>Quản lý hồ sơ số</h3><p>Kết quả khám được lưu để theo dõi điều trị và tái khám thuận tiện.</p></div>
            <div><strong>03</strong><h3>Quy trình vô khuẩn</h3><p>Dụng cụ và khu vực điều trị được kiểm soát theo từng bước rõ ràng.</p></div>
          </div>
        </div>
      </section>

      <section className="clinic-booking-callout">
        <div className="container clinic-booking-callout-inner">
          <div><span>Sẵn sàng chăm sóc nụ cười của bạn?</span><h2>Đặt lịch ngay trên trang chủ, không cần tạo tài khoản</h2></div>
          <button className="btn" onClick={() => setShowBooking(true)}>Mở form đặt lịch</button>
        </div>
      </section>

      {showBooking && (
        <div className="clinic-booking-modal" role="dialog" aria-modal="true">
          <button className="clinic-modal-backdrop" onClick={closeBooking} aria-label="Đóng form" />
          <div className="clinic-modal-panel">
            <button className="clinic-modal-close" onClick={closeBooking} aria-label="Đóng">×</button>
            <Booking />
          </div>
        </div>
      )}
    </main>
  );
}

export default Home;

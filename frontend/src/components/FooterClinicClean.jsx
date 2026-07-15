import { Link } from "react-router-dom";
import { serviceCategories } from "../data/serviceInfo";
import BrandLogo from "./BrandLogo";

const socials = ["f", "t", "▶", "◎", "Zalo"];

// footer ui (thong tin phong kham va link nhanh)
function FooterClinicClean() {
  return (
    <footer className="clinic-footer clinic-footer-clean">
      <div className="container">
        <div className="clinic-footer-grid">
          <div className="clinic-footer-brand">
            <Link className="clinic-footer-logo" to="/">
              <BrandLogo className="clinic-footer-lotus" />
              <span>
                <strong>Nha khoa V</strong>
                <small>Dental Care Center</small>
              </span>
            </Link>

            <p className="clinic-footer-company">PHÒNG KHÁM NHA KHOA V</p>
            <p className="clinic-footer-slogan">Tận tâm. Rõ ràng. Hiện đại.</p>

            <div className="clinic-footer-socials" aria-label="Mạng xã hội">
              {socials.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>

          <div className="clinic-footer-contact">
            <h3>Liên hệ</h3>
            <p>
              <span>●</span>
              <strong>123 Nguyễn Văn Cừ, phường An Hòa, quận Ninh Kiều, Cần Thơ</strong>
            </p>
            <p>
              <span>☎</span>
              <strong>
                Hotline: <a href="tel:19006899">1900 6899</a>
              </strong>
            </p>
            <p>
              <span>✉</span>
              <strong>
                Email: <a href="mailto:support@vdental.vn">support@vdental.vn</a>
              </strong>
            </p>
            <p>
              <span>◷</span>
              <strong>Thứ 3 - Chủ nhật: 8h00 - 20h00</strong>
            </p>
          </div>

          <div className="clinic-footer-links">
            <h3>Thông tin</h3>
            <Link to="/about">Về phòng khám</Link>
            <Link to="/about#about-doctors">Đội ngũ bác sĩ</Link>
            <Link to="/about#about-facilities">Cơ sở vật chất</Link>
            <Link to="/pricing">Bảng giá dịch vụ</Link>
            <Link to="/chatbot">Hỏi đáp nha khoa</Link>
          </div>

          <div className="clinic-footer-links">
            <h3>Dịch vụ</h3>
            {serviceCategories.slice(0, 5).map((service) => (
              <Link to={`/services/${service.slug}`} key={service.slug}>
                {service.title}
              </Link>
            ))}
          </div>
        </div>

        <div className="clinic-footer-bottom">
          <span>© 2026 Nha khoa V. All rights reserved.</span>
          <span>Chăm sóc răng miệng rõ ràng trong từng lần hẹn.</span>
        </div>
      </div>
    </footer>
  );
}

export default FooterClinicClean;

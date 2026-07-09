import { Link, Navigate, useParams } from "react-router-dom";
import { findPromotionBySlug, promotions } from "../data/promotions";
import "../home-landing.css";

function PromotionDetail() {
  const { slug } = useParams();
  const promotion = findPromotionBySlug(slug);

  if (!promotion) {
    return <Navigate to="/" replace />;
  }

  const relatedPromotions = promotions.filter((item) => item.slug !== slug);

  return (
    <main className="clinic-home-v2">
      <section className="promotion-detail-hero">
        <img src={promotion.image} alt={promotion.title} />
        <div className="promotion-detail-hero-overlay" />
        <div className="container promotion-detail-hero-content">
          <span>{promotion.campaign}</span>
          <h1>{promotion.title}</h1>
          <p>{promotion.shortDescription}</p>
          <div className="promotion-detail-pill-row">
            <strong>{promotion.badge}</strong>
            <small>{promotion.priceNote}</small>
          </div>
        </div>
      </section>

      <section className="clinic-section-v2 promotion-detail-section">
        <div className="container promotion-detail-grid">
          <article className="promotion-detail-main">
            <span className="promotion-detail-kicker">{promotion.category}</span>
            <h2>{promotion.highlight}</h2>
            <p>{promotion.details}</p>

            <div className="promotion-benefit-grid">
              {promotion.benefits.map((benefit, index) => (
                <div className="promotion-benefit-card" key={benefit}>
                  <strong>{String(index + 1).padStart(2, "0")}</strong>
                  <p>{benefit}</p>
                </div>
              ))}
            </div>
          </article>

          <aside className="promotion-detail-sidebar">
            <h3>Điều kiện áp dụng</h3>
            <ul>
              {promotion.conditions.map((condition) => (
                <li key={condition}>{condition}</li>
              ))}
            </ul>

            <Link className="clinic-primary-btn" to="/?booking=open">
              Đặt lịch nhận ưu đãi
            </Link>
          </aside>
        </div>
      </section>

      <section className="promotion-related-section">
        <div className="container">
          <div className="clinic-heading-v2">
            <div>
              <span>Ưu đãi khác</span>
              <h2>Các chương trình đang áp dụng</h2>
            </div>
            <Link to="/">Về trang chủ →</Link>
          </div>

          <div className="promotion-related-grid">
            {relatedPromotions.map((item) => (
              <Link className="promotion-related-card" to={`/promotions/${item.slug}`} key={item.slug}>
                <img src={item.image} alt={item.title} />
                <div>
                  <span>{item.campaign}</span>
                  <h3>{item.title}</h3>
                  <p>{item.badge}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default PromotionDetail;

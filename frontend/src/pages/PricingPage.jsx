import { priceGroups } from "../data/priceData";
import BrandLogo from "../components/BrandLogo";
import "../home-landing.css";

// pricing page (bang gia cong khai)
function PricingPage() {
  return (
    <main className="clinic-home-v2">
      <section className="clinic-pricing-banner-v2">
        <div className="container clinic-pricing-banner-v2-inner">
          <div className="clinic-pricing-brand-v2">
            <BrandLogo className="clinic-pricing-logo-v2" />
            <div>
              <strong>Phòng khám nha khoa V</strong>
              <small>Chăm sóc nha khoa rõ ràng, hiện đại và thân thiện</small>
            </div>
          </div>

          <div className="clinic-pricing-title-v2">
            <h1>Bảng giá dịch vụ</h1>
            <p>
              Chi phí các nhóm dịch vụ nha khoa phổ biến. Giá thực tế có thể
              thay đổi theo tình trạng răng, phim chụp, vật liệu và kế hoạch
              điều trị sau khi bác sĩ thăm khám.
            </p>
          </div>
        </div>
      </section>

      <section className="clinic-section-v2 clinic-pricing-v2">
        <div className="container">
          <div className="clinic-pricing-summary-v2 compact">
            <p>
              Bảng giá được chia theo từng nhóm điều trị để khách hàng dễ xem:
              tổng quát, implant, niềng răng, thẩm mỹ phục hình và nha khoa trẻ em.
            </p>
          </div>

          <div className="clinic-price-v2-stack">
            {priceGroups.map((group) => (
              <article className="clinic-price-v2-block" key={group.title}>
                <div className="clinic-price-v2-intro">
                  <h3>{group.title}</h3>
                  <p>{group.description}</p>
                </div>

                <div className="clinic-price-v2-table-wrap">
                  <table className="clinic-price-v2-table">
                    <thead>
                      <tr>
                        <th>Dịch vụ</th>
                        <th>Chi phí (VNĐ)</th>
                        <th>Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.rows.map(([name, price, note]) => (
                        <tr key={`${group.title}-${name}`}>
                          <td>{name}</td>
                          <td>{price}</td>
                          <td>{note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default PricingPage;

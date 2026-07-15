import { Link, Navigate, useParams } from "react-router-dom";
import { findServiceCategoryBySlug, serviceCategories } from "../data/serviceInfo";

// service article content (noi dung chi tiet dich vu)
const articleContent = {
  implant: {
    overview: [
      "Implant là phương pháp phục hồi răng mất bằng cách đặt một trụ titanium vào xương hàm để thay thế chân răng. Sau giai đoạn tích hợp xương, bác sĩ sẽ phục hình mão răng sứ phía trên để khôi phục hình dáng và khả năng ăn nhai.",
      "Điểm quan trọng của Implant là không nên quyết định chỉ dựa trên tên hãng trụ. Một ca Implant phù hợp cần xem xét xương hàm, nướu, vị trí mất răng, bệnh nền, thói quen vệ sinh và kế hoạch phục hình lâu dài.",
    ],
    signs: [
      "Mất một hoặc nhiều răng làm khó ăn nhai, phát âm hoặc ảnh hưởng thẩm mỹ.",
      "Mất răng lâu ngày, răng bên cạnh có xu hướng nghiêng hoặc vùng mất răng bị tiêu xương.",
      "Không thoải mái với hàm tháo lắp và muốn tìm phương án cố định hơn.",
    ],
    prepare: [
      "Mang theo phim chụp cũ nếu có, đặc biệt là phim toàn cảnh hoặc CT Cone Beam.",
      "Thông báo với bác sĩ các bệnh nền như tiểu đường, tim mạch, huyết áp hoặc thuốc đang sử dụng.",
      "Dự trù thời gian điều trị theo giai đoạn, vì Implant thường cần theo dõi tích hợp xương trước khi phục hình cuối cùng.",
    ],
    faq: [
      ["Implant có đau không?", "Khi đặt trụ, bác sĩ thường gây tê tại chỗ nên cảm giác đau trong lúc làm được kiểm soát. Sau điều trị có thể ê, sưng nhẹ vài ngày tùy cơ địa và độ khó của ca."],
      ["Vì sao giá Implant chênh lệch nhiều?", "Giá phụ thuộc dòng trụ, mão sứ, tình trạng xương hàm, có cần ghép xương/nâng xoang hay không và kế hoạch phục hình."],
    ],
  },
  "nieng-rang": {
    overview: [
      "Niềng răng là quá trình dùng lực kéo có kiểm soát để di chuyển răng về vị trí phù hợp hơn, đồng thời cải thiện khớp cắn và chức năng ăn nhai. Phương pháp có thể dùng mắc cài kim loại, mắc cài sứ, tự buộc hoặc khay trong.",
      "Một kế hoạch chỉnh nha tốt không chỉ làm răng đều hơn mà còn cần quan tâm đến khuôn mặt, đường cười, khớp cắn, sức khỏe nướu và khả năng duy trì kết quả sau khi tháo khí cụ.",
    ],
    signs: [
      "Răng hô, móm, thưa, chen chúc hoặc lệch lạc gây thiếu tự tin khi cười.",
      "Cắn sâu, cắn hở, cắn chéo hoặc ăn nhai không đều hai bên.",
      "Trẻ đang thay răng có dấu hiệu lệch hàm, mọc răng sai vị trí hoặc thói quen xấu ảnh hưởng khớp cắn.",
    ],
    prepare: [
      "Cần khám, chụp phim và lấy dữ liệu răng trước khi bác sĩ lập phác đồ.",
      "Nên hỏi rõ thời gian dự kiến, số lần tái khám, loại khí cụ và chi phí phát sinh nếu có.",
      "Trong quá trình niềng cần vệ sinh kỹ, tái khám đúng lịch và tuân thủ hướng dẫn đeo thun/khay.",
    ],
    faq: [
      ["Niềng răng mất bao lâu?", "Thường kéo dài từ nhiều tháng đến vài năm tùy mức độ lệch răng, tuổi, loại khí cụ và mức độ hợp tác của khách hàng."],
      ["Khay trong có thay thế mắc cài được không?", "Khay trong phù hợp với nhiều trường hợp nhưng không phải tất cả. Bác sĩ cần khám và phân tích phim để tư vấn phương án phù hợp."],
    ],
  },
  "nha-khoa-tong-quat": {
    overview: [
      "Nha khoa tổng quát là nhóm chăm sóc nền tảng gồm khám răng định kỳ, cạo vôi, trám răng, chữa tủy, nhổ răng và xử lý các bệnh lý răng miệng thường gặp. Đây là bước quan trọng trước khi làm thẩm mỹ, Implant hoặc chỉnh nha.",
      "Khám tổng quát giúp phát hiện sớm sâu răng, viêm nướu, mảng bám, răng khôn hoặc các tổn thương nhỏ trước khi chúng trở thành điều trị phức tạp và tốn kém hơn.",
    ],
    signs: [
      "Đau răng, ê buốt, nhức khi ăn nhai hoặc đau về đêm.",
      "Chảy máu chân răng, hôi miệng, nướu sưng đỏ hoặc có nhiều vôi răng.",
      "Có lỗ sâu, mẻ răng, thức ăn mắc vào kẽ răng hoặc răng khôn gây khó chịu.",
    ],
    prepare: [
      "Mô tả rõ vị trí đau, thời gian đau, yếu tố làm đau tăng hoặc giảm.",
      "Không tự dùng thuốc kéo dài nếu đau/sưng nhiều; nên đặt lịch khám sớm.",
      "Sau điều trị nên giữ lịch tái khám và vệ sinh định kỳ để tránh tái phát.",
    ],
    faq: [
      ["Bao lâu nên cạo vôi răng?", "Thông thường khoảng 6 tháng/lần, nhưng người dễ viêm nướu, nhiều vôi răng hoặc đang chỉnh nha có thể cần lịch gần hơn."],
      ["Sâu răng khi nào phải chữa tủy?", "Khi sâu lan gần tủy hoặc vào tủy, gây đau tự phát, đau về đêm hoặc nhiễm khuẩn, bác sĩ có thể chỉ định điều trị tủy trước khi phục hồi thân răng."],
    ],
  },
  "nha-khoa-tham-my": {
    overview: [
      "Nha khoa thẩm mỹ tập trung cải thiện màu sắc, hình dáng, kích thước và sự hài hòa của nụ cười. Các lựa chọn thường gặp gồm tẩy trắng răng, dán sứ Veneer, bọc răng sứ hoặc phục hình thẩm mỹ.",
      "Một kế hoạch thẩm mỹ tốt cần cân bằng giữa đẹp và bảo tồn răng thật. Không phải trường hợp nào cũng cần bọc sứ; nhiều khách chỉ cần tẩy trắng, chỉnh nha nhẹ hoặc phục hồi ít xâm lấn hơn.",
    ],
    signs: [
      "Răng đổi màu, nhiễm màu, mòn cạnh, mẻ vỡ hoặc hình thể không hài hòa.",
      "Răng sau chữa tủy bị yếu, đổi màu hoặc cần phục hồi thân răng.",
      "Muốn cải thiện nụ cười nhưng còn phân vân giữa tẩy trắng, Veneer, răng sứ hoặc chỉnh nha.",
    ],
    prepare: [
      "Nên điều trị sâu răng, viêm nướu hoặc bệnh lý nền trước khi làm thẩm mỹ.",
      "Trao đổi rõ mong muốn về màu răng, dáng răng và mức độ tự nhiên.",
      "Hỏi bác sĩ về mức độ mài răng, tuổi thọ phục hình và cách chăm sóc sau điều trị.",
    ],
    faq: [
      ["Bọc răng sứ có hại không?", "Nếu đúng chỉ định và thực hiện đúng kỹ thuật, răng sứ có thể phục hồi ăn nhai và thẩm mỹ. Nếu lạm dụng hoặc mài răng quá nhiều, răng thật có thể bị ảnh hưởng."],
      ["Tẩy trắng răng có ê không?", "Một số người có thể ê nhẹ sau tẩy trắng. Bác sĩ sẽ kiểm tra men răng, nướu và hướng dẫn chăm sóc để giảm khó chịu."],
    ],
  },
  "nha-khoa-tre-em": {
    overview: [
      "Nha khoa trẻ em tập trung theo dõi răng sữa, răng vĩnh viễn mới mọc, phòng ngừa sâu răng và giúp trẻ hình thành thói quen chăm sóc răng miệng tốt từ sớm.",
      "Khám răng cho trẻ không chỉ là xử lý khi đau. Bác sĩ còn đánh giá cách mọc răng, nguy cơ sâu răng, thói quen ăn uống, vệ sinh và các dấu hiệu cần can thiệp sớm như lệch mọc hoặc mất răng sữa sớm.",
    ],
    signs: [
      "Trẻ kêu đau răng, nhai một bên, hôi miệng hoặc có đốm đen/trắng bất thường trên răng.",
      "Nướu sưng, răng sữa lung lay sớm, răng mọc lệch hoặc trẻ sợ đánh răng.",
      "Phụ huynh muốn kiểm tra định kỳ, bôi Fluor, trám răng sữa hoặc theo dõi thay răng.",
    ],
    prepare: [
      "Nên nói với trẻ rằng đi khám là để bác sĩ đếm răng và hướng dẫn chải răng, tránh dọa trẻ.",
      "Mang theo thông tin dị ứng thuốc, bệnh nền hoặc trải nghiệm nha khoa trước đó của trẻ nếu có.",
      "Sau khám, phụ huynh cần duy trì chải răng, hạn chế đồ ngọt dính và đưa trẻ tái khám theo hẹn.",
    ],
    faq: [
      ["Răng sữa sâu có cần chữa không?", "Có. Răng sữa giữ vai trò ăn nhai, phát âm và giữ chỗ cho răng vĩnh viễn. Sâu răng sữa nặng có thể đau, nhiễm trùng và ảnh hưởng răng sau này."],
      ["Trẻ mấy tuổi nên đi khám răng?", "Trẻ nên được kiểm tra sớm khi có răng sữa và tái khám định kỳ. Nếu có đau, sâu răng hoặc mọc răng bất thường thì nên đi khám ngay."],
    ],
  },
};

// service detail page (bai viet tung dich vu)
function ServiceDetail() {
  const { slug } = useParams();
  const service = findServiceCategoryBySlug(slug);

  if (!service) {
    return <Navigate to="/services" replace />;
  }

  // related services (goi y dich vu lien quan)
  const relatedServices = serviceCategories.filter((item) => item.slug !== service.slug).slice(0, 3);
  const article = articleContent[service.slug];

  return (
    <main className={`service-detail-page service-detail-${service.accent}`}>
      <section className="service-detail-hero">
        <div className="container service-detail-hero-inner">
          <div className="service-detail-copy">
            <Link className="service-detail-back" to="/services">
              ← Tất cả dịch vụ
            </Link>
            <span>{service.eyebrow}</span>
            <h1>{service.title}</h1>
            <p>{service.summary}</p>

            <div className="service-detail-actions">
              <Link to="/?booking=open">Đặt lịch tư vấn</Link>
              <Link to="/pricing">Xem bảng giá</Link>
            </div>
          </div>

          <div className="service-detail-media">
            <img src={service.image} alt={service.title} />
          </div>
        </div>
      </section>

      <section className="service-detail-section">
        <div className="container service-detail-grid">
          <article className="service-detail-panel">
            <span className="service-detail-panel-label">Điểm nổi bật</span>
            <h2>Khách hàng nên biết gì trước khi đặt lịch?</h2>
            <div className="service-detail-chip-list">
              {service.highlights.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
            <p>{service.note}</p>
          </article>

          <article className="service-detail-panel">
            <span className="service-detail-panel-label">Phù hợp với ai</span>
            <h2>Dịch vụ này thường dành cho</h2>
            <ul>
              {service.suitableFor.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      {article && (
        <section className="service-detail-section service-article-section">
          <div className="container service-article-layout">
            <article className="service-article-main">
              <span className="service-detail-panel-label">Tìm hiểu chuyên sâu</span>
              <h2>{service.title} là gì và vì sao khách hàng nên tìm hiểu trước?</h2>
              {article.overview.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}

              <h3>Khi nào nên đặt lịch kiểm tra?</h3>
              <ul>
                {article.signs.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>

              <h3>Khách hàng cần chuẩn bị gì?</h3>
              <ul>
                {article.prepare.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <aside className="service-article-faq">
              <span className="service-detail-panel-label">Câu hỏi thường gặp</span>
              {article.faq.map(([question, answer]) => (
                <div className="service-faq-item" key={question}>
                  <h3>{question}</h3>
                  <p>{answer}</p>
                </div>
              ))}
              <Link to="/chatbot">Hỏi thêm chatbot AI</Link>
            </aside>
          </div>
        </section>
      )}

      <section className="service-detail-section service-detail-process-wrap">
        <div className="container">
          <div className="service-detail-heading">
            <span>Quy trình tư vấn</span>
            <h2>Từ tìm hiểu dịch vụ đến thăm khám tại phòng khám</h2>
          </div>

          <div className="service-detail-process">
            {service.process.map((item, index) => (
              <article key={item}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{item}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="service-detail-section">
        <div className="container">
          <div className="service-detail-heading">
            <span>Dịch vụ liên quan</span>
            <h2>Khám phá thêm các nhóm điều trị khác</h2>
          </div>

          <div className="service-related-grid">
            {relatedServices.map((item) => (
              <Link className="service-related-card" to={`/services/${item.slug}`} key={item.slug}>
                <img src={item.image} alt={item.title} />
                <span>{item.eyebrow}</span>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default ServiceDetail;

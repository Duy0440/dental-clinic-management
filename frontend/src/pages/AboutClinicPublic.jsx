import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "../about-clinic-public.css";

const missionCards = [
  {
    title: "Sứ mệnh",
    text: "Giúp khách hàng hiểu đúng tình trạng răng miệng, được tư vấn rõ ràng và chọn phương án điều trị phù hợp thay vì quyết định theo cảm tính.",
  },
  {
    title: "Định hướng",
    text: "Xây dựng phòng khám nha khoa hiện đại, có đặt lịch online, hồ sơ điều trị và quy trình theo dõi sau khám minh bạch.",
  },
  {
    title: "Cam kết",
    text: "Ưu tiên bảo tồn răng thật khi còn khả năng, giải thích chi phí trước điều trị và không hứa hẹn quá mức khi chưa thăm khám.",
  },
];

const serviceGroups = [
  "Nha khoa tổng quát",
  "Cấy ghép Implant",
  "Chỉnh nha - niềng răng",
  "Nha khoa trẻ em",
  "Phục hình thẩm mỹ",
  "Chăm sóc dự phòng",
];

const standards = [
  {
    title: "Pháp lý rõ ràng",
    text: "Thông tin hoạt động, phạm vi chuyên môn và bác sĩ phụ trách được trình bày rõ để khách hàng dễ kiểm tra.",
  },
  {
    title: "Tư vấn trước điều trị",
    text: "Khách được giải thích tình trạng răng miệng, phương án điều trị, ưu nhược điểm và chi phí dự kiến.",
  },
  {
    title: "Vô trùng dụng cụ",
    text: "Dụng cụ được phân loại, đóng gói, hấp tiệt trùng bằng nồi hấp Class B và chuẩn bị theo từng ca.",
  },
  {
    title: "Theo dõi sau khám",
    text: "Lịch hẹn, kết quả điều trị, hình ảnh và lịch tái khám được lưu lại để khách dễ theo dõi khi quay lại.",
  },
];

const doctors = [
  {
    name: "BS. Trần Văn A",
    specialty: "Nha khoa tổng quát",
    image: "/images/home-doctor-01.png",
    text: "Thăm khám ban đầu, đọc phim và tư vấn hướng điều trị cho các bệnh lý răng miệng thường gặp.",
  },
  {
    name: "BsCKI. Huỳnh Văn A",
    specialty: "Implant - phục hình",
    image: "/images/home-doctor-02.png",
    text: "Đánh giá mất răng, xương hàm, phục hình trên implant và lựa chọn vật liệu phù hợp từng trường hợp.",
  },
  {
    name: "BsiCKII. Nguyễn Thị A",
    specialty: "Chỉnh nha thẩm mỹ",
    image: "/images/home-doctor-04.png",
    text: "Tư vấn sai lệch khớp cắn, răng chen chúc, niềng răng mắc cài và khay trong theo từng giai đoạn.",
  },
];

const equipment = [
  {
    title: "CBCT 3 in 1 Hyperion X5",
    label: "Chẩn đoán 3D",
    text: "Thiết bị chụp phim đến từ Italy, hỗ trợ bác sĩ quan sát răng, xương hàm, xoang hàm và vùng cần điều trị trước khi tư vấn.",
    image: "/images/equipment-hyperion-x5-real.png",
    details: ["Hỗ trợ lập kế hoạch implant", "Đánh giá răng khôn, xương hàm", "Tư vấn rõ hơn bằng hình ảnh"],
  },
  {
    title: "Máy Scan Shinning 3D",
    label: "Lấy dấu kỹ thuật số",
    text: "Máy scan trong miệng ghi nhận hình dạng răng bằng dữ liệu số, giúp khách dễ xem tình trạng răng và hỗ trợ phục hình thẩm mỹ.",
    image: "/images/equipment-shining-3d-real.png",
    details: ["Giảm khó chịu khi lấy dấu", "Hỗ trợ răng sứ, veneer, chỉnh nha", "Dễ trao đổi phương án với khách"],
  },
  {
    title: "Vacuclave MELAG 323",
    label: "Khu vô trùng",
    text: "Nồi hấp MELAG của Đức, chuẩn Class B theo EN13060, hỗ trợ quy trình tiệt trùng dụng cụ nha khoa trước khi sử dụng.",
    image: "/images/equipment-melag-vacuclave-real.png",
    details: ["Tiệt trùng dụng cụ sau mỗi lượt", "Đóng gói và lưu trữ riêng", "Tăng kiểm soát an toàn điều trị"],
  },
  {
    title: "Ghế nha khoa Runyess",
    label: "Không gian điều trị",
    text: "Ghế điều trị tích hợp các bộ phận hỗ trợ thao tác, giúp bác sĩ làm việc thuận tiện và khách hàng có tư thế nằm thoải mái hơn.",
    image: "/images/equipment-runyess-chair-real.png",
    details: ["Đèn điều trị và khay dụng cụ", "Tư thế ghế phù hợp khi khám", "Phù hợp nhiều nhóm dịch vụ"],
  },
];

const storyHighlights = [
  ["Tư vấn rõ ràng", "Giải thích tình trạng răng miệng bằng ngôn ngữ dễ hiểu trước khi điều trị."],
  ["Ưu tiên bảo tồn", "Chỉ tư vấn phục hình hoặc can thiệp lớn khi răng thật không còn đáp ứng tốt."],
  ["Theo dõi sau khám", "Lưu lịch hẹn, kết quả điều trị và lịch tái khám để khách dễ quay lại."],
];

const equipmentHighlights = [
  "Chụp phim 3D hỗ trợ xem xương hàm và răng khôn",
  "Scan kỹ thuật số giúp giảm khó chịu khi lấy dấu",
  "Tiệt trùng dụng cụ theo quy trình riêng",
  "Ghế điều trị bố trí thuận tiện cho bác sĩ và khách",
];

function AboutClinicPublic() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const target = document.querySelector(location.hash);
    if (target) {
      setTimeout(() => target.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    }
  }, [location.hash]);

  return (
    <div className="about-public-page">
      <section className="about-public-hero">
        <div className="about-public-container about-public-hero-grid">
          <div>
            <span className="about-public-kicker">Về Nha khoa V</span>
            <h1>Chăm sóc răng miệng rõ ràng, an toàn và tận tâm</h1>
            <p>
              Nha khoa V là phòng khám nha khoa tại Cần Thơ, tập trung vào thăm khám kỹ,
              tư vấn dễ hiểu và điều trị theo kế hoạch rõ ràng. Khách hàng có thể tìm hiểu
              dịch vụ, bảng giá, bác sĩ phụ trách và đặt lịch trước khi đến phòng khám.
            </p>
            <div className="about-public-actions">
              <Link to="/?booking=open">Đặt lịch thăm khám</Link>
              <Link to="/services">Xem dịch vụ</Link>
            </div>
          </div>

          <div className="about-public-hero-card">
            <img src="/images/clinic-story-equipment.png" alt="Không gian điều trị tại Nha khoa V" />
            <div>
              <strong>Phòng khám nha khoa V</strong>
              <span>Chăm sóc rõ ràng trong từng lần hẹn</span>
            </div>
          </div>
        </div>

      </section>

      <section className="about-public-story" id="clinic-story">
        <div className="about-public-container about-public-split">
          <div className="about-public-heading">
            <span className="about-public-kicker">Câu chuyện phòng khám</span>
            <h2>Một nơi để khách hàng hiểu đúng trước khi điều trị</h2>
            <div className="about-public-story-highlights">
              {storyHighlights.map(([title, text]) => (
                <article key={title}>
                  <strong>{title}</strong>
                  <span>{text}</span>
                </article>
              ))}
            </div>
          </div>
          <div className="about-public-copy-card">
            <p>
              Nhiều khách hàng đến nha khoa khi răng đã đau, lung lay, mất răng lâu ngày
              hoặc từng điều trị nhưng chưa hiểu rõ mình đang gặp vấn đề gì. Vì vậy, Nha khoa V
              đặt trọng tâm vào việc giải thích tình trạng răng miệng bằng ngôn ngữ dễ hiểu,
              giúp khách hàng biết vì sao cần điều trị và lựa chọn phương án phù hợp.
            </p>
            <p>
              Phòng khám hướng đến phong cách làm việc cẩn thận: kiểm tra trước khi tư vấn,
              ưu tiên bảo tồn răng thật khi còn khả năng, minh bạch chi phí và theo dõi sau điều trị.
              Mục tiêu không chỉ là xử lý một chiếc răng đau, mà là giúp khách hàng chăm sóc nụ cười
              lâu dài hơn.
            </p>
            <div className="about-public-mission-grid">
              {missionCards.map((item) => (
                <article key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="about-public-services">
        <div className="about-public-container about-public-service-grid">
          <div>
            <span className="about-public-kicker">Dịch vụ nha khoa</span>
            <h2>Những nhóm điều trị được khách hàng quan tâm</h2>
            <p>
              Dịch vụ tại phòng khám được chia theo từng nhóm để khách dễ tìm hiểu trước khi đặt lịch.
              Mỗi trường hợp vẫn cần bác sĩ thăm khám trực tiếp, chụp phim khi cần và tư vấn kế hoạch riêng.
            </p>
          </div>
          <div className="about-public-service-list">
            {serviceGroups.map((item, index) => (
              <Link to="/services" key={item}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{item}</strong>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="about-public-standards" id="clinic-license">
        <div className="about-public-container">
          <div className="about-public-heading about-public-center">
            <span className="about-public-kicker">Tiêu chuẩn phòng khám</span>
            <h2>An toàn, minh bạch và có trách nhiệm trong từng bước điều trị</h2>
          </div>
          <div className="about-public-standard-grid">
            {standards.map((item, index) => (
              <article key={item.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="about-public-doctors" id="about-doctors">
        <div className="about-public-container">
          <div className="about-public-doctor-head">
            <div>
              <span className="about-public-kicker">Đội ngũ bác sĩ</span>
              <h2>Bác sĩ phụ trách theo từng chuyên môn</h2>
            </div>
            <p>
              Mỗi nhóm dịch vụ cần cách đánh giá khác nhau. Thông tin bác sĩ được trình bày
              theo chuyên môn để khách hàng dễ tham khảo trước khi đặt lịch.
            </p>
          </div>

          <div className="about-public-doctor-grid">
            {doctors.map((doctor) => (
              <article key={doctor.name}>
                <img src={doctor.image} alt={doctor.name} />
                <div>
                  <span>{doctor.specialty}</span>
                  <h3>{doctor.name}</h3>
                  <p>{doctor.text}</p>
                </div>
              </article>
            ))}
          </div>
          <Link className="about-public-outline-link" to="/#doctor-team">Xem thêm đội ngũ bác sĩ</Link>
        </div>
      </section>

      <section className="about-public-facilities" id="about-facilities">
        <div className="about-public-container about-public-facility-grid">
          <div className="about-public-heading">
            <span className="about-public-kicker">Cơ sở vật chất</span>
            <h2>Thiết bị hỗ trợ chẩn đoán và điều trị</h2>
            <p>
              Phòng khám đầu tư các thiết bị cần thiết để bác sĩ quan sát rõ hơn tình trạng răng miệng,
              giảm cảm giác khó chịu trong quá trình lấy dấu và kiểm soát vô trùng dụng cụ.
            </p>
            <ul className="about-public-equipment-summary">
              {equipmentHighlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="about-public-equipment-list">
            {equipment.map((item) => (
              <article key={item.title}>
                <img src={item.image} alt={item.title} />
                <div>
                  <span>{item.label}</span>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                  <ul>
                    {item.details.map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="about-public-final">
        <div className="about-public-container about-public-final-card">
          <div>
            <span className="about-public-kicker">Nha khoa V</span>
            <h2>Khách hàng hiểu rõ tình trạng răng miệng trước khi quyết định điều trị</h2>
            <p>
              Nếu bạn chưa biết nên bắt đầu từ đâu, hãy đặt lịch thăm khám. Bác sĩ sẽ kiểm tra,
              tư vấn hướng xử lý phù hợp và giải thích chi phí trước khi thực hiện.
            </p>
          </div>
          <Link to="/?booking=open">Đặt lịch tư vấn</Link>
        </div>
      </section>
    </div>
  );
}

export default AboutClinicPublic;

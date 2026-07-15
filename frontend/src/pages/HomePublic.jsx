import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { promotions } from "../data/promotions";
import { serviceCategories } from "../data/serviceInfo";
import Booking from "./Booking";
import "../home-landing.css";
import "../mobile-overrides.css";
import "../equipment-fix.css";

// fallback services (dich vu hien khi api chua tai duoc)
const fallbackServices = [
  {
    id: "consulting",
    service_name: "Khám và tư vấn tổng quát",
    description: "Kiểm tra tình trạng răng miệng, tư vấn hướng điều trị và kế hoạch chăm sóc phù hợp.",
  },
  {
    id: "general",
    service_name: "Nha khoa tổng quát",
    description: "Cạo vôi, trám răng, chữa tủy, nhổ răng và chăm sóc định kỳ.",
  },
  {
    id: "implant",
    service_name: "Trồng răng Implant",
    description: "Tư vấn phục hồi răng mất với nhiều dòng trụ Implant theo nhu cầu và ngân sách.",
  },
  {
    id: "orthodontic",
    service_name: "Niềng răng",
    description: "Điều chỉnh răng lệch, hô, móm hoặc sai khớp cắn bằng mắc cài hoặc khay trong.",
  },
];

const getDoctorInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");

// doctor profile content (noi dung popup bac si)
const doctorShowcaseAssets = [
  {
    image: "/images/home-doctor-01.png",
    badge: "Chuyên sâu Implant",
    experience: "12 năm kinh nghiệm",
    metric: "1.200+ ca tư vấn",
    education: "Định hướng phục hồi răng mất và lập kế hoạch phục hình trên phim chụp.",
    certificates: ["Cấy ghép Implant cơ bản - nâng cao", "Phục hình răng sứ trên Implant", "Kiểm soát vô khuẩn trong phẫu thuật"],
    clinicalFocus:
      "Thường tiếp nhận khách mất răng lâu năm, tiêu xương, cần phục hồi răng hàm hoặc cần đánh giá xương trước khi đặt trụ.",
    consultation:
      "Bác sĩ sẽ xem phim, kiểm tra nướu, giải thích số lượng trụ cần thiết, phương án phục hình và các chi phí có thể phát sinh trước khi điều trị.",
    carePoints: ["Đọc phim CBCT trước khi tư vấn", "Đánh giá mật độ xương và nướu", "Theo dõi lành thương sau phục hình"],
    philosophy: "Ưu tiên giải thích rõ tình trạng xương hàm, chi phí và lộ trình để khách hàng quyết định an tâm.",
  },
  {
    image: "/images/home-doctor-02.png",
    badge: "Chỉnh nha thẩm mỹ",
    experience: "9 năm kinh nghiệm",
    metric: "Theo dõi khớp cắn",
    education: "Tập trung phân tích khớp cắn, đường cười và theo dõi tiến độ chỉnh nha định kỳ.",
    certificates: ["Chỉnh nha mắc cài", "Chỉnh nha thẩm mỹ bằng khay trong", "Phân tích phim sọ nghiêng"],
    clinicalFocus:
      "Phù hợp với khách răng chen chúc, hô, móm, lệch khớp cắn hoặc muốn cải thiện nụ cười theo lộ trình rõ ràng.",
    consultation:
      "Bác sĩ kiểm tra khớp cắn, tư vấn khí cụ phù hợp, thời gian dự kiến và các mốc tái khám để khách hiểu từng giai đoạn.",
    carePoints: ["Phân tích khớp cắn", "Theo dõi tiến độ định kỳ", "Giải thích rõ lộ trình niềng"],
    philosophy: "Mỗi ca chỉnh nha cần được theo dõi đều, minh bạch từng giai đoạn để khách không bị mơ hồ.",
  },
  {
    image: "/images/home-doctor-03.png",
    badge: "Nha khoa tổng quát",
    experience: "8 năm kinh nghiệm",
    metric: "Điều trị nhẹ nhàng",
    education: "Phụ trách khám tổng quát, trám răng, cạo vôi, điều trị đau răng và chăm sóc định kỳ.",
    certificates: ["Điều trị nha khoa tổng quát", "Chẩn đoán bệnh lý răng miệng", "Tư vấn chăm sóc răng tại nhà"],
    clinicalFocus:
      "Tiếp nhận khách đau răng, sâu răng, viêm nướu, ê buốt, cần vệ sinh răng miệng định kỳ hoặc chưa biết nên bắt đầu điều trị từ đâu.",
    consultation:
      "Bác sĩ ưu tiên kiểm tra nguyên nhân, giải thích mức độ bệnh lý và hướng xử lý phù hợp trước khi chuyển sang điều trị chuyên sâu nếu cần.",
    carePoints: ["Khám tổng quát ban đầu", "Tư vấn phòng ngừa tại nhà", "Theo dõi tái khám định kỳ"],
    philosophy: "Khám kỹ từ triệu chứng nhỏ để phát hiện sớm vấn đề, tránh để khách chỉ đến khi đau nặng.",
  },
  {
    image: "/images/home-doctor-04.png",
    badge: "Nha khoa trẻ em",
    experience: "7 năm kinh nghiệm",
    metric: "Tâm lý trẻ nhỏ",
    education: "Theo dõi răng sữa, mọc răng vĩnh viễn, phòng ngừa sâu răng và hướng dẫn phụ huynh chăm sóc trẻ.",
    certificates: ["Nha khoa trẻ em", "Dự phòng sâu răng bằng Fluor", "Giao tiếp và trấn an trẻ khi khám"],
    clinicalFocus:
      "Phù hợp với trẻ sâu răng sữa, mọc răng lệch, đau răng, cần bôi Fluor, trám răng sữa hoặc phụ huynh muốn theo dõi thay răng.",
    consultation:
      "Bác sĩ trao đổi nhẹ nhàng với trẻ, giải thích cho phụ huynh tình trạng răng sữa, mầm răng vĩnh viễn và cách chăm sóc sau buổi khám.",
    carePoints: ["Trấn an trẻ trước khi khám", "Theo dõi thay răng", "Hướng dẫn phụ huynh chăm sóc"],
    philosophy: "Trẻ cần cảm giác an toàn trước, rồi mới điều trị. Một buổi khám tốt là buổi trẻ không còn sợ nha khoa.",
  },
  {
    image: "/images/home-doctor-05.png",
    badge: "Phục hình thẩm mỹ",
    experience: "10 năm kinh nghiệm",
    metric: "Nụ cười tự nhiên",
    education: "Tập trung phục hình răng sứ, veneer, phục hồi hình thể răng và tư vấn thẩm mỹ nụ cười.",
    certificates: ["Phục hình răng sứ thẩm mỹ", "Lựa chọn màu răng và dáng răng", "Bảo tồn mô răng trong phục hình"],
    clinicalFocus:
      "Tư vấn cho khách răng sứ cũ, răng thưa, răng sậm màu, mẻ răng, muốn veneer hoặc phục hình thẩm mỹ nhưng vẫn giữ vẻ tự nhiên.",
    consultation:
      "Bác sĩ đánh giá men răng, khớp cắn, màu răng và mong muốn thẩm mỹ để chọn phương án bảo tồn mô răng tối đa.",
    carePoints: ["Chọn dáng răng theo gương mặt", "Bảo tồn mô răng thật", "Tư vấn màu răng tự nhiên"],
    philosophy: "Thẩm mỹ đẹp là phải tự nhiên, phù hợp gương mặt và vẫn ưu tiên sức khỏe răng thật.",
  },
];

const getDoctorStory = (specialty = "") => {
  const normalized = specialty.toLowerCase();

  if (normalized.includes("implant")) {
    return {
      intro:
        "Tập trung vào phục hồi răng mất, đánh giá phim chụp, xương hàm và kế hoạch phục hình trước khi tư vấn trụ implant phù hợp.",
      strengths: ["Lập kế hoạch phục hình", "Tư vấn dòng trụ", "Theo dõi sau cấy ghép"],
    };
  }

  if (normalized.includes("chỉnh") || normalized.includes("nieng") || normalized.includes("niềng")) {
    return {
      intro:
        "Theo dõi sai lệch khớp cắn, răng chen chúc và nhu cầu thẩm mỹ để tư vấn lộ trình chỉnh nha dễ hiểu cho khách hàng.",
      strengths: ["Phân tích khớp cắn", "Theo dõi tiến độ", "Tư vấn khí cụ phù hợp"],
    };
  }

  if (normalized.includes("trẻ")) {
    return {
      intro:
        "Ưu tiên trải nghiệm nhẹ nhàng cho trẻ, hướng dẫn phụ huynh theo dõi răng sữa, mọc răng và phòng ngừa sâu răng sớm.",
      strengths: ["Chăm sóc răng sữa", "Tâm lý trẻ em", "Hướng dẫn phụ huynh"],
    };
  }

  return {
    intro:
      "Phụ trách thăm khám tổng quát, đánh giá tình trạng răng miệng ban đầu và định hướng khách hàng đến nhóm điều trị phù hợp.",
    strengths: ["Khám tổng quát", "Tư vấn điều trị", "Theo dõi tái khám"],
  };
};

const normalizeDoctorText = (value = "") =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");

const getDoctorShowcaseAsset = (dentist, index) => {
  const name = normalizeDoctorText(dentist.full_name || "");
  const specialty = normalizeDoctorText(dentist.specialty || "");

  if (name.includes("huynh van") || specialty.includes("implant")) {
    return doctorShowcaseAssets[0];
  }

  if (name.includes("nguyen thi") || specialty.includes("chinh")) {
    return doctorShowcaseAssets[1];
  }

  if (name.includes("le van") || specialty.includes("tre em")) {
    return doctorShowcaseAssets[3];
  }

  if (name.includes("tran van")) {
    return {
      ...doctorShowcaseAssets[4],
      badge: "Nha khoa tổng quát",
      experience: "8 năm kinh nghiệm",
      metric: "Tư vấn tổng quát",
      education: doctorShowcaseAssets[2].education,
      certificates: doctorShowcaseAssets[2].certificates,
      clinicalFocus: doctorShowcaseAssets[2].clinicalFocus,
      consultation: doctorShowcaseAssets[2].consultation,
      carePoints: doctorShowcaseAssets[2].carePoints,
      philosophy: doctorShowcaseAssets[2].philosophy,
    };
  }

  if (name.includes("lam van") || specialty.includes("tong quat")) {
    return doctorShowcaseAssets[2];
  }

  return doctorShowcaseAssets[index % doctorShowcaseAssets.length];
};

const buildDoctorProfile = (dentist, index) => {
  const asset = getDoctorShowcaseAsset(dentist, index);
  const story = getDoctorStory(dentist.specialty || "");

  return {
    ...dentist,
    ...asset,
    intro: story.intro,
    strengths: story.strengths,
    specialty: dentist.specialty || "Nha khoa tổng quát",
  };
};

// facility slides (thiet bi va co so vat chat)
const facilitySlides = [
  {
    label: "Phòng điều trị",
    title: "Ghế nha khoa RunTour",
    text: "Ghế điều trị tích hợp đèn, khay dụng cụ và hệ thống tay khoan, giúp bác sĩ thao tác ổn định hơn trong quá trình khám và điều trị.",
    image: "/images/equipment-runyess-chair-real.png",
    specs: ["Đèn và khay dụng cụ", "Thao tác điều trị ổn định", "Không gian khám gọn gàng"],
  },
  {
    label: "Chẩn đoán hình ảnh",
    title: "CBCT 3 in 1 Hyperion X5",
    text: "Thiết bị đến từ Italy, hỗ trợ khảo sát răng, xương hàm, xoang hàm và lập kế hoạch implant hoặc chỉnh nha rõ hơn.",
    image: "/images/equipment-hyperion-x5-real.png",
    specs: ["Hình ảnh 3D/2D/Ceph", "Khảo sát xương hàm", "Hỗ trợ kế hoạch implant"],
  },
  {
    label: "Lấy dấu kỹ thuật số",
    title: "Máy Scan Shinning 3D",
    text: "Ghi nhận dấu răng kỹ thuật số, hỗ trợ tư vấn phục hình, chỉnh nha và giảm khó chịu so với lấy dấu truyền thống.",
    image: "/images/equipment-shining-3d-real.png",
    specs: ["Lấy dấu nhanh", "Dễ quan sát trên màn hình", "Hỗ trợ phục hình thẩm mỹ"],
  },
  {
    label: "Khu vô trùng",
    title: "Vacuclave MELAG 323",
    text: "Nồi hấp MELAG của Đức, chuẩn Class B theo EN13060, hỗ trợ tiệt trùng dụng cụ trước khi sử dụng cho khách hàng.",
    image: "/images/equipment-melag-vacuclave-real.png",
    specs: ["Chuẩn Class B", "Đạt EN13060", "Kiểm soát dụng cụ theo lượt"],
  },
];

const processSteps = [
  ["01", "Tiếp nhận", "Khách đặt lịch online hoặc gọi hotline, lễ tân xác nhận thông tin."],
  ["02", "Thăm khám", "Bác sĩ kiểm tra tình trạng, tư vấn phương án và chi phí dự kiến."],
  ["03", "Điều trị", "Thực hiện dịch vụ theo kế hoạch, cập nhật hồ sơ và hình ảnh nếu có."],
  ["04", "Theo dõi", "Khách xem lịch hẹn, kết quả điều trị và đánh giá dịch vụ sau khi hoàn thành."],
];

const clinicReasons = [
  ["heart", "Tận tâm"],
  ["quality", "Chất lượng"],
  ["clear", "Minh bạch"],
  ["safe", "An toàn"],
  ["modern", "Hiện đại"],
  ["together", "Hết mình"],
];

const ReasonIcon = ({ type }) => {
  const icons = {
    heart: (
      <>
        <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.7A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
        <path d="M9 11h2l1-2 2 5 1-3h2" />
      </>
    ),
    quality: (
      <>
        <path d="M12 3 15 8l6 1-4 4 1 6-6-3-6 3 1-6-4-4 6-1 3-5Z" />
        <path d="m9.5 12 1.7 1.7 3.4-4" />
      </>
    ),
    clear: (
      <>
        <path d="M5 6h14v12H5V6Z" />
        <path d="M8 10h8M8 14h5" />
        <path d="m15 15 2 2 3-4" />
      </>
    ),
    safe: (
      <>
        <path d="M12 4 19 7v5c0 4-3 7-7 8-4-1-7-4-7-8V7l7-3Z" />
        <path d="m9 12 2 2 4-5" />
      </>
    ),
    modern: (
      <>
        <path d="M7 7h10v10H7V7Z" />
        <path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4" />
        <path d="M10 10h4v4h-4z" />
      </>
    ),
    together: (
      <>
        <path d="M8 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM16 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
        <path d="M3 20a5 5 0 0 1 10 0M11 20a5 5 0 0 1 10 0" />
      </>
    ),
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {icons[type]}
    </svg>
  );
};

const formatPrice = (value) => {
  const numericValue = Number(value);

  if (!value || Number.isNaN(numericValue) || numericValue <= 0) {
    return "Tư vấn sau thăm khám";
  }

  return `${numericValue.toLocaleString("vi-VN")} VNĐ`;
};

// home page (trang chu public)
function HomePublic() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeFacilitySlide, setActiveFacilitySlide] = useState(0);
  const [showBooking, setShowBooking] = useState(false);
  const [activeDentists, setActiveDentists] = useState([]);
  const [dentistsLoading, setDentistsLoading] = useState(true);
  const [activeDoctorIndex, setActiveDoctorIndex] = useState(0);
  const [selectedDentist, setSelectedDentist] = useState(null);
  const publicServices = serviceCategories.slice(0, 4);
  const activeFacility = facilitySlides[activeFacilitySlide];

  useEffect(() => {
    const timer = setInterval(
      () => setActiveFacilitySlide((current) => (current + 1) % facilitySlides.length),
      5200,
    );

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    document.body.style.overflow = showBooking || selectedDentist ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [showBooking, selectedDentist]);

  useEffect(() => {
    if (new URLSearchParams(location.search).get("booking") === "open") {
      setShowBooking(true);
    }
  }, [location.search]);

  useEffect(() => {
    let isMounted = true;

    axiosClient
      .get("/dentists/active")
      .then((response) => {
        if (isMounted) {
          setActiveDentists(response.data?.data || []);
        }
      })
      .catch(() => {
        if (isMounted) {
          setActiveDentists([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setDentistsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const totalDoctors = Math.min(activeDentists.length, 5);

    if (totalDoctors > 0 && activeDoctorIndex >= totalDoctors) {
      setActiveDoctorIndex(0);
    }
  }, [activeDentists.length, activeDoctorIndex]);

  const closeBooking = () => {
    setShowBooking(false);

    if (location.search) {
      navigate("/", { replace: true });
    }
  };

  const doctorProfiles = activeDentists.slice(0, 5).map(buildDoctorProfile);

  const goToPreviousDoctor = () => {
    if (!doctorProfiles.length) {
      return;
    }

    setActiveDoctorIndex((current) =>
      current === 0 ? doctorProfiles.length - 1 : current - 1,
    );
  };

  const goToNextDoctor = () => {
    if (!doctorProfiles.length) {
      return;
    }

    setActiveDoctorIndex((current) => (current + 1) % doctorProfiles.length);
  };

  const heroSlide = {
    label: "Nha khoa hiện đại tại Cần Thơ",
    title: "Phòng khám nha khoa V",
    text: "Thăm khám kỹ, tư vấn dễ hiểu và điều trị theo kế hoạch rõ ràng. Nha khoa V đồng hành cùng khách hàng trong chăm sóc răng miệng, phục hình, chỉnh nha và điều trị tổng quát.",
    image: "/images/clinic-hero-care.png",
  };

  return (
    <main className="clinic-home-v2">
      <section className="clinic-hero-v2" aria-label="Thông tin nổi bật">
        <img className="clinic-hero-v2-image" src={heroSlide.image} alt="Không gian chăm sóc nha khoa" />
        <div className="clinic-hero-v2-overlay" />
        <div className="container clinic-hero-v2-inner" key={heroSlide.title}>
          <div className="clinic-hero-v2-copy">
            <span className="clinic-eyebrow-v2">{heroSlide.label}</span>
            <h1>{heroSlide.title}</h1>
            <p>{heroSlide.text}</p>
            <div className="clinic-hero-v2-actions">
              <button className="clinic-primary-btn" type="button" onClick={() => setShowBooking(true)}>
                Đặt lịch thăm khám
              </button>
              <a className="clinic-secondary-btn" href="#clinic-hours">
                Xem lịch làm việc
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="clinic-promise-strip" aria-label="Cam kết hỗ trợ khách hàng">
        <div className="container clinic-promise-strip-inner">
          <article>
            <span className="promise-zero">0%</span>
            <div>
              <strong>Hỗ trợ trả góp</strong>
              <small>Lãi suất 0%</small>
            </div>
          </article>
          <article>
            <span className="promise-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 3v4M17 3v4M5 8h14M6 5h12a2 2 0 0 1 2 2v11a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a2 2 0 0 1 2-2Z" />
                <path d="m9 15 2 2 4-5" />
              </svg>
            </span>
            <div>
              <strong>Trả góp linh hoạt</strong>
              <small>Thủ tục đơn giản</small>
            </div>
          </article>
          <article>
            <span className="promise-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3 19 7v5c0 4.5-2.8 7.4-7 9-4.2-1.6-7-4.5-7-9V7l7-4Z" />
                <path d="M12 8v8M8 12h8" />
              </svg>
            </span>
            <div>
              <strong>Không phát sinh</strong>
              <small>Chi phí rõ ràng</small>
            </div>
          </article>
          <article>
            <span className="promise-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 13a8 8 0 0 1 16 0" />
                <path d="M5 13h3v6H6a2 2 0 0 1-2-2v-2a2 2 0 0 1 1-2ZM19 13h-3v6h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-1-2Z" />
                <path d="M16 19c0 1.1-1.8 2-4 2" />
              </svg>
            </span>
            <div>
              <strong>Hỗ trợ tận tâm</strong>
              <small>Trong suốt liệu trình</small>
            </div>
          </article>
        </div>
      </section>

      <section className="clinic-section-v2" id="clinic-services">
        <div className="container">
          <div className="clinic-heading-v2">
            <div>
              <span>Dịch vụ nha khoa</span>
              <h2>Các nhóm dịch vụ chính khách hàng quan tâm trước khi đặt lịch</h2>
            </div>
            <Link to="/services">Xem tất cả dịch vụ →</Link>
          </div>

          <div className="clinic-service-v2-grid">
            {publicServices.map((service, index) => (
              <article className={`clinic-service-v2-card info-card ${service.accent}`} key={service.slug}>
                <Link className="clinic-service-v2-image" to={`/services/${service.slug}`}>
                  <img src={service.image} alt={service.title} />
                  <span>{String(index + 1).padStart(2, "0")}</span>
                </Link>
                <small>{service.eyebrow}</small>
                <h3>{service.title}</h3>
                <p>{service.summary}</p>
                <div className="clinic-service-v2-actions">
                  <Link to={`/services/${service.slug}`}>Xem thêm</Link>
                  <button type="button" onClick={() => setShowBooking(true)}>
                    Đặt lịch
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="clinic-section-v2 promotion-home-section" id="summer-promotions">
        <div className="container">
          <div className="clinic-heading-v2 centered">
            <div>
              <span>Ưu đãi mùa hè</span>
              <h2>Chương trình đặc biệt cho từng nhu cầu điều trị</h2>
              <p>
                Khách hàng có thể chọn ưu đãi phù hợp trước khi đặt lịch tư vấn:
                phục hồi răng mất, chỉnh nha hoặc chăm sóc tổng quát.
              </p>
            </div>
          </div>

          <div className="promotion-home-grid">
            {promotions.map((promotion) => (
              <Link
                className="promotion-home-card"
                to={`/promotions/${promotion.slug}`}
                key={promotion.slug}
              >
                <img src={promotion.image} alt={promotion.title} />
                <div className="promotion-home-card-overlay" />
                <div className="promotion-home-card-content">
                  <span>{promotion.campaign}</span>
                  <h3>{promotion.title}</h3>
                  <p>{promotion.shortDescription}</p>
                  <strong>{promotion.badge}</strong>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="clinic-hours-v2" id="clinic-hours">
        <div className="container">
          <div className="clinic-heading-v2 centered">
            <div>
              <span>Lịch làm việc</span>
              <h2>Thời gian phục vụ tại Nha khoa V</h2>
              <p>
                Phòng khám nghỉ thứ 2. Từ thứ 3 đến Chủ nhật, khách hàng có thể đặt lịch
                theo ca sáng hoặc ca chiều tùy nhu cầu thăm khám.
              </p>
            </div>
          </div>

          <div className="clinic-hours-v2-card">
            <div className="clinic-hours-v2-closed">
              <span>T2</span>
              <strong>Tạm nghỉ</strong>
              <small>Phòng khám không nhận lịch</small>
            </div>
            <div className="clinic-hours-v2-table">
              <div className="clinic-hours-v2-row heading">
                <span>Ngày</span>
                <strong>Buổi sáng</strong>
                <strong>Buổi chiều</strong>
              </div>
              <div className="clinic-hours-v2-row">
                <span>Thứ 3 - Thứ 6</span>
                <strong>08:00 - 12:00</strong>
                <strong>13:30 - 20:00</strong>
              </div>
              <div className="clinic-hours-v2-row weekend">
                <span>Thứ 7 - Chủ nhật</span>
                <strong>08:00 - 12:00</strong>
                <strong>13:30 - 18:00</strong>
              </div>
            </div>
            <button className="clinic-primary-btn" type="button" onClick={() => setShowBooking(true)}>
              Đặt lịch theo giờ phù hợp
            </button>
          </div>
        </div>
      </section>

      <section className="clinic-reasons-v2">
        <div className="container">
          <div className="clinic-heading-v2 centered">
            <div>
              <span>Giá trị cốt lõi</span>
              <h2>Vì sao nên chọn Nha khoa V?</h2>
            </div>
          </div>

          <div className="clinic-reasons-v2-grid">
            {clinicReasons.map(([icon, title]) => (
              <article key={title}>
                <div className="clinic-reason-v2-icon">
                  <ReasonIcon type={icon} />
                </div>
                <h3>{title}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="clinic-section-v2 clinic-facilities-v2" id="clinic-facilities">
        <div className="container clinic-facilities-v2-grid">
          <div className="clinic-facilities-v2-copy">
            <span>Cơ sở vật chất</span>
            <h2>Không gian điều trị và thiết bị hỗ trợ</h2>
            <p>
              Hệ thống ghế điều trị, chụp phim 3D, scan kỹ thuật số và khu tiệt trùng được bố trí
              thành từng khu riêng để khách hàng hiểu rõ hơn trước khi điều trị.
            </p>
            <div className="clinic-facility-v2-tabs" aria-label="Chọn cơ sở vật chất">
              {facilitySlides.map((item, index) => (
                <button
                  className={index === activeFacilitySlide ? "active" : ""}
                  key={item.title}
                  type="button"
                  onClick={() => setActiveFacilitySlide(index)}
                >
                  <span>{item.label}</span>
                  <strong>{item.title}</strong>
                </button>
              ))}
            </div>
          </div>

          <div className="clinic-facilities-v2-media" aria-live="polite">
            <img
              className={activeFacility.title.includes("RunTour") ? "is-chair-slide" : ""}
              src={activeFacility.image}
              alt={activeFacility.title}
            />
            <div className="clinic-facility-v2-caption">
              <div>
                <span>{activeFacility.label}</span>
                <h3>{activeFacility.title}</h3>
              </div>
              <div>
                <p>{activeFacility.text}</p>
                <ul className="clinic-facility-v2-specs">
                  {activeFacility.specs.map((spec) => (
                    <li key={spec}>{spec}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="clinic-facility-v2-controls">
              <button
                type="button"
                onClick={() =>
                  setActiveFacilitySlide((current) =>
                    current === 0 ? facilitySlides.length - 1 : current - 1,
                  )
                }
                aria-label="Xem cơ sở vật chất trước"
              >
                ‹
              </button>
              <div>
                {facilitySlides.map((item, index) => (
                  <button
                    className={index === activeFacilitySlide ? "active" : ""}
                    key={item.title}
                    type="button"
                    onClick={() => setActiveFacilitySlide(index)}
                    aria-label={`Xem ${item.title}`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() =>
                  setActiveFacilitySlide((current) =>
                    current === facilitySlides.length - 1 ? 0 : current + 1,
                  )
                }
                aria-label="Xem cơ sở vật chất tiếp theo"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="clinic-section-v2 clinic-team-v2" id="doctor-team">
        <div className="container">
          <div className="clinic-heading-v2 centered">
            <div>
              <span>Đội ngũ bác sĩ</span>
              <h2>Chuyên môn vững vàng, đồng hành tận tâm</h2>
              <p>Mỗi bác sĩ phụ trách một nhóm chuyên môn để quá trình tư vấn và điều trị rõ ràng hơn.</p>
            </div>
          </div>

          {dentistsLoading ? (
            <div className="clinic-doctor-v2-empty">Đang tải đội ngũ bác sĩ...</div>
          ) : doctorProfiles.length > 0 ? (
            <div className="clinic-doctor-v2-showcase">
              <button
                className="clinic-doctor-v2-nav previous"
                type="button"
                onClick={goToPreviousDoctor}
                aria-label="Bác sĩ trước"
              >
                ‹
              </button>

              <div className="clinic-doctor-v2-frame">
                <div
                  className="clinic-doctor-v2-track"
                  style={{ transform: `translateX(-${activeDoctorIndex * 100}%)` }}
                >
                  {doctorProfiles.map((dentist) => (
                    <article className="clinic-doctor-v2-slide" key={dentist.id}>
                      <div className="clinic-doctor-v2-portrait">
                        <img src={dentist.image} alt={dentist.full_name} />
                        <span>{dentist.metric}</span>
                      </div>
                      <div className="clinic-doctor-v2-content">
                        <span className="clinic-doctor-v2-badge">{dentist.badge}</span>
                        <h3>{dentist.full_name}</h3>
                        <strong>{dentist.specialty}</strong>
                        <p>{dentist.intro}</p>
                        <div className="clinic-doctor-v2-tags">
                          {dentist.strengths.map((item) => (
                            <span key={item}>{item}</span>
                          ))}
                        </div>
                        <div className="clinic-doctor-v2-actions">
                          <button type="button" onClick={() => setSelectedDentist(dentist)}>
                            Xem hồ sơ bác sĩ
                          </button>
                          <button type="button" onClick={() => setShowBooking(true)}>
                            Đặt lịch tư vấn
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <button
                className="clinic-doctor-v2-nav next"
                type="button"
                onClick={goToNextDoctor}
                aria-label="Bác sĩ tiếp theo"
              >
                ›
              </button>

              <div className="clinic-doctor-v2-dots" aria-label="Chọn bác sĩ">
                {doctorProfiles.map((dentist, index) => (
                  <button
                    className={index === activeDoctorIndex ? "active" : ""}
                    type="button"
                    key={dentist.id}
                    onClick={() => setActiveDoctorIndex(index)}
                    aria-label={`Xem ${dentist.full_name}`}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="clinic-doctor-v2-empty">
              Thông tin đội ngũ bác sĩ đang được cập nhật.
            </div>
          )}
        </div>
      </section>

      <section className="clinic-section-v2 clinic-process-v2" id="clinic-process">
        <div className="container">
          <div className="clinic-heading-v2">
            <div>
              <span>Quy trình thăm khám</span>
              <h2>Quy trình thăm khám rõ ràng từ tư vấn đến tái khám</h2>
            </div>
            <Link to="/chatbot">Hỏi trợ lý tư vấn →</Link>
          </div>

          <div className="clinic-process-v2-grid">
            {processSteps.map(([number, title, text]) => (
              <article key={number}>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="clinic-booking-v2-callout">
        <div className="container clinic-booking-v2-callout-inner">
          <div>
            <span>Sẵn sàng chăm sóc nụ cười của bạn?</span>
            <h2>Đặt lịch ngay trên trang chủ, khách vãng lai vẫn sử dụng được</h2>
          </div>
          <button className="btn" type="button" onClick={() => setShowBooking(true)}>
            Mở form đặt lịch
          </button>
        </div>
      </section>

      {selectedDentist && (
        <div className="clinic-doctor-profile-modal" role="dialog" aria-modal="true">
          <button
            className="clinic-doctor-profile-backdrop"
            type="button"
            onClick={() => setSelectedDentist(null)}
            aria-label="Đóng hồ sơ bác sĩ"
          />
          <article className="clinic-doctor-profile-panel">
            <button
              className="clinic-doctor-profile-close"
              type="button"
              onClick={() => setSelectedDentist(null)}
              aria-label="Đóng"
            >
              ×
            </button>
            <div className="clinic-doctor-profile-media">
              <img src={selectedDentist.image} alt={selectedDentist.full_name} />
              <div>
                <span>{selectedDentist.experience}</span>
                <strong>{selectedDentist.metric}</strong>
              </div>
            </div>
            <div className="clinic-doctor-profile-content">
              <span className="clinic-doctor-v2-badge">{selectedDentist.badge}</span>
              <h2>{selectedDentist.full_name}</h2>
              <p className="clinic-doctor-profile-specialty">{selectedDentist.specialty}</p>
              <p>{selectedDentist.intro}</p>
              <p className="clinic-doctor-profile-philosophy">“{selectedDentist.philosophy}”</p>

              <div className="clinic-doctor-profile-grid">
                <div>
                  <small>Liên hệ</small>
                  <strong>{selectedDentist.phone || "Cập nhật tại phòng khám"}</strong>
                </div>
                <div>
                  <small>Email</small>
                  <strong>{selectedDentist.email || "Chưa cập nhật"}</strong>
                </div>
                <div>
                  <small>Kinh nghiệm</small>
                  <strong>{selectedDentist.experience}</strong>
                </div>
                <div>
                  <small>Trạng thái</small>
                  <strong>Đang nhận lịch</strong>
                </div>
              </div>

              <div className="clinic-doctor-profile-list">
                <h3>Thế mạnh chuyên môn</h3>
                {selectedDentist.strengths.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>

              <div className="clinic-doctor-profile-section">
                <h3>Hồ sơ chuyên môn</h3>
                <p>{selectedDentist.education}</p>
                <ul>
                  {selectedDentist.certificates.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="clinic-doctor-profile-extra">
                <article>
                  <h3>Phụ trách thường gặp</h3>
                  <p>{selectedDentist.clinicalFocus}</p>
                </article>
                <article>
                  <h3>Cách tư vấn</h3>
                  <p>{selectedDentist.consultation}</p>
                </article>
              </div>

              <div className="clinic-doctor-profile-section compact">
                <h3>Điểm khách hàng cần biết</h3>
                <ul>
                  {selectedDentist.carePoints.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <button
                className="clinic-primary-btn"
                type="button"
                onClick={() => {
                  setSelectedDentist(null);
                  setShowBooking(true);
                }}
              >
                Đặt lịch với bác sĩ
              </button>
            </div>
          </article>
        </div>
      )}

      {showBooking && (
        <div className="clinic-booking-v2-modal" role="dialog" aria-modal="true">
          <button
            className="clinic-modal-v2-backdrop"
            type="button"
            onClick={closeBooking}
            aria-label="Đóng form"
          />
          <div className="clinic-modal-v2-panel">
            <button className="clinic-modal-v2-close" type="button" onClick={closeBooking} aria-label="Đóng">
              ×
            </button>
            <Booking />
          </div>
        </div>
      )}
    </main>
  );
}

export default HomePublic;

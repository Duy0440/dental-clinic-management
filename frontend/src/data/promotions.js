export const promotions = [
  {
    slug: "implant-he-rang-chac",
    title: "Implant hè răng chắc",
    category: "Trồng răng Implant",
    campaign: "Ưu đãi mùa hè",
    shortDescription:
      "Hỗ trợ phục hồi răng mất bằng Implant với gói tư vấn, chụp phim và kế hoạch điều trị rõ ràng.",
    image: "/images/promo-implant-summer.png",
    badge: "Giảm đến 20%",
    highlight: "Tặng gói chụp phim và tư vấn Implant",
    priceNote: "Áp dụng cho khách đặt lịch trong mùa hè",
    benefits: [
      "Miễn phí tư vấn kế hoạch phục hồi răng mất.",
      "Hỗ trợ chụp phim đánh giá xương hàm trước khi điều trị.",
      "Ưu đãi theo dòng trụ Implant Hàn Quốc, Pháp, Đức và Thụy Sĩ.",
      "Theo dõi lịch tái khám và hồ sơ điều trị trên hệ thống.",
    ],
    details:
      "Chương trình phù hợp với khách hàng mất răng, cần phục hồi ăn nhai hoặc muốn tư vấn trước khi quyết định loại trụ Implant. Chi phí cuối cùng phụ thuộc vào tình trạng xương hàm, mão sứ và kế hoạch phục hình.",
    conditions: [
      "Ưu đãi không quy đổi thành tiền mặt.",
      "Bác sĩ sẽ tư vấn chi phí sau khi thăm khám trực tiếp.",
      "Có thể kết hợp trả góp tùy chính sách tại thời điểm tư vấn.",
    ],
  },
  {
    slug: "nieng-rang-nu-cuoi-he",
    title: "Niềng răng nụ cười hè",
    category: "Niềng răng",
    campaign: "Ưu đãi chỉnh nha",
    shortDescription:
      "Gói ưu đãi dành cho khách hàng muốn bắt đầu chỉnh nha trong mùa hè với mắc cài hoặc khay trong.",
    image: "/images/promo-orthodontic-summer.png",
    badge: "Trả góp 0%",
    highlight: "Tặng tư vấn chỉnh nha và kế hoạch điều trị",
    priceNote: "Áp dụng cho học sinh, sinh viên và khách hàng mới",
    benefits: [
      "Tư vấn tình trạng răng, khớp cắn và hướng chỉnh nha phù hợp.",
      "Hỗ trợ lập kế hoạch niềng răng theo từng giai đoạn.",
      "Có lựa chọn mắc cài kim loại, mắc cài sứ và khay trong.",
      "Nhắc lịch tái khám và theo dõi tiến độ qua hệ thống.",
    ],
    details:
      "Chương trình hướng tới khách hàng muốn cải thiện răng lệch, hô, móm hoặc sai khớp cắn. Phòng khám tư vấn phương án phù hợp dựa trên mức độ lệch răng, độ tuổi và nhu cầu thẩm mỹ.",
    conditions: [
      "Mức ưu đãi phụ thuộc vào loại khí cụ chỉnh nha.",
      "Cần thăm khám để xác định thời gian điều trị.",
      "Không áp dụng đồng thời với một số chương trình khuyến mãi khác.",
    ],
  },
  {
    slug: "tong-quat-tuoi-sang-mua-he",
    title: "Tổng quát tươi sáng mùa hè",
    category: "Điều trị tổng quát",
    campaign: "Chăm sóc răng miệng",
    shortDescription:
      "Combo chăm sóc răng miệng cơ bản gồm khám, vệ sinh răng và tư vấn điều trị tổng quát.",
    image: "/images/promo-general-summer.png",
    badge: "Từ 100.000đ",
    highlight: "Ưu đãi cạo vôi, trám răng và khám tổng quát",
    priceNote: "Phù hợp cho khách kiểm tra răng định kỳ",
    benefits: [
      "Khám tổng quát và tư vấn tình trạng răng miệng.",
      "Ưu đãi cạo vôi, đánh bóng và chăm sóc nướu.",
      "Tư vấn sớm các vấn đề sâu răng, viêm nướu hoặc ê buốt.",
      "Khách có tài khoản có thể xem lại lịch hẹn và kết quả điều trị.",
    ],
    details:
      "Chương trình phù hợp với khách hàng muốn kiểm tra định kỳ, làm sạch răng hoặc xử lý các vấn đề răng miệng nhẹ trước khi phát sinh điều trị phức tạp.",
    conditions: [
      "Giá có thể thay đổi theo tình trạng thực tế.",
      "Một số điều trị chuyên sâu sẽ được báo giá riêng.",
      "Khuyến khích đặt lịch trước để được sắp xếp giờ khám phù hợp.",
    ],
  },
];

export const findPromotionBySlug = (slug) =>
  promotions.find((promotion) => promotion.slug === slug);

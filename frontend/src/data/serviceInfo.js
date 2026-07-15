// service data (noi dung cac trang dich vu nha khoa)
export const serviceCategories = [
  {
    slug: "implant",
    title: "Trồng răng Implant",
    eyebrow: "Phục hồi răng mất",
    summary:
      "Giải pháp phục hồi răng mất bằng trụ Implant, giúp cải thiện ăn nhai, thẩm mỹ và hạn chế tiêu xương hàm.",
    image: "/images/service-implant-consultation.png",
    accent: "gold",
    highlights: ["Implant DIO, Implant SIC", "Tư vấn phim chụp trước điều trị", "Theo dõi tái khám"],
    suitableFor: [
      "Khách mất một răng, nhiều răng hoặc mất răng lâu ngày.",
      "Khách muốn phục hồi ăn nhai cố định thay vì hàm tháo lắp.",
      "Khách cần tư vấn loại trụ phù hợp với xương hàm và ngân sách.",
    ],
    process: [
      "Khám tổng quát và chụp phim đánh giá xương hàm.",
      "Tư vấn loại trụ, mão sứ và kế hoạch phục hình.",
      "Đặt trụ, theo dõi tích hợp xương và phục hình răng sứ.",
    ],
    note:
      "Chi phí Implant phụ thuộc dòng trụ, tình trạng xương hàm, mão sứ và có cần ghép xương/nâng xoang hay không.",
  },
  {
    slug: "nieng-rang",
    title: "Niềng răng chỉnh nha",
    eyebrow: "Chỉnh nha thẩm mỹ",
    summary:
      "Điều chỉnh răng hô, móm, lệch lạc hoặc sai khớp cắn bằng mắc cài hoặc khay trong theo kế hoạch cá nhân hóa.",
    image: "/images/service-orthodontic-consultation.png",
    accent: "blue",
    highlights: ["Mắc cài kim loại/sứ", "Khay trong", "Theo dõi tiến độ định kỳ"],
    suitableFor: [
      "Khách có răng hô, móm, thưa, chen chúc hoặc lệch khớp cắn.",
      "Học sinh, sinh viên hoặc người đi làm muốn cải thiện nụ cười.",
      "Khách cần so sánh mắc cài và khay trong trước khi quyết định.",
    ],
    process: [
      "Khám, chụp phim và đánh giá khớp cắn.",
      "Lập phác đồ chỉnh nha, dự kiến thời gian và chi phí.",
      "Gắn khí cụ hoặc giao khay, tái khám định kỳ để điều chỉnh lực.",
    ],
    note:
      "Thời gian niềng tùy mức độ lệch răng, độ tuổi, loại khí cụ và mức độ hợp tác trong quá trình tái khám.",
  },
  {
    slug: "nha-khoa-tong-quat",
    title: "Nha khoa tổng quát",
    eyebrow: "Chăm sóc định kỳ",
    summary:
      "Khám, cạo vôi, trám răng, chữa tủy, nhổ răng và xử lý các vấn đề răng miệng thường gặp.",
    image: "/images/service-general-dentistry.png",
    accent: "green",
    highlights: ["Cạo vôi răng", "Trám răng", "Chữa tủy và nhổ răng"],
    suitableFor: [
      "Khách muốn kiểm tra răng định kỳ hoặc vệ sinh răng miệng.",
      "Khách bị sâu răng, ê buốt, viêm nướu hoặc đau răng.",
      "Khách cần xử lý bệnh lý răng miệng trước khi làm thẩm mỹ/phục hình.",
    ],
    process: [
      "Khám tổng quát và ghi nhận triệu chứng.",
      "Tư vấn hướng xử lý: vệ sinh, trám, chữa tủy hoặc nhổ răng nếu cần.",
      "Cập nhật hồ sơ điều trị và lịch tái khám trên hệ thống.",
    ],
    note:
      "Nên kiểm tra răng miệng định kỳ khoảng 6 tháng/lần hoặc sớm hơn nếu có đau, sưng, chảy máu hoặc ê buốt.",
  },
  {
    slug: "nha-khoa-tham-my",
    title: "Nha khoa thẩm mỹ",
    eyebrow: "Nụ cười tự tin",
    summary:
      "Tẩy trắng răng, răng sứ, veneer và phục hình thẩm mỹ giúp cải thiện màu sắc, hình dáng và độ hài hòa nụ cười.",
    image: "/images/service-cosmetic-dentistry.png",
    accent: "rose",
    highlights: ["Tẩy trắng răng", "Răng sứ", "Dán sứ Veneer"],
    suitableFor: [
      "Khách có răng đổi màu, mẻ vỡ, mòn hoặc hình thể chưa hài hòa.",
      "Khách cần phục hồi răng sau chữa tủy hoặc răng vỡ lớn.",
      "Khách muốn tư vấn phương án ít xâm lấn trước khi làm răng sứ.",
    ],
    process: [
      "Đánh giá men răng, nướu, khớp cắn và mong muốn thẩm mỹ.",
      "Tư vấn phương án tẩy trắng, veneer, răng sứ hoặc phục hình phù hợp.",
      "Thực hiện điều trị và hướng dẫn chăm sóc sau phục hình.",
    ],
    note:
      "Không nên lạm dụng bọc sứ khi răng còn khỏe; bác sĩ cần kiểm tra để chọn phương án bảo tồn răng thật tốt nhất.",
  },
  {
    slug: "nha-khoa-tre-em",
    title: "Nha khoa trẻ em",
    eyebrow: "Chăm sóc răng sữa",
    summary:
      "Theo dõi răng sữa, phòng ngừa sâu răng, vệ sinh răng và xử lý các vấn đề răng miệng cho trẻ.",
    image: "/images/service-pediatric-dentistry.png",
    accent: "mint",
    highlights: ["Bôi Fluor", "Trám răng sữa", "Theo dõi mọc răng"],
    suitableFor: [
      "Trẻ cần kiểm tra răng định kỳ hoặc có dấu hiệu sâu răng.",
      "Phụ huynh muốn được hướng dẫn vệ sinh răng miệng cho trẻ.",
      "Trẻ cần theo dõi thay răng, mọc răng lệch hoặc giữ khoảng.",
    ],
    process: [
      "Khám nhẹ nhàng, làm quen ghế nha và đánh giá răng sữa.",
      "Tư vấn vệ sinh, ăn uống, bôi Fluor hoặc trám răng nếu cần.",
      "Hẹn theo dõi định kỳ để phát hiện sớm sâu răng và lệch mọc.",
    ],
    note:
      "Trẻ nên được khám sớm khi đau răng, sưng nướu, sâu răng hoặc răng sữa lung lay bất thường.",
  },
];

// find service (tim dich vu theo slug)
export const findServiceCategoryBySlug = (slug) =>
  serviceCategories.find((service) => service.slug === slug);

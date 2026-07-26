const clinicKnowledge = [
  {
    id: "clinic-hours",
    type: "clinic",
    title: "Giờ làm việc và giờ đặt lịch online",
    content:
      "Nha khoa V làm việc từ Thứ 3 đến Chủ nhật, 08:00-20:00 và nghỉ Thứ 2. Khung giờ nhận lịch online là 08:00-12:00 và 13:30-18:00.",
    keywords: ["giờ làm việc", "mấy giờ", "mở cửa", "đóng cửa", "thứ 2", "đặt lịch"],
    url: "/booking",
  },
  {
    id: "clinic-contact",
    type: "clinic",
    title: "Địa chỉ và liên hệ Nha khoa V",
    content:
      "Địa chỉ: 123 Nguyễn Văn Cừ, phường An Hòa, quận Ninh Kiều, Cần Thơ. Hotline: 1900 6899. Email: support@vdental.vn.",
    keywords: ["địa chỉ", "ở đâu", "hotline", "số điện thoại", "email", "liên hệ"],
    url: "/about",
  },
  {
    id: "clinic-booking",
    type: "clinic",
    title: "Đặt lịch khám tại Nha khoa V",
    content:
      "Khách có thể đặt lịch trực tuyến trên website. Lịch chỉ được ghi nhận trong khung giờ còn trống và cần được phòng khám xác nhận.",
    keywords: ["đặt lịch", "hẹn khám", "khám răng", "chọn nha sĩ"],
    url: "/booking",
  },
];

const faqKnowledge = [
  {
    id: "faq-toothache",
    type: "faq",
    title: "Đau răng và dấu hiệu cần khám",
    content:
      "Đau răng có thể do nhiều nguyên nhân và không thể khẳng định viêm tủy chỉ từ mô tả trực tuyến. Nếu đau kéo dài, đau về đêm, sưng, sốt hoặc có mủ, người bệnh nên khám nha sĩ sớm.",
    keywords: ["đau răng", "nhức răng", "viêm tủy", "sâu răng", "sưng", "sốt"],
    url: "/chatbot",
  },
  {
    id: "faq-medicine",
    type: "faq",
    title: "Thuốc trong điều trị nha khoa",
    content:
      "Chatbot không kê đơn, chỉ định tên thuốc hoặc liều dùng. Thuốc cần được nha sĩ hoặc bác sĩ đánh giá theo tình trạng, tiền sử bệnh, dị ứng và thuốc đang sử dụng.",
    keywords: ["thuốc", "liều", "kê đơn", "kháng sinh", "giảm đau", "uống gì"],
    url: "/booking",
  },
  {
    id: "faq-emergency",
    type: "faq",
    title: "Dấu hiệu răng miệng cần hỗ trợ khẩn cấp",
    content:
      "Khó thở, chảy máu nhiều không cầm, sưng lan nhanh vùng mặt hoặc cổ, sốt cao hay lơ mơ là dấu hiệu cần đi cấp cứu hoặc liên hệ cơ sở y tế ngay.",
    keywords: ["khó thở", "chảy máu nhiều", "sưng mặt", "sưng cổ", "sốt cao", "cấp cứu"],
    url: "/booking",
  },
  {
    id: "faq-scaling",
    type: "faq",
    title: "Cạo vôi răng",
    content:
      "Cạo vôi giúp loại bỏ vôi răng và mảng bám đã cứng hóa. Nha sĩ cần kiểm tra tình trạng nướu và răng trước khi tư vấn tần suất phù hợp.",
    keywords: ["cạo vôi", "lấy cao răng", "vệ sinh răng", "chảy máu nướu"],
    url: "/booking",
  },
  {
    id: "faq-orthodontics",
    type: "faq",
    title: "Niềng răng chỉnh nha",
    content:
      "Niềng răng giúp điều chỉnh răng lệch và sai khớp cắn. Kế hoạch, thời gian và chi phí phụ thuộc tình trạng thực tế sau khi khám và chụp phim nếu cần.",
    keywords: ["niềng răng", "chỉnh nha", "răng hô", "răng móm", "răng lệch"],
    url: "/booking",
  },
  {
    id: "faq-implant",
    type: "faq",
    title: "Trồng răng Implant",
    content:
      "Implant là phương án phục hồi răng mất bằng trụ đặt trong xương hàm. Cần đánh giá xương, nướu, bệnh nền và sức khỏe trước khi lập kế hoạch điều trị.",
    keywords: ["implant", "trồng răng", "mất răng", "cấy ghép"],
    url: "/booking",
  },
];

module.exports = {
  clinicKnowledge,
  faqKnowledge,
};

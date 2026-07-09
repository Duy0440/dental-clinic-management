const SAFETY_MESSAGE =
  "Lưu ý: Thông tin này chỉ mang tính tham khảo, không thay thế chẩn đoán của nha sĩ. Nếu bạn đau nhiều, sưng, chảy máu, sốt hoặc có chấn thương vùng miệng, nên đặt lịch khám sớm.";

const SHORT_SAFETY_MESSAGE =
  "Lưu ý: Nội dung này chỉ để tham khảo, không thay thế chẩn đoán trực tiếp của nha sĩ.";

const defaultSuggestions = [
  "Tôi bị đau răng thì nên làm gì?",
  "Implant Dentium tốt không?",
  "Bọc răng sứ có hại không?",
  "Giá điều trị phụ thuộc vào gì?",
  "Quy trình khám lần đầu gồm những bước nào?",
];

const suggestionGroups = {
  implant: [
    "Implant có đau không?",
    "Implant Dentium tốt không?",
    "Mất răng lâu có làm implant được không?",
    "Giá implant phụ thuộc vào gì?",
  ],
  pain: [
    "Đau răng về đêm có nguy hiểm không?",
    "Đau răng hàm dưới nên làm gì?",
    "Khi nào cần lấy tủy răng?",
    "Tôi muốn đặt lịch khám sớm",
  ],
  looseTooth: [
    "Răng lung lay có giữ lại được không?",
    "Tôi nên xử lý gì trước khi đi khám?",
    "Có cần nhổ răng không?",
    "Tôi muốn đặt lịch khám sớm",
  ],
  trauma: [
    "Răng gãy có trám lại được không?",
    "Mẻ răng có cần bọc sứ không?",
    "Tôi nên làm gì trước khi đến nha khoa?",
    "Tôi muốn đặt lịch khám sớm",
  ],
  bleedingGum: [
    "Chảy máu chân răng có nguy hiểm không?",
    "Có phải do viêm nướu không?",
    "Bao lâu nên cạo vôi răng một lần?",
    "Tôi muốn đặt lịch kiểm tra nướu",
  ],
  porcelain: [
    "Bọc răng sứ có hại không?",
    "Veneer khác bọc sứ thế nào?",
    "Inlay, onlay là gì?",
    "Răng sau chữa tủy có cần bọc sứ không?",
  ],
  rootCanal: [
    "Khi nào cần chữa tủy?",
    "Chữa tủy có đau không?",
    "Răng sau chữa tủy có cần bọc sứ không?",
    "Tôi muốn đặt lịch khám sớm",
  ],
  badBreath: [
    "Hôi miệng có phải do dạ dày không?",
    "Cạo vôi có giảm hôi miệng không?",
    "Chảy máu nướu có gây hôi miệng không?",
    "Tôi muốn đặt lịch kiểm tra",
  ],
  toothCount: [
    "Người lớn có bao nhiêu răng?",
    "Trẻ em có bao nhiêu răng sữa?",
    "Răng khôn mọc khi nào?",
    "Thiếu răng nên xử lý thế nào?",
  ],
  pediatric: [
    "Trẻ mất răng sữa có sao không?",
    "Trẻ sâu răng sữa có cần trám không?",
    "Khi nào trẻ nên đi khám răng?",
    "Tôi muốn đặt lịch cho bé",
  ],
  price: [
    "Xem bảng giá công khai ở đâu?",
    "Vì sao giá thực tế có thể thay đổi?",
    "Có ưu đãi mùa hè không?",
    "Tôi muốn đặt lịch tư vấn",
  ],
  orthodontic: [
    "Niềng răng có đau không?",
    "Niềng răng mất bao lâu?",
    "Mắc cài và khay trong khác gì nhau?",
    "Giá niềng răng phụ thuộc vào gì?",
  ],
  generalCare: [
    "Bao lâu nên cạo vôi răng một lần?",
    "Trám răng có bền không?",
    "Khi nào cần chữa tủy?",
    "Đau răng nên đặt lịch thế nào?",
  ],
  booking: [
    "Khách vãng lai đặt lịch được không?",
    "Lần đầu đi khám cần chuẩn bị gì?",
    "Có thể chọn bác sĩ không?",
    "Tôi muốn đặt lịch tư vấn",
  ],
  serviceOverview: [
    "Implant phù hợp với ai?",
    "Niềng răng mất bao lâu?",
    "Răng sứ dùng để làm gì?",
    "Tôi muốn đặt lịch tư vấn",
  ],
};

const normalizeText = (text) =>
  String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const hasAny = (text, keywords) => keywords.some((keyword) => text.includes(keyword));

const hasPorcelainTerm = (text) =>
  hasAny(text, [
    "rang su",
    "boc su",
    "boc rang",
    "dan su",
    "dan veneer",
    "veneer",
    "mat dan su",
    "boc giap",
    "inlay",
    "onlay",
    "overlay",
    "phuc hinh su",
  ]);

const isPriceQuestion = (text) =>
  hasAny(text, ["gia", "chi phi", "bao nhieu tien", "het bao nhieu", "ton bao nhieu", "bang gia", "khuyen mai", "uu dai"]) ||
  (text.includes("bao nhieu") && hasAny(text, ["tien", "vnd", "dong", "gia", "chi phi"]));

const getConversationText = (history = []) =>
  normalizeText(history.map((item) => item.text).join(" "));

const isGreetingMessage = (text) =>
  /(^|\s)(xin chao|chao|hello|hi|alo|ban oi)(\s|$)/.test(text);

const createAnswer = (mainAnswer) => {
  if (mainAnswer.includes("Lưu ý:")) {
    return mainAnswer;
  }

  return `${mainAnswer}\n\n${SHORT_SAFETY_MESSAGE}`;
};

const createResult = (answer, suggestions = defaultSuggestions) => ({
  answer: createAnswer(answer),
  suggestions,
});

const DENTAL_KNOWLEDGE_CONTEXT = `
Thông tin nền của phòng khám:
- Website cho phép khách đặt lịch online, có thể đặt lịch không cần tài khoản.
- Nếu khách có tài khoản, khách có thể xem lịch đã đặt, kết quả điều trị, ảnh/file đính kèm và đánh giá dịch vụ sau khi hoàn thành.
- Website không hiển thị giá chi tiết ở phần đặt lịch vì chi phí phụ thuộc tình trạng thực tế, vật liệu, chương trình ưu đãi và tư vấn của nha sĩ.
- Lễ tân/admin quản lý lịch hẹn, phân công nha sĩ, lập hóa đơn và hỗ trợ khách hàng.
- Nha sĩ cập nhật hồ sơ điều trị sau khi khám; lễ tân/admin có thể hỗ trợ nhập hồ sơ khi cần.

Kiến thức nha khoa cơ bản:
- Implant: phục hồi răng mất bằng trụ titanium đặt trong xương hàm, cần đánh giá xương hàm, bệnh nền và sức khỏe trước.
- Răng sứ: phục hồi hoặc thẩm mỹ cho răng vỡ lớn, sau chữa tủy, răng mòn nhiều hoặc đổi màu nặng; không nên lạm dụng khi răng còn khỏe.
- Veneer: mặt dán sứ mỏng ở mặt ngoài răng, thường dùng cho thẩm mỹ màu sắc/hình dáng răng, cần đánh giá men răng và khớp cắn trước.
- Inlay/Onlay: miếng trám gián tiếp bằng sứ/composite, dùng khi răng sâu/vỡ lớn hơn trám thường nhưng chưa nhất thiết phải bọc cả mão răng.
- Chữa tủy: dùng khi tủy răng viêm/nhiễm khuẩn; sau chữa tủy răng có thể yếu hơn và cần phục hồi thân răng.
- Đau răng: có thể do sâu răng, viêm nướu, viêm tủy, áp xe, răng khôn hoặc chấn thương; cần khám để xác định nguyên nhân.
- Cạo vôi răng: giúp làm sạch mảng bám/vôi răng, giảm viêm nướu, chảy máu chân răng và hôi miệng.
- Niềng răng: điều chỉnh răng lệch, hô, móm, sai khớp cắn; cần chụp phim và lập kế hoạch điều trị.
- Nhổ răng/răng khôn: cần kiểm tra và có thể cần chụp phim trước; sau nhổ phải chăm sóc đúng hướng dẫn.
- Răng người lớn thường có 28 răng nếu không tính răng khôn, tối đa 32 răng nếu đủ 4 răng khôn. Trẻ em thường có 20 răng sữa.
- Với trẻ em, cần phân biệt mất răng sữa đúng tuổi hay mất răng do sâu/chấn thương; không nên tự nhổ hoặc bỏ qua đau/sưng.
- Implant Dentium/Osstem thường thuộc nhóm implant Hàn Quốc, phổ biến và chi phí dễ tiếp cận hơn một số dòng cao cấp.
- Implant Straumann/Nobel thường thuộc nhóm cao cấp hơn, nhưng lựa chọn loại implant phải dựa vào xương hàm, vị trí mất răng, sức khỏe và kế hoạch phục hình.
- Nguyên tắc tư vấn: ưu tiên bảo tồn răng thật khi còn khả năng giữ; giải thích rõ lợi ích, rủi ro và lựa chọn ít xâm lấn trước khi nói đến phương án tốn kém.
`;

const getTopicFromText = (text) => {
  const mentionedServiceCount = [
    ["implant", "cay ghep", "trong rang"],
    ["nieng rang", "chinh nha", "rang ho", "rang mom", "rang lech"],
    ["rang su", "boc su", "boc rang", "dan su"],
  ].filter((keywords) => hasAny(text, keywords)).length;

  if (
    mentionedServiceCount >= 2 ||
    hasAny(text, [
      "dich vu",
      "cac dich vu",
      "nhung dich vu",
      "co dich vu nao",
      "phong kham co gi",
      "nha khoa co gi",
    ])
  ) {
    return "serviceOverview";
  }

  if (
    hasAny(text, ["bao nhieu cay rang", "bao nhieu rang", "may cai rang", "may rang", "ham rang co bao nhieu", "nguoi lon co bao nhieu rang", "tre em co bao nhieu rang"])
  ) {
    return "toothCount";
  }

  if (
    hasAny(text, ["tre em", "em be", "be bi", "rang sua", "mat rang sua", "rang tre", "nha khoa tre em"]) ||
    (hasAny(text, ["mat rang", "gay rang", "sau rang"]) && hasAny(text, ["be", "tre", "con toi", "chau"]))
  ) {
    return "pediatric";
  }

  if (isPriceQuestion(text)) {
    return "price";
  }

  if (hasAny(text, ["implant", "cay ghep", "trong rang", "dentium", "osstem", "straumann", "nobel"])) {
    return "implant";
  }

  if (hasAny(text, ["nieng rang", "chinh nha", "rang ho", "rang mom", "rang lech", "khay trong", "mac cai"])) {
    return "orthodontic";
  }

  if (hasAny(text, [
    "rang lung lay",
    "lung lay",
    "rung rinh",
    "sap rot",
    "sap roi",
    "muon rot",
    "muon roi",
    "rang yeu",
  ])) {
    return "looseTooth";
  }

  if (hasAny(text, [
    "gay rang",
    "me rang",
    "vo rang",
    "be rang",
    "nut rang",
    "rang bi gay",
    "rang bi me",
    "rang bi vo",
    "rang bi be",
    "bi gay",
    "bi me",
    "bi vo",
    "bi be",
    "gay mot",
    "me mot",
    "vo mot",
    "be mot",
    "gay mieng",
    "me mieng",
    "rot mieng rang",
    "mat mieng rang",
  ])) {
    return "trauma";
  }

  if (hasAny(text, [
    "chay mau chan rang",
    "chay mau nuou",
    "chay mau loi",
    "danh rang bi chay mau",
    "nuou chay mau",
    "loi chay mau",
    "viem nuou",
    "viem loi",
    "sung nuou",
    "sung loi",
  ])) {
    return "bleedingGum";
  }

  if (hasAny(text, ["viem tuy", "chua tuy", "lay tuy", "dieu tri tuy", "tuy rang"])) {
    return "rootCanal";
  }

  if (hasPorcelainTerm(text)) {
    return "porcelain";
  }

  if (hasAny(text, ["hoi mieng", "hoi tho", "mieng hoi", "hoi mieng tai sao", "vi sao hoi mieng"])) {
    return "badBreath";
  }

  if (hasAny(text, ["dau rang", "nhuc rang", "dau ham", "sung nuou", "sung loi"])) {
    return "pain";
  }

  if (hasAny(text, ["cao voi", "lay cao rang", "tram rang", "sau rang", "ve sinh rang", "chay mau chan rang"])) {
    return "generalCare";
  }

  if (hasAny(text, ["dat lich", "hen lich", "kham lan dau", "khach vang lai"])) {
    return "booking";
  }

  return "general";
};

const getTopic = (text, history = []) => {
  const currentTopic = getTopicFromText(text);

  if (currentTopic !== "general") {
    return currentTopic;
  }

  const looksLikeFollowUp = hasAny(text, [
    "tot khong",
    "co tot khong",
    "co dau khong",
    "dau khong",
    "bao lau",
    "mau nao",
    "loai nao",
    "nen chon",
    "co hai khong",
    "co ben khong",
    "bao nhieu",
    "sap rot",
    "sap roi",
    "rung rinh",
    "lung lay",
    "gay rang",
    "me rang",
    "vo rang",
    "be rang",
    "chay mau chan rang",
    "chay mau nuou",
    "viem nuou",
  ]);

  if (!looksLikeFollowUp) {
    return "general";
  }

  return getTopicFromText(getConversationText(history));
};

const findRuleBasedReply = (message, history = []) => {
  const text = normalizeText(message);
  const topic = getTopic(text, history);
  const combinedText = `${getConversationText(history)} ${text}`;

  if (!text) {
    return createResult(
      "Bạn cứ hỏi tự nhiên như đang nhắn cho tư vấn viên nha khoa nhé. Ví dụ: “implant là gì?”, “đau răng hàm dưới có nguy hiểm không?”, “bọc răng sứ có ảnh hưởng răng thật không?”, hoặc “lần đầu đi khám cần chuẩn bị gì?”.",
    );
  }

  if (isGreetingMessage(text)) {
    return createResult(
      "Chào bạn, mình là trợ lý tư vấn nha khoa của Nha khoa V. Bạn cứ hỏi thoải mái như đang nhắn cho phòng khám nhé. Nếu bạn đang đau răng hoặc phân vân dịch vụ nào phù hợp, mình có thể giải thích trước để bạn dễ quyết định có nên đặt lịch không.",
    );
  }

  if (topic === "price") {
    return createResult(
      "Website có trang bảng giá công khai để khách tham khảo trước các nhóm dịch vụ như nha khoa tổng quát, Implant, niềng răng, răng sứ và nha khoa trẻ em. Tuy vậy chi phí thực tế không nên chốt chỉ bằng vài dòng trên website, vì còn phụ thuộc tình trạng răng thật, phim chụp, vật liệu, mức độ khó và chương trình ưu đãi tại thời điểm khám.\n\nVí dụ cùng là implant, người đủ xương và nướu khỏe sẽ khác người mất răng lâu, tiêu xương hoặc cần ghép xương. Vì vậy bảng giá dùng để dự trù ban đầu; giá cuối cùng nên được nha sĩ khám trực tiếp rồi lễ tân lập hóa đơn theo dịch vụ thực tế.",
      suggestionGroups.price,
    );
  }

  if (topic === "serviceOverview") {
    return createResult(
      "Phòng khám hiện có các nhóm dịch vụ chính như khám và tư vấn tổng quát, cạo vôi răng, trám răng, chữa tủy, nhổ răng/răng khôn, trồng răng Implant, niềng răng, răng sứ - thẩm mỹ và nha khoa trẻ em.\n\nNếu bạn chưa biết mình cần dịch vụ nào, bạn chỉ cần mô tả vấn đề đang gặp: đau răng, gãy răng, răng lung lay, hô/móm, mất răng, răng xỉn màu hoặc chảy máu chân răng. Chatbot sẽ giải thích hướng xử lý cơ bản, còn phương án chính xác sẽ do nha sĩ kiểm tra trực tiếp sau khi khám.",
      suggestionGroups.serviceOverview,
    );
  }

  if (topic === "toothCount") {
    return createResult(
      "Người lớn thường có 28 răng nếu không tính răng khôn. Nếu mọc đủ 4 răng khôn thì tổng cộng có thể là 32 răng. Mỗi hàm thường có 14 răng không tính răng khôn, hoặc 16 răng nếu tính đủ 2 răng khôn của hàm đó.\n\nTrẻ em thường có 20 răng sữa, mỗi hàm 10 răng. Nếu bạn hỏi vì đang bị thiếu răng, mất răng hoặc răng mọc lệch, nên khám để biết đó là răng sữa, răng vĩnh viễn hay răng khôn.",
      suggestionGroups.toothCount,
    );
  }

  if (topic === "pediatric") {
    return createResult(
      "Với trẻ em, mất răng cần xem đó là răng sữa hay răng vĩnh viễn. Nếu răng sữa rụng đúng tuổi, thường là quá trình thay răng bình thường. Nhưng nếu răng mất do sâu, té ngã, đau, sưng nướu hoặc rụng quá sớm thì nên đưa bé đi khám để tránh ảnh hưởng mầm răng vĩnh viễn và khoảng mọc răng sau này.\n\nNếu là răng vĩnh viễn bị gãy/mất thì nên khám càng sớm càng tốt. Phụ huynh không nên tự nhổ, tự dán răng hoặc bỏ qua khi bé đau, hôi miệng, chảy máu hay sưng mặt.",
      suggestionGroups.pediatric,
    );
  }

  if (topic === "rootCanal") {
    return createResult(
      "Chữa tủy thường được cân nhắc khi tủy răng bị viêm hoặc nhiễm khuẩn. Dấu hiệu hay gặp là đau tự phát, đau về đêm, đau kéo dài sau khi uống lạnh/nóng, răng sâu lớn, sưng nướu, có mủ hoặc răng từng chấn thương.\n\nKhông phải cứ đau răng là phải chữa tủy. Có trường hợp chỉ cần trám, điều trị nướu hoặc xử lý ê buốt. Nha sĩ cần khám và có thể chụp phim để xem tủy còn hồi phục được không trước khi quyết định.",
      suggestionGroups.rootCanal,
    );
  }

  if (topic === "badBreath") {
    return createResult(
      "Hôi miệng thường gặp do mảng bám, vôi răng, viêm nướu, sâu răng, lưỡi bẩn, khô miệng hoặc thức ăn mắc kẽ răng. Một số trường hợp liên quan dạ dày, xoang họng hoặc thuốc đang dùng, nhưng trong nha khoa thường kiểm tra răng nướu trước vì đây là nguyên nhân rất phổ biến.\n\nBạn có thể vệ sinh lưỡi, dùng chỉ nha khoa, uống đủ nước và cạo vôi/kiểm tra nướu định kỳ. Nếu hôi miệng kéo dài kèm chảy máu nướu, răng lung lay, đau hoặc có lỗ sâu thì nên đặt lịch khám để xử lý nguyên nhân.",
      suggestionGroups.badBreath,
    );
  }

  if (
    hasAny(text, ["dentium", "osstem", "straumann", "nobel", "hang nao", "loai nao"]) ||
    (topic === "implant" && hasAny(text, ["tot khong", "co tot khong", "co ben khong", "nen chon"]))
  ) {
    const brandName = hasAny(combinedText, ["dentium"])
      ? "Dentium"
      : hasAny(combinedText, ["osstem"])
        ? "Osstem"
        : hasAny(combinedText, ["straumann"])
          ? "Straumann"
          : hasAny(combinedText, ["nobel"])
            ? "Nobel"
            : "dòng implant";

    return createResult(
      `${brandName} có thể là lựa chọn tốt nếu phù hợp với tình trạng xương hàm và kế hoạch phục hình của bạn. Nhưng implant không nên chọn chỉ vì tên hãng. Một ca implant bền hay không còn phụ thuộc vào mật độ xương, vị trí mất răng, nướu, bệnh nền, tay nghề bác sĩ, mão sứ phía trên và cách vệ sinh sau khi làm.\n\nNếu bạn hỏi theo hướng “nên chọn loại nào”, câu trả lời đúng là: nên khám, chụp phim trước rồi mới chọn trụ. Với người mất răng lâu hoặc tiêu xương, bác sĩ có thể cần tư vấn thêm về ghép xương/nâng xoang trước khi quyết định loại implant.`,
      suggestionGroups.implant,
    );
  }

  if (topic === "implant" && hasAny(text, ["dau khong", "co dau khong", "nhuc khong"])) {
    return createResult(
      "Lúc đặt trụ implant, nha sĩ thường gây tê tại chỗ nên đa số khách không đau rõ trong lúc thực hiện. Sau khi hết tê, bạn có thể ê, căng hoặc sưng nhẹ vài ngày, mức độ tùy cơ địa và độ khó của ca.\n\nNếu phải ghép xương, nâng xoang hoặc đặt nhiều trụ cùng lúc thì cảm giác sau điều trị có thể nhiều hơn. Vì vậy phòng khám cần khám và chụp phim trước để đánh giá chính xác, không nên tự đoán qua cảm giác đau.",
      suggestionGroups.implant,
    );
  }

  if (topic === "implant" && hasAny(text, ["bao lau", "mat bao lau", "may thang"])) {
    return createResult(
      "Implant thường không hoàn tất trong một buổi. Sau khi đặt trụ, cần thời gian để trụ tích hợp với xương hàm, thường tính bằng vài tháng tùy tình trạng xương và kế hoạch phục hình.\n\nNếu xương tốt, quy trình có thể nhanh hơn. Nếu thiếu xương, viêm nướu hoặc có bệnh nền cần kiểm soát thì thời gian điều trị có thể kéo dài hơn. Đây là lý do nên khám trực tiếp trước khi hứa thời gian cụ thể.",
      suggestionGroups.implant,
    );
  }

  if (topic === "implant") {
    return createResult(
      "Implant hiểu đơn giản là một chân răng nhân tạo. Khi mất răng, nha sĩ có thể đặt một trụ titanium vào xương hàm, sau đó gắn mão răng sứ lên trên để phục hồi ăn nhai và thẩm mỹ.\n\nĐiểm quan trọng là implant không phải cứ mất răng là làm ngay. Nha sĩ cần kiểm tra phim chụp, mật độ xương hàm, tình trạng nướu và các bệnh nền như tiểu đường, huyết áp hoặc thói quen hút thuốc. Nếu xương không đủ, có thể cần ghép xương hoặc điều trị nền trước.",
      suggestionGroups.implant,
    );
  }

  if (topic === "looseTooth" && hasAny(text, ["sap rot", "sap roi", "muon rot", "muon roi"])) {
    return createResult(
      "Nếu bạn cảm giác răng sắp rớt ra thì mình khuyên không nên tự kéo ra ở nhà. Bạn nên đặt lịch khám sớm để nha sĩ kiểm tra răng còn giữ được không và có nhiễm trùng/chấn thương quanh chân răng không.\n\nTrong lúc chờ khám, bạn hạn chế nhai bên đó, đừng dùng tay lay thêm, vệ sinh nhẹ và nếu có sưng, đau nhiều, chảy máu hoặc sốt thì nên đi khám càng sớm càng tốt.",
      suggestionGroups.looseTooth,
    );
  }

  if (topic === "looseTooth") {
    return createResult(
      "Nếu răng đang lung lay hoặc rung rinh như sắp rớt ra, bạn nên đi khám sớm, nhất là khi có đau, sưng nướu, chảy máu, hôi miệng hoặc mới bị va chạm. Tình trạng này có thể liên quan viêm nha chu, tiêu xương quanh răng, nhiễm trùng chân răng, chấn thương hoặc răng sữa đang thay ở trẻ em.\n\nTrong lúc chờ khám, bạn đừng tự kéo/bẻ răng ra, hạn chế nhai bên răng đó và vệ sinh nhẹ nhàng. Khi đến phòng khám, nha sĩ sẽ kiểm tra độ lung lay và có thể chụp phim để xem răng còn giữ được không, cần điều trị nha chu, cố định răng, chữa tủy hay phải nhổ nếu không thể bảo tồn.",
      suggestionGroups.looseTooth,
    );
  }

  if (topic === "trauma" && hasAny(text, ["boc su", "boc rang", "rang su", "veneer"])) {
    return createResult(
      "Mẻ răng chưa chắc đã cần bọc sứ. Nếu mẻ nhỏ và chưa sát tủy, nha sĩ có thể trám thẩm mỹ hoặc mài chỉnh nhẹ. Nếu mẻ lớn, mất nhiều mô răng, đau nhức, lộ tủy hoặc răng đã chữa tủy thì mới cân nhắc bọc sứ, onlay hoặc phương án phục hồi chắc hơn.\n\nBạn nên khám để nha sĩ kiểm tra độ sâu vết mẻ và khớp cắn. Mục tiêu tốt là giữ mô răng thật càng nhiều càng tốt, không vội mài răng nếu chưa cần.",
      suggestionGroups.trauma,
    );
  }

  if (topic === "trauma") {
    return createResult(
      "Nếu răng bị gãy, mẻ hoặc bể một miếng thì bạn nên đi khám sớm để nha sĩ xem phần gãy có vào gần tủy không. Trường hợp nhẹ có thể trám thẩm mỹ; nếu mất mô răng nhiều, đau nhức hoặc lộ tủy thì có thể cần chữa tủy, bọc sứ hoặc phục hồi khác.\n\nTrước khi đến nha khoa, bạn nên tránh nhai bên răng bị gãy, giữ lại mảnh răng nếu còn, súc miệng nhẹ bằng nước sạch và không tự dán/nhét vật lạ vào chỗ gãy. Nếu đau nhiều, chảy máu hoặc gãy do va chạm mạnh thì nên khám càng sớm càng tốt.",
      suggestionGroups.trauma,
    );
  }

  if (topic === "bleedingGum") {
    return createResult(
      "Đánh răng bị chảy máu chân răng thường gặp khi nướu đang viêm, có nhiều mảng bám/vôi răng, chải răng quá mạnh hoặc dùng bàn chải quá cứng. Nếu tình trạng lặp lại nhiều lần, kèm sưng nướu, hôi miệng, đau khi nhai hoặc răng lung lay thì không nên xem nhẹ vì có thể liên quan viêm nướu hoặc nha chu.\n\nTrước mắt bạn nên chải răng nhẹ bằng bàn chải mềm, dùng chỉ nha khoa đúng cách và không tự ngưng vệ sinh vùng đó vì càng để mảng bám lâu nướu càng dễ viêm. Bạn nên đặt lịch kiểm tra để nha sĩ xem có cần cạo vôi răng, vệ sinh nướu hoặc điều trị nha chu không.",
      suggestionGroups.bleedingGum,
    );
  }

  if (topic === "pain") {
    return createResult(
      "Đau răng có thể đến từ nhiều nguyên nhân như sâu răng, viêm nướu, viêm tủy, răng khôn mọc lệch, áp xe quanh chân răng hoặc chấn thương. Nếu đau khi ăn ngọt/lạnh có thể liên quan sâu răng hoặc ê buốt; nếu đau tự phát, đau về đêm, đau lan lên thái dương hoặc sưng mặt thì nên khám sớm.\n\nTrước mắt bạn nên vệ sinh nhẹ nhàng, tránh nhai bên đau và không tự dùng thuốc kéo dài. Khi đặt lịch, bạn nên ghi rõ đau răng nào, đau bao lâu, có sưng/chảy máu/sốt không để phòng khám sắp xếp phù hợp.",
      suggestionGroups.pain,
    );
  }

  if (hasAny(text, ["sau rang", "lo sau", "tram rang", "me rang"])) {
    return createResult(
      "Nếu sâu răng còn nhẹ, nha sĩ thường có thể trám để phục hồi phần răng bị mất. Nếu sâu đã lan gần tủy hoặc vào tủy, có thể cần điều trị tủy trước rồi mới phục hồi thân răng.\n\nBạn nên đi khám sớm nếu có ê buốt, đau khi ăn nhai, lỗ sâu lớn dần hoặc thức ăn hay mắc vào răng.",
      suggestionGroups.generalCare,
    );
  }

  if (topic === "porcelain" && hasAny(text, ["veneer", "inlay", "onlay", "overlay"])) {
    return createResult(
      "Veneer là mặt dán sứ mỏng ở mặt ngoài răng, thường dùng để cải thiện màu sắc, hình dáng hoặc khe thưa nhẹ. Veneer thường ít mài răng hơn bọc mão sứ, nhưng chỉ phù hợp khi men răng, khớp cắn và thói quen ăn nhai cho phép.\n\nInlay và onlay là phục hồi gián tiếp, giống “miếng vá” được làm ngoài miệng rồi gắn vào răng. Inlay thường nằm trong lòng răng; onlay che phủ thêm một hoặc nhiều múi răng. Hai phương án này hay dùng khi răng sâu/vỡ lớn hơn trám thường nhưng chưa cần bọc cả mão răng.\n\nĐiểm quan trọng là không nên chọn veneer, inlay, onlay hay bọc sứ chỉ theo tên dịch vụ. Nha sĩ cần xem răng còn bao nhiêu mô thật, có sâu/tủy không và khớp cắn thế nào để chọn phương án ít xâm lấn nhất.",
      suggestionGroups.porcelain,
    );
  }

  if (topic === "porcelain") {
    return createResult(
      "Bọc răng sứ có thể phù hợp khi răng vỡ lớn, răng sau chữa tủy, răng đổi màu nặng, răng mòn nhiều hoặc cần phục hồi thẩm mỹ. Nhưng không nên xem bọc sứ là giải pháp làm đẹp cho mọi trường hợp.\n\nNếu làm đúng chỉ định, răng sứ giúp phục hồi ăn nhai và thẩm mỹ. Nếu lạm dụng, mài răng quá nhiều hoặc chăm sóc không tốt, có thể gây ê buốt, viêm nướu, hôi miệng hoặc ảnh hưởng răng thật. Vì vậy nên khám trước để xem răng còn khỏe không và có phương án ít xâm lấn hơn không.",
      suggestionGroups.porcelain,
    );
  }

  if (topic === "orthodontic" || hasAny(text, ["nieng rang", "chinh nha", "rang ho", "rang mom", "rang lech"])) {
    return createResult(
      "Niềng răng là phương pháp dùng lực kéo để điều chỉnh răng lệch, hô, móm hoặc sai khớp cắn. Trước khi niềng, nha sĩ cần khám, chụp phim và lập kế hoạch điều trị rõ ràng để chọn mắc cài kim loại, mắc cài sứ, tự buộc hoặc khay trong.\n\nThời gian niềng thường kéo dài từ nhiều tháng đến vài năm tùy tình trạng. Chi phí cũng phụ thuộc mức độ lệch răng, loại khí cụ, số lần tái khám và các điều trị nền nếu có. Điểm quan trọng không chỉ là răng đều hơn, mà còn là khớp cắn và khả năng ăn nhai sau điều trị.",
      suggestionGroups.orthodontic,
    );
  }

  if (hasAny(text, ["nho rang", "rang khon", "tieu phau"])) {
    return createResult(
      "Nhổ răng hoặc tiểu phẫu răng khôn cần được nha sĩ kiểm tra trước, nhiều trường hợp cần chụp phim để xem vị trí chân răng và dây thần kinh.\n\nSau nhổ răng, bạn nên cắn gạc theo hướng dẫn, tránh súc miệng mạnh, không hút thuốc và tái khám nếu đau nhiều, sưng kéo dài hoặc chảy máu bất thường.",
    );
  }

  if (topic === "generalCare" || hasAny(text, ["cao voi", "lay cao rang", "ve sinh rang", "hoi mieng", "chay mau chan rang"])) {
    return createResult(
      "Cạo vôi răng giúp loại bỏ mảng bám và vôi răng, hỗ trợ giảm viêm nướu, hôi miệng và chảy máu chân răng. Thông thường nên kiểm tra răng miệng định kỳ khoảng 6 tháng/lần, nhưng tần suất có thể thay đổi tùy tình trạng từng người.",
      suggestionGroups.generalCare,
    );
  }

  if (topic === "booking" || hasAny(text, ["dat lich", "hen lich", "kham lan dau"])) {
    return createResult(
      "Bạn có thể đặt lịch trực tiếp trên website bằng cách nhập họ tên, số điện thoại, chọn dịch vụ, ngày giờ khám và ghi chú triệu chứng. Khách vãng lai vẫn đặt lịch được, không bắt buộc phải có tài khoản.\n\nNếu bạn tạo tài khoản, sau này có thể xem lại lịch đã đặt, kết quả điều trị, hình ảnh/file đính kèm và đánh giá dịch vụ sau khi hoàn thành. Nếu chưa biết chọn nha sĩ, bạn có thể để phòng khám sắp xếp nha sĩ phù hợp.",
      suggestionGroups.booking,
    );
  }

  if (hasAny(text, ["quy trinh", "quy trinh kham", "kham lan dau", "dieu tri nhu the nao", "tai kham"])) {
    return createResult(
      "Một quy trình thăm khám nha khoa hiện đại thường gồm: tiếp nhận thông tin, khám và tư vấn, lập kế hoạch điều trị, thực hiện điều trị, cập nhật hồ sơ, hẹn tái khám nếu cần và lập hóa đơn theo dịch vụ thực tế.\n\nĐiểm khác của hệ thống mình đang xây là khách có thể đặt lịch online, phòng khám quản lý lịch tập trung, nha sĩ cập nhật kết quả điều trị và khách có tài khoản có thể xem lại hồ sơ sau khi khám.",
    );
  }

  return createResult(
    "Mình chưa nắm hết ý bạn. Bạn nói rõ hơn một chút được không: bạn đang hỏi về triệu chứng đau/ê, dịch vụ điều trị, chi phí hay muốn so sánh phương án nào?\n\nNếu đang khó chịu ở răng, bạn mô tả giúp mình vị trí răng, đau bao lâu và có sưng/chảy máu/sốt không nhé. Mình sẽ giải thích hướng xử lý cơ bản trước khi bạn đặt lịch khám.",
  );
};

const formatHistory = (history = []) =>
  history
    .slice(-6)
    .map((item) => {
      const role = item.role === "bot" ? "Trợ lý" : "Khách hàng";
      return `${role}: ${item.text}`;
    })
    .join("\n");

const buildDentalPrompt = (message, history = []) => {
  const conversationContext = formatHistory(history);

  return `
Bạn là trợ lý tư vấn nha khoa của Nha khoa V.

Vai trò của bạn:
- Trò chuyện tự nhiên như một tư vấn viên nha khoa thân thiện.
- Giải thích kiến thức nha khoa cơ bản bằng ngôn ngữ dễ hiểu.
- Giúp khách hiểu quy trình khám, điều trị, đặt lịch và lý do cần nha sĩ kiểm tra trực tiếp.
- Hỗ trợ marketing bằng cách tạo cảm giác tin tưởng, nhưng không nói quá hoặc cam kết chắc chắn.
- Không thay thế nha sĩ, không chẩn đoán chắc chắn, không kê đơn thuốc.

Nguyên tắc trả lời:
- Luôn trả lời bằng tiếng Việt có dấu.
- Nếu khách hỏi nối tiếp như “tốt không”, “có đau không”, “bao lâu”, hãy dùng ngữ cảnh hội thoại trước đó.
- Nếu khách hỏi về giá, giải thích chi phí phụ thuộc tình trạng thực tế, vật liệu, ưu đãi và sẽ được tư vấn trước khi lập hóa đơn.
- Nếu khách hỏi về hãng implant, tư vấn trung lập, không khẳng định tuyệt đối hãng nào tốt nhất.
- Nếu khách hỏi chưa rõ, hỏi lại tối đa 2 câu ngắn.
- Trả lời khoảng 2 đến 5 đoạn, không lan man.

Kiến thức và ngữ cảnh nội bộ được phép dùng:
${DENTAL_KNOWLEDGE_CONTEXT}

Ngữ cảnh hội thoại gần đây:
${conversationContext || "Chưa có ngữ cảnh trước đó."}

Câu hỏi mới của khách hàng:
${message}
`;
};

const getGeminiReply = async (message, history = []) => {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey || apiKey === "key_cua_ban" || apiKey === "your_gemini_api_key") {
    return null;
  }

  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const prompt = buildDentalPrompt(message, history);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          maxOutputTokens: 700,
        },
      }),
    },
  );

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
};

const generateDentalReply = async (message, history = []) => {
  const normalizedMessage = normalizeText(message);
  const detectedTopic = getTopic(normalizedMessage, history);

  if (!normalizedMessage || isGreetingMessage(normalizedMessage) || detectedTopic !== "general") {
    const safeResult = findRuleBasedReply(message, history);

    return {
      answer: safeResult.answer,
      source: "rule_based",
      suggestions: safeResult.suggestions,
    };
  }

  try {
    const geminiReply = await getGeminiReply(message, history);

    if (geminiReply) {
      return {
        answer: createAnswer(geminiReply),
        source: "gemini",
        suggestions: suggestionGroups[getTopic(normalizeText(message), history)] || defaultSuggestions,
      };
    }
  } catch (error) {
    // Nếu AI API lỗi, hệ thống vẫn dùng bộ tri thức nội bộ để demo không bị đứng.
  }

  const fallbackResult = findRuleBasedReply(message, history);

  return {
    answer: fallbackResult.answer,
    source: "rule_based",
    suggestions: fallbackResult.suggestions,
  };
};

module.exports = {
  generateDentalReply,
};


const SAFETY_MESSAGE =
  "Lưu ý: Thông tin này chỉ mang tính tham khảo, không thay thế chẩn đoán của nha sĩ. Nếu bạn đau nhiều, sưng, chảy máu, sốt hoặc có chấn thương vùng miệng, nên đặt lịch khám sớm.";

const SHORT_SAFETY_MESSAGE =
  "Lưu ý: Nội dung này chỉ để tham khảo, không thay thế chẩn đoán trực tiếp của nha sĩ.";

const defaultSuggestions = [
  "Tôi bị đau răng thì nên làm gì?",
  "Implant Dentium tốt không?",
  "Bọc răng sứ có hại không?",
  "Tẩy trắng răng có ê buốt không?",
  "Giá điều trị phụ thuộc vào gì?",
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
  restoration: [
    "Răng vỡ lớn nên trám hay bọc sứ?",
    "Inlay, onlay dùng khi nào?",
    "Mất răng nên làm cầu răng hay implant?",
    "Hàm tháo lắp phù hợp với ai?",
  ],
  rootCanal: [
    "Khi nào cần chữa tủy?",
    "Chữa tủy có đau không?",
    "Răng sau chữa tủy có cần bọc sứ không?",
    "Tôi muốn đặt lịch khám sớm",
  ],
  wisdomTooth: [
    "Răng khôn mọc lệch có cần nhổ không?",
    "Lợi trùm răng khôn xử lý sao?",
    "Nhổ răng khôn có nguy hiểm không?",
    "Tôi muốn đặt lịch kiểm tra",
  ],
  abscess: [
    "Sưng mặt do răng có nguy hiểm không?",
    "Răng có mủ là bị gì?",
    "Áp xe răng xử lý thế nào?",
    "Tôi muốn đặt lịch khám sớm",
  ],
  oralUlcer: [
    "Nhiệt miệng bao lâu thì khỏi?",
    "Loét miệng khi nào cần khám?",
    "Nhiệt miệng tái đi tái lại là do đâu?",
    "Tôi muốn đặt lịch kiểm tra",
  ],
  tmj: [
    "Há miệng kêu lục cục là bị gì?",
    "Đau khớp hàm có liên quan răng không?",
    "Nghiến răng có hại không?",
    "Tôi muốn đặt lịch kiểm tra",
  ],
  badBreath: [
    "Hôi miệng có phải do dạ dày không?",
    "Cạo vôi có giảm hôi miệng không?",
    "Chảy máu nướu có gây hôi miệng không?",
    "Tôi muốn đặt lịch kiểm tra",
  ],
  toothAnatomy: [
    "Răng số 6 quan trọng thế nào?",
    "Răng cửa, răng nanh, răng hàm khác nhau gì?",
    "Răng khôn là răng số mấy?",
    "Trẻ em thay răng khi nào?",
  ],
  toothCount: [
    "Người lớn có bao nhiêu răng?",
    "Trẻ em có bao nhiêu răng sữa?",
    "Răng khôn mọc khi nào?",
    "Thiếu răng nên xử lý thế nào?",
  ],
  sensitivity: [
    "Răng ê buốt là do đâu?",
    "Ê buốt khi uống lạnh có nguy hiểm không?",
    "Tụt nướu gây ê buốt phải làm sao?",
    "Tôi muốn đặt lịch kiểm tra",
  ],
  caries: [
    "Sâu răng có tự khỏi không?",
    "Sâu răng khi nào cần trám?",
    "Sâu răng khi nào cần chữa tủy?",
    "Làm sao phòng sâu răng?",
  ],
  periodontal: [
    "Viêm nướu và nha chu khác gì nhau?",
    "Nha chu có làm mất răng không?",
    "Răng lung lay do nha chu xử lý sao?",
    "Bao lâu nên cạo vôi răng?",
  ],
  prevention: [
    "Chải răng đúng cách như thế nào?",
    "Bao lâu nên thay bàn chải?",
    "Có nên dùng chỉ nha khoa không?",
    "Khám răng định kỳ bao lâu một lần?",
  ],
  pediatric: [
    "Trẻ mất răng sữa có sao không?",
    "Trẻ sâu răng sữa có cần trám không?",
    "Khi nào trẻ nên đi khám răng?",
    "Tôi muốn đặt lịch cho bé",
  ],
  frenulum: [
    "Thắng môi thắng lưỡi có cần cắt không?",
    "Thắng lưỡi ảnh hưởng nói không?",
    "Trẻ có khe thưa răng cửa nên làm gì?",
    "Tôi muốn đặt lịch cho bé",
  ],
  whitening: [
    "Tẩy trắng răng có ê buốt không?",
    "Răng vàng thì nên làm gì?",
    "Tẩy trắng có hại men răng không?",
    "Bao lâu nên tẩy trắng lại?",
  ],
  laser: [
    "Điều trị bằng laser có tốt không?",
    "Laser có thay thế nha sĩ không?",
    "Khi nào nên dùng laser nha khoa?",
    "Tôi muốn đặt lịch tư vấn",
  ],
  extractionAftercare: [
    "Sau nhổ răng sưng nướu có sao không?",
    "Nhổ răng xong khi nào cần tái khám?",
    "Sau nhổ răng nên kiêng gì?",
    "Tôi muốn đặt lịch kiểm tra",
  ],
  porcelainCompare: [
    "Sứ kim loại và toàn sứ khác gì nhau?",
    "Răng sứ zirconia là gì?",
    "Bọc sứ có cần mài nhiều không?",
    "Veneer khác bọc sứ thế nào?",
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
  malocclusion: [
    "Răng hô móm có nên niềng không?",
    "Răng chen chúc có nguy hiểm không?",
    "Khớp cắn sai ảnh hưởng gì?",
    "Khi nào nên chỉnh nha cho trẻ?",
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

const hasWordAny = (text, keywords) =>
  keywords.some((keyword) => new RegExp(`(^|\\s)${keyword}(\\s|$)`).test(text));

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
- Phục hình răng gồm phục hồi răng còn chân như trám, inlay/onlay, veneer, mão sứ; và phục hồi răng mất như cầu răng, hàm tháo lắp, implant.
- Trám răng phù hợp với lỗ sâu/vỡ nhỏ đến vừa, còn đủ mô răng nâng đỡ. Inlay/onlay phù hợp khi mất mô răng lớn hơn nhưng vẫn muốn bảo tồn mô răng hơn mão sứ toàn phần.
- Mão răng sứ thường dùng khi răng vỡ lớn, sau chữa tủy hoặc cần phục hồi chịu lực; cầu răng cần mài răng kế cận; implant không cần mài răng bên cạnh nhưng cần đủ điều kiện xương/nướu và chi phí cao hơn.
- Hàm giả tháo lắp có chi phí dễ tiếp cận và phù hợp một số trường hợp mất nhiều răng, nhưng cảm giác ăn nhai và độ ổn định thường kém hơn cầu răng hoặc implant.
- Tẩy trắng răng: có thể cải thiện màu răng tự nhiên nhưng không làm trắng mão sứ/trám cũ; ê buốt tạm thời có thể xảy ra, cần kiểm tra sâu răng, nứt răng, tụt nướu trước.
- Sứ kim loại: bên trong có khung kim loại, chi phí thường dễ tiếp cận hơn nhưng lâu dài có thể ánh màu/đen viền nướu tùy trường hợp. Toàn sứ/Zirconia thẩm mỹ hơn, ít ánh kim loại hơn nhưng chi phí cao hơn.
- Laser nha khoa: là công cụ hỗ trợ trong một số điều trị mô mềm/nướu, không phải “thần dược” thay thế khám, chụp phim hay tay nghề bác sĩ.
- Chữa tủy: dùng khi tủy răng viêm/nhiễm khuẩn; sau chữa tủy răng có thể yếu hơn và cần phục hồi thân răng.
- Đau răng: có thể do sâu răng, viêm nướu, viêm tủy, áp xe, răng khôn hoặc chấn thương; cần khám để xác định nguyên nhân.
- Cạo vôi răng: giúp làm sạch mảng bám/vôi răng, giảm viêm nướu, chảy máu chân răng và hôi miệng.
- Niềng răng: điều chỉnh răng lệch, hô, móm, sai khớp cắn; cần chụp phim và lập kế hoạch điều trị.
- Nhổ răng/răng khôn: cần kiểm tra và có thể cần chụp phim trước; sau nhổ phải chăm sóc đúng hướng dẫn.
- Răng khôn mọc lệch/mọc ngầm có thể gây đau, viêm lợi trùm, sâu răng bên cạnh hoặc kẹt thức ăn; không phải răng khôn nào cũng phải nhổ, cần khám và chụp phim.
- Áp xe răng/nhiễm trùng quanh chân răng có thể gây sưng nướu, mủ, đau nhức, sưng mặt, sốt; đây là nhóm cần khám sớm, không tự chích nặn hoặc tự dùng thuốc kéo dài.
- Nhiệt miệng/loét miệng thường có thể tự lành, nhưng nếu vết loét kéo dài, tái phát nhiều, lan rộng, đau nhiều hoặc kèm sốt/hạch thì nên kiểm tra.
- Đau khớp hàm, há miệng kêu, mỏi hàm hoặc nghiến răng có thể liên quan khớp thái dương hàm, khớp cắn, stress hoặc thói quen nghiến/siết răng.
- Răng người lớn thường có 28 răng nếu không tính răng khôn, tối đa 32 răng nếu đủ 4 răng khôn. Trẻ em thường có 20 răng sữa.
- Cấu tạo răng gồm men răng, ngà răng và tủy răng; bên ngoài thường chia thân răng, cổ răng, chân răng.
- Răng cửa dùng để cắn/cắt thức ăn và ảnh hưởng thẩm mỹ/phát âm; răng nanh giúp xé thức ăn và hướng dẫn vận động hàm; răng tiền hàm chuyển tiếp giữa xé và nghiền; răng hàm nghiền thức ăn, trong đó răng số 6 rất quan trọng cho khớp cắn.
- Sâu răng thường tiến triển từ sâu men ít đau, sâu ngà gây ê buốt, viêm tủy gây đau tự phát/đau đêm; để lâu có thể áp-xe hoặc mất răng.
- Viêm nướu thường do mảng bám/vôi răng gây đỏ, sưng, chảy máu; nếu tiến triển thành nha chu có thể tiêu xương, túi nha chu, răng lung lay và mất răng.
- Ê buốt răng có thể do mòn men, tụt nướu, sâu răng, nứt răng, chải răng mạnh, tẩy trắng hoặc sau điều trị; cần kiểm tra nguyên nhân trước khi xử lý.
- Phòng ngừa cơ bản: chải răng đúng cách 2 lần/ngày, làm sạch kẽ răng, hạn chế ăn ngọt nhiều lần trong ngày, thay bàn chải khoảng 3 tháng/lần và khám định kỳ khoảng 6 tháng/lần.
- Với trẻ em, cần phân biệt mất răng sữa đúng tuổi hay mất răng do sâu/chấn thương; không nên tự nhổ hoặc bỏ qua đau/sưng.
- Thắng môi/thắng lưỡi ở trẻ cần đánh giá mức độ ảnh hưởng bú, phát âm, vệ sinh, khe thưa răng cửa hoặc kéo tụt nướu; không phải trường hợp nào cũng cần cắt ngay.
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
    hasAny(text, [
      "thang moi",
      "thang luoi",
      "dinh thang",
      "phanh moi",
      "phanh luoi",
      "dinh luoi",
      "be bi thang",
    ])
  ) {
    return "frenulum";
  }

  if (
    hasAny(text, [
      "sau khi nho",
      "moi nho rang",
      "nho rang xong",
      "nho rang ve",
      "hau phau",
      "sau tieu phau",
      "sung sau khi nho",
      "chay mau sau khi nho",
    ])
  ) {
    return "extractionAftercare";
  }

  if (
    hasAny(text, [
      "tay trang",
      "trang rang",
      "rang trang",
      "rang vang",
      "rang bi vang",
      "rang duoc trang",
      "lam trang",
      "e buot khi tay trang",
      "e buot khong",
    ])
  ) {
    return "whitening";
  }

  if (hasAny(text, ["laser", "lazer", "laze", "dieu tri bang laser", "dieu tri bang lazer"])) {
    return "laser";
  }

  if (hasAny(text, ["viem tuy", "chua tuy", "lay tuy", "dieu tri tuy", "tuy rang"])) {
    return "rootCanal";
  }

  if (
    hasAny(text, [
      "rang so",
      "so 6",
      "so 7",
      "so 8",
      "rang cua",
      "rang nanh",
      "rang ham",
      "rang tien ham",
      "rang khon la rang",
      "vi tri rang",
      "cung ham",
      "ham tren",
      "ham duoi",
    ])
  ) {
    return "toothAnatomy";
  }

  if (
    hasAny(text, [
      "nha chu",
      "viem nha chu",
      "viem nuou",
      "viem loi",
      "tui nha chu",
      "tieu xuong",
      "cao voi",
      "lay cao rang",
      "chay mau chan rang",
      "chay mau nuou",
      "chay mau loi",
    ])
  ) {
    return "periodontal";
  }

  if (
    hasAny(text, [
      "e buot",
      "nhay cam",
      "uong lanh",
      "nuoc lanh",
      "lanh buot",
      "an ngot",
      "mon men",
      "tut nuou",
      "tut loi",
    ])
    || /(^|\s)an chua(\s|$)/.test(text)
  ) {
    return "sensitivity";
  }

  if (
    hasAny(text, ["tre em", "em be", "be bi", "rang sua", "mat rang sua", "rang tre", "nha khoa tre em"]) ||
    hasAny(text, ["khi nao tre", "tre nen di kham", "dua be di kham", "cho be di kham", "con toi bi", "be co"]) ||
    (hasAny(text, ["mat rang", "gay rang", "sau rang"]) && (hasWordAny(text, ["be", "tre", "chau"]) || hasAny(text, ["con toi"])))
  ) {
    return "pediatric";
  }

  if (
    hasAny(text, [
      "sau rang",
      "lo sau",
      "rang bi sau",
      "sau den tuy",
      "sau co tu khoi",
      "sau tu khoi",
      "han tram",
      "tram rang",
      "sau men",
      "sau nga",
    ])
  ) {
    return "caries";
  }

  if (
    hasAny(text, [
      "rang khon",
      "loi trum",
      "moc lech",
      "moc ngam",
      "ket thuc an",
      "viem loi trum",
    ])
  ) {
    return "wisdomTooth";
  }

  if (
    hasAny(text, [
      "ap xe",
      "co mu",
      "chay mu",
      "mu rang",
      "sung mat",
      "sung ma",
      "sung ham",
      "nhiem trung chan rang",
      "o mu",
    ])
  ) {
    return "abscess";
  }

  if (
    hasAny(text, [
      "nhiet mieng",
      "loet mieng",
      "loet moi",
      "loet luoi",
      "vet loet",
      "ap xe mieng",
      "dau mieng",
    ])
  ) {
    return "oralUlcer";
  }

  if (
    hasAny(text, [
      "khop ham",
      "thai duong ham",
      "hai mieng",
      "ha mieng",
      "keu luc cuc",
      "moi ham",
      "nghien rang",
      "siet rang",
      "dau quai ham",
    ])
  ) {
    return "tmj";
  }

  if (
    hasAny(text, [
      "phuc hinh",
      "mat rang nen lam gi",
      "mat rang lau nam",
      "ham thao lap",
      "ham gia",
      "cau rang",
      "cau rang su",
      "trong rang gia",
      "rang vo lon",
      "rang vo nhieu",
      "rang vo lon nen",
      "nen tram hay boc su",
      "tram hay boc su",
      "inlay",
      "onlay",
      "overlay",
      "mao su",
    ])
  ) {
    return "restoration";
  }

  if (
    hasAny(text, [
      "cham soc rang",
      "phong ngua",
      "danh rang dung cach",
      "chi nha khoa",
      "nuoc suc mieng",
      "thay ban chai",
      "kham dinh ky",
      "ve sinh rang mieng",
      "giu rang",
      "rang chac khoe",
    ])
  ) {
    return "prevention";
  }

  if (
    hasAny(text, [
      "rang ho",
      "rang mom",
      "ho mom",
      "sai khop can",
      "lech khop can",
      "khop can sai",
      "rang chen chuc",
      "rang khap khenh",
      "rang moc lech",
    ])
  ) {
    return "malocclusion";
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

  if (
    hasAny(text, [
      "su kim loai",
      "toan su",
      "zirconia",
      "cercon",
      "rang su kim loai",
      "rang toan su",
      "khac nhau cho nao",
      "khac nhau o dau",
    ])
  ) {
    return "porcelainCompare";
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

  if (topic === "toothAnatomy") {
    return createResult(
      "Trong nha khoa, răng thường được hiểu theo nhóm chức năng. Răng cửa ở phía trước dùng để cắn/cắt thức ăn và ảnh hưởng nhiều đến thẩm mỹ, phát âm. Răng nanh giúp xé thức ăn và giữ hướng vận động hàm. Răng tiền hàm và răng hàm nằm phía sau, chịu lực nhai và nghiền thức ăn.\n\nRăng số 6 là răng hàm lớn mọc khá sớm, giữ vai trò quan trọng trong ăn nhai và khớp cắn nên nếu sâu, mất hoặc lệch thì không nên xem nhẹ. Răng khôn thường là răng số 8, có thể mọc thẳng, mọc lệch, mọc ngầm hoặc không mọc; nếu đau, viêm lợi trùm, sâu răng bên cạnh hoặc kẹt thức ăn thì nên chụp phim kiểm tra.",
      suggestionGroups.toothAnatomy,
    );
  }

  if (topic === "periodontal") {
    return createResult(
      "Viêm nướu và nha chu là hai mức độ khác nhau. Viêm nướu thường là giai đoạn sớm: nướu đỏ, sưng, dễ chảy máu khi đánh răng, thường liên quan mảng bám và vôi răng. Nếu xử lý sớm bằng vệ sinh răng miệng đúng cách và cạo vôi, tình trạng này thường cải thiện tốt.\n\nNha chu nặng hơn vì viêm đã ảnh hưởng mô nâng đỡ quanh răng, có thể tạo túi nha chu, tiêu xương, tụt nướu, hôi miệng, răng lung lay và thậm chí mất răng. Hướng xử lý thường là cạo vôi/làm sạch sâu, kiểm soát viêm, hướng dẫn vệ sinh kẽ răng và theo dõi định kỳ; trường hợp nặng cần điều trị nha chu chuyên sâu.",
      suggestionGroups.periodontal,
    );
  }

  if (topic === "sensitivity") {
    return createResult(
      "Răng ê buốt khi uống lạnh, ăn chua/ngọt hoặc chải răng có thể do mòn men, tụt nướu, sâu răng, nứt răng, chải răng quá mạnh, sau tẩy trắng hoặc sau một số điều trị. Nếu chỉ ê nhẹ, thoáng qua thì có thể bắt đầu bằng bàn chải mềm, kem đánh răng chống ê buốt và tránh chải ngang quá mạnh.\n\nNhưng nếu ê buốt kéo dài, đau nhói, đau tự phát, có lỗ sâu, răng nứt/mẻ hoặc nướu tụt nhiều thì nên khám để tìm nguyên nhân. Hướng điều trị có thể là bôi thuốc giảm ê, trám cổ răng, xử lý sâu răng, điều trị nướu hoặc chữa tủy nếu tổn thương đã vào tủy.",
      suggestionGroups.sensitivity,
    );
  }

  if (topic === "caries") {
    return createResult(
      "Sâu răng là quá trình mô răng bị phá hủy bởi acid từ vi khuẩn trong mảng bám. Giai đoạn rất sớm ở men răng có thể kiểm soát bằng vệ sinh, fluoride và thay đổi thói quen ăn ngọt; nhưng khi đã thành lỗ sâu thì thường không tự lành lại như da, nha sĩ cần trám hoặc phục hồi phần răng bị mất.\n\nNếu sâu lan vào ngà răng, bạn có thể ê buốt khi ăn lạnh/ngọt hoặc mắc thức ăn. Nếu sâu vào tủy, thường đau tự phát, đau về đêm, đau kéo dài hoặc sưng mủ; lúc đó có thể cần chữa tủy rồi phục hồi thân răng. Đi khám sớm giúp giữ răng thật và tránh điều trị tốn kém hơn.",
      suggestionGroups.caries,
    );
  }

  if (topic === "prevention") {
    return createResult(
      "Chăm sóc răng miệng cơ bản nên bắt đầu từ vài việc đều đặn: đánh răng ít nhất 2 lần/ngày bằng kem có fluoride, dùng bàn chải mềm, chải nhẹ theo đường viền nướu, làm sạch kẽ răng bằng chỉ nha khoa hoặc bàn chải kẽ và hạn chế ăn ngọt nhiều lần trong ngày.\n\nBạn nên thay bàn chải khoảng 3 tháng/lần hoặc sớm hơn nếu lông bàn chải xòe. Khám răng định kỳ khoảng 6 tháng/lần giúp phát hiện sớm sâu răng, vôi răng, viêm nướu, răng khôn hoặc khớp cắn bất thường trước khi thành vấn đề lớn.",
      suggestionGroups.prevention,
    );
  }

  if (topic === "malocclusion") {
    return createResult(
      "Răng hô, móm, chen chúc hoặc sai khớp cắn không chỉ là vấn đề thẩm mỹ. Nếu khớp cắn lệch nhiều, bạn có thể khó vệ sinh, dễ sâu kẽ răng, viêm nướu, mòn răng, đau khớp hàm hoặc ăn nhai không đều.\n\nNiềng răng/chỉnh nha là một hướng xử lý phổ biến, nhưng cần khám, chụp phim và phân tích khớp cắn trước. Với trẻ em, nếu có móm, lệch hàm, răng mọc chen chúc sớm, thở miệng hoặc thói quen mút tay kéo dài thì nên kiểm tra sớm để xem có cần can thiệp đúng thời điểm không.",
      suggestionGroups.malocclusion,
    );
  }

  if (topic === "wisdomTooth") {
    return createResult(
      "Răng khôn là răng hàm lớn thứ ba, thường là răng số 8. Không phải răng khôn nào cũng phải nhổ, nhưng nếu răng mọc lệch, mọc ngầm, gây đau, viêm lợi trùm, kẹt thức ăn, sâu răng số 7 bên cạnh hoặc sưng tái đi tái lại thì nên khám và chụp phim.\n\nHướng xử lý có thể là vệ sinh vùng lợi trùm, điều trị viêm cấp trước, hoặc nhổ/tiểu phẫu nếu răng có nguy cơ gây biến chứng. Bạn không nên tự uống thuốc nhiều lần rồi bỏ qua, vì viêm răng khôn dễ tái phát khi nguyên nhân cơ học vẫn còn.",
      suggestionGroups.wisdomTooth,
    );
  }

  if (topic === "abscess") {
    return createResult(
      "Răng có mủ, sưng nướu, sưng mặt hoặc đau nhức kèm sốt có thể liên quan nhiễm trùng quanh chân răng/áp xe răng. Đây là nhóm không nên tự xử lý ở nhà, vì nhiễm trùng có thể lan rộng và làm tình trạng nặng hơn.\n\nHướng điều trị tùy nguyên nhân: nếu răng còn giữ được có thể cần chữa tủy, dẫn lưu ổ nhiễm trùng và phục hồi răng; nếu răng hư quá nặng có thể phải nhổ. Bạn không nên tự chích/nặn mủ hoặc tự dùng kháng sinh kéo dài khi chưa được khám.",
      suggestionGroups.abscess,
    );
  }

  if (topic === "oralUlcer") {
    return createResult(
      "Nhiệt miệng hoặc vết loét nhỏ trong miệng thường có thể tự lành sau một thời gian, nhưng vẫn gây đau khi ăn uống. Bạn nên giữ vệ sinh miệng, tránh thức ăn cay/nóng/chua, uống đủ nước và không tự cạy vết loét.\n\nNếu vết loét kéo dài trên khoảng 2 tuần, tái phát liên tục, lan rộng, chảy máu, đau nhiều, kèm sốt/hạch hoặc xuất hiện sau khi cấn răng giả/răng sắc nhọn thì nên khám để loại trừ nguyên nhân khác và xử lý điểm gây chấn thương.",
      suggestionGroups.oralUlcer,
    );
  }

  if (topic === "tmj") {
    return createResult(
      "Há miệng kêu lục cục, đau vùng trước tai, mỏi hàm, đau khi nhai hoặc nghiến răng có thể liên quan khớp thái dương hàm, cơ nhai, khớp cắn hoặc thói quen siết/nghiến răng. Tình trạng này không nên chỉ xem là đau răng thông thường.\n\nBạn nên hạn chế nhai đồ cứng, tránh há miệng quá lớn, theo dõi thói quen nghiến răng và đặt lịch kiểm tra nếu đau kéo dài. Nha sĩ có thể đánh giá khớp cắn, tình trạng mòn răng và tư vấn máng nhai hoặc hướng điều trị phù hợp nếu cần.",
      suggestionGroups.tmj,
    );
  }

  if (topic === "restoration") {
    return createResult(
      "Phục hình răng có hai nhóm chính. Nếu răng còn chân và còn khả năng giữ, nha sĩ sẽ ưu tiên bảo tồn bằng trám răng, inlay/onlay, veneer hoặc mão sứ tùy mức độ mất mô răng. Nếu răng đã mất, lựa chọn thường là hàm tháo lắp, cầu răng sứ hoặc implant.\n\nTrám răng phù hợp lỗ sâu/vỡ nhỏ đến vừa. Inlay/onlay dùng khi răng mất mô lớn hơn trám thường nhưng vẫn muốn bảo tồn mô răng. Mão sứ phù hợp răng vỡ lớn, sau chữa tủy hoặc cần chịu lực tốt hơn. Cầu răng sứ cần mài răng kế cận để làm trụ; implant không cần mài răng bên cạnh nhưng cần đủ điều kiện xương/nướu. Hàm tháo lắp chi phí dễ tiếp cận hơn, phù hợp một số trường hợp mất nhiều răng nhưng cảm giác ăn nhai thường kém ổn định hơn.",
      suggestionGroups.restoration,
    );
  }

  if (topic === "whitening") {
    return createResult(
      "Tẩy trắng răng có thể gây ê buốt tạm thời, nhất là khi răng đang nhạy cảm, có sâu răng, mòn cổ răng, tụt nướu hoặc men răng yếu. Vì vậy trước khi tẩy trắng, nha sĩ thường cần kiểm tra răng nướu trước; nếu có vôi răng, sâu răng hoặc viêm nướu thì nên xử lý trước rồi mới làm trắng.\n\nNếu bạn muốn răng trắng hơn, cách an toàn là bắt đầu từ vệ sinh răng miệng, cạo vôi/đánh bóng nếu có mảng bám, hạn chế cà phê/trà/thuốc lá và khám để xem màu răng là do mảng bám, nhiễm màu bên ngoài hay đổi màu bên trong răng. Tẩy trắng không làm trắng mão sứ, miếng trám cũ hoặc veneer, nên nếu có phục hình cũ ở vùng răng cửa thì cần tư vấn kỹ để tránh lệch màu.",
      suggestionGroups.whitening,
    );
  }

  if (topic === "laser") {
    return createResult(
      "Laser trong nha khoa là một công cụ hỗ trợ, không phải phương pháp “thần kỳ” thay thế hoàn toàn tay nghề bác sĩ hay quy trình khám. Laser có thể hữu ích trong một số xử lý mô mềm, hỗ trợ điều trị nướu hoặc giảm chảy máu trong vài tình huống phù hợp.\n\nĐiểm quan trọng là không nên chọn điều trị chỉ vì nghe tên công nghệ. Bạn nên hỏi rõ: laser dùng để xử lý vấn đề gì, có lựa chọn nào khác không, lợi ích thực tế là gì, chi phí có phát sinh không và sau điều trị cần chăm sóc ra sao. Một phòng khám tư vấn minh bạch sẽ giải thích chỉ định trước khi làm.",
      suggestionGroups.laser,
    );
  }

  if (topic === "extractionAftercare") {
    return createResult(
      "Sau nhổ răng, nướu sưng nhẹ và đau âm ỉ trong vài ngày đầu có thể gặp, nhất là với răng khôn hoặc ca nhổ khó. Tuy nhiên nếu sưng tăng nhiều, đau dữ dội, chảy máu kéo dài, có mùi hôi/vị hôi trong ổ răng, sốt hoặc há miệng khó thì bạn nên liên hệ phòng khám để kiểm tra lại.\n\nTrong thời gian đầu, bạn nên cắn gạc đúng hướng dẫn, không súc miệng mạnh, không khạc nhổ liên tục, không hút thuốc, tránh nhai bên mới nhổ và ăn mềm. Không tự chọc vào ổ răng vì có thể làm bong cục máu đông, khiến vết thương lâu lành hơn.",
      suggestionGroups.extractionAftercare,
    );
  }

  if (topic === "porcelainCompare") {
    return createResult(
      "Sứ kim loại và toàn sứ khác nhau chủ yếu ở phần khung bên trong. Răng sứ kim loại có khung kim loại bên trong, chi phí thường dễ tiếp cận hơn nhưng lâu dài có thể bị ánh màu hoặc đen viền nướu tùy vị trí và cơ địa. Răng toàn sứ như zirconia/cercon không có khung kim loại, thẩm mỹ tốt hơn ở vùng răng cửa và thường ít bị ánh kim loại hơn, nhưng chi phí cao hơn.\n\nKhông phải ai cũng cần chọn loại đắt nhất. Nếu là răng hàm cần ăn nhai, răng cửa cần thẩm mỹ, răng đã chữa tủy hay răng còn khỏe thì chỉ định sẽ khác nhau. Bạn nên yêu cầu nha sĩ giải thích vì sao chọn loại sứ đó, cần mài bao nhiêu mô răng và có phương án ít xâm lấn hơn như trám, inlay/onlay hoặc veneer không.",
      suggestionGroups.porcelainCompare,
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

  if (topic === "frenulum") {
    return createResult(
      "Thắng môi hoặc thắng lưỡi là dải mô nhỏ nối môi/lưỡi với nướu hoặc sàn miệng. Ở trẻ em, không phải trường hợp nào cũng cần cắt. Nha sĩ thường xem nó có gây khó bú, khó phát âm, hạn chế cử động lưỡi, tạo khe thưa răng cửa, kéo tụt nướu hoặc làm bé khó vệ sinh răng miệng không.\n\nNếu bé chỉ có thắng môi/thắng lưỡi nhưng ăn uống, nói, vệ sinh và mọc răng bình thường thì có thể chỉ cần theo dõi. Nếu có dấu hiệu ảnh hưởng, phòng khám sẽ khám trực tiếp rồi mới tư vấn có cần can thiệp hay không; thủ thuật có thể là cắt/chỉnh thắng bằng dụng cụ phù hợp, đôi khi có hỗ trợ laser tùy trang thiết bị và chỉ định.",
      suggestionGroups.frenulum,
    );
  }

  if (topic === "pediatric") {
    if (hasAny(text, ["khi nao", "bao lau", "may tuoi", "nen di kham"])) {
      return createResult(
        "Trẻ nên được kiểm tra răng định kỳ từ sớm, đặc biệt khi bắt đầu mọc răng sữa, có sâu răng, đau răng, hôi miệng, chảy máu nướu, răng mọc lệch, thói quen mút tay/thở miệng hoặc răng sữa lung lay bất thường. Mục tiêu không chỉ là chữa sâu răng mà còn theo dõi mọc răng, hướng dẫn vệ sinh và phát hiện lệch khớp cắn sớm.\n\nNếu bé sợ nha khoa, phụ huynh nên cho bé đi khám khi chưa đau nặng để bé quen môi trường trước. Khi đã đau, sưng hoặc sốt thì việc điều trị thường khó chịu hơn và bé dễ sợ hơn.",
        suggestionGroups.pediatric,
      );
    }

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


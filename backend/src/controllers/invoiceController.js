const {
  PAYMENT_METHODS,
  getInvoices,
  getInvoiceById,
  findInvoiceByCode,
  checkInvoiceReferences,
  createInvoiceWithDetails,
  addPaymentToInvoice,
  cancelInvoiceById,
} = require("../models/invoiceModel");
const { findPatientByUserId } = require("../models/patientModel");

const statusLabels = {
  Unpaid: "Chưa thanh toán",
  PartiallyPaid: "Còn công nợ",
  Paid: "Đã thanh toán",
  Cancelled: "Đã hủy",
};

const money = (value) => Number(value || 0);

const toPositiveMoney = (value) => {
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? amount : NaN;
};

const sanitizeFileName = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "khach-hang";

const getDetailName = (detail) =>
  detail.custom_description || detail.treatment_group || detail.service_name || "Dịch vụ";

const getTreatmentSummary = (invoice) =>
  (invoice.details || []).map(getDetailName).join("; ") || "Chưa có nội dung";

const buildInvoiceCode = () => `TT${Date.now()}`;

const validateDetails = (details = []) => {
  if (!Array.isArray(details) || details.length === 0) {
    return { message: "Hồ sơ thanh toán phải có ít nhất một dòng điều trị." };
  }

  const normalizedDetails = [];
  let subtotal = 0;

  for (const detail of details) {
    const hasService = Boolean(detail.service_id);
    const hasDescription = Boolean(detail.custom_description?.trim());
    const quantity = toPositiveMoney(detail.quantity || 1);
    const unitPrice = toPositiveMoney(detail.unit_price);

    if (!hasService && !hasDescription) {
      return { message: "Mỗi dòng điều trị cần có nhóm dịch vụ hoặc nội dung chi tiết." };
    }

    if (quantity <= 0 || unitPrice <= 0) {
      return { message: "Số lượng và đơn giá phải lớn hơn 0." };
    }

    const lineTotal = quantity * unitPrice;
    subtotal += lineTotal;
    normalizedDetails.push({
      ...detail,
      quantity,
      unit_price: unitPrice,
      subtotal: lineTotal,
    });
  }

  return { details: normalizedDetails, subtotal };
};

const parseInvoicePayload = (body = {}) => {
  const detailValidation = validateDetails(body.details);
  if (detailValidation.message) return detailValidation;

  const discountAmount = toPositiveMoney(body.discount_amount || 0);
  const firstPaymentAmount = toPositiveMoney(body.first_payment_amount || 0);
  const subtotal = detailValidation.subtotal;
  const totalAmount = Math.max(subtotal - discountAmount, 0);

  if (discountAmount < 0) {
    return { message: "Giảm giá không được âm." };
  }

  if (discountAmount > subtotal) {
    return { message: "Giảm giá không được lớn hơn tạm tính." };
  }

  if (firstPaymentAmount < 0) {
    return { message: "Số tiền thanh toán lần đầu không được âm." };
  }

  if (firstPaymentAmount > totalAmount) {
    return { message: "Thanh toán lần đầu không được lớn hơn thành tiền." };
  }

  if (firstPaymentAmount > 0 && !PAYMENT_METHODS.includes(body.first_payment_method)) {
    return { message: "Phương thức thanh toán không hợp lệ." };
  }

  return {
    details: detailValidation.details,
    subtotal,
    discountAmount,
    totalAmount,
    firstPaymentAmount,
  };
};

// list payment records (admin xem tat ca)
const listInvoices = async (req, res) => {
  try {
    const invoices = await getInvoices({
      status: req.query.status,
      search: req.query.search,
    });

    res.status(200).json({
      message: "Payment records fetched successfully",
      data: invoices,
    });
  } catch (error) {
    console.error("listInvoices failed:", error);
    res.status(500).json({
      message: "Không thể tải danh sách thanh toán.",
    });
  }
};

// customer payment records (khach chi xem ho so cua minh)
const listMyInvoices = async (req, res) => {
  try {
    const patient = await findPatientByUserId(req.user.id);

    if (!patient) {
      return res.status(404).json({ message: "Không tìm thấy hồ sơ khách hàng." });
    }

    const invoices = await getInvoices({ patientId: patient.id });
    return res.json({ data: invoices });
  } catch (error) {
    console.error("listMyInvoices failed:", error);
    return res.status(500).json({ message: "Không thể tải thanh toán của bạn." });
  }
};

// get payment record detail
const getInvoiceDetail = async (req, res) => {
  try {
    const invoice = await getInvoiceById(Number(req.params.invoiceId));
    if (!invoice) return res.status(404).json({ message: "Không tìm thấy hồ sơ thanh toán." });

    if (req.user.role === "customer") {
      const patient = await findPatientByUserId(req.user.id);
      if (!patient || Number(patient.id) !== Number(invoice.patient_id)) {
        return res.status(403).json({ message: "Bạn không có quyền xem hồ sơ này." });
      }
    }

    return res.json({ data: invoice });
  } catch (error) {
    console.error("getInvoiceDetail failed:", error);
    return res.status(500).json({ message: "Không thể tải chi tiết thanh toán." });
  }
};

// create payment profile (tao ho so thanh toan)
const addInvoice = async (req, res) => {
  try {
    const {
      patient_id,
      appointment_id,
      invoice_code,
      first_payment_method,
      first_payment_date,
      note,
      discount_reason,
    } = req.body;

    if (!patient_id) {
      return res.status(400).json({ message: "Vui lòng chọn khách hàng." });
    }

    const parsed = parseInvoicePayload(req.body);
    if (parsed.message) return res.status(400).json({ message: parsed.message });

    const finalInvoiceCode = invoice_code || buildInvoiceCode();
    const existingInvoice = await findInvoiceByCode(finalInvoiceCode);
    if (existingInvoice) {
      return res.status(409).json({ message: "Mã hồ sơ thanh toán đã tồn tại." });
    }

    const refs = await checkInvoiceReferences(patient_id, appointment_id);
    if (!refs.patientExists) return res.status(404).json({ message: "Không tìm thấy khách hàng." });
    if (!refs.appointmentExists) return res.status(404).json({ message: "Lịch hẹn không thuộc khách hàng này." });

    const newInvoice = await createInvoiceWithDetails({
      patient_id: Number(patient_id),
      appointment_id: appointment_id ? Number(appointment_id) : null,
      invoice_code: finalInvoiceCode,
      details: parsed.details,
      discount_amount: parsed.discountAmount,
      discount_reason,
      first_payment_amount: parsed.firstPaymentAmount,
      first_payment_method: parsed.firstPaymentAmount > 0 ? first_payment_method : null,
      first_payment_date: first_payment_date || new Date().toISOString().slice(0, 10),
      note,
      issued_by: req.user.id,
    });

    res.status(201).json({
      message: "Đã tạo hồ sơ thanh toán.",
      data: newInvoice,
    });
  } catch (error) {
    console.error("addInvoice failed:", error);
    res.status(500).json({ message: "Không thể tạo hồ sơ thanh toán." });
  }
};

// add payment (ghi nhan thanh toan moi)
const addInvoicePayment = async (req, res) => {
  try {
    const invoiceId = Number(req.params.invoiceId);
    const amount = toPositiveMoney(req.body.amount);

    if (amount <= 0) {
      return res.status(400).json({ message: "Số tiền thanh toán phải lớn hơn 0." });
    }

    if (!PAYMENT_METHODS.includes(req.body.payment_method)) {
      return res.status(400).json({ message: "Phương thức thanh toán không hợp lệ." });
    }

    const invoice = await addPaymentToInvoice(invoiceId, {
      amount,
      payment_method: req.body.payment_method,
      payment_date: req.body.payment_date || new Date().toISOString().slice(0, 10),
      appointment_id: req.body.appointment_id ? Number(req.body.appointment_id) : null,
      note: req.body.note,
      created_by_user_id: req.user.id,
    });

    res.status(201).json({
      message: "Đã ghi nhận thanh toán.",
      data: invoice,
    });
  } catch (error) {
    if (error.message === "PAYMENT_RECORD_NOT_FOUND") {
      return res.status(404).json({ message: "Không tìm thấy hồ sơ thanh toán." });
    }

    if (error.message === "PAYMENT_RECORD_LOCKED") {
      return res.status(409).json({ message: "Hồ sơ đã khóa, không thể ghi nhận thanh toán mới." });
    }

    if (error.message === "INVALID_PAYMENT_AMOUNT") {
      return res.status(400).json({ message: "Số tiền thanh toán vượt quá số tiền còn lại." });
    }

    console.error("addInvoicePayment failed:", error);
    return res.status(500).json({ message: "Không thể ghi nhận thanh toán." });
  }
};

// cancel payment record (huy mem ho so)
const cancelInvoice = async (req, res) => {
  try {
    const cancelled = await cancelInvoiceById(Number(req.params.invoiceId), req.user.id);
    if (!cancelled) return res.status(404).json({ message: "Không tìm thấy hồ sơ thanh toán." });
    return res.json({ message: "Đã hủy hồ sơ thanh toán." });
  } catch (error) {
    console.error("cancelInvoice failed:", error);
    return res.status(500).json({ message: "Không thể hủy hồ sơ thanh toán." });
  }
};

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let crc = index;
  for (let bit = 0; bit < 8; bit += 1) {
    crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return crc >>> 0;
});

const crc32 = (buffer) => {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const dosDateTime = (date = new Date()) => {
  const year = Math.max(date.getFullYear(), 1980);
  const dosTime =
    (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { dosTime, dosDate };
};

const createZip = (entries) => {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  const { dosTime, dosDate } = dosDateTime();

  for (const entry of entries) {
    const name = Buffer.from(entry.name);
    const data = Buffer.from(entry.data);
    const crc = crc32(data);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(dosTime, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(data.length, 18);
    localHeader.writeUInt32LE(data.length, 22);
    localHeader.writeUInt16LE(name.length, 26);
    localHeader.writeUInt16LE(0, 28);
    localParts.push(localHeader, name, data);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(dosTime, 12);
    centralHeader.writeUInt16LE(dosDate, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(data.length, 20);
    centralHeader.writeUInt32LE(data.length, 24);
    centralHeader.writeUInt16LE(name.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    centralParts.push(centralHeader, name);

    offset += localHeader.length + name.length + data.length;
  }

  const centralStart = offset;
  const centralDirectory = Buffer.concat(centralParts);
  const endHeader = Buffer.alloc(22);
  endHeader.writeUInt32LE(0x06054b50, 0);
  endHeader.writeUInt16LE(0, 4);
  endHeader.writeUInt16LE(0, 6);
  endHeader.writeUInt16LE(entries.length, 8);
  endHeader.writeUInt16LE(entries.length, 10);
  endHeader.writeUInt32LE(centralDirectory.length, 12);
  endHeader.writeUInt32LE(centralStart, 16);
  endHeader.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDirectory, endHeader]);
};

const escapeXml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const columnName = (index) => {
  let name = "";
  let current = index;
  while (current > 0) {
    const mod = (current - 1) % 26;
    name = String.fromCharCode(65 + mod) + name;
    current = Math.floor((current - mod) / 26);
  }
  return name;
};

const cellXml = (value, rowIndex, columnIndex, style = 0) => {
  const ref = `${columnName(columnIndex)}${rowIndex}`;
  const styleAttribute = style ? ` s="${style}"` : "";

  if (typeof value === "number") {
    return `<c r="${ref}"${styleAttribute}><v>${value}</v></c>`;
  }

  return `<c r="${ref}" t="inlineStr"${styleAttribute}><is><t>${escapeXml(value)}</t></is></c>`;
};

const rowXml = (values, rowIndex, styles = []) =>
  `<row r="${rowIndex}">${values
    .map((value, index) => cellXml(value, rowIndex, index + 1, styles[index] || 0))
    .join("")}</row>`;

const buildPaymentWorkbook = (invoice) => {
  const rows = [];
  let rowIndex = 1;

  rows.push(rowXml(["BẢNG THEO DÕI THANH TOÁN"], rowIndex, [3]));
  rowIndex += 2;

  [
    ["Mã hồ sơ", invoice.invoice_code || `TT${invoice.id}`],
    ["Họ tên khách hàng", invoice.patient_name],
    ["Số điện thoại", invoice.patient_phone || ""],
    ["Nội dung điều trị", getTreatmentSummary(invoice)],
    ["Tạm tính", money(invoice.subtotal)],
    ["Giảm giá", money(invoice.discount_amount)],
    ["Lý do giảm giá", invoice.discount_reason || ""],
    ["Thành tiền", money(invoice.total_amount)],
    ["Tổng đã thanh toán", money(invoice.paid_amount)],
    ["Số tiền còn lại", money(invoice.remaining_amount)],
    ["Trạng thái", statusLabels[invoice.payment_status] || invoice.payment_status],
    ["Ngày tạo hồ sơ", new Date(invoice.created_at).toLocaleDateString("vi-VN")],
  ].forEach((item) => {
    rows.push(rowXml(item, rowIndex, [2, typeof item[1] === "number" ? 1 : 0]));
    rowIndex += 1;
  });

  rowIndex += 1;
  rows.push(
    rowXml(
      [
        "Lần thanh toán",
        "Ngày thanh toán",
        "Số tiền",
        "Phương thức",
        "Đã trả lũy kế",
        "Còn lại sau lần thanh toán",
        "Người ghi nhận",
        "Ghi chú",
      ],
      rowIndex,
      [2, 2, 2, 2, 2, 2, 2, 2],
    ),
  );
  rowIndex += 1;

  (invoice.payments || []).forEach((payment) => {
    rows.push(
      rowXml(
        [
          payment.payment_number,
          payment.payment_date_display || "",
          money(payment.amount),
          payment.payment_method,
          money(payment.cumulative_paid),
          money(payment.remaining_after),
          payment.created_by_username || "",
          payment.note || "",
        ],
        rowIndex,
        [0, 0, 1, 0, 1, 1, 0, 0],
      ),
    );
    rowIndex += 1;
  });

  rows.push(
    rowXml(
      ["Tổng", "", money(invoice.paid_amount), "", "", money(invoice.remaining_amount), "", ""],
      rowIndex,
      [2, 0, 1, 0, 0, 1, 0, 0],
    ),
  );

  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>
    <col min="1" max="1" width="18" customWidth="1"/>
    <col min="2" max="2" width="22" customWidth="1"/>
    <col min="3" max="3" width="18" customWidth="1"/>
    <col min="4" max="4" width="18" customWidth="1"/>
    <col min="5" max="5" width="18" customWidth="1"/>
    <col min="6" max="6" width="22" customWidth="1"/>
    <col min="7" max="7" width="22" customWidth="1"/>
    <col min="8" max="8" width="32" customWidth="1"/>
  </cols>
  <sheetData>${rows.join("")}</sheetData>
</worksheet>`;

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0 &quot;VNĐ&quot;"/></numFmts>
  <fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="1"><fill><patternFill patternType="none"/></fill></fills>
  <borders count="2"><border/><border><left style="thin"/><right style="thin"/><top style="thin"/><bottom style="thin"/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="4">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0"/>
    <xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="1" xfId="0" applyFont="1"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="1" xfId="0" applyFont="1"/>
  </cellXfs>
</styleSheet>`;

  return createZip([
    {
      name: "[Content_Types].xml",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
    },
    {
      name: "_rels/.rels",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    },
    {
      name: "xl/workbook.xml",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Thanh toán" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    },
    { name: "xl/styles.xml", data: stylesXml },
    { name: "xl/worksheets/sheet1.xml", data: sheetXml },
  ]);
};

// export one payment record to xlsx
const exportInvoice = async (req, res) => {
  try {
    const invoice = await getInvoiceById(Number(req.params.invoiceId));
    if (!invoice) return res.status(404).json({ message: "Không tìm thấy hồ sơ thanh toán." });

    if (req.user.role === "customer") {
      const patient = await findPatientByUserId(req.user.id);
      if (!patient || Number(patient.id) !== Number(invoice.patient_id)) {
        return res.status(403).json({ message: "Bạn không có quyền xuất hồ sơ này." });
      }
    }

    const workbook = buildPaymentWorkbook(invoice);
    const filename = `bang-thanh-toan-${sanitizeFileName(invoice.patient_name)}-${invoice.invoice_code || invoice.id}.xlsx`;

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(workbook);
  } catch (error) {
    console.error("exportInvoice failed:", error);
    return res.status(500).json({ message: "Không thể xuất bảng thanh toán." });
  }
};

module.exports = {
  statusLabels,
  listInvoices,
  listMyInvoices,
  getInvoiceDetail,
  addInvoice,
  addInvoicePayment,
  cancelInvoice,
  exportInvoice,
};

const test = require("node:test");
const assert = require("node:assert/strict");

process.env.NODE_ENV = "test";
process.env.GEMINI_API_KEY = "your_gemini_api_key";
require("dotenv").config();

const pool = require("../src/config/db");
const { generateDentalReply } = require("../src/services/chatbotService");

test.after(async () => {
  await pool.end();
});

const internalCases = [
  ["Tôi bị đau nướu quá phải làm sao?", /Đau nướu có thể liên quan nhiều nguyên nhân/i],
  ["Sứ kim loại với toàn sứ khác nhau sao?", /khác nhau trước hết ở vật liệu/i],
  ["Implant là gì?", /chân răng nhân tạo/i],
  ["Veneer là gì?", /mặt dán sứ mỏng/i],
  ["Cạo vôi răng là gì?", /làm sạch mảng bám và vôi răng/i],
  ["Máy quét trong miệng dùng để làm gì?", /lấy dấu răng kỹ thuật số/i],
  ["Tôi đau răng có phải viêm tủy không?", /Đau răng có thể đến từ nhiều nguyên nhân/i],
  ["Cho tôi thuốc kháng sinh và liều uống.", /không thể kê thuốc kháng sinh/i],
  ["Tôi bị đau răng quá giờ nên làm gì?", /Đau răng có thể đến từ nhiều nguyên nhân/i],
];

test("curated questions use the internal knowledge base without fallback", async () => {
  for (const [question, expected] of internalCases) {
    const result = await generateDentalReply(question);

    assert.equal(result.source, "internal", question);
    assert.match(result.answer, expected, question);
    assert.doesNotMatch(result.answer, /chưa nắm hết ý/i, question);
  }
});

test("service price uses database data and never invents a zero price", async () => {
  const result = await generateDentalReply("Niềng răng giá bao nhiêu?");

  assert.equal(result.source, "database");
  assert.match(result.answer, /Niềng răng/i);
  assert.doesNotMatch(result.answer, /0 VNĐ/);
});

test("porcelain comparison avoids absolute material claims", async () => {
  const result = await generateDentalReply(
    "Sứ kim loại với toàn sứ khác nhau sao?",
  );

  assert.doesNotMatch(result.answer, /toàn sứ luôn tốt hơn/i);
  assert.doesNotMatch(result.answer, /không bao giờ đen viền nướu/i);
  assert.match(result.answer, /vị trí răng, lực cắn/i);
});

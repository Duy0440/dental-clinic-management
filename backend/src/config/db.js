const { Pool } = require("pg");

// Gọi chuỗi kết nối database deploy lên Render or Neon 
const connectionString = process.env.DATABASE_URL;

// Tạo pool kết nối PostgreSQL dùng chung cho toàn backend
const pool = new Pool(connectionString ? {
  connectionString,
  ssl: process.env.DB_SSL === "false" ? false : { rejectUnauthorized: false },
} : {
  // Cấu hình database local khi chạy trên máy cá nhân
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

module.exports = pool;
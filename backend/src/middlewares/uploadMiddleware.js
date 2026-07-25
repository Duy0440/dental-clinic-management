const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../../uploads/medical-records");

// tao thu muc upload neu chua co
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

// chi nhan anh va file PDF
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  cb(allowedTypes.includes(file.mimetype) ? null : new Error("Chi cho phep tai len file JPG, PNG, WEBP hoac PDF"), allowedTypes.includes(file.mimetype));
};

const uploadMedicalFile = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

module.exports = uploadMedicalFile;

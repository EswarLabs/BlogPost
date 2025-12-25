const multer = require("multer");

const storage = multer.diskStorage({
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, ch) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
      ch(null, true);
    } else {
      ch(new Error("Only JPEG and PNG images are allowed"), false);
    }
  },
});

module.exports = upload;

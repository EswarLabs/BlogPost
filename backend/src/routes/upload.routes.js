const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload.middleware");
const uploadController = require("../controllers/upload.controller");
const { authMiddleware } = require("../middleware/auth.middleware");

router.post(
  "/image",
  authMiddleware,
  upload.single("image"),
  uploadController.uploadImage
);

module.exports = router;

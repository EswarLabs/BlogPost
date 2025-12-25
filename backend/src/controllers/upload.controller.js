const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const asyncHandler = require("../middleware/asyncHandler");

const uploadImage = asyncHandler(async (req, res) => {
  const result = await cloudinary.uploader.upload(req.file.path, {
    folder: "Blog",
  });
  fs.unlinkSync(req.file.path);
  res.json({ url: result.secure_url });
});

module.exports = { uploadImage };

const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
} = require("../controllers/auth.controller");
const { authMiddleware } = require("../middleware/auth.middleware");
const {
  registerValidation,
  loginValidation,
} = require("../validator/auth.validator");
const validate = require("../middleware/validate.middleware");

router.post("/register", registerValidation, validate, register);
router.post("/login", loginValidation, validate, login);
router.get("/me", authMiddleware, getMe);
router.put("/profile", authMiddleware, updateProfile);
module.exports = router;

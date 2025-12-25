const { body } = require("express-validator");

const createPostValidation = [
  body("title").notEmpty().withMessage("Title is required"),
  body("content").notEmpty().withMessage("Content is required"),
];

module.exports = createPostValidation;

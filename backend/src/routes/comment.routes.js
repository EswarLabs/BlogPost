const express = require("express");
const router = express.Router();
const {
  createComment,
  getCommentsByPost,
  deleteComment,
} = require("../controllers/comment.controller");
const { authMiddleware } = require("../middleware/auth.middleware");

router.post("/", authMiddleware, createComment);
router.get("/post/:postId", authMiddleware, getCommentsByPost);
router.delete("/:id", authMiddleware, deleteComment);

module.exports = router;

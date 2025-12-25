const express = require("express");
const router = express.Router();
const {
  createPost,
  getAllPosts,
  getPostBySlug,
  updatePost,
  deletePost,
  likePost,
  dislikePost,
} = require("../controllers/post.controller");
const { authMiddleware, authorize } = require("../middleware/auth.middleware");
const createPostValidation = require("../validator/post.validator");
const validate = require("../middleware/validate.middleware");

router.post(
  "/",
  authMiddleware,
  authorize("admin", "author"),
  createPostValidation,
  validate,
  createPost
);
router.get("/", getAllPosts);
router.get("/:slug", getPostBySlug); // Public route - no auth required
router.put("/:id", authMiddleware, authorize("admin", "author"), updatePost);
router.delete("/:id", authMiddleware, authorize("admin", "author"), deletePost);
router.post("/:id/like", authMiddleware, likePost);
router.post("/:id/dislike", authMiddleware, dislikePost);
module.exports = router;

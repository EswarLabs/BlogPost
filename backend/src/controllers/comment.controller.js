const Comment = require("../models/Comment");
const Post = require("../models/Post");
const asyncHandler = require("../middleware/asyncHandler");

const createComment = asyncHandler(async (req, res) => {
  const { postId, content } = req.body;
  if (!postId || !content || content.trim() === "") {
    return res
      .status(400)
      .json({ message: "Post ID and content are required" });
  }
  const postExists = await Post.findById(postId);
  if (!postExists) {
    return res.status(404).json({ message: "Post not found" });
  }
  const newComment = await Comment.create({
    post: postId,
    user: req.user._id,
    content,
  });
  res.status(201).json(newComment);
});

const getCommentsByPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const comments = await Comment.find({ post: postId })
    .populate("user", "name avatar")
    .sort({ createdAt: -1 });
  res.status(200).json(comments);
});

const deleteComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const comment = await Comment.findById(id);
  if (!comment) {
    return res.status(404).json({ message: "Comment not found" });
  }
  if (comment.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Forbidden" });
  }
  await comment.deleteOne();
  res.status(200).json({ message: "Comment deleted successfully" });
});

module.exports = {
  createComment,
  getCommentsByPost,
  deleteComment,
};

const Post = require("../models/Post");
const asyncHandler = require("../middleware/asyncHandler");

const generateSlug = (title) => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const createPost = asyncHandler(async (req, res) => {
  const { title, content, coverImage, tags, isPublished } = req.body;
  if (!title || title.trim() === "" || !content || content.trim() === "") {
    return res.status(400).json({ message: "Title and content are required" });
  }
  const slug = generateSlug(title);
  const existingPost = await Post.findOne({ slug });
  if (existingPost) {
    return res
      .status(400)
      .json({ message: "Post with this title already exists" });
  }
  const newPost = await Post.create({
    title,
    slug,
    content,
    coverImage: coverImage || "",
    author: req.user._id,
    tags: tags || [],
    isPublished: isPublished,
  });
  res.status(201).json(newPost);
});

const getAllPosts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || "";
  const tag = req.query.tag || "";
  const sortBy = req.query.sortBy || "createdAt";
  const order = req.query.order === "asc" ? 1 : -1;

  const filter = { isPublished: true };

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { content: { $regex: search, $options: "i" } },
    ];
  }

  if (tag) {
    filter.tags = { $in: [tag] };
  }

  const skip = (page - 1) * limit;
  const total = await Post.countDocuments(filter);
  const posts = await Post.find(filter)
    .sort({ [sortBy]: order })
    .skip(skip)
    .limit(limit)
    .populate("author", "name avatar");

  res.status(200).json({
    posts,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    },
  });
});

const getPostBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const post = await Post.findOne({ slug, isPublished: true }).populate(
    "author",
    "name avatar"
  );
  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }
  post.views++;
  await post.save();
  res.status(200).json(post);
});

const updatePost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, content, coverImage, tags, isPublished } = req.body;
  const post = await Post.findById(id);
  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }
  if (post.author.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Forbidden" });
  }
  if (title && title.trim() !== "") {
    post.title = title;
    post.slug = generateSlug(title);
  }
  post.content = content || post.content;
  post.coverImage = coverImage || post.coverImage;
  post.tags = tags || post.tags;
  post.isPublished = isPublished !== undefined ? isPublished : post.isPublished;
  await post.save();
  res.status(200).json(post);
});

const deletePost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const post = await Post.findById(id);
  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }
  if (post.author.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Forbidden" });
  }
  await post.deleteOne();
  res.status(200).json({ message: "Post deleted successfully" });
});

const likePost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const post = await Post.findById(id);
  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }

  const alreadyLiked = post.likes.includes(userId);
  const alreadyDisliked = post.dislikes.includes(userId);

  if (alreadyLiked) {
    post.likes = post.likes.filter(
      (like) => like.toString() !== userId.toString()
    );
  } else {
    post.likes.push(userId);
    if (alreadyDisliked) {
      post.dislikes = post.dislikes.filter(
        (dislike) => dislike.toString() !== userId.toString()
      );
    }
  }

  await post.save();
  res.status(200).json({
    message: alreadyLiked ? "Like removed" : "Post liked",
    likes: post.likes.length,
    dislikes: post.dislikes.length,
    isLiked: !alreadyLiked,
    isDisliked: false,
  });
});

const dislikePost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const post = await Post.findById(id);
  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }

  const alreadyDisliked = post.dislikes.includes(userId);
  const alreadyLiked = post.likes.includes(userId);

  if (alreadyDisliked) {
    post.dislikes = post.dislikes.filter(
      (dislike) => dislike.toString() !== userId.toString()
    );
  } else {
    post.dislikes.push(userId);
    if (alreadyLiked) {
      post.likes = post.likes.filter(
        (like) => like.toString() !== userId.toString()
      );
    }
  }

  await post.save();
  res.status(200).json({
    message: alreadyDisliked ? "Dislike removed" : "Post disliked",
    likes: post.likes.length,
    dislikes: post.dislikes.length,
    isLiked: false,
    isDisliked: !alreadyDisliked,
  });
});

module.exports = {
  createPost,
  getAllPosts,
  getPostBySlug,
  updatePost,
  deletePost,
  likePost,
  dislikePost,
};

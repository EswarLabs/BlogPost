const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const authRouter = require("./routes/auth.routes");
const postRouter = require("./routes/post.routes");
const commentRouter = require("./routes/comment.routes");
const uploadRouter = require("./routes/upload.routes");
const rateLimiter = require("./middleware/ratelimit.middleware");
const errorHandler = require("./middleware/error.middleware");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "10kb" }));
app.use(morgan("dev"));
app.use(rateLimiter);

app.use("/api/auth", authRouter);
app.use("/api/posts", postRouter);
app.use("/api/comments", commentRouter);
app.use("/api/upload", uploadRouter);

app.use(errorHandler);

module.exports = app;

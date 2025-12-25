const http = require("http");
const mongoose = require("mongoose");
require("dotenv").config();

const BASE_URL = "http://localhost:3001";

function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: { "Content-Type": "application/json" },
    };
    if (token) options.headers["Authorization"] = `Bearer ${token}`;

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on("error", reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

function log(emoji, test, status, details = "") {
  const statusIcon = status ? "✅" : "❌";
  console.log(`${emoji} ${test}: ${statusIcon} ${details}`);
}

async function runTests() {
  console.log("\n" + "=".repeat(70));
  console.log("🧪 COMPREHENSIVE BLOG API TEST SUITE");
  console.log("=".repeat(70));

  await mongoose.connect(process.env.MONGO_URI);
  const User = require("./src/models/User");
  const Post = require("./src/models/Post");
  const Comment = require("./src/models/Comment");

  let passed = 0;
  let failed = 0;
  const testEmail = `test${Date.now()}@example.com`;
  let token = null;
  let userId = null;
  let postId = null;
  let postSlug = null;
  let commentId = null;

  console.log("\n📌 AUTH ENDPOINTS\n" + "-".repeat(40));

  // 1. Register
  try {
    const res = await makeRequest("POST", "/api/auth/register", {
      name: "Test User",
      email: testEmail,
      password: "password123",
    });
    const success = res.status === 201 && res.data.token;
    log("1️⃣", "POST /api/auth/register", success, `Status: ${res.status}`);
    if (success) {
      token = res.data.token;
      userId = res.data.user.id;
      passed++;
    } else failed++;
  } catch (e) {
    log("1️⃣", "POST /api/auth/register", false, e.message);
    failed++;
  }

  // 2. Register Validation
  try {
    const res = await makeRequest("POST", "/api/auth/register", {
      email: "bad",
    });
    const success = res.status === 400;
    log("2️⃣", "Register Validation", success, `Status: ${res.status}`);
    success ? passed++ : failed++;
  } catch (e) {
    log("2️⃣", "Register Validation", false, e.message);
    failed++;
  }

  // 3. Login
  try {
    const res = await makeRequest("POST", "/api/auth/login", {
      email: testEmail,
      password: "password123",
    });
    const success = res.status === 200 && res.data.token;
    log("3️⃣", "POST /api/auth/login", success, `Status: ${res.status}`);
    if (success) {
      token = res.data.token;
      passed++;
    } else failed++;
  } catch (e) {
    log("3️⃣", "POST /api/auth/login", false, e.message);
    failed++;
  }

  // 4. Login Wrong Password
  try {
    const res = await makeRequest("POST", "/api/auth/login", {
      email: testEmail,
      password: "wrongpassword",
    });
    const success = res.status === 400;
    log("4️⃣", "Login Wrong Password", success, `Status: ${res.status}`);
    success ? passed++ : failed++;
  } catch (e) {
    log("4️⃣", "Login Wrong Password", false, e.message);
    failed++;
  }

  // 5. Get Me
  try {
    const res = await makeRequest("GET", "/api/auth/me", null, token);
    const success = res.status === 200 && res.data.email === testEmail;
    log("5️⃣", "GET /api/auth/me", success, `Status: ${res.status}`);
    success ? passed++ : failed++;
  } catch (e) {
    log("5️⃣", "GET /api/auth/me", false, e.message);
    failed++;
  }

  // 6. Get Me Unauthorized
  try {
    const res = await makeRequest("GET", "/api/auth/me", null, null);
    const success = res.status === 401;
    log("6️⃣", "Get Me Unauthorized", success, `Status: ${res.status}`);
    success ? passed++ : failed++;
  } catch (e) {
    log("6️⃣", "Get Me Unauthorized", false, e.message);
    failed++;
  }

  // 7. Update Profile
  try {
    const res = await makeRequest(
      "PUT",
      "/api/auth/profile",
      {
        name: "Updated Name",
        bio: "Test bio",
      },
      token
    );
    const success = res.status === 200 && res.data.user.name === "Updated Name";
    log("7️⃣", "PUT /api/auth/profile", success, `Status: ${res.status}`);
    success ? passed++ : failed++;
  } catch (e) {
    log("7️⃣", "PUT /api/auth/profile", false, e.message);
    failed++;
  }

  // Update user to author for post tests
  await User.findByIdAndUpdate(userId, { role: "author" });

  console.log("\n📌 POST ENDPOINTS\n" + "-".repeat(40));

  // 8. Create Post
  try {
    const res = await makeRequest(
      "POST",
      "/api/posts",
      {
        title: `Test Post ${Date.now()}`,
        content: "This is test content for the blog post with JavaScript tips.",
        tags: ["javascript", "testing"],
        isPublished: true,
      },
      token
    );
    const success = res.status === 201 && res.data._id;
    log("8️⃣", "POST /api/posts", success, `Status: ${res.status}`);
    if (success) {
      postId = res.data._id;
      postSlug = res.data.slug;
      passed++;
    } else failed++;
  } catch (e) {
    log("8️⃣", "POST /api/posts", false, e.message);
    failed++;
  }

  // 9. Create Post Validation
  try {
    const res = await makeRequest("POST", "/api/posts", { title: "" }, token);
    const success = res.status === 400;
    log("9️⃣", "Create Post Validation", success, `Status: ${res.status}`);
    success ? passed++ : failed++;
  } catch (e) {
    log("9️⃣", "Create Post Validation", false, e.message);
    failed++;
  }

  // 10. Get All Posts
  try {
    const res = await makeRequest("GET", "/api/posts");
    const success = res.status === 200 && res.data.posts && res.data.pagination;
    log("🔟", "GET /api/posts", success, `Posts: ${res.data.posts?.length}`);
    success ? passed++ : failed++;
  } catch (e) {
    log("🔟", "GET /api/posts", false, e.message);
    failed++;
  }

  // 11. Pagination
  try {
    const res = await makeRequest("GET", "/api/posts?page=1&limit=2");
    const success = res.status === 200 && res.data.pagination.currentPage === 1;
    log(
      "1️⃣1️⃣",
      "Pagination ?page=1&limit=2",
      success,
      `Page: ${res.data.pagination?.currentPage}`
    );
    success ? passed++ : failed++;
  } catch (e) {
    log("1️⃣1️⃣", "Pagination", false, e.message);
    failed++;
  }

  // 12. Search
  try {
    const res = await makeRequest("GET", "/api/posts?search=javascript");
    const success = res.status === 200 && res.data.posts;
    log(
      "1️⃣2️⃣",
      "Search ?search=javascript",
      success,
      `Found: ${res.data.posts?.length}`
    );
    success ? passed++ : failed++;
  } catch (e) {
    log("1️⃣2️⃣", "Search", false, e.message);
    failed++;
  }

  // 13. Filter by Tag
  try {
    const res = await makeRequest("GET", "/api/posts?tag=javascript");
    const success = res.status === 200;
    log(
      "1️⃣3️⃣",
      "Filter ?tag=javascript",
      success,
      `Found: ${res.data.posts?.length}`
    );
    success ? passed++ : failed++;
  } catch (e) {
    log("1️⃣3️⃣", "Filter by Tag", false, e.message);
    failed++;
  }

  // 14. Sort by Title ASC
  try {
    const res = await makeRequest("GET", "/api/posts?sortBy=title&order=asc");
    const success = res.status === 200;
    log(
      "1️⃣4️⃣",
      "Sort ?sortBy=title&order=asc",
      success,
      `Status: ${res.status}`
    );
    success ? passed++ : failed++;
  } catch (e) {
    log("1️⃣4️⃣", "Sort", false, e.message);
    failed++;
  }

  // 15. Sort by Views DESC
  try {
    const res = await makeRequest("GET", "/api/posts?sortBy=views&order=desc");
    const success = res.status === 200;
    log(
      "1️⃣5️⃣",
      "Sort ?sortBy=views&order=desc",
      success,
      `Status: ${res.status}`
    );
    success ? passed++ : failed++;
  } catch (e) {
    log("1️⃣5️⃣", "Sort by Views", false, e.message);
    failed++;
  }

  // 16. Combined Query
  try {
    const res = await makeRequest(
      "GET",
      "/api/posts?page=1&limit=5&search=test&sortBy=createdAt&order=desc"
    );
    const success = res.status === 200 && res.data.pagination;
    log("1️⃣6️⃣", "Combined Query", success, `Posts: ${res.data.posts?.length}`);
    success ? passed++ : failed++;
  } catch (e) {
    log("1️⃣6️⃣", "Combined Query", false, e.message);
    failed++;
  }

  // 17. Get Post by Slug
  if (postSlug) {
    try {
      const res = await makeRequest(
        "GET",
        `/api/posts/${postSlug}`,
        null,
        token
      );
      const success = res.status === 200 && res.data.slug === postSlug;
      log("1️⃣7️⃣", "GET /api/posts/:slug", success, `Views: ${res.data.views}`);
      success ? passed++ : failed++;
    } catch (e) {
      log("1️⃣7️⃣", "GET /api/posts/:slug", false, e.message);
      failed++;
    }
  }

  // 18. Update Post
  if (postId) {
    try {
      const res = await makeRequest(
        "PUT",
        `/api/posts/${postId}`,
        {
          title: "Updated Post Title",
          content: "Updated content here",
        },
        token
      );
      const success = res.status === 200;
      log("1️⃣8️⃣", "PUT /api/posts/:id", success, `Status: ${res.status}`);
      success ? passed++ : failed++;
    } catch (e) {
      log("1️⃣8️⃣", "PUT /api/posts/:id", false, e.message);
      failed++;
    }
  }

  console.log("\n📌 LIKE/DISLIKE ENDPOINTS\n" + "-".repeat(40));

  // 19. Like Post
  if (postId) {
    try {
      const res = await makeRequest(
        "POST",
        `/api/posts/${postId}/like`,
        null,
        token
      );
      const success = res.status === 200 && res.data.isLiked === true;
      log(
        "1️⃣9️⃣",
        "POST /api/posts/:id/like",
        success,
        `Likes: ${res.data.likes}`
      );
      success ? passed++ : failed++;
    } catch (e) {
      log("1️⃣9️⃣", "Like Post", false, e.message);
      failed++;
    }
  }

  // 20. Unlike (toggle)
  if (postId) {
    try {
      const res = await makeRequest(
        "POST",
        `/api/posts/${postId}/like`,
        null,
        token
      );
      const success = res.status === 200 && res.data.isLiked === false;
      log("2️⃣0️⃣", "Unlike (toggle)", success, `Likes: ${res.data.likes}`);
      success ? passed++ : failed++;
    } catch (e) {
      log("2️⃣0️⃣", "Unlike", false, e.message);
      failed++;
    }
  }

  // 21. Dislike Post
  if (postId) {
    try {
      const res = await makeRequest(
        "POST",
        `/api/posts/${postId}/dislike`,
        null,
        token
      );
      const success = res.status === 200 && res.data.isDisliked === true;
      log(
        "2️⃣1️⃣",
        "POST /api/posts/:id/dislike",
        success,
        `Dislikes: ${res.data.dislikes}`
      );
      success ? passed++ : failed++;
    } catch (e) {
      log("2️⃣1️⃣", "Dislike Post", false, e.message);
      failed++;
    }
  }

  // 22. Like switches from Dislike
  if (postId) {
    try {
      const res = await makeRequest(
        "POST",
        `/api/posts/${postId}/like`,
        null,
        token
      );
      const success =
        res.status === 200 &&
        res.data.isLiked === true &&
        res.data.dislikes === 0;
      log(
        "2️⃣2️⃣",
        "Like removes Dislike",
        success,
        `L:${res.data.likes} D:${res.data.dislikes}`
      );
      success ? passed++ : failed++;
    } catch (e) {
      log("2️⃣2️⃣", "Like removes Dislike", false, e.message);
      failed++;
    }
  }

  console.log("\n📌 COMMENT ENDPOINTS\n" + "-".repeat(40));

  // 23. Create Comment
  if (postId) {
    try {
      const res = await makeRequest(
        "POST",
        "/api/comments",
        {
          postId: postId,
          content: "This is a test comment",
        },
        token
      );
      const success = res.status === 201 && res.data._id;
      log("2️⃣3️⃣", "POST /api/comments", success, `Status: ${res.status}`);
      if (success) {
        commentId = res.data._id;
        passed++;
      } else failed++;
    } catch (e) {
      log("2️⃣3️⃣", "POST /api/comments", false, e.message);
      failed++;
    }
  }

  // 24. Get Comments by Post
  if (postId) {
    try {
      const res = await makeRequest(
        "GET",
        `/api/comments/post/${postId}`,
        null,
        token
      );
      const success = res.status === 200 && Array.isArray(res.data);
      log(
        "2️⃣4️⃣",
        "GET /api/comments/post/:postId",
        success,
        `Comments: ${res.data?.length}`
      );
      success ? passed++ : failed++;
    } catch (e) {
      log("2️⃣4️⃣", "GET Comments", false, e.message);
      failed++;
    }
  }

  // 25. Delete Comment
  if (commentId) {
    try {
      const res = await makeRequest(
        "DELETE",
        `/api/comments/${commentId}`,
        null,
        token
      );
      const success = res.status === 200;
      log("2️⃣5️⃣", "DELETE /api/comments/:id", success, `Status: ${res.status}`);
      success ? passed++ : failed++;
    } catch (e) {
      log("2️⃣5️⃣", "DELETE Comment", false, e.message);
      failed++;
    }
  }

  console.log("\n📌 DELETE & CLEANUP\n" + "-".repeat(40));

  // 26. Delete Post
  if (postId) {
    try {
      const res = await makeRequest(
        "DELETE",
        `/api/posts/${postId}`,
        null,
        token
      );
      const success = res.status === 200;
      log("2️⃣6️⃣", "DELETE /api/posts/:id", success, `Status: ${res.status}`);
      success ? passed++ : failed++;
    } catch (e) {
      log("2️⃣6️⃣", "DELETE Post", false, e.message);
      failed++;
    }
  }

  // Cleanup
  console.log("\n🧹 Cleaning up test data...");
  await User.findByIdAndDelete(userId);
  console.log("   Test user deleted");

  await mongoose.disconnect();

  console.log("\n" + "=".repeat(70));
  console.log(
    `📊 RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`
  );
  console.log(
    `📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`
  );
  console.log("=".repeat(70) + "\n");

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((e) => {
  console.error("Test Error:", e);
  process.exit(1);
});

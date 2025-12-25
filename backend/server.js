require("dotenv").config();
const app = require("./src/app");
const db = require("./src/config/db");
const PORT = process.env.PORT;

db.connect()
  .then(
    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
    })
  )
  .catch((err) => {
    console.error("Failed to start server", err);
    process.exit(1);
  });

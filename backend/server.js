const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const downloaderRoutes = require("./routes/downloader");

const app = express();
const PORT = 8000;

app.use(cors());
app.use(bodyParser.json());
app.use("/api", downloaderRoutes); // ✅ Changed

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

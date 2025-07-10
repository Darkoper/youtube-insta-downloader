const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const downloaderRoutes = require("./routes/downloader");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// Serve downloaded files
app.use("/downloads", express.static(path.join(__dirname, "downloads")));

// Routes
app.use("/api/download", downloaderRoutes);

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

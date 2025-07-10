const express = require("express");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const router = express.Router();

router.post("/", (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  const outputDir = path.join(__dirname, "..", "downloads");
  const outputPath = path.join(outputDir, "downloaded-video.mp4");

  // Make sure the downloads folder exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const ytDlpPath = `"${path.join(__dirname, "..", "yt-tool", "yt-dlp.exe")}"`;
  const cmd = `${ytDlpPath} -f best -o "${outputPath}" "${url}"`;

  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.error("❌ yt-dlp error:", stderr || error.message);
      return res.status(500).json({ error: "Download failed" });
    }

    // Stream the file to client
    res.download(outputPath, "video.mp4", (err) => {
      if (err) {
        console.error("❌ File send error:", err);
        res.status(500).json({ error: "Failed to send file" });
      } else {
        console.log("✅ File sent to client successfully");
      }
    });
  });
});

module.exports = router;

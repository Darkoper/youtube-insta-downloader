// routes/downloader.js
const express = require("express");
const { spawn, exec } = require("child_process");
const path = require("path");
const fs = require("fs");

const router = express.Router();


router.post("/download", (req, res) => {
  const { url, format_id } = req.body;

  if (!url || !format_id) {
    return res.status(400).json({ error: "URL and format_id are required" });
  }

  const ytDlpPath = path.join(__dirname, "..", "yt-tool", "yt-dlp.exe");

  // Set appropriate headers so browser understands file download
  res.setHeader("Content-Disposition", `attachment; filename="${safeTitle}.mp4"`);
  res.setHeader("Content-Type", "video/mp4");

 const ytProcess = spawn(ytDlpPath, [
  "-f",
  `${format_id}+bestaudio`, // 👈 Merge audio with selected video
  "-o",
  "-", // Stream to stdout
  url,
]);

  ytProcess.stdout.pipe(res); // 🔥 Directly stream to client

  ytProcess.stderr.on("data", (data) => {
    console.error(`yt-dlp stderr: ${data}`);
  });

  ytProcess.on("error", (err) => {
    console.error("yt-dlp error:", err);
    res.status(500).json({ error: "Download error" });
  });

  ytProcess.on("close", (code) => {
    console.log(`yt-dlp exited with code ${code}`);
  });
});

// Fetch available formats (for frontend dropdown)
router.post("/formats", (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });

  const ytDlpPath = `"${path.join(__dirname, "..", "yt-tool", "yt-dlp.exe")}"`;
  const cmd = `${ytDlpPath} -J --no-warnings "${url}"`;

  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      console.error("❌ yt-dlp error:", stderr || err.message);
      return res.status(500).json({ error: "Failed to fetch formats" });
    }

    try {
      const info = JSON.parse(stdout);
      const formats = info.formats
        .filter(f => f.ext === "mp4" && f.url)
        .map(f => ({
          format_id: f.format_id,
          quality: f.format_note || `${f.height}p`,
          ext: f.ext,
          url: f.url,
          size: f.filesize ? `${(f.filesize / 1024 / 1024).toFixed(2)} MB` : null,
        }));

      res.json({
        title: info.title,
        thumbnail: info.thumbnail,
        formats,
      });
    } catch (parseErr) {
      console.error("❌ JSON parse error:", parseErr.message);
      return res.status(500).json({ error: "Invalid format data received" });
    }
  });
});

router.get("/file/:filename", (req, res) => {
  const filePath = path.join(__dirname, "..", "downloads", req.params.filename);
  res.download(filePath, err => {
    if (err) {
      console.error("❌ Error sending file:", err);
      res.status(500).json({ error: "File download failed" });
    }
  });
});

module.exports = router;

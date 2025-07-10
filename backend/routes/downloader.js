const express = require("express");
const { spawn, exec } = require("child_process");
const path = require("path");
const fs = require("fs");

const router = express.Router();

let currentProgress = {}; // 🔁 Store progress keyed by video URL

// 🚀 Download Route
router.post("/download", (req, res) => {
  const { url, format_id } = req.body;

  if (!url || !format_id) {
    return res.status(400).json({ error: "URL and format_id are required" });
  }

  const ytDlpPath = path.join(__dirname, "..", "yt-tool", "yt-dlp.exe");

  // Set headers for browser download
  res.setHeader("Content-Disposition", `attachment; filename="video.mp4"`);
  res.setHeader("Content-Type", "video/mp4");

  // Add `+bestaudio` for audio merge
  const ytProcess = spawn(ytDlpPath, [
    "-f",
    `${format_id}+bestaudio`, // 🔥 auto merge
    "-o",
    "-", // stream to stdout
    url,
  ]);

  // Pipe directly to browser
  ytProcess.stdout.pipe(res);

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


// 📦 Fetch Available Formats
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
        .filter((f) => f.ext === "mp4" && f.url)
        .map((f) => ({
          format_id: f.format_id,
          quality: f.format_note || `${f.height}p`,
          ext: f.ext,
          url: f.url,
          size: f.filesize
            ? `${(f.filesize / 1024 / 1024).toFixed(2)} MB`
            : null,
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

// 📡 SSE Progress Route
router.get("/progress", (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "URL is required" });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const interval = setInterval(() => {
    const progress = currentProgress[url] || 0;
    res.write(`data: ${JSON.stringify({ progress })}\n\n`);
  }, 500);

  req.on("close", () => clearInterval(interval));
});

module.exports = router;

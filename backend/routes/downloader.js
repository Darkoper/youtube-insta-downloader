const express = require("express");
const { spawn, exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");

const router = express.Router();

let currentProgress = {}; // 🔁 Store progress keyed by video URL

// Determine the correct yt-dlp binary based on OS
const ytBinary = os.platform() === "win32" ? "yt-dlp.exe" : "yt-dlp";
const ytDlpPath = path.join(__dirname, "..", "yt-tool", ytBinary);
const cookiesPath = path.join(__dirname, "..", "yt-tool", "cookies.txt");
const cookiesArg = fs.existsSync(cookiesPath) ? ["--cookies", cookiesPath] : [];

// 🚀 Download Route
router.post("/download", (req, res) => {
  const { url, format_id, ext } = req.body;

  if (!url || !format_id) {
    return res.status(400).json({ error: "URL and format_id are required" });
  }

  const outputPath = path.join(__dirname, "..", "downloads", `video.${ext || "mp4"}`);

  // yt-dlp command
  // force merging with best audio if video-only format selected
  const cmd = `"${ytDlpPath}" -f "${format_id}+bestaudio" --merge-output-format mp4 -o "${outputPath}" "${url}"`;


  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      console.error("yt-dlp error:", stderr || err.message);
      return res.status(500).json({ error: "Download failed" });
    }

    // Stream the file as download
    res.download(outputPath, `video.${ext || "mp4"}`, (downloadErr) => {
      if (downloadErr) {
        console.error("Download response error:", downloadErr);
      }

      // Clean up file after sending
      fs.unlink(outputPath, (unlinkErr) => {
        if (unlinkErr) console.error("Failed to delete file:", unlinkErr);
      });
    });
  });
});

// 📦 Fetch Available Formats
router.post("/formats", (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });

  const cmd = `"${ytDlpPath}" -J --no-warnings "${url}"`;

  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      console.error("yt-dlp error:", stderr || err.message);
      return res.status(500).json({ error: "Failed to fetch formats" });
    }

    try {
      const info = JSON.parse(stdout);

      // ✅ Filter out only usable formats (video/audio with URLs)
      const formats = (info.formats || [])
      .filter(f =>
        f.url &&
        (f.vcodec !== "none" || f.acodec !== "none") &&
        f.protocol !== "mhtml"
      ).map(f => ({
        format_id: f.format_id,
        ext: f.ext,
        quality: f.format_note || f.resolution || `${f.width || "?"}x${f.height || "?"}`,
        hasVideo: f.vcodec !== "none",
        hasAudio: f.acodec !== "none",
        size: f.filesize ? `${(f.filesize / (1024 * 1024)).toFixed(1)} MB` : "Unknown Size",
        fps: f.fps || null
      }));

      res.json({ title: info.title, formats });
    } catch (parseErr) {
      console.error("JSON parse error:", parseErr.message);
      res.status(500).json({ error: "Failed to parse yt-dlp output" });
    }
  });
});








// Serve downloaded files
router.get("/file/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, "..", "downloads", filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Content-Type", "video/mp4");

  const stream = fs.createReadStream(filePath);
  
  stream.on("error", (err) => {
    console.error("Error streaming file:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Error streaming file" });
    }
  });

  stream.on("end", () => {
    // Delete the file after successful download
    setTimeout(() => {
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error("Error deleting file:", err);
        } else {
          console.log("File deleted successfully:", filename);
        }
      });
    }, 1000);
  });

  stream.pipe(res);
});

// 📡 SSE Progress Route
router.get("/progress", (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "URL is required" });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let sentComplete = false;
  const interval = setInterval(() => {
    const progress = currentProgress[url] || 0;
    // If download is complete, send status and dummy downloadUrl
    if (progress === 100 && !sentComplete) {
      res.write(`data: ${JSON.stringify({ progress, status: "completed", downloadUrl: null, filename: "video.mp4" })}\n\n`);
      sentComplete = true;
    } else {
      res.write(`data: ${JSON.stringify({ progress })}\n\n`);
    }
  }, 500);

  req.on("close", () => clearInterval(interval));
});

module.exports = router;

// VideoDownloader.jsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  YoutubeIcon,
  Video,
  ArrowDown,
  ChevronDown,
  Download,
  Monitor,
  Film,
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { toast } from "../hooks/useToast";

const VideoDownloader = () => {
  const [url, setUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [videoData, setVideoData] = useState(null);
  const [activeTab, setActiveTab] = useState("YoutubeIcon");
  const [downloadProgress, setDownloadProgress] = useState(null);

  const handleDownload = async () => {
    if (!url.trim()) {
      toast({
        title: "URL Required",
        description: "Please paste a video URL to continue",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      const res = await fetch("http://localhost:5000/api/formats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setVideoData({
        title: data.title,
        thumbnail: data.thumbnail,
        formats: data.formats,
      });

      toast({
        title: "Formats Loaded ✨",
        description: "Choose a resolution to download",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error Fetching Formats",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFormatDownload = async (format_id) => {
    setDownloadProgress(0);

    const source = new EventSource(
      `http://localhost:5000/api/progress?url=${encodeURIComponent(
        url
      )}&format_id=${format_id}`
    );

    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // console.log("Progress data:", data);

        if (data.progress !== undefined) {
          setDownloadProgress(Math.round(data.progress));
        }

        // Handle completion and download URL from backend
        if (data.status === "completed" && data.downloadUrl) {
          const a = document.createElement("a");
          a.href = data.downloadUrl;
          a.download = data.filename || "video.mp4";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          source.close();
          setDownloadProgress(null);
        }
      } catch (error) {
        console.error("Error parsing progress:", error);
      }
    };

    // Just trigger the download, don't wait for response
    fetch("http://localhost:5000/api/download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, format_id }),
    }).catch((err) => {
      console.error("Download failed:", err);
      source.close();
      setDownloadProgress(null);
    });
  };

  return (
    <section className="px-6 py-20">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative"
        >
          <div className="relative p-8 md:p-12 rounded-3xl bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 shadow-2xl">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/10 to-cyan-500/10 backdrop-blur-xl"></div>
            <div className="relative z-10">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-800/50 border border-slate-600/30">
                  <TabsTrigger value="YoutubeIcon">
                    {" "}
                    <YoutubeIcon className="w-5 h-5 mr-2" /> Youtube{" "}
                  </TabsTrigger>
                  <TabsTrigger value="instagram">
                    {" "}
                    <Video className="w-5 h-5 mr-2" /> Instagram{" "}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="YoutubeIcon">
                  <UrlInput
                    url={url}
                    setUrl={setUrl}
                    onDownload={handleDownload}
                    isProcessing={isProcessing}
                    placeholder="https://YoutubeIcon.com/watch?v=..."
                  />
                </TabsContent>
                <TabsContent value="instagram">
                  <UrlInput
                    url={url}
                    setUrl={setUrl}
                    onDownload={handleDownload}
                    isProcessing={isProcessing}
                    placeholder="https://instagram.com/p/..."
                  />
                </TabsContent>
              </Tabs>

              <AnimatePresence>
                {videoData && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ duration: 0.5 }}
                    className="mt-8"
                  >
                    <VideoPreviewCard
                      videoData={videoData}
                      onFormatDownload={handleFormatDownload}
                      downloadProgress={downloadProgress}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const UrlInput = ({ url, setUrl, onDownload, isProcessing, placeholder }) => (
  <div className="space-y-4">
    <div className="relative">
      <Input
        type="url"
        placeholder={placeholder}
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="h-14 pl-4 pr-32 text-lg bg-slate-800/50 border-slate-600/50 rounded-2xl"
      />
      <Button
        onClick={onDownload}
        disabled={isProcessing}
        className="absolute right-2 top-2 h-10 px-6 bg-gradient-to-r from-purple-600 to-cyan-500 rounded-xl"
      >
        {isProcessing ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
          />
        ) : (
          <ArrowDown className="w-5 h-5" />
        )}
      </Button>
    </div>
  </div>
);

const VideoPreviewCard = ({
  videoData,
  onFormatDownload,
  downloadProgress,
}) => {
  const [openDropdown, setOpenDropdown] = useState(null);

  // Function to organize formats by resolution
  const organizeFormats = (formats) => {
    if (!formats) return {};

    // Filter out formats with unknown size and duplicates
    const validFormats = formats.filter(
      (f) =>
        f.size &&
        f.size !== "Unknown Size" &&
        f.quality &&
        f.quality !== "Unknown"
    );

    // Remove duplicates based on quality and size
    const uniqueFormats = validFormats.reduce((acc, current) => {
      const key = `${current.quality}-${current.size}`;
      if (!acc.find((item) => `${item.quality}-${item.size}` === key)) {
        acc.push(current);
      }
      return acc;
    }, []);

    // Group by resolution
    const grouped = {};
    uniqueFormats.forEach((format) => {
      const resolution = format.quality;
      if (!grouped[resolution]) {
        grouped[resolution] = [];
      }
      grouped[resolution].push(format);
    });

    return grouped;
  };

  const groupedFormats = organizeFormats(videoData.formats);

  // Define resolution categories
  const resolutionCategories = {
    "4K": ["2160p", "4320p60", "2160p60"],
    HD: ["1440p", "1440p60", "1080p", "1080p60"],
    "720p": ["720p", "720p60"],
    "480p": ["480p"],
    "360p": ["360p"],
    "144p": ["144p"],
  };

  const getFormatsForCategory = (category) => {
    const resolutions = resolutionCategories[category];
    const formats = [];

    resolutions.forEach((res) => {
      if (groupedFormats[res]) {
        formats.push(...groupedFormats[res]);
      }
    });

    return formats;
  };

  const toggleDropdown = (category) => {
    setOpenDropdown(openDropdown === category ? null : category);
  };

  const getFileSizeInMB = (size) => {
    if (!size) return "Unknown";
    const match = size.match(/(\d+\.?\d*)\s*(MB|GB|KB)/i);
    if (match) {
      const value = parseFloat(match[1]);
      const unit = match[2].toUpperCase();
      if (unit === "GB") return `${(value * 1024).toFixed(1)} MB`;
      if (unit === "KB") return `${(value / 1024).toFixed(1)} MB`;
      return `${value} MB`;
    }
    return size;
  };

  return (
    <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-600/30">
      {/* Video Info Row */}
      <div className="flex items-start gap-6 mb-6">
        {/* Thumbnail */}
        <div className="relative flex-shrink-0">
          <img
            src={videoData.thumbnail}
            alt="Video thumbnail"
            className="w-40 h-30 object-contain rounded-sm border   border-slate-600/30"
          />
        </div>

        {/* Video Details */}
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-semibold text-white mb-2 line-clamp-2">
            {videoData.title}
          </h3>

          {downloadProgress !== null && (
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 bg-slate-700/50 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-purple-500 to-cyan-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${downloadProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <span className="text-sm text-green-400 font-medium">
                {downloadProgress}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Download Options */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-slate-300 mb-3">
          Choose Quality:
        </h4>

        {Object.entries(resolutionCategories).map(([category, resolutions]) => {
          const categoryFormats = getFormatsForCategory(category);

          if (categoryFormats.length === 0) return null;

          return (
            <div key={category} className="relative">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleDropdown(category)}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-700/50 border border-slate-600/30 hover:bg-slate-700/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {category === "4K" && (
                    <Film className="w-5 h-5 text-purple-400" />
                  )}
                  {category === "HD" && (
                    <Monitor className="w-5 h-5 text-cyan-400" />
                  )}
                  {!["4K", "HD"].includes(category) && (
                    <Video className="w-5 h-5 text-slate-400" />
                  )}

                  <span className="text-white font-medium">{category}</span>
                  <span className="text-slate-400 text-sm">
                    ({categoryFormats.length} option
                    {categoryFormats.length > 1 ? "s" : ""})
                  </span>
                </div>

                <motion.div
                  animate={{ rotate: openDropdown === category ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                </motion.div>
              </motion.button>

              <AnimatePresence>
                {openDropdown === category && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 right-0 mt-2 p-3 rounded-xl bg-slate-800/95 border border-slate-600/50 backdrop-blur-sm shadow-xl z-10"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {categoryFormats.map((format, index) => (
                        <motion.button
                          key={`${format.format_id}-${index}`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onFormatDownload(format.format_id)}
                          className="p-3 rounded-lg bg-slate-700/50 border border-slate-600/30 hover:bg-gradient-to-r hover:from-purple-600/20 hover:to-cyan-600/20 transition-all duration-200"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Download className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-semibold text-white">
                              {format.ext.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400">
                            {format.quality}
                          </div>
                          <div className="text-xs text-slate-500">
                            {getFileSizeInMB(format.size)}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VideoDownloader;

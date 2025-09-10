// VideoDownloader.jsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  YoutubeIcon,
  Video,
  ArrowRight,
  ChevronDown,
  Download,
  Monitor,
  Film,
  Star,
  Music,
  Headphones,
  AlertCircle,
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { toast } from "../hooks/useToast";

const BACKEND_URL = import.meta.env.BACKEND_URL || "http://localhost:8000";

const VideoDownloader = () => {
  const [url, setUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [videoData, setVideoData] = useState(null);
  const [activeTab, setActiveTab] = useState("youtube");
  const [downloadProgress, setDownloadProgress] = useState(null);
  const [currentDownloadId, setCurrentDownloadId] = useState(null);

  // Cleanup effect for EventSource
  useEffect(() => {
    return () => {
      // Cleanup any active EventSource connections
      if (window.currentEventSource) {
        window.currentEventSource.close();
        window.currentEventSource = null;
      }
    };
  }, []);

  // Validate URL function
  const isValidUrl = (urlString) => {
    try {
      const url = new URL(urlString);
      // Check for common video platforms
      const validDomains = [
        'youtube.com', 'youtu.be', 'www.youtube.com',
        'instagram.com', 'www.instagram.com',
        'tiktok.com', 'www.tiktok.com',
        'facebook.com', 'www.facebook.com',
        'twitter.com', 'www.twitter.com', 'x.com',
        'vimeo.com', 'www.vimeo.com'
      ];
      
      return validDomains.some(domain => 
        url.hostname === domain || url.hostname.includes(domain)
      );
    } catch (error) {
      return false;
    }
  };

  const handleDownload = async () => {
    if (!url.trim()) {
      toast({
        title: "URL Required",
        description: "Please paste a video URL to continue",
        variant: "destructive",
      });
      return;
    }

    if (!isValidUrl(url.trim())) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid video URL from supported platforms",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      setVideoData(null); // Reset previous data
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

      const res = await fetch(`${BACKEND_URL}/api/formats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }));
        throw new Error(errorData.error || `Server error: ${res.status}`);
      }

      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.formats || !Array.isArray(data.formats) || data.formats.length === 0) {
        throw new Error("No downloadable formats found for this video");
      }

      setVideoData({
        title: data.title || "Unknown Title",
        thumbnail: data.thumbnail || null,
        duration: data.duration || null,
        uploader: data.uploader || null,
        formats: data.formats,
      });

      toast({
        title: "Formats Loaded ✨",
        description: "Choose a resolution to download",
      });

    } catch (err) {
      console.error("Format fetch error:", err);
      
      let errorMessage = "Something went wrong";
      if (err.name === 'AbortError') {
        errorMessage = "Request timed out - please try again";
      } else if (err.message.includes('fetch')) {
        errorMessage = "Unable to connect to server";
      } else {
        errorMessage = err.message || "Failed to fetch video information";
      }

      toast({
        title: "Error Fetching Formats",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
 

const handleFormatDownload = async (format) => {
   console.log("Sending download request:", {
  url: url,   // 👈 tumhara input url state
  format_id: format.format_id,
  ext: format.ext,
});
  try {
    // Set up progress tracking
    setCurrentDownloadId(format.format_id);
    setDownloadProgress(0);
    
    // Set up EventSource for progress updates
    const eventSource = new EventSource(`${BACKEND_URL}/api/progress?url=${encodeURIComponent(url)}`);
    window.currentEventSource = eventSource;
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setDownloadProgress(data.progress);
      
      if (data.progress === 100 || data.status === "completed") {
        eventSource.close();
        window.currentEventSource = null;
      }
    };
    
    eventSource.onerror = () => {
      eventSource.close();
      window.currentEventSource = null;
    };

    const res = await fetch(`${BACKEND_URL}/api/download`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: url,
        format_id: format.format_id,
        ext: format.ext,
      }),
    });

    if (!res.ok) {
      throw new Error("Download failed");
    }

    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `video.${format.ext || "mp4"}`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(downloadUrl);
    
    // Reset progress after successful download
    setTimeout(() => {
      setDownloadProgress(null);
      setCurrentDownloadId(null);
    }, 2000);
    
  } catch (err) {
    console.error("Download failed:", err);
    setDownloadProgress(null);
    setCurrentDownloadId(null);
    alert("Download failed!");
  }
};




  // Reset function
  const resetDownloader = () => {
    setUrl("");
    setVideoData(null);
    setDownloadProgress(null);
    setCurrentDownloadId(null);
    setIsProcessing(false);
    
    if (window.currentEventSource) {
      window.currentEventSource.close();
      window.currentEventSource = null;
    }
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
                  <TabsTrigger value="youtube">
                    <YoutubeIcon className="w-5 h-5 mr-2" /> YouTube
                  </TabsTrigger>
                  <TabsTrigger value="instagram">
                    <Video className="w-5 h-5 mr-2" /> Instagram
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="youtube">
                  <UrlInput
                    url={url}
                    setUrl={setUrl}
                    onDownload={handleDownload}
                    isProcessing={isProcessing}
                    placeholder="https://youtube.com/watch?v=... or https://youtu.be/..."
                    onReset={resetDownloader}
                  />
                </TabsContent>
                <TabsContent value="instagram">
                  <UrlInput
                    url={url}
                    setUrl={setUrl}
                    onDownload={handleDownload}
                    isProcessing={isProcessing}
                    placeholder="https://instagram.com/p/... or https://instagram.com/reel/..."
                    onReset={resetDownloader}
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
                      isProcessing={isProcessing}
                      onReset={resetDownloader}
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

const UrlInput = ({ url, setUrl, onDownload, isProcessing, placeholder, onReset }) => (
  <div className="space-y-4">
    <div className="relative">
      <Input
        type="url"
        placeholder={placeholder}
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && !isProcessing && onDownload()}
        className="h-14 pl-4 pr-32 text-lg bg-slate-800/50 border-slate-600/50 rounded-2xl placeholder:text-slate-400"
        disabled={isProcessing}
      />
      <div className="absolute right-2 top-2 flex gap-2">
        {url && (
          <Button
            onClick={onReset}
            disabled={isProcessing}
            variant="ghost"
            size="sm"
            className="h-10 px-4 text-slate-400 hover:text-white"
          >
            Clear
          </Button>
        )}
        <Button
          onClick={onDownload}
          disabled={isProcessing || !url.trim()}
          className="h-10 px-6 bg-gradient-to-r from-purple-600 to-cyan-500 rounded-xl disabled:opacity-50"
        >
          {isProcessing ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
            />
          ) : (
            <ArrowRight className="w-5 h-5" />
          )}
        </Button>
      </div>
    </div>
  </div>
);

const VideoPreviewCard = ({
  videoData,
  onFormatDownload,
  downloadProgress,
  isProcessing,
  onReset,
}) => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [mediaType, setMediaType] = useState("video");

  // Function to organize formats by resolution
  const organizeFormats = (formats) => {
    if (!formats || !Array.isArray(formats)) return {};

    // Filter out invalid formats
    const validFormats = formats.filter(
      (f) =>
        f &&
        f.format_id &&
        f.quality &&
        f.ext &&
        f.quality !== "Unknown" &&
        f.hasVideo !== undefined
    );

    // Remove duplicates based on quality and extension
    const uniqueFormats = validFormats.reduce((acc, current) => {
      const key = `${current.quality}-${current.ext}`;
      const existing = acc.find((item) => `${item.quality}-${item.ext}` === key);
      if (!existing) {
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

  // Function to get audio formats
  const getAudioFormats = (formats) => {
    if (!formats || !Array.isArray(formats)) return {};

    // Filter for audio-only formats
    const audioFormats = formats.filter(
      (f) =>
        f &&
        f.format_id &&
        f.hasAudio &&
        (!f.hasVideo || f.vcodec === "none") &&
        f.ext &&
        (f.ext === "mp3" ||
          f.ext === "m4a" ||
          f.ext === "webm" ||
          f.ext === "opus" ||
          f.acodec !== "none")
    );

    // Group by approximate bitrate/quality
    const groupedAudio = {};
    audioFormats.forEach((format) => {
      // Determine quality category based on format info
      let quality = "Standard";
      
      if (format.quality && format.quality.includes("medium")) {
        quality = "Medium (128kbps)";
      } else if (format.quality && format.quality.includes("high")) {
        quality = "High (192kbps)";
      } else if (format.quality && format.quality.includes("very_high")) {
        quality = "Very High (256kbps)";
      } else if (format.fps || format.quality === "tiny") {
        quality = "Low (96kbps)";
      } else {
        quality = "Standard (128kbps)";
      }

      if (!groupedAudio[quality]) {
        groupedAudio[quality] = [];
      }
      groupedAudio[quality].push(format);
    });

    return groupedAudio;
  };

  const groupedFormats = organizeFormats(videoData.formats);
  const audioFormats = getAudioFormats(videoData.formats);

  // Define resolution categories for better organization
  const resolutionOrder = [
    "2160p", "2160p60", "1440p", "1440p60", "1080p", "1080p60",
    "720p", "720p60", "480p", "360p", "240p", "144p"
  ];

  const getOrderedResolutions = () => {
    const availableResolutions = Object.keys(groupedFormats);
    return resolutionOrder.filter(res => availableResolutions.includes(res));
  };

  const toggleDropdown = (category) => {
    setOpenDropdown(openDropdown === category ? null : category);
  };

  const getFileSizeDisplay = (size) => {
    if (!size || size === "N/A" || size === "Unknown Size") {
      return "Size unknown";
    }
    return size;
  };

  const renderVideoContent = () => {
    const orderedResolutions = getOrderedResolutions();
    
    if (orderedResolutions.length === 0) {
      return (
        <div className="text-center py-8 text-slate-400">
          <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No video formats available</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-slate-300 mb-3">
          Choose Video Quality:
        </h4>

        {orderedResolutions.map((resolution) => {
          const formats = groupedFormats[resolution];
          if (!formats || formats.length === 0) return null;

          // Determine icon based on resolution
          let icon = <Video className="w-5 h-5 text-slate-400" />;
          if (resolution.includes("2160")) {
            icon = <Star className="w-5 h-5 text-amber-400" />;
          } else if (resolution.includes("1440") || resolution.includes("1080")) {
            icon = <Monitor className="w-5 h-5 text-cyan-400" />;
          } else if (resolution.includes("720")) {
            icon = <Film className="w-5 h-5 text-purple-400" />;
          }

          return (
            <div key={resolution}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleDropdown(resolution)}
                disabled={isProcessing}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-700/50 border border-slate-600/30 hover:bg-slate-700/70 transition-colors disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  {icon}
                  <span className="text-white font-medium">{resolution}</span>
                  <span className="text-slate-400 text-sm">
                    ({formats.length} option{formats.length > 1 ? "s" : ""})
                  </span>
                </div>

                <motion.div
                  animate={{ rotate: openDropdown === resolution ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                </motion.div>
              </motion.button>

              <AnimatePresence>
                {openDropdown === resolution && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 p-3 rounded-xl bg-slate-800/95 border border-slate-600/50 backdrop-blur-sm shadow-xl">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {formats.map((format, index) => (
                          <motion.button
                            key={`${format.format_id}-${index}`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onFormatDownload(format)}   // ✅ pass full format object
                            disabled={isProcessing}
                            className="p-3 rounded-lg bg-slate-700/50 border border-slate-600/30 hover:bg-gradient-to-r hover:from-purple-600/20 hover:to-cyan-600/20 transition-all duration-200 disabled:opacity-50"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Download className="w-4 h-4 text-slate-400" />
                              <span className="text-sm font-semibold text-white">
                                {format.ext.toUpperCase()}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 mb-1">
                              {format.quality}
                              {format.fps && ` • ${format.fps}fps`}
                            </div>
                            <div className="text-xs text-slate-500">
                              {getFileSizeDisplay(format.size)}
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    );
  };

  const renderAudioContent = () => {
    const audioQualities = Object.keys(audioFormats);
    
    if (audioQualities.length === 0) {
      return (
        <div className="text-center py-8 text-slate-400">
          <Music className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No audio-only formats available for this video</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-slate-300 mb-3">
          Choose Audio Quality:
        </h4>

        {audioQualities.map((quality) => {
          const formats = audioFormats[quality];
          if (!formats || formats.length === 0) return null;

          // Determine icon based on quality
          let icon = <Music className="w-5 h-5 text-slate-400" />;
          if (quality.includes("Very High") || quality.includes("256")) {
            icon = <Star className="w-5 h-5 text-amber-400" />;
          } else if (quality.includes("High") || quality.includes("192")) {
            icon = <Headphones className="w-5 h-5 text-purple-400" />;
          } else if (quality.includes("Medium") || quality.includes("128")) {
            icon = <Music className="w-5 h-5 text-cyan-400" />;
          }

          return (
            <div key={quality}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleDropdown(quality)}
                disabled={isProcessing}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-700/50 border border-slate-600/30 hover:bg-slate-700/70 transition-colors disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  {icon}
                  <span className="text-white font-medium">{quality}</span>
                  <span className="text-slate-400 text-sm">
                    ({formats.length} option{formats.length > 1 ? "s" : ""})
                  </span>
                </div>

                <motion.div
                  animate={{ rotate: openDropdown === quality ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                </motion.div>
              </motion.button>

              <AnimatePresence>
                {openDropdown === quality && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 p-3 rounded-xl bg-slate-800/95 border border-slate-600/50 backdrop-blur-sm shadow-xl">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {formats.map((format, index) => (
                          <motion.button
                            key={`${format.format_id}-${index}`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onFormatDownload(format)}
                            disabled={isProcessing}
                            className="p-3 rounded-lg bg-slate-700/50 border border-slate-600/30 hover:bg-gradient-to-r hover:from-purple-600/20 hover:to-cyan-600/20 transition-all duration-200 disabled:opacity-50"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Download className="w-4 h-4 text-slate-400" />
                              <span className="text-sm font-semibold text-white">
                                {format.ext.toUpperCase()}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 mb-1">
                              Audio Only
                            </div>
                            <div className="text-xs text-slate-500">
                              {getFileSizeDisplay(format.size)}
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-600/30">
      {/* Video Info Header */}
      <div className="flex items-start gap-6 mb-6">
        {/* Thumbnail */}
        <div className="relative flex-shrink-0">
          {videoData.thumbnail ? (
            <img
              src={videoData.thumbnail}
              alt="Video thumbnail"
              className="w-40 h-30 object-cover rounded-lg border border-slate-600/30"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-40 h-30 bg-slate-700/50 rounded-lg border border-slate-600/30 flex items-center justify-center">
              <Video className="w-8 h-8 text-slate-400" />
            </div>
          )}
        </div>

        {/* Video Details */}
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-semibold text-white mb-2 line-clamp-2">
            {videoData.title}
          </h3>
          
          <div className="flex flex-wrap gap-4 text-sm text-slate-400 mb-2">
            {videoData.uploader && (
              <span>By: {videoData.uploader}</span>
            )}
            {videoData.duration && (
              <span>Duration: {Math.floor(videoData.duration / 60)}:{(videoData.duration % 60).toString().padStart(2, '0')}</span>
            )}
          </div>

          {/* Progress Bar */}
          {downloadProgress !== null && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-300">Downloading...</span>
                <span className="text-sm text-green-400 font-medium">
                  {Math.round(downloadProgress)}%
                </span>
              </div>
              <div className="w-full bg-slate-700/50 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-cyan-500 h-2 rounded-full"
                  style={{ width: `${Math.round(downloadProgress)}%`, transition: 'width 0.3s' }}
                />
              </div>
            </div>
          )}

          {/* Reset Button */}
          <div className="mt-4">
            <Button
              onClick={onReset}
              variant="outline"
              size="sm"
              className="border-slate-600/50 text-slate-300 hover:text-white"
            >
              Try Another Video
            </Button>
          </div>
        </div>
      </div>

      {/* Format Selection Tabs */}
      <Tabs value={mediaType} onValueChange={setMediaType} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-800/50 border border-slate-600/30">
          <TabsTrigger value="video" disabled={isProcessing}>
            <Video className="w-5 h-5 mr-2" />
            Video ({Object.keys(groupedFormats).length})
          </TabsTrigger>
          <TabsTrigger value="audio" disabled={isProcessing}>
            <Music className="w-5 h-5 mr-2" />
            Audio ({Object.keys(audioFormats).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="video">{renderVideoContent()}</TabsContent>
        <TabsContent value="audio">{renderAudioContent()}</TabsContent>
      </Tabs>
    </div>
  );
};

export default VideoDownloader;
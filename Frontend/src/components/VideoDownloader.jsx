// VideoDownloader.jsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Youtube, Video, ArrowDown } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { toast } from "../hooks/useToast";

const VideoDownloader = () => {
  const [url, setUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [videoData, setVideoData] = useState(null);
  const [activeTab, setActiveTab] = useState("youtube");

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
      const res = await fetch("http://localhost:5000/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const contentType = res.headers.get("content-type");

if (!contentType || !contentType.includes("application/json")) {
  throw new Error("Expected JSON but received non-JSON response.");
}

const data = await res.json();
      if (data.error) throw new Error(data.error);

      setVideoData({
        title: data.title,
        thumbnail: data.thumbnail,
        formats: data.formats,
      });
      toast({
        title: "Video Found! ✨",
        description: "Choose a format to download",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Download Failed",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFormatDownload = (filename) => {
    const link = document.createElement("a");
    link.href = `http://localhost:5000/downloads/${filename}`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-800/50 border border-slate-600/30">
                  <TabsTrigger value="youtube"> <Youtube className="w-5 h-5 mr-2" /> YouTube </TabsTrigger>
                  <TabsTrigger value="instagram"> <Video className="w-5 h-5 mr-2" /> Instagram </TabsTrigger>
                </TabsList>
                <TabsContent value="youtube">
                  <UrlInput url={url} setUrl={setUrl} onDownload={handleDownload} isProcessing={isProcessing} placeholder="https://youtube.com/watch?v=..." />
                </TabsContent>
                <TabsContent value="instagram">
                  <UrlInput url={url} setUrl={setUrl} onDownload={handleDownload} isProcessing={isProcessing} placeholder="https://instagram.com/p/..." />
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
                    <VideoPreviewCard videoData={videoData} onFormatDownload={handleFormatDownload} />
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
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
        ) : (
          <ArrowDown className="w-5 h-5" />
        )}
      </Button>
    </div>
  </div>
);

const VideoPreviewCard = ({ videoData, onFormatDownload }) => (
  <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-600/30">
    <div className="flex flex-col md:flex-row items-start gap-6">
      <div className="relative flex-shrink-0">
        <img src={videoData.thumbnail} alt="Video thumbnail" className="w-32 h-24 md:w-48 md:h-36 object-cover rounded-xl" />
      </div>

      <div className="flex-1 space-y-4">
        <h3 className="text-xl font-semibold text-white mb-2">{videoData.title}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {videoData.formats?.map((f, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onFormatDownload(f.filename)}
              className="p-3 rounded-xl bg-slate-700/50 border border-slate-600/30 hover:bg-gradient-to-r hover:from-purple-600/20 hover:to-cyan-600/20"
            >
              <div className="text-sm font-semibold text-white">{f.ext.toUpperCase()}</div>
              <div className="text-xs text-slate-400">{f.quality}</div>
              <div className="text-xs text-slate-500">{f.size || 'Unknown Size'}</div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default VideoDownloader;
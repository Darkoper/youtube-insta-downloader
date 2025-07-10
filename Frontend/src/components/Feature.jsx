import { motion } from "framer-motion";
import { Zap, Shield, Smartphone, Download, Video, Youtube } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Download videos in seconds with our optimized servers",
      gradient: "from-yellow-400 to-orange-500"
    },
    {
      icon: Shield,
      title: "100% Secure",
      description: "Your privacy is protected. No data stored or tracked",
      gradient: "from-green-400 to-blue-500"
    },
    {
      icon: Smartphone,
      title: "Mobile Friendly",
      description: "Works perfectly on all devices and screen sizes",
      gradient: "from-purple-400 to-pink-500"
    },
    {
      icon: Download,
      title: "Multiple Formats",
      description: "MP4, MP3, and various quality options available",
      gradient: "from-cyan-400 to-blue-500"
    },
    {
      icon: Video,
      title: "High Quality",
      description: "Download up to 4K resolution videos",
      gradient: "from-red-400 to-pink-500"
    },
    {
      icon: Youtube,
      title: "Platform Support",
      description: "YouTube, Instagram, and more platforms coming soon",
      gradient: "from-indigo-400 to-purple-500"
    }
  ];

  return (
    <section className="px-6 py-20">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Why Choose VidFlow?
            </span>
          </h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Experience the next generation of video downloading with premium features and lightning-fast performance
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="group relative p-8 rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 hover:border-purple-500/30 transition-all duration-500"
              >
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10">
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${feature.gradient} mb-6`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-cyan-400 group-hover:bg-clip-text transition-all duration-300">
                    {feature.title}
                  </h3>
                  
                  <p className="text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Floating particles effect */}
                <div className="absolute top-4 right-4 w-2 h-2 bg-purple-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-all duration-300"></div>
                <div className="absolute bottom-8 left-8 w-1 h-1 bg-cyan-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-all duration-300 delay-100"></div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;

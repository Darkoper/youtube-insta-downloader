import { motion } from "framer-motion";
import { Video, Youtube, Download } from "lucide-react";

const Footer = () => {
  return (
    <footer className="relative px-6 py-16 border-t border-slate-800/50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-4 gap-12"
        >
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="flex items-center space-x-2 p-3 rounded-xl bg-gradient-to-r from-purple-500/20 to-cyan-500/20 backdrop-blur-sm border border-purple-500/30">
                <Video className="w-6 h-6 text-cyan-400" />
                <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  VidFlow
                </span>
              </div>
            </div>
            <p className="text-slate-400 leading-relaxed max-w-md">
              The ultimate video downloader for modern users. Fast, secure, and beautifully designed for the best downloading experience.
            </p>
            <div className="flex items-center space-x-6 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">1M+</div>
                <div className="text-slate-500 text-sm">Downloads</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">50K+</div>
                <div className="text-slate-500 text-sm">Happy Users</div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-6">Quick Links</h3>
            <ul className="space-y-3">
              {["YouTube Downloader", "Instagram Downloader", "How to Use", "Supported Formats"].map((link) => (
                <li key={link}>
                  <motion.a
                    whileHover={{ x: 5 }}
                    href="#"
                    className="text-slate-400 hover:text-purple-400 transition-colors duration-300"
                  >
                    {link}
                  </motion.a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-6">Support</h3>
            <ul className="space-y-3">
              {["FAQ", "Contact Us", "Privacy Policy", "Terms of Service"].map((link) => (
                <li key={link}>
                  <motion.a
                    whileHover={{ x: 5 }}
                    href="#"
                    className="text-slate-400 hover:text-cyan-400 transition-colors duration-300"
                  >
                    {link}
                  </motion.a>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-16 pt-8 border-t border-slate-800/50 flex flex-col md:flex-row items-center justify-between"
        >
          <p className="text-slate-500 text-sm">
            © 2024 VidFlow. All rights reserved. Made with ❤️ for video enthusiasts.
          </p>
          <div className="flex items-center space-x-6 mt-4 md:mt-0">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="p-2 rounded-full bg-slate-800/50 hover:bg-purple-500/20 transition-colors duration-300"
            >
              <Youtube className="w-5 h-5 text-slate-400" />
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="p-2 rounded-full bg-slate-800/50 hover:bg-purple-500/20 transition-colors duration-300"
            >
              <Download className="w-5 h-5 text-slate-400" />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;

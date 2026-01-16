import React from "react";
import { Link } from "react-router-dom";
import { 
  Instagram, 
  Twitter, 
  Facebook, 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  Globe 
} from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-[#0B0F1A] text-gray-400 font-sans">
      <div className="max-w-7xl mx-auto px-6 pt-20 pb-10">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 pb-16">
          
          {/* Brand & Newsletter Section (Spans 4 columns) */}
          <div className="lg:col-span-4 space-y-8">
            <div>
              <h3 className="text-3xl font-black text-white tracking-tighter mb-4">
                STAY<span className="text-blue-500">NEXT</span>
              </h3>
              <p className="text-sm leading-relaxed max-w-xs">
                Revolutionizing your travel experience with seamless bookings and handpicked premium stays worldwide.
              </p>
            </div>

            {/* Newsletter */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-widest">Join our Newsletter</h4>
              <div className="flex items-center bg-gray-800/50 rounded-xl p-1 border border-gray-700 focus-within:border-blue-500 transition-all">
                <input 
                  type="email" 
                  placeholder="Your email address" 
                  className="bg-transparent border-none focus:ring-0 text-sm w-full px-3 outline-none text-white"
                />
                <button className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors">
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Links (Spans 2 columns) */}
          <div className="lg:col-span-2">
            <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-6">Explore</h4>
            <ul className="space-y-4 text-sm">
              <li><Link to="/" className="hover:text-blue-400 transition-colors">Home</Link></li>
              <li><Link to="/hotels" className="hover:text-blue-400 transition-colors">Find Hotels</Link></li>
              <li><Link to="/coupons" className="hover:text-blue-400 transition-colors">Exclusive Deals</Link></li>
              <li><Link to="/about" className="hover:text-blue-400 transition-colors">Our Story</Link></li>
            </ul>
          </div>

          {/* Support (Spans 2 columns) */}
          <div className="lg:col-span-2">
            <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-6">Support</h4>
            <ul className="space-y-4 text-sm">
              <li><Link to="/help" className="hover:text-blue-400 transition-colors">Help Center</Link></li>
              <li><Link to="/terms" className="hover:text-blue-400 transition-colors">Terms of Service</Link></li>
              <li><Link to="/privacy" className="hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/cancellation" className="hover:text-blue-400 transition-colors">Refund Policy</Link></li>
            </ul>
          </div>

          {/* Contact & Social (Spans 4 columns) */}
          <div className="lg:col-span-4 space-y-8">
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-6">Get in Touch</h4>
              <ul className="space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <MapPin size={18} className="text-blue-500 shrink-0" />
                  <span>123 Sky Tower, Business District,<br />Dubai, UAE</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone size={18} className="text-blue-500 shrink-0" />
                  <a href="tel:+1234567890" className="hover:text-white transition-colors">+1 (234) 567-890</a>
                </li>
                <li className="flex items-center gap-3">
                  <Mail size={18} className="text-blue-500 shrink-0" />
                  <a href="mailto:support@staynext.com" className="hover:text-white transition-colors">support@staynext.com</a>
                </li>
              </ul>
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-4">
              <SocialIcon icon={<Instagram size={20} />} />
              <SocialIcon icon={<Twitter size={20} />} />
              <SocialIcon icon={<Facebook size={20} />} />
              <SocialIcon icon={<Globe size={20} />} />
            </div>
          </div>

        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium tracking-wide">
          <p>© 2026 STAYNEXT INC. ALL RIGHTS RESERVED.</p>
          <div className="flex gap-8">
            <button className="hover:text-white transition-colors">Cookies Settings</button>
            <button className="hover:text-white transition-colors">Sitemap</button>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Sub-component for Social Icons
const SocialIcon = ({ icon }) => (
  <button className="w-10 h-10 rounded-full border border-gray-800 flex items-center justify-center hover:bg-blue-600 hover:border-blue-600 hover:text-white transition-all duration-300">
    {icon}
  </button>
);

export default Footer;
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logo3 from "../assests/logo3.png";
// Added Heart icon for wishlist
import { Menu, X, User, LogOut, BookOpen, ChevronDown, Heart } from "lucide-react";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    setIsLoggedIn(false);
    setProfileOpen(false);
    navigate("/auth");
  };

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Hotels", path: "/hotels" },
    { name: "Deals", path: "/coupons" },
    // Option 1: Add Wishlist to main nav links
    { name: "Wishlist", path: "/wishlist" },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled ? "py-2" : "py-4"
      }`}
    >
      <nav className={`mx-auto max-w-7xl px-4 sm:px-6 transition-all duration-300 ${
        scrolled 
          ? "bg-white/80 backdrop-blur-lg shadow-sm border border-gray-200/50 rounded-2xl" 
          : "bg-transparent"
      }`}>
        <div className="flex items-center justify-between h-14 md:h-16">
          
          {/* Logo */}
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => navigate("/")}>
           
            <span className={`text-3xl font-black tracking-tighter ${scrolled ? "text-blue-600" : "text-gray-900"}`}>
              StayNext
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => navigate(link.path)}
                className={`px-4 py-2 text-sm font-semibold rounded-full transition-all ${
                  isActive(link.path) 
                    ? "bg-blue-50 text-blue-600" 
                    : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                }`}
              >
                {link.name}
              </button>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Wishlist Quick Icon (Desktop Only) */}
            {isLoggedIn && (
              <button 
                onClick={() => navigate("/wishlist")}
                className={`hidden md:flex p-2 rounded-full transition-colors ${isActive('/wishlist') ? 'text-rose-500 bg-rose-50' : 'text-gray-600 hover:bg-gray-100 hover:text-rose-500'}`}
              >
                <Heart size={22} fill={isActive('/wishlist') ? "currentColor" : "none"} />
              </button>
            )}

            {!isLoggedIn ? (
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={() => navigate("/auth")}
                  className="px-5 py-2 text-sm font-bold text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Log in
                </button>
                <button
                  onClick={() => navigate("/auth")}
                  className="px-5 py-2.5 text-sm font-bold bg-gray-900 text-white rounded-xl hover:bg-blue-600 transition-all shadow-lg shadow-gray-200 active:scale-95"
                >
                  Sign up
                </button>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 p-1 pr-3 rounded-full border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all active:scale-95"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white">
                    <User size={16} />
                  </div>
                  <ChevronDown size={14} className={`text-gray-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile Dropdown */}
                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)}></div>
                    <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-20 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                      <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Account</p>
                      </div>
                      
                      <div className="p-1">
                        <DropdownItem icon={<BookOpen size={16} />} label="My Bookings" onClick={() => { navigate("/bookings"); setProfileOpen(false); }} />
                        {/* Added Wishlist to Dropdown */}
                        <DropdownItem icon={<Heart size={16} />} label="My Wishlist" onClick={() => { navigate("/wishlist"); setProfileOpen(false); }} />
                        <DropdownItem icon={<User size={16} />} label="Profile Settings" onClick={() => { navigate("/profile"); setProfileOpen(false); }} />
                      </div>

                      <div className="p-1 border-t border-gray-50">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        >
                          <LogOut size={16} /> Logout
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setOpen(!open)}
              className="md:hidden p-2 rounded-xl bg-gray-100 text-gray-700 active:scale-90 transition-transform"
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {open && (
          <div className="md:hidden absolute top-full left-4 right-4 mt-2 bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 flex flex-col gap-4 animate-in slide-in-from-top-4 duration-300 z-50">
            {navLinks.map((link) => (
              <button 
                key={link.name}
                onClick={() => { navigate(link.path); setOpen(false); }}
                className={`text-left text-lg font-bold px-4 py-2 rounded-xl ${isActive(link.path) ? "bg-blue-50 text-blue-600" : "text-gray-800"}`}
              >
                {link.name}
              </button>
            ))}
            
            <hr className="border-gray-100" />
            
            {!isLoggedIn ? (
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => navigate("/auth")} className="py-3 font-bold text-gray-700 bg-gray-100 rounded-2xl">Log in</button>
                <button onClick={() => navigate("/auth")} className="py-3 font-bold text-white bg-blue-600 rounded-2xl">Sign up</button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <button onClick={() => {navigate("/bookings"); setOpen(false);}} className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl font-bold text-gray-700">
                  <BookOpen size={20} /> My Bookings
                </button>
                {/* Mobile Wishlist Button */}
                <button onClick={() => {navigate("/wishlist"); setOpen(false);}} className="flex items-center gap-3 p-4 bg-rose-50/50 rounded-2xl font-bold text-rose-600">
                  <Heart size={20} fill="currentColor" /> My Wishlist
                </button>
                <button onClick={handleLogout} className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl font-bold text-gray-500">
                  <LogOut size={20} /> Logout
                </button>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
};

const DropdownItem = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all"
  >
    {icon}
    {label}
  </button>
);

export default Navbar;
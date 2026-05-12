import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  User,
  LogOut,
  BookOpen,
  ChevronDown,
  Heart,
  Clock3,
  Home,
  PlusCircle,
  User2,
  LayoutDashboard,
  BedDouble,
  CalendarCheck,
  MessageSquare,
  Hotel,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const { isLoggedIn, userRole, myHotelId, logout, user } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate("/auth");
  };

  const isActive = (path) => {
    if (!path) return false;

    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  const guestLinks = [
    { name: "Home", path: "/", icon: <Home size={18} /> },
    { name: "Hotels", path: "/hotels", icon: <BedDouble size={18} /> },
    { name: "Deals", path: "/coupons", icon: <Clock3 size={18} /> },
  ];

  const ownerLinks = [
    {
      name: "Dashboard",
      path: "/owner/dashboard",
      icon: <LayoutDashboard size={18} />,
    },

    {
      name: "Inventory",
      path: `/owner/hotel/${myHotelId}/rooms`,
      icon: <BedDouble size={18} />,
    },

    {
      name: "Chats",
      path: `/owner/hotel/chat/${myHotelId}`,
      icon: <MessageSquare size={18} />,
    },
  ];

  const navLinks = userRole === "owner" ? ownerLinks : guestLinks;

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled ? "py-2" : "py-4"}`}
    >
      <nav
        className={`mx-auto max-w-7xl px-4 sm:px-6 transition-all duration-500 ${scrolled
          ? "bg-white/90 backdrop-blur-xl shadow-lg shadow-blue-500/5 border border-slate-200/60 rounded-3xl"
          : "bg-transparent"
          }`}
      >
        <div className="flex items-center h-16 md:h-20">
          {/* LEFT: LOGO */}
          <div className="flex-1 flex items-center">
            <div
              className="flex items-center gap-2 group cursor-pointer"
              onClick={() =>
                navigate(userRole === "owner" ? "/owner/dashboard" : "/")
              }
            >
              <span
                className={`text-3xl font-black tracking-tighter text-slate-900`}
              >
                STAY<span className="text-blue-600">NEXT</span>
                {userRole === "owner" && (
                  <span className="ml-2 text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-lg align-middle tracking-widest uppercase">
                    Owner
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* 2. CENTER: DYNAMIC LINKS */}
          <div className="hidden md:flex items-center bg-slate-100/50 p-1.5 rounded-full border border-slate-200/50">
            {navLinks.map((link) => (
              <button
                key={link.name}
                disabled={!link.path}
                onClick={() => link.path && navigate(link.path)}
                className={`px-6 py-2 text-sm font-bold rounded-full transition-all duration-300 flex items-center gap-2 ${link.path && isActive(link.path)
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
                  } ${!link.path ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                {link.name}
              </button>
            ))}
          </div>

          {/* 3. RIGHT: ACTIONS */}
          <div className="flex-1 flex items-center justify-end gap-2 lg:gap-4">
            {/* Conditional Button: List Property for Guests vs Add Room for Owners */}
            {userRole !== "owner" ? (
              <button
                onClick={() => navigate("/list-property")}
                className={`hidden lg:flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border ${scrolled
                  ? "border-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white"
                  : "border-white/20 text-slate-900 bg-white shadow-sm hover:shadow-md"
                  }`}
              >
                <PlusCircle size={16} />
                List Property
              </button>
            ) : (
              <button
                onClick={() => navigate("/owner/add-room")}
                className="hidden lg:flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all bg-slate-900 text-white hover:bg-blue-600 shadow-lg shadow-slate-200"
              >
                <PlusCircle size={16} />
                Add Room
              </button>
            )}

            {!isLoggedIn ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate("/auth")}
                  className="hidden sm:block px-4 py-2 text-sm font-bold text-slate-700 hover:text-blue-600"
                >
                  Log in
                </button>
                <button
                  onClick={() => navigate("/auth")}
                  className="px-5 py-2.5 text-sm font-bold bg-blue-600 text-white rounded-2xl hover:bg-slate-900 transition-all shadow-lg shadow-blue-200"
                >
                  Join
                </button>
              </div>
            ) : (
              <div className="relative">

                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-2xl border border-slate-200 bg-white hover:border-blue-300 transition-all"
                >

                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-white ${userRole === "owner" ? "bg-blue-600" : "bg-slate-900"}`}
                  >
                    <User size={16} />

                  </div>

                  {user.name}
                  <ChevronDown
                    size={14}
                    className={`text-slate-400 transition-transform hidden sm:block ${profileOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {profileOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setProfileOpen(false)}
                    ></div>
                    <div className="absolute right-0 mt-3 w-64 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-20 animate-in fade-in zoom-in-95 duration-200 origin-top-right p-2">
                      <div className="px-4 py-3 mb-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {userRole} Account
                        </p>
                      </div>

                      {/* DYNAMIC DROPDOWN CONTENT */}
                      {userRole === "owner" ? (
                        <>
                          <DropdownItem
                            icon={<LayoutDashboard size={18} />}
                            label="Pricing"
                            onClick={() => {
                              navigate(`/owner/pricing/${myHotelId}`);
                              setProfileOpen(false);
                            }}
                          />
                          <DropdownItem
                            icon={<BedDouble size={18} />}
                            label="Payment Details"
                            onClick={() => {
                              navigate("/owner/payments");
                              setProfileOpen(false);
                            }}
                          />
                          <DropdownItem
                            icon={<BookOpen size={18} />}
                            label="Bookings"
                            onClick={() => {
                              navigate("/owner/bookings");
                              setProfileOpen(false);
                            }}
                          />
                          <DropdownItem
                            icon={<Hotel size={18} />}
                            label="Hotel Settings"
                            onClick={() => {
                              navigate("/owner/setting");
                              setProfileOpen(false);
                            }}
                          />
                        </>
                      ) : (
                        <>
                          <DropdownItem
                            icon={<BookOpen size={18} />}
                            label="Reservations"
                            onClick={() => {
                              navigate("/bookings");
                              setProfileOpen(false);
                            }}
                          />
                          <DropdownItem
                            icon={<Heart size={18} />}
                            label="Saved Homes"
                            onClick={() => {
                              navigate("/wishlist");
                              setProfileOpen(false);
                            }}
                          />
                          <DropdownItem
                            icon={<Clock3 size={18} />}
                            label="Waitlist"
                            onClick={() => {
                              navigate("/user/waitlists");
                              setProfileOpen(false);
                            }}
                          />
                        </>
                      )}

                      <DropdownItem
                        icon={<User2 size={18} />}
                        label="Profile Settings"
                        onClick={() => {
                          navigate("/profile");
                          setProfileOpen(false);
                        }}
                      />
                      <div className="h-px bg-slate-50 my-2 mx-2" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-rose-500 hover:bg-rose-50 rounded-2xl transition-colors"
                      >
                        <LogOut size={18} /> Log out
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            <button
              onClick={() => setOpen(!open)}
              className="md:hidden p-2.5 rounded-2xl bg-slate-100 text-slate-900"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* MOBILE MENU */}
        {open && (
          <div className="md:hidden absolute top-full left-0 right-0 mt-2 mx-4 bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-6 space-y-4 animate-in slide-in-from-top-4 duration-300">
            {navLinks.map((link) => (
              <button
                key={link.name}
                disabled={!link.path}
                onClick={() => {
                  if (!link.path) return;
                  navigate(link.path);
                  setOpen(false);
                }}
                className={`w-full text-left p-4 rounded-2xl font-bold flex items-center gap-3 ${link.path && isActive(link.path)
                  ? "bg-blue-50 text-blue-600"
                  : "text-slate-700 hover:bg-slate-50"
                  } ${!link.path ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                {link.icon} {link.name}
              </button>
            ))}
            <div className="h-px bg-slate-100" />
            <button
              onClick={() => {
                navigate(
                  userRole === "owner" ? "/owner/add-room" : "/list-property",
                );
                setOpen(false);
              }}
              className="w-full flex items-center gap-3 p-4 bg-slate-900 text-white rounded-2xl font-bold"
            >
              {userRole === "owner" ? (
                <PlusCircle size={20} />
              ) : (
                <Home size={20} />
              )}
              {userRole === "owner" ? "Add New Room" : "List your property"}
            </button>
          </div>
        )}
      </nav>
    </header>
  );
};

const DropdownItem = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-2xl transition-all group"
  >
    <span className="text-slate-400 group-hover:text-blue-600">{icon}</span>
    {label}
  </button>
);

export default Navbar;

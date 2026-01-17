import React, { useEffect, useState } from "react";
import api from "../api/axios.config";
import { Heart, Trash2, MapPin, ArrowRight, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const WishlistPage = () => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem("accessToken");
  

  const fetchWishlist = async () => {
    try {
      const res = await api.get(`${import.meta.env.VITE_API_URL}/wishlists`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setWishlist(res.data.wishlist);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/auth");
      return;
    }
    fetchWishlist();
  }, [token]);

  const handleRemove = async (wishlistId) => {
    try {
      const res = await api.delete(`${import.meta.env.VITE_API_URL}/wishlists/${wishlistId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setWishlist((prev) => prev.filter((item) => item._id !== wishlistId));
        toast.success("Removed from wishlist");
      }
    } catch (error) {
      toast.error("Action failed");
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="bg-[#F8FAFC] min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* HEADER */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="text-rose-500 fill-rose-500" size={28} />
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">Saved Stays</h1>
          </div>
          <p className="text-gray-500 font-medium">You have {wishlist.length} items in your wishlist</p>
        </header>

        {/* CONTENT */}
        {wishlist.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] border-2 border-dashed border-gray-200 py-20 text-center">
            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="text-gray-300" size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Your wishlist is empty</h3>
            <p className="text-gray-500 mb-8 max-w-xs mx-auto">Save your favorite hotels and rooms to view them later here.</p>
            <button 
              onClick={() => navigate('/hotels')}
              className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
            >
              Explore Hotels
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {wishlist.map((item) => (
              <WishlistCard 
                key={item._id} 
                item={item} 
                onRemove={() => handleRemove(item._id)} 
                onNavigate={() => navigate(`/hotels/${item.hotelId._id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* --- SUB-COMPONENT: WISHLIST CARD --- */
const WishlistCard = ({ item, onRemove, onNavigate }) => {
  const hotel = item.hotelId;
  const room = item.roomId;

  return (
    <div className="group bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden relative">
      {/* Remove Button */}
      <button 
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="absolute top-4 right-4 z-20 p-2.5 bg-white/90 backdrop-blur-md rounded-xl text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
      >
        <Trash2 size={18} />
      </button>

      {/* Image Area */}
      <div className="relative h-56 overflow-hidden cursor-pointer" onClick={onNavigate}>
        <img 
          src={room?.images?.[0] || "https://images.unsplash.com/photo-1566073771259-6a8506099945"} 
          alt={room?.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60" />
        <div className="absolute bottom-4 left-6">
           <span className="bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
              {room?.title || "Hotel Stay"}
           </span>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-1 leading-tight">{hotel?.name}</h3>
        <div className="flex items-center text-gray-400 text-xs font-bold gap-1 mb-4">
          <MapPin size={14} className="text-blue-500" />
          {hotel?.city}
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-50">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter leading-none mb-1">Price per night</p>
            <p className="text-2xl font-black text-gray-900">₹{room?.pricePerDay || hotel?.basePrice}</p>
          </div>
          <button 
            onClick={onNavigate}
            className="p-3 bg-gray-900 text-white rounded-2xl hover:bg-blue-600 transition-colors shadow-lg shadow-gray-200"
          >
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default WishlistPage;
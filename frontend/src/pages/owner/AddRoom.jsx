import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios.config";
import { 
  BedDouble, Users, IndianRupee, Layers, 
  Wifi, Wind, Tv, Utensils, Upload, X, ArrowLeft, CheckCircle2 
} from "lucide-react";
import toast from "react-hot-toast";

const AddRoom = () => {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);

  const [formData, setFormData] = useState({
    title: "", 
    roomType: "Standard",
    pricePerDay: "",
    totalRooms: "",
    maxGuests: "",
    amenities: [],
  });

  const roomTypes = ["Standard", "Deluxe", "Suite", "Luxury", "Family"];

  const availableAmenities = [
    { id: "wifi", label: "Free Wi-Fi", icon: <Wifi size={18} /> },
    { id: "ac", label: "Air Conditioning", icon: <Wind size={18} /> },
    { id: "tv", label: "Smart TV", icon: <Tv size={18} /> },
    { id: "mini_bar", label: "Mini Bar", icon: <Utensils size={18} /> },
  ];

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleAmenity = (id) => {
    const updated = formData.amenities.includes(id)
      ? formData.amenities.filter((a) => a !== id)
      : [...formData.amenities, id];
    setFormData({ ...formData, amenities: updated });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 5) return toast.error("Max 5 images allowed");
    setImages([...images, ...files]);
    const previews = files.map((file) => URL.createObjectURL(file));
    setPreviewImages([...previewImages, ...previews]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      if (key === "amenities") {
        formData.amenities.forEach((a) => data.append("amenities", a));
      } else {
        data.append(key, formData[key]);
      }
    });
    images.forEach((img) => data.append("images", img));

    try {
      const res = await api.post(`${import.meta.env.VITE_API_URL}/rooms/hotel/${hotelId}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        toast.success("Room category created!");
        navigate(`/my/hotels`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add room");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFDFF] pt-28 pb-20 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Navigation Header */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-blue-600 font-bold text-sm mb-6 transition-colors">
          <ArrowLeft size={18} /> Back to Hotel
        </button>

        <div className="mb-10">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Add Room Category</h1>
          <p className="text-slate-500 font-medium">Define room types like Deluxe, Suite, or Standard for your hotel.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Main Config Card */}
          <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              <div className="space-y-2 md:col-span-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Room Title</label>
                <input required name="title" onChange={handleInputChange} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-700" placeholder="e.g. Executive Ocean View Suite" />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Room Type</label>
                <select name="roomType" onChange={handleInputChange} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none font-bold text-slate-700 appearance-none">
                  {roomTypes.map(t => <option key={t} value={t.toLowerCase()}>{t}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Price per Night</label>
                <div className="relative">
                  <IndianRupee className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input required type="number" name="pricePerDay" onChange={handleInputChange} className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 border-none outline-none font-bold" placeholder="0.00" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Total Rooms Available</label>
                <div className="relative">
                  <Layers className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input required type="number" name="totalRooms" onChange={handleInputChange} className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 border-none outline-none font-bold" placeholder="10" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Max Guests</label>
                <div className="relative">
                  <Users className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input required type="number" name="maxGuests" onChange={handleInputChange} className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 border-none outline-none font-bold" placeholder="2" />
                </div>
              </div>
            </div>
          </div>

          {/* Amenities Selection */}
          <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-slate-100">
            <h3 className="text-lg font-black text-slate-900 mb-6">Room Amenities</h3>
            <div className="flex flex-wrap gap-4">
              {availableAmenities.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleAmenity(item.id)}
                  className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-sm transition-all border-2 ${
                    formData.amenities.includes(item.id) 
                    ? "border-blue-600 bg-blue-50 text-blue-600" 
                    : "border-slate-50 bg-slate-50 text-slate-400"
                  }`}
                >
                  {item.icon} {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Photos */}
          <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-slate-100">
            <h3 className="text-lg font-black text-slate-900 mb-6">Room Gallery</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {previewImages.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200">
                    <img src={src} className="w-full h-full object-cover" alt="preview" />
                  </div>
                ))}
                {previewImages.length < 5 && (
                  <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 transition-all text-slate-400">
                    <Upload size={24} />
                    <span className="text-[10px] font-black uppercase">Add Photo</span>
                    <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-lg shadow-xl shadow-slate-200 hover:bg-blue-600 transition-all flex items-center justify-center gap-3"
          >
            {loading ? "CREATING CATEGORY..." : (
              <>
                <CheckCircle2 size={24} />
                SAVE ROOM CATEGORY
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddRoom;
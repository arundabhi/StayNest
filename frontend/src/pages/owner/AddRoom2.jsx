import React, { useEffect, useState } from "react";
import { 
  Building2, BedDouble, Users, IndianRupee, 
  Layers, Upload, Plus, X, Wifi, Wind, 
  Tv, Utensils, CheckCircle2, Coffee, 
  Monitor, ShieldCheck, Bath, Briefcase, 
  Lock, Zap, Tags, Trash2 
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios.config";

const AddRoom2 = () => {
  const [hotels, setHotels] = useState([]);
  const [images, setImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customInput, setCustomInput] = useState("");

  const [form, setForm] = useState({
    hotelId: "",
    title: "",
    roomType: "single",
    pricePerDay: "",
    totalRooms: "",
    maxGuests: "",
    amenities: [],
  });

  // Expanded Predefined List
  const [availableAmenities, setAvailableAmenities] = useState([
    { id: "wifi", label: "Free Wi-Fi", icon: <Wifi size={16} /> },
    { id: "ac", label: "Air Conditioning", icon: <Wind size={16} /> },
    { id: "tv", label: "Smart TV", icon: <Tv size={16} /> },
    { id: "breakfast", label: "Free Breakfast", icon: <Utensils size={16} /> },
    { id: "coffee", label: "Coffee Maker", icon: <Coffee size={16} /> },
    { id: "minibar", label: "Mini Bar", icon: <Zap size={16} /> },
    { id: "workspace", label: "Workspace", icon: <Monitor size={16} /> },
    { id: "bathtub", label: "Bathtub", icon: <Bath size={16} /> },
    { id: "safe", label: "Electronic Safe", icon: <Lock size={16} /> },
    { id: "iron", label: "Ironing Facilities", icon: <ShieldCheck size={16} /> },
  ]);

  useEffect(() => {
    api.get("/hotels/my/hotel")
      .then(res => setHotels(res.data.hotels || []))
      .catch(() => toast.error("Failed to load hotels"));
  }, []);

  const toggleAmenity = (id) => {
    setForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(id)
        ? prev.amenities.filter(a => a !== id)
        : [...prev.amenities, id],
    }));
  };

  const handleAddCustom = (e) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    
    const id = customInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (availableAmenities.some(a => a.id === id)) {
        return toast.error("Amenity already exists");
    }

    const newAmenity = {
      id: id,
      label: customInput.trim(),
      icon: <Tags size={16} />,
      isCustom: true
    };

    setAvailableAmenities([...availableAmenities, newAmenity]);
    toggleAmenity(id); // Auto-select it
    setCustomInput("");
  };

  const removeCustomAmenity = (id) => {
    setAvailableAmenities(prev => prev.filter(a => a.id !== id));
    setForm(prev => ({
      ...prev,
      amenities: prev.amenities.filter(a => a !== id)
    }));
  };

  // ... Image Handling logic remains the same ...
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 5) return toast.error("Max 5 images allowed");
    setImages([...images, ...files]);
    const previews = files.map(file => URL.createObjectURL(file));
    setPreviewImages([...previewImages, ...previews]);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
    setPreviewImages(previewImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.hotelId) return toast.error("Please select a hotel");
    if (form.amenities.length === 0) return toast.error("Select at least one amenity");
    if (images.length === 0) return toast.error("Upload at least one image");

    setLoading(true);
    try {
      const fd = new FormData();
      Object.keys(form).forEach(key => {
        if (key === "amenities") {
          form.amenities.forEach(a => fd.append("amenities", a));
        } else {
          fd.append(key, form[key]);
        }
      });
      images.forEach(img => fd.append("images", img));

      await api.post(`/rooms/hotel/${form.hotelId}`, fd);
      toast.success("Room category added!");
      setForm({ hotelId: "", title: "", roomType: "single", pricePerDay: "", totalRooms: "", maxGuests: "", amenities: [] });
      setImages([]);
      setPreviewImages([]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Creation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-32 pb-20 px-4">
      <div className="max-w-4xl mx-auto text-left">
        <div className="mb-10">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2 uppercase">Create Room</h1>
          <p className="text-slate-500 font-medium tracking-wide">Define inventory and features for your selected property.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* STEP 1: HOTEL SELECT */}
          <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-slate-100">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3 block">Property Selection</label>
            <div className="relative">
              <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-500" size={20} />
              <select
                required
                value={form.hotelId}
                onChange={(e) => setForm({ ...form, hotelId: e.target.value })}
                className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-700 appearance-none cursor-pointer"
              >
                <option value="">Choose a hotel...</option>
                {hotels.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
              </select>
            </div>
          </div>

          {/* STEP 2: ROOM SPECS */}
          <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category Title</label>
                <input required value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none font-bold text-slate-700" placeholder="e.g. Deluxe Suite with Ocean View" />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Type</label>
                <select value={form.roomType} onChange={(e) => setForm({...form, roomType: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none font-bold text-slate-700">
                  <option value="single">single</option>
                  <option value="double">double</option>
                  <option value="deluxe">deluxe</option>
                  <option value="suite">suite</option>

                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Price / Night</label>
                <div className="relative">
                  <IndianRupee className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input required type="number" value={form.pricePerDay} onChange={(e) => setForm({...form, pricePerDay: e.target.value})} className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 border-none outline-none font-bold" placeholder="0.00" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Inventory Count</label>
                <div className="relative">
                  <Layers className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input required type="number" value={form.totalRooms} onChange={(e) => setForm({...form, totalRooms: e.target.value})} className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 border-none outline-none font-bold" placeholder="1" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Guest Capacity</label>
                <div className="relative">
                  <Users className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input required type="number" value={form.maxGuests} onChange={(e) => setForm({...form, maxGuests: e.target.value})} className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 border-none outline-none font-bold" placeholder="2" />
                </div>
              </div>
            </div>
          </div>

          {/* STEP 3: AMENITIES & CUSTOM ADDER */}
          <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-slate-100">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">In-Room Amenities</h3>
                
                {/* CUSTOM INPUT BOX */}
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <input 
                      type="text" 
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      placeholder="Custom facility..."
                      className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-40"
                    />
                    <button 
                      type="button" 
                      onClick={handleAddCustom}
                      className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-slate-900 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                </div>
             </div>

             <div className="flex flex-wrap gap-2 mb-10">
                {availableAmenities.map(a => (
                  <div key={a.id} className="relative group">
                      <button
                        type="button"
                        onClick={() => toggleAmenity(a.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-[11px] transition-all border-2 ${
                          form.amenities.includes(a.id) ? "border-blue-600 bg-blue-50 text-blue-600" : "border-slate-50 bg-slate-50 text-slate-400"
                        }`}
                      >
                        {a.icon} {a.label}
                      </button>
                      {a.isCustom && (
                        <button 
                          type="button"
                          onClick={() => removeCustomAmenity(a.id)}
                          className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={10} />
                        </button>
                      )}
                  </div>
                ))}
             </div>

             {/* IMAGE GALLERY */}
             <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Room Gallery</h3>
             <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {previewImages.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-2xl overflow-hidden group border border-slate-100 shadow-sm">
                    <img src={src} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                    <button type="button" onClick={() => removeImage(i)} className="absolute top-2 right-2 p-1 bg-white/80 backdrop-blur text-rose-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {previewImages.length < 5 && (
                  <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 transition-all text-slate-400 group">
                    <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-white transition-colors">
                        <Upload size={20} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-tighter">Add</span>
                    <input type="file" multiple className="hidden" onChange={handleImageChange} />
                  </label>
                )}
             </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-sm tracking-widest shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
          >
            {loading ? "PROCESSING..." : <><CheckCircle2 size={24}/> SAVE INVENTORY</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddRoom2;
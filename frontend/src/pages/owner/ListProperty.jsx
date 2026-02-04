import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { 
  Building2, MapPin, IndianRupee, Coffee, Tv, Utensils, Wifi, 
  Wind, Upload, X, Map as MapIcon, Navigation, ChevronRight, CheckCircle2,
  Beer, Bell, Shield, Trees, Palmtree, Car, Waves, Dumbbell, 
  Sparkles, Baby, Plane, Bath, Droplets, Zap, Plus, Tags
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios.config";

// --- Leaflet Icon Fix ---
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- Map Helper: Smooth Fly-To ---
const RecenterMap = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.flyTo([lat, lng], 13, { duration: 1.5 });
    }
  }, [lat, lng, map]);
  return null;
};

const ListProperty = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [customAmenity, setCustomAmenity] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    city: "",
    state: "",
    basePrice: "",
    latitude: 20.5937,
    longitude: 78.9629,
    amenities: [],
  });

  const [availableAmenities, setAvailableAmenities] = useState([
    { id: "Restaurant", label: "Restaurant", icon: <Utensils size={18} /> },
    { id: "Room service", label: "Room Service", icon: <Bell size={18} /> },
    { id: "Bar", label: "Bar/Lounge", icon: <Beer size={18} /> },
    { id: "24-hour front desk", label: "24h Front Desk", icon: <Shield size={18} /> },
    { id: "Sauna", label: "Sauna", icon: <Droplets size={18} /> },
    { id: "Fitness centre", label: "Gym", icon: <Dumbbell size={18} /> },
    { id: "Garden", label: "Garden", icon: <Trees size={18} /> },
    { id: "Terrace", label: "Terrace", icon: <Palmtree size={18} /> },
    { id: "Airport shuttle", label: "Airport Shuttle", icon: <Plane size={18} /> },
    { id: "Family rooms", label: "Family Rooms", icon: <Baby size={18} /> },
    { id: "Spa and wellness centre", label: "Spa & Wellness", icon: <Sparkles size={18} /> },
    { id: "Hot tub/Jacuzzi", label: "Jacuzzi", icon: <Bath size={18} /> },
    { id: "Free WiFi", label: "Free WiFi", icon: <Wifi size={18} /> },
    { id: "Air conditioning", label: "AC", icon: <Wind size={18} /> },
    { id: "Water park", label: "Water Park", icon: <Waves size={18} /> },
    { id: "EV charging", label: "EV Charging", icon: <Zap size={18} /> },
    { id: "Swimming pool", label: "Pool", icon: <Waves size={18} /> },
    { id: "Beach", label: "Beachfront", icon: <Palmtree size={18} /> },
  ]);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6),
          }));
          toast.success("Location detected!");
        },
        () => toast.error("Could not get location. Select manually.")
      );
    }
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleAmenity = (id) => {
    const updated = formData.amenities.includes(id)
      ? formData.amenities.filter((a) => a !== id)
      : [...formData.amenities, id];
    setFormData({ ...formData, amenities: updated });
  };

  const handleAddCustomAmenity = (e) => {
    e.preventDefault();
    const cleanValue = customAmenity.trim();
    if (!cleanValue) return;
    
    // Check for duplicates
    if (availableAmenities.some(a => a.id.toLowerCase() === cleanValue.toLowerCase())) {
        return toast.error("Amenity already exists");
    }

    const newAmenity = {
      id: cleanValue,
      label: cleanValue,
      icon: <Tags size={18} />,
      isCustom: true
    };

    setAvailableAmenities([...availableAmenities, newAmenity]);
    setFormData(prev => ({
      ...prev,
      amenities: [...prev.amenities, newAmenity.id]
    }));
    setCustomAmenity("");
    toast.success(`Added "${cleanValue}"`);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 5) {
      return toast.error("Maximum 5 images allowed");
    }
    setImages([...images, ...files]);
    const previews = files.map((file) => URL.createObjectURL(file));
    setPreviewImages([...previewImages, ...previews]);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
    setPreviewImages(previewImages.filter((_, i) => i !== index));
  };

  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        setFormData(prev => ({
          ...prev,
          latitude: e.latlng.lat.toFixed(6),
          longitude: e.latlng.lng.toFixed(6),
        }));
      },
    });
    return <Marker position={[formData.latitude, formData.longitude]} />;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (images.length === 0) return toast.error("Please upload at least one image");
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
      const res = await api.post(`${import.meta.env.VITE_API_URL}/hotels`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        toast.success("Hotel listed successfully!");
        navigate("/");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-32 pb-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-widest mb-4">
              <Building2 size={14} /> Partner with us
            </div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-tight">
              List your property on <span className="text-blue-600">StayNext.</span>
            </h1>
          </div>
          <p className="text-slate-500 font-medium md:text-right max-w-xs">
            Join thousands of hosts and start earning by sharing your space with travelers worldwide.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            
            {/* 1. Basic Information */}
            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-slate-100">
              <SectionTitle number="1" title="General Details" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputGroup label="Hotel Name" name="name" placeholder="The Royal Heritage" onChange={handleInputChange} />
                <InputGroup label="Base Price per Night" name="basePrice" type="number" icon={<IndianRupee size={18}/>} placeholder="1200" onChange={handleInputChange} />
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">About the Property</label>
                  <textarea required name="description" rows={4} onChange={handleInputChange} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all resize-none text-slate-600 font-medium" placeholder="Describe the vibe, rooms, and surroundings..." />
                </div>
              </div>
            </div>

            {/* 2. Amenities & Gallery */}
            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-slate-100">
              <SectionTitle number="2" title="Amenities & Gallery" />

              {/* Custom Amenity Adder */}
              <div className="flex items-center gap-3 mb-8 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                <div className="relative flex-1">
                  <Plus className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    value={customAmenity}
                    onChange={(e) => setCustomAmenity(e.target.value)}
                    placeholder="Add custom (e.g. Cinema, Gym)"
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <button 
                  type="button"
                  onClick={handleAddCustomAmenity}
                  className="bg-blue-600 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-blue-200 active:scale-95"
                >
                  Add
                </button>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-12">
                {availableAmenities.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleAmenity(item.id)}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-[13px] transition-all border-2 text-left ${
                      formData.amenities.includes(item.id) 
                      ? "border-blue-600 bg-blue-50 text-blue-600 shadow-md shadow-blue-100" 
                      : "border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-200"
                    }`}
                  >
                    <span className={formData.amenities.includes(item.id) ? "text-blue-600" : "text-slate-400"}>
                        {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-4 pt-6 border-t border-slate-50">
                <div className="flex justify-between items-end">
                    <label className="text-sm font-bold text-slate-700">Property Photos</label>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{previewImages.length} / 5 Images</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {previewImages.map((src, i) => (
                    <div key={i} className="relative aspect-square rounded-2xl overflow-hidden group shadow-sm border border-slate-100">
                      <img src={src} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="preview" />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button type="button" onClick={() => removeImage(i)} className="p-2 bg-white rounded-xl text-rose-500 shadow-lg">
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {previewImages.length < 5 && (
                    <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all text-slate-400 group">
                      <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-white transition-colors">
                        <Upload size={20} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest">Add</span>
                      <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Area: Location */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 sticky top-32">
              <div className="flex items-center justify-between mb-8">
                <SectionTitle number="3" title="Location" />
                <button 
                  type="button"
                  onClick={() => {
                    navigator.geolocation.getCurrentPosition((pos) => {
                      setFormData(prev => ({
                        ...prev, 
                        latitude: pos.coords.latitude.toFixed(6), 
                        longitude: pos.coords.longitude.toFixed(6)
                      }));
                      toast.success("GPS Synced");
                    });
                  }}
                  className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                  title="Use GPS"
                >
                  <Navigation size={18} />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <InputGroup label="Street Address" name="address" placeholder="123 Luxury Lane" onChange={handleInputChange} />
                <div className="grid grid-cols-2 gap-4">
                    <InputGroup label="City" name="city" placeholder="Mumbai" onChange={handleInputChange} />
                    <InputGroup label="State" name="state" placeholder="MH" onChange={handleInputChange} />
                </div>
              </div>

              <div className="h-64 w-full rounded-3xl overflow-hidden border-2 border-slate-50 relative z-0 mb-6 shadow-inner">
                <MapContainer 
                  center={[formData.latitude, formData.longitude]} 
                  zoom={13} 
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <RecenterMap lat={formData.latitude} lng={formData.longitude} />
                  <LocationMarker />
                </MapContainer>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-sm tracking-widest uppercase shadow-xl shadow-slate-200 hover:bg-blue-600 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                {loading ? "Registering..." : (
                    <>
                        Launch Property
                        <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Helper UI Components ---
const SectionTitle = ({ number, title }) => (
  <div className="flex items-center gap-3 mb-8">
    <span className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-black">
      {number}
    </span>
    <h2 className="text-xl font-black text-slate-900 tracking-tight">{title}</h2>
  </div>
);

const InputGroup = ({ label, name, type="text", placeholder, icon, onChange }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <div className="relative">
      {icon && <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>}
      <input 
        required 
        name={name} 
        type={type} 
        onChange={onChange} 
        placeholder={placeholder}
        className={`w-full ${icon ? 'pl-12' : 'px-6'} py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all text-slate-700 font-bold placeholder:font-normal placeholder:text-slate-300`}
      />
    </div>
  </div>
);

export default ListProperty;
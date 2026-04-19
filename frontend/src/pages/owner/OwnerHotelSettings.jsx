import React, { useEffect, useState } from "react";
import api from "../../api/axios.config";
import toast from "react-hot-toast";
import { Power, Upload, Trash2, Save, MapPin, IndianRupee } from "lucide-react";

const OwnerHotelSettings = () => {
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState([]);
  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    basePrice: "",
    description: "",
    amenities: "",
  });

  /* ───────── FETCH HOTEL ───────── */
  const fetchHotel = async () => {
    try {
      const res = await api.get("/hotels/my/hotel");
      const h = res.data.hotels[0];
      setHotel(h);
      setForm({
        name: h.name,
        address: h.address,
        city: h.city,
        state: h.state,
        basePrice: h.basePrice,
        description: h.description,
        amenities: h.amenities.join(", "),
      });
    } catch {
      toast.error("Failed to load hotel");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotel();
  }, []);

  /* ───────── UPDATE HOTEL ───────── */
  const updateHotel = async () => {
    try {
      await api.patch(`/hotels/update`, {
        ...form,
        amenities: form.amenities.split(",").map((a) => a.trim()),
      });
      toast.success("Hotel updated");
      fetchHotel();
    } catch {
      toast.error("Update failed");
    }
  };

  /* ───────── TOGGLE ACTIVE ───────── */
  const toggleState = async () => {
    try {
      const res = await api.patch("/hotels/toggle/status");
      toast.success(res.data.message);
      setHotel(res.data.hotel);
    } catch {
      toast.error("Toggle failed");
    }
  };

  /* ───────── ADD IMAGES ───────── */
  const addImages = async () => {
    if (!images.length) return;
    const fd = new FormData();
    images.forEach((img) => fd.append("images", img));

    try {
      await api.patch("/hotels/images/add", fd);
      toast.success("Images added");
      setImages([]);
      fetchHotel();
    } catch {
      toast.error("Upload failed");
    }
  };

  /* ───────── REMOVE IMAGE ───────── */
  const removeImage = async (url) => {
    try {
      await api.delete("/hotels/images/remove", {
        data: { imageUrl: url },
      });
      toast.success("Image removed");
      fetchHotel();
    } catch {
      toast.error("Remove failed");
    }
  };

  if (loading) return <div className="p-20 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 pt-24 px-4">
      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl p-8 space-y-10">
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black">{hotel?.name}</h1>
            <p className="text-slate-500 flex items-center gap-1">
              <MapPin size={14} /> {hotel?.city}, {hotel?.state}
            </p>
          </div>
          <button
            onClick={toggleState}
            className={`px-6 py-3 rounded-xl font-black flex gap-2 ${
              hotel?.isActive ? "bg-emerald-500" : "bg-rose-500"
            } text-white`}
          >
            <Power /> {hotel?.isActive ? "Active" : "Inactive"}
          </button>
        </div>

        {/* FORM */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {["name", "address", "city", "state"].map((f) => (
            <input
              key={f}
              value={form[f]}
              onChange={(e) => setForm({ ...form, [f]: e.target.value })}
              placeholder={f}
              className="p-4 bg-slate-100 rounded-xl font-bold"
            />
          ))}

          <div className="flex items-center gap-2 bg-slate-100 p-4 rounded-xl">
            <IndianRupee />
            <input
              value={form.basePrice}
              onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
              className="bg-transparent outline-none font-bold w-full"
              placeholder="Base Price"
            />
          </div>

          <textarea
            rows="4"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description"
            className="p-4 bg-slate-100 rounded-xl font-bold col-span-full"
          />

          <input
            value={form.amenities}
            onChange={(e) => setForm({ ...form, amenities: e.target.value })}
            placeholder="wifi, ac, parking"
            className="p-4 bg-slate-100 rounded-xl font-bold col-span-full"
          />
        </div>

        <button
          onClick={updateHotel}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black flex gap-2"
        >
          <Save /> Save Changes
        </button>

        {/* IMAGES */}
        <div>
          <h2 className="text-xl font-black mb-4">Hotel Images</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {hotel?.images.map((img) => (
              <div key={img} className="relative group">
                <img
                  src={img}
                  className="rounded-xl h-40 w-full object-cover"
                />
                <button
                  onClick={() => removeImage(img)}
                  className="absolute top-2 right-2 bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-4">
            <input
              type="file"
              multiple
              onChange={(e) => setImages([...e.target.files])}
            />
            <button
              onClick={addImages}
              className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black flex gap-2"
            >
              <Upload /> Add Images
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerHotelSettings;

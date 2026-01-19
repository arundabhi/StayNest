import { useEffect, useState } from "react";
import api from "../../api/axios.config";
import { 
  LayoutDashboard, Hotel, Users, X, Save, Clock, LogOut, 
  CheckCircle, XCircle, MapPin, Mail, Loader2, ShieldCheck, 
  Edit3, Trash2 
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const [currentView, setCurrentView] = useState("overview");
  const [stats, setStats] = useState({ hotels: 0, pending: 0, owners: 0 });
  const [hotelsList, setHotelsList] = useState([]);
  const [loading, setLoading] = useState(true);
    const navigate = useNavigate()
  const fetchData = async () => {
    try {
      setLoading(true);
      const [hotelsRes, pendingRes, ownersRes] = await Promise.all([
        api.get("/admin/hotels"),
        api.get("/admin/register-hotels"),
        api.get("/admin/get-all-owner"),
      ]);

      setStats({
        hotels: hotelsRes.data.hotels?.length || 0,
        pending: pendingRes.data.hotels?.length || 0,
        owners: ownersRes.data.count || 0,
      });
      setHotelsList(hotelsRes.data.hotels || []);
    } catch (err) {
      toast.error(err.message || "Failed to load dashboard data");
      navigate('/')
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    window.location.href = "/admin/login";
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col fixed h-full shadow-2xl z-10">
        <div className="p-6 text-2xl font-bold border-b border-slate-800 tracking-tight flex items-center gap-2">
          <ShieldCheck className="text-blue-500" />
          <span className={`text-3xl font-black tracking-tighter text-white cursor-pointer`}>
                STAY<span className="text-blue-600">NEXT</span>
                <span className="ml-2 text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-lg align-middle tracking-widest uppercase">Admin</span>
              </span>
         
        </div>
        <nav className="flex-1 p-4 space-y-2 mt-4">
          <button onClick={() => setCurrentView("overview")} className="w-full text-left">
            <NavItem icon={<LayoutDashboard size={20}/>} label="Overview" active={currentView === "overview"} />
          </button>
          <button onClick={() => setCurrentView("hotels")} className="w-full text-left">
            <NavItem icon={<Hotel size={20}/>} label="Manage Hotels" active={currentView === "hotels"} />
          </button>
          <button onClick={() => setCurrentView("owners")} className="w-full text-left">
            <NavItem icon={<Users size={20}/>} label="Owners" active={currentView === "owners"} />
          </button>
          <button onClick={() => setCurrentView("pending")} className="w-full text-left">
            <NavItem icon={<Clock size={20}/>} label="Pending Requests" active={currentView === "pending"} />
          </button>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button onClick={handleLogout} className="flex items-center gap-3 text-slate-400 hover:text-red-400 transition w-full px-4 py-2">
            <LogOut size={20}/> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 p-8">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center space-y-4">
            <Loader2 className="animate-spin text-blue-600" size={40}/>
            <p className="text-slate-500 animate-pulse font-bold uppercase tracking-widest text-xs">Synchronizing System...</p>
          </div>
        ) : (
          <>
            {currentView === "overview" && <OverviewTab stats={stats} hotelsList={hotelsList} onRefresh={fetchData} />}
            {currentView === "hotels" && <HotelsTab hotelsList={hotelsList} onRefresh={fetchData} />}
            {currentView === "pending" && <PendingTab refreshData={fetchData} />}
            {currentView === "owners" && <OwnersTab hotelsList={hotelsList} />}
          </>
        )}
      </main>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const OverviewTab = ({ stats, hotelsList, onRefresh }) => (
  <>
    <header className="mb-8">
      <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">System Overview</h1>
    </header>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
      <StatCard title="Total Hotels" value={stats.hotels} icon={<Hotel className="text-blue-600"/>} color="bg-blue-50" />
      <StatCard title="Pending Review" value={stats.pending} icon={<Clock className="text-orange-600"/>} color="bg-orange-50" />
      <StatCard title="Total Owners" value={stats.owners} icon={<Users className="text-purple-600"/>} color="bg-purple-50" />
    </div>
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 font-bold text-slate-800">Recently Added Hotels</div>
        <HotelTable hotels={hotelsList.slice(0, 5)} onRefresh={onRefresh} />
    </div>
  </>
);

const PendingTab = ({ refreshData }) => {
  const [pendingHotels, setPendingHotels] = useState([]);
  const [actionLoading, setActionLoading] = useState(null);
  const [expandedHotel, setExpandedHotel] = useState(null); // Tracks which hotel detail is open

  const fetchPending = async () => {
    try {
      const res = await api.get("/admin/register-hotels");
      setPendingHotels(res.data.hotels || []);
    } catch (err) { toast.error("Error loading requests"); }
  };

  useEffect(() => { fetchPending(); }, []);

  const handleAction = async (id, type) => {
    setActionLoading(id);
    try {
      if (type === 'approve') {
        await api.put(`/admin/hotels/${id}/approve`);
        toast.success("Hotel Approved Successfully");
      } else {
        toast.error("Rejection logic requires backend DELETE route.");
      }
      await fetchPending();
      refreshData();
    } catch (err) {
      toast.error("Request Failed");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Registration Requests</h1>
        <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
          {pendingHotels.length} Pending
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {pendingHotels.length > 0 ? (
          pendingHotels.map((hotel) => (
            <div key={hotel._id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:border-blue-300 transition-all">
              {/* Main Summary Row */}
              <div className="p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img src={hotel.images[0]} className="w-20 h-16 rounded-xl object-cover border border-slate-100 shadow-sm" alt=""/>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg leading-tight">{hotel.name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={12}/> {hotel.city}, {hotel.state}</p>
                      <p className="text-xs font-bold text-blue-600 italic">₹{hotel.basePrice} / night</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setExpandedHotel(expandedHotel === hotel._id ? null : hotel._id)}
                    className="text-slate-500 hover:text-slate-800 text-sm font-semibold px-4 py-2"
                  >
                    {expandedHotel === hotel._id ? "Hide Details" : "View All Details"}
                  </button>
                  <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
                  <button onClick={() => handleAction(hotel._id, 'approve')} disabled={actionLoading === hotel._id}
                    className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl flex items-center gap-2 text-sm font-bold transition shadow-md disabled:opacity-50">
                    {actionLoading === hotel._id ? <Loader2 size={16} className="animate-spin"/> : <CheckCircle size={16}/>} Approve
                  </button>
                  <button onClick={() => handleAction(hotel._id, 'reject')}
                    className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 px-5 py-2 rounded-xl flex items-center gap-2 text-sm font-bold transition">
                    <XCircle size={16}/> Reject
                  </button>
                </div>
              </div>

              {/* Collapsible Detail Section */}
              {expandedHotel === hotel._id && (
                <div className="px-5 pb-6 pt-2 border-t border-slate-50 bg-slate-50/50 animate-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                    {/* Gallery & Description */}
                    <div className="space-y-4">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Hotel Description</p>
                      <p className="text-slate-600 text-sm leading-relaxed">
                        {hotel.description || "No description provided by owner."}
                      </p>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-4">Image Gallery</p>
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {hotel.images.map((img, i) => (
                          <img key={i} src={img} className="w-24 h-20 rounded-lg object-cover border border-white shadow-sm flex-shrink-0" alt="" />
                        ))}
                      </div>
                    </div>

                    {/* Meta Data & Amenities */}
                    <div className="space-y-4 bg-white p-4 rounded-xl border border-slate-100">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase">Owner Contact</p>
                          <p className="text-sm font-semibold text-slate-700 flex items-center gap-1 mt-1"><Mail size={12}/> {hotel.owner?.email || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase">Exact Address</p>
                          <p className="text-sm font-semibold text-slate-700 mt-1">{hotel.address}</p>
                        </div>
                      </div>

                      <div className="pt-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Offered Amenities</p>
                        <div className="flex flex-wrap gap-2">
                          {hotel.amenities.map((item, i) => (
                            <span key={i} className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-tighter">
                              • {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="py-20 text-center flex flex-col items-center bg-white rounded-2xl border border-dashed border-slate-300">
            <Clock className="text-slate-200 mb-4" size={48}/>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No Pending Requests</p>
          </div>
        )}
      </div>
    </div>
  );
};
const HotelsTab = ({ hotelsList, onRefresh }) => (
  <div>
    <h1 className="text-2xl font-bold text-slate-800 mb-6 tracking-tight">Manage Inventory</h1>
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <HotelTable hotels={hotelsList} onRefresh={onRefresh} />
    </div>
  </div>
);

const HotelTable = ({ hotels, onRefresh }) => {
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [isEditModalOpen, setEditModalOpen] = useState(false);

  const handleToggleStatus = async (hotelId) => {
    try {
      await api.patch(`/hotels/toggle/status`, { hotelId });
      toast.success("Status Updated");
      onRefresh();
    } catch (err) { toast.error("Toggle Failed"); }
  };

  const handleDelete = async (hotelId) => {
    if (!window.confirm("Permanent Delete?")) return;
    try {
      await api.delete(`/hotels/${hotelId}`);
      toast.success("Hotel Removed");
      onRefresh();
    } catch (err) { toast.error("Delete Failed"); }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-widest">
          <tr>
            <th className="px-6 py-4">Hotel Details</th>
            <th className="px-6 py-4 font-center">Price</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {hotels.map((hotel) => (
            <tr key={hotel._id} className="hover:bg-slate-50/50 transition">
              <td className="px-6 py-4 flex items-center gap-3">
                <img src={hotel.images[0]} className="w-10 h-10 rounded-lg object-cover border border-slate-200" alt=""/>
                <div>
                  <p className="font-bold text-slate-800 leading-none mb-1">{hotel.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono tracking-tighter">{hotel._id}</p>
                </div>
              </td>
              <td className="px-6 py-4 font-black text-slate-700">₹{hotel.basePrice.toLocaleString()}</td>
              <td className="px-6 py-4">
                <button onClick={() => handleToggleStatus(hotel._id)}
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border transition ${
                    hotel.isActive ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
                  }`}>
                  {hotel.isActive ? "Active" : "Disabled"}
                </button>
              </td>
              <td className="px-6 py-4 text-right space-x-1">
                <button onClick={() => { setSelectedHotel(hotel); setEditModalOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit3 size={16} /></button>
                <button onClick={() => handleDelete(hotel._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={16} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {isEditModalOpen && <EditHotelModal hotel={selectedHotel} onClose={() => setEditModalOpen(false)} onSuccess={() => { setEditModalOpen(false); onRefresh(); }} />}
    </div>
  );
};

const EditHotelModal = ({ hotel, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({ name: hotel.name, basePrice: hotel.basePrice, description: hotel.description });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.patch(`/hotels/update`, { ...formData, hotelId: hotel._id });
      toast.success("Updated!");
      onSuccess();
    } catch (err) { toast.error("Update Failed"); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Edit Hotel</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition"><X size={20}/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Hotel Name</label>
            <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Base Price (₹)</label>
              <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700" value={formData.basePrice} onChange={(e) => setFormData({...formData, basePrice: e.target.value})} />
            </div>
            <div>
               <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Current Status</label>
               <div className="px-4 py-3 bg-slate-100 rounded-xl font-bold text-slate-500 italic text-sm">{hotel.isActive ? "Active" : "Disabled"}</div>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Description</label>
            <textarea rows="3" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-600" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
          </div>
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-6 py-3 rounded-xl font-bold text-slate-400 hover:bg-slate-50 transition">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-2 bg-slate-900 text-white px-8 py-3 rounded-xl font-black flex items-center justify-center gap-2 hover:bg-slate-800 transition disabled:opacity-50">
              {submitting ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const OwnersTab = ({ hotelsList = [] }) => {
  const [owners, setOwners] = useState([]);
  const [loadingOwners, setLoadingOwners] = useState(true);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchOwners = async () => {
    try {
      setLoadingOwners(true);
      const res = await api.get("/admin/get-all-owner");
      setOwners(res.data.owners || []);
    } catch (err) {
      toast.error("Failed to load owners");
    } finally {
      setLoadingOwners(false);
    }
  };

  useEffect(() => {
    fetchOwners();
  }, []);

  const handleDeleteOwner = async (ownerId) => {
    if (!window.confirm("Are you sure you want to delete this owner? This action cannot be undone.")) return;

    setDeletingId(ownerId);
    try {
      await api.delete(`/admin/owners/${ownerId}`);
      toast.success("Owner deleted successfully");
      // Refresh the list after deletion
      setOwners(prev => prev.filter(owner => owner._id !== ownerId));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete owner");
    } finally {
      setDeletingId(null);
    }
  };

  const handleViewHotel = (ownerId) => {
    const hotel = hotelsList?.find((h) => 
      (h.owner?._id === ownerId) || (h.owner === ownerId)
    );

    if (hotel) {
      setSelectedHotel(hotel);
      setShowModal(true);
    } else {
      toast.error("This owner hasn't registered a hotel yet.");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6 tracking-tight">Platform Owners</h1>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {loadingOwners ? (
          <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
              <tr>
                <th className="px-6 py-4">Owner Name</th>
                <th className="px-6 py-4">Contact Email</th>
                <th className="px-6 py-4">Property</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {owners.map((owner) => (
                <tr key={owner._id} className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-4 font-bold text-slate-800">{owner.name || "N/A"}</td>
                  <td className="px-6 py-4 text-slate-600">{owner.email}</td>
                  <td className="px-6 py-4">
                     {hotelsList?.some(h => (h.owner?._id === owner._id || h.owner === owner._id)) ? (
                        <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">Has Property</span>
                     ) : (
                        <span className="text-[10px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">No Property</span>
                     )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-4">
                        <button 
                          onClick={() => handleViewHotel(owner._id)}
                          className="text-blue-600 hover:text-blue-800 font-bold text-xs flex items-center gap-1"
                        >
                          <Hotel size={14} /> View
                        </button>
                        
                        <button 
                          onClick={() => handleDeleteOwner(owner._id)}
                          disabled={deletingId === owner._id}
                          className="text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                          title="Delete Owner"
                        >
                          {deletingId === owner._id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && selectedHotel && (
        <HotelDetailModal hotel={selectedHotel} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
};

// Sub-component for showing the Owner's Hotel Details
const HotelDetailModal = ({ hotel, onClose }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
    <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
      <div className="relative h-64">
        <img src={hotel.images[0]} className="w-full h-full object-cover" alt={hotel.name} />
        <button onClick={onClose} className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/40 transition">
          <X size={20} />
        </button>
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
          <h2 className="text-2xl font-black text-white">{hotel.name}</h2>
          <p className="text-white/80 flex items-center gap-1 text-sm"><MapPin size={14}/> {hotel.address}, {hotel.city}</p>
        </div>
      </div>
      
      <div className="p-8">
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-slate-50 p-4 rounded-2xl">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base Price</p>
            <p className="text-xl font-black text-slate-900 mt-1">₹{hotel.basePrice} <span className="text-xs font-medium text-slate-500">/night</span></p>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform Status</p>
            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-black uppercase ${hotel.isApproved ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
              {hotel.isApproved ? "Approved" : "Pending Approval"}
            </span>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Description</p>
          <p className="text-slate-600 text-sm leading-relaxed">{hotel.description || "No description provided."}</p>
        </div>

        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Amenities</p>
          <div className="flex flex-wrap gap-2">
            {hotel.amenities.map((item, i) => (
              <span key={i} className="bg-blue-50 text-blue-700 text-[10px] font-bold px-3 py-1 rounded-lg border border-blue-100">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

// UI Components
const NavItem = ({ icon, label, active = false }) => (
  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${active ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}`}>
    {icon} <span className="font-bold text-sm tracking-wide">{label}</span>
  </div>
);

const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between hover:translate-y-[-2px] hover:shadow-lg transition-all duration-300 group">
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</p>
      <p className="text-4xl font-black text-slate-900 mt-2">{value}</p>
    </div>
    <div className={`p-4 rounded-2xl transition-colors duration-300 ${color} group-hover:scale-110`}>{icon}</div>
  </div>
);

export default AdminDashboard;
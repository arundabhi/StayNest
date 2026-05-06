import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios.config";
import { useAuth } from "../context/AuthContext";
import {
  User,
  Mail,
  Phone,
  Lock,
  Trash2,
  Save,
  Camera,
  ChevronRight,
  ShieldCheck,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading, refreshUser, logout } = useAuth();
  const token = localStorage.getItem("accessToken");

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", mobileNumber: "" });
  const [passwordForm, setPasswordForm] = useState({
    password: "",
    newPassword: "",
  });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        mobileNumber: user.mobileNumber || "",
      });
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth?redirect=/profile");
    }
  }, [user, loading, navigate]);

  const handleUpdateProfile = async () => {
    try {
      const res = await api.put(
        `${import.meta.env.VITE_API_URL}/users/update`,
        form,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      await refreshUser();
      setEditing(false);
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    }
  };

  const handleChangePassword = async () => {
    try {
      await api.put(
        `${import.meta.env.VITE_API_URL}/users/change-password`,
        passwordForm,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setPasswordForm({ password: "", newPassword: "" });
      toast.success("Password changed successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Password update failed");
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure? This action cannot be undone.")) return;
    try {
      await api.delete(`${import.meta.env.VITE_API_URL}/users/delete`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      logout();
      navigate("/auth");
    } catch {
      toast.error("Failed to delete account");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-20 h-20 bg-gray-200 rounded-full mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    );

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-6 my-10">
        {/* HEADER */}
        <div className="mb-10">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">
            Settings
          </h1>
          <p className="text-gray-500 mt-2 font-medium">
            Manage your account details and security preferences.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* 1. BASIC INFORMATION CARD */}
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center text-3xl font-black shadow-xl shadow-blue-100">
                      {user.name?.charAt(0)}
                    </div>
                    <button className="absolute -bottom-2 -right-2 bg-white p-2 rounded-xl shadow-lg border border-gray-50 text-blue-600 hover:scale-110 transition-transform">
                      <Camera size={18} />
                    </button>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {user.name}
                    </h2>
                    <p className="text-gray-500 font-medium">{user.email}</p>
                    <span className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest border border-blue-100">
                      <ShieldCheck size={12} /> Verified Member
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setEditing(!editing)}
                  className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    editing
                      ? "bg-gray-100 text-gray-600"
                      : "bg-blue-600 text-white shadow-lg shadow-blue-100"
                  }`}
                >
                  {editing ? "Cancel" : "Edit Profile"}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      disabled={!editing}
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all font-semibold text-gray-700 disabled:opacity-60"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      disabled={!editing}
                      value={form.mobileNumber}
                      onChange={(e) =>
                        setForm({ ...form, mobileNumber: e.target.value })
                      }
                      placeholder="Enter mobile number"
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all font-semibold text-gray-700 disabled:opacity-60"
                    />
                  </div>
                </div>
              </div>

              {editing && (
                <div className="mt-8 pt-6 border-t border-gray-50">
                  <button
                    onClick={handleUpdateProfile}
                    className="flex items-center gap-2 bg-gray-900 text-white px-8 py-3 rounded-2xl font-bold hover:bg-black transition-all active:scale-95 shadow-xl shadow-gray-200"
                  >
                    <Save size={18} /> Save Changes
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 2. SECURITY CARD */}
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Lock size={20} className="text-blue-600" /> Security Settings
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <input
                  type="password"
                  placeholder="Current password"
                  value={passwordForm.password}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      password: e.target.value,
                    })
                  }
                  className="w-full px-5 py-3 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all font-semibold"
                />
                <input
                  type="password"
                  placeholder="New password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      newPassword: e.target.value,
                    })
                  }
                  className="w-full px-5 py-3 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all font-semibold"
                />
              </div>

              <button
                onClick={handleChangePassword}
                className="bg-white border-2 border-gray-900 text-gray-900 px-6 py-3 rounded-2xl font-bold hover:bg-gray-900 hover:text-white transition-all active:scale-95"
              >
                Update Password
              </button>
            </div>
          </div>

          {/* 3. DANGER ZONE */}
          <div className="bg-rose-50/50 rounded-[2rem] border border-rose-100 overflow-hidden">
            <div className="p-8 flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <h3 className="text-lg font-bold text-rose-900">Danger Zone</h3>
                <p className="text-rose-600/70 text-sm font-medium">
                  Permanently remove your account and all associated data.
                </p>
              </div>
              <button
                onClick={handleDeleteAccount}
                className="flex items-center gap-2 text-rose-600 hover:bg-rose-600 hover:text-white border-2 border-rose-200 px-6 py-3 rounded-2xl font-bold transition-all active:scale-95"
              >
                <Trash2 size={18} /> Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

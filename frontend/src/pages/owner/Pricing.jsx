import React, { useState, useEffect } from "react";
import api from "../../api/axios.config"; // Your axios instance with interceptors
import { useParams } from "react-router-dom";

const Pricing = () => {
  const [pricings, setPricings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const { hotelId } = useParams();
  console.log(hotelId);

  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    multiplier: 1,
    specialOfferPercent: 0,
  });

  const fetchPricings = async () => {
    try {
      const { data } = await api.get(`/pricing/hotel/${hotelId}`);
      setPricings(data);
    } catch (err) {
      console.error("Error fetching pricing", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricings();
  }, [hotelId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/pricing/${editingId}`, formData);
      } else {
        await api.post(`/pricing/${hotelId}`, formData);
      }
      resetForm();
      fetchPricings();
    } catch (err) {
      alert(err.response?.data?.message || "Something went wrong");
    }
  };

  const deleteRule = async (id) => {
    if (window.confirm("Delete this pricing rule?")) {
      await api.delete(`/pricing/${id}`);
      fetchPricings();
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      startDate: "",
      endDate: "",
      multiplier: 1,
      specialOfferPercent: 0,
    });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 my-20">
      {/* SECTION: EMPTY STATE / INITIAL ACTION */}
      {pricings.length === 0 && !showForm ? (
        <div className="text-center p-12 border-2 border-dashed border-gray-300 rounded-xl">
          <h2 className="text-3xl font-extrabold text-gray-800 mb-4">
            No Dynamic Pricing Found
          </h2>
          <p className="text-gray-500 mb-8">
            Boost your revenue during festivals or peak seasons by setting up
            price multipliers.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-full font-bold transition-all shadow-lg"
          >
            + Create Festival Dynamic Price
          </button>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Hotel Pricing Rules
            </h2>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm"
              >
                Add New Rule
              </button>
            )}
          </div>

          {/* FORM SECTION (Shared for Create & Edit) */}
          {(showForm || editingId) && (
            <form
              onSubmit={handleSubmit}
              className="bg-white shadow-md rounded-lg p-6 mb-8 border-t-4 border-indigo-500"
            >
              <h3 className="text-lg font-bold mb-4">
                {editingId ? "Edit Pricing" : "New Festival Pricing"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-600 uppercase">
                    Event/Festival Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Diwali Peak, Christmas"
                    className="border p-2 rounded"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-600 uppercase">
                    Price Multiplier (0.1 - 10)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="10"
                    required
                    className="border p-2 rounded"
                    value={formData.multiplier}
                    onChange={(e) =>
                      setFormData({ ...formData, multiplier: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-600 uppercase">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    className="border p-2 rounded"
                    value={formData.startDate.split("T")[0]}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-600 uppercase">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    className="border p-2 rounded"
                    value={formData.endDate.split("T")[0]}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-6 py-2 rounded font-bold"
                >
                  Save Pricing
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-200 px-6 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* LIST SECTION */}
          <div className="grid gap-4">
            {pricings.map((rule) => (
              <div
                key={rule._id}
                className="bg-white border rounded-lg p-4 flex justify-between items-center shadow-sm"
              >
                <div>
                  <h4 className="font-bold text-lg text-indigo-900">
                    {rule.name}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {new Date(rule.startDate).toLocaleDateString()} —{" "}
                    {new Date(rule.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right flex items-center gap-6">
                  <div>
                    <span className="block text-xs text-gray-400 uppercase font-bold">
                      Multiplier
                    </span>
                    <span className="text-xl font-black text-orange-600">
                      {rule.multiplier}x
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingId(rule._id);
                        setFormData(rule);
                        setShowForm(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteRule(rule._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Pricing;

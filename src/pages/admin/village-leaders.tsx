import { useEffect, useState } from "react";
import Head from "next/head";
import { Plus, Edit2, Trash2, Users, Search, Loader2 } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import api from "@/lib/api";
import type { Region, District } from "@/lib/types";

interface VillageLeader {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  districtId: number;
  district?: District;
}

export default function AdminVillageLeaders() {
  const [leaders, setLeaders] = useState<VillageLeader[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editLeader, setEditLeader] = useState<VillageLeader | null>(null);
  
  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedRegion, setSelectedRegion] = useState("");
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    districtId: ""
  });
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchLeaders = async () => {
    setLoading(true);
    try {
      const data = await api.get<VillageLeader[]>("/users/village-leaders");
      setLeaders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaders();
    api.get<Region[]>('/regions').then(res => setRegions(res)).catch(console.error);
    api.get<District[]>('/districts').then(res => setDistricts(res)).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedRegion) {
      api.get<District[]>(`/districts?regionId=${selectedRegion}`)
        .then(res => setDistricts(res))
        .catch(console.error);
    } else {
      api.get<District[]>('/districts').then(res => setDistricts(res)).catch(console.error);
    }
  }, [selectedRegion]);

  const filteredLeaders = leaders.filter(l => 
    l.fullName.toLowerCase().includes(search.toLowerCase()) || 
    l.email.toLowerCase().includes(search.toLowerCase()) ||
    (l.district?.name && l.district.name.toLowerCase().includes(search.toLowerCase()))
  );

  const handleOpenModal = (leader?: VillageLeader) => {
    setError("");
    if (leader) {
      setEditLeader(leader);
      setFormData({
        fullName: leader.fullName,
        email: leader.email,
        phoneNumber: leader.phoneNumber || "",
        password: "",
        districtId: leader.districtId ? leader.districtId.toString() : ""
      });
      // Try to find region for the district
      const d = districts.find(d => d.id === leader.districtId);
      if (d?.regionId) setSelectedRegion(d.regionId.toString());
    } else {
      setEditLeader(null);
      setFormData({ fullName: "", email: "", phoneNumber: "", password: "", districtId: "" });
      setSelectedRegion("");
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFormLoading(true);
    
    try {
      const payload: any = {
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        districtId: Number(formData.districtId)
      };
      
      if (formData.password) {
        payload.password = formData.password;
      } else if (!editLeader) {
        throw new Error("Password is required for new users.");
      }

      if (editLeader) {
        await api.put(`/users/village-leaders/${editLeader.id}`, payload);
      } else {
        await api.post("/users/village-leaders", payload);
      }
      
      setIsModalOpen(false);
      fetchLeaders();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this Village Leader?")) return;
    try {
      await api.delete(`/users/village-leaders/${id}`);
      fetchLeaders();
    } catch (err: any) {
      alert(err.message || "Failed to delete");
    }
  };

  return (
    <AuthGuard requireAdmin>
      <Head>
        <title>Village Leaders | Biyo-dhowr</title>
      </Head>
      <div className="p-4 sm:p-8 max-w-[1200px] mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Village Leaders</h1>
            <p className="text-sm text-slate-500">Manage village leaders and their regional assignments.</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Leader
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="relative w-full max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search leaders by name, email, or district..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="text-xs uppercase bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-bold">Name</th>
                  <th className="px-6 py-4 font-bold">Email</th>
                  <th className="px-6 py-4 font-bold">Phone</th>
                  <th className="px-6 py-4 font-bold">District (Deegaanka)</th>
                  <th className="px-6 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading leaders...
                    </td>
                  </tr>
                ) : filteredLeaders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      No village leaders found.
                    </td>
                  </tr>
                ) : (
                  filteredLeaders.map((leader) => (
                    <tr key={leader.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold text-xs">
                            {leader.fullName.charAt(0).toUpperCase()}
                          </div>
                          {leader.fullName}
                        </div>
                      </td>
                      <td className="px-6 py-4">{leader.email}</td>
                      <td className="px-6 py-4">{leader.phoneNumber || "-"}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                          {leader.district?.name || "Unknown"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleOpenModal(leader)}
                          className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors mr-2"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(leader.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                <h3 className="text-xl font-bold text-slate-900">
                  {editLeader ? "Edit Village Leader" : "Add Village Leader"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Users className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                <form id="leader-form" onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                      placeholder="e.g. Ahmed Ali"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email / Username</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                      placeholder="e.g. ahmed@biyo-dhowr.gov"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                      placeholder="e.g. +252..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Password {editLeader && <span className="text-slate-400 font-normal">(Leave blank to keep current)</span>}
                    </label>
                    <input
                      type="password"
                      required={!editLeader}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                      placeholder="••••••••"
                      minLength={8}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Region</label>
                      <select
                        value={selectedRegion}
                        onChange={(e) => setSelectedRegion(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                      >
                        <option value="">Select Region</option>
                        {regions.map((r) => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">District</label>
                      <select
                        required
                        value={formData.districtId}
                        onChange={(e) => setFormData({ ...formData, districtId: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 disabled:opacity-50"
                      >
                        <option value="">Select District</option>
                        {districts.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="leader-form"
                  disabled={formLoading}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}

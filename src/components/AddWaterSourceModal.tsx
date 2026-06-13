import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import api from "@/lib/api";
import type { Region, District, Village, CreateWaterSourcePayload, WaterSource } from "@/lib/types";

interface AddWaterSourceModalProps {
  editSource?: WaterSource | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddWaterSourceModal({ editSource, onClose, onSuccess }: AddWaterSourceModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [type, setType] = useState("Borehole");
  const [status, setStatus] = useState("Working");
  const [waterLevel, setWaterLevel] = useState<number>(100);
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");

  // Location states
  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedVillage, setSelectedVillage] = useState<string>("");

  useEffect(() => {
    if (editSource) {
      setName(editSource.name || "");
      setType(editSource.type || "Borehole");
      setStatus(editSource.status || "Working");
      setWaterLevel(editSource.waterLevel ?? 100);
      setLatitude(editSource.latitude ? String(editSource.latitude) : "");
      setLongitude(editSource.longitude ? String(editSource.longitude) : "");
      
      if (editSource.village) {
        if (editSource.village.district?.region) {
          setSelectedRegion(String(editSource.village.district.region.id));
        }
        if (editSource.village.district) {
          setSelectedDistrict(String(editSource.village.district.id));
        }
        setSelectedVillage(String(editSource.village.id));
      }
    }
  }, [editSource]);

  useEffect(() => {
    // Fetch regions on mount
    api.get<Region[]>('/regions')
      .then(res => setRegions(res))
      .catch(err => console.error('Failed to load regions', err));
  }, []);

  useEffect(() => {
    if (selectedRegion) {
      api.get<District[]>(`/districts?regionId=${selectedRegion}`)
        .then(res => setDistricts(res))
        .catch(err => console.error('Failed to load districts', err));
    } else {
      setDistricts([]);
    }
  }, [selectedRegion]);

  useEffect(() => {
    if (selectedDistrict) {
      api.get<Village[]>(`/villages?districtId=${selectedDistrict}`)
        .then(res => setVillages(res))
        .catch(err => console.error('Failed to load villages', err));
    } else {
      setVillages([]);
    }
  }, [selectedDistrict]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Source Name is required.");
      return;
    }
    if (!selectedVillage) {
      setError("Please select a Village.");
      return;
    }

    setLoading(true);
    try {
      const payload: CreateWaterSourcePayload = {
        name: name.trim(),
        villageId: Number(selectedVillage),
        type,
        status,
        waterLevel: Number(waterLevel),
        ...(latitude ? { latitude: Number(latitude) } : {}),
        ...(longitude ? { longitude: Number(longitude) } : {})
      };

      if (editSource) {
        await api.put(`/water-sources/${editSource.id}`, payload);
      } else {
        await api.post('/water-sources', payload);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to save water source");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">{editSource ? "Edit Water Source" : "Add New Water Source"}</h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm font-medium border border-red-200">
              {error}
            </div>
          )}

          <form id="add-water-source-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Basic Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Basic Details</h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Source Name *</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-shadow"
                  placeholder="e.g. Ceelasha Biyaha"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Source Type</label>
                  <select 
                    value={type}
                    onChange={e => setType(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-shadow cursor-pointer"
                  >
                    <option value="Borehole">Borehole</option>
                    <option value="Berkad">Berkad</option>
                    <option value="Dam">Dam</option>
                    <option value="Shallow Well">Shallow Well</option>
                    <option value="Spring">Spring</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select 
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-shadow cursor-pointer"
                  >
                    <option value="Working">Working</option>
                    <option value="Needs Repair">Needs Repair</option>
                    <option value="Broken">Broken</option>
                    <option value="Dry">Dry</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Initial Water Level (%)</label>
                <input 
                  type="number" 
                  min="0"
                  max="100"
                  value={waterLevel}
                  onChange={e => setWaterLevel(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-shadow"
                />
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Location */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Location</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Region</label>
                  <select 
                    value={selectedRegion}
                    onChange={e => {
                      setSelectedRegion(e.target.value);
                      setSelectedDistrict("");
                      setSelectedVillage("");
                    }}
                    className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-shadow cursor-pointer disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <option value="" disabled>Select Region</option>
                    {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">District</label>
                  <select 
                    value={selectedDistrict}
                    onChange={e => {
                      setSelectedDistrict(e.target.value);
                      setSelectedVillage("");
                    }}
                    disabled={!selectedRegion}
                    className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-shadow cursor-pointer disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <option value="" disabled>Select District</option>
                    {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Village *</label>
                  <select 
                    value={selectedVillage}
                    onChange={e => setSelectedVillage(e.target.value)}
                    disabled={!selectedDistrict}
                    className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-shadow cursor-pointer disabled:bg-slate-50 disabled:text-slate-400"
                    required
                  >
                    <option value="" disabled>Select Village</option>
                    {villages.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Latitude (Optional)</label>
                  <input 
                    type="number" 
                    step="any"
                    value={latitude}
                    onChange={e => setLatitude(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-shadow"
                    placeholder="e.g. 9.94"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Longitude (Optional)</label>
                  <input 
                    type="number" 
                    step="any"
                    value={longitude}
                    onChange={e => setLongitude(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-shadow"
                    placeholder="e.g. 43.19"
                  />
                </div>
              </div>
            </div>

          </form>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button 
            form="add-water-source-form"
            type="submit"
            disabled={loading}
            className="bg-[#0f172a] hover:bg-slate-800 text-white px-6 py-2.5 text-sm font-bold rounded-lg transition-colors disabled:opacity-70 flex items-center justify-center gap-2 shadow-sm min-w-[140px]"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Source"}
          </button>
        </div>
      </div>
    </div>
  );
}

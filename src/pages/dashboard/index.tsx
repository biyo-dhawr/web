import { useEffect, useState } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { AlertCircle, CheckCircle2, AlertTriangle, Droplet, Clock, BarChart2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import AuthGuard from "@/components/AuthGuard";
const IntelligencePanel = dynamic(() => import("@/components/IntelligencePanel"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-32 bg-slate-100 animate-pulse rounded-2xl border border-slate-200" />
  ),
});
import api from "@/lib/api";
import type { DashboardStats, WaterSourceListResponse, WaterSource, Village, ReportTrendItem } from "@/lib/types";

// Dynamically import Leaflet map to avoid SSR issues
const Map = dynamic(() => import("@/components/DashboardMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 animate-pulse rounded-xl border border-slate-200 flex items-center justify-center">
      <Droplet className="w-8 h-8 text-cyan-500/50 animate-bounce" />
    </div>
  ),
});

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [sources, setSources] = useState<WaterSource[]>([]); // paginated list
  const [allMapSources, setAllMapSources] = useState<WaterSource[]>([]); // all for map
  const [loading, setLoading] = useState(true);
  const [trendData, setTrendData] = useState<ReportTrendItem[]>([]);
  const [trendLoading, setTrendLoading] = useState(true);

  // Redirect Village Leaders away from dashboard immediately
  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const user = JSON.parse(raw);
        if (user.role === "VILLAGE LEADER") {
          router.replace("/reports");
        }
      }
    } catch {}
  }, [router]);

  const [region, setRegion] = useState<string>("Awdal");
  const [district, setDistrict] = useState<string>("");
  const [village, setVillage] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  // Village list for dynamic dropdown
  const [villages, setVillages] = useState<Village[]>([]);
  const [villagesLoading, setVillagesLoading] = useState(false);

  // Awdal district name -> numeric ID mapping (matches DB)
  const DISTRICT_ID_MAP: Record<string, number> = {
    Borama: 34,
    Zeylac: 35,
    Baki: 36,
    Lughaye: 37,
  };

  // Map Viewport State (Default: Awdal Region)
  const [mapCenter, setMapCenter] = useState<[number, number]>([10.5, 43.2]);
  const [mapZoom, setMapZoom] = useState<number>(9);

  // ── Load ALL water sources for the map (no limit) ──────────────────────────
  useEffect(() => {
    async function loadAllMapSources() {
      try {
        const res = await api.get<WaterSourceListResponse>("/water-sources?page=1&limit=1000");
        setAllMapSources(res.data);
      } catch (err) {
        console.error("Failed to load map sources:", err);
      }
    }
    loadAllMapSources();
  }, []);

  // ── Load filtered/paginated sources for table/stats ────────────────────────
  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.append("limit", "100");
        if (region) params.append("region", region);
        if (district) params.append("district", district);
        if (village) params.append("village", village);
        if (status) params.append("status", status);

        const [statsRes, sourcesRes] = await Promise.all([
          api.get<DashboardStats>("/dashboard/stats"),
          api.get<WaterSourceListResponse>(`/water-sources?${params.toString()}`)
        ]);
        setStats(statsRes);
        setSources(sourcesRes.data);
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [region, district, village, status]);

  // Fetch weekly report trend (independent of map filters)
  useEffect(() => {
    async function loadTrend() {
      try {
        setTrendLoading(true);
        const data = await api.get<ReportTrendItem[]>("/reports/trend/weekly");
        setTrendData(data);
      } catch (err) {
        console.error("Failed to load trend:", err);
      } finally {
        setTrendLoading(false);
      }
    }
    loadTrend();
  }, []);

  // Fetch villages when district changes
  useEffect(() => {
    const fetchVillages = async () => {
      // 1. If no district is selected, clear the list and exit
      if (!district || district === "All") {
        setVillages([]);
        return;
      }

      // 2. Look up the numeric ID for the selected district name
      const districtId = DISTRICT_ID_MAP[district];
      if (!districtId) {
        console.warn("[Villages] No ID mapping found for district:", district);
        setVillages([]);
        return;
      }

      setVillagesLoading(true);
      try {
        // 3. Use raw fetch with district_id (snake_case) + timestamp to bypass any service worker cache
        const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const response = await fetch(
          `${BASE_URL}/villages?district_id=${districtId}&_t=${Date.now()}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        console.log("[DEBUG] Successfully fetched villages for district:", district, data);

        // 4. Safely set state — handle both array and wrapped responses
        if (Array.isArray(data)) {
          setVillages(data);
        } else if (data && Array.isArray(data.villages)) {
          setVillages(data.villages);
        } else {
          setVillages([]);
        }
      } catch (error) {
        console.error("[ERROR] Failed to fetch villages:", error);
        setVillages([]); // Prevent UI from breaking
      } finally {
        setVillagesLoading(false);
      }
    };

    fetchVillages();
  }, [district]);

  // Region change: reset district + village + viewport
  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRegion(e.target.value);
    setDistrict("");
    setVillage("");
    setMapCenter([10.5, 43.2]);
    setMapZoom(9);
  };

  // Computed variable to find the selected village object
  const selectedVillageData = villages.find(v => String(v.id) === String(village));

  // Effect to automatically pan map when village selection changes
  useEffect(() => {
    if (selectedVillageData && selectedVillageData.latitude && selectedVillageData.longitude) {
      setMapCenter([selectedVillageData.latitude, selectedVillageData.longitude]);
      setMapZoom(14); // Zoom in closer for specific village
    } else if (!village && district) {
      // Revert to district level view if "All Villages" is selected
      resetMapToDistrict(district);
    }
  }, [selectedVillageData, village, district]);

  // Helper to reset map to district center
  const resetMapToDistrict = (districtName: string) => {
    switch (districtName) {
      case "Borama":
        setMapCenter([9.93, 43.28]);
        setMapZoom(11);
        break;
      case "Baki":
        setMapCenter([10.02, 43.48]);
        setMapZoom(11);
        break;
      case "Lughaye":
        setMapCenter([10.68, 43.94]);
        setMapZoom(11);
        break;
      case "Zeylac":
        setMapCenter([11.35, 43.47]);
        setMapZoom(11);
        break;
      default:
        setMapCenter([10.5, 43.2]);
        setMapZoom(9);
    }
  };

  // Handler for district changes to update Map Viewport
  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    setDistrict(selected);
    setVillage(""); // Reset village when district changes
    resetMapToDistrict(selected);
  };

  // Handler for village changes
  const handleVillageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setVillage(e.target.value);
  };

  const handleResetFilters = () => {
    setRegion("Awdal");
    setDistrict("");
    setVillage("");
    setStatus("");
    setVillages([]);
    setMapCenter([10.5, 43.2]);
    setMapZoom(9);
  };

  return (
    <AuthGuard>
      <Head>
        <title>Dashboard | Biyo-dhowr</title>
      </Head>
      <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-6">
        
        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider w-24 leading-tight">Total Water Sources</p>
              <div className="w-10 h-10 bg-cyan-50 rounded-xl flex items-center justify-center border border-cyan-100">
                <Droplet className="w-5 h-5 text-cyan-600" />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <p className="text-4xl font-black text-slate-900 tracking-tight">
                {loading ? "—" : stats?.totalSources.toLocaleString()}
              </p>
              <span className="text-xs font-bold text-green-600 flex items-center">
                <svg className="w-3 h-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                +2.4%
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider w-24 leading-tight">Pending Reports</p>
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-100">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <p className="text-4xl font-black text-slate-900 tracking-tight">
                {loading ? "—" : stats?.pendingReports.toLocaleString()}
              </p>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                Action Req.
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider w-24 leading-tight">Critical Drought Zones</p>
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center border border-red-100">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <p className="text-4xl font-black text-slate-900 tracking-tight">
                {loading ? "—" : (stats?.criticalZones || sources.filter(s => s.status?.toLowerCase() === 'broken' || s.status?.toLowerCase() === 'dry' || s.waterLevel < 20).length).toLocaleString()}
              </p>
              <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded">
                High Risk
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider w-24 leading-tight">Active System Alerts</p>
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100">
                <AlertCircle className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <p className="text-4xl font-black text-slate-900 tracking-tight">
                {loading ? "—" : stats?.systemAlerts ?? 12}
              </p>
              <span className="text-xs font-medium text-slate-400">
                Last 24hrs
              </span>
            </div>
          </div>
        </div>

        {/* Weekly Reports Bar Chart */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-cyan-50 rounded-lg flex items-center justify-center border border-cyan-100">
                <BarChart2 className="w-4 h-4 text-cyan-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Reports This Week</h2>
                <p className="text-xs text-slate-400">Water issues submitted over last 7 days</p>
              </div>
            </div>
            {!trendLoading && (
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                Total: {trendData.reduce((s, d) => s + d.count, 0)}
              </span>
            )}
          </div>

          {trendLoading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="w-6 h-6 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trendData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickFormatter={(v) =>
                    new Date(v).toLocaleDateString("en-US", { weekday: "short" })
                  }
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "#f0f9ff" }}
                  contentStyle={{
                    background: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "12px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  labelFormatter={(v) =>
                    new Date(v).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })
                  }
                  formatter={(value: number) => [value, "Reports"]}
                />
                <Bar
                  dataKey="count"
                  fill="#06b6d4"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
              <div className="p-1.5 px-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </div>
              <div className="h-6 w-px bg-slate-200 hidden sm:block" />
              <select 
                value={region} 
                onChange={handleRegionChange} 
                className="bg-transparent border border-slate-200 text-slate-700 text-sm font-medium rounded-lg px-3 py-1.5 outline-none focus:border-cyan-500 min-w-[120px]"
              >
                <option value="Awdal">Awdal Region</option>
              </select>
              <select 
                value={district} 
                onChange={handleDistrictChange} 
                className="bg-transparent border border-slate-200 text-slate-700 text-sm font-medium rounded-lg px-3 py-1.5 outline-none focus:border-cyan-500 min-w-[120px]"
              >
                <option value="">All Districts</option>
                <option value="Borama">Borama</option>
                <option value="Baki">Baki</option>
                <option value="Lughaye">Lughaye</option>
                <option value="Zeylac">Zeylac</option>
              </select>
              <select 
                value={village}
                onChange={handleVillageChange}
                disabled={!district || villagesLoading}
                className="bg-transparent border border-slate-200 text-slate-700 text-sm font-medium rounded-lg px-3 py-1.5 outline-none focus:border-cyan-500 min-w-[130px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {villagesLoading ? "Loading..." : district ? "All Villages" : "Select District First"}
                </option>
                {villages && villages.length > 0 && villages.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value)} 
                className="bg-transparent border border-slate-200 text-slate-700 text-sm font-medium rounded-lg px-3 py-1.5 outline-none focus:border-cyan-500 min-w-[120px]"
              >
                <option value="">All Status</option>
                <option value="working">Working</option>
                <option value="broken">Broken / Needs Repair</option>
                <option value="dry">Dry</option>
              </select>
              <button 
                onClick={handleResetFilters}
                className="text-sm font-bold text-slate-700 ml-auto px-4 hover:text-slate-900 border-l border-slate-200"
              >
                Reset Filters
              </button>
            </div>

            {/* Map Container */}
            <div className="h-[500px] w-full relative">
              <Map sources={sources} center={mapCenter} zoom={mapZoom} filterStatus={status} />
            </div>
          </div>

          {/* Right Sidebar: Feed */}
          <div className="bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden h-full shadow-sm">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-cyan-100 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <h3 className="font-bold text-slate-900 text-lg">Live Reports</h3>
              </div>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-600 text-[10px] font-bold tracking-widest uppercase border border-cyan-100">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                Streaming
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {loading && <div className="text-center py-10 text-slate-500 text-sm">Loading feed...</div>}
              
              {!loading && stats?.recentReports?.length === 0 && (
                <div className="text-center py-10 text-slate-500 text-sm">No recent reports found.</div>
              )}

              {stats?.recentReports?.map((report) => (
                <div key={report.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative">
                  {!report.isVerified && (
                     <div className="absolute top-0 left-0 w-1 h-full bg-amber-400 rounded-l-xl" />
                  )}
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm font-bold text-slate-900">{report.village?.name || "Unknown Location"}</p>
                    <span className="text-[11px] font-medium text-slate-500">
                      {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                    "{report.content}"
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <span className="px-2.5 py-1 rounded border border-slate-200 bg-slate-50 text-slate-600 text-[10px] font-bold flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        {report.reporterType}
                      </span>
                      <span className={`px-2.5 py-1 rounded text-[10px] font-bold flex items-center ${
                        report.isVerified 
                          ? "bg-green-50 text-green-700 border border-green-200" 
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}>
                        {report.isVerified ? "Resolved" : "Pending"}
                      </span>
                    </div>
                    
                    {!report.isVerified && (
                      <button className="bg-slate-900 text-white text-[11px] font-bold px-3 py-1.5 rounded hover:bg-slate-800 transition-colors">
                        Verify
                      </button>
                    )}
                    {report.isVerified && (
                      <button className="bg-white border border-slate-200 text-slate-700 text-[11px] font-bold px-3 py-1.5 rounded hover:bg-slate-50 transition-colors">
                        Log
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              {!loading && (
                <button className="w-full py-3 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors bg-white border border-slate-200 rounded-xl shadow-sm">
                  Load Older Reports
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── AI Intelligence Center ───────────────────────────── */}
        <IntelligencePanel />

      </div>
    </AuthGuard>
  );
}

import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { Search, Plus, Edit2, Loader2, ChevronLeft, ChevronRight, ChevronRight as BreadcrumbArrow, Download, Trash2, AlertTriangle, Droplet, Activity, AlertCircle } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import api from "@/lib/api";
import { exportToCSV } from "@/lib/export";
import type { WaterSource, WaterSourceListResponse, Region, District } from "@/lib/types";
import AddWaterSourceModal from "@/components/AddWaterSourceModal";

export default function AdminWaterSources() {
  const router = useRouter();
  const [sources, setSources] = useState<WaterSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [editSource, setEditSource] = useState<WaterSource | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [bulkStatus, setBulkStatus] = useState("");
  const [deleteSourceId, setDeleteSourceId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [stats, setStats] = useState({ total: 0, working: 0, broken: 0 });

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  
  // Filter Options Data
  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);

  const fetchSources = async (pageNumber: number, currentLimit: number, searchQuery: string = "", currentStatus: string = "", currentRegion: string = "", currentDistrict: string = "") => {
    setLoading(true);
    setSelectedIds([]); // Clear selection when fetching new data
    try {
      let url = `/water-sources?page=${pageNumber}&limit=${currentLimit}&search=${encodeURIComponent(searchQuery)}`;
      if (currentStatus) url += `&status=${encodeURIComponent(currentStatus)}`;
      if (currentRegion) url += `&regionId=${currentRegion}`;
      if (currentDistrict) url += `&districtId=${currentDistrict}`;
      
      const res = await api.get<WaterSourceListResponse>(url);
      setSources(res.data);
      setTotalPages(res.meta.totalPages);
      setTotalItems(res.meta.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch initial regions for the filter
    api.get<Region[]>('/regions')
      .then(res => setRegions(res))
      .catch(err => console.error('Failed to load regions', err));

    // Fetch system-wide stats from analytics endpoint
    api.get<any>('/analytics')
      .then(res => {
        const working = res.statusData.find((d: any) => d.status === 'Working' || d.status === 'Operational')?.count || 0;
        const broken = res.statusData.find((d: any) => d.status === 'Broken' || d.status === 'Critical')?.count || 0;
        const total = res.statusData.reduce((acc: number, d: any) => acc + Number(d.count), 0);
        setStats({ total, working, broken });
      })
      .catch(err => console.error('Failed to load stats', err));
  }, []);

  // Initialize filters from URL query if present
  useEffect(() => {
    if (router.isReady) {
      if (router.query.search && typeof router.query.search === 'string') {
        setSearch(router.query.search);
      }
      if (router.query.status && typeof router.query.status === 'string') {
        setStatusFilter(router.query.status);
      }
    }
  }, [router.isReady, router.query]);

  useEffect(() => {
    if (regionFilter) {
      api.get<District[]>(`/districts?regionId=${regionFilter}`)
        .then(res => setDistricts(res))
        .catch(err => console.error('Failed to load districts', err));
    } else {
      setDistricts([]);
      setDistrictFilter(""); // reset district if region is cleared
    }
  }, [regionFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSources(page, limit, search, statusFilter, regionFilter, districtFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [page, limit, search, statusFilter, regionFilter, districtFilter]);

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLimit(Number(e.target.value));
    setPage(1); // Reset to page 1 when changing limit
  };

  const getStatusStyle = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "working" || s === "operational") return "bg-green-50 text-green-700 border-green-200";
    if (s === "broken" || s === "critical") return "bg-red-50 text-red-700 border-red-200";
    if (s === "needs repair" || s === "maintenance") return "bg-amber-50 text-amber-700 border-amber-200";
    if (s === "dry") return "bg-slate-50 text-slate-600 border-slate-200";
    return "bg-slate-50 text-slate-700 border-slate-200";
  };

  const getStatusText = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "working" || s === "operational") return "Working";
    if (s === "broken" || s === "critical") return "Broken";
    if (s === "needs repair" || s === "maintenance") return "Needs Repair";
    if (s === "dry") return "Dry";
    return status;
  };

  const getLevelColor = (level: number) => {
    if (level < 20) return "bg-red-500";
    if (level < 50) return "bg-amber-500";
    return "bg-green-500";
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Fetch all records that match the current search filters
      let url = `/water-sources?page=1&limit=10000&search=${encodeURIComponent(search)}`;
      if (statusFilter) url += `&status=${encodeURIComponent(statusFilter)}`;
      if (regionFilter) url += `&regionId=${regionFilter}`;
      if (districtFilter) url += `&districtId=${districtFilter}`;

      const res = await api.get<WaterSourceListResponse>(url);
      
      const formattedData = res.data.map(source => ({
        'ID': `WS-${source.id.toString().padStart(3, '0')}`,
        'Source Name': source.name,
        'Type': source.type,
        'Region': source.village?.district?.region?.name || 'Awdal',
        'District': source.village?.district?.name || 'Unknown',
        'Village': source.village?.name || 'Unknown',
        'Water Level (%)': source.waterLevel,
        'Status': source.status,
        'Last Maintained': source.lastMaintained ? new Date(source.lastMaintained).toLocaleDateString() : 'Never',
      }));
      
      exportToCSV('water_sources_export.csv', formattedData);
    } catch(err) {
      console.error("Export failed", err);
      alert("Failed to export data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleBulkUpdate = async () => {
    if (!bulkStatus || selectedIds.length === 0) return;
    setIsBulkUpdating(true);
    try {
      await api.patch('/water-sources/bulk-status', { ids: selectedIds, status: bulkStatus });
      setSelectedIds([]);
      setBulkStatus("");
      fetchSources(page, limit, search, statusFilter, regionFilter, districtFilter);
    } catch(err) {
      console.error("Bulk update failed", err);
      alert("Failed to update items. Please try again.");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const allSelected = sources.length > 0 && selectedIds.length === sources.length;
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(sources.map(s => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleDelete = async () => {
    if (!deleteSourceId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/water-sources/${deleteSourceId}`);
      setDeleteSourceId(null);
      
      // Refresh stats
      api.get<any>('/analytics').then(res => {
        const working = res.statusData.find((d: any) => d.status === 'Working' || d.status === 'Operational')?.count || 0;
        const broken = res.statusData.find((d: any) => d.status === 'Broken' || d.status === 'Critical')?.count || 0;
        const total = res.statusData.reduce((acc: number, d: any) => acc + Number(d.count), 0);
        setStats({ total, working, broken });
      }).catch(console.error);
      
      fetchSources(page, limit, search, statusFilter, regionFilter, districtFilter);
    } catch (err: any) {
      console.error("Failed to delete", err);
      alert(err.response?.data?.message || "Failed to delete water source.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AuthGuard requireStaff>
      <Head>
        <title>Water Sources | Biyo-dhowr</title>
      </Head>
      <div className="p-4 sm:p-8 max-w-[1600px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-transparent mb-2">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Administrative Hierarchy</h1>
            <p className="text-sm text-slate-500">Manage and monitor all enterprise water sources and their operational status.</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Total Sources</p>
              <h3 className="text-2xl font-bold text-slate-900">{stats.total}</h3>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
              <Droplet className="w-6 h-6" />
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Working Sources</p>
              <h3 className="text-2xl font-bold text-slate-900">{stats.working}</h3>
            </div>
            <div className="bg-green-50 p-3 rounded-lg text-green-600">
              <Activity className="w-6 h-6" />
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Broken Sources</p>
              <h3 className="text-2xl font-bold text-slate-900">{stats.broken}</h3>
            </div>
            <div className="bg-red-50 p-3 rounded-lg text-red-600">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-3 flex-1 w-full">
            <div className="relative w-full sm:w-[300px]">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search source name, type..."
                  className="w-full bg-white border border-slate-200 text-slate-700 text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 shadow-sm"
                />
            </div>
            
            <select 
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 shadow-sm cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="Working">Working</option>
              <option value="Needs Repair">Needs Repair</option>
              <option value="Broken">Broken</option>
              <option value="Dry">Dry</option>
            </select>

            <select 
              value={regionFilter}
              onChange={(e) => { setRegionFilter(e.target.value); setPage(1); }}
              className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 shadow-sm cursor-pointer"
            >
              <option value="">All Regions</option>
              {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>

            <select 
              value={districtFilter}
              onChange={(e) => { setDistrictFilter(e.target.value); setPage(1); }}
              disabled={!regionFilter}
              className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 shadow-sm cursor-pointer disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="">All Districts</option>
              {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={handleExport}
              disabled={isExporting}
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </button>
            <button 
              onClick={() => {
                setEditSource(null);
                setIsModalOpen(true);
              }}
              className="bg-[#0f172a] hover:bg-slate-800 text-white font-bold text-sm px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add New Water Source
            </button>
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-3 bg-cyan-50 p-3 rounded-lg border border-cyan-100 mb-6 shadow-sm">
            <span className="text-sm font-medium text-cyan-800">
              {selectedIds.length} item{selectedIds.length > 1 ? 's' : ''} selected
            </span>
            <select 
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="bg-white border border-cyan-200 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-cyan-900"
            >
              <option value="">Change Status...</option>
              <option value="Working">Working</option>
              <option value="Needs Repair">Needs Repair</option>
              <option value="Broken">Broken</option>
              <option value="Dry">Dry</option>
            </select>
            <button
              onClick={handleBulkUpdate}
              disabled={!bulkStatus || isBulkUpdating}
              className="bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium px-4 py-1.5 rounded-md transition-colors disabled:opacity-50 shadow-sm flex items-center gap-2"
            >
              {isBulkUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Update Selected
            </button>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-4 px-6 text-left w-12">
                    <input 
                      type="checkbox" 
                      checked={allSelected} 
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-500">ID</th>
                  <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-500">Source Name</th>
                  <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-500">Type</th>
                  <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-500">Location</th>
                  <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-500">Water Level</th>
                  <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-500">Last Maintained</th>
                  <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={`skeleton-${i}`} className="animate-pulse border-b border-slate-100 last:border-0">
                      <td className="py-4 px-6"><div className="w-4 h-4 bg-slate-200 rounded"></div></td>
                      <td className="py-4 px-6"><div className="w-12 h-4 bg-slate-200 rounded"></div></td>
                      <td className="py-4 px-6"><div className="w-24 h-5 bg-slate-200 rounded"></div></td>
                      <td className="py-4 px-6"><div className="w-16 h-4 bg-slate-200 rounded"></div></td>
                      <td className="py-4 px-6"><div className="w-32 h-4 bg-slate-200 rounded"></div></td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-slate-200 rounded-full"></div>
                          <div className="w-8 h-4 bg-slate-200 rounded"></div>
                        </div>
                      </td>
                      <td className="py-4 px-6"><div className="w-20 h-6 bg-slate-200 rounded-md"></div></td>
                      <td className="py-4 px-6"><div className="w-20 h-4 bg-slate-200 rounded"></div></td>
                      <td className="py-4 px-6"><div className="w-16 h-6 bg-slate-200 rounded mx-auto"></div></td>
                    </tr>
                  ))
                ) : sources.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                          <Search className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">No water sources found</h3>
                        <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
                          We couldn't find any water sources matching your current search or filter criteria.
                        </p>
                        <button 
                          onClick={() => {
                            setSearch("");
                            setStatusFilter("");
                            setRegionFilter("");
                            setDistrictFilter("");
                            setPage(1);
                          }}
                          className="text-sm font-medium text-cyan-600 bg-cyan-50 hover:bg-cyan-100 px-4 py-2 rounded-lg transition-colors"
                        >
                          Clear all filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sources.map((source) => (
                    <tr key={source.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-4 px-6">
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(source.id)} 
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds(prev => [...prev, source.id]);
                            } else {
                              setSelectedIds(prev => prev.filter(id => id !== source.id));
                            }
                          }}
                          className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-slate-600">WS-{source.id.toString().padStart(3, '0')}</td>
                      <td className="py-4 px-6">
                        <p className="text-sm font-bold text-slate-900">{source.name}</p>
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-600">{source.type}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center text-sm text-slate-600 gap-1.5">
                          <span>Awdal</span>
                          <BreadcrumbArrow className="w-3 h-3 text-slate-400" />
                          <span>{source.village?.district?.name || "Borama"}</span>
                          <BreadcrumbArrow className="w-3 h-3 text-slate-400" />
                          <span>{source.village?.name || "Unknown"}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          {(() => {
                            // Support both snake_case (DB) and camelCase (TS type)
                            const raw = (source as any).water_level ?? source.waterLevel;
                            const level = raw != null && !Number.isNaN(Number(raw)) ? Number(raw) : null;
                            const clamped = level != null ? Math.min(Math.max(level, 0), 100) : 100;
                            return (
                              <>
                                <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      level != null ? getLevelColor(level) : 'bg-slate-300'
                                    }`}
                                    style={{ width: `${level != null ? clamped : 100}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium text-slate-600 w-12">
                                  {level != null ? `${level}%` : 'No Data'}
                                </span>
                              </>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${getStatusStyle(source.status)}`}>
                          {getStatusText(source.status)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-600">
                        {(source as any).last_maintained 
                          ? new Date((source as any).last_maintained).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
                          : source.lastMaintained 
                            ? new Date(source.lastMaintained).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
                            : 'Never'}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => {
                              setEditSource(source);
                              setIsModalOpen(true);
                            }}
                            title="Edit"
                            className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setDeleteSourceId(source.id)}
                            title="Delete"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">
                Showing <span className="font-bold text-slate-900">{totalItems === 0 ? 0 : (page - 1) * limit + 1}</span> to <span className="font-bold text-slate-900">{Math.min(page * limit, totalItems)}</span> of <span className="font-bold text-slate-900">{totalItems}</span> results
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Rows per page:</span>
                <select 
                  value={limit}
                  onChange={handleLimitChange}
                  className="border border-slate-200 rounded-md text-sm text-slate-700 bg-white px-2 py-1 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 shadow-sm transition-shadow cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-1 px-2">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setPage(i + 1)}
                    className={`w-8 h-8 rounded-lg text-sm font-bold transition-colors shadow-sm border ${
                      page === i + 1 
                        ? 'bg-cyan-500 text-white border-cyan-600' 
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {isModalOpen && (
          <AddWaterSourceModal 
            editSource={editSource}
            onClose={() => {
              setIsModalOpen(false);
              setEditSource(null);
            }}
            onSuccess={() => {
              setIsModalOpen(false);
              setEditSource(null);
              fetchSources(page, limit, search, statusFilter, regionFilter, districtFilter);
              
              // Refresh stats
              api.get<any>('/analytics').then(res => {
                const working = res.statusData.find((d: any) => d.status === 'Working' || d.status === 'Operational')?.count || 0;
                const broken = res.statusData.find((d: any) => d.status === 'Broken' || d.status === 'Critical')?.count || 0;
                const total = res.statusData.reduce((acc: number, d: any) => acc + Number(d.count), 0);
                setStats({ total, working, broken });
              }).catch(console.error);
            }}
          />
        )}

        {/* Delete Confirmation Modal */}
        {deleteSourceId && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center gap-4 text-red-600 mb-4">
                <div className="bg-red-100 p-3 rounded-full">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Delete Water Source?</h3>
              </div>
              <p className="text-sm text-slate-600 mb-6">
                Are you sure you want to delete this water source? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteSourceId(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}

import { useEffect, useState } from "react";
import Head from "next/head";
import { Search, Plus, Edit2, Loader2, ChevronLeft, ChevronRight, ChevronRight as BreadcrumbArrow } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import api from "@/lib/api";
import type { WaterSource, WaterSourceListResponse } from "@/lib/types";

export default function AdminWaterSources() {
  const [sources, setSources] = useState<WaterSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchSources = async (pageNumber: number) => {
    setLoading(true);
    try {
      const res = await api.get<WaterSourceListResponse>(`/water-sources?page=${pageNumber}&limit=10`);
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
    fetchSources(page);
  }, [page]);

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

        {/* Filters Row */}
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-[400px]">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <input
                type="text"
                placeholder="Search source name, type..."
                className="w-full bg-white border border-slate-200 text-slate-700 text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 shadow-sm"
              />
          </div>
          <button className="bg-[#0f172a] hover:bg-slate-800 text-white font-bold text-sm px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2 shadow-sm">
            <Plus className="w-4 h-4" />
            Add New Water Source
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
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
                  <tr>
                    <td colSpan={8} className="py-12 text-center">
                      <Loader2 className="w-6 h-6 text-cyan-600 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : sources.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500 text-sm">
                      No water sources found.
                    </td>
                  </tr>
                ) : (
                  sources.map((source) => (
                    <tr key={source.id} className="hover:bg-slate-50/50 transition-colors group">
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
                        <button className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <span className="text-sm text-slate-600">
              Showing <span className="font-bold text-slate-900">{(page - 1) * 10 + 1}</span> to <span className="font-bold text-slate-900">{Math.min(page * 10, totalItems)}</span> of <span className="font-bold text-slate-900">{totalItems}</span> results
            </span>
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

      </div>
    </AuthGuard>
  );
}

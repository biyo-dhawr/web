import { useEffect, useState } from "react";
import Head from "next/head";
import { CheckCircle, Trash2, Loader2, Clock, Filter } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import api from "@/lib/api";
import type { Report } from "@/lib/types";

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "verified">("all");

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get<Report[]>("/reports");
      setReports(res);
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleVerify = async (id: number) => {
    try {
      await api.patch<Report>(`/reports/${id}/verify`, {});
      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isVerified: true } : r))
      );
    } catch (err) {
      console.error("Verify failed:", err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this report permanently?")) return;
    try {
      await api.delete(`/reports/${id}`);
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const filtered = reports.filter((r) => {
    if (filter === "pending") return !r.isVerified;
    if (filter === "verified") return r.isVerified;
    return true;
  });

  return (
    <AuthGuard requireStaff>
      <Head>
        <title>Field Reports | Biyo-dhowr</title>
      </Head>
      <div className="p-4 sm:p-8 max-w-[1600px] mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Field Reports</h1>
            <p className="text-sm text-slate-500">Community-submitted water source reports from the field.</p>
          </div>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
            <Filter className="w-4 h-4 text-slate-400 ml-2" />
            {(["all", "pending", "verified"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-bold rounded transition-colors capitalize ${
                  filter === f
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Report Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-7 h-7 animate-spin text-slate-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-sm">
            No reports found.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((report) => (
              <div
                key={report.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-start gap-4 relative"
              >
                {/* Left accent bar */}
                {!report.isVerified && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-amber-400 rounded-l-xl" />
                )}

                {/* Content */}
                <div className="flex-1 pl-3 sm:pl-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-sm font-bold text-slate-900">
                      {report.village?.name || "Unknown Village"}
                    </span>
                    {report.waterSource && (
                      <span className="text-xs text-slate-400">
                        → {report.waterSource.name}
                      </span>
                    )}
                    <span
                      className={`ml-auto px-2 py-0.5 rounded text-[10px] font-bold border ${
                        report.isVerified
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {report.isVerified ? "Verified" : "Pending"}
                    </span>
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed mb-3">
                    "{report.content}"
                  </p>

                  <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 items-center">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(report.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200 font-medium">
                      {report.reporterType || "App"}
                    </span>
                    {report.user && (
                      <span className="text-slate-400">
                        by {report.user.fullName}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex sm:flex-col gap-2 shrink-0">
                  {!report.isVerified && (
                    <button
                      onClick={() => handleVerify(report.id)}
                      className="flex items-center gap-2 bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Verify
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(report.id)}
                    className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold px-3 py-2 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}

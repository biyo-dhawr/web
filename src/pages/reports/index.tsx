import Head from "next/head";
import useSWR from "swr";
import { CheckCircle, Trash2, AlertCircle, RefreshCw } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import api from "@/lib/api";
import type { Report } from "@/lib/types";

// SWR fetcher using our existing API helper
const fetcher = (url: string) => api.get<Report[]>(url);

export default function ReportsPage() {
  const { data: reports, error, isLoading, mutate } = useSWR("/reports", fetcher);

  // Debugging logs requested by user
  console.log("Reports Data:", reports);
  console.log("SWR Error:", error);

  const handleVerify = async (id: number) => {
    const actionTaken = window.prompt("Enter action taken to resolve this issue (e.g., Technician dispatched):");
    if (actionTaken === null) return; // User clicked Cancel

    try {
      await api.patch(`/reports/${id}/verify`, { actionTaken });
      // Mutate the local cache immediately to reflect the change
      mutate();
    } catch (err) {
      console.error("Failed to verify report:", err);
      alert("Failed to verify report. See console for details.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this report?")) return;
    try {
      await api.delete(`/reports/${id}`);
      // Mutate the local cache immediately
      mutate();
    } catch (err) {
      console.error("Failed to delete report:", err);
      alert("Failed to delete report. See console for details.");
    }
  };

  return (
    <AuthGuard requireStaff>
      <Head>
        <title>Field Reports | Biyo-dhowr</title>
      </Head>
      
      <div className="p-4 sm:p-8 max-w-[1600px] mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-transparent">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Field Reports</h1>
            <p className="text-sm text-slate-500">Manage and verify issues reported by community members.</p>
          </div>
          <button 
            onClick={() => mutate()} 
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
            Refresh
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <p>Failed to load reports.</p>
            </div>
          ) : !reports || reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <CheckCircle className="w-12 h-12 text-emerald-500 mb-4 opacity-50" />
              <p>No field reports available.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="text-xs uppercase bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-bold">Date</th>
                    <th className="px-6 py-4 font-bold">Reporter</th>
                    <th className="px-6 py-4 font-bold">Village</th>
                    <th className="px-6 py-4 font-bold">Water Source</th>
                    <th className="px-6 py-4 font-bold">Severity</th>
                    <th className="px-6 py-4 font-bold max-w-xs">Issue</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-slate-900">
                          {report.user?.fullName || "Anonymous"}
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">
                          {report.reporterType}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {report.village?.name || <span className="text-slate-400">-</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                        {report.waterSource?.name || <span className="text-slate-400">-</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {report.severityLevel === "high" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            High
                          </span>
                        ) : report.severityLevel === "low" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            Low
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            Medium
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 max-w-xs" title={report.content}>
                        <div className="truncate">{report.content}</div>
                        {report.actionTaken && (
                          <div className="text-xs text-emerald-600 mt-1 flex items-start gap-1 font-medium bg-emerald-50 p-1.5 rounded-md border border-emerald-100">
                            <span className="font-bold">Action:</span> {report.actionTaken}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {report.isVerified ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!report.isVerified && (
                            <button
                              onClick={() => handleVerify(report.id)}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Verify Report"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(report.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Report"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}

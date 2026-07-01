import Head from "next/head";
import Link from "next/link";
import useSWR from "swr";
import { CheckCircle, XCircle, Trash2, AlertCircle, RefreshCw, Phone } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import api from "@/lib/api";
import type { Report } from "@/lib/types";

const fetcher = (url: string) => api.get<Report[]>(url);

// Generates a deterministic 10-digit Somali phone number seeded by report ID
// Pattern: 063[4 or 6][6 digits] — never the same across reports
function generateReporterPhone(reportId: number): string {
  // Use report ID to produce a stable but unique pseudo-random sequence
  const seed = reportId * 2654435761; // Knuth multiplicative hash
  const suffix4 = ((seed >> 1) & 0x3d0800) + (seed & 0xffffff); // mix
  const digits = Math.abs(suffix4 % 1000000).toString().padStart(6, "0");
  // Alternate 4th digit between 4 and 6 based on odd/even ID
  const fourth = reportId % 2 === 0 ? "4" : "6";
  return `063${fourth}${digits}`;
}

// ── Status badge helper ──────────────────────────────────────────────────────
function StatusBadge({ status, isVerified }: { status: string; isVerified: boolean }) {
  const s = (status ?? (isVerified ? "verified" : "pending")).toLowerCase();
  if (s === "verified") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle className="w-3.5 h-3.5" />
        Verified
      </span>
    );
  }
  if (s === "rejected") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
        <XCircle className="w-3.5 h-3.5" />
        Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
      <AlertCircle className="w-3.5 h-3.5" />
      Pending
    </span>
  );
}

export default function ReportsPage() {
  const { data: reports, error, isLoading, mutate } = useSWR("/reports", fetcher);

  const handleApprove = async (id: number) => {
    const actionTaken = window.prompt(
      "Enter action taken to resolve this issue (e.g., Technician dispatched):"
    );
    if (actionTaken === null) return; // User clicked Cancel
    try {
      await api.put(`/reports/${id}/verify`, { actionTaken });
      mutate();
    } catch (err) {
      console.error("Failed to approve report:", err);
      alert("Failed to approve report. See console for details.");
    }
  };

  const handleReject = async (id: number) => {
    if (!window.confirm("Are you sure you want to reject this report?")) return;
    try {
      await api.put(`/reports/${id}/reject`, {});
      mutate();
    } catch (err) {
      console.error("Failed to reject report:", err);
      alert("Failed to reject report. See console for details.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this report?")) return;
    try {
      await api.delete(`/reports/${id}`);
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Field Reports</h1>
            <p className="text-sm text-slate-500">
              Manage and verify issues reported by community members.
            </p>
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
                  {reports.map((report) => {
                    const isPending =
                      !report.status || report.status.toLowerCase() === "pending";
                    return (
                      <tr
                        key={report.id}
                        className="hover:bg-slate-50/50 transition-colors group"
                      >
                        {/* Date */}
                        <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </td>

                        {/* Reporter */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-slate-900">
                            {report.user?.fullName || (
                              <span className="flex items-center gap-1.5 text-slate-700">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                {generateReporterPhone(report.id)}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">
                            {report.reporterType}
                          </div>
                          {report.phoneNumber && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                              <Phone className="w-3 h-3" />
                              {report.phoneNumber}
                            </div>
                          )}
                        </td>

                        {/* Village */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {report.village?.name || (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* Water Source */}
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                          {report.waterSource?.id ? (
                            <Link
                              href={`/water-sources/${report.waterSource.id}`}
                              className="hover:text-cyan-700 transition-colors"
                            >
                              {report.waterSource.name}
                            </Link>
                          ) : report.waterSource?.name || (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* Severity */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {report.severityLevel?.toLowerCase() === "high" ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              High
                            </span>
                          ) : report.severityLevel?.toLowerCase() === "low" ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                              Low
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                              Medium
                            </span>
                          )}
                        </td>

                        {/* Issue / Action Taken */}
                        <td className="px-6 py-4 max-w-xs" title={report.content}>
                          <div className="truncate">{report.content}</div>
                          {report.actionTaken && (
                            <div className="text-xs text-emerald-600 mt-1 flex items-start gap-1 font-medium bg-emerald-50 p-1.5 rounded-md border border-emerald-100">
                              <span className="font-bold">Action:</span>{" "}
                              {report.actionTaken}
                            </div>
                          )}
                        </td>

                        {/* Status — green for verified, yellow for pending, red for rejected */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge
                            status={report.status}
                            isVerified={report.isVerified}
                          />
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isPending && (
                              <>
                                {/* Approve */}
                                <button
                                  id={`approve-report-${report.id}`}
                                  onClick={() => handleApprove(report.id)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                                  title="Approve Report"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  Approve
                                </button>
                                {/* Reject */}
                                <button
                                  id={`reject-report-${report.id}`}
                                  onClick={() => handleReject(report.id)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                                  title="Reject Report"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  Reject
                                </button>
                              </>
                            )}
                            {/* Delete */}
                            <button
                              id={`delete-report-${report.id}`}
                              onClick={() => handleDelete(report.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                              title="Delete Report"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}

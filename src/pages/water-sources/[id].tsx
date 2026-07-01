import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import {
  AlertCircle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Droplet,
  FileText,
  Loader2,
  MapPin,
  RefreshCw,
  ShieldAlert,
  Wrench,
} from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import api from "@/lib/api";
import type { WaterSourceReportResponse } from "@/lib/types";

const Map = dynamic(() => import("@/components/DashboardMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 animate-pulse rounded-xl border border-slate-200 flex items-center justify-center">
      <Droplet className="w-8 h-8 text-cyan-500/50 animate-bounce" />
    </div>
  ),
});

function badgeClass(value: string) {
  const v = (value || "").toLowerCase();
  if (v === "low" || v === "working") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (v === "medium" || v === "needs repair") return "bg-amber-50 text-amber-700 border-amber-200";
  if (v === "high" || v === "broken" || v === "critical") return "bg-red-50 text-red-700 border-red-200";
  if (v === "dry") return "bg-blue-50 text-blue-700 border-blue-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
}

function DetailList({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <h2 className="text-sm font-bold text-slate-900 mb-4">{title}</h2>
      {items.length > 0 ? (
        <ul className="space-y-3">
          {items.map((item, index) => (
            <li key={`${title}-${index}`} className="flex gap-3 text-sm text-slate-600 leading-relaxed">
              <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">No items available.</p>
      )}
    </section>
  );
}

export default function WaterSourceDetailPage() {
  const router = useRouter();
  const sourceId = typeof router.query.id === "string" ? router.query.id : "";
  const [data, setData] = useState<WaterSourceReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReport = async () => {
    if (!sourceId) return;
    setLoading(true);
    setError(null);
    try {
      const report = await api.post<WaterSourceReportResponse>(`/water-sources/${sourceId}/report`, {});
      setData(report);
    } catch (err: any) {
      console.error("Failed to load water source report:", err);
      setError(err?.message || "Failed to load water source report.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (router.isReady) loadReport();
  }, [router.isReady, sourceId]);

  const source = data?.context.waterSource;
  const village = data?.context.village;
  const district = data?.context.district;
  const region = data?.context.region;
  const metrics = data?.context.summaryMetrics;
  const report = data?.report;

  const mapCenter = useMemo<[number, number]>(() => {
    const lat = source?.latitude ?? village?.latitude;
    const lng = source?.longitude ?? village?.longitude;
    return lat && lng ? [lat, lng] : [10.5, 43.2];
  }, [source?.latitude, source?.longitude, village?.latitude, village?.longitude]);

  const generatedAt = data?.generatedAt
    ? new Date(data.generatedAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Not generated";

  return (
    <AuthGuard requireStaff>
      <Head>
        <title>{source?.name ? `${source.name} | Water Source` : "Water Source Report"} | Biyo-dhowr</title>
      </Head>

      <div className="p-4 sm:p-8 max-w-[1600px] mx-auto space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-3">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs font-bold text-cyan-700 bg-cyan-50 border border-cyan-100 px-2.5 py-1 rounded-full">
                  WS-{(data?.sourceId ?? Number(sourceId || 0)).toString().padStart(3, "0")}
                </span>
                {source?.status && (
                  <span className={`text-xs font-bold border px-2.5 py-1 rounded-full ${badgeClass(source.status)}`}>
                    {source.status}
                  </span>
                )}
                {report?.riskLevel && (
                  <span className={`text-xs font-bold border px-2.5 py-1 rounded-full ${badgeClass(report.riskLevel)}`}>
                    {report.riskLevel} risk
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {source?.name || "Water Source"}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {[village?.name, district?.name, region?.name].filter(Boolean).join(" • ") || "Location unavailable"}
              </p>
            </div>
          </div>
          <button
            onClick={loadReport}
            disabled={loading || !sourceId}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh report
          </button>
        </div>

        {loading ? (
          <div className="bg-white border border-slate-200 rounded-xl h-96 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
              <p className="text-sm font-medium">Generating source view...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white border border-red-200 rounded-xl h-96 flex items-center justify-center text-center p-6">
            <div>
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
              <h2 className="font-bold text-slate-900 mb-1">Report unavailable</h2>
              <p className="text-sm text-slate-500">{error}</p>
            </div>
          </div>
        ) : data && source && report ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <section className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="h-[440px]">
                  <Map sources={[source]} center={mapCenter} zoom={15} />
                </div>
              </section>

              <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-5">
                <div>
                  <p className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-1">AI Report</p>
                  <h2 className="text-xl font-black text-slate-900 leading-tight">{report.title}</h2>
                  <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                    <CalendarClock className="w-3.5 h-3.5" />
                    Generated {generatedAt}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                    <Droplet className="w-4 h-4 text-cyan-600 mb-2" />
                    <p className="text-xs text-slate-500 font-medium">Water Level</p>
                    <p className="text-lg font-black text-slate-900">{source.waterLevel ?? source.water_level ?? "No data"} m</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                    <Wrench className="w-4 h-4 text-amber-600 mb-2" />
                    <p className="text-xs text-slate-500 font-medium">Maintenance</p>
                    <p className="text-lg font-black text-slate-900">{report.maintenancePriority}</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                    <ShieldAlert className="w-4 h-4 text-red-600 mb-2" />
                    <p className="text-xs text-slate-500 font-medium">High Severity</p>
                    <p className="text-lg font-black text-slate-900">{metrics?.highSeverityReportCount30Days ?? 0}</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                    <FileText className="w-4 h-4 text-slate-600 mb-2" />
                    <p className="text-xs text-slate-500 font-medium">30 Day Reports</p>
                    <p className="text-lg font-black text-slate-900">{metrics?.recentReportCount30Days ?? 0}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{source.latitude ?? "?"}, {source.longitude ?? "?"}</span>
                  </div>
                  <p className="text-slate-600">
                    <span className="font-bold text-slate-900">Type:</span> {source.type}
                  </p>
                  <p className="text-slate-600">
                    <span className="font-bold text-slate-900">Last maintained:</span>{" "}
                    {source.lastMaintained || source.last_maintained
                      ? new Date((source.lastMaintained || source.last_maintained) as string).toLocaleDateString()
                      : "No recent maintenance"}
                  </p>
                </div>
              </section>
            </div>

            <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-black text-slate-900 mb-3">{report.title}</h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">{report.executiveSummary}</p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2">Current Condition</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{report.currentCondition}</p>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2">Community Impact</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{report.communityImpact}</p>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-5">
              <DetailList title="Main Concerns" items={report.mainConcerns} />
              <DetailList title="Supporting Evidence" items={report.supportingEvidence} />
              <DetailList title="Recommended Actions" items={report.recommendedActions} />
              <DetailList title="Data Limitations" items={report.dataLimitations} />
            </div>
          </>
        ) : null}
      </div>
    </AuthGuard>
  );
}

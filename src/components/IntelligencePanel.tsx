import React, { useState, useEffect } from "react";
import useSWR from "swr";
import {
  BrainCircuit,
  AlertTriangle,
  Droplets,
  Zap,
  Clock,
  RefreshCw,
  CheckCircle2,
  ShieldAlert,
  Activity,
  Search,
  ChevronRight,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import api from "@/lib/api";

// ---- Types ------------------------------------------------------------------

type PredictionItem = {
  id: number;
  predictedLevel: string;
  confidenceScore: number;
  reasons: string[];
  droughtRisk: number;
  predictionDate: string;
  village?: { id: number; name: string };
};

type IntelItem = {
  riskLevel?: string;
  failureRiskLevel?: string;
  estimatedFailureInDays?: number | null;
  estimatedDaysToFailure?: number | null;
  priorityScore: number;
  recommendation?: string;
  recommendations?: string[];
  reasons: string[];
  waterSource?: { id: number; name: string; type: string; status: string; waterLevel?: number };
  village?: { id: number; name: string; droughtRiskLevel?: string };
};

// ---- SWR fetcher ------------------------------------------------------------

const fetcher = async (url: string): Promise<any> => {
  const res = await api.get<any>(url);
  if (res && typeof res === "object" && !Array.isArray(res) && "data" in res) {
    return (res as any).data;
  }
  return res;
};

// ---- Risk normalisation -----------------------------------------------------
// Python returns "Low" | "Medium" | "High" | "Severe"
// We map "Medium" -> "moderate" so RISK_META lookup works

function normaliseLevel(raw?: string): string {
  const s = (raw ?? "").toLowerCase().trim();
  if (s === "medium") return "moderate";
  return s;
}

// ---- Risk metadata ----------------------------------------------------------

const RISK_META = {
  severe:   { bar: "bg-red-500",     badge: "bg-red-50 text-red-700 border-red-200",          dot: "bg-red-500",     label: "Severe"   },
  high:     { bar: "bg-orange-500",  badge: "bg-orange-50 text-orange-700 border-orange-200",  dot: "bg-orange-500",  label: "High"     },
  moderate: { bar: "bg-amber-400",   badge: "bg-amber-50 text-amber-700 border-amber-200",     dot: "bg-amber-400",   label: "Moderate" },
  low:      { bar: "bg-emerald-400", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-400", label: "Low"    },
};

type RiskKey = keyof typeof RISK_META;

function getRisk(raw?: string) {
  const key = normaliseLevel(raw) as RiskKey;
  return RISK_META[key] ?? RISK_META.low;
}

// ---- IntelItem field helpers ------------------------------------------------

function intelRiskLevel(item: IntelItem): string {
  return item.failureRiskLevel ?? item.riskLevel ?? "Low";
}

function intelDays(item: IntelItem): number | null {
  return item.estimatedDaysToFailure ?? item.estimatedFailureInDays ?? null;
}

function intelRecommendation(item: IntelItem): string {
  if (item.recommendation) return item.recommendation;
  if (Array.isArray(item.recommendations) && item.recommendations.length > 0) {
    return item.recommendations[0];
  }
  return "";
}

// ---- Sub-components ---------------------------------------------------------

function ConfidenceRing({ value }: { value: number }) {
  const pct  = Math.max(0, Math.min(1, value ?? 0));
  const r    = 16;
  const circ = 2 * Math.PI * r;
  const col  = pct >= 0.8 ? "#10b981" : pct >= 0.6 ? "#f59e0b" : "#ef4444";
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" className="flex-shrink-0 -rotate-90">
      <circle cx="22" cy="22" r={r} fill="none" stroke="#e2e8f0" strokeWidth="3.5" />
      <circle
        cx="22" cy="22" r={r} fill="none" stroke={col} strokeWidth="3.5"
        strokeDasharray={`${pct * circ} ${circ}`} strokeLinecap="round"
      />
      <text
        x="22" y="26" textAnchor="middle" fontSize="8.5" fontWeight="800"
        fill={col}
        style={{ transform: "rotate(90deg)", transformOrigin: "22px 22px" }}
      >
        {Math.round(pct * 100)}%
      </text>
    </svg>
  );
}

function Skeleton() {
  return (
    <div className="space-y-3 p-4">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-20 rounded-2xl bg-slate-100 animate-pulse"
          style={{ opacity: 1 - i * 0.15 }}
        />
      ))}
    </div>
  );
}

function Empty({ icon: Icon, title, sub }: { icon: any; title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
        <Icon className="w-7 h-7 text-slate-400" />
      </div>
      <p className="text-sm font-bold text-slate-600 mb-1">{title}</p>
      <p className="text-xs text-slate-400 leading-relaxed">{sub}</p>
    </div>
  );
}

// ---- Main component ---------------------------------------------------------

export default function IntelligencePanel() {
  const [isLive,          setIsLive]          = useState(false);
  const [activeTab,       setActiveTab]       = useState<"predictions" | "sources">("predictions");
  const [predVillageId,   setPredVillageId]   = useState("");
  const [runningPred,     setRunningPred]     = useState(false);
  const [predSuccess,     setPredSuccess]     = useState(false);
  const [selectedSrcId,   setSelectedSrcId]   = useState("");
  const [individualIntel, setIndividualIntel] = useState<IntelItem | null>(null);
  const [loadingInd,      setLoadingInd]      = useState(false);
  const [searchQuery,     setSearchQuery]     = useState("");
  const [intelError,      setIntelError]      = useState<string | null>(null);

  // SWR hooks
  const {
    data: predictionsRaw,
    isLoading: loadingPreds,
    error: predsError,
    mutate: mutatePreds,
  } = useSWR<PredictionItem[]>("/predictions/drought?limit=30", fetcher, { refreshInterval: 30000 });

  const {
    data: intelRaw,
    isLoading: loadingIntel,
    error: intelSWRError,
    mutate: mutateIntel,
  } = useSWR<IntelItem[]>("/water-sources/intelligence?limit=10", fetcher, { refreshInterval: 60000 });

  const { data: sourcesRaw } = useSWR<any>("/water-sources?limit=1000", fetcher);

  // Normalise arrays
  const predictionList: PredictionItem[] = Array.isArray(predictionsRaw) ? predictionsRaw : [];
  const intelligenceList: IntelItem[]    = Array.isArray(intelRaw) ? intelRaw : [];
  const sourcesList: any[]               = Array.isArray(sourcesRaw?.data) ? sourcesRaw.data : [];

  // Unique villages
  const villageMap = new Map<number, { id: number; name: string }>();
  for (const s of sourcesList) {
    if (s.village && !villageMap.has(s.village.id)) villageMap.set(s.village.id, s.village);
  }
  const uniqueVillages = [...villageMap.values()].sort((a, b) => a.name.localeCompare(b.name));

  // WebSocket
  useEffect(() => {
    if (typeof window === "undefined") return;
    let socket: any = null;
    import("socket.io-client")
      .then(({ io }) => {
        const url = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace("/api", "");
        socket = io(url, { transports: ["websocket", "polling"] });
        socket.on("connect",             () => setIsLive(true));
        socket.on("disconnect",          () => setIsLive(false));
        socket.on("prediction_updated",  () => mutatePreds());
        socket.on("water_source_updated", () => {
          mutateIntel();
          if (selectedSrcId) void fetchSingleIntel(selectedSrcId);
        });
      })
      .catch(() => { /* socket.io not installed — polling fallback */ });
    return () => { if (socket) socket.disconnect(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSrcId]);

  // Handlers
  const [predError, setPredError] = useState<string | null>(null);

  async function runPrediction() {
    setRunningPred(true);
    setPredSuccess(false);
    setPredError(null);
    try {
      const payload = predVillageId ? { villageId: Number(predVillageId) } : {};
      
      // Add a 15-second client-side timeout in case the backend hangs (e.g. database locks)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Request timed out. The server took too long to respond.")), 15000)
      );
      
      const response: any = await Promise.race([
        api.post("/predictions/drought", payload),
        timeoutPromise
      ]);

      setPredSuccess(true);
      
      // Update the UI instantly with the immediately returned predictions
      if (response?.predictions && response.predictions.length > 0) {
        mutatePreds(response.predictions, false); // Update local cache instantly without re-fetching
      } else {
        mutatePreds();
      }
      
      mutateIntel();
      setTimeout(() => setPredSuccess(false), 3500);
    } catch (err: any) {
      setPredError(err?.message ?? "Unknown error");
    } finally {
      setRunningPred(false);
    }
  }

  async function fetchSingleIntel(id: string) {
    if (!id) { setIndividualIntel(null); return; }
    setLoadingInd(true);
    setIntelError(null);
    try {
      const data = await api.get<IntelItem>(`/water-sources/${id}/intelligence`);
      setIndividualIntel(data);
    } catch (err: any) {
      setIntelError(err?.message ?? "Failed to load");
      setIndividualIntel(null);
    } finally {
      setLoadingInd(false);
    }
  }

  // KPIs
  const severeCount      = predictionList.filter(p => ["severe", "high"].includes(normaliseLevel(p.predictedLevel))).length;
  const highFailureCount = intelligenceList.filter(i => ["severe", "high"].includes(normaliseLevel(intelRiskLevel(i)))).length;

  // Filtered lists
  const q = searchQuery.trim().toLowerCase();

  const filteredPredictions = predictionList
    .filter(p => !q || (p.village?.name ?? "").toLowerCase().includes(q))
    .sort((a, b) => {
      const order: Record<string, number> = { severe: 0, high: 1, moderate: 2, medium: 2, low: 3 };
      return (order[normaliseLevel(a.predictedLevel)] ?? 9) - (order[normaliseLevel(b.predictedLevel)] ?? 9);
    });

  const filteredIntel = intelligenceList
    .filter(i =>
      !q ||
      (i.waterSource?.name ?? "").toLowerCase().includes(q) ||
      (i.village?.name ?? "").toLowerCase().includes(q)
    )
    .sort((a, b) => (b.priorityScore ?? 0) - (a.priorityScore ?? 0));

  // Risk distribution
  const total = predictionList.length || 1;
  const dist = (["severe", "high", "moderate", "low"] as RiskKey[]).map(key => ({
    key,
    meta: RISK_META[key],
    count: predictionList.filter(p => normaliseLevel(p.predictedLevel) === key).length,
  }));

  // ---- Render ---------------------------------------------------------------
  return (
    <section className="mt-6 space-y-4">

      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${isLive ? "bg-emerald-500" : "bg-slate-300"}`} />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight">AI Intelligence Center</h2>
            <p className="text-[11px] font-semibold flex items-center gap-1.5">
              {isLive ? (
                <><Wifi className="w-3 h-3 text-emerald-500" /><span className="text-emerald-600">Live stream connected</span></>
              ) : (
                <><WifiOff className="w-3 h-3 text-slate-400" /><span className="text-slate-500">Auto-refresh every 30s</span></>
              )}
            </p>
          </div>
        </div>

        {/* KPI pills */}
        <div className="flex flex-wrap gap-2 ml-auto items-center">
          {severeCount > 0 && (
            <span className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 text-xs font-bold px-3 py-1.5 rounded-full">
              <ShieldAlert className="w-3.5 h-3.5" />
              {severeCount} High-Risk Villages
            </span>
          )}
          {highFailureCount > 0 && (
            <span className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold px-3 py-1.5 rounded-full">
              <AlertTriangle className="w-3.5 h-3.5" />
              {highFailureCount} Sources At Risk
            </span>
          )}
          <button
            onClick={() => { mutatePreds(); mutateIntel(); }}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-full shadow-sm transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
          {(["predictions", "sources"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab === "predictions" ? <Zap className="w-3.5 h-3.5" /> : <Droplets className="w-3.5 h-3.5" />}
              {tab === "predictions" ? "Drought Predictions" : "Water Source Intel"}
            </button>
          ))}
        </div>

        <div className="relative flex items-center">
          <Search className="absolute left-3 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder={activeTab === "predictions" ? "Filter village..." : "Filter source / village..."}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded-xl pl-9 pr-8 py-2.5 w-56 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 text-slate-400 hover:text-slate-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* LEFT: Action panel */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

          {activeTab === "predictions" ? (
            /* Prediction trigger */
            <div className="p-5 space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center shadow-sm">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Run AI Prediction</h3>
                  <p className="text-[10px] text-slate-400 font-medium">POST /api/predictions/drought</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Target Village
                </label>
                <select
                  value={predVillageId}
                  onChange={e => setPredVillageId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all appearance-none"
                >
                  <option value="">All villages (batch)</option>
                  {uniqueVillages.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>

                <button
                  onClick={runPrediction}
                  disabled={runningPred}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                    predSuccess
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200"
                      : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg shadow-indigo-200"
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {runningPred ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Analyzing...
                    </>
                  ) : predSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Predictions Updated!
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Run Daily Prediction
                    </>
                  )}
                </button>

                {predError && (
                  <div className="mt-2 bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 font-medium">
                    {predError}
                  </div>
                )}
              </div>

              {/* Distribution bars */}
              <div className="space-y-1 pt-3 border-t border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">Latest Summary</p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-500 mb-1">Villages Analyzed</p>
                    <p className="text-2xl font-black text-slate-900">{predictionList.length}</p>
                  </div>
                  <div className={`rounded-xl p-3 border ${severeCount > 0 ? "bg-red-50 border-red-100" : "bg-slate-50 border-slate-100"}`}>
                    <p className={`text-[10px] font-bold mb-1 ${severeCount > 0 ? "text-red-500" : "text-slate-500"}`}>
                      High Risk
                    </p>
                    <p className={`text-2xl font-black ${severeCount > 0 ? "text-red-700" : "text-slate-900"}`}>
                      {severeCount}
                    </p>
                  </div>
                </div>
                {dist.map(({ key, meta, count }) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${meta.dot} flex-shrink-0`} />
                    <span className="text-[11px] font-medium text-slate-600 capitalize w-16">{meta.label}</span>
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${meta.bar} rounded-full transition-all duration-700`}
                        style={{ width: `${(count / total) * 100}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 w-4 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>

          ) : (
            /* Individual source lookup */
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-xl flex items-center justify-center shadow-sm">
                  <Search className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Check Individual Well</h3>
                  <p className="text-[10px] text-slate-400 font-medium">GET /api/water-sources/:id/intelligence</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Select Water Source
                </label>
                {(!sourcesList || sourcesList.length === 0) ? (
                  <div className="w-full bg-slate-50 border border-slate-200 text-slate-400 text-sm font-medium rounded-xl px-4 py-3 flex items-center justify-between">
                    <span>Loading water sources...</span>
                    <span className="w-4 h-4 border-2 border-slate-200 border-t-slate-400 rounded-full animate-spin" />
                  </div>
                ) : (
                  <select
                    value={selectedSrcId}
                    onChange={e => { setSelectedSrcId(e.target.value); void fetchSingleIntel(e.target.value); }}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all cursor-pointer"
                  >
                    <option value="">Choose a water source...</option>
                    {sourcesList.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name} - {s.village?.name || 'Unknown village'}</option>
                    ))}
                  </select>
                )}
              </div>

              {loadingInd && (
                <div className="flex items-center justify-center py-8 gap-3">
                  <span className="w-6 h-6 border-4 border-cyan-100 border-t-cyan-500 rounded-full animate-spin" />
                  <span className="text-sm text-slate-500 font-medium">Analyzing source...</span>
                </div>
              )}

              {intelError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 font-medium">
                  {intelError}
                </div>
              )}

              {individualIntel && !loadingInd && (() => {
                const lvl  = intelRiskLevel(individualIntel);
                const meta = getRisk(lvl);
                const days = intelDays(individualIntel);
                const rec  = intelRecommendation(individualIntel);
                return (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-black text-slate-900">{individualIntel.waterSource?.name}</p>
                        <p className="text-xs text-slate-500">{individualIntel.village?.name}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${meta.badge}`}>
                        {meta.label} Risk
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white rounded-xl p-3 border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />Est. Failure
                        </p>
                        <p className="text-xl font-black text-slate-900">
                          {days !== null ? days : "N/A"}
                          {days !== null && <span className="text-xs font-normal text-slate-400 ml-1">days</span>}
                        </p>
                      </div>
                      <div className="bg-white rounded-xl p-3 border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Priority Score</p>
                        <p className="text-xl font-black text-slate-900">
                          {typeof individualIntel.priorityScore === "number"
                            ? Math.round(individualIntel.priorityScore)
                            : "N/A"}
                          <span className="text-xs font-normal text-slate-400 ml-0.5">/100</span>
                        </p>
                      </div>
                    </div>
                    {rec && (
                      <div className="bg-white rounded-xl p-3 border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Recommendation</p>
                        <p className="text-xs text-slate-700 leading-relaxed">💡 {rec}</p>
                      </div>
                    )}
                    {(individualIntel.reasons ?? []).slice(0, 2).map((r, i) => (
                      <p key={i} className="text-[11px] text-slate-500 flex items-start gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${meta.dot} flex-shrink-0 mt-1`} />
                        {r}
                      </p>
                    ))}
                  </div>
                );
              })()}

              {!individualIntel && !loadingInd && !intelError && (
                <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                  <Droplets className="w-8 h-8 text-slate-300 mb-2" />
                  <p className="text-sm font-medium text-slate-500">Select a source above</p>
                  <p className="text-xs text-slate-400">AI failure analysis per well</p>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-500 mb-1">Sources Analyzed</p>
                  <p className="text-xl font-black text-slate-900">{intelligenceList.length}</p>
                </div>
                <div className={`rounded-xl p-3 border ${highFailureCount > 0 ? "bg-orange-50 border-orange-100" : "bg-slate-50 border-slate-100"}`}>
                  <p className={`text-[10px] font-bold mb-1 ${highFailureCount > 0 ? "text-orange-600" : "text-slate-500"}`}>
                    At Risk
                  </p>
                  <p className={`text-xl font-black ${highFailureCount > 0 ? "text-orange-700" : "text-slate-900"}`}>
                    {highFailureCount}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Feed panel (2/3 width) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">

          {/* Feed header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
            <div>
              <h3 className="text-sm font-black text-slate-900">
                {activeTab === "predictions" ? "Village Risk Overview" : "Priority Maintenance Queue"}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {activeTab === "predictions"
                  ? `${filteredPredictions.length} ${filteredPredictions.length === 1 ? "village" : "villages"} sorted by risk`
                  : `${filteredIntel.length} ${filteredIntel.length === 1 ? "source" : "sources"} sorted by urgency`}
                {predsError && " · Error loading predictions"}
                {intelSWRError && " · Python service unavailable"}
              </p>
            </div>
            {activeTab === "sources" && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-600 text-[9px] font-bold tracking-widest uppercase border border-cyan-100">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                LIVE
              </span>
            )}
          </div>

          {/* Predictions tab content */}
          {activeTab === "predictions" && (
            <div className="flex-1 overflow-y-auto" style={{ maxHeight: 520 }}>
              {loadingPreds && <Skeleton />}
              {predsError && (
                <div className="m-4 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                  <strong>Error loading predictions.</strong> Make sure the backend is running.
                </div>
              )}
              {!loadingPreds && !predsError && filteredPredictions.length === 0 && (
                <Empty
                  icon={BrainCircuit}
                  title={q ? `No results for "${q}"` : "No predictions yet"}
                  sub={q ? "Try a different village name" : 'Click "Run Daily Prediction" to generate AI analysis'}
                />
              )}
              <div className="p-4 space-y-2.5">
                {filteredPredictions.map(pred => {
                  const meta   = getRisk(pred.predictedLevel);
                  const isHigh = ["severe", "high"].includes(normaliseLevel(pred.predictedLevel));
                  const dateStr = pred.predictionDate
                    ? new Date(pred.predictionDate).toLocaleString("en-US", { 
                        month: "short", 
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true
                      })
                    : "";
                  return (
                    <div
                      key={pred.id}
                      className={`relative bg-white border rounded-2xl p-4 shadow-sm flex items-center gap-4 hover:shadow-md transition-all overflow-hidden ${
                        isHigh ? "border-red-100 hover:border-red-200" : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${meta.bar} rounded-l-2xl`} />
                      <ConfidenceRing value={pred.confidenceScore ?? 0} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-black text-slate-900 truncate">
                            {pred.village?.name ?? "Unknown Village"}
                          </p>
                          {isHigh && <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-1.5">
                          <Activity className="w-3 h-3" />
                          <span>
                            Drought Risk:{" "}
                            <strong className="text-slate-700">
                              {typeof pred.droughtRisk === "number"
                                ? `${(pred.droughtRisk * 100).toFixed(0)}%`
                                : "N/A"}
                            </strong>
                          </span>
                          {dateStr && (
                            <>
                              <span className="text-slate-300">·</span>
                              <span>{dateStr}</span>
                            </>
                          )}
                        </div>
                        {pred.reasons?.[0] && (
                          <p className="text-[11px] text-slate-500 line-clamp-1">{pred.reasons[0]}</p>
                        )}
                      </div>
                      <span className={`flex-shrink-0 text-[10px] font-black px-3 py-1.5 rounded-full border ${meta.badge}`}>
                        {meta.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sources tab content */}
          {activeTab === "sources" && (
            <div className="flex-1 overflow-y-auto" style={{ maxHeight: 520 }}>
              {loadingIntel && <Skeleton />}
              {intelSWRError && (
                <div className="m-4 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                  <strong>Python ML service unavailable.</strong> Make sure{" "}
                  <code className="bg-red-100 px-1 rounded">npm run risk:dev</code> is running.
                </div>
              )}
              {!loadingIntel && !intelSWRError && filteredIntel.length === 0 && (
                <Empty
                  icon={Droplets}
                  title={q ? `No results for "${q}"` : "No intelligence data yet"}
                  sub={q ? "Try a different source or village name" : "Water source failure data will appear here automatically"}
                />
              )}
              <div className="p-4 space-y-2.5">
                {filteredIntel.map((intel, idx) => {
                  const lvl      = intelRiskLevel(intel);
                  const meta     = getRisk(lvl);
                  const days     = intelDays(intel);
                  const isUrgent = ["severe", "high"].includes(normaliseLevel(lvl));
                  const isSel    = selectedSrcId === intel.waterSource?.id?.toString();
                  return (
                    <div
                      key={intel.waterSource?.id ?? idx}
                      onClick={() => {
                        const id = intel.waterSource?.id?.toString() ?? "";
                        setSelectedSrcId(id);
                        void fetchSingleIntel(id);
                      }}
                      className={`relative bg-white border rounded-2xl p-4 shadow-sm cursor-pointer transition-all overflow-hidden group ${
                        isSel
                          ? "border-cyan-400 ring-2 ring-cyan-100 shadow-cyan-100"
                          : isUrgent
                          ? "border-orange-100 hover:border-orange-300 hover:shadow-md"
                          : "border-slate-200 hover:border-slate-300 hover:shadow-md"
                      }`}
                    >
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${meta.bar} rounded-l-2xl`} />
                      <div className="flex items-center gap-4">
                        <div className={`flex-shrink-0 w-14 h-14 rounded-2xl flex flex-col items-center justify-center border-2 ${
                          isUrgent ? "border-red-200 bg-red-50" : "border-slate-200 bg-slate-50"
                        }`}>
                          <span className={`text-lg font-black leading-tight ${isUrgent ? "text-red-700" : "text-slate-700"}`}>
                            {days !== null ? days : "-"}
                          </span>
                          <span className={`text-[9px] font-bold uppercase tracking-wide ${isUrgent ? "text-red-400" : "text-slate-400"}`}>
                            {days !== null ? "days" : "N/A"}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-black text-slate-900 truncate">
                              {intel.waterSource?.name ?? "Unknown Source"}
                            </p>
                            {isUrgent && <AlertTriangle className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />}
                          </div>
                          <p className="text-xs text-slate-500 font-medium mb-1.5">
                            {intel.village?.name}
                            {intel.waterSource?.type ? ` - ${intel.waterSource.type}` : ""}
                          </p>
                          {(intel.reasons ?? [])[0] && (
                            <p className="text-[11px] text-slate-500 line-clamp-1">{intel.reasons[0]}</p>
                          )}
                        </div>
                        <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${meta.badge}`}>
                            {meta.label}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Score: <strong className="text-slate-700">{Math.round(intel.priorityScore ?? 0)}</strong>
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 flex-shrink-0 transition-colors" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

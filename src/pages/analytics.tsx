import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { Download, Calendar, MoreVertical, Filter } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, Legend } from "recharts";
import AuthGuard from "@/components/AuthGuard";
import api from "@/lib/api";
import type { AnalyticsData } from "@/lib/types";
import { exportToCSV } from "@/lib/export";

export default function Analytics() {
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await api.get<AnalyticsData>(`/analytics?days=${days}`);
        setData(res);
      } catch (err) {
        console.error("Failed to load analytics", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [days]);

  const handleExport = async () => {
    if (!data || !data.villageData) return;
    setIsExporting(true);
    
    try {
      // Simulate a small delay for better UX feedback, since local processing is instant
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const exportData = data.villageData.map((v, index) => ({
        'Rank (by broken volume)': index + 1,
        'Village Name': v.village,
        'Total Water Sources': v.count,
        'Working Sources': v.working,
        'Broken Sources': v.broken,
        'Functional %': Math.round((v.working / v.count) * 100) || 0
      }));
      
      exportToCSV(`analytics_report_${days}_days.csv`, exportData);
    } catch (err) {
      console.error("Failed to export", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AuthGuard requireStaff>
      <Head>
        <title>Analytics | Biyo-dhowr</title>
      </Head>
      <div className="p-4 sm:p-8 max-w-[1600px] mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-transparent">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Executive Climate Analytics</h1>
            <p className="text-sm text-slate-500">Macro-level resource status and historical trends.</p>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <select 
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium pl-9 pr-8 py-2 rounded-lg transition-colors shadow-sm outline-none cursor-pointer appearance-none"
              >
                <option value={7}>Last 7 Days</option>
                <option value={30}>Last 30 Days</option>
                <option value={90}>Last 90 Days</option>
                <option value={180}>Last 6 Months</option>
              </select>
            </div>
            <button 
              onClick={handleExport}
              disabled={isExporting || !data}
              className="flex-1 sm:flex-none bg-[#0f172a] hover:bg-slate-800 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isExporting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Download className="w-4 h-4" />}
              {isExporting ? 'Exporting...' : 'Export Report'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* 1. Donut Chart */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg mb-1">Water Point Status</h3>
                  <p className="text-sm text-slate-500">Functional vs. Broken distribution across all regions.</p>
                </div>
                <button className="text-slate-400 hover:text-slate-600">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
              
              <div className="h-[280px] relative">
                {data?.statusData && (
                  <>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-4xl font-black text-slate-900">
                        {Math.round((data.statusData.find(d => d.status === "Working")?.count || 0) / 
                          data.statusData.reduce((a, b) => a + b.count, 0) * 100)}%
                      </span>
                      <span className="text-xs font-bold text-slate-500">Functional</span>
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.statusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={110}
                          paddingAngle={0}
                          dataKey="count"
                          stroke="white"
                          strokeWidth={4}
                        >
                          {data.statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.status === 'Working' ? '#006d77' : entry.status === 'Broken' ? '#c1121f' : '#8ecae6'} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                        />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36}
                          iconType="square"
                          formatter={(value, entry) => <span className="text-sm text-slate-600 ml-1">{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </>
                )}
              </div>
            </div>

            {/* 2. Bar Chart */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg mb-1">Critical Villages</h3>
                  <p className="text-sm text-slate-500">Top 5 by non-functional source volume.</p>
                </div>
                <button className="text-slate-400 hover:text-slate-600">
                  <Filter className="w-5 h-5" />
                </button>
              </div>
              
              <div className="h-[280px]">
                {data?.villageData && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.villageData.slice(0, 5)} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="village" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} dx={-10} />
                      <RechartsTooltip 
                        cursor={{fill: '#f8fafc'}}
                        contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar 
                        dataKey="broken" 
                        fill="#c1121f" 
                        name="Broken" 
                        barSize={40} 
                        onClick={(entry) => {
                          if (entry && entry.village) {
                            router.push(`/admin/water-sources?search=${encodeURIComponent(entry.village)}&status=Broken`);
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* 3. Stacked Bar Chart */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg mb-1">Source Type Analysis</h3>
                  <p className="text-sm text-slate-500">Functional vs Non-functional by type.</p>
                </div>
                <div className="flex gap-4">
                   <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-[#006d77] rounded-sm"></div><span className="text-xs font-bold text-slate-600">Func.</span></div>
                   <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-[#c1121f] rounded-sm"></div><span className="text-xs font-bold text-slate-600">Non-Func.</span></div>
                </div>
              </div>
              
              <div className="h-[280px]">
                {data?.sourceTypeData && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.sourceTypeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="type" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} dx={-10} />
                      <RechartsTooltip 
                        cursor={{fill: '#f8fafc'}}
                        contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="working" fill="#006d77" name="Working" barSize={30} />
                      <Bar dataKey="broken" fill="#c1121f" name="Broken" barSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* 4. Area Chart */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg mb-1">Drought & Maintenance Trends</h3>
                  <p className="text-sm text-slate-500">6-month timeline of functionality vs. repairs.</p>
                </div>
                 <div className="flex gap-4">
                   <div className="flex items-center gap-1.5"><div className="w-4 h-1 bg-[#006d77] rounded-sm"></div><span className="text-xs font-bold text-slate-600">Functionality</span></div>
                   <div className="flex items-center gap-1.5"><div className="w-4 h-1 bg-[#d4a373] rounded-sm"></div><span className="text-xs font-bold text-slate-600">Repairs</span></div>
                </div>
              </div>
              
              <div className="h-[280px]">
                {data?.trendData && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorFunc2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#006d77" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#006d77" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorRep2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#d4a373" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#d4a373" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} dx={-10} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Area type="monotone" dataKey="functional" stroke="#006d77" strokeWidth={3} fillOpacity={1} fill="url(#colorFunc2)" name="Working Sources" />
                      <Area type="monotone" dataKey="repairs" stroke="#d4a373" strokeWidth={3} fillOpacity={1} fill="url(#colorRep2)" name="Repairs Done" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </AuthGuard>
  );
}

import Head from "next/head";
import AuthGuard from "@/components/AuthGuard";
import { Settings as SettingsIcon, Bell, Shield, Database, Globe } from "lucide-react";

export default function Settings() {
  return (
    <AuthGuard>
      <Head>
        <title>Settings | Biyo-dhowr</title>
      </Head>
      <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Settings</h1>
          <p className="text-sm text-slate-500">Manage platform preferences and configuration.</p>
        </div>

        {/* Profile Section */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-slate-600" />
            </div>
            <h2 className="font-bold text-slate-900">Account & Security</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                  placeholder="Eng. Ahmed Jama"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                  placeholder="engineer@biyo-dhowr.gov"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">New Password</label>
              <input
                type="password"
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                placeholder="Leave blank to keep current"
              />
            </div>
            <div className="flex justify-end pt-2">
              <button className="bg-[#0f172a] hover:bg-slate-800 text-white font-bold text-sm px-5 py-2.5 rounded-lg transition-colors shadow-sm">
                Save Changes
              </button>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
              <Bell className="w-4 h-4 text-slate-600" />
            </div>
            <h2 className="font-bold text-slate-900">Notifications</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {[
              { label: "Critical Zone Alerts", desc: "Notify me when a drought zone is elevated to critical." },
              { label: "New Community Reports", desc: "Notify me when new field reports are submitted." },
              { label: "Water Source Status Changes", desc: "Notify me when a source changes to Broken or Dry." },
              { label: "Weekly Analytics Digest", desc: "Receive a weekly summary report every Monday." },
            ].map((item, i) => (
              <div key={i} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900">{item.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4 shrink-0">
                  <input type="checkbox" defaultChecked={i < 2} className="sr-only peer" />
                  <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* System Section */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
              <Database className="w-4 h-4 text-slate-600" />
            </div>
            <h2 className="font-bold text-slate-900">System Configuration</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Region Focus</label>
                <select className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500">
                  <option>Awdal Region</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Default District</label>
                <select className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500">
                  <option>Borama</option>
                  <option>Baki</option>
                  <option>Lughaya</option>
                  <option>Zeila</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between py-3 px-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div>
                <p className="text-sm font-bold text-amber-900">API Endpoint</p>
                <p className="text-xs text-amber-700 font-mono mt-0.5">http://localhost:4000/api</p>
              </div>
              <span className="flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-full border border-green-200">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Connected
              </span>
            </div>
          </div>
        </div>

      </div>
    </AuthGuard>
  );
}

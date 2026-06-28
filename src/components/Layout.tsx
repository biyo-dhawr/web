import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  LayoutDashboard,
  Droplet,
  BarChart3,
  Settings,
  Bell,
  Search,
  LogOut,
  Menu,
  X,
  Users,
} from "lucide-react";
import type { AuthUser } from "@/lib/types";
import api from "@/lib/api";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, requireAdmin: true },
  { name: "Water Sources", href: "/admin/water-sources", icon: Droplet, requireAdmin: true },
  { name: "Analytics", href: "/analytics", icon: BarChart3, requireAdmin: true },
  { name: "Field Reports", href: "/reports", icon: Droplet, requireStaff: true },
  { name: "Village Leaders", href: "/admin/village-leaders", icon: Users, requireAdmin: true },
  { name: "Settings", href: "/settings", icon: Settings },
];

const AUTH_PATHS = ["/auth/login", "/auth/register", "/"];

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadAlerts, setUnreadAlerts] = useState<number>(0);

  useEffect(() => {
    if (!user) return;

    const fetchAlerts = async () => {
      try {
        const res = await api.get<any[]>('/alerts?active=true');
        setUnreadAlerts(res.length);
      } catch (err) {
        console.error('Failed to fetch alerts', err);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);

    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        setUser(JSON.parse(raw) as AuthUser);
      }
    } catch {
      setUser(null);
    }
  }, [router.pathname]);

  // ── Don't render sidebar on auth/landing pages ────────────────────────
  const isAuthPage = AUTH_PATHS.some((p) => router.pathname === p);
  if (isAuthPage) {
    return <>{children}</>;
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/auth/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* ── Mobile Sidebar Overlay ── */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar (Dark Theme) ── */}
      <aside 
        className={`fixed md:static inset-y-0 left-0 w-64 bg-slate-900 flex flex-col z-50 transform transition-transform duration-300 ease-in-out border-r border-slate-800 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <Droplet className="w-5 h-5 text-slate-900" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block leading-tight">Enterprise Water</span>
              <span className="text-white font-bold text-sm tracking-tight leading-tight">Monitor</span>
            </div>
          </div>
          <button 
            className="ml-auto md:hidden text-slate-400 hover:text-white"
            onClick={() => setMobileOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {NAV_ITEMS.filter((item: any) => {
            if (item.requireAdmin) {
              return user?.role === "GOVERNMENT WORKER";
            }
            if (item.requireStaff) {
              return user?.role === "GOVERNMENT WORKER" || user?.role === "VILLAGE LEADER";
            }
            return true;
          }).map((item: any) => {
            const isActive =
              router.pathname === item.href ||
              (item.href !== "/" && router.pathname?.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? "bg-cyan-500 text-slate-900 shadow-md shadow-cyan-500/20"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                <item.icon
                  className={`w-4 h-4 ${
                    isActive ? "text-slate-900" : "text-slate-400 group-hover:text-slate-300"
                  }`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header (Light Theme) */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shrink-0 z-10">
          <div className="flex items-center gap-4 flex-1">
            <button 
              className="md:hidden text-slate-500 hover:text-slate-900"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Global Search Removed in favor of local search */}
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <button className="relative text-slate-500 hover:text-slate-900 transition-colors">
              <Bell className="w-5 h-5" />
              {unreadAlerts > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 rounded-full border border-white text-[10px] font-bold text-white flex items-center justify-center px-1">
                  {unreadAlerts > 99 ? '99+' : unreadAlerts}
                </span>
              )}
            </button>
            
            <div className="h-6 w-px bg-slate-200" />
            
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-bold text-slate-900">{user.fullName}</p>
                  <p className="text-[10px] text-slate-500 font-medium uppercase">{user.role.replace('_', ' ')}</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold border border-cyan-200 cursor-pointer overflow-hidden relative group">
                  {user.fullName.charAt(0)}
                  <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" onClick={handleLogout}>
                    <LogOut className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            ) : (
              <Link href="/auth/login" className="text-sm font-bold text-cyan-600 hover:text-cyan-700">
                Sign In
              </Link>
            )}
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-slate-50">
          {children}
        </div>
      </main>
    </div>
  );
}

import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Droplet, Mail, Lock, User, Shield, Loader2 } from "lucide-react";
import api from "@/lib/api";
import type { UserRole, RegisterPayload } from "@/lib/types";

const ROLES: { value: UserRole; label: string; desc: string }[] = [
  { value: "GOVERNMENT WORKER", label: "Government Official", desc: "Regional monitoring & oversight" },
  { value: "VILLAGE LEADER", label: "Village Leader", desc: "Local asset management" },
  { value: "COMMUNITY MEMBER", label: "Community Reporter", desc: "Submit field reports" },
];

export default function Register() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("COMMUNITY MEMBER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload: RegisterPayload = { fullName, email, password, role };
      await api.post("/auth/register", payload);
      
      // On success, redirect to login so they can authenticate
      router.push("/auth/login?registered=true");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Register | Biyo-dhowr</title>
      </Head>
      <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row p-0 sm:p-4 lg:p-8">
        <div className="flex-1 flex flex-col md:flex-row w-full max-w-[1400px] mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
          
          {/* Right Side - Auth Form (Swapped for variety) */}
          <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-16 relative bg-[#f8fafc]">
            <div className="w-full max-w-[400px]">
              {/* Mobile Branding */}
              <div className="md:hidden flex items-center gap-3 mb-10 justify-center">
                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
                  <Droplet className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">Biyo-dhowr</h1>
              </div>

              <div className="mb-10">
                <div className="flex gap-6 mb-8 border-b border-slate-200 pb-4">
                  <Link href="/auth/login" className="text-slate-500 font-medium text-lg hover:text-slate-700 pb-4">
                    Sign In
                  </Link>
                  <span className="text-slate-900 font-bold text-lg border-b-2 border-slate-900 pb-4 -mb-[18px]">
                    Register
                  </span>
                </div>
                <h2 className="text-3xl font-bold text-[#0f172a] mb-3 tracking-tight">Create Account</h2>
                <p className="text-slate-500 text-sm">Request access to the enterprise portal.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors placeholder:text-slate-400 shadow-sm"
                      placeholder="Eng. Ahmed Jama"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors placeholder:text-slate-400 shadow-sm"
                      placeholder="engineer@biyo-dhowr.gov"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors placeholder:text-slate-400 shadow-sm"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Access Role</label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors shadow-sm appearance-none cursor-pointer"
                    >
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label} - {r.desc}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-4 w-full bg-[#0f172a] hover:bg-slate-800 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Create Account"
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Left Side - Hero/Branding */}
          <div className="hidden md:flex flex-1 relative bg-slate-900 flex-col justify-end p-12 overflow-hidden border-l border-slate-200">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1622322699994-4ba2d23013de?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/60 to-transparent" />
            
            <div className="relative z-10 max-w-lg">
              <h2 className="text-3xl font-bold text-white mb-4">Secure Access</h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                Every request is securely logged and monitored to ensure the integrity of Awdal&apos;s critical infrastructure.
              </p>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

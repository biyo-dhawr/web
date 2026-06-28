import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Droplet, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import api from "@/lib/api";
import type { AuthResponse, LoginPayload } from "@/lib/types";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload: LoginPayload = { email, password };
      const res = await api.post<AuthResponse>("/auth/login", payload);

      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));

      // Village Leaders go directly to their field reports, not the dashboard
      if (res.user.role === "VILLAGE LEADER") {
        router.push("/reports");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login | Biyo-dhowr</title>
      </Head>
      <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row p-0 sm:p-4 lg:p-8">
        <div className="flex-1 flex flex-col md:flex-row w-full max-w-[1400px] mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
          
          {/* Left Side - Hero/Branding */}
          <div className="hidden md:flex flex-1 relative bg-slate-900 flex-col justify-end p-12 overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541888004688-bbcde58fd4ac?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/80 to-transparent" />
            
            <div className="relative z-10 max-w-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                  <Droplet className="w-6 h-6 text-slate-900" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white tracking-tight">Biyo-dhowr</h1>
                </div>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Enterprise Water Monitor</h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                Providing actionable intelligence for high-stakes environmental monitoring and resource management across arid regions.
              </p>
            </div>
          </div>

          {/* Right Side - Auth Form */}
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
                  <span className="text-slate-900 font-bold text-lg border-b-2 border-slate-900 pb-4 -mb-[18px]">
                    Sign In
                  </span>
                </div>
                <h2 className="text-3xl font-bold text-[#0f172a] mb-3 tracking-tight">Welcome Back</h2>
                <p className="text-slate-500 text-sm">Enter your credentials to access the enterprise dashboard.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                    {error}
                  </div>
                )}

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
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Password</label>
                    <button type="button" className="text-[11px] font-bold text-[#006d77] hover:text-[#005259]">
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg pl-10 pr-12 py-3 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors placeholder:text-slate-400 shadow-sm"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 w-max text-[#006d77] font-medium transition-colors flex items-center gap-1 disabled:opacity-50 hover:underline"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Sign In
                      <span>→</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

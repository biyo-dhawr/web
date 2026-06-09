import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/router";
import type { UserRole, AuthUser } from "@/lib/types";

interface AuthGuardProps {
  children: ReactNode;
  requireStaff?: boolean;
}

export default function AuthGuard({ children, requireStaff }: AuthGuardProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userRaw = localStorage.getItem("user");

    if (!token || !userRaw) {
      router.replace("/auth/login");
      return;
    }

    try {
      const user: AuthUser = JSON.parse(userRaw);

      if (requireStaff) {
        if (
          user.role === "GOVERNMENT WORKER" ||
          user.role === "VILLAGE LEADER"
        ) {
          setIsAuthorized(true);
        } else {
          router.replace("/dashboard");
          return;
        }
      } else {
        setIsAuthorized(true);
      }
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.replace("/auth/login");
    } finally {
      setIsChecking(false);
    }
  }, [router, requireStaff]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm font-medium">Verifying access…</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) return null;

  return <>{children}</>;
}

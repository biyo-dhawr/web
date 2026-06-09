/**
 * Biyo-dhowr – Unified API Fetcher
 *
 * Generic type-safe request utility that:
 *  - Points to NEXT_PUBLIC_API_URL (fallback: http://localhost:4000/api)
 *  - Automatically injects the JWT Bearer token from localStorage
 *  - Globally handles 401 Unauthorized by clearing credentials and redirecting
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

// ─── Error Type ────────────────────────────────────────────────────────────

export class ApiError extends Error {
  public readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// ─── Core Request Function ─────────────────────────────────────────────────

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Only access localStorage on the client
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Build headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Merge any caller-provided headers (they can override the defaults)
  if (options.headers) {
    const callerHeaders = options.headers as Record<string, string>;
    Object.assign(headers, callerHeaders);
  }

  let response: Response;

  try {
    response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (networkError) {
    throw new ApiError(
      `Network error – could not reach ${BASE_URL}${endpoint}`,
      0
    );
  }

  // ── Global 401 handler ────────────────────────────────────────────────
  if (response.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/auth/login";
    }
    throw new ApiError("Unauthorized – session expired", 401);
  }

  // ── Other non-OK responses ────────────────────────────────────────────
  if (!response.ok) {
    let message = `Request failed: ${response.status} ${response.statusText}`;
    try {
      const body = await response.json();
      if (body?.message) message = body.message;
    } catch {
      // ignore parse error
    }
    throw new ApiError(message, response.status);
  }

  // ── Success ───────────────────────────────────────────────────────────
  return response.json() as Promise<T>;
}

// ─── Convenience Helpers ───────────────────────────────────────────────────

export const api = {
  get: <T>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: "GET" }),

  post: <T>(endpoint: string, body: unknown) =>
    apiRequest<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  patch: <T>(endpoint: string, body: unknown) =>
    apiRequest<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  delete: <T>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: "DELETE" }),
};

export default api;

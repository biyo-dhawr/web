// ─── Updated types aligned exactly with the real backend schema ──────────────

export type UserRole =
  | "GOVERNMENT WORKER"
  | "VILLAGE LEADER"
  | "COMMUNITY MEMBER";

// ─── Auth ──────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  ngoId: number | null;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: AuthUser;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
}

// ─── Geography ─────────────────────────────────────────────────────────────

export interface Region {
  id: number;
  name: string;
}

export interface District {
  id: number;
  name: string;
  regionId: number;
}

export interface Village {
  id: number;
  name: string;
  // Drizzle returns snake_case from DB; TS type also accepts camelCase
  districtId?: number;
  district_id?: number;
  latitude: number | null;
  longitude: number | null;
  droughtRiskLevel?: string;
  drought_risk_level?: string;
  district?: District & { region?: Region };
}

// ─── Water Sources ─────────────────────────────────────────────────────────

export interface WaterSource {
  id: number;
  villageId: number;
  name: string;
  type: string;
  status: string;
  waterLevel: number;
  latitude: number | null;
  longitude: number | null;
  lastMaintained: string | null;
  village?: Village;
  sensorReadings?: SensorReading[];
}

/** Paginated list response from GET /api/water-sources */
export interface WaterSourceListResponse {
  data: WaterSource[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateWaterSourcePayload {
  villageId: number;
  name: string;
  type?: string;
  status?: string;
  waterLevel?: number;
  latitude?: number;
  longitude?: number;
}

export interface PatchStatusPayload {
  status?: string;
  waterLevel?: number;
}

// ─── Reports ───────────────────────────────────────────────────────────────

export interface Report {
  id: number;
  userId: string | null;
  villageId: number | null;
  waterSourceId: number | null;
  reporterType: string;
  phoneNumber?: string | null;
  content: string;
  severityLevel?: string;
  status: string;
  actionTaken?: string | null;
  isVerified: boolean;
  createdAt: string;
  waterSource?: WaterSource;
  village?: Village;
  user?: { id: string; fullName: string; email: string } | null;
}

export interface ReportTrendItem {
  date: string;   // 'YYYY-MM-DD'
  count: number;
}

// ─── Alerts ────────────────────────────────────────────────────────────────

export interface Alert {
  id: number;
  villageId: number | null;
  message: string;
  severity: string;
  isActive: boolean;
  createdAt: string;
  village?: Village;
}

// ─── Dashboard ─────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalSources: number;
  pendingReports: number;
  criticalZones: number;
  recentReports: Report[];
}

// ─── Analytics ─────────────────────────────────────────────────────────────

export interface AnalyticsStatusItem {
  status: string;
  count: number;
  color: string;
  description: string;
}

export interface AnalyticsVillageItem {
  village: string;
  count: number;
  functional?: number; // legacy
  nonFunctional?: number; // legacy
  working: number;
  broken: number;
}

export interface AnalyticsSourceTypeItem {
  type: string;
  count: number;
  functional?: number; // legacy
  working: number;
  broken: number;
}

export interface AnalyticsTrendItem {
  month: string;
  functional: number;
  nonFunctional: number;
  repairs: number;
}

export interface AnalyticsData {
  statusData: AnalyticsStatusItem[];
  villageData: AnalyticsVillageItem[];
  sourceTypeData: AnalyticsSourceTypeItem[];
  trendData: AnalyticsTrendItem[];
}

// ─── Sensor Readings ───────────────────────────────────────────────────────

export interface SensorReading {
  id: number;
  waterSourceId: number;
  soilMoisture: number | null;
  temperature: number | null;
  humidity: number | null;
  waterLevel: number | null;
  createdAt: string;
}

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import type { WaterSource } from "@/lib/types";

// Fix missing marker icons in leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ── Custom Icons ──────────────────────────────────────────────────────────────
const createIcon = (color: string, animate = false, size = 18) => {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.45);
        ${animate ? "animation: pulseRed 1.8s infinite;" : ""}
      "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2) - 4],
  });
};

const workingIcon = createIcon("#22c55e");          // green
const brokenIcon  = createIcon("#ef4444", true);    // red + pulse
const dryIcon     = createIcon("#3b82f6");           // blue
const repairIcon  = createIcon("#f59e0b");           // amber

// ── Map tile definitions ──────────────────────────────────────────────────────
const TILES = {
  street: {
    label: "Street",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> &copy; CARTO',
  },
  satellite: {
    label: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, Maxar, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community",
  },
} as const;

type TileKey = keyof typeof TILES;

// ── Map updater ────────────────────────────────────────────────────────────────
function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.5 });
  }, [map, center[0], center[1], zoom]);
  return null;
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface DashboardMapProps {
  sources: WaterSource[];
  center?: [number, number];
  zoom?: number;
  filterStatus?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function DashboardMap({
  sources,
  center = [10.5, 43.2],
  zoom = 9,
  filterStatus,
}: DashboardMapProps) {
  const [tileKey, setTileKey] = useState<TileKey>("satellite");

  const getBarColor = (level: number) => {
    if (level < 20) return "bg-red-500";
    if (level < 50) return "bg-amber-500";
    return "bg-green-500";
  };

  const tile = TILES[tileKey];

  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden border border-slate-200 shadow-sm">

      {/* ── Layer Toggle ── */}
      <div
        style={{ zIndex: 1000 }}
        className="absolute top-3 right-3 flex rounded-lg overflow-hidden shadow-md border border-slate-300 bg-white"
      >
        {(Object.keys(TILES) as TileKey[]).map((key) => (
          <button
            key={key}
            onClick={() => setTileKey(key)}
            className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
              tileKey === key
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            {TILES[key].label}
          </button>
        ))}
      </div>

      {/* ── Legend ── */}
      <div
        style={{ zIndex: 1000 }}
        className="absolute bottom-6 left-3 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg shadow-md px-3 py-2 text-xs space-y-1"
      >
        {[
          { color: "#22c55e", label: "Working" },
          { color: "#ef4444", label: "Broken" },
          { color: "#f59e0b", label: "Needs Repair" },
          { color: "#3b82f6", label: "Dry" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full border-2 border-white shadow-sm shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="text-slate-600 font-medium">{label}</span>
          </div>
        ))}
      </div>

      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        <MapUpdater center={center} zoom={zoom} />
        <TileLayer key={tileKey} attribution={tile.attribution} url={tile.url} />

        {sources.map((source) => {
          if (!source.latitude || !source.longitude) return null;

          const s = (source.status || "").toLowerCase();
          const filter = (filterStatus || "").toLowerCase();

          // Filtering
          if (filter && filter !== "all status" && filter !== "all") {
            if (filter === "needs repair" && s !== "needs repair") return null;
            if (filter === "broken"       && s !== "broken")       return null;
            if (filter === "working"      && s !== "working")      return null;
            if (filter === "dry"          && s !== "dry")          return null;
          }

          let icon = workingIcon;
          if (s === "broken")       icon = brokenIcon;
          if (s === "dry")          icon = dryIcon;
          if (s === "needs repair") icon = repairIcon;

          const currentWaterLevel =
            source.water_level !== undefined
              ? source.water_level
              : (source as any).waterLevel;

          return (
            <Marker
              key={`marker-${source.id}-${s}`}
              position={[source.latitude, source.longitude]}
              icon={icon}
            >
              <Popup className="custom-popup min-w-[260px]">
                <div className="p-3">
                  <h3 className="font-extrabold text-slate-900 text-lg mb-1 leading-tight tracking-tight">
                    {source.name}
                  </h3>
                  <div className="text-sm font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
                    📍 Village:{" "}
                    <span className="text-slate-700">{source.village?.name || "Unknown"}</span>
                  </div>

                  <div className="flex items-center gap-2 mb-4 text-xs font-bold">
                    <span className="text-slate-500">Status:</span>
                    <span
                      className={`flex items-center gap-1.5 ${
                        s === "working"
                          ? "text-green-600"
                          : s === "broken"
                          ? "text-red-600"
                          : s === "dry"
                          ? "text-blue-600"
                          : "text-amber-600"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          s === "working"
                            ? "bg-green-500"
                            : s === "broken"
                            ? "bg-red-500"
                            : s === "dry"
                            ? "bg-blue-500"
                            : "bg-amber-500"
                        }`}
                      />
                      {s === "working"
                        ? "Working"
                        : s === "broken"
                        ? "Broken / Maintenance Req."
                        : s === "dry"
                        ? "Dry"
                        : source.status}
                    </span>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div className="flex justify-between items-end text-sm">
                      <span className="font-medium text-slate-500">Water Level</span>
                      <span className="font-black text-slate-900 text-lg leading-none">
                        {currentWaterLevel != null && !Number.isNaN(currentWaterLevel)
                          ? `${currentWaterLevel}%`
                          : "No Data"}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden shadow-inner">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          currentWaterLevel != null && !Number.isNaN(currentWaterLevel)
                            ? getBarColor(currentWaterLevel)
                            : "bg-slate-300"
                        }`}
                        style={{
                          width: `${
                            currentWaterLevel != null && !Number.isNaN(currentWaterLevel)
                              ? currentWaterLevel
                              : 100
                          }%`,
                        }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-xs mt-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="font-semibold text-slate-500">Maintenance:</span>
                      <span className="font-bold text-slate-800">
                        {(source as any).last_maintained
                          ? new Date((source as any).last_maintained).toLocaleDateString()
                          : "No recent maintenance"}
                      </span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* ── CSS ── */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .leaflet-popup-content-wrapper { border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.15); }
          .leaflet-popup-content { margin: 0; }
          @keyframes pulseRed {
            0%   { box-shadow: 0 0 0 0   rgba(239,68,68,0.8); }
            70%  { box-shadow: 0 0 0 12px rgba(239,68,68,0);   }
            100% { box-shadow: 0 0 0 0   rgba(239,68,68,0);   }
          }
        `,
      }} />
    </div>
  );
}
import { useEffect } from "react";
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

// Custom Icons based on status
const createIcon = (color: string, animate = false) => {
  return L.divIcon({
    className: "custom-div-icon",
    html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5); ${animate ? 'animation: pulse 2s infinite;' : ''}"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8],
  });
};

const workingIcon = createIcon("#22c55e"); // Emerald Green
const brokenIcon = createIcon("#ef4444", true); // Rose Red (With Pulse animation)
const dryIcon = createIcon("#475569"); // Slate Madow/Cawl (For dry wells)
const repairIcon = createIcon("#f59e0b"); // Amber

interface DashboardMapProps {
  sources: WaterSource[];
  center?: [number, number];
  zoom?: number;
  filterStatus?: string;
}

function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.5 });
  }, [map, center[0], center[1], zoom]);
  
  return null;
}

export default function DashboardMap({ sources, center = [10.5, 43.2], zoom = 9, filterStatus }: DashboardMapProps) {
  // Corrected to use the exact number from database
  const getBarColor = (level: number) => {
    if (level < 20) return "bg-red-500";
    if (level < 50) return "bg-amber-500";
    return "bg-green-500";
  };

  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden border border-slate-200 shadow-sm">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        <MapUpdater center={center} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {sources.map((source) => {
          if (!source.latitude || !source.longitude) return null;
          
          const s = (source.status || "").toLowerCase();
          const filter = (filterStatus || "").toLowerCase();

          // 1. Dynamic Filtering Logic (Handles all active filters correctly)
          if (filter && filter !== "all status" && filter !== "all") {
            if (filter === "needs repair" && s !== "needs repair") return null;
            if (filter === "broken" && s !== "broken") return null;
            if (filter === "working" && s !== "working") return null;
            if (filter === "dry" && s !== "dry") return null;
          }

          // 2. Select matching icon based on exact status
          let icon = workingIcon;
          if (s === "broken") icon = brokenIcon;
          if (s === "dry") icon = dryIcon;
          if (s === "needs repair") icon = repairIcon;

          // Fallback variable to support both database snake_case and frontend camelCase
          const currentWaterLevel = source.water_level !== undefined ? source.water_level : (source as any).waterLevel;

          return (
            <Marker key={`marker-${source.id}-${s}`} position={[source.latitude, source.longitude]} icon={icon}>
              <Popup className="custom-popup min-w-[260px]">
                <div className="p-3">
                  <h3 className="font-extrabold text-slate-900 text-lg mb-1 leading-tight tracking-tight">
                    {source.name}
                  </h3>
                  <div className="text-sm font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
                    📍 Village: <span className="text-slate-700">{source.village?.name || "Unknown"}</span>
                  </div>
                  
                  {/* Status Badge inside Popup */}
                  <div className="flex items-center gap-2 mb-4 text-xs font-bold">
                    <span className="text-slate-500">Status:</span>
                    <span className={`flex items-center gap-1.5 ${
                      s === 'working' ? 'text-green-600' :
                      s === 'broken' ? 'text-red-600' :
                      s === 'dry' ? 'text-slate-600' : 'text-amber-600'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        s === 'working' ? 'bg-green-500' :
                        s === 'broken' ? 'bg-red-500' :
                        s === 'dry' ? 'bg-slate-500' : 'bg-amber-500'
                      }`} />
                      {s === 'working' ? 'Working' :
                       s === 'broken' ? 'Broken / Maintenance Req.' :
                       s === 'dry' ? 'Dry' : source.status}
                    </span>
                  </div>
                  
                  {/* Water Level Section */}
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
                            : 'bg-slate-300'
                        }`}
                        style={{ width: `${currentWaterLevel != null && !Number.isNaN(currentWaterLevel) ? currentWaterLevel : 100}%` }}
                      />
                    </div>
                    
                    {/* Maintenance Date */}
                    <div className="flex justify-between items-center text-xs mt-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="font-semibold text-slate-500">Maintenance:</span>
                      <span className="font-bold text-slate-800">
                        {(source as any).last_maintained 
                          ? new Date((source as any).last_maintained).toLocaleDateString() 
                          : 'No recent maintenance'}
                      </span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      
      {/* CSS for custom popup styling */}
      <style dangerouslySetInnerHTML={{__html: `
        .leaflet-popup-content-wrapper { border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); }
        .leaflet-popup-content { margin: 12px; }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      `}} />
    </div>
  );
}
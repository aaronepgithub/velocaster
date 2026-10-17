import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { RoutePoint, RouteSegment, UnitSystem } from '../types/cycling';
import { Eye, Wind, Thermometer, Compass, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface RouteMapProps {
  rawPoints: RoutePoint[];
  segments: RouteSegment[];
  currentPointIndex: number;
  onSelectPointIndex: (index: number) => void;
  unitSystem: UnitSystem;
  bounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
}

export const RouteMap: React.FC<RouteMapProps> = ({
  rawPoints,
  segments,
  currentPointIndex,
  onSelectPointIndex,
  unitSystem,
  bounds,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const polylinesLayerRef = useRef<L.LayerGroup | null>(null);
  const riderMarkerRef = useRef<L.Marker | null>(null);
  const [mapColorMode, setMapColorMode] = useState<'wind' | 'temp'>('wind');

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      });

      // Resolve Carto API key from environment or user-provided URL
      const rawEnv = (import.meta as any).env?.VITE_CARTO_KEY || 'cb1_4n6s_1_2a3839f43a46a26f3418c169';
      let cartoKey = 'cb1_4n6s_1_2a3839f43a46a26f3418c169';
      if (rawEnv.includes('key=')) {
        const match = rawEnv.match(/key=([^&]+)/);
        if (match && match[1]) cartoKey = match[1];
      } else if (rawEnv && !rawEnv.startsWith('http')) {
        cartoKey = rawEnv;
      }

      // Authenticated CartoDB Voyager tiles without watermark
      const tileUrl = `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${cartoKey}`;

      L.tileLayer(tileUrl, {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      // Clean, unobtrusive attribution without bulky Leaflet watermark prefix
      L.control
        .attribution({ position: 'bottomright', prefix: false })
        .addAttribution('© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>, <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>')
        .addTo(map);

      mapRef.current = map;
      polylinesLayerRef.current = L.layerGroup().addTo(map);
    }

    const map = mapRef.current;
    if (map && bounds) {
      map.fitBounds([
        [bounds.minLat, bounds.minLon],
        [bounds.maxLat, bounds.maxLon],
      ], { padding: [40, 40] });
    }

    return () => {
      // Cleanup on unmount handled if necessary
    };
  }, []);

  // Update segments on color mode or route change
  useEffect(() => {
    const map = mapRef.current;
    const layerGroup = polylinesLayerRef.current;
    if (!map || !layerGroup || segments.length === 0) return;

    layerGroup.clearLayers();

    // 1. Draw subtle shadow route beneath
    const allCoords: [number, number][] = rawPoints.map((p) => [p.lat, p.lon]);
    L.polyline(allCoords, {
      color: '#0f172a',
      weight: 8,
      opacity: 0.35,
    }).addTo(layerGroup);

    // 2. Draw color-coded segments
    segments.forEach((seg, idx) => {
      let color = '#10b981'; // default green (tailwind)

      if (mapColorMode === 'wind') {
        if (seg.weather.windType === 'headwind') {
          color = '#f43f5e'; // Rose / Red
        } else if (seg.weather.windType === 'crosswind') {
          color = '#f59e0b'; // Amber / Gold
        } else if (seg.weather.windType === 'tailwind') {
          color = '#10b981'; // Emerald Green
        } else {
          color = '#94a3b8'; // Slate
        }
      } else {
        // Temperature gradient
        const tF = unitSystem === 'imperial' ? seg.weather.feelsLike : (seg.weather.feelsLike * 9) / 5 + 32;
        if (tF < 45) color = '#38bdf8'; // Sky blue
        else if (tF < 55) color = '#2dd4bf'; // Teal
        else if (tF < 65) color = '#eab308'; // Yellow
        else if (tF < 75) color = '#f97316'; // Orange
        else color = '#ef4444'; // Red
      }

      const p1: [number, number] = [seg.startPoint.lat, seg.startPoint.lon];
      const p2: [number, number] = [seg.endPoint.lat, seg.endPoint.lon];

      const line = L.polyline([p1, p2], {
        color,
        weight: 5.5,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
      });

      // Hover / Click interaction on segment
      line.on('click', () => {
        onSelectPointIndex(seg.startIndex);
      });

      const distLabel = unitSystem === 'imperial'
        ? `${seg.startDistMi.toFixed(1)} mi`
        : `${seg.startDistKm.toFixed(1)} km`;
      const tempLabel = `${Math.round(seg.weather.temp)}°${unitSystem === 'imperial' ? 'F' : 'C'}`;
      const feelsLabel = `${Math.round(seg.weather.feelsLike)}°${unitSystem === 'imperial' ? 'F' : 'C'}`;
      const windTypeStr = seg.weather.windType.toUpperCase();
      const headwindVal = Math.abs(seg.weather.headwindComponent);

      line.bindTooltip(
        `<div class="p-1 font-sans text-xs">
          <div class="font-bold text-slate-900">${distLabel} · ${seg.weather.weatherDesc}</div>
          <div class="text-slate-600 mt-0.5">Temp: ${tempLabel} (Feels: <b>${feelsLabel}</b>)</div>
          <div class="font-medium mt-0.5 ${
            seg.weather.windType === 'headwind'
              ? 'text-rose-600'
              : seg.weather.windType === 'tailwind'
              ? 'text-emerald-600'
              : 'text-amber-600'
          }">
            ${windTypeStr} (${headwindVal} ${unitSystem === 'imperial' ? 'mph' : 'km/h'}) · Gusts ${seg.weather.windGust}
          </div>
        </div>`,
        { sticky: true, opacity: 0.95 }
      );

      line.addTo(layerGroup);
    });

    // 3. Start Marker (Green Pin)
    if (segments.length > 0) {
      const startPt = segments[0].startPoint;
      const startIcon = L.divIcon({
        className: 'custom-start-marker',
        html: `<div class="w-7 h-7 bg-emerald-600 text-white rounded-full border-2 border-white shadow-lg flex items-center justify-center font-bold text-xs ring-2 ring-emerald-400/40">S</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      L.marker([startPt.lat, startPt.lon], { icon: startIcon, title: 'Start of Ride' })
        .bindTooltip('<b>Start Location</b><br/>Departs at planned start time', { direction: 'top' })
        .addTo(layerGroup);

      // Finish Marker (Checkered / Navy Pin)
      const endPt = segments[segments.length - 1].endPoint;
      const finishIcon = L.divIcon({
        className: 'custom-finish-marker',
        html: `<div class="w-7 h-7 bg-slate-900 text-amber-400 rounded-full border-2 border-white shadow-lg flex items-center justify-center font-bold text-xs ring-2 ring-amber-400/40">F</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      L.marker([endPt.lat, endPt.lon], { icon: finishIcon, title: 'Finish Location' })
        .bindTooltip('<b>Finish Location</b><br/>Ride completion point', { direction: 'top' })
        .addTo(layerGroup);
    }
  }, [segments, mapColorMode, unitSystem, rawPoints, onSelectPointIndex]);

  // Update Rider Location Marker as user scrubs timeline
  useEffect(() => {
    const map = mapRef.current;
    if (!map || segments.length === 0) return;

    const safeIndex = Math.min(currentPointIndex, segments.length - 1);
    const targetSegment = segments[safeIndex];
    if (!targetSegment) return;

    const riderPt = targetSegment.startPoint;
    const latlng: [number, number] = [riderPt.lat, riderPt.lon];

    const windAngle = targetSegment.weather.windDirection;
    const isHeadwind = targetSegment.weather.windType === 'headwind';
    const isTailwind = targetSegment.weather.windType === 'tailwind';

    const ringColor = isHeadwind
      ? 'border-rose-500 bg-rose-500/20'
      : isTailwind
      ? 'border-emerald-500 bg-emerald-500/20'
      : 'border-amber-500 bg-amber-500/20';

    const htmlContent = `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-10 h-10 rounded-full ${ringColor} animate-ping opacity-60"></div>
        <div class="relative w-8 h-8 rounded-full bg-slate-950 border-2 border-white shadow-2xl flex items-center justify-center text-white">
          <svg class="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="18.5" cy="17.5" r="3.5"/>
            <circle cx="5.5" cy="17.5" r="3.5"/>
            <circle cx="15" cy="5" r="1"/>
            <path d="M12 17.5V14l-3-3 4-3 2 3h2"/>
          </svg>
        </div>
      </div>
    `;

    const riderIcon = L.divIcon({
      className: 'rider-scrubber-marker',
      html: htmlContent,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    if (!riderMarkerRef.current) {
      riderMarkerRef.current = L.marker(latlng, { icon: riderIcon, zIndexOffset: 1000 }).addTo(map);
    } else {
      riderMarkerRef.current.setLatLng(latlng);
      riderMarkerRef.current.setIcon(riderIcon);
    }
  }, [currentPointIndex, segments]);

  const handleFitBounds = () => {
    if (mapRef.current && bounds) {
      mapRef.current.fitBounds([
        [bounds.minLat, bounds.minLon],
        [bounds.maxLat, bounds.maxLon],
      ], { padding: [40, 40] });
    }
  };

  const handleZoom = (delta: number) => {
    if (mapRef.current) {
      if (delta > 0) mapRef.current.zoomIn();
      else mapRef.current.zoomOut();
    }
  };

  return (
    <div className="relative w-full h-[520px] rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-xl" id="map-section">
      {/* Map Element */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Map Controls & Color Mode Switcher */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-lg p-1 shadow-lg flex items-center gap-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMapColorMode('wind')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              mapColorMode === 'wind'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-600'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wind className="w-3.5 h-3.5 text-emerald-400" />
            <span>Wind Vectors</span>
          </button>
          <button
            type="button"
            onClick={() => setMapColorMode('temp')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              mapColorMode === 'temp'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-600'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5 text-amber-400" />
            <span>Temperature</span>
          </button>
        </div>
      </div>

      {/* Floating Zoom & Center Controls */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-lg p-1 shadow-lg">
        <button
          type="button"
          onClick={() => handleZoom(1)}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => handleZoom(-1)}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleFitBounds}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
          title="Fit Full Route"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-lg px-3 py-2 shadow-lg text-xs">
        {mapColorMode === 'wind' ? (
          <div className="flex items-center gap-4 text-slate-300">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Wind:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm"></span>
              <span className="font-medium text-emerald-400">Tailwind (Push)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 shadow-sm"></span>
              <span className="font-medium text-rose-400">Headwind (Drag)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm"></span>
              <span className="font-medium text-amber-400">Crosswind</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-slate-300">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Feels-Like:</span>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
              <span>&lt;45°</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400"></span>
              <span>45°-55°</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
              <span>55°-65°</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span>
              <span>65°-75°</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              <span>&gt;75°</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

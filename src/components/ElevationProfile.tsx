import React, { useMemo } from 'react';
import { RoutePoint, RouteSegment, UnitSystem } from '../types/cycling';
import { TrendingUp, Mountain, Activity } from 'lucide-react';

interface ElevationProfileProps {
  rawPoints: RoutePoint[];
  segments: RouteSegment[];
  currentPointIndex: number;
  onSelectPointIndex: (index: number) => void;
  unitSystem: UnitSystem;
}

export const ElevationProfile: React.FC<ElevationProfileProps> = ({
  rawPoints,
  segments,
  currentPointIndex,
  onSelectPointIndex,
  unitSystem,
}) => {
  if (rawPoints.length < 2 || segments.length === 0) return null;

  const totalDist = segments[segments.length - 1].endDistMi;
  const totalDistKm = segments[segments.length - 1].endDistKm;

  // Find min/max elevation across points
  const { minEleM, maxEleM } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    for (const p of rawPoints) {
      if (p.ele < min) min = p.ele;
      if (p.ele > max) max = p.ele;
    }
    return { minEleM: min, maxEleM: max };
  }, [rawPoints]);

  const eleRangeM = Math.max(20, maxEleM - minEleM);

  const eleUnit = unitSystem === 'imperial' ? 'ft' : 'm';
  const distUnit = unitSystem === 'imperial' ? 'mi' : 'km';
  const minEleDisplay = unitSystem === 'imperial' ? Math.round(minEleM * 3.28084) : Math.round(minEleM);
  const maxEleDisplay = unitSystem === 'imperial' ? Math.round(maxEleM * 3.28084) : Math.round(maxEleM);

  // SVG viewBox
  const width = 1000;
  const height = 180;
  const padBottom = 26;
  const padTop = 14;
  const plotHeight = height - padBottom - padTop;

  // Convert segment points to SVG polygon bars
  const totalDisplayDist = unitSystem === 'imperial' ? totalDist : totalDistKm;

  const segmentPolygons = useMemo(() => {
    return segments.map((seg, idx) => {
      const startDist = unitSystem === 'imperial' ? seg.startDistMi : seg.startDistKm;
      const endDist = unitSystem === 'imperial' ? seg.endDistMi : seg.endDistKm;

      const x1 = (startDist / totalDisplayDist) * width;
      const x2 = (endDist / totalDisplayDist) * width;

      const y1 = padTop + plotHeight * (1 - (seg.startPoint.ele - minEleM) / eleRangeM);
      const y2 = padTop + plotHeight * (1 - (seg.endPoint.ele - minEleM) / eleRangeM);
      const yBase = height - padBottom;

      const pathData = `M ${x1} ${yBase} L ${x1} ${y1} L ${x2} ${y2} L ${x2} ${yBase} Z`;

      let fill = '#10b981'; // Tailwind
      if (seg.weather.windType === 'headwind') fill = '#f43f5e';
      else if (seg.weather.windType === 'crosswind') fill = '#f59e0b';
      else if (seg.weather.windType === 'neutral') fill = '#64748b';

      return {
        pathData,
        fill,
        idx,
        seg,
      };
    });
  }, [segments, totalDisplayDist, minEleM, eleRangeM, plotHeight, height, padBottom, padTop, unitSystem]);

  // Current scrubber line X coordinate
  const activeSegment = segments[Math.min(currentPointIndex, segments.length - 1)];
  const currentDist = unitSystem === 'imperial' ? activeSegment?.startDistMi || 0 : activeSegment?.startDistKm || 0;
  const currentX = (currentDist / totalDisplayDist) * width;
  const currentEle = unitSystem === 'imperial'
    ? Math.round(activeSegment?.startPoint.ele * 3.28084 || 0)
    : Math.round(activeSegment?.startPoint.ele || 0);

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetIdx = Math.round(ratio * (segments.length - 1));
    onSelectPointIndex(targetIdx);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg text-slate-200 mt-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Mountain className="w-5 h-5 text-emerald-400" />
          <h3 className="font-bold text-white text-base tracking-tight">
            Route Elevation Profile & Wind Shading
          </h3>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span>Min: <strong className="text-slate-200 font-mono">{minEleDisplay} {eleUnit}</strong></span>
          <span aria-hidden="true">·</span>
          <span>Max: <strong className="text-slate-200 font-mono">{maxEleDisplay} {eleUnit}</strong></span>
          <span aria-hidden="true">·</span>
          <span className="text-emerald-400 font-medium">Click to scrub</span>
        </div>
      </div>

      <div className="relative mt-4">
        {/* SVG Graphic */}
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-44 bg-slate-950 rounded-lg border border-slate-800 cursor-crosshair select-none"
          onClick={handleSvgClick}
        >
          {/* Grid lines */}
          <line x1={0} y1={padTop} x2={width} y2={padTop} stroke="#1e293b" strokeDasharray="4 4" />
          <line x1={0} y1={padTop + plotHeight * 0.5} x2={width} y2={padTop + plotHeight * 0.5} stroke="#1e293b" strokeDasharray="4 4" />
          <line x1={0} y1={height - padBottom} x2={width} y2={height - padBottom} stroke="#334155" />

          {/* Color-shaded Wind Segments */}
          {segmentPolygons.map((sp) => (
            <path
              key={sp.idx}
              d={sp.pathData}
              fill={sp.fill}
              fillOpacity={0.8}
              stroke={sp.fill}
              strokeWidth={0.8}
              className="hover:opacity-100 transition-opacity"
            />
          ))}

          {/* Scrubber vertical line indicator */}
          <line
            x1={currentX}
            y1={padTop}
            x2={currentX}
            y2={height - padBottom}
            stroke="#ffffff"
            strokeWidth={2.5}
            strokeDasharray="2 2"
          />
          {/* Scrubber head marker */}
          <circle cx={currentX} cy={padTop + 4} r={4.5} fill="#10b981" stroke="#ffffff" strokeWidth={2} />

          {/* Distance Ticks along bottom */}
          <text x={8} y={height - 8} fill="#94a3b8" fontSize="10" fontFamily="sans-serif">
            0 {distUnit}
          </text>
          <text x={width * 0.25} y={height - 8} fill="#64748b" fontSize="10" fontFamily="sans-serif" textAnchor="middle">
            {(totalDisplayDist * 0.25).toFixed(1)}
          </text>
          <text x={width * 0.5} y={height - 8} fill="#64748b" fontSize="10" fontFamily="sans-serif" textAnchor="middle">
            {(totalDisplayDist * 0.5).toFixed(1)} {distUnit}
          </text>
          <text x={width * 0.75} y={height - 8} fill="#64748b" fontSize="10" fontFamily="sans-serif" textAnchor="middle">
            {(totalDisplayDist * 0.75).toFixed(1)}
          </text>
          <text x={width - 8} y={height - 8} fill="#94a3b8" fontSize="10" fontFamily="sans-serif" textAnchor="end">
            {totalDisplayDist.toFixed(1)} {distUnit}
          </text>
        </svg>

        {/* Cursor readout badge */}
        <div className="absolute top-2 left-3 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded border border-slate-700 text-[11px] font-mono text-slate-300 pointer-events-none">
          Mile <strong className="text-white">{currentDist.toFixed(1)}</strong> · Elev: <strong className="text-white">{currentEle} {eleUnit}</strong>
        </div>
      </div>
    </div>
  );
};

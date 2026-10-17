import React, { useState } from 'react';
import { RouteSegment, UnitSystem } from '../types/cycling';
import { Table, Wind, Thermometer, CloudRain, Clock, ChevronDown, ChevronUp } from 'lucide-react';

interface WeatherTableProps {
  segments: RouteSegment[];
  currentPointIndex: number;
  onSelectPointIndex: (index: number) => void;
  unitSystem: UnitSystem;
}

export const WeatherTable: React.FC<WeatherTableProps> = ({
  segments,
  currentPointIndex,
  onSelectPointIndex,
  unitSystem,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (segments.length === 0) return null;

  const distUnit = unitSystem === 'imperial' ? 'mi' : 'km';
  const speedUnit = unitSystem === 'imperial' ? 'mph' : 'km/h';
  const tempUnit = unitSystem === 'imperial' ? '°F' : '°C';

  // Only display ~15-20 rows by default or all if expanded
  const step = Math.max(1, Math.floor(segments.length / 15));
  const displayedSegments = isExpanded
    ? segments
    : segments.filter((_, idx) => idx % step === 0 || idx === segments.length - 1);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg text-slate-200 mt-6" id="forecast-table">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Table className="w-5 h-5 text-emerald-400" />
          <h3 className="font-bold text-white text-base tracking-tight">
            Detailed Route Weather & Wind Waypoints
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
        >
          <span>{isExpanded ? 'Show Summary Waypoints' : `View All ${segments.length} Waypoints`}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      <div className="overflow-x-auto mt-3">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
              <th className="py-2.5 px-3">Time & Mile</th>
              <th className="py-2.5 px-3">Bike Heading</th>
              <th className="py-2.5 px-3">Air Temp</th>
              <th className="py-2.5 px-3">Feels Like</th>
              <th className="py-2.5 px-3">Wind & Gusts</th>
              <th className="py-2.5 px-3">Wind Impact</th>
              <th className="py-2.5 px-3 text-right">Rain %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {displayedSegments.map((seg) => {
              const isSelected = seg.startIndex === currentPointIndex;
              const w = seg.weather;
              const timeStr = seg.startPoint.estimatedTime
                ? new Date(seg.startPoint.estimatedTime).toLocaleTimeString([], {
                    hour: 'numeric',
                    minute: '2-digit',
                  })
                : `+${Math.round(seg.startPoint.elapsedMinutes || 0)}m`;

              const distVal = unitSystem === 'imperial' ? seg.startDistMi.toFixed(1) : seg.startDistKm.toFixed(1);

              return (
                <tr
                  key={seg.startIndex}
                  onClick={() => onSelectPointIndex(seg.startIndex)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-emerald-950/40 text-emerald-200'
                      : 'hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <td className="py-2.5 px-3 whitespace-nowrap font-medium text-white">
                    <span>{timeStr}</span>
                    <span className="text-slate-500 font-normal ml-2 font-sans">
                      {distVal} {distUnit}
                    </span>
                  </td>

                  <td className="py-2.5 px-3 whitespace-nowrap text-slate-300 font-sans">
                    {seg.bearingName} ({Math.round(seg.bearing)}°)
                  </td>

                  <td className="py-2.5 px-3 whitespace-nowrap tabular-nums text-slate-200">
                    {Math.round(w.temp)}{tempUnit}
                  </td>

                  <td className="py-2.5 px-3 whitespace-nowrap tabular-nums font-bold text-white">
                    {Math.round(w.feelsLike)}{tempUnit}
                  </td>

                  <td className="py-2.5 px-3 whitespace-nowrap text-slate-300">
                    <span className="tabular-nums font-semibold">{w.windSpeed}</span> {speedUnit}
                    <span className="text-slate-500 text-[10px] ml-1">
                      (gust {w.windGust})
                    </span>
                  </td>

                  <td className="py-2.5 px-3 whitespace-nowrap font-sans font-medium">
                    {w.windType === 'headwind' && (
                      <span className="text-rose-400">
                        Headwind (+{Math.abs(w.headwindComponent)} {speedUnit})
                      </span>
                    )}
                    {w.windType === 'tailwind' && (
                      <span className="text-emerald-400">
                        Tailwind (-{Math.abs(w.headwindComponent)} {speedUnit})
                      </span>
                    )}
                    {w.windType === 'crosswind' && (
                      <span className="text-amber-400">
                        Crosswind ({w.crosswindComponent} {speedUnit})
                      </span>
                    )}
                    {w.windType === 'neutral' && (
                      <span className="text-slate-400">Light / Calm</span>
                    )}
                  </td>

                  <td className="py-2.5 px-3 whitespace-nowrap text-right tabular-nums">
                    <span className={w.precipProb > 30 ? 'text-sky-400 font-bold' : 'text-slate-400'}>
                      {w.precipProb}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

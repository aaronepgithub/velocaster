import React, { useEffect, useState } from 'react';
import { RouteSegment, UnitSystem } from '../types/cycling';
import { Play, Pause, SkipBack, SkipForward, Clock, MapPin, Thermometer, Wind, CloudRain, Shield } from 'lucide-react';

interface RideTimelineScrubberProps {
  segments: RouteSegment[];
  currentPointIndex: number;
  onSelectPointIndex: React.Dispatch<React.SetStateAction<number>>;
  unitSystem: UnitSystem;
  startTime: Date;
}

export const RideTimelineScrubber: React.FC<RideTimelineScrubberProps> = ({
  segments,
  currentPointIndex,
  onSelectPointIndex,
  unitSystem,
  startTime,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  // Playback timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        onSelectPointIndex((prev) => {
          if (prev >= segments.length - 1) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 700);
    }
    return () => clearInterval(timer);
  }, [isPlaying, segments.length, onSelectPointIndex]);

  if (segments.length === 0) return null;

  const safeIndex = Math.min(currentPointIndex, segments.length - 1);
  const activeSegment = segments[safeIndex];
  const w = activeSegment.weather;

  const distVal = unitSystem === 'imperial'
    ? activeSegment.startDistMi.toFixed(1)
    : activeSegment.startDistKm.toFixed(1);
  const distUnit = unitSystem === 'imperial' ? 'mi' : 'km';

  const eleVal = unitSystem === 'imperial'
    ? Math.round(activeSegment.startPoint.ele * 3.28084)
    : Math.round(activeSegment.startPoint.ele);
  const eleUnit = unitSystem === 'imperial' ? 'ft' : 'm';

  const tempVal = Math.round(w.temp);
  const feelsVal = Math.round(w.feelsLike);
  const tempUnit = unitSystem === 'imperial' ? '°F' : '°C';
  const speedUnit = unitSystem === 'imperial' ? 'mph' : 'km/h';

  // Format clock time
  const clockTime = activeSegment.startPoint.estimatedTime
    ? new Date(activeSegment.startPoint.estimatedTime).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      })
    : `${startTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;

  const elapsedMins = activeSegment.startPoint.elapsedMinutes || 0;
  const elapsedHrs = Math.floor(elapsedMins / 60);
  const elapsedRemainingMins = elapsedMins % 60;
  const elapsedLabel = elapsedHrs > 0
    ? `+${elapsedHrs}h ${elapsedRemainingMins}m`
    : `+${elapsedRemainingMins}m`;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg text-slate-200" id="timeline-section">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-emerald-400" />
          <h3 className="font-bold text-white text-base tracking-tight">Interactive Ride Timeline</h3>
        </div>

        {/* Play / Step Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSelectPointIndex(0)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title="Reset to Start"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors shadow-sm ${
              isPlaying
                ? 'bg-amber-600 text-white hover:bg-amber-500'
                : 'bg-emerald-600 text-white hover:bg-emerald-500'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause Ride</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Simulate Ride</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => onSelectPointIndex(Math.min(segments.length - 1, currentPointIndex + 1))}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title="Step Forward"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Slider */}
      <div className="mt-4">
        <input
          type="range"
          min={0}
          max={segments.length - 1}
          value={safeIndex}
          onChange={(e) => onSelectPointIndex(parseInt(e.target.value, 10))}
          className="w-full accent-emerald-500 h-2.5 bg-slate-800 rounded-lg cursor-pointer"
        />

        {/* Milestone Tick Labels */}
        <div className="flex justify-between text-[11px] text-slate-400 mt-1.5 font-mono">
          <span>0 {distUnit} (Start)</span>
          <span>
            {unitSystem === 'imperial'
              ? `${(segments[segments.length - 1].endDistMi / 2).toFixed(1)} mi (Midway)`
              : `${(segments[segments.length - 1].endDistKm / 2).toFixed(1)} km (Midway)`}
          </span>
          <span>
            {unitSystem === 'imperial'
              ? `${segments[segments.length - 1].endDistMi.toFixed(1)} mi (Finish)`
              : `${segments[segments.length - 1].endDistKm.toFixed(1)} km (Finish)`}
          </span>
        </div>
      </div>

      {/* Instant Snapshot Card for Selected Scrubber Point */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-4">
        {/* Time */}
        <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            Ride Clock
          </div>
          <div className="text-base font-bold text-white mt-1 tabular-nums">
            {clockTime}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">{elapsedLabel} into ride</div>
        </div>

        {/* Mile / Location */}
        <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-slate-400" />
            Distance & Elev
          </div>
          <div className="text-base font-bold text-white mt-1 tabular-nums">
            {distVal} {distUnit}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {eleVal} {eleUnit} ({activeSegment.avgGradePct > 0 ? `+${activeSegment.avgGradePct}%` : `${activeSegment.avgGradePct}%`})
          </div>
        </div>

        {/* Temperature & Feels Like */}
        <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Thermometer className="w-3 h-3 text-emerald-400" />
            Feels Like Temp
          </div>
          <div className="text-base font-black text-emerald-400 mt-1 tabular-nums">
            {feelsVal}{tempUnit}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Air temp: {tempVal}{tempUnit}
          </div>
        </div>

        {/* Wind Impact */}
        <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Wind className="w-3 h-3 text-slate-400" />
            Wind Type
          </div>
          <div
            className={`text-sm font-bold mt-1 capitalize ${
              w.windType === 'headwind'
                ? 'text-rose-400'
                : w.windType === 'tailwind'
                ? 'text-emerald-400'
                : 'text-amber-400'
            }`}
          >
            {w.windType}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {Math.abs(w.headwindComponent)} {speedUnit} {w.headwindComponent > 0 ? 'pushback' : 'assist'}
          </div>
        </div>

        {/* Conditions & Rain */}
        <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <CloudRain className="w-3 h-3 text-sky-400" />
            Rain Chance
          </div>
          <div className="text-base font-bold text-white mt-1 tabular-nums">
            {w.precipProb}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 truncate">{w.weatherDesc}</div>
        </div>

        {/* Heading & Gusts */}
        <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Shield className="w-3 h-3 text-slate-400" />
            Heading & Gust
          </div>
          <div className="text-base font-bold text-white mt-1">
            {activeSegment.bearingName} ({Math.round(activeSegment.bearing)}°)
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Gusts to {w.windGust} {speedUnit}</div>
        </div>
      </div>
    </div>
  );
};

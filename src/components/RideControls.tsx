import React from 'react';
import { UnitSystem } from '../types/cycling';
import { Clock, Gauge, Calendar, Route, ArrowRight, Zap } from 'lucide-react';

interface RideControlsProps {
  routeName: string;
  totalDistanceMi: number;
  totalDistanceKm: number;
  elevationGainFt: number;
  elevationGainM: number;
  startDate: string;
  setStartDate: (date: string) => void;
  startTime: string;
  setStartTime: (time: string) => void;
  speed: number;
  setSpeed: (speed: number) => void;
  unitSystem: UnitSystem;
  estimatedFinishTimeStr: string;
  estimatedDurationStr: string;
  onRefresh: () => void;
  isLoading: boolean;
}

export const RideControls: React.FC<RideControlsProps> = ({
  routeName,
  totalDistanceMi,
  totalDistanceKm,
  elevationGainFt,
  elevationGainM,
  startDate,
  setStartDate,
  startTime,
  setStartTime,
  speed,
  setSpeed,
  unitSystem,
  estimatedFinishTimeStr,
  estimatedDurationStr,
  onRefresh,
  isLoading,
}) => {
  const speedPresets = unitSystem === 'imperial'
    ? [
        { label: 'Casual', value: 13 },
        { label: 'Endurance', value: 16 },
        { label: 'Brisk', value: 18.5 },
        { label: 'Fast / Race', value: 21 },
      ]
    : [
        { label: 'Casual', value: 21 },
        { label: 'Endurance', value: 25.5 },
        { label: 'Brisk', value: 30 },
        { label: 'Fast / Race', value: 34 },
      ];

  const handleTimeAdjust = (deltaMinutes: number) => {
    const [h, m] = startTime.split(':').map(Number);
    let totalM = h * 60 + m + deltaMinutes;
    if (totalM < 0) totalM += 24 * 60;
    totalM = totalM % (24 * 60);

    const newH = Math.floor(totalM / 60).toString().padStart(2, '0');
    const newM = (totalM % 60).toString().padStart(2, '0');
    setStartTime(`${newH}:${newM}`);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg text-slate-200">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Route className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">{routeName}</h2>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
            <span>
              Distance:{' '}
              <strong className="text-slate-200 tabular-nums">
                {unitSystem === 'imperial'
                  ? `${totalDistanceMi.toFixed(1)} miles`
                  : `${totalDistanceKm.toFixed(1)} km`}
              </strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Climbing:{' '}
              <strong className="text-slate-200 tabular-nums">
                {unitSystem === 'imperial'
                  ? `+${elevationGainFt.toLocaleString()} ft`
                  : `+${elevationGainM.toLocaleString()} m`}
              </strong>
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400/90 font-medium">Ready for departure</span>
          </div>
        </div>

        {/* Expected Ride Duration & Finish Time Banner */}
        <div className="flex items-center gap-3 bg-slate-800/80 px-3.5 py-2 rounded-lg border border-slate-700/60 text-xs">
          <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="flex items-center gap-2">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-semibold">Start</span>
              <span className="font-semibold text-white">{startTime}</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            <div>
              <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-semibold">Est. Finish</span>
              <span className="font-semibold text-white">{estimatedFinishTimeStr}</span>
            </div>
          </div>
          <div className="pl-2 border-l border-slate-700 text-slate-300">
            <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-semibold">Total Ride</span>
            <span className="font-semibold text-emerald-300">{estimatedDurationStr}</span>
          </div>
        </div>
      </div>

      {/* Inputs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
        {/* 1. Start Date */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Ride Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* 2. Start Time */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Start Time
            </span>
            <div className="flex items-center gap-1 text-[11px]">
              <button
                type="button"
                onClick={() => handleTimeAdjust(-15)}
                className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                title="Subtract 15 minutes"
              >
                -15m
              </button>
              <button
                type="button"
                onClick={() => handleTimeAdjust(15)}
                className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                title="Add 15 minutes"
              >
                +15m
              </button>
              <button
                type="button"
                onClick={() => setStartTime('08:30')}
                className={`px-1.5 py-0.5 rounded border transition-colors ${
                  startTime === '08:30'
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                }`}
                title="Set to 8:30 AM"
              >
                8:30 AM
              </button>
            </div>
          </label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* 3. Estimated Speed */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-slate-400" />
              Estimated Avg Speed
            </label>
            <span className="text-xs font-bold text-emerald-400 tabular-nums">
              {speed} {unitSystem === 'imperial' ? 'mph' : 'km/h'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="range"
              min={unitSystem === 'imperial' ? 8 : 12}
              max={unitSystem === 'imperial' ? 26 : 42}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-full accent-emerald-500 h-2 bg-slate-700 rounded-lg cursor-pointer"
            />
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-1.5 mt-2">
            {speedPresets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setSpeed(preset.value)}
                className={`flex-1 py-1 px-1 text-[11px] font-medium rounded border transition-colors text-center truncate ${
                  Math.abs(speed - preset.value) < 0.3
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200 hover:bg-slate-700'
                }`}
              >
                {preset.label} ({preset.value})
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

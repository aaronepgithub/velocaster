import React from 'react';
import { RouteSegment, UnitSystem, WindAnalysis } from '../types/cycling';
import { Wind, Navigation, ShieldAlert, Sparkles, TrendingUp, Compass } from 'lucide-react';
import { getCompassDirection } from '../utils/geo';

interface WindCompassProps {
  currentSegment: RouteSegment;
  windAnalysis: WindAnalysis;
  unitSystem: UnitSystem;
  riderSpeed: number;
}

export const WindCompass: React.FC<WindCompassProps> = ({
  currentSegment,
  windAnalysis,
  unitSystem,
  riderSpeed,
}) => {
  const weather = currentSegment.weather;
  const speedUnit = unitSystem === 'imperial' ? 'mph' : 'km/h';
  const distUnit = unitSystem === 'imperial' ? 'mi' : 'km';

  // Rider Heading
  const riderBearing = currentSegment.bearing;
  const riderDirName = getCompassDirection(riderBearing);

  // Wind direction (from where wind blows)
  const windDir = weather.windDirection;
  const windDirName = getCompassDirection(windDir);

  // Relative angle: 0 = headwind, 180 = tailwind
  const relAngle = weather.relativeWindAngle;

  // In standard compass, North is top (0°).
  // The arrow represents wind flow towards rider
  // Wind blows towards (windDir + 180)
  const windFlowAngle = (windDir + 180) % 360;

  // Crosswind direction side (Left or Right of rider)
  const angleDiff = ((windDir - riderBearing + 540) % 360) - 180;
  const crosswindSide = angleDiff > 0 ? 'Right' : 'Left';

  const isHeadwind = weather.windType === 'headwind';
  const isTailwind = weather.windType === 'tailwind';
  const isCrosswind = weather.windType === 'crosswind';

  // Effective felt airspeed
  const apparentAirspeed = Math.max(0, riderSpeed + weather.headwindComponent);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg text-slate-200">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Wind className="w-5 h-5 text-emerald-400" />
          <h3 className="font-bold text-white text-base tracking-tight">Wind & Aerodynamics Cockpit</h3>
        </div>
        <div className="text-xs text-slate-400">
          <span>Current Location Vector</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-4 items-center">
        {/* Visual Dial (4 cols) */}
        <div className="md:col-span-5 flex flex-col items-center justify-center">
          <div className="relative w-44 h-44 rounded-full bg-slate-950 border border-slate-700/80 p-2 shadow-inner flex items-center justify-center">
            {/* Compass degree ticks */}
            <div className="absolute inset-2 rounded-full border border-slate-800/80 flex items-center justify-center">
              <span className="absolute top-1 text-[10px] font-bold text-slate-400">N</span>
              <span className="absolute bottom-1 text-[10px] font-bold text-slate-400">S</span>
              <span className="absolute left-1.5 text-[10px] font-bold text-slate-400">W</span>
              <span className="absolute right-1.5 text-[10px] font-bold text-slate-400">E</span>
            </div>

            {/* Rider Heading Direction Line & Marker */}
            <div
              className="absolute w-full h-full pointer-events-none transition-transform duration-300"
              style={{ transform: `rotate(${riderBearing}deg)` }}
            >
              <div className="mx-auto w-1 h-20 bg-gradient-to-t from-transparent via-emerald-400 to-emerald-400 rounded-full mt-2" />
              <div className="mx-auto -mt-2 w-3.5 h-3.5 bg-emerald-400 rotate-45 border-2 border-slate-950 shadow-md" />
            </div>

            {/* Wind Vector Arrow (pointing where wind blows) */}
            <div
              className="absolute w-full h-full pointer-events-none transition-transform duration-300"
              style={{ transform: `rotate(${windFlowAngle}deg)` }}
            >
              <div
                className={`mx-auto w-1.5 h-20 rounded-full mt-2 ${
                  isHeadwind ? 'bg-rose-500' : isTailwind ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <div
                className={`mx-auto -mt-2.5 w-0 h-0 border-x-[7px] border-x-transparent border-b-[14px] ${
                  isHeadwind
                    ? 'border-b-rose-500'
                    : isTailwind
                    ? 'border-b-emerald-400'
                    : 'border-b-amber-400'
                }`}
              />
            </div>

            {/* Central Bike Icon Hub */}
            <div className="relative z-10 w-12 h-12 rounded-full bg-slate-900 border-2 border-slate-700 flex flex-col items-center justify-center text-white shadow-xl">
              <Navigation className="w-5 h-5 text-emerald-400" />
            </div>
          </div>

          <div className="mt-3 text-center">
            <span className="text-xs text-slate-400 font-medium">
              Rider heading: <strong className="text-white">{Math.round(riderBearing)}° ({riderDirName})</strong>
            </span>
            <span className="mx-1.5 text-slate-600">·</span>
            <span className="text-xs text-slate-400 font-medium">
              Wind from: <strong className="text-white">{Math.round(windDir)}° ({windDirName})</strong>
            </span>
          </div>
        </div>

        {/* Dynamic Wind Diagnosis (7 cols) */}
        <div className="md:col-span-7 flex flex-col gap-3.5">
          {/* Main Status Pill */}
          <div
            className={`p-3.5 rounded-lg border flex items-center justify-between ${
              isHeadwind
                ? 'bg-rose-950/40 border-rose-800/60 text-rose-200'
                : isTailwind
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                : 'bg-amber-950/40 border-amber-800/60 text-amber-200'
            }`}
          >
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider opacity-80">
                {isHeadwind ? 'Headwind Alert' : isTailwind ? 'Tailwind Assist' : 'Crosswind Warning'}
              </div>
              <div className="text-base font-bold mt-0.5 text-white">
                {isHeadwind && `Facing sustained ${Math.abs(weather.headwindComponent)} ${speedUnit} headwind`}
                {isTailwind && `Enjoying ${Math.abs(weather.headwindComponent)} ${speedUnit} tailwind push`}
                {isCrosswind && `${weather.crosswindComponent} ${speedUnit} crosswind from your ${crosswindSide}`}
              </div>
              <div className="text-xs opacity-90 mt-0.5">
                Wind speed {weather.windSpeed} {speedUnit} with gusts up to {weather.windGust} {speedUnit}
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-2xl font-black tabular-nums tracking-tight text-white">
                {weather.headwindComponent > 0 ? `+${weather.headwindComponent}` : weather.headwindComponent}
              </div>
              <div className="text-[10px] font-medium opacity-80">
                {weather.headwindComponent > 0 ? 'Wind Drag' : 'Wind Assist'}
              </div>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Apparent Wind Resistance</span>
              <span className="text-sm font-bold text-white tabular-nums">
                {Math.round(apparentAirspeed * 10) / 10} {speedUnit}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Rider speed + headwind vector
              </span>
            </div>

            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Lateral Crosswind Force</span>
              <span className="text-sm font-bold text-amber-400 tabular-nums">
                {weather.crosswindComponent} {speedUnit} ({crosswindSide})
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Lean slightly into wind on descents
              </span>
            </div>
          </div>

          {/* Full Route Breakdown Bar */}
          <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800/80">
            <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
              <span className="text-slate-400">Total Route Wind Exposure:</span>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="text-emerald-400 font-semibold">{windAnalysis.tailwindPct}% Tailwind</span>
                <span className="text-rose-400 font-semibold">{windAnalysis.headwindPct}% Headwind</span>
                <span className="text-amber-400 font-semibold">{windAnalysis.crosswindPct}% Cross</span>
              </div>
            </div>

            {/* Segmented bar */}
            <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-800">
              <div
                className="bg-emerald-500 h-full transition-all"
                style={{ width: `${windAnalysis.tailwindPct}%` }}
                title={`Tailwind: ${windAnalysis.tailwindPct}% (${unitSystem === 'imperial' ? windAnalysis.tailwindDistanceMi : windAnalysis.tailwindDistanceKm} ${distUnit})`}
              />
              <div
                className="bg-rose-500 h-full transition-all"
                style={{ width: `${windAnalysis.headwindPct}%` }}
                title={`Headwind: ${windAnalysis.headwindPct}% (${unitSystem === 'imperial' ? windAnalysis.headwindDistanceMi : windAnalysis.headwindDistanceKm} ${distUnit})`}
              />
              <div
                className="bg-amber-500 h-full transition-all"
                style={{ width: `${windAnalysis.crosswindPct}%` }}
                title={`Crosswind: ${windAnalysis.crosswindPct}% (${unitSystem === 'imperial' ? windAnalysis.crosswindDistanceMi : windAnalysis.crosswindDistanceKm} ${distUnit})`}
              />
              <div
                className="bg-slate-600 h-full transition-all"
                style={{ width: `${windAnalysis.neutralPct}%` }}
                title={`Neutral: ${windAnalysis.neutralPct}%`}
              />
            </div>

            {/* Best & Worst highlights */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 mt-2 gap-1.5 pt-2 border-t border-slate-800/60">
              {windAnalysis.worstHeadwindSegment && (
                <div className="flex items-center gap-1 text-rose-400">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Toughest Headwind: Mile {windAnalysis.worstHeadwindSegment.startMile}–{windAnalysis.worstHeadwindSegment.endMile} ({windAnalysis.worstHeadwindSegment.headwindSpeed} {speedUnit})
                  </span>
                </div>
              )}
              {windAnalysis.bestTailwindSegment && (
                <div className="flex items-center gap-1 text-emerald-400">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Fast Tailwind: Mile {windAnalysis.bestTailwindSegment.startMile}–{windAnalysis.bestTailwindSegment.endMile} ({windAnalysis.bestTailwindSegment.tailwindSpeed} {speedUnit})
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

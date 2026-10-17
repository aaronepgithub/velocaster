import React from 'react';
import { LayeringRecommendation, UnitSystem } from '../types/cycling';
import {
  Layers,
  Shirt,
  Shield,
  CloudRain,
  Footprints,
  Hand,
  Clock,
  ArrowRight,
  CheckCircle2,
  Package,
  AlertTriangle,
} from 'lucide-react';

interface LayeringGuideProps {
  layering: LayeringRecommendation;
  unitSystem: UnitSystem;
}

export const LayeringGuide: React.FC<LayeringGuideProps> = ({ layering, unitSystem }) => {
  const { startApparel, pocketItems, transitions, summaryNote, comfortRating } = layering;

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Shirt':
        return <Shirt className="w-4 h-4 text-emerald-400" />;
      case 'Shield':
        return <Shield className="w-4 h-4 text-sky-400" />;
      case 'Hand':
        return <Hand className="w-4 h-4 text-amber-400" />;
      case 'Footprints':
        return <Footprints className="w-4 h-4 text-violet-400" />;
      case 'CloudRain':
        return <CloudRain className="w-4 h-4 text-blue-400" />;
      case 'Layers':
        return <Layers className="w-4 h-4 text-teal-400" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    }
  };

  const distUnit = unitSystem === 'imperial' ? 'mi' : 'km';
  const tempUnit = unitSystem === 'imperial' ? '°F' : '°C';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg text-slate-200 mt-6" id="layering-section">
      {/* Header & Comfort Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-lg tracking-tight">
              Dynamic Layering & Apparel Strategy
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            {summaryNote}
          </p>
        </div>

        <div className="shrink-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-semibold text-xs">
            <span>Condition Rating:</span>
            <strong className="text-white">{comfortRating}</strong>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-5">
        {/* Left Column: Wear at Start Checklist (6 cols) */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Wear at Departure (8:30 AM Start)
            </h4>
            <span className="text-[11px] text-slate-500">Put on before rolling out</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {startApparel.map((item) => (
              <div
                key={item.id}
                className="bg-slate-950/70 border border-slate-800/90 rounded-lg p-3 hover:border-slate-700 transition-colors flex items-start gap-3"
              >
                <div className="p-2 bg-slate-900 rounded-md shrink-0 border border-slate-800">
                  {renderIcon(item.iconName)}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-xs text-white leading-tight">
                    {item.name}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                    {item.advice}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pocket Packing Essentials */}
          <div className="mt-2 bg-slate-950/50 border border-slate-800/80 rounded-lg p-3.5">
            <h5 className="text-xs font-bold text-slate-300 flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-amber-400" />
              Pack in Jersey Pockets
            </h5>
            <div className="space-y-2">
              {pocketItems.map((pItem) => (
                <div key={pItem.id} className="flex items-start gap-2 text-xs">
                  <span className="text-amber-400 mt-0.5">•</span>
                  <div>
                    <strong className="text-slate-200">{pItem.name}:</strong>{' '}
                    <span className="text-slate-400">{pItem.advice}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: In-Ride Transition Schedule (6 cols) */}
        <div className="lg:col-span-6 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              In-Ride Layer Adjustments & Timeline
            </h4>
            <span className="text-[11px] text-slate-500">When to shed or add gear</span>
          </div>

          {transitions.length > 0 ? (
            <div className="space-y-3">
              {transitions.map((trans, idx) => (
                <div
                  key={trans.id}
                  className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-800 text-[10px] font-bold text-emerald-400 font-mono">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-white">
                        {trans.action === 'remove' && 'Shed / Unzip'}
                        {trans.action === 'adjust' && 'Adjust'}
                        {trans.action === 'add' && 'Don Layer'}: {trans.item}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="text-emerald-400 font-semibold">{trans.atTime}</span>
                      <span className="text-slate-500">·</span>
                      <span className="text-slate-300 font-medium">
                        Mile {unitSystem === 'imperial' ? trans.atDistanceMi : trans.atDistanceKm}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 mt-2 pl-7 leading-relaxed">
                    {trans.reason}
                  </p>

                  <div className="mt-2.5 pl-7 flex items-center gap-3 text-[11px] text-slate-500">
                    <span>Expected feels-like: <strong className="text-slate-300">{trans.currentFeelsLike}{tempUnit}</strong></span>
                    <span>·</span>
                    <span>Wind speed: <strong className="text-slate-300">{trans.currentWindSpeed} {unitSystem === 'imperial' ? 'mph' : 'km/h'}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-6 text-center text-xs text-slate-400">
              <CheckCircle2 className="w-8 h-8 text-emerald-500/80 mx-auto mb-2" />
              <div className="font-semibold text-slate-200">Stable Temperature Across Ride</div>
              <p className="mt-1 max-w-sm mx-auto">
                No major thermal swings detected along the route. The apparel worn at departure will remain comfortable for the duration of the ride.
              </p>
            </div>
          )}

          {/* Pro Cyclist Tip Card */}
          <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-lg p-3 text-xs text-emerald-300 flex items-start gap-2.5 mt-auto">
            <span className="text-emerald-400 text-base leading-none">💡</span>
            <div>
              <strong className="text-emerald-200">Pro Pacing & Layering Rule:</strong> If you step outside at 8:30 AM and feel comfortably warm before pedaling, you are overdressed! Dress to feel slightly brisk for the first 10 minutes; your body will generate 300+ watts of warmth once your heart rate reaches Zone 2.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

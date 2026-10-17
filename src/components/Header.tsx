import React from 'react';
import { UnitSystem } from '../types/cycling';
import { Compass, Upload, RefreshCw } from 'lucide-react';

interface HeaderProps {
  unitSystem: UnitSystem;
  onToggleUnit: (unit: UnitSystem) => void;
  onOpenUpload: () => void;
  onResetDefault: () => void;
  routeName: string;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  unitSystem,
  onToggleUnit,
  onOpenUpload,
  onResetDefault,
  routeName,
  isLoading,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-0 sm:h-16 flex flex-wrap items-center justify-between gap-y-2.5 gap-x-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Compass className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base sm:text-lg tracking-tight text-white leading-none">
              VeloCast
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium tracking-normal mt-0.5">
              Route Weather & Wind Intelligence
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation & Section Anchors */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-300">
          <a href="#map-section" className="hover:text-white transition-colors whitespace-nowrap">
            Route & Wind Map
          </a>
          <a href="#layering-section" className="hover:text-white transition-colors whitespace-nowrap">
            Layering Guide
          </a>
          <a href="#timeline-section" className="hover:text-white transition-colors whitespace-nowrap">
            Timeline & Elevation
          </a>
          <a href="#forecast-table" className="hover:text-white transition-colors whitespace-nowrap">
            Hourly Details
          </a>
        </nav>

        {/* Zone 3: Interactive Actions & Unit Selector */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto sm:ml-0 flex-wrap sm:flex-nowrap">
          {/* Unit Toggle */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-[11px] sm:text-xs font-semibold">
            <button
              type="button"
              onClick={() => onToggleUnit('imperial')}
              className={`px-2 py-1 sm:px-2.5 sm:py-1 rounded-md transition-colors ${
                unitSystem === 'imperial'
                  ? 'bg-slate-700 text-emerald-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Imperial Units (°F, mph, mi)"
            >
              °F · mph
            </button>
            <button
              type="button"
              onClick={() => onToggleUnit('metric')}
              className={`px-2 py-1 sm:px-2.5 sm:py-1 rounded-md transition-colors ${
                unitSystem === 'metric'
                  ? 'bg-slate-700 text-emerald-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Metric Units (°C, km/h, km)"
            >
              °C · km/h
            </button>
          </div>

          {/* Upload GPX Button */}
          <button
            type="button"
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-medium text-slate-200 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 hover:text-white transition-colors whitespace-nowrap"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Upload GPX</span>
            <span className="sm:hidden">GPX</span>
          </button>

          {/* Reset / Default route button if modified */}
          <button
            type="button"
            onClick={onResetDefault}
            className="p-1 sm:p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg border border-transparent hover:border-slate-700 transition-colors"
            title="Reset to test route (Paroby Rte)"
            disabled={isLoading}
          >
            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};

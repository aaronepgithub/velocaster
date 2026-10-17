import React, { useState, useEffect, useCallback } from 'react';
import { UnitSystem } from './types/cycling';
import { DEFAULT_GPX_DATA, DEFAULT_GPX_NAME } from './data/defaultRoute';
import { ProcessedRideData, processRideRoute } from './utils/routeOrchestrator';
import { Header } from './components/Header';
import { RideControls } from './components/RideControls';
import { RouteMap } from './components/RouteMap';
import { WindCompass } from './components/WindCompass';
import { RideTimelineScrubber } from './components/RideTimelineScrubber';
import { ElevationProfile } from './components/ElevationProfile';
import { LayeringGuide } from './components/LayeringGuide';
import { WeatherTable } from './components/WeatherTable';
import { GpxUploadModal } from './components/GpxUploadModal';
import { AiCoachCard } from './components/AiCoachCard';
import {
  Wind,
  Thermometer,
  Layers,
  ArrowRight,
  TrendingUp,
  Clock,
  Compass,
  AlertCircle,
  Sparkles,
  Sun,
  Shield,
} from 'lucide-react';

export default function App() {
  // Today's date string YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  const [gpxXml, setGpxXml] = useState<string>(DEFAULT_GPX_DATA);
  const [routeName, setRouteName] = useState<string>(DEFAULT_GPX_NAME);
  const [startDate, setStartDate] = useState<string>(todayStr);
  const [startTime, setStartTime] = useState<string>('08:30'); // User specified 8:30 AM!
  const [speed, setSpeed] = useState<number>(17.5); // Default 17.5 mph
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('imperial');

  const [currentPointIndex, setCurrentPointIndex] = useState<number>(0);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ProcessedRideData | null>(null);

  // Compute and process ride route
  const handleProcessRoute = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const processed = await processRideRoute(
        gpxXml,
        startDate,
        startTime,
        speed,
        unitSystem
      );
      setData(processed);
      // Reset point index if out of bounds
      setCurrentPointIndex((prev) => Math.min(prev, processed.segments.length - 1));
    } catch (err: any) {
      console.error('Failed to process ride route:', err);
      setError(err?.message || 'Error processing GPX route or fetching weather forecast.');
    } finally {
      setIsLoading(false);
    }
  }, [gpxXml, startDate, startTime, speed, unitSystem]);

  useEffect(() => {
    handleProcessRoute();
  }, [handleProcessRoute]);

  // Handle unit system toggle
  const handleToggleUnit = (newUnit: UnitSystem) => {
    if (newUnit === unitSystem) return;
    if (newUnit === 'metric') {
      setSpeed((prev) => Math.round(prev * 1.60934 * 10) / 10);
    } else {
      setSpeed((prev) => Math.round((prev / 1.60934) * 10) / 10);
    }
    setUnitSystem(newUnit);
  };

  const handleLoadNewGpx = (newXml: string, customName?: string) => {
    setGpxXml(newXml);
    if (customName) setRouteName(customName);
    setCurrentPointIndex(0);
  };

  const handleResetDefault = () => {
    setGpxXml(DEFAULT_GPX_DATA);
    setRouteName(DEFAULT_GPX_NAME);
    setStartTime('08:30');
    setSpeed(unitSystem === 'imperial' ? 17.5 : 28.0);
    setCurrentPointIndex(0);
  };

  // Duration & finish string formatting
  const estimatedFinishTimeStr = data
    ? data.finishTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : '--:--';

  const durationHours = data
    ? (data.finishTime.getTime() - data.startTime.getTime()) / (1000 * 3600)
    : 0;
  const dH = Math.floor(durationHours);
  const dM = Math.round((durationHours - dH) * 60);
  const estimatedDurationStr = `${dH}h ${dM}m`;

  const safeSegmentIndex = data ? Math.min(currentPointIndex, data.segments.length - 1) : 0;
  const currentSegment = data?.segments[safeSegmentIndex];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* 1. Header */}
      <Header
        unitSystem={unitSystem}
        onToggleUnit={handleToggleUnit}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        onResetDefault={handleResetDefault}
        routeName={data?.summary.name || routeName}
        isLoading={isLoading}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-200 text-sm flex items-start gap-3 shadow-lg">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="block font-semibold">Route Calculation Error</strong>
              <p className="mt-0.5 text-xs text-rose-300">{error}</p>
            </div>
            <button
              type="button"
              onClick={handleResetDefault}
              className="px-3 py-1 bg-rose-900/60 hover:bg-rose-800 rounded-lg text-xs font-semibold text-white transition-colors"
            >
              Reset Default Route
            </button>
          </div>
        )}

        {/* Hero Banner with Key Metrics Highlights */}
        {data && (
          <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
            {/* Background Image Scrim */}
            <div className="absolute inset-0 z-0">
              <img
                src="/src/assets/images/cycling_route_hero_1792237947046.jpg"
                alt="Scenic cycling route alongside river"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover opacity-25"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-transparent" />
            </div>

            <div className="relative z-10 p-6 sm:p-8">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
                    <Sun className="w-4 h-4" />
                    <span>Forecast Planned Ride · {startDate}</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                    {data.summary.name}
                  </h1>
                  <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                    Departing at <strong className="text-white">{startTime}</strong>. Starting in cool conditions ({Math.round(data.startWeather.feelsLike)}°{unitSystem === 'imperial' ? 'F' : 'C'}) warming to a peak of <strong className="text-white">{data.peakFeelsLike}°{unitSystem === 'imperial' ? 'F' : 'C'}</strong>. Enjoying <strong className="text-emerald-400">{data.windAnalysis.tailwindPct}% tailwind push</strong> with <strong className="text-rose-400">{data.windAnalysis.headwindPct}% headwind resistance</strong>.
                  </p>
                </div>

                {/* Quick 4-box KPI Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
                  <div className="bg-slate-900/80 backdrop-blur-md p-3.5 rounded-xl border border-slate-700/60 shadow-md">
                    <span className="text-[11px] text-slate-400 block font-medium">Distance</span>
                    <span className="text-lg font-bold text-white tabular-nums">
                      {unitSystem === 'imperial'
                        ? `${data.summary.totalDistanceMi.toFixed(1)} mi`
                        : `${data.summary.totalDistanceKm.toFixed(1)} km`}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      +{unitSystem === 'imperial' ? data.summary.elevationGainFt : data.summary.elevationGainM} {unitSystem === 'imperial' ? 'ft' : 'm'} climb
                    </span>
                  </div>

                  <div className="bg-slate-900/80 backdrop-blur-md p-3.5 rounded-xl border border-slate-700/60 shadow-md">
                    <span className="text-[11px] text-slate-400 block font-medium">Start Temp</span>
                    <span className="text-lg font-bold text-white tabular-nums">
                      {Math.round(data.startWeather.feelsLike)}°{unitSystem === 'imperial' ? 'F' : 'C'}
                    </span>
                    <span className="text-[10px] text-emerald-400 block font-medium">
                      Peak: {data.peakFeelsLike}°{unitSystem === 'imperial' ? 'F' : 'C'}
                    </span>
                  </div>

                  <div className="bg-slate-900/80 backdrop-blur-md p-3.5 rounded-xl border border-slate-700/60 shadow-md">
                    <span className="text-[11px] text-slate-400 block font-medium">Wind Exposure</span>
                    <span className="text-lg font-bold text-emerald-400 tabular-nums">
                      {data.windAnalysis.tailwindPct}% <span className="text-xs text-slate-400 font-normal">tail</span>
                    </span>
                    <span className="text-[10px] text-rose-400 block font-medium">
                      {data.windAnalysis.headwindPct}% headwind
                    </span>
                  </div>

                  <div className="bg-slate-900/80 backdrop-blur-md p-3.5 rounded-xl border border-slate-700/60 shadow-md">
                    <span className="text-[11px] text-slate-400 block font-medium">Est. Finish</span>
                    <span className="text-lg font-bold text-white tabular-nums">
                      {estimatedFinishTimeStr}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {estimatedDurationStr} at {speed} {unitSystem === 'imperial' ? 'mph' : 'km/h'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Ride Parameters & Speed Controls */}
        {data && (
          <RideControls
            routeName={data.summary.name}
            totalDistanceMi={data.summary.totalDistanceMi}
            totalDistanceKm={data.summary.totalDistanceKm}
            elevationGainFt={data.summary.elevationGainFt}
            elevationGainM={data.summary.elevationGainM}
            startDate={startDate}
            setStartDate={setStartDate}
            startTime={startTime}
            setStartTime={setStartTime}
            speed={speed}
            setSpeed={setSpeed}
            unitSystem={unitSystem}
            estimatedFinishTimeStr={estimatedFinishTimeStr}
            estimatedDurationStr={estimatedDurationStr}
            onRefresh={handleProcessRoute}
            isLoading={isLoading}
          />
        )}

        {/* 3. Primary Visual Cockpit: Route Map + Wind Compass */}
        {data && currentSegment && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 xl:col-span-8">
              <RouteMap
                rawPoints={data.rawPoints}
                segments={data.segments}
                currentPointIndex={currentPointIndex}
                onSelectPointIndex={setCurrentPointIndex}
                unitSystem={unitSystem}
                bounds={data.summary.bounds}
              />
            </div>
            <div className="lg:col-span-5 xl:col-span-4">
              <WindCompass
                currentSegment={currentSegment}
                windAnalysis={data.windAnalysis}
                unitSystem={unitSystem}
                riderSpeed={speed}
              />
            </div>
          </div>
        )}

        {/* 4. Interactive Ride Timeline & Milestone Scrubber */}
        {data && (
          <RideTimelineScrubber
            segments={data.segments}
            currentPointIndex={currentPointIndex}
            onSelectPointIndex={setCurrentPointIndex}
            unitSystem={unitSystem}
            startTime={data.startTime}
          />
        )}

        {/* 5. Elevation Profile with Wind Shading */}
        {data && (
          <ElevationProfile
            rawPoints={data.rawPoints}
            segments={data.segments}
            currentPointIndex={currentPointIndex}
            onSelectPointIndex={setCurrentPointIndex}
            unitSystem={unitSystem}
          />
        )}

        {/* 6. Dynamic Layering Guide & Packing Checklist */}
        {data && (
          <LayeringGuide
            layering={data.layering}
            unitSystem={unitSystem}
          />
        )}

        {/* 7. AI Cycling Coach Tactical Briefing */}
        {data && (
          <AiCoachCard
            summary={data.summary}
            windAnalysis={data.windAnalysis}
            layering={data.layering}
            startWeather={data.startWeather}
            peakFeelsLike={data.peakFeelsLike}
            minFeelsLike={data.minFeelsLike}
            startTimeStr={startTime}
            speed={speed}
            unitSystem={unitSystem}
          />
        )}

        {/* 8. Detailed Hourly Waypoint Weather Table */}
        {data && (
          <WeatherTable
            segments={data.segments}
            currentPointIndex={currentPointIndex}
            onSelectPointIndex={setCurrentPointIndex}
            unitSystem={unitSystem}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">VeloCast Cycling Weather</span>
            <span aria-hidden="true">·</span>
            <span>Real-time aerodynamic wind vectors & dynamic layering</span>
          </div>
          <div>
            <span>Weather powered by Open-Meteo High-Resolution Forecast Models</span>
          </div>
        </div>
      </footer>

      {/* GPX Upload Modal */}
      <GpxUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onLoadGpx={handleLoadNewGpx}
      />
    </div>
  );
}

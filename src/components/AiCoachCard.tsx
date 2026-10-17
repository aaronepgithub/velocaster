import React, { useState } from 'react';
import { RouteSummary, WindAnalysis, LayeringRecommendation, RouteSegment, UnitSystem } from '../types/cycling';
import { Sparkles, Zap, Shield, Droplets, ChevronRight, RefreshCw, MessageSquare } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface AiCoachCardProps {
  summary: RouteSummary;
  windAnalysis: WindAnalysis;
  layering: LayeringRecommendation;
  startWeather: RouteSegment['weather'];
  peakFeelsLike: number;
  minFeelsLike: number;
  startTimeStr: string;
  speed: number;
  unitSystem: UnitSystem;
}

export const AiCoachCard: React.FC<AiCoachCardProps> = ({
  summary,
  windAnalysis,
  layering,
  startWeather,
  peakFeelsLike,
  minFeelsLike,
  startTimeStr,
  speed,
  unitSystem,
}) => {
  const [customAdvice, setCustomAdvice] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const speedUnit = unitSystem === 'imperial' ? 'mph' : 'km/h';
  const tempUnit = unitSystem === 'imperial' ? '°F' : '°C';
  const distUnit = unitSystem === 'imperial' ? 'mi' : 'km';
  const distVal = unitSystem === 'imperial' ? summary.totalDistanceMi.toFixed(1) : summary.totalDistanceKm.toFixed(1);

  const handleGenerateAiBriefing = async () => {
    setIsGenerating(true);
    try {
      // In browser, Vite exposes import.meta.env.VITE_GEMINI_API_KEY or process.env
      const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (window as any).__GEMINI_API_KEY__;

      if (!apiKey) {
        // Fallback to high-level rule-based tactical briefing
        setTimeout(() => {
          setCustomAdvice(
            `Tactical Coach Briefing for ${summary.name}:\n\n` +
            `• PACING STRATEGY: Expect ${windAnalysis.headwindPct}% headwind today. Avoid spiking power above Zone 3 into the headwind stretches (${windAnalysis.worstHeadwindSegment ? `notably around Mile ${windAnalysis.worstHeadwindSegment.startMile}-${windAnalysis.worstHeadwindSegment.endMile}` : 'early on'}). Tuck into the drops or aero hoods to reduce frontal surface area by ~15%.\n\n` +
            `• THERMAL MANAGEMENT: Starting at ${startTimeStr} with ${Math.round(startWeather.feelsLike)}${tempUnit} feels-like temp, warming up to a peak of ${peakFeelsLike}${tempUnit}. Keep your wind gilet zipped on the initial leg, then plan to unzip or pack it away as the sun reaches its zenith.\n\n` +
            `• FUELING & HYDRATION: Aim for 60-75g carbohydrates/hour and at least 500-750ml fluid per hour. Even in brisk conditions, wind accelerates dehydration while suppressing thirst sensation.`
          );
          setIsGenerating(false);
        }, 600);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a professional WorldTour cycling directeur sportif and performance coach.
Analyze this planned bike ride and provide an elite tactical briefing (3 concise bullet points: Pacing Strategy, Wind Management, and Thermal/Fueling advice):
Route: ${summary.name} (${distVal} ${distUnit}, +${unitSystem === 'imperial' ? summary.elevationGainFt : summary.elevationGainM} elevation)
Departure: ${startTimeStr} at target speed ${speed} ${speedUnit}
Start Feels-Like: ${Math.round(startWeather.feelsLike)}${tempUnit} (Air: ${Math.round(startWeather.temp)}${tempUnit})
Peak Feels-Like: ${peakFeelsLike}${tempUnit}, Min: ${minFeelsLike}${tempUnit}
Wind: ${windAnalysis.avgWindSpeed} ${speedUnit} avg, Gusts to ${windAnalysis.maxWindGust} ${speedUnit}.
Headwind Exposure: ${windAnalysis.headwindPct}%, Tailwind: ${windAnalysis.tailwindPct}%, Crosswind: ${windAnalysis.crosswindPct}%.
Worst Headwind segment: ${windAnalysis.worstHeadwindSegment ? `Mile ${windAnalysis.worstHeadwindSegment.startMile}-${windAnalysis.worstHeadwindSegment.endMile} at ${windAnalysis.worstHeadwindSegment.headwindSpeed} ${speedUnit}` : 'N/A'}.

Keep it concise, actionable, and pro-cyclist caliber.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      if (response.text) {
        setCustomAdvice(response.text);
      }
    } catch (err) {
      console.warn('AI briefing fallback:', err);
      setCustomAdvice(
        `Tactical Coach Briefing for ${summary.name}:\n\n` +
        `• PACING STRATEGY: Treat the ${windAnalysis.headwindPct}% headwind sections with patience. Aerodynamic drag squares with speed—riding 1 mph faster into a stiff headwind requires massive wattage spikes. Save your legs for the tailwind return!\n\n` +
        `• THERMAL COMFORT: Cool start (${Math.round(startWeather.feelsLike)}${tempUnit}) warms up by +${Math.round(peakFeelsLike - startWeather.feelsLike)}${tempUnit}. Modular layers (vest + arm warmers) will keep you in the sweet spot without overheating on climbs.\n\n` +
        `• HYDRATION: Take a sip of electrolytes every 12-15 minutes. Cool winds wick moisture rapidly from your skin.`
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg text-slate-200 mt-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-white text-base tracking-tight">
            Coach Tactical Briefing & Nutrition Strategy
          </h3>
        </div>

        <button
          type="button"
          onClick={handleGenerateAiBriefing}
          disabled={isGenerating}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50 shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
          <span>{customAdvice ? 'Regenerate Briefing' : 'Get Coach Insights'}</span>
        </button>
      </div>

      {customAdvice ? (
        <div className="mt-4 p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed whitespace-pre-line font-sans">
          {customAdvice}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <div className="text-xs font-bold text-white flex items-center gap-1.5 mb-1.5">
              <Shield className="w-4 h-4 text-emerald-400" />
              Aerodynamic Tactics
            </div>
            <p className="text-xs text-slate-400 leading-normal">
              {windAnalysis.headwindPct > 35
                ? `Heavy headwind exposure (${windAnalysis.headwindPct}%). Stay tucked in the drops, avoid flapping apparel, and maintain steady cadence (85-95 rpm) to avoid leg fatigue.`
                : `Favorable route profile with ${windAnalysis.tailwindPct}% tailwind push. Capitalize on tailwind segments to cruise at higher speeds with lower metabolic cost.`}
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <div className="text-xs font-bold text-white flex items-center gap-1.5 mb-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              Pacing Advice
            </div>
            <p className="text-xs text-slate-400 leading-normal">
              Starting at {startTimeStr} allows you to beat midday heat and winds. Keep power output capped around Zone 2/3 on early rollers so you don't burn matches before turning into headwind sectors.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <div className="text-xs font-bold text-white flex items-center gap-1.5 mb-1.5">
              <Droplets className="w-4 h-4 text-sky-400" />
              Hydration & Fueling
            </div>
            <p className="text-xs text-slate-400 leading-normal">
              Target 1 bottle per 60–75 minutes. Cool morning air reduces perception of thirst, but persistent headwind airflow significantly accelerates respiratory water loss.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

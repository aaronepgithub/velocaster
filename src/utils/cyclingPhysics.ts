import { RouteSegment, WaypointWeather, WindAnalysis } from '../types/cycling';
import { getCompassDirection } from './geo';

/**
 * Calculates headwind and crosswind components given rider bearing and meteorological wind
 * @param riderBearing Degrees rider is heading (0 - 360)
 * @param windDirection Degrees meteorological wind is blowing FROM (0 - 360)
 * @param windSpeed Speed of wind (in mph or km/h)
 */
export function calculateWindComponents(
  riderBearing: number,
  windDirection: number,
  windSpeed: number
): {
  relativeAngle: number;
  headwindComponent: number;
  crosswindComponent: number;
  windType: 'headwind' | 'tailwind' | 'crosswind' | 'neutral';
} {
  if (windSpeed < 1.5) {
    return {
      relativeAngle: 0,
      headwindComponent: 0,
      crosswindComponent: 0,
      windType: 'neutral',
    };
  }

  // Meteorological wind angle is where wind comes from.
  // Relative angle between rider heading and wind origin:
  // If rider heading is 0 (North) and wind is from 0 (North), angle = 0 -> direct headwind!
  // If rider heading is 0 (North) and wind is from 180 (South), angle = 180 -> direct tailwind!
  let diff = Math.abs(riderBearing - windDirection) % 360;
  if (diff > 180) diff = 360 - diff;
  const relativeAngle = diff;

  const rad = (relativeAngle * Math.PI) / 180;
  const cosVal = Math.cos(rad);
  const sinVal = Math.sin(rad);

  // Positive = pushing against rider (headwind)
  // Negative = pushing with rider (tailwind)
  const headwindComponent = Math.round(windSpeed * cosVal * 10) / 10;
  const crosswindComponent = Math.round(windSpeed * Math.abs(sinVal) * 10) / 10;

  // Thresholds for cycling perception
  let windType: 'headwind' | 'tailwind' | 'crosswind' | 'neutral' = 'neutral';
  if (cosVal > 0.3) {
    windType = 'headwind';
  } else if (cosVal < -0.3) {
    windType = 'tailwind';
  } else {
    windType = 'crosswind';
  }

  return {
    relativeAngle,
    headwindComponent,
    crosswindComponent,
    windType,
  };
}

/**
 * Summarizes the entire route's wind impact
 */
export function analyzeRouteWind(
  segments: RouteSegment[],
  unitSystem: 'imperial' | 'metric'
): WindAnalysis {
  let totalDistMi = 0;
  let totalDistKm = 0;
  let headwindMi = 0;
  let tailwindMi = 0;
  let crosswindMi = 0;
  let neutralMi = 0;

  let sumWindSpeed = 0;
  let maxGust = 0;
  const windDirCounts: Record<number, number> = {};

  let worstHeadwind: { startMile: number; endMile: number; headwindSpeed: number; bearingName: string } | undefined;
  let bestTailwind: { startMile: number; endMile: number; tailwindSpeed: number; bearingName: string } | undefined;

  for (const seg of segments) {
    const lenMi = seg.lengthMi;
    const lenKm = seg.lengthKm;
    totalDistMi += lenMi;
    totalDistKm += lenKm;

    const w = seg.weather;
    sumWindSpeed += w.windSpeed * lenMi;
    if (w.windGust > maxGust) maxGust = w.windGust;

    const dirBucket = Math.round(w.windDirection / 22.5) * 22.5 % 360;
    windDirCounts[dirBucket] = (windDirCounts[dirBucket] || 0) + lenMi;

    if (w.windType === 'headwind') {
      headwindMi += lenMi;
      if (!worstHeadwind || w.headwindComponent > worstHeadwind.headwindSpeed) {
        worstHeadwind = {
          startMile: Math.round(seg.startDistMi * 10) / 10,
          endMile: Math.round(seg.endDistMi * 10) / 10,
          headwindSpeed: Math.round(w.headwindComponent * 10) / 10,
          bearingName: seg.bearingName,
        };
      }
    } else if (w.windType === 'tailwind') {
      tailwindMi += lenMi;
      const tailSpeed = Math.abs(w.headwindComponent);
      if (!bestTailwind || tailSpeed > bestTailwind.tailwindSpeed) {
        bestTailwind = {
          startMile: Math.round(seg.startDistMi * 10) / 10,
          endMile: Math.round(seg.endDistMi * 10) / 10,
          tailwindSpeed: Math.round(tailSpeed * 10) / 10,
          bearingName: seg.bearingName,
        };
      }
    } else if (w.windType === 'crosswind') {
      crosswindMi += lenMi;
    } else {
      neutralMi += lenMi;
    }
  }

  const denom = totalDistMi || 1;
  const headwindPct = Math.round((headwindMi / denom) * 100);
  const tailwindPct = Math.round((tailwindMi / denom) * 100);
  const crosswindPct = Math.round((crosswindMi / denom) * 100);
  const neutralPct = Math.max(0, 100 - (headwindPct + tailwindPct + crosswindPct));

  // Dominant wind direction
  let dominantDir = 0;
  let maxDirCount = -1;
  for (const [dir, count] of Object.entries(windDirCounts)) {
    if (count > maxDirCount) {
      maxDirCount = count;
      dominantDir = parseFloat(dir);
    }
  }

  const avgWind = Math.round((sumWindSpeed / denom) * 10) / 10;

  return {
    headwindDistanceMi: Math.round(headwindMi * 10) / 10,
    headwindDistanceKm: Math.round(headwindMi * 1.60934 * 10) / 10,
    headwindPct,
    tailwindDistanceMi: Math.round(tailwindMi * 10) / 10,
    tailwindDistanceKm: Math.round(tailwindMi * 1.60934 * 10) / 10,
    tailwindPct,
    crosswindDistanceMi: Math.round(crosswindMi * 10) / 10,
    crosswindDistanceKm: Math.round(crosswindMi * 1.60934 * 10) / 10,
    crosswindPct,
    neutralDistanceMi: Math.round(neutralMi * 10) / 10,
    neutralDistanceKm: Math.round(neutralMi * 1.60934 * 10) / 10,
    neutralPct,
    avgWindSpeed: avgWind,
    maxWindGust: Math.round(maxGust * 10) / 10,
    dominantWindDir: dominantDir,
    dominantWindDirName: getCompassDirection(dominantDir),
    worstHeadwindSegment: worstHeadwind,
    bestTailwindSegment: bestTailwind,
  };
}

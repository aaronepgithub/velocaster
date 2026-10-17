import { LayeringRecommendation, RoutePoint, RouteSegment, RouteSummary, WindAnalysis } from '../types/cycling';
import { analyzeRouteWind, calculateWindComponents } from './cyclingPhysics';
import { calculateBearing, calculateDistanceKm, getCompassDirection, parseGpx, sampleRouteWaypoints } from './geo';
import { generateLayeringRecommendation } from './layeringEngine';
import { fetchHourlyWeather, interpolateWeatherAtTime, OpenMeteoHourlyResponse } from './weather';

export interface ProcessedRideData {
  summary: RouteSummary;
  rawPoints: RoutePoint[];
  waypoints: RoutePoint[];
  segments: RouteSegment[];
  windAnalysis: WindAnalysis;
  layering: LayeringRecommendation;
  startTime: Date;
  finishTime: Date;
  speed: number; // in current units
  unitSystem: 'imperial' | 'metric';
  startWeather: RouteSegment['weather'];
  peakFeelsLike: number;
  minFeelsLike: number;
}

export async function processRideRoute(
  gpxXml: string,
  startDateStr: string, // YYYY-MM-DD
  startTimeStr: string, // HH:MM
  speedValue: number, // in mph or km/h
  unitSystem: 'imperial' | 'metric'
): Promise<ProcessedRideData> {
  // 1. Parse GPX
  const parsed = parseGpx(gpxXml);
  const rawPoints = parsed.points;
  const summary = parsed.summary;

  // 2. Parse start time
  const [year, month, day] = startDateStr.split('-').map(Number);
  const [hours, minutes] = startTimeStr.split(':').map(Number);
  const startTime = new Date(year, month - 1, day, hours, minutes, 0);

  // Speed in km/h for distance math
  const speedKmh = unitSystem === 'imperial' ? speedValue * 1.60934 : speedValue;
  const safeSpeedKmh = Math.max(5, speedKmh);

  // Total duration in hours
  const totalHours = summary.totalDistanceKm / safeSpeedKmh;
  const finishTime = new Date(startTime.getTime() + totalHours * 3600 * 1000);

  // 3. Sample points into manageable waypoints for weather & timeline (e.g. 50-70 points)
  const sampledPoints = sampleRouteWaypoints(rawPoints, 55);

  // Assign elapsed time and estimated clock time to each sampled point
  for (let i = 0; i < sampledPoints.length; i++) {
    const pt = sampledPoints[i];
    const elapsedHrs = pt.distKm / safeSpeedKmh;
    const elapsedMins = elapsedHrs * 60;
    const ptTime = new Date(startTime.getTime() + elapsedHrs * 3600 * 1000);

    pt.elapsedMinutes = Math.round(elapsedMins);
    pt.estimatedTime = ptTime.toISOString();
  }

  // 4. Query weather across route geography
  // Select 3 - 6 strategic geographic anchors along the route to minimize requests while retaining local precision
  const anchorCount = Math.min(5, sampledPoints.length);
  const anchorIndices = Array.from({ length: anchorCount }, (_, i) =>
    Math.floor((i / (anchorCount - 1)) * (sampledPoints.length - 1))
  );

  const anchorWeatherData = new Map<number, OpenMeteoHourlyResponse>();

  for (const idx of anchorIndices) {
    const anchor = sampledPoints[idx];
    const weatherResp = await fetchHourlyWeather(anchor.lat, anchor.lon, unitSystem);
    anchorWeatherData.set(idx, weatherResp);
  }

  // Helper to get nearest weather station data for any point
  function getNearestWeatherResponse(ptIndex: number): OpenMeteoHourlyResponse {
    let closestAnchorIdx = anchorIndices[0];
    let minDistance = Infinity;

    for (const aIdx of anchorIndices) {
      const diff = Math.abs(aIdx - ptIndex);
      if (diff < minDistance) {
        minDistance = diff;
        closestAnchorIdx = aIdx;
      }
    }

    return anchorWeatherData.get(closestAnchorIdx)!;
  }

  // 5. Build Segments and attach weather
  const segments: RouteSegment[] = [];

  for (let i = 0; i < sampledPoints.length - 1; i++) {
    const p1 = sampledPoints[i];
    const p2 = sampledPoints[i + 1];

    const segBearing = calculateBearing(p1.lat, p1.lon, p2.lat, p2.lon);
    p1.bearing = segBearing;

    const weatherData = getNearestWeatherResponse(i);
    const etaDate = new Date(p1.estimatedTime || startTime.toISOString());
    const weather = interpolateWeatherAtTime(weatherData, etaDate, segBearing);

    p1.weather = weather;

    const lengthKm = p2.distKm - p1.distKm;
    const lengthMi = lengthKm * 0.621371;

    const eleDiff = p2.ele - p1.ele;
    const gradePct = lengthKm > 0 ? (eleDiff / (lengthKm * 1000)) * 100 : 0;

    segments.push({
      startIndex: i,
      endIndex: i + 1,
      startPoint: p1,
      endPoint: p2,
      startDistMi: p1.distMi,
      endDistMi: p2.distMi,
      startDistKm: p1.distKm,
      endDistKm: p2.distKm,
      lengthMi,
      lengthKm,
      bearing: segBearing,
      bearingName: getCompassDirection(segBearing),
      avgElevationM: Math.round((p1.ele + p2.ele) / 2),
      avgGradePct: Math.round(gradePct * 10) / 10,
      weather,
    });
  }

  // Set weather on last sampled point
  if (sampledPoints.length > 0) {
    const lastPt = sampledPoints[sampledPoints.length - 1];
    const lastSeg = segments[segments.length - 1];
    if (lastSeg) {
      lastPt.weather = { ...lastSeg.weather };
      lastPt.bearing = lastSeg.bearing;
    }
  }

  // 6. Wind Analysis
  const windAnalysis = analyzeRouteWind(segments, unitSystem);

  // 7. Layering Recommendations
  const layering = generateLayeringRecommendation(segments, unitSystem);

  // 8. Range extremes
  let peakFeelsLike = -Infinity;
  let minFeelsLike = Infinity;
  for (const s of segments) {
    if (s.weather.feelsLike > peakFeelsLike) peakFeelsLike = s.weather.feelsLike;
    if (s.weather.feelsLike < minFeelsLike) minFeelsLike = s.weather.feelsLike;
  }

  return {
    summary,
    rawPoints,
    waypoints: sampledPoints,
    segments,
    windAnalysis,
    layering,
    startTime,
    finishTime,
    speed: speedValue,
    unitSystem,
    startWeather: segments[0]?.weather || sampledPoints[0]?.weather,
    peakFeelsLike: Math.round(peakFeelsLike * 10) / 10,
    minFeelsLike: Math.round(minFeelsLike * 10) / 10,
  };
}

/**
 * Core types for VeloCast Cycling Route Weather and Wind Analysis
 */

export type UnitSystem = 'imperial' | 'metric';

export interface RoutePoint {
  lat: number;
  lon: number;
  ele: number; // in meters
  distKm: number; // cumulative distance from start
  distMi: number;
  bearing: number; // 0 - 360 degrees
  estimatedTime?: string; // ISO string or local display
  elapsedMinutes?: number;
  // Weather at this point and time
  weather?: WaypointWeather;
}

export interface WaypointWeather {
  temp: number; // stored in user unit or standardized
  feelsLike: number;
  humidity: number; // %
  precipProb: number; // %
  windSpeed: number;
  windDirection: number; // degrees (from which wind blows)
  windGust: number;
  uvIndex: number;
  weatherCode: number;
  weatherDesc: string;
  weatherIcon: string;
  // Cycling wind specifics
  headwindComponent: number; // positive = headwind, negative = tailwind
  crosswindComponent: number; // lateral wind speed
  windType: 'headwind' | 'tailwind' | 'crosswind' | 'neutral';
  relativeWindAngle: number; // 0 = headwind, 180 = tailwind
}

export interface RouteSegment {
  startIndex: number;
  endIndex: number;
  startPoint: RoutePoint;
  endPoint: RoutePoint;
  startDistMi: number;
  endDistMi: number;
  startDistKm: number;
  endDistKm: number;
  lengthMi: number;
  lengthKm: number;
  bearing: number;
  bearingName: string;
  avgElevationM: number;
  avgGradePct: number;
  // Segment weather
  weather: WaypointWeather;
}

export interface RouteSummary {
  name: string;
  totalPoints: number;
  totalDistanceKm: number;
  totalDistanceMi: number;
  elevationGainM: number;
  elevationGainFt: number;
  elevationLossM: number;
  elevationLossFt: number;
  minElevationM: number;
  maxElevationM: number;
  minElevationFt: number;
  maxElevationFt: number;
  bounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
}

export interface RidePlan {
  gpxXml: string;
  routeName: string;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM (24h)
  speedMph: number;
  speedKmh: number;
  unitSystem: UnitSystem;
}

export interface WindAnalysis {
  headwindDistanceMi: number;
  headwindDistanceKm: number;
  headwindPct: number;
  tailwindDistanceMi: number;
  tailwindDistanceKm: number;
  tailwindPct: number;
  crosswindDistanceMi: number;
  crosswindDistanceKm: number;
  crosswindPct: number;
  neutralDistanceMi: number;
  neutralDistanceKm: number;
  neutralPct: number;
  avgWindSpeed: number;
  maxWindGust: number;
  dominantWindDir: number;
  dominantWindDirName: string;
  worstHeadwindSegment?: {
    startMile: number;
    endMile: number;
    headwindSpeed: number;
    bearingName: string;
  };
  bestTailwindSegment?: {
    startMile: number;
    endMile: number;
    tailwindSpeed: number;
    bearingName: string;
  };
}

export interface LayerItem {
  id: string;
  category: 'head' | 'torso_base' | 'torso_outer' | 'arms_hands' | 'legs' | 'feet' | 'accessory';
  name: string;
  iconName: string;
  status: 'wear_at_start' | 'pack_in_pocket' | 'optional';
  advice: string;
  temperatureRange: string;
}

export interface LayerTransition {
  id: string;
  atMinute: number;
  atTime: string;
  atDistanceMi: number;
  atDistanceKm: number;
  currentFeelsLike: number;
  currentWindSpeed: number;
  action: 'remove' | 'add' | 'adjust';
  item: string;
  reason: string;
  icon: string;
}

export interface LayeringRecommendation {
  startApparel: LayerItem[];
  pocketItems: LayerItem[];
  transitions: LayerTransition[];
  summaryNote: string;
  comfortRating: 'Comfortable' | 'Chilly at Start' | 'Challenging Cold' | 'Hot & Humid' | 'Showers Expected';
  riderSpeedMph?: number;
  speedAdjustmentF?: number;
  paceTier?: 'casual' | 'endurance' | 'brisk' | 'race';
  paceDescription?: string;
}

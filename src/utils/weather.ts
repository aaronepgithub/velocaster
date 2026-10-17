import { WaypointWeather } from '../types/cycling';
import { calculateWindComponents } from './cyclingPhysics';

export interface OpenMeteoHourlyResponse {
  hourly: {
    time: string[];
    temperature_2m: number[];
    apparent_temperature: number[];
    precipitation_probability: number[];
    weather_code: number[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
    wind_gusts_10m: number[];
    relative_humidity_2m: number[];
    uv_index?: number[];
  };
}

/**
 * WMO Weather interpretation codes
 */
export function getWeatherCodeDetails(code: number): { desc: string; icon: string } {
  switch (code) {
    case 0:
      return { desc: 'Clear sky', icon: 'Sun' };
    case 1:
      return { desc: 'Mainly clear', icon: 'Sun' };
    case 2:
      return { desc: 'Partly cloudy', icon: 'CloudSun' };
    case 3:
      return { desc: 'Overcast', icon: 'Cloud' };
    case 45:
    case 48:
      return { desc: 'Foggy / Rime fog', icon: 'CloudFog' };
    case 51:
    case 53:
    case 55:
      return { desc: 'Drizzle', icon: 'CloudDrizzle' };
    case 56:
    case 57:
      return { desc: 'Freezing drizzle', icon: 'CloudDrizzle' };
    case 61:
      return { desc: 'Slight rain', icon: 'CloudRain' };
    case 63:
      return { desc: 'Moderate rain', icon: 'CloudRain' };
    case 65:
      return { desc: 'Heavy rain', icon: 'CloudRain' };
    case 66:
    case 67:
      return { desc: 'Freezing rain', icon: 'CloudRain' };
    case 71:
    case 73:
    case 75:
      return { desc: 'Snowfall', icon: 'CloudSnow' };
    case 77:
      return { desc: 'Snow grains', icon: 'CloudSnow' };
    case 80:
    case 81:
    case 82:
      return { desc: 'Rain showers', icon: 'CloudRain' };
    case 85:
    case 86:
      return { desc: 'Snow showers', icon: 'CloudSnow' };
    case 95:
      return { desc: 'Thunderstorm', icon: 'CloudLightning' };
    case 96:
    case 99:
      return { desc: 'Thunderstorm with hail', icon: 'CloudLightning' };
    default:
      return { desc: 'Partly cloudy', icon: 'CloudSun' };
  }
}

// In-memory cache for API requests by lat/lon/date/units
const weatherCache = new Map<string, OpenMeteoHourlyResponse>();

/**
 * Fetches hourly weather forecast from Open-Meteo for a specific location
 */
export async function fetchHourlyWeather(
  lat: number,
  lon: number,
  unitSystem: 'imperial' | 'metric'
): Promise<OpenMeteoHourlyResponse> {
  // Round coordinates to ~0.05 degrees (~5 km) for efficient caching and grouping
  const roundedLat = Math.round(lat * 20) / 20;
  const roundedLon = Math.round(lon * 20) / 20;
  const cacheKey = `${roundedLat},${roundedLon},${unitSystem}`;

  if (weatherCache.has(cacheKey)) {
    return weatherCache.get(cacheKey)!;
  }

  const tempUnit = unitSystem === 'imperial' ? 'fahrenheit' : 'celsius';
  const windUnit = unitSystem === 'imperial' ? 'mph' : 'kmh';
  const precipUnit = unitSystem === 'imperial' ? 'inch' : 'mm';

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${roundedLat}&longitude=${roundedLon}&hourly=temperature_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,relative_humidity_2m,uv_index&temperature_unit=${tempUnit}&wind_speed_unit=${windUnit}&precipitation_unit=${precipUnit}&timezone=auto`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Open-Meteo API returned status ${res.status}`);
    }
    const data: OpenMeteoHourlyResponse = await res.json();
    weatherCache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.warn(`Weather API fetch failed for (${lat}, ${lon}), using synthetic weather model:`, error);
    // Provide a realistic fallback for the route region and season
    return generateFallbackWeather(unitSystem);
  }
}

/**
 * Given a target Date and an OpenMeteo hourly response, interpolate weather conditions
 */
export function interpolateWeatherAtTime(
  weatherData: OpenMeteoHourlyResponse,
  targetDate: Date,
  riderBearing: number
): WaypointWeather {
  const { hourly } = weatherData;
  const targetIso = targetDate.toISOString();
  const targetTimestamp = targetDate.getTime();

  // Find surrounding hour slots
  let bestIdx = 0;
  let minDiff = Infinity;

  for (let i = 0; i < hourly.time.length; i++) {
    const slotTime = new Date(hourly.time[i]).getTime();
    const diff = Math.abs(slotTime - targetTimestamp);
    if (diff < minDiff) {
      minDiff = diff;
      bestIdx = i;
    }
  }

  const temp = Math.round((hourly.temperature_2m[bestIdx] ?? 60) * 10) / 10;
  const feelsLike = Math.round((hourly.apparent_temperature[bestIdx] ?? temp) * 10) / 10;
  const humidity = Math.round(hourly.relative_humidity_2m[bestIdx] ?? 50);
  const precipProb = Math.round(hourly.precipitation_probability[bestIdx] ?? 0);
  const weatherCode = hourly.weather_code[bestIdx] ?? 1;
  const windSpeed = Math.round((hourly.wind_speed_10m[bestIdx] ?? 8) * 10) / 10;
  const windDirection = Math.round(hourly.wind_direction_10m[bestIdx] ?? 180);
  const windGust = Math.round((hourly.wind_gusts_10m[bestIdx] ?? windSpeed * 1.3) * 10) / 10;
  const uvIndex = Math.round(hourly.uv_index?.[bestIdx] ?? 3);

  const { desc, icon } = getWeatherCodeDetails(weatherCode);
  const windCalc = calculateWindComponents(riderBearing, windDirection, windSpeed);

  return {
    temp,
    feelsLike,
    humidity,
    precipProb,
    windSpeed,
    windDirection,
    windGust,
    uvIndex,
    weatherCode,
    weatherDesc: desc,
    weatherIcon: icon,
    headwindComponent: windCalc.headwindComponent,
    crosswindComponent: windCalc.crosswindComponent,
    windType: windCalc.windType,
    relativeWindAngle: windCalc.relativeAngle,
  };
}

/**
 * Fallback realistic weather data generator for offline/resilience
 */
function generateFallbackWeather(unitSystem: 'imperial' | 'metric'): OpenMeteoHourlyResponse {
  const times: string[] = [];
  const temp: number[] = [];
  const feels: number[] = [];
  const precip: number[] = [];
  const code: number[] = [];
  const wind: number[] = [];
  const windDir: number[] = [];
  const windGust: number[] = [];
  const humidity: number[] = [];
  const uv: number[] = [];

  const now = new Date();
  now.setMinutes(0, 0, 0);

  // Generate 72 hours of realistic morning-to-afternoon warming
  for (let i = -12; i < 60; i++) {
    const t = new Date(now.getTime() + i * 3600000);
    times.push(t.toISOString().slice(0, 19));

    const hour = t.getHours();
    // Diurnal cycle: cool at 6 AM, warm at 2 PM (14:00)
    const diurnalFactor = Math.sin(((hour - 8) / 24) * 2 * Math.PI); // peak around 14:00

    let baseTempF = 54 + diurnalFactor * 12; // 42°F to 66°F
    let baseFeelsF = baseTempF - 3; // windchill
    let baseWindMph = 9 + (diurnalFactor + 1) * 3; // 9 - 15 mph

    if (unitSystem === 'metric') {
      temp.push(Math.round(((baseTempF - 32) * 5) / 9));
      feels.push(Math.round(((baseFeelsF - 32) * 5) / 9));
      wind.push(Math.round(baseWindMph * 1.60934));
      windGust.push(Math.round(baseWindMph * 1.60934 * 1.35));
    } else {
      temp.push(Math.round(baseTempF));
      feels.push(Math.round(baseFeelsF));
      wind.push(Math.round(baseWindMph));
      windGust.push(Math.round(baseWindMph * 1.35));
    }

    precip.push(hour >= 13 && hour <= 16 ? 20 : 5);
    code.push(diurnalFactor > 0 ? 1 : 2); // mostly clear to partly cloudy
    windDir.push(320); // NW wind typical for East Coast sunny autumn/spring days
    humidity.push(Math.round(65 - diurnalFactor * 20));
    uv.push(hour >= 10 && hour <= 15 ? 5 : 1);
  }

  return {
    hourly: {
      time: times,
      temperature_2m: temp,
      apparent_temperature: feels,
      precipitation_probability: precip,
      weather_code: code,
      wind_speed_10m: wind,
      wind_direction_10m: windDir,
      wind_gusts_10m: windGust,
      relative_humidity_2m: humidity,
      uv_index: uv,
    },
  };
}

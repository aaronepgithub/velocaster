import { RoutePoint, RouteSummary } from '../types/cycling';

const EARTH_RADIUS_KM = 6371;

/**
 * Calculate distance between two lat/lon coordinates in kilometers using Haversine formula
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = degreesToRadians(lat2 - lat1);
  const dLon = degreesToRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degreesToRadians(lat1)) *
      Math.cos(degreesToRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function radiansToDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Calculate initial bearing from point 1 to point 2 in degrees (0 = North, 90 = East, etc.)
 */
export function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const phi1 = degreesToRadians(lat1);
  const phi2 = degreesToRadians(lat2);
  const deltaLambda = degreesToRadians(lon2 - lon1);

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  const theta = Math.atan2(y, x);
  return (radiansToDegrees(theta) + 360) % 360;
}

/**
 * Convert degree bearing into 16-wind compass direction name (N, NNE, NE, etc.)
 */
export function getCompassDirection(degrees: number): string {
  const directions = [
    'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'
  ];
  const index = Math.round(((degrees % 360) / 22.5)) % 16;
  return directions[index];
}

/**
 * Parse GPX XML content string into raw points and structured summary
 */
export function parseGpx(gpxText: string): {
  name: string;
  points: RoutePoint[];
  summary: RouteSummary;
} {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(gpxText, 'application/xml');

  // Check parsing errors
  const parseError = xmlDoc.getElementsByTagName('parsererror');
  if (parseError.length > 0) {
    throw new Error('Unable to parse GPX XML. Please check the file formatting.');
  }

  // Extract route name
  let name = 'Custom Route';
  const nameNode = xmlDoc.querySelector('trk > name') || xmlDoc.querySelector('metadata > name') || xmlDoc.querySelector('rte > name');
  if (nameNode && nameNode.textContent?.trim()) {
    name = nameNode.textContent.trim();
  }

  // Look for track points or route points
  let pointNodes: NodeListOf<Element> = xmlDoc.querySelectorAll('trkpt');
  if (pointNodes.length === 0) {
    pointNodes = xmlDoc.querySelectorAll('rtept');
  }
  if (pointNodes.length === 0) {
    pointNodes = xmlDoc.querySelectorAll('wpt');
  }

  if (pointNodes.length < 2) {
    throw new Error('The GPX file contains fewer than 2 valid waypoints.');
  }

  const rawPoints: { lat: number; lon: number; ele: number }[] = [];
  let minLat = 90;
  let maxLat = -90;
  let minLon = 180;
  let maxLon = -180;

  for (let i = 0; i < pointNodes.length; i++) {
    const node = pointNodes[i];
    const latStr = node.getAttribute('lat');
    const lonStr = node.getAttribute('lon');
    if (!latStr || !lonStr) continue;

    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);
    if (isNaN(lat) || isNaN(lon)) continue;

    let ele = 0;
    const eleNode = node.querySelector('ele');
    if (eleNode && eleNode.textContent) {
      const parsedEle = parseFloat(eleNode.textContent);
      if (!isNaN(parsedEle)) ele = parsedEle;
    }

    rawPoints.push({ lat, lon, ele });

    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
  }

  if (rawPoints.length < 2) {
    throw new Error('No valid track coordinates found in GPX file.');
  }

  // Compute distances, bearings, elevation gains/losses
  let cumulativeDistKm = 0;
  let elevationGainM = 0;
  let elevationLossM = 0;
  let minEle = rawPoints[0].ele;
  let maxEle = rawPoints[0].ele;

  const points: RoutePoint[] = [];

  for (let i = 0; i < rawPoints.length; i++) {
    const curr = rawPoints[i];
    if (curr.ele < minEle) minEle = curr.ele;
    if (curr.ele > maxEle) maxEle = curr.ele;

    if (i > 0) {
      const prev = rawPoints[i - 1];
      const segDist = calculateDistanceKm(prev.lat, prev.lon, curr.lat, curr.lon);
      cumulativeDistKm += segDist;

      const eleDiff = curr.ele - prev.ele;
      if (eleDiff > 0) {
        elevationGainM += eleDiff;
      } else {
        elevationLossM += Math.abs(eleDiff);
      }
    }

    // Bearing to next point (or repeat last for end point)
    let bearing = 0;
    if (i < rawPoints.length - 1) {
      const next = rawPoints[i + 1];
      bearing = calculateBearing(curr.lat, curr.lon, next.lat, next.lon);
    } else if (i > 0) {
      const prev = rawPoints[i - 1];
      bearing = calculateBearing(prev.lat, prev.lon, curr.lat, curr.lon);
    }

    points.push({
      lat: curr.lat,
      lon: curr.lon,
      ele: curr.ele,
      distKm: cumulativeDistKm,
      distMi: cumulativeDistKm * 0.621371,
      bearing
    });
  }

  const totalDistanceKm = cumulativeDistKm;
  const totalDistanceMi = totalDistanceKm * 0.621371;

  const summary: RouteSummary = {
    name,
    totalPoints: points.length,
    totalDistanceKm,
    totalDistanceMi,
    elevationGainM: Math.round(elevationGainM),
    elevationGainFt: Math.round(elevationGainM * 3.28084),
    elevationLossM: Math.round(elevationLossM),
    elevationLossFt: Math.round(elevationLossM * 3.28084),
    minElevationM: Math.round(minEle),
    maxElevationM: Math.round(maxEle),
    minElevationFt: Math.round(minEle * 3.28084),
    maxElevationFt: Math.round(maxEle * 3.28084),
    bounds: {
      minLat,
      maxLat,
      minLon,
      maxLon,
    },
  };

  return { name, points, summary };
}

/**
 * Resample / downsample route points into N evenly spaced segments for timeline inspection & weather lookup
 */
export function sampleRouteWaypoints(points: RoutePoint[], targetCount = 60): RoutePoint[] {
  if (points.length <= targetCount) return points;

  const totalDist = points[points.length - 1].distKm;
  if (totalDist <= 0) return points.slice(0, targetCount);

  const step = totalDist / (targetCount - 1);
  const sampled: RoutePoint[] = [points[0]];

  let currentTargetDist = step;
  let pointIndex = 1;

  while (sampled.length < targetCount - 1 && pointIndex < points.length) {
    const pt = points[pointIndex];
    if (pt.distKm >= currentTargetDist) {
      sampled.push(pt);
      currentTargetDist += step;
    }
    pointIndex++;
  }

  // Always include the exact last point
  sampled.push(points[points.length - 1]);
  return sampled;
}

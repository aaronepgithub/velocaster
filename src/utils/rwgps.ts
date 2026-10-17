/**
 * Helper to fetch and convert RideWithGPS routes to GPX format
 */

export interface RwgpsTrackPoint {
  x: number; // longitude
  y: number; // latitude
  e?: number; // elevation in meters
  d?: number; // distance in meters
}

export interface RwgpsRouteResponse {
  id: number;
  name?: string;
  description?: string;
  distance?: number;
  elevation_gain?: number;
  elevation_loss?: number;
  track_points?: RwgpsTrackPoint[];
}

/**
 * Extracts route ID from any RideWithGPS URL format:
 * - https://ridewithgps.com/routes/57299436
 * - https://ridewithgps.com/routes/57299436.gpx?sub_format=track
 * - https://ridewithgps.com/routes/57299436.json
 * - 57299436
 */
export function extractRwgpsRouteId(input: string): string | null {
  const trimmed = input.trim();
  const match = trimmed.match(/(?:routes\/|^)(\d+)(?:\.gpx|\.json)?/i);
  return match ? match[1] : null;
}

/**
 * Converts a RideWithGPS JSON payload into standard GPX XML format
 */
export function rwgpsJsonToGpx(data: RwgpsRouteResponse): string {
  const name = (data.name || 'RideWithGPS Route').replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });

  const points = data.track_points || [];
  if (points.length < 2) {
    throw new Error('The RideWithGPS route does not contain enough track points.');
  }

  const trkpts = points
    .map((pt) => {
      const ele = pt.e !== undefined && pt.e !== null ? `<ele>${pt.e.toFixed(1)}</ele>` : '<ele>0</ele>';
      return `      <trkpt lat="${pt.y}" lon="${pt.x}">${ele}</trkpt>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Velocaster" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>${name}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>`;
}

/**
 * Fetches a RideWithGPS route by URL or ID and converts it to GPX XML.
 * RideWithGPS provides open CORS access for routes/*.json.
 */
export async function fetchRwgpsRoute(input: string): Promise<{ gpxXml: string; routeName: string }> {
  const routeId = extractRwgpsRouteId(input);
  if (!routeId) {
    throw new Error('Please enter a valid RideWithGPS URL or route ID (e.g. https://ridewithgps.com/routes/57299436)');
  }

  const jsonUrl = `https://ridewithgps.com/routes/${routeId}.json`;

  let response: Response;
  try {
    response = await fetch(jsonUrl, {
      headers: {
        Accept: 'application/json',
      },
    });
  } catch (err: any) {
    throw new Error('Network error connecting to RideWithGPS. Please verify your connection.');
  }

  if (response.status === 404) {
    throw new Error(`RideWithGPS route #${routeId} was not found. Please verify the link.`);
  }

  if (response.status === 403 || response.status === 401) {
    throw new Error(`RideWithGPS route #${routeId} is private. Only public routes can be imported directly.`);
  }

  if (!response.ok) {
    throw new Error(`RideWithGPS returned an error (HTTP ${response.status}).`);
  }

  const data: RwgpsRouteResponse = await response.json();
  const routeName = data.name || `RWGPS Route ${routeId}`;
  const gpxXml = rwgpsJsonToGpx(data);

  return { gpxXml, routeName };
}

import { LayerItem, LayerTransition, LayeringRecommendation, RouteSegment } from '../types/cycling';

/**
 * Computes cycling layering recommendations and exact in-ride transition triggers
 */
export function generateLayeringRecommendation(
  segments: RouteSegment[],
  unitSystem: 'imperial' | 'metric'
): LayeringRecommendation {
  if (segments.length === 0) {
    return {
      startApparel: [],
      pocketItems: [],
      transitions: [],
      summaryNote: 'Load a route to calculate gear recommendations.',
      comfortRating: 'Comfortable',
    };
  }

  // Convert everything to Fahrenheit internally for standard cycling rule thresholds
  const startWeather = segments[0].weather;
  const startFeelsF = unitSystem === 'imperial'
    ? startWeather.feelsLike
    : (startWeather.feelsLike * 9) / 5 + 32;

  let minFeelsF = startFeelsF;
  let maxFeelsF = startFeelsF;
  let maxPrecip = startWeather.precipProb;
  let maxWindSpeed = startWeather.windSpeed;

  for (const s of segments) {
    const f = unitSystem === 'imperial'
      ? s.weather.feelsLike
      : (s.weather.feelsLike * 9) / 5 + 32;
    if (f < minFeelsF) minFeelsF = f;
    if (f > maxFeelsF) maxFeelsF = f;
    if (s.weather.precipProb > maxPrecip) maxPrecip = s.weather.precipProb;
    if (s.weather.windSpeed > maxWindSpeed) maxWindSpeed = s.weather.windSpeed;
  }

  const tempDeltaF = maxFeelsF - startFeelsF;

  // Build Start Apparel
  const startApparel: LayerItem[] = [];
  const pocketItems: LayerItem[] = [];
  const transitions: LayerTransition[] = [];

  // 1. Head & Neck
  if (startFeelsF < 42) {
    startApparel.push({
      id: 'head_winter_cap',
      category: 'head',
      name: 'Thermal Skull Cap with Ear Flaps',
      iconName: 'Smile',
      status: 'wear_at_start',
      advice: 'Fits under helmet, shields forehead and ears from piercing windchill.',
      temperatureRange: '< 45°F (< 7°C)',
    });
    startApparel.push({
      id: 'neck_gaiter',
      category: 'head',
      name: 'Merino Wool Neck Gaiter',
      iconName: 'Shield',
      status: 'wear_at_start',
      advice: 'Protects throat and can be pulled over mouth/chin against brisk headwinds.',
      temperatureRange: '< 45°F (< 7°C)',
    });
  } else if (startFeelsF < 55) {
    startApparel.push({
      id: 'head_ear_band',
      category: 'head',
      name: 'Cycling Headband / Ear Warmer',
      iconName: 'Smile',
      status: 'wear_at_start',
      advice: 'Prevents earache from cold air while allowing heat to escape through helmet vents.',
      temperatureRange: '45°F - 58°F (7°C - 14°C)',
    });
  } else {
    startApparel.push({
      id: 'head_cycling_cap',
      category: 'head',
      name: 'Classic Cotton/Poly Cycling Cap',
      iconName: 'Smile',
      status: 'wear_at_start',
      advice: 'Visor blocks morning sun and keeps sweat out of eyes.',
      temperatureRange: '> 55°F (> 13°C)',
    });
  }

  // Always UV eyewear
  startApparel.push({
    id: 'eyewear_sunglasses',
    category: 'accessory',
    name: 'Photochromic or Contrast Sunglasses',
    iconName: 'Glasses',
    status: 'wear_at_start',
    advice: 'Vital for wind protection, road grit, and shifting canopy shadows.',
    temperatureRange: 'All weather',
  });

  // 2. Base Layer
  if (startFeelsF < 48) {
    startApparel.push({
      id: 'base_long_merino',
      category: 'torso_base',
      name: 'Long-Sleeve Merino Wool Base Layer',
      iconName: 'Shirt',
      status: 'wear_at_start',
      advice: 'Active thermoregulation; retains warmth even when damp from climbs.',
      temperatureRange: '< 50°F (< 10°C)',
    });
  } else if (startFeelsF < 62) {
    startApparel.push({
      id: 'base_short_wicking',
      category: 'torso_base',
      name: 'Short-Sleeve Moisture-Wicking Base Layer',
      iconName: 'Shirt',
      status: 'wear_at_start',
      advice: 'Forms an evaporative air cushion to prevent cold clamminess on descents.',
      temperatureRange: '48°F - 65°F (9°C - 18°C)',
    });
  } else {
    startApparel.push({
      id: 'base_mesh_sleeveless',
      category: 'torso_base',
      name: 'Sleeveless Open-Mesh Base Layer',
      iconName: 'Shirt',
      status: 'wear_at_start',
      advice: 'Pulls sweat directly away from skin to maintain rapid cooling.',
      temperatureRange: '> 65°F (> 18°C)',
    });
  }

  // 3. Jersey & Outer Layer
  if (startFeelsF < 40) {
    startApparel.push({
      id: 'outer_winter_jacket',
      category: 'torso_outer',
      name: 'Windproof Thermal Softshell Jacket',
      iconName: 'Coat',
      status: 'wear_at_start',
      advice: 'GORE-Tex Infinium or Windstopper membrane with fleece lining.',
      temperatureRange: '< 42°F (< 6°C)',
    });
  } else if (startFeelsF < 52) {
    startApparel.push({
      id: 'jersey_mid_thermal',
      category: 'torso_outer',
      name: 'Long-Sleeve Thermal Brushed Jersey',
      iconName: 'Shirt',
      status: 'wear_at_start',
      advice: 'Breathable fleece interior provides insulation without overheating.',
      temperatureRange: '42°F - 55°F (6°C - 13°C)',
    });
    // Add wind vest / gilet on top!
    startApparel.push({
      id: 'outer_wind_vest',
      category: 'torso_outer',
      name: 'Packable Windproof Gilet (Vest)',
      iconName: 'Shield',
      status: 'wear_at_start',
      advice: 'Essential for the cool morning start; shields chest from wind and packs into a jersey pocket once warmed up.',
      temperatureRange: '45°F - 62°F (7°C - 17°C)',
    });
  } else if (startFeelsF < 64) {
    startApparel.push({
      id: 'jersey_short_sleeve',
      category: 'torso_outer',
      name: 'Standard Cycling Jersey',
      iconName: 'Shirt',
      status: 'wear_at_start',
      advice: 'Pair with arm warmers and wind vest for flexible modular layers.',
      temperatureRange: '52°F - 70°F (11°C - 21°C)',
    });
    startApparel.push({
      id: 'outer_wind_vest',
      category: 'torso_outer',
      name: 'Wind Vest / Gilet',
      iconName: 'Shield',
      status: 'wear_at_start',
      advice: 'Blocks morning breeze. Easy 2-way zipper for climbing ventilation.',
      temperatureRange: '50°F - 64°F (10°C - 18°C)',
    });
  } else {
    startApparel.push({
      id: 'jersey_summer_pro',
      category: 'torso_outer',
      name: 'Breathable Aero/Summer Cycling Jersey',
      iconName: 'Shirt',
      status: 'wear_at_start',
      advice: 'Full-length zip for maximum airflow during steady efforts.',
      temperatureRange: '> 64°F (> 18°C)',
    });
  }

  // 4. Arms & Hands
  if (startFeelsF < 42) {
    startApparel.push({
      id: 'hands_deep_winter_gloves',
      category: 'arms_hands',
      name: 'Windproof Insulated Full-Finger Gloves',
      iconName: 'Hand',
      status: 'wear_at_start',
      advice: 'Wind and water resistant with silicone brake lever grips.',
      temperatureRange: '< 45°F (< 7°C)',
    });
  } else if (startFeelsF < 58) {
    startApparel.push({
      id: 'arms_fleece_warmers',
      category: 'arms_hands',
      name: 'Thermal Fleece Arm Warmers',
      iconName: 'Layers',
      status: 'wear_at_start',
      advice: 'Provides long-sleeve warmth at 8:30 AM; roll down to wrists or stow when temperature climbs.',
      temperatureRange: '45°F - 60°F (7°C - 15°C)',
    });
    startApparel.push({
      id: 'hands_light_full_gloves',
      category: 'arms_hands',
      name: 'Mid-Season Windproof Gloves',
      iconName: 'Hand',
      status: 'wear_at_start',
      advice: 'Full fingers block windchill without sweaty palms.',
      temperatureRange: '48°F - 58°F (9°C - 14°C)',
    });
  } else {
    startApparel.push({
      id: 'hands_track_mitts',
      category: 'arms_hands',
      name: 'Fingerless Track Mitts / Gel Gloves',
      iconName: 'Hand',
      status: 'wear_at_start',
      advice: 'Cushions ulnar nerve pressure and provides palm abrasion protection.',
      temperatureRange: '> 58°F (> 14°C)',
    });
  }

  // 5. Lower Body
  if (startFeelsF < 44) {
    startApparel.push({
      id: 'legs_bib_tights',
      category: 'legs',
      name: 'Roubaix Fleece-Backed Bib Tights',
      iconName: 'Activity',
      status: 'wear_at_start',
      advice: 'Full leg warmth with windproof panels over knees.',
      temperatureRange: '< 45°F (< 7°C)',
    });
  } else if (startFeelsF < 56) {
    startApparel.push({
      id: 'legs_bib_shorts',
      category: 'legs',
      name: 'Thermal Bib Shorts',
      iconName: 'Activity',
      status: 'wear_at_start',
      advice: 'Pair with knee warmers to keep patella tendons warm and lubricated.',
      temperatureRange: '45°F - 62°F (7°C - 17°C)',
    });
    startApparel.push({
      id: 'legs_knee_warmers',
      category: 'legs',
      name: 'Knee Warmers (or Leg Warmers)',
      iconName: 'Layers',
      status: 'wear_at_start',
      advice: 'Protects knees from cold air; removable once midday temperatures rise.',
      temperatureRange: '48°F - 58°F (9°C - 15°C)',
    });
  } else {
    startApparel.push({
      id: 'legs_bib_shorts_summer',
      category: 'legs',
      name: 'Standard Ergonomic Bib Shorts',
      iconName: 'Activity',
      status: 'wear_at_start',
      advice: 'High density chamois pad for multi-hour comfort.',
      temperatureRange: '> 56°F (> 13°C)',
    });
  }

  // 6. Feet
  if (startFeelsF < 42) {
    startApparel.push({
      id: 'feet_shoe_covers',
      category: 'feet',
      name: 'Neoprene / Windproof Full Shoe Covers',
      iconName: 'Footprints',
      status: 'wear_at_start',
      advice: 'Seals vents in road cycling shoes against icy airstreams.',
      temperatureRange: '< 45°F (< 7°C)',
    });
    startApparel.push({
      id: 'feet_merino_socks',
      category: 'feet',
      name: 'Merino Wool Cycling Socks',
      iconName: 'Feather',
      status: 'wear_at_start',
      advice: 'High-loft natural insulation.',
      temperatureRange: '< 45°F (< 7°C)',
    });
  } else if (startFeelsF < 56) {
    startApparel.push({
      id: 'feet_toe_covers',
      category: 'feet',
      name: 'Windproof Neoprene Toe Covers',
      iconName: 'Footprints',
      status: 'wear_at_start',
      advice: 'Blocks wind hitting the front of shoes without bulky full booties.',
      temperatureRange: '45°F - 56°F (7°C - 13°C)',
    });
    startApparel.push({
      id: 'feet_mid_socks',
      category: 'feet',
      name: 'Midweight Synthetic/Wool Socks',
      iconName: 'Feather',
      status: 'wear_at_start',
      advice: 'Warm toe box with breathable instep.',
      temperatureRange: '48°F - 62°F (9°C - 17°C)',
    });
  } else {
    startApparel.push({
      id: 'feet_summer_socks',
      category: 'feet',
      name: 'Lightweight Breathable Cycling Socks',
      iconName: 'Feather',
      status: 'wear_at_start',
      advice: 'Ventilated mesh upper for maximum cooling.',
      temperatureRange: '> 56°F (> 13°C)',
    });
  }

  // Pocket Essentials
  if (maxPrecip > 25) {
    pocketItems.push({
      id: 'pocket_rain_cape',
      category: 'torso_outer',
      name: 'Emergency Packable Rain Jacket',
      iconName: 'CloudRain',
      status: 'pack_in_pocket',
      advice: `Rain risk reaches ${maxPrecip}% along the route. Stows tightly in middle pocket.`,
      temperatureRange: 'Showers / Rain risk',
    });
  }

  pocketItems.push({
    id: 'pocket_energy_fuel',
    category: 'accessory',
    name: 'Hydration & 60-90g Carb/hr Fuel',
    iconName: 'Zap',
    status: 'pack_in_pocket',
    advice: 'Cool temperatures suppress thirst cues, but wind and climbing accelerate glycogen depletion.',
    temperatureRange: 'All rides',
  });

  // Calculate in-ride transitions as temperature changes along route
  let vestRemoved = false;
  let armWarmersAdjusted = false;
  let rainJacketPutOn = false;

  for (let i = 1; i < segments.length; i++) {
    const seg = segments[i];
    const segFeelsF = unitSystem === 'imperial'
      ? seg.weather.feelsLike
      : (seg.weather.feelsLike * 9) / 5 + 32;

    const timeStr = seg.weather ? formatTimeSlot(seg.startPoint.estimatedTime) : `+${Math.round(seg.startPoint.elapsedMinutes || 0)}m`;

    // 1. Remove Vest Trigger: when feels-like warms above 58°F and start was < 52°F
    if (!vestRemoved && startFeelsF < 54 && segFeelsF >= 58) {
      vestRemoved = true;
      transitions.push({
        id: `trans_vest_${i}`,
        atMinute: Math.round(seg.startPoint.elapsedMinutes || 0),
        atTime: timeStr,
        atDistanceMi: Math.round(seg.startDistMi * 10) / 10,
        atDistanceKm: Math.round(seg.startDistKm * 10) / 10,
        currentFeelsLike: Math.round(seg.weather.feelsLike),
        currentWindSpeed: Math.round(seg.weather.windSpeed),
        action: 'remove',
        item: 'Wind Vest / Gilet',
        reason: `Feels like has climbed to ${Math.round(seg.weather.feelsLike)}°${unitSystem === 'imperial' ? 'F' : 'C'}. Unzip fully or roll up and pack into jersey pocket to prevent sweat buildup.`,
        icon: 'Shield',
      });
    }

    // 2. Adjust/Remove Arm Warmers Trigger: when temp rises above 63°F
    if (!armWarmersAdjusted && startFeelsF < 58 && segFeelsF >= 63) {
      armWarmersAdjusted = true;
      transitions.push({
        id: `trans_arms_${i}`,
        atMinute: Math.round(seg.startPoint.elapsedMinutes || 0),
        atTime: timeStr,
        atDistanceMi: Math.round(seg.startDistMi * 10) / 10,
        atDistanceKm: Math.round(seg.startDistKm * 10) / 10,
        currentFeelsLike: Math.round(seg.weather.feelsLike),
        currentWindSpeed: Math.round(seg.weather.windSpeed),
        action: 'adjust',
        item: 'Arm Warmers',
        reason: `Mild conditions (${Math.round(seg.weather.feelsLike)}°). Push arm warmers down to wrists or remove and stow in pocket.`,
        icon: 'Layers',
      });
    }

    // 3. Rain jacket transition if sudden rain shower (> 50% precip)
    if (!rainJacketPutOn && seg.weather.precipProb >= 50) {
      rainJacketPutOn = true;
      transitions.push({
        id: `trans_rain_${i}`,
        atMinute: Math.round(seg.startPoint.elapsedMinutes || 0),
        atTime: timeStr,
        atDistanceMi: Math.round(seg.startDistMi * 10) / 10,
        atDistanceKm: Math.round(seg.startDistKm * 10) / 10,
        currentFeelsLike: Math.round(seg.weather.feelsLike),
        currentWindSpeed: Math.round(seg.weather.windSpeed),
        action: 'add',
        item: 'Rain Jacket / Shell',
        reason: `Precipitation probability jumps to ${seg.weather.precipProb}%. Put on rain shell before rain soaks through jersey.`,
        icon: 'CloudRain',
      });
    }
  }

  // Summary diagnosis
  let comfortRating: LayeringRecommendation['comfortRating'] = 'Comfortable';
  if (maxPrecip >= 45) {
    comfortRating = 'Showers Expected';
  } else if (startFeelsF < 40) {
    comfortRating = 'Challenging Cold';
  } else if (startFeelsF < 52) {
    comfortRating = 'Chilly at Start';
  } else if (maxFeelsF > 80) {
    comfortRating = 'Hot & Humid';
  }

  let summaryNote = '';
  if (tempDeltaF >= 12) {
    summaryNote = `Significant morning warmup of +${Math.round(unitSystem === 'imperial' ? tempDeltaF : (tempDeltaF * 5) / 9)}° expected. Layer modularly (vest + arm warmers) so you can shed gear into your pockets as the sun rises.`;
  } else if (maxWindSpeed > 15) {
    summaryNote = `Strong breezes up to ${Math.round(maxWindSpeed)} ${unitSystem === 'imperial' ? 'mph' : 'km/h'} will increase windchill on exposed stretches. Keep a snug wind vest zipped during headwinds and long descents.`;
  } else if (maxPrecip > 30) {
    summaryNote = `Passing showers possible (${maxPrecip}% peak chance). Carry an ultralight waterproof rain jacket in your center pocket.`;
  } else {
    summaryNote = `Stable, favorable cycling conditions across the ride. Light modular layers ensure optimal comfort without carrying excess bulk.`;
  }

  return {
    startApparel,
    pocketItems,
    transitions,
    summaryNote,
    comfortRating,
  };
}

function formatTimeSlot(isoString?: string): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch {
    return isoString;
  }
}

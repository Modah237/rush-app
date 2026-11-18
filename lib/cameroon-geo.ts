export interface CameroonCity {
  id: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
  zoom: number;
  status: 'active' | 'expansion' | 'b2b';
  etaLabel: string;
  baseFee: number;
  activeRiders: number;
  activeShops: number;
}

export interface CameroonZone {
  id: string;
  cityId: string;
  cityName: string;
  name: string;
  landmark: string;
  lat: number;
  lng: number;
  deliveryFee: number;
  etaMinutes: number;
  radiusMeters: number;
}

export interface ActiveRiderPoint {
  id: string;
  name: string;
  vehicle: string;
  cityId: string;
  quarter: string;
  lat: number;
  lng: number;
  status: 'available' | 'delivering';
}

export const CAMEROON_OVERVIEW = {
  center: [5.65, 11.85] as [number, number],
  zoom: 6,
  bounds: [
    [1.65, 8.35],
    [13.15, 16.25],
  ] as [[number, number], [number, number]],
};

export const CAMEROON_CITIES: CameroonCity[] = [
  {
    id: 'douala',
    name: 'Douala',
    region: 'Littoral',
    lat: 4.0511,
    lng: 9.7279,
    zoom: 13,
    status: 'active',
    etaLabel: '18-30 min',
    baseFee: 500,
    activeRiders: 48,
    activeShops: 64,
  },
  {
    id: 'yaounde',
    name: 'Yaoundé',
    region: 'Centre',
    lat: 3.8667,
    lng: 11.5167,
    zoom: 13,
    status: 'active',
    etaLabel: '22-35 min',
    baseFee: 600,
    activeRiders: 32,
    activeShops: 41,
  },
  {
    id: 'bafoussam',
    name: 'Bafoussam',
    region: 'Ouest',
    lat: 5.4778,
    lng: 10.4176,
    zoom: 13,
    status: 'expansion',
    etaLabel: '25-40 min',
    baseFee: 500,
    activeRiders: 12,
    activeShops: 14,
  },
  {
    id: 'kribi',
    name: 'Kribi',
    region: 'Sud',
    lat: 2.9373,
    lng: 9.9077,
    zoom: 13,
    status: 'expansion',
    etaLabel: '20-35 min',
    baseFee: 600,
    activeRiders: 9,
    activeShops: 11,
  },
  {
    id: 'limbe',
    name: 'Limbé',
    region: 'Sud-Ouest',
    lat: 4.0225,
    lng: 9.206,
    zoom: 13,
    status: 'expansion',
    etaLabel: '25-35 min',
    baseFee: 600,
    activeRiders: 8,
    activeShops: 9,
  },
  {
    id: 'buea',
    name: 'Buea',
    region: 'Sud-Ouest',
    lat: 4.1527,
    lng: 9.241,
    zoom: 13,
    status: 'expansion',
    etaLabel: '25-35 min',
    baseFee: 600,
    activeRiders: 10,
    activeShops: 12,
  },
  {
    id: 'bamenda',
    name: 'Bamenda',
    region: 'Nord-Ouest',
    lat: 5.9597,
    lng: 10.146,
    zoom: 13,
    status: 'b2b',
    etaLabel: 'B2B Drive',
    baseFee: 700,
    activeRiders: 6,
    activeShops: 7,
  },
  {
    id: 'garoua',
    name: 'Garoua',
    region: 'Nord',
    lat: 9.3014,
    lng: 13.3977,
    zoom: 13,
    status: 'b2b',
    etaLabel: 'B2B Drive',
    baseFee: 700,
    activeRiders: 5,
    activeShops: 6,
  },
  {
    id: 'maroua',
    name: 'Maroua',
    region: 'Extrême-Nord',
    lat: 10.591,
    lng: 14.3159,
    zoom: 13,
    status: 'b2b',
    etaLabel: 'B2B Drive',
    baseFee: 700,
    activeRiders: 4,
    activeShops: 5,
  },
  {
    id: 'ngaoundere',
    name: 'Ngaoundéré',
    region: 'Adamaoua',
    lat: 7.3167,
    lng: 13.5833,
    zoom: 13,
    status: 'b2b',
    etaLabel: 'B2B Drive',
    baseFee: 700,
    activeRiders: 4,
    activeShops: 5,
  },
  {
    id: 'bertoua',
    name: 'Bertoua',
    region: 'Est',
    lat: 4.5773,
    lng: 13.6846,
    zoom: 13,
    status: 'b2b',
    etaLabel: 'B2B Drive',
    baseFee: 700,
    activeRiders: 3,
    activeShops: 4,
  },
  {
    id: 'ebolowa',
    name: 'Ebolowa',
    region: 'Sud',
    lat: 2.9,
    lng: 11.15,
    zoom: 13,
    status: 'b2b',
    etaLabel: 'B2B Drive',
    baseFee: 700,
    activeRiders: 3,
    activeShops: 4,
  },
];

export const CAMEROON_ZONES: CameroonZone[] = [
  // Douala
  { id: 'dla-akwa', cityId: 'douala', cityName: 'Douala', name: 'Akwa', landmark: 'Rue Joss · Boulevard de la Liberté', lat: 4.0536, lng: 9.6989, deliveryFee: 500, etaMinutes: 18, radiusMeters: 1200 },
  { id: 'dla-bonanjo', cityId: 'douala', cityName: 'Douala', name: 'Bonanjo', landmark: 'Place du Gouvernement · Port', lat: 4.0419, lng: 9.6873, deliveryFee: 500, etaMinutes: 20, radiusMeters: 1100 },
  { id: 'dla-bonapriso', cityId: 'douala', cityName: 'Douala', name: 'Bonapriso', landmark: 'Rue des Palmiers · Hydrocarbures', lat: 4.0273, lng: 9.7014, deliveryFee: 600, etaMinutes: 22, radiusMeters: 1300 },
  { id: 'dla-bali', cityId: 'douala', cityName: 'Douala', name: 'Bali', landmark: 'Rue Koumassi · Carrefour', lat: 4.0398, lng: 9.6967, deliveryFee: 500, etaMinutes: 20, radiusMeters: 1000 },
  { id: 'dla-deido', cityId: 'douala', cityName: 'Douala', name: 'Deido', landmark: 'Rond-point Deido · Pont du Wouri', lat: 4.0641, lng: 9.7124, deliveryFee: 600, etaMinutes: 22, radiusMeters: 1200 },
  { id: 'dla-ndokotti', cityId: 'douala', cityName: 'Douala', name: 'Ndokotti', landmark: 'Tunnel Ndokotti · Carrefour', lat: 4.051, lng: 9.7405, deliveryFee: 700, etaMinutes: 25, radiusMeters: 1400 },
  { id: 'dla-makepe', cityId: 'douala', cityName: 'Douala', name: 'Makepe', landmark: 'Makepe Missoke · Parcours Vita', lat: 4.0752, lng: 9.7443, deliveryFee: 700, etaMinutes: 26, radiusMeters: 1400 },
  { id: 'dla-bonamoussadi', cityId: 'douala', cityName: 'Douala', name: 'Bonamoussadi', landmark: 'Santa Lucia · Denver', lat: 4.0888, lng: 9.7364, deliveryFee: 800, etaMinutes: 28, radiusMeters: 1600 },
  { id: 'dla-kotto', cityId: 'douala', cityName: 'Douala', name: 'Kotto', landmark: 'Carrefour Kotto · Bloc', lat: 4.0987, lng: 9.7547, deliveryFee: 900, etaMinutes: 30, radiusMeters: 1500 },
  { id: 'dla-logpom', cityId: 'douala', cityName: 'Douala', name: 'Logpom', landmark: 'Carrefour Bassong · Andem', lat: 4.0931, lng: 9.7685, deliveryFee: 900, etaMinutes: 32, radiusMeters: 1500 },
  { id: 'dla-bonaberi', cityId: 'douala', cityName: 'Douala', name: 'Bonabéri', landmark: 'Ancienne Route · Rail', lat: 4.0736, lng: 9.6558, deliveryFee: 1000, etaMinutes: 35, radiusMeters: 1800 },
  { id: 'dla-yassa', cityId: 'douala', cityName: 'Douala', name: 'Yassa', landmark: 'Entrée Est · Tradex Yassa', lat: 4.0185, lng: 9.8115, deliveryFee: 1100, etaMinutes: 38, radiusMeters: 1700 },

  // Yaoundé
  { id: 'yde-bastos', cityId: 'yaounde', cityName: 'Yaoundé', name: 'Bastos', landmark: 'Quartier Diplomatique · Golf', lat: 3.8927, lng: 11.5122, deliveryFee: 600, etaMinutes: 22, radiusMeters: 1400 },
  { id: 'yde-centre', cityId: 'yaounde', cityName: 'Yaoundé', name: 'Centre-Ville', landmark: 'Poste Centrale · Avenue Kennedy', lat: 3.8667, lng: 11.5167, deliveryFee: 600, etaMinutes: 20, radiusMeters: 1200 },
  { id: 'yde-nlongkak', cityId: 'yaounde', cityName: 'Yaoundé', name: 'Nlongkak', landmark: 'Rond-point Nlongkak', lat: 3.8809, lng: 11.5227, deliveryFee: 650, etaMinutes: 24, radiusMeters: 1200 },
  { id: 'yde-essos', cityId: 'yaounde', cityName: 'Yaoundé', name: 'Essos', landmark: 'Carrefour Essos · Hôtel du Plateau', lat: 3.8736, lng: 11.5442, deliveryFee: 700, etaMinutes: 26, radiusMeters: 1400 },
  { id: 'yde-biyemassi', cityId: 'yaounde', cityName: 'Yaoundé', name: 'Biyem-Assi', landmark: 'Rond-point Express · Acacias', lat: 3.8442, lng: 11.4847, deliveryFee: 750, etaMinutes: 28, radiusMeters: 1500 },
  { id: 'yde-mvan', cityId: 'yaounde', cityName: 'Yaoundé', name: 'Mvan', landmark: 'Carrefour Mvan · Axe Sud', lat: 3.8253, lng: 11.5162, deliveryFee: 800, etaMinutes: 30, radiusMeters: 1500 },
  { id: 'yde-odza', cityId: 'yaounde', cityName: 'Yaoundé', name: 'Odza', landmark: 'Petit Marché Odza · Axe Nsimalen', lat: 3.8054, lng: 11.5315, deliveryFee: 950, etaMinutes: 34, radiusMeters: 1600 },

  // Autres pôles urbains
  { id: 'bfx-centre', cityId: 'bafoussam', cityName: 'Bafoussam', name: 'Tamja / Centre', landmark: 'Place des Fêtes · Marché A', lat: 5.4778, lng: 10.4176, deliveryFee: 500, etaMinutes: 25, radiusMeters: 1500 },
  { id: 'kbi-centre', cityId: 'kribi', cityName: 'Kribi', name: 'Kribi Centre / Ngoye', landmark: 'Phare de Kribi · Port', lat: 2.9373, lng: 9.9077, deliveryFee: 600, etaMinutes: 22, radiusMeters: 1500 },
  { id: 'lim-downbeach', cityId: 'limbe', cityName: 'Limbé', name: 'Down Beach / Half Mile', landmark: 'Botanic Garden · Mile 1', lat: 4.0225, lng: 9.206, deliveryFee: 600, etaMinutes: 24, radiusMeters: 1400 },
  { id: 'buea-molyko', cityId: 'buea', cityName: 'Buea', name: 'Molyko', landmark: 'University Junction · Mile 17', lat: 4.1527, lng: 9.241, deliveryFee: 600, etaMinutes: 25, radiusMeters: 1500 },
];

export const ACTIVE_CAMEROON_RIDERS: ActiveRiderPoint[] = [
  { id: 'r1', name: 'Eric N.', vehicle: 'Moto Yamaha', cityId: 'douala', quarter: 'Akwa', lat: 4.0505, lng: 9.7015, status: 'delivering' },
  { id: 'r2', name: 'Brice T.', vehicle: 'Moto Boxer', cityId: 'douala', quarter: 'Bonapriso', lat: 4.0312, lng: 9.7031, status: 'available' },
  { id: 'r3', name: 'Sandra M.', vehicle: 'Moto Haojue', cityId: 'douala', quarter: 'Deido', lat: 4.0618, lng: 9.7148, status: 'available' },
  { id: 'r4', name: 'Francis E.', vehicle: 'Moto Boxer', cityId: 'douala', quarter: 'Bonamoussadi', lat: 4.0842, lng: 9.7341, status: 'delivering' },
  { id: 'r5', name: 'Samuel K.', vehicle: 'Moto Sanili', cityId: 'yaounde', quarter: 'Bastos', lat: 3.8895, lng: 11.5142, status: 'available' },
  { id: 'r6', name: 'Alain B.', vehicle: 'Moto Yamaha', cityId: 'yaounde', quarter: 'Centre-Ville', lat: 3.8682, lng: 11.5194, status: 'delivering' },
];

/**
 * Calcule la distance réelle en km entre deux coordonnées GPS (formule de Haversine).
 */
export function calculateDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Estime de façon déterministe et transparente le tarif RUSH (FCFA) et la durée (min)
 * selon la distance en km au Cameroun.
 */
export function estimateCameroonDelivery(distanceKm: number): {
  distanceKm: number;
  priceFcfa: number;
  etaMinutes: number;
} {
  const safeDist = Math.max(0.5, distanceKm);
  // Base 500 FCFA + 150 FCFA/km au-delà de 1 km, arrondi à la centaine la plus proche
  const rawPrice = safeDist <= 1.2 ? 500 : 500 + (safeDist - 1.2) * 165;
  const priceFcfa = Math.max(500, Math.round(rawPrice / 100) * 100);
  const etaMinutes = Math.max(12, Math.round(10 + safeDist * 3.8));
  return {
    distanceKm: Math.round(safeDist * 10) / 10,
    priceFcfa,
    etaMinutes,
  };
}

/**
 * Trouve le quartier/zone camerounaise la plus proche d'un point GPS cliqué sur la carte.
 */
export function findNearestCameroonZone(lat: number, lng: number): CameroonZone {
  let closest = CAMEROON_ZONES[0];
  let bestDist = Infinity;
  for (const zone of CAMEROON_ZONES) {
    const d = calculateDistanceKm(lat, lng, zone.lat, zone.lng);
    if (d < bestDist) {
      bestDist = d;
      closest = zone;
    }
  }
  return closest;
}

/**
 * Résout une adresse textuelle (ex: "Bonapriso, Rue des Palmiers" ou "Bastos") en coordonnées Cameroun.
 */
export function resolveLocationFromText(text: string): { lat: number; lng: number; label: string; cityName: string } {
  const normalized = text.toLowerCase();
  const matchedZone = CAMEROON_ZONES.find(
    (z) =>
      normalized.includes(z.name.toLowerCase()) ||
      normalized.includes(z.cityName.toLowerCase())
  );
  if (matchedZone) {
    return {
      lat: matchedZone.lat,
      lng: matchedZone.lng,
      label: `${matchedZone.cityName}, ${matchedZone.name}`,
      cityName: matchedZone.cityName,
    };
  }
  const matchedCity = CAMEROON_CITIES.find((c) => normalized.includes(c.name.toLowerCase()));
  if (matchedCity) {
    return {
      lat: matchedCity.lat,
      lng: matchedCity.lng,
      label: matchedCity.name,
      cityName: matchedCity.name,
    };
  }
  // Fallback Akwa, Douala
  return {
    lat: 4.0536,
    lng: 9.6989,
    label: 'Douala, Akwa',
    cityName: 'Douala',
  };
}

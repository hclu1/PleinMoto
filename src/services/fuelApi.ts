import type { StationData, FuelType } from '../types';

export interface StationSearchOptions {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  fuelType?: FuelType;
  brandFilter?: string;
}

// Calcul de la distance haversine en km
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Rayon de la terre en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Normalisation des noms de carburants
export function normalizeFuelKey(fuel: string): string {
  const f = fuel.toUpperCase().replace(/\s+/g, '');
  if (f.includes('SP98') || f.includes('E5')) return 'SP98';
  if (f.includes('SP95') && !f.includes('E10')) return 'SP95';
  if (f.includes('E10')) return 'E10';
  if (f.includes('E85')) return 'E85';
  if (f.includes('GAZOLE') || f.includes('DIESEL') || f.includes('B7')) return 'Gazole';
  return fuel;
}

export async function fetchNearbyStations(
  options: StationSearchOptions
): Promise<StationData[]> {
  const { latitude, longitude, radiusKm = 15 } = options;

  // URL Open Data du Ministère de l'Économie (flux instantané)
  const endpoint = `https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-carburants-fichier-instantane-explore/records`;
  const params = new URLSearchParams({
    limit: '60',
    where: `within_distance(geom, geom'POINT(${longitude} ${latitude})', ${radiusKm}km)`,
  });

  const response = await fetch(`${endpoint}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Erreur API Open Data (${response.status}) : ${response.statusText}`);
  }

  const data = await response.json();
  const results: StationData[] = [];

  if (!data.results || !Array.isArray(data.results)) {
    return [];
  }

  for (const record of data.results) {
    // Coordonnées GPS
    let stationLat = 0;
    let stationLon = 0;

    if (record.geom && typeof record.geom.lat === 'number') {
      stationLat = record.geom.lat;
      stationLon = record.geom.lon;
    } else if (record.latitude && record.longitude) {
      // Les données brutes peuvent être multipliées par 100 000
      stationLat = record.latitude > 1000 ? record.latitude / 100000 : record.latitude;
      stationLon = record.longitude > 1000 ? record.longitude / 100000 : record.longitude;
    }

    if (!stationLat || !stationLon) continue;

    const distance = calculateDistanceKm(latitude, longitude, stationLat, stationLon);

    // Extraction des prix des carburants
    const prixMap: StationData['prixCarburants'] = {};

    // 1. Structure JSON dans le champ 'prix'
    if (record.prix) {
      try {
        const parsedPrix = typeof record.prix === 'string' ? JSON.parse(record.prix) : record.prix;
        if (Array.isArray(parsedPrix)) {
          for (const item of parsedPrix) {
            const nom = item['@nom'] || item.nom || item.name;
            const valeur = parseFloat(item['@valeur'] || item.valeur || item.val);
            const maj = item['@maj'] || item.maj || new Date().toISOString();
            if (nom && !isNaN(valeur) && valeur > 0) {
              const standardKey = normalizeFuelKey(nom);
              prixMap[standardKey] = { nom, prix: valeur, maj };
            }
          }
        }
      } catch (err) {
        console.warn('Erreur parsing champ prix station', err);
      }
    }

    // 2. Colonnes individuelles standards (sp98_prix, e10_prix, etc.)
    const checkField = (fieldKey: string, fuelName: string) => {
      const prix = parseFloat(record[`${fieldKey}_prix`]);
      const maj = record[`${fieldKey}_maj`] || record.maj || new Date().toISOString();
      if (!isNaN(prix) && prix > 0 && !prixMap[fuelName]) {
        prixMap[fuelName] = { nom: fuelName, prix, maj };
      }
    };

    checkField('sp98', 'SP98');
    checkField('sp95', 'SP95');
    checkField('e10', 'E10');
    checkField('e85', 'E85');
    checkField('gazole', 'Gazole');

    // Détection de l'enseigne
    let marque = 'Indépendant';
    const rawBrand = (record.marque || record.enseigne || record.nom || '').toString();
    const addressUpper = (record.adresse || '').toUpperCase();
    const services = (record.services_service || '').toString().toUpperCase();

    if (rawBrand) {
      marque = rawBrand;
    } else if (addressUpper.includes('TOTAL') || services.includes('TOTAL')) {
      marque = 'TotalEnergies';
    } else if (addressUpper.includes('CARREFOUR') || services.includes('CARREFOUR')) {
      marque = 'Carrefour';
    } else if (addressUpper.includes('LECLERC') || services.includes('LECLERC')) {
      marque = 'E.Leclerc';
    } else if (addressUpper.includes('BP') || services.includes('BP')) {
      marque = 'BP';
    } else if (addressUpper.includes('ESSO') || services.includes('ESSO')) {
      marque = 'Esso';
    } else if (addressUpper.includes('SHELL') || services.includes('SHELL')) {
      marque = 'Shell';
    } else if (addressUpper.includes('INTERMARCHE') || services.includes('INTERMARCHE')) {
      marque = 'Intermarché';
    } else if (addressUpper.includes('SYSTEME U') || addressUpper.includes('SUPER U')) {
      marque = 'Système U';
    }

    results.push({
      id: record.id || `${stationLat}-${stationLon}`,
      nom: rawBrand || `${marque} ${record.ville || ''}`,
      marque,
      adresse: record.adresse || 'Adresse non renseignée',
      ville: record.ville || '',
      cp: record.cp || '',
      latitude: stationLat,
      longitude: stationLon,
      distanceKm: distance,
      prixCarburants: prixMap,
    });
  }

  return results;
}

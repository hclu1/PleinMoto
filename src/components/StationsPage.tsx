import React, { useState } from 'react';
import type { StationData, FuelType, AppSettings } from '../types';
import { fetchNearbyStations } from '../services/fuelApi';
import {
  MapPin,
  Navigation as NavIcon,
  AlertCircle,
  Clock,
  Compass,
  RefreshCw,
  Map as MapIcon,
  List as ListIcon,
  ChevronRight,
} from 'lucide-react';

interface StationsPageProps {
  settings?: AppSettings;
  defaultFuel: FuelType;
  onSelectStationForFill: (station: {
    stationName: string;
    brand: string;
    fuelType: string;
    pricePerLiter: number;
  }) => void;
}

export const StationsPage: React.FC<StationsPageProps> = ({
  defaultFuel = 'SP98',
  onSelectStationForFill,
}) => {
  const [selectedFuel, setSelectedFuel] = useState<FuelType>(defaultFuel || 'SP98');
  const [selectedBrand, setSelectedBrand] = useState<string>('Toutes');
  const [radiusKm, setRadiusKm] = useState<number>(15);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // Geolocation & Data states
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [stations, setStations] = useState<StationData[]>([]);
  const [hasRequestedGeo, setHasRequestedGeo] = useState<boolean>(false);

  // Quick preset locations for testing/desktop/offline simulation
  const PRESET_LOCATIONS = [
    { name: 'Ma position GPS réelle', lat: null, lon: null },
    { name: 'Paris (Porte de Bercy)', lat: 48.829, lon: 2.383 },
    { name: 'Lyon (Centre)', lat: 45.764, lon: 4.835 },
    { name: 'Marseille (Vieux-Port)', lat: 43.296, lon: 5.369 },
    { name: 'Bordeaux (Centre)', lat: 44.837, lon: -0.579 },
  ];

  const requestGeolocation = () => {
    setHasRequestedGeo(true);
    setIsLoading(true);
    setErrorMsg(null);

    if (!navigator.geolocation) {
      setErrorMsg('La géolocalisation n’est pas supportée par votre appareil.');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lon: longitude });
        loadStations(latitude, longitude, radiusKm);
      },
      (err) => {
        setIsLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setErrorMsg(
            'Autorisation de géolocalisation refusée. Vous pouvez utiliser une position test ci-dessous pour explorer les stations Open Data.'
          );
        } else {
          setErrorMsg(`Impossible d’obtenir votre position GPS (${err.message}).`);
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSelectPreset = (lat: number, lon: number) => {
    setHasRequestedGeo(true);
    setCoords({ lat, lon });
    loadStations(lat, lon, radiusKm);
  };

  const loadStations = async (lat: number, lon: number, radius: number) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchNearbyStations({
        latitude: lat,
        longitude: lon,
        radiusKm: radius,
        fuelType: selectedFuel,
      });
      setStations(data);
      if (data.length === 0) {
        setErrorMsg(`Aucune station trouvée dans un rayon de ${radius} km.`);
      }
    } catch (err: any) {
      setErrorMsg(
        'Erreur lors de la récupération des prix officiels. Vérifiez votre connexion Internet.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Filter stations based on selected fuel and brand
  const filteredStations = stations
    .filter((st) => {
      // Must sell the selected fuel
      const fuelInfo = st.prixCarburants[selectedFuel];
      if (!fuelInfo || fuelInfo.prix <= 0) return false;

      // Brand filter
      if (selectedBrand !== 'Toutes') {
        const b = (st.marque || '').toLowerCase();
        const target = selectedBrand.toLowerCase();
        if (!b.includes(target) && !st.nom.toLowerCase().includes(target)) {
          return false;
        }
      }
      return true;
    })
    // Sort from cheapest to most expensive
    .sort((a, b) => {
      const priceA = a.prixCarburants[selectedFuel]?.prix || 999;
      const priceB = b.prixCarburants[selectedFuel]?.prix || 999;
      return priceA - priceB;
    });

  const formatUpdateDate = (dateStr: string) => {
    if (!dateStr) return 'Date inconnue';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Intro banner about Open Data */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 shadow-sm flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
          <MapPin className="w-5 h-5 stroke-[2.5]" />
        </div>
        <div className="text-xs">
          <h2 className="font-bold text-zinc-100 text-sm">
            Stations & Prix des carburants en temps réel
          </h2>
          <p className="text-zinc-400 mt-0.5">
            Données officielles françaises issues du Ministère de l'Économie (Open Data DGEC). Aucun historique de trajet n'est collecté ni envoyé.
          </p>
        </div>
      </div>

      {/* Geolocation activation CTA if not requested yet */}
      {!hasRequestedGeo && (
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800/80 border border-zinc-700/80 rounded-3xl p-6 text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
            <Compass className="w-8 h-8 stroke-[2.5]" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold text-zinc-100">
              Trouver les stations autour de vous
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              L'application utilise votre géolocalisation uniquement pour trouver les stations à proximité et afficher les prix officiels.
            </p>
          </div>

          <button
            onClick={requestGeolocation}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-sm py-3.5 px-6 rounded-2xl shadow-lg shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
          >
            <NavIcon className="w-4 h-4 fill-zinc-950" />
            <span>Activer le GPS et chercher les stations</span>
          </button>

          {/* Quick presets for testing */}
          <div className="pt-3 border-t border-zinc-800/80">
            <span className="text-[11px] text-zinc-500 block mb-2 font-medium">
              Ou tester immédiatement avec une ville d'exemple :
            </span>
            <div className="flex flex-wrap justify-center gap-2">
              {PRESET_LOCATIONS.filter((p) => p.lat !== null).map((p) => (
                <button
                  key={p.name}
                  onClick={() => handleSelectPreset(p.lat!, p.lon!)}
                  className="px-2.5 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold border border-zinc-700"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters Controls (Active once requested) */}
      {hasRequestedGeo && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 space-y-3 shadow-sm">
          {/* Fuel selection bar (SP98 default) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Carburant recherché (SP98 par défaut)
              </span>
              <span className="text-[10px] text-amber-400 font-semibold">
                Tri automatique : du - cher au + cher
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {['SP98', 'SP95', 'E10', 'E85', 'Gazole'].map((f) => (
                <button
                  key={f}
                  onClick={() => setSelectedFuel(f)}
                  className={`py-2 text-center rounded-xl text-xs font-bold transition-all ${
                    selectedFuel === f
                      ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Enseigne filter & Rayon */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">
                Enseigne
              </label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-2.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
              >
                <option value="Toutes">Toutes les enseignes</option>
                <option value="TotalEnergies">TotalEnergies</option>
                <option value="Carrefour">Carrefour</option>
                <option value="E.Leclerc">E.Leclerc</option>
                <option value="BP">BP</option>
                <option value="Esso">Esso</option>
                <option value="Shell">Shell</option>
                <option value="Intermarché">Intermarché</option>
                <option value="Système U">Système U</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">
                Rayon de recherche
              </label>
              <select
                value={radiusKm}
                onChange={(e) => {
                  const r = parseInt(e.target.value);
                  setRadiusKm(r);
                  if (coords) loadStations(coords.lat, coords.lon, r);
                }}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-2.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
              >
                <option value={5}>5 km</option>
                <option value={10}>10 km</option>
                <option value={15}>15 km</option>
                <option value={25}>25 km</option>
                <option value={50}>50 km</option>
              </select>
            </div>
          </div>

          {/* Refresh and View Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
            <button
              onClick={() => {
                if (coords) loadStations(coords.lat, coords.lon, radiusKm);
                else requestGeolocation();
              }}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-800 px-3 py-1.5 rounded-xl border border-zinc-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
              Actualiser les prix
            </button>

            <div className="flex items-center bg-zinc-800 p-1 rounded-xl border border-zinc-700">
              <button
                onClick={() => setViewMode('list')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                  viewMode === 'list'
                    ? 'bg-amber-500 text-zinc-950'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <ListIcon className="w-3.5 h-3.5" /> Liste
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                  viewMode === 'map'
                    ? 'bg-amber-500 text-zinc-950'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" /> Carte
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="p-8 text-center bg-zinc-900/90 border border-zinc-800 rounded-2xl space-y-2">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-medium text-zinc-300">
            Interrogation des flux officiels des prix des carburants...
          </p>
        </div>
      )}

      {/* Error state */}
      {errorMsg && !isLoading && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
          <div>
            <p className="font-semibold">{errorMsg}</p>
            <p className="text-[11px] text-rose-400/80 mt-1">
              Les autres fonctionnalités de l'application (pleins, entretien, coût de revient) restent 100% opérationnelles hors ligne.
            </p>
          </div>
        </div>
      )}

      {/* Results View */}
      {hasRequestedGeo && !isLoading && !errorMsg && (
        <>
          {viewMode === 'list' ? (
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-3.5 border-b border-zinc-800 flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                  {filteredStations.length} station(s) proposant du {selectedFuel}
                </span>
                <span className="text-[11px] text-zinc-400">Classé du - cher au + cher</span>
              </div>

              {filteredStations.length === 0 ? (
                <div className="p-8 text-center text-zinc-500">
                  <p className="font-medium text-zinc-300">
                    Aucune station ne propose actuellement du {selectedFuel} avec ces critères.
                  </p>
                  <p className="text-xs mt-1">
                    Essayez d'élargir le rayon de recherche ou de choisir un autre carburant.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-800/80">
                  {filteredStations.map((station, index) => {
                    const fuelDetail = station.prixCarburants[selectedFuel];
                    const isCheapest = index === 0;

                    return (
                      <div
                        key={station.id}
                        className={`p-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isCheapest ? 'bg-amber-500/5' : 'hover:bg-zinc-800/40'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {isCheapest && (
                              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-zinc-950 px-2 py-0.5 rounded-full">
                                Le moins cher
                              </span>
                            )}
                            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                              {station.marque}
                            </span>
                            <span className="text-xs text-zinc-400 font-semibold">
                              à {station.distanceKm} km
                            </span>
                          </div>

                          <div className="text-sm font-semibold text-zinc-100">
                            {station.nom}
                          </div>

                          <p className="text-xs text-zinc-400">
                            {station.adresse}, {station.cp} {station.ville}
                          </p>

                          <div className="text-[11px] text-zinc-500 flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            <span>
                              Mise à jour officielle le {formatUpdateDate(fuelDetail.maj)}
                            </span>
                          </div>
                        </div>

                        {/* Price and Use Action */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-800/60">
                          <div className="text-left sm:text-right">
                            <div className="text-2xl font-black text-emerald-400">
                              {fuelDetail.prix.toFixed(3)}{' '}
                              <span className="text-xs font-medium text-zinc-400">€/L</span>
                            </div>
                            <span className="text-[10px] text-zinc-400 font-mono">
                              Carburant : {selectedFuel}
                            </span>
                          </div>

                          <button
                            onClick={() =>
                              onSelectStationForFill({
                                stationName: `${station.marque} (${station.ville})`,
                                brand: station.marque,
                                fuelType: selectedFuel,
                                pricePerLiter: fuelDetail.prix,
                              })
                            }
                            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs py-2.5 px-3.5 rounded-xl shadow-md shadow-amber-500/20 active:scale-95 transition-all"
                          >
                            <span>Utiliser ce prix</span>
                            <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Map View */
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                <span>Carte interactive ({filteredStations.length} stations)</span>
                <span className="text-amber-400">Cliquez sur une station pour l'utiliser</span>
              </div>
              <div className="h-80 w-full rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 flex flex-col items-center justify-center p-4 text-center">
                <MapPin className="w-10 h-10 text-amber-500 mb-2 animate-bounce" />
                <p className="text-sm font-bold text-zinc-200">
                  {filteredStations.length} stations trouvées autour de vous
                </p>
                <div className="mt-3 max-h-48 overflow-y-auto w-full space-y-2 text-left">
                  {filteredStations.slice(0, 5).map((st) => (
                    <div
                      key={st.id}
                      onClick={() =>
                        onSelectStationForFill({
                          stationName: `${st.marque} (${st.ville})`,
                          brand: st.marque,
                          fuelType: selectedFuel,
                          pricePerLiter: st.prixCarburants[selectedFuel]?.prix || 0,
                        })
                      }
                      className="p-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 flex items-center justify-between cursor-pointer"
                    >
                      <div className="truncate pr-2">
                        <span className="font-bold text-xs text-zinc-200 truncate block">
                          {st.marque} • {st.ville}
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          {st.distanceKm} km • {st.adresse}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-black text-emerald-400 block">
                          {st.prixCarburants[selectedFuel]?.prix.toFixed(3)} €
                        </span>
                        <span className="text-[10px] text-amber-400 font-semibold">
                          Choisir
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

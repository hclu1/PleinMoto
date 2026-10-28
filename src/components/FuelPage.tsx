import React, { useState, useEffect } from 'react';
import type { Moto, FuelEntry, AppSettings } from '../types';
import { StorageService } from '../services/storage';
import { computeFuelStats, getTodayDateString, formatDateFr } from '../utils/calculations';
import { Line } from 'react-chartjs-2';
import '../utils/chartConfig';
import {
  Plus,
  Fuel,
  TrendingDown,
  Gauge,
  CircleDollarSign,
  Calendar,
  MapPin,
  Trash2,
  Edit2,
  X,
  AlertTriangle,
  TrendingUp,
  Flame,
  RotateCcw,
  Check,
} from 'lucide-react';

interface FuelPageProps {
  activeMoto: Moto;
  settings: AppSettings;
  onRefreshData: () => void;
  pendingFillStation?: {
    stationName: string;
    brand: string;
    fuelType: string;
    pricePerLiter: number;
  } | null;
  onClearPendingFillStation?: () => void;
  onGoToStations?: () => void;
}

export const FuelPage: React.FC<FuelPageProps> = ({
  activeMoto,
  settings,
  onRefreshData,
  pendingFillStation,
  onClearPendingFillStation,
  onGoToStations,
}) => {
  const [fuels, setFuels] = useState<FuelEntry[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FuelEntry | null>(null);

  // Form states
  const [date, setDate] = useState<string>(getTodayDateString());
  const [inputMode, setInputMode] = useState<'odometer' | 'trip'>('trip'); // Default to trip 1 or odometer
  const [currentMileage, setCurrentMileage] = useState<string>('');
  const [distance, setDistance] = useState<string>('');
  const [tripResetChecked, setTripResetChecked] = useState<boolean>(true);
  const [liters, setLiters] = useState<string>('');
  const [totalPrice, setTotalPrice] = useState<string>('');
  const [brand, setBrand] = useState<string>('TotalEnergies');
  const [fuelType, setFuelType] = useState<string>(activeMoto.defaultFuel || 'SP98');
  const [stationName, setStationName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Custom brand prompt
  const [showNewBrandModal, setShowNewBrandModal] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');

  // Validation errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Load fuels
  const loadFuels = () => {
    const list = StorageService.getFuelEntries(activeMoto.id);
    setFuels(list);
  };

  useEffect(() => {
    loadFuels();
  }, [activeMoto.id]);

  // Handle station import if passed from StationsPage
  useEffect(() => {
    if (pendingFillStation) {
      setStationName(pendingFillStation.stationName);
      setBrand(pendingFillStation.brand);
      setFuelType(pendingFillStation.fuelType);
      setDate(getTodayDateString());

      // If price per liter is known and liters is set, auto-compute
      if (pendingFillStation.pricePerLiter > 0 && liters && !isNaN(parseFloat(liters))) {
        const computedTotal = (parseFloat(liters) * pendingFillStation.pricePerLiter).toFixed(2);
        setTotalPrice(computedTotal);
      }

      setIsModalOpen(true);
      if (onClearPendingFillStation) {
        onClearPendingFillStation();
      }
    }
  }, [pendingFillStation]);

  const stats = computeFuelStats(fuels, activeMoto.initialMileage);

  // Determine last mileage for auto-distance calculation
  const latestMileage = fuels.length > 0 ? fuels[0].currentMileage : activeMoto.initialMileage;

  // Auto calculate distance when currentMileage changes (Mode Compteur ODO)
  const handleCurrentMileageChange = (val: string) => {
    setCurrentMileage(val);
    const parsedCurrent = parseFloat(val);
    if (!isNaN(parsedCurrent) && parsedCurrent >= latestMileage) {
      const calculatedDistance = (parsedCurrent - latestMileage).toFixed(1);
      setDistance(calculatedDistance);
    }
  };

  // Auto calculate currentMileage when Trip 1 changes (Mode Trip 1 partiel)
  const handleTripChange = (val: string) => {
    setDistance(val);
    const parsedTrip = parseFloat(val);
    if (!isNaN(parsedTrip) && parsedTrip >= 0) {
      const calculatedMileage = (latestMileage + parsedTrip).toFixed(0);
      setCurrentMileage(calculatedMileage);
    }
  };

  // Auto calculate total price when liters and pricePerLiter change or vice-versa
  const pricePerLiterCalculated =
    liters && totalPrice && parseFloat(liters) > 0
      ? (parseFloat(totalPrice) / parseFloat(liters)).toFixed(3)
      : '0.000';

  const resetForm = () => {
    setDate(getTodayDateString());
    setInputMode('trip');
    setCurrentMileage('');
    setDistance('');
    setTripResetChecked(true);
    setLiters('');
    setTotalPrice('');
    setBrand(settings.brands[0] || 'TotalEnergies');
    setFuelType(activeMoto.defaultFuel || 'SP98');
    setStationName('');
    setNotes('');
    setEditingEntry(null);
    setErrors({});
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (entry: FuelEntry) => {
    setEditingEntry(entry);
    setDate(entry.date);
    setInputMode(entry.distanceInputMode || 'odometer');
    setCurrentMileage(entry.currentMileage.toString());
    setDistance(entry.distance.toString());
    setTripResetChecked(true);
    setLiters(entry.liters.toString());
    setTotalPrice(entry.totalPrice.toString());
    setBrand(entry.brand);
    setFuelType(entry.fuelType);
    setStationName(entry.stationName);
    setNotes(entry.notes || '');
    setErrors({});
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce plein ?')) {
      StorageService.deleteFuelEntry(id);
      loadFuels();
      onRefreshData();
    }
  };

  const handleSaveFuel = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    // Validations
    if (!date) newErrors.date = 'La date est obligatoire.';
    const today = getTodayDateString();
    if (date > today) {
      newErrors.date = 'La date ne peut pas être dans le futur.';
    }

    const curKm = parseFloat(currentMileage);
    if (isNaN(curKm) || curKm < 0) {
      newErrors.currentMileage = 'Kilométrage au compteur invalide.';
    }

    const dist = parseFloat(distance);
    if (isNaN(dist) || dist <= 0) {
      newErrors.distance = 'Distance parcourue invalide (doit être > 0).';
    }

    const lit = parseFloat(liters);
    if (isNaN(lit) || lit <= 0) {
      newErrors.liters = 'Nombre de litres invalide (doit être > 0).';
    }

    const tot = parseFloat(totalPrice);
    if (isNaN(tot) || tot <= 0) {
      newErrors.totalPrice = 'Prix total payé invalide (doit être > 0).';
    }

    if (curKm < latestMileage && !editingEntry) {
      if (!window.confirm(`Attention : le kilométrage saisi (${curKm} km) est inférieur au dernier plein enregistré (${latestMileage} km). Souhaitez-vous continuer ?`)) {
        return;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const computedPpl = Math.round((tot / lit) * 1000) / 1000;
    const computedConso = Math.round(((lit / dist) * 100) * 100) / 100;

    if (editingEntry) {
      const updated: FuelEntry = {
        ...editingEntry,
        date,
        currentMileage: curKm,
        distance: dist,
        distanceInputMode: inputMode,
        liters: lit,
        totalPrice: tot,
        pricePerLiter: computedPpl,
        brand: brand || 'TotalEnergies',
        fuelType: fuelType || 'SP98',
        stationName: stationName || 'Station',
        consumption: computedConso,
        notes,
      };
      StorageService.updateFuelEntry(updated);
    } else {
      const newEntry: FuelEntry = {
        id: 'fuel-' + Date.now(),
        motoId: activeMoto.id,
        date,
        currentMileage: curKm,
        distance: dist,
        distanceInputMode: inputMode,
        liters: lit,
        totalPrice: tot,
        pricePerLiter: computedPpl,
        brand: brand || 'TotalEnergies',
        fuelType: fuelType || 'SP98',
        stationName: stationName || 'Station',
        consumption: computedConso,
        notes,
        createdAt: new Date().toISOString(),
      };
      StorageService.addFuelEntry(newEntry);
    }

    setIsModalOpen(false);
    resetForm();
    loadFuels();
    onRefreshData();
  };

  const handleAddNewBrand = () => {
    const trimmed = newBrandName.trim();
    if (trimmed && !settings.brands.includes(trimmed)) {
      const updated = {
        ...settings,
        brands: [...settings.brands, trimmed],
      };
      StorageService.saveSettings(updated);
      setBrand(trimmed);
      setNewBrandName('');
      setShowNewBrandModal(false);
    }
  };

  // Prepare chart data (reverse chronological for graph left-to-right)
  const chartFuels = [...fuels].reverse();
  const consumptionChartData = {
    labels: chartFuels.map((f) => formatDateFr(f.date)),
    datasets: [
      {
        label: 'Conso (L/100 km)',
        data: chartFuels.map((f) => f.consumption),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#f59e0b',
        pointRadius: 4,
      },
    ],
  };

  const priceChartData = {
    labels: chartFuels.map((f) => formatDateFr(f.date)),
    datasets: [
      {
        label: 'Prix / Litre (€)',
        data: chartFuels.map((f) => f.pricePerLiter),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#10b981',
        pointRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        padding: 8,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#71717a', font: { size: 10 } },
      },
      y: {
        grid: { color: 'rgba(63, 63, 70, 0.3)' },
        ticks: { color: '#71717a', font: { size: 10 } },
      },
    },
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Top action: Big tactile button for refueling at the pump */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleOpenAddModal}
          className="flex-1 flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-base py-4 px-6 rounded-2xl shadow-xl shadow-amber-500/25 active:scale-[0.98] transition-all cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-zinc-950/15 flex items-center justify-center">
            <Plus className="w-5 h-5 stroke-[3]" />
          </div>
          <span>Ajouter un plein à la pompe</span>
        </button>

        {onGoToStations && (
          <button
            onClick={onGoToStations}
            className="flex items-center justify-center gap-2 bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 font-medium text-sm py-3.5 px-4 rounded-2xl active:scale-[0.98] transition-all"
          >
            <MapPin className="w-4 h-4 text-amber-400" />
            <span>Prix stations alentour</span>
          </button>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Moyenne Conso */}
        <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-xs font-medium">Conso Moyenne</span>
            <Gauge className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-zinc-100 tracking-tight">
            {stats.averageConsumption > 0 ? stats.averageConsumption.toFixed(2) : '-.--'}
            <span className="text-xs font-normal text-zinc-400 ml-1">L/100</span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800/60 text-[11px] text-zinc-400">
            <span className="flex items-center gap-0.5 text-emerald-400 font-medium">
              <TrendingDown className="w-3 h-3" /> Min: {stats.bestConsumption ? stats.bestConsumption.toFixed(2) : '-'}
            </span>
            <span className="flex items-center gap-0.5 text-rose-400 font-medium">
              <TrendingUp className="w-3 h-3" /> Max: {stats.worstConsumption ? stats.worstConsumption.toFixed(2) : '-'}
            </span>
          </div>
        </div>

        {/* Prix Moyen Litre */}
        <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-xs font-medium">Prix Moyen / L</span>
            <CircleDollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-zinc-100 tracking-tight">
            {stats.averagePricePerLiter > 0 ? stats.averagePricePerLiter.toFixed(3) : '-.---'}
            <span className="text-xs font-normal text-zinc-400 ml-1">€/L</span>
          </div>
          <div className="mt-2 pt-2 border-t border-zinc-800/60 text-[11px] text-zinc-400 flex justify-between">
            <span>Coût au km</span>
            <span className="font-semibold text-zinc-300">
              {stats.costPerKm > 0 ? `${stats.costPerKm.toFixed(3)} €/km` : '-'}
            </span>
          </div>
        </div>

        {/* Distance Totale */}
        <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-xs font-medium">Distance Totale</span>
            <Fuel className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-zinc-100 tracking-tight">
            {stats.totalDistance.toLocaleString('fr-FR')}
            <span className="text-xs font-normal text-zinc-400 ml-1">km</span>
          </div>
          <div className="mt-2 pt-2 border-t border-zinc-800/60 text-[11px] text-zinc-400 flex justify-between">
            <span>Compteur actuel</span>
            <span className="font-semibold text-zinc-300">
              {stats.currentMileage.toLocaleString('fr-FR')} km
            </span>
          </div>
        </div>

        {/* Total Carburant Dépensé */}
        <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-xs font-medium">Total Dépensé</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-zinc-100 tracking-tight">
            {stats.totalFuelCost.toFixed(2)}
            <span className="text-xs font-normal text-zinc-400 ml-1">€</span>
          </div>
          <div className="mt-2 pt-2 border-t border-zinc-800/60 text-[11px] text-zinc-400 flex justify-between">
            <span>Litres totaux</span>
            <span className="font-semibold text-zinc-300">
              {stats.totalLiters.toFixed(1)} L
            </span>
          </div>
        </div>
      </div>

      {/* Visual Graphs if at least 2 entries */}
      {fuels.length >= 2 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Évolution de la consommation (L/100 km)
              </h3>
              <span className="text-xs text-amber-400 font-bold">
                Moy. {stats.averageConsumption.toFixed(2)} L
              </span>
            </div>
            <div className="h-44 w-full">
              <Line data={consumptionChartData} options={chartOptions} />
            </div>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Évolution du prix au litre (€/L)
              </h3>
              <span className="text-xs text-emerald-400 font-bold">
                Moy. {stats.averagePricePerLiter.toFixed(3)} €
              </span>
            </div>
            <div className="h-44 w-full">
              <Line data={priceChartData} options={chartOptions} />
            </div>
          </div>
        </div>
      )}

      {/* Fuel Entries History List */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
              Historique des pleins ({fuels.length})
            </h2>
            <p className="text-xs text-zinc-400">Classé du plus récent au plus ancien</p>
          </div>
          {fuels.length > 0 && (
            <span className="text-xs bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-full border border-zinc-700">
              Réservoir : {activeMoto.tankCapacity}L
            </span>
          )}
        </div>

        {fuels.length === 0 ? (
          <div className="p-10 text-center text-zinc-500">
            <Fuel className="w-12 h-12 mx-auto stroke-1 mb-2 text-zinc-600" />
            <p className="font-medium text-zinc-300">Aucun plein enregistré pour cette moto</p>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              Utilisez le bouton "Ajouter un plein à la pompe" pour enregistrer votre premier passage en station.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/80">
            {fuels.map((entry) => (
              <div
                key={entry.id}
                className="p-4 hover:bg-zinc-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {/* Left side: Date, Brand, Station & Mileage */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-200 bg-zinc-800 px-2 py-0.5 rounded-md border border-zinc-700">
                      {formatDateFr(entry.date)}
                    </span>
                    <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                      {entry.brand}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">
                      {entry.fuelType}
                    </span>
                  </div>

                  <div className="text-xs text-zinc-300 font-medium">
                    {entry.stationName || 'Station non précisée'}
                  </div>

                  <div className="text-[11px] text-zinc-400 flex items-center gap-2">
                    <span>Compteur : {entry.currentMileage.toLocaleString('fr-FR')} km</span>
                    <span>•</span>
                    <span className="text-zinc-200 font-semibold flex items-center gap-1">
                      {entry.distanceInputMode === 'trip' && (
                        <span className="text-[10px] bg-zinc-800 text-amber-400 px-1.5 py-0.2 rounded border border-amber-500/30">
                          Trip 1
                        </span>
                      )}
                      +{entry.distance} km
                    </span>
                  </div>

                  {entry.notes && (
                    <p className="text-[11px] text-zinc-500 italic mt-0.5">
                      « {entry.notes} »
                    </p>
                  )}
                </div>

                {/* Right side: Consumption & Cost */}
                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-800/60">
                  <div className="text-left sm:text-right">
                    <div className="text-base font-black text-zinc-100">
                      {entry.consumption.toFixed(2)}{' '}
                      <span className="text-xs font-normal text-zinc-400">L/100</span>
                    </div>
                    <div className="text-xs text-zinc-400">
                      {entry.liters.toFixed(2)} L à {entry.pricePerLiter.toFixed(3)} €/L
                    </div>
                    <div className="text-xs font-bold text-emerald-400 mt-0.5">
                      {entry.totalPrice.toFixed(2)} €
                    </div>
                  </div>

                  {/* Actions: Edit & Delete */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(entry)}
                      className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all active:scale-95"
                      title="Modifier ce plein"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="p-2 rounded-xl bg-zinc-800/80 hover:bg-rose-950 text-zinc-400 hover:text-rose-400 transition-all active:scale-95"
                      title="Supprimer ce plein"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal d'ajout ou modification de plein */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto shadow-2xl p-5 space-y-4 animate-in fade-in slide-in-from-bottom duration-200">
            {/* Header modal */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Fuel className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-100">
                    {editingEntry ? 'Modifier le plein' : 'Nouveau plein à la pompe'}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Moto : {activeMoto.make} {activeMoto.model}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFuel} className="space-y-4">
              {/* Date Input (Default today, editable) */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  Date du plein (du jour préremplie)
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm font-medium text-zinc-100 focus:outline-none focus:border-amber-500 transition-colors"
                  required
                />
                {errors.date && (
                  <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> {errors.date}
                  </p>
                )}
              </div>

              {/* Choix du mode de relevé kilométrique (Trip 1 ou Compteur Total) */}
              <div className="bg-zinc-800/80 p-1.5 rounded-2xl border border-zinc-700/80">
                <span className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider px-2 pt-1 pb-1.5">
                  Comment relevez-vous vos kilomètres ?
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setInputMode('trip')}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                      inputMode === 'trip'
                        ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                        : 'bg-zinc-800/90 text-zinc-300 hover:bg-zinc-700 border border-zinc-700/60'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Trip 1 (Remis à 0)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInputMode('odometer')}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                      inputMode === 'odometer'
                        ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                        : 'bg-zinc-800/90 text-zinc-300 hover:bg-zinc-700 border border-zinc-700/60'
                    }`}
                  >
                    <Gauge className="w-3.5 h-3.5" />
                    <span>Compteur total (ODO)</span>
                  </button>
                </div>
              </div>

              {/* Saisie adaptée selon le mode choisi */}
              {inputMode === 'trip' ? (
                /* MODE TRIP 1 : Saisie directe du trip partiel */
                <div className="space-y-2 bg-amber-500/5 p-3.5 rounded-2xl border border-amber-500/20">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5" />
                      Kilomètres affichés sur le Trip 1
                    </label>
                    <span className="text-[10px] text-zinc-400 font-medium">
                      Depuis le dernier plein
                    </span>
                  </div>

                  <input
                    type="number"
                    step="0.1"
                    inputMode="decimal"
                    placeholder="Ex: 285.4"
                    value={distance}
                    onChange={(e) => handleTripChange(e.target.value)}
                    className="w-full bg-zinc-800 border-2 border-amber-500/60 rounded-xl px-3.5 py-3 text-xl font-black text-amber-400 focus:outline-none focus:border-amber-400"
                    autoFocus
                    required
                  />

                  {/* Compteur total calculé automatiquement */}
                  <div className="flex items-center justify-between text-xs text-zinc-300 pt-1">
                    <span className="text-zinc-400">Compteur global déduit :</span>
                    <span className="font-bold text-zinc-200">
                      {currentMileage ? `${parseFloat(currentMileage).toLocaleString('fr-FR')} km` : `${latestMileage} km`}
                    </span>
                  </div>

                  {/* Petit rappel pour le motard */}
                  <label className="flex items-center gap-2 cursor-pointer pt-2 border-t border-zinc-800/80">
                    <input
                      type="checkbox"
                      checked={tripResetChecked}
                      onChange={(e) => setTripResetChecked(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-0"
                    />
                    <span className="text-xs text-zinc-300 font-medium flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Pensez à remettre votre Trip 1 à zéro à la pompe !
                    </span>
                  </label>

                  {errors.distance && (
                    <p className="text-xs text-rose-400">{errors.distance}</p>
                  )}
                </div>
              ) : (
                /* MODE COMPTEUR TOTAL ODO : Saisie classique */
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                      Km au compteur global
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder={`Ex: ${latestMileage + 250}`}
                      value={currentMileage}
                      onChange={(e) => handleCurrentMileageChange(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-base font-bold text-zinc-100 focus:outline-none focus:border-amber-500"
                      required
                    />
                    <span className="text-[10px] text-zinc-500 mt-0.5 block">
                      Dernier : {latestMileage} km
                    </span>
                    {errors.currentMileage && (
                      <p className="text-xs text-rose-400 mt-1">{errors.currentMileage}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                      Km calculés
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      inputMode="decimal"
                      placeholder="Auto-calculé"
                      value={distance}
                      onChange={(e) => setDistance(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-base font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                      required
                    />
                    <span className="text-[10px] text-zinc-500 mt-0.5 block">
                      Distance de ce plein
                    </span>
                    {errors.distance && (
                      <p className="text-xs text-rose-400 mt-1">{errors.distance}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Litres ajoutés & Prix total */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Nombre de litres
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    placeholder={`Max ${activeMoto.tankCapacity}L`}
                    value={liters}
                    onChange={(e) => setLiters(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-base font-bold text-zinc-100 focus:outline-none focus:border-amber-500"
                    required
                  />
                  {errors.liters && (
                    <p className="text-xs text-rose-400 mt-1">{errors.liters}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Prix total payé (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="Ex: 27.50"
                    value={totalPrice}
                    onChange={(e) => setTotalPrice(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-base font-bold text-emerald-400 focus:outline-none focus:border-amber-500"
                    required
                  />
                  {errors.totalPrice && (
                    <p className="text-xs text-rose-400 mt-1">{errors.totalPrice}</p>
                  )}
                </div>
              </div>

              {/* Prix au litre calculé en temps réel */}
              <div className="bg-zinc-800/80 border border-zinc-700/80 rounded-2xl p-3 flex items-center justify-between">
                <div>
                  <span className="text-xs text-zinc-400 block font-medium">Prix au litre calculé</span>
                  <span className="text-xs text-zinc-500">Formule : Prix total / Litres</span>
                </div>
                <div className="text-xl font-black text-amber-400">
                  {pricePerLiterCalculated} <span className="text-xs font-medium text-zinc-400">€/L</span>
                </div>
              </div>

              {/* Enseigne (TotalEnergies par défaut, Carrefour, E.Leclerc...) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    Enseigne
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowNewBrandModal(true)}
                    className="text-[11px] font-semibold text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Nouvelle enseigne
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {settings.brands.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBrand(b)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        brand === b
                          ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Carburant (SP98 par défaut, SP95, E10...) */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Carburant
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {settings.fuelTypes.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFuelType(f)}
                      className={`py-2 text-center rounded-xl text-xs font-bold transition-all ${
                        fuelType === f
                          ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Station libre ou sélection */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  Nom ou adresse de la station
                </label>
                <input
                  type="text"
                  placeholder="Ex: TotalEnergies Relais Bercy ou Leclerc..."
                  value={stationName}
                  onChange={(e) => setStationName(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  Notes facultatives
                </label>
                <input
                  type="text"
                  placeholder="Ex: Duo, autoroute, pression pneus vérifiée..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-sm transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  {editingEntry ? 'Enregistrer les modifications' : 'Valider le plein'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal ajout d'une enseigne personnalisée */}
      {showNewBrandModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-sm rounded-2xl p-4 space-y-3">
            <h4 className="text-sm font-bold text-zinc-100">Ajouter une enseigne</h4>
            <input
              type="text"
              placeholder="Ex: Avia, Eni, Match..."
              value={newBrandName}
              onChange={(e) => setNewBrandName(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
              autoFocus
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewBrandModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:bg-zinc-800"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleAddNewBrand}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-zinc-950 hover:bg-amber-400"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

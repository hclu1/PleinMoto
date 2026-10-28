import React, { useState, useEffect, useRef } from 'react';
import type { Moto, MaintenanceEntry, MaintenanceType, AppSettings } from '../types';
import { StorageService } from '../services/storage';
import {
  estimateNextMaintenance,
  getTodayDateString,
  formatDateFr,
} from '../utils/calculations';
import {
  Plus,
  Wrench,
  Calendar,
  Camera,
  Trash2,
  Edit2,
  X,
  AlertCircle,
  Clock,
  Image as ImageIcon,
  UserCheck,
  Building2,
} from 'lucide-react';

interface MaintenancePageProps {
  activeMoto: Moto;
  settings: AppSettings;
  onRefreshData: () => void;
}

const MAINTENANCE_TYPES: { id: MaintenanceType; label: string; icon: string }[] = [
  { id: 'revision', label: 'Révision', icon: '🔧' },
  { id: 'vidange', label: 'Vidange', icon: '🛢️' },
  { id: 'pneus', label: 'Pneus', icon: '🛞' },
  { id: 'plaquettes', label: 'Plaquettes', icon: '🛑' },
  { id: 'courroie', label: 'Courroie', icon: '🔄' },
  { id: 'chaine', label: 'Chaîne', icon: '⛓️' },
  { id: 'reparation', label: 'Réparation', icon: '🛠️' },
  { id: 'autre', label: 'Autre', icon: '📋' },
];

export const MaintenancePage: React.FC<MaintenancePageProps> = ({
  activeMoto,
  settings,
  onRefreshData,
}) => {
  const [entries, setEntries] = useState<MaintenanceEntry[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MaintenanceEntry | null>(null);

  // Form states
  const [date, setDate] = useState<string>(getTodayDateString());
  const [type, setType] = useState<MaintenanceType>('revision');
  const [provider, setProvider] = useState<string>('Concessionnaire');
  const [isSelfService, setIsSelfService] = useState<boolean>(false);
  const [mileage, setMileage] = useState<string>('');
  const [cost, setCost] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [photoUri, setPhotoUri] = useState<string | undefined>(undefined);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // Active photo modal for preview
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validation
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const loadMaintenance = () => {
    const list = StorageService.getMaintenanceEntries(activeMoto.id);
    setEntries(list);
  };

  useEffect(() => {
    loadMaintenance();
  }, [activeMoto.id]);

  // Current mileage from latest fuel or initial
  const fuels = StorageService.getFuelEntries(activeMoto.id);
  const currentMileage = fuels.length > 0 ? fuels[0].currentMileage : activeMoto.initialMileage;

  // Next maintenance estimation
  const nextEstimate = estimateNextMaintenance(
    currentMileage,
    entries,
    settings.maintenanceIntervalKm || 5000
  );

  const resetForm = () => {
    setDate(getTodayDateString());
    setType('revision');
    setProvider('Concessionnaire');
    setIsSelfService(false);
    setMileage(currentMileage > 0 ? currentMileage.toString() : '');
    setCost('');
    setNotes('');
    setPhotoUri(undefined);
    setPhotoError(null);
    setEditingEntry(null);
    setErrors({});
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (entry: MaintenanceEntry) => {
    setEditingEntry(entry);
    setDate(entry.date);
    setType(entry.type);
    if (entry.provider === 'moi-même') {
      setIsSelfService(true);
      setProvider('moi-même');
    } else {
      setIsSelfService(false);
      setProvider(entry.provider);
    }
    setMileage(entry.mileage.toString());
    setCost(entry.cost.toString());
    setNotes(entry.notes || '');
    setPhotoUri(entry.photoUri);
    setErrors({});
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Voulez-vous vraiment supprimer cet entretien ?')) {
      StorageService.deleteMaintenanceEntry(id);
      loadMaintenance();
      onRefreshData();
    }
  };

  // Image compression via Canvas to avoid memory issues with camera photos
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setPhotoError('La photo est trop volumineuse (maximum 10 Mo).');
      return;
    }

    setPhotoError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
          setPhotoUri(compressedDataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!date) newErrors.date = 'La date est requise.';
    if (date > getTodayDateString()) {
      newErrors.date = 'La date ne peut pas être dans le futur.';
    }

    const km = parseFloat(mileage);
    if (isNaN(km) || km < 0) {
      newErrors.mileage = 'Kilométrage invalide.';
    }

    const c = parseFloat(cost);
    if (isNaN(c) || c < 0) {
      newErrors.cost = 'Coût total invalide (0 ou supérieur).';
    }

    const finalProvider = isSelfService ? 'moi-même' : provider.trim() || 'Garage';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (editingEntry) {
      const updated: MaintenanceEntry = {
        ...editingEntry,
        date,
        type,
        provider: finalProvider,
        mileage: km,
        cost: c,
        notes,
        photoUri,
      };
      StorageService.updateMaintenanceEntry(updated);
    } else {
      const newEntry: MaintenanceEntry = {
        id: 'maint-' + Date.now(),
        motoId: activeMoto.id,
        date,
        type,
        provider: finalProvider,
        mileage: km,
        cost: c,
        notes,
        photoUri,
        createdAt: new Date().toISOString(),
      };
      StorageService.addMaintenanceEntry(newEntry);
    }

    setIsModalOpen(false);
    resetForm();
    loadMaintenance();
    onRefreshData();
  };

  // Group expenses by category
  const costByCategory = entries.reduce<{ [cat: string]: number }>((acc, cur) => {
    acc[cur.type] = (acc[cur.type] || 0) + cur.cost;
    return acc;
  }, {});

  const totalMaintenanceCost = entries.reduce((acc, cur) => acc + cur.cost, 0);

  return (
    <div className="space-y-5 pb-24">
      {/* Top CTA */}
      <button
        onClick={handleOpenAddModal}
        className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-base py-4 px-6 rounded-2xl shadow-xl shadow-amber-500/25 active:scale-[0.98] transition-all cursor-pointer"
      >
        <div className="w-8 h-8 rounded-full bg-zinc-950/15 flex items-center justify-center">
          <Plus className="w-5 h-5 stroke-[3]" />
        </div>
        <span>Ajouter une révision / facture</span>
      </button>

      {/* Next Maintenance Reminder Card */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                nextEstimate.statusColor === 'green'
                  ? 'bg-emerald-500 animate-pulse'
                  : nextEstimate.statusColor === 'amber'
                  ? 'bg-amber-500 animate-bounce'
                  : 'bg-rose-500 animate-ping'
              }`}
            />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Prochaine révision estimée
            </h3>
          </div>
          <span className="text-xs font-semibold text-zinc-400">
            Intervalle : {settings.maintenanceIntervalKm.toLocaleString('fr-FR')} km
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-zinc-800/60 rounded-xl p-3.5 border border-zinc-700/60">
          <div>
            <div className="text-xl font-black text-zinc-100 tracking-tight">
              {nextEstimate.targetMileage.toLocaleString('fr-FR')} km
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              {nextEstimate.lastMileage > 0
                ? `Dernière révision effectuée à ${nextEstimate.lastMileage.toLocaleString('fr-FR')} km`
                : 'Aucune révision enregistrée (base : compteur initial)'}
            </p>
          </div>

          <div className="text-left sm:text-right">
            {nextEstimate.isOverdue ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 text-xs font-bold">
                <AlertCircle className="w-3.5 h-3.5" />
                Dépassement de {Math.abs(nextEstimate.remainingKm).toLocaleString('fr-FR')} km
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                <Clock className="w-3.5 h-3.5" />
                Dans {nextEstimate.remainingKm.toLocaleString('fr-FR')} km
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Overview Cards: Total & Categories Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Total Cost Card */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-zinc-400 block">Total Dépenses Entretien</span>
            <div className="text-2xl font-black text-zinc-100 tracking-tight mt-0.5">
              {totalMaintenanceCost.toFixed(2)} <span className="text-xs font-normal text-zinc-400">€</span>
            </div>
            <span className="text-[11px] text-zinc-500">{entries.length} intervention(s)</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Wrench className="w-6 h-6" />
          </div>
        </div>

        {/* Categories Chips */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-2">
            Par Catégorie
          </span>
          <div className="flex flex-wrap gap-2">
            {Object.entries(costByCategory).map(([cat, amount]) => {
              const item = MAINTENANCE_TYPES.find((t) => t.id === cat);
              return (
                <div
                  key={cat}
                  className="bg-zinc-800/80 border border-zinc-700/80 px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5"
                >
                  <span>{item?.icon || '🔧'}</span>
                  <span className="text-zinc-300 font-medium capitalize">{item?.label || cat} :</span>
                  <span className="font-bold text-amber-400">{amount.toFixed(0)} €</span>
                </div>
              );
            })}
            {Object.keys(costByCategory).length === 0 && (
              <span className="text-xs text-zinc-500">Aucune dépense</span>
            )}
          </div>
        </div>
      </div>

      {/* Chronological Maintenance List */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
              Historique des interventions ({entries.length})
            </h2>
            <p className="text-xs text-zinc-400">Classé du plus récent au plus ancien</p>
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="p-10 text-center text-zinc-500">
            <Wrench className="w-12 h-12 mx-auto stroke-1 mb-2 text-zinc-600" />
            <p className="font-medium text-zinc-300">Aucun entretien enregistré</p>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              Gardez une trace de vos vidanges, révisions et pièces d'usure pour préserver la valeur de votre moto.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/80">
            {entries.map((entry) => {
              const typeMeta = MAINTENANCE_TYPES.find((t) => t.id === entry.type);
              const isSelf = entry.provider.toLowerCase().includes('moi-même');

              return (
                <div
                  key={entry.id}
                  className="p-4 hover:bg-zinc-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-200 bg-zinc-800 px-2 py-0.5 rounded-md border border-zinc-700">
                        {formatDateFr(entry.date)}
                      </span>
                      <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 flex items-center gap-1">
                        <span>{typeMeta?.icon}</span>
                        <span>{typeMeta?.label || entry.type}</span>
                      </span>
                      <span className="text-xs text-zinc-400">
                        {entry.mileage.toLocaleString('fr-FR')} km
                      </span>
                    </div>

                    <div className="text-xs text-zinc-300 flex items-center gap-1.5 font-medium">
                      {isSelf ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400">
                          <UserCheck className="w-3.5 h-3.5" /> Fait par moi-même
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-zinc-300">
                          <Building2 className="w-3.5 h-3.5 text-zinc-400" /> {entry.provider}
                        </span>
                      )}
                    </div>

                    {entry.notes && (
                      <p className="text-xs text-zinc-400 italic">
                        {entry.notes}
                      </p>
                    )}

                    {/* Invoice thumbnail */}
                    {entry.photoUri && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => setSelectedPhoto(entry.photoUri || null)}
                          className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-700 transition-colors"
                        >
                          <ImageIcon className="w-3.5 h-3.5" /> Voir la facture photo
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-800/60">
                    <div className="text-left sm:text-right">
                      <div className="text-lg font-black text-emerald-400">
                        {entry.cost.toFixed(2)} €
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(entry)}
                        className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all active:scale-95"
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="p-2 rounded-xl bg-zinc-800/80 hover:bg-rose-950 text-zinc-400 hover:text-rose-400 transition-all active:scale-95"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Add / Edit Maintenance */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto shadow-2xl p-5 space-y-4 animate-in fade-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Wrench className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-100">
                    {editingEntry ? "Modifier l'intervention" : 'Nouvel entretien / révision'}
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

            <form onSubmit={handleSave} className="space-y-4">
              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  Date de l'intervention (du jour préremplie)
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm font-medium text-zinc-100 focus:outline-none focus:border-amber-500"
                  required
                />
                {errors.date && <p className="text-xs text-rose-400 mt-1">{errors.date}</p>}
              </div>

              {/* Type d'intervention */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Type d'intervention
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {MAINTENANCE_TYPES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setType(t.id)}
                      className={`p-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                        type === t.id
                          ? 'bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/20'
                          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700'
                      }`}
                    >
                      <span className="text-base">{t.icon}</span>
                      <span className="truncate w-full text-center">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Garage ou moi-même */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Prestataire
                </label>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSelfService(false);
                      if (provider === 'moi-même') setProvider('Concessionnaire');
                    }}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      !isSelfService
                        ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                        : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" /> Garage / Concession
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSelfService(true);
                      setProvider('moi-même');
                    }}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      isSelfService
                        ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                        : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" /> Fait par moi-même
                  </button>
                </div>

                {!isSelfService && (
                  <input
                    type="text"
                    placeholder="Nom du garage ou concessionnaire"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                )}
              </div>

              {/* Kilométrage & Coût */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Km au moment des travaux
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="Ex: 5000"
                    value={mileage}
                    onChange={(e) => setMileage(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-base font-bold text-zinc-100 focus:outline-none focus:border-amber-500"
                    required
                  />
                  {errors.mileage && (
                    <p className="text-xs text-rose-400 mt-1">{errors.mileage}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Coût total (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="Ex: 149.00"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-base font-bold text-emerald-400 focus:outline-none focus:border-amber-500"
                    required
                  />
                  {errors.cost && (
                    <p className="text-xs text-rose-400 mt-1">{errors.cost}</p>
                  )}
                </div>
              </div>

              {/* Notes et description */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  Détail de l'intervention / pièces remplacées
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Huile Motul 10W40, filtre à huile, purge liquide de freins..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Photo de facture locale */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                  Photo de la facture (stockée localement)
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />

                {photoUri ? (
                  <div className="relative rounded-xl overflow-hidden border border-zinc-700 bg-zinc-950 max-h-40 flex items-center justify-center group">
                    <img
                      src={photoUri}
                      alt="Facture"
                      className="object-contain max-h-40 w-full"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg bg-zinc-800 text-xs font-semibold text-zinc-200 hover:bg-zinc-700"
                      >
                        Changer
                      </button>
                      <button
                        type="button"
                        onClick={() => setPhotoUri(undefined)}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 text-xs font-semibold text-white hover:bg-rose-500"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-4 border-2 border-dashed border-zinc-700 hover:border-amber-500 rounded-2xl flex flex-col items-center justify-center gap-1 text-zinc-400 hover:text-amber-400 transition-colors bg-zinc-800/40"
                  >
                    <Camera className="w-6 h-6" />
                    <span className="text-xs font-semibold">
                      Prendre en photo ou importer la facture
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      Compressée et stockée 100% sur votre iPhone
                    </span>
                  </button>
                )}
                {photoError && (
                  <p className="text-xs text-rose-400 mt-1">{photoError}</p>
                )}
              </div>

              {/* Buttons */}
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
                  {editingEntry ? 'Sauvegarder' : "Ajouter l'intervention"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo inspection modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 animate-in fade-in">
          <div className="relative max-w-2xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-12 right-0 p-2 bg-zinc-800 rounded-full text-zinc-200 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedPhoto}
              alt="Facture pleine taille"
              className="rounded-2xl max-h-[85vh] object-contain border border-zinc-800 shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};

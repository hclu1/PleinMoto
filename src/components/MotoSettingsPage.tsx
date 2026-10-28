import React, { useState, useRef } from 'react';
import type { Moto, AppSettings } from '../types';
import { StorageService } from '../services/storage';
import { getTodayDateString } from '../utils/calculations';
import {
  Bike,
  Plus,
  Trash2,
  Check,
  Save,
  Upload,
  FileSpreadsheet,
  FileJson,
  Sparkles,
  Smartphone,
  X,
  ShieldCheck,
} from 'lucide-react';

interface MotoSettingsPageProps {
  activeMoto: Moto;
  allMotos: Moto[];
  settings: AppSettings;
  onSelectMoto: (motoId: string) => void;
  onUpdateMoto: (moto: Moto) => void;
  onRefreshAll: () => void;
  isAddModalOpenInitially?: boolean;
}

export const MotoSettingsPage: React.FC<MotoSettingsPageProps> = ({
  activeMoto,
  allMotos,
  settings,
  onSelectMoto,
  onUpdateMoto,
  onRefreshAll,
  isAddModalOpenInitially = false,
}) => {
  // Moto form states for the active moto
  const [make, setMake] = useState(activeMoto.make);
  const [model, setModel] = useState(activeMoto.model);
  const [year, setYear] = useState(activeMoto.year.toString());
  const [defaultFuel, setDefaultFuel] = useState(activeMoto.defaultFuel);
  const [tankCapacity, setTankCapacity] = useState(activeMoto.tankCapacity.toString());
  const [purchasePrice, setPurchasePrice] = useState(
    activeMoto.purchasePrice !== null ? activeMoto.purchasePrice.toString() : ''
  );
  const [initialMileage, setInitialMileage] = useState(activeMoto.initialMileage.toString());
  const [purchaseDate, setPurchaseDate] = useState(activeMoto.purchaseDate || getTodayDateString());
  const [isSold, setIsSold] = useState(activeMoto.isSold || false);
  const [resalePrice, setResalePrice] = useState(
    activeMoto.resalePrice !== null ? activeMoto.resalePrice?.toString() || '' : ''
  );
  const [resaleDate, setResaleDate] = useState(activeMoto.resaleDate || '');
  const [notes, setNotes] = useState(activeMoto.notes || '');

  const [saveSuccess, setSaveSuccess] = useState(false);

  // Add new moto modal
  const [isAddMotoModalOpen, setIsAddMotoModalOpen] = useState(isAddModalOpenInitially);
  const [newMake, setNewMake] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newYear, setNewYear] = useState('2026');
  const [newFuel, setNewFuel] = useState('SP98');
  const [newTank, setNewTank] = useState('15');
  const [newPurchasePrice, setNewPurchasePrice] = useState('');
  const [newInitialKm, setNewInitialKm] = useState('0');

  // Enseignes management
  const [brands, setBrands] = useState<string[]>(settings.brands);
  const [newBrandInput, setNewBrandInput] = useState('');

  // Import JSON file input ref
  const importFileRef = useRef<HTMLInputElement>(null);

  // App Store / Smartphone deployment guide accordion
  const [showDeploymentGuide, setShowDeploymentGuide] = useState(false);

  // Sync state when activeMoto changes
  React.useEffect(() => {
    setMake(activeMoto.make);
    setModel(activeMoto.model);
    setYear(activeMoto.year.toString());
    setDefaultFuel(activeMoto.defaultFuel);
    setTankCapacity(activeMoto.tankCapacity.toString());
    setPurchasePrice(activeMoto.purchasePrice !== null ? activeMoto.purchasePrice.toString() : '');
    setInitialMileage(activeMoto.initialMileage.toString());
    setPurchaseDate(activeMoto.purchaseDate || getTodayDateString());
    setIsSold(activeMoto.isSold || false);
    setResalePrice(activeMoto.resalePrice !== null ? activeMoto.resalePrice?.toString() || '' : '');
    setResaleDate(activeMoto.resaleDate || '');
    setNotes(activeMoto.notes || '');
  }, [activeMoto]);

  const handleSaveActiveMoto = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Moto = {
      ...activeMoto,
      make: make.trim() || 'Moto',
      model: model.trim() || 'Modèle',
      year: parseInt(year) || 2026,
      defaultFuel: defaultFuel || 'SP98',
      tankCapacity: parseFloat(tankCapacity) || 16,
      purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
      initialMileage: parseFloat(initialMileage) || 0,
      purchaseDate,
      isSold,
      resalePrice: isSold && resalePrice ? parseFloat(resalePrice) : null,
      resaleDate: isSold ? resaleDate : null,
      notes,
    };

    StorageService.updateMoto(updated);
    onUpdateMoto(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleCreateMoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMake.trim() || !newModel.trim()) return;

    const newMoto: Moto = {
      id: 'moto-' + Date.now(),
      make: newMake.trim(),
      model: newModel.trim(),
      year: parseInt(newYear) || 2026,
      defaultFuel: newFuel,
      tankCapacity: parseFloat(newTank) || 15,
      purchasePrice: newPurchasePrice ? parseFloat(newPurchasePrice) : null,
      initialMileage: parseFloat(newInitialKm) || 0,
      purchaseDate: getTodayDateString(),
      isSold: false,
      resalePrice: null,
      resaleDate: null,
      isActive: true, // Auto-activate newly created moto
      notes: '',
      createdAt: new Date().toISOString(),
    };

    StorageService.addMoto(newMoto);
    onSelectMoto(newMoto.id);
    setIsAddMotoModalOpen(false);
    setNewMake('');
    setNewModel('');
    setNewPurchasePrice('');
    onRefreshAll();
  };

  const handleDeleteMoto = (motoId: string) => {
    if (allMotos.length <= 1) {
      alert('Vous devez conserver au moins un profil de moto.');
      return;
    }
    const target = allMotos.find((m) => m.id === motoId);
    if (
      window.confirm(
        `Supprimer définitivement la moto "${target?.make} ${target?.model}" ainsi que tous ses pleins et factures ?`
      )
    ) {
      StorageService.deleteMoto(motoId);
      onRefreshAll();
    }
  };

  const handleAddBrand = () => {
    const b = newBrandInput.trim();
    if (b && !brands.includes(b)) {
      const updated = [...brands, b];
      setBrands(updated);
      StorageService.saveSettings({ ...settings, brands: updated });
      setNewBrandInput('');
    }
  };

  const handleDeleteBrand = (brandToDelete: string) => {
    if (brands.length <= 1) return;
    const updated = brands.filter((b) => b !== brandToDelete);
    setBrands(updated);
    StorageService.saveSettings({ ...settings, brands: updated });
  };

  // Export CSV
  const handleExportCSV = () => {
    const csv = StorageService.exportCSV(activeMoto.id);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moto-carburant-${activeMoto.make}-${activeMoto.model}-${getTodayDateString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export JSON
  const handleExportJSON = () => {
    const json = StorageService.exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moto-carburant-sauvegarde-${getTodayDateString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = StorageService.importJSON(content);
      if (success) {
        alert('Restauration des données effectuée avec succès !');
        onRefreshAll();
      } else {
        alert('Erreur lors de la lecture du fichier de sauvegarde JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleToggleDemo = () => {
    const targetState = !settings.isDemoMode;
    StorageService.toggleDemoData(targetState);
    onRefreshAll();
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Active Moto Profile Card & Edit Form */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Bike className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">
                Profil de la moto active
              </h2>
              <p className="text-xs text-zinc-400">
                {activeMoto.make} {activeMoto.model} ({activeMoto.year})
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
            Active
          </span>
        </div>

        <form onSubmit={handleSaveActiveMoto} className="space-y-3.5">
          {/* Marque & Modèle */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                Marque
              </label>
              <input
                type="text"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                placeholder="Ex: Kymco, Honda, Yamaha..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm font-semibold text-zinc-100 focus:outline-none focus:border-amber-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                Modèle
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Ex: CV3 575, TMAX, MT-07..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm font-semibold text-zinc-100 focus:outline-none focus:border-amber-500"
                required
              />
            </div>
          </div>

          {/* Année, Carburant, Réservoir */}
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                Année
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2026"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-2.5 py-2 text-sm font-bold text-zinc-100 focus:outline-none focus:border-amber-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                Carburant
              </label>
              <select
                value={defaultFuel}
                onChange={(e) => setDefaultFuel(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-2 py-2 text-xs font-bold text-amber-400 focus:outline-none focus:border-amber-500"
              >
                {settings.fuelTypes.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                Réservoir (L)
              </label>
              <input
                type="number"
                step="0.5"
                value={tankCapacity}
                onChange={(e) => setTankCapacity(e.target.value)}
                placeholder="16"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-2.5 py-2 text-sm font-bold text-zinc-100 focus:outline-none focus:border-amber-500"
                required
              />
            </div>
          </div>

          {/* Prix d'achat, Km initial, Date d'achat */}
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                Prix d'achat (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="Ex: 12999"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-2.5 py-2 text-sm font-bold text-emerald-400 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                Km initial
              </label>
              <input
                type="number"
                value={initialMileage}
                onChange={(e) => setInitialMileage(e.target.value)}
                placeholder="0"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-2.5 py-2 text-sm font-bold text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                Date d'achat
              </label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-2 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
              Notes & Caractéristiques
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Garantie 5 ans, couleur gris mat, révision 1000km offerte..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Save Button */}
          <div className="pt-2 flex items-center justify-between">
            {saveSuccess ? (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 animate-in fade-in">
                <Check className="w-4 h-4" /> Modifications enregistrées
              </span>
            ) : (
              <span className="text-[11px] text-zinc-500">
                Données sauvegardées instantanément en local
              </span>
            )}

            <button
              type="submit"
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs py-2.5 px-5 rounded-xl shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer le profil</span>
            </button>
          </div>
        </form>
      </div>

      {/* Multi-Motos Manager */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
              Mes motos ({allMotos.length})
            </h3>
            <p className="text-[11px] text-zinc-400">
              Une seule moto est active à la fois pour les saisies et calculs.
            </p>
          </div>
          <button
            onClick={() => setIsAddMotoModalOpen(true)}
            className="flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20"
          >
            <Plus className="w-3.5 h-3.5" /> Ajouter une moto
          </button>
        </div>

        <div className="space-y-2">
          {allMotos.map((moto) => (
            <div
              key={moto.id}
              className={`p-3 rounded-2xl border transition-colors flex items-center justify-between ${
                moto.id === activeMoto.id
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              <div className="truncate pr-2">
                <div className="flex items-center gap-2 font-bold text-sm text-zinc-100">
                  <span>{moto.make} {moto.model}</span>
                  {moto.id === activeMoto.id && (
                    <span className="text-[10px] font-bold bg-amber-500 text-zinc-950 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </div>
                <div className="text-xs text-zinc-400">
                  {moto.year} • {moto.defaultFuel} • Réservoir {moto.tankCapacity}L
                  {moto.purchasePrice ? ` • Achat ${moto.purchasePrice} €` : ''}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {moto.id !== activeMoto.id && (
                  <button
                    onClick={() => onSelectMoto(moto.id)}
                    className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700"
                  >
                    Activer
                  </button>
                )}
                {allMotos.length > 1 && (
                  <button
                    onClick={() => handleDeleteMoto(moto.id)}
                    className="p-2 text-zinc-500 hover:text-rose-400 rounded-xl hover:bg-zinc-800"
                    title="Supprimer cette moto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Enseignes Customization */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
          Enseignes de carburant
        </h3>
        <p className="text-[11px] text-zinc-400">
          TotalEnergies par défaut, Carrefour, E.Leclerc... Vous pouvez ajouter vos propres stations favorites.
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Nouvelle enseigne (ex: Avia, Eni...)"
            value={newBrandInput}
            onChange={(e) => setNewBrandInput(e.target.value)}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
          />
          <button
            onClick={handleAddBrand}
            className="px-4 py-2 bg-amber-500 text-zinc-950 font-bold text-xs rounded-xl hover:bg-amber-400"
          >
            Ajouter
          </button>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {brands.map((b) => (
            <span
              key={b}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-800 border border-zinc-700 text-xs font-semibold text-zinc-300"
            >
              <span>{b}</span>
              {brands.length > 1 && b !== 'TotalEnergies' && (
                <button
                  onClick={() => handleDeleteBrand(b)}
                  className="text-zinc-500 hover:text-rose-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* Demo Data & Backup / Restore */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
          Sauvegarde & Données locales
        </h3>

        {/* Demo Mode Toggle */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-800/60 border border-zinc-700/60">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <div>
              <span className="text-xs font-bold text-zinc-200 block">
                Données de démonstration
              </span>
              <span className="text-[11px] text-zinc-400">
                Précharge des pleins, révisions et accessoires pour tester l'app
              </span>
            </div>
          </div>
          <button
            onClick={handleToggleDemo}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              settings.isDemoMode
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'bg-amber-500 text-zinc-950 hover:bg-amber-400'
            }`}
          >
            {settings.isDemoMode ? 'Désactiver démo' : 'Activer démo'}
          </button>
        </div>

        {/* Protection & Persistance Status */}
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <div className="font-bold text-emerald-300">
              Protection permanente anti-perte active
            </div>
            <div className="text-zinc-400 text-[11px] mt-0.5 leading-relaxed">
              Vos pleins et entretiens sont synchronisés dans le stockage persistant natif de l'appareil (NSUserDefaults iOS + IndexedDB). Votre historique est automatiquement conservé et restauré lors des mises à jour de l'application.
            </div>
          </div>
        </div>

        {/* Export / Import buttons */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 py-3 px-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-bold transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Exporter en CSV</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="flex items-center justify-center gap-2 py-3 px-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-bold transition-all"
          >
            <FileJson className="w-4 h-4 text-amber-400" />
            <span>Sauvegarder JSON</span>
          </button>
        </div>

        {/* Restore input */}
        <div>
          <input
            ref={importFileRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImportJSON}
            className="hidden"
          />
          <button
            onClick={() => importFileRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-zinc-800/40 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-dashed border-zinc-700 text-xs font-semibold transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>Restaurer une sauvegarde JSON</span>
          </button>
        </div>
      </div>

      {/* Guide Installation Smartphone & App Store */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 shadow-sm space-y-3">
        <button
          onClick={() => setShowDeploymentGuide(!showDeploymentGuide)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-amber-400" />
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
              Installation sur iPhone & Guide App Store
            </h3>
          </div>
          <span className="text-xs text-amber-400 font-semibold">
            {showDeploymentGuide ? 'Masquer' : 'Afficher le guide'}
          </span>
        </button>

        {showDeploymentGuide && (
          <div className="text-xs text-zinc-400 space-y-3 pt-3 border-t border-zinc-800 animate-in fade-in">
            <div className="bg-zinc-800/60 p-3.5 rounded-2xl border border-zinc-700/60 space-y-1.5">
              <span className="font-bold text-zinc-200 block">
                📲 1. Installation instantanée sur iPhone (PWA Standalone) :
              </span>
              <p>
                Ouvrez Safari sur votre iPhone, accédez à l'URL de l'application, touchez le bouton <strong>Partager</strong> (le carré avec flèche vers le haut), puis choisissez <strong>« Sur l'écran d'accueil »</strong>. L'application s'installera avec son icône native et fonctionnera 100% hors-ligne.
              </p>
            </div>

            <div className="bg-zinc-800/60 p-3.5 rounded-2xl border border-zinc-700/60 space-y-1.5">
              <span className="font-bold text-zinc-200 block">
                🍏 2. Build natif iOS avec Capacitor & Xcode :
              </span>
              <p>
                Le projet est configuré avec Capacitor iOS. Exécutez :
              </p>
              <pre className="bg-zinc-950 p-2.5 rounded-xl text-zinc-300 font-mono text-[11px] overflow-x-auto">
npm run build
npx cap add ios
npx cap open ios
              </pre>
              <p>
                Xcode ouvrira directement le projet natif iOS pour le compiler sur votre iPhone physique ou générer l'archive `.ipa` pour TestFlight.
              </p>
            </div>

            <div className="bg-zinc-800/60 p-3.5 rounded-2xl border border-zinc-700/60 space-y-1.5">
              <span className="font-bold text-zinc-200 block">
                🚀 3. Commercialisation & Publication App Store Connect :
              </span>
              <ul className="list-disc list-inside space-y-1 text-zinc-400">
                <li>Modèle sans compte obligatoire respectant la Guideline 5.1.1(v) d'Apple.</li>
                <li>Toutes les données restent sur le terminal (Zéro collecte distante, conformité RGPD & Apple Privacy Nutrition Labels).</li>
                <li>La géolocalisation pour les stations est déclarée avec autorisation explicite à la demande.</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Modal Add New Moto */}
      {isAddMotoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-md rounded-3xl p-5 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Bike className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-zinc-100">
                  Ajouter une nouvelle moto
                </h3>
              </div>
              <button
                onClick={() => setIsAddMotoModalOpen(false)}
                className="p-1.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMoto} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Marque
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Yamaha"
                    value={newMake}
                    onChange={(e) => setNewMake(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Modèle
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: MT-09"
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Année
                  </label>
                  <input
                    type="number"
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-2.5 py-2 text-sm font-bold text-zinc-100 focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Carburant
                  </label>
                  <select
                    value={newFuel}
                    onChange={(e) => setNewFuel(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-2 py-2 text-xs font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                  >
                    {settings.fuelTypes.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Réservoir (L)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={newTank}
                    onChange={(e) => setNewTank(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-2.5 py-2 text-sm font-bold text-zinc-100 focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Prix d'achat (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Optionnel"
                    value={newPurchasePrice}
                    onChange={(e) => setNewPurchasePrice(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm font-bold text-emerald-400 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Km au compteur initial
                  </label>
                  <input
                    type="number"
                    value={newInitialKm}
                    onChange={(e) => setNewInitialKm(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm font-bold text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddMotoModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-semibold text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs"
                >
                  Créer et activer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

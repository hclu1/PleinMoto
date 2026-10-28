import React, { useState, useEffect } from 'react';
import type { Moto, FuelEntry, MaintenanceEntry, ExpenseEntry, ExpenseCategory } from '../types';
import { StorageService } from '../services/storage';
import { computeTco, getTodayDateString, formatDateFr } from '../utils/calculations';
import { Doughnut } from 'react-chartjs-2';
import '../utils/chartConfig';
import {
  Shield,
  Package,
  Wrench,
  Fuel,
  Plus,
  Trash2,
  Tag,
  X,
} from 'lucide-react';

interface TcoPageProps {
  activeMoto: Moto;
  onRefreshData: () => void;
  onUpdateMoto: (moto: Moto) => void;
}

export const TcoPage: React.FC<TcoPageProps> = ({
  activeMoto,
  onRefreshData,
  onUpdateMoto,
}) => {
  const [fuels, setFuels] = useState<FuelEntry[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceEntry[]>([]);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);

  // Add Expense Modal
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseDate, setExpenseDate] = useState(getTodayDateString());
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('assurance');
  const [expenseLabel, setExpenseLabel] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseNotes, setExpenseNotes] = useState('');

  // Resale Modal
  const [isResaleModalOpen, setIsResaleModalOpen] = useState(false);
  const [resalePrice, setResalePrice] = useState(activeMoto.resalePrice?.toString() || '');
  const [resaleDate, setResaleDate] = useState(activeMoto.resaleDate || getTodayDateString());
  const [isSold, setIsSold] = useState(activeMoto.isSold || false);

  const loadData = () => {
    setFuels(StorageService.getFuelEntries(activeMoto.id));
    setMaintenance(StorageService.getMaintenanceEntries(activeMoto.id));
    setExpenses(StorageService.getExpenseEntries(activeMoto.id));
  };

  useEffect(() => {
    loadData();
    setIsSold(activeMoto.isSold || false);
    setResalePrice(activeMoto.resalePrice?.toString() || '');
    setResaleDate(activeMoto.resaleDate || getTodayDateString());
  }, [activeMoto]);

  const tco = computeTco(activeMoto, fuels, maintenance, expenses);

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(expenseAmount);
    if (isNaN(amt) || amt <= 0 || !expenseLabel.trim()) return;

    const newExp: ExpenseEntry = {
      id: 'exp-' + Date.now(),
      motoId: activeMoto.id,
      date: expenseDate || getTodayDateString(),
      category: expenseCategory,
      label: expenseLabel.trim(),
      amount: amt,
      notes: expenseNotes,
      createdAt: new Date().toISOString(),
    };

    StorageService.addExpenseEntry(newExp);
    setIsExpenseModalOpen(false);
    setExpenseLabel('');
    setExpenseAmount('');
    setExpenseNotes('');
    loadData();
    onRefreshData();
  };

  const handleDeleteExpense = (id: string) => {
    if (window.confirm('Supprimer cette dépense ?')) {
      StorageService.deleteExpenseEntry(id);
      loadData();
      onRefreshData();
    }
  };

  const handleSaveResale = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Moto = {
      ...activeMoto,
      isSold,
      resalePrice: isSold && resalePrice ? parseFloat(resalePrice) : null,
      resaleDate: isSold ? resaleDate : null,
    };
    StorageService.updateMoto(updated);
    onUpdateMoto(updated);
    setIsResaleModalOpen(false);
  };

  // Doughnut Chart data
  const chartData = {
    labels: ['Achat', 'Carburant', 'Entretien', 'Assurance', 'Accessoires / Autres'],
    datasets: [
      {
        data: [
          tco.purchasePrice,
          tco.totalFuelCost,
          tco.totalMaintenanceCost,
          tco.totalInsuranceCost,
          tco.totalAccessoriesCost + tco.totalOtherCost,
        ],
        backgroundColor: [
          '#6366f1', // Indigo Achat
          '#f59e0b', // Amber Carburant
          '#10b981', // Emerald Entretien
          '#ec4899', // Pink Assurance
          '#06b6d4', // Cyan Accessoires
        ],
        borderWidth: 2,
        borderColor: '#18181b',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#a1a1aa',
          font: { size: 11 },
          padding: 12,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const value = context.raw || 0;
            const total = tco.totalCostOfOwnership || 1;
            const pct = ((value / total) * 100).toFixed(1);
            return ` ${context.label} : ${value.toLocaleString('fr-FR')} € (${pct}%)`;
          },
        },
      },
    },
    cutout: '68%',
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Top Banner TCO */}
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/90 border border-zinc-800 rounded-3xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl -z-0 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Coût Total de Possession (TCO)
            </span>
            <button
              onClick={() => setIsResaleModalOpen(true)}
              className={`text-xs px-3 py-1 rounded-full border font-semibold transition-all ${
                activeMoto.isSold
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
              }`}
            >
              {activeMoto.isSold ? '🏷️ Moto Vendue' : 'Simuler revente'}
            </button>
          </div>

          <div className="text-3xl sm:text-4xl font-black text-zinc-100 tracking-tight mt-1.5">
            {tco.totalCostOfOwnership.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}{' '}
            <span className="text-sm font-normal text-zinc-400">€</span>
          </div>

          <p className="text-xs text-zinc-400 mt-1">
            Distance totale prise en compte : {tco.totalDistance.toLocaleString('fr-FR')} km
          </p>

          {/* Coût au km (avec et sans achat) */}
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-zinc-800/80">
            <div className="bg-zinc-800/60 p-3 rounded-2xl border border-zinc-700/60">
              <span className="text-[11px] text-zinc-400 block font-medium">Coût global au km</span>
              <span className="text-xs text-zinc-500 block mb-1">(Avec prix d'achat)</span>
              <div className="text-xl font-black text-amber-400">
                {tco.costPerKmWithPurchase > 0 ? tco.costPerKmWithPurchase.toFixed(3) : '-.---'}{' '}
                <span className="text-xs font-normal text-zinc-400">€/km</span>
              </div>
            </div>

            <div className="bg-zinc-800/60 p-3 rounded-2xl border border-zinc-700/60">
              <span className="text-[11px] text-zinc-400 block font-medium">Coût d'usage au km</span>
              <span className="text-xs text-zinc-500 block mb-1">(Hors prix d'achat)</span>
              <div className="text-xl font-black text-emerald-400">
                {tco.costPerKmWithoutPurchase > 0 ? tco.costPerKmWithoutPurchase.toFixed(3) : '-.---'}{' '}
                <span className="text-xs font-normal text-zinc-400">€/km</span>
              </div>
            </div>
          </div>

          {/* Resale Info if sold */}
          {activeMoto.isSold && (
            <div className="mt-3 bg-zinc-800/80 rounded-2xl p-3 border border-amber-500/30 text-xs space-y-1">
              <div className="flex justify-between font-bold text-zinc-200">
                <span>Prix de revente :</span>
                <span className="text-emerald-400">+{tco.resalePrice.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Moins-value :</span>
                <span className="text-rose-400">-{tco.depreciationLoss.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between font-bold text-amber-400 pt-1 border-t border-zinc-700">
                <span>Coût réel net après revente :</span>
                <span>{tco.netRealCost.toFixed(2)} € ({tco.netCostPerKm.toFixed(3)} €/km)</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Visual Chart Doughnut Breakdown */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
          Répartition Visuelle des Coûts
        </h3>
        <div className="h-56 w-full flex items-center justify-center">
          <Doughnut data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Breakdown Items List */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
            Détail par poste de dépense
          </h3>
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20"
          >
            <Plus className="w-3.5 h-3.5" /> Ajouter assurance / équipement
          </button>
        </div>

        <div className="space-y-2 text-sm">
          {/* Achat */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-800/60 border border-zinc-700/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-zinc-200 block">Prix d'achat initial</span>
                <span className="text-[11px] text-zinc-500">
                  {activeMoto.purchaseDate ? `Acquise le ${formatDateFr(activeMoto.purchaseDate)}` : 'Non renseigné'}
                </span>
              </div>
            </div>
            <span className="font-bold text-zinc-100">
              {tco.purchasePrice.toLocaleString('fr-FR')} €
            </span>
          </div>

          {/* Carburant */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-800/60 border border-zinc-700/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Fuel className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-zinc-200 block">Total Carburant</span>
                <span className="text-[11px] text-zinc-500">{fuels.length} pleins enregistrés</span>
              </div>
            </div>
            <span className="font-bold text-zinc-100">
              {tco.totalFuelCost.toFixed(2)} €
            </span>
          </div>

          {/* Entretien */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-800/60 border border-zinc-700/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Wrench className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-zinc-200 block">Total Entretien & Révisions</span>
                <span className="text-[11px] text-zinc-500">{maintenance.length} interventions</span>
              </div>
            </div>
            <span className="font-bold text-zinc-100">
              {tco.totalMaintenanceCost.toFixed(2)} €
            </span>
          </div>

          {/* Assurance */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-800/60 border border-zinc-700/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-zinc-200 block">Assurance</span>
                <span className="text-[11px] text-zinc-500">Cotisations et options</span>
              </div>
            </div>
            <span className="font-bold text-zinc-100">
              {tco.totalInsuranceCost.toFixed(2)} €
            </span>
          </div>

          {/* Équipements & Accessoires */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-800/60 border border-zinc-700/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-zinc-200 block">Équipements & Accessoires</span>
                <span className="text-[11px] text-zinc-500">Casque, top case, antivol, tablier...</span>
              </div>
            </div>
            <span className="font-bold text-zinc-100">
              {(tco.totalAccessoriesCost + tco.totalOtherCost).toFixed(2)} €
            </span>
          </div>
        </div>
      </div>

      {/* Secondary Expenses List (Assurance, Top Case, etc.) */}
      {expenses.length > 0 && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 mb-3">
            Dépenses annexes enregistrées ({expenses.length})
          </h3>
          <div className="divide-y divide-zinc-800/70">
            {expenses.map((exp) => (
              <div key={exp.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-zinc-200">{exp.label}</div>
                  <div className="text-[11px] text-zinc-500 flex items-center gap-2">
                    <span>{formatDateFr(exp.date)}</span>
                    <span>•</span>
                    <span className="capitalize">{exp.category}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-zinc-200">{exp.amount.toFixed(2)} €</span>
                  <button
                    onClick={() => handleDeleteExpense(exp.id)}
                    className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-zinc-800 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Add Expense (Assurance / Equipement) */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 space-y-4 animate-in fade-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-zinc-100">
                Ajouter une dépense (Assurance, Accessoire...)
              </h3>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  Catégorie
                </label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value as ExpenseCategory)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="assurance">Assurance (cotisation, franchise)</option>
                  <option value="equipement">Équipement pilote (casque, blouson, gants)</option>
                  <option value="accessoire">Accessoire moto (top case, poignées, support)</option>
                  <option value="autre">Autre dépense (péage, stationnement, antivol)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  Libellé
                </label>
                <input
                  type="text"
                  placeholder="Ex: Assurance tous risques annuelle, Casque Shoei..."
                  value={expenseLabel}
                  onChange={(e) => setExpenseLabel(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Montant (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 580.00"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 font-bold text-emerald-400 focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-semibold text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Resale Simulation / Configuration */}
      {isResaleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-sm rounded-3xl p-5 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h3 className="text-sm font-bold text-zinc-100">Revente & Moins-value</h3>
              <button
                onClick={() => setIsResaleModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveResale} className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer bg-zinc-800/80 p-3 rounded-xl border border-zinc-700">
                <input
                  type="checkbox"
                  checked={isSold}
                  onChange={(e) => setIsSold(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-0"
                />
                <span className="text-xs font-semibold text-zinc-200">
                  Cette moto a été revendue
                </span>
              </label>

              {isSold && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                      Prix de revente (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 8500"
                      value={resalePrice}
                      onChange={(e) => setResalePrice(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm font-bold text-emerald-400 focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                      Date de revente
                    </label>
                    <input
                      type="date"
                      value={resaleDate}
                      onChange={(e) => setResaleDate(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                </>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsResaleModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs"
                >
                  Valider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

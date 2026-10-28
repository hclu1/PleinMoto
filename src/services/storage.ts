import type { Moto, FuelEntry, MaintenanceEntry, ExpenseEntry, AppSettings } from '../types';
import { PersistentStorage } from './persistentStorage';

const STORAGE_KEYS = {
  MOTOS: 'mc_motos',
  FUELS: 'mc_fuels',
  MAINTENANCE: 'mc_maintenance',
  EXPENSES: 'mc_expenses',
  SETTINGS: 'mc_settings',
  INITIALIZED: 'mc_initialized',
};

export const DEFAULT_BRANDS = [
  'TotalEnergies',
  'Carrefour',
  'E.Leclerc',
  'BP',
  'Esso',
  'Shell',
  'Intermarché',
  'Système U',
  'Autre',
];

export const DEFAULT_FUELS = ['SP98', 'SP95', 'E10', 'E85', 'Gazole'];

export const DEFAULT_SETTINGS: AppSettings = {
  brands: DEFAULT_BRANDS,
  fuelTypes: DEFAULT_FUELS,
  maintenanceIntervalKm: 5000,
  maintenanceIntervalMonths: 12,
  isDemoMode: false,
};

export const DEFAULT_MOTO: Moto = {
  id: 'default-kymco-cv3',
  make: 'Kymco',
  model: 'CV3 575',
  year: 2026,
  defaultFuel: 'SP98',
  tankCapacity: 16,
  purchasePrice: 12999,
  purchaseDate: '2026-01-15',
  initialMileage: 0,
  isSold: false,
  resalePrice: null,
  resaleDate: null,
  isActive: true,
  notes: 'Scooter 3 roues sportif bicylindre 550cc',
  createdAt: new Date().toISOString(),
};

export const DEMO_FUELS: FuelEntry[] = [
  {
    id: 'demo-fuel-1',
    motoId: 'default-kymco-cv3',
    date: '2026-01-20',
    currentMileage: 280,
    distance: 280,
    liters: 13.5,
    totalPrice: 26.33,
    pricePerLiter: 1.95,
    brand: 'TotalEnergies',
    fuelType: 'SP98',
    stationName: 'Relais Paris Porte de Bercy',
    consumption: 4.82,
    notes: 'Premier plein de rodage',
    createdAt: '2026-01-20T10:00:00.000Z',
  },
  {
    id: 'demo-fuel-2',
    motoId: 'default-kymco-cv3',
    date: '2026-02-05',
    currentMileage: 575,
    distance: 295,
    liters: 14.1,
    totalPrice: 27.21,
    pricePerLiter: 1.93,
    brand: 'Carrefour',
    fuelType: 'SP98',
    stationName: 'Carrefour Créteil Soleil',
    consumption: 4.78,
    notes: 'Trajet urbain et voies rapides',
    createdAt: '2026-02-05T14:30:00.000Z',
  },
  {
    id: 'demo-fuel-3',
    motoId: 'default-kymco-cv3',
    date: '2026-02-22',
    currentMileage: 885,
    distance: 310,
    liters: 14.2,
    totalPrice: 27.83,
    pricePerLiter: 1.96,
    brand: 'E.Leclerc',
    fuelType: 'SP98',
    stationName: 'E.Leclerc Bonneuil',
    consumption: 4.58,
    notes: 'Très bonne autonomie sur nationale',
    createdAt: '2026-02-22T09:15:00.000Z',
  },
  {
    id: 'demo-fuel-4',
    motoId: 'default-kymco-cv3',
    date: '2026-03-12',
    currentMileage: 1180,
    distance: 295,
    liters: 14.8,
    totalPrice: 29.45,
    pricePerLiter: 1.99,
    brand: 'TotalEnergies',
    fuelType: 'SP98',
    stationName: 'Total Pont de Charenton',
    consumption: 5.02,
    notes: 'Beaucoup d’embouteillages',
    createdAt: '2026-03-12T18:45:00.000Z',
  },
  {
    id: 'demo-fuel-5',
    motoId: 'default-kymco-cv3',
    date: '2026-04-02',
    currentMileage: 1490,
    distance: 310,
    liters: 14.5,
    totalPrice: 28.57,
    pricePerLiter: 1.97,
    brand: 'TotalEnergies',
    fuelType: 'SP98',
    stationName: 'Total Paris Boulevard Périphérique',
    consumption: 4.68,
    notes: 'Sortie week-end en duo',
    createdAt: '2026-04-02T11:20:00.000Z',
  },
];

export const DEMO_MAINTENANCE: MaintenanceEntry[] = [
  {
    id: 'demo-maint-1',
    motoId: 'default-kymco-cv3',
    date: '2026-02-28',
    type: 'revision',
    provider: 'Concessionnaire Kymco Officiel',
    mileage: 1000,
    cost: 165.0,
    notes: 'Révision de fin de rodage des 1000 km : vidange moteur + filtre, contrôle transmission, serrage général.',
    createdAt: '2026-02-28T16:00:00.000Z',
  },
  {
    id: 'demo-maint-2',
    motoId: 'default-kymco-cv3',
    date: '2026-04-10',
    type: 'plaquettes',
    provider: 'moi-même',
    mileage: 1520,
    cost: 45.0,
    notes: 'Contrôle et nettoyage étriers de frein avant + liquide',
    createdAt: '2026-04-10T14:00:00.000Z',
  },
];

export const DEMO_EXPENSES: ExpenseEntry[] = [
  {
    id: 'demo-exp-1',
    motoId: 'default-kymco-cv3',
    date: '2026-01-15',
    category: 'assurance',
    label: 'Assurance tous risques annuelle (Mutuelle des Motards)',
    amount: 620.0,
    notes: 'Contrat annuel avec assistance 0km',
    createdAt: '2026-01-15T09:00:00.000Z',
  },
  {
    id: 'demo-exp-2',
    motoId: 'default-kymco-cv3',
    date: '2026-01-18',
    category: 'equipement',
    label: 'Top case Kymco 47L + support dosseret',
    amount: 380.0,
    notes: 'Accessoire officiel pour bagages et casque',
    createdAt: '2026-01-18T11:00:00.000Z',
  },
  {
    id: 'demo-exp-3',
    motoId: 'default-kymco-cv3',
    date: '2026-02-02',
    category: 'accessoire',
    label: 'Support téléphone QuadLock avec réducteur de vibrations',
    amount: 89.9,
    notes: 'Fixation guidon moto',
    createdAt: '2026-02-02T15:30:00.000Z',
  },
];

export class StorageService {
  /**
   * Initialisation et auto-restauration de la persistance multi-couches
   * (Capacitor Native iOS NSUserDefaults + IndexedDB + WebKit Persistent Storage)
   */
  static async init(): Promise<boolean> {
    return await PersistentStorage.initializeAndRestore();
  }

  static getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (data) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      }
    } catch (e) {
      console.error('Error loading settings', e);
    }
    return DEFAULT_SETTINGS;
  }

  static saveSettings(settings: AppSettings): void {
    const val = JSON.stringify(settings);
    PersistentStorage.setItem(STORAGE_KEYS.SETTINGS, val);
  }

  static getMotos(): Moto[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MOTOS);
      if (data) {
        const parsed: Moto[] = JSON.parse(data);
        if (parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading motos', e);
    }

    // Default moto on first install
    const initialMotos = [DEFAULT_MOTO];
    this.saveMotos(initialMotos);
    return initialMotos;
  }

  static saveMotos(motos: Moto[]): void {
    const val = JSON.stringify(motos);
    PersistentStorage.setItem(STORAGE_KEYS.MOTOS, val);
  }

  static getActiveMoto(): Moto {
    const motos = this.getMotos();
    const active = motos.find((m) => m.isActive);
    if (active) return active;
    if (motos.length > 0) {
      motos[0].isActive = true;
      this.saveMotos(motos);
      return motos[0];
    }
    return DEFAULT_MOTO;
  }

  static setActiveMoto(motoId: string): void {
    const motos = this.getMotos().map((m) => ({
      ...m,
      isActive: m.id === motoId,
    }));
    this.saveMotos(motos);
  }

  static updateMoto(updatedMoto: Moto): void {
    const motos = this.getMotos().map((m) =>
      m.id === updatedMoto.id ? updatedMoto : m
    );
    this.saveMotos(motos);
  }

  static addMoto(newMoto: Moto): void {
    const motos = this.getMotos();
    // if new moto is active, deactivate others
    if (newMoto.isActive) {
      motos.forEach((m) => (m.isActive = false));
    }
    motos.push(newMoto);
    this.saveMotos(motos);
  }

  static deleteMoto(motoId: string): void {
    let motos = this.getMotos().filter((m) => m.id !== motoId);
    if (motos.length === 0) {
      motos = [DEFAULT_MOTO];
    } else if (!motos.some((m) => m.isActive)) {
      motos[0].isActive = true;
    }
    this.saveMotos(motos);

    // Also remove associated data
    const fuels = this.getFuelEntries().filter((f) => f.motoId !== motoId);
    this.saveFuelEntries(fuels);
    const maint = this.getMaintenanceEntries().filter((m) => m.motoId !== motoId);
    this.saveMaintenanceEntries(maint);
    const exp = this.getExpenseEntries().filter((e) => e.motoId !== motoId);
    this.saveExpenseEntries(exp);
  }

  static getFuelEntries(motoId?: string): FuelEntry[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FUELS);
      let list: FuelEntry[] = data ? JSON.parse(data) : [];
      if (motoId) {
        list = list.filter((f) => f.motoId === motoId);
      }
      // Rule: sort descending by date (most recent first)
      return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.currentMileage - a.currentMileage);
    } catch (e) {
      console.error('Error loading fuel entries', e);
      return [];
    }
  }

  static saveFuelEntries(entries: FuelEntry[]): void {
    const val = JSON.stringify(entries);
    PersistentStorage.setItem(STORAGE_KEYS.FUELS, val);
  }

  static addFuelEntry(entry: FuelEntry): void {
    const list = this.getFuelEntries();
    list.push(entry);
    this.saveFuelEntries(list);
  }

  static updateFuelEntry(entry: FuelEntry): void {
    const list = this.getFuelEntries().map((item) =>
      item.id === entry.id ? entry : item
    );
    this.saveFuelEntries(list);
  }

  static deleteFuelEntry(id: string): void {
    const list = this.getFuelEntries().filter((item) => item.id !== id);
    this.saveFuelEntries(list);
  }

  static getMaintenanceEntries(motoId?: string): MaintenanceEntry[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MAINTENANCE);
      let list: MaintenanceEntry[] = data ? JSON.parse(data) : [];
      if (motoId) {
        list = list.filter((m) => m.motoId === motoId);
      }
      return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.mileage - a.mileage);
    } catch (e) {
      console.error('Error loading maintenance entries', e);
      return [];
    }
  }

  static saveMaintenanceEntries(entries: MaintenanceEntry[]): void {
    const val = JSON.stringify(entries);
    PersistentStorage.setItem(STORAGE_KEYS.MAINTENANCE, val);
  }

  static addMaintenanceEntry(entry: MaintenanceEntry): void {
    const list = this.getMaintenanceEntries();
    list.push(entry);
    this.saveMaintenanceEntries(list);
  }

  static updateMaintenanceEntry(entry: MaintenanceEntry): void {
    const list = this.getMaintenanceEntries().map((item) =>
      item.id === entry.id ? entry : item
    );
    this.saveMaintenanceEntries(list);
  }

  static deleteMaintenanceEntry(id: string): void {
    const list = this.getMaintenanceEntries().filter((item) => item.id !== id);
    this.saveMaintenanceEntries(list);
  }

  static getExpenseEntries(motoId?: string): ExpenseEntry[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      let list: ExpenseEntry[] = data ? JSON.parse(data) : [];
      if (motoId) {
        list = list.filter((e) => e.motoId === motoId);
      }
      return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (e) {
      console.error('Error loading expense entries', e);
      return [];
    }
  }

  static saveExpenseEntries(entries: ExpenseEntry[]): void {
    const val = JSON.stringify(entries);
    PersistentStorage.setItem(STORAGE_KEYS.EXPENSES, val);
  }

  static addExpenseEntry(entry: ExpenseEntry): void {
    const list = this.getExpenseEntries();
    list.push(entry);
    this.saveExpenseEntries(list);
  }

  static deleteExpenseEntry(id: string): void {
    const list = this.getExpenseEntries().filter((item) => item.id !== id);
    this.saveExpenseEntries(list);
  }

  static toggleDemoData(enable: boolean): void {
    const settings = this.getSettings();
    settings.isDemoMode = enable;
    this.saveSettings(settings);

    if (enable) {
      // Ensure default moto exists
      let motos = this.getMotos();
      const hasDefault = motos.some((m) => m.id === DEFAULT_MOTO.id);
      if (!hasDefault) {
        motos.push(DEFAULT_MOTO);
      }
      motos.forEach((m) => (m.isActive = m.id === DEFAULT_MOTO.id));
      this.saveMotos(motos);

      // Merge demo fuels
      const currentFuels = this.getFuelEntries();
      const nonDemoFuels = currentFuels.filter((f) => !f.id.startsWith('demo-'));
      this.saveFuelEntries([...DEMO_FUELS, ...nonDemoFuels]);

      // Merge demo maintenance
      const currentMaint = this.getMaintenanceEntries();
      const nonDemoMaint = currentMaint.filter((m) => !m.id.startsWith('demo-'));
      this.saveMaintenanceEntries([...DEMO_MAINTENANCE, ...nonDemoMaint]);

      // Merge demo expenses
      const currentExp = this.getExpenseEntries();
      const nonDemoExp = currentExp.filter((e) => !e.id.startsWith('demo-'));
      this.saveExpenseEntries([...DEMO_EXPENSES, ...nonDemoExp]);
    } else {
      // Remove demo items
      const fuels = this.getFuelEntries().filter((f) => !f.id.startsWith('demo-'));
      this.saveFuelEntries(fuels);

      const maint = this.getMaintenanceEntries().filter((m) => !m.id.startsWith('demo-'));
      this.saveMaintenanceEntries(maint);

      const exp = this.getExpenseEntries().filter((e) => !e.id.startsWith('demo-'));
      this.saveExpenseEntries(exp);
    }
  }

  static exportJSON(): string {
    const backup = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      motos: this.getMotos(),
      fuels: this.getFuelEntries(),
      maintenance: this.getMaintenanceEntries(),
      expenses: this.getExpenseEntries(),
      settings: this.getSettings(),
    };
    return JSON.stringify(backup, null, 2);
  }

  static importJSON(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.motos && Array.isArray(data.motos)) {
        this.saveMotos(data.motos);
      }
      if (data.fuels && Array.isArray(data.fuels)) {
        this.saveFuelEntries(data.fuels);
      }
      if (data.maintenance && Array.isArray(data.maintenance)) {
        this.saveMaintenanceEntries(data.maintenance);
      }
      if (data.expenses && Array.isArray(data.expenses)) {
        this.saveExpenseEntries(data.expenses);
      }
      if (data.settings) {
        this.saveSettings(data.settings);
      }
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  }

  static exportCSV(motoId?: string): string {
    const fuels = this.getFuelEntries(motoId);
    let csv = 'ID;Date;Kilométrage Compteur;Distance Parcourue (km);Litres;Prix Total (€);Prix au Litre (€/L);Enseigne;Carburant;Station;Consommation (L/100km);Notes\n';
    fuels.forEach((f) => {
      csv += `"${f.id}";"${f.date}";"${f.currentMileage}";"${f.distance}";"${f.liters}";"${f.totalPrice}";"${f.pricePerLiter}";"${f.brand}";"${f.fuelType}";"${f.stationName.replace(/"/g, '""')}";"${f.consumption}";"${(f.notes || '').replace(/"/g, '""')}"\n`;
    });
    return csv;
  }
}

export type FuelType = 'SP98' | 'SP95' | 'E10' | 'E85' | 'Gazole' | string;

export interface Moto {
  id: string;
  make: string;
  model: string;
  year: number;
  defaultFuel: FuelType;
  tankCapacity: number; // in liters
  purchasePrice: number | null;
  purchaseDate: string; // YYYY-MM-DD
  initialMileage: number;
  isSold: boolean;
  resalePrice: number | null;
  resaleDate: string | null;
  isActive: boolean;
  notes?: string;
  createdAt: string;
}

export interface FuelEntry {
  id: string;
  motoId: string;
  date: string; // YYYY-MM-DD
  currentMileage: number; // km compteur
  distance: number; // km parcourus depuis le dernier plein
  distanceInputMode?: 'odometer' | 'trip'; // Choix saisie compteur total ou Trip 1
  liters: number;
  totalPrice: number;
  pricePerLiter: number;
  brand: string;
  fuelType: FuelType;
  stationName: string;
  consumption: number; // L / 100km = (liters / distance) * 100
  notes?: string;
  createdAt: string;
}

export type MaintenanceType =
  | 'revision'
  | 'vidange'
  | 'pneus'
  | 'plaquettes'
  | 'chaine'
  | 'courroie'
  | 'reparation'
  | 'autre';

export interface MaintenanceEntry {
  id: string;
  motoId: string;
  date: string; // YYYY-MM-DD
  type: MaintenanceType;
  customTypeLabel?: string;
  provider: string; // Garage name or "moi-même"
  mileage: number;
  cost: number;
  notes?: string;
  photoUri?: string; // Local Base64 or Blob URL of invoice
  createdAt: string;
}

export type ExpenseCategory = 'assurance' | 'equipement' | 'accessoire' | 'autre';

export interface ExpenseEntry {
  id: string;
  motoId: string;
  date: string; // YYYY-MM-DD
  category: ExpenseCategory;
  label: string;
  amount: number;
  notes?: string;
  createdAt: string;
}

export interface AppSettings {
  brands: string[];
  fuelTypes: string[];
  maintenanceIntervalKm: number;
  maintenanceIntervalMonths: number;
  isDemoMode: boolean;
}

export interface StationData {
  id: string;
  nom: string;
  marque: string;
  adresse: string;
  ville: string;
  cp: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  prixCarburants: {
    [fuelKey: string]: {
      nom: string;
      prix: number;
      maj: string; // Date de mise à jour ISO
    };
  };
}

import type { FuelEntry, MaintenanceEntry, ExpenseEntry, Moto } from '../types';

export interface FuelStats {
  totalDistance: number;
  totalLiters: number;
  totalFuelCost: number;
  averageConsumption: number; // L/100km
  bestConsumption: number | null; // min L/100km
  worstConsumption: number | null; // max L/100km
  averagePricePerLiter: number;
  costPerKm: number;
  currentMileage: number;
}

export function computeFuelStats(fuels: FuelEntry[], initialMileage: number = 0): FuelStats {
  if (!fuels || fuels.length === 0) {
    return {
      totalDistance: 0,
      totalLiters: 0,
      totalFuelCost: 0,
      averageConsumption: 0,
      bestConsumption: null,
      worstConsumption: null,
      averagePricePerLiter: 0,
      costPerKm: 0,
      currentMileage: initialMileage,
    };
  }

  // Fuels are sorted by date descending, so fuels[0] is the latest entry
  const maxMileage = Math.max(...fuels.map((f) => f.currentMileage), initialMileage);
  const totalLiters = fuels.reduce((acc, f) => acc + (f.liters || 0), 0);
  const totalFuelCost = fuels.reduce((acc, f) => acc + (f.totalPrice || 0), 0);
  const totalDistance = fuels.reduce((acc, f) => acc + (f.distance || 0), 0);

  // Filter valid consumption entries (distance > 0)
  const consumptions = fuels
    .filter((f) => f.consumption > 0 && f.distance > 0)
    .map((f) => f.consumption);

  const bestConsumption = consumptions.length > 0 ? Math.min(...consumptions) : null;
  const worstConsumption = consumptions.length > 0 ? Math.max(...consumptions) : null;

  const averageConsumption =
    totalDistance > 0 ? (totalLiters / totalDistance) * 100 : 0;

  const averagePricePerLiter =
    totalLiters > 0 ? totalFuelCost / totalLiters : 0;

  const costPerKm = totalDistance > 0 ? totalFuelCost / totalDistance : 0;

  return {
    totalDistance: Math.round(totalDistance * 10) / 10,
    totalLiters: Math.round(totalLiters * 100) / 100,
    totalFuelCost: Math.round(totalFuelCost * 100) / 100,
    averageConsumption: Math.round(averageConsumption * 100) / 100,
    bestConsumption: bestConsumption !== null ? Math.round(bestConsumption * 100) / 100 : null,
    worstConsumption: worstConsumption !== null ? Math.round(worstConsumption * 100) / 100 : null,
    averagePricePerLiter: Math.round(averagePricePerLiter * 1000) / 1000,
    costPerKm: Math.round(costPerKm * 1000) / 1000,
    currentMileage: maxMileage,
  };
}

export interface TcoStats {
  purchasePrice: number;
  totalFuelCost: number;
  totalMaintenanceCost: number;
  totalInsuranceCost: number;
  totalAccessoriesCost: number;
  totalOtherCost: number;
  totalCostOfOwnership: number; // TCO
  totalDistance: number;
  costPerKmWithPurchase: number;
  costPerKmWithoutPurchase: number;
  isSold: boolean;
  resalePrice: number;
  depreciationLoss: number; // Prix achat - Prix revente
  netRealCost: number; // TCO - Prix revente
  netCostPerKm: number; // Coût net réel / distance
}

export function computeTco(
  moto: Moto,
  fuels: FuelEntry[],
  maintenance: MaintenanceEntry[],
  expenses: ExpenseEntry[]
): TcoStats {
  const purchasePrice = moto.purchasePrice || 0;
  const totalFuelCost = fuels.reduce((acc, f) => acc + (f.totalPrice || 0), 0);
  const totalMaintenanceCost = maintenance.reduce((acc, m) => acc + (m.cost || 0), 0);

  const insuranceExpenses = expenses.filter((e) => e.category === 'assurance');
  const accessoriesExpenses = expenses.filter(
    (e) => e.category === 'equipement' || e.category === 'accessoire'
  );
  const otherExpenses = expenses.filter((e) => e.category === 'autre');

  const totalInsuranceCost = insuranceExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  const totalAccessoriesCost = accessoriesExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  const totalOtherCost = otherExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);

  const totalCostOfOwnership =
    purchasePrice +
    totalFuelCost +
    totalMaintenanceCost +
    totalInsuranceCost +
    totalAccessoriesCost +
    totalOtherCost;

  const totalDistance = fuels.reduce((acc, f) => acc + (f.distance || 0), 0);

  const costPerKmWithPurchase =
    totalDistance > 0 ? totalCostOfOwnership / totalDistance : 0;

  const costPerKmWithoutPurchase =
    totalDistance > 0
      ? (totalCostOfOwnership - purchasePrice) / totalDistance
      : 0;

  const resalePrice = moto.isSold && moto.resalePrice ? moto.resalePrice : 0;
  const depreciationLoss = moto.isSold ? Math.max(0, purchasePrice - resalePrice) : 0;
  const netRealCost = totalCostOfOwnership - resalePrice;
  const netCostPerKm = totalDistance > 0 ? netRealCost / totalDistance : 0;

  return {
    purchasePrice: Math.round(purchasePrice * 100) / 100,
    totalFuelCost: Math.round(totalFuelCost * 100) / 100,
    totalMaintenanceCost: Math.round(totalMaintenanceCost * 100) / 100,
    totalInsuranceCost: Math.round(totalInsuranceCost * 100) / 100,
    totalAccessoriesCost: Math.round(totalAccessoriesCost * 100) / 100,
    totalOtherCost: Math.round(totalOtherCost * 100) / 100,
    totalCostOfOwnership: Math.round(totalCostOfOwnership * 100) / 100,
    totalDistance: Math.round(totalDistance * 10) / 10,
    costPerKmWithPurchase: Math.round(costPerKmWithPurchase * 1000) / 1000,
    costPerKmWithoutPurchase: Math.round(costPerKmWithoutPurchase * 1000) / 1000,
    isSold: moto.isSold,
    resalePrice: Math.round(resalePrice * 100) / 100,
    depreciationLoss: Math.round(depreciationLoss * 100) / 100,
    netRealCost: Math.round(netRealCost * 100) / 100,
    netCostPerKm: Math.round(netCostPerKm * 1000) / 1000,
  };
}

export interface NextMaintenanceEstimate {
  lastMileage: number;
  lastDate: string | null;
  targetMileage: number;
  remainingKm: number;
  isOverdue: boolean;
  statusColor: 'green' | 'amber' | 'red';
}

export function estimateNextMaintenance(
  currentMileage: number,
  maintenanceEntries: MaintenanceEntry[],
  intervalKm: number = 5000
): NextMaintenanceEstimate {
  // Sort descending by mileage
  const revisions = maintenanceEntries.filter(
    (m) => m.type === 'revision' || m.type === 'vidange'
  );

  let lastMileage = 0;
  let lastDate: string | null = null;

  if (revisions.length > 0) {
    const sorted = [...revisions].sort((a, b) => b.mileage - a.mileage);
    lastMileage = sorted[0].mileage;
    lastDate = sorted[0].date;
  }

  // Calculate next target mileage rounded to interval
  let targetMileage = lastMileage + intervalKm;
  if (targetMileage <= currentMileage) {
    targetMileage = Math.ceil(currentMileage / intervalKm) * intervalKm;
    if (targetMileage === currentMileage) {
      targetMileage += intervalKm;
    }
  }

  const remainingKm = targetMileage - currentMileage;
  const isOverdue = remainingKm <= 0;

  let statusColor: 'green' | 'amber' | 'red' = 'green';
  if (isOverdue) {
    statusColor = 'red';
  } else if (remainingKm <= 500) {
    statusColor = 'amber';
  }

  return {
    lastMileage,
    lastDate,
    targetMileage,
    remainingKm,
    isOverdue,
    statusColor,
  };
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateFr(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-');
    if (!year || !month || !day) return dateStr;
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

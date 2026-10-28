import { Preferences } from '@capacitor/preferences';

const DB_NAME = 'MotoCarburantDB';
const STORE_NAME = 'persistent_data';

// Helper natif IndexedDB sans dépendance externe
function getIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB non disponible'));
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbGet<T>(key: string): Promise<T | null> {
  try {
    const db = await getIDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function idbSet<T>(key: string, value: T): Promise<void> {
  try {
    const db = await getIDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // Ignore error
  }
}

/**
 * Service de Persistance Multi-Niveaux :
 * 1. Synchronisation temps réel : localStorage + Capacitor Native Preferences (NSUserDefaults iOS) + IndexedDB
 * 2. Demande de stockage persistant WebKit (navigator.storage.persist) pour empêcher Safari de vider les données
 * 3. Récupération / Réconciliation automatique au démarrage si localStorage a été vidé lors d'une mise à jour
 */
export class PersistentStorage {
  private static isInitialized = false;

  /**
   * Demande au système iOS/WebKit de rendre le stockage persistant et inexpulsable
   */
  static async requestStoragePersistence(): Promise<boolean> {
    try {
      if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
        const isPersisted = await navigator.storage.persist();
        return isPersisted;
      }
    } catch (e) {
      console.warn('Impossible de demander la persistance de stockage', e);
    }
    return false;
  }

  /**
   * Sauvegarde une clé dans tous les supports (synchrone localStorage + asynchrone Preferences iOS + IndexedDB)
   */
  static async setItem(key: string, value: string): Promise<void> {
    // 1. LocalStorage immédiat
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`Erreur localStorage.setItem [${key}]`, e);
    }

    // 2. Capacitor Preferences (Stockage natif iOS NSUserDefaults inaltérable par mise à jour)
    try {
      await Preferences.set({ key, value });
    } catch (e) {
      // Non bloquant si exécuté dans un navigateur pur
    }

    // 3. Base de données IndexedDB
    try {
      await idbSet(key, value);
    } catch (e) {
      // Non bloquant
    }
  }

  /**
   * Récupère la valeur d'une clé en interrogeant les différents niveaux de persistance
   */
  static async getItem(key: string): Promise<string | null> {
    // 1. Priorité au localStorage si disponible
    try {
      const localVal = localStorage.getItem(key);
      if (localVal !== null && localVal !== '[]' && localVal !== '{}') {
        return localVal;
      }
    } catch {}

    // 2. Fallback sur Capacitor Preferences natif iOS
    try {
      const pref = await Preferences.get({ key });
      if (pref.value !== null && pref.value !== '[]' && pref.value !== '{}') {
        try {
          localStorage.setItem(key, pref.value);
        } catch {}
        return pref.value;
      }
    } catch {}

    // 3. Fallback sur IndexedDB
    try {
      const idbVal = await idbGet<string>(key);
      if (idbVal !== null && idbVal !== '[]' && idbVal !== '{}') {
        try {
          localStorage.setItem(key, idbVal);
        } catch {}
        return idbVal;
      }
    } catch {}

    return localStorage.getItem(key);
  }

  /**
   * Initialisation au démarrage :
   * Détecte si les données ont disparu lors d'une mise à jour et les restaure automatiquement
   * depuis le stockage natif iOS ou IndexedDB.
   */
  static async initializeAndRestore(): Promise<boolean> {
    if (this.isInitialized) return false;
    this.isInitialized = true;

    // Activer la persistance WebKit
    await this.requestStoragePersistence();

    const keysToCheck = [
      'mc_fuels',
      'mc_motos',
      'mc_maintenance',
      'mc_expenses',
      'mc_settings',
    ];

    let hasRestoredAny = false;

    for (const key of keysToCheck) {
      const currentLocal = localStorage.getItem(key);
      const isLocalEmpty = !currentLocal || currentLocal === '[]' || currentLocal === 'null';

      if (isLocalEmpty) {
        // Tenter de récupérer depuis Preferences natif iOS
        let fallbackVal: string | null = null;
        try {
          const pref = await Preferences.get({ key });
          if (pref.value && pref.value !== '[]' && pref.value !== 'null') {
            fallbackVal = pref.value;
          }
        } catch {}

        // Sinon tenter depuis IndexedDB
        if (!fallbackVal) {
          try {
            const idb = await idbGet<string>(key);
            if (idb && idb !== '[]' && idb !== 'null') {
              fallbackVal = idb;
            }
          } catch {}
        }

        // Si des données historiques ont été retrouvées, restauration dans le localStorage !
        if (fallbackVal) {
          try {
            localStorage.setItem(key, fallbackVal);
            hasRestoredAny = true;
            console.info(`[Restauration automatique] Clé ${key} restaurée avec succès après mise à jour.`);
          } catch {}
        }
      } else {
        // Le localStorage contient des données : on s'assure qu'elles sont bien répliquées vers Preferences et IndexedDB
        try {
          await Preferences.set({ key, value: currentLocal });
          await idbSet(key, currentLocal);
        } catch {}
      }
    }

    // Création automatique d'une sauvegarde de secours globale
    try {
      const backupSnapshot = {
        timestamp: new Date().toISOString(),
        fuels: localStorage.getItem('mc_fuels'),
        motos: localStorage.getItem('mc_motos'),
        maintenance: localStorage.getItem('mc_maintenance'),
        expenses: localStorage.getItem('mc_expenses'),
        settings: localStorage.getItem('mc_settings'),
      };
      const jsonBackup = JSON.stringify(backupSnapshot);
      await Preferences.set({ key: 'mc_autobackup_latest', value: jsonBackup });
      await idbSet('mc_autobackup_latest', jsonBackup);
    } catch {}

    return hasRestoredAny;
  }
}

import React, { useState, useEffect } from 'react';
import type { Moto, AppSettings } from './types';
import { StorageService } from './services/storage';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import type { TabType } from './components/Navigation';
import { FuelPage } from './components/FuelPage';
import { MaintenancePage } from './components/MaintenancePage';
import { TcoPage } from './components/TcoPage';
import { StationsPage } from './components/StationsPage';
import { MotoSettingsPage } from './components/MotoSettingsPage';
import { APP_NAME, APP_VERSION } from './version';
import { Smartphone, Monitor } from 'lucide-react';

export const App: React.FC = () => {
  const [activeMoto, setActiveMoto] = useState<Moto>(StorageService.getActiveMoto());
  const [allMotos, setAllMotos] = useState<Moto[]>(StorageService.getMotos());
  const [settings, setSettings] = useState<AppSettings>(StorageService.getSettings());
  const [currentTab, setCurrentTab] = useState<TabType>('fuels');

  // Display Mode: 'phone' (simulated iPhone frame) or 'pc' (full-width desktop responsive)
  const [displayMode, setDisplayMode] = useState<'phone' | 'pc'>(() => {
    try {
      const saved = localStorage.getItem('mc_display_mode');
      if (saved === 'phone' || saved === 'pc') return saved;
    } catch {}
    // Default to 'pc' on wide screens, 'phone' on small screens
    return window.innerWidth >= 768 ? 'pc' : 'phone';
  });

  // Dark mode
  const [darkMode, setDarkMode] = useState<boolean>(true);

  // Station import state
  const [pendingFillStation, setPendingFillStation] = useState<{
    stationName: string;
    brand: string;
    fuelType: string;
    pricePerLiter: number;
  } | null>(null);

  // Trigger add moto modal from Header
  const [isAddMotoModalRequested, setIsAddMotoModalRequested] = useState<boolean>(false);

  const refreshAll = () => {
    const motos = StorageService.getMotos();
    setAllMotos(motos);
    const active = StorageService.getActiveMoto();
    setActiveMoto(active);
    setSettings(StorageService.getSettings());
  };

  useEffect(() => {
    refreshAll();
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleToggleDisplayMode = (mode: 'phone' | 'pc') => {
    setDisplayMode(mode);
    try {
      localStorage.setItem('mc_display_mode', mode);
    } catch {}
  };

  const handleSelectMoto = (motoId: string) => {
    StorageService.setActiveMoto(motoId);
    refreshAll();
  };

  const handleUpdateMoto = (moto: Moto) => {
    setActiveMoto(moto);
    refreshAll();
  };

  const handleSelectStationForFill = (station: {
    stationName: string;
    brand: string;
    fuelType: string;
    pricePerLiter: number;
  }) => {
    setPendingFillStation(station);
    setCurrentTab('fuels');
  };

  const mainContent = (
    <>
      {currentTab === 'fuels' && (
        <FuelPage
          activeMoto={activeMoto}
          settings={settings}
          onRefreshData={refreshAll}
          pendingFillStation={pendingFillStation}
          onClearPendingFillStation={() => setPendingFillStation(null)}
          onGoToStations={() => setCurrentTab('stations')}
        />
      )}

      {currentTab === 'maintenance' && (
        <MaintenancePage
          activeMoto={activeMoto}
          settings={settings}
          onRefreshData={refreshAll}
        />
      )}

      {currentTab === 'tco' && (
        <TcoPage
          activeMoto={activeMoto}
          onRefreshData={refreshAll}
          onUpdateMoto={handleUpdateMoto}
        />
      )}

      {currentTab === 'stations' && (
        <StationsPage
          settings={settings}
          defaultFuel={activeMoto.defaultFuel || 'SP98'}
          onSelectStationForFill={handleSelectStationForFill}
        />
      )}

      {currentTab === 'settings' && (
        <MotoSettingsPage
          activeMoto={activeMoto}
          allMotos={allMotos}
          settings={settings}
          onSelectMoto={handleSelectMoto}
          onUpdateMoto={handleUpdateMoto}
          onRefreshAll={refreshAll}
          isAddModalOpenInitially={isAddMotoModalRequested}
        />
      )}

      {/* Footer with App Version */}
      <div className="py-6 text-center text-zinc-600 text-[11px] space-y-0.5">
        <p className="font-semibold text-zinc-500">{APP_NAME} • v{APP_VERSION}</p>
        <p>Données stockées localement sur votre terminal • Conforme Open Data Officiel</p>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans transition-colors selection:bg-amber-500/30 selection:text-amber-200">
      {displayMode === 'phone' ? (
        /* MODE TÉLÉPHONE (Cadre iPhone interactif centré sur PC) */
        <div className="min-h-screen py-2 sm:py-6 px-0 sm:px-4 flex flex-col items-center justify-start bg-zinc-950 sm:bg-zinc-900/40">
          {/* Quick Floating Top bar for Desktop preview */}
          <div className="hidden sm:flex items-center gap-3 mb-4 bg-zinc-900/90 border border-zinc-800 px-4 py-2 rounded-2xl shadow-xl backdrop-blur-md">
            <span className="text-xs text-zinc-400 font-medium">Mode d'affichage :</span>
            <button
              onClick={() => handleToggleDisplayMode('phone')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-500 text-zinc-950 shadow-sm transition-all"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Téléphone (iPhone)</span>
            </button>
            <button
              onClick={() => handleToggleDisplayMode('pc')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-all"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Passer en Mode PC (Plein écran)</span>
            </button>
          </div>

          {/* Smartphone Frame */}
          <div className="w-full sm:max-w-[430px] sm:min-h-[890px] bg-zinc-950 sm:border-[10px] sm:border-zinc-800/90 sm:rounded-[54px] sm:shadow-2xl sm:ring-1 sm:ring-zinc-700/60 overflow-hidden flex flex-col relative transition-all">
            {/* Top Speaker & Dynamic Island simulation */}
            <div className="hidden sm:flex items-center justify-between px-7 pt-3 pb-1 bg-zinc-900/90 border-b border-zinc-800/50">
              <span className="text-[12px] font-semibold text-zinc-300">09:41</span>
              <div className="w-24 h-5 bg-zinc-950 rounded-full flex items-center justify-end px-2 gap-1 border border-zinc-800">
                <span className="w-2 h-2 rounded-full bg-zinc-800"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-zinc-400">
                <span>5G</span>
                <span>100%</span>
              </div>
            </div>

            {/* App Header */}
            <Header
              activeMoto={activeMoto}
              allMotos={allMotos}
              onSelectMoto={handleSelectMoto}
              onOpenAddMoto={() => {
                setCurrentTab('settings');
                setIsAddMotoModalRequested(true);
              }}
              isDemoMode={settings.isDemoMode}
              onToggleDemo={(enabled) => {
                StorageService.toggleDemoData(enabled);
                refreshAll();
              }}
              darkMode={darkMode}
              onToggleDarkMode={() => setDarkMode(!darkMode)}
              displayMode={displayMode}
              onToggleDisplayMode={handleToggleDisplayMode}
            />

            {/* Scrollable Content inside phone frame */}
            <div className="flex-1 overflow-y-auto px-3.5 pt-3 pb-24">
              {mainContent}
            </div>

            {/* Navigation inside phone */}
            <Navigation currentTab={currentTab} onTabChange={setCurrentTab} />

            {/* iOS Home Indicator Bar simulation */}
            <div className="hidden sm:block absolute bottom-1.5 left-1/2 -translate-x-1/2 w-36 h-1 bg-zinc-700 rounded-full pointer-events-none z-50 opacity-80" />
          </div>
        </div>
      ) : (
        /* MODE PC (Format bureau / plein écran étendu) */
        <div className="min-h-screen flex flex-col">
          {/* Header */}
          <Header
            activeMoto={activeMoto}
            allMotos={allMotos}
            onSelectMoto={handleSelectMoto}
            onOpenAddMoto={() => {
              setCurrentTab('settings');
              setIsAddMotoModalRequested(true);
            }}
            isDemoMode={settings.isDemoMode}
            onToggleDemo={(enabled) => {
              StorageService.toggleDemoData(enabled);
              refreshAll();
            }}
            darkMode={darkMode}
            onToggleDarkMode={() => setDarkMode(!darkMode)}
            displayMode={displayMode}
            onToggleDisplayMode={handleToggleDisplayMode}
          />

          {/* PC Desktop Top Mode Switcher Bar */}
          <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 pt-3 flex items-center justify-between text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="font-semibold text-zinc-300">Affichage Bureau PC actif</span>
              <span>— Visualisation optimisée grand écran</span>
            </div>
            <button
              onClick={() => handleToggleDisplayMode('phone')}
              className="flex items-center gap-1.5 bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 px-3 py-1.5 rounded-xl font-semibold transition-all shadow-sm"
            >
              <Smartphone className="w-3.5 h-3.5 text-amber-400" />
              <span>Basculer au format Téléphone</span>
            </button>
          </div>

          {/* Expanded Container */}
          <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-24">
            {mainContent}
          </main>

          {/* Bottom Navigation */}
          <Navigation currentTab={currentTab} onTabChange={setCurrentTab} />
        </div>
      )}
    </div>
  );
};

export default App;

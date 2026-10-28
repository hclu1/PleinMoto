import React, { useState } from 'react';
import type { Moto } from '../types';
import { APP_NAME, APP_VERSION } from '../version';
import { Bike, ChevronDown, Plus, Check, Moon, Sun, Sparkles, Smartphone, Monitor } from 'lucide-react';

interface HeaderProps {
  activeMoto: Moto;
  allMotos: Moto[];
  onSelectMoto: (motoId: string) => void;
  onOpenAddMoto: () => void;
  isDemoMode: boolean;
  onToggleDemo: (enabled: boolean) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  displayMode: 'phone' | 'pc';
  onToggleDisplayMode: (mode: 'phone' | 'pc') => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeMoto,
  allMotos,
  onSelectMoto,
  onOpenAddMoto,
  isDemoMode,
  darkMode,
  onToggleDarkMode,
  displayMode,
  onToggleDisplayMode,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 pt-[calc(var(--sat)+0.5rem)] pb-3 px-4 transition-colors">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        {/* Logo and title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-zinc-950 shadow-lg shadow-amber-500/20 shrink-0">
            <Bike className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-zinc-100 tracking-tight leading-none truncate">
                {APP_NAME}
              </h1>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                v{APP_VERSION}
              </span>
            </div>
            <p className="text-xs text-zinc-400 truncate mt-0.5">
              100% Hors-ligne & Données locales
            </p>
          </div>
        </div>

        {/* Right side controls: Mode PC/Tel, Moto Selector & Dark Mode */}
        <div className="flex items-center gap-2">
          {/* Mode PC / Téléphone Toggle */}
          <div className="hidden xs:flex sm:flex items-center bg-zinc-800/90 p-1 rounded-xl border border-zinc-700/80 shadow-sm">
            <button
              onClick={() => onToggleDisplayMode('phone')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                displayMode === 'phone'
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Affichage format Téléphone / iPhone"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Téléphone</span>
            </button>
            <button
              onClick={() => onToggleDisplayMode('pc')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                displayMode === 'pc'
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Affichage plein écran format PC"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mode PC</span>
            </button>
          </div>

          {isDemoMode && (
            <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-1 rounded-full">
              <Sparkles className="w-3 h-3" />
              Démo
            </span>
          )}

          {/* Moto Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 bg-zinc-800/80 hover:bg-zinc-800 active:scale-95 text-zinc-200 px-3 py-1.5 rounded-xl border border-zinc-700/80 text-xs font-medium transition-all shadow-sm"
              title="Changer de moto"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
              <span className="font-semibold truncate max-w-[110px] sm:max-w-[140px]">
                {activeMoto.make} {activeMoto.model}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Mes motos ({allMotos.length})
                  </div>
                  <div className="space-y-1 max-h-56 overflow-y-auto">
                    {allMotos.map((moto) => (
                      <button
                        key={moto.id}
                        onClick={() => {
                          onSelectMoto(moto.id);
                          setDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-colors ${
                          moto.id === activeMoto.id
                            ? 'bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30'
                            : 'hover:bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <p className="truncate">
                            {moto.make} {moto.model}
                          </p>
                          <span className="text-[10px] text-zinc-500">
                            {moto.year} • {moto.defaultFuel} • {moto.tankCapacity}L
                          </span>
                        </div>
                        {moto.id === activeMoto.id && (
                          <Check className="w-4 h-4 text-amber-400 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-zinc-800 mt-2 pt-2">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onOpenAddMoto();
                      }}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-amber-400 hover:bg-amber-500/10 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter une autre moto
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Dark / Light Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/80 active:scale-95 transition-all"
            aria-label="Basculer thème sombre / clair"
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-zinc-300" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

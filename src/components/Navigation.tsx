import React from 'react';
import { Fuel, Wrench, CircleDollarSign, MapPin, Bike } from 'lucide-react';

export type TabType = 'fuels' | 'maintenance' | 'tco' | 'stations' | 'settings';

interface NavigationProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentTab, onTabChange }) => {
  const tabs = [
    { id: 'fuels' as TabType, label: 'Pleins', icon: Fuel },
    { id: 'maintenance' as TabType, label: 'Entretien', icon: Wrench },
    { id: 'tco' as TabType, label: 'Coût TCO', icon: CircleDollarSign },
    { id: 'stations' as TabType, label: 'Stations', icon: MapPin },
    { id: 'settings' as TabType, label: 'Ma Moto', icon: Bike },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-900/95 backdrop-blur-lg border-t border-zinc-800 pb-[calc(var(--sab)+0.35rem)] pt-2 px-2 transition-colors">
      <div className="max-w-md mx-auto grid grid-cols-5 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all duration-150 active:scale-95 ${
                isActive
                  ? 'text-amber-400 font-semibold bg-amber-500/10'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.5]' : 'stroke-2'}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-amber-400 rounded-full" />
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight truncate max-w-full">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

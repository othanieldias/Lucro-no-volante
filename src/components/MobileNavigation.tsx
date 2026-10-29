import React from 'react';
import {
  LayoutDashboard,
  Compass,
  Calculator,
  History,
  Target,
  FileBarChart,
  Settings,
} from 'lucide-react';

interface MobileNavigationProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  recordCount: number;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  currentTab,
  onNavigate,
  recordCount,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
    { id: 'radar', label: 'Radar', icon: Compass },
    { id: 'calculator', label: 'Calcular', icon: Calculator },
    {
      id: 'history',
      label: 'Histórico',
      icon: History,
      badge: recordCount > 0 ? recordCount : undefined,
    },
    { id: 'goals', label: 'Metas', icon: Target },
    { id: 'reports', label: 'Mais', icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0b0f19]/95 backdrop-blur-lg border-t border-slate-800/80 pb-safe">
      <div className="grid grid-cols-6 items-center h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className="flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] py-1 transition-colors relative"
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive
                      ? 'text-emerald-400 scale-110 stroke-[2.2]'
                      : 'text-slate-400'
                  }`}
                />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 bg-emerald-500 text-slate-950 font-bold text-[9px] px-1 rounded-full min-w-[14px] text-center">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] font-medium tracking-tight mt-1 whitespace-nowrap ${
                  isActive ? 'text-emerald-400 font-semibold' : 'text-slate-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

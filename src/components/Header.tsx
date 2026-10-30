import React from 'react';
import {
  Car,
  PlusCircle,
  Settings as SettingsIcon,
  CheckCircle2,
  Fuel,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  onNewCalculation: () => void;
  recordCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onNavigate,
  onNewCalculation,
  recordCount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#0b0f19]/95 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 md:gap-8">
        {/* Zona 1: Marca em linha única */}
        <div
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer select-none shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20 font-bold">
            <Car className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <span className="text-base md:text-lg font-bold tracking-tight text-white whitespace-nowrap">
              Lucro no Volante
            </span>
          </div>
        </div>

        {/* Zona 2: Navegação principal em linha única (Desktop / Tablet) */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2 text-sm font-medium text-slate-400">
          <button
            onClick={() => onNavigate('dashboard')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              currentTab === 'dashboard'
                ? 'text-white bg-slate-800/80 shadow-sm'
                : 'hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => onNavigate('fuel')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              currentTab === 'fuel'
                ? 'text-emerald-400 bg-slate-800/80 shadow-sm font-semibold'
                : 'hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <Fuel className="w-4 h-4 text-emerald-400" />
            <span>Combustível</span>
          </button>
          <button
            onClick={() => onNavigate('assistant')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              currentTab === 'assistant'
                ? 'text-emerald-400 bg-slate-800/80 shadow-sm font-semibold'
                : 'hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Assistente IA</span>
          </button>
          <button
            onClick={() => onNavigate('calculator')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              currentTab === 'calculator'
                ? 'text-white bg-slate-800/80 shadow-sm'
                : 'hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            Calculadora
          </button>
          <button
            onClick={() => onNavigate('history')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              currentTab === 'history'
                ? 'text-white bg-slate-800/80 shadow-sm'
                : 'hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            Histórico ({recordCount})
          </button>
          <button
            onClick={() => onNavigate('goals')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              currentTab === 'goals'
                ? 'text-white bg-slate-800/80 shadow-sm'
                : 'hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            Metas
          </button>
          <button
            onClick={() => onNavigate('reports')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              currentTab === 'reports'
                ? 'text-white bg-slate-800/80 shadow-sm'
                : 'hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            Relatórios
          </button>
          <button
            onClick={() => onNavigate('tests')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              currentTab === 'tests'
                ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-800/40'
                : 'hover:text-emerald-300'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Validações</span>
          </button>
        </nav>

        {/* Zona 3: Ação Primária & Configurações */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onNewCalculation}
            className="flex items-center gap-1.5 px-3 md:px-4 py-2 text-xs md:text-sm font-semibold text-slate-950 bg-emerald-500 hover:bg-emerald-400 active:scale-95 transition rounded-lg shadow-sm whitespace-nowrap shrink-0"
          >
            <PlusCircle className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            <span className="hidden sm:inline">Novo Cálculo</span>
            <span className="sm:hidden">Calcular</span>
          </button>

          <button
            onClick={() => onNavigate('settings')}
            title="Configurações e Conta"
            className={`p-2 rounded-lg border transition-colors ${
              currentTab === 'settings'
                ? 'bg-slate-800 text-emerald-400 border-slate-700'
                : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

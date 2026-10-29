import React, { useState, useMemo } from 'react';
import {
  Compass,
  X,
  Minimize2,
  Maximize2,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import { TrafficLightSettings } from '../types';
import { evaluateRideOffer, formatCurrency, formatPerHour, parseBrazilianInput } from '../utils/finance';

interface FloatingMiniRadarProps {
  settings: TrafficLightSettings;
  realCostPerKm?: number | null;
  onOpenFullRadar: () => void;
  onClose: () => void;
}

export const FloatingMiniRadar: React.FC<FloatingMiniRadarProps> = ({
  settings,
  realCostPerKm,
  onOpenFullRadar,
  onClose,
}) => {
  const [minimized, setMinimized] = useState<boolean>(false);
  const [fare, setFare] = useState<string>('');
  const [km, setKm] = useState<string>('');
  const [time, setTime] = useState<string>('');

  const evaluation = useMemo(() => {
    return evaluateRideOffer(
      {
        app: 'uber',
        estimatedFare: parseBrazilianInput(fare),
        totalDistanceKm: parseBrazilianInput(km),
        totalDurationMinutes: parseBrazilianInput(time),
      },
      settings,
      realCostPerKm
    );
  }, [fare, km, time, settings, realCostPerKm]);

  const getStatusColor = () => {
    if (evaluation.status === 'green') return 'bg-emerald-500 text-slate-950';
    if (evaluation.status === 'yellow') return 'bg-amber-500 text-slate-950';
    if (evaluation.status === 'red') return 'bg-rose-500 text-white';
    return 'bg-slate-700 text-slate-300';
  };

  const StatusIcon =
    evaluation.status === 'green'
      ? CheckCircle2
      : evaluation.status === 'yellow'
      ? AlertTriangle
      : evaluation.status === 'red'
      ? XCircle
      : HelpCircle;

  if (minimized) {
    return (
      <div className="fixed bottom-20 right-4 z-50 flex items-center gap-2">
        <button
          onClick={() => setMinimized(false)}
          className={`h-12 px-3.5 rounded-full shadow-2xl flex items-center gap-2 font-bold text-xs border border-white/20 backdrop-blur-md transition-transform active:scale-95 ${getStatusColor()}`}
        >
          <StatusIcon className="w-5 h-5 stroke-[2.5]" />
          <span>Radar</span>
          {evaluation.status !== 'insufficient_data' && (
            <span className="font-mono">{formatCurrency(evaluation.estimatedNetProfit)}</span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 w-80 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden p-4 space-y-3">
      {/* Header do Widget Flutuante */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5">
          <Compass className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-white">Radar Flutuante (Simulação)</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimized(true)}
            className="p-1 text-slate-400 hover:text-white rounded"
            title="Minimizar"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-rose-400 rounded"
            title="Fechar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Inputs Ultra-Rápidos */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <label className="block text-[10px] text-slate-400 mb-0.5">Valor (R$)</label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="25"
            value={fare}
            onChange={(e) => setFare(e.target.value)}
            className="w-full h-8 px-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-[10px] text-slate-400 mb-0.5">Km Total</label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="8.5"
            value={km}
            onChange={(e) => setKm(e.target.value)}
            className="w-full h-8 px-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-[10px] text-slate-400 mb-0.5">Tempo (min)</label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="20"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full h-8 px-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Card de Resultado Compacto */}
      <div className={`p-2.5 rounded-xl flex items-center justify-between text-xs font-bold ${getStatusColor()}`}>
        <div className="flex items-center gap-1.5">
          <StatusIcon className="w-4 h-4 stroke-[2.2]" />
          <span>{evaluation.statusLabel}</span>
        </div>
        {evaluation.status !== 'insufficient_data' && (
          <div className="text-right font-mono text-[11px]">
            <div>Lucro: {formatCurrency(evaluation.estimatedNetProfit)}</div>
            <div className="text-[10px] font-normal">{formatPerHour(evaluation.estimatedNetProfitPerHour)}</div>
          </div>
        )}
      </div>

      {/* Botão de Expandir */}
      <button
        onClick={onOpenFullRadar}
        className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[11px] font-medium transition flex items-center justify-center gap-1"
      >
        <span>Abrir Detalhes no Radar</span>
        <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  );
};

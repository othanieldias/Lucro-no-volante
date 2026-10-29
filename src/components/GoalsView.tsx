import React, { useState } from 'react';
import {
  Target,
  Trophy,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Settings as SettingsIcon,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { DailyRecord, FinancialGoals, UserSettings } from '../types';
import {
  aggregatePeriodSummary,
  formatCurrency,
  getCurrentMonthRange,
  getMondaySundayWeekRange,
  getTodayDateString,
  parseBrazilianInput,
} from '../utils/finance';
import { saveUserSettings } from '../services/storage';

interface GoalsViewProps {
  records: DailyRecord[];
  settings: UserSettings;
  onSettingsUpdated: (updated: UserSettings) => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  records,
  settings,
  onSettingsUpdated,
}) => {
  const [editingGoalsModal, setEditingGoalsModal] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Form states
  const [dailyRevGoal, setDailyRevGoal] = useState<string>(
    String(settings.goals.dailyRevenueGoal).replace('.', ',')
  );
  const [dailyNetProfitGoal, setDailyNetProfitGoal] = useState<string>(
    String(settings.goals.dailyNetProfitGoal).replace('.', ',')
  );
  const [weeklyNetProfitGoal, setWeeklyNetProfitGoal] = useState<string>(
    String(settings.goals.weeklyNetProfitGoal).replace('.', ',')
  );
  const [monthlyNetProfitGoal, setMonthlyNetProfitGoal] = useState<string>(
    String(settings.goals.monthlyNetProfitGoal).replace('.', ',')
  );
  const [workDaysPerWeek, setWorkDaysPerWeek] = useState<number>(
    settings.goals.workDaysPerWeek || 6
  );

  const todayStr = getTodayDateString();

  // 1. Meta Diária de Faturamento
  const todayRecord = records.find((r) => r.date === todayStr);
  const todayRevenue = todayRecord ? todayRecord.grossRevenue : 0;
  const targetDailyRev = settings.goals.dailyRevenueGoal || 350;
  const dailyRevPercent = targetDailyRev > 0
    ? Math.min(100, Math.round((todayRevenue / targetDailyRev) * 100))
    : 0;
  const dailyRevRemaining = Math.max(0, targetDailyRev - todayRevenue);
  const isDailyRevAchieved = todayRevenue >= targetDailyRev && targetDailyRev > 0;

  // 2. Meta Diária de Lucro Líquido
  const todayNetProfit = todayRecord
    ? todayRecord.grossRevenue -
      (todayRecord.fuelCost + todayRecord.vehicleRentalCost + todayRecord.otherCosts)
    : 0;
  const targetDailyProfit = settings.goals.dailyNetProfitGoal || 200;
  const dailyProfitPercent = targetDailyProfit > 0
    ? Math.min(100, Math.max(0, Math.round((todayNetProfit / targetDailyProfit) * 100)))
    : 0;
  const dailyProfitRemaining = Math.max(0, targetDailyProfit - todayNetProfit);
  const isDailyProfitAchieved = todayNetProfit >= targetDailyProfit && targetDailyProfit > 0;

  // 3. Meta Semanal de Lucro Líquido (Segunda a Domingo)
  const weekRange = getMondaySundayWeekRange();
  const thisWeekRecords = records.filter(
    (r) => r.date >= weekRange.startDate && r.date <= weekRange.endDate
  );
  const weekSummary = aggregatePeriodSummary(thisWeekRecords);
  const targetWeeklyProfit = settings.goals.weeklyNetProfitGoal || 1200;
  const weeklyProfitPercent = targetWeeklyProfit > 0
    ? Math.min(100, Math.max(0, Math.round((weekSummary.netProfit / targetWeeklyProfit) * 100)))
    : 0;
  const weeklyProfitRemaining = Math.max(0, targetWeeklyProfit - weekSummary.netProfit);
  const isWeeklyProfitAchieved = weekSummary.netProfit >= targetWeeklyProfit && targetWeeklyProfit > 0;

  // 4. Meta Mensal de Lucro Líquido (Mês Calendário Corrente)
  const monthRange = getCurrentMonthRange();
  const thisMonthRecords = records.filter(
    (r) => r.date >= monthRange.startDate && r.date <= monthRange.endDate
  );
  const monthSummary = aggregatePeriodSummary(thisMonthRecords);
  const targetMonthlyProfit = settings.goals.monthlyNetProfitGoal || 5000;
  const monthlyProfitPercent = targetMonthlyProfit > 0
    ? Math.min(100, Math.max(0, Math.round((monthSummary.netProfit / targetMonthlyProfit) * 100)))
    : 0;
  const monthlyProfitRemaining = Math.max(0, targetMonthlyProfit - monthSummary.netProfit);
  const isMonthlyProfitAchieved = monthSummary.netProfit >= targetMonthlyProfit && targetMonthlyProfit > 0;

  // Salvar alterações de metas
  const handleSaveGoals = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedGoals: FinancialGoals = {
      dailyRevenueGoal: Math.max(0, parseBrazilianInput(dailyRevGoal)),
      dailyNetProfitGoal: Math.max(0, parseBrazilianInput(dailyNetProfitGoal)),
      weeklyNetProfitGoal: Math.max(0, parseBrazilianInput(weeklyNetProfitGoal)),
      monthlyNetProfitGoal: Math.max(0, parseBrazilianInput(monthlyNetProfitGoal)),
      workDaysPerWeek: Math.max(1, Math.min(7, workDaysPerWeek)),
    };

    const updated = saveUserSettings({ goals: updatedGoals });
    onSettingsUpdated(updated);
    setEditingGoalsModal(false);
    setNotification('Metas financeiras atualizadas com sucesso!');
    setTimeout(() => setNotification(null), 3000);
  };

  const getStatusBadge = (isAchieved: boolean, currentVal: number) => {
    if (isAchieved) {
      return (
        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-md">
          <Trophy className="w-3 h-3" /> Meta Alcançada!
        </span>
      );
    }
    if (currentVal > 0) {
      return (
        <span className="flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded-md">
          <Clock className="w-3 h-3" /> Em andamento
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-800/60 border border-slate-700/60 px-2 py-0.5 rounded-md">
        <AlertCircle className="w-3 h-3" /> Não iniciada hoje
      </span>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Título & Botão de Configuração */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Target className="w-6 h-6 text-emerald-400" />
            Metas Financeiras
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-0.5">
            Acompanhe seu rendimento real contra seus objetivos diários, semanais e mensais.
          </p>
        </div>

        <button
          onClick={() => setEditingGoalsModal(true)}
          className="text-xs px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold border border-slate-700/80 transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <SettingsIcon className="w-3.5 h-3.5" />
          <span>Ajustar Metas</span>
        </button>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs">
          {notification}
        </div>
      )}

      {/* Grid de Metas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Meta Diária de Lucro Líquido */}
        <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium block">Objetivo Diário</span>
              <h3 className="text-base font-bold text-white mt-0.5">Lucro Líquido do Dia</h3>
            </div>
            {getStatusBadge(isDailyProfitAchieved, todayNetProfit)}
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl md:text-3xl font-extrabold font-mono text-emerald-400 tabular-nums">
                {formatCurrency(todayNetProfit)}
              </span>
              <span className="text-xs font-mono text-slate-400">
                Meta: <strong className="text-white">{formatCurrency(targetDailyProfit)}</strong>
              </span>
            </div>

            {/* Barra de Progresso */}
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                style={{ width: `${dailyProfitPercent}%` }}
                className={`h-full rounded-full transition-all duration-500 ${
                  isDailyProfitAchieved ? 'bg-emerald-400 shadow-md shadow-emerald-500/30' : 'bg-emerald-500'
                }`}
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Progresso: <strong className="text-white font-mono">{dailyProfitPercent}%</strong></span>
            <span>
              {dailyProfitRemaining > 0 ? (
                <>Faltam: <strong className="text-rose-400 font-mono">{formatCurrency(dailyProfitRemaining)}</strong></>
              ) : (
                <strong className="text-emerald-400">Meta batida! 🎉</strong>
              )}
            </span>
          </div>
        </div>

        {/* 2. Meta Diária de Faturamento Bruto */}
        <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium block">Objetivo Diário</span>
              <h3 className="text-base font-bold text-white mt-0.5">Faturamento Bruto do Dia</h3>
            </div>
            {getStatusBadge(isDailyRevAchieved, todayRevenue)}
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl md:text-3xl font-extrabold font-mono text-white tabular-nums">
                {formatCurrency(todayRevenue)}
              </span>
              <span className="text-xs font-mono text-slate-400">
                Meta: <strong className="text-white">{formatCurrency(targetDailyRev)}</strong>
              </span>
            </div>

            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                style={{ width: `${dailyRevPercent}%` }}
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Progresso: <strong className="text-white font-mono">{dailyRevPercent}%</strong></span>
            <span>
              {dailyRevRemaining > 0 ? (
                <>Faltam: <strong className="text-slate-300 font-mono">{formatCurrency(dailyRevRemaining)}</strong></>
              ) : (
                <strong className="text-emerald-400">Meta batida! 🎉</strong>
              )}
            </span>
          </div>
        </div>

        {/* 3. Meta Semanal de Lucro Líquido (Segunda a Domingo) */}
        <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium block">Objetivo Semanal (Seg-Dom)</span>
              <h3 className="text-base font-bold text-white mt-0.5">Lucro Líquido da Semana</h3>
            </div>
            {getStatusBadge(isWeeklyProfitAchieved, weekSummary.netProfit)}
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl md:text-3xl font-extrabold font-mono text-emerald-400 tabular-nums">
                {formatCurrency(weekSummary.netProfit)}
              </span>
              <span className="text-xs font-mono text-slate-400">
                Meta: <strong className="text-white">{formatCurrency(targetWeeklyProfit)}</strong>
              </span>
            </div>

            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                style={{ width: `${weeklyProfitPercent}%` }}
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Turnos na semana: <strong className="text-white font-mono">{thisWeekRecords.length} / {workDaysPerWeek} dias</strong>
            </span>
            <span>
              {weeklyProfitRemaining > 0 ? (
                <>Faltam: <strong className="text-rose-400 font-mono">{formatCurrency(weeklyProfitRemaining)}</strong></>
              ) : (
                <strong className="text-emerald-400">Meta batida! 🎉</strong>
              )}
            </span>
          </div>
        </div>

        {/* 4. Meta Mensal de Lucro Líquido (Mês Calendário) */}
        <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium block">Objetivo Mensal (Mês Atual)</span>
              <h3 className="text-base font-bold text-white mt-0.5">Lucro Líquido do Mês</h3>
            </div>
            {getStatusBadge(isMonthlyProfitAchieved, monthSummary.netProfit)}
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl md:text-3xl font-extrabold font-mono text-emerald-400 tabular-nums">
                {formatCurrency(monthSummary.netProfit)}
              </span>
              <span className="text-xs font-mono text-slate-400">
                Meta: <strong className="text-white">{formatCurrency(targetMonthlyProfit)}</strong>
              </span>
            </div>

            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                style={{ width: `${monthlyProfitPercent}%` }}
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Turnos registrados: <strong className="text-white font-mono">{thisMonthRecords.length} dias</strong>
            </span>
            <span>
              {monthlyProfitRemaining > 0 ? (
                <>Faltam: <strong className="text-rose-400 font-mono">{formatCurrency(monthlyProfitRemaining)}</strong></>
              ) : (
                <strong className="text-emerald-400">Meta batida! 🎉</strong>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Regra de Ouro do Motorista */}
      <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-2 text-xs text-slate-400">
        <h4 className="font-semibold text-white flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          Diferença entre Meta de Faturamento e Meta de Lucro:
        </h4>
        <p>
          Muitos motoristas se iludem focando em <strong>faturar R$ 400 por dia</strong>, mas gastam R$ 220
          de combustível e aluguel, sobrando apenas R$ 180 no bolso. No <strong>Lucro no Volante</strong>,
          suas metas de lucro são auditadas exclusivamente contra o <strong>Lucro Líquido Real</strong>, garantindo
          que sua meta represente dinheiro limpo para você e sua família.
        </p>
      </div>

      {/* Modal de Ajuste de Metas */}
      {editingGoalsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form
            onSubmit={handleSaveGoals}
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-400" />
                Configurar Metas Financeiras
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Meta de Faturamento Diário (R$)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={dailyRevGoal}
                  onChange={(e) => setDailyRevGoal(e.target.value)}
                  className="w-full h-11 px-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-emerald-300 font-medium mb-1">
                  Meta de Lucro Líquido Diário (R$)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={dailyNetProfitGoal}
                  onChange={(e) => setDailyNetProfitGoal(e.target.value)}
                  className="w-full h-11 px-3 bg-slate-950 border border-emerald-500/40 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Meta de Lucro Líquido Semanal (R$)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={weeklyNetProfitGoal}
                  onChange={(e) => setWeeklyNetProfitGoal(e.target.value)}
                  className="w-full h-11 px-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Meta de Lucro Líquido Mensal (R$)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={monthlyNetProfitGoal}
                  onChange={(e) => setMonthlyNetProfitGoal(e.target.value)}
                  className="w-full h-11 px-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Dias que pretende trabalhar por semana (1 a 7)
                </label>
                <input
                  type="number"
                  min="1"
                  max="7"
                  value={workDaysPerWeek}
                  onChange={(e) => setWorkDaysPerWeek(Number(e.target.value))}
                  className="w-full h-11 px-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingGoalsModal(false)}
                className="h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-emerald-500/10"
              >
                Salvar Metas
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

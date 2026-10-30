import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Fuel,
  Gauge,
  Calendar,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  Sparkles,
  BarChart3,
  CalendarDays,
  Percent,
  Compass,
  Clock,
  KeyRound,
  Wrench,
  HelpCircle,
  ShieldAlert,
  ArrowRight,
  Zap,
  Info,
} from 'lucide-react';
import {
  DailyRecord,
  DatePeriodFilter,
  FinancialGoals,
  UserSettings,
} from '../types';
import {
  aggregatePeriodSummary,
  formatCurrency,
  formatPerKm,
  formatPerHour,
  formatPercent,
  formatNumber,
  formatHours,
  formatDateBR,
  formatDateShortBR,
  getDayOfWeekShortBR,
  getCurrentMonthRange,
  getLast7DaysRange,
  getMondaySundayWeekRange,
  getTodayDateString,
} from '../utils/finance';

interface DashboardViewProps {
  records: DailyRecord[];
  settings: UserSettings;
  onNavigateToCalculator: () => void;
  onNavigateToFuel: () => void;
  onNavigateToAssistant: () => void;
  onSeedSampleData: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  records,
  settings,
  onNavigateToCalculator,
  onNavigateToFuel,
  onNavigateToAssistant,
  onSeedSampleData,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<DatePeriodFilter>('thisWeek');
  const [customStart, setCustomStart] = useState<string>(getTodayDateString());
  const [customEnd, setCustomEnd] = useState<string>(getTodayDateString());

  const todayStr = getTodayDateString();

  // Saudação acolhedora baseada no horário do dia
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Bom dia';
    if (hour >= 12 && hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }, []);

  // Filtragem dos registros com base no período selecionado
  const filteredRecords = useMemo(() => {
    if (!records || records.length === 0) return [];

    let start = '';
    let end = '';

    if (selectedPeriod === 'today') {
      return records.filter((r) => r.date === todayStr);
    } else if (selectedPeriod === 'last7') {
      const range = getLast7DaysRange();
      start = range.startDate;
      end = range.endDate;
    } else if (selectedPeriod === 'thisWeek') {
      const range = getMondaySundayWeekRange();
      start = range.startDate;
      end = range.endDate;
    } else if (selectedPeriod === 'thisMonth') {
      const range = getCurrentMonthRange();
      start = range.startDate;
      end = range.endDate;
    } else if (selectedPeriod === 'custom') {
      start = customStart;
      end = customEnd;
    }

    return records.filter((r) => r.date >= start && r.date <= end);
  }, [records, selectedPeriod, todayStr, customStart, customEnd]);

  // Resumo do período selecionado (com cálculo de combustível consumido)
  const currentSummary = useMemo(() => {
    return aggregatePeriodSummary(filteredRecords, settings.vehicleConfig);
  }, [filteredRecords, settings.vehicleConfig]);

  // Resumo de Hoje
  const todayRecord = useMemo(() => {
    return records.find((r) => r.date === todayStr);
  }, [records, todayStr]);

  const todaySummary = useMemo(() => {
    return aggregatePeriodSummary(todayRecord ? [todayRecord] : [], settings.vehicleConfig);
  }, [todayRecord, settings.vehicleConfig]);

  // Resumo da Semana Atual (Segunda a Domingo)
  const thisWeekRecords = useMemo(() => {
    const range = getMondaySundayWeekRange();
    return records.filter((r) => r.date >= range.startDate && r.date <= range.endDate);
  }, [records]);

  const thisWeekSummary = useMemo(() => {
    return aggregatePeriodSummary(thisWeekRecords, settings.vehicleConfig);
  }, [thisWeekRecords, settings.vehicleConfig]);

  // Resumo do Mês Atual (Mês Calendário)
  const thisMonthRecords = useMemo(() => {
    const range = getCurrentMonthRange();
    return records.filter((r) => r.date >= range.startDate && r.date <= range.endDate);
  }, [records]);

  const thisMonthSummary = useMemo(() => {
    return aggregatePeriodSummary(thisMonthRecords, settings.vehicleConfig);
  }, [thisMonthRecords, settings.vehicleConfig]);


  // Cálculos de Metas
  const dailyProfitGoal = settings.goals.dailyNetProfitGoal || 200;
  const todayProfit = todaySummary.netProfit;
  const dailyGoalPercent = Math.min(
    100,
    dailyProfitGoal > 0 ? Math.max(0, Math.round((todayProfit / dailyProfitGoal) * 100)) : 0
  );
  const dailyProfitRemaining = Math.max(0, dailyProfitGoal - todayProfit);

  const weeklyProfitGoal = settings.goals.weeklyNetProfitGoal || 1200;
  const weekProfit = thisWeekSummary.netProfit;
  const weeklyGoalPercent = Math.min(
    100,
    weeklyProfitGoal > 0 ? Math.max(0, Math.round((weekProfit / weeklyProfitGoal) * 100)) : 0
  );

  const monthlyProfitGoal = settings.goals.monthlyNetProfitGoal || 5000;
  const monthProfit = thisMonthSummary.netProfit;
  const monthlyGoalPercent = Math.min(
    100,
    monthlyProfitGoal > 0 ? Math.max(0, Math.round((monthProfit / monthlyProfitGoal) * 100)) : 0
  );

  // Proporções para a seção "Para onde foi seu dinheiro?"
  const moneyFlow = useMemo(() => {
    const rev = currentSummary.totalRevenue;
    if (rev <= 0) {
      return {
        fuelPercent: 0,
        rentalPercent: 0,
        otherPercent: 0,
        netProfitPercent: 0,
        isLoss: currentSummary.netProfit < 0,
      };
    }

    const fuelPercent = Math.max(0, Math.round((currentSummary.totalFuel / rev) * 100));
    const rentalPercent = Math.max(0, Math.round((currentSummary.totalRental / rev) * 100));
    const otherPercent = Math.max(0, Math.round((currentSummary.totalOther / rev) * 100));
    const netProfitPercent = Math.round((currentSummary.netProfit / rev) * 100);

    return {
      fuelPercent,
      rentalPercent,
      otherPercent,
      netProfitPercent,
      isLoss: currentSummary.netProfit < 0,
    };
  }, [currentSummary]);

  // Dados para gráficos ordenados cronologicamente
  const chronologicalRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredRecords]);

  // Comparação por dias da semana (Segunda a Domingo)
  const dayOfWeekAggregates = useMemo(() => {
    const map: { [day: string]: { profit: number; revenue: number; count: number } } = {
      Seg: { profit: 0, revenue: 0, count: 0 },
      Ter: { profit: 0, revenue: 0, count: 0 },
      Qua: { profit: 0, revenue: 0, count: 0 },
      Qui: { profit: 0, revenue: 0, count: 0 },
      Sex: { profit: 0, revenue: 0, count: 0 },
      Sáb: { profit: 0, revenue: 0, count: 0 },
      Dom: { profit: 0, revenue: 0, count: 0 },
    };

    records.forEach((r) => {
      const dayShort = getDayOfWeekShortBR(r.date);
      if (map[dayShort]) {
        const totalCost = r.fuelCost + r.vehicleRentalCost + r.otherCosts;
        const profit = r.grossRevenue - totalCost;
        map[dayShort].profit += profit;
        map[dayShort].revenue += r.grossRevenue;
        map[dayShort].count += 1;
      }
    });

    return ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day) => {
      const item = map[day];
      return {
        day,
        totalProfit: Math.round(item.profit),
        avgProfit: item.count > 0 ? Math.round(item.profit / item.count) : 0,
        count: item.count,
      };
    });
  }, [records]);

  // Estado Vazio (quando não há nenhum registro salvo)
  if (records.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-8 text-center space-y-6">
        <div className="p-8 md:p-12 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
            <Gauge className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              {greeting}, {settings.driverName || 'Motorista'}!
            </h2>
            <p className="text-sm text-slate-400">
              Você ainda não registrou nenhum dia de trabalho. Registre seu primeiro turno,
              configure o consumo do seu carro ou converse com o Assistente Inteligente.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onNavigateToCalculator}
              className="w-full sm:w-auto h-12 px-6 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 transition"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
              <span>Fazer Primeiro Cálculo Diário</span>
            </button>
            <button
              onClick={onNavigateToFuel}
              className="w-full sm:w-auto h-12 px-5 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 border border-slate-700 transition"
            >
              <Fuel className="w-4 h-4" />
              <span>Combustível & Rentabilidade</span>
            </button>
            <button
              onClick={onNavigateToAssistant}
              className="w-full sm:w-auto h-12 px-4 bg-slate-850 hover:bg-slate-800 text-emerald-300 font-medium text-xs rounded-xl flex items-center justify-center gap-1.5 border border-emerald-500/30 transition"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Assistente IA</span>
            </button>
            <button
              onClick={onSeedSampleData}
              className="w-full sm:w-auto h-12 px-4 bg-slate-900 hover:bg-slate-850 text-slate-400 font-medium text-xs rounded-xl flex items-center justify-center gap-1.5 border border-slate-800 transition"
            >
              <span>Carregar 7 Dias Demo</span>
            </button>
          </div>

          <div className="pt-6 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-2xl mx-auto">
            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/60">
              <span className="text-xs font-semibold text-white block">1. Custo Real/Km</span>
              <span className="text-[11px] text-slate-400">
                Saiba exatamente quanto custa cada quilômetro rodado com seu carro.
              </span>
            </div>
            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/60">
              <span className="text-xs font-semibold text-white block">2. Ganhos por Hora</span>
              <span className="text-[11px] text-slate-400">
                Acompanhe quanto sobrou líquido por cada hora de volante.
              </span>
            </div>
            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/60">
              <span className="text-xs font-semibold text-white block">3. Assistente Inteligente</span>
              <span className="text-[11px] text-slate-400">
                Diagnósticos rápidos para aumentar seu lucro limpo e economizar combustível.
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Cabeçalho Acolhedor com Saudação e CTAs em Destaque */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800/90 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Painel Financeiro 3.0
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400">
              {settings.platform === 'both' ? 'Uber & 99' : settings.platform.toUpperCase()}
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
            {greeting}, {settings.driverName || 'Motorista'}!
          </h1>
          <p className="text-xs text-slate-300">
            {todayRecord ? (
              <span>
                Hoje você registrou{' '}
                <strong className="text-emerald-400 font-mono">
                  {formatCurrency(todaySummary.netProfit)}
                </strong>{' '}
                de lucro líquido ({todaySummary.workedDaysCount > 0 ? 'Turno lançado' : ''}).
              </span>
            ) : (
              <span>Nenhum turno registrado para hoje ainda. Registre suas corridas ao terminar.</span>
            )}
          </p>
        </div>

        {/* Ações de Destaque */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <button
            onClick={onNavigateToFuel}
            className="h-11 px-4 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition"
          >
            <Fuel className="w-4 h-4 fill-slate-950" />
            <span>Combustível & Consumo</span>
          </button>

          <button
            onClick={onNavigateToAssistant}
            className="h-11 px-3.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-semibold rounded-xl border border-emerald-500/30 transition flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Assistente IA</span>
          </button>

          <button
            onClick={onNavigateToCalculator}
            className="h-11 px-3.5 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">Lançar Turno</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtro de Período Segmentado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-800">
        <div className="text-xs text-slate-400">
          Visualizando período:{' '}
          <strong className="text-white">
            {selectedPeriod === 'today'
              ? 'Hoje'
              : selectedPeriod === 'last7'
              ? 'Últimos 7 dias'
              : selectedPeriod === 'thisWeek'
              ? 'Semana Atual (Seg - Dom)'
              : selectedPeriod === 'thisMonth'
              ? 'Mês Atual'
              : 'Intervalo Personalizado'}
          </strong>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto max-w-full">
          <button
            onClick={() => setSelectedPeriod('today')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition ${
              selectedPeriod === 'today'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Hoje
          </button>
          <button
            onClick={() => setSelectedPeriod('last7')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition ${
              selectedPeriod === 'last7'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            7 dias
          </button>
          <button
            onClick={() => setSelectedPeriod('thisWeek')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition ${
              selectedPeriod === 'thisWeek'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Semana Atual
          </button>
          <button
            onClick={() => setSelectedPeriod('thisMonth')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition ${
              selectedPeriod === 'thisMonth'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Mês Atual
          </button>
          <button
            onClick={() => setSelectedPeriod('custom')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition ${
              selectedPeriod === 'custom'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Personalizado
          </button>
        </div>
      </div>

      {/* Intervalo Personalizado (quando selecionado) */}
      {selectedPeriod === 'custom' && (
        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-wrap items-center gap-3 text-xs">
          <span className="text-slate-300 font-medium">De:</span>
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="h-8 px-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs"
          />
          <span className="text-slate-400">Até:</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="h-8 px-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs"
          />
        </div>
      )}

      {/* GRID PRINCIPAL: HIERARQUIA VISUAL
          1. Quanto Ganhei? (Ganhos brutos das corridas)
          2. Quanto Gastei? (Custos operacionais totais)
          3. Quanto Realmente Sobrou? (Lucro líquido operacional - DESTAQUE MÁXIMO)
      */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* CARD PROTAGONISTA: LUCRO LÍQUIDO OPERACIONAL */}
        <div
          className={`md:col-span-6 p-6 rounded-3xl border shadow-lg transition-all flex flex-col justify-between ${
            (currentSummary.operationalNetProfit ?? currentSummary.netProfit) < 0
              ? 'bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-950 border-rose-500/40'
              : 'bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border-emerald-500/40'
          }`}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Quanto Realmente Sobrou?
              </span>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  (currentSummary.operationalNetProfit ?? currentSummary.netProfit) < 0
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {(currentSummary.operationalNetProfit ?? currentSummary.netProfit) < 0
                  ? 'Prejuízo Operacional'
                  : 'Lucro Líquido Operacional'}
              </span>
            </div>

            <div
              className={`text-3xl sm:text-4xl lg:text-5xl font-black font-mono tabular-nums mt-3 tracking-tight ${
                (currentSummary.operationalNetProfit ?? currentSummary.netProfit) < 0
                  ? 'text-rose-400'
                  : 'text-emerald-400'
              }`}
            >
              {formatCurrency(currentSummary.operationalNetProfit ?? currentSummary.netProfit)}
            </div>

            <p className="text-xs text-slate-400 mt-2">
              Lucro operacional líquido considerando o combustível consumido nos {formatNumber(currentSummary.totalKm)} km rodados (sem distorções do dia que encheu o tanque).
            </p>
          </div>

          {/* Sub-indicadores do Lucro Líquido Operacional */}
          <div className="grid grid-cols-3 gap-2 pt-4 mt-4 border-t border-slate-800/80 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block">Margem Líquida</span>
              <span className="font-mono font-bold text-white text-sm">
                {formatPercent(currentSummary.operationalNetMarginPercent ?? currentSummary.netMarginPercent)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Lucro por KM</span>
              <span
                className={`font-mono font-bold text-sm ${
                  (currentSummary.operationalProfitPerKm ?? currentSummary.avgProfitPerKm ?? 0) < 0
                    ? 'text-rose-400'
                    : 'text-emerald-400'
                }`}
              >
                {formatPerKm(currentSummary.operationalProfitPerKm ?? currentSummary.avgProfitPerKm)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Lucro por Hora</span>
              <span className="font-mono font-bold text-white text-sm">
                {currentSummary.avgNetProfitPerHour !== null
                  ? formatPerHour(currentSummary.avgNetProfitPerHour)
                  : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* CARDS SECUNDÁRIOS: GANHOS BRUTOS & CUSTO CONSUMIDO VS ABASTECIMENTO (6 colunas) */}
        <div className="md:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card: Ganhos Brutos das Corridas */}
          <div className="p-5 bg-slate-900/60 border border-slate-800/90 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Ganhos Brutos</span>
                <span className="p-1.5 rounded-lg bg-slate-800 text-slate-200">
                  <DollarSign className="w-4 h-4" />
                </span>
              </div>

              <div className="text-2xl font-extrabold font-mono tabular-nums text-white mt-2">
                {formatCurrency(currentSummary.totalRevenue)}
              </div>
              <span className="text-[11px] text-slate-400 block mt-1">
                Faturamento bruto repassado pelas plataformas
              </span>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Ganho bruto/hora:</span>
              <span className="font-mono font-bold text-white">
                {currentSummary.avgGrossRevenuePerHour !== null
                  ? formatPerHour(currentSummary.avgGrossRevenuePerHour)
                  : 'Não inf.'}
              </span>
            </div>
          </div>

          {/* Card: Custo do Combustível Consumido (Operacional) */}
          <div className="p-5 bg-slate-900/60 border border-slate-800/90 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-300">Combustível Consumido</span>
                  <span className="text-[10px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-1.5 py-0.5 rounded">
                    Estimado
                  </span>
                </div>
                <span className="p-1.5 rounded-lg bg-slate-800 text-amber-400">
                  <Fuel className="w-4 h-4" />
                </span>
              </div>

              <div className="text-2xl font-extrabold font-mono tabular-nums text-amber-400 mt-2">
                {formatCurrency(currentSummary.consumedFuelCost || 0)}
              </div>
              <span className="text-[11px] text-slate-400 block mt-1">
                {formatNumber(currentSummary.consumedFuelLiters || 0, 1)} L consumidos ({settings.vehicleConfig.consumptionKmL} km/l)
              </span>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Custo combustível/km:</span>
              <span className="font-mono font-bold text-slate-200">
                {formatPerKm(
                  settings.vehicleConfig.consumptionKmL > 0
                    ? settings.vehicleConfig.fuelPricePerLiter / settings.vehicleConfig.consumptionKmL
                    : null
                )}
              </span>
            </div>
          </div>

          {/* Card: Abastecimentos no Dia/Período (Fluxo de Caixa) */}
          <div className="p-4 bg-slate-900/60 border border-slate-800/90 rounded-2xl flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400 block">Abastecido no Posto</span>
                <span className="text-[9px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded">
                  Fluxo de Caixa
                </span>
              </div>
              <span className="text-lg font-bold font-mono text-white mt-0.5 block">
                {formatCurrency(currentSummary.refillTotalCost || currentSummary.totalFuel)}
              </span>
              <span className="text-[10px] text-slate-500">
                Pagamentos efetuados na bomba
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">Quilometragem</span>
              <span className="text-sm font-bold text-slate-200 font-mono">
                {formatNumber(currentSummary.totalKm)} km
              </span>
            </div>
          </div>

          {/* Card: Horas Trabalhadas e Dias */}
          <div className="p-4 bg-slate-900/60 border border-slate-800/90 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block">Tempo de Volante</span>
              <span className="text-lg font-bold font-mono text-white mt-0.5 block">
                {currentSummary.totalHoursWorked > 0
                  ? formatHours(currentSummary.totalHoursWorked)
                  : 'Não informado'}
              </span>
              <span className="text-[10px] text-slate-500">
                {currentSummary.workedDaysCount} dia(s) trabalhados
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">Média Lucro/Dia</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">
                {formatCurrency(
                  currentSummary.workedDaysCount > 0
                    ? (currentSummary.operationalNetProfit ?? currentSummary.netProfit) / currentSummary.workedDaysCount
                    : 0
                )}
              </span>
            </div>
          </div>
        </div>
      </div>


      {/* SEÇÃO VISUAL: "PARA ONDE FOI SEU DINHEIRO?" (Requisito Obrigatório) */}
      <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              Para onde foi seu dinheiro?
            </h3>
            <p className="text-xs text-slate-400">
              Decomposição visual de como cada real bruto recebido foi dividido entre custos e lucro limpo.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 font-semibold self-start sm:self-auto">
            Base: {formatCurrency(currentSummary.totalRevenue)}
          </span>
        </div>

        {currentSummary.totalRevenue <= 0 ? (
          <p className="text-xs text-slate-500 py-3 text-center">
            Nenhum faturamento registrado no período selecionado para exibir a composição.
          </p>
        ) : (
          <div className="space-y-4">
            {/* Barra Proporcional Empilhada */}
            <div className="w-full h-5 bg-slate-950 rounded-xl overflow-hidden flex border border-slate-800">
              {/* Combustível */}
              {moneyFlow.fuelPercent > 0 && (
                <div
                  style={{ width: `${moneyFlow.fuelPercent}%` }}
                  className="h-full bg-amber-500 transition-all"
                  title={`Combustível: ${formatCurrency(currentSummary.totalFuel)} (${moneyFlow.fuelPercent}%)`}
                />
              )}
              {/* Aluguel */}
              {moneyFlow.rentalPercent > 0 && (
                <div
                  style={{ width: `${moneyFlow.rentalPercent}%` }}
                  className="h-full bg-blue-500 transition-all"
                  title={`Aluguel/Parcela: ${formatCurrency(currentSummary.totalRental)} (${moneyFlow.rentalPercent}%)`}
                />
              )}
              {/* Outros Custos */}
              {moneyFlow.otherPercent > 0 && (
                <div
                  style={{ width: `${moneyFlow.otherPercent}%` }}
                  className="h-full bg-purple-500 transition-all"
                  title={`Outros: ${formatCurrency(currentSummary.totalOther)} (${moneyFlow.otherPercent}%)`}
                />
              )}
              {/* Lucro Líquido Real */}
              {moneyFlow.netProfitPercent > 0 && (
                <div
                  style={{ width: `${moneyFlow.netProfitPercent}%` }}
                  className="h-full bg-emerald-500 transition-all"
                  title={`Lucro Líquido: ${formatCurrency(currentSummary.netProfit)} (${moneyFlow.netProfitPercent}%)`}
                />
              )}
            </div>

            {/* Legenda com Valores e Percentuais */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
                <div className="flex items-center gap-1.5 text-amber-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="font-semibold">Combustível</span>
                </div>
                <div className="font-mono font-bold text-white text-sm mt-1">
                  {formatCurrency(currentSummary.totalFuel)}
                </div>
                <span className="text-[10px] text-slate-400">{moneyFlow.fuelPercent}% do faturamento</span>
              </div>

              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
                <div className="flex items-center gap-1.5 text-blue-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="font-semibold">Aluguel / Parcela</span>
                </div>
                <div className="font-mono font-bold text-white text-sm mt-1">
                  {formatCurrency(currentSummary.totalRental)}
                </div>
                <span className="text-[10px] text-slate-400">{moneyFlow.rentalPercent}% do faturamento</span>
              </div>

              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
                <div className="flex items-center gap-1.5 text-purple-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  <span className="font-semibold">Outros Operacionais</span>
                </div>
                <div className="font-mono font-bold text-white text-sm mt-1">
                  {formatCurrency(currentSummary.totalOther)}
                </div>
                <span className="text-[10px] text-slate-400">{moneyFlow.otherPercent}% do faturamento</span>
              </div>

              <div className="p-3 bg-emerald-950/30 rounded-xl border border-emerald-800/50">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="font-semibold">Sobrou no Bolso</span>
                </div>
                <div className="font-mono font-bold text-emerald-300 text-sm mt-1">
                  {formatCurrency(currentSummary.netProfit)}
                </div>
                <span className="text-[10px] text-emerald-400 font-semibold">
                  {formatPercent(currentSummary.netMarginPercent)} do faturamento
                </span>
              </div>
            </div>

            {/* Aviso Obrigatório */}
            <div className="p-3 bg-slate-950/40 border border-slate-800/60 rounded-xl text-[11px] text-slate-400 leading-relaxed flex items-start gap-2">
              <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <p>
                <strong>Nota de precisão:</strong> Os resultados apresentados dependem dos custos
                efetivamente informados por você. Custos não registrados (como lavagens, troca de óleo ou
                depreciação) podem fazer o lucro parecer maior do que o real.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* RESPOSTA 5: "COMO POSSO MELHORAR MEU RESULTADO?" (Diretriz Obrigatória) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800/90 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Pergunta 5
              </span>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Como posso melhorar meu resultado?
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Recomendações financeiras práticas geradas com base nas suas métricas do período.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateToAssistant}
              className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition flex items-center gap-1.5 font-semibold"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Perguntar à IA</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Dica 1: Eficiência de Combustível */}
          <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-semibold">
              <Fuel className="w-4 h-4" />
              <span>Controle de Combustível</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              {currentSummary.totalFuel > 0 && currentSummary.totalRevenue > 0
                ? (currentSummary.totalFuel / currentSummary.totalRevenue) > 0.35
                  ? `Combustível consumiu ${Math.round((currentSummary.totalFuel / currentSummary.totalRevenue) * 100)}% da receita (alto). Simule o consumo real do veículo.`
                  : `Combustível consumiu ${Math.round((currentSummary.totalFuel / currentSummary.totalRevenue) * 100)}% da receita (ótima faixa). Mantenha rota otimizada.`
                : 'Cadastre o consumo do seu veículo (km/l) para prever o custo exato por km.'}
            </p>
            <button
              onClick={onNavigateToFuel}
              className="text-[11px] text-emerald-400 hover:underline font-semibold flex items-center gap-1 pt-1"
            >
              <span>Ajustar veículo & consumo</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Dica 2: Lucro por KM */}
          <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <Gauge className="w-4 h-4" />
              <span>Rendimento por KM</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              {(currentSummary.avgProfitPerKm || 0) < 1.0
                ? 'Seu lucro médio por km está abaixo de R$ 1,00/km. Evite rodar vazio buscando passageiros e prefira pontos de alta demanda.'
                : `Seu lucro líquido é de ${formatPerKm(currentSummary.avgProfitPerKm)}. Excelente índice de rentabilidade rodada.`}
            </p>
            <span className="text-[10px] text-slate-500 block font-mono">
              Custo operacional médio: {formatPerKm(currentSummary.avgCostPerKm)}
            </span>
          </div>

          {/* Dica 3: Produtividade por Hora */}
          <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-blue-400 font-semibold">
              <Clock className="w-4 h-4" />
              <span>Horas de Volante</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              {currentSummary.avgNetProfitPerHour !== null
                ? currentSummary.avgNetProfitPerHour < 25
                  ? `Seu ganho limpo está em ${formatPerHour(currentSummary.avgNetProfitPerHour)}. Concentre turnos nos picos de movimento (manhã 6h-9h e tarde 17h-20h).`
                  : `Rendimento de ${formatPerHour(currentSummary.avgNetProfitPerHour)}. Acima da média para turnos urbanos.`
                : 'Registre as horas trabalhadas em cada turno para calcular seu ganho real por hora.'}
            </p>
            <button
              onClick={onNavigateToAssistant}
              className="text-[11px] text-blue-400 hover:underline font-semibold flex items-center gap-1 pt-1"
            >
              <span>Ver diagnóstico do Assistente IA</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Meta Diária & Acumulados da Semana e do Mês */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Meta Diária de Lucro */}
        <div className="p-4 bg-slate-900/60 border border-slate-800/90 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-emerald-400" />
              Meta Diária de Lucro
            </span>
            <span className="font-mono font-bold text-emerald-400">
              {dailyGoalPercent}%
            </span>
          </div>

          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              style={{ width: `${dailyGoalPercent}%` }}
              className="h-full bg-emerald-500 rounded-full transition-all"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span>Hoje: {formatCurrency(todayProfit)}</span>
            <span>
              {dailyProfitRemaining > 0
                ? `Faltam ${formatCurrency(dailyProfitRemaining)}`
                : 'Meta batida! 🎉'}
            </span>
          </div>
        </div>

        {/* Acumulado da Semana (Seg-Dom) */}
        <div className="p-4 bg-slate-900/60 border border-slate-800/90 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              Semana Atual (Seg - Dom)
            </span>
            <span className="font-mono font-bold text-blue-400">
              {weeklyGoalPercent}% da meta
            </span>
          </div>

          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              style={{ width: `${weeklyGoalPercent}%` }}
              className="h-full bg-blue-500 rounded-full transition-all"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span>Lucro: {formatCurrency(thisWeekSummary.netProfit)}</span>
            <span>Meta: {formatCurrency(weeklyProfitGoal)}</span>
          </div>
        </div>

        {/* Acumulado do Mês Atual */}
        <div className="p-4 bg-slate-900/60 border border-slate-800/90 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-purple-400" />
              Mês Atual (Calendário)
            </span>
            <span className="font-mono font-bold text-purple-400">
              {monthlyGoalPercent}% da meta
            </span>
          </div>

          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              style={{ width: `${monthlyGoalPercent}%` }}
              className="h-full bg-purple-500 rounded-full transition-all"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span>Lucro: {formatCurrency(thisMonthSummary.netProfit)}</span>
            <span>Meta: {formatCurrency(monthlyProfitGoal)}</span>
          </div>
        </div>
      </div>

      {/* Gráficos de Evolução e Dias da Semana */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Gráfico 1: Evolução Diária do Lucro Líquido (7 colunas) */}
        <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-white">Evolução do Lucro Líquido Real</h3>
              <p className="text-xs text-slate-400">Valores apurados em cada dia registrado</p>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-bold">
              {filteredRecords.length} turnos
            </span>
          </div>

          {chronologicalRecords.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-xs text-slate-400">
              Sem dados suficientes no período selecionado.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="h-48 flex items-end gap-2 pt-6 pb-2 px-2 overflow-x-auto">
                {chronologicalRecords.map((r) => {
                  const costs = r.fuelCost + r.vehicleRentalCost + r.otherCosts;
                  const profit = r.grossRevenue - costs;

                  const maxVal = Math.max(
                    300,
                    ...chronologicalRecords.map(
                      (x) => Math.abs(x.grossRevenue - (x.fuelCost + x.vehicleRentalCost + x.otherCosts))
                    )
                  );
                  const heightPercent = Math.min(100, Math.max(10, Math.round((Math.abs(profit) / maxVal) * 100)));

                  return (
                    <div
                      key={r.id}
                      className="flex-1 min-w-[38px] flex flex-col items-center gap-1 group relative"
                    >
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 z-20 bg-slate-950 border border-slate-700 px-2 py-1 rounded text-[10px] whitespace-nowrap text-white font-mono pointer-events-none shadow-lg">
                        {formatDateBR(r.date)}: {formatCurrency(profit)}
                      </div>

                      <div className="w-full flex items-end justify-center h-36">
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full max-w-[28px] rounded-t-md transition-all ${
                            profit < 0
                              ? 'bg-rose-500 hover:bg-rose-400'
                              : 'bg-emerald-500 hover:bg-emerald-400'
                          }`}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatDateShortBR(r.date)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> Lucro positivo
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" /> Prejuízo
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Gráfico 2: Desempenho por Dia da Semana (5 colunas) */}
        <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-white">Lucro Médio por Dia da Semana</h3>
              <p className="text-xs text-slate-400">Descubra os dias mais lucrativos</p>
            </div>
            <CalendarDays className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-2.5">
            {dayOfWeekAggregates.map((item) => {
              const maxAvg = Math.max(1, ...dayOfWeekAggregates.map((d) => d.avgProfit));
              const barWidth = item.avgProfit > 0 ? Math.round((item.avgProfit / maxAvg) * 100) : 0;

              return (
                <div key={item.day} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300 w-8">{item.day}</span>
                    <span className="text-slate-400 text-[11px]">
                      {item.count > 0 ? `${item.count} turnos` : 'Sem dados'}
                    </span>
                    <span className="font-mono font-bold text-white text-right min-w-[70px]">
                      {item.count > 0 ? formatCurrency(item.avgProfit) : '—'}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${barWidth}%` }}
                      className={`h-full rounded-full ${
                        item.avgProfit < 0 ? 'bg-rose-500' : 'bg-emerald-500'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
            Acompanhe para calibrar seus dias de descanso sem comprometer a renda.
          </p>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import {
  FileBarChart,
  Calendar,
  TrendingUp,
  TrendingDown,
  Trophy,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Info,
  Fuel,
  DollarSign,
  Gauge,
  Percent,
} from 'lucide-react';
import { DailyRecord, UserSettings } from '../types';
import {
  aggregatePeriodSummary,
  formatCurrency,
  formatDateBR,
  formatNumber,
  formatPerKm,
  formatPercent,
  getDayOfWeekShortBR,
  getMondaySundayWeekRange,
  getCurrentMonthRange,
} from '../utils/finance';
import { getUserSettings } from '../services/storage';

interface ReportsViewProps {
  records: DailyRecord[];
  settings?: UserSettings;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ records, settings }) => {
  const [reportType, setReportType] = useState<'weekly' | 'monthly'>('weekly');
  const [weekOffset, setWeekOffset] = useState<number>(0); // 0 = esta semana, -1 = semana anterior, etc.
  const [monthOffset, setMonthOffset] = useState<number>(0); // 0 = este mês, -1 = mês anterior, etc.

  const activeSettings = useMemo(() => {
    return settings || getUserSettings();
  }, [settings]);

  // Cálculo das datas da Semana Alvo (Segunda a Domingo)
  const targetWeekRange = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    return getMondaySundayWeekRange(d);
  }, [weekOffset]);

  // Cálculo das datas da Semana Anterior para Comparação
  const prevWeekRange = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + (weekOffset - 1) * 7);
    return getMondaySundayWeekRange(d);
  }, [weekOffset]);

  // Registros da semana alvo e anterior
  const currentWeekRecords = useMemo(() => {
    return records.filter(
      (r) => r.date >= targetWeekRange.startDate && r.date <= targetWeekRange.endDate
    );
  }, [records, targetWeekRange]);

  const prevWeekRecords = useMemo(() => {
    return records.filter(
      (r) => r.date >= prevWeekRange.startDate && r.date <= prevWeekRange.endDate
    );
  }, [records, prevWeekRange]);

  // Resumos da Semana com Combustível Consumido
  const currentWeekSummary = useMemo(
    () => aggregatePeriodSummary(currentWeekRecords, activeSettings.vehicleConfig),
    [currentWeekRecords, activeSettings.vehicleConfig]
  );
  const prevWeekSummary = useMemo(
    () => aggregatePeriodSummary(prevWeekRecords, activeSettings.vehicleConfig),
    [prevWeekRecords, activeSettings.vehicleConfig]
  );

  // Cálculo das datas do Mês Alvo (Calendário Real)
  const targetMonthRange = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthOffset);
    return getCurrentMonthRange(d);
  }, [monthOffset]);

  // Cálculo das datas do Mês Anterior para Comparação
  const prevMonthRange = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthOffset - 1);
    return getCurrentMonthRange(d);
  }, [monthOffset]);

  // Registros do mês alvo e anterior
  const currentMonthRecords = useMemo(() => {
    return records.filter(
      (r) => r.date >= targetMonthRange.startDate && r.date <= targetMonthRange.endDate
    );
  }, [records, targetMonthRange]);

  const prevMonthRecords = useMemo(() => {
    return records.filter(
      (r) => r.date >= prevMonthRange.startDate && r.date <= prevMonthRange.endDate
    );
  }, [records, prevMonthRange]);

  // Resumos do Mês com Combustível Consumido
  const currentMonthSummary = useMemo(
    () => aggregatePeriodSummary(currentMonthRecords, activeSettings.vehicleConfig),
    [currentMonthRecords, activeSettings.vehicleConfig]
  );
  const prevMonthSummary = useMemo(
    () => aggregatePeriodSummary(prevMonthRecords, activeSettings.vehicleConfig),
    [prevMonthRecords, activeSettings.vehicleConfig]
  );

  // Seleciona resumo ativo conforme aba
  const activeSummary = reportType === 'weekly' ? currentWeekSummary : currentMonthSummary;
  const activePrevSummary = reportType === 'weekly' ? prevWeekSummary : prevMonthSummary;
  const activeRange = reportType === 'weekly' ? targetWeekRange : targetMonthRange;

  const operationalProfit = activeSummary.operationalNetProfit ?? activeSummary.netProfit;
  const prevOperationalProfit = activePrevSummary.operationalNetProfit ?? activePrevSummary.netProfit;

  // Variação percentual de lucro operacional em relação ao período anterior
  const profitDifference = operationalProfit - prevOperationalProfit;
  const profitVariationPercent =
    prevOperationalProfit !== 0
      ? Math.round((profitDifference / Math.abs(prevOperationalProfit)) * 100)
      : null;

  const totalOtherCosts = activeSummary.totalRental + activeSummary.totalOther;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Título & Alternador de Tipo de Relatório */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileBarChart className="w-6 h-6 text-emerald-400" />
            Relatórios e Demonstrativos Financeiros
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-0.5">
            Demonstração uniforme de custos operacionais, consumo real de combustível e rentabilidade.
          </p>
        </div>

        {/* Abas Semanal vs Mensal */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setReportType('weekly')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition ${
              reportType === 'weekly'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Semanal
          </button>
          <button
            onClick={() => setReportType('monthly')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition ${
              reportType === 'monthly'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Mensal
          </button>
        </div>
      </div>

      {/* Navegador Temporal do Período */}
      <div className="flex items-center justify-between p-3.5 bg-slate-900/60 border border-slate-800 rounded-2xl">
        <button
          onClick={() => {
            if (reportType === 'weekly') setWeekOffset((prev) => prev - 1);
            else setMonthOffset((prev) => prev - 1);
          }}
          className="p-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 text-xs flex items-center gap-1 transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Período Anterior</span>
        </button>

        <div className="text-center">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-emerald-400 block">
            {reportType === 'weekly'
              ? weekOffset === 0
                ? 'Esta Semana'
                : weekOffset === -1
                ? 'Semana Passada'
                : `${Math.abs(weekOffset)} semanas atrás`
              : monthOffset === 0
              ? 'Este Mês'
              : monthOffset === -1
              ? 'Mês Passado'
              : `${Math.abs(monthOffset)} meses atrás`}
          </span>
          <div className="text-sm md:text-base font-bold text-white font-mono mt-0.5">
            {formatDateBR(activeRange.startDate)} até {formatDateBR(activeRange.endDate)}
          </div>
        </div>

        <button
          disabled={reportType === 'weekly' ? weekOffset >= 0 : monthOffset >= 0}
          onClick={() => {
            if (reportType === 'weekly') setWeekOffset((prev) => prev + 1);
            else setMonthOffset((prev) => prev + 1);
          }}
          className={`p-2 rounded-xl bg-slate-950 border text-xs flex items-center gap-1 transition ${
            (reportType === 'weekly' ? weekOffset >= 0 : monthOffset >= 0)
              ? 'opacity-40 border-slate-800 text-slate-600 cursor-not-allowed'
              : 'border-slate-700 text-slate-300 hover:text-white hover:border-slate-500'
          }`}
        >
          <span className="hidden sm:inline">Próximo Período</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Se não houver dados no período */}
      {activeSummary.recordCount === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl space-y-3">
          <Info className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">Sem turnos gravados neste período</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Não há registros de trabalho salvos entre {formatDateBR(activeRange.startDate)} e{' '}
            {formatDateBR(activeRange.endDate)}. Os relatórios do Lucro no Volante utilizam
            exclusivamente dados reais inseridos por você.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Card Comparativo com Período Anterior */}
          <div className="p-5 bg-gradient-to-br from-slate-900/90 to-slate-950 border border-slate-800/90 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Comparativo: Período Atual vs Período Anterior
              </span>
              {activePrevSummary.recordCount > 0 ? (
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1 self-start sm:self-auto ${
                    profitDifference >= 0
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  {profitDifference >= 0 ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                  {profitDifference >= 0 ? '+' : ''}
                  {formatCurrency(profitDifference)}{' '}
                  {profitVariationPercent !== null && `(${profitVariationPercent > 0 ? '+' : ''}${profitVariationPercent}%)`}
                </span>
              ) : (
                <span className="text-xs text-slate-500">Sem dados no período anterior para comparar</span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <span className="text-xs text-slate-400 block">Lucro Líquido Operacional</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span
                    className={`text-2xl font-extrabold font-mono tabular-nums ${
                      operationalProfit < 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {formatCurrency(operationalProfit)}
                  </span>
                  {activePrevSummary.recordCount > 0 && (
                    <span className="text-xs text-slate-500 line-through font-mono">
                      {formatCurrency(prevOperationalProfit)}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <span className="text-xs text-slate-400 block">Faturamento Bruto</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-extrabold font-mono tabular-nums text-white">
                    {formatCurrency(activeSummary.totalRevenue)}
                  </span>
                  {activePrevSummary.recordCount > 0 && (
                    <span className="text-xs text-slate-500 line-through font-mono">
                      {formatCurrency(activePrevSummary.totalRevenue)}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <span className="text-xs text-slate-400 block">Custo Operacional Total</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-extrabold font-mono tabular-nums text-rose-400">
                    {formatCurrency(activeSummary.operationalTotalCosts ?? activeSummary.totalCosts)}
                  </span>
                  {activePrevSummary.recordCount > 0 && (
                    <span className="text-xs text-slate-500 line-through font-mono">
                      {formatCurrency(activePrevSummary.operationalTotalCosts ?? activePrevSummary.totalCosts)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* PAINEL UNIFORME DE 10 INDICADORES OBRIGATÓRIOS (Especificação Lucro no Volante 3.0) */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Gauge className="w-4 h-4 text-emerald-400" />
                Demonstrativo Operacional do Período (10 Indicadores Consolidados)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Visão padronizada dos custos reais calculados a partir da quilometragem e dos abastecimentos de caixa.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* 1. Receita Bruta */}
              <div className="p-3.5 bg-slate-950/70 border border-slate-800/90 rounded-xl">
                <span className="text-[11px] text-slate-400 block">1. Receita Bruta</span>
                <span className="text-base font-bold font-mono text-white tabular-nums mt-0.5 block">
                  {formatCurrency(activeSummary.totalRevenue)}
                </span>
                <span className="text-[10px] text-slate-500">Total recebido</span>
              </div>

              {/* 2. KM Rodados */}
              <div className="p-3.5 bg-slate-950/70 border border-slate-800/90 rounded-xl">
                <span className="text-[11px] text-slate-400 block">2. KM Rodados</span>
                <span className="text-base font-bold font-mono text-white tabular-nums mt-0.5 block">
                  {formatNumber(activeSummary.totalKm)} km
                </span>
                <span className="text-[10px] text-slate-500">{activeSummary.workedDaysCount} dias rodados</span>
              </div>

              {/* 3. Combustível Consumido (L) */}
              <div className="p-3.5 bg-slate-950/70 border border-slate-800/90 rounded-xl">
                <span className="text-[11px] text-slate-400 block">3. Combustível Consumido (L)</span>
                <span className="text-base font-bold font-mono text-amber-300 tabular-nums mt-0.5 block">
                  {formatNumber(activeSummary.consumedFuelLiters || 0, 1)} L
                </span>
                <span className="text-[10px] text-slate-500">Média {activeSettings.vehicleConfig.consumptionKmL} km/L</span>
              </div>

              {/* 4. Custo do Combustível Consumido (R$) */}
              <div className="p-3.5 bg-slate-950/70 border border-slate-800/90 rounded-xl">
                <span className="text-[11px] text-slate-400 block">4. Custo Consumido (R$)</span>
                <span className="text-base font-bold font-mono text-amber-400 tabular-nums mt-0.5 block">
                  {formatCurrency(activeSummary.consumedFuelCost || 0)}
                </span>
                <span className="text-[10px] text-slate-500">{formatCurrency(activeSettings.vehicleConfig.fuelPricePerLiter)}/L</span>
              </div>

              {/* 5. Abastecimentos no Período (R$) */}
              <div className="p-3.5 bg-slate-950/70 border border-slate-800/90 rounded-xl">
                <span className="text-[11px] text-slate-400 block">5. Abastecido no Posto</span>
                <span className="text-base font-bold font-mono text-slate-300 tabular-nums mt-0.5 block">
                  {formatCurrency(activeSummary.refillTotalCost || activeSummary.totalFuel)}
                </span>
                <span className="text-[10px] text-slate-500">Fluxo de Caixa</span>
              </div>

              {/* 6. Outras Despesas Operacionais (R$) */}
              <div className="p-3.5 bg-slate-950/70 border border-slate-800/90 rounded-xl">
                <span className="text-[11px] text-slate-400 block">6. Outras Despesas (R$)</span>
                <span className="text-base font-bold font-mono text-rose-400 tabular-nums mt-0.5 block">
                  {formatCurrency(totalOtherCosts)}
                </span>
                <span className="text-[10px] text-slate-500">Aluguel, pedágios, etc.</span>
              </div>

              {/* 7. Lucro Líquido Operacional (R$) */}
              <div className="p-3.5 bg-slate-950/70 border border-emerald-500/30 rounded-xl bg-gradient-to-br from-emerald-950/20 to-slate-950">
                <span className="text-[11px] text-emerald-400 font-semibold block">7. Lucro Operacional (R$)</span>
                <span
                  className={`text-base font-extrabold font-mono tabular-nums mt-0.5 block ${
                    operationalProfit < 0 ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {formatCurrency(operationalProfit)}
                </span>
                <span className="text-[10px] text-slate-400">Receita − Custos Op.</span>
              </div>

              {/* 8. Custo por KM (R$/km) */}
              <div className="p-3.5 bg-slate-950/70 border border-slate-800/90 rounded-xl">
                <span className="text-[11px] text-slate-400 block">8. Custo por KM</span>
                <span className="text-base font-bold font-mono text-slate-200 tabular-nums mt-0.5 block">
                  {formatPerKm(activeSummary.operationalCostPerKm ?? activeSummary.avgCostPerKm)}
                </span>
                <span className="text-[10px] text-slate-500">Operacional</span>
              </div>

              {/* 9. Lucro Líquido por KM (R$/km) */}
              <div className="p-3.5 bg-slate-950/70 border border-slate-800/90 rounded-xl">
                <span className="text-[11px] text-slate-400 block">9. Lucro Líquido por KM</span>
                <span
                  className={`text-base font-bold font-mono tabular-nums mt-0.5 block ${
                    (activeSummary.operationalProfitPerKm ?? activeSummary.avgProfitPerKm ?? 0) < 0
                      ? 'text-rose-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {formatPerKm(activeSummary.operationalProfitPerKm ?? activeSummary.avgProfitPerKm)}
                </span>
                <span className="text-[10px] text-slate-500">Por km rodado</span>
              </div>

              {/* 10. Margem Líquida (%) */}
              <div className="p-3.5 bg-slate-950/70 border border-slate-800/90 rounded-xl">
                <span className="text-[11px] text-slate-400 block">10. Margem Líquida (%)</span>
                <span className="text-base font-bold font-mono text-emerald-400 tabular-nums mt-0.5 block">
                  {formatPercent(activeSummary.operationalNetMarginPercent ?? activeSummary.netMarginPercent)}
                </span>
                <span className="text-[10px] text-slate-500">Eficiência percentual</span>
              </div>
            </div>
          </div>

          {/* Destaques: Melhor Dia vs Pior Dia */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Melhor Dia */}
            <div className="p-4 bg-emerald-950/20 border border-emerald-800/40 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <span className="text-[11px] text-emerald-300 font-semibold block">
                  Melhor Dia do Período
                </span>
                {activeSummary.bestDay ? (
                  <div className="flex items-baseline justify-between mt-0.5">
                    <span className="text-sm font-bold text-white">
                      {formatDateBR(activeSummary.bestDay.date)} ({getDayOfWeekShortBR(activeSummary.bestDay.date)})
                    </span>
                    <span className="text-base font-extrabold font-mono text-emerald-400">
                      {formatCurrency(activeSummary.bestDay.profit)}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                )}
              </div>
            </div>

            {/* Pior Dia */}
            <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <span className="text-[11px] text-slate-400 font-semibold block">
                  Dia Menos Lucrativo do Período
                </span>
                {activeSummary.worstDay ? (
                  <div className="flex items-baseline justify-between mt-0.5">
                    <span className="text-sm font-bold text-white">
                      {formatDateBR(activeSummary.worstDay.date)} ({getDayOfWeekShortBR(activeSummary.worstDay.date)})
                    </span>
                    <span className="text-base font-extrabold font-mono text-slate-300">
                      {formatCurrency(activeSummary.worstDay.profit)}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

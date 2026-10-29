import React, { useState, useMemo } from 'react';
import {
  History,
  Calendar,
  Search,
  Filter,
  ArrowUpDown,
  Trash2,
  Edit3,
  Eye,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  X,
  Fuel,
  KeyRound,
  Wrench,
  Gauge,
  FileText,
  Clock,
} from 'lucide-react';
import { DailyRecord, DatePeriodFilter } from '../types';
import {
  aggregatePeriodSummary,
  calculateDailyMetrics,
  formatCurrency,
  formatDateBR,
  formatNumber,
  formatPerKm,
  formatPercent,
  formatPerHour,
  formatHours,
  getDayOfWeekBR,
  getLast7DaysRange,
  getMondaySundayWeekRange,
  getCurrentMonthRange,
  getTodayDateString,
} from '../utils/finance';
import { deleteDailyRecord } from '../services/storage';

interface HistoryViewProps {
  records: DailyRecord[];
  onEditRecord: (record: DailyRecord) => void;
  onNavigateToCalculator: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  records,
  onEditRecord,
  onNavigateToCalculator,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<DatePeriodFilter | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'date_desc' | 'date_asc' | 'profit_desc' | 'revenue_desc'>('date_desc');
  
  // Modais de detalhe e exclusão
  const [viewingRecord, setViewingRecord] = useState<DailyRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<DailyRecord | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const todayStr = getTodayDateString();

  // Filtra registros
  const filteredRecords = useMemo(() => {
    let result = [...records];

    // Filtro de período
    if (selectedPeriod === 'today') {
      result = result.filter((r) => r.date === todayStr);
    } else if (selectedPeriod === 'last7') {
      const range = getLast7DaysRange();
      result = result.filter((r) => r.date >= range.startDate && r.date <= range.endDate);
    } else if (selectedPeriod === 'thisWeek') {
      const range = getMondaySundayWeekRange();
      result = result.filter((r) => r.date >= range.startDate && r.date <= range.endDate);
    } else if (selectedPeriod === 'thisMonth') {
      const range = getCurrentMonthRange();
      result = result.filter((r) => r.date >= range.startDate && r.date <= range.endDate);
    }

    // Busca por termo (observações ou data)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (r) =>
          (r.notes && r.notes.toLowerCase().includes(term)) ||
          r.date.includes(term) ||
          formatDateBR(r.date).includes(term)
      );
    }

    // Ordenação
    result.sort((a, b) => {
      const costsA = a.fuelCost + a.vehicleRentalCost + a.otherCosts;
      const profitA = a.grossRevenue - costsA;

      const costsB = b.fuelCost + b.vehicleRentalCost + b.otherCosts;
      const profitB = b.grossRevenue - costsB;

      if (sortOrder === 'date_desc') return b.date.localeCompare(a.date);
      if (sortOrder === 'date_asc') return a.date.localeCompare(b.date);
      if (sortOrder === 'profit_desc') return profitB - profitA;
      if (sortOrder === 'revenue_desc') return b.grossRevenue - a.grossRevenue;
      return 0;
    });

    return result;
  }, [records, selectedPeriod, searchTerm, sortOrder, todayStr]);

  // Resumo do período filtrado
  const filteredSummary = useMemo(() => {
    return aggregatePeriodSummary(filteredRecords);
  }, [filteredRecords]);

  // Executa exclusão
  const handleConfirmDelete = () => {
    if (!recordToDelete) return;
    const ok = deleteDailyRecord(recordToDelete.id);
    if (ok) {
      setNotification(`Registro de ${formatDateBR(recordToDelete.date)} excluído.`);
      setTimeout(() => setNotification(null), 3000);
    }
    setRecordToDelete(null);
    if (viewingRecord?.id === recordToDelete.id) {
      setViewingRecord(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Título & Estatística Rápida */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-emerald-400" />
            Histórico de Resultados
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-0.5">
            Consulte, audite e filtre todos os turnos de trabalho registrados.
          </p>
        </div>

        <button
          onClick={onNavigateToCalculator}
          className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition self-start sm:self-auto"
        >
          + Adicionar Registro
        </button>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs">
          {notification}
        </div>
      )}

      {/* Barra de Filtros e Busca */}
      <div className="p-4 bg-slate-900/60 border border-slate-800/90 rounded-2xl space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Período */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setSelectedPeriod('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedPeriod === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos ({records.length})
            </button>
            <button
              onClick={() => setSelectedPeriod('today')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedPeriod === 'today'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Hoje
            </button>
            <button
              onClick={() => setSelectedPeriod('last7')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedPeriod === 'last7'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              7 dias
            </button>
            <button
              onClick={() => setSelectedPeriod('thisWeek')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedPeriod === 'thisWeek'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Semana Atual
            </button>
            <button
              onClick={() => setSelectedPeriod('thisMonth')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedPeriod === 'thisMonth'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Mês Atual
            </button>
          </div>

          {/* Busca e Ordenação */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 md:w-56">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por notas ou data..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-9 pl-9 pr-3 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="h-9 px-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="date_desc">Mais recentes</option>
              <option value="date_asc">Mais antigos</option>
              <option value="profit_desc">Maior lucro</option>
              <option value="revenue_desc">Maior faturamento</option>
            </select>
          </div>
        </div>

        {/* Totais do Período Filtrado */}
        {filteredRecords.length > 0 && (
          <div className="pt-3 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/60">
              <span className="text-[11px] text-slate-400 block">Total Faturado</span>
              <span className="font-mono font-bold text-white text-sm">
                {formatCurrency(filteredSummary.totalRevenue)}
              </span>
            </div>
            <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/60">
              <span className="text-[11px] text-slate-400 block">Total de Custos</span>
              <span className="font-mono font-bold text-rose-400 text-sm">
                {formatCurrency(filteredSummary.totalCosts)}
              </span>
            </div>
            <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/60">
              <span className="text-[11px] text-slate-400 block">Lucro Líquido Acumulado</span>
              <span
                className={`font-mono font-bold text-sm ${
                  filteredSummary.netProfit < 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {formatCurrency(filteredSummary.netProfit)}
              </span>
            </div>
            <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/60">
              <span className="text-[11px] text-slate-400 block">Km & Custo Médio</span>
              <span className="font-mono font-bold text-slate-200 text-sm">
                {formatNumber(filteredSummary.totalKm)} km ({formatPerKm(filteredSummary.avgCostPerKm)})
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Lista de Registros */}
      {filteredRecords.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl space-y-3">
          <p className="text-sm text-slate-400">
            Nenhum registro encontrado para os filtros selecionados.
          </p>
          <button
            onClick={onNavigateToCalculator}
            className="text-xs px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition"
          >
            Registrar Novo Turno
          </button>
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl overflow-hidden shadow-sm">
          {/* Tabela no Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Faturamento</th>
                  <th className="py-3 px-4">Custos Totais</th>
                  <th className="py-3 px-4">Lucro Líquido</th>
                  <th className="py-3 px-4">Quilometragem</th>
                  <th className="py-3 px-4">Custo / Km</th>
                  <th className="py-3 px-4">Margem</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {filteredRecords.map((r) => {
                  const metrics = calculateDailyMetrics({
                    grossRevenue: r.grossRevenue,
                    fuelCost: r.fuelCost,
                    vehicleRentalCost: r.vehicleRentalCost,
                    otherCosts: r.otherCosts,
                    mileageKm: r.mileageKm,
                    hoursWorked: r.hoursWorked,
                  });

                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                      onClick={() => setViewingRecord(r)}
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{formatDateBR(r.date)}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                          <span>{getDayOfWeekBR(r.date)}</span>
                          {r.hoursWorked ? (
                            <span className="text-blue-400 font-mono text-[10px]">
                              • {formatHours(r.hoursWorked)}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-white">
                        {formatCurrency(metrics.grossRevenue)}
                      </td>
                      <td className="py-3 px-4 font-mono text-rose-400">
                        {formatCurrency(metrics.totalCosts)}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold">
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${
                            metrics.isLoss
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {formatCurrency(metrics.netProfit)}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {r.mileageKm} km
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">
                        {formatPerKm(metrics.costPerKm)}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {formatPercent(metrics.netMarginPercent)}
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewingRecord(r)}
                            title="Ver Detalhes"
                            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditRecord(r)}
                            title="Editar Registro"
                            className="p-1.5 text-slate-400 hover:text-emerald-400 rounded hover:bg-slate-800 transition"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setRecordToDelete(r)}
                            title="Excluir Registro"
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Cards no Mobile (Touch ergonomia) */}
          <div className="md:hidden divide-y divide-slate-800/80">
            {filteredRecords.map((r) => {
              const metrics = calculateDailyMetrics({
                grossRevenue: r.grossRevenue,
                fuelCost: r.fuelCost,
                vehicleRentalCost: r.vehicleRentalCost,
                otherCosts: r.otherCosts,
                mileageKm: r.mileageKm,
                hoursWorked: r.hoursWorked,
              });

              return (
                <div
                  key={r.id}
                  onClick={() => setViewingRecord(r)}
                  className="p-4 active:bg-slate-800/60 transition space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white text-sm">
                        {formatDateBR(r.date)}
                      </span>
                      <span className="text-[11px] text-slate-400 ml-2">
                        {getDayOfWeekBR(r.date)}
                      </span>
                      {r.hoursWorked ? (
                        <span className="ml-2 text-[10px] font-mono text-blue-400 bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-900/40">
                          {formatHours(r.hoursWorked)}
                        </span>
                      ) : null}
                    </div>

                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                        metrics.isLoss
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {formatCurrency(metrics.netProfit)}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                    <div>
                      <span className="block text-slate-500">Faturamento</span>
                      <span className="font-mono font-semibold text-white">
                        {formatCurrency(metrics.grossRevenue)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-slate-500">Custos</span>
                      <span className="font-mono text-rose-400">
                        {formatCurrency(metrics.totalCosts)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-slate-500">Km / Custo</span>
                      <span className="font-mono text-slate-300">
                        {r.mileageKm}km ({formatPerKm(metrics.costPerKm)})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400">
                      Margem: <strong className="text-white">{formatPercent(metrics.netMarginPercent)}</strong>
                    </span>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onEditRecord(r)}
                        className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-white"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setRecordToDelete(r)}
                        className="text-xs px-2.5 py-1 rounded bg-rose-950/40 text-rose-400 hover:bg-rose-900/50"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal de Detalhes de um Dia */}
      {viewingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setViewingRecord(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Turno de {formatDateBR(viewingRecord.date)}</span>
                <span className="text-xs font-normal text-slate-400">
                  ({getDayOfWeekBR(viewingRecord.date)})
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Detalhamento completo das receitas e custos operacionais deste dia.
              </p>
            </div>

            {/* Calculados */}
            {(() => {
              const m = calculateDailyMetrics({
                grossRevenue: viewingRecord.grossRevenue,
                fuelCost: viewingRecord.fuelCost,
                vehicleRentalCost: viewingRecord.vehicleRentalCost,
                otherCosts: viewingRecord.otherCosts,
                mileageKm: viewingRecord.mileageKm,
                hoursWorked: viewingRecord.hoursWorked,
              });

              return (
                <div className="space-y-4">
                  {/* Card Destaque de Lucro */}
                  <div
                    className={`p-4 rounded-xl border ${
                      m.isLoss
                        ? 'bg-rose-950/30 border-rose-800/60'
                        : 'bg-emerald-950/30 border-emerald-800/60'
                    }`}
                  >
                    <span className="text-xs text-slate-400 block">Lucro Líquido Real</span>
                    <span
                      className={`text-2xl font-extrabold font-mono tabular-nums ${
                        m.isLoss ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {formatCurrency(m.netProfit)}
                    </span>
                    <span className="text-xs text-slate-400 block mt-1">
                      Margem Líquida: <strong className="text-white">{formatPercent(m.netMarginPercent)}</strong>
                    </span>
                  </div>

                  {/* Grid de Detalhes */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-slate-400 block">Faturamento Bruto</span>
                      <span className="font-mono font-bold text-white text-base">
                        {formatCurrency(m.grossRevenue)}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-slate-400 block">Custos Totais</span>
                      <span className="font-mono font-bold text-rose-400 text-base">
                        {formatCurrency(m.totalCosts)}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-slate-400 block">Quilômetros Rodados</span>
                      <span className="font-mono font-bold text-white text-base">
                        {viewingRecord.mileageKm} km
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-slate-400 block">Custo por Km</span>
                      <span className="font-mono font-bold text-slate-200 text-base">
                        {formatPerKm(m.costPerKm)}
                      </span>
                    </div>
                  </div>

                  {/* Indicadores de Tempo & Rendimento por Hora */}
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-400" />
                        Jornada & Rendimento por Hora
                      </span>
                      {viewingRecord.hoursWorked !== undefined && viewingRecord.hoursWorked > 0 ? (
                        <span className="font-mono text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                          {formatHours(viewingRecord.hoursWorked)}
                          {viewingRecord.startTime && viewingRecord.endTime ? ` (${viewingRecord.startTime} - ${viewingRecord.endTime})` : ''}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Não informado</span>
                      )}
                    </div>

                    {viewingRecord.hoursWorked !== undefined && viewingRecord.hoursWorked > 0 ? (
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-900">
                        <div className="flex justify-between items-center bg-slate-900/60 p-2 rounded-lg">
                          <span className="text-slate-400">Bruto / Hora:</span>
                          <span className="font-mono font-semibold text-white">
                            {formatPerHour(m.grossRevenuePerHour)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-900/60 p-2 rounded-lg">
                          <span className="text-slate-400">Líquido / Hora:</span>
                          <span className={`font-mono font-semibold ${m.isLoss ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {formatPerHour(m.netProfitPerHour)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 italic pt-1">
                        Horas trabalhadas não foram informadas neste turno. Para visualizar os ganhos por hora, clique em "Editar Este Registro".
                      </p>
                    )}
                  </div>

                  {/* Detalhamento das saídas */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                    <span className="font-semibold text-slate-300 block">Despesas discriminadas:</span>
                    <div className="flex justify-between text-slate-400">
                      <span>Combustível:</span>
                      <span className="font-mono text-slate-200">
                        {formatCurrency(viewingRecord.fuelCost)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Aluguel / Parcela:</span>
                      <span className="font-mono text-slate-200">
                        {formatCurrency(viewingRecord.vehicleRentalCost)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Outros custos operacionais:</span>
                      <span className="font-mono text-slate-200">
                        {formatCurrency(viewingRecord.otherCosts)}
                      </span>
                    </div>
                  </div>

                  {/* Notas */}
                  {viewingRecord.notes && (
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-300">
                      <span className="text-slate-500 font-semibold block mb-0.5">Observações:</span>
                      <p>{viewingRecord.notes}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => {
                        const rec = viewingRecord;
                        setViewingRecord(null);
                        onEditRecord(rec);
                      }}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition"
                    >
                      Editar Este Registro
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {recordToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Excluir Registro?</h3>
              <p className="text-xs text-slate-400">
                Tem certeza que deseja apagar o registro de{' '}
                <strong className="text-white">{formatDateBR(recordToDelete.date)}</strong>? Esta ação é irreversível.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                className="h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="h-11 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-lg shadow-rose-600/20"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

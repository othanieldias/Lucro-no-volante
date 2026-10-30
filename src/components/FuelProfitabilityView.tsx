import React, { useState, useMemo } from 'react';
import {
  Fuel,
  Gauge,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  Car,
  Zap,
  Info,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Percent,
  Sliders,
  Save,
  RotateCcw,
} from 'lucide-react';
import {
  DailyRecord,
  DatePeriodFilter,
  FuelPeriodAnalysis,
  FuelType,
  UserSettings,
  VehicleConfig,
} from '../types';
import {
  calculateFuelPeriodAnalysis,
  formatCurrency,
  formatNumber,
  formatPerKm,
  formatPerHour,
  formatPercent,
  formatHours,
  getCurrentMonthRange,
  getLast7DaysRange,
  getMondaySundayWeekRange,
  getTodayDateString,
  parseBrazilianInput,
} from '../utils/finance';
import { saveUserSettings } from '../services/storage';

interface FuelProfitabilityViewProps {
  records: DailyRecord[];
  settings: UserSettings;
  onSettingsUpdated: (updated: UserSettings) => void;
  onNavigateToCalculator: () => void;
}

export const FuelProfitabilityView: React.FC<FuelProfitabilityViewProps> = ({
  records,
  settings,
  onSettingsUpdated,
  onNavigateToCalculator,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<DatePeriodFilter>('last7');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  // Formulário de Configuração do Veículo
  const [vehicleName, setVehicleName] = useState<string>(settings.vehicleConfig.vehicleName);
  const [fuelType, setFuelType] = useState<FuelType>(settings.vehicleConfig.fuelType);
  const [consumptionStr, setConsumptionStr] = useState<string>(
    String(settings.vehicleConfig.consumptionKmL).replace('.', ',')
  );
  const [fuelPriceStr, setFuelPriceStr] = useState<string>(
    String(settings.vehicleConfig.fuelPricePerLiter).replace('.', ',')
  );
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const todayStr = getTodayDateString();

  // Filtra registros pelo período selecionado
  const filteredRecords = useMemo(() => {
    let start = todayStr;
    let end = todayStr;

    if (selectedPeriod === 'today') {
      start = todayStr;
      end = todayStr;
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
    } else if (selectedPeriod === 'custom' && customStart && customEnd) {
      start = customStart;
      end = customEnd;
    }

    return records.filter((r) => r.date >= start && r.date <= end);
  }, [records, selectedPeriod, todayStr, customStart, customEnd]);

  // Executa análise de combustível e rentabilidade do período
  const fuelAnalysis: FuelPeriodAnalysis = useMemo(() => {
    return calculateFuelPeriodAnalysis(filteredRecords, settings.vehicleConfig);
  }, [filteredRecords, settings.vehicleConfig]);

  // Salva configurações do veículo com validação
  const handleSaveVehicleConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedConsumption = parseBrazilianInput(consumptionStr);
    const parsedPrice = parseBrazilianInput(fuelPriceStr);

    if (parsedConsumption <= 0) {
      setValidationError('O consumo médio deve ser maior que zero (ex: 10,5 km/l).');
      return;
    }

    if (parsedPrice <= 0) {
      setValidationError('O preço do combustível deve ser maior que zero (ex: R$ 5,85).');
      return;
    }

    setValidationError(null);

    const updatedConfig: VehicleConfig = {
      vehicleName: vehicleName.trim() || 'Meu Veículo',
      fuelType,
      consumptionKmL: parsedConsumption,
      fuelPricePerLiter: parsedPrice,
    };

    const updatedSettings = saveUserSettings({ vehicleConfig: updatedConfig });
    onSettingsUpdated(updatedSettings);

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Nomes amigáveis dos combustíveis
  const fuelTypeLabels: Record<FuelType, string> = {
    gasolina: 'Gasolina',
    etanol: 'Etanol (Álcool)',
    diesel: 'Diesel',
    gnv: 'GNV (Gás Natural)',
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Fuel className="w-6 h-6 text-emerald-400" />
            Combustível e Rentabilidade
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-0.5">
            Monitore o custo real de cada quilômetro rodado e a eficiência energética da sua jornada.
          </p>
        </div>

        <button
          onClick={onNavigateToCalculator}
          className="text-xs px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition self-start sm:self-auto shadow-md shadow-emerald-500/10"
        >
          + Lançar Turno do Dia
        </button>
      </div>

      {/* Grid Principal: Configuração do Veículo + Painel de Período */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Painel Esquerdo: Formulário de Configuração do Veículo (4 colunas) */}
        <div className="lg:col-span-4 bg-slate-900/60 border border-slate-800/90 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white">Configuração do Veículo</h2>
            </div>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
              Parâmetros Ativos
            </span>
          </div>

          {validationError && (
            <div className="p-3 bg-rose-950/40 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-800 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Configurações salvas e aplicadas a todas as análises!</span>
            </div>
          )}

          <form onSubmit={handleSaveVehicleConfig} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Identificação do Veículo</label>
              <input
                type="text"
                value={vehicleName}
                onChange={(e) => setVehicleName(e.target.value)}
                placeholder="Ex: Onix 1.0 Flex"
                className="w-full h-10 px-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Tipo de Combustível</label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value as FuelType)}
                className="w-full h-10 px-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="gasolina">Gasolina</option>
                <option value="etanol">Etanol (Álcool)</option>
                <option value="diesel">Diesel</option>
                <option value="gnv">GNV (Gás Natural)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Consumo (km/l) *</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={consumptionStr}
                  onChange={(e) => setConsumptionStr(e.target.value)}
                  placeholder="Ex: 10,5"
                  className="w-full h-10 px-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Preço/Litro (R$) *</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={fuelPriceStr}
                  onChange={(e) => setFuelPriceStr(e.target.value)}
                  placeholder="Ex: 5,85"
                  className="w-full h-10 px-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Resumo do custo teórico por km */}
            {fuelAnalysis.fuelCostPerKm !== null && (
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400 block">Custo Teórico do Combustível:</span>
                <span className="text-base font-extrabold font-mono text-emerald-400">
                  {formatPerKm(fuelAnalysis.fuelCostPerKm)}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  (R$ {formatNumber(settings.vehicleConfig.fuelPricePerLiter)} ÷ {formatNumber(settings.vehicleConfig.consumptionKmL)} km/l)
                </span>
              </div>
            )}

            <button
              type="submit"
              className="w-full h-11 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Configuração</span>
            </button>
          </form>
        </div>

        {/* Painel Direito: Análise do Período Selecionado (8 colunas) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Barra de Filtro de Período Sincronizado */}
          <div className="p-3 bg-slate-900/60 border border-slate-800/90 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setSelectedPeriod('today')}
                className={`px-3 py-1.5 rounded-lg transition font-medium whitespace-nowrap ${
                  selectedPeriod === 'today'
                    ? 'bg-slate-800 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Hoje
              </button>
              <button
                onClick={() => setSelectedPeriod('last7')}
                className={`px-3 py-1.5 rounded-lg transition font-medium whitespace-nowrap ${
                  selectedPeriod === 'last7'
                    ? 'bg-slate-800 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Últimos 7 dias
              </button>
              <button
                onClick={() => setSelectedPeriod('thisWeek')}
                className={`px-3 py-1.5 rounded-lg transition font-medium whitespace-nowrap ${
                  selectedPeriod === 'thisWeek'
                    ? 'bg-slate-800 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Semana Atual
              </button>
              <button
                onClick={() => setSelectedPeriod('thisMonth')}
                className={`px-3 py-1.5 rounded-lg transition font-medium whitespace-nowrap ${
                  selectedPeriod === 'thisMonth'
                    ? 'bg-slate-800 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Mês Atual
              </button>
            </div>

            <span className="text-[11px] text-slate-400 font-mono">
              {filteredRecords.length} turno(s) no período
            </span>
          </div>

          {/* Banner de Precisão e Ausência de Dupla Contagem */}
          <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-start gap-3 text-xs leading-relaxed">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-white block">
                Regra de Precisão Contábil (Sem Dupla Contagem):
              </span>
              {fuelAnalysis.hasRecordedFuel ? (
                <p className="text-slate-300 text-[11px]">
                  Você já registrou <strong className="text-emerald-400 font-mono">{formatCurrency(fuelAnalysis.totalRecordedFuel)}</strong> em despesas reais de combustível neste período. 
                  Esse valor é o utilizado na contabilidade oficial. A estimativa calculada por km/l (<span className="text-slate-300 font-mono">{formatCurrency(fuelAnalysis.estimatedFuelCost)}</span>) é apresentada como referência de eficiência e <strong>nunca é somada</strong> à despesa real.
                </p>
              ) : (
                <p className="text-slate-300 text-[11px]">
                  Nenhum abastecimento foi registrado diretamente nos turnos selecionados. O resultado estimado abaixo utiliza a projeção de <strong className="text-amber-400 font-mono">{formatCurrency(fuelAnalysis.estimatedFuelCost)}</strong> com base na média de {formatNumber(settings.vehicleConfig.consumptionKmL)} km/l do seu veículo.
                </p>
              )}
            </div>
          </div>

          {/* Grid de Métricas Principais de Combustível */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {/* 1. Quilômetros */}
            <div className="p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-1">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-blue-400" />
                KM Percorrido
              </span>
              <div className="text-lg font-bold font-mono text-white">
                {formatNumber(fuelAnalysis.totalKm)} km
              </div>
              <span className="text-[10px] text-slate-500 block">Registrados nos turnos</span>
            </div>

            {/* 2. Litros Estimados */}
            <div className="p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-1">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Fuel className="w-3.5 h-3.5 text-amber-400" />
                Consumo Estimado
              </span>
              <div className="text-lg font-bold font-mono text-amber-400">
                {formatNumber(fuelAnalysis.estimatedLiters)} L
              </div>
              <span className="text-[10px] text-slate-500 block">
                {fuelTypeLabels[settings.vehicleConfig.fuelType]}
              </span>
            </div>

            {/* 3. Custo por KM */}
            <div className="p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-1">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-rose-400" />
                Custo de Comb./KM
              </span>
              <div className="text-lg font-bold font-mono text-slate-200">
                {fuelAnalysis.fuelCostPerKm ? formatPerKm(fuelAnalysis.fuelCostPerKm) : '—'}
              </div>
              <span className="text-[10px] text-slate-500 block">Preço ÷ Consumo km/l</span>
            </div>

            {/* 4. Gasto Estimado */}
            <div className="p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-1">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                Gasto Estimado
              </span>
              <div className="text-lg font-bold font-mono text-rose-400">
                {formatCurrency(fuelAnalysis.estimatedFuelCost)}
              </div>
              <span className="text-[10px] text-slate-500 block">Litros × R$/litro</span>
            </div>
          </div>

          {/* Comparativo: Despesa Real vs. Estimativa */}
          <div className="p-4 bg-slate-900/60 border border-slate-800/90 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Auditoria de Combustível no Período
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Combustível Real Lançado:</span>
                  <span className="font-mono text-white font-bold text-sm">
                    {formatCurrency(fuelAnalysis.totalRecordedFuel)}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Soma de todas as notas e abastecimentos declarados na calculadora diária.
                </p>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Combustível Estimado por KM/L:</span>
                  <span className="font-mono text-amber-400 font-bold text-sm">
                    {formatCurrency(fuelAnalysis.estimatedFuelCost)}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Projeção teórica calculada pelo hodômetro ({formatNumber(fuelAnalysis.totalKm)} km rodados).
                </p>
              </div>
            </div>

            {/* Se houver diferença entre real e estimado, mostra a divergência para o motorista auditar */}
            {fuelAnalysis.hasRecordedFuel && fuelAnalysis.totalKm > 0 && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  Diferença (Real vs. Teórico):
                </span>
                {(() => {
                  const diff = fuelAnalysis.totalRecordedFuel - fuelAnalysis.estimatedFuelCost;
                  const isMoreExpensive = diff > 0;
                  return (
                    <span
                      className={`font-mono font-bold ${
                        isMoreExpensive ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {isMoreExpensive ? '+' : ''}
                      {formatCurrency(diff)}{' '}
                      <span className="text-[10px] font-normal text-slate-400">
                        {isMoreExpensive
                          ? '(gasto real acima do consumo teórico)'
                          : '(gasto real abaixo do consumo teórico)'}
                      </span>
                    </span>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Demonstrativo Completo de Rentabilidade Líquida */}
          <div className="p-4 bg-slate-900/60 border border-slate-800/90 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Resultado Operacional & Rentabilidade</span>
              <span className="text-[10px] font-normal text-emerald-400">
                {fuelAnalysis.isEstimatedOnly ? 'Projetado por Estimativa' : 'Oficial Contábil'}
              </span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-0.5">
                <span className="text-slate-400 text-[11px] block">Faturamento Bruto</span>
                <span className="text-base font-bold font-mono text-white">
                  {formatCurrency(fuelAnalysis.totalRevenue)}
                </span>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-0.5">
                <span className="text-slate-400 text-[11px] block">Combustível Utilizado</span>
                <span className="text-base font-bold font-mono text-rose-400">
                  {formatCurrency(fuelAnalysis.effectiveFuelCost)}
                </span>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-0.5">
                <span className="text-slate-400 text-[11px] block">Aluguel e Outros</span>
                <span className="text-base font-bold font-mono text-slate-300">
                  {formatCurrency(fuelAnalysis.totalOtherCosts)}
                </span>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-emerald-500/30 col-span-2 sm:col-span-1 space-y-0.5">
                <span className="text-emerald-400 text-[11px] font-semibold block">Lucro Líquido Real</span>
                <span className="text-lg font-extrabold font-mono text-emerald-400">
                  {formatCurrency(fuelAnalysis.estimatedNetProfit)}
                </span>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-0.5">
                <span className="text-slate-400 text-[11px] block">Lucro / KM</span>
                <span className="text-base font-bold font-mono text-slate-200">
                  {fuelAnalysis.estimatedNetProfitPerKm !== null
                    ? formatPerKm(fuelAnalysis.estimatedNetProfitPerKm)
                    : '— (Informe KM)'}
                </span>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-0.5">
                <span className="text-slate-400 text-[11px] block">Lucro / Hora</span>
                <span className="text-base font-bold font-mono text-slate-200">
                  {fuelAnalysis.estimatedNetProfitPerHour !== null
                    ? formatPerHour(fuelAnalysis.estimatedNetProfitPerHour)
                    : '— (Informe Horas)'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

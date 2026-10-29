import React, { useState, useEffect } from 'react';
import {
  Calculator as CalcIcon,
  Save,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Calendar,
  Fuel,
  KeyRound,
  Wrench,
  Gauge,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  Clock,
} from 'lucide-react';
import {
  calculateDailyMetrics,
  formatCurrency,
  formatPerKm,
  formatPerHour,
  formatPercent,
  formatDateBR,
  getTodayDateString,
  parseBrazilianInput,
} from '../utils/finance';
import {
  checkDuplicateDate,
  getRecordByDate,
  getUserSettings,
  saveDailyRecord,
} from '../services/storage';
import { DailyRecord } from '../types';

interface CalculatorViewProps {
  initialRecord?: DailyRecord | null;
  onRecordSaved?: (record: DailyRecord) => void;
  onCancelEdit?: () => void;
}

export const CalculatorView: React.FC<CalculatorViewProps> = ({
  initialRecord,
  onRecordSaved,
  onCancelEdit,
}) => {
  const settings = getUserSettings();

  // Estados dos campos de entrada
  const [date, setDate] = useState<string>(initialRecord ? initialRecord.date : getTodayDateString());
  const [grossRevenue, setGrossRevenue] = useState<string>(
    initialRecord ? String(initialRecord.grossRevenue).replace('.', ',') : ''
  );
  const [fuelCost, setFuelCost] = useState<string>(
    initialRecord ? String(initialRecord.fuelCost).replace('.', ',') : ''
  );
  const [vehicleRentalCost, setVehicleRentalCost] = useState<string>(
    initialRecord ? String(initialRecord.vehicleRentalCost).replace('.', ',') : ''
  );
  const [otherCosts, setOtherCosts] = useState<string>(
    initialRecord ? String(initialRecord.otherCosts).replace('.', ',') : ''
  );
  const [mileageKm, setMileageKm] = useState<string>(
    initialRecord ? String(initialRecord.mileageKm).replace('.', ',') : ''
  );
  const [hoursWorked, setHoursWorked] = useState<string>(
    initialRecord?.hoursWorked ? String(initialRecord.hoursWorked).replace('.', ',') : ''
  );
  const [startTime, setStartTime] = useState<string>(initialRecord?.startTime || '');
  const [endTime, setEndTime] = useState<string>(initialRecord?.endTime || '');
  const [notes, setNotes] = useState<string>(initialRecord?.notes || '');
  const [platform, setPlatform] = useState<'uber' | '99' | 'both' | 'other'>(
    initialRecord?.platform || settings.platform || 'both'
  );

  // Estados de feedback e validação
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [duplicateModalOpen, setDuplicateModalOpen] = useState<boolean>(false);
  const [duplicateExistingRecord, setDuplicateExistingRecord] = useState<DailyRecord | null>(null);

  // Se initialRecord mudar externamente
  useEffect(() => {
    if (initialRecord) {
      setDate(initialRecord.date);
      setGrossRevenue(String(initialRecord.grossRevenue).replace('.', ','));
      setFuelCost(String(initialRecord.fuelCost).replace('.', ','));
      setVehicleRentalCost(String(initialRecord.vehicleRentalCost).replace('.', ','));
      setOtherCosts(String(initialRecord.otherCosts).replace('.', ','));
      setMileageKm(String(initialRecord.mileageKm).replace('.', ','));
      setHoursWorked(initialRecord.hoursWorked ? String(initialRecord.hoursWorked).replace('.', ',') : '');
      setStartTime(initialRecord.startTime || '');
      setEndTime(initialRecord.endTime || '');
      setNotes(initialRecord.notes || '');
      setPlatform(initialRecord.platform || 'both');
    }
  }, [initialRecord]);

  // Valores numéricos processados
  const numRevenue = parseBrazilianInput(grossRevenue);
  const numFuel = parseBrazilianInput(fuelCost);
  const numRental = parseBrazilianInput(vehicleRentalCost);
  const numOther = parseBrazilianInput(otherCosts);
  const numKm = parseBrazilianInput(mileageKm);
  const numHours = parseBrazilianInput(hoursWorked);

  // Cálculo automático em tempo real
  const metrics = calculateDailyMetrics({
    grossRevenue: numRevenue,
    fuelCost: numFuel,
    vehicleRentalCost: numRental,
    otherCosts: numOther,
    mileageKm: numKm,
    hoursWorked: numHours > 0 ? numHours : undefined,
  });

  // Função para preencher o teste obrigatório de R$ 300,00
  const handleLoadMandatoryTest = () => {
    setDate(getTodayDateString());
    setGrossRevenue('300,00');
    setFuelCost('60,00');
    setVehicleRentalCost('70,00');
    setOtherCosts('20,00');
    setMileageKm('150');
    setNotes('Teste obrigatório da especificação');
    setErrorMessage(null);
    setSuccessMessage('Valores de teste carregados: R$ 300 de faturamento, 150 km.');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Preencher valor padrão de aluguel/diária configurado
  const handleFillDefaultRental = () => {
    if (settings.defaultRentalDaily > 0) {
      setVehicleRentalCost(String(settings.defaultRentalDaily).replace('.', ','));
    }
  };

  // Limpar formulário
  const handleClear = () => {
    setDate(getTodayDateString());
    setGrossRevenue('');
    setFuelCost('');
    setVehicleRentalCost('');
    setOtherCosts('');
    setMileageKm('');
    setHoursWorked('');
    setStartTime('');
    setEndTime('');
    setNotes('');
    setErrorMessage(null);
    setSuccessMessage(null);
    if (onCancelEdit) onCancelEdit();
  };

  // Tenta salvar o registro
  const handleSaveAttempt = (overrideConfirmed = false) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!date) {
      setErrorMessage('Por favor, informe a data do trabalho.');
      return;
    }

    // Validações de valores não negativos
    if (numRevenue < 0 || numFuel < 0 || numRental < 0 || numOther < 0 || numKm < 0 || numHours < 0) {
      setErrorMessage('Valores de faturamento, despesas, quilômetros e horas não podem ser negativos.');
      return;
    }

    if (numRevenue === 0 && metrics.totalCosts === 0 && numKm === 0) {
      setErrorMessage('Preencha ao menos o faturamento bruto, uma despesa ou os quilômetros rodados.');
      return;
    }

    // Checar duplicidade de data (apenas se for novo registro ou se mudou a data em edição)
    const isEditing = !!initialRecord?.id;
    const isDuplicate = checkDuplicateDate(date, initialRecord?.id);

    if (isDuplicate && !overrideConfirmed) {
      const existing = getRecordByDate(date);
      setDuplicateExistingRecord(existing || null);
      setDuplicateModalOpen(true);
      return;
    }

    // Executa a gravação
    const result = saveDailyRecord({
      id: initialRecord?.id || duplicateExistingRecord?.id,
      date,
      grossRevenue: numRevenue,
      fuelCost: numFuel,
      vehicleRentalCost: numRental,
      otherCosts: numOther,
      mileageKm: numKm,
      hoursWorked: numHours > 0 ? numHours : undefined,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      notes,
      platform,
    });

    if (result.success) {
      setDuplicateModalOpen(false);
      setDuplicateExistingRecord(null);
      setSuccessMessage(
        result.isUpdate
          ? `Registro de ${formatDateBR(date)} atualizado com sucesso!`
          : `Registro de ${formatDateBR(date)} salvo com sucesso no histórico!`
      );

      if (onRecordSaved) {
        onRecordSaved(result.record);
      }

      if (!isEditing) {
        // Limpar após salvar novo
        setTimeout(() => {
          handleClear();
        }, 1500);
      }
    } else {
      setErrorMessage('Ocorreu um erro ao gravar as informações no armazenamento local.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Título & Ações Rápidas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <CalcIcon className="w-6 h-6 text-emerald-400" />
            {initialRecord ? 'Editar Registro Diário' : 'Calculadora de Lucro Diário'}
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-0.5">
            Descubra quanto sobrou no seu bolso após combustível, aluguel e despesas.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleLoadMandatoryTest}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 font-medium transition border border-slate-700/60"
          >
            Carregar Teste (R$ 300)
          </button>
          {initialRecord && onCancelEdit && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium transition"
            >
              Cancelar Edição
            </button>
          )}
        </div>
      </div>

      {/* Alertas de Notificação */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">{errorMessage}</div>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-sm flex items-start gap-2.5">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">{successMessage}</div>
        </div>
      )}

      {/* Grid: Formulário à esquerda, Painel de Resultados à direita */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Formulário de Entradas (7 colunas no Desktop) */}
        <div className="lg:col-span-7 bg-slate-900/70 border border-slate-800/90 rounded-2xl p-4 sm:p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <span className="text-sm font-semibold text-white">Dados do Dia de Corrida</span>
            <span className="text-xs text-slate-400">Campos monetários em R$</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Data do Trabalho */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                Data do trabalho *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-11 px-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Plataforma */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Plataforma principal
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as any)}
                className="w-full h-11 px-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="both">Uber & 99 (Ambas)</option>
                <option value="uber">Uber</option>
                <option value="99">99 App</option>
                <option value="other">Outra / Particular</option>
              </select>
            </div>
          </div>

          {/* Faturamento Bruto (Destaque) */}
          <div>
            <label className="block text-xs font-medium text-emerald-300 mb-1.5 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Faturamento bruto total recebido (R$) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">
                R$
              </span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={grossRevenue}
                onChange={(e) => setGrossRevenue(e.target.value)}
                className="w-full h-12 pl-11 pr-3 bg-slate-950 border border-emerald-500/40 rounded-xl text-white font-mono text-lg font-bold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Valor bruto total dos apps e corridas particulares antes das despesas.
            </p>
          </div>

          {/* Seção de Custos Operacionais */}
          <div className="pt-2 space-y-3">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
              Despesas e Custos Operacionais
            </span>

            {/* Combustível */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <Fuel className="w-3.5 h-3.5 text-amber-400" />
                Gasto com combustível (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">
                  R$
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={fuelCost}
                  onChange={(e) => setFuelCost(e.target.value)}
                  className="w-full h-11 pl-10 pr-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Aluguel / Parcela do Veículo */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-blue-400" />
                  Aluguel ou parcela diária do veículo (R$)
                </label>
                {settings.defaultRentalDaily > 0 && (
                  <button
                    type="button"
                    onClick={handleFillDefaultRental}
                    className="text-[11px] text-emerald-400 hover:underline"
                  >
                    Usar padrão ({formatCurrency(settings.defaultRentalDaily)})
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">
                  R$
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={vehicleRentalCost}
                  onChange={(e) => setVehicleRentalCost(e.target.value)}
                  className="w-full h-11 pl-10 pr-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Outros Custos */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-purple-400" />
                Outros custos (alimentação, pedágio, lavagem) (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">
                  R$
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={otherCosts}
                  onChange={(e) => setOtherCosts(e.target.value)}
                  className="w-full h-11 pl-10 pr-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Quilometragem Rodada */}
          <div className="pt-2">
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" />
              Quilômetros rodados no dia (km)
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={mileageKm}
                onChange={(e) => setMileageKm(e.target.value)}
                className="w-full h-11 px-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">
                km
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Total rodado (odômetro ou aplicativo) para calcular seu custo e lucro por km.
            </p>
          </div>

          {/* Horas Trabalhadas no Turno (Novo em 2.0) */}
          <div className="pt-2">
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              Horas trabalhadas no dia (opcional)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Ex: 8 ou 8,5"
                  value={hoursWorked}
                  onChange={(e) => setHoursWorked(e.target.value)}
                  className="w-full h-11 px-3 pr-8 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                  horas
                </span>
              </div>
              <div>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  placeholder="Início"
                  title="Horário de início"
                  className="w-full h-11 px-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>
              <div>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  placeholder="Término"
                  title="Horário de término"
                  className="w-full h-11 px-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Permite calcular seu ganho bruto e lucro líquido real por hora trabalhada.
            </p>
          </div>

          {/* Observações Opcionais */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Observações (opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Chuva forte à noite, corrida boa para o aeroporto..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-slate-500 resize-none"
            />
          </div>

          {/* Botões de Ação do Formulário */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleSaveAttempt(false)}
              className="flex-1 h-12 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 transition"
            >
              <Save className="w-4 h-4 stroke-[2.5]" />
              <span>{initialRecord ? 'Atualizar Registro' : 'Salvar Registro Diário'}</span>
            </button>

            <button
              type="button"
              onClick={handleClear}
              title="Limpar formulário"
              className="h-12 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl flex items-center justify-center gap-1.5 transition text-xs font-medium"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Limpar</span>
            </button>
          </div>
        </div>

        {/* Painel Resumo em Tempo Real (5 colunas no Desktop) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-5 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-sm font-semibold text-white">Resultado do Cálculo</span>
              <span className="text-xs text-slate-400 font-mono">
                {formatDateBR(date) || 'Hoje'}
              </span>
            </div>

            {/* Card Principal: Lucro Líquido */}
            <div
              className={`p-5 rounded-2xl border transition-all ${
                metrics.isLoss
                  ? 'bg-rose-950/30 border-rose-800/60'
                  : metrics.isProfit
                  ? 'bg-emerald-950/30 border-emerald-800/60'
                  : 'bg-slate-800/40 border-slate-700/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Lucro Líquido Real
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${
                    metrics.isLoss
                      ? 'bg-rose-500/20 text-rose-300'
                      : metrics.isProfit
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {metrics.isLoss
                    ? 'Prejuízo no dia'
                    : metrics.isProfit
                    ? 'Lucro no bolso'
                    : 'Ponto de equilíbrio'}
                </span>
              </div>

              <div
                className={`text-3xl md:text-4xl font-extrabold font-mono tabular-nums mt-2 tracking-tight ${
                  metrics.isLoss
                    ? 'text-rose-400'
                    : metrics.isProfit
                    ? 'text-emerald-400'
                    : 'text-slate-200'
                }`}
              >
                {formatCurrency(metrics.netProfit)}
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-slate-300 pt-3 border-t border-slate-800/60">
                <span>Margem líquida:</span>
                <span className="font-mono font-bold text-white">
                  {formatPercent(metrics.netMarginPercent)}
                </span>
              </div>
            </div>

            {/* Métricas Secundárias */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                <span className="text-[11px] text-slate-400 block">Faturamento Bruto</span>
                <span className="text-base font-bold text-white font-mono tabular-nums mt-0.5 block">
                  {formatCurrency(metrics.grossRevenue)}
                </span>
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                <span className="text-[11px] text-slate-400 block">Custos Totais</span>
                <span className="text-base font-bold text-rose-400 font-mono tabular-nums mt-0.5 block">
                  {formatCurrency(metrics.totalCosts)}
                </span>
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                <span className="text-[11px] text-slate-400 block">Custo por km</span>
                <span className="text-base font-bold text-slate-200 font-mono tabular-nums mt-0.5 block">
                  {formatPerKm(metrics.costPerKm)}
                </span>
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                <span className="text-[11px] text-slate-400 block">Lucro líquido por km</span>
                <span
                  className={`text-base font-bold font-mono tabular-nums mt-0.5 block ${
                    metrics.isLoss ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {formatPerKm(metrics.netProfitPerKm)}
                </span>
              </div>

              {/* Indicadores por Hora (Novo) */}
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                <span className="text-[11px] text-slate-400 block">Ganho Bruto / Hora</span>
                <span className="text-base font-bold text-white font-mono tabular-nums mt-0.5 block">
                  {formatPerHour(metrics.grossRevenuePerHour)}
                </span>
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                <span className="text-[11px] text-slate-400 block">Lucro Líquido / Hora</span>
                <span
                  className={`text-base font-bold font-mono tabular-nums mt-0.5 block ${
                    metrics.isLoss ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {formatPerHour(metrics.netProfitPerHour)}
                </span>
              </div>
            </div>

            {/* Detalhamento dos custos */}
            <div className="p-3.5 bg-slate-950/40 border border-slate-800/60 rounded-xl space-y-2 text-xs">
              <span className="font-semibold text-slate-300 block mb-1">
                Composição das Despesas:
              </span>
              <div className="flex justify-between text-slate-400">
                <span>Combustível:</span>
                <span className="font-mono text-slate-200">{formatCurrency(numFuel)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Aluguel / Parcela:</span>
                <span className="font-mono text-slate-200">{formatCurrency(numRental)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Outros operacionais:</span>
                <span className="font-mono text-slate-200">{formatCurrency(numOther)}</span>
              </div>
              <div className="flex justify-between font-semibold text-white pt-1.5 border-t border-slate-800">
                <span>Total de Saídas:</span>
                <span className="font-mono text-rose-400">
                  {formatCurrency(metrics.totalCosts)}
                </span>
              </div>
            </div>
          </div>

          {/* Dica do motorista */}
          <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-2xl flex items-start gap-3 text-xs text-slate-400">
            <HelpCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <p>
              <strong className="text-slate-200">Dica prática:</strong> Um motorista eficiente busca
              manter o custo por km abaixo de <strong>R$ 1,20/km</strong> e um lucro por km acima de{' '}
              <strong>R$ 1,00/km</strong>. Acompanhe essas métricas para calibrar aceitação de corridas.
            </p>
          </div>
        </div>
      </div>

      {/* Modal de Aviso de Duplicidade (Regra Obrigatória: Não substituir silenciosamente) */}
      {duplicateModalOpen && duplicateExistingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-white">Registro já existente nesta data</h3>
              <p className="text-xs text-slate-300">
                Você já possui um dia de trabalho cadastrado para{' '}
                <strong className="text-white">{formatDateBR(date)}</strong>:
              </p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Faturamento gravado:</span>
                <span className="font-mono text-white">
                  {formatCurrency(duplicateExistingRecord.grossRevenue)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Lucro gravado:</span>
                <span className="font-mono text-emerald-400">
                  {formatCurrency(
                    duplicateExistingRecord.grossRevenue -
                      (duplicateExistingRecord.fuelCost +
                        duplicateExistingRecord.vehicleRentalCost +
                        duplicateExistingRecord.otherCosts)
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Quilometragem gravada:</span>
                <span className="font-mono text-white">
                  {duplicateExistingRecord.mileageKm} km
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 text-center">
              Deseja <strong>atualizar o registro existente</strong> com os novos valores preenchidos ou <strong>cancelar</strong>?
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDuplicateModalOpen(false)}
                className="h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleSaveAttempt(true)}
                className="h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition"
              >
                Atualizar Registro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

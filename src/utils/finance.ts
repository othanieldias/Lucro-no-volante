/**
 * Lucro no Volante - Regras de Cálculo Financeiro e Utilitários
 * 
 * Todas as fórmulas seguem estritamente as regras de negócio:
 * - Faturamento bruto = valor total recebido no dia
 * - Custos totais = combustível + aluguel do veículo + outros custos operacionais
 * - Lucro líquido = faturamento bruto − custos totais
 * - Custo por quilômetro = custos totais ÷ quilômetros rodados (evitando divisão por zero)
 * - Lucro líquido por quilômetro = lucro líquido ÷ quilômetros rodados (evitando divisão por zero)
 * - Margem líquida (%) = (lucro líquido ÷ faturamento bruto) × 100 (evitando divisão por zero)
 */

import {
  CalculatedMetrics,
  DailyRecord,
  PeriodSummary,
  VehicleConfig,
  FuelPeriodAnalysis,
} from '../types';

/**
 * Executa o cálculo financeiro diário com base nas variáveis de entrada
 */
export function calculateDailyMetrics(params: {
  grossRevenue: number;
  fuelCost: number;
  vehicleRentalCost: number;
  otherCosts: number;
  mileageKm: number;
  hoursWorked?: number;
}): CalculatedMetrics {
  const grossRevenue = Math.max(0, Number(params.grossRevenue) || 0);
  const fuelCost = Math.max(0, Number(params.fuelCost) || 0);
  const vehicleRentalCost = Math.max(0, Number(params.vehicleRentalCost) || 0);
  const otherCosts = Math.max(0, Number(params.otherCosts) || 0);
  const mileageKm = Math.max(0, Number(params.mileageKm) || 0);
  const hoursWorked = params.hoursWorked !== undefined && params.hoursWorked > 0 ? Number(params.hoursWorked) : null;

  // Custos totais = combustível + aluguel + outros custos
  const totalCosts = round2(fuelCost + vehicleRentalCost + otherCosts);

  // Lucro líquido = faturamento bruto - custos totais (pode ser negativo em caso de prejuízo)
  const netProfit = round2(grossRevenue - totalCosts);

  // Custo por quilômetro = custos totais ÷ quilômetros rodados
  // Se km == 0, evitar divisão por zero retornando null
  const costPerKm = mileageKm > 0 ? round2(totalCosts / mileageKm) : null;

  // Lucro líquido por quilômetro = lucro líquido ÷ quilômetros rodados
  // Se km == 0, evitar divisão por zero retornando null
  const netProfitPerKm = mileageKm > 0 ? round2(netProfit / mileageKm) : null;

  // Margem líquida (%) = (lucro líquido ÷ faturamento bruto) × 100
  // Se faturamento == 0, evitar divisão por zero retornando null
  const netMarginPercent = grossRevenue > 0 ? round2((netProfit / grossRevenue) * 100) : null;

  // Ganhos e lucro por hora trabalhada (quando informado)
  const grossRevenuePerHour = hoursWorked && hoursWorked > 0 ? round2(grossRevenue / hoursWorked) : null;
  const netProfitPerHour = hoursWorked && hoursWorked > 0 ? round2(netProfit / hoursWorked) : null;

  return {
    grossRevenue,
    totalCosts,
    netProfit,
    mileageKm,
    costPerKm,
    netProfitPerKm,
    netMarginPercent,
    hoursWorked,
    grossRevenuePerHour,
    netProfitPerHour,
    isProfit: netProfit > 0,
    isBreakEven: netProfit === 0,
    isLoss: netProfit < 0,
  };
}

/**
 * Arredonda um número para 2 casas decimais com precisão
 */
export function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Formata um valor numérico para a moeda brasileira (ex: R$ 1.234,56 ou -R$ 50,00)
 */
export function formatCurrency(value: number): string {
  if (isNaN(value)) return 'R$ 0,00';
  
  const isNegative = value < 0;
  const absVal = Math.abs(value);
  
  const formatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absVal);

  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Formata um valor de moeda ou exibe travessão "—" se for null/indefinido
 */
export function formatCurrencyOrDash(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return formatCurrency(value);
}

/**
 * Formata valor de custo/lucro por quilômetro (ex: R$ 1,00/km)
 */
export function formatPerKm(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return `${formatCurrency(value)}/km`;
}

/**
 * Formata valor de faturamento/lucro por hora (ex: R$ 38,50/h)
 */
export function formatPerHour(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return `${formatCurrency(value)}/h`;
}

/**
 * Formata duração em horas trabalhadas (ex: 8,5h ou 8h)
 */
export function formatHours(value: number | null | undefined): string {
  if (value === null || value === undefined || value <= 0) return '—';
  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value);
  return `${formatted}h`;
}

/**
 * Formata percentual de margem (ex: 50,0% ou -12,5%) ou travessão se null
 */
export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
  return `${formatted}%`;
}

/**
 * Formata número comum em formato brasileiro (ex: 150 km)
 */
export function formatNumber(value: number, decimals = 0): string {
  if (isNaN(value)) return '0';
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Converte entradas digitadas naturalmente pelo usuário para número float válido.
 * Aceita:
 * - "150" -> 150
 * - "150,5" -> 150.5
 * - "150,50" -> 150.5
 * - "1234,56" -> 1234.56
 * - "1.234,56" -> 1234.56
 * - "R$ 300,00" -> 300.00
 * - 300 -> 300
 */
export function parseBrazilianInput(input: string | number): number {
  if (typeof input === 'number') {
    return isNaN(input) ? 0 : input;
  }
  if (!input || typeof input !== 'string') return 0;

  // Remove caracteres que não sejam dígitos, vírgulas, pontos ou sinal negativo
  let cleaned = input.trim().replace(/[R$\s]/g, '');

  if (!cleaned) return 0;

  // Se tiver ponto como milhar e vírgula como decimal (ex: "1.234,56")
  if (cleaned.includes('.') && cleaned.includes(',')) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } 
  // Se tiver apenas vírgula (ex: "150,5" ou "1234,56")
  else if (cleaned.includes(',')) {
    cleaned = cleaned.replace(',', '.');
  }

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Retorna a data de hoje no formato YYYY-MM-DD (fuso local)
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formata data ISO (YYYY-MM-DD) para exibição brasileira (DD/MM/AAAA)
 */
export function formatDateBR(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

/**
 * Formata data abreviada (DD/MM)
 */
export function formatDateShortBR(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}`;
  }
  return dateStr;
}

/**
 * Retorna o nome do dia da semana em português
 */
export function getDayOfWeekBR(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const days = [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
  ];
  return days[date.getDay()];
}

/**
 * Retorna a abreviação do dia da semana (Seg, Ter, Qua, Qui, Sex, Sáb, Dom)
 */
export function getDayOfWeekShortBR(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  return days[date.getDay()];
}

/**
 * Calcula o intervalo de segunda-feira a domingo que contém a data alvo
 * (Regra obrigatória: a semana começa na segunda-feira e termina no domingo)
 */
export function getMondaySundayWeekRange(targetDate: Date = new Date()): {
  startDate: string;
  endDate: string;
} {
  const date = new Date(targetDate);
  // getDay(): 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  const dayOfWeek = date.getDay();
  // Se for domingo (0), a segunda-feira foi há 6 dias. Se for segunda (1), foi hoje (0 dias atrás).
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  const monday = new Date(date);
  monday.setDate(date.getDate() - daysToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const format = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  return {
    startDate: format(monday),
    endDate: format(sunday),
  };
}

/**
 * Retorna o primeiro e o último dia do mês corrente (calendário real)
 */
export function getCurrentMonthRange(targetDate: Date = new Date()): {
  startDate: string;
  endDate: string;
} {
  const y = targetDate.getFullYear();
  const m = targetDate.getMonth();
  const firstDay = new Date(y, m, 1);
  const lastDay = new Date(y, m + 1, 0);

  const format = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return {
    startDate: format(firstDay),
    endDate: format(lastDay),
  };
}

/**
 * Retorna o intervalo dos últimos 7 dias até hoje
 */
export function getLast7DaysRange(): { startDate: string; endDate: string } {
  const today = new Date();
  const past7 = new Date();
  past7.setDate(today.getDate() - 6);

  const format = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return {
    startDate: format(past7),
    endDate: format(today),
  };
}

/**
/**
 * Converte quilômetros percorridos em litros e custo de combustível consumido
 * 
 * Regra Obrigatória Lucro no Volante 3.0:
 * - Litros consumidos = km rodados ÷ consumo (km/L)
 * - Custo do combustível consumido = Litros consumidos × Preço por litro (R$/L)
 * 
 * Exemplo gabarito:
 * - 180 km rodados, 10 km/L, R$ 6,00/L -> 18,0 L consumidos e R$ 108,00 de custo consumido.
 */
export function calculateConsumedFuel(
  km: number,
  consumptionKmL: number,
  fuelPricePerLiter: number
): { liters: number; cost: number; costPerKm: number | null } {
  const safeKm = Math.max(0, Number(km) || 0);
  const safeConsumption = Math.max(0, Number(consumptionKmL) || 0);
  const safePrice = Math.max(0, Number(fuelPricePerLiter) || 0);

  if (safeKm <= 0 || safeConsumption <= 0) {
    const costKm = safeConsumption > 0 && safePrice > 0 ? round2(safePrice / safeConsumption) : null;
    return { liters: 0, cost: 0, costPerKm: costKm };
  }

  // Litros consumidos = km rodados ÷ consumo médio em km/l
  const liters = round2(safeKm / safeConsumption);
  // Custo do combustível consumido = Litros consumidos × preço por litro
  const cost = round2(liters * safePrice);
  const costPerKm = round2(safePrice / safeConsumption);

  return { liters, cost, costPerKm };
}

/**
 * Agrega um conjunto de registros diários para gerar resumo do período
 * Aceita opcionalmente as configurações do veículo (vehicleConfig) para calcular
 * a distinção estrita entre "Abastecimento no Posto (Caixa)" e "Custo do Combustível Consumido (Operacional)".
 */
export function aggregatePeriodSummary(
  records: DailyRecord[],
  vehicleConfig?: VehicleConfig
): PeriodSummary {
  if (!records || records.length === 0) {
    return {
      recordCount: 0,
      workedDaysCount: 0,
      totalRevenue: 0,
      totalCosts: 0,
      totalFuel: 0,
      totalRental: 0,
      totalOther: 0,
      netProfit: 0,
      totalKm: 0,
      totalHoursWorked: 0,
      avgNetProfitPerWorkedDay: 0,
      avgRevenuePerWorkedDay: 0,
      avgCostPerKm: null,
      avgProfitPerKm: null,
      avgGrossRevenuePerHour: null,
      avgNetProfitPerHour: null,
      netMarginPercent: null,
      bestDay: null,
      worstDay: null,
      consumedFuelLiters: 0,
      consumedFuelCost: 0,
      operationalTotalCosts: 0,
      operationalNetProfit: 0,
      operationalCostPerKm: null,
      operationalProfitPerKm: null,
      operationalNetMarginPercent: null,
      refillTotalCost: 0,
      isFuelEstimated: false,
    };
  }

  let totalRevenue = 0;
  let totalFuel = 0;
  let totalRental = 0;
  let totalOther = 0;
  let totalCosts = 0;
  let netProfit = 0;
  let totalKm = 0;
  let totalHoursWorked = 0;
  let workedDaysCount = 0;

  let bestDay: { date: string; profit: number } | null = null;
  let worstDay: { date: string; profit: number } | null = null;

  for (const r of records) {
    const fuel = Number(r.fuelCost) || 0;
    const rental = Number(r.vehicleRentalCost) || 0;
    const other = Number(r.otherCosts) || 0;
    const rev = Number(r.grossRevenue) || 0;
    const km = Number(r.mileageKm) || 0;
    const hours = Number(r.hoursWorked) || 0;

    const costs = fuel + rental + other;
    const profit = rev - costs;

    totalRevenue += rev;
    totalFuel += fuel;
    totalRental += rental;
    totalOther += other;
    totalCosts += costs;
    netProfit += profit;
    totalKm += km;
    totalHoursWorked += hours;

    if (rev > 0 || km > 0 || costs > 0 || hours > 0) {
      workedDaysCount += 1;
    }

    if (!bestDay || profit > bestDay.profit) {
      bestDay = { date: r.date, profit: round2(profit) };
    }
    if (!worstDay || profit < worstDay.profit) {
      worstDay = { date: r.date, profit: round2(profit) };
    }
  }

  totalRevenue = round2(totalRevenue);
  totalFuel = round2(totalFuel);
  totalRental = round2(totalRental);
  totalOther = round2(totalOther);
  totalCosts = round2(totalCosts);
  netProfit = round2(netProfit);
  totalKm = round2(totalKm);
  totalHoursWorked = round2(totalHoursWorked);

  const avgNetProfitPerWorkedDay =
    workedDaysCount > 0 ? round2(netProfit / workedDaysCount) : 0;
  const avgRevenuePerWorkedDay =
    workedDaysCount > 0 ? round2(totalRevenue / workedDaysCount) : 0;

  const avgCostPerKm = totalKm > 0 ? round2(totalCosts / totalKm) : null;
  const avgProfitPerKm = totalKm > 0 ? round2(netProfit / totalKm) : null;
  const avgGrossRevenuePerHour = totalHoursWorked > 0 ? round2(totalRevenue / totalHoursWorked) : null;
  const avgNetProfitPerHour = totalHoursWorked > 0 ? round2(netProfit / totalHoursWorked) : null;
  const netMarginPercent =
    totalRevenue > 0 ? round2((netProfit / totalRevenue) * 100) : null;

  // Cálculo do Combustível Consumido Operacional
  let consumedFuelLiters = 0;
  let consumedFuelCost = 0;
  let operationalTotalCosts = totalCosts;
  let operationalNetProfit = netProfit;
  let operationalCostPerKm = avgCostPerKm;
  let operationalProfitPerKm = avgProfitPerKm;
  let operationalNetMarginPercent = netMarginPercent;
  let isFuelEstimated = false;

  if (vehicleConfig && vehicleConfig.consumptionKmL > 0 && vehicleConfig.fuelPricePerLiter > 0) {
    const consumed = calculateConsumedFuel(
      totalKm,
      vehicleConfig.consumptionKmL,
      vehicleConfig.fuelPricePerLiter
    );
    consumedFuelLiters = consumed.liters;
    consumedFuelCost = consumed.cost;
    isFuelEstimated = true;

    // Regra anti-dupla contagem:
    // Custo Operacional Total = Custo do Combustível Consumido + Aluguel + Outras Despesas
    // (o valor do abastecimento no posto é tratado como fluxo de caixa de compra de insumo)
    operationalTotalCosts = round2(consumedFuelCost + totalRental + totalOther);
    operationalNetProfit = round2(totalRevenue - operationalTotalCosts);
    operationalCostPerKm = totalKm > 0 ? round2(operationalTotalCosts / totalKm) : null;
    operationalProfitPerKm = totalKm > 0 ? round2(operationalNetProfit / totalKm) : null;
    operationalNetMarginPercent =
      totalRevenue > 0 ? round2((operationalNetProfit / totalRevenue) * 100) : null;
  }

  return {
    recordCount: records.length,
    workedDaysCount,
    totalRevenue,
    totalCosts,
    totalFuel,
    totalRental,
    totalOther,
    netProfit,
    totalKm,
    totalHoursWorked,
    avgNetProfitPerWorkedDay,
    avgRevenuePerWorkedDay,
    avgCostPerKm,
    avgProfitPerKm,
    avgGrossRevenuePerHour,
    avgNetProfitPerHour,
    netMarginPercent,
    bestDay,
    worstDay,
    consumedFuelLiters,
    consumedFuelCost,
    operationalTotalCosts,
    operationalNetProfit,
    operationalCostPerKm,
    operationalProfitPerKm,
    operationalNetMarginPercent,
    refillTotalCost: totalFuel,
    isFuelEstimated,
  };
}

/**
// ========================================================
// Módulo de Combustível e Rentabilidade (Lucro no Volante 3.0)
// ========================================================

/**
 * Converte quilômetros percorridos em litros estimados de combustível
 * Fórmula: Litros estimados = quilômetros percorridos ÷ consumo médio em km/l
 */
export function calculateEstimatedLiters(km: number, consumptionKmL: number): number {
  const safeKm = Math.max(0, Number(km) || 0);
  const safeConsumption = Math.max(0, Number(consumptionKmL) || 0);
  if (safeConsumption <= 0 || safeKm <= 0) return 0;
  return round2(safeKm / safeConsumption);
}

/**
 * Calcula o custo estimado de combustível em reais
 * Fórmula: Gasto estimado de combustível = litros estimados × preço por litro
 */
export function calculateEstimatedFuelCost(
  km: number,
  consumptionKmL: number,
  fuelPricePerLiter: number
): number {
  const liters = calculateEstimatedLiters(km, consumptionKmL);
  const safePrice = Math.max(0, Number(fuelPricePerLiter) || 0);
  return round2(liters * safePrice);
}

/**
 * Calcula o custo de combustível por quilômetro
 * Fórmula: Custo de combustível por km = preço por litro ÷ consumo médio em km/l
 */
export function calculateFuelCostPerKm(
  fuelPricePerLiter: number,
  consumptionKmL: number
): number | null {
  const safePrice = Math.max(0, Number(fuelPricePerLiter) || 0);
  const safeConsumption = Math.max(0, Number(consumptionKmL) || 0);
  if (safeConsumption <= 0 || safePrice <= 0) return null;
  return round2(safePrice / safeConsumption);
}

/**
 * Executa a análise completa de combustível para um período de registros
 * 
 * REGRA RIGOROSA DE PRECISÃO FINANCEIRA:
 * - Se o motorista já registrou despesas reais de combustível no período (fuelCost > 0),
 *   esse valor é utilizado no cálculo contábil oficial (actualNetProfit).
 * - A estimativa baseada em km/l é apresentada separadamente para auditoria/comparação.
 * - JAMAIS soma a estimativa com a despesa real (ausência de dupla contagem).
 * - Se não houver combustível lançado, permite estimar o resultado identificando-o claramente.
 */
export function calculateFuelPeriodAnalysis(
  records: DailyRecord[],
  vehicleConfig: VehicleConfig
): FuelPeriodAnalysis {
  let totalKm = 0;
  let totalRevenue = 0;
  let totalRecordedFuel = 0;
  let totalRental = 0;
  let totalOther = 0;
  let totalHoursWorked = 0;

  for (const r of records) {
    totalKm += Math.max(0, Number(r.mileageKm) || 0);
    totalRevenue += Math.max(0, Number(r.grossRevenue) || 0);
    totalRecordedFuel += Math.max(0, Number(r.fuelCost) || 0);
    totalRental += Math.max(0, Number(r.vehicleRentalCost) || 0);
    totalOther += Math.max(0, Number(r.otherCosts) || 0);
    if (r.hoursWorked && r.hoursWorked > 0) {
      totalHoursWorked += Number(r.hoursWorked);
    }
  }

  totalKm = round2(totalKm);
  totalRevenue = round2(totalRevenue);
  totalRecordedFuel = round2(totalRecordedFuel);
  totalRental = round2(totalRental);
  totalOther = round2(totalOther);
  totalHoursWorked = round2(totalHoursWorked);

  const totalOtherCosts = round2(totalRental + totalOther);
  const hasRecordedFuel = totalRecordedFuel > 0;

  // Cálculos de estimativa por km/l
  const estimatedLiters = calculateEstimatedLiters(totalKm, vehicleConfig.consumptionKmL);
  const estimatedFuelCost = calculateEstimatedFuelCost(
    totalKm,
    vehicleConfig.consumptionKmL,
    vehicleConfig.fuelPricePerLiter
  );
  const fuelCostPerKm = calculateFuelCostPerKm(
    vehicleConfig.fuelPricePerLiter,
    vehicleConfig.consumptionKmL
  );

  // Combustível efetivo para o resultado estimado:
  // Se houver combustível real lançado, o resultado oficial usa o real.
  // Se não houver nada lançado, projeta usando a estimativa.
  const effectiveFuelCost = hasRecordedFuel ? totalRecordedFuel : estimatedFuelCost;
  const isEstimatedOnly = !hasRecordedFuel && estimatedFuelCost > 0;

  // Lucro líquido contábil (oficial com despesas reais)
  const actualNetProfit = round2(totalRevenue - (totalRecordedFuel + totalOtherCosts));

  // Lucro líquido estimado (usando estimativa quando despesa real não foi lançada)
  const estimatedNetProfit = round2(totalRevenue - (effectiveFuelCost + totalOtherCosts));

  const estimatedNetProfitPerKm = totalKm > 0 ? round2(estimatedNetProfit / totalKm) : null;
  const estimatedNetProfitPerHour = totalHoursWorked > 0 ? round2(estimatedNetProfit / totalHoursWorked) : null;
  const grossRevenuePerHour = totalHoursWorked > 0 ? round2(totalRevenue / totalHoursWorked) : null;

  return {
    totalKm,
    totalRevenue,
    totalRecordedFuel,
    hasRecordedFuel,
    estimatedLiters,
    estimatedFuelCost,
    fuelCostPerKm,
    effectiveFuelCost,
    isEstimatedOnly,
    totalOtherCosts,
    actualNetProfit,
    estimatedNetProfit,
    estimatedNetProfitPerKm,
    estimatedNetProfitPerHour,
    grossRevenuePerHour,
    totalHoursWorked,
  };
}

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
  RideOfferInput,
  RideEvaluationResult,
  TrafficLightSettings,
  RideCriteriaCheck,
  TrafficLightResult,
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
 * Agrega um conjunto de registros diários para gerar resumo do período
 */
export function aggregatePeriodSummary(records: DailyRecord[]): PeriodSummary {
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
  };
}

/**
 * ========================================================
 * MOTOR DE CÁLCULO DO RADAR DE CORRIDAS (SEMÁFORO INTELIGENTE)
 * ========================================================
 * 
 * Regras mandatórias:
 * 1. Distância total da operação considera deslocamento até o passageiro e percurso da corrida, sem contar duas vezes.
 * 2. Tempo total da operação considera espera/deslocamento até passageiro e viagem.
 * 3. Custo operacional estimado = (custo por km * distância) + pedágios/custos adicionais.
 * 4. Lucro líquido estimado = valor recebido − custo operacional estimado.
 * 5. Ganho bruto por km e por hora.
 * 6. Lucro líquido por km e por hora.
 * 7. Semáforo:
 *    - VERDE ("Boa candidata"): Atende a todos os critérios essenciais e não apresenta condições de alerta.
 *    - AMARELO ("Avalie com atenção"): Próximo de algum limite, nota passageiro abaixo ou dados parciais.
 *    - VERMELHO ("Fora dos seus critérios"): Falha em pelo menos um critério financeiro essencial.
 *    - INSUFFICIENT_DATA: Quando faltam valor, distância ou tempo para cálculo confiável.
 */
export function evaluateRideOffer(
  input: RideOfferInput,
  settings: TrafficLightSettings,
  defaultCostPerKm?: number | null
): RideEvaluationResult {
  const fare = Math.max(0, Number(input.estimatedFare) || 0);

  // Calcula distância efetiva sem duplicar:
  // Se informados pickup e trip explicitamente, soma-os; senão usa totalDistanceKm
  let effectiveDistanceKm = 0;
  if (
    input.pickupDistanceKm !== undefined &&
    input.pickupDistanceKm > 0 &&
    input.tripDistanceKm !== undefined &&
    input.tripDistanceKm > 0
  ) {
    effectiveDistanceKm = round2(input.pickupDistanceKm + input.tripDistanceKm);
  } else {
    effectiveDistanceKm = round2(Math.max(0, Number(input.totalDistanceKm) || 0));
  }

  // Calcula duração efetiva em minutos
  let effectiveDurationMinutes = 0;
  if (
    input.pickupDurationMinutes !== undefined &&
    input.pickupDurationMinutes > 0 &&
    input.tripDurationMinutes !== undefined &&
    input.tripDurationMinutes > 0
  ) {
    effectiveDurationMinutes = round2(input.pickupDurationMinutes + input.tripDurationMinutes);
  } else {
    effectiveDurationMinutes = round2(Math.max(0, Number(input.totalDurationMinutes) || 0));
  }

  // Custo por km a aplicar (override do usuário -> custo real histórico -> R$ 1,00/km padrão)
  const costPerKmToUse =
    settings.costPerKmOverride && settings.costPerKmOverride > 0
      ? settings.costPerKmOverride
      : defaultCostPerKm && defaultCostPerKm > 0
      ? defaultCostPerKm
      : 1.0;

  const extraCosts = Math.max(0, Number(input.tollOrExtraCosts) || 0);

  // Verificação de dados insuficientes
  if (fare <= 0 || effectiveDistanceKm <= 0 || effectiveDurationMinutes <= 0) {
    return {
      status: 'insufficient_data',
      statusLabel: 'Dados insuficientes',
      statusSummary:
        'Preencha o valor da corrida, a distância total e o tempo estimado para uma avaliação financeira confiável.',
      grossRevenuePerKm: null,
      grossRevenuePerHour: null,
      estimatedOperatingCost: 0,
      estimatedNetProfit: 0,
      estimatedNetProfitPerKm: null,
      estimatedNetProfitPerHour: null,
      netMarginPercent: null,
      effectiveDistanceKm,
      effectiveDurationMinutes,
      criteria: [],
      evaluatedAt: new Date().toISOString(),
    };
  }

  // Cálculos financeiros
  const durationHours = effectiveDurationMinutes / 60;
  const estimatedOperatingCost = round2(costPerKmToUse * effectiveDistanceKm + extraCosts);
  const estimatedNetProfit = round2(fare - estimatedOperatingCost);

  const grossRevenuePerKm = round2(fare / effectiveDistanceKm);
  const grossRevenuePerHour = round2(fare / durationHours);
  const estimatedNetProfitPerKm = round2(estimatedNetProfit / effectiveDistanceKm);
  const estimatedNetProfitPerHour = round2(estimatedNetProfit / durationHours);
  const netMarginPercent = round2((estimatedNetProfit / fare) * 100);

  // Tolerâncias de acordo com o modo
  const tolerance = settings.mode === 'flexible' ? 0.9 : settings.mode === 'conservative' ? 1.05 : 1.0;

  const targetGrossPerKm = settings.minGrossPerKm * tolerance;
  const targetGrossPerHour = settings.minGrossPerHour * tolerance;
  const targetNetPerKm = settings.minNetProfitPerKm * tolerance;
  const targetNetPerHour = settings.minNetProfitPerHour * tolerance;

  // Avaliação dos critérios individuais
  const criteria: RideCriteriaCheck[] = [];

  // 1. Ganho Bruto por Km
  const grossKmPass = grossRevenuePerKm >= targetGrossPerKm;
  const grossKmClose = grossRevenuePerKm >= targetGrossPerKm * 0.9;
  criteria.push({
    id: 'gross_per_km',
    name: 'Ganho Bruto por KM',
    actualValue: formatPerKm(grossRevenuePerKm),
    targetValue: `≥ ${formatPerKm(targetGrossPerKm)}`,
    status: grossKmPass ? 'pass' : grossKmClose ? 'warning' : 'fail',
    isEssential: true,
    explanation: grossKmPass
      ? 'Valor por km acima do mínimo configurado.'
      : `Abaixo da sua meta mínima de ${formatPerKm(targetGrossPerKm)}.`,
  });

  // 2. Lucro Líquido por KM
  const netKmPass = estimatedNetProfitPerKm >= targetNetPerKm;
  const netKmClose = estimatedNetProfitPerKm >= targetNetPerKm * 0.85;
  criteria.push({
    id: 'net_per_km',
    name: 'Lucro Líquido por KM',
    actualValue: formatPerKm(estimatedNetProfitPerKm),
    targetValue: `≥ ${formatPerKm(targetNetPerKm)}`,
    status: netKmPass ? 'pass' : netKmClose ? 'warning' : 'fail',
    isEssential: true,
    explanation: netKmPass
      ? 'Lucro limpo por km cobre folgadamente o desgaste e combustível.'
      : `Lucro líquido por km insuficiente considerando seu custo de ${formatPerKm(costPerKmToUse)}.`,
  });

  // 3. Lucro Líquido por Hora
  const netHourPass = estimatedNetProfitPerHour >= targetNetPerHour;
  const netHourClose = estimatedNetProfitPerHour >= targetNetPerHour * 0.88;
  criteria.push({
    id: 'net_per_hour',
    name: 'Lucro Líquido por Hora',
    actualValue: formatPerHour(estimatedNetProfitPerHour),
    targetValue: `≥ ${formatPerHour(targetNetPerHour)}`,
    status: netHourPass ? 'pass' : netHourClose ? 'warning' : 'fail',
    isEssential: true,
    explanation: netHourPass
      ? `Excelente rendimento de ${formatPerHour(estimatedNetProfitPerHour)} no tempo previsto.`
      : `Fica abaixo da sua meta horária de ${formatPerHour(targetNetPerHour)}.`,
  });

  // 4. Distância até o passageiro (se informada)
  if (input.pickupDistanceKm !== undefined && input.pickupDistanceKm > 0) {
    const pickupDistPass = input.pickupDistanceKm <= settings.maxPickupDistanceKm;
    const pickupDistClose = input.pickupDistanceKm <= settings.maxPickupDistanceKm * 1.25;
    criteria.push({
      id: 'pickup_distance',
      name: 'Deslocamento até Passageiro',
      actualValue: `${input.pickupDistanceKm} km`,
      targetValue: `≤ ${settings.maxPickupDistanceKm} km`,
      status: pickupDistPass ? 'pass' : pickupDistClose ? 'warning' : 'fail',
      isEssential: false,
      explanation: pickupDistPass
        ? 'Passageiro próximo, pouco tempo morto.'
        : `Buscar passageiro a ${input.pickupDistanceKm} km consome combustível não remunerado.`,
    });
  }

  // 5. Tempo até o passageiro (se informado)
  if (input.pickupDurationMinutes !== undefined && input.pickupDurationMinutes > 0) {
    const pickupTimePass = input.pickupDurationMinutes <= settings.maxPickupTimeMinutes;
    const pickupTimeClose = input.pickupDurationMinutes <= settings.maxPickupTimeMinutes * 1.3;
    criteria.push({
      id: 'pickup_time',
      name: 'Tempo de Chegada',
      actualValue: `${input.pickupDurationMinutes} min`,
      targetValue: `≤ ${settings.maxPickupTimeMinutes} min`,
      status: pickupTimePass ? 'pass' : pickupTimeClose ? 'warning' : 'fail',
      isEssential: false,
      explanation: pickupTimePass
        ? 'Tempo de chegada ágil.'
        : `Tempo até o passageiro (${input.pickupDurationMinutes} min) pode reduzir seus ganhos/hora.`,
    });
  }

  // 6. Nota do passageiro (critério secundário configurável, não reprova se não informado)
  if (input.passengerRating !== undefined && input.passengerRating > 0) {
    const ratingPass = input.passengerRating >= settings.minPassengerRating;
    const ratingClose = input.passengerRating >= settings.minPassengerRating - 0.1;
    criteria.push({
      id: 'passenger_rating',
      name: 'Nota do Passageiro',
      actualValue: input.passengerRating.toFixed(2),
      targetValue: `≥ ${settings.minPassengerRating.toFixed(2)}`,
      status: ratingPass ? 'pass' : ratingClose ? 'warning' : 'fail',
      isEssential: false,
      explanation: ratingPass
        ? 'Passageiro bem avaliado.'
        : `Nota do passageiro (${input.passengerRating.toFixed(2)}) abaixo da sua preferência de ${settings.minPassengerRating.toFixed(2)}.`,
    });
  }

  // Decisão do Semáforo com regras transparentes:
  // Se falhar em critério financeiro essencial -> VERMELHO
  const hasEssentialFail = criteria.some((c) => c.isEssential && c.status === 'fail');
  const hasWarning = criteria.some((c) => c.status === 'warning' || (!c.isEssential && c.status === 'fail'));

  let status: TrafficLightResult = 'green';
  let statusLabel = 'Boa candidata';
  let statusSummary = '';

  if (estimatedNetProfit <= 0 || hasEssentialFail) {
    status = 'red';
    statusLabel = 'Fora dos seus critérios';

    const failedEssentials = criteria.filter((c) => c.isEssential && c.status === 'fail');
    if (estimatedNetProfit <= 0) {
      statusSummary = `Esta corrida gera prejuízo estimado de ${formatCurrency(Math.abs(estimatedNetProfit))} considerando o custo de ${formatPerKm(costPerKmToUse)}.`;
    } else if (failedEssentials.length > 0) {
      statusSummary = `Esta corrida não atende a critérios essenciais: ${failedEssentials.map((c) => c.name.toLowerCase()).join(' e ')}.`;
    } else {
      statusSummary = 'Esta corrida fica abaixo dos seus limites mínimos configurados.';
    }
  } else if (hasWarning) {
    status = 'yellow';
    statusLabel = 'Avalie com atenção';

    const warnings = criteria.filter((c) => c.status === 'warning' || (!c.isEssential && c.status === 'fail'));
    if (warnings.length > 0) {
      statusSummary = `Lucro financeiro viável (${formatPerHour(estimatedNetProfitPerHour)}), mas fique atento a: ${warnings.map((w) => w.name.toLowerCase()).join(', ')}.`;
    } else {
      statusSummary = 'Corrida próxima dos seus limites mínimos. Avalie as condições de trânsito e destino.';
    }
  } else {
    status = 'green';
    statusLabel = 'Boa candidata';
    statusSummary = `Atende plenamente aos seus critérios com ${formatPerHour(estimatedNetProfitPerHour)} de lucro/hora e margem de ${netMarginPercent}%.`;
  }

  return {
    status,
    statusLabel,
    statusSummary,
    grossRevenuePerKm,
    grossRevenuePerHour,
    estimatedOperatingCost,
    estimatedNetProfit,
    estimatedNetProfitPerKm,
    estimatedNetProfitPerHour,
    netMarginPercent,
    effectiveDistanceKm,
    effectiveDurationMinutes,
    criteria,
    evaluatedAt: new Date().toISOString(),
  };
}

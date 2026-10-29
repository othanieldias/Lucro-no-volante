/**
 * Lucro no Volante - Modelos de Dados e Tipagens
 */

export type PlatformType = 'uber' | '99' | 'both' | 'other';

export type VehicleType = 'alugado' | 'proprio' | 'financiado';

export interface DailyRecord {
  id: string;
  date: string; // Formato YYYY-MM-DD
  grossRevenue: number; // Faturamento bruto total
  fuelCost: number; // Gasto com combustível
  vehicleRentalCost: number; // Aluguel do veículo ou parcela diária
  otherCosts: number; // Outros custos operacionais (alimentação, pedágio, lavagem, etc.)
  mileageKm: number; // Quilômetros rodados
  hoursWorked?: number; // Horas trabalhadas no dia (opcional, ex: 8.5)
  startTime?: string; // Horário de início do turno (opcional, ex: '07:00')
  endTime?: string; // Horário de término do turno (opcional, ex: '16:30')
  notes?: string; // Observações opcionais
  platform?: PlatformType; // Plataforma predominante no dia
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
}

export interface CalculatedMetrics {
  grossRevenue: number;
  totalCosts: number;
  netProfit: number;
  mileageKm: number;
  costPerKm: number | null; // null quando km == 0
  netProfitPerKm: number | null; // null quando km == 0
  netMarginPercent: number | null; // null quando grossRevenue == 0
  hoursWorked: number | null; // null quando não informado
  grossRevenuePerHour: number | null; // null quando horas == 0 ou não informadas
  netProfitPerHour: number | null; // null quando horas == 0 ou não informadas
  isProfit: boolean;
  isBreakEven: boolean;
  isLoss: boolean;
}

export interface FinancialGoals {
  dailyRevenueGoal: number; // Meta de faturamento diário (ex: R$ 350,00)
  dailyNetProfitGoal: number; // Meta de lucro líquido diário (ex: R$ 200,00)
  weeklyNetProfitGoal: number; // Meta de lucro líquido semanal (ex: R$ 1.200,00)
  monthlyNetProfitGoal: number; // Meta de lucro líquido mensal (ex: R$ 5.000,00)
  workDaysPerWeek: number; // Dias planejados de trabalho por semana (ex: 6)
}

// ========================================================
// Modelos de Dados do Radar de Corridas (Semáforo Inteligente)
// ========================================================

export type TrafficLightResult = 'green' | 'yellow' | 'red' | 'insufficient_data';

export interface TrafficLightSettings {
  minGrossPerKm: number; // Ganho bruto mínimo por km (ex: R$ 2,20)
  minGrossPerHour: number; // Ganho bruto mínimo por hora (ex: R$ 40,00)
  minNetProfitPerKm: number; // Lucro líquido mínimo por km (ex: R$ 1,20)
  minNetProfitPerHour: number; // Lucro líquido mínimo por hora (ex: R$ 25,00)
  minPassengerRating: number; // Nota mínima desejada do passageiro (ex: 4.80)
  maxPickupDistanceKm: number; // Distância máxima para buscar passageiro (ex: 3.5 km)
  maxPickupTimeMinutes: number; // Tempo máximo para chegar ao passageiro (ex: 8 min)
  costPerKmOverride?: number; // Custo por km configurado manualmente (ou real histórico)
  mode: 'conservative' | 'balanced' | 'flexible'; // Perfil de decisão
}

export interface RideOfferInput {
  app: 'uber' | '99' | 'other';
  estimatedFare: number; // Valor estimado recebido pela corrida (R$)
  totalDistanceKm: number; // Distância total estimada da operação (km)
  totalDurationMinutes: number; // Tempo total estimado da operação (min)
  pickupDistanceKm?: number; // Distância até o passageiro (km)
  pickupDurationMinutes?: number; // Tempo até o passageiro (min)
  tripDistanceKm?: number; // Percurso da corrida (km)
  tripDurationMinutes?: number; // Duração da viagem (min)
  passengerRating?: number; // Nota do passageiro (ex: 4.85)
  passengerRatingCount?: number; // Quantidade de avaliações do passageiro
  tollOrExtraCosts?: number; // Pedágios ou custos adicionais específicos (R$)
  notes?: string; // Anotações
}

export interface RideCriteriaCheck {
  id: string;
  name: string;
  actualValue: string;
  targetValue: string;
  status: 'pass' | 'warning' | 'fail' | 'na';
  isEssential: boolean;
  explanation: string;
}

export interface RideEvaluationResult {
  status: TrafficLightResult;
  statusLabel: string;
  statusSummary: string;
  grossRevenuePerKm: number | null;
  grossRevenuePerHour: number | null;
  estimatedOperatingCost: number;
  estimatedNetProfit: number;
  estimatedNetProfitPerKm: number | null;
  estimatedNetProfitPerHour: number | null;
  netMarginPercent: number | null;
  effectiveDistanceKm: number;
  effectiveDurationMinutes: number;
  criteria: RideCriteriaCheck[];
  evaluatedAt: string;
}

export interface RideAnalysisHistoryItem {
  id: string;
  input: RideOfferInput;
  result: RideEvaluationResult;
  savedAt: string;
  isDemo?: boolean;
}

export interface UserSettings {
  driverName: string;
  platform: PlatformType;
  vehicleType: VehicleType;
  defaultRentalDaily: number;
  goals: FinancialGoals;
  trafficLightSettings: TrafficLightSettings;
  trialStartDate: string; // YYYY-MM-DD
  subscriptionStatus: 'trial' | 'active' | 'expired';
}

export type DatePeriodFilter = 'today' | 'last7' | 'thisWeek' | 'thisMonth' | 'custom';

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

export interface PeriodSummary {
  recordCount: number;
  workedDaysCount: number;
  totalRevenue: number;
  totalCosts: number;
  totalFuel: number;
  totalRental: number;
  totalOther: number;
  netProfit: number;
  totalKm: number;
  totalHoursWorked: number;
  avgNetProfitPerWorkedDay: number;
  avgRevenuePerWorkedDay: number;
  avgCostPerKm: number | null;
  avgProfitPerKm: number | null;
  avgGrossRevenuePerHour: number | null;
  avgNetProfitPerHour: number | null;
  netMarginPercent: number | null;
  bestDay: { date: string; profit: number } | null;
  worstDay: { date: string; profit: number } | null;
}

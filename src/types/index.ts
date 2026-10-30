/**
 * Lucro no Volante 3.0 - Modelos de Dados e Tipagens
 */

export type PlatformType = 'uber' | '99' | 'both' | 'other';

export type VehicleType = 'alugado' | 'proprio' | 'financiado';

export type FuelType = 'gasolina' | 'etanol' | 'diesel' | 'gnv';

export interface VehicleConfig {
  vehicleName: string; // ex: "Chevrolet Onix 1.0"
  fuelType: FuelType; // 'gasolina' | 'etanol' | 'diesel' | 'gnv'
  consumptionKmL: number; // Consumo médio em km/l (ex: 11.5)
  fuelPricePerLiter: number; // Preço do litro em R$ (ex: 5.89)
}

export const DEFAULT_VEHICLE_CONFIG: VehicleConfig = {
  vehicleName: 'Meu Carro',
  fuelType: 'gasolina',
  consumptionKmL: 10.5,
  fuelPricePerLiter: 5.85,
};

export interface DailyRecord {
  id: string;
  date: string; // Formato YYYY-MM-DD
  grossRevenue: number; // Faturamento bruto total
  fuelCost: number; // Gasto efetivamente lançado com combustível (despesa real)
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

export interface UserSettings {
  driverName: string;
  platform: PlatformType;
  vehicleType: VehicleType;
  defaultRentalDaily: number;
  goals: FinancialGoals;
  vehicleConfig: VehicleConfig;
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
  totalFuel: number; // Abastecimentos no posto (fluxo de caixa)
  totalRental: number;
  totalOther: number;
  netProfit: number; // Lucro líquido oficial dos lançamentos
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

  // Métricas do Custo de Combustível Consumido (Lucro no Volante 3.0)
  consumedFuelLiters?: number; // Litros consumidos = totalKm / consumoKmL
  consumedFuelCost?: number; // Custo do combustível consumido = Litros * Preço/L
  operationalTotalCosts?: number; // Custo combustível consumido + aluguel + outros custos
  operationalNetProfit?: number; // Receita bruta - custos operacionais (combustível consumido)
  operationalCostPerKm?: number | null;
  operationalProfitPerKm?: number | null;
  operationalNetMarginPercent?: number | null;
  refillTotalCost?: number; // Total abastecido no período (compra de estoque/caixa)
  isFuelEstimated?: boolean;
}

export interface FuelPeriodAnalysis {
  totalKm: number;
  totalRevenue: number;
  totalRecordedFuel: number; // Despesa real lançada pelo motorista no posto (abastecimento)
  hasRecordedFuel: boolean; // True se houver registros com fuelCost > 0
  estimatedLiters: number; // km / kmL (litros consumidos no trabalho)
  estimatedFuelCost: number; // litros consumidos * precoLitro (custo consumido no trabalho)
  fuelCostPerKm: number | null; // precoLitro / kmL
  effectiveFuelCost: number; // Custo considerado para projeção operacional
  isEstimatedOnly: boolean; // True se nenhum turno teve combustível lançado
  totalOtherCosts: number; // aluguel + outros custos
  actualNetProfit: number; // receita - totalRecordedFuel - outros custos (caixa/contábil)
  estimatedNetProfit: number; // receita - estimatedFuelCost - outros custos (operacional por km rodado)
  estimatedNetProfitPerKm: number | null;
  estimatedNetProfitPerHour: number | null;
  grossRevenuePerHour: number | null;
  totalHoursWorked: number;
}

export interface AiChatMessage {
  id: string;
  conversationId?: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  source?: 'gemini' | 'rules_engine' | 'system_notice';
  insights?: string[];
  suggestedAction?: {
    tab: string;
    label: string;
  };
}

export interface ConversationSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  driverId?: string; // Isolamento por conta de motorista
  messages: AiChatMessage[];
}


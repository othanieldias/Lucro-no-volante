/**
 * Lucro no Volante - Camada de Persistência Local e Gerenciamento de Estado
 * 
 * - Persistência real e durável via localStorage
 * - Prevenção estrita de duplicidade de registros por data
 * - Tratamento de concorrência e exportação/importação de backups JSON
 * - Notificação em tempo real entre abas e componentes
 */

import {
  DailyRecord,
  FinancialGoals,
  RideAnalysisHistoryItem,
  TrafficLightSettings,
  UserSettings,
} from '../types';
import { getTodayDateString } from '../utils/finance';

const STORAGE_KEYS = {
  RECORDS: 'lucro_volante_records_v1',
  SETTINGS: 'lucro_volante_settings_v1',
  RADAR_ANALYSES: 'lucro_volante_radar_analyses_v1',
};

export const DEFAULT_TRAFFIC_LIGHT_SETTINGS: TrafficLightSettings = {
  minGrossPerKm: 2.2, // R$ 2,20/km
  minGrossPerHour: 40.0, // R$ 40,00/h
  minNetProfitPerKm: 1.2, // R$ 1,20/km
  minNetProfitPerHour: 25.0, // R$ 25,00/h
  minPassengerRating: 4.8, // 4.80 estrelas
  maxPickupDistanceKm: 3.5, // 3.5 km
  maxPickupTimeMinutes: 8, // 8 min
  mode: 'balanced',
};

const DEFAULT_GOALS: FinancialGoals = {
  dailyRevenueGoal: 350.0,
  dailyNetProfitGoal: 200.0,
  weeklyNetProfitGoal: 1200.0,
  monthlyNetProfitGoal: 5000.0,
  workDaysPerWeek: 6,
};

const DEFAULT_SETTINGS: UserSettings = {
  driverName: 'Motorista Parceiro',
  platform: 'both',
  vehicleType: 'alugado',
  defaultRentalDaily: 70.0,
  goals: DEFAULT_GOALS,
  trafficLightSettings: DEFAULT_TRAFFIC_LIGHT_SETTINGS,
  trialStartDate: getTodayDateString(),
  subscriptionStatus: 'trial',
};

// Event bus simples para sincronização instantânea de estado no app
type ChangeListener = () => void;
const listeners: Set<ChangeListener> = new Set();

export function subscribeToDataChanges(listener: ChangeListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyDataChanged() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (err) {
      console.error('Erro ao notificar listener de dados:', err);
    }
  });
}

/**
 * Obtém todos os registros salvos, ordenados por data decrescente por padrão
 */
export function getDailyRecords(): DailyRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECORDS);
    if (!raw) return [];
    const parsed: DailyRecord[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    
    // Ordena do mais recente para o mais antigo
    return parsed.sort((a, b) => b.date.localeCompare(a.date));
  } catch (err) {
    console.error('Erro ao ler registros do localStorage:', err);
    return [];
  }
}

/**
 * Busca um registro pela data específica (YYYY-MM-DD)
 */
export function getRecordByDate(date: string): DailyRecord | undefined {
  const records = getDailyRecords();
  return records.find((r) => r.date === date);
}

/**
 * Verifica se já existe um registro salvo para a data informada
 */
export function checkDuplicateDate(date: string, excludeId?: string): boolean {
  const records = getDailyRecords();
  return records.some((r) => r.date === date && r.id !== excludeId);
}

/**
 * Salva ou atualiza um registro diário
 */
export function saveDailyRecord(data: {
  id?: string;
  date: string;
  grossRevenue: number;
  fuelCost: number;
  vehicleRentalCost: number;
  otherCosts: number;
  mileageKm: number;
  hoursWorked?: number;
  startTime?: string;
  endTime?: string;
  notes?: string;
  platform?: 'uber' | '99' | 'both' | 'other';
}): { success: boolean; isUpdate: boolean; record: DailyRecord } {
  const records = getDailyRecords();
  const now = new Date().toISOString();

  // Se tem ID ou já existe registro para a data
  const existingIndex = data.id
    ? records.findIndex((r) => r.id === data.id)
    : records.findIndex((r) => r.date === data.date);

  let finalRecord: DailyRecord;
  let isUpdate = false;

  if (existingIndex >= 0) {
    // Atualização
    isUpdate = true;
    finalRecord = {
      ...records[existingIndex],
      date: data.date,
      grossRevenue: Number(data.grossRevenue) || 0,
      fuelCost: Number(data.fuelCost) || 0,
      vehicleRentalCost: Number(data.vehicleRentalCost) || 0,
      otherCosts: Number(data.otherCosts) || 0,
      mileageKm: Number(data.mileageKm) || 0,
      hoursWorked: data.hoursWorked !== undefined ? Number(data.hoursWorked) : records[existingIndex].hoursWorked,
      startTime: data.startTime !== undefined ? data.startTime : records[existingIndex].startTime,
      endTime: data.endTime !== undefined ? data.endTime : records[existingIndex].endTime,
      notes: data.notes?.trim() || '',
      platform: data.platform || records[existingIndex].platform || 'both',
      updatedAt: now,
    };
    records[existingIndex] = finalRecord;
  } else {
    // Novo registro
    isUpdate = false;
    finalRecord = {
      id: data.id || `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      date: data.date,
      grossRevenue: Number(data.grossRevenue) || 0,
      fuelCost: Number(data.fuelCost) || 0,
      vehicleRentalCost: Number(data.vehicleRentalCost) || 0,
      otherCosts: Number(data.otherCosts) || 0,
      mileageKm: Number(data.mileageKm) || 0,
      hoursWorked: data.hoursWorked !== undefined ? Number(data.hoursWorked) : undefined,
      startTime: data.startTime || undefined,
      endTime: data.endTime || undefined,
      notes: data.notes?.trim() || '',
      platform: data.platform || 'both',
      createdAt: now,
      updatedAt: now,
    };
    records.push(finalRecord);
  }

  try {
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
    notifyDataChanged();
    return { success: true, isUpdate, record: finalRecord };
  } catch (err) {
    console.error('Falha ao gravar no localStorage:', err);
    return { success: false, isUpdate, record: finalRecord };
  }
}

/**
 * Remove um registro por ID com validação
 */
export function deleteDailyRecord(id: string): boolean {
  try {
    const records = getDailyRecords();
    const filtered = records.filter((r) => r.id !== id);
    if (filtered.length === records.length) return false;

    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(filtered));
    notifyDataChanged();
    return true;
  } catch (err) {
    console.error('Erro ao excluir registro:', err);
    return false;
  }
}

/**
 * Recupera configurações do motorista
 */
export function getUserSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      goals: {
        ...DEFAULT_GOALS,
        ...(parsed.goals || {}),
      },
      trafficLightSettings: {
        ...DEFAULT_TRAFFIC_LIGHT_SETTINGS,
        ...(parsed.trafficLightSettings || {}),
      },
    };
  } catch (err) {
    console.error('Erro ao ler configurações:', err);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Salva configurações do motorista
 */
export function saveUserSettings(settings: Partial<UserSettings>): UserSettings {
  try {
    const current = getUserSettings();
    const updated: UserSettings = {
      ...current,
      ...settings,
      goals: {
        ...current.goals,
        ...(settings.goals || {}),
      },
      trafficLightSettings: {
        ...current.trafficLightSettings,
        ...(settings.trafficLightSettings || {}),
      },
    };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    notifyDataChanged();
    return updated;
  } catch (err) {
    console.error('Erro ao salvar configurações:', err);
    return getUserSettings();
  }
}

/**
 * ========================================================
 * HISTÓRICO DE ANÁLISES DO RADAR DE CORRIDAS (SEPARADO)
 * ========================================================
 * O histórico de análises é estritamente isolado dos registros diários
 * efetivamente realizados, evitando qualquer poluição no faturamento real.
 */

export function getRideAnalyses(): RideAnalysisHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RADAR_ANALYSES);
    if (!raw) return [];
    const parsed: RideAnalysisHistoryItem[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  } catch (err) {
    console.error('Erro ao ler análises do radar:', err);
    return [];
  }
}

export function saveRideAnalysis(
  item: Omit<RideAnalysisHistoryItem, 'id' | 'savedAt'> & { id?: string }
): RideAnalysisHistoryItem {
  const analyses = getRideAnalyses();
  const newItem: RideAnalysisHistoryItem = {
    ...item,
    id: item.id || `radar_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    savedAt: new Date().toISOString(),
  };

  analyses.unshift(newItem);
  // Limita a 100 análises mais recentes para poupar memória
  const trimmed = analyses.slice(0, 100);

  try {
    localStorage.setItem(STORAGE_KEYS.RADAR_ANALYSES, JSON.stringify(trimmed));
    notifyDataChanged();
  } catch (err) {
    console.error('Erro ao salvar análise do radar:', err);
  }

  return newItem;
}

export function deleteRideAnalysis(id: string): boolean {
  try {
    const analyses = getRideAnalyses();
    const filtered = analyses.filter((a) => a.id !== id);
    if (filtered.length === analyses.length) return false;

    localStorage.setItem(STORAGE_KEYS.RADAR_ANALYSES, JSON.stringify(filtered));
    notifyDataChanged();
    return true;
  } catch (err) {
    console.error('Erro ao deletar análise do radar:', err);
    return false;
  }
}

export function clearRideAnalyses(): void {
  localStorage.removeItem(STORAGE_KEYS.RADAR_ANALYSES);
  notifyDataChanged();
}

/**
 * Exporta os dados completos como JSON para backup local (inclui registros, metas e radar)
 */
export function exportAllDataJSON(): string {
  const records = getDailyRecords();
  const settings = getUserSettings();
  const radarAnalyses = getRideAnalyses();
  const payload = {
    appName: 'Lucro no Volante',
    exportDate: new Date().toISOString(),
    version: '2.0.0',
    records,
    settings,
    radarAnalyses,
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Importa dados a partir de arquivo de backup JSON
 */
export function importDataJSON(jsonStr: string): {
  success: boolean;
  count: number;
  error?: string;
} {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!parsed || !Array.isArray(parsed.records)) {
      return { success: false, count: 0, error: 'Formato de arquivo inválido. Lista de registros não encontrada.' };
    }

    // Validação básica dos registros
    const validRecords: DailyRecord[] = parsed.records.filter(
      (r: any) => r && typeof r.date === 'string' && typeof r.grossRevenue === 'number'
    );

    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(validRecords));

    if (parsed.settings && typeof parsed.settings === 'object') {
      saveUserSettings(parsed.settings);
    }

    if (Array.isArray(parsed.radarAnalyses)) {
      localStorage.setItem(STORAGE_KEYS.RADAR_ANALYSES, JSON.stringify(parsed.radarAnalyses));
    }

    notifyDataChanged();
    return { success: true, count: validRecords.length };
  } catch (err: any) {
    return { success: false, count: 0, error: err?.message || 'Erro ao processar JSON.' };
  }
}

/**
 * Limpa todos os dados salvos do aplicativo
 */
export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEYS.RECORDS);
  localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  localStorage.removeItem(STORAGE_KEYS.RADAR_ANALYSES);
  notifyDataChanged();
}

/**
 * Inicializa dados demonstrativos realistas caso o usuário deseje visualizar relatórios imediatamente
 */
export function seedRealisticSampleData(): void {
  const today = new Date();
  const sampleRecords: DailyRecord[] = [];

  // 7 dias recentes com números típicos de motorista de aplicativo em São Paulo/grandes capitais
  const samples = [
    { rev: 320, fuel: 65, rent: 70, other: 15, km: 160, note: 'Dia produtivo, alta demanda na zona sul' },
    { rev: 280, fuel: 58, rent: 70, other: 12, km: 140, note: 'Quarta-feira regular' },
    { rev: 410, fuel: 82, rent: 70, other: 25, km: 210, note: 'Sexta-feira à noite com tarifas dinâmicas' },
    { rev: 450, fuel: 90, rent: 70, other: 30, km: 230, note: 'Sábado forte, corridas de eventos' },
    { rev: 310, fuel: 60, rent: 70, other: 18, km: 150, note: 'Domingo tarde' },
    { rev: 290, fuel: 62, rent: 70, other: 14, km: 145, note: 'Início de semana' },
    { rev: 300, fuel: 60, rent: 70, other: 20, km: 150, note: 'Exemplo teste padrão (R$ 300)' },
  ];

  samples.forEach((item, index) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (samples.length - 1 - index));
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${day}`;

    sampleRecords.push({
      id: `sample_${index}_${dateStr}`,
      date: dateStr,
      grossRevenue: item.rev,
      fuelCost: item.fuel,
      vehicleRentalCost: item.rent,
      otherCosts: item.other,
      mileageKm: item.km,
      notes: item.note,
      platform: 'both',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(sampleRecords));
  notifyDataChanged();
}

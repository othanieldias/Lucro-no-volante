/**
 * Lucro no Volante 3.0 - Camada de Persistência e Gerenciamento de Estado
 * 
 * - Persistência real e durável via localStorage no navegador com fallback seguro
 * - Prevenção estrita de duplicidade de registros por data
 * - Histórico persistente de conversas com sessões independentes e exclusão com confirmação explícita
 * - Exportação e importação de backups JSON completos
 * - Notificação em tempo real entre abas e componentes
 */

import {
  DailyRecord,
  FinancialGoals,
  UserSettings,
  VehicleConfig,
  DEFAULT_VEHICLE_CONFIG,
  ConversationSession,
  AiChatMessage,
} from '../types';
import { getTodayDateString } from '../utils/finance';

const STORAGE_KEYS = {
  RECORDS: 'lucro_volante_records_v1',
  SETTINGS: 'lucro_volante_settings_v1',
  CONVERSATIONS: 'lucro_volante_conversations_v3',
  ACTIVE_CONVERSATION: 'lucro_volante_active_conv_id_v3',
};

// Armazenamento em memória para ambientes headless, SSR ou execução de testes
const memoryStore = new Map<string, string>();

/**
 * Interface de acesso resiliente ao armazenamento local
 */
const safeStorage = {
  getItem(key: string): string | null {
    if (typeof localStorage !== 'undefined') {
      try {
        const val = localStorage.getItem(key);
        if (val !== null) return val;
      } catch {
        // Fallback para memória em caso de bloqueio do navegador
      }
    }
    return memoryStore.get(key) ?? null;
  },
  setItem(key: string, value: string): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(key, value);
      } catch {
        // Fallback para memória em caso de quota ou bloqueio
      }
    }
    memoryStore.set(key, value);
  },
  removeItem(key: string): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(key);
      } catch {
        // Ignora
      }
    }
    memoryStore.delete(key);
  },
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
  vehicleConfig: DEFAULT_VEHICLE_CONFIG,
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
    const raw = safeStorage.getItem(STORAGE_KEYS.RECORDS);
    if (!raw) return [];
    const parsed: DailyRecord[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    
    // Ordena do mais recente para o mais antigo
    return parsed.sort((a, b) => b.date.localeCompare(a.date));
  } catch (err) {
    console.error('Erro ao ler registros do armazenamento:', err);
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
    safeStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
    notifyDataChanged();
    return { success: true, isUpdate, record: finalRecord };
  } catch (err) {
    console.error('Falha ao gravar registro:', err);
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

    safeStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(filtered));
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
    const raw = safeStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      goals: {
        ...DEFAULT_GOALS,
        ...(parsed.goals || {}),
      },
      vehicleConfig: {
        ...DEFAULT_VEHICLE_CONFIG,
        ...(parsed.vehicleConfig || {}),
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
      vehicleConfig: {
        ...current.vehicleConfig,
        ...(settings.vehicleConfig || {}),
      },
    };
    safeStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    notifyDataChanged();
    return updated;
  } catch (err) {
    console.error('Erro ao salvar configurações:', err);
    return getUserSettings();
  }
}

// ========================================================
// Histórico Persistente de Conversas do Assistente Inteligente
// ========================================================

/**
 * Obtém todas as sessões de conversa do assistente salvas no armazenamento persistente.
 * Se fornecido driverId, isola as conversas daquele motorista/perfil.
 * Em caso de falha de leitura, nunca corrompe ou sobrescreve os dados existentes.
 */
export function getConversationSessions(driverId?: string): ConversationSession[] {
  try {
    const raw = safeStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    if (!raw) return [];
    const parsed: ConversationSession[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    let sessions = parsed;
    if (driverId) {
      sessions = sessions.filter((s) => !s.driverId || s.driverId === driverId);
    }

    // Ordena da conversa atualizada mais recentemente para a mais antiga
    return sessions.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch (err) {
    console.error('Erro ao ler sessões de conversas:', err);
    return [];
  }
}

/**
 * Obtém o ID da conversa ativa atual
 */
export function getActiveConversationId(): string | null {
  try {
    return safeStorage.getItem(STORAGE_KEYS.ACTIVE_CONVERSATION);
  } catch (err) {
    return null;
  }
}

/**
 * Define o ID da conversa ativa
 */
export function setActiveConversationId(id: string): void {
  try {
    safeStorage.setItem(STORAGE_KEYS.ACTIVE_CONVERSATION, id);
    notifyDataChanged();
  } catch (err) {
    console.error('Erro ao definir conversa ativa:', err);
  }
}

/**
 * Salva ou atualiza uma sessão de conversa no armazenamento persistente.
 * Trata erros de gravação com segurança.
 */
export function saveConversationSession(session: ConversationSession): boolean {
  try {
    const raw = safeStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    const existing: ConversationSession[] = raw ? JSON.parse(raw) : [];
    const idx = existing.findIndex((s) => s.id === session.id);

    const updatedSession: ConversationSession = {
      ...session,
      updatedAt: new Date().toISOString(),
    };

    if (idx >= 0) {
      existing[idx] = updatedSession;
    } else {
      existing.unshift(updatedSession);
    }

    safeStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(existing));
    notifyDataChanged();
    return true;
  } catch (err) {
    console.error('Erro ao salvar sessão de conversa:', err);
    return false;
  }
}

/**
 * Cria uma nova conversa independente sem apagar as anteriores.
 */
export function createConversationSession(params: {
  title?: string;
  initialMessage?: AiChatMessage;
  driverId?: string;
}): ConversationSession {
  const now = new Date().toISOString();
  const id = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const title = params.title || `Conversa ${new Date().toLocaleDateString('pt-BR')}`;
  
  const messages: AiChatMessage[] = params.initialMessage
    ? [{ ...params.initialMessage, conversationId: id }]
    : [];

  const newSession: ConversationSession = {
    id,
    title,
    createdAt: now,
    updatedAt: now,
    driverId: params.driverId,
    messages,
  };

  saveConversationSession(newSession);
  setActiveConversationId(id);
  return newSession;
}

/**
 * Adiciona uma mensagem à conversa especificada mantendo a persistência.
 */
export function addMessageToConversationSession(
  sessionId: string,
  message: AiChatMessage
): boolean {
  try {
    const sessions = getConversationSessions();
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return false;

    session.messages.push({ ...message, conversationId: sessionId });
    return saveConversationSession(session);
  } catch (err) {
    console.error('Erro ao adicionar mensagem à conversa:', err);
    return false;
  }
}

/**
 * Limpa a tela/mensagens da conversa ativa sem excluir o registro da sessão.
 */
export function clearConversationMessages(sessionId: string): boolean {
  try {
    const sessions = getConversationSessions();
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return false;

    session.messages = [];
    return saveConversationSession(session);
  } catch (err) {
    console.error('Erro ao limpar mensagens da conversa:', err);
    return false;
  }
}

/**
 * Exclui uma sessão de conversa do histórico persistente.
 * EXIGE explicitConfirmation === true para evitar exclusões acidentais ou automáticas.
 */
export function deleteConversationSession(
  sessionId: string,
  explicitConfirmation: boolean
): boolean {
  if (!explicitConfirmation) {
    console.warn('Exclusão de conversa rejeitada: confirmação explícita obrigatória.');
    return false;
  }

  try {
    const raw = safeStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    if (!raw) return false;
    const existing: ConversationSession[] = JSON.parse(raw);
    const filtered = existing.filter((s) => s.id !== sessionId);

    if (filtered.length === existing.length) return false;

    safeStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(filtered));

    // Se a conversa deletada era a ativa, limpa a referência ativa
    if (getActiveConversationId() === sessionId) {
      if (filtered.length > 0) {
        setActiveConversationId(filtered[0].id);
      } else {
        safeStorage.removeItem(STORAGE_KEYS.ACTIVE_CONVERSATION);
      }
    }

    notifyDataChanged();
    return true;
  } catch (err) {
    console.error('Erro ao excluir sessão de conversa:', err);
    return false;
  }
}

/**
 * Exporta os dados completos como JSON para backup local (inclui registros, metas, veículo e conversas)
 */
export function exportAllDataJSON(): string {
  const records = getDailyRecords();
  const settings = getUserSettings();
  const conversations = getConversationSessions();
  const payload = {
    appName: 'Lucro no Volante',
    exportDate: new Date().toISOString(),
    version: '3.0.0',
    records,
    dailyRecords: records,
    settings,
    conversations,
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
    const recordsList = Array.isArray(parsed.dailyRecords) ? parsed.dailyRecords : parsed.records;
    if (!parsed || !Array.isArray(recordsList)) {
      return { success: false, count: 0, error: 'Formato de arquivo inválido. Lista de registros não encontrada.' };
    }

    // Validação básica dos registros
    const validRecords: DailyRecord[] = recordsList.filter(
      (r: any) => r && typeof r.date === 'string' && typeof r.grossRevenue === 'number'
    );

    safeStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(validRecords));

    if (parsed.settings && typeof parsed.settings === 'object') {
      saveUserSettings(parsed.settings);
    }

    // Importa conversas se presentes no backup
    if (Array.isArray(parsed.conversations)) {
      safeStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(parsed.conversations));
      if (parsed.conversations.length > 0) {
        setActiveConversationId(parsed.conversations[0].id);
      }
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
  safeStorage.removeItem(STORAGE_KEYS.RECORDS);
  safeStorage.removeItem(STORAGE_KEYS.SETTINGS);
  safeStorage.removeItem(STORAGE_KEYS.CONVERSATIONS);
  safeStorage.removeItem(STORAGE_KEYS.ACTIVE_CONVERSATION);
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

  safeStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(sampleRecords));
  notifyDataChanged();
}

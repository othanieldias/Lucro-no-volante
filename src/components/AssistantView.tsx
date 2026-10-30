import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  TrendingUp,
  Fuel,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Lightbulb,
  Clock,
  PlusCircle,
  Trash2,
  Eraser,
  MessageSquare,
  History,
  X,
  Check,
  CheckCircle2,
} from 'lucide-react';
import { AiChatMessage, ConversationSession, DailyRecord, UserSettings } from '../types';
import {
  aggregatePeriodSummary,
  calculateFuelPeriodAnalysis,
  formatCurrency,
  formatHours,
  formatPerKm,
  formatPerHour,
  formatPercent,
  getLast7DaysRange,
  getMondaySundayWeekRange,
} from '../utils/finance';
import {
  getConversationSessions,
  getActiveConversationId,
  setActiveConversationId,
  createConversationSession,
  addMessageToConversationSession,
  clearConversationMessages,
  deleteConversationSession,
  subscribeToDataChanges,
} from '../services/storage';

interface AssistantViewProps {
  records: DailyRecord[];
  settings: UserSettings;
  onNavigateToFuel?: () => void;
  onNavigateToCalculator?: () => void;
  onNavigate?: (tab: string) => void;
}

export const AssistantView: React.FC<AssistantViewProps> = ({
  records,
  settings,
  onNavigateToFuel,
  onNavigateToCalculator,
  onNavigate,
}) => {
  const driverKey = settings.driverName || 'Motorista';

  // Gerenciamento de Sessões Persistentes
  const [sessions, setSessions] = useState<ConversationSession[]>(() => {
    return getConversationSessions(driverKey);
  });
  const [activeSessionId, setCurrentActiveId] = useState<string | null>(() => {
    return getActiveConversationId();
  });

  const [inputQuery, setInputQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [geminiConfigured, setGeminiConfigured] = useState<boolean | null>(null);

  // Estados dos Modais e Menus
  const [showHistoryDrawer, setShowHistoryDrawer] = useState<boolean>(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mensagem inicial de boas-vindas padrão para novas conversas
  const createDefaultWelcomeMessage = useCallback((): AiChatMessage => {
    return {
      id: `welcome_${Date.now()}`,
      sender: 'assistant',
      text: `Olá, ${driverKey}! Sou seu Assistente Inteligente financeiro do Lucro no Volante.\n\nMinha memória é persistente: você pode consultar conversas anteriores, iniciar novos tópicos ou tirar dúvidas sobre sua rentabilidade por km, metas diárias e consumo de combustível.\n\nComo posso ajudar você hoje?`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      source: 'system_notice',
    };
  }, [driverKey]);

  // Inicializa ou seleciona sessão ativa
  useEffect(() => {
    let currentSessions = getConversationSessions(driverKey);
    let currentId = getActiveConversationId();

    if (currentSessions.length === 0) {
      const initial = createConversationSession({
        driverId: driverKey,
        title: `Conversa Inicial`,
        initialMessage: createDefaultWelcomeMessage(),
      });
      currentSessions = [initial];
      currentId = initial.id;
    } else if (!currentId || !currentSessions.some((s) => s.id === currentId)) {
      currentId = currentSessions[0].id;
      setActiveConversationId(currentId);
    }

    setSessions(currentSessions);
    setCurrentActiveId(currentId);
  }, [driverKey, createDefaultWelcomeMessage]);

  // Assinatura para sincronização entre componentes
  useEffect(() => {
    const unsubscribe = subscribeToDataChanges(() => {
      const updatedSessions = getConversationSessions(driverKey);
      setSessions(updatedSessions);
      const activeId = getActiveConversationId();
      if (activeId) setCurrentActiveId(activeId);
    });
    return unsubscribe;
  }, [driverKey]);

  // Sessão ativa atual
  const activeSession = useMemo(() => {
    return sessions.find((s) => s.id === activeSessionId) || sessions[0] || null;
  }, [sessions, activeSessionId]);

  const messages = useMemo(() => {
    return activeSession ? activeSession.messages : [];
  }, [activeSession]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Resumos financeiros consolidados para o contexto da IA
  const allTimeSummary = useMemo(() => aggregatePeriodSummary(records, settings.vehicleConfig), [records, settings.vehicleConfig]);
  const last7Summary = useMemo(() => {
    const r = getLast7DaysRange();
    const filtered = records.filter((rec) => rec.date >= r.startDate && rec.date <= r.endDate);
    return aggregatePeriodSummary(filtered, settings.vehicleConfig);
  }, [records, settings.vehicleConfig]);
  const thisWeekSummary = useMemo(() => {
    const r = getMondaySundayWeekRange();
    const filtered = records.filter((rec) => rec.date >= r.startDate && rec.date <= r.endDate);
    return aggregatePeriodSummary(filtered, settings.vehicleConfig);
  }, [records, settings.vehicleConfig]);
  const fuelAnalysis = useMemo(() => {
    return calculateFuelPeriodAnalysis(records, settings.vehicleConfig);
  }, [records, settings.vehicleConfig]);

  // Perguntas rápidas pré-configuradas solicitadas pelo usuário
  const quickQuestions = [
    'Quanto estou gastando de combustível por dia?',
    'Quanto sobra de cada R$ 100 que faturo?',
    'Quantas horas preciso trabalhar para atingir minha meta?',
    'Qual foi meu melhor período de trabalho?',
    'Como posso reduzir meu custo por quilômetro?',
    'Meu lucro líquido melhorou em relação à semana passada?',
  ];

  /**
   * Cria uma nova conversa sem apagar nenhuma anterior
   */
  const handleStartNewConversation = () => {
    const titleDate = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    const newSession = createConversationSession({
      driverId: driverKey,
      title: `Conversa ${titleDate}`,
      initialMessage: createDefaultWelcomeMessage(),
    });

    const updated = getConversationSessions(driverKey);
    setSessions(updated);
    setCurrentActiveId(newSession.id);
    setShowHistoryDrawer(false);
    showNotice('Nova conversa iniciada. As conversas anteriores foram salvas no histórico.');
  };

  /**
   * Limpa a tela da conversa atual mantendo o registro no histórico
   */
  const handleClearCurrentScreen = () => {
    if (!activeSession) return;
    clearConversationMessages(activeSession.id);
    const updated = getConversationSessions(driverKey);
    setSessions(updated);
    showNotice('Tela limpa com sucesso. Seu histórico continua preservado no menu lateral.');
  };

  /**
   * Exclusão segura com confirmação explícita
   */
  const handleConfirmDeleteConversation = (sessionId: string) => {
    deleteConversationSession(sessionId, true);
    let updated = getConversationSessions(driverKey);
    if (updated.length === 0) {
      const fresh = createConversationSession({
        driverId: driverKey,
        title: 'Nova Conversa',
        initialMessage: createDefaultWelcomeMessage(),
      });
      updated = [fresh];
    }
    setSessions(updated);
    setCurrentActiveId(getActiveConversationId() || updated[0].id);
    setConfirmDeleteId(null);
    showNotice('Conversa excluída do histórico persistente.');
  };

  const showNotice = (msg: string) => {
    setFeedbackNotice(msg);
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  /**
   * Motor Analítico Baseado em Regras Financeiras dos Dados Reais
   */
  const generateRulesEngineInsight = (query: string): { text: string; insights: string[]; action?: { tab: string; label: string } } => {
    const q = query.toLowerCase();

    if (records.length === 0) {
      return {
        text: 'Você ainda não registrou nenhum dia de trabalho. Para que eu possa analisar sua rentabilidade real, lance seu primeiro turno na Calculadora!',
        insights: [
          'Fato: Nenhum registro contábil encontrado no armazenamento.',
          'Recomendação: Clique no botão abaixo para adicionar os dados do seu último turno.',
        ],
        action: { tab: 'calculator', label: 'Lançar Primeiro Turno' },
      };
    }

    if (q.includes('combustível') || q.includes('combustivel') || q.includes('litro')) {
      const avgFuelPerWorkedDay = allTimeSummary.workedDaysCount > 0 ? (allTimeSummary.consumedFuelCost || allTimeSummary.totalFuel) / allTimeSummary.workedDaysCount : 0;
      const fuelPctOfRevenue = allTimeSummary.totalRevenue > 0 ? ((allTimeSummary.consumedFuelCost || allTimeSummary.totalFuel) / allTimeSummary.totalRevenue) * 100 : 0;
      const costKm = fuelAnalysis.fuelCostPerKm;

      return {
        text: `Com base nos seus ${allTimeSummary.workedDaysCount} dia(s) trabalhados, seu custo estimado de combustível consumido é de aproximadamente ${formatCurrency(avgFuelPerWorkedDay)} por dia trabalhado (${formatCurrency(allTimeSummary.consumedFuelCost || allTimeSummary.totalFuel)} acumulados).\n\nIsso representa cerca de ${formatPercent(fuelPctOfRevenue)} do seu faturamento bruto.`,
        insights: [
          `Custo Consumido: ${formatCurrency(allTimeSummary.consumedFuelCost || 0)} consumidos nos ${allTimeSummary.totalKm} km rodados.`,
          `Abastecido no Posto (Caixa): Total de ${formatCurrency(allTimeSummary.totalFuel)} lançados em compras de combustível.`,
          `Veículo (${settings.vehicleConfig.vehicleName}): Consumo de ${settings.vehicleConfig.consumptionKmL} km/l, custando ${costKm ? formatPerKm(costKm) : '—'} por km rodado.`,
        ],
        action: { tab: 'fuel', label: 'Ver Módulo de Combustível' },
      };
    }

    if (q.includes('100') || q.includes('sobra') || q.includes('margem')) {
      const margin = allTimeSummary.operationalNetMarginPercent ?? allTimeSummary.netMarginPercent ?? 0;
      const remainingPer100 = margin > 0 ? (margin / 100) * 100 : 0;

      return {
        text: `De cada R$ 100,00 que você fatura, sobram aproximadamente ${formatCurrency(remainingPer100)} de lucro líquido no seu bolso após abater combustível consumido, aluguel/parcela e despesas operacionais (margem líquida de ${formatPercent(margin)}).`,
        insights: [
          `Fato Registrado: Margem operacional de ${formatPercent(margin)}.`,
          margin >= 50
            ? 'Excelente Resultado: Sua margem está acima de 50%, o que é excelente para o setor de mobilidade.'
            : margin >= 30
            ? 'Resultado Saudável: Margem dentro da média competitiva.'
            : 'Atenção Operacional: Menos de R$ 30,00 por centena faturada indica despesas elevadas por km rodado.',
        ],
        action: { tab: 'reports', label: 'Ver Relatórios de Margem' },
      };
    }

    if (q.includes('meta') || q.includes('horas') || q.includes('preciso trabalhar')) {
      const dailyGoal = settings.goals.dailyNetProfitGoal || 200;
      const avgPerHour = allTimeSummary.avgNetProfitPerHour;

      if (!avgPerHour || avgPerHour <= 0) {
        return {
          text: `Sua meta diária de lucro líquido é de ${formatCurrency(dailyGoal)}. Como ainda não há horas trabalhadas suficientes registradas para calcular seu rendimento por hora, recomendo preencher os horários ou horas nos seus lançamentos diários.`,
          insights: [
            'Fato: Horas de trabalho ainda não informadas de forma contínua.',
            'Recomendação: Ao preencher os turnos, informe as horas trabalhadas para destravar essa projeção.',
          ],
          action: { tab: 'goals', label: 'Ajustar Metas' },
        };
      }

      const hoursNeeded = Math.ceil((dailyGoal / avgPerHour) * 10) / 10;
      return {
        text: `Para atingir sua meta diária de ${formatCurrency(dailyGoal)} de lucro líquido, você precisa trabalhar em média ${formatHours(hoursNeeded)} (considerando seu lucro médio de ${formatPerHour(avgPerHour)}).`,
        insights: [
          `Fato Registrado: Lucro líquido médio de ${formatPerHour(avgPerHour)}.`,
          `Meta Ativa: ${formatCurrency(dailyGoal)}/dia.`,
          hoursNeeded > 10
            ? 'Recomendação: Mais de 10 horas necessárias. Considere focar nos horários de maior tarifa dinâmica ou rever despesas fixas.'
            : 'Ritmo Sustentável: Jornada equilibrada para atingir o objetivo sem sobrecarga.',
        ],
        action: { tab: 'goals', label: 'Ver Metas Financeiras' },
      };
    }

    if (q.includes('melhor') || q.includes('recorde') || q.includes('pico')) {
      const best = allTimeSummary.bestDay;
      const worst = allTimeSummary.worstDay;

      return {
        text: best
          ? `Seu melhor turno registrado foi em ${best.date}, gerando um lucro líquido de ${formatCurrency(best.profit)} em um único dia!`
          : 'Ainda não temos registros suficientes para determinar seu dia recorde.',
        insights: [
          best ? `Melhor Dia: ${best.date} com ${formatCurrency(best.profit)} de lucro limpo.` : '',
          worst ? `Dia Mais Difícil: ${worst.date} com ${formatCurrency(worst.profit)} de resultado.` : '',
        ].filter(Boolean),
        action: { tab: 'history', label: 'Consultar Histórico' },
      };
    }

    if (q.includes('reduzir') || q.includes('custo') || q.includes('quilômetro') || q.includes('km')) {
      const currentCostKm = allTimeSummary.operationalCostPerKm || allTimeSummary.avgCostPerKm || 1.0;
      const fuelCostKm = fuelAnalysis.fuelCostPerKm || 0.55;

      return {
        text: `Seu custo operacional médio atual é de ${formatPerKm(currentCostKm)}. Desse total, o combustível responde por ${formatPerKm(fuelCostKm)} e os custos fixos/aluguel pelo restante.`,
        insights: [
          '1. Evite rodar vazio: Desloque-se para centros de demanda sem acelerar forte.',
          '2. Calibragem dos pneus: Manter a pressão recomendada economiza até 3% de combustível.',
          '3. Condução suave: Antecipar paradas em semáforos evita frenagens e arrancadas bruscas.',
        ],
        action: { tab: 'fuel', label: 'Simular Eficiência de Combustível' },
      };
    }

    return {
      text: `Entendi sua dúvida sobre "${query}".\n\nNo momento, seus dados estão consolidados: você tem ${allTimeSummary.workedDaysCount} dia(s) registrados, faturou um total de ${formatCurrency(allTimeSummary.totalRevenue)}, rodou ${allTimeSummary.totalKm} km e obteve ${formatCurrency(allTimeSummary.operationalNetProfit ?? allTimeSummary.netProfit)} de lucro líquido acumulado.`,
      insights: [
        `Média de Faturamento/Dia: ${formatCurrency(allTimeSummary.avgRevenuePerWorkedDay)}`,
        `Média de Lucro/Dia: ${formatCurrency(allTimeSummary.avgNetProfitPerWorkedDay)}`,
        allTimeSummary.operationalCostPerKm ? `Custo Operacional por KM: ${formatPerKm(allTimeSummary.operationalCostPerKm)}` : 'Quilometragem ainda não informada em todos os turnos.',
      ],
      action: { tab: 'dashboard', label: 'Ir para o Dashboard' },
    };
  };

  /**
   * Envio de mensagem com persistência durável e preservação do histórico
   */
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isLoading || !activeSession) return;

    const userMessage: AiChatMessage = {
      id: `user_${Date.now()}`,
      conversationId: activeSession.id,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    // Salva a mensagem do usuário imediatamente no storage
    addMessageToConversationSession(activeSession.id, userMessage);
    setSessions(getConversationSessions(driverKey));
    setInputQuery('');
    setIsLoading(true);

    // Contexto sanitizado e estritamente financeiro (sem envio de PII ou senhas)
    const contextPayload = {
      driverName: settings.driverName || 'Motorista',
      totalRecords: records.length,
      allTime: {
        totalRevenue: allTimeSummary.totalRevenue,
        totalCosts: allTimeSummary.operationalTotalCosts ?? allTimeSummary.totalCosts,
        netProfit: allTimeSummary.operationalNetProfit ?? allTimeSummary.netProfit,
        netMarginPercent: allTimeSummary.operationalNetMarginPercent ?? allTimeSummary.netMarginPercent,
        totalKm: allTimeSummary.totalKm,
        totalHours: allTimeSummary.totalHoursWorked,
        avgNetProfitPerDay: allTimeSummary.avgNetProfitPerWorkedDay,
        avgCostPerKm: allTimeSummary.operationalCostPerKm ?? allTimeSummary.avgCostPerKm,
        avgNetProfitPerHour: allTimeSummary.avgNetProfitPerHour,
        consumedFuelLiters: allTimeSummary.consumedFuelLiters,
        consumedFuelCost: allTimeSummary.consumedFuelCost,
        refillTotalCost: allTimeSummary.refillTotalCost,
      },
      last7Days: {
        totalRevenue: last7Summary.totalRevenue,
        netProfit: last7Summary.operationalNetProfit ?? last7Summary.netProfit,
      },
      vehicleConfig: settings.vehicleConfig,
      dailyGoal: settings.goals.dailyNetProfitGoal,
      // Histórico recente para preservar o contexto da conversa
      recentMessages: messages.slice(-6).map((m) => ({ sender: m.sender, text: m.text })),
    };

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          context: contextPayload,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.reply) {
          setGeminiConfigured(true);
          const aiMessage: AiChatMessage = {
            id: `ai_${Date.now()}`,
            conversationId: activeSession.id,
            sender: 'assistant',
            text: data.reply,
            timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            source: 'gemini',
          };
          addMessageToConversationSession(activeSession.id, aiMessage);
          setSessions(getConversationSessions(driverKey));
          setIsLoading(false);
          return;
        }
      }
    } catch (err) {
      // Backend offline ou indisponível
    }

    // Fallback: Motor de Regras Local Deterministico
    setGeminiConfigured(false);
    const rulesInsight = generateRulesEngineInsight(query);

    const fallbackMessage: AiChatMessage = {
      id: `fallback_${Date.now()}`,
      conversationId: activeSession.id,
      sender: 'assistant',
      text: rulesInsight.text,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      source: 'rules_engine',
      insights: rulesInsight.insights,
      suggestedAction: rulesInsight.action,
    };

    addMessageToConversationSession(activeSession.id, fallbackMessage);
    setSessions(getConversationSessions(driverKey));
    setIsLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Notificação Flutuante de Feedback */}
      {feedbackNotice && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs rounded-xl flex items-center justify-between shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackNotice}</span>
          </div>
          <button onClick={() => setFeedbackNotice(null)} className="text-emerald-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-emerald-400" />
            Assistente Inteligente Financeiro
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-0.5">
            Histórico persistente, memória contínua entre sessões e diagnósticos dos seus custos reais.
          </p>
        </div>

        {/* Barra de Ações Rápidas de Conversas */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
            title="Ver conversas anteriores"
          >
            <History className="w-3.5 h-3.5 text-emerald-400" />
            <span>Conversas ({sessions.length})</span>
          </button>

          <button
            onClick={handleStartNewConversation}
            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            title="Iniciar nova conversa sem apagar as anteriores"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Nova Conversa</span>
          </button>
        </div>
      </div>

      {/* Drawer / Painel Lateral de Histórico de Conversas (quando aberto) */}
      {showHistoryDrawer && (
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Histórico de Conversas Salvas
              </span>
            </div>
            <button
              onClick={() => setShowHistoryDrawer(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Suas mensagens são salvas automaticamente no armazenamento persistente do seu navegador. 
            Você pode alternar entre sessões ou excluí-las com confirmação prévia.
          </p>

          <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
            {sessions.map((sess) => {
              const isActive = sess.id === activeSessionId;
              return (
                <div
                  key={sess.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition text-xs ${
                    isActive
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-semibold'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <button
                    onClick={() => {
                      setActiveConversationId(sess.id);
                      setCurrentActiveId(sess.id);
                      setShowHistoryDrawer(false);
                    }}
                    className="flex-1 text-left flex items-center gap-2 overflow-hidden"
                  >
                    <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <span className="truncate">{sess.title}</span>
                    <span className="text-[10px] text-slate-500 font-mono shrink-0">
                      ({sess.messages.length} msgs)
                    </span>
                  </button>

                  <button
                    onClick={() => setConfirmDeleteId(sess.id)}
                    className="text-slate-500 hover:text-rose-400 p-1.5 ml-2 rounded-lg hover:bg-rose-500/10 transition"
                    title="Excluir esta conversa"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal de Confirmação Explícita de Exclusão */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">
                  Confirmar Exclusão de Conversa
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Tem certeza que deseja excluir esta conversa do histórico persistente?
                  Esta ação é irreversível e removerá todas as mensagens trocadas nessa sessão.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleConfirmDeleteConversation(confirmDeleteId)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirmar Exclusão Definitiva</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barra de Status e Limpeza de Tela */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="font-medium text-slate-200">
            {activeSession ? activeSession.title : 'Sessão Ativa'}
          </span>
          <span className="text-[11px] text-slate-500">
            · {messages.length} mensagem(ns) salvas
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClearCurrentScreen}
            className="text-[11px] text-slate-400 hover:text-amber-300 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-800 transition"
            title="Limpar a visualização da tela atual sem apagar as conversas do histórico"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>Limpar Tela</span>
          </button>
        </div>
      </div>

      {/* Chat Container */}
      <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl flex flex-col h-[520px] shadow-sm overflow-hidden">
        {/* Lista de Mensagens */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-slate-500">
              <Bot className="w-10 h-10 text-slate-600 stroke-[1.5]" />
              <p className="text-xs text-slate-400 max-w-sm">
                A tela está limpa. Digite uma pergunta abaixo ou escolha um dos tópicos rápidos para retomar o diálogo.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs space-y-2.5 shadow-sm ${
                      isUser
                        ? 'bg-emerald-500 text-slate-950 font-medium rounded-tr-none'
                        : 'bg-slate-950 border border-slate-800/80 text-slate-200 rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>

                    {msg.insights && msg.insights.length > 0 && (
                      <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">
                          Pontos de Atenção & Recomendações:
                        </span>
                        {msg.insights.map((ins, i) => (
                          <div
                            key={i}
                            className="p-2 bg-slate-900/80 border border-slate-800 rounded-lg text-[11px] text-slate-300 flex items-start gap-1.5"
                          >
                            <span className="text-emerald-400 font-bold">•</span>
                            <span>{ins}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {msg.suggestedAction && (
                      <div className="pt-1">
                        <button
                          onClick={() => {
                            if (msg.suggestedAction?.tab === 'fuel' && onNavigateToFuel) {
                              onNavigateToFuel();
                            } else if (msg.suggestedAction?.tab === 'calculator' && onNavigateToCalculator) {
                              onNavigateToCalculator();
                            } else if (onNavigate) {
                              onNavigate(msg.suggestedAction!.tab);
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-semibold text-[11px] flex items-center gap-1.5 transition"
                        >
                          <span>{msg.suggestedAction.label}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] opacity-60 pt-0.5 font-mono">
                      <span>
                        {msg.source === 'gemini'
                          ? 'Google Gemini AI'
                          : msg.source === 'rules_engine'
                          ? 'Diagnóstico por Regras'
                          : ''}
                      </span>
                      <span>{msg.timestamp}</span>
                    </div>
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 animate-pulse" />
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl rounded-tl-none p-3.5 text-xs text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Consultando memória e calculando indicadores...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Sugestões de Perguntas Rápidas */}
        <div className="p-2.5 bg-slate-950/80 border-t border-slate-800/80 overflow-x-auto flex items-center gap-1.5">
          <span className="text-[11px] text-slate-500 font-medium pl-1 whitespace-nowrap hidden sm:inline">
            Perguntar:
          </span>
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              disabled={isLoading}
              className="text-[11px] px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-800 whitespace-nowrap transition disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Campo de Entrada de Texto */}
        <div className="p-3 bg-slate-950 border-t border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Pergunte sobre seus ganhos, custos, km, metas ou histórico..."
              disabled={isLoading}
              className="flex-1 h-11 px-4 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || isLoading}
              className="h-11 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Enviar</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

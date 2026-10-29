import React, { useState, useMemo } from 'react';
import {
  Compass,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Settings,
  History,
  Sparkles,
  RotateCcw,
  Save,
  Trash2,
  Smartphone,
  ShieldCheck,
  Info,
  DollarSign,
  Clock,
  Navigation,
  Star,
  Layers,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import {
  RideAnalysisHistoryItem,
  RideCriteriaCheck,
  RideEvaluationResult,
  RideOfferInput,
  TrafficLightResult,
  TrafficLightSettings,
  UserSettings,
} from '../types';
import {
  evaluateRideOffer,
  formatCurrency,
  formatPerKm,
  formatPerHour,
  formatPercent,
  parseBrazilianInput,
} from '../utils/finance';
import {
  deleteRideAnalysis,
  getRideAnalyses,
  saveRideAnalysis,
  saveUserSettings,
} from '../services/storage';

interface RadarViewProps {
  settings: UserSettings;
  realCostPerKm?: number | null;
  onSettingsUpdated: (updated: UserSettings) => void;
}

export const RadarView: React.FC<RadarViewProps> = ({
  settings,
  realCostPerKm,
  onSettingsUpdated,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'evaluate' | 'history' | 'settings'>('evaluate');

  // Formulário da Oferta de Corrida
  const [app, setApp] = useState<'uber' | '99' | 'other'>('uber');
  const [fareStr, setFareStr] = useState<string>('');
  const [totalDistanceStr, setTotalDistanceStr] = useState<string>('');
  const [totalDurationStr, setTotalDurationStr] = useState<string>('');
  
  // Campos detalhados opcionais
  const [hasDetailedTrip, setHasDetailedTrip] = useState<boolean>(false);
  const [pickupDistanceStr, setPickupDistanceStr] = useState<string>('');
  const [pickupDurationStr, setPickupDurationStr] = useState<string>('');
  const [tripDistanceStr, setTripDistanceStr] = useState<string>('');
  const [tripDurationStr, setTripDurationStr] = useState<string>('');

  const [passengerRatingStr, setPassengerRatingStr] = useState<string>('');
  const [passengerRatingCountStr, setPassengerRatingCountStr] = useState<string>('');
  const [extraCostsStr, setExtraCostsStr] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [isDemoRide, setIsDemoRide] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

  // Histórico de análises
  const [analyses, setAnalyses] = useState<RideAnalysisHistoryItem[]>(() => getRideAnalyses());

  // Configurações do Semáforo (Form State)
  const [trafficSettings, setTrafficSettings] = useState<TrafficLightSettings>(
    settings.trafficLightSettings
  );

  const parsedFare = parseBrazilianInput(fareStr);
  const parsedTotalDistance = parseBrazilianInput(totalDistanceStr);
  const parsedTotalDuration = parseBrazilianInput(totalDurationStr);

  const parsedPickupDistance = hasDetailedTrip ? parseBrazilianInput(pickupDistanceStr) : undefined;
  const parsedPickupDuration = hasDetailedTrip ? parseBrazilianInput(pickupDurationStr) : undefined;
  const parsedTripDistance = hasDetailedTrip ? parseBrazilianInput(tripDistanceStr) : undefined;
  const parsedTripDuration = hasDetailedTrip ? parseBrazilianInput(tripDurationStr) : undefined;

  const parsedRating = passengerRatingStr.trim() ? parseBrazilianInput(passengerRatingStr) : undefined;
  const parsedRatingCount = passengerRatingCountStr.trim() ? parseInt(passengerRatingCountStr, 10) : undefined;
  const parsedExtraCosts = extraCostsStr.trim() ? parseBrazilianInput(extraCostsStr) : undefined;

  // Objeto de entrada da corrida atual
  const currentOfferInput: RideOfferInput = useMemo(() => {
    return {
      app,
      estimatedFare: parsedFare,
      totalDistanceKm: parsedTotalDistance,
      totalDurationMinutes: parsedTotalDuration,
      pickupDistanceKm: parsedPickupDistance,
      pickupDurationMinutes: parsedPickupDuration,
      tripDistanceKm: parsedTripDistance,
      tripDurationMinutes: parsedTripDuration,
      passengerRating: parsedRating,
      passengerRatingCount: parsedRatingCount,
      tollOrExtraCosts: parsedExtraCosts,
      notes,
    };
  }, [
    app,
    parsedFare,
    parsedTotalDistance,
    parsedTotalDuration,
    parsedPickupDistance,
    parsedPickupDuration,
    parsedTripDistance,
    parsedTripDuration,
    parsedRating,
    parsedRatingCount,
    parsedExtraCosts,
    notes,
  ]);

  // Avaliação em tempo real
  const evaluation: RideEvaluationResult = useMemo(() => {
    return evaluateRideOffer(currentOfferInput, trafficSettings, realCostPerKm);
  }, [currentOfferInput, trafficSettings, realCostPerKm]);

  // Carregar corrida de demonstração (fictícia)
  const handleLoadDemo = (preset: 'good' | 'warning' | 'bad') => {
    setIsDemoRide(true);
    setHasDetailedTrip(true);
    if (preset === 'good') {
      setApp('uber');
      setFareStr('34,50');
      setPickupDistanceStr('1,8');
      setPickupDurationStr('5');
      setTripDistanceStr('9,5');
      setTripDurationStr('22');
      setTotalDistanceStr('11,3');
      setTotalDurationStr('27');
      setPassengerRatingStr('4,92');
      setPassengerRatingCountStr('340');
      setExtraCostsStr('0,00');
      setNotes('Demo: Boa corrida (centro para bairro nobre)');
    } else if (preset === 'warning') {
      setApp('99');
      setFareStr('22,00');
      setPickupDistanceStr('4,2');
      setPickupDurationStr('11');
      setTripDistanceStr('6,0');
      setTripDurationStr('18');
      setTotalDistanceStr('10,2');
      setTotalDurationStr('29');
      setPassengerRatingStr('4,75');
      setPassengerRatingCountStr('45');
      setExtraCostsStr('0,00');
      setNotes('Demo: Alerta de busca longa (4,2 km)');
    } else {
      setApp('uber');
      setFareStr('12,00');
      setPickupDistanceStr('3,0');
      setPickupDurationStr('8');
      setTripDistanceStr('6,5');
      setTripDurationStr('24');
      setTotalDistanceStr('9,5');
      setTotalDurationStr('32');
      setPassengerRatingStr('4,60');
      setPassengerRatingCountStr('12');
      setExtraCostsStr('0,00');
      setNotes('Demo: Corrida ruim (preço baixo e trânsito)');
    }

    setFeedbackMsg({
      type: 'info',
      text: 'Dados de demonstração carregados com sucesso. (Fictícios, sem impacto no faturamento)',
    });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // Limpar formulário
  const handleClear = () => {
    setFareStr('');
    setTotalDistanceStr('');
    setTotalDurationStr('');
    setPickupDistanceStr('');
    setPickupDurationStr('');
    setTripDistanceStr('');
    setTripDurationStr('');
    setPassengerRatingStr('');
    setPassengerRatingCountStr('');
    setExtraCostsStr('');
    setNotes('');
    setIsDemoRide(false);
    setFeedbackMsg(null);
  };

  // Salvar no Histórico de Análises
  const handleSaveAnalysis = () => {
    if (evaluation.status === 'insufficient_data') {
      setFeedbackMsg({
        type: 'error',
        text: 'Não é possível salvar: preencha os dados mínimos de valor, km e tempo.',
      });
      setTimeout(() => setFeedbackMsg(null), 3000);
      return;
    }

    const saved = saveRideAnalysis({
      input: currentOfferInput,
      result: evaluation,
      isDemo: isDemoRide,
    });

    setAnalyses(getRideAnalyses());
    setFeedbackMsg({
      type: 'success',
      text: 'Análise arquivada com sucesso no histórico do radar! (Não altera o faturamento do dashboard)',
    });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // Excluir do Histórico de Análises
  const handleDeleteAnalysis = (id: string) => {
    deleteRideAnalysis(id);
    setAnalyses(getRideAnalyses());
  };

  // Salvar Configurações do Semáforo
  const handleSaveTrafficSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = saveUserSettings({ trafficLightSettings: trafficSettings });
    onSettingsUpdated(updated);
    setFeedbackMsg({
      type: 'success',
      text: 'Parâmetros do semáforo atualizados e salvos com sucesso!',
    });
    setTimeout(() => setFeedbackMsg(null), 3000);
    setActiveSubTab('evaluate');
  };

  // Helper para cor do semáforo
  const getTrafficVisual = (status: TrafficLightResult) => {
    switch (status) {
      case 'green':
        return {
          bg: 'bg-emerald-950/40 border-emerald-500/80 text-emerald-400',
          badgeBg: 'bg-emerald-500 text-slate-950 font-bold',
          icon: CheckCircle2,
          colorText: 'text-emerald-400',
        };
      case 'yellow':
        return {
          bg: 'bg-amber-950/40 border-amber-500/80 text-amber-400',
          badgeBg: 'bg-amber-500 text-slate-950 font-bold',
          icon: AlertTriangle,
          colorText: 'text-amber-400',
        };
      case 'red':
        return {
          bg: 'bg-rose-950/40 border-rose-500/80 text-rose-400',
          badgeBg: 'bg-rose-500 text-white font-bold',
          icon: XCircle,
          colorText: 'text-rose-400',
        };
      default:
        return {
          bg: 'bg-slate-900/60 border-slate-700 text-slate-300',
          badgeBg: 'bg-slate-700 text-slate-200 font-medium',
          icon: HelpCircle,
          colorText: 'text-slate-400',
        };
    }
  };

  const visual = getTrafficVisual(evaluation.status);
  const StatusIcon = visual.icon;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Cabeçalho do Radar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Compass className="w-6 h-6 text-emerald-400" />
            Radar de Corridas — Simulador de Ofertas
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-0.5">
            Simule e analise a viabilidade de corridas da Uber e 99 antes de aceitar.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[11px] font-mono font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-lg">
            Simulador Manual Interno
          </span>
        </div>
      </div>

      {/* Esclarecimento de Limitações e Escopo Operacional */}
      <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl flex items-start gap-3 text-xs text-slate-300">
        <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-semibold text-white block">Simulador Interno com Entrada Manual</span>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Esta ferramenta calcula instantaneamente o ganho por km, rendimento por hora e margem líquida com base nos dados que você digita ou testa. 
            Ela funciona exclusivamente dentro desta tela, sem captura automática de tela, sem leitura de outros aplicativos e sem sobreposição flutuante em segundo plano.
          </p>
        </div>
      </div>

      {/* Navegação entre Sub-abas */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('evaluate')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition ${
            activeSubTab === 'evaluate'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Avaliar Oferta
        </button>
        <button
          onClick={() => setActiveSubTab('history')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
            activeSubTab === 'history'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Histórico de Análises ({analyses.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('settings')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
            activeSubTab === 'settings'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Configurar Meu Semáforo</span>
        </button>
      </div>

      {/* Feedback Alert */}
      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 border ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
              : feedbackMsg.type === 'error'
              ? 'bg-rose-950/40 border-rose-800 text-rose-300'
              : 'bg-blue-950/40 border-blue-800 text-blue-300'
          }`}
        >
          <Info className="w-4 h-4 shrink-0" />
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* SUB-ABA 1: AVALIAR OFERTA */}
      {activeSubTab === 'evaluate' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Coluna Esquerda: Formulário de Entrada (6 colunas) */}
          <div className="lg:col-span-6 bg-slate-900/60 border border-slate-800/90 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-sm font-semibold text-white">Dados da Oferta</span>
              {/* Presets de Teste Rápido */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-slate-400 mr-1 hidden sm:inline">Exemplos:</span>
                <button
                  type="button"
                  onClick={() => handleLoadDemo('good')}
                  className="text-[10px] px-2 py-1 bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 rounded hover:bg-emerald-900/50"
                  title="Carregar exemplo de corrida boa"
                >
                  Boa (R$ 34)
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadDemo('warning')}
                  className="text-[10px] px-2 py-1 bg-amber-950/60 border border-amber-800/80 text-amber-300 rounded hover:bg-amber-900/50"
                  title="Carregar exemplo com alerta"
                >
                  Atenção
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadDemo('bad')}
                  className="text-[10px] px-2 py-1 bg-rose-950/60 border border-rose-800/80 text-rose-300 rounded hover:bg-rose-900/50"
                  title="Carregar exemplo de corrida ruim"
                >
                  Ruim
                </button>
              </div>
            </div>

            {/* Aviso quando em modo demonstração */}
            {isDemoRide && (
              <div className="p-2.5 bg-blue-950/30 border border-blue-800/50 rounded-xl text-[11px] text-blue-300 flex items-center justify-between">
                <span>Modo de demonstração ativo com valores fictícios de teste.</span>
                <button onClick={handleClear} className="underline text-white font-medium">
                  Limpar
                </button>
              </div>
            )}

            {/* Aplicativo & Valor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Aplicativo</label>
                <select
                  value={app}
                  onChange={(e) => setApp(e.target.value as any)}
                  className="w-full h-11 px-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="uber">Uber</option>
                  <option value="99">99 App</option>
                  <option value="other">Outro / Particular</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-emerald-300 mb-1 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  Valor da corrida (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">
                    R$
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="25,50"
                    value={fareStr}
                    onChange={(e) => setFareStr(e.target.value)}
                    className="w-full h-11 pl-9 pr-3 bg-slate-950 border border-emerald-500/40 rounded-xl text-white font-mono text-base font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Distância e Tempo (Modo Rápido Direto) */}
            {!hasDetailedTrip ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Distância total (km) *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="8,5"
                      value={totalDistanceStr}
                      onChange={(e) => setTotalDistanceStr(e.target.value)}
                      className="w-full h-11 px-3 pr-8 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                      km
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Tempo total (min) *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="22"
                      value={totalDurationStr}
                      onChange={(e) => setTotalDurationStr(e.target.value)}
                      className="w-full h-11 px-3 pr-9 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                      min
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* Modo Detalhado: Separando Deslocamento até o passageiro da Viagem */
              <div className="space-y-3 p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-xs">
                <span className="font-semibold text-slate-300 block">
                  Deslocamento até Passageiro + Viagem:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Até o passageiro (km)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="1,5"
                      value={pickupDistanceStr}
                      onChange={(e) => setPickupDistanceStr(e.target.value)}
                      className="w-full h-9 px-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Tempo até passageiro</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="5 min"
                      value={pickupDurationStr}
                      onChange={(e) => setPickupDurationStr(e.target.value)}
                      className="w-full h-9 px-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Percurso da viagem (km)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="7,0"
                      value={tripDistanceStr}
                      onChange={(e) => setTripDistanceStr(e.target.value)}
                      className="w-full h-9 px-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Duração da viagem</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="18 min"
                      value={tripDurationStr}
                      onChange={(e) => setTripDurationStr(e.target.value)}
                      className="w-full h-9 px-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Alternar modo detalhado */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <button
                type="button"
                onClick={() => setHasDetailedTrip(!hasDetailedTrip)}
                className="text-emerald-400 hover:underline flex items-center gap-1 text-[11px]"
              >
                {hasDetailedTrip
                  ? '← Usar total direto (1 campo)'
                  : '+ Separar distância até passageiro e viagem'}
              </button>
            </div>

            {/* Nota do passageiro e Pedágios adicionais */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-400" />
                  Nota do passageiro
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Ex: 4,88"
                  value={passengerRatingStr}
                  onChange={(e) => setPassengerRatingStr(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Pedágio / Custo extra (R$)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={extraCostsStr}
                  onChange={(e) => setExtraCostsStr(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-slate-500"
                />
              </div>
            </div>

            {/* Botões do formulário */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleSaveAnalysis}
                disabled={evaluation.status === 'insufficient_data'}
                className="flex-1 h-11 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10"
              >
                <Save className="w-4 h-4 stroke-[2.2]" />
                <span>Salvar Avaliação</span>
              </button>

              <button
                type="button"
                onClick={handleClear}
                className="h-11 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition flex items-center gap-1"
                title="Limpar campos"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Limpar</span>
              </button>
            </div>
          </div>

          {/* Coluna Direita: Card de Decisão do Semáforo (6 colunas) */}
          <div className="lg:col-span-6 space-y-4">
            {/* Card Principal de Decisão com Semáforo */}
            <div className={`p-5 rounded-2xl border transition-all space-y-4 shadow-lg ${visual.bg}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-current ${visual.colorText}`}>
                    <StatusIcon className="w-7 h-7 stroke-[2.2]" />
                  </div>
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                      Resultado do Semáforo
                    </span>
                    <h2 className={`text-xl font-black tracking-tight ${visual.colorText}`}>
                      {evaluation.statusLabel}
                    </h2>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-xs uppercase tracking-wider font-extrabold ${visual.badgeBg}`}>
                  {evaluation.status === 'green'
                    ? 'ACEITAR'
                    : evaluation.status === 'yellow'
                    ? 'ATENÇÃO'
                    : evaluation.status === 'red'
                    ? 'RECUSAR'
                    : 'AGUARDANDO'}
                </span>
              </div>

              {/* Explicação transparente da decisão */}
              <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl text-xs text-slate-200 leading-relaxed">
                {evaluation.statusSummary}
              </div>

              {/* Indicadores Chave de Leitura Rápida */}
              {evaluation.status !== 'insufficient_data' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">Lucro Líquido Real</span>
                    <span
                      className={`text-base font-extrabold font-mono tabular-nums mt-0.5 block ${
                        evaluation.estimatedNetProfit < 0 ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {formatCurrency(evaluation.estimatedNetProfit)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Margem: {formatPercent(evaluation.netMarginPercent)}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">Lucro por Hora</span>
                    <span
                      className={`text-base font-extrabold font-mono tabular-nums mt-0.5 block ${
                        (evaluation.estimatedNetProfitPerHour || 0) < trafficSettings.minNetProfitPerHour
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {formatPerHour(evaluation.estimatedNetProfitPerHour)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Bruto: {formatPerHour(evaluation.grossRevenuePerHour)}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-slate-400 block">Lucro por Km</span>
                    <span
                      className={`text-base font-extrabold font-mono tabular-nums mt-0.5 block ${
                        (evaluation.estimatedNetProfitPerKm || 0) < trafficSettings.minNetProfitPerKm
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {formatPerKm(evaluation.estimatedNetProfitPerKm)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Bruto: {formatPerKm(evaluation.grossRevenuePerKm)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Checklist Detalhado dos Critérios Auditados */}
            {evaluation.criteria.length > 0 && (
              <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-4 space-y-3">
                <span className="text-xs font-semibold text-slate-300 block">
                  Auditoria Transparente de Critérios:
                </span>

                <div className="space-y-2">
                  {evaluation.criteria.map((c) => (
                    <div
                      key={c.id}
                      className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-white">{c.name}</span>
                          {c.isEssential && (
                            <span className="text-[9px] px-1 py-0.2 bg-slate-800 text-slate-400 rounded">
                              Essencial
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 leading-tight">{c.explanation}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`font-mono font-bold block ${
                            c.status === 'pass'
                              ? 'text-emerald-400'
                              : c.status === 'warning'
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {c.actualValue}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">{c.targetValue}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nota de Responsabilidade do Motorista */}
            <div className="p-3.5 bg-slate-900/40 border border-slate-800/80 rounded-2xl text-[11px] text-slate-400 leading-relaxed flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p>
                <strong>Decisão Final do Motorista:</strong> O Radar de Corridas é uma ferramenta de
                apoio estatístico. A decisão de aceitar ou recusar pertence exclusivamente a você. Trânsito
                pesado, paradas não remuneradas ou tempo de espera podem alterar os valores reais.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUB-ABA 2: HISTÓRICO DE ANÁLISES */}
      {activeSubTab === 'history' && (
        <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-white">Análises Realizadas no Radar</h3>
              <p className="text-xs text-slate-400">
                Histórico exclusivo para estudo e calibração de estratégias.
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400">{analyses.length} avaliadas</span>
          </div>

          {analyses.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-400 space-y-2">
              <Compass className="w-8 h-8 text-slate-500 mx-auto" />
              <p>Você ainda não arquivou nenhuma análise de corrida.</p>
              <button
                onClick={() => setActiveSubTab('evaluate')}
                className="text-emerald-400 font-semibold hover:underline"
              >
                Fazer primeira avaliação &rarr;
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {analyses.map((item) => {
                const vis = getTrafficVisual(item.result.status);
                const Icon = vis.icon;

                return (
                  <div
                    key={item.id}
                    className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg border ${vis.bg}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white uppercase">{item.input.app}</span>
                          <span className="font-mono text-emerald-400 font-bold">
                            {formatCurrency(item.input.estimatedFare)}
                          </span>
                          <span className="text-slate-400">
                            · {item.result.effectiveDistanceKm} km · {item.result.effectiveDurationMinutes} min
                          </span>
                          {item.isDemo && (
                            <span className="text-[9px] bg-slate-800 text-slate-400 px-1 rounded">
                              Demo
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{item.result.statusSummary}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                      <div className="text-left sm:text-right font-mono">
                        <span className="text-slate-400 block text-[10px]">Lucro/Hora</span>
                        <span className="font-bold text-white">
                          {formatPerHour(item.result.estimatedNetProfitPerHour)}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteAnalysis(item.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                        title="Remover análise"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-ABA 3: CONFIGURAR MEU SEMÁFORO */}
      {activeSubTab === 'settings' && (
        <form
          onSubmit={handleSaveTrafficSettings}
          className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 space-y-5"
        >
          <div className="pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-emerald-400" />
              Parâmetros Personalizados do Semáforo
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Defina suas metas mínimas para que uma corrida seja sinalizada como Verde, Amarela ou Vermelha.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Ganho Bruto Mínimo por KM (R$)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={String(trafficSettings.minGrossPerKm).replace('.', ',')}
                onChange={(e) =>
                  setTrafficSettings({
                    ...trafficSettings,
                    minGrossPerKm: parseBrazilianInput(e.target.value),
                  })
                }
                className="w-full h-11 px-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-400">Recomendado: R$ 2,00 a R$ 2,50/km</span>
            </div>

            <div>
              <label className="block text-emerald-300 font-medium mb-1">
                Lucro Líquido Mínimo por KM (R$)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={String(trafficSettings.minNetProfitPerKm).replace('.', ',')}
                onChange={(e) =>
                  setTrafficSettings({
                    ...trafficSettings,
                    minNetProfitPerKm: parseBrazilianInput(e.target.value),
                  })
                }
                className="w-full h-11 px-3 bg-slate-950 border border-emerald-500/40 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-400">Lucro limpo no bolso por km rodado</span>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Ganho Bruto Mínimo por Hora (R$)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={String(trafficSettings.minGrossPerHour).replace('.', ',')}
                onChange={(e) =>
                  setTrafficSettings({
                    ...trafficSettings,
                    minGrossPerHour: parseBrazilianInput(e.target.value),
                  })
                }
                className="w-full h-11 px-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-emerald-300 font-medium mb-1">
                Lucro Líquido Mínimo por Hora (R$)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={String(trafficSettings.minNetProfitPerHour).replace('.', ',')}
                onChange={(e) =>
                  setTrafficSettings({
                    ...trafficSettings,
                    minNetProfitPerHour: parseBrazilianInput(e.target.value),
                  })
                }
                className="w-full h-11 px-3 bg-slate-950 border border-emerald-500/40 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Distância Máxima até o Passageiro (km)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={String(trafficSettings.maxPickupDistanceKm).replace('.', ',')}
                onChange={(e) =>
                  setTrafficSettings({
                    ...trafficSettings,
                    maxPickupDistanceKm: parseBrazilianInput(e.target.value),
                  })
                }
                className="w-full h-11 px-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-400">Para evitar tempo morto não pago</span>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Nota Mínima do Passageiro (estrelas)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={String(trafficSettings.minPassengerRating).replace('.', ',')}
                onChange={(e) =>
                  setTrafficSettings({
                    ...trafficSettings,
                    minPassengerRating: parseBrazilianInput(e.target.value),
                  })
                }
                className="w-full h-11 px-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Custo por KM Usado na Avaliação (R$)
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder={realCostPerKm ? `${formatCurrency(realCostPerKm)} (Calculado do seu histórico)` : 'R$ 1,00/km (Padrão)'}
                value={trafficSettings.costPerKmOverride ? String(trafficSettings.costPerKmOverride).replace('.', ',') : ''}
                onChange={(e) =>
                  setTrafficSettings({
                    ...trafficSettings,
                    costPerKmOverride: e.target.value ? parseBrazilianInput(e.target.value) : undefined,
                  })
                }
                className="w-full h-11 px-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-400">
                Se deixar em branco, o radar usará seu custo real calculado no histórico ({formatPerKm(realCostPerKm) || 'R$ 1,00/km'}).
              </span>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Perfil de Rigidez</label>
              <select
                value={trafficSettings.mode}
                onChange={(e) =>
                  setTrafficSettings({
                    ...trafficSettings,
                    mode: e.target.value as any,
                  })
                }
                className="w-full h-11 px-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="balanced">Equilibrado (Recomendado)</option>
                <option value="conservative">Conservador (Mais rigoroso nas margens)</option>
                <option value="flexible">Flexível (Tolera 10% de variação em dias lentos)</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setActiveSubTab('evaluate')}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-emerald-500/10 transition"
            >
              Salvar Parâmetros
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

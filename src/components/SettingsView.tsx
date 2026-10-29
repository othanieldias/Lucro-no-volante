import React, { useState } from 'react';
import {
  Settings,
  User,
  Car,
  ShieldCheck,
  Download,
  Upload,
  Trash2,
  Lock,
  QrCode,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Info,
  DollarSign,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { PlatformType, UserSettings, VehicleType } from '../types';
import { formatCurrency, parseBrazilianInput } from '../utils/finance';
import {
  clearAllData,
  exportAllDataJSON,
  importDataJSON,
  saveUserSettings,
  seedRealisticSampleData,
} from '../services/storage';

interface SettingsViewProps {
  settings: UserSettings;
  onSettingsUpdated: (updated: UserSettings) => void;
  onNavigateToTests: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSettingsUpdated,
  onNavigateToTests,
}) => {
  const [driverName, setDriverName] = useState<string>(settings.driverName || 'Motorista Parceiro');
  const [platform, setPlatform] = useState<PlatformType>(settings.platform || 'both');
  const [vehicleType, setVehicleType] = useState<VehicleType>(settings.vehicleType || 'alugado');
  const [defaultRental, setDefaultRental] = useState<string>(
    String(settings.defaultRentalDaily || 70).replace('.', ',')
  );

  const [notification, setNotification] = useState<string | null>(null);
  const [errorNotification, setErrorNotification] = useState<string | null>(null);

  // Modais de Política e Termos
  const [showPrivacyModal, setShowPrivacyModal] = useState<boolean>(false);
  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);
  const [showCommercialModal, setShowCommercialModal] = useState<boolean>(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState<boolean>(false);

  // Salvar preferências
  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = saveUserSettings({
      driverName: driverName.trim() || 'Motorista Parceiro',
      platform,
      vehicleType,
      defaultRentalDaily: Math.max(0, parseBrazilianInput(defaultRental)),
    });

    onSettingsUpdated(updated);
    setNotification('Preferências operacionais salvas com sucesso!');
    setTimeout(() => setNotification(null), 3000);
  };

  // Exportar Backup JSON
  const handleExportBackup = () => {
    const jsonStr = exportAllDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lucro_no_volante_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setNotification('Backup JSON baixado com sucesso!');
    setTimeout(() => setNotification(null), 3000);
  };

  // Importar Backup JSON
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importDataJSON(content);
      if (res.success) {
        setNotification(`Sucesso! ${res.count} registros importados.`);
      } else {
        setErrorNotification(res.error || 'Erro ao importar backup.');
      }
      setTimeout(() => {
        setNotification(null);
        setErrorNotification(null);
      }, 4000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Limpeza de Banco
  const handleClearAll = () => {
    clearAllData();
    setShowClearConfirmModal(false);
    setNotification('Todos os dados locais foram apagados.');
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Título */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-emerald-400" />
            Configurações e Conta
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-0.5">
            Personalize preferências do veículo, realize backups e consulte a arquitetura do app.
          </p>
        </div>

        <button
          onClick={onNavigateToTests}
          className="text-xs px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 font-semibold hover:bg-emerald-900/50 transition flex items-center gap-1.5"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Auditar Cálculos</span>
        </button>
      </div>

      {notification && (
        <div className="p-3.5 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {errorNotification && (
        <div className="p-3.5 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          <span>{errorNotification}</span>
        </div>
      )}

      {/* Formulário de Preferências */}
      <form
        onSubmit={handleSavePreferences}
        className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 space-y-4 shadow-sm"
      >
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
          <Car className="w-4 h-4 text-emerald-400" />
          Preferências do Motorista e Veículo
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Nome de Exibição</label>
            <input
              type="text"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              className="w-full h-11 px-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Plataforma Principal</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as PlatformType)}
              className="w-full h-11 px-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="both">Uber & 99 (Ambas)</option>
              <option value="uber">Uber</option>
              <option value="99">99 App</option>
              <option value="other">Outra / Particular</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Regime do Veículo</label>
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value as VehicleType)}
              className="w-full h-11 px-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="alugado">Alugado (Locadora: Localiza, Movida, Kovi, etc.)</option>
              <option value="proprio">Veículo Próprio Quitado</option>
              <option value="financiado">Financiado (Parcela diária proporcional)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Valor padrão de aluguel/diária (R$)
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="70,00"
              value={defaultRental}
              onChange={(e) => setDefaultRental(e.target.value)}
              className="w-full h-11 px-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Usado para preenchimento rápido com 1 clique na Calculadora Diária.
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-md shadow-emerald-500/10"
          >
            Salvar Preferências
          </button>
        </div>
      </form>

      {/* Modelo Comercial Futuro & Informações da Conta */}
      <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            Conta e Modelo Comercial (Fase 1 / Piloto)
          </h3>
          <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold">
            Modo Gratuito Ativo
          </span>
        </div>

        <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2 text-xs text-slate-300">
          <div className="flex justify-between">
            <span className="text-slate-400">Situação da Conta:</span>
            <span className="font-semibold text-white">Piloto Local Livre (Sem bloqueios)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Armazenamento:</span>
            <span className="text-slate-200">Local durável neste navegador</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Versão:</span>
            <span className="font-mono text-slate-200">v1.0.0 (Produção Local)</span>
          </div>
        </div>

        <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-2 text-xs text-slate-400">
          <p className="leading-relaxed">
            <strong className="text-slate-200">Planejamento Comercial Futuro (Fases 2 e 3):</strong>{' '}
            O projeto comercial prevê um período de teste de <strong>15 dias grátis</strong>, seguido
            por assinatura de <strong>R$ 9,90 por mês</strong> via Pix com controle de pagamento em
            servidor seguro.
          </p>
          <button
            type="button"
            onClick={() => setShowCommercialModal(true)}
            className="text-emerald-400 hover:underline font-semibold block pt-1"
          >
            Ver detalhes da arquitetura comercial e regras de faturamento &rarr;
          </button>
        </div>
      </div>

      {/* Gerenciamento de Dados e Backups */}
      <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 space-y-4 shadow-sm">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
          <Download className="w-4 h-4 text-emerald-400" />
          Backup, Exportação e Restauração de Dados
        </h3>

        <p className="text-xs text-slate-400">
          Seus registros estão salvos com segurança neste navegador. Você pode exportar um backup
          em arquivo JSON a qualquer momento para guardar no Google Drive ou transferir para outro celular.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleExportBackup}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 transition"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Baixar Backup Completo (JSON)</span>
          </button>

          <label className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 transition cursor-pointer">
            <Upload className="w-4 h-4 text-blue-400" />
            <span>Restaurar de Arquivo JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={() => {
              seedRealisticSampleData();
              setNotification('Dados de demonstração (7 dias) recarregados!');
              setTimeout(() => setNotification(null), 3000);
            }}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded-xl text-xs font-medium border border-slate-800 transition"
          >
            Carregar 7 Dias de Teste
          </button>

          <button
            type="button"
            onClick={() => setShowClearConfirmModal(true)}
            className="px-4 py-2 bg-rose-950/40 hover:bg-rose-900/40 text-rose-400 rounded-xl text-xs font-medium border border-rose-900/50 transition ml-auto flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>Apagar Todos os Dados</span>
          </button>
        </div>
      </div>

      {/* Links Jurídicos e Privacidade */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-800">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowPrivacyModal(true)}
            className="hover:text-slate-300 transition"
          >
            Política de Privacidade
          </button>
          <span>·</span>
          <button
            onClick={() => setShowTermsModal(true)}
            className="hover:text-slate-300 transition"
          >
            Termos de Uso
          </button>
        </div>
        <span>Lucro no Volante © 2026</span>
      </div>

      {/* Modal: Arquitetura Comercial */}
      {showCommercialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              Arquitetura do Modelo Comercial
            </h3>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                O modelo comercial foi desenhado para ser acessível, transparente e de alta conversão
                entre motoristas parceiros:
              </p>

              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="font-semibold text-white">Especificações da Regra de Negócio:</div>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  <li><strong>Teste Grátis:</strong> 15 dias corridos de acesso integral a todas as funções.</li>
                  <li><strong>Mensalidade:</strong> R$ 9,90 por mês (valor equivalente a menos de meia corrida).</li>
                  <li><strong>Forma de Pagamento:</strong> Inicialmente via Pix.</li>
                  <li>
                    <strong>Confirmação Segura:</strong> Na versão comercializada, a validação do Pix
                    será processada pelo backend através de conciliação bancária ou confirmação administrativa
                    protegida, impedindo adulteração de status via console do navegador.
                  </li>
                  <li>
                    <strong>Preservação de Dados:</strong> Quando a assinatura expira, os dados gravados
                    pelo motorista <strong>nunca são excluídos</strong>. O acesso às novas edições fica
                    restrito até a renovação.
                  </li>
                </ul>
              </div>

              <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-xl text-amber-300 text-[11px]">
                <strong>Aviso de Transparência:</strong> Este aplicativo opera no momento na Fase 1
                (piloto local). Nenhuma cobrança é simulada ou cobrada indevidamente sem a integração
                real de gateway Pix e autenticação de usuários.
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowCommercialModal(false)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Política de Privacidade */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Política de Privacidade
            </h3>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                No <strong>Lucro no Volante</strong>, a sua privacidade e os seus dados financeiros são tratados
                com rigor absoluto.
              </p>
              <h4 className="font-semibold text-white">1. Onde seus dados são salvos</h4>
              <p>
                Todos os faturamentos, despesas com combustível, aluguel de veículos e quilometragens inseridos
                ficam armazenados diretamente na memória local (localStorage) do seu navegador ou celular.
              </p>
              <h4 className="font-semibold text-white">2. Não compartilhamento</h4>
              <p>
                Nenhuma informação financeira individual de corridas é vendida, repassada ou compartilhada
                com empresas de aplicativo (Uber, 99) ou terceiros.
              </p>
              <h4 className="font-semibold text-white">3. Controle do usuário</h4>
              <p>
                Você tem o direito de exportar um backup em JSON ou apagar completamente todos os registros a qualquer momento.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Termos de Uso */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              Termos de Uso
            </h3>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <h4 className="font-semibold text-white">1. Finalidade da Ferramenta</h4>
              <p>
                O <strong>Lucro no Volante</strong> é uma ferramenta de apoio gerencial e financeiro para motoristas
                autônomos de transporte por aplicativo. Os resultados calculados dependem da fidelidade dos dados informados pelo motorista.
              </p>
              <h4 className="font-semibold text-white">2. Responsabilidade sobre os Custos</h4>
              <p>
                O aplicativo calcula custos operacionais estimados (combustível, aluguel e despesas adicionais).
                Recomenda-se que o motorista faça revisões periódicas em seu veículo e considere depreciação futura.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmação de Limpeza de Banco */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Apagar Todos os Dados?</h3>
              <p className="text-xs text-slate-400">
                Esta ação apagará <strong>todos os registros salvos, histórico e configurações</strong> deste navegador.
                Recomendamos baixar um backup antes de prosseguir.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirmModal(false)}
                className="h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="h-11 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-lg shadow-rose-600/20"
              >
                Sim, Limpar Tudo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

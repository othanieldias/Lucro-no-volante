import React from 'react';
import {
  Smartphone,
  ShieldAlert,
  CheckCircle2,
  Lock,
  X,
  FileCode,
  Layers,
  AlertTriangle,
  ExternalLink,
  Cpu,
  Eye,
} from 'lucide-react';

interface AndroidArchitectureModalProps {
  onClose: () => void;
}

export const AndroidArchitectureModal: React.FC<AndroidArchitectureModalProps> = ({
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto text-xs text-slate-300">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Análise Técnica: Radar Flutuante em Segundo Plano no Android
            </h2>
          </div>
          <p className="text-slate-400">
            Relatório de viabilidade técnica, permissões do Android, políticas de loja e integração oficial com Uber e 99.
          </p>
        </div>

        {/* 1. Diagnóstico do Ambiente Atual */}
        <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-400" />
            1. Diagnóstico do Ambiente de Execução
          </h3>
          <p className="leading-relaxed">
            O ambiente atual é um container de desenvolvimento web (Node.js + Vite + React 19).
            Ele <strong>não possui o Android SDK, Java/Kotlin runtime ou Gradle</strong> instalados para
            gerar binários nativos compilados (arquivos <code className="text-emerald-300 font-mono">.apk</code> ou{' '}
            <code className="text-emerald-300 font-mono">.aab</code>).
          </p>
          <div className="p-2.5 bg-amber-950/30 border border-amber-800/40 rounded-lg text-[11px] text-amber-300">
            <strong>Diretriz de Integridade:</strong> Conforme solicitado, não simulamos permissões nativas
            nem alegamos que o aplicativo web tem capacidade nativa de sobreposição de tela sem a compilação do APK correspondente.
          </div>
        </div>

        {/* 2. Arquitetura Híbrida Recomendada */}
        <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            2. Arquitetura Híbrida Recomendada para Produção
          </h3>
          <p className="leading-relaxed">
            Para habilitar o Radar sobreposto aos apps sem perder o código atual, a arquitetura ideal é:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-slate-400 pl-1">
            <li>
              <strong className="text-slate-200">Painel Financeiro & Calculadora:</strong> Mantidos no
              aplicativo Web/PWA atual (React + TypeScript).
            </li>
            <li>
              <strong className="text-slate-200">App Wrapper Nativo (Capacitor / Android Studio):</strong>{' '}
              Projeto Android nativo em Kotlin contendo um <em>Foreground Service</em>.
            </li>
            <li>
              <strong className="text-slate-200">Janela Flutuante (WindowOverlay):</strong> Componente
              nativo via <code className="text-emerald-300 font-mono">WindowManager.addView()</code> com
              layout customizado que lê as configurações salvas pelo motorista.
            </li>
          </ul>
        </div>

        {/* 3. Permissões Necessárias e Políticas do Android */}
        <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            3. Permissões do Android e Restrições do Google Play
          </h3>
          <div className="space-y-1.5 text-slate-400">
            <div className="p-2 bg-slate-900 rounded border border-slate-800">
              <strong className="text-white font-mono">SYSTEM_ALERT_WINDOW (Aparecer sobre outros apps):</strong>
              <p className="text-[11px] mt-0.5">
                Exige autorização manual e explícita do usuário nas configurações do Android. Permitido pelo Google Play.
              </p>
            </div>
            <div className="p-2 bg-slate-900 rounded border border-slate-800">
              <strong className="text-white font-mono">FOREGROUND_SERVICE (Serviço em Primeiro Plano):</strong>
              <p className="text-[11px] mt-0.5">
                Obrigatório para manter o radar ativo enquanto o motorista roda com Uber ou 99. Requer notificação persistente na barra de status.
              </p>
            </div>
            <div className="p-2 bg-slate-900 rounded border border-slate-800">
              <strong className="text-rose-400 font-mono">BIND_ACCESSIBILITY_SERVICE (Leitura de Tela):</strong>
              <p className="text-[11px] mt-0.5">
                <span className="text-rose-300 font-semibold">Alto Risco de Banimento no Google Play:</span> O Google Play restringe rigorosamente a API de Acessibilidade a recursos para pessoas com deficiência. Apps que usam acessibilidade para raspar telas de Uber/99 frequentemente são banidos ou têm as contas de motorista suspensas pelas plataformas.
              </p>
            </div>
          </div>
        </div>

        {/* 4. Situação Oficial das APIs da Uber e da 99 */}
        <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-purple-400" />
            4. Realidade das APIs da Uber e da 99
          </h3>
          <p className="leading-relaxed">
            <strong>Nem a Uber nem a 99 disponibilizam APIs públicas para leitura de ofertas em tempo real</strong>{' '}
            para motoristas. As APIs corporativas da Uber (Uber for Business / Rides API) são restritas
            a solicitações corporativas de passageiros, nunca para expor ofertas internas de despacho.
          </p>
          <p className="leading-relaxed text-slate-400">
            Portanto, o caminho <strong className="text-emerald-400">100% legal, seguro e auditável</strong> é
            a entrada rápida pelo motorista (3 toques com teclado numérico ou botões rápidos) ou compartilhamento de rota,
            garantindo que sua conta de motorista nunca seja banida por violação de termos de uso.
          </p>
        </div>

        {/* 5. Arquivos e Passos para Compilação Externa */}
        <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileCode className="w-4 h-4 text-cyan-400" />
            5. Como Gerar o App Android no seu Computador
          </h3>
          <p className="leading-relaxed">
            Caso deseje empacotar este projeto como APK Android com janela flutuante no seu computador local:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1 font-mono text-[11px]">
            <li>Instalar Android Studio e SDK Android 34+.</li>
            <li>Adicionar o Capacitor: <code className="text-emerald-300">npm i @capacitor/core @capacitor/android</code>.</li>
            <li>Executar: <code className="text-emerald-300">npx cap init</code> e <code className="text-emerald-300">npx cap add android</code>.</li>
            <li>Implementar o plugin de Overlay em Kotlin (<code className="text-slate-300">FloatingBubbleService.kt</code>).</li>
            <li>Compilar o APK assinado para instalação direta no celular.</li>
          </ol>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition"
          >
            Fechar Relatório Técnico
          </button>
        </div>
      </div>
    </div>
  );
};

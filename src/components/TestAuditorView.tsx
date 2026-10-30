import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Terminal,
  Calculator,
  Database,
  Calendar,
  Lock,
  Fuel,
  Sparkles,
} from 'lucide-react';
import { runAllMandatoryTests, TestResultItem } from '../utils/testCases';

export const TestAuditorView: React.FC = () => {
  const [testSuiteReport, setTestSuiteReport] = useState(() => runAllMandatoryTests());
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'calculo' | 'combustivel' | 'persistencia' | 'seguranca' | 'ia'>('all');

  const handleRerun = () => {
    setIsRunning(true);
    setTimeout(() => {
      const report = runAllMandatoryTests();
      setTestSuiteReport(report);
      setIsRunning(false);
    }, 400);
  };

  const filteredResults = testSuiteReport.results.filter((item) => {
    if (selectedFilter === 'all') return true;
    return item.category === selectedFilter;
  });

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'calculo':
        return <Calculator className="w-3.5 h-3.5 text-blue-400" />;
      case 'combustivel':
        return <Fuel className="w-3.5 h-3.5 text-amber-400" />;
      case 'persistencia':
        return <Database className="w-3.5 h-3.5 text-emerald-400" />;
      case 'seguranca':
        return <Lock className="w-3.5 h-3.5 text-purple-400" />;
      case 'ia':
        return <Sparkles className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Terminal className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Título & Botão de Execução */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            Central de Auditoria e Testes Obrigatórios
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-0.5">
            Verificação formal das 20 suítes da especificação Lucro no Volante 3.0 (Memória Persistente & Combustível).
          </p>
        </div>

        <button
          onClick={handleRerun}
          disabled={isRunning}
          className="text-xs px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
          <span>{isRunning ? 'Executando Asserções...' : 'Reexecutar Testes'}</span>
        </button>
      </div>

      {/* Placar de Resultados */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
          <span className="text-xs text-slate-400 block">Status Geral dos Testes</span>
          <div className="flex items-center gap-2 mt-1">
            {testSuiteReport.allPassed ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span
              className={`text-lg font-bold ${
                testSuiteReport.allPassed ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {testSuiteReport.allPassed ? '100% Aprovado' : 'Pendências Encontradas'}
            </span>
          </div>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
          <span className="text-xs text-slate-400 block">Testes Concluídos</span>
          <div className="text-2xl font-extrabold font-mono text-white mt-0.5">
            {testSuiteReport.passedCount} / {testSuiteReport.totalCount}
          </div>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
          <span className="text-xs text-slate-400 block">Última Execução Real</span>
          <div className="text-base font-semibold font-mono text-slate-300 mt-1">
            {testSuiteReport.timestamp} (ao vivo no cliente)
          </div>
        </div>
      </div>

      {/* Filtros de Categoria */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
        <button
          onClick={() => setSelectedFilter('all')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
            selectedFilter === 'all'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Todos os Testes ({testSuiteReport.totalCount})
        </button>
        <button
          onClick={() => setSelectedFilter('calculo')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
            selectedFilter === 'calculo'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Cálculos Financeiros
        </button>
        <button
          onClick={() => setSelectedFilter('combustivel')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
            selectedFilter === 'combustivel'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Combustível & Consumo
        </button>
        <button
          onClick={() => setSelectedFilter('persistencia')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
            selectedFilter === 'persistencia'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Persistência & Backup
        </button>
        <button
          onClick={() => setSelectedFilter('seguranca')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
            selectedFilter === 'seguranca'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Segurança & Chaves
        </button>
        <button
          onClick={() => setSelectedFilter('ia')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
            selectedFilter === 'ia'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Assistente IA
        </button>
      </div>

      {/* Lista de Testes com Detalhamento */}
      <div className="space-y-3">
        {filteredResults.map((item) => (
          <div
            key={item.id}
            className={`p-4 rounded-2xl border transition-all ${
              item.passed
                ? 'bg-slate-900/60 border-slate-800/90'
                : 'bg-rose-950/20 border-rose-800/50'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    item.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  {item.passed ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-500">
                      #{String(item.id).padStart(2, '0')}
                    </span>
                    <h3 className="text-sm font-bold text-white">{item.title}</h3>
                  </div>

                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{item.details}</p>

                  {item.diagnostic && (
                    <div className="mt-2.5 p-2 bg-slate-950/90 rounded-lg border border-slate-800/80 font-mono text-[11px] text-emerald-300/90 overflow-x-auto">
                      <pre>{JSON.stringify(item.diagnostic, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-400 shrink-0">
                {getCategoryIcon(item.category)}
                <span className="capitalize">{item.category}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

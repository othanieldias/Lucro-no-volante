import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { MobileNavigation } from './components/MobileNavigation';
import { DashboardView } from './components/DashboardView';
import { FuelProfitabilityView } from './components/FuelProfitabilityView';
import { AssistantView } from './components/AssistantView';
import { CalculatorView } from './components/CalculatorView';
import { HistoryView } from './components/HistoryView';
import { GoalsView } from './components/GoalsView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { TestAuditorView } from './components/TestAuditorView';
import { DailyRecord, UserSettings } from './types';
import {
  getDailyRecords,
  getUserSettings,
  seedRealisticSampleData,
  subscribeToDataChanges,
} from './services/storage';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [records, setRecords] = useState<DailyRecord[]>(() => getDailyRecords());
  const [settings, setSettings] = useState<UserSettings>(() => getUserSettings());
  const [editingRecord, setEditingRecord] = useState<DailyRecord | null>(null);

  // Carrega dados e ouve alterações do storage em tempo real
  const refreshState = useCallback(() => {
    setRecords(getDailyRecords());
    setSettings(getUserSettings());
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToDataChanges(refreshState);
    return () => unsubscribe();
  }, [refreshState]);

  // Ações de navegação
  const handleNavigate = (tab: string) => {
    if (tab !== 'calculator' && editingRecord) {
      setEditingRecord(null);
    }
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewCalculation = () => {
    setEditingRecord(null);
    setCurrentTab('calculator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditRecord = (record: DailyRecord) => {
    setEditingRecord(record);
    setCurrentTab('calculator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRecordSaved = () => {
    setEditingRecord(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Top Bar Header (Desktop & Mobile) */}
      <Header
        currentTab={currentTab}
        onNavigate={handleNavigate}
        onNewCalculation={handleNewCalculation}
        recordCount={records.length}
      />

      {/* Conteúdo Principal com padding inferior para a barra mobile */}
      <main className="flex-1 px-4 md:px-8 py-6 max-w-7xl w-full mx-auto pb-24 md:pb-12">
        {currentTab === 'dashboard' && (
          <DashboardView
            records={records}
            settings={settings}
            onNavigateToCalculator={handleNewCalculation}
            onNavigateToFuel={() => handleNavigate('fuel')}
            onNavigateToAssistant={() => handleNavigate('assistant')}
            onSeedSampleData={seedRealisticSampleData}
          />
        )}

        {currentTab === 'fuel' && (
          <FuelProfitabilityView
            records={records}
            settings={settings}
            onSettingsUpdated={setSettings}
            onNavigateToCalculator={handleNewCalculation}
          />
        )}

        {currentTab === 'assistant' && (
          <AssistantView
            records={records}
            settings={settings}
            onNavigateToFuel={() => handleNavigate('fuel')}
            onNavigateToCalculator={handleNewCalculation}
          />
        )}

        {currentTab === 'calculator' && (
          <CalculatorView
            initialRecord={editingRecord}
            onRecordSaved={handleRecordSaved}
            onCancelEdit={() => setEditingRecord(null)}
          />
        )}

        {currentTab === 'history' && (
          <HistoryView
            records={records}
            onEditRecord={handleEditRecord}
            onNavigateToCalculator={handleNewCalculation}
          />
        )}

        {currentTab === 'goals' && (
          <GoalsView
            records={records}
            settings={settings}
            onSettingsUpdated={setSettings}
          />
        )}

        {currentTab === 'reports' && (
          <ReportsView records={records} settings={settings} />
        )}

        {currentTab === 'settings' && (
          <SettingsView
            settings={settings}
            onSettingsUpdated={setSettings}
            onNavigateToTests={() => setCurrentTab('tests')}
          />
        )}

        {currentTab === 'tests' && <TestAuditorView />}
      </main>

      {/* Navegação Inferior Fixa para Celulares (Touch ergonomics) */}
      <MobileNavigation
        currentTab={currentTab}
        onNavigate={handleNavigate}
        recordCount={records.length}
      />
    </div>
  );
}

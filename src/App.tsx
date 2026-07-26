/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Header, TabType } from './components/Header';
import { GuideTab } from './components/Tabs/GuideTab';
import { DatabaseTab } from './components/Tabs/DatabaseTab';
import { CalculatorsTab } from './components/Tabs/CalculatorsTab';
import { ForumQATab } from './components/Tabs/ForumQATab';
import { ChecklistTab } from './components/Tabs/ChecklistTab';
import { XmlExportTab } from './components/Tabs/XmlExportTab';
import { AutocadIntegrationTab } from './components/Tabs/AutocadIntegrationTab';
import { AiConsultantModal } from './components/AiConsultantModal';
import { BuildingHeaderBar } from './components/BuildingHeaderBar';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('GUIDE');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAiOpen, setIsAiOpen] = useState(false);

  const isAiEnabled = import.meta.env.VITE_ENABLE_AI_CONSULTANT === 'true';

  // If user searches from header, automatically focus or route to Database tab if on guide
  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    if (q.trim() && activeTab === 'GUIDE') {
      setActiveTab('DATABASE');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col antialiased">
      {/* Header Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={handleSearchChange}
        onOpenAi={() => setIsAiOpen(true)}
        showAiButton={isAiEnabled}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Persistent Building Project Status Header */}
        <BuildingHeaderBar activeTab={activeTab} setActiveTab={setActiveTab} />

        {activeTab === 'GUIDE' && <GuideTab />}
        {activeTab === 'DATABASE' && (
          <DatabaseTab searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        )}
        {activeTab === 'CALCULATORS' && <CalculatorsTab />}
        {activeTab === 'AUTOCAD' && (
          <AutocadIntegrationTab onNavigateToXml={() => setActiveTab('XML_EXPORT')} />
        )}
        {activeTab === 'FORUM' && (
          <ForumQATab searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        )}
        {activeTab === 'CHECKLIST' && <ChecklistTab />}
        {activeTab === 'XML_EXPORT' && <XmlExportTab />}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Οδηγός ΤΕΕ-ΚΕΝΑΚ & Τυπικές Τιμές ΠΕΑ • Βασισμένο στον ΚΕΝΑΚ (Ν. 4122/2013, ΦΕΚ 407/Β/2017) & ΤΟΤΕΕ 20701-1..5
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            Έκδοση 2025/2026 • Για Ενεργειακούς Επιθεωρητές
          </div>
        </div>
      </footer>

      {/* Gemini AI Consultant Modal */}
      {isAiEnabled && (
        <AiConsultantModal isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
      )}
    </div>
  );
}

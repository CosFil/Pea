import React from 'react';
import { 
  Building2, 
  BookOpen, 
  Database, 
  Calculator, 
  HelpCircle, 
  ClipboardCheck, 
  Sparkles,
  Search,
  FileCode,
  Compass
} from 'lucide-react';

export type TabType = 'GUIDE' | 'DATABASE' | 'CALCULATORS' | 'AUTOCAD' | 'FORUM' | 'CHECKLIST' | 'XML_EXPORT';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onOpenAi: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  onOpenAi
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900 text-slate-100 border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between py-3.5 gap-4">
          
          {/* Brand & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-600/30 border border-teal-500/40 flex items-center justify-center text-teal-400 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white">
                  Οδηγός ΤΕΕ-ΚΕΝΑΚ & Τυπικές Τιμές
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  ΠΕΑ 2025/2026
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Τεχνικά Δεδομένα Κτιρίου • ΚΕΝΑΚ • ΤΟΤΕΕ 20701-1..5 • Forum Consensus
              </p>
            </div>
          </div>

          {/* Actions & Search */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Quick Search */}
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Αναζήτηση τιμής, U, λέβητα, ΤΟΤΕΕ..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-800 text-slate-100 text-xs rounded-md border border-slate-700 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 placeholder-slate-400"
              />
            </div>

            {/* AI Assistant Button */}
            <button
              onClick={onOpenAi}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-medium rounded-md shadow-sm transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-200" />
              <span>AI Σύμβουλος ΚΕΝΑΚ</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex items-center gap-1 overflow-x-auto pt-1 pb-2 border-t border-slate-800/80 scrollbar-none">
          <button
            onClick={() => setActiveTab('GUIDE')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-md transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'GUIDE'
                ? 'bg-teal-600 text-white shadow'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Οδηγός Καρτελών ΤΕΕ-ΚΕΝΑΚ</span>
          </button>

          <button
            onClick={() => setActiveTab('DATABASE')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-md transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'DATABASE'
                ? 'bg-teal-600 text-white shadow'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Βάση Τυπικών Τιμών</span>
          </button>

          <button
            onClick={() => setActiveTab('CALCULATORS')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-md transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'CALCULATORS'
                ? 'bg-teal-600 text-white shadow'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Διαδραστικοί Υπολογιστές</span>
          </button>

          <button
            onClick={() => setActiveTab('AUTOCAD')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'AUTOCAD'
                ? 'bg-teal-600 text-white shadow ring-1 ring-teal-400/30'
                : 'text-teal-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Compass className="w-4 h-4 text-teal-400" />
            <span>Σύνδεση AutoCAD (DXF & LISP)</span>
          </button>

          <button
            onClick={() => setActiveTab('FORUM')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-md transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'FORUM'
                ? 'bg-teal-600 text-white shadow'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Συχνές Παγίδες & FAQ (Forum)</span>
          </button>

          <button
            onClick={() => setActiveTab('CHECKLIST')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-md transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'CHECKLIST'
                ? 'bg-teal-600 text-white shadow'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>Φύλλο Αυτοψίας & Φάκελος ΠΕΑ</span>
          </button>

          <button
            onClick={() => setActiveTab('XML_EXPORT')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'XML_EXPORT'
                ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow ring-1 ring-teal-400/30'
                : 'text-teal-300 bg-teal-950/40 border border-teal-800/60 hover:bg-teal-900/60 hover:text-white'
            }`}
          >
            <FileCode className="w-4 h-4 text-teal-300" />
            <span>Εξαγωγή XML (buildingcert.gr)</span>
          </button>
        </nav>
      </div>
    </header>
  );
};

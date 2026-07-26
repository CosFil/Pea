import React, { useState, useRef, useEffect } from 'react';
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
  Compass,
  ChevronDown,
  GraduationCap
} from 'lucide-react';

export type TabType = 'GUIDE' | 'DATABASE' | 'CALCULATORS' | 'AUTOCAD' | 'FORUM' | 'CHECKLIST' | 'XML_EXPORT';

const EDUCATIONAL_TABS: Array<{ id: TabType; label: string; description: string; icon: React.ElementType }> = [
  { id: 'GUIDE', label: 'Οδηγός Καρτελών ΤΕΕ-ΚΕΝΑΚ', description: 'Επεξήγηση κάθε καρτέλας του λογισμικού', icon: BookOpen },
  { id: 'DATABASE', label: 'Βάση Τυπικών Τιμών', description: 'U, g, η_g ανά περίοδο κατασκευής', icon: Database },
  { id: 'CALCULATORS', label: 'Διαδραστικοί Υπολογιστές', description: 'Υπολογισμός U τοιχοποιίας, κουφωμάτων κ.ά.', icon: Calculator },
  { id: 'AUTOCAD', label: 'Σύνδεση AutoCAD (DXF & LISP)', description: 'Εξαγωγή γεωμετρίας από σχέδιο', icon: Compass },
  { id: 'FORUM', label: 'Συχνές Παγίδες & FAQ', description: 'Απαντήσεις σε συνήθη ερωτήματα', icon: HelpCircle },
  { id: 'CHECKLIST', label: 'Φύλλο Αυτοψίας & Φάκελος ΠΕΑ', description: 'Λίστα ελέγχου πριν την αυτοψία', icon: ClipboardCheck },
];

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onOpenAi: () => void;
  showAiButton?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  onOpenAi,
  showAiButton
}) => {
  const isAiEnabled = showAiButton ?? (import.meta.env.VITE_ENABLE_AI_CONSULTANT === 'true');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isOnEducationalTab = EDUCATIONAL_TABS.some((t) => t.id === activeTab);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
                Δημιουργία & Εξαγωγή Αρχείου XML για buildingcert.gr
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

            {/* AI Assistant Button (Feature Flag Controlled) */}
            {isAiEnabled && (
              <button
                onClick={onOpenAi}
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-medium rounded-md shadow-sm transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-200" />
                <span>AI Σύμβουλος ΚΕΝΑΚ</span>
              </button>
            )}

          </div>
        </div>

        {/* Primary Navigation: XML Export (the core tool) + Educational Material (everything else) */}
        <nav className="flex items-center gap-2.5 pt-1 pb-2.5 border-t border-slate-800/80">
          {/* Primary action: Εξαγωγή XML */}
          <button
            onClick={() => setActiveTab('XML_EXPORT')}
            type="button"
            className={`inline-flex items-center gap-2.5 px-4 py-2.5 text-sm font-bold rounded-xl transition-all cursor-pointer shrink-0 ${
              activeTab === 'XML_EXPORT'
                ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg shadow-teal-900/40 ring-1 ring-teal-400/40'
                : 'bg-teal-950/60 text-teal-300 border border-teal-800/70 hover:bg-teal-900/70 hover:text-white'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Εξαγωγή XML</span>
            <span className="hidden sm:inline text-[10px] font-mono font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/20">
              buildingcert.gr
            </span>
          </button>

          <div className="w-px h-6 bg-slate-800 shrink-0" />

          {/* Secondary: Educational / support material, tucked into a dropdown */}
          <div className="relative shrink-0" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen((v) => !v)}
              type="button"
              className={`inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium rounded-xl transition-all cursor-pointer ${
                isOnEducationalTab
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Εκπαιδευτικό Υλικό</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isMenuOpen && (
              <div className="absolute left-0 top-full mt-2 w-80 max-w-[90vw] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-2 z-40">
                <p className="px-2.5 pt-1.5 pb-2 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  Βοηθητικό & εκπαιδευτικό υλικό
                </p>
                {EDUCATIONAL_TABS.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setIsMenuOpen(false);
                      }}
                      type="button"
                      className={`w-full flex items-start gap-3 px-2.5 py-2 rounded-lg text-left transition-all cursor-pointer ${
                        activeTab === tab.id
                          ? 'bg-teal-50 dark:bg-teal-950/50'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${activeTab === tab.id ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'}`} />
                      <span>
                        <span className={`block text-xs font-semibold ${activeTab === tab.id ? 'text-teal-700 dark:text-teal-300' : 'text-slate-700 dark:text-slate-200'}`}>
                          {tab.label}
                        </span>
                        <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {tab.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* If currently on an educational tab, show which one as breadcrumb-like context */}
          {isOnEducationalTab && (
            <span className="text-xs text-slate-500 truncate hidden md:inline">
              — {EDUCATIONAL_TABS.find((t) => t.id === activeTab)?.label}
            </span>
          )}
        </nav>
      </div>
    </header>
  );
};

import React, { useState, useMemo } from 'react';
import { FORUM_QA_DATABASE } from '../../data/forumQA';
import { ForumQAItem } from '../../types/kenak';
import { HelpCircle, Tag, Search, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

interface ForumQATabProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const ForumQATab: React.FC<ForumQATabProps> = ({ searchQuery, setSearchQuery }) => {
  const [expandedId, setExpandedId] = useState<string | null>('qa-1');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories = useMemo(() => {
    const cats = new Set<string>();
    FORUM_QA_DATABASE.forEach((item) => cats.add(item.category));
    return ['ALL', ...Array.from(cats)];
  }, []);

  const filteredQA = useMemo(() => {
    return FORUM_QA_DATABASE.filter((item) => {
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mQuestion = item.question.toLowerCase().includes(q);
        const mAnswer = item.answer.toLowerCase().includes(q);
        const mTab = item.kenakTab.toLowerCase().includes(q);
        const mTags = item.tags.some((t) => t.toLowerCase().includes(q));
        return mQuestion || mAnswer || mTab || mTags;
      }
      return true;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-teal-600" />
              Συχνές Παγίδες & FAQ (Michanikos.gr / ΥΠΕΝ / ΤΕΕ)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Απαντήσεις σε 15+ συχνές απορίες ενεργειακών επιθεωρητών για ειδικές περιπτώσεις (πιλοτή, ΜΘΧ, υπερδιαστασιολόγηση, τζάκια, ηλιακά κ.α.).
            </p>
          </div>

          <div className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {filteredQA.length} θέματα βρέθηκαν
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              type="button"
              className={`px-3 py-1 rounded-md font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-teal-600 text-white shadow-sm font-semibold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat === 'ALL' ? 'Όλα τα Θέματα' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {filteredQA.map((item) => {
          const isExpanded = expandedId === item.id;
          return (
            <div
              key={item.id}
              className={`bg-white dark:bg-slate-900 rounded-xl border transition-all shadow-sm overflow-hidden ${
                isExpanded
                  ? 'border-teal-500/80 ring-1 ring-teal-500/30'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                type="button"
                className="w-full text-left p-4 flex items-center justify-between gap-4 cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 shrink-0 mt-0.5">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {item.category}
                      </span>
                      <span className="text-[11px] font-mono text-teal-600 dark:text-teal-400">
                        {item.kenakTab}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                      {item.question}
                    </h3>
                  </div>
                </div>

                <div className="shrink-0 text-slate-400">
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3 text-xs bg-slate-50/50 dark:bg-slate-800/30">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 leading-relaxed font-sans">
                    <p className="whitespace-pre-line">{item.answer}</p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-1">
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Πηγή:</span> {item.source}
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Tag className="w-3 h-3 text-slate-400" />
                      {item.tags.map((t) => (
                        <span
                          key={t}
                          onClick={() => setSearchQuery(t)}
                          className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-teal-100 cursor-pointer"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredQA.length === 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-xl p-8 border border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500">
            Δεν βρέθηκαν ερωτήσεις που να ταιριάζουν με την αναζήτηση "{searchQuery}".
          </div>
        )}
      </div>
    </div>
  );
};

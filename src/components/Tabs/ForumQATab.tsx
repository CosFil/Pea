import React, { useState, useMemo } from 'react';
import { FORUM_QA_DATABASE, QUIZ_QUESTIONS_DATABASE } from '../../data/forumQA';
import { ForumQAItem, QuizQuestion } from '../../types/kenak';
import { HelpCircle, Tag, Search, ChevronDown, ChevronUp, AlertCircle, Award, CheckCircle2, XCircle, RotateCcw, Sparkles } from 'lucide-react';

interface ForumQATabProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const ForumQATab: React.FC<ForumQATabProps> = ({ searchQuery, setSearchQuery }) => {
  const [activeSubTab, setActiveSubTab] = useState<'FAQ' | 'QUIZ'>('FAQ');
  const [expandedId, setExpandedId] = useState<string | null>('qa-1');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Quiz state
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [showQuizResults, setShowQuizResults] = useState<boolean>(false);

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

  // Quiz score calculation
  const totalQuestions = QUIZ_QUESTIONS_DATABASE.length;
  const answeredCount = Object.keys(userAnswers).length;
  const correctCount = useMemo(() => {
    return QUIZ_QUESTIONS_DATABASE.reduce((acc, q) => {
      if (userAnswers[q.id] === q.correctOptionIndex) {
        return acc + 1;
      }
      return acc;
    }, 0);
  }, [userAnswers]);

  const handleSelectOption = (questionId: number, optionIdx: number) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx,
    }));
  };

  const handleResetQuiz = () => {
    setUserAnswers({});
    setShowQuizResults(false);
  };

  return (
    <div className="space-y-6">
      {/* Tab Selector Bar */}
      <div className="bg-slate-900 text-white p-2 rounded-2xl flex items-center justify-between border border-slate-800 shadow">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('FAQ')}
            type="button"
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'FAQ'
                ? 'bg-teal-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Συχνές Ερωτήσεις & FAQ ({FORUM_QA_DATABASE.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('QUIZ')}
            type="button"
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'QUIZ'
                ? 'bg-teal-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Award className="w-4 h-4 text-amber-400" />
            <span>Quiz Πιστοποίησης ΚΕΝΑΚ ({totalQuestions} Ερωτήσεις)</span>
          </button>
        </div>

        {activeSubTab === 'QUIZ' && (
          <div className="flex items-center gap-3 pr-2">
            <span className="text-xs font-mono text-slate-300">
              Απαντήθηκαν: <strong>{answeredCount}/{totalQuestions}</strong>
            </span>
            <button
              onClick={handleResetQuiz}
              type="button"
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Επανεκκίνηση</span>
            </button>
          </div>
        )}
      </div>

      {activeSubTab === 'FAQ' && (
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
      )}

      {/* QUIZ MODE */}
      {activeSubTab === 'QUIZ' && (
        <div className="space-y-6">
          {/* Quiz Score Banner */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-bold text-xs uppercase tracking-wider">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Διαδραστικό Quiz Τεχνικών Γνώσεων ΤΟΤΕΕ & ΚΕΝΑΚ</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Τεστ Αυτοαξιολόγησης Ενεργειακού Επιθεωρητή
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
                Ελέγξτε τις γνώσεις σας στα όρια U, τις παραδοχές ΤΟΤΕΕ 20701-1..4 και τους κανόνες καταχώρησης ΠΕΑ.
              </p>
            </div>

            <div className="flex items-center gap-4 shrink-0 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="text-center">
                <div className="text-2xl font-black font-mono text-teal-600 dark:text-teal-400">
                  {correctCount}/{totalQuestions}
                </div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase">Σωστά</div>
              </div>

              <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />

              <div className="text-center">
                <div className="text-2xl font-black font-mono text-slate-700 dark:text-slate-300">
                  {Math.round((correctCount / totalQuestions) * 100)}%
                </div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase">Βαθμολογία</div>
              </div>
            </div>
          </div>

          {/* Quiz Questions List */}
          <div className="space-y-4">
            {QUIZ_QUESTIONS_DATABASE.map((q) => {
              const selectedOptIdx = userAnswers[q.id];
              const isAnswered = selectedOptIdx !== undefined;
              const isCorrect = isAnswered && selectedOptIdx === q.correctOptionIndex;
              const isQuestion14 = q.id === 14;

              return (
                <div
                  key={q.id}
                  className={`bg-white dark:bg-slate-900 rounded-2xl p-5 border transition-all shadow-sm ${
                    isQuestion14
                      ? 'border-teal-500/80 ring-2 ring-teal-500/30'
                      : isAnswered
                      ? isCorrect
                        ? 'border-emerald-500/60 bg-emerald-50/10'
                        : 'border-rose-500/60 bg-rose-50/10'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 font-mono text-[10px] font-bold rounded text-slate-600 dark:text-slate-400">
                          Ερώτηση {q.id} / {totalQuestions}
                        </span>
                        <span className="px-2 py-0.5 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-mono text-[10px] font-bold rounded">
                          {q.category}
                        </span>
                        {isQuestion14 && (
                          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 font-mono text-[10px] font-bold rounded flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            Διορθωμένο: U_max Ζώνης Γ = 0.35 W/m²K
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                        {q.question}
                      </h4>
                    </div>

                    {isAnswered && (
                      <div className="shrink-0">
                        {isCorrect ? (
                          <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Σωστό!</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-800">
                            <XCircle className="w-4 h-4" />
                            <span>Λάθος</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Multiple Choice Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-3">
                    {q.options.map((optText, optIdx) => {
                      const isSelected = selectedOptIdx === optIdx;
                      const isOptionCorrect = optIdx === q.correctOptionIndex;

                      let btnStyle = 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800';

                      if (isAnswered) {
                        if (isOptionCorrect) {
                          btnStyle = 'bg-emerald-500/15 border-emerald-500/60 text-emerald-900 dark:text-emerald-200 font-bold';
                        } else if (isSelected && !isOptionCorrect) {
                          btnStyle = 'bg-rose-500/15 border-rose-500/60 text-rose-900 dark:text-rose-200 line-through';
                        }
                      }

                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleSelectOption(q.id, optIdx)}
                          type="button"
                          className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 cursor-pointer ${btnStyle}`}
                        >
                          <span className={`w-5 h-5 rounded-full border flex items-center justify-center font-mono text-[11px] shrink-0 ${
                            isAnswered && isOptionCorrect
                              ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                              : isSelected
                              ? 'bg-rose-600 text-white border-rose-600'
                              : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600'
                          }`}>
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="leading-snug">{optText}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation Block */}
                  {isAnswered && (
                    <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 space-y-1 animate-fade-in">
                      <div className="font-bold flex items-center gap-1.5 text-teal-600 dark:text-teal-400">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Τεκμηρίωση ΤΟΤΕΕ ({q.source}):</span>
                      </div>
                      <p className="leading-relaxed">{q.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};


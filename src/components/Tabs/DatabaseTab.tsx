import React, { useState, useMemo } from 'react';
import { TYPICAL_VALUES_DATABASE } from '../../data/kenakData';
import { TypicalValueItem, BuildingAgeCategory } from '../../types/kenak';
import { ValueCopyBadge } from '../ValueCopyBadge';
import { Database, Filter, Search, Tag, ExternalLink, CheckCircle2, ArrowRight } from 'lucide-react';
import { getXmlBuildingModel, saveXmlBuildingModel } from '../../utils/xmlModelStore';

interface DatabaseTabProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const DatabaseTab: React.FC<DatabaseTabProps> = ({ searchQuery, setSearchQuery }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedAge, setSelectedAge] = useState<string>('ALL');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleApplyToXml = (item: TypicalValueItem) => {
    const model = getXmlBuildingModel();
    const numValue = parseFloat(item.value);

    if (item.category === 'OPAQUE' && !isNaN(numValue)) {
      const updatedOpaque = model.opaqueSurfaces.map((surf) => ({
        ...surf,
        uValue: numValue,
      }));
      saveXmlBuildingModel({
        ...model,
        opaqueSurfaces: updatedOpaque,
      });
      setToastMsg(`Η τυπική τιμή U = ${numValue} W/m²K (${item.title}) εφαρμόστηκε στα 2.Αδιαφανή Στοιχεία στο XML!`);
    } else if (item.category === 'OPENING' && !isNaN(numValue)) {
      const updatedOpenings = model.openings.map((op) => ({
        ...op,
        uWindow: numValue,
      }));
      saveXmlBuildingModel({
        ...model,
        openings: updatedOpenings,
      });
      setToastMsg(`Η τυπική τιμή U_w = ${numValue} W/m²K (${item.title}) εφαρμόστηκε στα 3.Διαφανή Στοιχεία στο XML!`);
    } else if (item.category === 'HEATING' && !isNaN(numValue)) {
      const updatedHeating = model.heatingSystems.map((sys) => ({
        ...sys,
        efficiency: numValue <= 1.0 ? numValue : numValue / 100,
      }));
      saveXmlBuildingModel({
        ...model,
        heatingSystems: updatedHeating,
      });
      setToastMsg(`Ο τυπικός βαθμός απόδοσης η_g = ${numValue} εφαρμόστηκε στο Σύστημα Θέρμανσης XML!`);
    } else {
      setToastMsg(`Η τιμή ${item.value} (${item.title}) ενημερώθηκε στο μοντέλο!`);
    }

    setTimeout(() => setToastMsg(null), 4000);
  };

  const filteredItems = useMemo(() => {
    return TYPICAL_VALUES_DATABASE.filter((item) => {
      // Category filter
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }
      // Building age filter
      if (selectedAge !== 'ALL' && item.buildingAge !== 'ALL' && item.buildingAge !== selectedAge) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesCode = item.codeOrTable?.toLowerCase().includes(q) || false;
        const matchesTags = item.tags.some(t => t.toLowerCase().includes(q));
        const matchesValue = item.value.toLowerCase().includes(q);
        return matchesTitle || matchesDesc || matchesCode || matchesTags || matchesValue;
      }
      return true;
    });
  }, [selectedCategory, selectedAge, searchQuery]);

  const categories = [
    { id: 'ALL', label: 'Όλες οι Κατηγορίες' },
    { id: 'KELYFOS', label: 'Κέλυφος (U)' },
    { id: 'KOUFOMATA', label: 'Κουφώματα (U_w, g)' },
    { id: 'THERMANSI', label: 'Θέρμανση (η_g, COP)' },
    { id: 'PSYXI', label: 'Ψύξη (EER)' },
    { id: 'ZNX', label: 'ΖΝΧ & Ηλιακά' },
    { id: 'AERISMOS', label: 'Αερισμός & Χαραμάδες' },
    { id: 'SKIASI', label: 'Σκιάσεις (F_sh)' },
    { id: 'THERMOGEFYRES', label: 'Θερμογέφυρες (Ψ)' },
  ];

  const ageCategories = [
    { id: 'ALL', label: 'Όλες οι Περίοδοι' },
    { id: 'PRE_1979', label: 'Προ του 1979 (Αμόνωτα)' },
    { id: '1979_2010', label: '1979 - 2010 (ΚΘΚ)' },
    { id: 'POST_2010', label: 'Μετά το 2010 (ΚΕΝΑΚ)' },
  ];

  return (
    <div className="space-y-6">
      {/* Search & Filter Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Database className="w-5 h-5 text-teal-600" />
              Βάση Τυπικών Τιμών ΤΕΕ-ΚΕΝΑΚ & ΤΟΤΕΕ
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Αναζητήστε και αντιγράψτε με 1 κλικ τις τυπικές τιμές θερμοπερατότητας U, βαθμού απόδοσης η_g, COP, EER, g-value, και σκιάσεων.
            </p>
          </div>

          <div className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Εμφάνιση: <span className="font-bold text-teal-600 dark:text-teal-400">{filteredItems.length}</span> από {TYPICAL_VALUES_DATABASE.length} τιμές
          </div>
        </div>

        {/* Filter Badges */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          {/* Category Dropdown */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <div className="flex items-center gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  type="button"
                  className={`px-2.5 py-1 text-xs rounded-md font-medium whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Age Filter Pills */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Περίοδος Κτιρίου:</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {ageCategories.map((age) => (
              <button
                key={age.id}
                onClick={() => setSelectedAge(age.id)}
                type="button"
                className={`px-2 py-0.5 text-[11px] rounded font-medium transition-all cursor-pointer ${
                  selectedAge === age.id
                    ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {age.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Toast Notification Banner */}
      {toastMsg && (
        <div className="p-3 bg-teal-500/15 border-2 border-teal-500/40 rounded-xl text-xs text-teal-800 dark:text-teal-200 flex items-center justify-between gap-3 shadow-md animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-teal-500 shrink-0" />
            <span className="font-bold">{toastMsg}</span>
          </div>
          <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 bg-teal-500/20 rounded border border-teal-500/30 shrink-0">
            XML Model Updated
          </span>
        </div>
      )}

      {/* Typical Values List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 hover:border-teal-500/50 transition-all shadow-sm flex flex-col justify-between space-y-3"
          >
            <div className="space-y-2">
              {/* Header & Value Copy */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="inline-block px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider rounded bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                    {item.codeOrTable || 'ΤΟΤΕΕ 20701-1'}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                    {item.title}
                  </h3>
                </div>

                <div className="shrink-0 flex flex-col items-end gap-1.5">
                  <ValueCopyBadge value={item.value} />
                  <button
                    onClick={() => handleApplyToXml(item)}
                    type="button"
                    className="px-2 py-1 bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-bold rounded-md shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>Εφαρμογή στο XML</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {item.description}
              </p>

              {/* Notes */}
              {item.notes && (
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-[11px] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 italic">
                  <span className="font-semibold not-italic text-teal-700 dark:text-teal-400">Πεδίο ΤΕΕ-ΚΕΝΑΚ:</span> {item.kenakField}
                  <br />
                  <span className="font-semibold not-italic">Σημείωση:</span> {item.notes}
                </div>
              )}
            </div>

            {/* Tags Footer */}
            <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <Tag className="w-3 h-3 text-slate-400" />
              {item.tags.map((tag, idx) => (
                <span
                  key={idx}
                  onClick={() => setSearchQuery(tag)}
                  className="px-1.5 py-0.5 text-[10px] rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-teal-100 dark:hover:bg-teal-950 hover:text-teal-800 dark:hover:text-teal-200 cursor-pointer transition-all"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        ))}

        {filteredItems.length === 0 && (
          <div className="col-span-full bg-white dark:bg-slate-900 rounded-xl p-8 border border-slate-200 dark:border-slate-800 text-center space-y-3">
            <p className="text-sm text-slate-500">
              Δεν βρέθηκαν τυπικές τιμές που να αντιστοιχούν στα φίλτρα αναζήτησης "{searchQuery}".
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setSelectedAge('ALL');
              }}
              className="px-3 py-1.5 bg-teal-600 text-white text-xs font-semibold rounded-md hover:bg-teal-500 cursor-pointer"
            >
              Καθαρισμός Φίλτρων
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

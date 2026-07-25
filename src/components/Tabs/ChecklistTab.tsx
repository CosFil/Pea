import React, { useState, useEffect } from 'react';
import { InspectionData, BuildingUse, ClimateZone } from '../../types/kenak';
import { ClipboardCheck, Printer, Copy, Check, Download, RefreshCw, Save } from 'lucide-react';

export const ChecklistTab: React.FC = () => {
  const [data, setData] = useState<InspectionData>(() => {
    const saved = localStorage.getItem('kenak_inspection_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      buildingName: 'Διαμέρισμα 1ου Ορόφου',
      address: 'Λεωφόρος Κηφισίας 120, Αθήνα',
      ownerName: 'Γεώργιος Παπαδόπουλος',
      afm: '012345678',
      kaek: '050010203004/0/1',
      use: 'RESIDENTIAL_MULTI',
      climateZone: 'B',
      yearBuilt: 1988,
      grossArea: 85.5,
      netArea: 76.0,
      heatedVolume: 256.5,
      hasThermography: false,
      notes: 'Κεντρικός λέβητας πετρελαίου παλαιός (1988). Διπλά αλουμίνια αθερμοδιακοπτόμενα. Ηλιακός διπλής 160L.',
      inspectDate: new Date().toISOString().split('T')[0],
    };
  });

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    localStorage.setItem('kenak_inspection_data', JSON.stringify(data));
  }, [data]);

  const handleCopyMarkdown = () => {
    const md = `
# ΦΥΛΛΟ ΑΥΤΟΨΙΑΣ ΕΝΕΡΓΕΙΑΚΗΣ ΕΠΙΘΕΩΡΗΣΗΣ (ΠΕΑ)
**Ημερομηνία:** ${data.inspectDate}
**Ονομασία:** ${data.buildingName}
**Διεύθυνση:** ${data.address}
**Ιδιοκτήτης:** ${data.ownerName} | **ΑΦΜ:** ${data.afm}
**ΚΑΕΚ:** ${data.kaek}

---
### 1. ΓΕΝΙΚΑ ΣΤΟΙΧΕΙΑ
- **Χρήση:** ${data.use}
- **Κλιματική Ζώνη:** ${data.climateZone}
- **Έτος Κατασκευής:** ${data.yearBuilt}
- **Μικτή Επιφάνεια:** ${data.grossArea} m²
- **Καθαρή Επιφάνεια:** ${data.netArea} m²
- **Θερμαινόμενος Όγκος:** ${data.heatedVolume} m³

---
### 2. ΣΗΜΕΙΩΣΕΙΣ ΑΥΤΟΨΙΑΣ
${data.notes}
`;
    navigator.clipboard.writeText(md.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-teal-600" />
            Φύλλο Καταγραφής Αυτοψίας & Φάκελος ΠΕΑ
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Συμπληρώστε τα στοιχεία της επιτόπιας αυτοψίας για το φάκελο του ενεργειακού επιθεωρητή. Αποθηκεύονται αυτόματα στη συσκευή σας.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleCopyMarkdown}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Αντιγράφηκε!' : 'Αντιγραφή Markdown'}</span>
          </button>

          <button
            onClick={handlePrint}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-500 shadow-sm transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Εκτύπωση / PDF</span>
          </button>
        </div>
      </div>

      {/* Form Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ονομασία Κτιρίου / Διαμερίσματος:</label>
            <input
              type="text"
              value={data.buildingName}
              onChange={(e) => setData({ ...data, buildingName: e.target.value })}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Διεύθυνση Ακινήτου:</label>
            <input
              type="text"
              value={data.address}
              onChange={(e) => setData({ ...data, address: e.target.value })}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ονοματεπώνυμο Ιδιοκτήτη:</label>
            <input
              type="text"
              value={data.ownerName}
              onChange={(e) => setData({ ...data, ownerName: e.target.value })}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">ΑΦΜ Ιδιοκτήτη:</label>
            <input
              type="text"
              value={data.afm}
              onChange={(e) => setData({ ...data, afm: e.target.value })}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">ΚΑΕΚ Ακινήτου:</label>
            <input
              type="text"
              value={data.kaek}
              onChange={(e) => setData({ ...data, kaek: e.target.value })}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ημερομηνία Αυτοψίας:</label>
            <input
              type="date"
              value={data.inspectDate}
              onChange={(e) => setData({ ...data, inspectDate: e.target.value })}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Κλιματική Ζώνη:</label>
            <select
              value={data.climateZone}
              onChange={(e) => setData({ ...data, climateZone: e.target.value as ClimateZone })}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-bold"
            >
              <option value="A">Ζώνη Α (Κρήτη / Δωδεκάνησα / Κυκλάδες)</option>
              <option value="B">Ζώνη Β (Αττική / Πελοπόννησος)</option>
              <option value="G">Ζώνη Γ (Θεσσαλία / Μακεδονία / Ήπειρος)</option>
              <option value="D">Ζώνη Δ (Δυτική Μακεδονία / Ορεινά)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Έτος Κατασκευής:</label>
            <input
              type="number"
              value={data.yearBuilt}
              onChange={(e) => setData({ ...data, yearBuilt: parseInt(e.target.value) || 1980 })}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono font-bold"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Μικτή Επιφάνεια [m²]:</label>
            <input
              type="number"
              step="0.1"
              value={data.grossArea}
              onChange={(e) => setData({ ...data, grossArea: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono font-bold"
            />
          </div>
        </div>

        {/* Notes Area */}
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 text-xs mb-1">
            Τεχνικές Σημειώσεις Επιθεωρητή (Κέλυφος, Συστήματα, Προσανατολισμός, Φωτογραφίες):
          </label>
          <textarea
            rows={5}
            value={data.notes}
            onChange={(e) => setData({ ...data, notes: e.target.value })}
            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono leading-relaxed"
            placeholder="Καταγράψτε τύπο λέβητα, ισχύ kW, τύπο κουφωμάτων, ηλιακό, προσανατολισμό..."
          />
        </div>
      </div>
    </div>
  );
};

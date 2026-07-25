import React, { useState } from 'react';
import { 
  Building, 
  Layers, 
  Maximize2, 
  Flame, 
  Snowflake, 
  Droplets, 
  Sun, 
  AlertTriangle, 
  Info, 
  ChevronRight, 
  CheckCircle2 
} from 'lucide-react';
import { ValueCopyBadge } from '../ValueCopyBadge';

export const GuideTab: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(1);

  const steps = [
    { id: 1, title: '1. Γενικά Στοιχεία & Ζώνες', icon: Building },
    { id: 2, title: '2. Κέλυφος & Δομικά Στοιχεία (U)', icon: Layers },
    { id: 3, title: '3. Ανοίγματα & Σκιάσεις (U_w, g)', icon: Maximize2 },
    { id: 4, title: '4. Συστήματα Θέρμανσης & Ψύξης', icon: Flame },
    { id: 5, title: '5. ΖΝΧ, Αερισμός & ΑΠΕ', icon: Droplets },
    { id: 6, title: '6. Σενάρια & Υποβολή', icon: Sun },
  ];

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-teal-400 text-xs font-semibold uppercase tracking-wider">
            <Info className="w-4 h-4" />
            <span>Οδηγός Συμπλήρωσης ΤΕΕ-ΚΕΝΑΚ v1.31 / ΠΕΑ</span>
          </div>
          <h2 className="text-xl font-bold">Βήμα-προς-Βήμα Τεχνικές Οδηγίες Καταχώρησης</h2>
          <p className="text-xs text-slate-300 max-w-2xl">
            Ακολουθήστε τη σειρά των καρτελών του λογισμικού ΤΕΕ-ΚΕΝΑΚ με τις ακριβείς τυπικές τιμές, τις παραδοχές των ΤΟΤΕΕ 20701-1..5 και τις οδηγίες συμπλήρωσης πεδίων.
          </p>
        </div>

        {/* Step Selector Pills */}
        <div className="flex flex-wrap gap-1.5 shrink-0">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                type="button"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  activeStep === step.id
                    ? 'bg-teal-600 text-white shadow'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{step.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      {activeStep === 1 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="p-2.5 rounded-lg bg-teal-100 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                1. Καρτέλα "Γενικά Στοιχεία" & "Θερμικές Ζώνες"
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Καθορισμός ταυτότητας κτιρίου, χρήσης, κλιματικής ζώνης και ορισμός θερμικών ζωνών / ΜΘΧ.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Field Guide 1 */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-teal-600" />
                Βασικά Πεδία Γενικών Στοιχείων
              </h4>
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1">
                  <div className="font-semibold text-slate-900 dark:text-slate-100">Χρήση Κτιρίου</div>
                  <p className="text-slate-600 dark:text-slate-300">
                    Επιλέγετε μεταξύ <span className="font-semibold">Μονοκατοικία</span>, <span className="font-semibold">Πολυκατοικία</span> (για μεμονωμένο διαμέρισμα ή όλο το κτίριο), <span className="font-semibold">Γραφεία</span>, <span className="font-semibold">Εμπορικό</span> κλπ.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1">
                  <div className="font-semibold text-slate-900 dark:text-slate-100">Κλιματική Ζώνη</div>
                  <p className="text-slate-600 dark:text-slate-300 mb-1.5">
                    Επιλέγεται αυτόματα βάσει Νομού & Υψομέτρου κατά ΚΕΝΑΚ:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <ValueCopyBadge value="Ζώνη Α" label="Κρήτη, Δωδεκάνησα, Κυκλάδες" />
                    <ValueCopyBadge value="Ζώνη Β" label="Αττική, Πελοπόννησος, Εύβοια" />
                    <ValueCopyBadge value="Ζώνη Γ" label="Θεσσαλία, Ήπειρος, Μακεδονία" />
                    <ValueCopyBadge value="Ζώνη Δ" label="Δυτική Μακεδονία, Ορεινά" />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1">
                  <div className="font-semibold text-slate-900 dark:text-slate-100">Έτος Κατασκευής / Οικοδομική Άδεια</div>
                  <p className="text-slate-600 dark:text-slate-300">
                    Καθορίζει αν το κτίριο εμπίπτει <span className="font-semibold">Προ του 1979</span> (χωρίς θερμομόνωση), <span className="font-semibold">1979-2010</span> (Κανονισμός Θερμομόνωσης 1979) ή <span className="font-semibold">Μετά το 2010</span> (ΚΕΝΑΚ).
                  </p>
                </div>
              </div>
            </div>

            {/* Field Guide 2 */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-teal-600" />
                Ορισμός Θερμικών Ζωνών & ΜΘΧ
              </h4>
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Πότε ορίζουμε Μη Θερμαινόμενο Χώρο (ΜΘΧ);
                  </div>
                  <p className="leading-relaxed">
                    Εάν επιθεωρείται αυτόνομος ΜΘΧ (π.χ. κλειστή αποθήκη, γκαράζ) ή εάν θέλουμε αναλυτικό υπολογισμό. Για μεμονωμένα διαμερίσματα σε πολυκατοικία, η διαχωριστική τοιχοποιία προς το κοινόχρηστο κλιμακοστάσιο μπορεί να καταχωρηθεί απλοποιητικά με <span className="font-bold underline">U/2</span> προς τον εξωτερικό αέρα, χωρίς να οριστεί ζώνη ΜΘΧ!
                  </p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1">
                  <div className="font-semibold text-slate-900 dark:text-slate-100">Απαιτήσεις Νωπού Αέρα & Χαραμάδες</div>
                  <p className="text-slate-600 dark:text-slate-300">
                    Για κατοικίες, ο αερισμός θεωρείται φυσικός (<ValueCopyBadge value="0.75 m³/h/m²" />). Η αεροδιαπερατότητα των κουφωμάτων λαμβάνεται από τον Πίνακα 3.14 της ΤΟΤΕΕ 20701-1.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeStep === 2 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="p-2.5 rounded-lg bg-teal-100 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                2. Καρτέλα "Κέλυφος → Δομικά Στοιχεία"
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Καταχώρηση αδιαφανών επιφανειών (Τοίχοι, Δώματα, Στέγες, Πυλωτές, Δάπεδα) & Θερμογεφυρών.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category 1: Walls */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-slate-100">Εξωτερικοί Τοίχοι</span>
                <span className="text-[10px] font-mono bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">U [W/m²K]</span>
              </div>
              <ul className="space-y-2 text-xs">
                <li className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800">
                  <span>Αμόνωτος (Προ '79):</span>
                  <ValueCopyBadge value="2.20" />
                </li>
                <li className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800">
                  <span>Σκυρόδεμα Αμόνωτο:</span>
                  <ValueCopyBadge value="3.40" />
                </li>
                <li className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800">
                  <span>Μονωμένος (1979-2010):</span>
                  <ValueCopyBadge value="0.70 - 0.85" />
                </li>
                <li className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800">
                  <span>Θερμοπρόσοψη (ΚΕΝΑΚ):</span>
                  <ValueCopyBadge value="0.35 - 0.45" />
                </li>
              </ul>
            </div>

            {/* Category 2: Roofs */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-slate-100">Δώματα & Στέγες</span>
                <span className="text-[10px] font-mono bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">U [W/m²K]</span>
              </div>
              <ul className="space-y-2 text-xs">
                <li className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800">
                  <span>Δώμα Αμόνωτο:</span>
                  <ValueCopyBadge value="3.05" />
                </li>
                <li className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800">
                  <span>Δώμα με Μόνωση 5cm:</span>
                  <ValueCopyBadge value="0.50" />
                </li>
                <li className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800">
                  <span>Δώμα ΚΕΝΑΚ (8-10cm):</span>
                  <ValueCopyBadge value="0.25 - 0.35" />
                </li>
                <li className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800">
                  <span>Ξύλινη Στέγη Αμόνωτη:</span>
                  <ValueCopyBadge value="2.50" />
                </li>
              </ul>
            </div>

            {/* Category 3: Floors */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-slate-100">Πυλωτή & Δάπεδα</span>
                <span className="text-[10px] font-mono bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">U [W/m²K]</span>
              </div>
              <ul className="space-y-2 text-xs">
                <li className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800">
                  <span>Πυλωτή Αμόνωτη:</span>
                  <ValueCopyBadge value="2.40" />
                </li>
                <li className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800">
                  <span>Πυλωτή Μονωμένη:</span>
                  <ValueCopyBadge value="0.40 - 0.50" />
                </li>
                <li className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800">
                  <span>Δάπεδο σε Έδαφος:</span>
                  <ValueCopyBadge value="0.80 - 1.20" />
                </li>
                <li className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800">
                  <span>Προσαύξηση Θερμογεφυρών ΔU_tb:</span>
                  <ValueCopyBadge value="0.15 - 0.20" />
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeStep === 3 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="p-2.5 rounded-lg bg-teal-100 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300">
              <Maximize2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                3. Καρτέλα "Κέλυφος → Ανοίγματα & Σκιάσεις"
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Καταχώρηση παραθύρων, εξωθυρών, συντελεστών U_w, ηλιακού κέρδους g και συντελεστών σκίασης.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                Τυπικές Τιμές U_w & g Κουφωμάτων (ΤΟΤΕΕ 20701-1)
              </h4>
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">Ξύλινο / Αλουμίνιο Αθερμοδιακοπτόμενο + Μονό Τζάμι</div>
                    <div className="text-[11px] text-slate-500">Προ του 1979</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ValueCopyBadge value="6.20" label="U_w" />
                    <ValueCopyBadge value="0.85" label="g" />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">Αλουμίνιο Αθερμοδιακοπτόμενο + Διπλό Συμβατικό Τζάμι</div>
                    <div className="text-[11px] text-slate-500">1979 - 2010</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ValueCopyBadge value="4.50" label="U_w" />
                    <ValueCopyBadge value="0.75" label="g" />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">Αλουμίνιο Θερμοδιακοπτόμενο + Διπλό Ενεργειακό Low-E</div>
                    <div className="text-[11px] text-slate-500">Μετά το 2010</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ValueCopyBadge value="2.20" label="U_w" />
                    <ValueCopyBadge value="0.50" label="g" />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">Συνθετικό PVC 5-Θαλάμων + Διπλό Low-E Argon</div>
                    <div className="text-[11px] text-slate-500">Υψηλής απόδοσης</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ValueCopyBadge value="1.60" label="U_w" />
                    <ValueCopyBadge value="0.50" label="g" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                Συντελεστές Σκίασης (F_sh, F_ov, F_fin, F_hor)
              </h4>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Ο συνολικός συντελεστής σκίασης υπολογίζεται ως γινόμενο: <br />
                  <span className="font-mono font-bold text-teal-600 dark:text-teal-400">F_sh = F_ov × F_fin × F_hor × F_sh_extra</span>
                </p>

                <div className="space-y-2">
                  <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800">
                    <span>Κινητή Τέντα (Χειμώνας):</span>
                    <ValueCopyBadge value="1.00" label="F_ov_h" />
                  </div>
                  <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800">
                    <span>Κινητή Τέντα (Καλοκαίρι κατεβασμένη):</span>
                    <ValueCopyBadge value="0.30 - 0.40" label="F_ov_c" />
                  </div>
                  <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800">
                    <span>Εξωτερικά Παντζούρια/Ρολά (Καλοκαίρι):</span>
                    <ValueCopyBadge value="0.50 - 0.60" label="F_sh_c" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeStep === 4 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="p-2.5 rounded-lg bg-teal-100 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                4. Καρτέλα "Συστήματα → Θέρμανση & Ψύξη"
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Καταχώρηση λεβήτων, αντλιών θερμότητας, κλιματιστικών split, τζακιών, δικτύων διανομής & αυτοματισμών.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Heating */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                Συστήματα Θέρμανσης & Βαθμός Απόδοσης η_g / COP
              </h4>
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">Λέβητας Πετρελαίου Παλαιός (Προ '90)</div>
                    <div className="text-[11px] text-slate-500">Συμβατικός</div>
                  </div>
                  <ValueCopyBadge value="0.83" label="η_g" />
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">Λέβητας Φυσικού Αερίου Συμπύκνωσης</div>
                    <div className="text-[11px] text-slate-500">Σύγχρονος</div>
                  </div>
                  <ValueCopyBadge value="1.02" label="η_g" />
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">Αντλία Θερμότητας Αέρα-Νερού (Inverter)</div>
                    <div className="text-[11px] text-slate-500">Μεσαίων Θερμοκρασιών</div>
                  </div>
                  <ValueCopyBadge value="3.80" label="COP" />
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">Τζάκι Ανοικτού Τύπου</div>
                    <div className="text-[11px] text-slate-500">Παραδοσιακό</div>
                  </div>
                  <ValueCopyBadge value="0.25" label="η_g" />
                </div>
              </div>
            </div>

            {/* Cooling */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Snowflake className="w-4 h-4 text-cyan-500" />
                Συστήματα Ψύξης & Συντελεστής EER
              </h4>
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">Split Unit Inverter (R32 / A++)</div>
                    <div className="text-[11px] text-slate-500">Σύγχρονο A/C</div>
                  </div>
                  <ValueCopyBadge value="3.50" label="EER" />
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">Split Unit On/Off (Παλαιό R22/R410A)</div>
                    <div className="text-[11px] text-slate-500">Συμβατικό A/C</div>
                  </div>
                  <ValueCopyBadge value="2.80" label="EER" />
                </div>

                <div className="p-3 bg-cyan-50 dark:bg-cyan-950/30 rounded-lg border border-cyan-200 dark:border-cyan-800 text-cyan-900 dark:text-cyan-200 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-cyan-600" />
                    Κατοικία Χωρίς Σύστημα Ψύξης
                  </div>
                  <p className="leading-relaxed">
                    Εάν στην κατοικία δεν υπάρχουν κλιματιστικά, αφήνετε την καρτέλα ψύξης κενή. Το λογισμικό εφαρμόζει αυτόματα 100% κάλυψη από το εικονικό σύστημα του κτιρίου αναφοράς με <ValueCopyBadge value="3.00" label="EER" />.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeStep === 5 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="p-2.5 rounded-lg bg-teal-100 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300">
              <Droplets className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                5. Καρτέλα "Συστήματα → ΖΝΧ, Φωτισμός & ΑΠΕ"
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ζεστό νερό χρήσης, ηλιακοί συλλέκτες, φωτισμός μη οικιακών και φωτοβολταϊκά συστήματα.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* DHW */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                <Droplets className="w-4 h-4 text-blue-500" />
                Ζεστό Νερό Χρήσης (ΖΝΧ)
              </div>
              <ul className="space-y-2">
                <li className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800">
                  <span>Απαιτούμενη κατανάλωση (Κατοικία):</span>
                  <ValueCopyBadge value="42 L/άτομο/ημέρα" />
                </li>
                <li className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800">
                  <span>Ηλεκτρικός Θερμοσίφωνας (η_g):</span>
                  <ValueCopyBadge value="1.00" />
                </li>
                <li className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800">
                  <span>Ηλιακός Θερμοσίφωνας (Τυπική επιφάνεια):</span>
                  <ValueCopyBadge value="2.0 - 2.5 m²" />
                </li>
              </ul>
            </div>

            {/* PV & RES */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-500" />
                Φωτοβολταϊκά & ΑΠΕ
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Στην καρτέλα Φ/Β καταχωρούμε την εγκατεστημένη ισχύ σε kWp, τον προσανατολισμό (0° Νότος) και την κλίση (30°-35°).
              </p>
              <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800">
                <span>Τυπική Ετήσια Παραγωγή στην Ελλάδα:</span>
                <ValueCopyBadge value="1300 - 1500 kWh/kWp" />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeStep === 6 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="p-2.5 rounded-lg bg-teal-100 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300">
              <Sun className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                6. Σενάρια Βελτίωσης & Οριστική Υποβολή ΠΕΑ
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Δημιουργία προτάσεων ενεργειακής αναβάθμισης, υπολογισμός εξοικονόμησης και εξαγωγή αρχείου υποβολής.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="font-bold text-slate-900 dark:text-slate-100">Σενάριο 1: Θερμοπρόσοψη & Δώμα</div>
              <p className="text-slate-600 dark:text-slate-300">
                Προσθήκη 8cm EPS στην τοιχοποιία και 10cm XPS στο δώμα. Μείωση U_wall &lt; 0.40, U_roof &lt; 0.30 W/m²K.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="font-bold text-slate-900 dark:text-slate-100">Σενάριο 2: Νέα Κουφώματα Low-E</div>
              <p className="text-slate-600 dark:text-slate-300">
                Αντικατάσταση παλαιών κουφωμάτων με θερμοδιακοπτόμενα αλουμίνια U_w ≤ 2.20 W/m²K και ρολά.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="font-bold text-slate-900 dark:text-slate-100">Σενάριο 3: Αντλία Θερμότητας / Φ/Β</div>
              <p className="text-slate-600 dark:text-slate-300">
                Εγκατάσταση Α/Θ αέρα-νερού (SCOP ≥ 3.80) & Φ/Β 3kWp Net Metering. Άλμα ενεργειακής κατηγορίας έως Α+.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

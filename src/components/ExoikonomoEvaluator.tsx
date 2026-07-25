import React, { useState } from 'react';
import { FullBuildingModel } from '../types/xmlKenak';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Award, 
  TrendingUp, 
  Euro, 
  Calculator, 
  Info,
  Building,
  Zap,
  Flame,
  Sun,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

interface ExoikonomoEvaluatorProps {
  model: FullBuildingModel;
}

export type EnergyClass = 'A+' | 'A' | 'B+' | 'B' | 'Γ' | 'Δ' | 'Ε' | 'Ζ' | 'Η';

const CLASS_ORDER: EnergyClass[] = ['A+', 'A', 'B+', 'B', 'Γ', 'Δ', 'Ε', 'Ζ', 'Η'];

export function calculateEnergyClass(ratioT: number): EnergyClass {
  if (ratioT <= 0.33) return 'A+';
  if (ratioT <= 0.50) return 'A';
  if (ratioT <= 0.75) return 'B+';
  if (ratioT <= 1.00) return 'B';
  if (ratioT <= 1.41) return 'Γ';
  if (ratioT <= 1.82) return 'Δ';
  if (ratioT <= 2.27) return 'Ε';
  if (ratioT <= 2.73) return 'Ζ';
  return 'Η';
}

export function getClassIndex(eClass: EnergyClass): number {
  return CLASS_ORDER.indexOf(eClass);
}

export const ExoikonomoEvaluator: React.FC<ExoikonomoEvaluatorProps> = ({ model }) => {
  // Estimated Primary Energy Consumption (kWh/m²/year)
  // Reference building baseline: ~120 kWh/m²
  const refEnergyKwh = 120.0;
  
  // Existing building estimated primary energy
  // Based on building age and U-values approximation
  const existingRatioT = model.yearBuilt < 1979 ? 2.45 : model.yearBuilt <= 2010 ? 1.65 : 0.95;
  const existingEnergyKwh = refEnergyKwh * existingRatioT;
  const existingClass = calculateEnergyClass(existingRatioT);

  // Scenario 1: Energy Upgrade
  const [budgetScen1, setBudgetScen1] = useState<number>(model.exoikonomoBudgetScen1 || 18500);
  const [degreeDaysK1, setDegreeDaysK1] = useState<number>(model.degreeDaysFactorK1 || 1.05);

  const scen1SavingPercent = model.scenarios[0]?.estimatedSavingPercent || 45;
  const scen1EnergyKwh = existingEnergyKwh * (1 - scen1SavingPercent / 100);
  const scen1RatioT = scen1EnergyKwh / refEnergyKwh;
  const scen1Class = calculateEnergyClass(scen1RatioT);

  // Class Upgrade Steps
  const existingIndex = getClassIndex(existingClass);
  const scen1Index = getClassIndex(scen1Class);
  const classUpgradeSteps = existingIndex - scen1Index;

  // Criteria Checks
  const passCriteriaA = existingIndex >= getClassIndex('Γ'); // Must be Class Γ or lower (Γ, Δ, Ε, Ζ, Η)
  const passCriteriaB = classUpgradeSteps >= 3; // At least 3 rating classes upgrade
  const passCriteriaC = scen1SavingPercent >= 30; // > 30% primary energy saving

  // Energy Saved total kWh
  const totalEnergySavedKwh = (existingEnergyKwh - scen1EnergyKwh) * model.grossArea;
  const costPerKwhSaved = totalEnergySavedKwh > 0 ? budgetScen1 / totalEnergySavedKwh : 0;
  const passCostCriteria1 = costPerKwhSaved <= 1.20; // <= 1.20 €/kWh saved
  const passCostCriteria2 = budgetScen1 <= 35000; // <= 35,000 €

  const isFullyEligible = passCriteriaA && passCriteriaB && passCriteriaC && passCostCriteria1 && passCostCriteria2;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-600/20 border border-emerald-500/40 rounded-xl text-emerald-500 shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <span>Αξιολόγηση Επιλεξιμότητας «Εξοικονομώ 2025»</span>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">
                v2025
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Αυτόματος έλεγχος ενεργειακών στόχων, αναβάθμισης κλάσεων και ορίων κόστους βάσει ΤΕΕ-ΚΕΝΑΚ.
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="shrink-0">
          {isFullyEligible ? (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              EΠΙΛΕΞΙΜΟ ΠΡΟΓΡΑΜΜΑ
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              ΑΠΑΙΤΕΙΤΑΙ ΠΡΟΣΑΡΜΟΓΗ
            </span>
          )}
        </div>
      </div>

      {/* Energy Rating Bar Chart Comparison */}
      <div className="space-y-3 bg-slate-50 dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
        <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>Ενεργειακή Κατάταξη Κτιρίου (T = EP / R_R)</span>
          <span className="text-[11px] font-normal lowercase">Κτίριο Αναφοράς R_R = 120.0 kWh/m²</span>
        </h4>

        {/* Rating Scale Bars */}
        <div className="grid grid-cols-9 gap-1.5 text-center font-bold text-[11px] pt-2">
          {CLASS_ORDER.map((cls) => {
            const isExisting = cls === existingClass;
            const isScen1 = cls === scen1Class;
            return (
              <div
                key={cls}
                className={`p-2 rounded-lg border transition-all flex flex-col items-center justify-center gap-1 relative ${
                  cls === 'A+' || cls === 'A'
                    ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/40'
                    : cls === 'B+' || cls === 'B'
                    ? 'bg-teal-600/30 text-teal-300 border-teal-500/40'
                    : cls === 'Γ' || cls === 'Δ'
                    ? 'bg-amber-600/30 text-amber-300 border-amber-500/40'
                    : 'bg-rose-600/30 text-rose-300 border-rose-500/40'
                }`}
              >
                <span>{cls}</span>
                {isExisting && (
                  <span className="absolute -top-3 px-1.5 py-0.5 bg-rose-500 text-white text-[9px] font-extrabold rounded-md shadow uppercase tracking-tight whitespace-nowrap">
                    Αρχικό
                  </span>
                )}
                {isScen1 && (
                  <span className="absolute -bottom-3 px-1.5 py-0.5 bg-emerald-500 text-slate-950 text-[9px] font-extrabold rounded-md shadow uppercase tracking-tight whitespace-nowrap">
                    Σενάριο 1
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Energy Values Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 text-xs font-mono">
          <div className="bg-slate-100 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 block">Κτίριο Αναφοράς (R_R)</span>
            <span className="text-sm font-bold text-sky-400">{refEnergyKwh.toFixed(1)} kWh/m²</span>
          </div>

          <div className="bg-slate-100 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 block">Υπάρχον Κτίριο (EP_0)</span>
            <span className="text-sm font-bold text-rose-400">
              {existingEnergyKwh.toFixed(1)} kWh/m² <span className="text-xs font-semibold">(Κλάση {existingClass})</span>
            </span>
          </div>

          <div className="bg-slate-100 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 block">Σενάριο 1 Μετά την Παρέμβαση</span>
            <span className="text-sm font-bold text-emerald-400">
              {scen1EnergyKwh.toFixed(1)} kWh/m² <span className="text-xs font-semibold">(Κλάση {scen1Class})</span>
            </span>
          </div>
        </div>
      </div>

      {/* Criteria Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* Panel 1: Energy Target Criteria */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-3">
          <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-500" />
            <span>1. Κριτήρια Ενεργειακών Στόχων</span>
          </h4>

          <div className="space-y-2.5">
            <div className="flex items-start justify-between gap-3 p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-200">Α. Αρχική Κλάση ≤ Γ</p>
                <p className="text-[10px] text-slate-500">Το υφιστάμενο κτίριο πρέπει να ανήκει στην κατηγορία Γ ή χαμηλότερα.</p>
              </div>
              <div>
                {passCriteriaA ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                )}
              </div>
            </div>

            <div className="flex items-start justify-between gap-3 p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-200">Β. Αναβάθμιση ≥ 3 Ενεργειακές Κλάσεις</p>
                <p className="text-[10px] text-slate-500">
                  Επιτεύχθηκαν {classUpgradeSteps} κλάσεις ({existingClass} → {scen1Class}).
                </p>
              </div>
              <div>
                {passCriteriaB ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                )}
              </div>
            </div>

            <div className="flex items-start justify-between gap-3 p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-200">Γ. Εξοικονόμηση Πρωτογενούς Ενέργειας &gt; 30%</p>
                <p className="text-[10px] text-slate-500">Υπολογισμένη εξοικονόμηση: {scen1SavingPercent}%.</p>
              </div>
              <div>
                {passCriteriaC ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Panel 2: Cost & Budget Criteria */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-3">
          <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-2">
            <Euro className="w-4 h-4 text-emerald-500" />
            <span>2. Κριτήρια Κόστους & Επιχορήγησης</span>
          </h4>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Προϋπολογισμός Παρεμβάσεων (€):
              </label>
              <input
                type="number"
                step="500"
                value={budgetScen1}
                onChange={(e) => setBudgetScen1(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono font-bold text-sm"
              />
            </div>

            <div className="flex items-start justify-between gap-3 p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-200">
                  Δ. Κόστος ≤ 1.20 €/kWh Εξοικονομούμενης
                </p>
                <p className="text-[10px] font-mono text-slate-500">
                  Δείκτης: <strong className="text-emerald-400">{costPerKwhSaved.toFixed(2)} €/kWh</strong> (Όριο: 1.20 €)
                </p>
              </div>
              <div>
                {passCostCriteria1 ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                )}
              </div>
            </div>

            <div className="flex items-start justify-between gap-3 p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-200">
                  Ε. Ανώτατο Όριο Επιλέξιμου Προϋπολογισμού ≤ 35.000 €
                </p>
                <p className="text-[10px] font-mono text-slate-500">
                  Προϋπολογισμός: <strong className="text-emerald-400">{budgetScen1.toLocaleString('el-GR')} €</strong>
                </p>
              </div>
              <div>
                {passCostCriteria2 ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

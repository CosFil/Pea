import React, { useState } from 'react';
import { MATERIALS_DATABASE } from '../../data/materialsDatabase';
import { WallLayer, ClimateZone } from '../../types/kenak';
import { Calculator, Plus, Trash2, CheckCircle2, AlertTriangle, Layers, Maximize2, Flame, Sun, ArrowRight, Save } from 'lucide-react';
import { ValueCopyBadge } from '../ValueCopyBadge';
import { getXmlBuildingModel, saveXmlBuildingModel } from '../../utils/xmlModelStore';
import { OpaqueSurfaceInput, OpeningInput } from '../../types/xmlKenak';

export const CalculatorsTab: React.FC = () => {
  const [activeCalc, setActiveCalc] = useState<'U_BUILDER' | 'U_WINDOW' | 'BOILER_OVERSIZING' | 'GEOMETRY'>('U_BUILDER');
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  // -------------------------------------------------------------
  // CALCULATOR 1: U-VALUE LAYER BUILDER
  // -------------------------------------------------------------
  const [climateZone, setClimateZone] = useState<ClimateZone>('B');
  const [elementType, setElementType] = useState<'WALL' | 'ROOF' | 'FLOOR_PILOTI'>('WALL');
  const [layers, setLayers] = useState<WallLayer[]>([
    { id: '1', materialId: 'mat-1', name: 'Ασβεστοτσιμεντοκονίαμα (Εξωτερικός σοβάς)', thicknessCm: 2, lambda: 0.87 },
    { id: '2', materialId: 'mat-4', name: 'Οπτόπλινθος (Εξωτερικό τούβλο 9cm)', thicknessCm: 9, lambda: 0.44 },
    { id: '3', materialId: 'mat-13', name: 'Διογκωμένη Πολυστερίνη (EPS 80)', thicknessCm: 5, lambda: 0.036 },
    { id: '4', materialId: 'mat-4', name: 'Οπτόπλινθος (Εσωτερικό τούβλο 9cm)', thicknessCm: 9, lambda: 0.44 },
    { id: '5', materialId: 'mat-1', name: 'Ασβεστοτσιμεντοκονίαμα (Εσωτερικός σοβάς)', thicknessCm: 2, lambda: 0.87 },
  ]);

  // Surface resistances R_si and R_se according to TOTEE 20701-1
  const getRsiRse = () => {
    if (elementType === 'WALL') return { R_si: 0.13, R_se: 0.04 };
    if (elementType === 'ROOF') return { R_si: 0.10, R_se: 0.04 }; // Heat flow upwards
    return { R_si: 0.17, R_se: 0.04 }; // Piloti / Floor downwards
  };

  const { R_si, R_se } = getRsiRse();

  const layersThermalResistance = layers.map((layer) => {
    const dMeters = layer.thicknessCm / 100;
    const R = layer.lambda > 0 ? dMeters / layer.lambda : 0;
    return { ...layer, R };
  });

  const sumR_layers = layersThermalResistance.reduce((acc, l) => acc + l.R, 0);
  const R_total = R_si + sumR_layers + R_se;
  const U_calculated = R_total > 0 ? 1 / R_total : 0;

  // KENAK limits (W/m²K)
  const kenakLimits: Record<ClimateZone, { WALL: number; ROOF: number; FLOOR_PILOTI: number }> = {
    A: { WALL: 0.45, ROOF: 0.35, FLOOR_PILOTI: 0.50 },
    B: { WALL: 0.40, ROOF: 0.30, FLOOR_PILOTI: 0.45 },
    G: { WALL: 0.35, ROOF: 0.25, FLOOR_PILOTI: 0.40 },
    D: { WALL: 0.30, ROOF: 0.20, FLOOR_PILOTI: 0.35 },
  };

  const currentKenakLimit = kenakLimits[climateZone][elementType];
  const isUCompliant = U_calculated <= currentKenakLimit;

  const handleAddLayer = (matId: string) => {
    const mat = MATERIALS_DATABASE.find((m) => m.id === matId);
    if (!mat) return;
    setLayers((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        materialId: mat.id,
        name: mat.name,
        thicknessCm: 5,
        lambda: mat.lambda,
      },
    ]);
  };

  const handleRemoveLayer = (id: string) => {
    setLayers((prev) => prev.filter((l) => l.id !== id));
  };

  const handleUpdateLayer = (id: string, thicknessCm: number, lambda: number) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, thicknessCm, lambda } : l))
    );
  };

  // -------------------------------------------------------------
  // CALCULATOR 2: WINDOW U_w
  // -------------------------------------------------------------
  const [winWidth, setWinWidth] = useState<number>(1.40);
  const [winHeight, setWinHeight] = useState<number>(1.40);
  const [uGlass, setUGlass] = useState<number>(1.10); // Low-E Argon
  const [uFrame, setUFrame] = useState<number>(2.20); // Thermal break aluminium
  const [frameRatio, setFrameRatio] = useState<number>(0.25); // 25% frame
  const [psiGlass, setPsiGlass] = useState<number>(0.06); // Warm edge spacer

  const windowArea = winWidth * winHeight;
  const frameArea = windowArea * frameRatio;
  const glassArea = windowArea * (1 - frameRatio);
  const glassPerimeter = 2 * (Math.sqrt(glassArea) * 2); // approx

  const calculatedUw = windowArea > 0 
    ? (glassArea * uGlass + frameArea * uFrame + glassPerimeter * psiGlass) / windowArea
    : 0;

  // -------------------------------------------------------------
  // CALCULATOR 3: BOILER OVERSIZING
  // -------------------------------------------------------------
  const [pNominal, setPNominal] = useState<number>(60); // P_n [kW]
  const [pRequired, setPRequired] = useState<number>(25); // P_req [kW]
  const [boilerAge, setBoilerAge] = useState<number>(0.85); // Nominal efficiency

  const oversizingRatio = pRequired > 0 ? pNominal / pRequired : 1;
  // TOTEE formula approximation for oversizing penalty
  const adjustedBoilerEff = oversizingRatio > 1
    ? Math.max(0.60, boilerAge - 0.05 * Math.log(oversizingRatio))
    : boilerAge;

  // -------------------------------------------------------------
  // CALCULATOR 4: BUILDING GEOMETRY & SHADING
  // -------------------------------------------------------------
  const [bLength, setBLength] = useState<number>(10.0); // Building Length [m]
  const [bWidth, setBWidth] = useState<number>(10.0);   // Building Width [m]
  const [bHeightGross, setBHeightGross] = useState<number>(3.0); // Gross Floor Height [m]
  const [wallThickness, setWallThickness] = useState<number>(0.25); // Wall Thickness [m]
  const [windowsTotalArea, setWindowsTotalArea] = useState<number>(12.0); // Windows Total Area [m²]
  const [overhangDepth, setOverhangDepth] = useState<number>(1.2); // Overhang Depth [m]
  const [overhangDist, setOverhangDist] = useState<number>(0.5); // Dist from window top [m]

  const grossAreaCalc = bLength * bWidth;
  const netAreaCalc = Math.max(0, (bLength - 2 * wallThickness) * (bWidth - 2 * wallThickness));
  const heatedVolumeCalc = grossAreaCalc * bHeightGross;
  const grossWallAreaCalc = 2 * (bLength + bWidth) * bHeightGross;
  const netWallAreaCalc = Math.max(0, grossWallAreaCalc - windowsTotalArea);
  const totalEnvelopeAreaCalc = grossWallAreaCalc + grossAreaCalc * 2; // Walls + Roof + Floor
  const compactnessAV = heatedVolumeCalc > 0 ? totalEnvelopeAreaCalc / heatedVolumeCalc : 0;

  // Overhang shading approximation (TOTEE 20701-1)
  const betaAngleDeg = Math.atan2(overhangDepth, overhangDist) * (180 / Math.PI);
  // Winter shading factor approximation
  const fOvWinter = Math.max(0.1, Math.min(1.0, 1.0 - 0.008 * betaAngleDeg));
  // Summer shading factor approximation
  const fOvSummer = Math.max(0.05, Math.min(1.0, 1.0 - 0.015 * betaAngleDeg));

  // XML Model Sync Handlers
  const handleApplyUToXml = () => {
    const currentModel = getXmlBuildingModel();
    const typeLabel = elementType === 'WALL' ? 'Τοίχος' : elementType === 'ROOF' ? 'Δώμα' : 'Πυλωτή';
    const isPre1980 = currentModel.ageCategory === 'PRE_1979' || currentModel.yearBuilt < 1980;
    const isCategory2 = currentModel.ageCategory === '1979_2010' || (currentModel.yearBuilt >= 1980 && currentModel.yearBuilt <= 2010);
    const calculatedDeltaUtb = isPre1980 ? 0.00 : isCategory2 ? 0.20 : 0.10;

    const newSurf: OpaqueSurfaceInput = {
      id: `op-calc-${Date.now()}`,
      name: `${typeLabel} (Υπολογισμένο U=${U_calculated.toFixed(3)})`,
      type: elementType,
      area: 25.0,
      uValue: Number(U_calculated.toFixed(3)),
      deltaUtb: calculatedDeltaUtb,
      orientation: 'S',
      tiltAngle: elementType === 'ROOF' ? 0 : 90,
      boundary: elementType === 'FLOOR_PILOTI' ? 'UNHEATED_SPACE' : 'EXTERNAL_AIR',
      absorption: 0.60,
      emissivity: 0.90,
    };
    saveXmlBuildingModel({
      ...currentModel,
      opaqueSurfaces: [...currentModel.opaqueSurfaces, newSurf],
    });
    setSyncSuccessMsg(`Προστέθηκε νέο 2.Αδιαφανές Στοιχείο (${typeLabel}) στο XML με U = ${U_calculated.toFixed(3)} W/m²K!`);
    setTimeout(() => setSyncSuccessMsg(null), 4000);
  };

  const handleApplyWindowToXml = () => {
    const currentModel = getXmlBuildingModel();
    const newWin: OpeningInput = {
      id: `win-calc-${Date.now()}`,
      name: `Κούφωμα ${winWidth}x${winHeight}m (U_w=${calculatedUw.toFixed(2)})`,
      area: Number(windowArea.toFixed(2)),
      uWindow: Number(calculatedUw.toFixed(2)),
      gGlass: uGlass <= 1.2 ? 0.60 : 0.75,
      vInfiltration: 4.0,
      frameRatio: frameRatio,
      orientation: 'S',
      fOvH: Number(fOvWinter.toFixed(2)),
      fOvC: Number(fOvSummer.toFixed(2)),
      fFinH: 1.0,
      fFinC: 1.0,
      fHorH: 1.0,
      fHorC: 1.0,
      fShC: 0.50,
    };
    saveXmlBuildingModel({
      ...currentModel,
      openings: [...currentModel.openings, newWin],
    });
    setSyncSuccessMsg(`Προστέθηκε νέο 3.Διαφανές Στοιχείο στο XML με U_w = ${calculatedUw.toFixed(2)} W/m²K & Εμβαδόν = ${windowArea.toFixed(2)}m²!`);
    setTimeout(() => setSyncSuccessMsg(null), 4000);
  };

  const handleApplyBoilerToXml = () => {
    const currentModel = getXmlBuildingModel();
    const updatedHeating = currentModel.heatingSystems.map((sys, idx) => {
      if (idx === 0) {
        return {
          ...sys,
          nominalPowerKw: pNominal,
          efficiency: Number(adjustedBoilerEff.toFixed(3)),
        };
      }
      return sys;
    });
    saveXmlBuildingModel({
      ...currentModel,
      heatingSystems: updatedHeating,
    });
    setSyncSuccessMsg(`Ενημερώθηκε το Σύστημα Θέρμανσης στο XML με η_g = ${(adjustedBoilerEff * 100).toFixed(1)}% (P_n=${pNominal}kW)!`);
    setTimeout(() => setSyncSuccessMsg(null), 4000);
  };

  const handleApplyGeometryToXml = () => {
    const currentModel = getXmlBuildingModel();
    saveXmlBuildingModel({
      ...currentModel,
      grossArea: Number(grossAreaCalc.toFixed(2)),
      netArea: Number(netAreaCalc.toFixed(2)),
      heatedVolume: Number(heatedVolumeCalc.toFixed(2)),
    });
    setSyncSuccessMsg(`Ενημερώθηκαν τα Εμβαδά (A_gross=${grossAreaCalc.toFixed(1)}m², A_net=${netAreaCalc.toFixed(1)}m²) & Όγκος (V=${heatedVolumeCalc.toFixed(1)}m³) στο XML!`);
    setTimeout(() => setSyncSuccessMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Real-time Sync Banner */}
      {syncSuccessMsg && (
        <div className="p-4 bg-teal-500/15 border-2 border-teal-500/40 rounded-2xl text-xs text-teal-800 dark:text-teal-200 flex items-center justify-between gap-3 shadow-md animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-teal-500 shrink-0" />
            <span className="font-bold text-sm">{syncSuccessMsg}</span>
          </div>
          <span className="text-[10px] font-mono font-semibold uppercase px-2 py-1 bg-teal-500/20 rounded border border-teal-500/30">
            XML Model Updated
          </span>
        </div>
      )}
      {/* Sub-nav Selector */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto shadow-sm">
        <button
          onClick={() => setActiveCalc('U_BUILDER')}
          type="button"
          className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
            activeCalc === 'U_BUILDER'
              ? 'bg-teal-600 text-white shadow'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>1. Υπολογιστής U-Value Τοίχου / Δώματος</span>
        </button>

        <button
          onClick={() => setActiveCalc('U_WINDOW')}
          type="button"
          className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
            activeCalc === 'U_WINDOW'
              ? 'bg-teal-600 text-white shadow'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <Maximize2 className="w-4 h-4" />
          <span>2. Υπολογιστής U_w Κουφώματος</span>
        </button>

        <button
          onClick={() => setActiveCalc('BOILER_OVERSIZING')}
          type="button"
          className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
            activeCalc === 'BOILER_OVERSIZING'
              ? 'bg-teal-600 text-white shadow'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>3. Υπερδιαστασιολόγηση Λέβητα (η_g1)</span>
        </button>

        <button
          onClick={() => setActiveCalc('GEOMETRY')}
          type="button"
          className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
            activeCalc === 'GEOMETRY'
              ? 'bg-teal-600 text-white shadow'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>4. Υπολογιστής Γεωμετρίας & Σκιάσεων Κτιρίου</span>
        </button>
      </div>

      {/* CALCULATOR 1: U-VALUE BUILDER */}
      {activeCalc === 'U_BUILDER' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-teal-600" />
                Υπολογιστής Θερμοπερατότητας U Δομικού Στοιχείου
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Προσθέστε στρώσεις υλικών για να υπολογίσετε το συνολικό U [W/m²K] κατά ISO 6946 και να ελέγξετε τη συμμόρφωση με τον ΚΕΝΑΚ.
              </p>
            </div>

            {/* Config Selectors */}
            <div className="flex items-center gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Τύπος Στοιχείου:</label>
                <select
                  value={elementType}
                  onChange={(e: any) => setElementType(e.target.value)}
                  className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 font-semibold focus:outline-none"
                >
                  <option value="WALL">Εξωτερικός Τοίχος</option>
                  <option value="ROOF">Δώμα / Οροφή</option>
                  <option value="FLOOR_PILOTI">Δάπεδο Πυλωτής</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Κλιματική Ζώνη:</label>
                <select
                  value={climateZone}
                  onChange={(e: any) => setClimateZone(e.target.value)}
                  className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 font-bold focus:outline-none"
                >
                  <option value="A">Ζώνη Α (Κρήτη/Νήσοι)</option>
                  <option value="B">Ζώνη Β (Αττική/Πελ.)</option>
                  <option value="G">Ζώνη Γ (Μακεδονία)</option>
                  <option value="D">Ζώνη Δ (Ορεινά)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Result Box */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-900 text-white rounded-xl space-y-1">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Υπολογισμένο U</span>
              <div className="text-2xl font-bold font-mono text-teal-400">
                {U_calculated.toFixed(3)} <span className="text-sm font-normal text-slate-300">W/m²K</span>
              </div>
              <div className="pt-1">
                <ValueCopyBadge value={U_calculated.toFixed(3)} label="Αντιγραφή U" />
              </div>
            </div>

            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl space-y-1">
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase">Όριο ΚΕΝΑΚ (Ζώνη {climateZone})</span>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
                {currentKenakLimit.toFixed(2)} <span className="text-sm font-normal text-slate-500">W/m²K</span>
              </div>
              <p className="text-[11px] text-slate-500">Μέγιστη επιτρεπόμενη τιμή</p>
            </div>

            <div className={`p-4 rounded-xl border flex items-center gap-3 ${
              isUCompliant
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
            }`}>
              {isUCompliant ? (
                <>
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
                  <div>
                    <div className="font-bold text-sm">Συμμορφώνεται με ΚΕΝΑΚ</div>
                    <p className="text-xs opacity-90">Το U είναι χαμηλότερο από το όριο της Ζώνης {climateZone}.</p>
                  </div>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-8 h-8 text-rose-600 shrink-0" />
                  <div>
                    <div className="font-bold text-sm">Υπέρβαση Ορίου ΚΕΝΑΚ!</div>
                    <p className="text-xs opacity-90">Απαιτείται επιπλέον πάχος θερμομόνωσης.</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Direct Transfer Button to XML */}
          <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-xl flex items-center justify-between gap-3 text-xs">
            <span className="text-teal-800 dark:text-teal-200 font-medium">
              Θέλετε να καταχωρίσετε το U = <strong className="font-mono">{U_calculated.toFixed(3)} W/m²K</strong> στα Αδιαφανή στοιχεία του κτιρίου;
            </span>
            <button
              onClick={handleApplyUToXml}
              type="button"
              className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg shadow transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Εφαρμογή ως 2.Αδιαφανές στο XML</span>
            </button>
          </div>

          {/* Layer Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Στρώσεις Υλικών (από έξω προς τα μέσα)
              </h4>

              {/* Add Material Select */}
              <div className="flex items-center gap-2">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddLayer(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 font-medium focus:outline-none"
                >
                  <option value="">+ Προσθήκη Υλικού από Βάση ΤΟΤΕΕ...</option>
                  {MATERIALS_DATABASE.map((mat) => (
                    <option key={mat.id} value={mat.id}>
                      {mat.name} (λ={mat.lambda})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] uppercase">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Υλικό Στρώσης</th>
                    <th className="p-3">Πάχος d [cm]</th>
                    <th className="p-3">λ [W/mK]</th>
                    <th className="p-3">Αντίσταση R [m²K/W]</th>
                    <th className="p-3 text-right">Ενέργεια</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-500 font-mono italic text-[11px]">
                    <td className="p-3">-</td>
                    <td className="p-3">Εξωτερική Αντίσταση Επιφάνειας (R_se)</td>
                    <td className="p-3">-</td>
                    <td className="p-3">-</td>
                    <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">{R_se.toFixed(2)}</td>
                    <td className="p-3"></td>
                  </tr>

                  {layersThermalResistance.map((layer, idx) => (
                    <tr key={layer.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
                      <td className="p-3 font-mono font-bold">{idx + 1}</td>
                      <td className="p-3 font-medium text-slate-900 dark:text-slate-100">{layer.name}</td>
                      <td className="p-3">
                        <input
                          type="number"
                          step="0.5"
                          min="0.1"
                          value={layer.thicknessCm}
                          onChange={(e) => handleUpdateLayer(layer.id, parseFloat(e.target.value) || 0, layer.lambda)}
                          className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono font-bold"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          step="0.001"
                          min="0.01"
                          value={layer.lambda}
                          onChange={(e) => handleUpdateLayer(layer.id, layer.thicknessCm, parseFloat(e.target.value) || 0.01)}
                          className="w-20 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono"
                        />
                      </td>
                      <td className="p-3 font-mono font-semibold text-teal-700 dark:text-teal-400">
                        {layer.R.toFixed(3)}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleRemoveLayer(layer.id)}
                          type="button"
                          className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}

                  <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-500 font-mono italic text-[11px]">
                    <td className="p-3">-</td>
                    <td className="p-3">Εσωτερική Αντίσταση Επιφάνειας (R_si)</td>
                    <td className="p-3">-</td>
                    <td className="p-3">-</td>
                    <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">{R_si.toFixed(2)}</td>
                    <td className="p-3"></td>
                  </tr>
                </tbody>
                <tfoot className="bg-slate-100 dark:bg-slate-800 font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                  <tr>
                    <td colSpan={4} className="p-3 text-right">Συνολική Θερμική Αντίσταση (R_total):</td>
                    <td className="p-3 text-teal-600 dark:text-teal-400">{R_total.toFixed(3)} m²K/W</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CALCULATOR 2: WINDOW U_w */}
      {activeCalc === 'U_WINDOW' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Maximize2 className="w-5 h-5 text-teal-600" />
              Υπολογιστής Συντελεστή Θερμοπερατότητας U_w Κουφώματος
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Υπολογίστε τον συνολικό συντελεστή U_w [W/m²K] συνδυάζοντας τον υαλοπίνακα (U_g), το πλαίσιο (U_f) και τον θερμοδιακοπτόμενο αποστάτη (Ψ_g).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Inputs */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Πλάτος W [m]:</label>
                  <input
                    type="number"
                    step="0.05"
                    value={winWidth}
                    onChange={(e) => setWinWidth(parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Ύψος H [m]:</label>
                  <input
                    type="number"
                    step="0.05"
                    value={winHeight}
                    onChange={(e) => setWinHeight(parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">U_g Υαλοπίνακα [W/m²K]:</label>
                <input
                  type="number"
                  step="0.1"
                  value={uGlass}
                  onChange={(e) => setUGlass(parseFloat(e.target.value) || 1)}
                  className="w-full px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono font-bold"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Μονό: 5.7, Διπλό απλό: 2.8, Low-E Argon: 1.1 W/m²K</p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">U_f Πλαισίου / Προφίλ [W/m²K]:</label>
                <input
                  type="number"
                  step="0.1"
                  value={uFrame}
                  onChange={(e) => setUFrame(parseFloat(e.target.value) || 1)}
                  className="w-full px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono font-bold"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Ξύλο: 2.0-2.5, PVC: 1.3-1.6, Αλουμίνιο θερμοδιακοπτόμενο: 2.2-2.8</p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Ποσοστό Πλαισίου F_f:</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.1"
                  max="0.5"
                  value={frameRatio}
                  onChange={(e) => setFrameRatio(parseFloat(e.target.value) || 0.2)}
                  className="w-full px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono font-bold"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Τυπική τιμή: 0.20 - 0.30 (20% - 30%)</p>
              </div>
            </div>

            {/* Results Output */}
            <div className="p-6 bg-slate-900 text-white rounded-xl space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-xs font-mono text-teal-400 uppercase tracking-wider">Υπολογισμός U_w</span>
                <div className="text-3xl font-bold font-mono text-teal-400">
                  {calculatedUw.toFixed(2)} <span className="text-base font-normal text-slate-300">W/m²K</span>
                </div>
                <p className="text-xs text-slate-300">
                  Συνολική Επιφάνεια Ανοίγματος: <span className="font-mono font-semibold">{windowArea.toFixed(2)} m²</span>
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-2">
                <ValueCopyBadge value={calculatedUw.toFixed(2)} label="Αντιγραφή U_w στο Πρόχειρο" />
                <button
                  onClick={handleApplyWindowToXml}
                  type="button"
                  className="w-full py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>Εφαρμογή ως 3.Διαφανές στο XML</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CALCULATOR 3: BOILER OVERSIZING */}
      {activeCalc === 'BOILER_OVERSIZING' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500" />
              Υπολογισμός Υπερδιαστασιολόγησης Λέβητα (P_m / P_n & η_g1)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Υπολογίστε τον μειωμένο βαθμό απόδοσης λέβητα λόγω υπερδιαστασιολόγησης σύμφωνα με την ΤΟΤΕΕ 20701-1.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Ονομαστική Ισχύς Λέβητα P_n [kW]:</label>
                <input
                  type="number"
                  value={pNominal}
                  onChange={(e) => setPNominal(parseFloat(e.target.value) || 1)}
                  className="w-full px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Απαιτούμενη Ισχύς Θέρμανσης P_req [kW]:</label>
                <input
                  type="number"
                  value={pRequired}
                  onChange={(e) => setPRequired(parseFloat(e.target.value) || 1)}
                  className="w-full px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Ονομαστικός Βαθμός Απόδοσης η_g (δεκαδικός):</label>
                <input
                  type="number"
                  step="0.01"
                  value={boilerAge}
                  onChange={(e) => setBoilerAge(parseFloat(e.target.value) || 0.8)}
                  className="w-full px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono font-bold"
                />
              </div>
            </div>

            <div className="p-6 bg-slate-900 text-white rounded-xl space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-mono text-slate-400">Λόγος Υπερδιαστασιολόγησης P_n / P_req</span>
                  <div className="text-2xl font-bold font-mono text-amber-400">
                    {oversizingRatio.toFixed(2)}x
                  </div>
                </div>

                <div>
                  <span className="text-xs font-mono text-slate-400">Διορθωμένος Βαθμός Απόδοσης η_g1</span>
                  <div className="text-3xl font-bold font-mono text-teal-400">
                    {(adjustedBoilerEff * 100).toFixed(1)}% <span className="text-sm font-normal text-slate-300">({adjustedBoilerEff.toFixed(3)})</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-2">
                <ValueCopyBadge value={adjustedBoilerEff.toFixed(3)} label="Αντιγραφή η_g1" />
                <button
                  onClick={handleApplyBoilerToXml}
                  type="button"
                  className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>Ενημέρωση η_g στο Σύστημα Θέρμανσης XML</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CALCULATOR 4: BUILDING GEOMETRY & SHADING */}
      {activeCalc === 'GEOMETRY' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-teal-600" />
              Υπολογισμός Γεωμετρικών Στοιχείων Κτιρίου & Σκιάσεων (ΤΟΤΕΕ 20701-1)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Υπολογίστε αυτόματα το Μικτό/Καθαρό Εμβαδόν, τον Θερμαινόμενο Όγκο, τη Συμπαγότητα $A/V$ και τους Συντελεστές Σκίασης Προβόλου.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
            {/* Inputs Panel */}
            <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
                1. Διαστάσεις Κτιρίου / Θερμικής Ζώνης
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Μήκος $L$ [m]:</label>
                  <input
                    type="number"
                    step="0.1"
                    value={bLength}
                    onChange={(e) => setBLength(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Πλάτος $W$ [m]:</label>
                  <input
                    type="number"
                    step="0.1"
                    value={bWidth}
                    onChange={(e) => setBWidth(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Μικτό Ύψος h_gross [m]:</label>
                  <input
                    type="number"
                    step="0.1"
                    value={bHeightGross}
                    onChange={(e) => setBHeightGross(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Πάχος Τοίχων [m]:</label>
                  <input
                    type="number"
                    step="0.01"
                    value={wallThickness}
                    onChange={(e) => setWallThickness(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono font-bold"
                  />
                </div>
              </div>

              <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] pt-2">
                2. Κουφώματα & Πρόβολος Σκίασης
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Συνολικό Εμβαδόν Παραθύρων [m²]:</label>
                  <input
                    type="number"
                    step="0.5"
                    value={windowsTotalArea}
                    onChange={(e) => setWindowsTotalArea(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Βάθος Προβόλου $D$ [m]:</label>
                  <input
                    type="number"
                    step="0.1"
                    value={overhangDepth}
                    onChange={(e) => setOverhangDepth(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Results Panel */}
            <div className="p-5 bg-slate-900 text-white rounded-xl space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <h4 className="text-xs font-mono font-bold text-teal-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                  Υπολογισμένα Γεωμετρικά Μεγέθη
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                    <span className="text-[10px] text-slate-400 block font-mono">Μικτό Εμβαδόν A_gross</span>
                    <span className="text-xl font-bold font-mono text-teal-300">{grossAreaCalc.toFixed(2)} m²</span>
                    <div className="mt-1">
                      <ValueCopyBadge value={grossAreaCalc.toFixed(2)} label="Αντιγραφή A_gross" />
                    </div>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                    <span className="text-[10px] text-slate-400 block font-mono">Καθαρό Εμβαδόν A_net</span>
                    <span className="text-xl font-bold font-mono text-teal-300">{netAreaCalc.toFixed(2)} m²</span>
                    <div className="mt-1">
                      <ValueCopyBadge value={netAreaCalc.toFixed(2)} label="Αντιγραφή A_net" />
                    </div>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                    <span className="text-[10px] text-slate-400 block font-mono">Θερμαινόμενος Όγκος V</span>
                    <span className="text-xl font-bold font-mono text-amber-300">{heatedVolumeCalc.toFixed(2)} m³</span>
                    <div className="mt-1">
                      <ValueCopyBadge value={heatedVolumeCalc.toFixed(2)} label="Αντιγραφή V" />
                    </div>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                    <span className="text-[10px] text-slate-400 block font-mono">Συντελεστής Συμπαγότητας A/V</span>
                    <span className="text-xl font-bold font-mono text-emerald-300">{compactnessAV.toFixed(3)} m⁻¹</span>
                    <div className="mt-1">
                      <ValueCopyBadge value={compactnessAV.toFixed(3)} label="Αντιγραφή A/V" />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/80 space-y-1">
                  <span className="text-[10px] text-slate-400 block font-mono">Καθαρό Εμβαδόν Αδιαφανών Τοίχων (μετά αφαιρεμένων παραθύρων)</span>
                  <div className="text-lg font-bold font-mono text-sky-300">
                    {netWallAreaCalc.toFixed(2)} m² <span className="text-xs font-normal text-slate-400">(Μικτό: {grossWallAreaCalc.toFixed(2)} m²)</span>
                  </div>
                  <ValueCopyBadge value={netWallAreaCalc.toFixed(2)} label="Αντιγραφή A_opaque_net" />
                </div>

                <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/80 space-y-1">
                  <span className="text-[10px] text-slate-400 block font-mono">Συντελεστής Σκίασης Προβόλου F_ov (Εκτίμηση ΤΟΤΕΕ)</span>
                  <div className="flex items-center gap-4 text-xs font-mono font-bold">
                    <span className="text-amber-300">Χειμώνας (F_ov_h): {fOvWinter.toFixed(2)}</span>
                    <span className="text-emerald-300">Θέρος (F_ov_c): {fOvSummer.toFixed(2)}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleApplyGeometryToXml}
                    type="button"
                    className="w-full py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                  >
                    <Save className="w-4 h-4" />
                    <span>Ενημέρωση Εμβαδών & Όγκου στο XML</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

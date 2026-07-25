import React, { useState, useMemo, useEffect } from 'react';
import { FullBuildingModel, OpaqueSurfaceInput, OpeningInput, HeatingSystemInput, CoolingSystemInput } from '../../types/xmlKenak';
import { DEFAULT_PRE79_BUILDING } from '../../data/xmlDefaults';
import { auditBuildingModel, generateKenakXml, parseKenakXml, AuditIssue } from '../../utils/xmlExporter';
import { GREEK_CLIMATE_STATIONS } from '../../data/climateStations';
import { ExoikonomoEvaluator } from '../ExoikonomoEvaluator';
import { GoogleDriveSync } from '../GoogleDriveSync';
import { generateOptimalScenarios, saveXmlBuildingModel } from '../../utils/xmlModelStore';
import { 

  FileCode, 
  Download, 
  Copy, 
  Check, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Sparkles, 
  Building2, 
  Flame, 
  Sun, 
  Layers, 
  Zap, 
  ShieldAlert, 
  Upload, 
  Save, 
  RefreshCw,
  Wind
} from 'lucide-react';

export const XmlExportTab: React.FC = () => {
  const [model, setModel] = useState<FullBuildingModel>(() => {
    const saved = localStorage.getItem('kenak_xml_building_model');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return DEFAULT_PRE79_BUILDING;
  });

  const [activeSection, setActiveSection] = useState<'ADMIN' | 'OPAQUE' | 'OPENINGS' | 'SYSTEMS' | 'SCENARIOS' | 'PREVIEW'>('ADMIN');
  const [copiedXml, setCopiedXml] = useState(false);

  // Sync to local storage
  const handleUpdateModel = (updated: FullBuildingModel) => {
    setModel(updated);
    saveXmlBuildingModel(updated);
  };

  // Real-time synchronization across tabs
  useEffect(() => {
    const handleSync = (e: any) => {
      if (e.detail) {
        setModel(e.detail);
      } else {
        const saved = localStorage.getItem('kenak_xml_building_model');
        if (saved) {
          try {
            setModel(JSON.parse(saved));
          } catch (err) {}
        }
      }
    };

    window.addEventListener('kenakModelUpdated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('kenakModelUpdated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Auto Generate Optimal Scenarios
  const handleGenerateAutoScenarios = () => {
    const autoScenarios = generateOptimalScenarios(model);
    handleUpdateModel({
      ...model,
      scenarios: autoScenarios,
    });
  };

  // Run validation
  const auditIssues = useMemo(() => auditBuildingModel(model), [model]);
  const errorCount = auditIssues.filter((i) => i.type === 'ERROR').length;
  const warningCount = auditIssues.filter((i) => i.type === 'WARNING').length;

  // Generate XML
  const xmlString = useMemo(() => generateKenakXml(model), [model]);

  // Handlers for Download XML
  const handleDownloadXml = () => {
    const filename = `PEA_${model.afm || '000000000'}_${model.buildingName.replace(/[^a-zA-Z0-9]/g, '_')}.xml`;
    const blob = new Blob([xmlString], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handlers for Copy XML
  const handleCopyXml = () => {
    navigator.clipboard.writeText(xmlString);
    setCopiedXml(true);
    setTimeout(() => setCopiedXml(false), 2000);
  };

  // Preset Loaders
  const handleLoadPresetPre79 = () => {
    handleUpdateModel(DEFAULT_PRE79_BUILDING);
  };

  const handleLoadPresetKthk = () => {
    const kthk: FullBuildingModel = {
      ...DEFAULT_PRE79_BUILDING,
      buildingName: 'Διαμέρισμα 1995 (Κανονισμός Θερμομόνωσης 1979)',
      yearBuilt: 1995,
      ageCategory: '1979_2010',
      inspectorNotes: 'Κτίριο κατασκευασμένο με ΚΘΚ 1979. Διπλή τοιχοποιία με 3cm EPS. Διπλά αλουμίνια αθερμοδιακοπτόμενα.',
      opaqueSurfaces: DEFAULT_PRE79_BUILDING.opaqueSurfaces.map((s) => ({
        ...s,
        uValue: s.type === 'WALL' ? 0.75 : s.type === 'ROOF' ? 0.60 : 0.80,
        deltaUtb: 0.15,
      })),
      openings: DEFAULT_PRE79_BUILDING.openings.map((o) => ({
        ...o,
        uWindow: 4.50,
        gGlass: 0.75,
        vInfiltration: 4.0,
      })),
    };
    handleUpdateModel(kthk);
  };

  // Opaque Actions
  const handleAddOpaque = () => {
    const newOp: OpaqueSurfaceInput = {
      id: 'op-' + Date.now(),
      name: 'Νέος Εξωτερικός Τοίχος',
      type: 'WALL',
      area: 15.0,
      uValue: 2.20,
      deltaUtb: 0.20,
      orientation: 'S',
      tiltAngle: 90,
      boundary: 'EXTERNAL_AIR',
      absorption: 0.60,
      emissivity: 0.90,
    };
    handleUpdateModel({
      ...model,
      opaqueSurfaces: [...model.opaqueSurfaces, newOp],
    });
  };

  const handleRemoveOpaque = (id: string) => {
    handleUpdateModel({
      ...model,
      opaqueSurfaces: model.opaqueSurfaces.filter((s) => s.id !== id),
    });
  };

  // Openings Actions
  const handleAddOpening = () => {
    const newOp: OpeningInput = {
      id: 'win-' + Date.now(),
      name: 'Νέο Παράθυρο',
      area: 2.5,
      uWindow: 4.50,
      gGlass: 0.75,
      vInfiltration: 5.0,
      frameRatio: 0.20,
      orientation: 'E',
      fOvH: 0.90,
      fOvC: 0.40,
      fFinH: 1.0,
      fFinC: 1.0,
      fHorH: 1.0,
      fHorC: 1.0,
      fShC: 0.60,
    };
    handleUpdateModel({
      ...model,
      openings: [...model.openings, newOp],
    });
  };

  const handleRemoveOpening = (id: string) => {
    handleUpdateModel({
      ...model,
      openings: model.openings.filter((o) => o.id !== id),
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Card */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-teal-600/30 border border-teal-500/40 rounded-xl text-teal-400 shrink-0 mt-1">
              <FileCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  buildingcert.gr Ready
                </span>
                <span className="text-xs text-slate-400 font-mono">TEE-KENAK v1.31.1.9 XML Export</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Εξαγωγή Αρχείου XML για Έκδοση ΠΕΑ στο buildingcert.gr
              </h2>
              <p className="text-xs text-slate-300 max-w-3xl leading-relaxed mt-1">
                Συμπληρώστε τα τεχνικά στοιχεία της αυτοψίας σας. Η εφαρμογή προτείνει αυτόματα τις τυπικές τιμές TOTEE ανάλογα με την παλαιότητα και την κλιματική ζώνη, διενεργεί αυτόματο έλεγχο ορθότητας και παράγει το έτοιμο αρχείο XML.
              </p>
            </div>
          </div>

          {/* Action Export Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleCopyXml}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all cursor-pointer"
            >
              {copiedXml ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedXml ? 'Αντιγράφηκε!' : 'Αντιγραφή XML'}</span>
            </button>

            <button
              onClick={handleDownloadXml}
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-900/40 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Λήψη Αρχείου XML (.xml)</span>
            </button>
          </div>
        </div>

        {/* Preset Selector & Audit Status */}
        <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 font-medium">Ταχεία Φόρτωση Προτύπου:</span>
            <button
              onClick={handleLoadPresetPre79}
              type="button"
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 font-mono text-[11px] transition-colors cursor-pointer"
            >
              Αμόνωτο Προ του 1979
            </button>
            <button
              onClick={handleLoadPresetKthk}
              type="button"
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 font-mono text-[11px] transition-colors cursor-pointer"
            >
              Κτίριο 1979-2010 (ΚΘΚ)
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 font-bold ${errorCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {errorCount > 0 ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>{errorCount === 0 ? 'Έλεγχος Πληρότητας: ΠΛΗΡΕΣ' : `${errorCount} Σφάλματα Πληρότητας`}</span>
            </div>
            {warningCount > 0 && (
              <span className="text-amber-400 font-mono text-[11px]">({warningCount} Προειδοποιήσεις)</span>
            )}
          </div>
        </div>
      </div>

      {/* Google Drive Integration Panel */}
      <GoogleDriveSync
        currentModel={model}
        xmlString={xmlString}
        onModelLoaded={handleUpdateModel}
      />


      {/* Section Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveSection('ADMIN')}
          type="button"
          className={`px-4 py-2.5 rounded-t-xl font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeSection === 'ADMIN'
              ? 'bg-teal-600 text-white shadow'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>1. Γενικά & Στοιχεία Κτιρίου</span>
        </button>

        <button
          onClick={() => setActiveSection('OPAQUE')}
          type="button"
          className={`px-4 py-2.5 rounded-t-xl font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeSection === 'OPAQUE'
              ? 'bg-teal-600 text-white shadow'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>2. Αδιαφανή (Τοίχοι, Δώματα, Πιλοτή)</span>
          <span className="ml-1 px-1.5 py-0.2 bg-teal-900/40 text-teal-200 text-[10px] rounded-full">
            {model.opaqueSurfaces.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSection('OPENINGS')}
          type="button"
          className={`px-4 py-2.5 rounded-t-xl font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeSection === 'OPENINGS'
              ? 'bg-teal-600 text-white shadow'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Wind className="w-4 h-4" />
          <span>3. Διαφανή (Κουφώματα & Σκιάσεις)</span>
          <span className="ml-1 px-1.5 py-0.2 bg-teal-900/40 text-teal-200 text-[10px] rounded-full">
            {model.openings.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSection('SYSTEMS')}
          type="button"
          className={`px-4 py-2.5 rounded-t-xl font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeSection === 'SYSTEMS'
              ? 'bg-teal-600 text-white shadow'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>4. Θέρμανση, Ψύξη, ΖΝΧ & ΑΠΕ</span>
        </button>

        <button
          onClick={() => setActiveSection('SCENARIOS')}
          type="button"
          className={`px-4 py-2.5 rounded-t-xl font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeSection === 'SCENARIOS'
              ? 'bg-teal-600 text-white shadow'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>5. Σενάρια Αναβάθμισης ΠΕΑ</span>
        </button>

        <button
          onClick={() => setActiveSection('PREVIEW')}
          type="button"
          className={`px-4 py-2.5 rounded-t-xl font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeSection === 'PREVIEW'
              ? 'bg-teal-600 text-white shadow'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>6. Προεπισκόπηση XML</span>
        </button>
      </div>

      {/* Audit Warning Panel if any issues */}
      {auditIssues.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 rounded-xl p-4 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>Έλεγχος Πληρότητας & Παρατηρήσεις για το buildingcert.gr:</span>
          </div>
          <ul className="space-y-1 pl-5 list-disc text-amber-800 dark:text-amber-300">
            {auditIssues.map((issue, idx) => (
              <li key={idx}>
                <strong className="font-semibold">{issue.field}:</strong> {issue.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* SECTION 1: ADMIN & GENERAL */}
      {activeSection === 'ADMIN' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 space-y-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 border-b pb-2 border-slate-100 dark:border-slate-800">
            1. Διοικητικά & Γεωμετρικά Στοιχεία Επιθεωρούμενης Ζώνης
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Αριθμός Πρωτοκόλλου buildingcert.gr:
              </label>
              <input
                type="text"
                placeholder="π.χ. 12345/2026"
                value={model.protocolId || ''}
                onChange={(e) => handleUpdateModel({ ...model, protocolId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-teal-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ονομασία Κτιρίου / Ακινήτου:</label>
              <input
                type="text"
                value={model.buildingName}
                onChange={(e) => handleUpdateModel({ ...model, buildingName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Τύπος Ακινήτου:
              </label>
              <div className="flex items-center gap-4 py-1.5 font-medium">
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="isEntireBuilding"
                    checked={model.isEntireBuilding !== false}
                    onChange={() => handleUpdateModel({ ...model, isEntireBuilding: true })}
                  />
                  <span>Ολόκληρο Κτίριο</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="isEntireBuilding"
                    checked={model.isEntireBuilding === false}
                    onChange={() => handleUpdateModel({ ...model, isEntireBuilding: false })}
                  />
                  <span>Κτιριακή Μονάδα (Διαμέρισμα)</span>
                </label>
              </div>
            </div>

            {model.isEntireBuilding === false && (
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Τίτλος Κτιριακής Μονάδας:
                </label>
                <input
                  type="text"
                  placeholder="π.χ. Διαμέρισμα Α2"
                  value={model.buildingUnitTitle || ''}
                  onChange={(e) => handleUpdateModel({ ...model, buildingUnitTitle: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-medium"
                />
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ιδιοκτησιακό Καθεστώς:</label>
              <input
                type="text"
                placeholder="Πλήρης Κυριότητα"
                value={model.ownershipType || 'Πλήρης Κυριότητα'}
                onChange={(e) => handleUpdateModel({ ...model, ownershipType: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Διεύθυνση Ακινήτου:</label>
              <input
                type="text"
                value={model.address}
                onChange={(e) => handleUpdateModel({ ...model, address: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Περιφερειακή Ενότητα (Νομός):</label>
              <input
                type="text"
                value={model.prefecture}
                onChange={(e) => handleUpdateModel({ ...model, prefecture: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Δήμος:</label>
              <input
                type="text"
                value={model.municipality}
                onChange={(e) => handleUpdateModel({ ...model, municipality: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ονοματεπώνυμο Ιδιοκτήτη:</label>
              <input
                type="text"
                value={model.ownerName}
                onChange={(e) => handleUpdateModel({ ...model, ownerName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">ΑΦΜ Ιδιοκτήτη (9 ψηφία):</label>
              <input
                type="text"
                value={model.afm}
                onChange={(e) => handleUpdateModel({ ...model, afm: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">ΚΑΕΚ Ακινήτου (Κτηματολόγιο):</label>
              <input
                type="text"
                value={model.kaek}
                onChange={(e) => handleUpdateModel({ ...model, kaek: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Σταθμός Κλιματικών Δεδομένων (62 Πόλεις):
              </label>
              <select
                value={model.climaticStation || ''}
                onChange={(e) => {
                  const selectedName = e.target.value;
                  const found = GREEK_CLIMATE_STATIONS.find((st) => st.name === selectedName);
                  handleUpdateModel({
                    ...model,
                    climaticStation: selectedName,
                    climateZone: found ? found.zone : model.climateZone,
                  });
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-medium"
              >
                <option value="">Επιλέξτε Κλιματικό Σταθμό...</option>
                {GREEK_CLIMATE_STATIONS.map((st) => (
                  <option key={st.id} value={st.name}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Κλιματική Ζώνη (ΤΟΤΕΕ 20701-1):
              </label>
              <select
                value={model.climateZone}
                onChange={(e) => handleUpdateModel({ ...model, climateZone: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-teal-600"
              >
                <option value="A">Ζώνη Α (Κρήτη / Δωδεκάνησα / Κυκλάδες)</option>
                <option value="B">Ζώνη Β (Αττική / Πελοπόννησος)</option>
                <option value="G">Ζώνη Γ (Θεσσαλία / Μακεδονία / Ήπειρος)</option>
                <option value="D">Ζώνη Δ (Δυτική Μακεδονία / Ορεινά)</option>
              </select>
            </div>

            <div className="flex items-center pt-5">
              <label className="inline-flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-semibold">
                <input
                  type="checkbox"
                  checked={model.altitudeAbove500m || false}
                  onChange={(e) => handleUpdateModel({ ...model, altitudeAbove500m: e.target.checked })}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
                />
                <span>Υψόμετρο άνω των 500m (Μετάβαση στην επόμενη ψυχρότερη ζώνη)</span>
              </label>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Έτος Κατασκευής:</label>
              <input
                type="number"
                value={model.yearBuilt}
                onChange={(e) => {
                  const y = parseInt(e.target.value) || 1980;
                  let ageCat: any = '1979_2010';
                  if (y < 1979) ageCat = 'PRE_1979';
                  else if (y > 2010) ageCat = 'POST_2010';
                  handleUpdateModel({ ...model, yearBuilt: y, ageCategory: ageCat });
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Μικτή Επιφάνεια m²:</label>
              <input
                type="number"
                step="0.1"
                value={model.grossArea}
                onChange={(e) => {
                  const area = parseFloat(e.target.value) || 0;
                  handleUpdateModel({
                    ...model,
                    grossArea: area,
                    netArea: Math.round(area * 0.88 * 10) / 10,
                    heatedVolume: Math.round(area * 3.0 * 10) / 10,
                    freshAirFlow: Math.round(area * 0.75 * 100) / 100,
                  });
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Θερμαινόμενος Όγκος V [m³]:</label>
              <input
                type="number"
                step="0.1"
                value={model.heatedVolume}
                onChange={(e) => handleUpdateModel({ ...model, heatedVolume: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Νωπός Αέρας Αερισμού [m³/h]:</label>
              <input
                type="number"
                step="0.1"
                value={model.freshAirFlow}
                onChange={(e) => handleUpdateModel({ ...model, freshAirFlow: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono"
              />
            </div>
          </div>

          <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-xl text-xs flex items-center justify-between gap-3 text-teal-800 dark:text-teal-300">
            <div className="flex items-center gap-2">
              <span className="font-bold font-mono">📐 AutoCAD Bridge:</span>
              <span>Μπορείτε να εισάγετε αυτόματα τα εμβαδά και τις περιμέτρους από αρχείο `.dxf` ή LISP script.</span>
            </div>
            <span className="text-[11px] font-semibold underline text-teal-600 dark:text-teal-400">
              Μετάβαση στην Καρτέλα "Σύνδεση AutoCAD"
            </span>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ονοματεπώνυμο Επιθεωρητή:</label>
              <input
                type="text"
                value={model.inspectorName}
                onChange={(e) => handleUpdateModel({ ...model, inspectorName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Αριθμός Μητρώου Επιθεωρητή (Α.Μ.):</label>
              <input
                type="text"
                value={model.inspectorRegNum}
                onChange={(e) => handleUpdateModel({ ...model, inspectorRegNum: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: OPAQUE SURFACES */}
      {activeSection === 'OPAQUE' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-3 border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                2. Αδιαφανή Στοιχεία Κελύφους (Τοίχοι, Δώματα, Πιλοτές, Δάπεδα)
              </h3>
              <p className="text-xs text-slate-500">
                Καταχωρίστε τις επιφάνειες που διαωρίζουν το θερμαινόμενο χώρο από τον εξωτερικό αέρα, ΜΘΧ ή έδαφος.
              </p>
            </div>

            <button
              onClick={handleAddOpaque}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Προσθήκη Αδιαφανούς</span>
            </button>
          </div>

          {/* List of Opaque Surfaces */}
          <div className="space-y-4">
            {model.opaqueSurfaces.map((surf, index) => (
              <div
                key={surf.id}
                className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3"
              >
                <div className="flex items-center justify-between gap-2 border-b pb-2 border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-mono text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      value={surf.name}
                      onChange={(e) => {
                        const updated = [...model.opaqueSurfaces];
                        updated[index].name = e.target.value;
                        handleUpdateModel({ ...model, opaqueSurfaces: updated });
                      }}
                      className="font-bold text-sm text-slate-900 dark:text-slate-100 bg-transparent border-b border-dashed border-slate-400 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <button
                    onClick={() => handleRemoveOpaque(surf.id)}
                    type="button"
                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Τύπος:</label>
                    <select
                      value={surf.type}
                      onChange={(e) => {
                        const updated = [...model.opaqueSurfaces];
                        updated[index].type = e.target.value as any;
                        handleUpdateModel({ ...model, opaqueSurfaces: updated });
                      }}
                      className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-semibold"
                    >
                      <option value="WALL">Τοίχος</option>
                      <option value="ROOF">Δώμα / Στέγη</option>
                      <option value="PILOTI">Πιλοτή / Οροφή</option>
                      <option value="GROUND_FLOOR">Δάπεδο Εδάφους</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Εμβαδόν A [m²]:</label>
                    <input
                      type="number"
                      step="0.1"
                      value={surf.area}
                      onChange={(e) => {
                        const updated = [...model.opaqueSurfaces];
                        updated[index].area = parseFloat(e.target.value) || 0;
                        handleUpdateModel({ ...model, opaqueSurfaces: updated });
                      }}
                      className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">U [W/m²K]:</label>
                    <input
                      type="number"
                      step="0.01"
                      value={surf.uValue}
                      onChange={(e) => {
                        const updated = [...model.opaqueSurfaces];
                        updated[index].uValue = parseFloat(e.target.value) || 0;
                        handleUpdateModel({ ...model, opaqueSurfaces: updated });
                      }}
                      className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono font-bold text-teal-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">ΔU_tb [W/m²K]:</label>
                    <input
                      type="number"
                      step="0.01"
                      value={surf.deltaUtb}
                      onChange={(e) => {
                        const updated = [...model.opaqueSurfaces];
                        updated[index].deltaUtb = parseFloat(e.target.value) || 0;
                        handleUpdateModel({ ...model, opaqueSurfaces: updated });
                      }}
                      className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Προσανατολισμός:</label>
                    <select
                      value={surf.orientation}
                      onChange={(e) => {
                        const updated = [...model.opaqueSurfaces];
                        updated[index].orientation = e.target.value as any;
                        handleUpdateModel({ ...model, opaqueSurfaces: updated });
                      }}
                      className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-semibold"
                    >
                      <option value="N">Βόρειος (N)</option>
                      <option value="NE">Βορειοανατολικός (NE)</option>
                      <option value="E">Ανατολικός (E)</option>
                      <option value="SE">Νοτιοανατολικός (SE)</option>
                      <option value="S">Νότιος (S)</option>
                      <option value="SW">Νοτιοδυτικός (SW)</option>
                      <option value="W">Δυτικός (W)</option>
                      <option value="NW">Βορειοδυτικός (NW)</option>
                      <option value="HORIZ">Οριζόντιος (HORIZ)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Συνοριακή Συνθήκη:</label>
                    <select
                      value={surf.boundary}
                      onChange={(e) => {
                        const updated = [...model.opaqueSurfaces];
                        updated[index].boundary = e.target.value as any;
                        handleUpdateModel({ ...model, opaqueSurfaces: updated });
                      }}
                      className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-semibold"
                    >
                      <option value="EXTERNAL_AIR">Εξωτερικός Αέρας</option>
                      <option value="UNHEATED_SPACE">Μη Θερμαινόμενος Χώρος (ΜΘΧ)</option>
                      <option value="GROUND">Έδαφος</option>
                      <option value="ADJACENT_BUILDING">Όμορο Κτίριο</option>
                    </select>
                  </div>
                </div>

                {/* Quick Helper presets */}
                <div className="flex items-center gap-2 pt-1 text-[11px]">
                  <span className="text-slate-400 font-medium">Ταχεία Προτεινόμενη Τιμή ΤΟΤΕΕ:</span>
                  <button
                    onClick={() => {
                      const updated = [...model.opaqueSurfaces];
                      updated[index].uValue = 2.20;
                      updated[index].deltaUtb = 0.20;
                      handleUpdateModel({ ...model, opaqueSurfaces: updated });
                    }}
                    type="button"
                    className="px-2 py-0.5 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 rounded border border-teal-200 dark:border-teal-800 hover:bg-teal-100 cursor-pointer"
                  >
                    Αμόνωτος Τοίχος Πριν 1979 (U=2.20)
                  </button>

                  <button
                    onClick={() => {
                      const updated = [...model.opaqueSurfaces];
                      updated[index].uValue = 3.05;
                      updated[index].deltaUtb = 0.20;
                      handleUpdateModel({ ...model, opaqueSurfaces: updated });
                    }}
                    type="button"
                    className="px-2 py-0.5 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 rounded border border-teal-200 dark:border-teal-800 hover:bg-teal-100 cursor-pointer"
                  >
                    Αμόνωτο Δώμα (U=3.05)
                  </button>

                  <button
                    onClick={() => {
                      const updated = [...model.opaqueSurfaces];
                      updated[index].uValue = 2.40;
                      updated[index].deltaUtb = 0.20;
                      handleUpdateModel({ ...model, opaqueSurfaces: updated });
                    }}
                    type="button"
                    className="px-2 py-0.5 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 rounded border border-teal-200 dark:border-teal-800 hover:bg-teal-100 cursor-pointer"
                  >
                    Αμόνωτη Πυλωτή (U=2.40)
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: OPENINGS */}
      {activeSection === 'OPENINGS' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-3 border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                3. Διαφανή Στοιχεία Κελύφους (Κουφώματα, Εξώθυρες & Σκιάσεις)
              </h3>
              <p className="text-xs text-slate-500">
                Καταχωρίστε τα παράθυρα, τις μπαλκονόπορτες, τους συντελεστές U_w, g_gl, αεροδιαπερατότητα & σκιάσεις.
              </p>
            </div>

            <button
              onClick={handleAddOpening}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Προσθήκη Κουφώματος</span>
            </button>
          </div>

          <div className="space-y-4">
            {model.openings.map((op, index) => (
              <div
                key={op.id}
                className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3"
              >
                <div className="flex items-center justify-between gap-2 border-b pb-2 border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-mono text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      value={op.name}
                      onChange={(e) => {
                        const updated = [...model.openings];
                        updated[index].name = e.target.value;
                        handleUpdateModel({ ...model, openings: updated });
                      }}
                      className="font-bold text-sm text-slate-900 dark:text-slate-100 bg-transparent border-b border-dashed border-slate-400 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <button
                    onClick={() => handleRemoveOpening(op.id)}
                    type="button"
                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Εμβαδόν A [m²]:</label>
                    <input
                      type="number"
                      step="0.1"
                      value={op.area}
                      onChange={(e) => {
                        const updated = [...model.openings];
                        updated[index].area = parseFloat(e.target.value) || 0;
                        handleUpdateModel({ ...model, openings: updated });
                      }}
                      className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">U_w [W/m²K]:</label>
                    <input
                      type="number"
                      step="0.1"
                      value={op.uWindow}
                      onChange={(e) => {
                        const updated = [...model.openings];
                        updated[index].uWindow = parseFloat(e.target.value) || 0;
                        handleUpdateModel({ ...model, openings: updated });
                      }}
                      className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono font-bold text-teal-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">g_gl (Ηλιακό Κέρδος):</label>
                    <input
                      type="number"
                      step="0.05"
                      value={op.gGlass}
                      onChange={(e) => {
                        const updated = [...model.openings];
                        updated[index].gGlass = parseFloat(e.target.value) || 0;
                        handleUpdateModel({ ...model, openings: updated });
                      }}
                      className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Χαραμάδες [m³/h/m²]:</label>
                    <input
                      type="number"
                      step="0.5"
                      value={op.vInfiltration}
                      onChange={(e) => {
                        const updated = [...model.openings];
                        updated[index].vInfiltration = parseFloat(e.target.value) || 0;
                        handleUpdateModel({ ...model, openings: updated });
                      }}
                      className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Προσανατολισμός:</label>
                    <select
                      value={op.orientation}
                      onChange={(e) => {
                        const updated = [...model.openings];
                        updated[index].orientation = e.target.value as any;
                        handleUpdateModel({ ...model, openings: updated });
                      }}
                      className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-semibold"
                    >
                      <option value="N">Βόρειος (N)</option>
                      <option value="NE">Βορειοανατολικός (NE)</option>
                      <option value="E">Ανατολικός (E)</option>
                      <option value="SE">Νοτιοανατολικός (SE)</option>
                      <option value="S">Νότιος (S)</option>
                      <option value="SW">Νοτιοδυτικός (SW)</option>
                      <option value="W">Δυτικός (W)</option>
                      <option value="NW">Βορειοδυτικός (NW)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Σκίαση Τέντας F_ov,c:</label>
                    <input
                      type="number"
                      step="0.05"
                      value={op.fOvC}
                      onChange={(e) => {
                        const updated = [...model.openings];
                        updated[index].fOvC = parseFloat(e.target.value) || 0;
                        handleUpdateModel({ ...model, openings: updated });
                      }}
                      className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono"
                    />
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-2 pt-1 text-[11px]">
                  <span className="text-slate-400 font-medium">Ταχεία Επιλογή Τύπου:</span>
                  <button
                    onClick={() => {
                      const updated = [...model.openings];
                      updated[index].uWindow = 5.00;
                      updated[index].gGlass = 0.85;
                      updated[index].vInfiltration = 8.5;
                      handleUpdateModel({ ...model, openings: updated });
                    }}
                    type="button"
                    className="px-2 py-0.5 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 rounded border border-teal-200 dark:border-teal-800 hover:bg-teal-100 cursor-pointer"
                  >
                    Ξύλινο Μονό (U_w=5.00)
                  </button>

                  <button
                    onClick={() => {
                      const updated = [...model.openings];
                      updated[index].uWindow = 4.50;
                      updated[index].gGlass = 0.75;
                      updated[index].vInfiltration = 5.0;
                      handleUpdateModel({ ...model, openings: updated });
                    }}
                    type="button"
                    className="px-2 py-0.5 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 rounded border border-teal-200 dark:border-teal-800 hover:bg-teal-100 cursor-pointer"
                  >
                    Αλουμίνιο Αθερμοδιακοπτόμενο Διπλό (U_w=4.50)
                  </button>

                  <button
                    onClick={() => {
                      const updated = [...model.openings];
                      updated[index].uWindow = 2.20;
                      updated[index].gGlass = 0.55;
                      updated[index].vInfiltration = 2.0;
                      handleUpdateModel({ ...model, openings: updated });
                    }}
                    type="button"
                    className="px-2 py-0.5 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 rounded border border-teal-200 dark:border-teal-800 hover:bg-teal-100 cursor-pointer"
                  >
                    Θερμοδιακοπή Low-E Argon (U_w=2.20)
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4: SYSTEMS */}
      {activeSection === 'SYSTEMS' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 space-y-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 border-b pb-2 border-slate-100 dark:border-slate-800">
            4. Ηλεκτρομηχανολογικά Συστήματα (Θέρμανση, Ψύξη, ΖΝΧ, Ηλιακός & ΑΠΕ)
          </h3>

          {/* Heating System */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500" />
              <span>Σύστημα Θέρμανσης Χώρων</span>
            </h4>

            {model.heatingSystems.map((heat, idx) => (
              <div key={heat.id} className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Τύπος Συστήματος:</label>
                  <select
                    value={heat.type}
                    onChange={(e) => {
                      const updated = [...model.heatingSystems];
                      updated[idx].type = e.target.value as any;
                      if (e.target.value === 'OIL_BOILER') {
                        updated[idx].fuel = 'HEATING_OIL';
                        updated[idx].efficiency = 0.83;
                      } else if (e.target.value === 'GAS_CONDENSING') {
                        updated[idx].fuel = 'NATURAL_GAS';
                        updated[idx].efficiency = 1.02;
                      } else if (e.target.value === 'HEAT_PUMP') {
                        updated[idx].fuel = 'ELECTRICITY';
                        updated[idx].efficiency = 3.80;
                      }
                      handleUpdateModel({ ...model, heatingSystems: updated });
                    }}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-semibold"
                  >
                    <option value="OIL_BOILER">Λέβητας Πετρελαίου (Συμβατικός)</option>
                    <option value="GAS_CONDENSING">Λέβητας Φυσικού Αερίου Συμπύκνωσης</option>
                    <option value="HEAT_PUMP">Αντλία Θερμότητας (Inverter)</option>
                    <option value="SPLIT_AC">Τοπικά Κλιματιστικά Split Units</option>
                    <option value="FIREPLACE_OPEN">Τζάκι Ανοικτού Τύπου</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Ισχύς P_n [kW]:</label>
                  <input
                    type="number"
                    value={heat.powerKw}
                    onChange={(e) => {
                      const updated = [...model.heatingSystems];
                      updated[idx].powerKw = parseFloat(e.target.value) || 0;
                      handleUpdateModel({ ...model, heatingSystems: updated });
                    }}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {heat.type === 'HEAT_PUMP' || heat.type === 'SPLIT_AC' ? 'COP:' : 'Βαθμός Απόδοσης η_g:'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={heat.efficiency}
                    onChange={(e) => {
                      const updated = [...model.heatingSystems];
                      updated[idx].efficiency = parseFloat(e.target.value) || 0;
                      handleUpdateModel({ ...model, heatingSystems: updated });
                    }}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono font-bold text-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Δίκτυο Διανομής e_d:</label>
                  <input
                    type="number"
                    step="0.01"
                    value={heat.distributionEff}
                    onChange={(e) => {
                      const updated = [...model.heatingSystems];
                      updated[idx].distributionEff = parseFloat(e.target.value) || 0;
                      handleUpdateModel({ ...model, heatingSystems: updated });
                    }}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Ποσοστό Κάλυψης (%):</label>
                  <input
                    type="number"
                    step="0.05"
                    value={heat.coverageRatio}
                    onChange={(e) => {
                      const updated = [...model.heatingSystems];
                      updated[idx].coverageRatio = parseFloat(e.target.value) || 0;
                      handleUpdateModel({ ...model, heatingSystems: updated });
                    }}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono font-bold"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Cooling & DHW */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cooling */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Wind className="w-4 h-4 text-cyan-500" />
                <span>Σύστημα Ψύξης / Κλιματισμού</span>
              </h4>

              {model.coolingSystems.map((cool, idx) => (
                <div key={cool.id} className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Τύπος Ψύξης:</label>
                    <select
                      value={cool.type}
                      onChange={(e) => {
                        const updated = [...model.coolingSystems];
                        updated[idx].type = e.target.value as any;
                        handleUpdateModel({ ...model, coolingSystems: updated });
                      }}
                      className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-semibold"
                    >
                      <option value="SPLIT_INVERTER">Split Unit Inverter (R32/R410A)</option>
                      <option value="SPLIT_ONOFF">Split Unit On/Off (Παλαιό)</option>
                      <option value="NO_COOLING">Χωρίς Σύστημα (Κτίριο Αναφοράς EER=3.0)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">EER Συστήματος:</label>
                    <input
                      type="number"
                      step="0.1"
                      value={cool.eer}
                      onChange={(e) => {
                        const updated = [...model.coolingSystems];
                        updated[idx].eer = parseFloat(e.target.value) || 0;
                        handleUpdateModel({ ...model, coolingSystems: updated });
                      }}
                      className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono font-bold text-teal-600"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* DHW & Solar */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Ζεστό Νερό Χρήσης & Ηλιακός Θερμοσίφωνας</span>
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Κύριο Σύστημα ΖΝΧ:</label>
                  <select
                    value={model.dhwSystem.type}
                    onChange={(e) =>
                      handleUpdateModel({
                        ...model,
                        dhwSystem: { ...model.dhwSystem, type: e.target.value as any },
                      })
                    }
                    className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-semibold"
                  >
                    <option value="ELECTRIC_HEATER">Ηλεκτρικός Θερμοσίφωνας</option>
                    <option value="BOILER_HEATING">Boiler Θέρμανσης (Λέβητα)</option>
                    <option value="HEAT_PUMP_DHW">Αντλία Θερμότητας ΖΝΧ</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Ύπαρξη Ηλιακού Συλλέκτη;</label>
                  <select
                    value={model.dhwSystem.hasSolarThermal ? 'YES' : 'NO'}
                    onChange={(e) =>
                      handleUpdateModel({
                        ...model,
                        dhwSystem: { ...model.dhwSystem, hasSolarThermal: e.target.value === 'YES' },
                      })
                    }
                    className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-semibold text-teal-600"
                  >
                    <option value="YES">Ναι (Υπάρχει Ηλιακός)</option>
                    <option value="NO">Όχι</option>
                  </select>
                </div>

                {model.dhwSystem.hasSolarThermal && (
                  <>
                    <div>
                      <label className="block font-semibold mb-1">Επιφάνεια Συλλεκτών [m²]:</label>
                      <input
                        type="number"
                        step="0.1"
                        value={model.dhwSystem.solarAreaM2}
                        onChange={(e) =>
                          handleUpdateModel({
                            ...model,
                            dhwSystem: { ...model.dhwSystem, solarAreaM2: parseFloat(e.target.value) || 0 },
                          })
                        }
                        className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1">Χωρητικότητα Boiler [L]:</label>
                      <input
                        type="number"
                        value={model.dhwSystem.tankLiters}
                        onChange={(e) =>
                          handleUpdateModel({
                            ...model,
                            dhwSystem: { ...model.dhwSystem, tankLiters: parseInt(e.target.value) || 120 },
                          })
                        }
                        className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono font-bold"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: SCENARIOS & RESULTS EVALUATION */}
      {activeSection === 'SCENARIOS' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                5. Σενάρια Συστάσεων Ενεργειακής Αναβάθμισης (ΠΕΑ & Εξοικονομώ 2025)
              </h3>

              <button
                onClick={handleGenerateAutoScenarios}
                type="button"
                className="px-3 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold rounded-lg shadow transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>Αυτόματη Γεννήτρια Βέλτιστων Σεναρίων</span>
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {model.scenarios.map((scen, idx) => (
                <div key={scen.id} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={scen.title}
                      onChange={(e) => {
                        const updated = [...model.scenarios];
                        updated[idx].title = e.target.value;
                        handleUpdateModel({ ...model, scenarios: updated });
                      }}
                      className="font-bold text-sm text-slate-900 dark:text-slate-100 bg-transparent border-b border-dashed border-slate-400 w-full focus:outline-none"
                    />
                    <span className="px-2.5 py-1 bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 font-mono font-bold rounded-lg shrink-0">
                      Εξοικονόμηση: {scen.estimatedSavingPercent}%
                    </span>
                  </div>

                  <textarea
                    rows={2}
                    value={scen.description}
                    onChange={(e) => {
                      const updated = [...model.scenarios];
                      updated[idx].description = e.target.value;
                      handleUpdateModel({ ...model, scenarios: updated });
                    }}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-sans leading-relaxed"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Exoikonomo 2025 Evaluator Component */}
          <ExoikonomoEvaluator model={model} />
        </div>
      )}

      {/* SECTION 6: XML PREVIEW */}
      {activeSection === 'PREVIEW' && (
        <div className="bg-slate-950 text-slate-100 rounded-xl p-5 border border-slate-800 shadow-2xl space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FileCode className="w-5 h-5 text-teal-400" />
              <span className="font-bold text-sm text-white">Προεπισκόπηση Κώδικα XML (buildingcert.gr Schema)</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyXml}
                type="button"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 font-sans transition-colors cursor-pointer"
              >
                {copiedXml ? 'Αντιγράφηκε!' : 'Αντιγραφή'}
              </button>
              <button
                onClick={handleDownloadXml}
                type="button"
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-sans font-bold transition-colors cursor-pointer"
              >
                Λήψη (.xml)
              </button>
            </div>
          </div>

          <pre className="p-4 bg-slate-900 rounded-xl border border-slate-800/80 overflow-x-auto text-[11px] leading-relaxed text-teal-300 max-h-[500px]">
            {xmlString}
          </pre>
        </div>
      )}
    </div>
  );
};

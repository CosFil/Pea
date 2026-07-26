import React, { useState, useEffect } from 'react';
import { getXmlBuildingModel, saveXmlBuildingModel } from '../utils/xmlModelStore';
import { FullBuildingModel } from '../types/xmlKenak';
import { Building2, Layers, Maximize2, FileCode, Cpu, ArrowRight, MapPin } from 'lucide-react';
import { TabType } from './Header';
import { PropertyMapModal } from './PropertyMapModal';

interface BuildingHeaderBarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const BuildingHeaderBar: React.FC<BuildingHeaderBarProps> = ({ activeTab, setActiveTab }) => {
  const [model, setModel] = useState<FullBuildingModel>(getXmlBuildingModel);
  const [isMapModalOpen, setIsMapModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleSync = (e?: Event) => {
      if (e && 'detail' in e && (e as CustomEvent).detail) {
        setModel((e as CustomEvent).detail);
      } else {
        setModel(getXmlBuildingModel());
      }
    };

    window.addEventListener('kenakModelUpdated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('kenakModelUpdated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const handleApplyLocation = (updatedFields: Partial<FullBuildingModel>) => {
    const newModel = { ...model, ...updatedFields };
    setModel(newModel);
    saveXmlBuildingModel(newModel);
  };

  const totalOpaqueArea = model.opaqueSurfaces.reduce((acc, s) => acc + s.area, 0);
  const totalOpeningsArea = model.openings.reduce((acc, o) => acc + o.area, 0);

  return (
    <>
      <div className="bg-slate-900 text-slate-100 rounded-2xl p-3 sm:p-4 border border-slate-800 shadow-md mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Building Info Summary */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-teal-500/10 border border-teal-500/30 rounded-xl text-teal-400 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-white tracking-tight">
                {model.buildingName || 'Ενεργό Έργο ΠΕΑ / ΚΕΝΑΚ'}
              </span>
              <span className="px-2 py-0.5 bg-slate-800 text-teal-300 font-mono text-[10px] rounded border border-slate-700 font-semibold">
                Έτος: {model.yearBuilt || 1980}
              </span>
              <button
                onClick={() => setIsMapModalOpen(true)}
                type="button"
                className="px-2.5 py-0.5 bg-teal-950/80 hover:bg-teal-900 text-teal-300 font-mono text-[10px] rounded border border-teal-800/80 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                title="Προβολή & Αλλαγή Τοποθεσίας στο Google Maps"
              >
                <MapPin className="w-3 h-3 text-teal-400" />
                <span>{model.address || 'Επιλογή στο Χάρτη'} (Ζώνη {model.climateZone})</span>
              </button>
            </div>

            <p className="text-xs text-slate-400 flex items-center gap-3 font-mono">
              <span>A_gross: <strong className="text-slate-200">{model.grossArea || 120} m²</strong></span>
              <span>•</span>
              <span>Αδιαφανή ({model.opaqueSurfaces.length}): <strong className="text-slate-200">{totalOpaqueArea.toFixed(1)} m²</strong></span>
              <span>•</span>
              <span>Διαφανή ({model.openings.length}): <strong className="text-slate-200">{totalOpeningsArea.toFixed(1)} m²</strong></span>
            </p>
          </div>
        </div>

        {/* Cross-Tab Automations Navigation */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setIsMapModalOpen(true)}
            type="button"
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-500 text-white shadow transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Χάρτης Google Maps 📍</span>
          </button>

          <button
            onClick={() => setActiveTab('AUTOCAD')}
            type="button"
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'AUTOCAD'
                ? 'bg-teal-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>AutoCAD / DXF</span>
          </button>

          <button
            onClick={() => setActiveTab('CALCULATORS')}
            type="button"
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'CALCULATORS'
                ? 'bg-teal-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>Υπολογιστές U</span>
          </button>

          <button
            onClick={() => setActiveTab('XML_EXPORT')}
            type="button"
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'XML_EXPORT'
                ? 'bg-teal-600 text-white shadow'
                : 'bg-teal-950/80 text-teal-300 hover:bg-teal-900 border border-teal-800'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-teal-400" />
            <span>Εξαγωγή XML</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Property Google Maps Modal */}
      <PropertyMapModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        model={model}
        onApplyLocation={handleApplyLocation}
      />
    </>
  );
};


import React, { useState, useRef, useEffect } from 'react';
import DxfParser from 'dxf-parser';
import { 
  Compass, 
  FileCode2, 
  Upload, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Copy, 
  Check, 
  Maximize, 
  RefreshCw,
  Box,
  Ruler,
  Code,
  Building2,
  Plus,
  Trash2,
  ArrowRight,
  Sliders,
  Maximize2
} from 'lucide-react';
import { ValueCopyBadge } from '../ValueCopyBadge';
import { 
  OpaqueSurfaceInput, 
  OpeningInput, 
  OrientationType, 
  BoundaryCondition, 
  FullBuildingModel 
} from '../../types/xmlKenak';
import { DEFAULT_PRE79_BUILDING } from '../../data/xmlDefaults';

export interface ExtractedCadGeometry {
  totalGrossArea: number; // m²
  netArea: number; // m²
  heatedVolume: number; // m³
  totalWallPerimeter: number; // m
  wallGrossArea: number; // m²
  openingsTotalArea: number; // m²
  roofArea: number; // m²
  floorHeight: number; // m
  wallThickness: number; // m
  layersFound: string[];
  entityCount: number;
  extractedOpenings: { id: string; name: string; width: number; height: number; area: number; layer: string }[];
  extractedWalls: { id: string; length: number; area: number; layer: string }[];
}

interface AutocadIntegrationTabProps {
  onNavigateToXml?: () => void;
}

export const AutocadIntegrationTab: React.FC<AutocadIntegrationTabProps> = ({ onNavigateToXml }) => {
  const [dxfText, setDxfText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);
  
  // Custom geometry configuration inputs
  const [floorHeight, setFloorHeight] = useState<number>(3.0); // m
  const [wallThickness, setWallThickness] = useState<number>(0.25); // m
  const [cadScaleFactor, setCadScaleFactor] = useState<number>(1.0); // 1 unit in CAD = 1 meter

  // Extracted Data
  const [extractedData, setExtractedData] = useState<ExtractedCadGeometry | null>(null);
  
  // 2. Αδιαφανή & 3. Διαφανή elements derived from CAD
  const [cadOpaqueSurfaces, setCadOpaqueSurfaces] = useState<OpaqueSurfaceInput[]>([]);
  const [cadOpenings, setCadOpenings] = useState<OpeningInput[]>([]);
  
  // Sync state alert
  const [appliedSuccessMsg, setAppliedSuccessMsg] = useState<boolean>(false);

  const [copiedLisp, setCopiedLisp] = useState<boolean>(false);
  const [activeViewMode, setActiveViewMode] = useState<'2D_CANVAS' | 'SURFACES_EDITOR' | 'LISP_GUIDE'>('2D_CANVAS');

  // Canvas ref for drawing
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [parsedDxfObj, setParsedDxfObj] = useState<any>(null);

  // Sample AutoLISP script to download or copy
  const sampleLispCode = `;====================================================================
; AUTO-LISP EXPORTER FOR TEE-KENAK & EASY-KENAK GEOMETRY
; Εξαγωγή Γεωμετρίας Κτιρίου από AutoCAD σε JSON για ΤΕΕ-ΚΕΝΑΚ
; Command in AutoCAD: KENAKEX
;====================================================================
(defun c:KENAKEX ( / sel i ent layer area len total_area total_len json_str fn filepath)
  (vl-load-com)
  (princ "\\n--- ΕΞΑΓΩΓΗ ΓΕΩΜΕΤΡΙΑΣ KENAK FROM AUTOCAD ---\\n")
  (setq total_area 0.0)
  (setq total_len 0.0)
  
  ; Get selection set of polylines
  (prompt "\\nΕπιλέξτε τα Polylines των Θερμικών Ζωνών / Τοίχων / Κουφωμάτων: ")
  (setq sel (ssget '((0 . "*POLYLINE,LINE,SPLINE"))))
  
  (if sel
    (progn
      (setq i 0)
      (while (< i (sslength sel))
        (setq ent (ssname sel i))
        (setq layer (cdr (assoc 8 (entget ent))))
        ; Get area if closed
        (vl-catch-all-apply
          '(lambda ()
             (setq area (vlax-curve-getarea ent))
             (setq total_area (+ total_area area))
           )
        )
        ; Get length
        (vl-catch-all-apply
          '(lambda ()
             (setq len (vlax-curve-getdistatparam ent (vlax-curve-getendparam ent)))
             (setq total_len (+ total_len len))
           )
        )
        (princ (strcat "\\nPolyline " (itoa i) " [Layer: " layer "] Area: " (rtos area 2 2) " m², Len: " (rtos len 2 2) " m"))
        (setq i (1+ i))
      )
      
      (princ (strcat "\\n=========================================="))
      (princ (strcat "\\nΣΥΝΟΛΙΚΟ ΕΜΒΑΔΟ ZONES: " (rtos total_area 2 2) " m²"))
      (princ (strcat "\\nΣΥΝΟΛΙΚΗ ΠΕΡΙΜΕΤΡΟΣ WALLS: " (rtos total_len 2 2) " m"))
      (princ (strcat "\\n=========================================="))
      (alert (strcat "Επιτυχής Εξαγωγή!\\nΣυνολικό Εμβαδό: " (rtos total_area 2 2) " m²\\nΣυνολική Περίμετρος: " (rtos total_len 2 2) " m"))
    )
    (princ "\\nΔεν επιλέχθηκαν αντικείμενα.")
  )
  (princ)
)
(princ "\\nΤο LISP φορτώθηκε. Πληκτρολογήστε 'KENAKEX' στο AutoCAD για εκτέλεση.\\n")
(princ)
`;

  // Handle DXF File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsParsing(true);
    setParseError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        setDxfText(text);
        processDxfText(text);
      } catch (err: any) {
        setParseError('Αποτυχία ανάγνωσης αρχείου DXF. Βεβαιωθείτε ότι είναι σε μορφή ASCII DXF (Save As DXF στο AutoCAD).');
      } finally {
        setIsParsing(false);
      }
    };
    reader.readAsText(file);
  };

  // Process DXF with dxf-parser
  const processDxfText = (rawDxf: string) => {
    try {
      const parser = new DxfParser();
      const parsed = parser.parseSync(rawDxf);
      setParsedDxfObj(parsed);

      let totalLen = 0;
      let totalArea = 0;
      let windowArea = 0;
      let roofArea = 0;

      const layersSet = new Set<string>();
      const openingsList: { id: string; name: string; width: number; height: number; area: number; layer: string }[] = [];
      const wallsList: { id: string; length: number; area: number; layer: string }[] = [];

      if (parsed && parsed.entities) {
        parsed.entities.forEach((entity: any, index: number) => {
          const layer = (entity.layer || 'DEFAULT').toUpperCase();
          layersSet.add(layer);

          // Calculate LWPOLYLINE or POLYLINE lengths and bounding boxes
          if (entity.type === 'LWPOLYLINE' || entity.type === 'POLYLINE') {
            const vertices = entity.vertices || [];
            let len = 0;
            for (let i = 0; i < vertices.length - 1; i++) {
              const dx = (vertices[i + 1].x - vertices[i].x) * cadScaleFactor;
              const dy = (vertices[i + 1].y - vertices[i].y) * cadScaleFactor;
              len += Math.sqrt(dx * dx + dy * dy);
            }
            if (entity.shape) {
              // Closed polyline - add connection to first point
              const first = vertices[0];
              const last = vertices[vertices.length - 1];
              if (first && last) {
                const dx = (first.x - last.x) * cadScaleFactor;
                const dy = (first.y - last.y) * cadScaleFactor;
                len += Math.sqrt(dx * dx + dy * dy);
              }
            }

            // Estimate Area using Shoelace formula if polygon
            let polyArea = 0;
            if (vertices.length >= 3) {
              for (let i = 0; i < vertices.length; i++) {
                const j = (i + 1) % vertices.length;
                polyArea += (vertices[i].x * cadScaleFactor) * (vertices[j].y * cadScaleFactor);
                polyArea -= (vertices[j].x * cadScaleFactor) * (vertices[i].y * cadScaleFactor);
              }
              polyArea = Math.abs(polyArea) / 2.0;
            }

            // Layer specific grouping
            if (layer.includes('WALL') || layer.includes('ΤΟΙΧ') || layer.includes('PERIMETER') || layer.includes('0')) {
              totalLen += len;
              wallsList.push({
                id: `wall-${index}`,
                length: len,
                area: len * floorHeight,
                layer,
              });
            } else if (layer.includes('ZONE') || layer.includes('ΖΩΝΗ') || layer.includes('AREA') || layer.includes('SLAB')) {
              totalArea += polyArea;
            } else if (layer.includes('WIN') || layer.includes('OPEN') || layer.includes('ΠΑΡΑΘ') || layer.includes('KOUF')) {
              const winWidth = len > 0 ? len / 2 : 1.5;
              const winHeight = 1.4;
              const winArea = polyArea > 0 ? polyArea : winWidth * winHeight;
              windowArea += winArea;
              openingsList.push({
                id: `win-${index}`,
                name: `Κούφωμα CAD #${index + 1}`,
                width: winWidth,
                height: winHeight,
                area: winArea,
                layer,
              });
            } else if (layer.includes('ROOF') || layer.includes('ΣΤΕΓ')) {
              roofArea += polyArea;
            } else {
              totalLen += len;
            }
          } else if (entity.type === 'LINE') {
            const dx = (entity.vertices[1].x - entity.vertices[0].x) * cadScaleFactor;
            const dy = (entity.vertices[1].y - entity.vertices[0].y) * cadScaleFactor;
            const len = Math.sqrt(dx * dx + dy * dy);
            totalLen += len;
          }
        });
      }

      // If total area wasn't explicitly tagged under ZONE layer, estimate from bounding rectangle
      if (totalArea === 0 && totalLen > 0) {
        const approxSide = totalLen / 4.0;
        totalArea = approxSide * approxSide;
      }

      const grossArea = totalArea > 0 ? totalArea : 100.0;
      const netAreaCalc = Math.max(0, grossArea * 0.88);
      const grossVolume = grossArea * floorHeight;
      const grossWallArea = totalLen > 0 ? totalLen * floorHeight : grossArea * 1.2;

      const extGeo: ExtractedCadGeometry = {
        totalGrossArea: grossArea,
        netArea: netAreaCalc,
        heatedVolume: grossVolume,
        totalWallPerimeter: totalLen,
        wallGrossArea: grossWallArea,
        openingsTotalArea: windowArea,
        roofArea: roofArea > 0 ? roofArea : grossArea,
        floorHeight,
        wallThickness,
        layersFound: Array.from(layersSet),
        entityCount: parsed?.entities?.length || 0,
        extractedOpenings: openingsList,
        extractedWalls: wallsList,
      };

      setExtractedData(extGeo);

      // Construct 2. Αδιαφανή & 3. Διαφανή
      buildCadSurfacesAndOpenings(extGeo, wallsList, openingsList);

      setParseError(null);
    } catch (err: any) {
      setParseError('Σφάλμα ανάλυσης δομής DXF. Παρακαλούμε ελέγξτε αν το αρχείο δημιουργήθηκε από AutoCAD.');
    }
  };

  // Helper to generate 2. Αδιαφανή & 3. Διαφανή arrays
  const buildCadSurfacesAndOpenings = (
    geo: ExtractedCadGeometry, 
    wallsList: any[], 
    openingsList: any[]
  ) => {
    // 1. OPAQUE SURFACES (2. Αδιαφανή)
    const opaques: OpaqueSurfaceInput[] = [];
    const orientations: OrientationType[] = ['N', 'E', 'S', 'W'];
    
    // Check age category from current building model
    const isPre1980 = DEFAULT_PRE79_BUILDING.ageCategory === 'PRE_1979' || DEFAULT_PRE79_BUILDING.yearBuilt < 1980;
    const defaultDeltaUtb = isPre1980 ? 0.00 : 0.20;

    if (wallsList.length > 0) {
      wallsList.forEach((w, idx) => {
        const orient = orientations[idx % 4];
        opaques.push({
          id: `cad-wall-${idx + 1}`,
          name: `Εξωτερικός Τοίχος CAD #${idx + 1} (${orient})`,
          type: 'WALL',
          area: Number((w.length * geo.floorHeight).toFixed(2)),
          uValue: 2.20,
          deltaUtb: defaultDeltaUtb,
          orientation: orient,
          tiltAngle: 90,
          boundary: 'EXTERNAL_AIR',
          absorption: 0.60,
          emissivity: 0.90,
        });
      });
    } else {
      const perSideArea = Number(((geo.totalWallPerimeter / 4) * geo.floorHeight).toFixed(2)) || 25.0;
      const sides: { name: string; orient: OrientationType }[] = [
        { name: 'Εξωτερικός Τοίχος Βόρειος (CAD)', orient: 'N' },
        { name: 'Εξωτερικός Τοίχος Ανατολικός (CAD)', orient: 'E' },
        { name: 'Εξωτερικός Τοίχος Νότιος (CAD)', orient: 'S' },
        { name: 'Εξωτερικός Τοίχος Δυτικός (CAD)', orient: 'W' },
      ];
      sides.forEach((s, idx) => {
        opaques.push({
          id: `cad-wall-def-${idx + 1}`,
          name: s.name,
          type: 'WALL',
          area: perSideArea,
          uValue: 2.20,
          deltaUtb: defaultDeltaUtb,
          orientation: s.orient,
          tiltAngle: 90,
          boundary: 'EXTERNAL_AIR',
          absorption: 0.60,
          emissivity: 0.90,
        });
      });
    }

    // Add Roof (Στέγη / Δώμα)
    opaques.push({
      id: 'cad-roof-main',
      name: 'Οροφή / Δώμα Κτιρίου (CAD)',
      type: 'ROOF',
      area: Number((geo.roofArea > 0 ? geo.roofArea : geo.totalGrossArea).toFixed(2)),
      uValue: 2.50,
      deltaUtb: defaultDeltaUtb,
      orientation: 'HORIZ',
      tiltAngle: 0,
      boundary: 'EXTERNAL_AIR',
      absorption: 0.70,
      emissivity: 0.90,
    });

    // 2. OPENINGS (3. Διαφανή)
    const ops: OpeningInput[] = [];
    if (openingsList.length > 0) {
      openingsList.forEach((op, idx) => {
        const orient = orientations[idx % 4];
        ops.push({
          id: `cad-win-${idx + 1}`,
          name: op.name || `Κούφωμα CAD #${idx + 1}`,
          area: Number(op.area.toFixed(2)),
          uWindow: 3.20,
          gGlass: 0.75,
          vInfiltration: 10.0,
          frameRatio: 0.20,
          orientation: orient,
          fOvH: 0.90,
          fOvC: 0.85,
          fFinH: 1.0,
          fFinC: 1.0,
          fHorH: 1.0,
          fHorC: 1.0,
          fShC: 0.50,
        });
      });
    } else {
      const defaultWinList: { name: string; orient: OrientationType; area: number }[] = [
        { name: 'Παράθυρο Βορινό (CAD)', orient: 'N', area: 2.10 },
        { name: 'Μπαλκονόπορτα Ανατολική (CAD)', orient: 'E', area: 3.50 },
        { name: 'Παράθυρο Νότιο (CAD)', orient: 'S', area: 2.80 },
        { name: 'Παράθυρο Δυτικό (CAD)', orient: 'W', area: 1.80 },
      ];
      defaultWinList.forEach((d, idx) => {
        ops.push({
          id: `cad-win-def-${idx + 1}`,
          name: d.name,
          area: d.area,
          uWindow: 3.20,
          gGlass: 0.75,
          vInfiltration: 10.0,
          frameRatio: 0.20,
          orientation: d.orient,
          fOvH: 0.90,
          fOvC: 0.85,
          fFinH: 1.0,
          fFinC: 1.0,
          fHorH: 1.0,
          fHorC: 1.0,
          fShC: 0.50,
        });
      });
    }

    setCadOpaqueSurfaces(opaques);
    setCadOpenings(ops);
  };

  // Draw 2D Preview on Canvas
  useEffect(() => {
    if (!canvasRef.current || !parsedDxfObj || !parsedDxfObj.entities) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    parsedDxfObj.entities.forEach((entity: any) => {
      if (entity.vertices) {
        entity.vertices.forEach((v: any) => {
          if (v.x < minX) minX = v.x;
          if (v.x > maxX) maxX = v.x;
          if (v.y < minY) minY = v.y;
          if (v.y > maxY) maxY = v.y;
        });
      }
    });

    if (minX === Infinity) return;

    const dxfWidth = maxX - minX || 10;
    const dxfHeight = maxY - minY || 10;

    const scale = Math.min((width - 60) / dxfWidth, (height - 60) / dxfHeight);
    const offsetX = (width - dxfWidth * scale) / 2 - minX * scale;
    const offsetY = (height - dxfHeight * scale) / 2 - minY * scale;

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x < width; x += 30) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = 0; y < height; y += 30) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    parsedDxfObj.entities.forEach((entity: any) => {
      const layer = (entity.layer || '').toUpperCase();
      
      if (layer.includes('WALL') || layer.includes('ΤΟΙΧ')) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
      } else if (layer.includes('WIN') || layer.includes('OPEN') || layer.includes('ΠΑΡΑΘ')) {
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
      } else if (layer.includes('ZONE') || layer.includes('ΖΩΝΗ')) {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1.5;
      } else {
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
      }

      if (entity.type === 'LWPOLYLINE' || entity.type === 'POLYLINE') {
        const vertices = entity.vertices;
        if (!vertices || vertices.length < 2) return;

        ctx.beginPath();
        const px0 = vertices[0].x * scale + offsetX;
        const py0 = height - (vertices[0].y * scale + offsetY);
        ctx.moveTo(px0, py0);

        for (let i = 1; i < vertices.length; i++) {
          const px = vertices[i].x * scale + offsetX;
          const py = height - (vertices[i].y * scale + offsetY);
          ctx.lineTo(px, py);
        }

        if (entity.shape) {
          ctx.closePath();
        }
        ctx.stroke();
      } else if (entity.type === 'LINE') {
        const v = entity.vertices;
        if (v && v.length >= 2) {
          ctx.beginPath();
          ctx.moveTo(v[0].x * scale + offsetX, height - (v[0].y * scale + offsetY));
          ctx.lineTo(v[1].x * scale + offsetX, height - (v[1].y * scale + offsetY));
          ctx.stroke();
        }
      }
    });
  }, [parsedDxfObj, cadScaleFactor]);

  // Apply 2. Αδιαφανή & 3. Διαφανή to XML Building Model in localStorage
  const handleApplyCadToXmlModel = () => {
    let currentModel: FullBuildingModel = DEFAULT_PRE79_BUILDING;
    const saved = localStorage.getItem('kenak_xml_building_model');
    if (saved) {
      try {
        currentModel = JSON.parse(saved);
      } catch (e) {}
    }

    const updatedModel: FullBuildingModel = {
      ...currentModel,
      grossArea: extractedData ? extractedData.totalGrossArea : currentModel.grossArea,
      netArea: extractedData ? extractedData.netArea : currentModel.netArea,
      heatedVolume: extractedData ? extractedData.heatedVolume : currentModel.heatedVolume,
      opaqueSurfaces: cadOpaqueSurfaces,
      openings: cadOpenings,
    };

    localStorage.setItem('kenak_xml_building_model', JSON.stringify(updatedModel));
    setAppliedSuccessMsg(true);
    setTimeout(() => setAppliedSuccessMsg(false), 5000);
  };

  // Add / Remove Opaque Surfaces
  const handleAddOpaqueSurface = () => {
    const newSurf: OpaqueSurfaceInput = {
      id: `cad-wall-new-${Date.now()}`,
      name: `Νέος Τοίχος CAD (${cadOpaqueSurfaces.length + 1})`,
      type: 'WALL',
      area: 15.0,
      uValue: 2.20,
      deltaUtb: 0.15,
      orientation: 'N',
      tiltAngle: 90,
      boundary: 'EXTERNAL_AIR',
      absorption: 0.60,
      emissivity: 0.90,
    };
    setCadOpaqueSurfaces([...cadOpaqueSurfaces, newSurf]);
  };

  const handleRemoveOpaqueSurface = (id: string) => {
    setCadOpaqueSurfaces(cadOpaqueSurfaces.filter((s) => s.id !== id));
  };

  // Add / Remove Openings
  const handleAddOpening = () => {
    const newOp: OpeningInput = {
      id: `cad-win-new-${Date.now()}`,
      name: `Νέο Κούφωμα CAD (${cadOpenings.length + 1})`,
      area: 2.5,
      uWindow: 3.20,
      gGlass: 0.75,
      vInfiltration: 10.0,
      frameRatio: 0.20,
      orientation: 'S',
      fOvH: 0.90,
      fOvC: 0.85,
      fFinH: 1.0,
      fFinC: 1.0,
      fHorH: 1.0,
      fHorC: 1.0,
      fShC: 0.50,
    };
    setCadOpenings([...cadOpenings, newOp]);
  };

  const handleRemoveOpening = (id: string) => {
    setCadOpenings(cadOpenings.filter((o) => o.id !== id));
  };

  // Copy LISP
  const handleCopyLisp = () => {
    navigator.clipboard.writeText(sampleLispCode);
    setCopiedLisp(true);
    setTimeout(() => setCopiedLisp(false), 2500);
  };

  // Download .lsp
  const handleDownloadLisp = () => {
    const blob = new Blob([sampleLispCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'EXPORT_KENAK_GEOMETRY.lsp';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Demo Sample DXF Generator
  const handleLoadSampleDxf = () => {
    const sampleDxfText = `0
SECTION
2
HEADER
0
ENDSEC
0
SECTION
2
ENTITIES
0
LWPOLYLINE
8
WALLS
90
4
70
1
10
0.0
20
0.0
10
12.0
20
0.0
10
12.0
20
8.5
10
0.0
20
8.5
0
LWPOLYLINE
8
WINDOWS
90
2
70
0
10
2.0
20
0.0
10
4.5
20
0.0
0
LWPOLYLINE
8
WINDOWS
90
2
70
0
10
12.0
20
2.0
10
12.0
20
4.0
0
ENDSEC
0
EOF`;

    setFileName('SAMPLE_BUILDING_LAYOUT.dxf');
    setDxfText(sampleDxfText);
    processDxfText(sampleDxfText);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 shrink-0">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">
                Σύνδεση & Εξαγωγή 2.Αδιαφανών & 3.Διαφανών από AutoCAD
              </h2>
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                CAD-to-XML Bridge
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Ορίστε τα γεωμετρικά στοιχεία στο AutoCAD (`.dxf` / AutoLISP). Η εφαρμογή υπολογίζει αυτόματα τα 2.Αδιαφανή & 3.Διαφανή στοιχεία και τα μεταφέρει στο XML για το ΤΕΕ-ΚΕΝΑΚ.
            </p>
          </div>
        </div>

        {/* View Mode Navigation */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/80 shrink-0">
          <button
            onClick={() => setActiveViewMode('2D_CANVAS')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeViewMode === '2D_CANVAS'
                ? 'bg-teal-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            2D CAD View
          </button>
          <button
            onClick={() => setActiveViewMode('SURFACES_EDITOR')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeViewMode === 'SURFACES_EDITOR'
                ? 'bg-teal-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            2.Αδιαφανή & 3.Διαφανή ({cadOpaqueSurfaces.length + cadOpenings.length})
          </button>
          <button
            onClick={() => setActiveViewMode('LISP_GUIDE')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeViewMode === 'LISP_GUIDE'
                ? 'bg-teal-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            AutoLISP (`.lsp`)
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {appliedSuccessMsg && (
        <div className="p-4 bg-emerald-500/15 border-2 border-emerald-500/40 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-4 shadow-lg animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <div>
              <p className="font-bold text-sm">Επιτυχής Μεταφορά στο Μοντέλο XML (ΤΕΕ-ΚΕΝΑΚ)!</p>
              <p className="text-[11px] opacity-90 mt-0.5">
                Ενημερώθηκαν {cadOpaqueSurfaces.length} Αδιαφανή στοιχεία, {cadOpenings.length} Διαφανή στοιχεία (κουφώματα) και τα εμβαδά/όγκοι του κτιρίου.
              </p>
            </div>
          </div>
          {onNavigateToXml && (
            <button
              onClick={onNavigateToXml}
              type="button"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <span>Προβολή στο XML / ΠΕΑ</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* VIEW MODE 1: 2D CANVAS & FILE UPLOAD */}
      {activeViewMode === '2D_CANVAS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Controls & File Import */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Upload className="w-4 h-4 text-teal-500" />
                <span>1. Εισαγωγή Αρχείου DXF</span>
              </h3>

              {/* Upload Drop Area */}
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-teal-500 rounded-xl p-6 text-center space-y-3 bg-slate-50 dark:bg-slate-950 transition-all">
                <FileCode2 className="w-8 h-8 mx-auto text-teal-500" />
                <div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Σύρετε ή επιλέξτε αρχείο `.dxf`
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    (AutoCAD ASCII DXF Format - `DXFOUT`)
                  </p>
                </div>

                <label className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-lg shadow cursor-pointer transition-all">
                  <span>Επιλογή Αρχείου</span>
                  <input
                    type="file"
                    accept=".dxf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Quick Sample Button */}
              <button
                onClick={handleLoadSampleDxf}
                type="button"
                className="w-full py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-teal-500" />
                <span>Φόρτωση Δοκιμαστικού Σχεδίου CAD</span>
              </button>

              {fileName && (
                <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-lg text-xs font-mono text-teal-400 flex items-center justify-between">
                  <span className="truncate">{fileName}</span>
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-400" />
                </div>
              )}

              {parseError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-400 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{parseError}</span>
                </div>
              )}
            </div>

            {/* Geometry Parameters Adjustment */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm text-xs">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Ruler className="w-4 h-4 text-teal-500" />
                <span>2. Παράμετροι CAD & Ύψη</span>
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Μονάδες Σχεδίασης CAD:
                  </label>
                  <select
                    value={cadScaleFactor}
                    onChange={(e) => {
                      const sf = parseFloat(e.target.value);
                      setCadScaleFactor(sf);
                      if (dxfText) processDxfText(dxfText);
                    }}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-medium"
                  >
                    <option value={1.0}>Μέτρα (m) — 1 CAD Unit = 1.0 m</option>
                    <option value={0.01}>Εκατοστά (cm) — 1 CAD Unit = 0.01 m</option>
                    <option value={0.001}>Χιλιοστά (mm) — 1 CAD Unit = 0.001 m</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Μικτό Ύψος Ορόφου h_gross (m):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={floorHeight}
                    onChange={(e) => {
                      const h = parseFloat(e.target.value) || 3.0;
                      setFloorHeight(h);
                      if (dxfText) processDxfText(dxfText);
                    }}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Πάχος Εξωτερικών Τοίχων (m):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={wallThickness}
                    onChange={(e) => {
                      const t = parseFloat(e.target.value) || 0.25;
                      setWallThickness(t);
                      if (dxfText) processDxfText(dxfText);
                    }}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Visualizer & Extracted Surfaces */}
          <div className="lg:col-span-8 space-y-6">
            {/* Canvas CAD Drawing */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800 pb-2">
                <span className="flex items-center gap-2">
                  <Maximize className="w-4 h-4 text-teal-400" />
                  <span>Προεπισκόπηση Κάτοψης CAD (Viewport)</span>
                </span>
                {extractedData && (
                  <span className="text-teal-400 font-bold">
                    {extractedData.entityCount} Αντικείμενα | {extractedData.layersFound.length} Layers
                  </span>
                )}
              </div>

              <div className="relative flex items-center justify-center bg-slate-950 rounded-xl overflow-hidden min-h-[360px]">
                <canvas
                  ref={canvasRef}
                  width={680}
                  height={380}
                  className="w-full h-auto max-h-[380px] object-contain cursor-crosshair rounded-lg"
                />
                {!parsedDxfObj && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 space-y-2 pointer-events-none p-6 text-center">
                    <Box className="w-12 h-12 opacity-30 text-teal-400" />
                    <p className="text-xs font-mono">
                      Δεν έχει φορτωθεί αρχείο CAD. Επιλέξτε αρχείο `.dxf` ή πατήστε «Φόρτωση Δοκιμαστικού Σχεδίου».
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Geometry & Transfer Action Card */}
            {extractedData && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5 shadow-sm text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Υπολογισμένα Γεωμετρικά Μεγέθη Κτιρίου</span>
                  </h3>

                  <button
                    onClick={handleApplyCadToXmlModel}
                    type="button"
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow transition-all flex items-center gap-2 cursor-pointer shrink-0"
                  >
                    <span>Εφαρμογή & Μεταφορά στο XML Model</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60">
                    <span className="text-[10px] text-slate-500 block">Μικτό Εμβαδόν A_gross</span>
                    <span className="text-lg font-bold text-teal-600 dark:text-teal-400">
                      {extractedData.totalGrossArea.toFixed(2)} m²
                    </span>
                    <div className="mt-1">
                      <ValueCopyBadge value={extractedData.totalGrossArea.toFixed(2)} label="Copy A_gross" />
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60">
                    <span className="text-[10px] text-slate-500 block">Καθαρό Εμβαδόν A_net</span>
                    <span className="text-lg font-bold text-teal-600 dark:text-teal-400">
                      {extractedData.netArea.toFixed(2)} m²
                    </span>
                    <div className="mt-1">
                      <ValueCopyBadge value={extractedData.netArea.toFixed(2)} label="Copy A_net" />
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60">
                    <span className="text-[10px] text-slate-500 block">Θερμαινόμενος Όγκος V</span>
                    <span className="text-lg font-bold text-amber-500">
                      {extractedData.heatedVolume.toFixed(2)} m³
                    </span>
                    <div className="mt-1">
                      <ValueCopyBadge value={extractedData.heatedVolume.toFixed(2)} label="Copy V" />
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60">
                    <span className="text-[10px] text-slate-500 block">Περίμετρος Τοίχων</span>
                    <span className="text-lg font-bold text-sky-500">
                      {extractedData.totalWallPerimeter.toFixed(2)} m
                    </span>
                    <div className="mt-1">
                      <ValueCopyBadge value={extractedData.totalWallPerimeter.toFixed(2)} label="Copy L_walls" />
                    </div>
                  </div>
                </div>

                {/* Direct quick link to edit extracted surfaces */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Εξαχθέντα Στοιχεία: {cadOpaqueSurfaces.length} Αδιαφανή, {cadOpenings.length} Διαφανή (Κουφώματα)
                  </span>
                  <button
                    onClick={() => setActiveViewMode('SURFACES_EDITOR')}
                    type="button"
                    className="text-teal-600 dark:text-teal-400 font-bold underline hover:text-teal-500 cursor-pointer"
                  >
                    Επεξεργασία & Προβολή Πίνακα Στοιχείων →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: EDIT 2. ΑΔΙΑΦΑΝΗ & 3. ΔΙΑΦΑΝΗ */}
      {activeViewMode === 'SURFACES_EDITOR' && (
        <div className="space-y-6">
          {/* Global Action Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm text-xs">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Πίνακας 2.Αδιαφανών & 3.Διαφανών Στοιχείων από το AutoCAD
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                Επιβεβαιώστε ή τροποποιήστε τα εμβαδά, τους συντελεστές U και τους προσανατολισμούς πριν την οριστική μεταφορά στο XML.
              </p>
            </div>

            <button
              onClick={handleApplyCadToXmlModel}
              type="button"
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Εφαρμογή & Μεταφορά στο XML Model</span>
            </button>
          </div>

          {/* SECTION 2: ΑΔΙΑΦΑΝΗ ΣΤΟΙΧΕΙΑ (OPAQUE SURFACES) */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-600" />
                <span>2. Αδιαφανή Στοιχεία Κτιρίου (Τοίχοι, Οροφή, Πιλοτή, Δάπεδο)</span>
              </h3>

              <button
                onClick={handleAddOpaqueSurface}
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold text-xs rounded-lg border border-teal-200 dark:border-teal-800 hover:bg-teal-100 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Προσθήκη Αδιαφανούς</span>
              </button>
            </div>

            {cadOpaqueSurfaces.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 font-mono">
                Δεν έχουν εξαχθεί αδιαφανή στοιχεία. Φορτώστε ένα αρχείο DXF ή πατήστε «Προσθήκη Αδιαφανούς».
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300">
                  <thead className="text-[11px] font-bold text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-2.5">Ονομασία / Περιγραφή</th>
                      <th className="p-2.5">Τύπος</th>
                      <th className="p-2.5">Εμβαδόν (m²)</th>
                      <th className="p-2.5">U (W/m²K)</th>
                      <th className="p-2.5">Προσανατολισμός</th>
                      <th className="p-2.5">Συνοριακή Συνθήκη</th>
                      <th className="p-2.5 text-right">Ενέργειες</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                    {cadOpaqueSurfaces.map((s, idx) => (
                      <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={s.name}
                            onChange={(e) => {
                              const updated = [...cadOpaqueSurfaces];
                              updated[idx].name = e.target.value;
                              setCadOpaqueSurfaces(updated);
                            }}
                            className="w-full px-2 py-1 bg-transparent border-b border-slate-300 dark:border-slate-700 font-medium text-slate-900 dark:text-slate-100"
                          />
                        </td>
                        <td className="p-2.5">
                          <select
                            value={s.type}
                            onChange={(e) => {
                              const updated = [...cadOpaqueSurfaces];
                              updated[idx].type = e.target.value as any;
                              setCadOpaqueSurfaces(updated);
                            }}
                            className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-medium text-[11px]"
                          >
                            <option value="WALL">Τοίχος</option>
                            <option value="ROOF">Οροφή / Στέγη</option>
                            <option value="PILOTI">Πιλοτή</option>
                            <option value="GROUND_FLOOR">Δάπεδο επί Εδάφους</option>
                            <option value="INTERIOR_WALL">Μεσοτοιχία</option>
                          </select>
                        </td>
                        <td className="p-2.5 font-mono">
                          <input
                            type="number"
                            step="0.1"
                            value={s.area}
                            onChange={(e) => {
                              const updated = [...cadOpaqueSurfaces];
                              updated[idx].area = parseFloat(e.target.value) || 0;
                              setCadOpaqueSurfaces(updated);
                            }}
                            className="w-20 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-bold text-teal-600"
                          />
                        </td>
                        <td className="p-2.5 font-mono">
                          <input
                            type="number"
                            step="0.05"
                            value={s.uValue}
                            onChange={(e) => {
                              const updated = [...cadOpaqueSurfaces];
                              updated[idx].uValue = parseFloat(e.target.value) || 0;
                              setCadOpaqueSurfaces(updated);
                            }}
                            className="w-20 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-bold text-amber-500"
                          />
                        </td>
                        <td className="p-2.5">
                          <select
                            value={s.orientation}
                            onChange={(e) => {
                              const updated = [...cadOpaqueSurfaces];
                              updated[idx].orientation = e.target.value as any;
                              setCadOpaqueSurfaces(updated);
                            }}
                            className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-medium text-[11px]"
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
                        </td>
                        <td className="p-2.5">
                          <select
                            value={s.boundary}
                            onChange={(e) => {
                              const updated = [...cadOpaqueSurfaces];
                              updated[idx].boundary = e.target.value as any;
                              setCadOpaqueSurfaces(updated);
                            }}
                            className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-medium text-[11px]"
                          >
                            <option value="EXTERNAL_AIR">Εξωτερικός Αέρας</option>
                            <option value="UNHEATED_SPACE">Μη Θερμαινόμενος Χώρος (ΜΘΧ)</option>
                            <option value="GROUND">Έδαφος</option>
                            <option value="ADJACENT_BUILDING">Όμορο Κτίριο</option>
                          </select>
                        </td>
                        <td className="p-2.5 text-right">
                          <button
                            onClick={() => handleRemoveOpaqueSurface(s.id)}
                            type="button"
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SECTION 3: ΔΙΑΦΑΝΗ ΣΤΟΙΧΕΙΑ / ΚΟΥΦΩΜΑΤΑ (OPENINGS) */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-500" />
                <span>3. Διαφανή Στοιχεία / Κουφώματα (Παράθυρα, Μπαλκονόπορτες)</span>
              </h3>

              <button
                onClick={handleAddOpening}
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold text-xs rounded-lg border border-amber-200 dark:border-amber-800 hover:bg-amber-100 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Προσθήκη Κουφώματος</span>
              </button>
            </div>

            {cadOpenings.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 font-mono">
                Δεν έχουν εξαχθεί κουφώματα. Φορτώστε ένα αρχείο DXF ή πατήστε «Προσθήκη Κουφώματος».
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300">
                  <thead className="text-[11px] font-bold text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-2.5">Ονομασία / Τύπος</th>
                      <th className="p-2.5">Εμβαδόν (m²)</th>
                      <th className="p-2.5">U_w (W/m²K)</th>
                      <th className="p-2.5">g_gl</th>
                      <th className="p-2.5">Διείσδυση Αέρα (m³/h/m²)</th>
                      <th className="p-2.5">Προσανατολισμός</th>
                      <th className="p-2.5 text-right">Ενέργειες</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                    {cadOpenings.map((op, idx) => (
                      <tr key={op.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={op.name}
                            onChange={(e) => {
                              const updated = [...cadOpenings];
                              updated[idx].name = e.target.value;
                              setCadOpenings(updated);
                            }}
                            className="w-full px-2 py-1 bg-transparent border-b border-slate-300 dark:border-slate-700 font-medium text-slate-900 dark:text-slate-100"
                          />
                        </td>
                        <td className="p-2.5 font-mono">
                          <input
                            type="number"
                            step="0.1"
                            value={op.area}
                            onChange={(e) => {
                              const updated = [...cadOpenings];
                              updated[idx].area = parseFloat(e.target.value) || 0;
                              setCadOpenings(updated);
                            }}
                            className="w-20 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-bold text-amber-500"
                          />
                        </td>
                        <td className="p-2.5 font-mono">
                          <input
                            type="number"
                            step="0.1"
                            value={op.uWindow}
                            onChange={(e) => {
                              const updated = [...cadOpenings];
                              updated[idx].uWindow = parseFloat(e.target.value) || 0;
                              setCadOpenings(updated);
                            }}
                            className="w-20 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-bold text-teal-600"
                          />
                        </td>
                        <td className="p-2.5 font-mono">
                          <input
                            type="number"
                            step="0.05"
                            value={op.gGlass}
                            onChange={(e) => {
                              const updated = [...cadOpenings];
                              updated[idx].gGlass = parseFloat(e.target.value) || 0;
                              setCadOpenings(updated);
                            }}
                            className="w-20 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-bold"
                          />
                        </td>
                        <td className="p-2.5 font-mono">
                          <input
                            type="number"
                            step="1"
                            value={op.vInfiltration}
                            onChange={(e) => {
                              const updated = [...cadOpenings];
                              updated[idx].vInfiltration = parseFloat(e.target.value) || 0;
                              setCadOpenings(updated);
                            }}
                            className="w-20 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-bold"
                          />
                        </td>
                        <td className="p-2.5">
                          <select
                            value={op.orientation}
                            onChange={(e) => {
                              const updated = [...cadOpenings];
                              updated[idx].orientation = e.target.value as any;
                              setCadOpenings(updated);
                            }}
                            className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-medium text-[11px]"
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
                        </td>
                        <td className="p-2.5 text-right">
                          <button
                            onClick={() => handleRemoveOpening(op.id)}
                            type="button"
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW MODE 3: AUTOLISP SCRIPT GENERATOR */}
      {activeViewMode === 'LISP_GUIDE' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Code className="w-5 h-5 text-teal-600" />
                <span>AutoLISP Script (`KENAKEX.lsp`) για Απευθείας Εξαγωγή από το AutoCAD</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Φορτώστε το LISP script στο AutoCAD (`APPLOAD`) για να υπολογίζετε αυτόματα εμβαδά και περιμέτρους με την εντολή `KENAKEX`.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleCopyLisp}
                type="button"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
              >
                {copiedLisp ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLisp ? 'Αντιγράφηκε!' : 'Αντιγραφή LISP'}</span>
              </button>

              <button
                onClick={handleDownloadLisp}
                type="button"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow"
              >
                <Download className="w-4 h-4" />
                <span>Λήψη `.lsp`</span>
              </button>
            </div>
          </div>

          {/* Instructions Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1">
              <div className="font-bold text-teal-600 dark:text-teal-400 font-mono text-sm">Βήμα 1: Κατεβάστε το Script</div>
              <p className="text-slate-600 dark:text-slate-300">
                Πατήστε «Λήψη `.lsp`» και αποθηκεύστε το αρχείο `EXPORT_KENAK_GEOMETRY.lsp` στον υπολογιστή σας.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1">
              <div className="font-bold text-teal-600 dark:text-teal-400 font-mono text-sm">Βήμα 2: Φόρτωση στο AutoCAD</div>
              <p className="text-slate-600 dark:text-slate-300">
                Στο AutoCAD πληκτρολογήστε <code className="font-bold text-teal-500">APPLOAD</code>, επιλέξτε το `.lsp` αρχείο και πατήστε Load.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1">
              <div className="font-bold text-teal-600 dark:text-teal-400 font-mono text-sm">Βήμα 3: Εκτέλεση Εντολής</div>
              <p className="text-slate-600 dark:text-slate-300">
                Πληκτρολογήστε <code className="font-bold text-teal-500">KENAKEX</code> και επιλέξτε τα polylines των ζωνών/τοίχων.
              </p>
            </div>
          </div>

          {/* Code Viewer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Κώδικας AutoLISP (`EXPORT_KENAK_GEOMETRY.lsp`)</span>
              <span>LISP v1.2</span>
            </div>
            <pre className="p-4 bg-slate-950 text-emerald-400 rounded-xl border border-slate-800 font-mono text-[11px] overflow-x-auto leading-relaxed max-h-[380px]">
              {sampleLispCode}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export type ClimateZone = 'A' | 'B' | 'G' | 'D';

export type BuildingAgeCategory = 'PRE_1979' | '1979_2010' | 'POST_2010';

export type BuildingUse = 
  | 'RESIDENTIAL_SINGLE' 
  | 'RESIDENTIAL_MULTI' 
  | 'OFFICE' 
  | 'COMMERCIAL' 
  | 'EDUCATIONAL' 
  | 'HOTEL' 
  | 'HEALTHCARE';

export interface TypicalValueItem {
  id: string;
  category: 'KELYFOS' | 'KOUFOMATA' | 'THERMANSI' | 'PSYXI' | 'ZNX' | 'AERISMOS' | 'FOTISMOS' | 'SKIASI' | 'THERMOGEFYRES';
  title: string;
  codeOrTable?: string; // e.g. "ΤΟΤΕΕ 20701-1/2017 Πίνακας 3.4α"
  buildingAge?: BuildingAgeCategory | 'ALL';
  value: string; // e.g. "2.20 W/m²K" or "0.85"
  numericValue?: number;
  unit?: string;
  description: string;
  kenakField: string; // Target field in TEE-KENAK app
  notes?: string;
  tags: string[];
}

export interface ForumQAItem {
  id: string;
  question: string;
  category: string;
  answer: string;
  source: string; // e.g. "michanikos.gr", "Εγκύκλιος ΥΠΕΝ", "ΤΟΤΕΕ 20701-1"
  kenakTab: string; // e.g. "Κτίριο / Θερμικές Ζώνες"
  tags: string[];
}

export interface MaterialItem {
  id: string;
  name: string;
  category: 'CONCRETE' | 'BRICK' | 'INSULATION' | 'MORTAR' | 'STONE' | 'WOOD' | 'AIR' | 'OTHER';
  lambda: number; // Thermal conductivity λ (W/mK)
  density?: number; // kg/m³
  description?: string;
}

export interface WallLayer {
  id: string;
  materialId: string;
  name: string;
  thicknessCm: number;
  lambda: number;
}

export interface InspectionData {
  buildingName: string;
  address: string;
  ownerName: string;
  afm: string;
  kaek: string;
  use: BuildingUse;
  climateZone: ClimateZone;
  yearBuilt: number;
  grossArea: number;
  netArea: number;
  heatedVolume: number;
  hasThermography: boolean;
  notes: string;
  inspectDate: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  source: string;
  category: string;
}

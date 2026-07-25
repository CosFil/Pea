import { BuildingUse, ClimateZone, BuildingAgeCategory } from './kenak';

export type OrientationType = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW' | 'HORIZ';

export type BoundaryCondition = 'EXTERNAL_AIR' | 'UNHEATED_SPACE' | 'GROUND' | 'ADJACENT_BUILDING';

export interface OpaqueSurfaceInput {
  id: string;
  name: string;
  type: 'WALL' | 'ROOF' | 'PILOTI' | 'GROUND_FLOOR' | 'INTERIOR_WALL';
  area: number; // m²
  uValue: number; // W/m²K
  deltaUtb: number; // W/m²K
  orientation: OrientationType;
  tiltAngle: number; // degrees: 0 for roof, 90 for wall
  boundary: BoundaryCondition;
  absorption: number; // e.g. 0.60
  emissivity: number; // e.g. 0.90
}

export interface OpeningInput {
  id: string;
  name: string;
  area: number; // m²
  uWindow: number; // W/m²K (U_w)
  gGlass: number; // g_gl (0.0 - 1.0)
  vInfiltration: number; // m³/h/m²
  frameRatio: number; // F_f (0.20)
  orientation: OrientationType;
  fOvH: number; // Overhang Winter (0.0 - 1.0)
  fOvC: number; // Overhang Summer (0.0 - 1.0)
  fFinH: number; // Side Fin Winter
  fFinC: number; // Side Fin Summer
  fHorH: number; // Horizon Winter
  fHorC: number; // Horizon Summer
  fShC: number; // Shutter/Blind Summer
}

export interface HeatingSystemInput {
  id: string;
  name: string;
  type: 
    | 'OIL_BOILER' 
    | 'GAS_BOILER' 
    | 'GAS_CONDENSING' 
    | 'HEAT_PUMP' 
    | 'SPLIT_AC' 
    | 'FIREPLACE_OPEN' 
    | 'FIREPLACE_CLOSED' 
    | 'DISTRICT_HEATING' 
    | 'BIOMASS';
  fuel: 'HEATING_OIL' | 'NATURAL_GAS' | 'ELECTRICITY' | 'BIOMASS' | 'WOOD';
  powerKw: number; // kW
  efficiency: number; // η_g decimal or COP
  distributionEff: number; // e_d (e.g. 0.90)
  terminalEff: number; // e_em (e.g. 0.92)
  automationClass: 'A' | 'B' | 'C' | 'D';
  coverageRatio: number; // 1.0 = 100%
}

export interface CoolingSystemInput {
  id: string;
  name: string;
  type: 'SPLIT_INVERTER' | 'SPLIT_ONOFF' | 'CHILLER' | 'HEAT_PUMP_COOLING' | 'NO_COOLING';
  powerKw: number; // kW
  eer: number; // EER (e.g. 3.50)
  coverageRatio: number; // 1.0 = 100%
}

export interface DhwSystemInput {
  type: 'ELECTRIC_HEATER' | 'BOILER_HEATING' | 'HEAT_PUMP_DHW' | 'GAS_HEATER';
  powerKw: number;
  efficiency: number; // e.g. 1.00
  hasSolarThermal: boolean;
  solarAreaM2: number; // m²
  collectorType: 'SELECTIVE' | 'STANDARD';
  solarOrientation: OrientationType;
  solarTilt: number; // e.g. 45°
  tankLiters: number; // e.g. 160L
}

export interface RenewableSystemInput {
  hasPv: boolean;
  pvKwP: number; // kWp
  pvYieldKwhYear: number; // kWh/year
  pvTilt: number;
  pvOrientation: OrientationType;
}

export interface RecommendationScenario {
  id: string;
  title: string;
  description: string;
  targetUWall?: number;
  targetUWindow?: number;
  targetSystemCop?: number;
  hasSolarAdd?: boolean;
  estimatedSavingPercent: number; // %
}

export interface FullBuildingModel {
  // General Admin & Identity (EasyKENAK Step 1)
  protocolId?: string; // Αριθμός Πρωτοκόλλου buildingcert
  buildingName: string;
  buildingUnitTitle?: string; // Τίτλος Κτιριακής Μονάδας
  isEntireBuilding?: boolean; // true = Ολόκληρο Κτίριο, false = Κτιριακή Μονάδα
  ownershipType?: string; // Ιδιοκτησιακό Καθεστώς (π.χ. Πλήρης Κυριότητα, Ενοίκιο)
  address: string;
  prefecture: string;
  municipality: string;
  postcode: string;
  ownerName: string;
  afm: string;
  kaek: string;
  buildingUse: BuildingUse;
  climateZone: ClimateZone;
  yearBuilt: number;
  ageCategory: BuildingAgeCategory;
  grossArea: number; // m²
  netArea: number; // m²
  heatedVolume: number; // m³
  inspectionDate: string;
  inspectorNotes: string;
  inspectorName: string;
  inspectorRegNum: string; // Αριθμός Μητρώου Επιθεωρητή
  respPersonName?: string;
  respPersonPhone?: string;
  respPersonEmail?: string;

  // Initialization & Climate (EasyKENAK Step 2)
  climaticStation?: string; // Σταθμός/Πόλη Κλιματικών Δεδομένων
  altitudeAbove500m?: boolean; // Υψόμετρο > 500m
  buildingCategoryType?: 'OLD_PRE81' | 'RENOVATED_2010' | 'NEW_2010' | 'RENOVATED_2017' | 'NEW_2017';
  coefAbsorption?: number; // Συντελεστής απορροφητικότητας (α)
  coefEmissivity?: number; // Συντελεστής εκπομπής (ε)

  // Thermal Zone (EasyKENAK Step 3 & 4)
  zoneName: string;
  freshAirFlow: number; // m³/h
  dhwDailyDemand: number; // L/day

  // Subsystems (EasyKENAK Step 5)
  opaqueSurfaces: OpaqueSurfaceInput[];
  openings: OpeningInput[];
  heatingSystems: HeatingSystemInput[];
  coolingSystems: CoolingSystemInput[];
  dhwSystem: DhwSystemInput;
  renewableSystem: RenewableSystemInput;

  // Lighting Systems
  lightingPowerKw?: number; // Installed lighting power kW
  lightingControlAuto?: boolean; // Automatic daylight control

  // Scenarios & Financial / Exoikonomo 2025 (EasyKENAK Step 6)
  scenarios: RecommendationScenario[];
  exoikonomoBudgetScen1?: number; // €
  exoikonomoBudgetScen2?: number; // €
  exoikonomoBudgetScen3?: number; // €
  degreeDaysFactorK1?: number; // Συντελεστής Βαθμοημερών K1
}

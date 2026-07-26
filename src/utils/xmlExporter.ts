import { FullBuildingModel } from '../types/xmlKenak';

export interface AuditIssue {
  type: 'ERROR' | 'WARNING' | 'INFO';
  code: string;
  field: string;
  message: string;
}

/**
 * Validates the building model against buildingcert.gr requirements
 */
export function auditBuildingModel(model: FullBuildingModel): AuditIssue[] {
  const issues: AuditIssue[] = [];

  // Admin checks
  if (!model.buildingName || !model.buildingName.trim()) {
    issues.push({
      type: 'ERROR',
      code: 'ERR_NAME_EMPTY',
      field: 'Όνομα/Περιγραφή Κτιρίου',
      message: 'Συμπληρώστε το όνομα ή την περιγραφή του κτιρίου/ιδιοκτησίας.',
    });
  }

  if (!model.address || !model.address.trim()) {
    issues.push({
      type: 'ERROR',
      code: 'ERR_ADDRESS_EMPTY',
      field: 'Διεύθυνση Ακινήτου',
      message: 'Συμπληρώστε τη διεύθυνση του ακινήτου (οδό, αριθμό, περιοχή).',
    });
  }

  if (!model.ownerName || !model.ownerName.trim()) {
    issues.push({
      type: 'ERROR',
      code: 'ERR_OWNER_EMPTY',
      field: 'Ονοματεπώνυμο Ιδιοκτήτη',
      message: 'Συμπληρώστε το ονοματεπώνυμο του ιδιοκτήτη.',
    });
  }

  if (!model.afm || model.afm.trim().length !== 9 || !/^\d+$/.test(model.afm.trim())) {
    issues.push({
      type: 'ERROR',
      code: 'ERR_AFM',
      field: 'ΑΦΜ Ιδιοκτήτη',
      message: 'Το ΑΦΜ πρέπει να αποτελείται από ακριβώς 9 ψηφία για την υποβολή στο buildingcert.gr.',
    });
  }

  if (!model.kaek || model.kaek.trim().length < 10) {
    issues.push({
      type: 'WARNING',
      code: 'WARN_KAEK',
      field: 'ΚΑΕΚ Ακινήτου',
      message: 'Συνιστάται ο πλήρης 12ψήφιος ή 16ψήφιος ΚΑΕΚ για την ταυτοποίηση στο Εθνικό Κτηματολόγιο.',
    });
  }

  if (!model.prefecture || !model.municipality) {
    issues.push({
      type: 'WARNING',
      code: 'WARN_LOCATION',
      field: 'Περιφερειακή Ενότητα / Δήμος',
      message: 'Συμπληρώστε τον Δήμο και την Περιφερειακή Ενότητα για την ορθή κλιματική κατάταξη.',
    });
  }

  // Geometry checks
  if (model.grossArea <= 0) {
    issues.push({
      type: 'ERROR',
      code: 'ERR_AREA_ZERO',
      field: 'Μικτή Επιφάνεια',
      message: 'Η συνολική επιφάνεια του κτιρίου/ζώνης πρέπει να είναι μεγαλύτερη του μηδενός.',
    });
  }

  if (model.heatedVolume <= 0) {
    issues.push({
      type: 'ERROR',
      code: 'ERR_VOLUME_ZERO',
      field: 'Θερμαινόμενος Όγκος',
      message: 'Ο θερμαινόμενος όγκος πρέπει να είναι θετικός αριθμός.',
    });
  }

  // Opaque check
  if (model.opaqueSurfaces.length === 0) {
    issues.push({
      type: 'ERROR',
      code: 'ERR_NO_OPAQUE',
      field: 'Αδιαφανή Στοιχεία',
      message: 'Δεν έχετε προσθέσει κανένα αδιαφανές δομικό στοιχείο (τοίχο, δώμα, δάπεδο).',
    });
  } else {
    const totalOpaqueArea = model.opaqueSurfaces.reduce((acc, curr) => acc + curr.area, 0);
    if (totalOpaqueArea <= 0) {
      issues.push({
        type: 'ERROR',
        code: 'ERR_OPAQUE_AREA_ZERO',
        field: 'Εμβαδόν Αδιαφανών',
        message: 'Το συνολικό εμβαδόν αδιαφανών στοιχείων είναι 0 m².',
      });
    }

    model.opaqueSurfaces.forEach((surf, idx) => {
      if (surf.uValue > 5.0) {
        issues.push({
          type: 'WARNING',
          code: 'WARN_U_HIGH',
          field: `Αδιαφανές: ${surf.name}`,
          message: `Πολύ υψηλή τιμή U = ${surf.uValue} W/m²K. Βεβαιωθείτε ότι συνάδει με την ΤΟΤΕΕ 20701-1.`,
        });
      }
    });
  }

  // Openings check
  if (model.openings.length === 0) {
    issues.push({
      type: 'WARNING',
      code: 'WARN_NO_OPENINGS',
      field: 'Διαφανή Στοιχεία / Κουφώματα',
      message: 'Δεν έχουν δηλωθεί κουφώματα. Για κατοικία απαιτείται φυσικός φωτισμός & αερισμός.',
    });
  } else {
    model.openings.forEach((op) => {
      if (op.uWindow < 0.8 || op.uWindow > 7.0) {
        issues.push({
          type: 'WARNING',
          code: 'WARN_UW_RANGE',
          field: `Κούφωμα: ${op.name}`,
          message: `Η τιμή U_w = ${op.uWindow} W/m²K είναι εκτός των συνήθων ορίων (1.0 - 6.2 W/m²K).`,
        });
      }
    });
  }

  // Heating checks
  if (model.heatingSystems.length === 0) {
    issues.push({
      type: 'WARNING',
      code: 'WARN_NO_HEATING',
      field: 'Σύστημα Θέρμανσης',
      message: 'Δεν έχει δηλωθεί σύστημα θέρμανσης. Το ΤΕΕ-ΚΕΝΑΚ θα θεωρήσει 100% κάλυψη από το κτίριο αναφοράς.',
    });
  }

  // DHW checks
  if (model.dhwSystem.hasSolarThermal && model.dhwSystem.solarAreaM2 <= 0) {
    issues.push({
      type: 'ERROR',
      code: 'ERR_SOLAR_AREA',
      field: 'Ηλιακοί Συλλέκτες',
      message: 'Έχετε επιλέξει ύπαρξη Ηλιακού Θερμοσίφωνα αλλά η επιφάνεια συλλεκτών είναι 0 m².',
    });
  }

  return issues;
}

/**
 * Escapes special XML characters
 */
function escapeXml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Helper to convert building use enum to TEE-KENAK code (blg_use) and label
 */
function getBuildingUseInfo(use: string): { code: string; label: string } {
  switch (use) {
    case 'RESIDENTIAL_SINGLE':
    case 'RESIDENTIAL':
      return { code: '1', label: 'Μονοκατοικία' };
    case 'RESIDENTIAL_MULTI':
      return { code: '2', label: 'Πολυκατοικία' };
    case 'OFFICE':
      return { code: '3', label: 'Γραφεία' };
    case 'COMMERCIAL':
      return { code: '4', label: 'Εμπορικό' };
    case 'EDUCATION':
      return { code: '5', label: 'Εκπαίδευση' };
    case 'HEALTH':
      return { code: '6', label: 'Υγεία' };
    case 'HOTEL':
      return { code: '7', label: 'Ξενοδοχείο' };
    case 'RESTAURANT':
      return { code: '8', label: 'Εστίαση' };
    case 'ASSEMBLY':
      return { code: '9', label: 'Συνάθροιση Κοινού' };
    default:
      return { code: '2', label: 'Πολυκατοικία' };
  }
}

/**
 * Helper to convert climate zone to TEE-KENAK code (blg_zone)
 * Zone A = 0, Zone B = 1, Zone C = 2, Zone D = 3
 */
function getClimateZoneCode(zone: string): string {
  switch (zone) {
    case 'A': return '0';
    case 'B': return '1';
    case 'C': return '2';
    case 'D': return '3';
    default: return '1';
  }
}

/**
 * Helper to convert orientation enum/string to degrees
 */
function getOrientationDegrees(orient: string): string {
  switch (orient) {
    case 'N': return '0';
    case 'NE': return '45';
    case 'E': return '90';
    case 'SE': return '135';
    case 'S': return '180';
    case 'SW': return '225';
    case 'W': return '270';
    case 'NW': return '315';
    case 'HORIZ': return '0';
    default: return '190';
  }
}

/**
 * Helper to convert degrees to orientation enum string
 */
function degreesToOrientation(deg: number): 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW' | 'HORIZ' {
  const normalized = ((deg % 360) + 360) % 360;
  if (normalized >= 337.5 || normalized < 22.5) return 'N';
  if (normalized >= 22.5 && normalized < 67.5) return 'NE';
  if (normalized >= 67.5 && normalized < 112.5) return 'E';
  if (normalized >= 112.5 && normalized < 157.5) return 'SE';
  if (normalized >= 157.5 && normalized < 202.5) return 'S';
  if (normalized >= 202.5 && normalized < 247.5) return 'SW';
  if (normalized >= 247.5 && normalized < 292.5) return 'W';
  if (normalized >= 292.5 && normalized < 337.5) return 'NW';
  return 'S';
}

/**
 * Helper to convert boundary condition to OPAQUE TEE-KENAK string
 */
function getOpaqueBoundaryText(boundary: string, uVal: number): string {
  switch (boundary) {
    case 'EXTERNAL_AIR':
      return uVal > 0.50 ? 'Χωρίς θερμομονωτική προστασία' : 'Εξωτερικός αέρας με θερμομόνωση';
    case 'UNHEATED_SPACE':
      return 'Επαφή με ΜΘΧ (b=0.5)';
    case 'GROUND':
      return 'Σε επαφή με το έδαφος';
    case 'ADJACENT_BUILDING':
      return 'Επαφή με Όμορο';
    default:
      return 'Χωρίς θερμομονωτική προστασία';
  }
}

/**
 * Helper to convert boundary condition to OPENING TEE-KENAK string
 */
function getOpeningBoundaryText(boundary: string): string {
  switch (boundary) {
    case 'UNHEATED_SPACE':
      return 'Σε ΜΘΧ';
    case 'GROUND':
      return 'Σε επαφή με το έδαφος';
    case 'ADJACENT_BUILDING':
      return 'Σε επαφή με Όμορο';
    case 'EXTERNAL_AIR':
    default:
      return '';
  }
}

/**
 * Helper to convert fuel enum to TEE-KENAK fuel string
 */
function getFuelText(fuel: string): string {
  switch (fuel) {
    case 'HEATING_OIL': return 'Oil';
    case 'NATURAL_GAS': return 'Gas';
    case 'LPG': return 'LPG';
    case 'ELECTRICITY': return 'Electricity';
    case 'BIOMASS': return 'Biomass';
    default: return 'Electricity';
  }
}

/**
 * Helper to convert heating system type to TEE-KENAK text
 */
function getHeatingTypeText(type: string): string {
  switch (type) {
    case 'OIL_BOILER': return 'Λέβητας πετρελαίου';
    case 'GAS_BOILER': return 'Λέβητας φυσικού αερίου';
    case 'GAS_CONDENSING': return 'Λέβητας συμπύκνωσης αερίου';
    case 'HEAT_PUMP': return 'Αντλία θερμότητας';
    case 'ELECTRIC_HEATER': return 'Τοπικές ηλεκτρικές μονάδες (καλοριφέρ ή θερμοπομποί ή άλλο)';
    case 'BIOMASS_BOILER': return 'Λέβητας βιομάζας';
    case 'FIREPLACE_OPEN': return 'Τζάκι ανοικτού τύπου';
    case 'FIREPLACE_ENERGY': return 'Ενεργειακό τζάκι';
    default: return 'Τοπικές ηλεκτρικές μονάδες (καλοριφέρ ή θερμοπομποί ή άλλο)';
  }
}

/**
 * Helper to convert cooling system type to TEE-KENAK text
 */
function getCoolingTypeText(type: string): string {
  switch (type) {
    case 'SPLIT_AC': return 'Local air conditioning split unit';
    case 'CHILLER_AIR': return 'Αερόψυκτος ψύκτης';
    case 'HEAT_PUMP_COOL': return 'Αντλία θερμότητας (Ψύξη)';
    default: return 'Αερόψυκτος ψύκτης';
  }
}

/**
 * Helper to convert DHW system type to TEE-KENAK text
 */
function getDhwTypeText(type: string): string {
  switch (type) {
    case 'ELECTRIC_HEATER': return 'Τοπικός ηλεκτρικός θερμαντήρας';
    case 'BOILER_HEATING': return 'Κεντρικό σύστημα θέρμανσης (Boiler)';
    case 'SOLAR_ONLY': return 'Ηλιακός θερμοσίφωνας';
    case 'HEAT_PUMP_DHW': return 'Αντλία θερμότητας ΖΝΧ';
    default: return 'Τοπικός ηλεκτρικός θερμαντήρας';
  }
}

/**
 * Generates official TEE-KENAK v1.31 / buildingcert.gr compliant XML file (<ENR_IN> format)
 */
export function generateKenakXml(model: FullBuildingModel): string {
  const useInfo = getBuildingUseInfo(model.buildingUse);
  const zoneCode = getClimateZoneCode(model.climateZone);
  const opaqueList = model.opaqueSurfaces || [];
  const openingList = model.openings || [];
  const heatingList = model.heatingSystems || [];
  const coolingList = model.coolingSystems || [];
  const dhw = model.dhwSystem || { type: 'ELECTRIC_HEATER', powerKw: 4, efficiency: 0.98, hasSolarThermal: false };

  // Prepare opaque column arrays
  const opaqueCount = opaqueList.length;
  const opCol1 = opaqueList.map(s => escapeXml(s.name)).join(',');
  const opCol2 = opaqueList.map(s => getOpaqueBoundaryText(s.boundary, s.uValue)).join(',');
  const opCol3 = opaqueList.map(s => getOrientationDegrees(s.orientation)).join(',');
  const opCol4 = opaqueList.map(s => (s.tiltAngle ?? 90).toString()).join(',');
  const opCol5 = opaqueList.map(s => s.area.toFixed(2)).join(',');
  const opCol6 = opaqueList.map(s => s.uValue.toFixed(2)).join(',');
  const opCol7 = opaqueList.map(s => (s.deltaUtb || 0).toFixed(2)).join(',');
  const opCol8 = opaqueList.map(s => (s.absorption ?? 0.6).toFixed(1)).join(',');
  const opCol9 = opaqueList.map(s => (s.emissivity ?? 0.8).toFixed(1)).join(',');
  const opCol10To15 = opaqueList.map(() => '1').join(',');
  const opCol16 = opaqueList.map(() => '').join(',');

  // Prepare opening column arrays
  const openingCount = openingList.length;
  const opnCol1 = openingList.map(o => escapeXml(o.name || 'Ανοιγόμενο κούφωμα')).join(',');
  const opnCol2 = openingList.map(o => getOpeningBoundaryText(o.boundary)).join(',');
  const opnCol3 = openingList.map(o => getOrientationDegrees(o.orientation)).join(',');
  const opnCol4 = openingList.map(() => '90').join(',');
  const opnCol5 = openingList.map(o => o.area.toFixed(2)).join(',');
  const opnCol7 = openingList.map(o => o.uWindow.toFixed(2)).join(',');
  const opnCol8 = openingList.map(o => (o.gGlass ?? 0.75).toFixed(2)).join(',');
  const opnCol9 = openingList.map(o => (o.fOvH ?? 1.0).toFixed(2)).join(',');
  const opnCol10 = openingList.map(o => (o.fOvC ?? 1.0).toFixed(2)).join(',');
  const opnCol11 = openingList.map(o => (o.fFinH ?? 1.0).toFixed(2)).join(',');
  const opnCol12 = openingList.map(o => (o.fFinC ?? 1.0).toFixed(2)).join(',');
  const opnCol13 = openingList.map(o => (o.fHorH ?? 1.0).toFixed(2)).join(',');
  const opnCol14 = openingList.map(o => (o.fHorC ?? 1.0).toFixed(2)).join(',');
  const opnCol15 = openingList.map(() => '').join(',');

  const xmlLines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<ENR_IN>',
    '  <EPA_NR_PROJECT rid="#1">',
    `    <id>${escapeXml(model.protocolId || '125750/2026')}</id>`,
    `    <blg_use>${useInfo.code}</blg_use>`,
    '    <blg_part>1</blg_part>',
    `    <building_num>${escapeXml(model.buildingName || 'ΔΙΑΜΕΡΙΣΜΑ')}</building_num>`,
    `    <blg_kaek>${escapeXml(model.kaek || '')}</blg_kaek>`,
    `    <blg_owner>${escapeXml(model.ownerName || '')}</blg_owner>`,
    '    <blg_ownership>1</blg_ownership>',
    `    <blg_address>${escapeXml(model.address || '')}</blg_address>`,
    '    <blg_resp>0</blg_resp>',
    `    <blg_resp_name>${escapeXml(model.inspectorName || '')}</blg_resp_name>`,
    `    <blg_resp_phone>${escapeXml(model.inspectorRegNum || '')}</blg_resp_phone>`,
    '    <blg_resp_mail/>',
    `    <blg_zone>${zoneCode}</blg_zone>`,
    `    <blg_height>${model.altitudeAbove500m ? 1 : 0}</blg_height>`,
    '    <blg_climate>0</blg_climate>',
    '    <blg_datasource>1000000010</blg_datasource>',
    '    <blg_licence_data/>',
    '    <version_tee_kenak_dll>1.31.1.9</version_tee_kenak_dll>',
    '    <blg_type>0</blg_type>',
    '  </EPA_NR_PROJECT>',
    '  <LIBRARIES rid="#2">',
    '    <id>Lib</id>',
    '    <lib_const>C:\\Program Files (x86)\\TEE\\TEE_KENAK_1_31\\EnrConstGr.xml</lib_const>',
    '    <lib_clim>C:\\Program Files (x86)\\TEE\\TEE_KENAK_1_31\\EnrClimateGR.xml</lib_clim>',
    '    <lib_fuel>C:\\Program Files (x86)\\TEE\\TEE_KENAK_1_31\\EnrFuelGr.xml</lib_fuel>',
    '  </LIBRARIES>',
    '  <BUILDING rid="1">',
    `    <blg_parameter1>${model.grossArea.toFixed(2)}</blg_parameter1>`,
    `    <blg_parameter2>${model.netArea.toFixed(2)}</blg_parameter2>`,
    '    <blg_parameter3>0</blg_parameter3>',
    `    <blg_parameter4>${model.heatedVolume.toFixed(2)}</blg_parameter4>`,
    `    <blg_parameter5>${model.heatedVolume.toFixed(2)}</blg_parameter5>`,
    '    <blg_parameter6>0</blg_parameter6>',
    '    <blg_parameter7>0</blg_parameter7>',
    '    <blg_parameter8>1</blg_parameter8>',
    '    <blg_parameter9/>',
    '    <blg_parameter10>-1</blg_parameter10>',
    '    <blg_parameter11>1</blg_parameter11>',
    '    <blg_parameter12/>',
    '    <blg_parameter13/>',
    `    <blg_parameter14>${useInfo.label}</blg_parameter14>`,
    `    <blg_parameter15>${model.yearBuilt || 1980}</blg_parameter15>`,
    '    <blg_parameter16>0</blg_parameter16>',
    '    <blg_parameter17>0</blg_parameter17>',
    '    <blg_parameter18/>',
    '    <blg_parameter19>0</blg_parameter19>',
    '    <blg_parameter20/>',
    '    <blg_parameter21>0</blg_parameter21>',
    '    <blg_parameter22/>',
    '    <blg_parameter23>0</blg_parameter23>',
    '    <blg_parameter24/>',
    '    <blg_parameter25/>',
    '    <blg_parameter26>0</blg_parameter26>',
    '    <blg_parameter27>0</blg_parameter27>',
    '    <blg_parameter28/>',
    '    <blg_parameter29>0</blg_parameter29>',
    '    <blg_parameter30>0</blg_parameter30>',
    '    <blg_parameter31/>',
    '    <blg_parameter32>1</blg_parameter32>',
    `    <blg_parameter33>${useInfo.label}</blg_parameter33>`,
    '    <blg_parameter34>Υπάρχον κτίριο</blg_parameter34>',
    '    <ZONE1 rid="1">',
    `      <zn_parameter1>${useInfo.label}</zn_parameter1>`,
    '      <zn_parameter2/>',
    `      <zn_parameter3>${model.grossArea.toFixed(2)}</zn_parameter3>`,
    `      <zn_parameter4>${model.heatedVolume.toFixed(2)}</zn_parameter4>`,
    '      <zn_parameter5>3</zn_parameter5>',
    `      <zn_parameter6>${(model.dhwDailyDemand || 100).toFixed(1)}</zn_parameter6>`,
    '      <zn_parameter7>0</zn_parameter7>',
    '      <zn_parameter8>0</zn_parameter8>',
    '      <zn_parameter9>0</zn_parameter9>',
    '      <zn_parameter10>0</zn_parameter10>',
    '      <zn_parameter11>1</zn_parameter11>',
    '      <zn_parameter12>27.38</zn_parameter12>',
    '      <zn_parameter13>False</zn_parameter13>',
    '      <zn_parameter14>3</zn_parameter14>',
    '      <zn_parameter15>0</zn_parameter15>',
    '      <ENVELOPE rid="1">',
    `        <opaque_rows>${opaqueCount}</opaque_rows>`,
    `        <opaque_column1>${opCol1}</opaque_column1>`,
    `        <opaque_column2>${opCol2}</opaque_column2>`,
    `        <opaque_column3>${opCol3}</opaque_column3>`,
    `        <opaque_column4>${opCol4}</opaque_column4>`,
    `        <opaque_column5>${opCol5}</opaque_column5>`,
    `        <opaque_column6>${opCol6}</opaque_column6>`,
    `        <opaque_column7>${opCol7}</opaque_column7>`,
    `        <opaque_column8>${opCol8}</opaque_column8>`,
    `        <opaque_column9>${opCol9}</opaque_column9>`,
    `        <opaque_column10>${opCol10To15}</opaque_column10>`,
    `        <opaque_column11>${opCol10To15}</opaque_column11>`,
    `        <opaque_column12>${opCol10To15}</opaque_column12>`,
    `        <opaque_column13>${opCol10To15}</opaque_column13>`,
    `        <opaque_column14>${opCol10To15}</opaque_column14>`,
    `        <opaque_column15>${opCol10To15}</opaque_column15>`,
    `        <opaque_column16>${opCol16}</opaque_column16>`,
    '        <ground_rows>0</ground_rows>',
    '        <ground_column1/>',
    '        <ground_column2/>',
    '        <ground_column3/>',
    '        <ground_column4/>',
    '        <ground_column5/>',
    '        <ground_column6/>',
    '        <ground_column7/>',
    '        <ground_column8/>',
    `        <transparent_rows>${openingCount}</transparent_rows>`,
    `        <transparent_column1>${opnCol1}</transparent_column1>`,
    `        <transparent_column2>${opnCol2}</transparent_column2>`,
    `        <transparent_column3>${opnCol3}</transparent_column3>`,
    `        <transparent_column4>${opnCol4}</transparent_column4>`,
    `        <transparent_column5>${opnCol5}</transparent_column5>`,
    '        <transparent_column6/>',
    `        <transparent_column7>${opnCol7}</transparent_column7>`,
    `        <transparent_column8>${opnCol8}</transparent_column8>`,
    `        <transparent_column9>${opnCol9}</transparent_column9>`,
    `        <transparent_column10>${opnCol10}</transparent_column10>`,
    `        <transparent_column11>${opnCol11}</transparent_column11>`,
    `        <transparent_column12>${opnCol12}</transparent_column12>`,
    `        <transparent_column13>${opnCol13}</transparent_column13>`,
    `        <transparent_column14>${opnCol14}</transparent_column14>`,
    `        <transparent_column15>${opnCol15}</transparent_column15>`,
    '        <opaque_tb_rows>0</opaque_tb_rows>',
    '        <opaque_tb_column1/>',
    '        <opaque_tb_column2/>',
    '        <opaque_tb_column3/>',
    '        <internal_nodes>0</internal_nodes>',
    '        <direct_benefit_exist>0</direct_benefit_exist>',
    '        <direct_benefit_rows>0</direct_benefit_rows>',
    '        <direct_benefit_column1/>',
    '        <direct_benefit_column2/>',
    '        <direct_benefit_column3/>',
    '        <direct_benefit_column4/>',
    '        <direct_benefit_column5/>',
    '        <direct_benefit_column6/>',
    '        <direct_benefit_column7/>',
    '        <direct_benefit_column8/>',
    '        <direct_benefit_column9/>',
    '        <direct_benefit_column10/>',
    '        <direct_benefit_column11/>',
    '        <direct_benefit_column12/>',
    '        <direct_benefit_column13/>',
    '        <direct_benefit_column14/>',
    '        <direct_benefit_column15/>',
    '        <direct_benefit_column16/>',
    '      </ENVELOPE>',
    '      <SYSTEM rid="1">',
    '        <heating rid="1">',
    `          <heating_exists>${heatingList.length > 0 ? 1 : 0}</heating_exists>`,
    `          <production_rows>${heatingList.length}</production_rows>`,
    `          <production_column1>${heatingList.map(h => getHeatingTypeText(h.type)).join(',')}</production_column1>`,
    `          <production_column2>${heatingList.map(h => getFuelText(h.fuel)).join(',')}</production_column2>`,
    `          <production_column3>${heatingList.map(h => h.powerKw || 0).join(',')}</production_column3>`,
    `          <production_column4>${heatingList.map(h => h.efficiency || 0.98).join(',')}</production_column4>`,
    `          <production_column5>${heatingList.map(h => h.coverageRatio || 1.0).join(',')}</production_column5>`,
    `          <production_column6>${heatingList.map(() => '1').join(',')}</production_column6>`,
    `          <production_column7>${heatingList.map(() => '1').join(',')}</production_column7>`,
    `          <production_column8>${heatingList.map(() => '1').join(',')}</production_column8>`,
    `          <production_column9>${heatingList.map(() => '1').join(',')}</production_column9>`,
    `          <production_column10>${heatingList.map(() => '0').join(',')}</production_column10>`,
    `          <production_column11>${heatingList.map(() => '0').join(',')}</production_column11>`,
    `          <production_column12>${heatingList.map(() => '0').join(',')}</production_column12>`,
    `          <production_column13>${heatingList.map(() => '0').join(',')}</production_column13>`,
    `          <production_column14>${heatingList.map(() => '0').join(',')}</production_column14>`,
    `          <production_column15>${heatingList.map(() => '0').join(',')}</production_column15>`,
    `          <production_column16>${heatingList.map(() => '1').join(',')}</production_column16>`,
    `          <production_column17>${heatingList.map(() => '1').join(',')}</production_column17>`,
    '          <production_column18/>',
    '          <distribution_rows>1</distribution_rows>',
    '          <distribution_column1>Δίκτυο διανομής θερμού μέσου</distribution_column1>',
    '          <distribution_column2>0</distribution_column2>',
    '          <distribution_column3>Εσωτερικοί  ή έως και 20% σε εξωτερικούς</distribution_column3>',
    '          <distribution_column4/>',
    '          <distribution_column5/>',
    '          <distribution_column6>1</distribution_column6>',
    '          <distribution_column7>False</distribution_column7>',
    '          <distribution_column8/>',
    '          <termatic_rows>1</termatic_rows>',
    '          <termatic_column1/>',
    '          <termatic_column2>0.94</termatic_column2>',
    '          <termatic_column3/>',
    '          <auxiliary_rows>1</auxiliary_rows>',
    '          <auxiliary_column1/>',
    '          <auxiliary_column2>1</auxiliary_column2>',
    '          <auxiliary_column3>0</auxiliary_column3>',
    '        </heating>',
    '        <cooling rid="1">',
    `          <cooling_exists>${coolingList.length > 0 ? 1 : 0}</cooling_exists>`,
    `          <production_rows>${coolingList.length}</production_rows>`,
    `          <production_column1>${coolingList.map(c => getCoolingTypeText(c.type)).join(',')}</production_column1>`,
    '          <production_column2>Electricity</production_column2>',
    `          <production_column3>${coolingList.map(c => c.powerKw || 0).join(',')}</production_column3>`,
    '          <production_column4>1</production_column4>',
    `          <production_column5>${coolingList.map(c => c.eer || 2.8).join(',')}</production_column5>`,
    '          <production_column6>0</production_column6>',
    '          <production_column7>0</production_column7>',
    '          <production_column8>0</production_column8>',
    '          <production_column9>0</production_column9>',
    '          <production_column10>0.5</production_column10>',
    '          <production_column11>0.5</production_column11>',
    '          <production_column12>0.5</production_column12>',
    '          <production_column13>0.5</production_column13>',
    '          <production_column14>0.5</production_column14>',
    '          <production_column15>0</production_column15>',
    '          <production_column16>0</production_column16>',
    '          <production_column17>0</production_column17>',
    '          <production_column18/>',
    '          <distribution_rows>1</distribution_rows>',
    '          <distribution_column1>Δίκτυο διανομής ψυχρού μέσου</distribution_column1>',
    '          <distribution_column2/>',
    '          <distribution_column3>Εσωτερικοί  ή έως και 20% σε εξωτερικούς</distribution_column3>',
    '          <distribution_column4>1</distribution_column4>',
    '          <distribution_column5>False</distribution_column5>',
    '          <distribution_column6/>',
    '          <termatic_rows>1</termatic_rows>',
    '          <termatic_column1>AC</termatic_column1>',
    '          <termatic_column2>0.94</termatic_column2>',
    '          <termatic_column3/>',
    '          <auxiliary_rows>1</auxiliary_rows>',
    '          <auxiliary_column1/>',
    '          <auxiliary_column2>1</auxiliary_column2>',
    '          <auxiliary_column3/>',
    '        </cooling>',
    '        <humidification rid="1">',
    '          <humidification_exists>0</humidification_exists>',
    '          <production_rows>0</production_rows>',
    '          <production_column1/>',
    '          <production_column2/>',
    '          <production_column3/>',
    '          <production_column4/>',
    '          <production_column5/>',
    '          <production_column6/>',
    '          <production_column7/>',
    '          <production_column8/>',
    '          <production_column9/>',
    '          <production_column10/>',
    '          <production_column11/>',
    '          <production_column12/>',
    '          <production_column13/>',
    '          <production_column14/>',
    '          <production_column15/>',
    '          <production_column16/>',
    '          <production_column17/>',
    '          <distribution_rows>1</distribution_rows>',
    '          <distribution_column1/>',
    '          <distribution_column2/>',
    '          <distribution_column3>1</distribution_column3>',
    '          <distribution_column4/>',
    '          <termatic_rows>1</termatic_rows>',
    '          <termatic_column1/>',
    '          <termatic_column2>1</termatic_column2>',
    '          <termatic_column3>,</termatic_column3>',
    '        </humidification>',
    '        <ahu rid="1">',
    '          <ahu_exists>0</ahu_exists>',
    '          <ahu_rows>1</ahu_rows>',
    '          <ahu_column1>Θεωρητική Μονάδα Αερισμού</ahu_column1>',
    '          <ahu_column2>False</ahu_column2>',
    '          <ahu_column3/>',
    '          <ahu_column4/>',
    '          <ahu_column5>0</ahu_column5>',
    '          <ahu_column6>0</ahu_column6>',
    '          <ahu_column7>False</ahu_column7>',
    '          <ahu_column8/>',
    '          <ahu_column9/>',
    '          <ahu_column10>0</ahu_column10>',
    '          <ahu_column11>0</ahu_column11>',
    '          <ahu_column12>False</ahu_column12>',
    '          <ahu_column13>0</ahu_column13>',
    '          <ahu_column14>False</ahu_column14>',
    '          <ahu_column15/>',
    '          <ahu_column16/>',
    '        </ahu>',
    '        <dhw rid="1">',
    '          <dhw_exists>1</dhw_exists>',
    '          <production_rows>1</production_rows>',
    `          <production_column1>${getDhwTypeText(dhw.type)}</production_column1>`,
    '          <production_column2>Electricity</production_column2>',
    `          <production_column3>${dhw.powerKw || 4}</production_column3>`,
    `          <production_column4>${dhw.efficiency || 0.98}</production_column4>`,
    '          <production_column5>1</production_column5>',
    '          <production_column6>1</production_column6>',
    '          <production_column7>1</production_column7>',
    '          <production_column8>1</production_column8>',
    '          <production_column9>1</production_column9>',
    '          <production_column10>1</production_column10>',
    '          <production_column11>1</production_column11>',
    '          <production_column12>1</production_column12>',
    '          <production_column13>1</production_column13>',
    '          <production_column14>1</production_column14>',
    '          <production_column15>1</production_column15>',
    '          <production_column16>1</production_column16>',
    '          <production_column17/>',
    '          <distribution_rows>1</distribution_rows>',
    '          <distribution_column1/>',
    '          <distribution_column2>False</distribution_column2>',
    '          <distribution_column3>Εσωτερικοί  ή έως και 20% σε εξωτερικούς</distribution_column3>',
    '          <distribution_column4>1</distribution_column4>',
    '          <distribution_column5/>',
    '          <termatic_rows>1</termatic_rows>',
    '          <termatic_column1>BOILER</termatic_column1>',
    '          <termatic_column2>0.98</termatic_column2>',
    '          <termatic_column3/>',
    '          <auxiliary_rows>1</auxiliary_rows>',
    '          <auxiliary_column1/>',
    '          <auxiliary_column2>1</auxiliary_column2>',
    '          <auxiliary_column3/>',
    '        </dhw>',
    '        <solar_collector rid="1">',
    `          <solar_collector_exists>${dhw.hasSolarThermal ? 1 : 0}</solar_collector_exists>`,
    '          <solar_collector_rows>1</solar_collector_rows>',
    `          <solar_collector_column1>${dhw.hasSolarThermal ? 'Ηλιακός Θερμοσίφωνας' : ''}</solar_collector_column1>`,
    '          <solar_collector_column2>False</solar_collector_column2>',
    '          <solar_collector_column3>True</solar_collector_column3>',
    '          <solar_collector_column4/>',
    `          <solar_collector_column5>${dhw.hasSolarThermal ? (dhw.solarAreaM2 || 2.0) : ''}</solar_collector_column5>`,
    '          <solar_collector_column6/>',
    '          <solar_collector_column7/>',
    '          <solar_collector_column8/>',
    '          <solar_collector_column9>1</solar_collector_column9>',
    '          <solar_collector_column10/>',
    '        </solar_collector>',
    '        <lighting rid="1">',
    '          <lighting_exists>0</lighting_exists>',
    '          <lighting_parameter1/>',
    '          <lighting_parameter2/>',
    '          <lighting_parameter3/>',
    '          <lighting_parameter4/>',
    '          <lighting_parameter5/>',
    '          <lighting_parameter6/>',
    '          <lighting_parameter7/>',
    '          <lighting_parameter8/>',
    '          <lighting_parameter9>0,0,0,0,0,0,0,</lighting_parameter9>',
    '          <lighting_parameter10>0</lighting_parameter10>',
    '          <lighting_parameter11>0</lighting_parameter11>',
    '          <lighting_parameter12>0</lighting_parameter12>',
    '        </lighting>',
    '      </SYSTEM>',
    '    </ZONE1>',
    '  </BUILDING>',
    '</ENR_IN>',
  ];

  return xmlLines.join('\n');
}

/**
 * Parses a TEE-KENAK XML string (either native ENR_IN or custom kenak_building) back into FullBuildingModel
 */
export function parseKenakXml(xmlText: string): FullBuildingModel | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'text/xml');
    
    if (doc.querySelector('parsererror')) {
      return null;
    }

    const getTag = (parent: Element | Document, tag: string, fallback = '') => {
      const el = parent.querySelector(tag);
      return el ? el.textContent || fallback : fallback;
    };

    const getNum = (parent: Element | Document, tag: string, fallback = 0) => {
      const val = parseFloat(getTag(parent, tag));
      return isNaN(val) ? fallback : val;
    };

    // Check if Native TEE-KENAK ENR_IN format
    const epa = doc.querySelector('EPA_NR_PROJECT');
    if (epa) {
      const protocolId = getTag(epa, 'id');
      const buildingName = getTag(epa, 'building_num') || 'Επιθεωρούμενο Κτίριο';
      const ownerName = getTag(epa, 'blg_owner');
      const kaek = getTag(epa, 'blg_kaek');
      const address = getTag(epa, 'blg_address');
      const inspectorName = getTag(epa, 'blg_resp_name');
      const inspectorRegNum = getTag(epa, 'blg_resp_phone');

      const blgUseRaw = getTag(epa, 'blg_use');
      let buildingUse: any = 'RESIDENTIAL_MULTI';
      if (blgUseRaw === '1') buildingUse = 'RESIDENTIAL_SINGLE';
      else if (blgUseRaw === '2') buildingUse = 'RESIDENTIAL_MULTI';
      else if (blgUseRaw === '3') buildingUse = 'OFFICE';
      else if (blgUseRaw === '4') buildingUse = 'COMMERCIAL';
      else if (blgUseRaw === '5') buildingUse = 'EDUCATION';
      else if (blgUseRaw === '6') buildingUse = 'HEALTH';
      else if (blgUseRaw === '7') buildingUse = 'HOTEL';
      else if (blgUseRaw === '8') buildingUse = 'RESTAURANT';
      else if (blgUseRaw === '9') buildingUse = 'ASSEMBLY';

      const zoneRaw = getTag(epa, 'blg_zone');
      let climateZone: any = 'B';
      if (zoneRaw === '0') climateZone = 'A';
      else if (zoneRaw === '1') climateZone = 'B';
      else if (zoneRaw === '2') climateZone = 'C';
      else if (zoneRaw === '3') climateZone = 'D';

      const bld = doc.querySelector('BUILDING');
      const grossArea = bld ? getNum(bld, 'blg_parameter1', 100) : 100;
      const netArea = bld ? getNum(bld, 'blg_parameter2', 88) : 88;
      const heatedVolume = bld ? getNum(bld, 'blg_parameter4', 300) : 300;
      const yearBuilt = bld ? getNum(bld, 'blg_parameter15', 1980) : 1980;

      const zoneEl = doc.querySelector('ZONE1');
      const dhwDailyDemand = zoneEl ? getNum(zoneEl, 'zn_parameter6', 100) : 100;

      // Envelope elements from ENVELOPE tag
      const env = doc.querySelector('ENVELOPE');
      const opaqueSurfaces: any[] = [];
      const openings: any[] = [];

      if (env) {
        const opaqueRows = getNum(env, 'opaque_rows', 0);
        const c1 = getTag(env, 'opaque_column1').split(',');
        const c2 = getTag(env, 'opaque_column2').split(',');
        const c3 = getTag(env, 'opaque_column3').split(',');
        const c4 = getTag(env, 'opaque_column4').split(',');
        const c5 = getTag(env, 'opaque_column5').split(',');
        const c6 = getTag(env, 'opaque_column6').split(',');
        const c7 = getTag(env, 'opaque_column7').split(',');

        for (let i = 0; i < opaqueRows; i++) {
          const name = c1[i] || `Αδιαφανές ${i + 1}`;
          const bnd = c2[i] || '';
          let boundary: any = 'EXTERNAL_AIR';
          if (bnd.includes('ΜΘΧ')) boundary = 'UNHEATED_SPACE';
          else if (bnd.includes('έδαφος')) boundary = 'GROUND';
          else if (bnd.includes('Όμορο')) boundary = 'ADJACENT_BUILDING';

          let type: any = 'WALL';
          if (name.includes('Δώμα') || name.includes('Στέγη')) type = 'ROOF';
          else if (name.includes('Πυλωτή')) type = 'PILOTI';
          else if (boundary === 'GROUND') type = 'GROUND_FLOOR';

          const deg = parseFloat(c3[i]) || 0;
          opaqueSurfaces.push({
            id: `op-native-${i + 1}`,
            name,
            type,
            area: parseFloat(c5[i]) || 10,
            uValue: parseFloat(c6[i]) || 2.2,
            deltaUtb: parseFloat(c7[i]) || 0,
            orientation: degreesToOrientation(deg),
            tiltAngle: parseFloat(c4[i]) || 90,
            boundary,
            absorption: 0.6,
            emissivity: 0.8,
          });
        }

        const transparentRows = getNum(env, 'transparent_rows', 0);
        const tc1 = getTag(env, 'transparent_column1').split(',');
        const tc2 = getTag(env, 'transparent_column2').split(',');
        const tc3 = getTag(env, 'transparent_column3').split(',');
        const tc5 = getTag(env, 'transparent_column5').split(',');
        const tc7 = getTag(env, 'transparent_column7').split(',');
        const tc8 = getTag(env, 'transparent_column8').split(',');

        for (let j = 0; j < transparentRows; j++) {
          const name = tc1[j] || `Κούφωμα ${j + 1}`;
          const bnd = tc2[j] || '';
          const boundary: any = bnd.includes('ΜΘΧ') ? 'UNHEATED_SPACE' : 'EXTERNAL_AIR';
          const deg = parseFloat(tc3[j]) || 0;

          openings.push({
            id: `win-native-${j + 1}`,
            name,
            area: parseFloat(tc5[j]) || 2,
            uWindow: parseFloat(tc7[j]) || 4.5,
            gGlass: parseFloat(tc8[j]) || 0.75,
            vInfiltration: 5.0,
            frameRatio: 0.2,
            orientation: degreesToOrientation(deg),
            boundary,
            fOvH: 1.0, fOvC: 1.0, fFinH: 1.0, fFinC: 1.0, fHorH: 1.0, fHorC: 1.0, fShC: 0.6,
          });
        }
      }

      let ageCategory: any = '1979_2010';
      if (yearBuilt < 1979) ageCategory = 'PRE_1979';
      else if (yearBuilt > 2010) ageCategory = 'POST_2010';

      return {
        protocolId,
        buildingName,
        buildingUnitTitle: '',
        isEntireBuilding: true,
        ownershipType: 'Πλήρης Κυριότητα',
        address,
        prefecture: 'ΑΤΤΙΚΗΣ',
        municipality: 'ΑΘΗΝΑΙΩΝ',
        postcode: '11526',
        ownerName,
        afm: '000000000',
        kaek,
        buildingUse,
        climateZone,
        climaticStation: '',
        altitudeAbove500m: false,
        yearBuilt,
        ageCategory,
        grossArea,
        netArea,
        heatedVolume,
        inspectionDate: new Date().toISOString().split('T')[0],
        inspectorName,
        inspectorRegNum,
        inspectorNotes: '',
        zoneName: 'Θερμική Ζώνη 1',
        freshAirFlow: Math.round(grossArea * 0.75),
        dhwDailyDemand,
        opaqueSurfaces,
        openings,
        heatingSystems: [
          {
            id: 'heat-nat-1',
            name: 'Σύστημα Θέρμανσης',
            type: 'OIL_BOILER',
            fuel: 'HEATING_OIL',
            powerKw: 15,
            efficiency: 0.83,
            distributionEff: 0.90,
            terminalEff: 0.92,
            automationClass: 'D',
            coverageRatio: 1.0,
          },
        ],
        coolingSystems: [
          {
            id: 'cool-nat-1',
            name: 'Σύστημα Ψύξης (A/C)',
            type: 'SPLIT_AC',
            powerKw: 3.5,
            eer: 2.8,
            coverageRatio: 0.5,
          },
        ],
        dhwSystem: {
          type: 'ELECTRIC_HEATER',
          powerKw: 4.0,
          efficiency: 0.98,
          hasSolarThermal: false,
          solarAreaM2: 2.0,
          collectorType: 'SELECTIVE',
          solarOrientation: 'S',
          solarTilt: 40,
          tankLiters: 160,
        },
        renewableSystem: {
          hasPv: false,
          pvKwP: 3.0,
          pvYieldKwhYear: 4200,
          pvTilt: 30,
          pvOrientation: 'S',
        },
        scenarios: [],
      };
    }

    // Fallback: Custom kenak_building format
    const genInfo = doc.querySelector('general_info');
    if (!genInfo) return null;

    const protocolId = getTag(genInfo, 'protocol_id');
    const buildingName = getTag(genInfo, 'building_name', 'Επιθεωρούμενο Κτίριο');
    const buildingUnitTitle = getTag(genInfo, 'unit_title');
    const isEntireBuilding = getTag(genInfo, 'is_entire_building') !== 'false';
    const ownershipType = getTag(genInfo, 'ownership_type', 'Πλήρης Κυριότητα');
    const address = getTag(genInfo, 'address');
    const prefecture = getTag(genInfo, 'prefecture');
    const municipality = getTag(genInfo, 'municipality');
    const postcode = getTag(genInfo, 'postcode');
    const ownerName = getTag(genInfo, 'owner_name');
    const afm = getTag(genInfo, 'afm');
    const kaek = getTag(genInfo, 'kaek');
    const buildingUse = (getTag(genInfo, 'building_use', 'RESIDENTIAL_SINGLE') as any);
    const climateZone = (getTag(genInfo, 'climate_zone', 'B') as any);
    const climaticStation = getTag(genInfo, 'climatic_station');
    const altitudeAbove500m = getTag(genInfo, 'altitude_over_500m') === 'true';
    const yearBuilt = getNum(genInfo, 'construction_year', 1980);
    const grossArea = getNum(genInfo, 'gross_area', 100);
    const netArea = getNum(genInfo, 'net_area', 88);
    const heatedVolume = getNum(genInfo, 'heated_volume', 300);
    const inspectionDate = getTag(genInfo, 'inspection_date');
    const inspectorName = getTag(genInfo, 'inspector_name');
    const inspectorRegNum = getTag(genInfo, 'inspector_reg_num');
    const inspectorNotes = getTag(genInfo, 'notes');
    const lightingPowerKw = getNum(genInfo, 'lighting_power_kw', 0);

    // Thermal zone 1
    const zoneEl = doc.querySelector('thermal_zone');
    const zoneName = zoneEl ? getTag(zoneEl, 'name', 'Ζώνη 1') : 'Ζώνη 1';
    const freshAirFlow = zoneEl ? getNum(zoneEl, 'fresh_air_flow_m3h', 75) : 75;
    const dhwDailyDemand = zoneEl ? getNum(zoneEl, 'dhw_daily_demand_liters', 160) : 160;

    // Opaque
    const opaqueSurfaces: any[] = [];
    const opaqueEls = doc.querySelectorAll('opaque');
    opaqueEls.forEach((el, idx) => {
      opaqueSurfaces.push({
        id: `op-parsed-${idx + 1}`,
        name: getTag(el, 'description', `Αδιαφανές ${idx + 1}`),
        type: getTag(el, 'type', 'WALL') as any,
        area: getNum(el, 'area_m2', 10),
        uValue: getNum(el, 'u_value_wm2k', 2.2),
        deltaUtb: getNum(el, 'delta_u_tb', 0.2),
        orientation: getTag(el, 'orientation', 'S') as any,
        tiltAngle: getNum(el, 'tilt_degrees', 90),
        boundary: getTag(el, 'boundary_condition', 'EXTERNAL_AIR') as any,
        absorption: getNum(el, 'absorption_coeff', 0.6),
        emissivity: getNum(el, 'emissivity_coeff', 0.9),
      });
    });

    // Openings
    const openings: any[] = [];
    const openingEls = doc.querySelectorAll('opening');
    openingEls.forEach((el, idx) => {
      openings.push({
        id: `win-parsed-${idx + 1}`,
        name: getTag(el, 'description', `Κούφωμα ${idx + 1}`),
        area: getNum(el, 'area_m2', 2),
        uWindow: getNum(el, 'u_window_wm2k', 4.5),
        gGlass: getNum(el, 'g_glass', 0.75),
        vInfiltration: getNum(el, 'v_infiltration_m3hm2', 5.0),
        frameRatio: getNum(el, 'frame_ratio', 0.2),
        orientation: getTag(el, 'orientation', 'E') as any,
        fOvH: getNum(el, 'overhang_winter', 1.0),
        fOvC: getNum(el, 'overhang_summer', 0.6),
        fFinH: getNum(el, 'side_fin_winter', 1.0),
        fFinC: getNum(el, 'side_fin_summer', 1.0),
        fHorH: getNum(el, 'horizon_winter', 1.0),
        fHorC: getNum(el, 'horizon_summer', 1.0),
        fShC: getNum(el, 'shutter_summer', 0.6),
      });
    });

    // Heating systems
    const heatingSystems: any[] = [];
    const heatEls = doc.querySelectorAll('heating_system');
    heatEls.forEach((el, idx) => {
      heatingSystems.push({
        id: `heat-parsed-${idx + 1}`,
        name: getTag(el, 'name', `Σύστημα Θέρμανσης ${idx + 1}`),
        type: getTag(el, 'type', 'OIL_BOILER') as any,
        fuel: getTag(el, 'fuel', 'HEATING_OIL') as any,
        powerKw: getNum(el, 'power_kw', 15),
        efficiency: getNum(el, 'efficiency_eta_or_cop', 0.83),
        distributionEff: getNum(el, 'distribution_efficiency', 0.92),
        terminalEff: getNum(el, 'terminal_efficiency', 0.93),
        automationClass: getTag(el, 'automation_class', 'D') as any,
        coverageRatio: getNum(el, 'coverage_ratio', 1.0),
      });
    });

    // Cooling systems
    const coolingSystems: any[] = [];
    const coolEls = doc.querySelectorAll('cooling_system');
    coolEls.forEach((el, idx) => {
      coolingSystems.push({
        id: `cool-parsed-${idx + 1}`,
        name: getTag(el, 'name', `Σύστημα Ψύξης ${idx + 1}`),
        type: getTag(el, 'type', 'SPLIT_AC') as any,
        powerKw: getNum(el, 'power_kw', 3.5),
        eer: getNum(el, 'eer', 2.8),
        coverageRatio: getNum(el, 'coverage_ratio', 0.5),
      });
    });

    // DHW System
    const dhwEl = doc.querySelector('dhw_system');
    const dhwSystem = {
      type: dhwEl ? (getTag(dhwEl, 'type', 'ELECTRIC_HEATER') as any) : 'ELECTRIC_HEATER',
      powerKw: dhwEl ? getNum(dhwEl, 'power_kw', 4.0) : 4.0,
      efficiency: dhwEl ? getNum(dhwEl, 'efficiency', 1.0) : 1.0,
      hasSolarThermal: dhwEl ? getTag(dhwEl, 'has_solar') === 'true' : false,
      solarAreaM2: dhwEl ? getNum(dhwEl, 'collector_area_m2', 2.0) : 2.0,
      collectorType: dhwEl ? (getTag(dhwEl, 'collector_type', 'SELECTIVE') as any) : 'SELECTIVE',
      solarOrientation: dhwEl ? (getTag(dhwEl, 'orientation', 'S') as any) : 'S',
      solarTilt: dhwEl ? getNum(dhwEl, 'tilt_degrees', 40) : 40,
      tankLiters: dhwEl ? getNum(dhwEl, 'tank_volume_liters', 160) : 160,
    };

    // Renewable
    const pvEl = doc.querySelector('renewable_energy');
    const renewableSystem = {
      hasPv: pvEl ? getTag(pvEl, 'has_pv') === 'true' : false,
      pvKwP: pvEl ? getNum(pvEl, 'pv_power_kwp', 3.0) : 3.0,
      pvYieldKwhYear: pvEl ? getNum(pvEl, 'annual_yield_kwh', 4200) : 4200,
      pvTilt: pvEl ? getNum(pvEl, 'tilt_degrees', 30) : 30,
      pvOrientation: pvEl ? (getTag(pvEl, 'orientation', 'S') as any) : 'S',
    };

    // Scenarios
    const scenarios: any[] = [];
    const scenEls = doc.querySelectorAll('scenario');
    scenEls.forEach((el, idx) => {
      scenarios.push({
        id: `scen-parsed-${idx + 1}`,
        title: getTag(el, 'title', `Σενάριο ${idx + 1}`),
        description: getTag(el, 'description', ''),
        estimatedSavingPercent: getNum(el, 'estimated_energy_saving_percent', 25),
      });
    });

    let ageCategory: any = '1979_2010';
    if (yearBuilt < 1979) ageCategory = 'PRE_1979';
    else if (yearBuilt > 2010) ageCategory = 'POST_2010';

    return {
      protocolId,
      buildingName,
      buildingUnitTitle,
      isEntireBuilding,
      ownershipType,
      address,
      prefecture,
      municipality,
      postcode,
      ownerName,
      afm,
      kaek,
      buildingUse,
      climateZone,
      climaticStation,
      altitudeAbove500m,
      yearBuilt,
      ageCategory,
      grossArea,
      netArea,
      heatedVolume,
      inspectionDate,
      inspectorName,
      inspectorRegNum,
      inspectorNotes,
      zoneName,
      freshAirFlow,
      dhwDailyDemand,
      opaqueSurfaces,
      openings,
      heatingSystems,
      coolingSystems,
      dhwSystem,
      renewableSystem,
      lightingPowerKw,
      scenarios,
    };
  } catch (err) {
    console.error('XML Parse Error:', err);
    return null;
  }
}



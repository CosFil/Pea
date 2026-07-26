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
 * Generates official TEE-KENAK / buildingcert.gr compliant XML file
 */
export function generateKenakXml(model: FullBuildingModel): string {
  const dateStr = model.inspectionDate || new Date().toISOString().split('T')[0];

  const xmlLines: string[] = [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<!-- ',
    '  Αρχείο Εισαγωγής Δεδομένων Κτιρίου ΤΕΕ-ΚΕΝΑΚ v1.31.1.9 / buildingcert.gr',
    '  Δημιουργήθηκε από την Εφαρμογή "Οδηγός ΤΕΕ-ΚΕΝΑΚ & Τυπικές Τιμές ΠΕΑ"',
    `  Ημερομηνία Παραγωγής: ${new Date().toLocaleString('el-GR')}`,
    '-->',
    '<kenak_building version="1.31" generator="TEE-KENAK-v1.31.1.9-Export">',
    
    '  <!-- 1. ΓΕΝΙΚΑ & ΔΙΟΙΚΗΤΙΚΑ ΣΤΟΙΧΕΙΑ ΚΤΙΡΙΟΥ -->',
    '  <general_info>',
    `    <protocol_id>${escapeXml(model.protocolId || '')}</protocol_id>`,
    `    <building_name>${escapeXml(model.buildingName)}</building_name>`,
    `    <unit_title>${escapeXml(model.buildingUnitTitle || '')}</unit_title>`,
    `    <is_entire_building>${model.isEntireBuilding !== false ? 'true' : 'false'}</is_entire_building>`,
    `    <ownership_type>${escapeXml(model.ownershipType || 'Πλήρης Κυριότητα')}</ownership_type>`,
    `    <address>${escapeXml(model.address)}</address>`,
    `    <prefecture>${escapeXml(model.prefecture)}</prefecture>`,
    `    <municipality>${escapeXml(model.municipality)}</municipality>`,
    `    <postcode>${escapeXml(model.postcode)}</postcode>`,
    `    <owner_name>${escapeXml(model.ownerName)}</owner_name>`,
    `    <afm>${escapeXml(model.afm)}</afm>`,
    `    <kaek>${escapeXml(model.kaek)}</kaek>`,
    `    <building_use>${escapeXml(model.buildingUse)}</building_use>`,
    `    <climate_zone>${escapeXml(model.climateZone)}</climate_zone>`,
    `    <climatic_station>${escapeXml(model.climaticStation || '')}</climatic_station>`,
    `    <altitude_over_500m>${model.altitudeAbove500m ? 'true' : 'false'}</altitude_over_500m>`,
    `    <construction_year>${model.yearBuilt}</construction_year>`,
    `    <gross_area>${model.grossArea.toFixed(2)}</gross_area>`,
    `    <net_area>${model.netArea.toFixed(2)}</net_area>`,
    `    <heated_volume>${model.heatedVolume.toFixed(2)}</heated_volume>`,
    `    <inspection_date>${dateStr}</inspection_date>`,
    `    <inspector_name>${escapeXml(model.inspectorName)}</inspector_name>`,
    `    <inspector_reg_num>${escapeXml(model.inspectorRegNum)}</inspector_reg_num>`,
    `    <notes>${escapeXml(model.inspectorNotes)}</notes>`,
    `    <lighting_power_kw>${(model.lightingPowerKw || 0).toFixed(2)}</lighting_power_kw>`,
    '  </general_info>',

    '  <!-- 2. ΘΕΡΜΙΚΕΣ ΖΩΝΕΣ -->',
    '  <thermal_zones>',
    '    <thermal_zone id="1">',
    `      <name>${escapeXml(model.zoneName)}</name>`,
    `      <use>${escapeXml(model.buildingUse)}</use>`,
    `      <area>${model.grossArea.toFixed(2)}</area>`,
    `      <volume>${model.heatedVolume.toFixed(2)}</volume>`,
    `      <fresh_air_flow_m3h>${model.freshAirFlow.toFixed(3)}</fresh_air_flow_m3h>`,
    `      <dhw_daily_demand_liters>${model.dhwDailyDemand.toFixed(1)}</dhw_daily_demand_liters>`,

    '      <!-- 2.1 ΑΔΙΑΦΑΝΗ ΣΤΟΙΧΕΙΑ ΚΕΛΥΦΟΥΣ (ΤΟΙΧΟΙ, ΔΩΜΑΤΑ, ΔΑΠΕΔΑ) -->',
    '      <opaque_elements>',
  ];

  model.opaqueSurfaces.forEach((surf, idx) => {
    xmlLines.push(
      `        <opaque id="${idx + 1}">`,
      `          <description>${escapeXml(surf.name)}</description>`,
      `          <type>${surf.type}</type>`,
      `          <area_m2>${surf.area.toFixed(2)}</area_m2>`,
      `          <u_value_wm2k>${surf.uValue.toFixed(3)}</u_value_wm2k>`,
      `          <delta_u_tb>${surf.deltaUtb.toFixed(3)}</delta_u_tb>`,
      `          <orientation>${surf.orientation}</orientation>`,
      `          <tilt_degrees>${surf.tiltAngle}</tilt_degrees>`,
      `          <boundary_condition>${surf.boundary}</boundary_condition>`,
      `          <absorption_coeff>${surf.absorption.toFixed(2)}</absorption_coeff>`,
      `          <emissivity_coeff>${surf.emissivity.toFixed(2)}</emissivity_coeff>`,
      '        </opaque>'
    );
  });

  xmlLines.push(
    '      </opaque_elements>',
    '',
    '      <!-- 2.2 ΔΙΑΦΑΝΗ ΣΤΟΙΧΕΙΑ ΚΕΛΥΦΟΥΣ (ΚΟΥΦΩΜΑΤΑ & ΥΑΛΟΠΙΝΑΚΕΣ) -->',
    '      <openings>'
  );

  model.openings.forEach((op, idx) => {
    xmlLines.push(
      `        <opening id="${idx + 1}">`,
      `          <description>${escapeXml(op.name)}</description>`,
      `          <area_m2>${op.area.toFixed(2)}</area_m2>`,
      `          <u_window_wm2k>${op.uWindow.toFixed(3)}</u_window_wm2k>`,
      `          <g_glass>${op.gGlass.toFixed(3)}</g_glass>`,
      `          <v_infiltration_m3hm2>${op.vInfiltration.toFixed(2)}</v_infiltration_m3hm2>`,
      `          <frame_ratio>${op.frameRatio.toFixed(2)}</frame_ratio>`,
      `          <orientation>${op.orientation}</orientation>`,
      '          <shading_factors>',
      `            <overhang_winter>${op.fOvH.toFixed(2)}</overhang_winter>`,
      `            <overhang_summer>${op.fOvC.toFixed(2)}</overhang_summer>`,
      `            <side_fin_winter>${op.fFinH.toFixed(2)}</side_fin_winter>`,
      `            <side_fin_summer>${op.fFinC.toFixed(2)}</side_fin_summer>`,
      `            <horizon_winter>${op.fHorH.toFixed(2)}</horizon_winter>`,
      `            <horizon_summer>${op.fHorC.toFixed(2)}</horizon_summer>`,
      `            <shutter_summer>${op.fShC.toFixed(2)}</shutter_summer>`,
      '          </shading_factors>',
      '        </opening>'
    );
  });

  xmlLines.push(
    '      </openings>',
    '',
    '      <!-- 2.3 ΣΥΣΤΗΜΑΤΑ ΘΕΡΜΑΝΣΗΣ -->',
    '      <heating_systems>'
  );

  model.heatingSystems.forEach((heat, idx) => {
    xmlLines.push(
      `        <heating_system id="${idx + 1}">`,
      `          <name>${escapeXml(heat.name)}</name>`,
      `          <type>${heat.type}</type>`,
      `          <fuel>${heat.fuel}</fuel>`,
      `          <power_kw>${heat.powerKw.toFixed(2)}</power_kw>`,
      `          <efficiency_eta_or_cop>${heat.efficiency.toFixed(3)}</efficiency_eta_or_cop>`,
      `          <distribution_efficiency>${heat.distributionEff.toFixed(3)}</distribution_efficiency>`,
      `          <terminal_efficiency>${heat.terminalEff.toFixed(3)}</terminal_efficiency>`,
      `          <automation_class>${heat.automationClass}</automation_class>`,
      `          <coverage_ratio>${heat.coverageRatio.toFixed(2)}</coverage_ratio>`,
      '        </heating_system>'
    );
  });

  xmlLines.push(
    '      </heating_systems>',
    '',
    '      <!-- 2.4 ΣΥΣΤΗΜΑΤΑ ΨΥΞΗΣ -->',
    '      <cooling_systems>'
  );

  model.coolingSystems.forEach((cool, idx) => {
    xmlLines.push(
      `        <cooling_system id="${idx + 1}">`,
      `          <name>${escapeXml(cool.name)}</name>`,
      `          <type>${cool.type}</type>`,
      `          <power_kw>${cool.powerKw.toFixed(2)}</power_kw>`,
      `          <eer>${cool.eer.toFixed(2)}</eer>`,
      `          <coverage_ratio>${cool.coverageRatio.toFixed(2)}</coverage_ratio>`,
      '        </cooling_system>'
    );
  });

  xmlLines.push(
    '      </cooling_systems>',
    '',
    '      <!-- 2.5 ΖΕΣΤΟ ΝΕΡΟ ΧΡΗΣΗΣ (ΖΝΧ) & ΗΛΙΑΚΑ -->',
    '      <dhw_system>',
    `        <type>${model.dhwSystem.type}</type>`,
    `        <power_kw>${model.dhwSystem.powerKw.toFixed(2)}</power_kw>`,
    `        <efficiency>${model.dhwSystem.efficiency.toFixed(2)}</efficiency>`,
    '        <solar_thermal>',
    `          <has_solar>${model.dhwSystem.hasSolarThermal ? 'true' : 'false'}</has_solar>`,
    `          <collector_area_m2>${model.dhwSystem.solarAreaM2.toFixed(2)}</collector_area_m2>`,
    `          <collector_type>${model.dhwSystem.collectorType}</collector_type>`,
    `          <orientation>${model.dhwSystem.solarOrientation}</orientation>`,
    `          <tilt_degrees>${model.dhwSystem.solarTilt}</tilt_degrees>`,
    `          <tank_volume_liters>${model.dhwSystem.tankLiters}</tank_volume_liters>`,
    '        </solar_thermal>',
    '      </dhw_system>',
    '',
    '      <!-- 2.6 ΦΩΤΟΒΟΛΤΑΪΚΑ (ΑΠΕ) -->',
    '      <renewable_energy>',
    `        <has_pv>${model.renewableSystem.hasPv ? 'true' : 'false'}</has_pv>`,
    `        <pv_power_kwp>${model.renewableSystem.pvKwP.toFixed(2)}</pv_power_kwp>`,
    `        <annual_yield_kwh>${model.renewableSystem.pvYieldKwhYear.toFixed(0)}</annual_yield_kwh>`,
    `        <tilt_degrees>${model.renewableSystem.pvTilt}</tilt_degrees>`,
    `        <orientation>${model.renewableSystem.pvOrientation}</orientation>`,
    '      </renewable_energy>',
    '    </thermal_zone>',
    '  </thermal_zones>',
    '',
    '  <!-- 3. ΣΕΝΑΡΙΑ ΣΥΣΤΑΣΕΩΝ ΕΝΕΡΓΕΙΑΚΗΣ ΑΝΑΒΑΘΜΙΣΗΣ (ΠΕΑ) -->',
    '  <scenarios>'
  );

  model.scenarios.forEach((scen, idx) => {
    xmlLines.push(
      `    <scenario id="${idx + 1}">`,
      `      <title>${escapeXml(scen.title)}</title>`,
      `      <description>${escapeXml(scen.description)}</description>`,
      `      <estimated_energy_saving_percent>${scen.estimatedSavingPercent.toFixed(1)}</estimated_energy_saving_percent>`,
      '    </scenario>'
    );
  });

  xmlLines.push(
    '  </scenarios>',
    '</kenak_building>'
  );

  return xmlLines.join('\n');
}

/**
 * Parses a TEE-KENAK XML string back into FullBuildingModel
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


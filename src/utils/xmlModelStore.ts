import { FullBuildingModel, OpaqueSurfaceInput, OpeningInput, RecommendationScenario } from '../types/xmlKenak';
import { DEFAULT_PRE79_BUILDING } from '../data/xmlDefaults';

export const STORAGE_KEY = 'kenak_xml_building_model';

/**
 * Retrieves current FullBuildingModel from localStorage or defaults
 */
export function getXmlBuildingModel(): FullBuildingModel {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error parsing saved XML building model:', e);
  }
  return DEFAULT_PRE79_BUILDING;
}

/**
 * Saves FullBuildingModel to localStorage and dispatches sync event
 */
export function saveXmlBuildingModel(model: FullBuildingModel): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(model));
    // Dispatch custom event for real-time reactivity across tabs
    window.dispatchEvent(new CustomEvent('kenakModelUpdated', { detail: model }));
  } catch (e) {
    console.error('Error saving XML building model:', e);
  }
}

/**
 * Smart Auto-Generator for Energy Upgrade Scenarios (Exoikonomo 2025 & PEA)
 */
export function generateOptimalScenarios(model: FullBuildingModel): RecommendationScenario[] {
  const isPre1979 = model.ageCategory === 'PRE_1979' || model.yearBuilt < 1980;

  const scenarios: RecommendationScenario[] = [
    {
      id: 'scen-auto-1',
      title: 'Σενάριο 1: Θερμομόνωση Κελύφους (10cm EPS) & Αντικατάσταση Κουφωμάτων Low-E',
      description: `Τοποθέτηση εξωτερικής θερμομόνωσης 10cm (EPS 80) σε όλες τις αδιαφανείς επιφάνειες (U ≤ 0.35 W/m²K) και θερμομόνωση δώματος. Αντικατάσταση υφιστάμενων κουφωμάτων με ενεργειακά αλουμινίου θερμοδιακοπτόμενα και διπλούς υαλοπίνακες Low-E με αέριο Argon (U_w ≤ 1.40 W/m²K).`,
      estimatedSavingPercent: isPre1979 ? 55 : 38,
    },
    {
      id: 'scen-auto-2',
      title: 'Σενάριο 2: Εγκατάσταση Αντλίας Θερμότητας (Inverter SCOP ≥ 4.0) & Ηλιακός ZNX',
      description: `Αντικατάσταση του υφιστάμενου συστήματος θέρμανσης (λέβητας πετρελαίου/αερίου) με υπερσύγχρονη Αντλία Θερμότητας αέρος-νερού υψηλής απόδοσης (Inverter, SCOP ≥ 4.0, COP ≥ 3.8). Τοποθέτηση ηλιακού θερμοσίφωνα διπλής ενέργειας 160L με επιφάνεια συλλεκτών 2.5m² για 80% κάλυψη ΖΝΧ.`,
      estimatedSavingPercent: 48,
    },
    {
      id: 'scen-auto-3',
      title: 'Σενάριο 3: Ολική Πράσινη Αναβάθμιση (Κέλυφος + Αντλία Θερμότητας + Φωτοβολταϊκό Net-Metering 3kWp)',
      description: `Πλήρης συνδυαστική παρέμβαση: Θερμομόνωση κελύφους, ενεργειακά κουφώματα, αντλία θερμότητας και εγκατάσταση διασυνδεδεμένου φωτοβολταϊκού συστήματος 3kWp στη στέγη για αυτοπαραγωγή ηλεκτρικής ενέργειας (Net-Billing). Επιτυγχάνεται μείωση κατανάλωσης πρωτογενούς ενέργειας > 75% και αναβάθμιση κατά 3+ ενεργειακές κατηγορίες (Κατηγορία A/A+).`,
      estimatedSavingPercent: 78,
    },
  ];

  return scenarios;
}


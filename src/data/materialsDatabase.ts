import { MaterialItem } from '../types/kenak';

export const MATERIALS_DATABASE: MaterialItem[] = [
  // Σοβάδες & Κονιάματα
  { id: 'mat-1', name: 'Ασβεστοτσιμεντοκονίαμα (Επίχρισμα)', category: 'MORTAR', lambda: 0.87, density: 1800, description: 'Συνήθης σοβάς εσωτερικός/εξωτερικός' },
  { id: 'mat-2', name: 'Τσιμεντοκονίαμα', category: 'MORTAR', lambda: 1.40, density: 2000, description: 'Τσιμεντοκονία δαπέδων & εξομαλύνσεων' },
  { id: 'mat-3', name: 'Γυψοκονίαμα / Γύψος', category: 'MORTAR', lambda: 0.40, density: 1000, description: 'Εσωτερικές επιφάνειες' },

  // Τοιχοποιία & Τούβλα
  { id: 'mat-4', name: 'Οπτόπλινθος κατακόρυφων οπών (Συνήθως τούβλο)', category: 'BRICK', lambda: 0.44, density: 1000, description: 'Τυπικό διάτρητο τούβλο 6/9/12 οπών' },
  { id: 'mat-5', name: 'Θερμομονωτικό τούβλο (Ορθομπλόκ / Thermo)', category: 'BRICK', lambda: 0.15, density: 800, description: 'Τούβλο υψηλής θερμομόνωσης' },
  { id: 'mat-6', name: 'Συμπαγές τούβλο (Πήλινο)', category: 'BRICK', lambda: 0.70, density: 1800, description: 'Παλαιά συμπαγή τούβλα' },
  { id: 'mat-7', name: 'Πορομπετόν (Ytong / Alfa Block)', category: 'BRICK', lambda: 0.12, density: 500, description: 'Ελαφροβαρές δομικό στοιχείο' },
  { id: 'mat-8', name: 'Λιθοδομή / Φυσική Πέτρα (Ασβεστόλιθος)', category: 'STONE', lambda: 2.30, density: 2500, description: 'Πέτρινοι τοίχοι παλαιών κτισμάτων' },
  { id: 'mat-9', name: 'Λιθοδομή (Σκληρή πέτρα / Σχιστόλιθος)', category: 'STONE', lambda: 3.50, density: 2800, description: 'Βραχώδεις πέτρες' },

  // Σκυρόδεμα (Μπετόν)
  { id: 'mat-10', name: 'Οπλισμένο Σκυρόδεμα (2% χάλυβας)', category: 'CONCRETE', lambda: 2.50, density: 2400, description: 'Φέρων οργανισμός (κολώνες, δοκοί, πλάκες)' },
  { id: 'mat-11', name: 'Άοπλο Σκυρόδεμα', category: 'CONCRETE', lambda: 2.00, density: 2200, description: 'Σκυρόδεμα καθαριότητας / εξομάλυνσης' },
  { id: 'mat-12', name: 'Ελαφροσκυρόδεμα / Περλομπετόν', category: 'CONCRETE', lambda: 0.22, density: 800, description: 'Γέμισμα δαπέδων / ρύσεις δώματος' },

  // Θερμομονωτικά υλικά
  { id: 'mat-13', name: 'Διογκωμένη Πολυστερίνη (EPS 80/100)', category: 'INSULATION', lambda: 0.036, density: 20, description: 'Λευκό φελιζόλ θερμοπρόσοψης' },
  { id: 'mat-14', name: 'Γραφιτούχα Πολυστερίνη (EPS Graphite)', category: 'INSULATION', lambda: 0.031, density: 18, description: 'Γκρι πολυστερίνη υψηλής απόδοσης' },
  { id: 'mat-15', name: 'Εξηλασμένη Πολυστερίνη (XPS - Dow/Fibran)', category: 'INSULATION', lambda: 0.034, density: 33, description: 'Σκληρή μόνωση για δώματα/σκυρόδεμα/στοιχεία εδάφους' },
  { id: 'mat-16', name: 'Πετροβάμβακας / Ορυκτοβάμβακας', category: 'INSULATION', lambda: 0.035, density: 50, description: 'Ινώδες θερμομονωτικό & ηχομονωτικό' },
  { id: 'mat-17', name: 'Πολυουρεθάνη (PUR / PIR)', category: 'INSULATION', lambda: 0.024, density: 40, description: 'Αφρός πολυουρεθάνης / πάνελ' },

  // Γυψοσανίδες & Ξύλο
  { id: 'mat-18', name: 'Γυψοσανίδα (Τυπική 12.5mm)', category: 'WOOD', lambda: 0.21, density: 800, description: 'Ψευδοροφές & ξηρά δόμηση' },
  { id: 'mat-19', name: 'Ξύλο Μαλακό (Πεύκο / Ελάτη)', category: 'WOOD', lambda: 0.13, density: 500, description: 'Ξύλινες στέγες & πατώματα' },
  { id: 'mat-20', name: 'Ξύλο Σκληρό (Δρυς / Οξιά)', category: 'WOOD', lambda: 0.18, density: 700, description: 'Σκληρά ξύλινα δάπεδα' },
  { id: 'mat-21', name: 'Κόντρα Πλακέ / MDF', category: 'WOOD', lambda: 0.14, density: 650, description: 'Πάνελ ξύλου' },

  // Στρώσεις Αέρα & Άλλα
  { id: 'mat-22', name: 'Μη αεριζόμενο στρώμα αέρα (5-20cm)', category: 'AIR', lambda: 0.18, density: 1.2, description: 'Διάκενο σε διπλό τοίχο (ισοδύναμο λ)' },
  { id: 'mat-23', name: 'Στεγανωτική μεμβράνη / Ασφαλτόπανο', category: 'OTHER', lambda: 0.17, density: 1100, description: 'Υγρομόνωση δώματος' },
  { id: 'mat-24', name: 'Κεραμίδια Στέγης (Πήλινα)', category: 'OTHER', lambda: 1.00, density: 2000, description: 'Επικάλυψη κεραμοσκεπής' },
  { id: 'mat-25', name: 'Μαρμαρόπλακες / Πλάκες Πεζοδρομίου', category: 'STONE', lambda: 2.80, density: 2700, description: 'Επιστρώσεις δαπέδων & δωμάτων' }
];

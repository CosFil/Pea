# Οδηγός ΠΕΑ & ΤΕΕ-ΚΕΝΑΚ (Energy Inspection App)

Εξειδικευμένη διαδικτυακή εφαρμογή για Ενεργειακούς Επιθεωρητές & Μηχανικούς στην Ελλάδα, για την προετοιμασία, υπολογισμό, έλεγχο, αποθήκευση και εξαγωγή αρχείων **XML (v1.31)** για το λογισμικό **ΤΕΕ-ΚΕΝΑΚ** και το portal **buildingcert.gr**.

---

## 🚀 Δυνατότητες & Εργαλεία

1. **Διαχείριση Κτιριακού Μοντέλου ΚΕΝΑΚ (XmlExportTab)**
   - Πλήρης υποστήριξη γενικών στοιχείων, θερμικών ζωνών, 2.Αδιαφανών & 3.Διαφανών δομικών στοιχείων, 4.Συστημάτων θέρμανσης/ψύξης/ΖΝΧ/ΑΠΕ.
   - Ταχείες προτεινόμενες τιμές ΤΟΤΕΕ (20701-1..5) ανά κλιματική ζώνη (Α-Δ) και περίοδο κατασκευής (Πριν το 1979, 1979-2010, Μετά το 2010, Εξοικονομώ).
   - Αυτόματος έλεγχος πληρότητας & σφαλμάτων (Audit Engine) πριν την εξαγωγή XML.
   - Δυνατότητα λήψης & εισαγωγής JSON Backup με αυτόματη επαλήθευση δομής (schema validation).

2. **Διαδραστικός Χάρτης & Εντοπισμός Κλιματικής Ζώνης (PropertyMapModal)**
   - Οπτική επιλογή τοποθεσίας στο χάρτη Google Maps με πινέζα & Geocoding.
   - Αυτόματος εντοπισμός διεύθυνσης, Δήμου, Νομού, Τ.Κ. και προτεινόμενης Κλιματικής Ζώνης (Α, Β, Γ, Δ) & Κλιματικού Σταθμού (62 Πόλεις).
   - Αυτόματη μετάβαση σε ψυχρότερη ζώνη αν το υψόμετρο είναι άνω των 500m.
   - Υποστήριξη fallback σε OpenStreetMap / Nominatim API.

3. **Ψηφιακός AI Σύμβουλος ΚΕΝΑΚ (AiConsultantModal)**
   - Ενσωματωμένος βοηθός Gemini 2.5 Flash εκπαιδευμένος στον ΚΕΝΑΚ, τις ΤΟΤΕΕ (20701-1..5) και συχνές παραδοχές μηχανικών.
   - Rate limiting, timeout handling και προστασία API keys server-side (`/api/ai-assistant`).

4. **Υπολογιστές U-Value & Θερμογεφυρών (CalculatorsTab)**
   - Υπολογισμός θερμοπερατότητας $U$ πολυστρωματικών δομικών στοιχείων.
   - Σύγκριση με τα μέγιστα επιτρεπόμενα όρια ΚΕΝΑΚ ανά Κλιματική Ζώνη.

5. **Αξιολογητής Προγράμματος "Εξοικονομώ" (ExoikonomoEvaluator)**
   - Εκτίμηση ενεργειακής αναβάθμισης (ενεργειακή κλάση κτιρίου αναφοράς & υφιστάμενου).
   - Υπολογισμός ποσοστού εξοικονόμησης πρωτογενούς ενέργειας (%) και προϋπολογισμού παρεμβάσεων.

6. **Google Drive Sync & Cloud Αποθήκευση (GoogleDriveSync)**
   - Σύνδεση με λογαριασμό Google (OAuth 2.0 / Firebase Auth) και αποθήκευση/ανάκτηση αρχείων XML ΠΕΑ στο προσωπικό σας Google Drive.
   - Ασφαλής διατήρηση access tokens στο `sessionStorage` με αυτόματη λήξη.

7. **Ενσωμάτωση AutoCAD / DXF (AutocadIntegrationTab)**
   - Εισαγωγή αρχείων DXF (ASCII format) με αυτόματη αναγνώριση μονάδων σχεδίασης (`$INSUNITS` - m, cm, mm).
   - Υποστήριξη LWPOLYLINE, POLYLINE, LINE, CIRCLE, ARC με υπολογισμό εμβαδών, περιμέτρων & μηκών.
   - Γεννήτρια κώδικα LISP (`KENAKEX`) για απευθείας εξαγωγή γεωμετρίας από το AutoCAD.

---

## 🛠️ Τεχνολογικό Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, `@vis.gl/react-google-maps`
- **Backend:** Node.js, Express, ESbuild (`server.ts`)
- **AI Integration:** `@google/genai` (Gemini 2.5 Flash)
- **Cloud Services:** Firebase Authentication, Google Drive API v3

---

## ⚙️ Ρύθμιση Μεταβλητών Περιβάλλοντος (.env)

Δημιουργήστε ένα αρχείο `.env` στη ρίζα του project (βασισμένο στο `.env.example`):

```env
# Gemini API Key (Server-side)
GEMINI_API_KEY=your_gemini_api_key_here

# Google Maps API Key (Client-side)
VITE_GOOGLE_MAPS_PLATFORM_KEY=your_google_maps_api_key_here

# Firebase Credentials (Client-side)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_OAUTH_CLIENT_ID=your_oauth_client_id.apps.googleusercontent.com
```

---

## 🔑 Οδηγός Ρύθμισης Firebase & Google Cloud Console

1. **Firebase Console:**
   - Δημιουργήστε ένα νέο project στο [Firebase Console](https://console.firebase.google.com/).
   - Ενεργοποιήστε το **Authentication** -> **Sign-in method** -> **Google**.
   - Στα **Authorized domains**, προσθέστε τα domains της εφαρμογής σας (π.χ. `localhost`, το Cloud Run domain κ.λπ.).

2. **Google Cloud Console & OAuth Scopes:**
   - Στο [Google Cloud Console](https://console.cloud.google.com/), μεταβείτε στα **Credentials**.
   - Βεβαιωθείτε ότι ο OAuth 2.0 Client ID υποστηρίζει τα εξής Redirect URIs και Authorized JavaScript Origins.
   - Ενεργοποιήστε το **Google Drive API**.
   - Τα scopes που χρησιμοποιούνται για την αποθήκευση αρχείων ΠΕΑ είναι:
     - `https://www.googleapis.com/auth/drive.file` (Περιορισμένη πρόσβαση μόνο στα αρχεία που δημιουργεί η εφαρμογή).

---

## 📦 Εγκατάσταση & Εκτέλεση

### 1. Εγκατάσταση εξαρτήσεων
```bash
npm install
```

### 2. Εκτέλεση σε Development Mode
```bash
npm run dev
```
Η εφαρμογή θα εκτελεστεί στη διεύθυνση `http://localhost:3000`.

### 3. Production Build & Start
```bash
npm run build
npm start
```

---

## 🔒 Ασφάλεια & Production Readiness
- **Server Startup Checks:** Ο Express server ελέγχει την παρουσία του `GEMINI_API_KEY` κατά την εκκίνηση και εκτελεί fail-fast αν λείπει σε production mode.
- **Rate Limiting & Timeouts:** Το endpoint `/api/ai-assistant` περιλαμβάνει προστασία από υπερβολικά αιτήματα (15 req/min ανά IP) και timeout 30 δευτερολέπτων.
- **API Keys Isolation:** Το `GEMINI_API_KEY` παραμένει αποκλειστικά server-side και δεν εκτίθεται ποτέ στο πρόγραμμα περιήγησης.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import { MapPin, Search, Check, X, AlertTriangle, Key, ExternalLink, Compass, Navigation, Building2, Map as MapIcon } from 'lucide-react';
import { FullBuildingModel } from '../types/xmlKenak';
import { GREEK_CLIMATE_STATIONS } from '../data/climateStations';

const GOOGLE_MAPS_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const hasValidKey = Boolean(GOOGLE_MAPS_KEY) && GOOGLE_MAPS_KEY !== 'YOUR_API_KEY';

interface PropertyMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: FullBuildingModel;
  onApplyLocation: (updatedFields: Partial<FullBuildingModel>) => void;
}

// Inner Map Controller component that has access to map hooks
function MapLocationHandler({
  position,
  onPositionChange,
  onLocationDetailsFound,
}: {
  position: { lat: number; lng: number };
  onPositionChange: (pos: { lat: number; lng: number }) => void;
  onLocationDetailsFound: (details: {
    address: string;
    prefecture: string;
    municipality: string;
    postcode: string;
  }) => void;
}) {
  const map = useMap();

  // Reverse geocode via OpenStreetMap Nominatim API (Free, high accuracy in Greece, no Google Cloud billing required)
  const reverseGeocodeNominatim = useCallback(
    async (lat: number, lng: number) => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          { headers: { 'Accept-Language': 'el,en', 'User-Agent': 'PEAKenakInspectorApp/1.0' } }
        );
        const data = await res.json();
        if (data && data.address) {
          const addr = data.address;
          const road = addr.road || addr.pedestrian || addr.street || addr.suburb || '';
          const houseNumber = addr.house_number || addr.building || '';
          const fullStreet = [road, houseNumber].filter(Boolean).join(' ') || data.display_name.split(',')[0] || '';

          const munci = (addr.municipality || addr.city || addr.town || addr.village || addr.city_district || addr.suburb || '')
            .toUpperCase()
            .replace('ΔΗΜΟΣ ', '');

          const pref = (addr.county || addr.state || addr.region || addr.province || '')
            .toUpperCase()
            .replace('REGIONAL UNIT OF ', '')
            .replace('ΝΟΜΟΣ ', '')
            .replace('ΠΕΡΙΦΕΡΕΙΑΚΗ ΕΝΟΤΗΤΑ ', '');

          const pc = addr.postcode || '';

          onLocationDetailsFound({
            address: fullStreet,
            prefecture: pref,
            municipality: munci,
            postcode: pc,
          });
        }
      } catch (err) {
        console.warn('Nominatim reverse geocode error:', err);
      }
    },
    [onLocationDetailsFound]
  );

  // Reverse geocode when position changes
  const reverseGeocode = useCallback(
    (lat: number, lng: number) => {
      reverseGeocodeNominatim(lat, lng);
    },
    [reverseGeocodeNominatim]
  );

  // When map is clicked
  const handleMapClick = (e: any) => {
    if (e.detail?.latLng) {
      const newLat = e.detail.latLng.lat;
      const newLng = e.detail.latLng.lng;
      onPositionChange({ lat: newLat, lng: newLng });
      reverseGeocode(newLat, newLng);
    }
  };

  // Center map on position change if needed
  useEffect(() => {
    if (map) {
      map.panTo(position);
    }
  }, [map, position]);

  return (
    <>
      <Map
        defaultCenter={position}
        defaultZoom={15}
        mapId="DEMO_MAP_ID"
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        onClick={handleMapClick}
        style={{ width: '100%', height: '100%' }}
        gestureHandling="greedy"
      >
        <AdvancedMarker
          position={position}
          gmpDraggable={true}
          onDragEnd={(e) => {
            if (e.latLng) {
              const newLat = e.latLng.lat();
              const newLng = e.latLng.lng();
              onPositionChange({ lat: newLat, lng: newLng });
              reverseGeocode(newLat, newLng);
            }
          }}
        >
          <Pin background="#0d9488" borderColor="#0f766e" glyphColor="#ffffff" />
        </AdvancedMarker>
      </Map>
    </>
  );
}

export const PropertyMapModal: React.FC<PropertyMapModalProps> = ({
  isOpen,
  onClose,
  model,
  onApplyLocation,
}) => {
  // Center of Greece default: Athens Kifissias or model coords
  const initialLat = model.lat && !isNaN(model.lat) ? model.lat : 37.9925;
  const initialLng = model.lng && !isNaN(model.lng) ? model.lng : 23.7630;

  const [position, setPosition] = useState<{ lat: number; lng: number }>({
    lat: initialLat,
    lng: initialLng,
  });

  const [searchQuery, setSearchQuery] = useState<string>(model.address || '');
  const [address, setAddress] = useState<string>(model.address || '');
  const [prefecture, setPrefecture] = useState<string>(model.prefecture || '');
  const [municipality, setMunicipality] = useState<string>(model.municipality || '');
  const [postcode, setPostcode] = useState<string>(model.postcode || '');
  const [suggestedZone, setSuggestedZone] = useState<'A' | 'B' | 'C' | 'D'>(model.climateZone || 'B');
  const [suggestedStation, setSuggestedStation] = useState<string>(model.climaticStation || '');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Sync state when model or modal opens
  useEffect(() => {
    if (isOpen) {
      const lat = model.lat && !isNaN(model.lat) ? model.lat : 37.9925;
      const lng = model.lng && !isNaN(model.lng) ? model.lng : 23.7630;
      setPosition({ lat, lng });
      setAddress(model.address || '');
      setPrefecture(model.prefecture || '');
      setMunicipality(model.municipality || '');
      setPostcode(model.postcode || '');
      setSuggestedZone(model.climateZone || 'B');
      setSuggestedStation(model.climaticStation || '');
      setSearchQuery(model.address || '');
    }
  }, [isOpen, model]);

  // Match prefecture or city to Climate Zone and station
  const matchClimateInfo = useCallback((pref: string, munci: string, fullAddr: string) => {
    const text = `${pref} ${munci} ${fullAddr}`.toUpperCase();

    let zone: 'A' | 'B' | 'C' | 'D' = 'B';
    if (
      text.includes('ΚΡΗΤΗ') ||
      text.includes('ΗΡΑΚΛΕΙΟ') ||
      text.includes('ΧΑΝΙΑ') ||
      text.includes('ΡΕΘΥΜΝΟ') ||
      text.includes('ΛΑΣΙΘΙ') ||
      text.includes('ΡΟΔΟΣ') ||
      text.includes('ΔΩΔΕΚΑΝΗΣΑ') ||
      text.includes('ΚΥΚΛΑΔΕΣ') ||
      text.includes('ΜΕΣΣΗΝΙΑ') ||
      text.includes('ΚΑΛΑΜΑΤΑ')
    ) {
      zone = 'A';
    } else if (
      text.includes('ΑΤΤΙΚ') ||
      text.includes('ΑΘΗΝΑ') ||
      text.includes('ΠΕΙΡΑΙΑ') ||
      text.includes('ΑΧΑΪΑ') ||
      text.includes('ΠΑΤΡΑ') ||
      text.includes('ΚΟΡΙΝΘ') ||
      text.includes('ΕΥΒΟΙΑ') ||
      text.includes('ΛΑΜΙΑ') ||
      text.includes('ΑΡΓΟΛΙΔΑ')
    ) {
      zone = 'B';
    } else if (
      text.includes('ΘΕΣΣΑΛΟΝΙΚΗ') ||
      text.includes('ΛΑΡΙΣΑ') ||
      text.includes('ΙΩΑΝΝΙΝΑ') ||
      text.includes('ΘΕΣΣΑΛΙΑ') ||
      text.includes('ΜΑΚΕΔΟΝΙΑ') ||
      text.includes('ΗΠΕΙΡΟΣ') ||
      text.includes('ΣΕΡΡΕΣ') ||
      text.includes('ΚΑΒΑΛΑ') ||
      text.includes('ΕΒΡΟΣ')
    ) {
      zone = 'C';
    } else if (
      text.includes('ΦΛΩΡΙΝΑ') ||
      text.includes('ΚΑΣΤΟΡΙΑ') ||
      text.includes('ΚΟΖΑΝΗ') ||
      text.includes('ΓΡΕΒΕΝΑ') ||
      text.includes('ΔΡΑΜΑ') ||
      text.includes('ΝΕΥΡΟΚΟΠΙ')
    ) {
      zone = 'D';
    }

    setSuggestedZone(zone);

    // Find best climate station match
    const matchedSt = GREEK_CLIMATE_STATIONS.find(
      (st) =>
        st.zone === zone &&
        (text.includes(st.name.split('-')[1]?.trim().toUpperCase() || '___') ||
          text.includes(st.name.split(' ')[2]?.toUpperCase() || '___'))
    );

    if (matchedSt) {
      setSuggestedStation(matchedSt.name);
    } else {
      const defaultForZone = GREEK_CLIMATE_STATIONS.find((st) => st.zone === zone);
      if (defaultForZone) setSuggestedStation(defaultForZone.name);
    }
  }, []);

  const handleLocationDetailsFound = useCallback(
    (details: { address: string; prefecture: string; municipality: string; postcode: string }) => {
      if (details.address) setAddress(details.address);
      if (details.prefecture) setPrefecture(details.prefecture);
      if (details.municipality) setMunicipality(details.municipality);
      if (details.postcode) setPostcode(details.postcode);
      matchClimateInfo(details.prefecture, details.municipality, details.address);
    },
    [matchClimateInfo]
  );

  // Address search trigger using OpenStreetMap Nominatim API (Free & reliable)
  const handleSearchAddress = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    const query = searchQuery.includes('Ελλάδα') || searchQuery.includes('Greece')
      ? searchQuery
      : `${searchQuery}, Ελλάδα`;

    await runNominatimSearch(query);
  };

  const runNominatimSearch = async (rawQuery: string) => {
    setIsSearching(true);
    setSearchError(null);

    const cleanRaw = rawQuery.replace(/, Ελλάδα$/i, '').replace(/, Greece$/i, '').trim();

    // Try multiple query variations to ensure best match rate in Greece
    const queriesToTry = [
      rawQuery,
      cleanRaw,
      `${cleanRaw}, Ελλάδα`,
      cleanRaw.split(',')[0],
    ];

    let foundItem: any = null;

    for (const q of queriesToTry) {
      if (!q || !q.trim()) continue;
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(q.trim())}&limit=1`,
          { headers: { 'Accept-Language': 'el,en', 'User-Agent': 'PEAKenakInspectorApp/1.0' } }
        );
        const data = await response.json();
        if (data && data.length > 0) {
          foundItem = data[0];
          break;
        }
      } catch (err) {
        console.warn('Nominatim search query error:', err);
      }
    }

    if (foundItem) {
      const newLat = parseFloat(foundItem.lat);
      const newLng = parseFloat(foundItem.lon);
      setPosition({ lat: newLat, lng: newLng });

      const addr = foundItem.address || {};
      const road = addr.road || addr.pedestrian || addr.street || addr.suburb || '';
      const houseNumber = addr.house_number || addr.building || '';
      const fullStreet = [road, houseNumber].filter(Boolean).join(' ') || foundItem.display_name.split(',')[0] || rawQuery;
      setAddress(fullStreet);

      const munci = (addr.municipality || addr.city || addr.town || addr.village || addr.city_district || addr.suburb || '')
        .toUpperCase()
        .replace('ΔΗΜΟΣ ', '');

      const pref = (addr.county || addr.state || addr.region || addr.province || '')
        .toUpperCase()
        .replace('REGIONAL UNIT OF ', '')
        .replace('ΝΟΜΟΣ ', '')
        .replace('ΠΕΡΙΦΕΡΕΙΑΚΗ ΕΝΟΤΗΤΑ ', '');

      const pc = addr.postcode || '';

      if (munci) setMunicipality(munci);
      if (pref) setPrefecture(pref);
      if (pc) setPostcode(pc);

      matchClimateInfo(pref || prefecture, munci || municipality, fullStreet);
    } else {
      setSearchError('Δεν βρέθηκαν αποτελέσματα για αυτή τη διεύθυνση. Μπορείτε να κάνετε κλικ απευθείας πάνω στο χάρτη.');
    }
    setIsSearching(false);
  };

  const handleApply = () => {
    onApplyLocation({
      address: address || searchQuery || model.address,
      prefecture: prefecture || model.prefecture,
      municipality: municipality || model.municipality,
      postcode: postcode || model.postcode,
      climateZone: suggestedZone,
      climaticStation: suggestedStation || model.climaticStation,
      lat: Number(position.lat.toFixed(6)),
      lng: Number(position.lng.toFixed(6)),
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-600/30 border border-teal-500/40 rounded-xl text-teal-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Επιλογή Τοποθεσίας Ακινήτου στο Χάρτη Google Maps</span>
              </h3>
              <p className="text-xs text-slate-300">
                Κάντε κλικ ή σύρετε την πινέζα για να ορίσετε τις ακριβείς συντεταγμένες και τη διεύθυνση του ΠΕΑ.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <form onSubmit={handleSearchAddress} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Αναζήτηση διεύθυνσης (π.χ. Τσιμισκή 12 Θεσσαλονίκη, Λεωφόρος Κηφισίας 120 Αθήνα)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{isSearching ? 'Αναζήτηση...' : 'Εντοπισμός'}</span>
            </button>
          </form>
          {searchError && <p className="text-[11px] text-rose-500 font-semibold mt-1.5 px-1">{searchError}</p>}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-h-[380px] grid grid-cols-1 md:grid-cols-3 overflow-hidden">
          {/* Map Column (2 Cols on desktop) */}
          <div className="md:col-span-2 relative bg-slate-200 dark:bg-slate-950 h-[380px] md:h-auto overflow-hidden">
            {hasValidKey ? (
              <APIProvider apiKey={GOOGLE_MAPS_KEY} version="weekly">
                <MapLocationHandler
                  position={position}
                  onPositionChange={setPosition}
                  onLocationDetailsFound={handleLocationDetailsFound}
                />
              </APIProvider>
            ) : (
              <div className="absolute inset-0 p-6 flex flex-col items-center justify-center bg-slate-900 text-white text-center overflow-y-auto space-y-4">
                <div className="p-3 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-2xl">
                  <Key className="w-8 h-8" />
                </div>
                <div className="max-w-md space-y-2">
                  <h4 className="text-base font-bold text-white">Απαιτείται Google Maps API Key</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Για να εμφανιστεί ο διαδραστικός χάρτης της Google, προσθέστε το API Key στο AI Studio:
                  </p>
                  <ol className="text-left text-xs space-y-1.5 bg-slate-800 p-3.5 rounded-xl border border-slate-700 text-slate-200 font-mono">
                    <li>1. Ανοίξτε τα <strong>Settings</strong> (⚙️ εικονίδιο, πάνω δεξιά)</li>
                    <li>2. Επιλέξτε <strong>Secrets</strong></li>
                    <li>3. Όνομα μυστικού: <code className="text-teal-400 font-bold">GOOGLE_MAPS_PLATFORM_KEY</code></li>
                    <li>4. Επικολλήστε το Google Maps API Key & πατήστε <strong>Enter</strong></li>
                  </ol>
                  <div className="pt-2">
                    <a
                      href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold"
                    >
                      <span>Απόκτηση API Key στο Google Cloud</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Floating Coordinate Badge on Map */}
            <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md border border-slate-700 text-white px-3 py-1.5 rounded-xl text-[11px] font-mono shadow-lg flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-teal-400" />
              <span>Lat: {position.lat.toFixed(5)}, Lng: {position.lng.toFixed(5)}</span>
            </div>
          </div>

          {/* Location Info & Form Sidebar (1 Col) */}
          <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900/90 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 space-y-4 overflow-y-auto">
            <div className="space-y-1 border-b pb-3 border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-mono font-bold uppercase text-teal-600 dark:text-teal-400">
                Στοιχεία Αυτοψίας
              </span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-teal-600" />
                <span>Αναγνωρισμένη Τοποθεσία</span>
              </h4>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Διεύθυνση Ακινήτου:
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Δήμος:
                  </label>
                  <input
                    type="text"
                    value={municipality}
                    onChange={(e) => setMunicipality(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Νομός / Περιφέρεια:
                  </label>
                  <input
                    type="text"
                    value={prefecture}
                    onChange={(e) => setPrefecture(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ταχυδρομικός Κώδικας (Τ.Κ.):
                </label>
                <input
                  type="text"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-xs"
                />
              </div>

              {/* Climate Zone Match Box */}
              <div className="p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1">
                    <Navigation className="w-3.5 h-3.5 text-teal-600" />
                    <span>Αυτόματος Υπολογισμός ΚΕΝΑΚ:</span>
                  </span>
                  <span className="px-2 py-0.5 bg-teal-600 text-white font-mono font-bold text-[10px] rounded">
                    Ζώνη {suggestedZone}
                  </span>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Κλιματική Ζώνη:</span>
                    <select
                      value={suggestedZone}
                      onChange={(e) => setSuggestedZone(e.target.value as any)}
                      className="w-full mt-0.5 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-bold text-teal-600"
                    >
                      <option value="A">Ζώνη Α (Κρήτη / Νησιά)</option>
                      <option value="B">Ζώνη Β (Αττική / Πελοπόννησος)</option>
                      <option value="C">Ζώνη Γ (Θεσσαλία / Μακεδονία)</option>
                      <option value="D">Ζώνη Δ (Δυτ. Μακεδονία / Ορεινά)</option>
                    </select>
                  </div>

                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Προτεινόμενος Κλιματικός Σταθμός:</span>
                    <select
                      value={suggestedStation}
                      onChange={(e) => setSuggestedStation(e.target.value)}
                      className="w-full mt-0.5 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-[11px]"
                    >
                      <option value="">Επιλέξτε Σταθμό...</option>
                      {GREEK_CLIMATE_STATIONS.map((st) => (
                        <option key={st.id} value={st.name}>
                          {st.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Exact Lat / Lng Direct Editors */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <label className="block text-slate-500 font-medium mb-0.5">Γεωγρ. Πλάτος (Lat):</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={position.lat}
                    onChange={(e) => setPosition((prev) => ({ ...prev, lat: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-medium mb-0.5">Γεωγρ. Μήκος (Lng):</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={position.lng}
                    onChange={(e) => setPosition((prev) => ({ ...prev, lng: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono text-[11px]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 hidden sm:block">
            📍 Συντεταγμένες GPS: <code className="font-mono font-semibold text-slate-800 dark:text-slate-200">{position.lat.toFixed(6)}, {position.lng.toFixed(6)}</code>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
            >
              Ακύρωση
            </button>
            <button
              onClick={handleApply}
              type="button"
              className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-900/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Εφαρμογή Τοποθεσίας στο ΠΕΑ</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

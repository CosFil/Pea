import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  initAuth, 
  googleSignIn, 
  googleLogout, 
  listXmlFilesFromDrive, 
  uploadXmlToDrive, 
  downloadXmlFromDrive, 
  deleteFileFromDrive, 
  DriveFile 
} from '../services/googleDriveService';
import { FullBuildingModel } from '../types/xmlKenak';
import { parseKenakXml } from '../utils/xmlExporter';
import { 
  Cloud, 
  CloudUpload, 
  CloudDownload, 
  LogOut, 
  LogIn, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ExternalLink,
  FileText,
  ShieldAlert,
  Loader2
} from 'lucide-react';

interface GoogleDriveSyncProps {
  currentModel: FullBuildingModel;
  xmlString: string;
  onModelLoaded: (loadedModel: FullBuildingModel) => void;
}

export const GoogleDriveSync: React.FC<GoogleDriveSyncProps> = ({
  currentModel,
  xmlString,
  onModelLoaded,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [fetchingFiles, setFetchingFiles] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string; link?: string } | null>(null);

  // Modal for delete confirmation
  const [fileToDelete, setFileToDelete] = useState<DriveFile | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (token) {
      loadDriveFiles();
    } else {
      setDriveFiles([]);
    }
  }, [token]);

  const handleSignIn = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        setStatusMessage({ type: 'success', text: `Επιτυχής σύνδεση ως ${res.user.displayName || res.user.email}` });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Αποτυχία σύνδεσης στο Google Drive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await googleLogout();
      setUser(null);
      setToken(null);
      setDriveFiles([]);
      setStatusMessage({ type: 'success', text: 'Αποσυνδεθήκατε από το Google Drive.' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: 'Αποτυχία αποσύνδεσης.' });
    } finally {
      setLoading(false);
    }
  };

  const loadDriveFiles = async () => {
    if (!token) return;
    setFetchingFiles(true);
    try {
      const files = await listXmlFilesFromDrive(token);
      setDriveFiles(files);
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: err.message || 'Σφάλμα ανάκτησης αρχείων' });
    } finally {
      setFetchingFiles(false);
    }
  };

  const handleSaveToDrive = async () => {
    if (!token) {
      setStatusMessage({ type: 'error', text: 'Παρακαλώ συνδεθείτε πρώτα στο Google Drive' });
      return;
    }

    setLoading(true);
    setStatusMessage(null);
    try {
      const fileName = `PEA_${currentModel.afm || '000000000'}_${currentModel.buildingName.replace(/[^a-zA-Z0-9]/g, '_')}.xml`;
      const uploaded = await uploadXmlToDrive(token, fileName, xmlString);
      setStatusMessage({
        type: 'success',
        text: `Το αρχείο "${uploaded.name}" αποθηκεύτηκε επιτυχώς στο Google Drive!`,
        link: uploaded.webViewLink,
      });
      await loadDriveFiles();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Αποτυχία αποθήκευσης στο Google Drive' });
    } finally {
      setLoading(false);
    }
  };

  const handleImportFromDrive = async (file: DriveFile) => {
    if (!token) return;
    setLoading(true);
    setStatusMessage(null);
    try {
      const xmlText = await downloadXmlFromDrive(token, file.id);
      const parsed = parseKenakXml(xmlText);
      if (parsed) {
        onModelLoaded(parsed);
        setStatusMessage({
          type: 'success',
          text: `Επιτυχής εισαγωγή και φόρτωση των δεδομένων του αρχείου "${file.name}"!`,
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: `To αρχείο "${file.name}" δεν περιέχει έγκυρη δομή ΤΕΕ-ΚΕΝΑΚ XML.`,
        });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Αποτυχία λήψης αρχείου από το Google Drive' });
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteFile = async () => {
    if (!token || !fileToDelete) return;
    setLoading(true);
    const filename = fileToDelete.name;
    try {
      await deleteFileFromDrive(token, fileToDelete.id);
      setStatusMessage({ type: 'success', text: `Το αρχείο "${filename}" διαγράφηκε από το Google Drive.` });
      setFileToDelete(null);
      await loadDriveFiles();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Αποτυχία διαγραφής αρχείου' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600/30 border border-blue-500/40 rounded-xl text-blue-400 shrink-0">
            <Cloud className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Google Drive Sync & Cloud Αποθήκευση XML ΠΕΑ</span>
            </h3>
            <p className="text-xs text-slate-400">
              Αποθηκεύστε και ανακτήστε τα αρχεία επιθεώρησης TEE-KENAK απευθείας στο προσωπικό σας Google Drive.
            </p>
          </div>
        </div>

        {/* Auth status & Action */}
        <div>
          {user ? (
            <div className="flex items-center gap-3 bg-slate-800/80 px-3.5 py-1.5 rounded-xl border border-slate-700">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-7 h-7 rounded-full border border-slate-600" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                  {(user.displayName || user.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <div className="text-left text-xs leading-tight">
                <p className="font-semibold text-slate-200">{user.displayName || 'Χρήστης Google'}</p>
                <p className="text-[10px] text-slate-400 font-mono truncate max-w-[150px]">{user.email}</p>
              </div>
              <button
                onClick={handleSignOut}
                disabled={loading}
                title="Αποσύνδεση"
                className="p-1.5 hover:bg-slate-700 text-rose-400 rounded-lg transition-colors cursor-pointer ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleSignIn}
              disabled={loading}
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-900/30 transition-all cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              <span>Σύνδεση με Google Drive</span>
            </button>
          )}
        </div>
      </div>

      {/* Status Feedback Message */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between gap-3 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-200'
              : 'bg-rose-950/60 border border-rose-800 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>

          {statusMessage.link && (
            <a
              href={statusMessage.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-blue-300 hover:underline shrink-0"
            >
              <span>Προβολή στο Drive</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}

      {/* Primary Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Save Current XML */}
        <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/80 space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-xs">
            <CloudUpload className="w-4 h-4 text-blue-400" />
            <span>Αποθήκευση Τρέχοντος ΠΕΑ στο Drive</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Δημιουργεί ή ενημερώνει το αρχείο <span className="font-mono text-teal-300">PEA_{currentModel.afm || '000000000'}.xml</span> στον λογαριασμό σας στο Google Drive.
          </p>
          <button
            onClick={handleSaveToDrive}
            disabled={loading || !user}
            type="button"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
            <span>Αποθήκευση XML στο Google Drive</span>
          </button>
        </div>

        {/* Card 2: Drive Sync Status */}
        <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/80 space-y-3">
          <div className="flex items-center justify-between text-white font-bold text-xs">
            <div className="flex items-center gap-2">
              <CloudDownload className="w-4 h-4 text-teal-400" />
              <span>Αρχεία XML στο Google Drive ({driveFiles.length})</span>
            </div>
            {user && (
              <button
                onClick={loadDriveFiles}
                disabled={fetchingFiles}
                title="Ανανέωση λίστας"
                className="p-1 hover:bg-slate-700 text-slate-300 rounded transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${fetchingFiles ? 'animate-spin text-teal-400' : ''}`} />
              </button>
            )}
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Επιλέξτε ένα από τα αποθηκευμένα αρχεία XML από το Google Drive σας για άμεση εισαγωγή στον οδηγό ΠΕΑ.
          </p>
        </div>
      </div>

      {/* Drive File List Table */}
      {user && (
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
            Αποθηκευμένα Αρχεία ΠΕΑ στο Google Drive:
          </h4>

          {fetchingFiles ? (
            <div className="p-8 text-center text-xs text-slate-400 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-400" />
              <p>Ανάκτηση αρχείων από το Google Drive...</p>
            </div>
          ) : driveFiles.length === 0 ? (
            <div className="p-6 bg-slate-800/40 rounded-xl border border-slate-800 text-center text-xs text-slate-400">
              Δεν βρέθηκαν αποθηκευμένα αρχεία <span className="font-mono text-teal-400">.xml</span> στο Google Drive σας.
            </div>
          ) : (
            <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800 bg-slate-950/50">
              {driveFiles.map((file) => (
                <div key={file.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/40 transition-colors text-xs">
                  <div className="flex items-start gap-3 min-w-0">
                    <FileText className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-200 truncate">{file.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Τελευταία τροποποίηση: {file.modifiedTime ? new Date(file.modifiedTime).toLocaleString('el-GR') : 'Άγνωστη'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {file.webViewLink && (
                      <a
                        href={file.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                        title="Προβολή στο Google Drive"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}

                    <button
                      onClick={() => handleImportFromDrive(file)}
                      disabled={loading}
                      type="button"
                      className="px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-blue-200 text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <CloudDownload className="w-3.5 h-3.5" />
                      <span>Εισαγωγή</span>
                    </button>

                    <button
                      onClick={() => setFileToDelete(file)}
                      disabled={loading}
                      type="button"
                      className="p-1.5 hover:bg-rose-900/40 text-rose-400 rounded-lg transition-colors cursor-pointer"
                      title="Διαγραφή από το Drive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal (MANDATORY per workspace skill) */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-100">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 bg-rose-950 border border-rose-800 rounded-xl">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Επιβεβαίωση Διαγραφής Αρχείου</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Είστε βέβαιοι ότι θέλετε να διαγράψετε οριστικά το αρχείο <strong className="text-white font-mono">{fileToDelete.name}</strong> από το Google Drive σας;
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setFileToDelete(null)}
                type="button"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Ακύρωση
              </button>
              <button
                onClick={confirmDeleteFile}
                disabled={loading}
                type="button"
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>Διαγραφή Αρχείου</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User, 
  signOut 
} from 'firebase/auth';
import firebaseConfigJson from '../../firebase-applet-config.json';

const envProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const jsonProjectId = firebaseConfigJson.projectId;
const effectiveProjectId = envProjectId || jsonProjectId;

const activeFirebaseConfig = {
  projectId: effectiveProjectId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigJson.appId,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigJson.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || (effectiveProjectId && effectiveProjectId !== 'YOUR_FIREBASE_PROJECT_ID' ? `${effectiveProjectId}.firebaseapp.com` : firebaseConfigJson.authDomain),
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || (effectiveProjectId && effectiveProjectId !== 'YOUR_FIREBASE_PROJECT_ID' ? `${effectiveProjectId}.appspot.com` : firebaseConfigJson.storageBucket),
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson.messagingSenderId,
  oAuthClientId: import.meta.env.VITE_FIREBASE_OAUTH_CLIENT_ID || firebaseConfigJson.oAuthClientId,
};

// Initialize Firebase App safely
const app = getApps().length > 0 ? getApp() : initializeApp(activeFirebaseConfig);
export const auth = getAuth(app);

export const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
];

const provider = new GoogleAuthProvider();
DRIVE_SCOPES.forEach((scope) => provider.addScope(scope));

let isSigningIn = false;
const TOKEN_KEY = 'gdrive_access_token';
const TOKEN_TIME_KEY = 'gdrive_token_timestamp';
const TOKEN_EXPIRY_MS = 55 * 60 * 1000; // 55 minutes

const getStoredToken = (): string | null => {
  try {
    const token = sessionStorage.getItem(TOKEN_KEY);
    const timeStr = sessionStorage.getItem(TOKEN_TIME_KEY);
    if (!token || !timeStr) return null;
    const elapsed = Date.now() - parseInt(timeStr, 10);
    if (elapsed > TOKEN_EXPIRY_MS) {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(TOKEN_TIME_KEY);
      return null;
    }
    return token;
  } catch {
    return null;
  }
};

const setStoredToken = (token: string) => {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(TOKEN_TIME_KEY, Date.now().toString());
  } catch (err) {
    console.error('Failed to store token in sessionStorage:', err);
  }
};

const clearStoredToken = () => {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_TIME_KEY);
  } catch {}
};

let cachedAccessToken: string | null = getStoredToken();

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const activeToken = getStoredToken() || cachedAccessToken;
      if (activeToken) {
        cachedAccessToken = activeToken;
        if (onAuthSuccess) onAuthSuccess(user, activeToken);
      } else if (!isSigningIn) {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      clearStoredToken();
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Δεν ελήφθη token πρόσβασης από το Google Auth');
    }

    cachedAccessToken = credential.accessToken;
    setStoredToken(cachedAccessToken);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = (): string | null => {
  return getStoredToken() || cachedAccessToken;
};

export const googleLogout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  clearStoredToken();
};

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
}

/**
 * List XML files stored in Google Drive
 */
export async function listXmlFilesFromDrive(accessToken: string): Promise<DriveFile[]> {
  const query = encodeURIComponent("name contains '.xml' and trashed = false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,modifiedTime,size,webViewLink)&orderBy=modifiedTime desc&pageSize=30`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Αποτυχία ανάκτησης αρχείων από το Google Drive');
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * Upload XML string content as a file to Google Drive
 */
export async function uploadXmlToDrive(
  accessToken: string,
  fileName: string,
  xmlContent: string,
  description?: string
): Promise<DriveFile> {
  const metadata = {
    name: fileName.endsWith('.xml') ? fileName : `${fileName}.xml`,
    mimeType: 'application/xml',
    description: description || 'Αρχείο TEE-KENAK XML παραχθέν από την εφαρμογή Οδηγός ΠΕΑ',
  };

  const boundary = 'foo_bar_baz_boundary';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json; charset=UTF-8' });
  const xmlBlob = new Blob([xmlContent], { type: 'application/xml; charset=UTF-8' });

  const multipartBlob = new Blob([
    `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n`,
    metadataBlob,
    `${delimiter}Content-Type: application/xml; charset=UTF-8\r\n\r\n`,
    xmlBlob,
    closeDelimiter
  ]);

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartBlob,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Αποτυχία μεταφόρτωσης στο Google Drive');
  }

  return await response.json();
}

/**
 * Download text content of an XML file from Google Drive
 */
export async function downloadXmlFromDrive(accessToken: string, fileId: string): Promise<string> {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Αποτυχία λήψης αρχείου από το Google Drive');
  }

  return await response.text();
}

/**
 * Delete a file from Google Drive
 */
export async function deleteFileFromDrive(accessToken: string, fileId: string): Promise<void> {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok && response.status !== 204) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Αποτυχία διαγραφής αρχείου από το Google Drive');
  }
}

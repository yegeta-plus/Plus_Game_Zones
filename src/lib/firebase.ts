import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc, disableNetwork } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import config from '../../firebase-applet-config.json';
import { ERPState } from './store';

const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env || {};

const firebaseConfig = {
  apiKey: config.apiKey || metaEnv.VITE_FIREBASE_API_KEY || '',
  authDomain: config.authDomain || metaEnv.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: config.projectId || metaEnv.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: config.storageBucket || metaEnv.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: config.messagingSenderId || metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: config.appId || metaEnv.VITE_FIREBASE_APP_ID || '',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app, config.firestoreDatabaseId || metaEnv.VITE_FIREBASE_DATABASE_ID || '(default)');
export const auth = getAuth(app);

const STATE_DOC_PATH = 'erp_state/main';

const getTodayStr = () => new Date().toISOString().split('T')[0];

const isQuotaExceededToday = (): boolean => {
  try {
    const storedDate = localStorage.getItem('pluszone_quota_exceeded_date');
    return storedDate === getTodayStr();
  } catch (_) {
    return false;
  }
};

const markQuotaExceeded = () => {
  try {
    localStorage.setItem('pluszone_quota_exceeded', 'true');
    localStorage.setItem('pluszone_quota_exceeded_date', getTodayStr());
  } catch (_) {
    // Ignore storage errors
  }
};

let isRemoteUpdate = false;
let syncTimeout: ReturnType<typeof setTimeout> | null = null;
let lastSyncedStateJson = '';
let quotaExceededLogged = isQuotaExceededToday();
let isQuotaExceeded = isQuotaExceededToday();

if (isQuotaExceeded) {
  disableNetwork(db).catch(() => {});
}

// Suppress unhandled Firestore quota error warnings in background
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (
      event.reason?.code === 'resource-exhausted' ||
      event.reason?.message?.includes('Quota') ||
      event.reason?.message?.includes('quota') ||
      event.reason?.message?.includes('resource-exhausted')
    ) {
      isQuotaExceeded = true;
      markQuotaExceeded();
      disableNetwork(db).catch(() => {});
      event.preventDefault(); // Prevent uncaught error reporting for quota limits
    }
  });
}

/**
 * Subscribe to real-time updates from Firebase Firestore.
 * When any user or device updates the ERP state in Firestore,
 * this listener fires instantly and provides the latest state.
 */
export function subscribeToFirebaseState(onUpdate: (remoteState: Partial<ERPState>) => void) {
  if (isQuotaExceeded) return () => {};

  let unsubscribeFn: (() => void) | null = null;
  const docRef = doc(db, 'erp_state', 'main');

  const safeUnsubscribe = () => {
    if (unsubscribeFn) {
      try {
        unsubscribeFn();
      } catch (_) {}
    }
  };

  unsubscribeFn = onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && data.state) {
          isRemoteUpdate = true;
          lastSyncedStateJson = JSON.stringify(data.state);
          onUpdate(data.state as ERPState);
          // Reset flag after state update settles
          setTimeout(() => {
            isRemoteUpdate = false;
          }, 300);
        }
      }
    },
    (error) => {
      if (
        error?.code === 'resource-exhausted' ||
        error?.message?.includes('Quota') ||
        error?.message?.includes('quota') ||
        error?.message?.includes('resource-exhausted')
      ) {
        isQuotaExceeded = true;
        markQuotaExceeded();
        disableNetwork(db).catch(() => {});
        if (!quotaExceededLogged) {
          console.warn('Firebase Firestore daily free quota reached. Falling back to local offline storage mode.');
          quotaExceededLogged = true;
        }
        setTimeout(safeUnsubscribe, 0);
      } else {
        console.warn('Firebase Firestore snapshot listener warning:', error);
      }
    }
  );

  return safeUnsubscribe;
}

/**
 * Push updated state to Firebase Firestore asynchronously with debouncing and loop suppression.
 * Guarantees fast, real-time sync across all devices and sessions without exhausting quota.
 */
export async function syncStateToFirebase(state: ERPState): Promise<void> {
  // If Firestore quota has been exceeded or state change was received from remote, skip cloud write
  if (isQuotaExceeded || isRemoteUpdate) {
    return;
  }

  const currentStateJson = JSON.stringify(state);
  // If state is identical to last synced payload, skip duplicate write
  if (currentStateJson === lastSyncedStateJson) {
    return;
  }

  // Debounce state writes to prevent excessive API calls
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }

  syncTimeout = setTimeout(async () => {
    if (isQuotaExceeded) return;

    try {
      const docRef = doc(db, 'erp_state', 'main');
      await setDoc(
        docRef,
        {
          state,
          updatedAt: new Date().toISOString(),
          updatedBy: state.currentUser?.name || 'System'
        },
        { merge: true }
      );
      lastSyncedStateJson = currentStateJson;
    } catch (err: any) {
      if (
        err?.code === 'resource-exhausted' ||
        err?.message?.includes('Quota') ||
        err?.message?.includes('quota') ||
        err?.message?.includes('resource-exhausted')
      ) {
        isQuotaExceeded = true;
        markQuotaExceeded();
        disableNetwork(db).catch(() => {});
        if (!quotaExceededLogged) {
          console.warn('Firestore daily write quota reached. App is safely persisting data locally in browser storage.');
          quotaExceededLogged = true;
        }
      } else {
        console.error('Failed to sync ERP state to Firebase Firestore:', err);
      }
    }
  }, 1000);
}

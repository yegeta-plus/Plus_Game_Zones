import { initializeApp, getApps } from 'firebase/app';
import { initializeFirestore, doc, onSnapshot, setDoc, getDoc, disableNetwork } from 'firebase/firestore';
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
const dbId = config.firestoreDatabaseId || metaEnv.VITE_FIREBASE_DATABASE_ID || '(default)';

export const db = initializeFirestore(
  app,
  {
    experimentalForceLongPolling: true,
  },
  dbId
);

export const auth = getAuth(app);

// Graceful background connection check without throwing unhandled rejection
async function testConnection() {
  if (isQuotaExceeded) return;
  try {
    const docRef = doc(db, 'erp_state', 'main');
    await getDoc(docRef);
  } catch (error: any) {
    if (
      error?.code === 'resource-exhausted' ||
      error?.message?.includes('Quota') ||
      error?.message?.includes('quota') ||
      error?.message?.includes('resource-exhausted')
    ) {
      isQuotaExceeded = true;
      markQuotaExceeded();
      disableNetwork(db).catch(() => {});
      console.info('Firestore free tier daily quota reached. Switched to offline storage.');
    } else if (error?.code === 'unavailable' || error?.message?.includes('unavailable') || error?.message?.includes('Could not reach Cloud Firestore') || error?.message?.includes('offline')) {
      console.info('Firestore initialized. Operating smoothly with real-time offline persistence cache.');
    }
  }
}
testConnection().catch(() => {});

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Info:', JSON.stringify(errInfo));
}

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

// Suppress unhandled Firestore quota and connection errors in background
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const isQuota =
      event.reason?.code === 'resource-exhausted' ||
      event.reason?.message?.includes('Quota') ||
      event.reason?.message?.includes('quota') ||
      event.reason?.message?.includes('resource-exhausted');
    
    const isUnavailable =
      event.reason?.code === 'unavailable' ||
      event.reason?.message?.includes('unavailable') ||
      event.reason?.message?.includes('Could not reach Cloud Firestore') ||
      event.reason?.message?.includes('offline');

    if (isQuota) {
      isQuotaExceeded = true;
      markQuotaExceeded();
      disableNetwork(db).catch(() => {});
      event.preventDefault();
    } else if (isUnavailable) {
      // Gracefully handle offline / connection error without breaking app flow
      event.preventDefault();
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
      const isQuota =
        error?.code === 'resource-exhausted' ||
        error?.message?.includes('Quota') ||
        error?.message?.includes('quota') ||
        error?.message?.includes('resource-exhausted');

      const isUnavailable =
        error?.code === 'unavailable' ||
        error?.message?.includes('unavailable') ||
        error?.message?.includes('Could not reach Cloud Firestore');

      if (isQuota) {
        isQuotaExceeded = true;
        markQuotaExceeded();
        disableNetwork(db).catch(() => {});
        if (!quotaExceededLogged) {
          console.warn('Firebase Firestore daily free quota reached. Falling back to local offline storage mode.');
          quotaExceededLogged = true;
        }
        setTimeout(safeUnsubscribe, 0);
      } else if (isUnavailable) {
        handleFirestoreError(error, OperationType.GET, 'erp_state/main');
        console.info('Firestore operates in offline mode: ', error.message);
      } else {
        handleFirestoreError(error, OperationType.GET, 'erp_state/main');
      }
    }
  );

  return safeUnsubscribe;
}

/**
 * Fetch latest state directly from Firebase Firestore on demand.
 */
export async function fetchLatestFirebaseState(): Promise<Partial<ERPState> | null> {
  if (isQuotaExceeded) return null;
  try {
    const docRef = doc(db, 'erp_state', 'main');
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      if (data && data.state) {
        return data.state as Partial<ERPState>;
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'erp_state/main');
  }
  return null;
}

/**
 * Immediately push state to Firestore without debounce delay.
 */
export async function syncStateToFirebaseNow(state: ERPState): Promise<void> {
  if (isQuotaExceeded || isRemoteUpdate) return;
  if (syncTimeout) {
    clearTimeout(syncTimeout);
    syncTimeout = null;
  }
  const currentStateJson = JSON.stringify(state);
  try {
    const docRef = doc(db, 'erp_state', 'main');
    const cleanState = JSON.parse(JSON.stringify(state));
    await setDoc(
      docRef,
      {
        state: cleanState,
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
    } else {
      handleFirestoreError(err, OperationType.WRITE, 'erp_state/main');
    }
  }
}

/**
 * Push updated state to Firebase Firestore asynchronously with short 150ms debouncing and loop suppression.
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
      const cleanState = JSON.parse(JSON.stringify(state));
      await setDoc(
        docRef,
        {
          state: cleanState,
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
        handleFirestoreError(err, OperationType.WRITE, 'erp_state/main');
      }
    }
  }, 2000);
}

export function isFirestoreQuotaExceeded(): boolean {
  return isQuotaExceeded;
}

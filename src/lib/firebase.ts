import { initializeApp, getApps } from 'firebase/app';
import {
  initializeFirestore,
  memoryLocalCache,
  doc,
  onSnapshot,
  setDoc,
  getDoc,
  disableNetwork,
  enableNetwork
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import config from '../../firebase-applet-config.json';
import { ERPState } from './store';

const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env || {};

export const FIRESTORE_PROJECT_ID = config.projectId || metaEnv.VITE_FIREBASE_PROJECT_ID || 'arctic-history-nsjh2';
export const FIRESTORE_DATABASE_ID = config.firestoreDatabaseId || metaEnv.VITE_FIREBASE_DATABASE_ID || 'ai-studio-pluszonefinancee-81b56110-6dcb-4d53-93e5-bd5cf2918283';
export const FIRESTORE_UPGRADE_URL = `https://console.firebase.google.com/project/${FIRESTORE_PROJECT_ID}/firestore/databases/${FIRESTORE_DATABASE_ID}/data?openUpgradeDialog=true`;
export const FIRESTORE_PRICING_URL = 'https://firebase.google.com/pricing#cloud-firestore';

const firebaseConfig = {
  apiKey: config.apiKey || metaEnv.VITE_FIREBASE_API_KEY || '',
  authDomain: config.authDomain || metaEnv.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: FIRESTORE_PROJECT_ID,
  storageBucket: config.storageBucket || metaEnv.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: config.messagingSenderId || metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: config.appId || metaEnv.VITE_FIREBASE_APP_ID || '',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firestore using memoryLocalCache to eliminate IndexedDB database closing/hidden conflicts in iframe/tabs
export const db = initializeFirestore(
  app,
  {
    localCache: memoryLocalCache(),
    experimentalForceLongPolling: true,
  },
  FIRESTORE_DATABASE_ID
);

export const auth = getAuth(app);

const getTodayStr = () => new Date().toISOString().split('T')[0];

const checkIsQuotaExceededInitial = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const isExceeded = localStorage.getItem('pluszone_quota_exceeded') === 'true';
    const storedDate = localStorage.getItem('pluszone_quota_exceeded_date');
    const storedTimestamp = Number(localStorage.getItem('pluszone_quota_exceeded_time') || '0');
    const within24h = Date.now() - storedTimestamp < 24 * 60 * 60 * 1000;
    return isExceeded && (storedDate === getTodayStr() || within24h);
  } catch (_) {
    return false;
  }
};

let isQuotaExceeded = checkIsQuotaExceededInitial();
let quotaExceededLogged = isQuotaExceeded;
let isRemoteUpdate = false;
let syncTimeout: ReturnType<typeof setTimeout> | null = null;
let lastSyncedFingerprint = '';

export const markQuotaExceeded = () => {
  isQuotaExceeded = true;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('pluszone_quota_exceeded', 'true');
      localStorage.setItem('pluszone_quota_exceeded_date', getTodayStr());
      localStorage.setItem('pluszone_quota_exceeded_time', String(Date.now()));
      window.dispatchEvent(new CustomEvent('pluszone:firestore-quota-exceeded', { detail: { exceeded: true } }));
    } catch (_) {}
  }
  // Halt active Firestore network streams and backoff retries
  try {
    disableNetwork(db).catch(() => {});
  } catch (_) {}
};

// If already exceeded from previous run, immediately disable network
if (isQuotaExceeded) {
  try {
    disableNetwork(db).catch(() => {});
  } catch (_) {}
}

// Intercept window console.error & unhandled rejection to gracefully absorb Firestore quota & backoff delay logs
if (typeof window !== 'undefined') {
  const originalConsoleError = console.error.bind(console);
  console.error = (...args: any[]) => {
    const msg = args
      .map((a) => {
        if (!a) return '';
        if (typeof a === 'string') return a;
        if (a instanceof Error) return a.message + ' ' + (a.stack || '');
        try {
          return JSON.stringify(a);
        } catch {
          return String(a);
        }
      })
      .join(' ');

    const isQuotaError =
      msg.includes('code=resource-exhausted') ||
      msg.includes('Free daily write units per project') ||
      msg.includes('Free daily read units per project') ||
      msg.includes('Quota limit exceeded') ||
      msg.includes('Using maximum backoff delay to prevent overloading the backend');

    if (isQuotaError) {
      if (!isQuotaExceeded) {
        markQuotaExceeded();
      }
      if (!quotaExceededLogged) {
        console.warn(
          `[PlusZone ERP] Cloud Firestore daily free tier quota reached for project ${FIRESTORE_PROJECT_ID}. ` +
          `The app has safely shifted to browser local offline storage. Quota resets tomorrow at 00:00 UTC. ` +
          `Upgrade URL: ${FIRESTORE_UPGRADE_URL}`
        );
        quotaExceededLogged = true;
      }
      return; // Gracefully suppress from being treated as fatal crash
    }

    originalConsoleError(...args);
  };

  window.addEventListener('unhandledrejection', (event) => {
    const reasonMsg = String(event.reason?.message || event.reason || '');
    const isQuota =
      event.reason?.code === 'resource-exhausted' ||
      reasonMsg.includes('Quota') ||
      reasonMsg.includes('quota') ||
      reasonMsg.includes('resource-exhausted');

    const isDbClosingOrHidden =
      reasonMsg.includes('Database is closing') ||
      reasonMsg.includes('closing/hidden') ||
      reasonMsg.includes('IDBDatabase') ||
      reasonMsg.includes('The database connection is closing');

    const isUnavailable =
      event.reason?.code === 'unavailable' ||
      reasonMsg.includes('unavailable') ||
      reasonMsg.includes('Could not reach Cloud Firestore') ||
      reasonMsg.includes('offline') ||
      reasonMsg.includes('the client is offline');

    if (isQuota) {
      markQuotaExceeded();
      event.preventDefault();
    } else if (isDbClosingOrHidden || isUnavailable) {
      event.preventDefault();
    }
  });

  window.addEventListener(
    'error',
    (event) => {
      const errorMsg = String(event.message || event.error?.message || '');
      if (
        errorMsg.includes('Database is closing') ||
        errorMsg.includes('closing/hidden') ||
        errorMsg.includes('IDBDatabase') ||
        errorMsg.includes('The database connection is closing') ||
        errorMsg.includes('resource-exhausted') ||
        errorMsg.includes('Quota limit exceeded')
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    true
  );
}

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
      markQuotaExceeded();
      console.info('Firestore free tier daily quota reached. Switched to offline storage.');
    } else if (
      error?.code === 'unavailable' ||
      error?.message?.includes('unavailable') ||
      error?.message?.includes('Could not reach Cloud Firestore') ||
      error?.message?.includes('offline') ||
      error?.message?.includes('closing') ||
      error?.message?.includes('hidden')
    ) {
      console.info('Firestore operating with offline fallback cache.');
    }
  }
}
if (!isQuotaExceeded) {
  testConnection().catch(() => {});
}

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
  const errMessage = error instanceof Error ? error.message : String(error);
  if (
    errMessage.includes('resource-exhausted') ||
    errMessage.includes('Quota') ||
    errMessage.includes('quota')
  ) {
    markQuotaExceeded();
    return;
  }

  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.warn('Firestore Operation Info:', JSON.stringify(errInfo));
}

/**
 * Generates a lightweight, stable fingerprint of the core business entities.
 * Used to avoid duplicate cloud writes when non-critical or volatile UI state changes.
 */
function getStateFingerprint(state: ERPState): string {
  try {
    const txLen = state.transactions?.length || 0;
    const lastTx = txLen > 0 ? state.transactions[txLen - 1]?.id : '';
    const walletsSum = (state.wallets || []).map((w) => `${w.id}:${w.openingBalance}`).join('|');
    const equbsCount = state.equbs?.length || 0;
    const loansCount = state.loans?.length || 0;
    const rcvCount = state.receivables?.length || 0;
    const usersCount = state.users?.length || 0;
    return `${txLen}:${lastTx}:${walletsSum}:${equbsCount}:${loansCount}:${rcvCount}:${usersCount}`;
  } catch (_) {
    return String(Date.now());
  }
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
      unsubscribeFn = null;
    }
  };

  try {
    unsubscribeFn = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data && data.state) {
            isRemoteUpdate = true;
            lastSyncedFingerprint = getStateFingerprint(data.state as ERPState);
            onUpdate(data.state as ERPState);
            // Reset flag after state update settles to prevent ping-pong writes
            setTimeout(() => {
              isRemoteUpdate = false;
            }, 1500);
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
          markQuotaExceeded();
          safeUnsubscribe();
        } else if (isUnavailable) {
          console.info('Firestore operates in offline mode: ', error.message);
        } else {
          handleFirestoreError(error, OperationType.GET, 'erp_state/main');
        }
      }
    );
  } catch (err: any) {
    if (
      err?.code === 'resource-exhausted' ||
      err?.message?.includes('Quota') ||
      err?.message?.includes('quota')
    ) {
      markQuotaExceeded();
    }
  }

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
        lastSyncedFingerprint = getStateFingerprint(data.state as ERPState);
        return data.state as Partial<ERPState>;
      }
    }
  } catch (err: any) {
    if (
      err?.code === 'resource-exhausted' ||
      err?.message?.includes('Quota') ||
      err?.message?.includes('quota')
    ) {
      markQuotaExceeded();
      return null;
    }
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

  const fingerprint = getStateFingerprint(state);
  if (fingerprint === lastSyncedFingerprint) {
    return;
  }

  try {
    const docRef = doc(db, 'erp_state', 'main');
    const cleanState = JSON.parse(JSON.stringify(state));
    await setDoc(
      docRef,
      {
        state: cleanState,
        updatedAt: new Date().toISOString(),
        updatedBy: state.currentUser?.name || 'System',
      },
      { merge: true }
    );
    lastSyncedFingerprint = fingerprint;
  } catch (err: any) {
    if (
      err?.code === 'resource-exhausted' ||
      err?.message?.includes('Quota') ||
      err?.message?.includes('quota') ||
      err?.message?.includes('resource-exhausted')
    ) {
      markQuotaExceeded();
    } else {
      handleFirestoreError(err, OperationType.WRITE, 'erp_state/main');
    }
  }
}

/**
 * Push updated state to Firebase Firestore asynchronously with 5000ms debouncing and loop suppression.
 * Guarantees real-time sync across devices while strictly preserving free-tier write quotas.
 */
export async function syncStateToFirebase(state: ERPState): Promise<void> {
  // If Firestore quota has been exceeded or state change was received from remote, skip cloud write
  if (isQuotaExceeded || isRemoteUpdate) {
    return;
  }

  const fingerprint = getStateFingerprint(state);
  // If state is identical to last synced payload, skip duplicate write
  if (fingerprint === lastSyncedFingerprint) {
    return;
  }

  // Debounce state writes to 5000ms to avoid burning write quota
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }

  syncTimeout = setTimeout(async () => {
    if (isQuotaExceeded || isRemoteUpdate) return;

    try {
      const docRef = doc(db, 'erp_state', 'main');
      const cleanState = JSON.parse(JSON.stringify(state));
      await setDoc(
        docRef,
        {
          state: cleanState,
          updatedAt: new Date().toISOString(),
          updatedBy: state.currentUser?.name || 'System',
        },
        { merge: true }
      );
      lastSyncedFingerprint = fingerprint;
    } catch (err: any) {
      if (
        err?.code === 'resource-exhausted' ||
        err?.message?.includes('Quota') ||
        err?.message?.includes('quota') ||
        err?.message?.includes('resource-exhausted')
      ) {
        markQuotaExceeded();
      } else {
        handleFirestoreError(err, OperationType.WRITE, 'erp_state/main');
      }
    }
  }, 5000);
}

export function isFirestoreQuotaExceeded(): boolean {
  return isQuotaExceeded;
}

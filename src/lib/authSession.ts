import { UserProfile } from '../types';

export const AUTH_SESSION_KEY = 'pluszone_auth_session';
export const AUTH_REMEMBER_KEY = 'pluszone_remember_session_pref';
export const AUTH_USERNAME_KEY = 'pluszone_remembered_username';

export interface StoredAuthSession {
  userId: string;
  email: string;
  username?: string;
  name: string;
  role: string;
  loggedInAt: number;
  remember: boolean;
}

/**
 * Save user authentication session to persistent localStorage or tab-scoped sessionStorage.
 * When remember = true, session is persisted across browser reloads, tab closures, and device restarts.
 */
export function saveAuthSession(user: UserProfile, remember: boolean = true): void {
  if (typeof window === 'undefined') return;

  const session: StoredAuthSession = {
    userId: user.id,
    email: user.email,
    username: user.username,
    name: user.name,
    role: user.role,
    loggedInAt: Date.now(),
    remember
  };

  try {
    const raw = JSON.stringify(session);
    if (remember) {
      localStorage.setItem(AUTH_SESSION_KEY, raw);
      localStorage.setItem(AUTH_REMEMBER_KEY, 'true');
      if (user.username || user.email) {
        localStorage.setItem(AUTH_USERNAME_KEY, user.username || user.email);
      }
      // Clean up session storage to avoid duplicate out-of-sync sessions
      sessionStorage.removeItem(AUTH_SESSION_KEY);
    } else {
      sessionStorage.setItem(AUTH_SESSION_KEY, raw);
      localStorage.setItem(AUTH_REMEMBER_KEY, 'false');
      // If user deliberately unchecks remember, remove persistent saved session
      localStorage.removeItem(AUTH_SESSION_KEY);
    }
  } catch (err) {
    console.warn('Failed to save auth session to storage:', err);
  }
}

/**
 * Retrieves the currently active authentication session from localStorage or sessionStorage.
 */
export function getActiveAuthSession(): StoredAuthSession | null {
  if (typeof window === 'undefined') return null;

  try {
    // 1. Check persistent localStorage first (remembered session across restarts)
    const localRaw = localStorage.getItem(AUTH_SESSION_KEY);
    if (localRaw) {
      const parsed = JSON.parse(localRaw);
      if (parsed && (parsed.userId || parsed.email)) {
        return parsed;
      }
    }

    // 2. Check tab sessionStorage (temporary session during active browser tab)
    const sessionRaw = sessionStorage.getItem(AUTH_SESSION_KEY);
    if (sessionRaw) {
      const parsed = JSON.parse(sessionRaw);
      if (parsed && (parsed.userId || parsed.email)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to read active auth session:', err);
  }
  return null;
}

/**
 * Clear all authentication sessions from localStorage and sessionStorage (explicit user logout).
 */
export function clearAuthSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(AUTH_SESSION_KEY);
    sessionStorage.removeItem(AUTH_SESSION_KEY);
  } catch (err) {
    console.warn('Failed to clear auth session:', err);
  }
}

/**
 * Updates the user details inside the existing session (e.g. on profile switch or update).
 */
export function updateAuthSessionUser(user: UserProfile): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getActiveAuthSession();
    if (current) {
      saveAuthSession(user, current.remember !== false);
    }
  } catch {}
}

/**
 * Check if the user has opted to remember session (default: true).
 */
export function getRememberSessionPreference(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const val = localStorage.getItem(AUTH_REMEMBER_KEY);
    return val !== null ? val === 'true' : true;
  } catch {
    return true;
  }
}

/**
 * Get pre-filled or remembered username / email for login screen.
 */
export function getRememberedUsername(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(AUTH_USERNAME_KEY) || '';
  } catch {
    return '';
  }
}

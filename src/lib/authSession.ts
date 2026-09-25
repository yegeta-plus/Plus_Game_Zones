import { UserProfile } from '../types';

export const AUTH_SESSION_KEY = 'pluszone_auth_session';
export const AUTH_REMEMBER_KEY = 'pluszone_remember_session_pref';
export const AUTH_USERNAME_KEY = 'pluszone_remembered_username';
export const AUTH_USER_PROFILE_BACKUP = 'pluszone_remembered_user_profile';

export interface StoredAuthSession {
  userId: string;
  email: string;
  username?: string;
  name: string;
  role: string;
  loggedInAt: number;
  remember: boolean;
  user?: UserProfile;
}

/**
 * Save user authentication session to persistent localStorage and tab-scoped sessionStorage.
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
    remember,
    user
  };

  try {
    const raw = JSON.stringify(session);
    const userRaw = JSON.stringify(user);

    if (remember) {
      localStorage.setItem(AUTH_SESSION_KEY, raw);
      localStorage.setItem(AUTH_USER_PROFILE_BACKUP, userRaw);
      localStorage.setItem(AUTH_REMEMBER_KEY, 'true');
      if (user.username || user.email) {
        localStorage.setItem(AUTH_USERNAME_KEY, user.username || user.email);
      }
      // Also mirror to sessionStorage so active tab always has immediate zero-latency access
      sessionStorage.setItem(AUTH_SESSION_KEY, raw);

      // Set cookie as auxiliary fallback for iframe sandboxes
      try {
        document.cookie = `pz_session_active=1; path=/; max-age=31536000; SameSite=Lax`;
      } catch {}
    } else {
      sessionStorage.setItem(AUTH_SESSION_KEY, raw);
      localStorage.setItem(AUTH_REMEMBER_KEY, 'false');
      localStorage.removeItem(AUTH_SESSION_KEY);
      localStorage.removeItem(AUTH_USER_PROFILE_BACKUP);
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
    // 1. Check tab sessionStorage first (active tab session, allowing concurrent multi-user testing in separate tabs/windows)
    const sessionRaw = sessionStorage.getItem(AUTH_SESSION_KEY);
    if (sessionRaw) {
      const parsed = JSON.parse(sessionRaw);
      if (parsed && (parsed.userId || parsed.email)) {
        return parsed;
      }
    }

    // 2. Check persistent localStorage (remembered session across restarts)
    const localRaw = localStorage.getItem(AUTH_SESSION_KEY);
    if (localRaw) {
      const parsed = JSON.parse(localRaw);
      if (parsed && (parsed.userId || parsed.email)) {
        // Hydrate this tab's sessionStorage
        try {
          sessionStorage.setItem(AUTH_SESSION_KEY, localRaw);
        } catch (_) {}
        return parsed;
      }
    }

    // 3. Fallback: check stored user profile backup
    const profileBackup = localStorage.getItem(AUTH_USER_PROFILE_BACKUP);
    if (profileBackup) {
      const parsedUser = JSON.parse(profileBackup) as UserProfile;
      if (parsedUser && parsedUser.id) {
        const fallbackSession: StoredAuthSession = {
          userId: parsedUser.id,
          email: parsedUser.email,
          username: parsedUser.username,
          name: parsedUser.name,
          role: parsedUser.role,
          loggedInAt: Date.now(),
          remember: true,
          user: parsedUser
        };
        // Re-hydrate session storage
        try {
          sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(fallbackSession));
          localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(fallbackSession));
        } catch (_) {}
        return fallbackSession;
      }
    }
  } catch (err) {
    console.warn('Failed to read active auth session:', err);
  }
  return null;
}

/**
 * Retrieves the full user profile from the active or remembered session if available.
 */
export function getRememberedUserProfile(): UserProfile | null {
  const session = getActiveAuthSession();
  if (session?.user) return session.user;
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_USER_PROFILE_BACKUP);
    if (raw) return JSON.parse(raw) as UserProfile;
  } catch {}
  return null;
}

/**
 * Clear all authentication sessions from localStorage and sessionStorage (explicit user logout).
 */
export function clearAuthSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(AUTH_SESSION_KEY);
    localStorage.removeItem(AUTH_USER_PROFILE_BACKUP);
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    try {
      document.cookie = 'pz_session_active=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    } catch {}
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
    saveAuthSession(user, current ? current.remember !== false : true);
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


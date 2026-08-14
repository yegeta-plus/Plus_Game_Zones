// System & Web Push Notification Helper for External OS / Browser Alerts

export function isNotificationSupported(): boolean {
  try {
    return typeof window !== 'undefined' && 'Notification' in window;
  } catch {
    return false;
  }
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  try {
    return Notification.permission;
  } catch {
    return 'denied';
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied';
  try {
    if (typeof Notification.requestPermission === 'function') {
      const permission = await Notification.requestPermission();
      return permission;
    }
    return 'denied';
  } catch (err) {
    console.warn('Error requesting notification permission:', err);
    return 'denied';
  }
}

export interface ExternalNotificationOptions {
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
}

/**
 * Sends a notification that pops up OUTSIDE the web app (on OS / Mobile Notification Center)
 */
export async function sendExternalNotification(
  title: string,
  options: ExternalNotificationOptions
): Promise<boolean> {
  if (!isNotificationSupported()) return false;

  let permission: NotificationPermission = 'denied';
  try {
    permission = Notification.permission;
    if (permission === 'default') {
      permission = await requestNotificationPermission();
    }
  } catch {
    return false;
  }

  if (permission !== 'granted') {
    return false;
  }

  const iconUrl = options.icon || '/pwa-192.png';

  // 1. Try sending via active Service Worker (Required on Android / Chrome to avoid "Illegal constructor")
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration && typeof registration.showNotification === 'function') {
        await registration.showNotification(title, {
          body: options.body,
          icon: iconUrl,
          badge: '/pwa-192.png',
          tag: options.tag || `pluszone-notif-${Date.now()}`,
          renotify: true,
          data: options.data || { url: '/' }
        } as NotificationOptions);

        // Also post message to SW
        if (registration.active) {
          registration.active.postMessage({
            type: 'SHOW_NOTIFICATION',
            payload: {
              title,
              body: options.body,
              icon: iconUrl,
              tag: options.tag,
              data: options.data
            }
          });
        }
        return true;
      }
    } catch (swErr) {
      console.warn('Service worker showNotification notice:', swErr);
    }
  }

  // 2. Fallback to direct Window Notification API if constructible (non-Android desktop browsers)
  try {
    const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent || '');
    if (!isAndroid && typeof Notification === 'function') {
      const notif = new Notification(title, {
        body: options.body,
        icon: iconUrl,
        badge: '/pwa-192.png',
        tag: options.tag || `pluszone-notif-${Date.now()}`
      });

      notif.onclick = () => {
        window.focus();
        notif.close();
      };

      return true;
    }
  } catch (err) {
    // Gracefully ignore if constructor is illegal on this platform
    console.warn('Direct Notification constructor unavailable on this device:', err);
    return false;
  }

  return false;
}

/**
 * Format timestamp into human readable relative time string (e.g. "Just now", "2m ago", "1h ago")
 */
export function formatRelativeNotifTime(timestamp: number): string {
  if (!timestamp) return 'Recent';
  const diffMs = Date.now() - timestamp;
  if (diffMs < 0) return 'Scheduled';
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 45) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

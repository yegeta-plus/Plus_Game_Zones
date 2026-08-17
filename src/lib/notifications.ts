// System & Web Push Notification Helper for External OS / Browser Alerts

export function isNotificationSupported(): boolean {
  try {
    return typeof window !== 'undefined' && 'Notification' in window;
  } catch {
    return false;
  }
}

export function isNotificationConstructible(): boolean {
  try {
    if (!isNotificationSupported()) return false;
    // If inside an iframe or Android browser, Notification constructor is prohibited
    if (typeof window !== 'undefined' && window.self !== window.top) {
      return false;
    }
    if (typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '')) {
      return false;
    }
    return typeof Notification === 'function';
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
 * Safe from "TypeError: Illegal constructor" in iframes / mobile browsers.
 */
export async function sendExternalNotification(
  title: string,
  options: ExternalNotificationOptions
): Promise<boolean> {
  try {
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

    // 1. Try sending via active Service Worker if available (safe non-blocking getRegistration)
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg && typeof reg.showNotification === 'function') {
          await reg.showNotification(title, {
            body: options.body,
            icon: iconUrl,
            badge: '/pwa-192.png',
            tag: options.tag || `pluszone-notif-${Date.now()}`,
            renotify: true,
            data: options.data || { url: '/' }
          } as NotificationOptions);

          if (reg.active) {
            reg.active.postMessage({
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
        // Ignore SW showNotification errors safely
      }
    }

    // 2. Direct Notification constructor fallback (only when safe and not in iframe)
    if (isNotificationConstructible()) {
      try {
        const notif = new (window as any).Notification(title, {
          body: options.body,
          icon: iconUrl,
          badge: '/pwa-192.png',
          tag: options.tag || `pluszone-notif-${Date.now()}`
        });

        notif.onclick = () => {
          try {
            window.focus();
            notif.close();
          } catch {}
        };

        return true;
      } catch (constructErr) {
        // Catch Illegal constructor quietly
        return false;
      }
    }

    return false;
  } catch (outerErr) {
    // Blanket catch to ensure zero unhandled exceptions
    return false;
  }
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

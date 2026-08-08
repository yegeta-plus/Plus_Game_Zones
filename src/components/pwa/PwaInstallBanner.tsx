import React, { useState, useEffect } from 'react';
import { Download, WifiOff, CheckCircle2, X, Bell } from 'lucide-react';
import { triggerHaptic } from '../../lib/haptics';
import { requestNotificationPermission, getNotificationPermission, sendExternalNotification } from '../../lib/notifications';

export const PwaInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');
  const [showNotifBanner, setShowNotifBanner] = useState(false);

  useEffect(() => {
    // Check initial notification permission
    const currentPerm = getNotificationPermission();
    setNotifPermission(currentPerm);
    if (currentPerm === 'default') {
      // Show notification banner if not yet decided
      setShowNotifBanner(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Register service worker and auto-request notification permissions if in standalone mode
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.log('SW registration failed:', err);
      });
    }

    // If app launched in standalone mode (PWA installed), prompt for notifications automatically
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    if (isStandalone && currentPerm === 'default') {
      requestNotificationPermission().then((perm) => {
        setNotifPermission(perm);
        if (perm === 'granted') {
          setShowNotifBanner(false);
          sendExternalNotification('PlusZone ERP App Installed 🚀', {
            body: 'Real-time mobile notifications enabled! You will receive instant alerts for all financial activities.'
          });
        }
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    triggerHaptic('medium');
    
    // Automatically request notification permission during install flow
    const perm = await requestNotificationPermission();
    setNotifPermission(perm);

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstalledSuccess(true);
        setShowBanner(false);
        setShowNotifBanner(false);

        if (perm === 'granted') {
          sendExternalNotification('PlusZone ERP Installed 🔔', {
            body: 'Push notifications activated! Financial updates & new activities will show here on your mobile device.'
          });
        }
        setTimeout(() => setInstalledSuccess(false), 4000);
      }
      setDeferredPrompt(null);
    } else if (perm === 'granted') {
      setShowNotifBanner(false);
      sendExternalNotification('Notifications Active 🔔', {
        body: 'Mobile notification permission granted. Instant activity alerts are now active!'
      });
    }
  };

  const handleEnableNotifications = async () => {
    triggerHaptic('medium');
    const perm = await requestNotificationPermission();
    setNotifPermission(perm);
    if (perm === 'granted') {
      setShowNotifBanner(false);
      sendExternalNotification('Mobile Notifications Active 🔔', {
        body: 'You will now receive instant push alerts on your phone whenever new transactions or activities are made.'
      });
    } else {
      setShowNotifBanner(false);
    }
  };

  return (
    <>
      {/* Offline Alert Badge */}
      {isOffline && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-400 px-4 py-2 text-xs font-medium flex items-center justify-between animate-fadeIn z-50">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>Offline Mode Active — Operating on cached app shell & local ledger.</span>
          </div>
          <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">Cached</span>
        </div>
      )}

      {/* Installed Toast */}
      {installedSuccess && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-[#00D4AA] text-[#0A0E1A] px-4 py-2.5 rounded-full font-semibold text-xs shadow-lg flex items-center gap-2 z-50 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>PlusZone Finance ERP installed to Home Screen!</span>
        </div>
      )}

      {/* Mobile Notification Permission Request Banner */}
      {showNotifBanner && notifPermission === 'default' && (
        <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-100 p-3 mx-4 my-2 rounded-xl flex items-center justify-between shadow-xl z-40 animate-slideUp">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Enable Activity Notifications</p>
              <p className="text-[11px] text-emerald-200/80">Get mobile alerts when new transactions & financial updates occur</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleEnableNotifications}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Allow</span>
            </button>
            <button
              onClick={() => setShowNotifBanner(false)}
              className="text-emerald-300 hover:text-white p-1 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* PWA Install Banner */}
      {showBanner && (
        <div className="bg-[#1C2333] border border-[#00D4AA]/30 text-[#F0F4FF] p-3 mx-4 my-2 rounded-xl flex items-center justify-between shadow-xl z-40 animate-slideUp">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#00D4AA]/20 text-[#00D4AA] flex items-center justify-center font-bold text-lg">
              PZ
            </div>
            <div>
              <p className="text-xs font-bold text-[#F0F4FF]">Install PlusZone ERP App</p>
              <p className="text-[11px] text-[#8899BB]">Add to Home Screen & enable mobile push notifications</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="bg-[#00D4AA] hover:bg-[#00D4AA]/90 text-[#0A0E1A] text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install</span>
            </button>
            <button
              onClick={() => setShowBanner(false)}
              className="text-[#8899BB] hover:text-white p-1 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};


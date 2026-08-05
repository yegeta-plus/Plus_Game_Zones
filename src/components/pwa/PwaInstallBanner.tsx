import React, { useState, useEffect } from 'react';
import { Download, WifiOff, CheckCircle2, X } from 'lucide-react';
import { triggerHaptic } from '../../lib/haptics';

export const PwaInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
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

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.log('SW registration failed:', err);
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
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstalledSuccess(true);
      setShowBanner(false);
      setTimeout(() => setInstalledSuccess(false), 4000);
    }
    setDeferredPrompt(null);
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

      {/* PWA Install Banner */}
      {showBanner && (
        <div className="bg-[#1C2333] border border-[#00D4AA]/30 text-[#F0F4FF] p-3 mx-4 my-2 rounded-xl flex items-center justify-between shadow-xl z-40 animate-slideUp">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#00D4AA]/20 text-[#00D4AA] flex items-center justify-center font-bold text-lg">
              PZ
            </div>
            <div>
              <p className="text-xs font-bold text-[#F0F4FF]">Install PlusZone ERP App</p>
              <p className="text-[11px] text-[#8899BB]">Add to Home Screen for full-screen offline access</p>
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

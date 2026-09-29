import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { triggerHaptic } from '../../lib/haptics';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'button' | 'compact' | 'badge';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'button'
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the install button
  if (isInstalled) {
    return null;
  }

  const handleInstall = async () => {
    triggerHaptic('medium');
    await install();
  };

  // Chromium / Android / Desktop Install Flow
  if (isInstallable) {
    if (variant === 'compact') {
      return (
        <button
          onClick={handleInstall}
          title="Install PlusZone ERP App"
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#00D4AA]/15 text-[#00D4AA] border border-[#00D4AA]/30 hover:bg-[#00D4AA]/25 transition cursor-pointer ${className}`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install</span>
        </button>
      );
    }

    if (variant === 'badge') {
      return (
        <button
          onClick={handleInstall}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-[#00D4AA] to-emerald-400 text-[#0A0E1A] shadow-md hover:brightness-110 transition cursor-pointer ${className}`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install App</span>
        </button>
      );
    }

    return (
      <button
        onClick={handleInstall}
        className={`flex items-center gap-2 rounded-lg bg-[#00D4AA] hover:bg-[#00D4AA]/90 text-[#0A0E1A] px-3.5 py-1.5 text-xs font-bold shadow-sm transition cursor-pointer ${className}`}
      >
        <Download className="w-4 h-4" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari Flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => {
            triggerHaptic('light');
            setShowIOSGuide(true);
          }}
          className={`flex items-center gap-1.5 rounded-lg border border-[#00D4AA]/40 bg-[#00D4AA]/10 px-2.5 py-1 text-xs font-medium text-[#00D4AA] hover:bg-[#00D4AA]/20 transition cursor-pointer ${className}`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="w-full max-w-sm rounded-2xl bg-[#141B2D] border border-cyan-500/30 p-6 shadow-2xl text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#00D4AA]/20 text-[#00D4AA] flex items-center justify-center font-bold">
                    PZ
                  </div>
                  <h3 className="text-base font-bold text-white">Install on iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-gray-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex items-start gap-2.5 bg-[#1C253B] p-2.5 rounded-xl border border-slate-700/50">
                  <span className="w-5 h-5 rounded-full bg-[#00D4AA] text-[#0A0E1A] font-bold flex items-center justify-center text-[10px] shrink-0">1</span>
                  <p>Tap the <strong className="text-white">Share</strong> button in your Safari toolbar (square with arrow pointing up).</p>
                </div>
                <div className="flex items-start gap-2.5 bg-[#1C253B] p-2.5 rounded-xl border border-slate-700/50">
                  <span className="w-5 h-5 rounded-full bg-[#00D4AA] text-[#0A0E1A] font-bold flex items-center justify-center text-[10px] shrink-0">2</span>
                  <p>Scroll down the list and tap <strong className="text-white">Add to Home Screen</strong>.</p>
                </div>
                <div className="flex items-start gap-2.5 bg-[#1C253B] p-2.5 rounded-xl border border-slate-700/50">
                  <span className="w-5 h-5 rounded-full bg-[#00D4AA] text-[#0A0E1A] font-bold flex items-center justify-center text-[10px] shrink-0">3</span>
                  <p>Tap <strong className="text-white">Add</strong> in the top right corner. PlusZone will launch as a full native app!</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-gradient-to-r from-[#00D4AA] to-emerald-500 py-2.5 text-xs font-bold text-[#0A0E1A] hover:brightness-110 transition cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

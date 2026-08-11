import React, { useState } from 'react';
import { Gamepad2, Sparkles, X, Maximize2 } from 'lucide-react';

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
  subtitle?: string;
  clickable?: boolean;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 'md',
  className = '',
  showText = false,
  subtitle,
  clickable = true
}) => {
  const [imgError, setImgError] = useState(false);
  const [imgSrc, setImgSrc] = useState('/app-logo.jpg');
  const [showModal, setShowModal] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8 rounded-lg text-xs',
    md: 'w-10 h-10 rounded-xl text-sm',
    lg: 'w-12 h-12 rounded-2xl text-base',
    xl: 'w-16 h-16 rounded-2xl text-xl'
  }[size];

  const handleImageError = () => {
    if (imgSrc === '/app-logo.jpg') {
      setImgSrc('/apple-touch-icon.png');
    } else if (imgSrc === '/apple-touch-icon.png') {
      setImgSrc('/pwa-192.png');
    } else if (imgSrc === '/pwa-192.png') {
      setImgSrc('/app-logo-transparent.png');
    } else {
      setImgError(true);
    }
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    if (clickable) {
      e.stopPropagation();
      setShowModal(true);
    }
  };

  const logoIcon = (
    <div
      onClick={handleLogoClick}
      title={clickable ? 'Click to view full high-res logo' : undefined}
      className={`relative overflow-hidden border border-emerald-500/30 shadow-md shadow-emerald-500/20 shrink-0 bg-[#0A0E1A] flex items-center justify-center ${sizeClasses} ${className} ${clickable ? 'cursor-pointer hover:scale-105 active:scale-95 transition-transform group' : ''}`}
    >
      {!imgError ? (
        <img
          src={imgSrc}
          alt="Plus Game Zone Logo"
          onError={handleImageError}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-[#00D4AA] via-[#0A0E1A] to-[#3B82F6] flex items-center justify-center text-white relative">
          <Gamepad2 className="w-1/2 h-1/2 text-[#00D4AA]" />
          <span className="absolute bottom-0.5 right-0.5 text-[8px] font-black text-amber-400 bg-black/80 px-1 rounded">PGZ</span>
        </div>
      )}
      {clickable && (
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Maximize2 className="w-3.5 h-3.5 text-white drop-shadow" />
        </div>
      )}
    </div>
  );

  return (
    <>
      {!showText ? (
        logoIcon
      ) : (
        <div className="flex items-center gap-3 select-none">
          {logoIcon}
          <div>
            <h1 className="text-sm font-extrabold text-slate-900 dark:text-[#F0F4FF] leading-tight flex items-center gap-1.5">
              <span>Plus Game Zone</span>
              <Sparkles className="w-3.5 h-3.5 text-[#00D4AA]" />
            </h1>
            {subtitle && (
              <p className="text-[11px] text-slate-500 dark:text-[#8899BB] mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
      )}

      {/* High Resolution Logo Preview Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-[#0A0E1A] border border-emerald-500/40 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4 relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-0 transform translate-x-0 -translate-y-0 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-700 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-48 h-48 mx-auto rounded-2xl overflow-hidden border-2 border-emerald-500/50 shadow-xl shadow-emerald-500/20 bg-slate-900 p-1">
              <img
                src="/app-logo.jpg"
                alt="Plus Game Zone High Resolution Logo"
                className="w-full h-full object-cover rounded-xl"
                referrerPolicy="no-referrer"
              />
            </div>

            <div>
              <h3 className="text-lg font-black text-white flex items-center justify-center gap-2">
                Plus Game Zone
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Official Enterprise Gaming & Financial Hub Logo
              </p>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};


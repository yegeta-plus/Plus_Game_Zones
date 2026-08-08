import React, { useState } from 'react';
import { WalletType } from '../../types';
import { Vault, Wallet as WalletIcon } from 'lucide-react';

interface BrandLogoProps {
  type: WalletType;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  customColor?: string;
  customLogoUrl?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  type,
  size = 'md',
  className = '',
  customColor,
  customLogoUrl
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl'
  }[size];

  const svgSizes = {
    sm: 18,
    md: 24,
    lg: 30,
    xl: 40
  }[size];

  // If a custom logo URL is provided and has not failed to load, render it
  if (customLogoUrl && !imgError) {
    return (
      <div
        title={`${type} Custom Logo`}
        className={`rounded-2xl flex items-center justify-center font-bold text-white shadow-md shrink-0 border border-white/20 overflow-hidden relative ${sizeClasses} ${className}`}
        style={{ backgroundColor: customColor || '#1E293B' }}
      >
        <img
          src={customLogoUrl}
          alt="Custom Wallet Logo"
          className="w-full h-full object-cover p-0.5 rounded-xl bg-white/10"
          onError={() => setImgError(true)}
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  switch (type) {
    case 'CBE_BANK':
      return (
        <div
          title="Commercial Bank of Ethiopia (CBE) - 1000751694559"
          className={`rounded-2xl flex items-center justify-center font-bold text-white shadow-md shrink-0 border border-purple-400/30 overflow-hidden relative ${sizeClasses} ${className}`}
          style={{ backgroundColor: customColor || '#8B5CF6' }}
        >
          {!imgError ? (
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/LOGO_OF_COMMERCIAL_BANK_OF_ETHIOPIA_%28BAANKII_DALDALA_ITIYOOPHIYAA%29.jpg/320px-LOGO_OF_COMMERCIAL_BANK_OF_ETHIOPIA_%28BAANKII_DALDALA_ITIYOOPHIYAA%29.jpg"
              alt="CBE Logo"
              className="w-full h-full object-cover p-1 rounded-xl bg-white/10"
              onError={() => setImgError(true)}
              referrerPolicy="no-referrer"
            />
          ) : (
            <svg
              width={svgSizes}
              height={svgSizes}
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* CBE Golden Emblem & Bank Shield */}
              <circle cx="16" cy="16" r="14" fill="#6B21A8" stroke="#F59E0B" strokeWidth="1.5" />
              <path
                d="M16 5L8 9.5V13.5C8 18.5 11.4 23.2 16 24.5C20.6 23.2 24 18.5 24 13.5V9.5L16 5Z"
                fill="#8B5CF6"
                stroke="#F59E0B"
                strokeWidth="1.2"
              />
              {/* CBE Golden Lion & Pillars */}
              <path
                d="M11 12H21M12 15H20M13 18H19"
                stroke="#FBBF24"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M16 8L11 11.5H21L16 8Z"
                fill="#F59E0B"
              />
            </svg>
          )}
        </div>
      );

    case 'TELEBIRR':
      return (
        <div
          title="Telebirr Mobile Money"
          className={`rounded-2xl flex items-center justify-center font-bold text-white shadow-md shrink-0 border border-sky-400/30 overflow-hidden relative ${sizeClasses} ${className}`}
          style={{ backgroundColor: customColor || '#0EA5E9' }}
        >
          <svg
            width={svgSizes}
            height={svgSizes}
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Telebirr Background Sphere & Dynamic Arc */}
            <rect width="32" height="32" rx="10" fill="#0EA5E9" />
            <circle cx="16" cy="16" r="11" fill="#0284C7" />
            {/* Telebirr 't' and yellow sphere emblem */}
            <path
              d="M10 11H22M16 11V22C16 22 16 24 13 24"
              stroke="white"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="21" cy="10" r="3" fill="#F59E0B" />
          </svg>
        </div>
      );

    case 'EBIRR':
      return (
        <div
          title="eBirr Financial Gateway"
          className={`rounded-2xl flex items-center justify-center font-bold text-white shadow-md shrink-0 border border-emerald-400/30 overflow-hidden relative ${sizeClasses} ${className}`}
          style={{ backgroundColor: customColor || '#10B981' }}
        >
          <svg
            width={svgSizes}
            height={svgSizes}
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* eBirr Brand Green Container */}
            <rect width="32" height="32" rx="10" fill="#10B981" />
            {/* eBirr Curved Arc & e-Logo */}
            <path
              d="M16 6C10.48 6 6 10.48 6 16C6 21.52 10.48 26 16 26C20.1 26 23.6 23.5 25.1 19.8"
              stroke="white"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
            <path
              d="M20 14.5H11.5C10.1 14.5 9 15.6 9 17C9 18.4 10.1 19.5 11.5 19.5H20"
              stroke="white"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
            <path
              d="M20 11.5H11.5"
              stroke="white"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
            <circle cx="23.5" cy="11.5" r="3" fill="#F59E0B" />
          </svg>
        </div>
      );

    case 'CASH':
      return (
        <div
          title="Physical Cash Vault"
          className={`rounded-2xl flex items-center justify-center font-bold text-white shadow-md shrink-0 border border-orange-400/30 overflow-hidden relative ${sizeClasses} ${className}`}
          style={{ backgroundColor: customColor || '#F97316' }}
        >
          <svg
            width={svgSizes}
            height={svgSizes}
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Cash Orange Container & Banknote Shield */}
            <rect width="32" height="32" rx="10" fill="#F97316" />
            <rect
              x="5"
              y="9"
              width="22"
              height="14"
              rx="3"
              fill="#EA580C"
              stroke="white"
              strokeWidth="2"
            />
            <circle cx="16" cy="16" r="4" fill="#F97316" stroke="white" strokeWidth="2" />
            <path
              d="M8 13V13.01M24 19V19.01"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </div>
      );

    case 'SAVINGS':
      return (
        <div
          title="Savings Vault"
          className={`rounded-2xl flex items-center justify-center font-bold text-white shadow-md shrink-0 ${sizeClasses} ${className}`}
          style={{ backgroundColor: customColor || '#3B82F6' }}
        >
          <Vault className="w-5 h-5 text-white" />
        </div>
      );

    default:
      return (
        <div
          title="Wallet"
          className={`rounded-2xl flex items-center justify-center font-bold text-white shadow-md shrink-0 ${sizeClasses} ${className}`}
          style={{ backgroundColor: customColor || '#06B6D4' }}
        >
          <WalletIcon className="w-5 h-5 text-white" />
        </div>
      );
  }
};


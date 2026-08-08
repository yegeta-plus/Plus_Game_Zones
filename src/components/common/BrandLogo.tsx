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

  // If a custom logo URL is provided and valid, fill container fully
  if (customLogoUrl && !imgError) {
    return (
      <div
        title={`${type} Custom Logo`}
        className={`rounded-xl flex items-center justify-center font-bold text-white shadow-sm shrink-0 overflow-hidden relative ${sizeClasses} ${className}`}
        style={{ backgroundColor: customColor || '#1E293B' }}
      >
        <img
          src={customLogoUrl}
          alt="Custom Wallet Logo"
          className="w-full h-full object-cover"
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
          className={`rounded-xl flex items-center justify-center font-bold text-white shadow-sm shrink-0 overflow-hidden relative p-1 bg-white border border-slate-200 dark:border-slate-800 ${sizeClasses} ${className}`}
        >
          <img
            src="/cbe-logo.svg"
            alt="CBE Logo"
            className="w-full h-full object-contain"
            onError={() => setImgError(true)}
          />
        </div>
      );

    case 'TELEBIRR':
      return (
        <div
          title="Telebirr Mobile Money"
          className={`rounded-xl flex items-center justify-center font-bold text-white shadow-sm shrink-0 overflow-hidden relative p-1 bg-white border border-slate-200 dark:border-slate-800 ${sizeClasses} ${className}`}
        >
          <img
            src="/telebirr-logo.svg"
            alt="Telebirr Logo"
            className="w-full h-full object-contain"
            onError={() => setImgError(true)}
          />
        </div>
      );

    case 'EBIRR':
      return (
        <div
          title="eBirr Financial Gateway"
          className={`rounded-xl flex items-center justify-center font-bold text-white shadow-sm shrink-0 overflow-hidden relative ${sizeClasses} ${className}`}
          style={{ backgroundColor: customColor || '#10B981' }}
        >
          <svg
            className="w-full h-full"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="32" height="32" rx="8" fill="#10B981" />
            <path
              d="M16 5C9.9 5 5 9.9 5 16C5 22.1 9.9 27 16 27C20.5 27 24.3 24.3 26 20"
              stroke="white"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            <path
              d="M21 14.5H10.5C9 14.5 7.8 15.7 7.8 17.2C7.8 18.7 9 19.9 10.5 19.9H21"
              stroke="white"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            <path
              d="M21 11H10.5"
              stroke="white"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            <circle cx="24.5" cy="11" r="3" fill="#F59E0B" />
          </svg>
        </div>
      );

    case 'CASH':
      return (
        <div
          title="Physical Cash Vault"
          className={`rounded-xl flex items-center justify-center font-bold text-white shadow-sm shrink-0 overflow-hidden relative ${sizeClasses} ${className}`}
          style={{ backgroundColor: customColor || '#F97316' }}
        >
          <svg
            className="w-full h-full"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="32" height="32" rx="8" fill="#F97316" />
            <rect
              x="3"
              y="7"
              width="26"
              height="18"
              rx="4"
              fill="#EA580C"
              stroke="white"
              strokeWidth="2.2"
            />
            <circle cx="16" cy="16" r="4.5" fill="#F97316" stroke="white" strokeWidth="2" />
            <path
              d="M7 12V12.01M25 20V20.01"
              stroke="white"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      );

    case 'SAVINGS':
      return (
        <div
          title="Savings Vault"
          className={`rounded-xl flex items-center justify-center font-bold text-white shadow-sm shrink-0 ${sizeClasses} ${className}`}
          style={{ backgroundColor: customColor || '#3B82F6' }}
        >
          <Vault className="w-3/5 h-3/5 text-white" />
        </div>
      );

    default:
      return (
        <div
          title="Wallet"
          className={`rounded-xl flex items-center justify-center font-bold text-white shadow-sm shrink-0 ${sizeClasses} ${className}`}
          style={{ backgroundColor: customColor || '#06B6D4' }}
        >
          <WalletIcon className="w-3/5 h-3/5 text-white" />
        </div>
      );
  }
};


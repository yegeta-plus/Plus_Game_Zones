import React, { useState } from 'react';
import { X, ArrowRightLeft, AlertTriangle } from 'lucide-react';
import { Wallet } from '../../types';
import { calculateWalletBalance, formatETB } from '../../lib/store';
import { triggerHaptic } from '../../lib/haptics';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: Wallet[];
  transactions: any[];
  transfers: any[];
  onExecuteTransfer: (data: {
    fromWalletId: string;
    toWalletId: string;
    amount: number;
    reason: string;
  }) => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  wallets,
  transactions,
  transfers,
  onExecuteTransfer
}) => {
  const [fromWalletId, setFromWalletId] = useState(wallets[0]?.id || '');
  const [toWalletId, setToWalletId] = useState(wallets[1]?.id || '');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [insufficientError, setInsufficientError] = useState<string | null>(null);

  if (!isOpen) return null;

  const fromWallet = wallets.find(w => w.id === fromWalletId);
  const toWallet = wallets.find(w => w.id === toWalletId);

  const availableBalance = fromWallet
    ? calculateWalletBalance(fromWallet, transactions, transfers)
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInsufficientError(null);

    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      alert('Please enter a valid transfer amount.');
      return;
    }

    if (fromWalletId === toWalletId) {
      alert('Source and destination wallets must be different.');
      return;
    }

    // Blocking Insufficient Balance Check
    if (transferAmount > availableBalance) {
      triggerHaptic('warning');
      setInsufficientError(
        `Insufficient Balance in ${fromWallet?.name || 'source wallet'}. ` +
        `Available: ${formatETB(availableBalance)}, Required: ${formatETB(transferAmount)}.`
      );
      return;
    }

    triggerHaptic('success');
    onExecuteTransfer({
      fromWalletId,
      toWalletId,
      amount: transferAmount,
      reason: reason || `Transfer to ${toWallet?.name}`
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] w-full max-w-md rounded-2xl p-5 text-slate-900 dark:text-[#F0F4FF] shadow-2xl animate-slideUp">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#1E2D40]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-600 dark:text-[#3B82F6] flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Inter-Wallet Transfer</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg bg-slate-100 dark:bg-[#1C2333] text-slate-500 dark:text-[#8899BB] hover:text-slate-900 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Blocking Insufficient Balance Alert */}
        {insufficientError && (
          <div className="mt-3 p-3 bg-rose-50 text-rose-800 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-500/60 dark:text-rose-100 rounded-xl text-xs flex items-start gap-2 animate-shake">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-300 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-900 dark:text-rose-100">Transfer Blocked</p>
              <p className="text-[11px] mt-0.5 text-rose-800 dark:text-rose-200">{insufficientError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          
          {/* From Wallet */}
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-[#8899BB] block mb-1">
              From Source Wallet
            </label>
            <select
              value={fromWalletId}
              onChange={(e) => {
                setFromWalletId(e.target.value);
                setInsufficientError(null);
              }}
              className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl py-2.5 px-3 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
            >
              {wallets.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name} ({formatETB(calculateWalletBalance(w, transactions, transfers))})
                </option>
              ))}
            </select>
          </div>

          {/* Transfer Direction Indicator */}
          <div className="flex justify-center text-blue-600 dark:text-[#3B82F6]">
            <ArrowRightLeft className="w-5 h-5 rotate-90" />
          </div>

          {/* To Wallet */}
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-[#8899BB] block mb-1">
              To Destination Wallet
            </label>
            <select
              value={toWalletId}
              onChange={(e) => setToWalletId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl py-2.5 px-3 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
            >
              {wallets.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name} ({formatETB(calculateWalletBalance(w, transactions, transfers))})
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-[#8899BB] block mb-1">
              Transfer Amount (ETB)
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setInsufficientError(null);
                }}
                placeholder="0.00"
                className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] focus:border-blue-500 dark:focus:border-[#3B82F6] rounded-xl py-2.5 px-3 text-sm font-mono font-bold text-slate-900 dark:text-white outline-none"
              />
              <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400 dark:text-[#8899BB]">ETB</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-[#8899BB] mt-1">
              Max available: <span className="text-emerald-600 dark:text-[#00D4AA] font-bold">{formatETB(availableBalance)}</span>
            </p>
          </div>

          {/* Reason */}
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-[#8899BB] block mb-1">
              Transfer Purpose / Reason
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Telebirr cashout to CBE bank"
              className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl py-2.5 px-3 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
            />
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-500/20 cursor-pointer"
          >
            Confirm Inter-Wallet Transfer
          </button>

        </form>
      </div>
    </div>
  );
};

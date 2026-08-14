import React, { useState } from 'react';
import { X, ArrowRightLeft, AlertTriangle, ShieldCheck, CheckCircle2, Lock } from 'lucide-react';
import { Wallet } from '../../types';
import { calculateWalletBalance, formatETB, getWalletNickname, isOverdraftAllowed, isWalletActive, validateTransfer } from '../../lib/store';
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
  // Only active wallets are permitted for new transfers
  const activeWallets = wallets.filter(w => isWalletActive(w));

  const [fromWalletId, setFromWalletId] = useState(activeWallets[0]?.id || wallets[0]?.id || '');
  const [toWalletId, setToWalletId] = useState(
    activeWallets.find(w => w.id !== fromWalletId)?.id || activeWallets[1]?.id || ''
  );
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const fromWallet = wallets.find(w => w.id === fromWalletId);
  const toWallet = wallets.find(w => w.id === toWalletId);

  const availableBalance = fromWallet
    ? calculateWalletBalance(fromWallet, transactions, transfers)
    : 0;

  const toAvailableBalance = toWallet
    ? calculateWalletBalance(toWallet, transactions, transfers)
    : 0;

  const numAmount = parseFloat(amount) || 0;
  const fromAllowsOverdraft = fromWallet ? isOverdraftAllowed(fromWallet) : false;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      setValidationError('Please enter a valid transfer amount greater than ETB 0.');
      triggerHaptic('warning');
      return;
    }

    const validation = validateTransfer(
      fromWallet,
      toWallet,
      transferAmount,
      transactions,
      transfers
    );

    if (!validation.valid) {
      triggerHaptic('warning');
      setValidationError(validation.error || 'Transfer validation failed.');
      return;
    }

    triggerHaptic('success');
    onExecuteTransfer({
      fromWalletId,
      toWalletId,
      amount: transferAmount,
      reason: reason.trim() || `Transfer to ${toWallet?.name || 'Wallet'}`
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
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Inter-Wallet Transfer</h2>
              <p className="text-[10px] text-slate-500 dark:text-[#8899BB]">Two-sided balanced ledger debit & credit</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg bg-slate-100 dark:bg-[#1C2333] text-slate-500 dark:text-[#8899BB] hover:text-slate-900 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Blocking Validation Alert */}
        {validationError && (
          <div className="mt-3 p-3 bg-rose-50 text-rose-800 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-500/60 dark:text-rose-100 rounded-xl text-xs flex items-start gap-2 animate-shake">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-300 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-900 dark:text-rose-100">Transfer Blocked</p>
              <p className="text-[11px] mt-0.5 text-rose-800 dark:text-rose-200">{validationError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          
          {/* From Wallet */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-[#8899BB]">
                From Source Wallet (Debit)
              </label>
              {fromAllowsOverdraft ? (
                <span className="text-[9px] bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold px-1.5 py-0.2 rounded border border-blue-500/20">
                  Credit Account (Overdraft Allowed)
                </span>
              ) : (
                <span className="text-[9px] text-slate-400 font-mono">
                  No Overdraft
                </span>
              )}
            </div>
            <select
              value={fromWalletId}
              onChange={(e) => {
                setFromWalletId(e.target.value);
                setValidationError(null);
              }}
              className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl py-2.5 px-3 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500 font-semibold"
            >
              {wallets.map(w => {
                const active = isWalletActive(w);
                return (
                  <option key={w.id} value={w.id} disabled={!active}>
                    {getWalletNickname(w.name)} {active ? `(Bal: ${formatETB(calculateWalletBalance(w, transactions, transfers))})` : `[${w.status || 'INACTIVE'} - Blocked]`}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Transfer Direction Indicator */}
          <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-[#3B82F6] my-1">
            <div className="h-px bg-slate-200 dark:bg-[#1E2D40] flex-1" />
            <div className="p-1 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div className="h-px bg-slate-200 dark:bg-[#1E2D40] flex-1" />
          </div>

          {/* To Wallet */}
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-[#8899BB] block mb-1">
              To Destination Wallet (Credit)
            </label>
            <select
              value={toWalletId}
              onChange={(e) => {
                setToWalletId(e.target.value);
                setValidationError(null);
              }}
              className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl py-2.5 px-3 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500 font-semibold"
            >
              {wallets.map(w => {
                const active = isWalletActive(w);
                return (
                  <option key={w.id} value={w.id} disabled={!active || w.id === fromWalletId}>
                    {getWalletNickname(w.name)} {w.id === fromWalletId ? '(Source Account)' : active ? `(Bal: ${formatETB(calculateWalletBalance(w, transactions, transfers))})` : `[${w.status || 'INACTIVE'} - Blocked]`}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Amount */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-[#8899BB]">
                Transfer Amount (ETB)
              </label>
              <span className="text-[11px] text-slate-500 dark:text-[#8899BB]">
                Max available: <span className={`font-bold ${availableBalance < 0 ? 'text-rose-500' : 'text-emerald-600 dark:text-[#00D4AA]'}`}>{formatETB(availableBalance)}</span>
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0.01"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setValidationError(null);
                }}
                placeholder="0.00"
                className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] focus:border-blue-500 dark:focus:border-[#3B82F6] rounded-xl py-2.5 px-3 text-sm font-mono font-bold text-slate-900 dark:text-white outline-none"
              />
              <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400 dark:text-[#8899BB]">ETB</span>
            </div>
          </div>

          {/* Two-Sided Balanced Transfer Preview Card */}
          {fromWallet && toWallet && (
            <div className="bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#1E2D40]">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Two-Sided Ledger Preview</span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-[#00D4AA] flex items-center gap-1 font-mono">
                  <CheckCircle2 className="w-3 h-3" />
                  Balanced (Δ ETB 0.00)
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="border-r border-slate-200 dark:border-[#1E2D40] pr-2">
                  <span className="text-[10px] text-slate-500 dark:text-[#8899BB] block truncate">
                    Debit Leg: {getWalletNickname(fromWallet.name)}
                  </span>
                  <div className="flex items-baseline justify-between mt-0.5">
                    <span className="text-rose-600 dark:text-rose-400 font-mono font-bold">
                      -{formatETB(numAmount)}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      → {formatETB(availableBalance - numAmount)}
                    </span>
                  </div>
                </div>

                <div className="pl-2">
                  <span className="text-[10px] text-slate-500 dark:text-[#8899BB] block truncate">
                    Credit Leg: {getWalletNickname(toWallet.name)}
                  </span>
                  <div className="flex items-baseline justify-between mt-0.5">
                    <span className="text-emerald-600 dark:text-[#00D4AA] font-mono font-bold">
                      +{formatETB(numAmount)}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      → {formatETB(toAvailableBalance + numAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-[#8899BB] block mb-1">
              Transfer Purpose / Reason
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Bank deposit from Cash drawer"
              className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl py-2.5 px-3 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
            />
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-500/20 cursor-pointer transition-all active:scale-[0.99] flex items-center justify-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Confirm Balanced Inter-Wallet Transfer</span>
          </button>

        </form>
      </div>
    </div>
  );
};


import React, { useState } from 'react';
import { FileCheck, DollarSign, CheckCircle2 } from 'lucide-react';
import { Receivable, Wallet } from '../../types';
import { formatETB } from '../../lib/store';
import { triggerHaptic } from '../../lib/haptics';

interface ReceivablesViewProps {
  receivables: Receivable[];
  wallets: Wallet[];
  onCollect: (receivableId: string, walletId: string, amount: number) => void;
}

export const ReceivablesView: React.FC<ReceivablesViewProps> = ({
  receivables,
  wallets,
  onCollect
}) => {
  const [activeCollectModal, setActiveCollectModal] = useState<Receivable | null>(null);
  const [collectWalletId, setCollectWalletId] = useState(wallets[0]?.id || '');
  const [collectAmount, setCollectAmount] = useState('');

  const handleCollectSubmit = (rcv: Receivable) => {
    const amt = parseFloat(collectAmount);
    if (isNaN(amt) || amt <= 0) return;

    triggerHaptic('success');
    onCollect(rcv.id, collectWalletId, amt);
    setActiveCollectModal(null);
    setCollectAmount('');
  };

  const sortedReceivables = [...receivables].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'OUTSTANDING' ? -1 : 1;
    const dateA = new Date(a.createdDate || 0).getTime();
    const dateB = new Date(b.createdDate || 0).getTime();
    if (dateA !== dateB) return dateB - dateA;
    return b.id.localeCompare(a.id);
  });

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-[#3B82F6]" />
          Customer Receivables & Credit IOUs
        </h3>
        <p className="text-xs text-slate-500 dark:text-[#8899BB]">Manage customer credit balances & record cash collections</p>
      </div>

      <div className="space-y-3">
        {sortedReceivables.map((r) => {
          const outstanding = r.amountOwed - r.amountCollected;
          return (
            <div key={r.id} className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                    r.status === 'COLLECTED'
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-500/20 text-amber-700 dark:text-amber-400'
                  }`}>
                    {r.status}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">{r.customerName}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-[#8899BB]">{r.description}</p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-slate-500 dark:text-[#8899BB]">Outstanding</p>
                  <p className="text-sm font-black font-mono text-blue-600 dark:text-[#3B82F6]">{formatETB(outstanding)}</p>
                </div>
              </div>

              {outstanding > 0 && (
                <button
                  onClick={() => {
                    triggerHaptic('medium');
                    setActiveCollectModal(r);
                    setCollectAmount(outstanding.toString());
                  }}
                  className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-colors"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Collect Payment to Wallet</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {activeCollectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] w-full max-w-sm p-5 rounded-2xl space-y-4 text-slate-900 dark:text-white shadow-xl">
            <h3 className="text-sm font-bold">Collect Customer Credit</h3>
            <p className="text-xs text-slate-500 dark:text-[#8899BB]">
              Collecting payment for <span className="text-slate-900 dark:text-white font-bold">{activeCollectModal.customerName}</span>
            </p>

            <div>
              <label className="text-xs text-slate-500 dark:text-[#8899BB] block mb-1">Deposit To Wallet</label>
              <select
                value={collectWalletId}
                onChange={e => setCollectWalletId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
              >
                {wallets.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-500 dark:text-[#8899BB] block mb-1">Collection Amount (ETB)</label>
              <input
                type="number"
                value={collectAmount}
                onChange={e => setCollectAmount(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setActiveCollectModal(null)}
                className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-[#1C2333] text-xs font-bold text-slate-600 dark:text-[#8899BB]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCollectSubmit(activeCollectModal)}
                className="flex-1 py-2 rounded-xl bg-blue-600 text-xs font-bold text-white shadow-md hover:bg-blue-700"
              >
                Post Collection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

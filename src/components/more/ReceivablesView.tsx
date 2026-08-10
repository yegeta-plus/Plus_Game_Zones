import React, { useState } from 'react';
import { FileCheck, DollarSign, AlertTriangle, Clock, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Receivable, Wallet } from '../../types';
import { formatETB, evaluateReceivableStatus } from '../../lib/store';
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
  const [filter, setFilter] = useState<'ALL' | 'OUTSTANDING' | 'LATE' | 'COLLECTED'>('ALL');
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

  const calculateDaysAge = (r: Receivable) => {
    const createdTime = r.createdDate ? new Date(r.createdDate).getTime() : 0;
    const dueTime = r.dueDate ? new Date(r.dueDate).getTime() : 0;
    const refTime = dueTime || createdTime || Date.now();
    return Math.max(0, Math.floor((Date.now() - refTime) / (1000 * 60 * 60 * 24)));
  };

  const processedReceivables = receivables.map(r => {
    const effectiveStatus = evaluateReceivableStatus(r);
    const ageDays = calculateDaysAge(r);
    return {
      ...r,
      effectiveStatus,
      ageDays,
      isLate: effectiveStatus === 'LATE' || ageDays >= 15
    };
  });

  const lateCount = processedReceivables.filter(r => r.isLate && r.effectiveStatus !== 'COLLECTED').length;
  const lateTotal = processedReceivables
    .filter(r => r.isLate && r.effectiveStatus !== 'COLLECTED')
    .reduce((sum, r) => sum + (r.amountOwed - r.amountCollected), 0);

  const outstandingTotal = processedReceivables
    .filter(r => r.effectiveStatus !== 'COLLECTED' && r.effectiveStatus !== 'WRITTEN_OFF')
    .reduce((sum, r) => sum + (r.amountOwed - r.amountCollected), 0);

  const collectedTotal = processedReceivables.reduce((sum, r) => sum + r.amountCollected, 0);

  const filteredReceivables = processedReceivables.filter(r => {
    if (filter === 'OUTSTANDING') return r.effectiveStatus === 'OUTSTANDING';
    if (filter === 'LATE') return r.isLate && r.effectiveStatus !== 'COLLECTED';
    if (filter === 'COLLECTED') return r.effectiveStatus === 'COLLECTED';
    return true;
  });

  const sortedReceivables = [...filteredReceivables].sort((a, b) => {
    if (a.isLate !== b.isLate) return a.isLate ? -1 : 1;
    if (a.effectiveStatus !== b.effectiveStatus) {
      if (a.effectiveStatus === 'LATE') return -1;
      if (b.effectiveStatus === 'LATE') return 1;
      if (a.effectiveStatus === 'OUTSTANDING') return -1;
      return 1;
    }
    const dateA = new Date(a.createdDate || 0).getTime();
    const dateB = new Date(b.createdDate || 0).getTime();
    return dateB - dateA;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-[#3B82F6]" />
          Customer Receivables & Credit IOUs
        </h3>
        <p className="text-xs text-slate-500 dark:text-[#8899BB]">
          Manage credit balances. Unpaid receivables past 15 days automatically move to <span className="text-rose-500 font-bold">Late Payment</span>.
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] rounded-2xl p-3 shadow-sm">
          <p className="text-[10px] text-slate-500 dark:text-[#8899BB]">Total Credit</p>
          <p className="text-sm font-black font-mono text-blue-600 dark:text-[#3B82F6]">{formatETB(outstandingTotal)}</p>
        </div>

        <div className={`bg-white dark:bg-[#131926] border rounded-2xl p-3 shadow-sm ${
          lateCount > 0 ? 'border-rose-300 dark:border-rose-500/40 bg-rose-500/5' : 'border-slate-200 dark:border-[#1E2D40]'
        }`}>
          <div className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-rose-500" />
            <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400">Late (&gt;15 Days)</p>
          </div>
          <p className="text-sm font-black font-mono text-rose-600 dark:text-rose-400">{formatETB(lateTotal)}</p>
        </div>

        <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] rounded-2xl p-3 shadow-sm">
          <p className="text-[10px] text-slate-500 dark:text-[#8899BB]">Collected</p>
          <p className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">{formatETB(collectedTotal)}</p>
        </div>
      </div>

      {/* Late Payment Warning Banner */}
      {lateCount > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-3.5 flex items-center justify-between text-rose-700 dark:text-rose-300 text-xs">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0" />
            <div>
              <p className="font-extrabold">{lateCount} Customer {lateCount === 1 ? 'Credit' : 'Credits'} Moved to Late Payment</p>
              <p className="text-[11px] opacity-90">Outstanding over 15 days without full settlement.</p>
            </div>
          </div>
          <button
            onClick={() => setFilter('LATE')}
            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] rounded-lg cursor-pointer transition-colors shrink-0"
          >
            View Late ({lateCount})
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {(['ALL', 'LATE', 'OUTSTANDING', 'COLLECTED'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filter === tab
                ? tab === 'LATE'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-[#1C2333] text-slate-600 dark:text-[#8899BB] hover:bg-slate-200 dark:hover:bg-[#252E42]'
            }`}
          >
            {tab === 'ALL' && 'All Receivables'}
            {tab === 'LATE' && `Late Payment (${lateCount})`}
            {tab === 'OUTSTANDING' && 'Active Credit'}
            {tab === 'COLLECTED' && 'Collected'}
          </button>
        ))}
      </div>

      {/* Receivables List */}
      <div className="space-y-3">
        {sortedReceivables.length === 0 ? (
          <div className="text-center py-8 bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] rounded-2xl">
            <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
            <p className="text-xs font-bold text-slate-500 dark:text-[#8899BB]">No receivables match this filter</p>
          </div>
        ) : (
          sortedReceivables.map((r) => {
            const outstanding = r.amountOwed - r.amountCollected;
            const isLate = r.isLate && r.effectiveStatus !== 'COLLECTED';

            return (
              <div
                key={r.id}
                className={`bg-white dark:bg-[#131926] border rounded-2xl p-4 space-y-3 shadow-sm transition-all ${
                  isLate
                    ? 'border-rose-300 dark:border-rose-500/40 bg-rose-500/[0.02]'
                    : 'border-slate-200 dark:border-[#1E2D40]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase flex items-center gap-1 ${
                        r.effectiveStatus === 'COLLECTED'
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : isLate
                          ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-700 dark:text-amber-400'
                      }`}>
                        {isLate && <AlertTriangle className="w-2.5 h-2.5" />}
                        {isLate ? 'LATE PAYMENT' : r.effectiveStatus}
                      </span>

                      {isLate && (
                        <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">
                          • {r.ageDays} days unpaid (&gt;15 day limit)
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1.5">{r.customerName}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-[#8899BB]">{r.description}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-slate-500 dark:text-[#8899BB]">Outstanding</p>
                    <p className={`text-sm font-black font-mono ${
                      isLate ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-[#3B82F6]'
                    }`}>
                      {formatETB(outstanding)}
                    </p>
                  </div>
                </div>

                {outstanding > 0 && (
                  <button
                    onClick={() => {
                      triggerHaptic('medium');
                      setActiveCollectModal(r);
                      setCollectAmount(outstanding.toString());
                    }}
                    className={`w-full py-2 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-colors ${
                      isLate ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Collect Payment to Wallet</span>
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Collect Payment Modal */}
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

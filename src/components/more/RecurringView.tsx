import React, { useState } from 'react';
import { Repeat, Plus, Trash2, CheckCircle2, PauseCircle, PlayCircle, Calendar, Wallet as WalletIcon, X, Search, Tag, Gift } from 'lucide-react';
import { RecurringTemplate, Wallet, Category, RecurringFrequency, TransactionType, ERPState } from '../../types';
import { formatETB } from '../../lib/store';
import { triggerHaptic } from '../../lib/haptics';
import { formatEthiopianDate, formatDateByCalendar, evaluatePagumeExemption } from '../../lib/ethiopianCalendar';

interface RecurringViewProps {
  recurring: RecurringTemplate[];
  wallets: Wallet[];
  categories?: Category[];
  calendarType?: 'ETHIOPIAN' | 'GREGORIAN';
  onUpdateState?: (fn: (prev: ERPState) => ERPState) => void;
}

export const RecurringView: React.FC<RecurringViewProps> = ({
  recurring,
  wallets,
  categories = [],
  calendarType = 'ETHIOPIAN',
  onUpdateState
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [category, setCategory] = useState('Rent & Lease');
  const [walletId, setWalletId] = useState(wallets[0]?.id || '');
  const [frequency, setFrequency] = useState<RecurringFrequency>('MONTHLY');
  const [nextDueDate, setNextDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [autoProcess, setAutoProcess] = useState(false);

  const filteredRecurring = recurring
    .filter(r =>
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => b.id.localeCompare(a.id));

  const handleOpenAdd = () => {
    triggerHaptic('light');
    setTitle('');
    setAmount('');
    setType('EXPENSE');
    setCategory(categories[0]?.name || 'Rent & Lease');
    setWalletId(wallets[0]?.id || '');
    setFrequency('MONTHLY');
    setNextDueDate(new Date().toISOString().split('T')[0]);
    setAutoProcess(false);
    setShowAddModal(true);
  };

  const handleSaveAdd = () => {
    if (!title.trim() || !amount || parseFloat(amount) <= 0 || !onUpdateState) return;
    triggerHaptic('success');

    const newRecurring: RecurringTemplate = {
      id: `rec-${Date.now()}`,
      title: title.trim(),
      amount: parseFloat(amount),
      type,
      category,
      walletId,
      frequency,
      nextDueDate: new Date(nextDueDate).toISOString(),
      autoProcess,
      status: 'ACTIVE'
    };

    onUpdateState(prev => ({
      ...prev,
      recurring: [...prev.recurring, newRecurring],
      auditLogs: [
        {
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorId: prev.currentUser.id,
          actorName: prev.currentUser.name,
          action: 'CREATE_RECURRING_BILL',
          entity: 'RecurringTemplate',
          entityId: newRecurring.id,
          diffAfter: { title: newRecurring.title, amount: newRecurring.amount, frequency },
          branch: prev.currentUser.branch
        },
        ...prev.auditLogs
      ]
    }));

    setShowAddModal(false);
  };

  const handleToggleStatus = (rec: RecurringTemplate) => {
    if (!onUpdateState) return;
    triggerHaptic('medium');

    onUpdateState(prev => ({
      ...prev,
      recurring: prev.recurring.map(r =>
        r.id === rec.id
          ? { ...r, status: r.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' }
          : r
      )
    }));
  };

  const [deletingRec, setDeletingRec] = useState<RecurringTemplate | null>(null);

  const confirmDeleteRecurring = () => {
    if (!deletingRec || !onUpdateState) return;
    triggerHaptic('warning');

    onUpdateState(prev => ({
      ...prev,
      recurring: prev.recurring.filter(r => r.id !== deletingRec.id),
      auditLogs: [
        {
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorId: prev.currentUser.id,
          actorName: prev.currentUser.name,
          action: 'DELETE_RECURRING_BILL',
          entity: 'RecurringTemplate',
          entityId: deletingRec.id,
          diffBefore: { title: deletingRec.title },
          branch: prev.currentUser.branch
        },
        ...prev.auditLogs
      ]
    }));
    setDeletingRec(null);
  };

  const handleDelete = (rec: RecurringTemplate) => {
    if (!onUpdateState) return;
    triggerHaptic('light');
    setDeletingRec(rec);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Repeat className="w-5 h-5 text-[#A78BFA]" />
            Recurring Bills & Schedules
          </h3>
          <p className="text-xs text-[#8899BB]">Rent, telecom, software subscriptions and vendor payments</p>
        </div>

        {onUpdateState && (
          <button
            onClick={handleOpenAdd}
            className="px-3 py-1.5 rounded-xl bg-[#A78BFA] text-[#0A0E1A] font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer hover:bg-[#A78BFA]/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Bill Schedule</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8899BB]" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search recurring bills..."
          className="w-full bg-[#131926] border border-[#1E2D40] focus:border-[#A78BFA] rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none"
        />
      </div>

      {/* Recurring Bills List */}
      <div className="space-y-2.5">
        {filteredRecurring.map((r) => {
          const wallet = wallets.find(w => w.id === r.walletId);
          const isPaused = r.status === 'PAUSED';
          const dueDateObj = new Date(r.nextDueDate);
          const ethDueDateStr = formatDateByCalendar(dueDateObj, calendarType, true);
          const pagumeRule = evaluatePagumeExemption(r.category || r.title, dueDateObj);

          return (
            <div
              key={r.id}
              className={`bg-[#131926] border rounded-2xl p-4 flex items-center justify-between gap-3 transition-all ${
                isPaused ? 'border-amber-500/30 opacity-60' : 'border-[#1E2D40]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                    isPaused ? 'bg-amber-500/10 text-amber-400' : 'bg-[#A78BFA]/20 text-[#A78BFA]'
                  }`}
                >
                  <Repeat className="w-5 h-5" />
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs font-bold text-white">{r.title}</h4>
                    <span className="text-[9px] bg-[#A78BFA]/20 text-[#A78BFA] px-1.5 py-0.2 rounded font-mono font-bold">
                      {r.frequency}
                    </span>
                    {r.autoProcess && (
                      <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.2 rounded font-mono font-bold">
                        AUTO
                      </span>
                    )}
                    {pagumeRule.isExempt ? (
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.2 rounded font-bold flex items-center gap-1">
                        <Gift className="w-3 h-3 text-emerald-400" />
                        13th Month (Pagumē): FREE
                      </span>
                    ) : (
                      <span className="text-[9px] bg-amber-500/10 text-amber-300 px-2 py-0.2 rounded font-mono font-bold">
                        Active in Month 13
                      </span>
                    )}
                  </div>

                  <p className="text-[10px] text-[#8899BB] mt-0.5">
                    Category: <span className="text-white">{r.category}</span> • Wallet:{' '}
                    <span className="text-white">{wallet?.name || 'Default Wallet'}</span>
                  </p>

                  <p className="text-[10px] text-[#8899BB] mt-0.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#A78BFA]" />
                    <span>Next Due: {ethDueDateStr}</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <p className="text-sm font-mono font-bold text-[#A78BFA]">{formatETB(r.amount)}</p>

                {onUpdateState && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleStatus(r)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 border cursor-pointer transition-colors ${
                        isPaused
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                      }`}
                    >
                      {isPaused ? (
                        <>
                          <PlayCircle className="w-3 h-3" /> Resume
                        </>
                      ) : (
                        <>
                          <PauseCircle className="w-3 h-3" /> Active
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDelete(r)}
                      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 cursor-pointer"
                      title="Delete Recurring Bill"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredRecurring.length === 0 && (
          <div className="text-center py-8 bg-[#131926] border border-[#1E2D40] rounded-2xl p-4">
            <Repeat className="w-8 h-8 text-[#8899BB] mx-auto mb-2 opacity-40" />
            <p className="text-xs text-[#8899BB]">No recurring bills found.</p>
          </div>
        )}
      </div>

      {/* Add Recurring Bill Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#131926] border border-[#A78BFA]/40 w-full max-w-sm p-5 rounded-2xl space-y-4 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1E2D40] pb-3">
              <h3 className="text-sm font-bold flex items-center gap-2 text-white">
                <Repeat className="w-4 h-4 text-[#A78BFA]" />
                Add Recurring Bill Schedule
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#8899BB] hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[#8899BB] block mb-1">Bill Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Bill title"
                  className="w-full bg-[#1C2333] border border-[#1E2D40] focus:border-[#A78BFA] rounded-xl px-3 py-2 text-white outline-none"
                />
              </div>

              <div>
                <label className="text-[#8899BB] block mb-1">Amount (ETB)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#1C2333] border border-[#1E2D40] focus:border-[#A78BFA] rounded-xl px-3 py-2 text-white outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[#8899BB] block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-[#1C2333] border border-[#1E2D40] focus:border-[#A78BFA] rounded-xl p-2 text-white outline-none"
                  >
                    {categories.length > 0 ? (
                      categories.map(c => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Rent & Lease">Rent & Lease</option>
                        <option value="Utilities & Internet">Utilities & Internet</option>
                        <option value="Payroll & Wages">Payroll & Wages</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-[#8899BB] block mb-1">Frequency</label>
                  <select
                    value={frequency}
                    onChange={e => setFrequency(e.target.value as RecurringFrequency)}
                    className="w-full bg-[#1C2333] border border-[#1E2D40] focus:border-[#A78BFA] rounded-xl p-2 text-white outline-none"
                  >
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[#8899BB] block mb-1">Funding Wallet</label>
                <select
                  value={walletId}
                  onChange={e => setWalletId(e.target.value)}
                  className="w-full bg-[#1C2333] border border-[#1E2D40] focus:border-[#A78BFA] rounded-xl p-2 text-white outline-none"
                >
                  {wallets.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[#8899BB] block mb-1">First Due Date</label>
                <input
                  type="date"
                  value={nextDueDate}
                  onChange={e => setNextDueDate(e.target.value)}
                  className="w-full bg-[#1C2333] border border-[#1E2D40] focus:border-[#A78BFA] rounded-xl px-3 py-2 text-white outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-between bg-[#1C2333] p-2.5 rounded-xl border border-[#1E2D40]">
                <span className="text-[#8899BB]">Automate Processing</span>
                <input
                  type="checkbox"
                  checked={autoProcess}
                  onChange={e => setAutoProcess(e.target.checked)}
                  className="w-4 h-4 accent-[#A78BFA] cursor-pointer"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#1C2333] text-xs font-bold text-[#8899BB] hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!title.trim() || !amount}
                onClick={handleSaveAdd}
                className="flex-1 py-2.5 rounded-xl bg-[#A78BFA] hover:bg-[#A78BFA]/90 text-xs font-bold text-[#0A0E1A] shadow-lg cursor-pointer disabled:opacity-50"
              >
                Create Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Recurring Confirmation Modal */}
      {deletingRec && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#131926] border border-rose-200 dark:border-rose-900/50 max-w-sm w-full p-5 rounded-2xl space-y-4 shadow-2xl text-slate-900 dark:text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Delete Recurring Bill?</h3>
                <p className="text-xs text-slate-500 dark:text-[#8899BB] font-semibold">{deletingRec.title}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-[#8899BB] leading-relaxed">
              Are you sure you want to delete <strong className="text-slate-900 dark:text-white">"{deletingRec.title}"</strong>? Future automatic bill schedules and reminders for this item will be cancelled.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeletingRec(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] text-xs font-bold text-slate-600 dark:text-[#8899BB] hover:bg-slate-200 dark:hover:bg-[#252E42]"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteRecurring}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-md hover:bg-rose-700 active:scale-[0.98] transition-all"
              >
                Yes, Delete Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

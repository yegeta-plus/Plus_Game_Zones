import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Calendar as CalendarIcon,
  Wallet as WalletIcon,
  Tag,
  Zap,
  TrendingUp,
  TrendingDown,
  FileCheck,
  Coins,
  FileText,
  Layers,
  Sparkles,
  Calculator
} from 'lucide-react';
import { Wallet, Category, TransactionType, UserProfile } from '../../types';
import { formatETB, parseSummedAmount } from '../../lib/store';
import { triggerHaptic } from '../../lib/haptics';

interface QuickEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: Wallet[];
  categories: Category[];
  currentUser: UserProfile;
  defaultWalletId?: string;
  onSubmitTransaction: (data: {
    type: TransactionType;
    amount: number;
    walletId: string;
    category: string;
    description: string;
    date: string;
    isCreditSale?: boolean;
    customerName?: string;
    dueDate?: string;
  }) => void;
  onBatchSubmitTransactions?: (items: Array<{
    type: TransactionType;
    amount: number;
    walletId: string;
    category: string;
    description: string;
    date: string;
  }>) => void;
}

export const QuickEntryModal: React.FC<QuickEntryModalProps> = ({
  isOpen,
  onClose,
  wallets,
  categories,
  currentUser,
  defaultWalletId,
  onSubmitTransaction,
  onBatchSubmitTransactions
}) => {
  const [entryMode, setEntryMode] = useState<'INCOME' | 'EXPENSE'>('INCOME');
  const [incomeType, setIncomeType] = useState<'single' | 'batch'>('single');
  const [isCreditSale, setIsCreditSale] = useState(false);

  // Single mode state
  const [amountStr, setAmountStr] = useState('');
  const [walletId, setWalletId] = useState(defaultWalletId || wallets[0]?.id || '');

  // Keep walletId in sync when modal opens or defaultWalletId / wallets change
  useEffect(() => {
    if (isOpen) {
      if (defaultWalletId && wallets.some(w => w.id === defaultWalletId)) {
        setWalletId(defaultWalletId);
      } else if (wallets.length > 0 && (!walletId || !wallets.some(w => w.id === walletId))) {
        setWalletId(wallets[0].id);
      }
    }
  }, [isOpen, defaultWalletId, wallets]);
  const [category, setCategory] = useState(categories.find(c => c.type === 'INCOME')?.name || 'Sales Revenue');
  const [description, setDescription] = useState('');

  // Date helper functions
  const isSuperAdmin = currentUser.role === 'SuperAdmin';
  const isAdminOrSuperAdmin = currentUser.role === 'SuperAdmin' || currentUser.role === 'Admin';
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getMinDateStr = () => {
    const d = new Date();
    if (isAdminOrSuperAdmin) {
      // SuperAdmin & Admin can select dates going back to the start of previous month
      const firstDayPrevMonth = new Date(d.getFullYear(), d.getMonth() - 1, 1);
      return firstDayPrevMonth.toISOString().split('T')[0];
    }
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  };
  const getYesterdayStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  };
  const getLastMonthEndStr = () => {
    const d = new Date();
    const prevMonthEnd = new Date(d.getFullYear(), d.getMonth(), 0);
    return prevMonthEnd.toISOString().split('T')[0];
  };

  const [postingDate, setPostingDate] = useState<string>(getTodayStr());

  // Credit Sale fields
  const [customerName, setCustomerName] = useState('');
  const [creditDaysOption, setCreditDaysOption] = useState<7 | 14 | 30 | 60>(14);

  // Multi-wallet batch state
  const [batchAmounts, setBatchAmounts] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const currentType: TransactionType = entryMode;

  const handleModeSwitch = (mode: 'INCOME' | 'EXPENSE') => {
    triggerHaptic('light');
    setEntryMode(mode);
    if (mode === 'EXPENSE') {
      setIsCreditSale(false);
      setIncomeType('single');
      const exp = categories.find(c => c.type === 'EXPENSE');
      if (exp) setCategory(exp.name);
    } else {
      const inc = categories.find(c => c.type === 'INCOME');
      if (inc) setCategory(inc.name);
    }
  };

  const handleBatchAmountChange = (wId: string, val: string) => {
    setBatchAmounts(prev => ({
      ...prev,
      [wId]: val
    }));
  };

  // Calculate batch totals using smart parseSummedAmount
  const batchEntries: Array<{ walletId: string; amount: number; count: number }> = Object.keys(batchAmounts)
    .map((wId) => {
      const parsed = parseSummedAmount(batchAmounts[wId] || '');
      return { walletId: wId, amount: parsed.total, count: parsed.count };
    })
    .filter(item => item.amount > 0);

  const totalBatchAmount = batchEntries.reduce((sum, item) => sum + item.amount, 0);

  // Live parsed single amount for auto-sum expression
  const parsedSingle = parseSummedAmount(amountStr);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const txDate = new Date(`${postingDate}T12:00:00.000Z`).toISOString();

    // Handling Batch Multi-Wallet Income Submission
    if (entryMode === 'INCOME' && incomeType === 'batch') {
      if (batchEntries.length === 0) {
        triggerHaptic('heavy');
        alert('Please enter an income amount for at least one wallet.');
        return;
      }

      triggerHaptic('success');

      const batchItems = batchEntries.map(entry => {
        const targetW = wallets.find(w => w.id === entry.walletId);
        return {
          type: 'INCOME' as TransactionType,
          amount: entry.amount,
          walletId: entry.walletId,
          category,
          description: description || `Daily Income - ${targetW?.name || 'Wallet'} (${category})`,
          date: txDate
        };
      });

      if (onBatchSubmitTransactions) {
        onBatchSubmitTransactions(batchItems);
      } else {
        batchItems.forEach(item => onSubmitTransaction(item));
      }

      onClose();
      return;
    }

    // Single Entry Submission using parseSummedAmount
    const parsedAmount = parsedSingle.total;
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      triggerHaptic('heavy');
      alert('Please enter a valid amount greater than ETB 0 (e.g. 90 or 40,50).');
      return;
    }

    if (entryMode === 'INCOME' && isCreditSale && !customerName.trim()) {
      triggerHaptic('heavy');
      alert('Please enter the customer / buyer name for this credit sale.');
      return;
    }

    triggerHaptic('success');

    const calculatedDueDate = new Date(Date.now() + 86400000 * creditDaysOption).toISOString();
    const activeCreditSale = entryMode === 'INCOME' && isCreditSale;

    onSubmitTransaction({
      type: currentType,
      amount: parsedAmount,
      walletId,
      category,
      description: description || (activeCreditSale ? `Credit Sale to ${customerName}` : `${category} record`),
      date: txDate,
      isCreditSale: activeCreditSale,
      customerName: activeCreditSale ? customerName.trim() : undefined,
      dueDate: activeCreditSale ? calculatedDueDate : undefined
    });

    onClose();
  };

  const filteredCategories = categories.filter(c => c.type === currentType && c.active);

  const sampleCustomers = [
    'Solomon Retailers',
    'Abebe Exporters',
    'Keba Trading PLC',
    'Tigist Pharmacy',
    'Bole Mart'
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E2D40] w-full max-w-lg rounded-t-3xl sm:rounded-2xl p-5 text-slate-900 dark:text-[#F0F4FF] max-h-[92vh] overflow-y-auto shadow-2xl space-y-4 animate-slideUp relative">
        
        {/* Dynamic Glow Header Accent Line */}
        <div
          className={`absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 rounded-full opacity-80 transition-all ${
            entryMode === 'INCOME' && incomeType === 'batch'
              ? 'bg-gradient-to-r from-transparent via-[#A78BFA] to-transparent'
              : isCreditSale && entryMode === 'INCOME'
              ? 'bg-gradient-to-r from-transparent via-[#3B82F6] to-transparent'
              : entryMode === 'INCOME'
              ? 'bg-gradient-to-r from-transparent via-emerald-500 dark:via-[#00D4AA] to-transparent'
              : 'bg-gradient-to-r from-transparent via-[#EF4444] to-transparent'
          }`}
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#1E2D40]">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shadow-lg transition-colors ${
              entryMode === 'INCOME' && incomeType === 'batch'
                ? 'bg-purple-500/10 dark:bg-[#A78BFA]/20 text-purple-600 dark:text-[#A78BFA] border border-purple-300 dark:border-[#A78BFA]/40 shadow-purple-500/10'
                : isCreditSale && entryMode === 'INCOME'
                ? 'bg-blue-500/10 dark:bg-[#3B82F6]/20 text-blue-600 dark:text-[#3B82F6] border border-blue-300 dark:border-[#3B82F6]/40 shadow-blue-500/10'
                : entryMode === 'INCOME'
                ? 'bg-emerald-500/10 dark:bg-[#00D4AA]/20 text-emerald-600 dark:text-[#00D4AA] border border-emerald-300 dark:border-[#00D4AA]/40 shadow-emerald-500/10'
                : 'bg-rose-500/10 dark:bg-red-500/20 text-rose-600 dark:text-red-400 border border-rose-300 dark:border-red-500/40 shadow-red-500/10'
            }`}>
              {incomeType === 'batch' ? <Layers className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>{incomeType === 'batch' ? 'Multi-Wallet Daily Register' : 'Quick Transaction'}</span>
                <span className="text-[10px] bg-slate-100 dark:bg-[#1E2D40] text-slate-600 dark:text-[#8899BB] px-2 py-0.5 rounded-full font-mono font-semibold">
                  {incomeType === 'batch' ? 'BATCH ENTRY' : 'DIRECT ENTRY'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#8899BB]">
                {incomeType === 'batch'
                  ? 'Record daily sales across Telebirr, CBE Birr, Cash & Banks'
                  : 'Log single income, expense, or customer credit sales'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-100 dark:bg-[#1C2333] text-slate-500 dark:text-[#8899BB] hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#1E2D40] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Primary Mode Switcher: Income vs Expense */}
          <div className="grid grid-cols-2 gap-1.5 bg-slate-100 dark:bg-[#131926] p-1.5 rounded-2xl border border-slate-200 dark:border-[#1E2D40]">
            <button
              type="button"
              onClick={() => handleModeSwitch('INCOME')}
              className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                entryMode === 'INCOME'
                  ? 'bg-emerald-600 dark:bg-[#00D4AA] text-white dark:text-[#0A0E1A] shadow-md shadow-emerald-500/20'
                  : 'text-slate-600 dark:text-[#8899BB] hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Income (+ ETB)</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeSwitch('EXPENSE')}
              className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                entryMode === 'EXPENSE'
                  ? 'bg-rose-600 dark:bg-[#EF4444] text-white shadow-md shadow-rose-500/20'
                  : 'text-slate-600 dark:text-[#8899BB] hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TrendingDown className="w-4 h-4" />
              <span>Expense (- ETB)</span>
            </button>
          </div>

          {/* Income Sub-Type Switcher: Single Entry vs Multi-Wallet Daily Batch */}
          {entryMode === 'INCOME' && (
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#0A0E1A] p-1 rounded-xl border border-slate-200 dark:border-[#1E2D40]">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setIncomeType('single');
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    incomeType === 'single'
                      ? 'bg-white dark:bg-[#1C2333] text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-[#334155]'
                      : 'text-slate-500 dark:text-[#8899BB] hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Single Account Entry
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setIncomeType('batch');
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    incomeType === 'batch'
                      ? 'bg-purple-600 dark:bg-[#A78BFA] text-white dark:text-[#0A0E1A] shadow-md font-black'
                      : 'text-purple-600 dark:text-[#A78BFA] hover:text-purple-700'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Daily Multi-Wallet</span>
                </button>
              </div>

              {/* Single Income: Sale on Credit Toggle */}
              {incomeType === 'single' && (
                <div className={`p-3.5 rounded-2xl border transition-all ${
                  isCreditSale
                    ? 'bg-blue-50 dark:bg-[#3B82F6]/10 border-blue-300 dark:border-[#3B82F6]/50 shadow-lg shadow-blue-500/10'
                    : 'bg-slate-50 dark:bg-[#131926] border-slate-200 dark:border-[#1E2D40]'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        isCreditSale ? 'bg-blue-600 dark:bg-[#3B82F6] text-white' : 'bg-slate-200 dark:bg-[#1C2333] text-slate-600 dark:text-[#8899BB]'
                      }`}>
                        <FileCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>Sale on Credit (Customer Debt)</span>
                          {isCreditSale && (
                            <span className="text-[9px] bg-blue-600 dark:bg-[#3B82F6] text-white px-1.5 py-0.2 rounded font-mono font-bold">
                              ACTIVE
                            </span>
                          )}
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-[#8899BB]">
                          Customer buys now and pays later (logged to Receivables)
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('medium');
                        const nextVal = !isCreditSale;
                        setIsCreditSale(nextVal);
                        if (nextVal) {
                          const salesCat = categories.find(c => c.type === 'INCOME' && c.name.toLowerCase().includes('sale'));
                          if (salesCat) setCategory(salesCat.name);
                        }
                      }}
                      className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                        isCreditSale ? 'bg-blue-600 dark:bg-[#3B82F6]' : 'bg-slate-300 dark:bg-[#1C2333] border border-slate-300 dark:border-[#1E2D40]'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform transform ${
                        isCreditSale ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {/* Credit Sale Customer Details */}
                  {isCreditSale && (
                    <div className="mt-3 pt-3 border-t border-blue-200 dark:border-[#3B82F6]/30 space-y-3 animate-fadeIn">
                      <div>
                        <label className="text-xs font-semibold text-slate-600 dark:text-[#8899BB] block mb-1">
                          Customer / Buyer Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required={isCreditSale}
                          value={customerName}
                          onChange={e => setCustomerName(e.target.value)}
                          placeholder="Customer name"
                          className="w-full bg-white dark:bg-[#0A0E1A] border border-blue-300 dark:border-[#3B82F6]/50 focus:border-blue-500 dark:focus:border-[#3B82F6] rounded-xl py-2 px-3 text-xs text-slate-900 dark:text-white outline-none"
                        />

                        <div className="flex items-center gap-1 mt-1.5 overflow-x-auto no-scrollbar pb-0.5">
                          <span className="text-[10px] text-slate-500 dark:text-[#8899BB] shrink-0">Recent:</span>
                          {sampleCustomers.map((cName) => (
                            <button
                              key={cName}
                              type="button"
                              onClick={() => {
                                triggerHaptic('light');
                                setCustomerName(cName);
                              }}
                              className="text-[10px] bg-slate-100 dark:bg-[#1C2333] hover:bg-blue-50 dark:hover:bg-[#3B82F6]/20 hover:text-blue-600 text-slate-600 dark:text-[#8899BB] px-2 py-0.5 rounded-lg border border-slate-200 dark:border-[#1E2D40] shrink-0 cursor-pointer transition-colors"
                            >
                              + {cName}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-600 dark:text-[#8899BB] block mb-1">
                          Repayment Due Term
                        </label>
                        <div className="grid grid-cols-4 gap-1.5">
                          {[
                            { days: 7, label: '+7 Days' },
                            { days: 14, label: '+14 Days' },
                            { days: 30, label: '+30 Days' },
                            { days: 60, label: '+60 Days' }
                          ].map((opt) => (
                            <button
                              key={opt.days}
                              type="button"
                              onClick={() => {
                                triggerHaptic('light');
                                setCreditDaysOption(opt.days as any);
                              }}
                              className={`py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                creditDaysOption === opt.days
                                  ? 'bg-blue-600 dark:bg-[#3B82F6] border-blue-600 dark:border-[#3B82F6] text-white shadow-md'
                                  : 'bg-white dark:bg-[#0A0E1A] border-slate-200 dark:border-[#1E2D40] text-slate-600 dark:text-[#8899BB] hover:text-slate-900 dark:hover:text-white'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* MULTI-WALLET DAILY BATCH MODE BODY */}
          {entryMode === 'INCOME' && incomeType === 'batch' ? (
            <div className="space-y-4 animate-fadeIn">
              
              <div className="bg-purple-50 dark:bg-[#A78BFA]/10 border border-purple-200 dark:border-[#A78BFA]/30 rounded-2xl p-3.5 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-purple-900 dark:text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-600 dark:text-[#A78BFA]" />
                    <span>Daily Sales Across Accounts</span>
                  </h4>
                  <p className="text-[11px] text-purple-700 dark:text-[#8899BB] mt-0.5">
                    Enter the total earnings received in each account today
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setBatchAmounts({});
                  }}
                  className="text-[10px] text-purple-600 dark:text-[#8899BB] hover:text-slate-900 dark:hover:text-white underline cursor-pointer"
                >
                  Clear All
                </button>
              </div>

              {/* Wallet Amount Rows List */}
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {wallets.map((w) => {
                  const val = batchAmounts[w.id] || '';
                  return (
                    <div
                      key={w.id}
                      className="bg-slate-50 dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] hover:border-purple-300 dark:hover:border-[#A78BFA]/50 rounded-2xl p-3 transition-colors space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: w.color }}
                          />
                          <span className="text-xs font-bold text-slate-900 dark:text-white">{w.name}</span>
                          <span className="text-[9px] bg-slate-200 dark:bg-[#1E2D40] text-slate-600 dark:text-[#8899BB] px-1.5 py-0.2 rounded font-mono">
                            {w.type}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 dark:text-[#8899BB]">
                          Bal: {formatETB(w.balance || 0, true)}
                        </span>
                      </div>

                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-purple-600 dark:text-[#A78BFA]">ETB</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={val}
                            onChange={(e) => handleBatchAmountChange(w.id, e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-white dark:bg-[#0A0E1A] border border-slate-200 dark:border-[#1E2D40] focus:border-purple-500 dark:focus:border-[#A78BFA] rounded-xl py-2 px-3 text-sm font-mono font-bold text-slate-900 dark:text-white outline-none"
                          />
                        </div>

                        {/* Batch Row Sum Badge if user enters multiple values (e.g. 40,50) */}
                        {(() => {
                          const parsedRow = parseSummedAmount(val);
                          if (parsedRow.count > 1) {
                            return (
                              <div className="text-[11px] font-mono font-bold text-purple-700 dark:text-[#A78BFA] bg-purple-50 dark:bg-[#A78BFA]/15 px-2.5 py-1 rounded-lg flex items-center justify-between border border-purple-200 dark:border-[#A78BFA]/30">
                                <span>Sum ({parsedRow.count} items): {parsedRow.formattedExpression}</span>
                                <span className="font-black text-slate-900 dark:text-white">= {formatETB(parsedRow.total)}</span>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total Summary Banner */}
              <div className="bg-slate-900 dark:bg-[#0A0E1A] border border-purple-500/40 rounded-2xl p-3.5 flex items-center justify-between text-white">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-[#8899BB] uppercase tracking-wider block">
                    Combined Daily Total
                  </span>
                  <span className="text-xs text-purple-300 dark:text-[#A78BFA] font-medium">
                    {batchEntries.length} {batchEntries.length === 1 ? 'account' : 'accounts'} receiving income
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-mono font-black text-white">
                    {formatETB(totalBatchAmount)}
                  </span>
                </div>
              </div>

            </div>
          ) : (
            /* SINGLE AMOUNT INPUT HERO CARD */
            <div className={`p-4 rounded-2xl border transition-all space-y-3 ${
              isCreditSale && entryMode === 'INCOME'
                ? 'bg-blue-50/50 dark:bg-[#3B82F6]/5 border-blue-200 dark:border-[#3B82F6]/30'
                : entryMode === 'INCOME'
                ? 'bg-emerald-50/50 dark:bg-[#00D4AA]/5 border-emerald-200 dark:border-[#00D4AA]/30'
                : 'bg-rose-50/50 dark:bg-red-500/5 border-rose-200 dark:border-red-500/30'
            }`}>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-600 dark:text-[#8899BB] flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-emerald-600 dark:text-[#00D4AA]" />
                  <span>Transaction Amount</span>
                  <span className="text-[10px] text-emerald-700 dark:text-[#00D4AA] font-normal font-mono bg-emerald-500/10 dark:bg-[#00D4AA]/15 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    Type 40,50 or 40+50
                  </span>
                </label>
                <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-[#8899BB]">
                  Currency: <span className="text-slate-900 dark:text-white">ETB</span>
                </span>
              </div>

              <div className="relative flex items-center">
                <span className={`text-2xl font-mono font-bold mr-2 ${
                  isCreditSale && entryMode === 'INCOME' ? 'text-blue-600 dark:text-[#3B82F6]' : entryMode === 'INCOME' ? 'text-emerald-600 dark:text-[#00D4AA]' : 'text-rose-600 dark:text-red-400'
                }`}>
                  ETB
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  required={incomeType === 'single'}
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-transparent text-3xl font-mono font-black text-slate-900 dark:text-white outline-none placeholder:text-slate-300 dark:placeholder:text-[#334155] no-scrollbar overflow-hidden resize-none"
                />
              </div>

              {/* Multi-Amount Sum Calculator Pill */}
              {parsedSingle.count > 1 && (
                <div className="p-2.5 bg-white dark:bg-[#0A0E1A] border border-emerald-400/40 dark:border-[#00D4AA]/40 rounded-xl flex items-center justify-between shadow-sm animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-[#00D4AA] flex items-center justify-center font-bold text-xs shrink-0">
                      <Calculator className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-[#8899BB] block">
                        Auto Calculated Sum ({parsedSingle.count} items)
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                        {parsedSingle.formattedExpression}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[9px] text-slate-400 block font-mono">TOTAL REGISTERED</span>
                    <span className="text-base font-mono font-black text-emerald-600 dark:text-[#00D4AA]">
                      {formatETB(parsedSingle.total)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Wallet Selection Grid (Only for Single Entry Mode) */}
          {(entryMode === 'EXPENSE' || incomeType === 'single') && (
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-[#8899BB] flex items-center gap-1.5 mb-2">
                <WalletIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-[#00D4AA]" />
                <span>{isCreditSale && entryMode === 'INCOME' ? 'Settlement Account / Wallet' : 'Source / Destination Wallet'}</span>
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                {wallets.map((w) => {
                  const isSelected = walletId === w.id;
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setWalletId(w.id);
                      }}
                      style={{
                        borderColor: isSelected ? w.color : undefined,
                      }}
                      className={`p-2.5 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01] ${
                        isSelected
                          ? 'bg-slate-100 dark:bg-slate-800/50'
                          : 'bg-slate-50 dark:bg-[#131926] border-slate-200 dark:border-[#1E2D40]'
                      }`}
                    >
                      <div className="min-w-0 pr-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{w.name}</p>
                        <p className="text-[10px] font-mono text-slate-500 dark:text-[#8899BB] mt-0.5">
                          {formatETB(w.balance || 0, true)}
                        </p>
                      </div>
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: w.color }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Category Tag Pills */}
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-[#8899BB] flex items-center gap-1.5 mb-1.5">
              <Tag className="w-3.5 h-3.5 text-emerald-600 dark:text-[#00D4AA]" />
              <span>Category Tag</span>
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 border border-slate-200 dark:border-[#1E2D40] rounded-2xl bg-slate-50 dark:bg-[#0A0E1A]">
              {filteredCategories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setCategory(c.name);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                    category === c.name
                      ? 'bg-emerald-600 dark:bg-[#00D4AA] text-white dark:text-[#0A0E1A] font-bold shadow-md'
                      : 'bg-white dark:bg-[#131926] text-slate-600 dark:text-[#8899BB] hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-transparent'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Description & Reference Note */}
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-[#8899BB] flex items-center gap-1 mb-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Notes / Reference (Optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Note or reference"
              className="w-full bg-slate-50 dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] focus:border-emerald-500 dark:focus:border-[#00D4AA] rounded-xl py-2.5 px-3 text-xs text-slate-900 dark:text-[#F0F4FF] outline-none"
            />
          </div>

          {/* Date Selector (SuperAdmin can post to last month) */}
          <div className="bg-slate-50 dark:bg-[#131926] p-3 rounded-2xl border border-slate-200 dark:border-[#1E2D40] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600 dark:text-[#8899BB] flex items-center gap-1.5 font-semibold">
                <CalendarIcon className="w-4 h-4 text-emerald-600 dark:text-[#00D4AA]" />
                <span>Posting Date</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500 dark:text-[#8899BB]">
                {isAdminOrSuperAdmin ? '⚡ Admin Privilege: Past Month Allowed' : '(Up to 30 days back)'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex items-center gap-1 bg-white dark:bg-[#0A0E1A] p-1 rounded-xl border border-slate-200 dark:border-[#1E2D40] shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setPostingDate(getTodayStr());
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    postingDate === getTodayStr() ? 'bg-emerald-600 dark:bg-[#00D4AA] text-white dark:text-[#0A0E1A]' : 'text-slate-600 dark:text-[#8899BB] hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setPostingDate(getYesterdayStr());
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    postingDate === getYesterdayStr() ? 'bg-emerald-600 dark:bg-[#00D4AA] text-white dark:text-[#0A0E1A]' : 'text-slate-600 dark:text-[#8899BB] hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Yesterday
                </button>
                {isAdminOrSuperAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setPostingDate(getLastMonthEndStr());
                    }}
                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      postingDate === getLastMonthEndStr() ? 'bg-purple-600 dark:bg-purple-500 text-white' : 'text-purple-600 dark:text-purple-400 hover:text-purple-700 bg-purple-50 dark:bg-purple-500/10'
                    }`}
                  >
                    Last Month
                  </button>
                )}
              </div>

              <input
                type="date"
                min={getMinDateStr()}
                max={getTodayStr()}
                value={postingDate}
                onChange={(e) => {
                  if (e.target.value) {
                    triggerHaptic('light');
                    setPostingDate(e.target.value);
                  }
                }}
                className="bg-white dark:bg-[#0A0E1A] border border-slate-200 dark:border-[#1E2D40] focus:border-emerald-500 dark:focus:border-[#00D4AA] rounded-xl py-1 px-2 text-xs text-slate-900 dark:text-white outline-none cursor-pointer font-mono font-bold w-full text-center"
              />
            </div>

            {isSuperAdmin && postingDate < getYesterdayStr() && (
              <p className="text-[10px] text-purple-600 dark:text-purple-400 font-medium bg-purple-50 dark:bg-purple-500/10 p-1.5 rounded-lg border border-purple-200 dark:border-purple-500/20">
                🔒 <strong>SuperAdmin Privilege Active:</strong> Registering backdated entry for {postingDate}.
              </p>
            )}
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            className={`w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer hover:opacity-95 ${
              entryMode === 'INCOME' && incomeType === 'batch'
                ? 'bg-gradient-to-r from-purple-600 to-purple-800 dark:from-[#A78BFA] dark:to-[#8B5CF6] text-white dark:text-[#0A0E1A] shadow-purple-500/25'
                : isCreditSale && entryMode === 'INCOME'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 dark:from-[#3B82F6] dark:to-[#2563EB] text-white shadow-blue-500/25'
                : entryMode === 'INCOME'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-700 dark:from-[#00D4AA] dark:to-[#00B894] text-white dark:text-[#0A0E1A] shadow-emerald-500/20'
                : 'bg-gradient-to-r from-rose-600 to-red-700 dark:from-[#EF4444] dark:to-[#DC2626] text-white shadow-rose-500/20'
            }`}
          >
            <Check className="w-5 h-5" />
            <span>
              {entryMode === 'INCOME' && incomeType === 'batch'
                ? `Post Daily Incomes across ${batchEntries.length} ${batchEntries.length === 1 ? 'Wallet' : 'Wallets'} (${formatETB(totalBatchAmount)})`
                : isCreditSale && entryMode === 'INCOME'
                ? `Record Credit Sale for ${customerName || 'Customer'}`
                : `Post ${entryMode === 'INCOME' ? 'Income' : 'Expense'} to Ledger`}
            </span>
          </button>

        </form>
      </div>
    </div>
  );
};

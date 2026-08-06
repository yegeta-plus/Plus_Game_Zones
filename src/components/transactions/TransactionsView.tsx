import React, { useState } from 'react';
import {
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  RotateCcw,
  X,
  AlertCircle,
  Calendar,
  Wallet as WalletIcon,
  Tag,
  Edit3,
  Trash2,
  Lock,
  CheckCircle2,
  Calculator,
  FileText,
  FileSpreadsheet,
  Sparkles
} from 'lucide-react';
import { Transaction, Wallet, Category, UserProfile, TransactionType, ERPState } from '../../types';
import { formatETB, isTransactionEditable, parseSummedAmount } from '../../lib/store';
import { triggerHaptic } from '../../lib/haptics';
import { generatePDFReport, generateExcelReport } from '../../lib/exports';

interface TransactionsViewProps {
  transactions: Transaction[];
  wallets: Wallet[];
  categories: Category[];
  currentUser: UserProfile;
  hideBalances: boolean;
  onReverseTransaction: (txId: string) => void;
  onUpdateTransaction?: (txId: string, data: {
    date: string;
    amount: number;
    type: TransactionType;
    category: string;
    description: string;
    walletId: string;
  }) => void;
  onDeleteTransaction?: (txId: string) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  wallets,
  categories,
  currentUser,
  hideBalances,
  onReverseTransaction,
  onUpdateTransaction,
  onDeleteTransaction
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWalletId, setSelectedWalletId] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedType, setSelectedType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [activeTxDetail, setActiveTxDetail] = useState<Transaction | null>(null);
  const [confirmReversalTxId, setConfirmReversalTxId] = useState<string | null>(null);
  const [confirmDeleteTxId, setConfirmDeleteTxId] = useState<string | null>(null);

  // Edit modal state
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editForm, setEditForm] = useState({
    date: '',
    amount: '',
    type: 'INCOME' as TransactionType,
    category: '',
    description: '',
    walletId: ''
  });

  const handleOpenEdit = (tx: Transaction) => {
    triggerHaptic('medium');
    // Format date string for datetime-local input (YYYY-MM-DDTHH:mm)
    let formattedDate = '';
    try {
      const d = new Date(tx.date);
      formattedDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
    } catch (e) {
      formattedDate = tx.date;
    }

    setEditForm({
      date: formattedDate,
      amount: tx.amount.toString(),
      type: tx.type,
      category: tx.category,
      description: tx.description,
      walletId: tx.walletId
    });
    setEditingTx(tx);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx || !onUpdateTransaction) return;

    const parsedRes = parseSummedAmount(editForm.amount);
    const numAmount = parsedRes.total;
    if (isNaN(numAmount) || numAmount <= 0) return;

    let isoDate = editingTx.date;
    try {
      isoDate = new Date(editForm.date).toISOString();
    } catch (err) {
      isoDate = editingTx.date;
    }

    onUpdateTransaction(editingTx.id, {
      date: isoDate,
      amount: numAmount,
      type: editForm.type,
      category: editForm.category || 'General',
      description: editForm.description,
      walletId: editForm.walletId
    });

    setEditingTx(null);
    setActiveTxDetail(null);
  };

  const handleConfirmDelete = () => {
    if (confirmDeleteTxId && onDeleteTransaction) {
      triggerHaptic('warning');
      onDeleteTransaction(confirmDeleteTxId);
      setConfirmDeleteTxId(null);
      setActiveTxDetail(null);
    }
  };

  // Filter transactions (sorted latest first)
  const filtered = transactions
    .filter((tx) => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchDesc = (tx.description || '').toLowerCase().includes(q);
        const matchCat = (tx.category || '').toLowerCase().includes(q);
        const matchCreator = (tx.creatorName || '').toLowerCase().includes(q);
        if (!matchDesc && !matchCat && !matchCreator) return false;
      }
      if (selectedWalletId !== 'ALL' && tx.walletId !== selectedWalletId) return false;
      if (selectedCategory !== 'ALL' && tx.category !== selectedCategory) return false;
      if (selectedType !== 'ALL' && tx.type !== selectedType) return false;
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Group by date
  const grouped: Record<string, Transaction[]> = filtered.reduce((acc: Record<string, Transaction[]>, tx) => {
    const dateStr = new Date(tx.date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(tx);
    return acc;
  }, {});

  // Compute running balance map for transactions chronologically (oldest to newest)
  const runningBalancesMap = React.useMemo(() => {
    // Total initial opening balance across wallets
    const totalOpening = wallets.reduce((sum, w) => sum + w.openingBalance, 0);
    const sortedAsc = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const map: Record<string, number> = {};
    let currentTotal = totalOpening;

    for (const tx of sortedAsc) {
      if (!tx.reversed) {
        if (tx.type === 'INCOME') {
          currentTotal += tx.amount;
        } else if (tx.type === 'EXPENSE') {
          currentTotal -= tx.amount;
        }
      }
      map[tx.id] = currentTotal;
    }

    return map;
  }, [transactions, wallets]);

  // Wallet-specific running balance map if a single wallet filter is active
  const walletRunningBalancesMap = React.useMemo(() => {
    if (selectedWalletId === 'ALL') return null;
    const selectedWallet = wallets.find(w => w.id === selectedWalletId);
    const openingBal = selectedWallet ? selectedWallet.openingBalance : 0;

    const sortedAsc = [...transactions]
      .filter(tx => tx.walletId === selectedWalletId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const map: Record<string, number> = {};
    let currentWalletBal = openingBal;

    for (const tx of sortedAsc) {
      if (!tx.reversed) {
        if (tx.type === 'INCOME') {
          currentWalletBal += tx.amount;
        } else if (tx.type === 'EXPENSE') {
          currentWalletBal -= tx.amount;
        }
      }
      map[tx.id] = currentWalletBal;
    }

    return map;
  }, [transactions, wallets, selectedWalletId]);

  const handleConfirmReversal = (txId: string) => {
    triggerHaptic('warning');
    onReverseTransaction(txId);
    setConfirmReversalTxId(null);
    setActiveTxDetail(null);
  };

  return (
    <div className="space-y-4 pb-24">
      
      {/* Title & Quick Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-[#F0F4FF]">Financial Ledger</h2>
          <p className="text-xs text-slate-500 dark:text-[#8899BB] mt-0.5">{filtered.length} entries recorded</p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('medium');
              const dummyState: any = {
                currentUser,
                wallets,
                transactions,
                transfers: [],
                equbs: [],
                loans: [],
                assets: [],
                receivables: [],
                users: [],
                categories,
                recurring: [],
                auditLogs: [],
                savedReports: []
              };
              generatePDFReport({
                state: dummyState,
                transactions: filtered,
                dateRangeLabel: 'Filtered Ledger View',
                reportTitle: 'Financial Ledger & Transaction Creator Report'
              });
            }}
            className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm cursor-pointer transition-all active:scale-95"
            title="Download PDF Financial Report"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('heavy');
              const dummyState: any = {
                currentUser,
                wallets,
                transactions,
                transfers: [],
                equbs: [],
                loans: [],
                assets: [],
                receivables: [],
                users: [],
                categories,
                recurring: [],
                auditLogs: [],
                savedReports: []
              };
              generateExcelReport({
                state: dummyState,
                transactions: filtered,
                dateRangeLabel: 'Filtered Ledger View',
                reportTitle: 'Banking & Financial Reporting Package'
              });
            }}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 dark:bg-[#00D4AA] text-white dark:text-[#0A0E1A] font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer hover:brightness-110 transition-all active:scale-95"
            title="Download Multi-Tab Excel Workbook (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export xlsx</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="space-y-2">
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 dark:text-[#8899BB] absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search description, category, partner..."
            className="w-full bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] focus:border-emerald-500 dark:focus:border-[#00D4AA] rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 dark:text-[#F0F4FF] outline-none transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-3 text-slate-400 dark:text-[#8899BB] hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          
          {/* Type filter */}
          <div className="flex items-center bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] rounded-xl p-1 text-xs shrink-0">
            {(['ALL', 'INCOME', 'EXPENSE'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  selectedType === t ? 'bg-gradient-to-r from-[#00D4AA] to-[#00B894] text-[#0A0E1A]' : 'text-slate-500 dark:text-[#8899BB]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Wallet Filter */}
          <select
            value={selectedWalletId}
            onChange={(e) => setSelectedWalletId(e.target.value)}
            className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-[#8899BB] outline-none shrink-0 cursor-pointer"
          >
            <option value="ALL">All Wallets</option>
            {wallets.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-[#8899BB] outline-none shrink-0 cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>

        </div>
      </div>

      {/* Grouped Transactions List */}
      {Object.keys(grouped).length === 0 ? (
        <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] rounded-2xl p-8 text-center text-slate-500 dark:text-[#8899BB] space-y-2 shadow-sm">
          <AlertCircle className="w-8 h-8 mx-auto text-slate-300 dark:text-[#8899BB]/50" />
          <p className="text-xs font-bold text-slate-800 dark:text-[#F0F4FF]">No matching ledger entries</p>
          <p className="text-[11px]">Try clearing search or filters to see all transactions.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([dateLabel, txList]) => {
          // Calculate daily total income and expense
          const dayIncome = txList
            .filter(t => !t.reversed && t.type === 'INCOME')
            .reduce((sum, t) => sum + t.amount, 0);

          const dayExpense = txList
            .filter(t => !t.reversed && t.type === 'EXPENSE')
            .reduce((sum, t) => sum + t.amount, 0);

          return (
            <div key={dateLabel} className="space-y-1.5">
              {/* Date Group Header with Daily Total Income & Expense */}
              <div className="flex items-center justify-between px-1 py-1">
                <h3 className="text-[11px] font-bold text-slate-500 dark:text-[#8899BB] uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-[#00D4AA]" />
                  <span>{dateLabel}</span>
                </h3>

                <div className="flex items-center gap-2 text-[10px] font-mono font-bold">
                  {dayIncome > 0 && (
                    <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-500/20">
                      +{hideBalances ? '••••' : formatETB(dayIncome, true)}
                    </span>
                  )}
                  {dayExpense > 0 && (
                    <span className="text-rose-700 dark:text-red-400 bg-rose-50 dark:bg-red-500/10 px-2 py-0.5 rounded-lg border border-rose-200 dark:border-red-500/20">
                      -{hideBalances ? '••••' : formatETB(dayExpense, true)}
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-[#1E2D40] rounded-2xl divide-y divide-slate-100 dark:divide-[#1E2D40] overflow-hidden shadow-sm">
                {txList.map((tx) => {
                  const wallet = wallets.find(w => w.id === tx.walletId);
                  const isIncome = tx.type === 'INCOME';

                  // Running balance after this transaction
                  const postTxBalance = (walletRunningBalancesMap && walletRunningBalancesMap[tx.id] !== undefined)
                    ? walletRunningBalancesMap[tx.id]
                    : (runningBalancesMap[tx.id] ?? 0);

                  return (
                    <div
                      key={tx.id}
                      onClick={() => {
                        triggerHaptic('light');
                        setActiveTxDetail(tx);
                      }}
                      className={`p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-[#1C2333]/70 transition-colors ${
                        tx.reversed ? 'opacity-50 line-through' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isIncome
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                            : 'bg-rose-100 text-rose-700 dark:bg-red-500/15 dark:text-red-400'
                        }`}>
                          {isIncome ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-slate-900 dark:text-[#F0F4FF] line-clamp-1">{tx.description}</p>
                            {!isTransactionEditable(tx.date) && !tx.reversed && (
                              currentUser.role === 'SuperAdmin' ? (
                                <span title="SuperAdmin can edit/delete backdated transactions" className="text-[9px] bg-purple-100 text-purple-800 dark:bg-purple-500/15 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 px-1.5 py-0.2 rounded flex items-center gap-0.5 shrink-0 font-bold">
                                  ⚡ SuperAdmin
                                </span>
                              ) : (
                                <span title="Can't be edited: older than 1 week" className="text-[9px] bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 px-1.5 py-0.2 rounded flex items-center gap-0.5 shrink-0 font-medium">
                                  <Lock className="w-2.5 h-2.5" />
                                  <span className="hidden xs:inline">Locked</span>
                                </span>
                              )
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-[#8899BB] flex items-center gap-1 mt-0.5">
                            <span>{tx.category}</span>
                            <span>•</span>
                            <span className="text-emerald-700 dark:text-[#00D4AA] font-mono font-medium">{wallet?.name || 'Wallet'}</span>
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className={`text-xs font-bold font-mono ${
                          isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-red-400'
                        }`}>
                          {isIncome ? '+' : '-'}{hideBalances ? '••••••' : formatETB(tx.amount)}
                        </p>

                        {/* Total amount / running balance after transaction */}
                        <p className="text-[10px] text-slate-500 dark:text-[#8899BB] font-mono mt-0.5 flex items-center justify-end gap-1">
                          <span className="text-[9px] text-slate-400 dark:text-[#8899BB]/70">Bal:</span>
                          <span className="font-semibold text-emerald-600 dark:text-[#00D4AA]">
                            {hideBalances ? '••••••' : formatETB(postTxBalance)}
                          </span>
                        </p>

                        <p className="text-[9px] text-slate-400 dark:text-[#8899BB]/70 mt-0.5">
                          {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}

      {/* Transaction Detail Sheet Modal */}
      {activeTxDetail && (() => {
        const isSuperAdmin = currentUser.role === 'SuperAdmin';
        const editable = (isTransactionEditable(activeTxDetail.date) || isSuperAdmin) && !activeTxDetail.reversed;

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
            <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 text-slate-900 dark:text-[#F0F4FF] shadow-xl animate-slideUp">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#1E2D40]">
                <h3 className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                  <span>Ledger Entry Audit</span>
                  {activeTxDetail.reversed ? (
                    <span className="text-[9px] bg-rose-100 text-rose-800 dark:bg-red-500/20 dark:text-red-400 border border-rose-200 dark:border-red-500/30 px-2 py-0.5 rounded-full font-bold">Reversed</span>
                  ) : editable ? (
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" /> {isSuperAdmin && !isTransactionEditable(activeTxDetail.date) ? 'SuperAdmin Authorized' : 'Editable'}
                    </span>
                  ) : (
                    <span className="text-[9px] bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Can't be edited
                    </span>
                  )}
                </h3>
                <button onClick={() => setActiveTxDetail(null)} className="p-1 rounded-lg bg-slate-100 dark:bg-[#1C2333] text-slate-500 dark:text-[#8899BB] hover:text-slate-900 dark:hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <div className="text-center py-3 bg-slate-50 dark:bg-[#0A0E1A] rounded-2xl border border-slate-200 dark:border-[#1E2D40] relative">
                  <p className="text-[10px] text-slate-500 dark:text-[#8899BB] font-mono uppercase">{activeTxDetail.type}</p>
                  <p className={`text-2xl font-black font-mono ${
                    activeTxDetail.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-red-400'
                  }`}>
                    {formatETB(activeTxDetail.amount)}
                  </p>
                  <p className="text-xs text-slate-800 dark:text-[#F0F4FF] font-medium mt-1">{activeTxDetail.description}</p>
                </div>

                {/* Status Notice about Edit Rule */}
                {!editable && !activeTxDetail.reversed && (
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl flex items-start gap-2">
                    <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-amber-800 dark:text-amber-400">Can't be edited (Older than 1 week)</p>
                      <p className="text-[10px] text-slate-600 dark:text-[#8899BB]">
                        This transaction is past the 7-day editing window. Date, amount, and ledger details are locked for audit compliance.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 dark:bg-[#1C2333] p-2.5 rounded-xl border border-slate-100 dark:border-transparent">
                    <span className="text-[10px] text-slate-500 dark:text-[#8899BB]">Wallet</span>
                    <p className="font-bold text-emerald-700 dark:text-[#00D4AA] mt-0.5">
                      {wallets.find(w => w.id === activeTxDetail.walletId)?.name}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-[#1C2333] p-2.5 rounded-xl border border-slate-100 dark:border-transparent">
                    <span className="text-[10px] text-slate-500 dark:text-[#8899BB]">Category</span>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5">{activeTxDetail.category}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-[#1C2333] p-2.5 rounded-xl border border-slate-100 dark:border-transparent">
                    <span className="text-[10px] text-slate-500 dark:text-[#8899BB]">Posted By Partner</span>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5">{activeTxDetail.creatorName}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-[#1C2333] p-2.5 rounded-xl border border-slate-100 dark:border-transparent">
                    <span className="text-[10px] text-slate-500 dark:text-[#8899BB]">Branch Location</span>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5">{activeTxDetail.branch}</p>
                  </div>
                </div>

                {/* Post-Transaction Ledger Balance */}
                <div className="bg-emerald-50 dark:bg-[#1C2333] p-3 rounded-xl border border-emerald-200 dark:border-[#00D4AA]/30 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-[#8899BB]">Total Ledger Balance After Transaction</span>
                    <p className="text-xs font-bold text-emerald-700 dark:text-[#00D4AA] font-mono mt-0.5">
                      {hideBalances ? '••••••' : formatETB(
                        (walletRunningBalancesMap && walletRunningBalancesMap[activeTxDetail.id] !== undefined)
                          ? walletRunningBalancesMap[activeTxDetail.id]
                          : (runningBalancesMap[activeTxDetail.id] ?? 0)
                      )}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-[#8899BB] font-mono">
                    {new Date(activeTxDetail.date).toLocaleString()}
                  </span>
                </div>

                {/* Action Buttons: Edit & Delete */}
                <div className="space-y-2 pt-1">
                  {editable ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleOpenEdit(activeTxDetail)}
                        className="py-2.5 px-3 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-[#00D4AA]/15 border border-emerald-200 dark:border-[#00D4AA]/40 dark:text-[#00D4AA] hover:bg-emerald-100 dark:hover:bg-[#00D4AA]/25 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Details</span>
                      </button>

                      <button
                        onClick={() => setConfirmDeleteTxId(activeTxDetail.id)}
                        className="py-2.5 px-3 rounded-xl bg-rose-50 text-rose-700 dark:bg-red-500/15 border border-rose-200 dark:border-red-500/30 dark:text-red-400 hover:bg-rose-100 dark:hover:bg-red-500/25 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Entry</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        disabled
                        title="Can't be edited: Older than 1 week"
                        className="py-2.5 px-3 rounded-xl bg-slate-100 text-slate-400 dark:bg-gray-800/40 border border-slate-200 dark:border-gray-700/40 font-bold text-xs flex items-center justify-center gap-1.5 cursor-not-allowed"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Can't be edited</span>
                      </button>

                      <button
                        disabled
                        title="Can't be deleted: Older than 1 week"
                        className="py-2.5 px-3 rounded-xl bg-slate-100 text-slate-400 dark:bg-gray-800/40 border border-slate-200 dark:border-gray-700/40 font-bold text-xs flex items-center justify-center gap-1.5 cursor-not-allowed"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Locked</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* Edit Transaction Modal */}
      {editingTx && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#00D4AA]/40 max-w-sm w-full p-5 rounded-2xl text-slate-900 dark:text-[#F0F4FF] space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1E2D40] pb-3">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-600 dark:text-[#00D4AA]" />
                <span>Edit Transaction Entry</span>
              </h4>
              <button onClick={() => setEditingTx(null)} className="p-1 rounded-lg bg-slate-100 dark:bg-[#1C2333] text-slate-500 dark:text-[#8899BB]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              {/* Type Switcher */}
              <div>
                <label className="text-[10px] text-slate-500 dark:text-[#8899BB] font-mono block mb-1">TRANSACTION TYPE</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditForm(prev => ({ ...prev, type: 'INCOME' }))}
                    className={`py-2 rounded-xl font-bold text-xs border ${
                      editForm.type === 'INCOME'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-500/20 dark:border-emerald-500 dark:text-emerald-400'
                        : 'bg-slate-50 border-slate-200 dark:bg-[#1C2333] dark:border-[#1E2D40] text-slate-600 dark:text-[#8899BB]'
                    }`}
                  >
                    + Income
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditForm(prev => ({ ...prev, type: 'EXPENSE' }))}
                    className={`py-2 rounded-xl font-bold text-xs border ${
                      editForm.type === 'EXPENSE'
                        ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-red-500/20 dark:border-red-500 dark:text-red-400'
                        : 'bg-slate-50 border-slate-200 dark:bg-[#1C2333] dark:border-[#1E2D40] text-slate-600 dark:text-[#8899BB]'
                    }`}
                  >
                    - Expense
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-slate-500 dark:text-[#8899BB] font-mono block">AMOUNT (ETB)</label>
                  <span className="text-[9px] text-emerald-600 dark:text-[#00D4AA] font-mono">Supports 40,50 or 40+50</span>
                </div>
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  value={editForm.amount}
                  onChange={(e) => setEditForm(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00 or 40,50"
                  className="w-full bg-slate-50 dark:bg-[#0A0E1A] border border-slate-200 dark:border-[#1E2D40] rounded-xl px-3 py-2 text-sm text-emerald-700 dark:text-[#00D4AA] font-mono font-bold focus:outline-none focus:border-emerald-500 dark:focus:border-[#00D4AA]"
                />
                {(() => {
                  const parsedEdit = parseSummedAmount(editForm.amount);
                  if (parsedEdit.count > 1) {
                    return (
                      <div className="p-2 bg-emerald-50 dark:bg-[#00D4AA]/15 border border-emerald-200 dark:border-[#00D4AA]/30 rounded-lg flex items-center justify-between text-xs text-emerald-700 dark:text-[#00D4AA] font-mono font-bold">
                        <span className="flex items-center gap-1">
                          <Calculator className="w-3.5 h-3.5" />
                          Sum: {parsedEdit.formattedExpression}
                        </span>
                        <span>= {formatETB(parsedEdit.total)}</span>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Date & Time */}
              <div>
                <label className="text-[10px] text-slate-500 dark:text-[#8899BB] font-mono block mb-1">DATE & TIME</label>
                <input
                  type="datetime-local"
                  required
                  value={editForm.date}
                  onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-[#0A0E1A] border border-slate-200 dark:border-[#1E2D40] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 dark:focus:border-[#00D4AA]"
                />
              </div>

              {/* Wallet Select */}
              <div>
                <label className="text-[10px] text-slate-500 dark:text-[#8899BB] font-mono block mb-1">WALLET</label>
                <select
                  value={editForm.walletId}
                  onChange={(e) => setEditForm(prev => ({ ...prev, walletId: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-[#0A0E1A] border border-slate-200 dark:border-[#1E2D40] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 dark:focus:border-[#00D4AA]"
                >
                  {wallets.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.currency})
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="text-[10px] text-slate-500 dark:text-[#8899BB] font-mono block mb-1">CATEGORY</label>
                <input
                  type="text"
                  required
                  value={editForm.category}
                  onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="Category name"
                  className="w-full bg-slate-50 dark:bg-[#0A0E1A] border border-slate-200 dark:border-[#1E2D40] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 dark:focus:border-[#00D4AA]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] text-slate-500 dark:text-[#8899BB] font-mono block mb-1">DESCRIPTION</label>
                <input
                  type="text"
                  required
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Notes or details"
                  className="w-full bg-slate-50 dark:bg-[#0A0E1A] border border-slate-200 dark:border-[#1E2D40] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 dark:focus:border-[#00D4AA]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-[#1C2333] text-xs font-bold text-slate-600 dark:text-[#8899BB] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#00D4AA] to-[#00B894] text-xs font-bold text-[#0A0E1A] cursor-pointer shadow-lg hover:brightness-110"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {confirmDeleteTxId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-black/80 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#131926] border border-rose-200 dark:border-red-500/40 max-w-xs w-full p-4 rounded-2xl text-center space-y-3 shadow-xl">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 dark:bg-red-500/20 dark:text-red-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Delete Ledger Entry?</h4>
            <p className="text-xs text-slate-500 dark:text-[#8899BB]">
              Are you sure you want to delete this transaction? This action will remove it from ledger calculation.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setConfirmDeleteTxId(null)}
                className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-[#1C2333] text-xs font-bold text-slate-600 dark:text-[#8899BB]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2 rounded-xl bg-rose-600 text-xs font-bold text-white hover:bg-rose-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

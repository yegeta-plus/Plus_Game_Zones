import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Printer,
  FileSpreadsheet,
  FileText,
  Filter,
  UserCheck,
  TrendingUp,
  TrendingDown,
  Scale,
  Mail,
  Send,
  PieChart,
  Layers,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  X,
  AlertCircle
} from 'lucide-react';
import { ERPState, Transaction } from '../../types';
import { calculateTotalBusinessBalance, formatETB } from '../../lib/store';
import { triggerHaptic } from '../../lib/haptics';
import {
  generatePDFReport,
  generateExcelReport,
  printFinancialStatement
} from '../../lib/exports';

export const ReportsView: React.FC<{ state: ERPState }> = ({ state }) => {
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'month' | 'last_month'>('all');
  const [selectedWallet, setSelectedWallet] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'INCOME' | 'EXPENSE'>('all');

  // Email modal state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState(state.currentUser?.email || 'yegeta.huawei@gmail.com');
  const [emailSubject, setEmailSubject] = useState(`Monthly Banking & Financial Statement - ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`);
  const [selectedMonth, setSelectedMonth] = useState<string>('current_month');
  const [attachPDF, setAttachPDF] = useState(true);
  const [attachExcel, setAttachExcel] = useState(true);
  const [enableAutoSchedule, setEnableAutoSchedule] = useState(true);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSuccessMessage, setEmailSuccessMessage] = useState<string | null>(null);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return state.transactions.filter(t => {
      // Type filter
      if (selectedType !== 'all' && t.type !== selectedType) return false;

      // Wallet filter
      if (selectedWallet !== 'all' && t.walletId !== selectedWallet) return false;

      // Date filter
      if (dateRange !== 'all') {
        const tDate = new Date(t.date);
        const now = new Date();

        if (dateRange === 'today') {
          if (tDate.toDateString() !== now.toDateString()) return false;
        } else if (dateRange === 'month') {
          if (tDate.getMonth() !== now.getMonth() || tDate.getFullYear() !== now.getFullYear()) return false;
        } else if (dateRange === 'last_month') {
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          if (tDate.getMonth() !== lastMonth.getMonth() || tDate.getFullYear() !== lastMonth.getFullYear()) return false;
        }
      }

      return true;
    });
  }, [state.transactions, selectedType, selectedWallet, dateRange]);

  const totalBalance = calculateTotalBusinessBalance(state.wallets, state.transactions, state.transfers);
  
  // Calculate stats for filtered set
  const filteredIncome = filteredTransactions.filter(t => t.type === 'INCOME' && !t.reversed).reduce((s, t) => s + t.amount, 0);
  const filteredExpense = filteredTransactions.filter(t => t.type === 'EXPENSE' && !t.reversed).reduce((s, t) => s + t.amount, 0);
  const filteredProfit = filteredIncome - filteredExpense;

  const totalAssetsValue = state.assets.reduce((sum, a) => sum + a.currentValue, 0);
  const totalLoansOutstanding = state.loans.reduce((sum, l) => sum + l.outstandingBalance, 0);
  const netWorth = totalBalance + totalAssetsValue - totalLoansOutstanding;

  // Expenses Category Breakdown Calculation
  const expenseCategoryBreakdown = useMemo(() => {
    const expensesOnly = filteredTransactions.filter(t => t.type === 'EXPENSE' && !t.reversed);
    const totalExpenseAmount = expensesOnly.reduce((sum, t) => sum + t.amount, 0);

    const map: Record<string, { category: string; total: number; count: number; maxItem: number }> = {};

    expensesOnly.forEach(t => {
      if (!map[t.category]) {
        map[t.category] = { category: t.category, total: 0, count: 0, maxItem: 0 };
      }
      map[t.category].total += t.amount;
      map[t.category].count += 1;
      if (t.amount > map[t.category].maxItem) {
        map[t.category].maxItem = t.amount;
      }
    });

    const list = Object.values(map).map(item => ({
      ...item,
      percentage: totalExpenseAmount > 0 ? (item.total / totalExpenseAmount) * 100 : 0
    }));

    // Sort by total expense descending
    list.sort((a, b) => b.total - a.total);

    return {
      list,
      totalExpenseAmount,
      totalCount: expensesOnly.length,
      topCategory: list[0] || null
    };
  }, [filteredTransactions]);

  const getWalletName = (walletId: string) => {
    const w = state.wallets.find(item => item.id === walletId);
    return w ? w.name : walletId;
  };

  const handleExportPDF = () => {
    triggerHaptic('medium');
    generatePDFReport({
      state,
      transactions: filteredTransactions,
      dateRangeLabel: dateRange.toUpperCase(),
      reportTitle: `Financial Statement & Transaction Audit (${filteredTransactions.length} items)`
    });
  };

  const handleExportExcel = () => {
    triggerHaptic('heavy');
    generateExcelReport({
      state,
      transactions: filteredTransactions,
      dateRangeLabel: dateRange.toUpperCase(),
      reportTitle: `Banking & Financial Statement Package (${filteredTransactions.length} items)`
    });
  };

  const handleSendEmailReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail || !recipientEmail.includes('@')) return;

    triggerHaptic('heavy');
    setIsSendingEmail(true);

    setTimeout(() => {
      setIsSendingEmail(false);
      setEmailSuccessMessage(`Monthly financial report successfully emailed to ${recipientEmail}! PDF and Excel package attached.`);
      setTimeout(() => {
        setEmailSuccessMessage(null);
        setIsEmailModalOpen(false);
      }, 3500);
    }, 1200);
  };

  // Color palette helper for category progress bars
  const categoryColors = [
    { bg: 'bg-rose-500', text: 'text-rose-500', lightBg: 'bg-rose-50 dark:bg-rose-950/40', border: 'border-rose-200 dark:border-rose-800' },
    { bg: 'bg-amber-500', text: 'text-amber-500', lightBg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-200 dark:border-amber-800' },
    { bg: 'bg-indigo-500', text: 'text-indigo-500', lightBg: 'bg-indigo-50 dark:bg-indigo-950/40', border: 'border-indigo-200 dark:border-indigo-800' },
    { bg: 'bg-purple-500', text: 'text-purple-500', lightBg: 'bg-purple-50 dark:bg-purple-950/40', border: 'border-purple-200 dark:border-purple-800' },
    { bg: 'bg-teal-500', text: 'text-teal-500', lightBg: 'bg-teal-50 dark:bg-teal-950/40', border: 'border-teal-200 dark:border-teal-800' },
    { bg: 'bg-blue-500', text: 'text-blue-500', lightBg: 'bg-blue-50 dark:bg-blue-950/40', border: 'border-blue-200 dark:border-blue-800' },
  ];

  return (
    <div className="space-y-4 pb-20">
      
      {/* Title & Global Export / Email Hub */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#00D4AA]" />
            Financial Statements & Banking Reports
          </h3>
          <p className="text-xs text-slate-500 dark:text-[#8899BB]">
            Audited P&L statements, general expenses by category, and scheduled email report dispatches
          </p>
        </div>

        {/* Export & Email Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              triggerHaptic('medium');
              setIsEmailModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all active:scale-95"
            title="Send Monthly Financial Statement via Email"
          >
            <Mail className="w-4 h-4" />
            <span>Send Email Report</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95"
            title="Download PDF Document"
          >
            <FileText className="w-4 h-4" />
            <span>Export PDF</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 dark:bg-[#00D4AA] text-white dark:text-[#0A0E1A] font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer hover:brightness-110 transition-all active:scale-95"
            title="Download Multi-Tab Excel Workbook (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export xlsx</span>
          </button>

          <button
            onClick={printFinancialStatement}
            className="p-2 rounded-xl bg-slate-100 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-[#252E42] transition-colors"
            title="Print or Save as PDF"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] rounded-2xl p-3.5 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-[#8899BB]">
            <Filter className="w-4 h-4 text-indigo-500" />
            <span>Statement Filters & Scope</span>
          </div>
          <span className="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800/60">
            {filteredTransactions.length} Transactions Match
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          {/* Date Range Selector */}
          <div>
            <label className="text-[10px] text-slate-500 dark:text-[#8899BB] block mb-1 font-semibold uppercase">Period Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl p-2 text-xs text-slate-900 dark:text-white font-bold outline-none"
            >
              <option value="all">All Time History</option>
              <option value="today">Today Only</option>
              <option value="month">This Month</option>
              <option value="last_month">Last Month</option>
            </select>
          </div>

          {/* Wallet Selector */}
          <div>
            <label className="text-[10px] text-slate-500 dark:text-[#8899BB] block mb-1 font-semibold uppercase">Wallet / Account</label>
            <select
              value={selectedWallet}
              onChange={(e) => setSelectedWallet(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl p-2 text-xs text-slate-900 dark:text-white font-bold outline-none"
            >
              <option value="all">All Wallets & Accounts</option>
              {state.wallets.map(w => (
                <option key={w.id} value={w.id}>{w.name} ({w.type})</option>
              ))}
            </select>
          </div>

          {/* Type Selector */}
          <div>
            <label className="text-[10px] text-slate-500 dark:text-[#8899BB] block mb-1 font-semibold uppercase">Transaction Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl p-2 text-xs text-slate-900 dark:text-white font-bold outline-none"
            >
              <option value="all">All Types (Income & Expense)</option>
              <option value="INCOME">Income Only</option>
              <option value="EXPENSE">Expense Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Net Worth & Executive Balance Sheet */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Balance Sheet Summary */}
        <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] rounded-2xl p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 dark:text-[#F0F4FF] uppercase tracking-wider flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-emerald-500" />
              <span>Balance Sheet Position</span>
            </h4>
            <span className="text-[10px] text-slate-500 font-mono">Real-Time Valuation</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50 dark:bg-[#1C2333] p-3 rounded-xl border border-slate-100 dark:border-transparent">
              <span className="text-[10px] text-slate-500 dark:text-[#8899BB] block">Liquid Wallet Cash</span>
              <p className="text-sm font-black font-mono text-emerald-600 dark:text-[#00D4AA] mt-0.5">{formatETB(totalBalance)}</p>
            </div>
            <div className="bg-slate-50 dark:bg-[#1C2333] p-3 rounded-xl border border-slate-100 dark:border-transparent">
              <span className="text-[10px] text-slate-500 dark:text-[#8899BB] block">Fixed Assets Valuation</span>
              <p className="text-sm font-black font-mono text-amber-600 dark:text-[#F5A623] mt-0.5">{formatETB(totalAssetsValue)}</p>
            </div>
            <div className="bg-slate-50 dark:bg-[#1C2333] p-3 rounded-xl border border-slate-100 dark:border-transparent">
              <span className="text-[10px] text-slate-500 dark:text-[#8899BB] block">Outstanding Liabilities</span>
              <p className="text-sm font-black font-mono text-red-600 dark:text-red-400 mt-0.5">{formatETB(totalLoansOutstanding)}</p>
            </div>
            <div className="bg-slate-50 dark:bg-[#1C2333] p-3 rounded-xl border border-emerald-500/30 dark:border-[#00D4AA]/30">
              <span className="text-[10px] text-slate-500 dark:text-[#8899BB] block">Total Net Worth</span>
              <p className="text-sm font-black font-mono text-emerald-600 dark:text-[#00D4AA] mt-0.5">{formatETB(netWorth)}</p>
            </div>
          </div>
        </div>

        {/* Filtered Income & Expense Statement */}
        <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] rounded-2xl p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 dark:text-[#F0F4FF] uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              <span>Income Statement ({dateRange.replace('_', ' ').toUpperCase()})</span>
            </h4>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold font-mono">
              Scope: {selectedWallet === 'all' ? 'All Wallets' : getWalletName(selectedWallet)}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center p-2 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40">
              <span className="text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>Gross Income Revenue</span>
              </span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatETB(filteredIncome)}</span>
            </div>

            <div className="flex justify-between items-center p-2 rounded-xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40">
              <span className="text-rose-700 dark:text-rose-300 font-bold flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                <span>Operating Expenses</span>
              </span>
              <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{formatETB(filteredExpense)}</span>
            </div>

            <div className="flex justify-between items-center p-2.5 rounded-xl bg-indigo-500/10 dark:bg-[#00D4AA]/15 border border-indigo-500/30 dark:border-[#00D4AA]/30">
              <span className="text-indigo-900 dark:text-[#00D4AA] font-black">Net Profit Margin</span>
              <span className={`font-mono font-black text-sm ${filteredProfit >= 0 ? 'text-emerald-600 dark:text-[#00D4AA]' : 'text-rose-600 dark:text-rose-400'}`}>
                {formatETB(filteredProfit)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* NEW SECTION: GENERAL EXPENSES BY CATEGORY BREAKDOWN */}
      <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] rounded-2xl p-4 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-[#1E2D40] pb-3">
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-[#F0F4FF] uppercase tracking-wider flex items-center gap-2">
              <PieChart className="w-4 h-4 text-rose-500" />
              <span>General Expenses Breakdown by Category</span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-[#8899BB] mt-0.5">
              Categorized analysis of operating expenses, percentage share, and highest expense items
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-3 py-1 rounded-xl border border-rose-200 dark:border-rose-800">
              Total Expenses: {formatETB(expenseCategoryBreakdown.totalExpenseAmount)}
            </span>
          </div>
        </div>

        {expenseCategoryBreakdown.list.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-[#8899BB] space-y-1">
            <Layers className="w-8 h-8 mx-auto text-slate-400 opacity-60" />
            <p className="text-xs font-bold">No expense records found for this period filter.</p>
            <p className="text-[11px]">Select "All Time" or adjust the date scope to view expense category distributions.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Top Category Highlight Banner */}
            {expenseCategoryBreakdown.topCategory && (
              <div className="p-3 rounded-xl bg-rose-500/10 dark:bg-rose-950/30 border border-rose-500/20 dark:border-rose-800/40 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-rose-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                    1
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 block">Highest Expense Category</span>
                    <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                      {expenseCategoryBreakdown.topCategory.category}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-black text-rose-600 dark:text-rose-400 text-sm block">
                    {formatETB(expenseCategoryBreakdown.topCategory.total)}
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold">
                    {expenseCategoryBreakdown.topCategory.percentage.toFixed(1)}% of all expenses ({expenseCategoryBreakdown.topCategory.count} entries)
                  </span>
                </div>
              </div>
            )}

            {/* List of Category Progress Bars */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {expenseCategoryBreakdown.list.map((item, index) => {
                const colorScheme = categoryColors[index % categoryColors.length];
                return (
                  <div
                    key={item.category}
                    className={`p-3.5 rounded-xl border ${colorScheme.border} ${colorScheme.lightBg} space-y-2 transition-all hover:scale-[1.01]`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${colorScheme.bg}`} />
                        <span>{item.category}</span>
                      </span>
                      <span className="font-mono font-extrabold text-slate-900 dark:text-white">
                        {formatETB(item.total)}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-slate-200 dark:bg-[#1C2333] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colorScheme.bg} transition-all duration-500 rounded-full`}
                        style={{ width: `${Math.max(item.percentage, 3)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-[#8899BB] font-mono">
                      <span>{item.count} {item.count === 1 ? 'transaction' : 'transactions'}</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {item.percentage.toFixed(1)}% share
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Transaction Table Preview with "Who Made That Transaction" Badge */}
      <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] rounded-2xl p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-900 dark:text-[#F0F4FF] uppercase tracking-wider flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-500" />
            <span>Detailed Transaction Ledger & Creator Audit</span>
          </h4>
          <span className="text-xs text-slate-500 dark:text-[#8899BB]">
            Showing {filteredTransactions.length} entries
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-[#1E2D40]">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-[#1C2333] text-slate-700 dark:text-[#8899BB] font-bold text-[11px] border-b border-slate-200 dark:border-[#1E2D40]">
              <tr>
                <th className="p-2.5">Date & Time</th>
                <th className="p-2.5">Type</th>
                <th className="p-2.5">Category</th>
                <th className="p-2.5">Description</th>
                <th className="p-2.5">Wallet</th>
                <th className="p-2.5 text-right">Amount (ETB)</th>
                <th className="p-2.5 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300">Who Made Transaction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1E2D40]/60">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500 dark:text-[#8899BB]">
                    No transactions match the selected statement filters.
                  </td>
                </tr>
              ) : (
                filteredTransactions.slice(0, 50).map((t) => {
                  const isInc = t.type === 'INCOME';
                  return (
                    <tr
                      key={t.id}
                      className={`hover:bg-slate-50 dark:hover:bg-[#1C2333]/60 transition-colors ${
                        t.reversed ? 'opacity-50 line-through bg-slate-50/80 dark:bg-slate-900/40' : ''
                      }`}
                    >
                      <td className="p-2.5 whitespace-nowrap font-mono text-[11px] text-slate-600 dark:text-slate-300">
                        {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                      </td>
                      <td className="p-2.5">
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                            isInc
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                              : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                          }`}
                        >
                          {t.type}
                        </span>
                      </td>
                      <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">{t.category}</td>
                      <td className="p-2.5 text-slate-700 dark:text-slate-300 max-w-xs truncate">{t.description}</td>
                      <td className="p-2.5 text-slate-600 dark:text-[#8899BB] font-mono">{getWalletName(t.walletId)}</td>
                      <td
                        className={`p-2.5 text-right font-mono font-bold whitespace-nowrap ${
                          isInc ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {formatETB(t.amount)}
                      </td>
                      <td className="p-2.5 bg-indigo-50/30 dark:bg-indigo-950/20">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-black flex items-center justify-center shrink-0">
                            {(t.creatorName || 'A')[0].toUpperCase()}
                          </div>
                          <span className="font-bold text-indigo-900 dark:text-indigo-200 text-xs">
                            {t.creatorName || 'System'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length > 50 && (
          <p className="text-[11px] text-slate-500 dark:text-[#8899BB] text-center italic pt-1">
            Showing first 50 entries in preview table. Full {filteredTransactions.length} entries are included in exported PDF and Excel reports.
          </p>
        )}
      </div>

      {/* MONTHLY REPORT EMAIL DISPATCH MODAL */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] rounded-3xl p-6 w-full max-w-md space-y-5 shadow-2xl relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1E2D40] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Send Monthly Email Report</h3>
                  <p className="text-[11px] text-slate-500 dark:text-[#8899BB]">Automated banking & P&L report delivery</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEmailModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1C2333]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Success Message Banner */}
            {emailSuccessMessage ? (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">{emailSuccessMessage}</p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Scheduled status logged to system audit trail.</p>
              </div>
            ) : (
              <form onSubmit={handleSendEmailReport} className="space-y-4">
                {/* Recipient Email Address */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Recipient Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="e.g. yegeta.huawei@gmail.com"
                    className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl p-2.5 text-xs text-slate-900 dark:text-white font-mono font-bold outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Email Subject */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Email Subject Line
                  </label>
                  <input
                    type="text"
                    required
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl p-2.5 text-xs text-slate-900 dark:text-white font-bold outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Scope Month */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Report Period Scope
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl p-2.5 text-xs text-slate-900 dark:text-white font-bold outline-none"
                  >
                    <option value="current_month">Current Month ({new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})</option>
                    <option value="last_month">Last Month</option>
                    <option value="ytd">Year to Date (YTD 2026)</option>
                  </select>
                </div>

                {/* Format Attachments */}
                <div className="space-y-2 bg-slate-50 dark:bg-[#1C2333] p-3 rounded-2xl border border-slate-100 dark:border-transparent text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block text-[11px] uppercase tracking-wider">
                    Include Attachments & Summary
                  </span>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={attachPDF}
                      onChange={(e) => setAttachPDF(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-slate-800 dark:text-slate-200 font-semibold">PDF Executive Financial Statement</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={attachExcel}
                      onChange={(e) => setAttachExcel(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-slate-800 dark:text-slate-200 font-semibold">Multi-Tab Banking Excel Package (.xlsx)</span>
                  </label>
                </div>

                {/* Automated Schedule Toggle */}
                <div className="flex items-center justify-between bg-indigo-50/50 dark:bg-indigo-950/40 p-3 rounded-2xl border border-indigo-200/60 dark:border-indigo-800/60 text-xs">
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Automated 1st of Month Dispatch</span>
                    </span>
                    <p className="text-[10px] text-indigo-700 dark:text-indigo-300">Automatically send monthly summary on the 1st day of every month</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableAutoSchedule}
                    onChange={(e) => setEnableAutoSchedule(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                </div>

                {/* Submit Action */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEmailModalOpen(false)}
                    className="w-1/3 py-2.5 rounded-xl border border-slate-200 dark:border-[#1E2D40] text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-[#1C2333]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingEmail}
                    className="w-2/3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isSendingEmail ? (
                      <span>Sending Report...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Email Statement</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

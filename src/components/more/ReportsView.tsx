import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart3,
  Printer,
  FileSpreadsheet,
  FileText,
  Filter,
  TrendingUp,
  TrendingDown,
  Scale,
  Mail,
  Send,
  PieChart,
  Layers,
  CheckCircle2,
  Clock,
  ChevronRight,
  X,
  AlertCircle,
  ShieldCheck,
  Eye,
  History,
  Users,
  RefreshCw
} from 'lucide-react';
import { ERPState, SentReportEmailLog } from '../../types';
import { calculateTotalBusinessBalance, formatETB, calculateWalletBalance } from '../../lib/store';
import { triggerHaptic } from '../../lib/haptics';
import {
  generatePDFReport,
  generateExcelReport,
  printFinancialStatement
} from '../../lib/exports';

interface ReportsViewProps {
  state: ERPState;
  onUpdateState?: (fn: (prev: ERPState) => ERPState) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ state, onUpdateState }) => {
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'month' | 'last_month'>('all');
  const [selectedWallet, setSelectedWallet] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'INCOME' | 'EXPENSE'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [includeCoverPage, setIncludeCoverPage] = useState<boolean>(true);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [groupBy, setGroupBy] = useState<'NONE' | 'CATEGORY' | 'PAYMENT_METHOD' | 'USER' | 'BRANCH' | 'DAY' | 'MONTH'>('NONE');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Email modal & automated schedule state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailModalTab, setEmailModalTab] = useState<'SCHEDULE' | 'PREVIEW' | 'LOGS'>('SCHEDULE');
  const [attachPDF, setAttachPDF] = useState(state.automatedEmailReportsSettings?.includePdfAttachment ?? true);
  const [attachExcel, setAttachExcel] = useState(state.automatedEmailReportsSettings?.includeExcelAttachment ?? true);
  const [autoScheduleActive, setAutoScheduleActive] = useState(state.automatedEmailReportsSettings?.enabled ?? true);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSuccessMessage, setEmailSuccessMessage] = useState<string | null>(null);
  const [emailErrorMessage, setEmailErrorMessage] = useState<string | null>(null);
  
  // HTML Template Preview state
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Filter eligible recipients strictly to Admin and SuperUser roles
  const eligibleAdminSuperusers = useMemo(() => {
    return (state.users || []).filter(u => {
      const role = (u.role || '').toLowerCase();
      return (role === 'superadmin' || role === 'admin') && u.active !== false;
    });
  }, [state.users]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return state.transactions.filter(t => {
      if (selectedType !== 'all' && t.type !== selectedType) return false;
      if (selectedWallet !== 'all' && t.walletId !== selectedWallet) return false;
      if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
      if (selectedUser !== 'all' && (t.creatorName || 'System') !== selectedUser) return false;

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
  }, [state.transactions, selectedType, selectedWallet, selectedCategory, selectedUser, dateRange]);

  const activeFilterCount = (dateRange !== 'all' ? 1 : 0) +
    (selectedWallet !== 'all' ? 1 : 0) +
    (selectedType !== 'all' ? 1 : 0) +
    (selectedCategory !== 'all' ? 1 : 0) +
    (selectedUser !== 'all' ? 1 : 0);

  const resetFilters = () => {
    setDateRange('all');
    setSelectedWallet('all');
    setSelectedType('all');
    setSelectedCategory('all');
    setSelectedUser('all');
    setIncludeCoverPage(true);
    setOrientation('landscape');
    setGroupBy('NONE');
  };

  const totalBalance = calculateTotalBusinessBalance(state.wallets, state.transactions, state.transfers);
  
  // Calculate stats for filtered set
  const filteredIncome = filteredTransactions.filter(t => t.type === 'INCOME' && !t.reversed).reduce((s, t) => s + t.amount, 0);
  const filteredExpense = filteredTransactions.filter(t => t.type === 'EXPENSE' && !t.reversed).reduce((s, t) => s + t.amount, 0);
  const filteredProfit = filteredIncome - filteredExpense;

  const totalAssetsValue = state.assets.reduce((sum, a) => sum + a.currentValue, 0);
  const totalLoansOutstanding = state.loans.reduce((sum, l) => sum + l.outstandingBalance, 0);
  const netWorth = totalBalance + totalAssetsValue - totalLoansOutstanding;

  // Receivables summary
  const totalReceivablesOwed = state.receivables.filter(r => r.status === 'OUTSTANDING').reduce((s, r) => s + (r.amountOwed - (r.amountCollected || 0)), 0);
  const overdueReceivables = state.receivables.filter(r => r.status === 'OUTSTANDING' && new Date(r.dueDate) < new Date()).reduce((s, r) => s + (r.amountOwed - (r.amountCollected || 0)), 0);

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
      reportTitle: `Financial Statement & Transaction Audit (${filteredTransactions.length} items)`,
      includeCoverPage,
      orientation,
      groupBy
    });
  };

  const handleExportExcel = () => {
    triggerHaptic('heavy');
    generateExcelReport({
      state,
      transactions: filteredTransactions,
      dateRangeLabel: dateRange.toUpperCase(),
      reportTitle: `Banking & Financial Statement Package (${filteredTransactions.length} items)`,
      groupBy
    });
  };

  // Build report payload for backend API
  const buildReportPayload = () => {
    const now = new Date();
    const currentMonthIncome = state.transactions
      .filter(t => t.type === 'INCOME' && !t.reversed && new Date(t.date).getMonth() === now.getMonth())
      .reduce((s, t) => s + t.amount, 0);
    const currentMonthExpense = state.transactions
      .filter(t => t.type === 'EXPENSE' && !t.reversed && new Date(t.date).getMonth() === now.getMonth())
      .reduce((s, t) => s + t.amount, 0);

    const walletsPayload = state.wallets.map(w => ({
      name: w.name,
      type: w.type,
      balance: calculateWalletBalance(w, state.transactions, state.transfers),
      accountNumber: w.accountNumber
    }));

    const topCategoriesPayload = expenseCategoryBreakdown.list.slice(0, 5).map(c => ({
      name: c.category,
      amount: c.total,
      percentage: c.percentage
    }));

    const activeEqubVolume = state.equbs.filter(e => e.status === 'ACTIVE').reduce((s, e) => s + e.contributionAmount * e.membersCount, 0);

    return {
      periodLabel: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      periodKey: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      totalBalance,
      monthlyIncome: currentMonthIncome || filteredIncome,
      monthlyExpense: currentMonthExpense || filteredExpense,
      netProfit: (currentMonthIncome || filteredIncome) - (currentMonthExpense || filteredExpense),
      wallets: walletsPayload,
      receivables: {
        totalOwed: totalReceivablesOwed,
        outstandingCount: state.receivables.filter(r => r.status === 'OUTSTANDING').length,
        overdueAmount: overdueReceivables
      },
      loans: {
        totalBorrowed: totalLoansOutstanding,
        totalLent: 0,
        activeCount: state.loans.filter(l => l.status === 'ACTIVE').length
      },
      equbs: {
        activeCircles: state.equbs.filter(e => e.status === 'ACTIVE').length,
        monthlyVolume: activeEqubVolume
      },
      topExpenseCategories: topCategoriesPayload,
      recipients: eligibleAdminSuperusers.map(u => ({
        name: u.name,
        email: u.email || `${u.username || 'admin'}@pluszone.et`,
        role: u.role
      }))
    };
  };

  // Fetch HTML preview from server
  const loadHtmlPreview = async () => {
    try {
      setIsLoadingPreview(true);
      const payload = buildReportPayload();
      const res = await fetch('/api/reports/preview-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.html) {
        setPreviewHtml(data.html);
      }
    } catch (err) {
      console.error('Failed to load email HTML preview:', err);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  useEffect(() => {
    if (isEmailModalOpen && emailModalTab === 'PREVIEW') {
      loadHtmlPreview();
    }
  }, [isEmailModalOpen, emailModalTab]);

  // Trigger immediate dispatch
  const handleSendEmailReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (eligibleAdminSuperusers.length === 0) {
      setEmailErrorMessage('No Admin or SuperUser accounts found with valid email addresses.');
      return;
    }

    triggerHaptic('heavy');
    setIsSendingEmail(true);
    setEmailErrorMessage(null);
    setEmailSuccessMessage(null);

    try {
      const payload = buildReportPayload();
      const res = await fetch('/api/reports/send-monthly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          triggerType: 'MANUAL_DISPATCH'
        })
      });

      const data = await res.json();

      if (!res.ok || data.status === 'error') {
        throw new Error(data.error || 'Failed to dispatch monthly email report');
      }

      const log = data.data?.log;
      const recipientCount = eligibleAdminSuperusers.length;

      // Update state if log exists
      if (log && onUpdateState) {
        onUpdateState(prev => ({
          ...prev,
          sentReportEmailLogs: [log, ...(prev.sentReportEmailLogs || [])],
          automatedEmailReportsSettings: {
            ...(prev.automatedEmailReportsSettings || {
              enabled: true,
              dayOfMonth: 2,
              sendHourEAT: 8,
              roles: ['SuperAdmin', 'Admin']
            }),
            lastSentPeriod: payload.periodLabel,
            lastSentTimestamp: new Date().toISOString()
          }
        }));
      }

      setEmailSuccessMessage(
        `Monthly financial report dispatched successfully to ${recipientCount} Admin & SuperUser account(s)!`
      );

      setTimeout(() => {
        setEmailSuccessMessage(null);
      }, 5000);
    } catch (err: any) {
      console.error('Email dispatch error:', err);
      setEmailErrorMessage(err.message || 'An error occurred during report dispatch.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const logsList: SentReportEmailLog[] = state.sentReportEmailLogs || [];

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
            Audited P&L statements, general expenses by category, and automated 2nd-of-month email report schedules
          </p>
        </div>

        {/* Export & Email Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              triggerHaptic('medium');
              setEmailModalTab('SCHEDULE');
              setIsEmailModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all active:scale-95"
            title="Automated Monthly Email Schedule (2nd of Every Month)"
          >
            <Mail className="w-4 h-4" />
            <span>Monthly Email Hub</span>
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

      {/* PROMINENT AUTOMATED MONTHLY REPORT EMAIL SCHEDULE BANNER */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 border border-indigo-500/40 rounded-2xl p-4 sm:p-5 text-white shadow-lg space-y-3 relative overflow-hidden animate-fadeIn">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 flex items-center justify-center shrink-0 shadow-inner">
              <Mail className="w-5 h-5 text-[#00D4AA]" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-black text-white tracking-wide">
                  Automated Monthly Executive Financial Statement
                </h4>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#00D4AA]/20 text-[#00D4AA] border border-[#00D4AA]/40 px-2 py-0.5 rounded-full">
                  <Clock className="w-3 h-3" /> Every 2nd of Month
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-400/40 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3" /> Admin & SuperUser Only
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                Automatic monthly P&L balance sheet, wallet breakdown, and receivables summary auto-dispatched on every month’s <strong>2nd day at 08:00 AM EAT</strong> exclusively to verified Admin and SuperUser accounts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                triggerHaptic('light');
                setEmailModalTab('PREVIEW');
                setIsEmailModalOpen(true);
              }}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-[#00D4AA]" />
              <span>Preview Email</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic('medium');
                setEmailModalTab('SCHEDULE');
                setIsEmailModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-[#00D4AA] hover:bg-[#00D4AA]/90 text-[#0A0E1A] text-xs font-black flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Trigger Dispatch</span>
            </button>
          </div>
        </div>

        {/* Audience List & Notice */}
        <div className="pt-2 border-t border-indigo-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-indigo-300">Authorized Recipients:</span>
            {eligibleAdminSuperusers.map(u => (
              <span
                key={u.id}
                className="inline-flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 text-slate-200 px-2.5 py-0.5 rounded-lg text-[11px] font-mono"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <strong>{u.name}</strong>
                <span className="text-[10px] text-purple-300 bg-purple-950/60 px-1 py-0.2 rounded font-sans">
                  {u.role}
                </span>
                <span className="text-slate-400 text-[10px]">({u.email || 'email configured'})</span>
              </span>
            ))}
          </div>

          <div className="text-[10px] text-slate-400 italic">
            * Partners & Viewers excluded from automated executive statements
          </div>
        </div>
      </div>

      {/* Filter Toolbar Header with Icon Button */}
      <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] rounded-2xl p-3.5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter Icon Trigger Button */}
          <button
            onClick={() => {
              triggerHaptic('light');
              setIsFilterModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <Filter className="w-4 h-4 text-indigo-500" />
            <span>Filter Statements</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-mono text-[10px] flex items-center justify-center font-extrabold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Active Filter Pills */}
          {dateRange !== 'all' && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-slate-100 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] px-2.5 py-1 rounded-lg text-slate-800 dark:text-slate-200">
              Period: {dateRange.replace('_', ' ').toUpperCase()}
              <button onClick={() => setDateRange('all')} className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer ml-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedWallet !== 'all' && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-slate-100 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] px-2.5 py-1 rounded-lg text-slate-800 dark:text-slate-200">
              Wallet: {getWalletName(selectedWallet)}
              <button onClick={() => setSelectedWallet('all')} className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer ml-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedType !== 'all' && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-slate-100 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] px-2.5 py-1 rounded-lg text-slate-800 dark:text-slate-200">
              Type: {selectedType}
              <button onClick={() => setSelectedType('all')} className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer ml-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedCategory !== 'all' && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-slate-100 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] px-2.5 py-1 rounded-lg text-slate-800 dark:text-slate-200">
              Cat: {selectedCategory}
              <button onClick={() => setSelectedCategory('all')} className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer ml-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {activeFilterCount > 0 && (
            <button
              onClick={() => {
                triggerHaptic('light');
                resetFilters();
              }}
              className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer ml-1"
            >
              Reset All
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800/60 shrink-0">
            {filteredTransactions.length} Match
          </span>
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

      {/* GENERAL EXPENSES BY CATEGORY BREAKDOWN */}
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
                  <span className="text-[10px] text-slate-500 dark:text-[#8899BB]">
                    {expenseCategoryBreakdown.topCategory.percentage.toFixed(1)}% of total expenses ({expenseCategoryBreakdown.topCategory.count} txns)
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2 pt-1">
              {expenseCategoryBreakdown.list.map((item, idx) => (
                <div
                  key={item.category}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#1C2333] border border-slate-100 dark:border-transparent space-y-1.5 text-xs hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-slate-200 dark:bg-[#252E42] text-slate-700 dark:text-slate-300 font-mono text-[10px] flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{item.category}</span>
                      <span className="text-[10px] text-slate-400">({item.count} items)</span>
                    </div>

                    <div className="text-right flex items-center gap-3">
                      <span className="text-[11px] font-mono text-slate-500 dark:text-[#8899BB]">
                        {item.percentage.toFixed(1)}%
                      </span>
                      <span className="font-mono font-black text-slate-900 dark:text-white">
                        {formatETB(item.total)}
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-200 dark:bg-[#0A0E1A] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, item.percentage)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FILTER DIALOG MODAL */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] rounded-3xl p-5 w-full max-w-lg space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1E2D40] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Filter className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Filter Financial Statements</h3>
                  <p className="text-[11px] text-slate-500 dark:text-[#8899BB]">Refine scope by wallet, transaction type & category</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsFilterModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1C2333]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Date Scope */}
              <div>
                <label className="text-[11px] font-extrabold text-slate-700 dark:text-[#8899BB] block mb-1.5 uppercase tracking-wider">
                  Date Range
                </label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl p-2.5 text-xs text-slate-900 dark:text-white font-bold outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="all">All Available Records</option>
                  <option value="today">Today Only</option>
                  <option value="month">Current Month ({new Date().toLocaleDateString('en-US', { month: 'short' })})</option>
                  <option value="last_month">Last Month</option>
                </select>
              </div>

              {/* Wallet Filter */}
              <div>
                <label className="text-[11px] font-extrabold text-slate-700 dark:text-[#8899BB] block mb-1.5 uppercase tracking-wider">
                  Wallet / Bank Account
                </label>
                <select
                  value={selectedWallet}
                  onChange={(e) => setSelectedWallet(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl p-2.5 text-xs text-slate-900 dark:text-white font-bold outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="all">All Wallets & Vaults</option>
                  {state.wallets.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({w.type})</option>
                  ))}
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <label className="text-[11px] font-extrabold text-slate-700 dark:text-[#8899BB] block mb-1.5 uppercase tracking-wider">
                  Transaction Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl p-2.5 text-xs text-slate-900 dark:text-white font-bold outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="all">All Types (Income & Expense)</option>
                  <option value="INCOME">Income Only</option>
                  <option value="EXPENSE">Expenses Only</option>
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="text-[11px] font-extrabold text-slate-700 dark:text-[#8899BB] block mb-1.5 uppercase tracking-wider">
                  Specific Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl p-2.5 text-xs text-slate-900 dark:text-white font-bold outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  {state.categories.map(c => (
                    <option key={c.id} value={c.name}>{c.name} ({c.type})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-[#1E2D40] flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  resetFilters();
                }}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E2D40] text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
              >
                Reset All
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('medium');
                  setIsFilterModalOpen(false);
                }}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              >
                Apply ({filteredTransactions.length} Matches)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MONTHLY REPORT AUTOMATED EMAIL DISPATCH & PREVIEW MODAL */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] rounded-3xl p-5 sm:p-6 w-full max-w-2xl max-h-[90vh] flex flex-col space-y-4 shadow-2xl relative overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1E2D40] pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                    Automated Monthly Email Reporting Hub
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-[#8899BB]">
                    Dispatches on the 2nd of each month for Admin & SuperUser roles only
                  </p>
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

            {/* Modal Sub-Tabs: Schedule vs Preview vs Logs */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#0A0E1A] p-1 rounded-xl border border-slate-200 dark:border-[#1E2D40] shrink-0">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setEmailModalTab('SCHEDULE');
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  emailModalTab === 'SCHEDULE'
                    ? 'bg-white dark:bg-[#131926] text-indigo-600 dark:text-[#00D4AA] shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Schedule & Dispatch</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setEmailModalTab('PREVIEW');
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  emailModalTab === 'PREVIEW'
                    ? 'bg-white dark:bg-[#131926] text-indigo-600 dark:text-[#00D4AA] shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Email Layout Preview</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setEmailModalTab('LOGS');
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  emailModalTab === 'LOGS'
                    ? 'bg-white dark:bg-[#131926] text-indigo-600 dark:text-[#00D4AA] shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Dispatch Logs ({logsList.length})</span>
              </button>
            </div>

            {/* TAB 1: SCHEDULE & DISPATCH */}
            {emailModalTab === 'SCHEDULE' && (
              <div className="space-y-4 overflow-y-auto pr-1">
                {/* Success or Error Banner */}
                {emailSuccessMessage && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-1 animate-fadeIn">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
                    <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">{emailSuccessMessage}</p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Statement logged in audit history.</p>
                  </div>
                )}

                {emailErrorMessage && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-center space-y-1 animate-fadeIn">
                    <AlertCircle className="w-6 h-6 text-rose-500 mx-auto" />
                    <p className="text-xs font-bold text-rose-800 dark:text-rose-300">{emailErrorMessage}</p>
                  </div>
                )}

                {/* Automated Schedule Card */}
                <div className="bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                        2nd
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-indigo-950 dark:text-indigo-200">
                          Monthly Automatic Dispatch Schedule
                        </h4>
                        <p className="text-[11px] text-indigo-700 dark:text-indigo-300">
                          Runs on the <strong>2nd day of every month</strong> at 08:00 AM (East Africa Time)
                        </p>
                      </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoScheduleActive}
                        onChange={(e) => {
                          setAutoScheduleActive(e.target.checked);
                          if (onUpdateState) {
                            onUpdateState(prev => ({
                              ...prev,
                              automatedEmailReportsSettings: {
                                ...(prev.automatedEmailReportsSettings || {
                                  enabled: true,
                                  dayOfMonth: 2,
                                  sendHourEAT: 8,
                                  roles: ['SuperAdmin', 'Admin']
                                }),
                                enabled: e.target.checked
                              }
                            }));
                          }
                        }}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">Active</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-indigo-200/60 dark:border-indigo-800/40">
                    <div className="bg-white/60 dark:bg-[#0A0E1A]/60 p-2.5 rounded-xl">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">Scheduled Day:</span>
                      <strong className="text-slate-900 dark:text-white font-mono">2nd of Every Month</strong>
                    </div>
                    <div className="bg-white/60 dark:bg-[#0A0E1A]/60 p-2.5 rounded-xl">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">Target Roles:</span>
                      <strong className="text-purple-600 dark:text-purple-400">SuperAdmin & Admin only</strong>
                    </div>
                  </div>
                </div>

                {/* Recipient List Verification */}
                <div className="bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Admin & SuperUser Recipients ({eligibleAdminSuperusers.length})</span>
                    </span>
                    <span className="text-[10px] text-slate-400">Strict Role Filter</span>
                  </div>

                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {eligibleAdminSuperusers.map(u => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] flex items-center justify-center">
                            {u.name.charAt(0)}
                          </span>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">{u.name}</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                              {u.email || `${u.username}@pluszone.et`}
                            </span>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          {u.role}
                        </span>
                      </div>
                    ))}
                  </div>

                  <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                    Note: Accounts with role 'Partner' or 'Viewer' do not receive these automated executive statements.
                  </p>
                </div>

                {/* Attachments */}
                <div className="bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-2xl p-3.5 space-y-2 text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block text-[11px] uppercase tracking-wider">
                    Attached Statement Formats
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={attachPDF}
                        onChange={(e) => setAttachPDF(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-slate-800 dark:text-slate-200 font-semibold text-xs">PDF Statement Summary</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={attachExcel}
                        onChange={(e) => setAttachExcel(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-slate-800 dark:text-slate-200 font-semibold text-xs">Multi-Tab Excel Package (.xlsx)</span>
                    </label>
                  </div>
                </div>

                {/* Dispatch Trigger Form Action */}
                <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-[#1E2D40]">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Next Auto Trigger: <strong className="text-slate-900 dark:text-white">2nd of Month (08:00 AM)</strong>
                  </div>

                  <button
                    type="button"
                    onClick={handleSendEmailReport}
                    disabled={isSendingEmail}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isSendingEmail ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Sending Monthly Statement...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Dispatch Report Now</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: EMAIL LAYOUT PREVIEW */}
            {emailModalTab === 'PREVIEW' && (
              <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                <div className="flex items-center justify-between bg-slate-50 dark:bg-[#1C2333] p-2.5 rounded-xl text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      HTML Email Statement Template (Admin Edition)
                    </span>
                  </div>
                  <button
                    onClick={loadHtmlPreview}
                    className="text-xs text-indigo-600 dark:text-[#00D4AA] font-bold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Refresh Preview
                  </button>
                </div>

                {isLoadingPreview ? (
                  <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-2">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-500" />
                    <p className="text-xs font-bold">Rendering interactive HTML email layout...</p>
                  </div>
                ) : (
                  <div className="border border-slate-200 dark:border-[#1E2D40] rounded-2xl overflow-hidden bg-white shadow-inner max-h-[500px] overflow-y-auto">
                    <iframe
                      srcDoc={previewHtml}
                      title="Email Preview"
                      className="w-full min-h-[480px] border-0"
                    />
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: DISPATCH AUDIT LOGS */}
            {emailModalTab === 'LOGS' && (
              <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                {logsList.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 dark:text-[#8899BB] space-y-1">
                    <History className="w-8 h-8 mx-auto text-slate-400 opacity-60" />
                    <p className="text-xs font-bold">No past report dispatches logged yet.</p>
                    <p className="text-[11px]">Automatic dispatches on the 2nd of each month will be logged here.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {logsList.map((log, index) => (
                      <div
                        key={log.id || index}
                        className="bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-2xl p-3.5 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-lg font-mono font-bold text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                              {log.period}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {log.triggerType === 'AUTOMATIC_SCHEDULE' ? 'Automated 2nd-of-Month Run' : 'Manual Statement Dispatch'}
                            </span>
                          </div>

                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            log.status === 'DELIVERED'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                              : log.status === 'SIMULATED'
                              ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                              : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                          }`}>
                            {log.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                          <div className="bg-white dark:bg-[#131926] p-2 rounded-xl">
                            <span className="text-[10px] text-slate-400 block">Total Liquidity</span>
                            <strong className="font-mono text-emerald-600 dark:text-[#00D4AA]">
                              {formatETB(log.summary?.totalBalance || 0)}
                            </strong>
                          </div>
                          <div className="bg-white dark:bg-[#131926] p-2 rounded-xl">
                            <span className="text-[10px] text-slate-400 block">Net Profit</span>
                            <strong className="font-mono text-slate-800 dark:text-slate-200">
                              {formatETB(log.summary?.netProfit || 0)}
                            </strong>
                          </div>
                          <div className="bg-white dark:bg-[#131926] p-2 rounded-xl">
                            <span className="text-[10px] text-slate-400 block">Recipients</span>
                            <strong className="text-slate-800 dark:text-slate-200">
                              {log.recipients?.length || 0} Admins
                            </strong>
                          </div>
                          <div className="bg-white dark:bg-[#131926] p-2 rounded-xl">
                            <span className="text-[10px] text-slate-400 block">Dispatched At</span>
                            <strong className="text-slate-600 dark:text-slate-300 font-mono text-[10px]">
                              {new Date(log.sentAt).toLocaleDateString()}
                            </strong>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

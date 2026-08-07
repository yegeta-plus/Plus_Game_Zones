import React, { useMemo } from 'react';
import {
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building2,
  Smartphone,
  Banknote,
  Users,
  Calendar,
  Sparkles,
  PlusCircle,
  ArrowRightLeft,
  ChevronRight,
  ShieldAlert,
  Bell,
  AlertCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  AlertTriangle,
  FileText,
  ArrowUpRight,
  ArrowDownLeft,
  Zap,
  Repeat,
  FileCheck,
  Wallet as WalletIcon,
  Activity,
  Receipt,
  PieChart,
  Layers,
  Coins,
  ShieldCheck,
  Award,
  Landmark,
  ArrowUp,
  ArrowDown,
  Briefcase,
  HelpCircle,
  Gift
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  Wallet,
  Transaction,
  Transfer,
  Equb,
  Loan,
  RecurringTemplate,
  UserProfile,
  Receivable
} from '../../types';
import {
  calculateWalletBalance,
  calculateTotalBusinessBalance,
  calculateMonthlyStats,
  calculateIncomeAverages,
  formatETB
} from '../../lib/store';
import {
  formatEthiopianDate,
  formatDateByCalendar,
  toEthiopianDate,
  evaluatePagumeExemption,
  calculateNextEthiopianDueDate
} from '../../lib/ethiopianCalendar';
import { triggerHaptic } from '../../lib/haptics';

interface DashboardViewProps {
  currentUser: UserProfile;
  wallets: Wallet[];
  transactions: Transaction[];
  transfers: Transfer[];
  equbs: Equb[];
  loans: Loan[];
  recurring: RecurringTemplate[];
  receivables?: Receivable[];
  hideBalances: boolean;
  calendarType?: 'ETHIOPIAN' | 'GREGORIAN';
  onToggleHideBalances: () => void;
  onOpenQuickEntry: () => void;
  onOpenTransferModal: () => void;
  onNavigateTab: (tab: any, subView?: any) => void;
  onAddIncome?: (amount: number, category: string, description: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  wallets,
  transactions,
  transfers,
  equbs,
  loans,
  recurring,
  receivables = [],
  hideBalances,
  calendarType = 'ETHIOPIAN',
  onToggleHideBalances,
  onOpenQuickEntry,
  onOpenTransferModal,
  onNavigateTab,
  onAddIncome
}) => {
  const totalBalance = calculateTotalBusinessBalance(wallets, transactions, transfers);
  const { income, expense, profit } = calculateMonthlyStats(transactions);
  const incomeAverages = calculateIncomeAverages(transactions);

  const today = new Date();
  const ethDate = toEthiopianDate(today);
  const formattedEthDateStr = formatEthiopianDate(today, true);

  // Time-based greeting
  const hour = today.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const formattedGregorianDate = today.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Calculate uncollected receivables total
  const uncollectedReceivablesTotal = useMemo(() => {
    return (receivables || []).reduce((sum, r) => {
      const rem = r.amountOwed - r.amountCollected;
      return sum + (rem > 0 ? rem : 0);
    }, 0);
  }, [receivables]);

  // Calculate active loans total outstanding
  const activeLoansTotal = useMemo(() => {
    return loans
      .filter(l => l.status === 'ACTIVE')
      .reduce((sum, l) => sum + (l.remainingBalance ?? l.outstandingBalance ?? 0), 0);
  }, [loans]);

  // Recharts 7-Day Cash Flow Data
  const chartData = [
    { day: 'Mon', income: 45000, expense: 12000, net: 33000 },
    { day: 'Tue', income: 38000, expense: 28000, net: 10000 },
    { day: 'Wed', income: 52000, expense: 15000, net: 37000 },
    { day: 'Thu', income: 29000, expense: 21000, net: 8000 },
    { day: 'Fri', income: 68000, expense: 34000, net: 34000 },
    { day: 'Sat', income: 84000, expense: 42000, net: 42000 },
    { day: 'Sun', income: 34500, expense: 18000, net: 16500 }
  ];

  // Highest wallet balance for relative progress scaling
  const maxWalletBalance = useMemo(() => {
    const balances = wallets.map(w => Math.max(0, calculateWalletBalance(w, transactions, transfers)));
    return Math.max(...balances, 1);
  }, [wallets, transactions, transfers]);

  // Active items
  const activeEqubs = equbs.filter(e => e.status === 'ACTIVE');
  const activeLoans = loans.filter(l => l.status === 'ACTIVE');

  // Upcoming Financial Agenda list with Pagumē (13th Month) Exemption Engine Guard
  const upcomingAgendaItems = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      amount: number;
      typeLabel: string;
      dateStr: string;
      dateObj: Date;
      color: string;
      direction: 'IN' | 'OUT';
      isExemptInPagume: boolean;
      pagumeReason?: string;
    }> = [];

    const now = new Date();
    const formatYMD = (d: Date) => d.toISOString().split('T')[0];

    equbs.forEach(e => {
      if (e.status === 'ACTIVE') {
        const d = calculateNextEthiopianDueDate(e.startDate || new Date(), e.interval || 'EVERY_10_DAYS');
        const pagumeCheck = evaluatePagumeExemption('Equb Contribution', d);
        items.push({
          id: `equb-${e.id}`,
          title: `${e.name} (Round #${e.currentRound})`,
          amount: e.contributionPerRound,
          typeLabel: 'Equb Due',
          dateStr: formatYMD(d),
          dateObj: d,
          color: '#8B5CF6',
          direction: 'OUT',
          isExemptInPagume: pagumeCheck.isExempt,
          pagumeReason: pagumeCheck.reason
        });
      }
    });

    loans.forEach(l => {
      if (l.status === 'ACTIVE') {
        const d = new Date(l.dueDate);
        const pagumeCheck = evaluatePagumeExemption('Loan Repayment', d);
        items.push({
          id: `loan-${l.id}`,
          title: `Loan: ${l.title}`,
          amount: l.monthlyInstallment || l.outstandingBalance,
          typeLabel: 'Loan Repayment',
          dateStr: formatYMD(d),
          dateObj: d,
          color: '#F97316',
          direction: 'OUT',
          isExemptInPagume: pagumeCheck.isExempt,
          pagumeReason: pagumeCheck.reason
        });
      }
    });

    recurring.forEach(r => {
      if (r.active) {
        const d = new Date(r.nextDueDate);
        const pagumeCheck = evaluatePagumeExemption(r.category || r.title, d);
        items.push({
          id: `rec-${r.id}`,
          title: r.title,
          amount: r.amount,
          typeLabel: r.category || 'Recurring Fee',
          dateStr: formatYMD(d),
          dateObj: d,
          color: '#6366F1',
          direction: r.type === 'EXPENSE' ? 'OUT' : 'IN',
          isExemptInPagume: pagumeCheck.isExempt,
          pagumeReason: pagumeCheck.reason
        });
      }
    });

    (receivables || []).forEach(rcv => {
      const rem = rcv.amountOwed - rcv.amountCollected;
      if (rem > 0) {
        const d = new Date(rcv.dueDate);
        items.push({
          id: `rcv-${rcv.id}`,
          title: `Collect from ${rcv.customerName}`,
          amount: rem,
          typeLabel: 'Receivable Due',
          dateStr: formatYMD(d),
          dateObj: d,
          color: '#10B981',
          direction: 'IN',
          isExemptInPagume: false
        });
      }
    });

    return items.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime()).slice(0, 6);
  }, [equbs, loans, recurring, receivables]);

  // Operational System Alerts
  const notifications = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      message: string;
      type: 'HIGH' | 'MEDIUM' | 'INFO';
      time: string;
      icon: React.ReactNode;
      actionTab?: any;
      actionSubView?: any;
    }> = [];

    // Equb notifications
    activeEqubs.forEach(eq => {
      list.push({
        id: `notif-eq-${eq.id}`,
        title: `Equb Round #${eq.currentRound} Active`,
        message: `${eq.name} contribution of ${formatETB(eq.contributionPerRound)} is ready for deposit.`,
        type: 'MEDIUM',
        time: 'Today',
        icon: <Building2 className="w-4 h-4 text-purple-400" />,
        actionTab: 'equb'
      });
    });

    // Active Loan Notifications
    activeLoans.forEach(l => {
      list.push({
        id: `notif-loan-${l.id}`,
        title: `Loan Repayment Due`,
        message: `${l.lender} payment of ${formatETB(l.monthlyPayment || l.outstandingBalance)} scheduled.`,
        type: 'HIGH',
        time: 'Upcoming',
        icon: <CreditCard className="w-4 h-4 text-red-400" />,
        actionTab: 'more',
        actionSubView: 'LOANS'
      });
    });

    // Uncollected Receivables Alert
    if (uncollectedReceivablesTotal > 0) {
      list.push({
        id: 'notif-rcv-total',
        title: 'Outstanding Debtors & Invoices',
        message: `${formatETB(uncollectedReceivablesTotal)} waiting for customer collection.`,
        type: 'MEDIUM',
        time: 'Pending',
        icon: <Receipt className="w-4 h-4 text-emerald-400" />,
        actionTab: 'more',
        actionSubView: 'RECEIVABLES'
      });
    }

    // Wallet low balance warnings
    wallets.forEach(w => {
      const bal = calculateWalletBalance(w, transactions, transfers);
      if (bal < 10000) {
        list.push({
          id: `notif-bal-${w.id}`,
          title: `Low Balance: ${w.name}`,
          message: `Wallet balance is ${formatETB(bal)}. Top-up recommended.`,
          type: 'HIGH',
          time: 'Urgent',
          icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
          actionTab: 'wallets'
        });
      }
    });

    // Latest Transaction
    const sortedTxs = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (sortedTxs.length > 0) {
      const latestTx = sortedTxs[0];
      list.push({
        id: `notif-tx-${latestTx.id}`,
        title: `New Entry Posted`,
        message: `${latestTx.description} (${latestTx.type === 'INCOME' ? '+' : '-'}${formatETB(latestTx.amount)}) by ${latestTx.creatorName}`,
        type: 'INFO',
        time: 'Recent',
        icon: <FileText className="w-4 h-4 text-[#00D4AA]" />,
        actionTab: 'transactions'
      });
    }

    return list;
  }, [activeEqubs, activeLoans, uncollectedReceivablesTotal, wallets, transactions, transfers]);

  const recentTxList = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  return (
    <div className="space-y-6 pb-24 animate-fadeIn font-sans text-slate-900 dark:text-slate-100">

      {/* 1. Header & Date Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] p-4 sm:p-5 rounded-2xl shadow-xs transition-colors">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {greeting}, <span className="text-emerald-600 dark:text-[#00D4AA]">{currentUser.name}</span>
            </h2>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-[#00D4AA]/20 dark:text-[#00D4AA] border border-emerald-200 dark:border-[#00D4AA]/30 px-2.5 py-0.5 rounded-full font-mono font-semibold uppercase">
              {currentUser.role}
            </span>
            <span className="text-[10px] bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Real-time Ledger Connected
            </span>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-[#8899BB]">
            <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-500" />
              {formatDateByCalendar(today, calendarType, true)}
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="font-medium text-slate-500 dark:text-slate-400">
              {calendarType === 'GREGORIAN' ? `E.C.: ${formattedEthDateStr}` : `Gregorian: ${formattedGregorianDate}`}
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-slate-800 dark:text-slate-200 font-semibold">{currentUser.branch}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1 md:pt-0">
          <button
            onClick={() => {
              triggerHaptic('medium');
              onOpenQuickEntry();
            }}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] text-slate-800 dark:text-white font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
          >
            <PlusCircle className="w-4 h-4 text-emerald-600 dark:text-[#00D4AA]" />
            <span>New Revenue / Expense</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              onOpenTransferModal();
            }}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] text-slate-800 dark:text-white font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
          >
            <ArrowRightLeft className="w-4 h-4 text-blue-600 dark:text-[#3B82F6]" />
            <span>Transfer</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards Row (Hero Ledger + PROMINENT WEEKLY AVERAGE INCOME + Monthly KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3.5">

        {/* Hero Business Ledger Card */}
        <div className="md:col-span-2 lg:col-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#00D4AA] via-[#00B894] to-[#008f73] p-5 text-[#0A0E1A] shadow-xl border border-emerald-300 dark:border-[#00D4AA]/40 flex flex-col justify-between min-h-[170px]">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0A0E1A]/80 flex items-center gap-1.5">
                <WalletIcon className="w-4 h-4" />
                Total Business Ledger Balance
              </span>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  onToggleHideBalances();
                }}
                className="p-1.5 rounded-xl bg-[#0A0E1A]/10 text-[#0A0E1A] hover:bg-[#0A0E1A]/20 transition-colors cursor-pointer"
                title={hideBalances ? 'Show Balances' : 'Hide Balances'}
              >
                {hideBalances ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="mt-3">
              <h3 className="text-3xl sm:text-4xl font-bold font-mono tracking-tight text-[#0A0E1A]">
                {hideBalances ? 'ETB ••••••••' : formatETB(totalBalance)}
              </h3>
              <div className="mt-2.5 inline-flex items-center gap-2 bg-[#0A0E1A]/15 border border-[#0A0E1A]/20 px-3 py-1 rounded-lg text-xs font-semibold text-[#0A0E1A]">
                <span>Net Profit (MTD):</span>
                <span className="font-mono font-bold text-[#0A0E1A]">
                  {hideBalances ? '••••••' : formatETB(profit)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#0A0E1A]/15 flex items-center justify-between text-xs font-semibold text-[#0A0E1A]">
            <span>{wallets.length} Connected Accounts</span>
            <button
              onClick={() => onNavigateTab('wallets')}
              className="flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span>Manage Wallets</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PROMINENT FEATURE: WEEKLY AVERAGE INCOME CARD */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-teal-500/10 dark:from-[#00D4AA]/20 dark:via-[#00D4AA]/5 dark:to-teal-950/40 border-2 border-emerald-500/40 dark:border-[#00D4AA]/50 rounded-2xl p-4.5 flex flex-col justify-between shadow-md relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 font-bold flex items-center justify-center shadow-md">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-semibold tracking-wider uppercase text-emerald-800 dark:text-[#00D4AA] bg-emerald-100 dark:bg-[#00D4AA]/20 px-2.5 py-1 rounded-full border border-emerald-300 dark:border-[#00D4AA]/40 flex items-center gap-1">
              <Sparkles className="w-3 h-3 animate-spin" />
              WEEKLY AVG
            </span>
          </div>

          <div className="mt-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-[#8899BB]">
              Weekly Average Income
            </p>
            <p className="text-2xl font-bold font-mono text-emerald-700 dark:text-[#00D4AA] mt-0.5 tracking-tight">
              {hideBalances ? '••••••••' : formatETB(incomeAverages.weeklyAvg)}
            </p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-emerald-500/20 text-[10px] text-slate-600 dark:text-slate-300 flex items-center justify-between font-medium">
            <span>Current 7-Day Run:</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
              {hideBalances ? '••••••' : formatETB(incomeAverages.currentWeekIncome)}
            </span>
          </div>
        </div>

        {/* KPI 2: Income (MTD) */}
        <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] rounded-2xl p-4 flex flex-col justify-between shadow-xs hover:border-emerald-400 dark:hover:border-[#00D4AA]/50 transition-all">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-extrabold">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20">
              INCOME
            </span>
          </div>
          <div className="mt-3">
            <p className="text-[11px] text-slate-500 dark:text-[#8899BB] font-semibold">Total Income (MTD)</p>
            <p className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
              {hideBalances ? '••••••' : formatETB(income, true)}
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-[#1E2D40] text-[10px] text-slate-500 dark:text-[#8899BB] flex items-center justify-between">
            <span>Daily Average:</span>
            <span className="font-mono text-slate-900 dark:text-white font-bold">{hideBalances ? '••' : formatETB(incomeAverages.dailyAvg, true)}</span>
          </div>
        </div>

        {/* KPI 3: Expense (MTD) */}
        <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] rounded-2xl p-4 flex flex-col justify-between shadow-xs hover:border-rose-400 dark:hover:border-red-500/50 transition-all">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-600 dark:text-red-400 flex items-center justify-center font-bold">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-semibold text-rose-700 dark:text-red-400 bg-rose-50 dark:bg-red-500/10 px-2 py-0.5 rounded-full border border-rose-200 dark:border-red-500/20">
              EXPENSE
            </span>
          </div>
          <div className="mt-3">
            <p className="text-[11px] text-slate-500 dark:text-[#8899BB] font-medium">Total Expense (MTD)</p>
            <p className="text-lg font-bold font-mono text-rose-600 dark:text-red-400 mt-0.5 truncate">
              {hideBalances ? '••••••' : formatETB(expense, true)}
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-[#1E2D40] text-[10px] text-slate-500 dark:text-[#8899BB] flex items-center justify-between">
            <span>Posted Entries:</span>
            <span className="font-mono text-slate-900 dark:text-white font-semibold">{transactions.length} txs</span>
          </div>
        </div>

        {/* KPI 4: Receivables & Debtor Recovery */}
        <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] rounded-2xl p-4 flex flex-col justify-between shadow-xs hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-all">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Receipt className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-500/20">
              DEBTORS
            </span>
          </div>
          <div className="mt-3">
            <p className="text-[11px] text-slate-500 dark:text-[#8899BB] font-medium">Uncollected Debt</p>
            <p className="text-lg font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-0.5 truncate">
              {hideBalances ? '••••••' : formatETB(uncollectedReceivablesTotal, true)}
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-[#1E2D40] text-[10px] text-slate-500 dark:text-[#8899BB] flex items-center justify-between">
            <span>Pending Invoices:</span>
            <button
              onClick={() => onNavigateTab('more', 'RECEIVABLES')}
              className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              {(receivables || []).length} items →
            </button>
          </div>
        </div>

      </div>

      {/* 3. Quick Action Launchpad Strip */}
      <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] rounded-2xl p-3.5 shadow-xs">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Quick Launchpad Shortcuts
          </span>
          <span className="text-[10px] font-mono text-slate-400">One-Tap Fast Actions</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          
          <button
            onClick={() => {
              triggerHaptic('medium');
              onOpenQuickEntry();
            }}
            className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 flex items-center gap-2 text-xs font-semibold transition-all cursor-pointer group"
          >
            <PlusCircle className="w-4 h-4 text-emerald-600 dark:text-[#00D4AA] group-hover:scale-110 transition-transform" />
            <span className="truncate">Record Sales</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('medium');
              onOpenTransferModal();
            }}
            className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-800 dark:text-blue-200 flex items-center gap-2 text-xs font-semibold transition-all cursor-pointer group"
          >
            <ArrowRightLeft className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
            <span className="truncate">Wallet Transfer</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('medium');
              onNavigateTab('equb');
            }}
            className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/80 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-800 dark:text-purple-200 flex items-center gap-2 text-xs font-semibold transition-all cursor-pointer group"
          >
            <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
            <span className="truncate">Equb Rounds</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('medium');
              onNavigateTab('more', 'RECEIVABLES');
            }}
            className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 flex items-center gap-2 text-xs font-semibold transition-all cursor-pointer group"
          >
            <Receipt className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
            <span className="truncate">Collect Debt</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('medium');
              onNavigateTab('more', 'PARTNERS');
            }}
            className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 flex items-center gap-2 text-xs font-semibold transition-all cursor-pointer group"
          >
            <Users className="w-4 h-4 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="truncate">Partner Shares</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('medium');
              onNavigateTab('more', 'REPORTS');
            }}
            className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/80 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-800 dark:text-teal-200 flex items-center gap-2 text-xs font-semibold transition-all cursor-pointer group"
          >
            <PieChart className="w-4 h-4 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform" />
            <span className="truncate">P&L Reports</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('medium');
              onNavigateTab('more', 'AUDIT');
            }}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] hover:bg-slate-200 dark:hover:bg-[#252E42] text-slate-800 dark:text-slate-200 flex items-center gap-2 text-xs font-semibold transition-all cursor-pointer group"
          >
            <Activity className="w-4 h-4 text-slate-600 dark:text-slate-400 group-hover:scale-110 transition-transform" />
            <span className="truncate">Audit Logs</span>
          </button>

        </div>
      </div>

      {/* 4. MAIN 2-COLUMN DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT COLUMN (2 Cols) - Analytics, Connected Wallets, Equb Pools */}
        <div className="lg:col-span-2 space-y-6">

          {/* 7-Day Cash Flow Trend Chart */}
          <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-[#1E2D40] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-[#00D4AA] flex items-center justify-center font-bold">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">7-Day Financial Revenue Flow</h4>
                  <p className="text-[11px] text-slate-500 dark:text-[#8899BB]">Weekly breakdown of incoming revenue vs operational costs</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[10px] font-bold">
                <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Income
                </span>
                <span className="flex items-center gap-1.5 text-rose-700 dark:text-red-400 bg-rose-50 dark:bg-red-500/10 px-2.5 py-1 rounded-md border border-rose-200 dark:border-red-500/20">
                  <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Expense
                </span>
              </div>
            </div>

            <div className="h-52 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22C55E" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#FFF' }}
                  />
                  <Area type="monotone" dataKey="income" stroke="#22C55E" strokeWidth={2.5} fillOpacity={1} fill="url(#incomeGrad)" />
                  <Area type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={2.5} fillOpacity={1} fill="url(#expenseGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Connected Business Accounts & Wallets */}
          <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1E2D40] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <WalletIcon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Active Financial Accounts</h4>
                  <p className="text-[11px] text-slate-500 dark:text-[#8899BB]">Real-time balances across Telebirr, Banks & Cash Vaults</p>
                </div>
              </div>

              <button
                onClick={() => onNavigateTab('wallets')}
                className="text-xs font-semibold text-emerald-600 dark:text-[#00D4AA] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View All ({wallets.length})</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {wallets.map((w) => {
                const bal = calculateWalletBalance(w, transactions, transfers);
                const percent = Math.min(100, Math.round((bal / maxWalletBalance) * 100));

                return (
                  <div
                    key={w.id}
                    onClick={() => onNavigateTab('wallets')}
                    style={{
                      borderColor: `${w.color}35`
                    }}
                    className="bg-slate-50 dark:bg-[#1C2333] border rounded-2xl p-3.5 cursor-pointer hover:border-emerald-400 dark:hover:border-[#00D4AA]/60 transition-all space-y-2.5 relative overflow-hidden group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: w.color }}
                        />
                        <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {w.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-medium text-slate-500 dark:text-[#8899BB] uppercase">
                        {w.type.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between pt-1">
                      <span className="text-base font-bold font-mono text-slate-900 dark:text-white">
                        {hideBalances ? '••••••••' : formatETB(bal)}
                      </span>
                      <span className="text-[10px] font-mono font-medium text-slate-400">
                        {percent}% of Liquidity
                      </span>
                    </div>

                    {/* Balance Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-[#131926] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(5, percent)}%`,
                          backgroundColor: w.color
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Equb Savings Pools */}
          <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1E2D40] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Active Equb Circles</h4>
                  <p className="text-[11px] text-slate-500 dark:text-[#8899BB]">Traditional Ethiopian rotating savings</p>
                </div>
              </div>

              <button
                onClick={() => onNavigateTab('equb')}
                className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Equb Hub ({equbs.length})</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {activeEqubs.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500 dark:text-[#8899BB]">
                No active Equb pools registered.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeEqubs.map((e) => {
                  const potSize = e.contributionPerRound * e.members.length;
                  const roundProgress = Math.round((e.currentRound / e.totalRounds) * 100);

                  return (
                    <div
                      key={e.id}
                      onClick={() => onNavigateTab('equb')}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] hover:border-purple-400 transition-all space-y-2.5 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">{e.name}</span>
                        <span className="text-[10px] font-mono font-medium bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 px-2 py-0.5 rounded-md">
                          Round #{e.currentRound} / {e.totalRounds}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between text-xs">
                        <span className="text-slate-500 dark:text-[#8899BB]">Payout Pot Size:</span>
                        <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                          {hideBalances ? '••••••' : formatETB(potSize)}
                        </span>
                      </div>

                      <div className="w-full h-1.5 bg-slate-200 dark:bg-[#131926] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full transition-all"
                          style={{ width: `${roundProgress}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                        <span>{e.members.length} Members</span>
                        <span>Due: {formatETB(e.contributionPerRound)} / {e.interval.toLowerCase().replace('_', ' ')}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Ledger Feed */}
          <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1E2D40] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-[#00D4AA] flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Recent Ledger Postings</h4>
                  <p className="text-[11px] text-slate-500 dark:text-[#8899BB]">Real-time audit trail of income & expenses</p>
                </div>
              </div>

              <button
                onClick={() => onNavigateTab('transactions')}
                className="text-xs font-semibold text-emerald-600 dark:text-[#00D4AA] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View All ({transactions.length})</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {recentTxList.map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => onNavigateTab('transactions')}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] hover:border-emerald-400 dark:hover:border-[#00D4AA]/60 transition-all flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      tx.type === 'INCOME'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                        : 'bg-rose-100 text-rose-700 dark:bg-red-500/15 dark:text-red-400'
                    }`}>
                      {tx.type === 'INCOME' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>

                    <div className="min-w-0">
                      <h5 className="text-xs font-semibold text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-[#00D4AA] transition-colors">
                        {tx.description}
                      </h5>
                      <p className="text-[10px] text-slate-500 dark:text-[#8899BB] truncate">
                        {tx.category} • <span className="text-slate-700 dark:text-slate-300 font-medium">{tx.creatorName}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-3">
                    <p className={`text-xs font-mono font-bold ${
                      tx.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-red-400'
                    }`}>
                      {tx.type === 'INCOME' ? '+' : '-'}{hideBalances ? '••••' : formatETB(tx.amount)}
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono">{formatDateByCalendar(tx.date, calendarType, false)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN (1 Col) - Operational Intelligence & Ethiopian Agenda */}
        <div className="space-y-6">

          {/* Operational Alerts Card */}
          <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] rounded-2xl p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1E2D40] pb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500 animate-pulse" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
                  Operational System Alerts
                </h4>
              </div>
              <span className="text-[10px] font-mono font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full">
                {notifications.length} Priority
              </span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => n.actionTab && onNavigateTab(n.actionTab, n.actionSubView)}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] hover:border-amber-400 transition-all cursor-pointer space-y-1 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-white">
                      {n.icon}
                      <span>{n.title}</span>
                    </div>
                    <span className="text-[9px] font-mono font-medium text-slate-400">{n.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-[#8899BB] leading-snug">
                    {n.message}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Obligations Agenda */}
          <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] rounded-2xl p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1E2D40] pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
                  Upcoming Agenda Dues
                </h4>
              </div>
              <button
                onClick={() => onNavigateTab('more', 'CALENDAR')}
                className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Calendar →
              </button>
            </div>

            {upcomingAgendaItems.length === 0 ? (
              <p className="text-xs text-center text-slate-400 py-4">No upcoming obligations</p>
            ) : (
              <div className="space-y-2">
                {upcomingAgendaItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onNavigateTab('more', 'CALENDAR')}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                      item.isExemptInPagume
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                        : 'bg-slate-50 dark:bg-[#1C2333] border-slate-200 dark:border-[#1E2D40] hover:border-indigo-400'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className="text-[9px] font-semibold px-1.5 py-0.2 rounded block w-max"
                          style={{ backgroundColor: `${item.color}20`, color: item.color }}
                        >
                          {item.typeLabel}
                        </span>
                        {item.isExemptInPagume && (
                          <span className="text-[9px] font-semibold bg-emerald-500 text-slate-950 px-1.5 py-0.2 rounded">
                            FREE IN Month 13 ጳጉሜ
                          </span>
                        )}
                      </div>
                      <h6 className="font-semibold text-slate-900 dark:text-white truncate mt-0.5">{item.title}</h6>
                    </div>

                    <div className="text-right shrink-0 ml-2">
                      <span className={`font-mono font-bold block ${item.isExemptInPagume ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                        {formatETB(item.amount)}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400">{item.dateStr}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Loans & Repayments */}
          <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] rounded-2xl p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1E2D40] pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-orange-500" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
                  Active Loans
                </h4>
              </div>
              <button
                onClick={() => onNavigateTab('more', 'LOANS')}
                className="text-[11px] font-medium text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
              >
                Loans Hub →
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-500">Total Outstanding Principal:</span>
                <span className="text-sm font-bold font-mono text-orange-600 dark:text-orange-400">
                  {hideBalances ? '••••••' : formatETB(activeLoansTotal)}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200 dark:border-[#28354A]">
                <span>Active Facility Count:</span>
                <span className="font-semibold text-slate-800 dark:text-white">{activeLoans.length} Loans</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

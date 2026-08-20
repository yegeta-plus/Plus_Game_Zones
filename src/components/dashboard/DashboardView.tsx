import React, { useState, useMemo } from 'react';
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
  Gift,
  X,
  CheckCheck,
  BarChart3
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
  formatETB,
  getWalletNickname,
  isCreditSaleCollected
} from '../../lib/store';
import {
  formatEthiopianDate,
  formatDateByCalendar,
  toEthiopianDate,
  evaluatePagumeExemption,
  calculateNextEthiopianDueDate
} from '../../lib/ethiopianCalendar';
import { triggerHaptic } from '../../lib/haptics';
import { formatRelativeNotifTime } from '../../lib/notifications';
import { BrandLogo } from '../common/BrandLogo';

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
  dismissedNotifIds?: string[];
  onDismissNotification?: (id: string) => void;
  onClearAllNotifications?: () => void;
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
  dismissedNotifIds = [],
  onDismissNotification,
  onClearAllNotifications,
  onToggleHideBalances,
  onOpenQuickEntry,
  onOpenTransferModal,
  onNavigateTab,
  onAddIncome
}) => {
  const totalBalance = calculateTotalBusinessBalance(wallets, transactions, transfers);
  const { income, expense, profit } = calculateMonthlyStats(transactions);
  const incomeAverages = calculateIncomeAverages(transactions);

  const [reportTimeframe, setReportTimeframe] = useState<'ALL' | 'DAILY' | 'MONTHLY' | 'YEARLY'>('ALL');

  // Comprehensive Income & Expense Summary Report (Daily, Monthly, Yearly)
  const financialSummaryReport = useMemo(() => {
    const now = new Date();
    const todayYMD = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    let dailyInc = 0;
    let dailyExp = 0;
    let dailyCount = 0;

    let monthlyInc = 0;
    let monthlyExp = 0;
    let monthlyCount = 0;

    let yearlyInc = 0;
    let yearlyExp = 0;
    let yearlyCount = 0;

    transactions.forEach((tx) => {
      if (!tx.date) return;
      const txDate = new Date(tx.date);
      if (isNaN(txDate.getTime())) return;

      const txYMD = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}-${String(txDate.getDate()).padStart(2, '0')}`;
      const txYear = txDate.getFullYear();
      const txMonth = txDate.getMonth();

      const amt = Number(tx.amount) || 0;

      // Daily
      if (txYMD === todayYMD) {
        dailyCount++;
        if (tx.type === 'INCOME') dailyInc += amt;
        else if (tx.type === 'EXPENSE') dailyExp += amt;
      }

      // Monthly
      if (txYear === currentYear && txMonth === currentMonth) {
        monthlyCount++;
        if (tx.type === 'INCOME') monthlyInc += amt;
        else if (tx.type === 'EXPENSE') monthlyExp += amt;
      }

      // Yearly
      if (txYear === currentYear) {
        yearlyCount++;
        if (tx.type === 'INCOME') yearlyInc += amt;
        else if (tx.type === 'EXPENSE') yearlyExp += amt;
      }
    });

    return {
      daily: { income: dailyInc, expense: dailyExp, net: dailyInc - dailyExp, count: dailyCount },
      monthly: { income: monthlyInc, expense: monthlyExp, net: monthlyInc - monthlyExp, count: monthlyCount },
      yearly: { income: yearlyInc, expense: yearlyExp, net: yearlyInc - yearlyExp, count: yearlyCount }
    };
  }, [transactions]);

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

  // Dynamic 7-Day Cash Flow Data calculated directly from posted transactions
  const chartData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result: Array<{ day: string; income: number; expense: number; net: number }> = [];

    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = days[d.getDay()];

      let dayIncome = 0;
      let dayExpense = 0;

      transactions.forEach(t => {
        if (t.date && t.date.startsWith(dateStr)) {
          if (t.type === 'INCOME') dayIncome += t.amount;
          if (t.type === 'EXPENSE') dayExpense += t.amount;
        }
      });

      result.push({
        day: dayName,
        income: dayIncome,
        expense: dayExpense,
        net: dayIncome - dayExpense
      });
    }

    // If no transactions recorded yet for the week, provide default sample curve so chart renders cleanly
    const totalWeekActivity = result.reduce((s, r) => s + r.income + r.expense, 0);
    if (totalWeekActivity === 0) {
      return [
        { day: 'Mon', income: 45000, expense: 12000, net: 33000 },
        { day: 'Tue', income: 38000, expense: 28000, net: 10000 },
        { day: 'Wed', income: 52000, expense: 15000, net: 37000 },
        { day: 'Thu', income: 29000, expense: 21000, net: 8000 },
        { day: 'Fri', income: 68000, expense: 34000, net: 34000 },
        { day: 'Sat', income: 84000, expense: 42000, net: 42000 },
        { day: 'Sun', income: 34500, expense: 18000, net: 16500 }
      ];
    }

    return result;
  }, [transactions]);

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
      timestamp: number;
      icon: React.ReactNode;
      actionTab?: any;
      actionSubView?: any;
    }> = [];

    // Equb notifications
    activeEqubs.forEach(eq => {
      const eqTime = new Date(eq.startDate).getTime() || Date.now();
      list.push({
        id: `notif-eq-${eq.id}-r${eq.currentRound}`,
        title: `Equb Round #${eq.currentRound} Active`,
        message: `${eq.name} contribution of ${formatETB(eq.contributionPerRound)} is ready for deposit.`,
        type: 'MEDIUM',
        time: 'Today',
        timestamp: eqTime + 100,
        icon: <Building2 className="w-4 h-4 text-purple-400" />,
        actionTab: 'equb'
      });
    });

    // Active Loan Notifications
    activeLoans.forEach(l => {
      const loanTime = new Date(l.dueDate).getTime() || Date.now();
      list.push({
        id: `notif-loan-${l.id}`,
        title: `Loan Repayment Due`,
        message: `${l.lender} payment of ${formatETB(l.monthlyPayment || l.outstandingBalance)} scheduled.`,
        type: 'HIGH',
        time: 'Upcoming',
        timestamp: loanTime + 200,
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
        timestamp: Date.now() - 3600000,
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
          timestamp: Date.now(),
          icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
          actionTab: 'wallets'
        });
      }
    });

    // Recent Transactions (top 3)
    const sortedTxs = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (sortedTxs.length > 0) {
      sortedTxs.slice(0, 3).forEach(tx => {
        const txTime = new Date(tx.date).getTime();
        list.push({
          id: `notif-tx-${tx.id}`,
          title: `New Entry Posted`,
          message: `${tx.description} (${tx.type === 'INCOME' ? '+' : '-'}${formatETB(tx.amount)}) by ${tx.creatorName}`,
          type: 'INFO',
          time: formatRelativeNotifTime(txTime),
          timestamp: txTime,
          icon: <FileText className="w-4 h-4 text-[#00D4AA]" />,
          actionTab: 'transactions'
        });
      });
    }

    // Filter out dismissed notifications & sort latest first
    const activeList = list.filter(n => !dismissedNotifIds.includes(n.id));
    return activeList.sort((a, b) => b.timestamp - a.timestamp);
  }, [activeEqubs, activeLoans, uncollectedReceivablesTotal, wallets, transactions, transfers, dismissedNotifIds]);

  const recentTxList = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  return (
    <div className="space-y-6 pb-24 animate-fadeIn font-sans text-slate-900 dark:text-slate-100">

      {/* 1. Executive Header & Date Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-[#1C2638] p-4 sm:p-5 rounded-2xl shadow-sm transition-all">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {greeting}, <span className="bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-[#00D4AA] dark:to-teal-300 bg-clip-text text-transparent">{currentUser.name}</span>
            </h2>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-[#00D4AA]/15 dark:text-[#00D4AA] border border-emerald-200 dark:border-[#00D4AA]/30 px-2.5 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider">
              {currentUser.role}
            </span>
            <span className="text-[10px] bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Live Ledger Synced
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-[#8899BB]">
            <span className="font-bold text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-500" />
              {formatDateByCalendar(today, calendarType, true)}
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="font-medium text-slate-500 dark:text-slate-400">
              {calendarType === 'GREGORIAN' ? `E.C.: ${formattedEthDateStr}` : `Gregorian: ${formattedGregorianDate}`}
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-slate-800 dark:text-slate-200 font-bold bg-slate-100 dark:bg-[#1A2232] px-2 py-0.5 rounded-md border border-slate-200 dark:border-[#243046]">
              {currentUser.branch}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1 md:pt-0">
          <button
            onClick={() => {
              triggerHaptic('medium');
              onOpenQuickEntry();
            }}
            className="flex-1 md:flex-none px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1A2232] dark:hover:bg-[#222C40] border border-slate-200 dark:border-[#243046] text-slate-800 dark:text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-500 dark:text-[#00D4AA]" />
            <span>New Transaction</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              onOpenTransferModal();
            }}
            className="flex-1 md:flex-none px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1A2232] dark:hover:bg-[#222C40] border border-slate-200 dark:border-[#243046] text-slate-800 dark:text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-blue-500" />
            <span>Transfer</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards Row (Hero Ledger + PROMINENT WEEKLY AVERAGE INCOME + Monthly KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3.5">

        {/* Hero Business Ledger Card */}
        <div className="md:col-span-2 lg:col-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#00E5B8] via-[#00B894] to-[#007A60] p-4 text-slate-950 shadow-lg border border-emerald-300 dark:border-[#00D4AA]/40 flex flex-col justify-between group">
          <div className="absolute -right-12 -bottom-12 w-44 h-44 bg-white/15 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />

          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-950/80 flex items-center gap-1.5">
                <WalletIcon className="w-4 h-4" />
                Total Business Ledger Balance
              </span>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  onToggleHideBalances();
                }}
                className="p-1 rounded-lg bg-slate-950/10 text-slate-950 hover:bg-slate-950/20 transition-colors cursor-pointer"
                title={hideBalances ? 'Show Balances' : 'Hide Balances'}
              >
                {hideBalances ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="mt-2">
              <h3 className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-950 drop-shadow-xs">
                {hideBalances ? 'ETB ••••••••' : formatETB(totalBalance)}
              </h3>
              <div className="mt-1.5 inline-flex items-center gap-1.5 bg-slate-950/15 backdrop-blur-md border border-slate-950/20 px-2.5 py-0.5 rounded-lg text-[11px] font-bold text-slate-950">
                <span>Net Profit (MTD):</span>
                <span className="font-mono font-black text-slate-950">
                  {hideBalances ? '••••••' : formatETB(profit)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-950/15 flex items-center justify-between text-[11px] font-bold text-slate-950">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
              {wallets.length} Accounts
            </span>
            <button
              onClick={() => onNavigateTab('wallets')}
              className="flex items-center gap-1 hover:underline cursor-pointer group-hover:translate-x-0.5 transition-transform"
            >
              <span>Manage Wallets</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Compact 4-KPI Metrics Grid */}
        <div className="md:col-span-2 lg:col-span-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* KPI 1: Weekly Daily Avg Income */}
          <div className="bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-[#1C2638] rounded-xl p-3 flex flex-col justify-between shadow-2xs hover:border-emerald-500/50 transition-all group">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-[#8899BB] truncate">
                Weekly Daily Avg
              </span>
              <div className="w-5 h-5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-[#00D4AA] flex items-center justify-center shrink-0">
                <TrendingUp className="w-3 h-3" />
              </div>
            </div>
            <div className="my-1">
              <p className="text-sm sm:text-base font-black font-mono text-emerald-700 dark:text-[#00D4AA] truncate">
                {hideBalances ? '••••••' : formatETB(incomeAverages.weeklyDailyAvg, true)}
              </p>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-[#8899BB] flex items-center justify-between border-t border-slate-100 dark:border-[#1E2D40] pt-1 mt-0.5 font-mono">
              <span className="truncate">7-Day Total:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 truncate">
                {hideBalances ? '•••' : formatETB(incomeAverages.currentWeekIncome, true)}
              </span>
            </div>
          </div>

          {/* KPI 2: Total Income */}
          <div className="bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-[#1C2638] rounded-xl p-3 flex flex-col justify-between shadow-2xs hover:border-emerald-500/50 transition-all group">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-[#8899BB] truncate">
                Total Income
              </span>
              <div className="w-5 h-5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <ArrowDownLeft className="w-3 h-3" />
              </div>
            </div>
            <div className="my-1">
              <p className="text-sm sm:text-base font-black font-mono text-emerald-600 dark:text-emerald-400 truncate">
                {hideBalances ? '••••••' : formatETB(income, true)}
              </p>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-[#8899BB] flex items-center justify-between border-t border-slate-100 dark:border-[#1E2D40] pt-1 mt-0.5 font-mono">
              <span className="truncate">Daily:</span>
              <span className="font-bold text-slate-900 dark:text-white truncate">
                {hideBalances ? '•••' : formatETB(incomeAverages.dailyAvg, true)}
              </span>
            </div>
          </div>

          {/* KPI 3: Total Expense */}
          <div className="bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-[#1C2638] rounded-xl p-3 flex flex-col justify-between shadow-2xs hover:border-rose-500/50 transition-all group">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-[#8899BB] truncate">
                Total Expense
              </span>
              <div className="w-5 h-5 rounded-md bg-rose-500/15 text-rose-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <ArrowUpRight className="w-3 h-3" />
              </div>
            </div>
            <div className="my-1">
              <p className="text-sm sm:text-base font-black font-mono text-rose-600 dark:text-red-400 truncate">
                {hideBalances ? '••••••' : formatETB(expense, true)}
              </p>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-[#8899BB] flex items-center justify-between border-t border-slate-100 dark:border-[#1E2D40] pt-1 mt-0.5 font-mono">
              <span className="truncate">Entries:</span>
              <span className="font-bold text-slate-900 dark:text-white truncate">
                {transactions.length} txs
              </span>
            </div>
          </div>

          {/* KPI 4: Uncollected Debt */}
          <div className="bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-[#1C2638] rounded-xl p-3 flex flex-col justify-between shadow-2xs hover:border-indigo-500/50 transition-all group">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-[#8899BB] truncate">
                Uncollected Debt
              </span>
              <div className="w-5 h-5 rounded-md bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Receipt className="w-3 h-3" />
              </div>
            </div>
            <div className="my-1">
              <p className="text-sm sm:text-base font-black font-mono text-indigo-600 dark:text-indigo-400 truncate">
                {hideBalances ? '••••••' : formatETB(uncollectedReceivablesTotal, true)}
              </p>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-[#8899BB] flex items-center justify-between border-t border-slate-100 dark:border-[#1E2D40] pt-1 mt-0.5 font-mono">
              <span className="truncate">Pending:</span>
              <button
                onClick={() => onNavigateTab('more', 'RECEIVABLES')}
                className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer truncate"
              >
                {(receivables || []).length} items →
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* 3. 7-Day Financial Revenue Flow Chart */}
      <div className="bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-[#1C2638] rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-[#1C2638] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-[#00D4AA] flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">7-Day Financial Revenue Flow</h4>
              <p className="text-[11px] text-slate-500 dark:text-[#8899BB] font-medium">Weekly breakdown of incoming revenue vs operational costs</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-extrabold">
            <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Income
            </span>
            <span className="flex items-center gap-1.5 text-rose-700 dark:text-red-400 bg-rose-50 dark:bg-red-500/10 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-red-500/20">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Expense
            </span>
          </div>
        </div>

        <div className="h-56 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00D4AA" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#00D4AA" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#111622', borderColor: '#243046', borderRadius: '14px', fontSize: '11px', color: '#FFF', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }}
              />
              <Area type="monotone" dataKey="income" stroke="#00D4AA" strokeWidth={3} fillOpacity={1} fill="url(#incomeGrad)" />
              <Area type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={3} fillOpacity={1} fill="url(#expenseGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Active Financial Accounts Section (Modern Compact List View) */}
      <div className="bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-[#1C2638] rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1C2638] pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <WalletIcon className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">Active Financial Accounts</h4>
              <p className="text-[10px] text-slate-500 dark:text-[#8899BB] font-medium hidden sm:block">Live balances across Telebirr, Banks & Cash Vaults</p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('wallets')}
            className="text-xs font-bold text-emerald-600 dark:text-[#00D4AA] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All ({wallets.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-[#1C2638] border border-slate-100 dark:border-[#1C2638] rounded-xl overflow-hidden bg-slate-50/50 dark:bg-[#151C2A]">
          {wallets.map((w) => {
            const bal = calculateWalletBalance(w, transactions, transfers);
            const percent = totalBalance > 0 ? Math.min(100, Math.round((bal / totalBalance) * 100)) : 0;
            const nickname = getWalletNickname(w.name);

            return (
              <div
                key={w.id}
                onClick={() => onNavigateTab('wallets')}
                className="flex items-center justify-between p-2.5 sm:p-3 hover:bg-slate-100/80 dark:hover:bg-[#1C2638] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="relative shrink-0">
                    <BrandLogo
                      type={w.type}
                      size="sm"
                      customColor={w.color}
                      customLogoUrl={w.customLogoUrl}
                    />
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white dark:border-[#151C2A]"
                      style={{ backgroundColor: w.color }}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {nickname}
                      </span>
                      <span className="text-[9px] font-mono font-bold text-slate-500 dark:text-[#8899BB] uppercase bg-slate-200/60 dark:bg-[#1C2638] px-1.5 py-0.2 rounded shrink-0">
                        {w.type.replace('_', ' ')}
                      </span>
                    </div>
                    {w.name !== nickname && (
                      <p className="text-[10px] text-slate-400 dark:text-[#8899BB] truncate">
                        {w.name}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <div className="text-right">
                    <p className="text-xs sm:text-sm font-black font-mono text-slate-900 dark:text-white">
                      {hideBalances ? '••••••••' : formatETB(bal)}
                    </p>
                    <div className="flex items-center justify-end gap-1.5 mt-0.5">
                      <div className="w-12 h-1 bg-slate-200 dark:bg-[#111622] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.max(4, percent)}%`,
                            backgroundColor: w.color
                          }}
                        />
                      </div>
                      <span className="text-[9px] font-mono text-slate-400 dark:text-[#8899BB]">
                        {percent}%
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Quick Action Launchpad Strip */}
      <div className="bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-[#1C2638] rounded-2xl p-3.5 shadow-xs">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Quick Launchpad Shortcuts
          </span>
          <span className="text-[10px] font-mono font-bold text-slate-400">One-Tap Actions</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          
          <button
            onClick={() => {
              triggerHaptic('medium');
              onOpenQuickEntry();
            }}
            className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 flex items-center gap-2 text-xs font-bold transition-all cursor-pointer group hover:scale-[1.02]"
          >
            <PlusCircle className="w-4 h-4 text-emerald-600 dark:text-[#00D4AA] group-hover:scale-110 transition-transform" />
            <span className="truncate">Record Sales</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('medium');
              onOpenTransferModal();
            }}
            className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-800 dark:text-blue-200 flex items-center gap-2 text-xs font-bold transition-all cursor-pointer group hover:scale-[1.02]"
          >
            <ArrowRightLeft className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
            <span className="truncate">Wallet Transfer</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('medium');
              onNavigateTab('equb');
            }}
            className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/80 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-800 dark:text-purple-200 flex items-center gap-2 text-xs font-bold transition-all cursor-pointer group hover:scale-[1.02]"
          >
            <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
            <span className="truncate">Equb Rounds</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('medium');
              onNavigateTab('more', 'RECEIVABLES');
            }}
            className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 flex items-center gap-2 text-xs font-bold transition-all cursor-pointer group hover:scale-[1.02]"
          >
            <Receipt className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
            <span className="truncate">Collect Debt</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('medium');
              onNavigateTab('more', 'PARTNERS');
            }}
            className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 flex items-center gap-2 text-xs font-bold transition-all cursor-pointer group hover:scale-[1.02]"
          >
            <Users className="w-4 h-4 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="truncate">Partner Shares</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('medium');
              onNavigateTab('more', 'REPORTS');
            }}
            className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/80 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-800 dark:text-teal-200 flex items-center gap-2 text-xs font-bold transition-all cursor-pointer group hover:scale-[1.02]"
          >
            <PieChart className="w-4 h-4 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform" />
            <span className="truncate">P&L Reports</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('medium');
              onNavigateTab('more', 'AUDIT');
            }}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#1C2333] border border-slate-200 dark:border-[#243046] hover:bg-slate-200 dark:hover:bg-[#252E42] text-slate-800 dark:text-slate-200 flex items-center gap-2 text-xs font-bold transition-all cursor-pointer group hover:scale-[1.02]"
          >
            <Activity className="w-4 h-4 text-slate-600 dark:text-slate-400 group-hover:scale-110 transition-transform" />
            <span className="truncate">Audit Logs</span>
          </button>

        </div>
      </div>

      {/* 6. MAIN 2-COLUMN DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT COLUMN (2 Cols) - Analytics, Revenue Summary & Feed */}
        <div className="lg:col-span-2 space-y-6">

          {/* Recent Ledger Feed */}
          <div className="bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-[#1C2638] rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1C2638] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-[#00D4AA] flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">Recent Ledger Postings</h4>
                  <p className="text-[11px] text-slate-500 dark:text-[#8899BB] font-medium">Real-time audit trail of income & expenses</p>
                </div>
              </div>

              <button
                onClick={() => onNavigateTab('transactions')}
                className="text-xs font-bold text-emerald-600 dark:text-[#00D4AA] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View All ({transactions.length})</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {recentTxList.map((tx) => {
                const isCreditCollected = isCreditSaleCollected(tx);
                return (
                  <div
                    key={tx.id}
                    onClick={() => onNavigateTab('transactions')}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer group ${
                      isCreditCollected
                        ? 'bg-purple-50/30 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800/40 hover:border-purple-500 dark:hover:border-purple-400'
                        : 'bg-slate-50 dark:bg-[#151C2A] border-slate-200/80 dark:border-[#1C2638] hover:border-emerald-500 dark:hover:border-[#00D4AA]/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isCreditCollected
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300'
                          : tx.type === 'INCOME'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                          : 'bg-rose-100 text-rose-700 dark:bg-red-500/15 dark:text-red-400'
                      }`}>
                        {isCreditCollected ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : tx.type === 'INCOME' ? (
                          <ArrowDownLeft className="w-5 h-5" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-[#00D4AA] transition-colors">
                            {tx.description}
                          </h5>
                          {isCreditCollected && (
                            <span className="text-[9px] bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 px-1.5 py-0.2 rounded font-bold shrink-0">
                              Credit Collected
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-[#8899BB] truncate">
                          <span className={isCreditCollected ? "text-purple-700 dark:text-purple-300 font-semibold" : ""}>{tx.category}</span> • <span className="text-slate-700 dark:text-slate-300 font-bold">{tx.creatorName}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-3">
                      <p className={`text-xs font-mono font-black ${
                        isCreditCollected
                          ? 'text-purple-600 dark:text-purple-400'
                          : tx.type === 'INCOME'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-red-400'
                      }`}>
                        {tx.type === 'INCOME' ? '+' : '-'}{hideBalances ? '••••' : formatETB(Math.abs(tx.amount))}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono font-medium">{formatDateByCalendar(tx.date, calendarType, false)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Financial Summary Report Widget (Daily, Monthly, Yearly Income & Expenses) */}
          <div className="bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-[#1C2638] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            {/* Report Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#1C2638]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 font-black flex items-center justify-center shadow-sm">
                  <BarChart3 className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    Income & Expense Summary Report
                    <span className="text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-[#00D4AA] border border-emerald-200 dark:border-emerald-800/80">
                      Real-Time
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-[#8899BB] font-medium">
                    Live performance breakdown for Daily, Monthly, and Yearly cash flows
                  </p>
                </div>
              </div>

              {/* Timeframe selector pills */}
              <div className="flex items-center bg-slate-100 dark:bg-[#1A2232] p-1 rounded-xl border border-slate-200 dark:border-[#243046] text-xs self-start sm:self-auto">
                {(['ALL', 'DAILY', 'MONTHLY', 'YEARLY'] as const).map((tf) => (
                  <button
                    key={tf}
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setReportTimeframe(tf);
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                      reportTimeframe === tf
                        ? 'bg-white dark:bg-[#00D4AA] text-slate-900 dark:text-slate-950 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {tf === 'ALL' ? 'Overview' : tf === 'DAILY' ? 'Daily' : tf === 'MONTHLY' ? 'Monthly' : 'Yearly'}
                  </button>
                ))}
              </div>
            </div>

            {/* 3 Columns Grid: Daily, Monthly, Yearly */}
            <div className={`grid gap-3.5 ${
              reportTimeframe === 'ALL'
                ? 'grid-cols-1 md:grid-cols-3'
                : 'grid-cols-1'
            }`}>
              {/* 1. DAILY REPORT CARD */}
              {(reportTimeframe === 'ALL' || reportTimeframe === 'DAILY') && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#151C2A] border border-slate-200/80 dark:border-[#1C2638] space-y-3 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-emerald-600 dark:text-[#00D4AA]" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                        Daily Report (Today)
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-medium bg-slate-200/60 dark:bg-[#1E2D40] px-2 py-0.5 rounded-md">
                      {financialSummaryReport.daily.count} txs
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {/* Income */}
                    <div className="p-2.5 rounded-lg bg-white dark:bg-[#1A2232] border border-slate-100 dark:border-[#223044]">
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <ArrowDownLeft className="w-3 h-3" /> Income
                      </span>
                      <p className="text-sm font-black font-mono text-emerald-700 dark:text-emerald-400 mt-1 truncate">
                        {hideBalances ? '••••••' : formatETB(financialSummaryReport.daily.income, true)}
                      </p>
                    </div>
                    {/* Expense */}
                    <div className="p-2.5 rounded-lg bg-white dark:bg-[#1A2232] border border-slate-100 dark:border-[#223044]">
                      <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        <ArrowUpRight className="w-3 h-3" /> Expense
                      </span>
                      <p className="text-sm font-black font-mono text-rose-700 dark:text-rose-400 mt-1 truncate">
                        {hideBalances ? '••••••' : formatETB(financialSummaryReport.daily.expense, true)}
                      </p>
                    </div>
                  </div>

                  {/* Net Balance */}
                  <div className={`p-2.5 rounded-lg border flex items-center justify-between text-xs font-bold ${
                    financialSummaryReport.daily.net >= 0
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-800 dark:text-rose-300'
                  }`}>
                    <span>Daily Net Result:</span>
                    <span className="font-mono font-black text-sm">
                      {hideBalances ? '••••••' : formatETB(financialSummaryReport.daily.net, true)}
                    </span>
                  </div>
                </div>
              )}

              {/* 2. MONTHLY REPORT CARD */}
              {(reportTimeframe === 'ALL' || reportTimeframe === 'MONTHLY') && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#151C2A] border border-slate-200/80 dark:border-[#1C2638] space-y-3 relative overflow-hidden group hover:border-blue-500/40 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <PieChart className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                        Monthly Report (This Month)
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-medium bg-slate-200/60 dark:bg-[#1E2D40] px-2 py-0.5 rounded-md">
                      {financialSummaryReport.monthly.count} txs
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {/* Income */}
                    <div className="p-2.5 rounded-lg bg-white dark:bg-[#1A2232] border border-slate-100 dark:border-[#223044]">
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <ArrowDownLeft className="w-3 h-3" /> Income
                      </span>
                      <p className="text-sm font-black font-mono text-emerald-700 dark:text-emerald-400 mt-1 truncate">
                        {hideBalances ? '••••••' : formatETB(financialSummaryReport.monthly.income, true)}
                      </p>
                    </div>
                    {/* Expense */}
                    <div className="p-2.5 rounded-lg bg-white dark:bg-[#1A2232] border border-slate-100 dark:border-[#223044]">
                      <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        <ArrowUpRight className="w-3 h-3" /> Expense
                      </span>
                      <p className="text-sm font-black font-mono text-rose-700 dark:text-rose-400 mt-1 truncate">
                        {hideBalances ? '••••••' : formatETB(financialSummaryReport.monthly.expense, true)}
                      </p>
                    </div>
                  </div>

                  {/* Net Balance */}
                  <div className={`p-2.5 rounded-lg border flex items-center justify-between text-xs font-bold ${
                    financialSummaryReport.monthly.net >= 0
                      ? 'bg-blue-500/10 border-blue-500/20 text-blue-800 dark:text-blue-300'
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-800 dark:text-rose-300'
                  }`}>
                    <span>Monthly Net Profit:</span>
                    <span className="font-mono font-black text-sm">
                      {hideBalances ? '••••••' : formatETB(financialSummaryReport.monthly.net, true)}
                    </span>
                  </div>
                </div>
              )}

              {/* 3. YEARLY REPORT CARD */}
              {(reportTimeframe === 'ALL' || reportTimeframe === 'YEARLY') && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#151C2A] border border-slate-200/80 dark:border-[#1C2638] space-y-3 relative overflow-hidden group hover:border-purple-500/40 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                        Yearly Report ({new Date().getFullYear()})
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-medium bg-slate-200/60 dark:bg-[#1E2D40] px-2 py-0.5 rounded-md">
                      {financialSummaryReport.yearly.count} txs
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {/* Income */}
                    <div className="p-2.5 rounded-lg bg-white dark:bg-[#1A2232] border border-slate-100 dark:border-[#223044]">
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <ArrowDownLeft className="w-3 h-3" /> Income
                      </span>
                      <p className="text-sm font-black font-mono text-emerald-700 dark:text-emerald-400 mt-1 truncate">
                        {hideBalances ? '••••••' : formatETB(financialSummaryReport.yearly.income, true)}
                      </p>
                    </div>
                    {/* Expense */}
                    <div className="p-2.5 rounded-lg bg-white dark:bg-[#1A2232] border border-slate-100 dark:border-[#223044]">
                      <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        <ArrowUpRight className="w-3 h-3" /> Expense
                      </span>
                      <p className="text-sm font-black font-mono text-rose-700 dark:text-rose-400 mt-1 truncate">
                        {hideBalances ? '••••••' : formatETB(financialSummaryReport.yearly.expense, true)}
                      </p>
                    </div>
                  </div>

                  {/* Net Balance */}
                  <div className={`p-2.5 rounded-lg border flex items-center justify-between text-xs font-bold ${
                    financialSummaryReport.yearly.net >= 0
                      ? 'bg-purple-500/10 border-purple-500/20 text-purple-800 dark:text-purple-300'
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-800 dark:text-rose-300'
                  }`}>
                    <span>Yearly Net Profit:</span>
                    <span className="font-mono font-black text-sm">
                      {hideBalances ? '••••••' : formatETB(financialSummaryReport.yearly.net, true)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Active Equb Savings Pools */}
          <div className="bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-[#1C2638] rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1C2638] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">Active Equb Circles</h4>
                  <p className="text-[11px] text-slate-500 dark:text-[#8899BB] font-medium">Traditional Ethiopian rotating savings</p>
                </div>
              </div>

              <button
                onClick={() => onNavigateTab('equb')}
                className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
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
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#151C2A] border border-slate-200/80 dark:border-[#1C2638] hover:border-purple-400 transition-all space-y-2.5 cursor-pointer group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-purple-400 transition-colors">{e.name}</span>
                        <span className="text-[10px] font-mono font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 px-2 py-0.5 rounded-md">
                          Round #{e.currentRound} / {e.totalRounds}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between text-xs">
                        <span className="text-slate-500 dark:text-[#8899BB] font-medium">Payout Pot Size:</span>
                        <span className="font-mono font-black text-purple-600 dark:text-purple-400">
                          {hideBalances ? '••••••' : formatETB(potSize)}
                        </span>
                      </div>

                      <div className="w-full h-1.5 bg-slate-200 dark:bg-[#111622] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full transition-all"
                          style={{ width: `${roundProgress}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 font-medium">
                        <span>{e.members.length} Members</span>
                        <span>Due: {formatETB(e.contributionPerRound)} / {e.interval.toLowerCase().replace('_', ' ')}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN (1 Col) - Operational Intelligence & Ethiopian Agenda */}
        <div className="space-y-6">

          {/* Operational Alerts Card */}
          <div className="bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-[#1C2638] rounded-2xl p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1C2638] pb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500 animate-pulse" />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Operational Alerts
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full">
                  {notifications.length} Priority
                </span>
                {notifications.length > 0 && onClearAllNotifications && (
                  <button
                    onClick={() => {
                      triggerHaptic('medium');
                      onClearAllNotifications();
                    }}
                    className="text-[10px] font-bold text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
                    title="Clear all seen alerts"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    if (onDismissNotification) onDismissNotification(n.id);
                    if (n.actionTab) onNavigateTab(n.actionTab, n.actionSubView);
                  }}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-[#151C2A] border border-slate-200/80 dark:border-[#1C2638] hover:border-amber-400 transition-all cursor-pointer space-y-1 group relative"
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white overflow-hidden">
                      {n.icon}
                      <span className="truncate">{n.title}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[9px] font-mono font-medium text-slate-400">{n.time}</span>
                      {onDismissNotification && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerHaptic('light');
                            onDismissNotification(n.id);
                          }}
                          className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors cursor-pointer"
                          title="Mark as seen / Dismiss"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-[#8899BB] leading-snug">
                    {n.message}
                  </p>
                </div>
              ))}

              {notifications.length === 0 && (
                <div className="text-center py-6 text-slate-400 dark:text-slate-500 space-y-1">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 dark:text-[#00D4AA] mx-auto opacity-90" />
                  <p className="text-xs font-bold">No active operational alerts.</p>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Obligations Agenda */}
          <div className="bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-[#1C2638] rounded-2xl p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1C2638] pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500" />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Upcoming Agenda Dues
                </h4>
              </div>
              <button
                onClick={() => onNavigateTab('more', 'CALENDAR')}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
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
                        : 'bg-slate-50 dark:bg-[#151C2A] border-slate-200/80 dark:border-[#1C2638] hover:border-indigo-400'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.2 rounded block w-max"
                          style={{ backgroundColor: `${item.color}20`, color: item.color }}
                        >
                          {item.typeLabel}
                        </span>
                        {item.isExemptInPagume && (
                          <span className="text-[9px] font-bold bg-emerald-500 text-slate-950 px-1.5 py-0.2 rounded">
                            FREE IN Month 13 ጳጉሜ
                          </span>
                        )}
                      </div>
                      <h6 className="font-bold text-slate-900 dark:text-white truncate mt-0.5">{item.title}</h6>
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
          <div className="bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-[#1C2638] rounded-2xl p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1C2638] pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-orange-500" />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Active Loans
                </h4>
              </div>
              <button
                onClick={() => onNavigateTab('more', 'LOANS')}
                className="text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
              >
                Loans Hub →
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#151C2A] border border-slate-200/80 dark:border-[#1C2638] space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-500 dark:text-[#8899BB] font-medium">Outstanding Principal:</span>
                <span className="text-sm font-black font-mono text-orange-600 dark:text-orange-400">
                  {hideBalances ? '••••••' : formatETB(activeLoansTotal)}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200 dark:border-[#1C2638]">
                <span>Active Facility Count:</span>
                <span className="font-bold text-slate-800 dark:text-white">{activeLoans.length} Loans</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

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
  Wallet as WalletIcon
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
  onToggleHideBalances: () => void;
  onOpenQuickEntry: () => void;
  onOpenTransferModal: () => void;
  onNavigateTab: (tab: any) => void;
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
  onToggleHideBalances,
  onOpenQuickEntry,
  onOpenTransferModal,
  onNavigateTab
}) => {
  const totalBalance = calculateTotalBusinessBalance(wallets, transactions, transfers);
  const { income, expense, profit } = calculateMonthlyStats(transactions);
  const incomeAverages = calculateIncomeAverages(transactions);

  // Time-based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Recharts 7-Day Cash Flow Data
  const chartData = [
    { day: 'Mon', income: 45000, expense: 12000 },
    { day: 'Tue', income: 38000, expense: 28000 },
    { day: 'Wed', income: 52000, expense: 15000 },
    { day: 'Thu', income: 29000, expense: 21000 },
    { day: 'Fri', income: 68000, expense: 34000 },
    { day: 'Sat', income: 84000, expense: 42000 },
    { day: 'Sun', income: 34500, expense: 18000 }
  ];

  // Active items
  const activeEqubs = equbs.filter(e => e.status === 'ACTIVE');
  const activeLoans = loans.filter(l => l.status === 'ACTIVE');

  // Upcoming Financial Agenda list preview calculation for Dashboard
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
    }> = [];

    const now = new Date();
    const formatYMD = (d: Date) => d.toISOString().split('T')[0];

    equbs.forEach(e => {
      if (e.status === 'ACTIVE') {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);
        items.push({
          id: `equb-${e.id}`,
          title: `${e.name} (Round #${e.currentRound})`,
          amount: e.contributionPerRound,
          typeLabel: 'Equb Due',
          dateStr: formatYMD(d),
          dateObj: d,
          color: '#8B5CF6',
          direction: 'OUT'
        });
      }
    });

    loans.forEach(l => {
      if (l.status === 'ACTIVE') {
        const d = new Date(l.dueDate);
        items.push({
          id: `loan-${l.id}`,
          title: `Loan: ${l.title}`,
          amount: l.monthlyInstallment || l.outstandingBalance,
          typeLabel: 'Loan Repayment',
          dateStr: formatYMD(d),
          dateObj: d,
          color: '#F97316',
          direction: 'OUT'
        });
      }
    });

    recurring.forEach(r => {
      if (r.active) {
        const d = new Date(r.nextDueDate);
        items.push({
          id: `rec-${r.id}`,
          title: r.title,
          amount: r.amount,
          typeLabel: 'Recurring Bill',
          dateStr: formatYMD(d),
          dateObj: d,
          color: '#6366F1',
          direction: r.type === 'EXPENSE' ? 'OUT' : 'IN'
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
          direction: 'IN'
        });
      }
    });

    return items.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime()).slice(0, 5);
  }, [equbs, loans, recurring, receivables]);

  // Operational Alerts
  const notifications = React.useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      message: string;
      type: 'HIGH' | 'MEDIUM' | 'INFO';
      time: string;
      icon: React.ReactNode;
      actionTab?: any;
    }> = [];

    // Equb notifications
    activeEqubs.forEach(eq => {
      list.push({
        id: `notif-eq-${eq.id}`,
        title: `Equb Round #${eq.currentRound}`,
        message: `${eq.name} contribution of ${formatETB(eq.contributionPerRound)} is due.`,
        type: 'MEDIUM',
        time: 'Today',
        icon: <DollarSign className="w-3.5 h-3.5 text-amber-400" />,
        actionTab: 'equb'
      });
    });

    // Active Loan Notifications
    activeLoans.forEach(l => {
      list.push({
        id: `notif-loan-${l.id}`,
        title: `Loan Repayment Due`,
        message: `${l.lender} payment of ${formatETB(l.monthlyPayment)} scheduled. Remaining: ${formatETB(l.remainingBalance)}.`,
        type: 'HIGH',
        time: 'Upcoming',
        icon: <CreditCard className="w-3.5 h-3.5 text-red-400" />,
        actionTab: 'more'
      });
    });

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
          icon: <AlertTriangle className="w-3.5 h-3.5 text-red-400" />,
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
        title: `New Transaction Posted`,
        message: `${latestTx.description} (${latestTx.type === 'INCOME' ? '+' : '-'}${formatETB(latestTx.amount)}) by ${latestTx.creatorName}`,
        type: 'INFO',
        time: 'Recent',
        icon: <FileText className="w-3.5 h-3.5 text-[#00D4AA]" />,
        actionTab: 'transactions'
      });
    }

    return list;
  }, [activeEqubs, activeLoans, wallets, transactions, transfers]);

  const recentTxList = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);

  return (
    <div className="space-y-6 pb-24 animate-fadeIn">

      {/* 1. Header & Quick Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-[#1E2D40] p-4 rounded-2xl shadow-sm transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {greeting}, <span className="text-emerald-600 dark:text-[#00D4AA]">{currentUser.name.split(' ')[0]}</span>
            </h2>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-[#00D4AA]/20 dark:text-[#00D4AA] border border-emerald-200 dark:border-[#00D4AA]/30 px-2 py-0.5 rounded-full font-mono font-bold">
              {currentUser.role}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#8899BB] mt-0.5">
            {formattedDate} • <span className="text-slate-800 dark:text-white font-medium">{currentUser.branch} Branch</span>
          </p>
        </div>

        <div className="flex items-center gap-2 pt-1 sm:pt-0">
          <button
            onClick={() => {
              triggerHaptic('medium');
              onOpenQuickEntry();
            }}
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#00D4AA] to-[#00B894] text-[#0A0E1A] font-bold text-xs flex items-center justify-center gap-1.5 shadow-md hover:brightness-110 cursor-pointer transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Entry</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              onOpenTransferModal();
            }}
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] text-slate-800 dark:text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
          >
            <ArrowRightLeft className="w-4 h-4 text-blue-600 dark:text-[#3B82F6]" />
            <span>Transfer</span>
          </button>
        </div>
      </div>

      {/* 2. Hero Ledger Balance & MTD Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Hero Ledger Balance Card */}
        <div className="lg:col-span-1 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#00D4AA] via-[#00B894] to-[#009275] p-5 text-[#0A0E1A] shadow-xl border border-emerald-300 dark:border-[#00D4AA]/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0A0E1A]/80 flex items-center gap-1.5">
                <WalletIcon className="w-4 h-4" />
                Total Business Ledger
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

            <div className="mt-4">
              <h3 className="text-3xl font-black font-mono tracking-tight text-[#0A0E1A]">
                {hideBalances ? 'ETB ••••••••' : formatETB(totalBalance)}
              </h3>
              <div className="mt-2 inline-flex items-center gap-1.5 bg-[#0A0E1A]/15 border border-[#0A0E1A]/20 px-2.5 py-1 rounded-lg text-xs font-semibold text-[#0A0E1A]">
                <span>Net MTD Profit:</span>
                <span className="font-mono font-bold">
                  {hideBalances ? '••••••' : formatETB(profit)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-[#0A0E1A]/15 flex items-center justify-between text-xs font-bold text-[#0A0E1A]/90">
            <span>{wallets.length} Connected Wallets</span>
            <button
              onClick={() => onNavigateTab('wallets')}
              className="flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span>Manage</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Financial KPIs & Velocity Grid */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
          
          {/* MTD Income */}
          <div className="bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-[#1E2D40] rounded-2xl p-3.5 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ArrowDownLeft className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20">
                INCOME
              </span>
            </div>
            <div className="mt-3">
              <p className="text-[10px] text-slate-500 dark:text-[#8899BB] font-medium">Income (MTD)</p>
              <p className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
                {hideBalances ? '••••••' : formatETB(income, true)}
              </p>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-[#1E2D40] text-[9px] text-slate-500 dark:text-[#8899BB]">
              Avg: <span className="font-mono text-slate-900 dark:text-white font-bold">{hideBalances ? '••' : formatETB(incomeAverages.weeklyAvg, true)}/wk</span>
            </div>
          </div>

          {/* MTD Expense */}
          <div className="bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-[#1E2D40] rounded-2xl p-3.5 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-600 dark:text-red-400 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-bold text-rose-700 dark:text-red-400 bg-rose-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded-full border border-rose-200 dark:border-red-500/20">
                EXPENSE
              </span>
            </div>
            <div className="mt-3">
              <p className="text-[10px] text-slate-500 dark:text-[#8899BB] font-medium">Expense (MTD)</p>
              <p className="text-base font-bold font-mono text-rose-600 dark:text-red-400 mt-0.5 truncate">
                {hideBalances ? '••••••' : formatETB(expense, true)}
              </p>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-[#1E2D40] text-[9px] text-slate-500 dark:text-[#8899BB]">
              Active: <span className="font-mono text-slate-900 dark:text-white font-bold">{transactions.length} entries</span>
            </div>
          </div>

          {/* Net Margin */}
          <div className="bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-[#1E2D40] rounded-2xl p-3.5 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-[#00D4AA] flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-bold text-emerald-700 dark:text-[#00D4AA] bg-emerald-50 dark:bg-[#00D4AA]/10 px-1.5 py-0.5 rounded-full border border-emerald-200 dark:border-[#00D4AA]/20">
                MARGIN
              </span>
            </div>
            <div className="mt-3">
              <p className="text-[10px] text-slate-500 dark:text-[#8899BB] font-medium">Net Profit Margin</p>
              <p className="text-base font-bold font-mono text-emerald-600 dark:text-[#00D4AA] mt-0.5 truncate">
                {hideBalances ? '••••••' : formatETB(profit, true)}
              </p>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-[#1E2D40] text-[9px] text-slate-500 dark:text-[#8899BB]">
              Status: <span className="text-emerald-600 dark:text-emerald-400 font-bold">Healthy</span>
            </div>
          </div>

          {/* Monthly Velocity */}
          <div className="bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-[#1E2D40] rounded-2xl p-3.5 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-500/20">
                VELOCITY
              </span>
            </div>
            <div className="mt-3">
              <p className="text-[10px] text-slate-500 dark:text-[#8899BB] font-medium">Monthly Run Rate</p>
              <p className="text-base font-bold font-mono text-blue-600 dark:text-blue-400 mt-0.5 truncate">
                {hideBalances ? '••••••' : formatETB(incomeAverages.monthlyAvg, true)}
              </p>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-[#1E2D40] text-[9px] text-slate-500 dark:text-[#8899BB]">
              Tracked: <span className="font-mono text-slate-900 dark:text-white font-bold">30 Days</span>
            </div>
          </div>

        </div>

      </div>

      {/* 3. Active Business Wallets Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
            <WalletIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-[#00D4AA]" />
            Active Business Wallets
          </h4>
          <button
            onClick={() => onNavigateTab('wallets')}
            className="text-[11px] font-bold text-emerald-600 dark:text-[#00D4AA] hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            <span>View All ({wallets.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {wallets.map((w) => {
            const bal = calculateWalletBalance(w, transactions, transfers);
            return (
              <div
                key={w.id}
                onClick={() => onNavigateTab('wallets')}
                style={{
                  borderColor: `${w.color}45`,
                  boxShadow: `0 4px 15px ${w.color}10`
                }}
                className="bg-white dark:bg-[#131926] border rounded-2xl p-3.5 cursor-pointer transition-all space-y-2 group relative overflow-hidden hover:scale-[1.02]"
              >
                {/* Background glow circle using wallet color */}
                <div
                  className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-xl pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity"
                  style={{ backgroundColor: w.color }}
                />

                {/* Left accent color indicator */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                  style={{ backgroundColor: w.color }}
                />

                <div className="flex items-center justify-between relative z-10 pl-1">
                  <span className="text-[10px] text-slate-500 dark:text-[#8899BB] font-mono uppercase font-bold">{w.type.replace('_', ' ')}</span>
                  <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: w.color }} />
                </div>
                <div className="relative z-10 pl-1">
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white transition-colors truncate">{w.name}</h5>
                  <p className="text-sm font-black font-mono mt-1" style={{ color: w.color }}>
                    {hideBalances ? '••••••' : formatETB(bal, true)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Cash Flow Trend Chart */}
      <div className="bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-[#1E2D40] rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600 dark:text-[#00D4AA]" />
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">7-Day Cash Flow Trend</h4>
              <p className="text-[10px] text-slate-500 dark:text-[#8899BB]">Income vs Expense daily breakdown</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-bold">
            <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Income
            </span>
            <span className="flex items-center gap-1.5 text-rose-700 dark:text-red-400 bg-rose-50 dark:bg-red-500/10 px-2 py-0.5 rounded-md border border-rose-200 dark:border-red-500/20">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Expense
            </span>
          </div>
        </div>

        <div className="h-44 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="#64748B" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#FFF' }}
              />
              <Area type="monotone" dataKey="income" stroke="#22C55E" strokeWidth={2} fillOpacity={1} fill="url(#incomeGrad)" />
              <Area type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#expenseGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. Financial Calendar Agenda Section */}
      <div className="space-y-4">
        <div className="bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-[#1E2D40] rounded-2xl p-4 sm:p-5 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1E2D40] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-400 flex items-center justify-center font-bold shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Upcoming Financial Agenda</span>
                  <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded-full font-bold">
                    {upcomingAgendaItems.length} items
                  </span>
                </h4>
                <p className="text-[11px] font-medium text-slate-500 dark:text-[#8899BB]">
                  Scheduled obligations & upcoming financial events
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                triggerHaptic('medium');
                onNavigateTab('more', 'CALENDAR');
              }}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline cursor-pointer flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 transition-all shrink-0"
            >
              <span>View Full Calendar</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Agenda Preview Items */}
          {upcomingAgendaItems.length === 0 ? (
            <div
              onClick={() => {
                triggerHaptic('medium');
                onNavigateTab('more', 'CALENDAR');
              }}
              className="p-6 text-center text-slate-400 dark:text-[#8899BB] bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl cursor-pointer hover:border-indigo-400 transition-all space-y-1"
            >
              <CheckCircle2 className="w-7 h-7 text-emerald-500/60 mx-auto mb-1" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No Pending Obligations</p>
              <p className="text-[11px]">Click here to open the full Financial Calendar and Obligations page</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingAgendaItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    triggerHaptic('medium');
                    onNavigateTab('more', 'CALENDAR');
                  }}
                  className="bg-slate-50 hover:bg-indigo-50/60 dark:bg-[#1C2333] dark:hover:bg-[#222B3E] border border-slate-200 dark:border-[#1E2D40] hover:border-indigo-400 dark:hover:border-indigo-500/60 rounded-xl p-3 flex items-center justify-between cursor-pointer transition-all shadow-xs group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform"
                      style={{ backgroundColor: `${item.color}25`, color: item.color }}
                    >
                      {item.typeLabel.includes('Equb') && <Building2 className="w-4 h-4" />}
                      {item.typeLabel.includes('Loan') && <CreditCard className="w-4 h-4" />}
                      {item.typeLabel.includes('Recurring') && <Repeat className="w-4 h-4" />}
                      {item.typeLabel.includes('Receivable') && <FileCheck className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[9px] font-extrabold px-1.5 py-0.2 rounded"
                          style={{ backgroundColor: `${item.color}20`, color: item.color }}
                        >
                          {item.typeLabel}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-[#8899BB]">
                          {item.dateStr}
                        </span>
                      </div>
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {item.title}
                      </h5>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className={`text-xs font-mono font-extrabold ${item.direction === 'IN' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                      {item.direction === 'IN' ? '+' : '-'}{formatETB(item.amount)}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Ledger Transactions Preview */}
        <div className="bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-[#1E2D40] rounded-2xl p-4 space-y-3 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1E2D40] pb-2.5">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600 dark:text-[#00D4AA]" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Recent Ledger Transactions</h4>
                  <p className="text-[10px] text-slate-500 dark:text-[#8899BB]">Latest entry postings</p>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('transactions')}
                className="text-[11px] font-bold text-emerald-600 dark:text-[#00D4AA] hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 mt-3">
              {recentTxList.map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => onNavigateTab('transactions')}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0A0E1A] border border-slate-200 dark:border-[#1E2D40] hover:border-emerald-300 dark:hover:border-[#00D4AA]/40 transition-all flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      tx.type === 'INCOME'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                        : 'bg-rose-100 text-rose-700 dark:bg-red-500/15 dark:text-red-400'
                    }`}>
                      {tx.type === 'INCOME' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0">
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">{tx.description}</h5>
                      <p className="text-[10px] text-slate-500 dark:text-[#8899BB] truncate">
                        {tx.category} • <span className="text-slate-700 dark:text-gray-300">{tx.creatorName}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-2">
                    <p className={`text-xs font-bold font-mono ${
                      tx.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-red-400'
                    }`}>
                      {tx.type === 'INCOME' ? '+' : '-'}{hideBalances ? '••••' : formatETB(tx.amount)}
                    </p>
                    <span className="text-[9px] text-slate-400 dark:text-[#8899BB] font-mono">{tx.date}</span>
                  </div>
                </div>
              ))}

              {recentTxList.length === 0 && (
                <div className="text-center py-6 text-xs text-slate-500 dark:text-[#8899BB]">
                  No transactions recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};


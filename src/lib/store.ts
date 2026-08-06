import {
  UserProfile,
  Wallet,
  Transaction,
  Transfer,
  Equb,
  Loan,
  Asset,
  Goal,
  RecurringTemplate,
  Receivable,
  AuditLogEntry,
  Category,
  UserRole
} from '../types';
import { triggerHaptic } from './haptics';
import { DEFAULT_ROLE_PERMISSIONS, getEffectivePermissions } from './auth';

const STORAGE_KEY = 'pluszone_fin_erp_state_v12_daily_only';

export interface ERPState {
  currentUser: UserProfile;
  users: UserProfile[];
  wallets: Wallet[];
  transactions: Transaction[];
  transfers: Transfer[];
  equbs: Equb[];
  loans: Loan[];
  assets: Asset[];
  goals: Goal[];
  recurring: RecurringTemplate[];
  receivables: Receivable[];
  categories: Category[];
  auditLogs: AuditLogEntry[];
  approvalRequests?: any[];
  theme: 'dark' | 'light';
  hideBalances: boolean;
}

const DEFAULT_USERS: UserProfile[] = [
  {
    id: 'u-1',
    name: 'Yegeta Huawei',
    email: 'yegeta.huawei@gmail.com',
    username: 'yegeta',
    role: 'SuperAdmin',
    active: true,
    isApproved: true,
    invitationCode: 'PZ-SUPER-GOOGLE',
    hasSetPassword: true,
    password: 'password123',
    passwordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
    isTemporaryPassword: false,
    mustChangePassword: false,
    permissions: DEFAULT_ROLE_PERMISSIONS.SuperAdmin,
    branch: 'Addis Ababa HQ',
    lastActive: 'Just now'
  }
];

const DEFAULT_WALLETS: Wallet[] = [
  {
    id: 'w-1',
    name: 'HabeshaBiz Main Cash Account',
    type: 'CASH',
    accountNumber: 'HB-CASH-2026',
    openingBalance: 0,
    totalIn: 0,
    totalOut: 0,
    color: '#00D4AA',
    iconName: 'Building2',
    isDefault: true
  }
];

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Sales Revenue', type: 'INCOME', icon: 'TrendingUp', color: '#22C55E', active: true },
  { id: 'cat-2', name: 'Receivables Collected', type: 'INCOME', icon: 'CheckCircle', color: '#00D4AA', active: true },
  { id: 'cat-3', name: 'Equipment / Asset Purchase', type: 'EXPENSE', icon: 'HardDrive', color: '#64748B', active: true },
  { id: 'cat-4', name: 'Tax & License', type: 'EXPENSE', icon: 'FileText', color: '#EF4444', active: true },
  { id: 'cat-5', name: 'Electricity & Utilities', type: 'EXPENSE', icon: 'Zap', color: '#FB923C', active: true },
  { id: 'cat-6', name: 'Transportation', type: 'EXPENSE', icon: 'Truck', color: '#F5A623', active: true },
  { id: 'cat-7', name: 'Internet & Phone', type: 'EXPENSE', icon: 'Smartphone', color: '#6366F1', active: true },
  { id: 'cat-8', name: 'Food & Refreshments', type: 'EXPENSE', icon: 'Coffee', color: '#EC4899', active: true },
  { id: 'cat-9', name: 'Cleaning & Supplies', type: 'EXPENSE', icon: 'Package', color: '#14B8A6', active: true },
  { id: 'cat-10', name: 'Other & Home Expenses', type: 'EXPENSE', icon: 'Home', color: '#6B7280', active: true },
  { id: 'cat-11', name: 'Equb Contribution', type: 'EXPENSE', icon: 'Users', color: '#8B5CF6', active: true }
];

const DEFAULT_TRANSACTIONS: Transaction[] = [];

const DEFAULT_EQUBS: Equb[] = [
  {
    id: 'eq-agerye',
    name: 'Agerye Equb',
    members: [
      { id: 'm-ag-1', name: 'HabeshaBiz (Yegeta)', isWinner: true, wonRound: 20 },
      { id: 'm-ag-2', name: 'Agerye Member 2', isWinner: true, wonRound: 1 },
      { id: 'm-ag-3', name: 'Agerye Member 3', isWinner: true, wonRound: 2 },
      { id: 'm-ag-4', name: 'Agerye Member 4', isWinner: false }
    ],
    contributionPerRound: 5000,
    mySlots: 1,
    payoutsClaimed: 1,
    interval: 'EVERY_10_DAYS',
    currentRound: 20,
    totalRounds: 27,
    startDate: '2026-01-10T00:00:00.000Z',
    computedEndingDate: '2026-10-06T00:00:00.000Z',
    status: 'ACTIVE',
    walletId: 'w-1'
  },
  {
    id: 'eq-leli',
    name: 'Leli Equb',
    members: [
      { id: 'm-le-1', name: 'HabeshaBiz (Yegeta)', isWinner: true, wonRound: 8 },
      { id: 'm-le-2', name: 'Leli Member 2', isWinner: true, wonRound: 10 }
    ],
    contributionPerRound: 3000,
    mySlots: 1,
    payoutsClaimed: 1,
    interval: 'EVERY_10_DAYS',
    currentRound: 10,
    totalRounds: 10,
    startDate: '2026-04-10T00:00:00.000Z',
    computedEndingDate: '2026-07-20T00:00:00.000Z',
    status: 'COMPLETED',
    walletId: 'w-1'
  }
];
const DEFAULT_LOANS: Loan[] = [];
const DEFAULT_ASSETS: Asset[] = [];
const DEFAULT_GOALS: Goal[] = [];
const DEFAULT_RECURRING: RecurringTemplate[] = [];
const DEFAULT_RECEIVABLES: Receivable[] = [];

const DEFAULT_AUDIT_LOGS: AuditLogEntry[] = [];

export function loadInitialState(): ERPState {
  if (typeof window === 'undefined') {
    return createInitialState();
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed) {
        if (Array.isArray(parsed.users)) {
          parsed.users = parsed.users
            .filter((u: UserProfile) => u.email === 'yegeta.huawei@gmail.com' || u.username === 'yegeta')
            .map((u: UserProfile) => ({
              ...u,
              role: 'SuperAdmin' as UserRole,
              isApproved: true,
              active: true,
              hasSetPassword: true,
              password: u.password || 'password123',
              permissions: DEFAULT_ROLE_PERMISSIONS.SuperAdmin
            }));
        }

        if (!parsed.users || parsed.users.length === 0) {
          parsed.users = DEFAULT_USERS;
        }

        parsed.equbs = DEFAULT_EQUBS;
        parsed.loans = [];
        parsed.assets = [];
        parsed.receivables = [];
        parsed.transactions = DEFAULT_TRANSACTIONS;
        parsed.wallets = DEFAULT_WALLETS;
        parsed.categories = DEFAULT_CATEGORIES;
        parsed.currentUser = DEFAULT_USERS[0];
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse local storage ERP state:', e);
  }
  const state = createInitialState();
  saveStateToStorage(state);
  return state;
}

function createInitialState(): ERPState {
  return {
    currentUser: DEFAULT_USERS[0],
    users: DEFAULT_USERS,
    wallets: DEFAULT_WALLETS,
    transactions: DEFAULT_TRANSACTIONS,
    transfers: [],
    equbs: DEFAULT_EQUBS,
    loans: DEFAULT_LOANS,
    assets: DEFAULT_ASSETS,
    goals: DEFAULT_GOALS,
    recurring: DEFAULT_RECURRING,
    receivables: DEFAULT_RECEIVABLES,
    categories: DEFAULT_CATEGORIES,
    auditLogs: DEFAULT_AUDIT_LOGS,
    approvalRequests: [],
    theme: 'dark',
    hideBalances: false
  };
}

export function saveStateToStorage(state: ERPState) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save ERP state:', e);
    }
  }
}

/**
 * Calculations based on the ONE-LEDGER PRINCIPLE:
 * Wallet Balance = openingBalance + total Income Posted - total Expense Posted + Transfers In - Transfers Out
 */
export function calculateWalletBalance(wallet: Wallet, transactions: Transaction[], transfers: Transfer[]): number {
  let balance = wallet.openingBalance;

  for (const tx of transactions) {
    if (tx.reversed) continue;
    if (tx.walletId === wallet.id) {
      if (tx.type === 'INCOME') {
        balance += tx.amount;
      } else if (tx.type === 'EXPENSE') {
        balance -= tx.amount;
      }
    }
  }

  for (const tr of transfers) {
    if (tr.toWalletId === wallet.id) {
      balance += tr.amount;
    }
    if (tr.fromWalletId === wallet.id) {
      balance -= tr.amount;
    }
  }

  return balance;
}

export function calculateTotalBusinessBalance(wallets: Wallet[], transactions: Transaction[], transfers: Transfer[]): number {
  return wallets.reduce((acc, w) => acc + calculateWalletBalance(w, transactions, transfers), 0);
}

export function calculateMonthlyStats(transactions: Transaction[]) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let income = 0;
  let expense = 0;

  for (const tx of transactions) {
    if (tx.reversed) continue;
    const d = new Date(tx.date);
    if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
      if (tx.type === 'INCOME') {
        income += tx.amount;
      } else {
        expense += tx.amount;
      }
    }
  }

  const profit = income - expense;
  return { income, expense, profit };
}

export function calculateIncomeAverages(transactions: Transaction[]) {
  const validIncomes = transactions.filter(tx => !tx.reversed && tx.type === 'INCOME');
  if (validIncomes.length === 0) {
    return {
      weeklyAvg: 0,
      monthlyAvg: 0,
      dailyAvg: 0,
      currentWeekIncome: 0,
      currentMonthIncome: 0,
      totalIncome: 0
    };
  }

  const now = new Date();
  const nowMs = now.getTime();

  const timestamps = transactions.filter(t => !t.reversed).map(tx => new Date(tx.date).getTime());
  const minTime = timestamps.length > 0 ? Math.min(...timestamps) : nowMs;

  const daysDiff = Math.max(1, Math.ceil((nowMs - minTime) / (1000 * 60 * 60 * 24)));
  const weeksDiff = Math.max(1, daysDiff / 7);
  const monthsDiff = Math.max(1, daysDiff / 30);

  const totalIncome = validIncomes.reduce((sum, tx) => sum + tx.amount, 0);

  const dailyAvg = totalIncome / daysDiff;
  const weeklyAvg = totalIncome / weeksDiff;
  const monthlyAvg = totalIncome / monthsDiff;

  const sevenDaysAgo = nowMs - (7 * 24 * 60 * 60 * 1000);
  const currentWeekIncome = validIncomes
    .filter(tx => new Date(tx.date).getTime() >= sevenDaysAgo)
    .reduce((sum, tx) => sum + tx.amount, 0);

  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const currentMonthIncome = validIncomes
    .filter(tx => {
      const d = new Date(tx.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, tx) => sum + tx.amount, 0);

  return {
    dailyAvg,
    weeklyAvg,
    monthlyAvg,
    currentWeekIncome,
    currentMonthIncome,
    totalIncome
  };
}

export function isTransactionEditable(txDateString: string): boolean {
  if (!txDateString) return false;
  const txTime = new Date(txDateString).getTime();
  if (isNaN(txTime)) return false;
  const now = Date.now();
  const diffDays = (now - txTime) / (1000 * 60 * 60 * 24);
  // Transaction is editable if it's within the 7-day window (0 to 7 days old)
  return diffDays >= 0 && diffDays <= 7;
}

export function formatETB(amount: number, compact = false): string {
  if (compact) {
    if (Math.abs(amount) >= 1_000_000) {
      return `ETB ${(amount / 1_000_000).toFixed(2)}M`;
    }
    if (Math.abs(amount) >= 1_000) {
      return `ETB ${(amount / 1_000).toFixed(1)}K`;
    }
  }
  return `ETB ${Math.round(amount).toLocaleString('en-US')}`;
}

export interface SummedAmountResult {
  total: number;
  count: number;
  items: number[];
  isValid: boolean;
  formattedExpression: string;
}

/**
 * Parses user input amounts that can be single numbers or expressions/comma-separated values
 * Example: "40,50" -> 90, "40, 50, 100" -> 190, "40+50+10" -> 100, "40 50" -> 90
 */
export function parseSummedAmount(inputStr: string): SummedAmountResult {
  if (!inputStr || !inputStr.trim()) {
    return { total: 0, count: 0, items: [], isValid: false, formattedExpression: '' };
  }
  const trimmed = inputStr.trim();

  // If standard number without separators (e.g. "90" or "90.5")
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    const val = parseFloat(trimmed);
    const valid = !isNaN(val) && val > 0;
    return {
      total: valid ? val : 0,
      count: 1,
      items: valid ? [val] : [],
      isValid: valid,
      formattedExpression: valid ? `${val}` : ''
    };
  }

  // Standard thousand separator number (e.g. "1,000" or "10,500.50")
  if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(trimmed)) {
    const val = parseFloat(trimmed.replace(/,/g, ''));
    const valid = !isNaN(val) && val > 0;
    return {
      total: valid ? val : 0,
      count: 1,
      items: valid ? [val] : [],
      isValid: valid,
      formattedExpression: valid ? `${val}` : ''
    };
  }

  // Split by commas, plus signs, spaces, or newlines (e.g. "40,50", "40, 50, 100", "40+50+10.5")
  const rawTokens = trimmed.split(/[\s,+\n]+/);
  const validNumbers: number[] = [];

  for (const token of rawTokens) {
    if (!token) continue;
    const cleanToken = token.replace(/,/g, '');
    const num = parseFloat(cleanToken);
    if (!isNaN(num) && num > 0) {
      validNumbers.push(num);
    }
  }

  if (validNumbers.length === 0) {
    return { total: 0, count: 0, items: [], isValid: false, formattedExpression: '' };
  }

  const total = validNumbers.reduce((a, b) => a + b, 0);
  const roundedTotal = Math.round(total * 100) / 100;

  return {
    total: roundedTotal,
    count: validNumbers.length,
    items: validNumbers,
    isValid: roundedTotal > 0,
    formattedExpression: validNumbers.join(' + ')
  };
}


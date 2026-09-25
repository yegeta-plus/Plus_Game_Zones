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
  UserRole,
  ERPState,
  AutoImportSettings,
  PendingReviewTransaction,
  ChatChannel,
  ChatMessage,
  AutomatedEmailReportsSettings,
  SentReportEmailLog
} from '../types';
import { triggerHaptic } from './haptics';
import { DEFAULT_ROLE_PERMISSIONS, getEffectivePermissions } from './auth';
import { INITIAL_DATASET_JULY_AUG, COMBINED_TRANSACTIONS } from '../data/importedDataset';
import {
  NEW_AUGUST_SEPTEMBER_TRANSACTIONS,
  NEW_SEPTEMBER_TRANSFERS,
  NEW_SEPTEMBER_RECEIVABLES
} from '../data/newAugustSeptemberTransactions';
import {
  VERIFIED_OPENING_BALANCES,
  VERIFIED_TRANSACTIONS,
  VERIFIED_TRANSFERS,
  VERIFIED_RECEIVABLES
} from '../data/verifiedLedgerTransactions';
import { normalizeTransactionScopes, isPersonalExpense, resolveExpenseScope } from './expenseClassifier';
import { getActiveAuthSession } from './authSession';

export type { ERPState } from '../types';
export { isPersonalExpense, resolveExpenseScope, normalizeTransactionScopes };

const STORAGE_KEY = 'pluszone_fin_erp_state_v29_restored_history';

export const DEFAULT_AUTOMATED_EMAIL_REPORTS: AutomatedEmailReportsSettings = {
  enabled: true,
  dayOfMonth: 2, // Strictly every month 2nd day
  sendHourEAT: 8, // 08:00 AM EAT
  roles: ['SuperAdmin', 'Admin'], // Admin and SuperUser only
  includePdfAttachment: true,
  includeExcelAttachment: true,
  autoTriggerEnabled: true,
  lastSentPeriod: '',
  lastSentTimestamp: ''
};

export const DEFAULT_SENT_REPORT_LOGS: SentReportEmailLog[] = [
  {
    id: 'rpt-init-1',
    period: 'July 2026',
    sentAt: '2026-08-02T08:00:00.000Z',
    recipients: [
      { email: 'yegeta.huawei@gmail.com', name: 'Yegeta Huawei', role: 'SuperAdmin' }
    ],
    status: 'DELIVERED',
    subject: '[PlusZone ERP] Monthly Financial Statement & Banking Report - July 2026',
    triggerType: 'AUTOMATIC_SCHEDULE',
    summary: {
      totalBalance: 2450000,
      monthlyIncome: 380000,
      monthlyExpense: 145000,
      netProfit: 235000,
      activeWalletsCount: 5,
      outstandingReceivables: 185000,
      outstandingLoans: 300000,
      equbVolume: 75000
    }
  }
];

const DEFAULT_CHAT_CHANNELS: ChatChannel[] = [
  {
    id: 'general',
    name: 'General Lounge',
    type: 'PUBLIC',
    description: 'Company-wide team chat, general discussions & announcements',
    createdDate: new Date().toISOString()
  },
  {
    id: 'financial-approvals',
    name: 'Financial Approvals & Alerts',
    type: 'PUBLIC',
    description: 'Discuss pending transactions, expense reversals, and equb payouts',
    createdDate: new Date().toISOString()
  },
  {
    id: 'cashiers-team',
    name: 'Cashiers & Operations',
    type: 'PUBLIC',
    description: 'Daily cash register shifts, bank deposits & vault updates',
    createdDate: new Date().toISOString()
  }
];

const DEFAULT_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-welcome-1',
    channelId: 'general',
    senderId: 'u-1',
    senderName: 'Yegeta Huawei',
    senderRole: 'SuperAdmin',
    text: 'Welcome to Plus Game Zone Team Live Chat! 💬 Use this space to collaborate with cashiers, managers, and partners in real-time. You can link transactions, wallets, and send files directly!',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    isAnnouncement: true,
    reactions: [
      { emoji: '👋', count: 2, users: ['u-1'] },
      { emoji: '🚀', count: 1, users: ['u-1'] }
    ]
  }
];

const DEFAULT_USERS: UserProfile[] = [
  {
    id: 'u-1',
    name: 'Yegeta Huawei',
    email: 'yegeta.huawei@gmail.com',
    username: 'yegeta',
    role: 'SuperAdmin',
    active: true,
    isApproved: true,
    isDigitalMoneyManager: true, // SuperAdmin by default, can be delegated to another user
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
    id: 'w-telebirr',
    name: 'Telebirr',
    type: 'TELEBIRR',
    accountNumber: '0989367877',
    openingBalance: INITIAL_DATASET_JULY_AUG.openingBalances.telebirr,
    totalIn: 0,
    totalOut: 0,
    color: '#0EA5E9', // Light Blue background
    iconName: 'Smartphone',
    isDefault: false,
    status: 'ACTIVE',
    isCreditAccount: false,
    allowOverdraft: false
  },
  {
    id: 'w-cbe',
    name: 'CBE',
    type: 'CBE_BANK',
    accountNumber: '1000751694559', // CBE Account requested
    openingBalance: INITIAL_DATASET_JULY_AUG.openingBalances.cbe,
    totalIn: 0,
    totalOut: 0,
    color: '#8B5CF6', // Purple background
    iconName: 'Building2',
    isDefault: false,
    status: 'ACTIVE',
    isCreditAccount: false,
    allowOverdraft: false
  },
  {
    id: 'w-ebirr',
    name: 'eBirr',
    type: 'EBIRR',
    accountNumber: 'EB-998877',
    openingBalance: INITIAL_DATASET_JULY_AUG.openingBalances.ebirr,
    totalIn: 0,
    totalOut: 0,
    color: '#10B981', // Green background
    iconName: 'CreditCard',
    isDefault: false,
    status: 'ACTIVE',
    isCreditAccount: false,
    allowOverdraft: false
  },
  {
    id: 'w-cash',
    name: 'Cash',
    type: 'CASH',
    accountNumber: 'CASH-VAULT-01',
    openingBalance: INITIAL_DATASET_JULY_AUG.openingBalances.cash,
    totalIn: 0,
    totalOut: 0,
    color: '#F97316', // Orange background
    iconName: 'Banknote',
    isDefault: true,
    status: 'ACTIVE',
    isCreditAccount: false,
    allowOverdraft: false
  },
  {
    id: 'w-savings',
    name: 'Saving wallet',
    type: 'SAVINGS',
    accountNumber: 'SAVING-01',
    openingBalance: 0,
    totalIn: 0,
    totalOut: 0,
    color: '#3B82F6', // Blue background
    iconName: 'Vault',
    isDefault: false,
    status: 'ACTIVE',
    isCreditAccount: false,
    allowOverdraft: false
  }
];

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-0', name: 'Daily Income', type: 'INCOME', icon: 'TrendingUp', color: '#10B981', active: true },
  { id: 'cat-1', name: 'Sales Revenue', type: 'INCOME', icon: 'TrendingUp', color: '#22C55E', active: true },
  { id: 'cat-2', name: 'Daily Income / Collected', type: 'INCOME', icon: 'CheckCircle', color: '#8B5CF6', active: true },
  { id: 'cat-cap', name: 'Capital Injection', type: 'INCOME', icon: 'PlusCircle', color: '#3B82F6', active: true },
  { id: 'cat-lr', name: 'Loans Received', type: 'INCOME', icon: 'ArrowDownLeft', color: '#8B5CF6', active: true },
  { id: 'cat-purchase', name: 'Purchase', type: 'EXPENSE', icon: 'ShoppingBag', color: '#0EA5E9', active: true },
  { id: 'cat-3', name: 'Equipment / Asset Purchase', type: 'EXPENSE', icon: 'HardDrive', color: '#64748B', active: true },
  { id: 'cat-4', name: 'Tax & License', type: 'EXPENSE', icon: 'FileText', color: '#EF4444', active: true },
  { id: 'cat-5', name: 'Electricity & Utilities', type: 'EXPENSE', icon: 'Zap', color: '#FB923C', active: true },
  { id: 'cat-6', name: 'Transportation', type: 'EXPENSE', icon: 'Truck', color: '#F5A623', active: true },
  { id: 'cat-7', name: 'Internet & Phone', type: 'EXPENSE', icon: 'Smartphone', color: '#6366F1', active: true },
  { id: 'cat-8', name: 'Food & Refreshments', type: 'EXPENSE', icon: 'Coffee', color: '#EC4899', active: true },
  { id: 'cat-9', name: 'Cleaning & Supplies', type: 'EXPENSE', icon: 'Package', color: '#14B8A6', active: true },
  { id: 'cat-10', name: 'Other & Home Expenses', type: 'EXPENSE', icon: 'Home', color: '#6B7280', active: true },
  { id: 'cat-ow', name: 'Owner Withdrawal', type: 'EXPENSE', icon: 'UserMinus', color: '#F59E0B', active: true },
  { id: 'cat-11', name: 'Equb Contribution', type: 'EXPENSE', icon: 'Users', color: '#8B5CF6', active: true },
  { id: 'cat-12', name: 'Loan Repayments', type: 'EXPENSE', icon: 'ArrowUpRight', color: '#DC2626', active: true },
  { id: 'cat-bd', name: 'Bad Debt', type: 'EXPENSE', icon: 'AlertTriangle', color: '#DC2626', active: true },
  { id: 'cat-sec', name: 'Community & Security', type: 'EXPENSE', icon: 'Shield', color: '#3B82F6', active: true },
  { id: 'cat-exp', name: 'Expense', type: 'EXPENSE', icon: 'MinusCircle', color: '#EF4444', active: true },
  { id: 'cat-rc', name: 'Receivable Created', type: 'INCOME', icon: 'Clock', color: '#6366F1', active: true },
  { id: 'cat-gen', name: 'Genesis / Setup', type: 'INCOME', icon: 'Settings', color: '#64748B', active: true },
  { id: 'cat-ob', name: 'Opening Balance', type: 'INCOME', icon: 'Landmark', color: '#3B82F6', active: true }
];

export const DEFAULT_TRANSACTIONS: Transaction[] = INITIAL_DATASET_JULY_AUG.transactions;

const DEFAULT_EQUBS: Equb[] = INITIAL_DATASET_JULY_AUG.equbs;
const DEFAULT_LOANS: Loan[] = INITIAL_DATASET_JULY_AUG.loans;
const DEFAULT_ASSETS: Asset[] = INITIAL_DATASET_JULY_AUG.assets;
const DEFAULT_GOALS: Goal[] = [];
export const DEFAULT_RECURRING: RecurringTemplate[] = [
  {
    id: 'rec-internet-monthly',
    title: 'Internet & Fiber Subscription',
    amount: 1010,
    type: 'EXPENSE',
    category: 'Utilities & Internet',
    walletId: 'w-telebirr',
    frequency: 'MONTHLY',
    nextDueDate: '2026-09-01T00:00:00.000Z',
    autoProcess: false,
    status: 'ACTIVE',
    notes: 'ETB 1,010 monthly internet fee. Manual confirmation required.'
  },
  {
    id: 'rec-electricity-3w',
    title: 'Electricity Prepaid Units (3-4 Weeks)',
    amount: 2050,
    type: 'EXPENSE',
    category: 'Utilities & Internet',
    walletId: 'w-telebirr',
    frequency: 'EVERY_3_WEEKS',
    nextDueDate: '2026-09-07T00:00:00.000Z',
    autoProcess: false,
    status: 'ACTIVE',
    notes: 'ETB 2,050 electricity unit refill every 3 to 4 weeks. Manual confirmation required.'
  },
  {
    id: 'rec-water-2m',
    title: 'Municipal Water Utility (Bi-Monthly)',
    amount: 450,
    type: 'EXPENSE',
    category: 'Utilities & Internet',
    walletId: 'w-telebirr',
    frequency: 'EVERY_2_MONTHS',
    nextDueDate: '2026-09-15T00:00:00.000Z',
    autoProcess: false,
    status: 'ACTIVE',
    notes: 'Municipal water bill payable every 2 months. Manual confirmation required.'
  },
  {
    id: 'rec-police-2m',
    title: 'Community Police & Security Dues (Bi-Monthly)',
    amount: 500,
    type: 'EXPENSE',
    category: 'Rent & Lease',
    walletId: 'w-cash',
    frequency: 'EVERY_2_MONTHS',
    nextDueDate: '2026-09-20T00:00:00.000Z',
    autoProcess: false,
    status: 'ACTIVE',
    notes: 'Community security & police contribution every 2 months. Manual confirmation required.'
  },
  {
    id: 'rec-transport-p1',
    title: 'Staff Transport - Person 1 (Early Month)',
    amount: 1000,
    type: 'EXPENSE',
    category: 'Payroll & Wages',
    walletId: 'w-telebirr',
    frequency: 'MONTHLY',
    nextDueDate: '2026-09-05T00:00:00.000Z',
    autoProcess: false,
    status: 'ACTIVE',
    beneficiary: 'Person 1',
    notes: 'Staff transport allowance for Person 1 (ETB 1,000 on 5th of month). Manual confirmation required.'
  },
  {
    id: 'rec-transport-p2',
    title: 'Staff Transport - Person 2 (Mid Month)',
    amount: 1000,
    type: 'EXPENSE',
    category: 'Payroll & Wages',
    walletId: 'w-telebirr',
    frequency: 'MONTHLY',
    nextDueDate: '2026-09-15T00:00:00.000Z',
    autoProcess: false,
    status: 'ACTIVE',
    beneficiary: 'Person 2',
    notes: 'Staff transport allowance for Person 2 (ETB 1,000 on 15th of month). Manual confirmation required.'
  },
  {
    id: 'rec-transport-p3',
    title: 'Staff Transport - Person 3 (End Month)',
    amount: 1000,
    type: 'EXPENSE',
    category: 'Payroll & Wages',
    walletId: 'w-telebirr',
    frequency: 'MONTHLY',
    nextDueDate: '2026-09-25T00:00:00.000Z',
    autoProcess: false,
    status: 'ACTIVE',
    beneficiary: 'Person 3',
    notes: 'Staff transport allowance for Person 3 (ETB 1,000 on 25th of month). Manual confirmation required.'
  }
];
const DEFAULT_RECEIVABLES: Receivable[] = INITIAL_DATASET_JULY_AUG.receivables;

export function evaluateReceivableStatus(r: Receivable): 'OUTSTANDING' | 'COLLECTED' | 'WRITTEN_OFF' | 'LATE' {
  if (r.status === 'COLLECTED' || r.amountCollected >= r.amountOwed) {
    return 'COLLECTED';
  }
  if (r.status === 'WRITTEN_OFF') {
    return 'WRITTEN_OFF';
  }
  const createdTime = r.createdDate ? new Date(r.createdDate).getTime() : 0;
  const dueTime = r.dueDate ? new Date(r.dueDate).getTime() : 0;
  const now = Date.now();
  const daysSinceCreated = createdTime ? (now - createdTime) / (1000 * 60 * 60 * 24) : 0;
  const daysSinceDue = dueTime ? (now - dueTime) / (1000 * 60 * 60 * 24) : 0;

  if (daysSinceCreated >= 15 || daysSinceDue >= 15 || r.status === 'LATE' || r.status === 'OVERDUE') {
    return 'LATE';
  }
  return 'OUTSTANDING';
}

export function syncReceivablesLateStatus(receivables: Receivable[]): Receivable[] {
  if (!Array.isArray(receivables)) return [];
  return receivables.map(r => {
    const computedStatus = evaluateReceivableStatus(r);
    if (computedStatus !== r.status) {
      return { ...r, status: computedStatus };
    }
    return r;
  });
}

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
        if (Array.isArray(parsed.users) && parsed.users.length > 0) {
          const sampleUserIds = new Set(['u-2', 'u-3', 'u-4']);
          const sampleEmails = new Set(['kirubel@pluszone.com', 'bethelhem@pluszone.com', 'dagmawi@pluszone.com']);
          const sampleNames = new Set(['Kirubel Haile', 'Bethelhem Tadesse', 'Dagmawi Bekele']);

          parsed.users = parsed.users
            .filter((u: UserProfile) => {
              if (!u) return false;
              if (sampleUserIds.has(u.id)) return false;
              if (u.email && (sampleEmails.has(u.email.toLowerCase()) || u.email.toLowerCase().endsWith('@pluszone.com'))) return false;
              if (u.name && sampleNames.has(u.name)) return false;
              return true;
            })
            .map((u: UserProfile) => {
              if (u.email === 'ygyegeta@gmail.com' || u.email === 'yegeta.huawei@gmail.com' || u.username === 'yegeta') {
                return {
                  ...u,
                  role: 'SuperAdmin' as UserRole,
                  isApproved: true,
                  active: true,
                  hasSetPassword: true,
                  password: u.password || 'password123',
                  permissions: DEFAULT_ROLE_PERMISSIONS.SuperAdmin
                };
              }
              return u;
            });

          const hasSuper = parsed.users.some((u: UserProfile) => u.role === 'SuperAdmin' || u.id === 'u-1');
          if (!hasSuper) {
            parsed.users = [DEFAULT_USERS[0], ...parsed.users];
          }
        } else {
          parsed.users = DEFAULT_USERS;
        }

        // Synchronize canonical equbs with verified rounds, obligations, and statuses
        const canonicalEqubs = INITIAL_DATASET_JULY_AUG.equbs;
        const canonicalEqubMap = new Map(canonicalEqubs.map(e => [e.id, e]));
        if (!Array.isArray(parsed.equbs) || parsed.equbs.length === 0) {
          parsed.equbs = canonicalEqubs;
        } else {
          parsed.equbs = parsed.equbs.map((existingEqub: Equb) => {
            const canonical = canonicalEqubMap.get(existingEqub.id);
            if (canonical) {
              return {
                ...existingEqub,
                currentRound: canonical.currentRound,
                completedRounds: canonical.completedRounds,
                totalRounds: canonical.totalRounds,
                contributionPerRound: canonical.contributionPerRound,
                status: canonical.status,
                isOverdue: canonical.isOverdue,
                members: canonical.members,
                payoutsClaimed: canonical.payoutsClaimed
              };
            }
            return existingEqub;
          });
          const existingEqubIds = new Set(parsed.equbs.map((e: Equb) => e.id));
          for (const canonical of canonicalEqubs) {
            if (!existingEqubIds.has(canonical.id)) {
              parsed.equbs.push(canonical);
              existingEqubIds.add(canonical.id);
            }
          }
        }

        parsed.assets = Array.isArray(parsed.assets) ? parsed.assets : [];
        parsed.receivables = Array.isArray(parsed.receivables) ? syncReceivablesLateStatus(parsed.receivables) : [];
        parsed.transactions = Array.isArray(parsed.transactions) ? parsed.transactions : [];

        // Synchronize canonical loans with verified debt balances, repayment types, and statuses
        const canonicalLoans = INITIAL_DATASET_JULY_AUG.loans;
        const canonicalLoanMap = new Map(canonicalLoans.map(l => [l.id, l]));
        if (!Array.isArray(parsed.loans) || parsed.loans.length === 0) {
          parsed.loans = canonicalLoans;
        } else {
          parsed.loans = parsed.loans.map((existingLoan: Loan) => {
            const canonical = canonicalLoanMap.get(existingLoan.id);
            if (canonical) {
              return {
                ...existingLoan,
                repaymentType: canonical.repaymentType || existingLoan.repaymentType,
                dueDate: canonical.dueDate,
                initialAmount: canonical.initialAmount,
                outstandingBalance: canonical.outstandingBalance,
                status: canonical.status,
                monthlyInstallment: canonical.monthlyInstallment,
                payments: canonical.payments.length > 0 ? canonical.payments : existingLoan.payments
              };
            }
            return existingLoan;
          });
          // Add any missing canonical loans
          const existingLoanIds = new Set(parsed.loans.map((l: Loan) => l.id));
          for (const canonical of canonicalLoans) {
            if (!existingLoanIds.has(canonical.id)) {
              parsed.loans.push(canonical);
              existingLoanIds.add(canonical.id);
            }
          }
        }
        // Strictly load verified transactions, transfers, receivables, and opening balances requested by user
        // Ensure PS4 Pro purchase is in Purchase category and Sep 10 - 12 (closed days) are excluded
        parsed.transactions = (COMBINED_TRANSACTIONS || []).map((t: Transaction) => {
          let category = t.category;
          if (t.id === 'tx-20260707-08' || (t.description && /ps.*pro.*purchase/i.test(t.description))) {
            category = 'Purchase';
          }
          return {
            ...t,
            category,
            expenseScope: t.type === 'EXPENSE' ? (t.expenseScope || 'BUSINESS') : undefined
          };
        }).filter((t: Transaction) => {
          const d = t.date ? t.date.slice(0, 10) : '';
          return d !== '2026-09-10' && d !== '2026-09-11' && d !== '2026-09-12';
        });

        parsed.transfers = (VERIFIED_TRANSFERS || []).filter((tr: Transfer) => {
          const d = tr.date ? tr.date.slice(0, 10) : '';
          return d !== '2026-09-10' && d !== '2026-09-11' && d !== '2026-09-12';
        });
        parsed.receivables = VERIFIED_RECEIVABLES;
        if (Array.isArray(parsed.wallets)) {
          parsed.wallets = parsed.wallets.map((w: Wallet) => {
            if (w.id === 'w-cash' || w.type === 'CASH') return { ...w, openingBalance: VERIFIED_OPENING_BALANCES.cash };
            if (w.id === 'w-telebirr' || w.type === 'TELEBIRR') return { ...w, openingBalance: VERIFIED_OPENING_BALANCES.telebirr };
            if (w.id === 'w-cbe' || w.type === 'CBE_BANK') return { ...w, openingBalance: VERIFIED_OPENING_BALANCES.cbe };
            if (w.id === 'w-ebirr' || w.type === 'EBIRR') return { ...w, openingBalance: VERIFIED_OPENING_BALANCES.ebirr };
            return w;
          });
        }

        // Deduplicate any accidental duplicate receivable collection transactions created within seconds of each other
        const seenRcvKeys = new Set<string>();
        parsed.transactions = parsed.transactions.filter((t: Transaction) => {
          if (t.refType === 'RECEIVABLE' && t.refId) {
            const timeBucket = Math.floor(new Date(t.date).getTime() / 10000);
            const key = `${t.refId}_${t.amount}_${timeBucket}`;
            if (seenRcvKeys.has(key)) {
              return false;
            }
            seenRcvKeys.add(key);
          }
          return true;
        });

        // Consolidate any sibling split Equb transactions into single unified entries with total amount and split breakdowns
        parsed.transactions = consolidateEqubSplitTransactions(parsed.transactions, parsed.wallets);
        // Enforce wallet brand colors & CBE account number update
        let currentWallets: Wallet[] = Array.isArray(parsed.wallets) && parsed.wallets.length > 0 ? parsed.wallets : DEFAULT_WALLETS;
        
        // Ensure default 4 wallets exist and are formatted
        const defaultMap = new Map(DEFAULT_WALLETS.map(w => [w.type, w]));
        
        currentWallets = currentWallets.map(w => {
          const status = w.status || (w.isArchived ? 'ARCHIVED' : w.isDisabled ? 'DISABLED' : 'ACTIVE');
          const isCredit = w.isCreditAccount === true || w.type === 'CREDIT_LINE' || w.type === 'LOAN';
          if (w.type === 'CBE_BANK') {
            return {
              ...w,
              name: 'CBE',
              accountNumber: w.accountNumber && w.accountNumber !== '1000123456789' ? w.accountNumber : '1000751694559',
              color: '#8B5CF6', // Purple
              status,
              isCreditAccount: isCredit,
              allowOverdraft: w.allowOverdraft ?? isCredit
            };
          }
          if (w.type === 'CASH') {
            return {
              ...w,
              name: 'Cash',
              color: '#F97316',
              status,
              isCreditAccount: isCredit,
              allowOverdraft: w.allowOverdraft ?? isCredit
            };
          }
          if (w.type === 'TELEBIRR') {
            return {
              ...w,
              name: 'Telebirr',
              accountNumber: w.accountNumber && w.accountNumber !== '0911002233' ? w.accountNumber : '0989367877',
              color: '#0EA5E9',
              status,
              isCreditAccount: isCredit,
              allowOverdraft: w.allowOverdraft ?? isCredit
            };
          }
          if (w.type === 'EBIRR') {
            return {
              ...w,
              name: 'eBirr',
              color: '#10B981',
              status,
              isCreditAccount: isCredit,
              allowOverdraft: w.allowOverdraft ?? isCredit
            };
          }
          if (w.type === 'SAVINGS' || w.id === 'w-savings') {
            return {
              ...w,
              name: 'Saving wallet',
              color: '#3B82F6',
              status,
              isCreditAccount: isCredit,
              allowOverdraft: w.allowOverdraft ?? isCredit
            };
          }
          return {
            ...w,
            status,
            isCreditAccount: isCredit,
            allowOverdraft: w.allowOverdraft ?? isCredit
          };
        });

        // Add missing default types if not present
        DEFAULT_WALLETS.forEach(def => {
          if (!currentWallets.some(w => w.id === def.id || w.type === def.type)) {
            currentWallets.push(def);
          }
        });

        parsed.wallets = currentWallets;
        parsed.categories = Array.isArray(parsed.categories) && parsed.categories.length > 0 ? parsed.categories : DEFAULT_CATEGORIES;
        if (!parsed.categories.some((c: Category) => c.name === 'Community & Security')) {
          parsed.categories.push({ id: 'cat-sec', name: 'Community & Security', type: 'EXPENSE', icon: 'Shield', color: '#3B82F6', active: true });
        }
        if (!parsed.categories.some((c: Category) => c.name === 'Purchase')) {
          parsed.categories.push({ id: 'cat-purchase', name: 'Purchase', type: 'EXPENSE', icon: 'ShoppingBag', color: '#0EA5E9', active: true });
        }
        
        // Ensure default recurring schedules exist if empty or missing, filtering out removed rent
        let currentRecurring: RecurringTemplate[] = Array.isArray(parsed.recurring) ? parsed.recurring : [];
        currentRecurring = currentRecurring.filter(r => r.id !== 'rec-rent-quarterly' && !r.title.toLowerCase().includes('commercial lounge rent'));
        if (currentRecurring.length === 0) {
          currentRecurring = [...DEFAULT_RECURRING];
        } else {
          const deletedIds = Array.isArray(parsed.deletedEntityIds) ? parsed.deletedEntityIds : [];
          DEFAULT_RECURRING.forEach(def => {
            if (!currentRecurring.some(r => r.id === def.id) && !deletedIds.includes(def.id)) {
              currentRecurring.push(def);
            }
          });
        }
        parsed.recurring = currentRecurring;
        parsed.transfers = Array.isArray(parsed.transfers) ? parsed.transfers : [];
        parsed.goals = Array.isArray(parsed.goals) ? parsed.goals : DEFAULT_GOALS;
        parsed.auditLogs = Array.isArray(parsed.auditLogs) ? parsed.auditLogs : DEFAULT_AUDIT_LOGS;
        // Ensure single Digital Money Manager user is set
        const managerUser = parsed.users.find((u: UserProfile) => u.isDigitalMoneyManager);
        if (!managerUser && parsed.users.length > 0) {
          parsed.users[0].isDigitalMoneyManager = true;
          parsed.digitalMoneyManagerUserId = parsed.users[0].id;
        } else if (managerUser) {
          parsed.digitalMoneyManagerUserId = managerUser.id;
        }

        parsed.autoImportSettings = parsed.autoImportSettings || {
          enabled: true,
          importMethod: 'BOTH',
          selectedProvider: 'ALL',
          autoCategorize: true,
          notifyOnNewPending: true
        };

        parsed.pendingReviewTransactions = Array.isArray(parsed.pendingReviewTransactions)
          ? parsed.pendingReviewTransactions
          : [];

        parsed.chatChannels = Array.isArray(parsed.chatChannels) && parsed.chatChannels.length > 0 ? parsed.chatChannels : DEFAULT_CHAT_CHANNELS;
        let loadedChatMessages = Array.isArray(parsed.chatMessages) && parsed.chatMessages.length > 0 ? parsed.chatMessages : DEFAULT_CHAT_MESSAGES;
        // Purge legacy sample approval request from chat
        loadedChatMessages = loadedChatMessages.filter((m: ChatMessage) => m.id !== 'msg-welcome-2' && m.reference?.id !== 'req-sample-1');
        parsed.chatMessages = loadedChatMessages;
        parsed.automatedEmailReportsSettings = parsed.automatedEmailReportsSettings || DEFAULT_AUTOMATED_EMAIL_REPORTS;
        parsed.sentReportEmailLogs = Array.isArray(parsed.sentReportEmailLogs) && parsed.sentReportEmailLogs.length > 0 ? parsed.sentReportEmailLogs : DEFAULT_SENT_REPORT_LOGS;
        parsed.deletedEntityIds = Array.isArray(parsed.deletedEntityIds) ? parsed.deletedEntityIds : [];

        // Ensure users list is populated without any legacy sample accounts
        const sampleUserIds = new Set(['u-2', 'u-3', 'u-4']);
        const sampleEmails = new Set(['kirubel@pluszone.com', 'bethelhem@pluszone.com', 'dagmawi@pluszone.com']);

        if (Array.isArray(parsed.users)) {
          const userMap = new Map<string, UserProfile>();
          for (const u of DEFAULT_USERS) userMap.set(u.id, u);
          for (const u of parsed.users) {
            if (!sampleUserIds.has(u.id) && !sampleEmails.has((u.email || '').toLowerCase()) && !(u.email || '').toLowerCase().endsWith('@pluszone.com')) {
              userMap.set(u.id, u);
            }
          }
          parsed.users = Array.from(userMap.values());
        } else {
          parsed.users = DEFAULT_USERS;
        }

        // Preserve currently logged-in user session if available
        const activeAuthSession = getActiveAuthSession();
        if (activeAuthSession) {
          const authUser =
            (Array.isArray(parsed.users)
              ? parsed.users.find(
                  (u: UserProfile) =>
                    u.id === activeAuthSession.userId ||
                    (activeAuthSession.email && u.email?.toLowerCase() === activeAuthSession.email.toLowerCase())
                )
              : null) || activeAuthSession.user;

          if (authUser && authUser.active !== false) {
            parsed.currentUser = authUser;
            if (Array.isArray(parsed.users) && !parsed.users.some((u: UserProfile) => u.id === authUser.id)) {
              parsed.users.push(authUser);
            }
          } else if (parsed.currentUser && parsed.currentUser.id) {
            const matchingUser = parsed.users.find((u: UserProfile) => u.id === parsed.currentUser.id || u.email?.toLowerCase() === parsed.currentUser.email?.toLowerCase());
            parsed.currentUser = matchingUser || DEFAULT_USERS[0];
          } else {
            parsed.currentUser = parsed.users?.[0] || DEFAULT_USERS[0];
          }
        } else if (parsed.currentUser && parsed.currentUser.id && Array.isArray(parsed.users)) {
          const matchingUser = parsed.users.find((u: UserProfile) => u.id === parsed.currentUser.id || u.email?.toLowerCase() === parsed.currentUser.email?.toLowerCase());
          parsed.currentUser = matchingUser || DEFAULT_USERS[0];
        } else {
          parsed.currentUser = parsed.users?.[0] || DEFAULT_USERS[0];
        }
        const userExplicitCal = typeof window !== 'undefined' ? (localStorage.getItem('pluszone_calendar_user_choice') as 'ETHIOPIAN' | 'GREGORIAN' | null) : null;
        parsed.calendarType = userExplicitCal || (parsed.calendarType === 'ETHIOPIAN' && !userExplicitCal ? 'GREGORIAN' : parsed.calendarType) || 'GREGORIAN';
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
  const activeAuthSession = getActiveAuthSession();
  const sessionUser = activeAuthSession
    ? (DEFAULT_USERS.find(
        (u) =>
          u.id === activeAuthSession.userId ||
          (activeAuthSession.email && u.email?.toLowerCase() === activeAuthSession.email.toLowerCase())
      ) || activeAuthSession.user)
    : undefined;

  const initialUsers = sessionUser && !DEFAULT_USERS.some(u => u.id === sessionUser.id)
    ? [...DEFAULT_USERS, sessionUser]
    : DEFAULT_USERS;

  return {
    currentUser: sessionUser || DEFAULT_USERS[0],
    users: initialUsers,
    wallets: DEFAULT_WALLETS,
    transactions: consolidateEqubSplitTransactions(DEFAULT_TRANSACTIONS, DEFAULT_WALLETS),
    transfers: INITIAL_DATASET_JULY_AUG.transfers,
    equbs: DEFAULT_EQUBS,
    loans: DEFAULT_LOANS,
    assets: DEFAULT_ASSETS,
    goals: DEFAULT_GOALS,
    recurring: DEFAULT_RECURRING,
    receivables: DEFAULT_RECEIVABLES,
    categories: DEFAULT_CATEGORIES,
    auditLogs: DEFAULT_AUDIT_LOGS,
    approvalRequests: [],
    digitalMoneyManagerUserId: DEFAULT_USERS[0].id,
    autoImportSettings: {
      enabled: true,
      importMethod: 'BOTH',
      selectedProvider: 'ALL',
      autoCategorize: true,
      notifyOnNewPending: true
    },
    pendingReviewTransactions: [],
    chatChannels: DEFAULT_CHAT_CHANNELS,
    chatMessages: DEFAULT_CHAT_MESSAGES,
    automatedEmailReportsSettings: DEFAULT_AUTOMATED_EMAIL_REPORTS,
    sentReportEmailLogs: DEFAULT_SENT_REPORT_LOGS,
    deletedEntityIds: [],
    theme: 'dark',
    hideBalances: false,
    calendarType: 'GREGORIAN'
  };
}

export function saveStateToStorage(state: ERPState) {
  if (typeof window !== 'undefined') {
    try {
      const stateToPersist = {
        ...state,
        transactions: consolidateEqubSplitTransactions(state.transactions, state.wallets)
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToPersist));
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
  let balance = wallet.openingBalance || 0;

  // Active ledger period begins on 2026-09-07 where the user defined verified opening balances.
  // Prior period transactions (July 1 - Sep 6) are preserved for historical audit & reporting.
  // Sep 10 - 12 the business was closed for Ethiopian New Year (0 transactions; strictly no effect on wallet balances).
  const activePeriodStart = '2026-09-07T00:00:00.000Z';
  const activeTransactions = transactions.filter(tx => {
    if (tx.date < activePeriodStart) return false;
    const d = tx.date ? tx.date.slice(0, 10) : '';
    if (d === '2026-09-10' || d === '2026-09-11' || d === '2026-09-12') return false;
    return true;
  });
  const activeTransfers = transfers.filter(tr => {
    if (tr.date < activePeriodStart) return false;
    const d = tr.date ? tr.date.slice(0, 10) : '';
    if (d === '2026-09-10' || d === '2026-09-11' || d === '2026-09-12') return false;
    return true;
  });

  for (const tx of activeTransactions) {
    if (tx.reversed) continue;
    if (tx.splits && tx.splits.length > 0) {
      const split = tx.splits.find(s => s.walletId === wallet.id);
      if (split) {
        if (tx.type === 'INCOME') {
          balance += Math.abs(split.amount);
        } else {
          balance -= Math.abs(split.amount);
        }
      }
    } else if (tx.walletId === wallet.id) {
      if (tx.type === 'INCOME') {
        balance += Math.abs(tx.amount);
      } else if (tx.type === 'EXPENSE') {
        balance -= Math.abs(tx.amount);
      }
    }
  }

  for (const tr of activeTransfers) {
    if (tr.toWalletId === wallet.id) {
      balance += Math.abs(tr.amount);
    }
    if (tr.fromWalletId === wallet.id) {
      balance -= Math.abs(tr.amount);
    }
  }

  // Strict non-negative guarantee for wallets (wallet balances cannot drop below ETB 0)
  return Math.max(0, balance);
}

export function calculateTotalBusinessBalance(wallets: Wallet[], transactions: Transaction[], transfers: Transfer[]): number {
  return Math.max(0, wallets.reduce((acc, w) => acc + calculateWalletBalance(w, transactions, transfers), 0));
}

/**
 * Balance & Wallet Rules:
 * Wallets strictly do NOT allow negative balances / overdrafts.
 */
export function isOverdraftAllowed(_wallet?: Wallet): boolean {
  return false;
}

/**
 * Balance & Wallet Rules:
 * 2. Checks if a wallet exists and is active (not archived or disabled).
 */
export function isWalletActive(wallet?: Wallet): boolean {
  if (!wallet) return false;
  if (wallet.status === 'ARCHIVED' || wallet.status === 'DISABLED') return false;
  if (wallet.isArchived === true || wallet.isDisabled === true) return false;
  return true;
}

export interface WalletValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates transaction posting against Balance & Wallet Rules:
 * - Wallet must exist and be active.
 * - Expense cannot take wallet balance below zero unless overdraft is allowed.
 */
export function validateTransactionPosting(
  wallet: Wallet | undefined,
  type: 'INCOME' | 'EXPENSE',
  amount: number,
  transactions: Transaction[],
  transfers: Transfer[]
): WalletValidationResult {
  if (!wallet) {
    return { valid: false, error: 'Target wallet does not exist.' };
  }

  if (!isWalletActive(wallet)) {
    const statusText = wallet.status === 'ARCHIVED' || wallet.isArchived ? 'archived' : 'disabled';
    return {
      valid: false,
      error: `Cannot post to ${statusText} wallet "${wallet.name}". Wallet must be active.`
    };
  }

  const absAmount = Math.abs(amount);
  if (isNaN(absAmount) || absAmount <= 0) {
    return { valid: false, error: 'Transaction amount must be greater than ETB 0.' };
  }

  if (type === 'EXPENSE') {
    const currentBalance = calculateWalletBalance(wallet, transactions, transfers);
    if (!isOverdraftAllowed(wallet) && currentBalance - absAmount < 0) {
      return {
        valid: false,
        error: `Overdraft blocked: Wallet "${wallet.name}" balance (${formatETB(currentBalance)}) is insufficient for expense of ${formatETB(absAmount)}. Overdraft is not permitted on this account.`
      };
    }
  }

  return { valid: true };
}

/**
 * Validates inter-wallet transfer against Balance & Wallet Rules:
 * 1. Both wallets exist and are active.
 * 2. Source and destination wallets are distinct.
 * 3. Source wallet balance cannot drop below zero unless overdraft is allowed.
 * 4. Transfer amount must be positive.
 * 5. Debit and credit legs strictly balance (exact equal amounts on both sides).
 */
export function validateTransfer(
  fromWallet: Wallet | undefined,
  toWallet: Wallet | undefined,
  amount: number,
  transactions: Transaction[],
  transfers: Transfer[],
  excludeTransferId?: string
): WalletValidationResult {
  if (!fromWallet) {
    return { valid: false, error: 'Source wallet does not exist.' };
  }
  if (!toWallet) {
    return { valid: false, error: 'Destination wallet does not exist.' };
  }
  if (fromWallet.id === toWallet.id) {
    return { valid: false, error: 'Source and destination wallets must be different accounts.' };
  }

  if (!isWalletActive(fromWallet)) {
    const fromStatus = fromWallet.status === 'ARCHIVED' || fromWallet.isArchived ? 'archived' : 'disabled';
    return {
      valid: false,
      error: `Cannot transfer from ${fromStatus} wallet "${fromWallet.name}". Only active wallets can originate transfers.`
    };
  }
  if (!isWalletActive(toWallet)) {
    const toStatus = toWallet.status === 'ARCHIVED' || toWallet.isArchived ? 'archived' : 'disabled';
    return {
      valid: false,
      error: `Cannot transfer to ${toStatus} wallet "${toWallet.name}". Only active wallets can receive transfers.`
    };
  }

  const absAmount = Math.abs(amount);
  if (isNaN(absAmount) || absAmount <= 0) {
    return { valid: false, error: 'Transfer amount must be greater than ETB 0.' };
  }

  const effectiveTransfers = excludeTransferId
    ? transfers.filter(t => t.id !== excludeTransferId)
    : transfers;
  const currentFromBalance = calculateWalletBalance(fromWallet, transactions, effectiveTransfers);
  if (!isOverdraftAllowed(fromWallet) && currentFromBalance - absAmount < 0) {
    return {
      valid: false,
      error: `Overdraft blocked: Source wallet "${fromWallet.name}" balance (${formatETB(currentFromBalance)}) cannot cover transfer of ${formatETB(absAmount)}. Overdraft is not permitted on this account.`
    };
  }

  return { valid: true };
}

/**
 * Computes chronological running balances for each wallet at every transaction point in time.
 * Returns a mapping: tx.id -> { [walletId]: runningBalance }
 */
export function computeAllWalletRunningBalances(
  wallets: Wallet[],
  transactions: Transaction[],
  transfers: Transfer[] = []
): Record<string, Record<string, number>> {
  const walletBalances: Record<string, number> = {};
  // Prior historical period (before Sep 7) starts from genesis setup
  wallets.forEach(w => {
    walletBalances[w.id] = 0;
  });

  const activePeriodStartTime = new Date('2026-09-07T00:00:00.000Z').getTime();
  let periodResetDone = false;

  type LedgerEvent =
    | { kind: 'tx'; date: number; id: string; tx: Transaction }
    | { kind: 'transfer'; date: number; id: string; transfer: Transfer };

  const events: LedgerEvent[] = [];

  transactions.forEach(tx => {
    const timeVal = new Date(tx.date).getTime();
    events.push({
      kind: 'tx',
      date: isNaN(timeVal) ? 0 : timeVal,
      id: tx.id,
      tx
    });
  });

  transfers.forEach(tr => {
    const timeVal = new Date(tr.date).getTime();
    events.push({
      kind: 'transfer',
      date: isNaN(timeVal) ? 0 : timeVal,
      id: tr.id,
      transfer: tr
    });
  });

  events.sort((a, b) => {
    if (a.date !== b.date) return a.date - b.date;
    return (a.id || '').localeCompare(b.id || '');
  });

  const txToWalletBalances: Record<string, Record<string, number>> = {};

  for (const ev of events) {
    // When reaching the verified active period (Sep 7 onwards), initialize with verified opening balances
    if (!periodResetDone && ev.date >= activePeriodStartTime) {
      wallets.forEach(w => {
        walletBalances[w.id] = w.openingBalance || 0;
      });
      periodResetDone = true;
    }

    if (ev.kind === 'tx') {
      const tx = ev.tx;
      if (!tx.reversed) {
        if (tx.splits && tx.splits.length > 0) {
          for (const s of tx.splits) {
            if (walletBalances[s.walletId] !== undefined) {
              if (tx.type === 'INCOME') {
                walletBalances[s.walletId] += Math.abs(s.amount);
              } else {
                walletBalances[s.walletId] = Math.max(0, walletBalances[s.walletId] - Math.abs(s.amount));
              }
            }
          }
        } else if (tx.walletId && walletBalances[tx.walletId] !== undefined) {
          if (tx.type === 'INCOME') {
            walletBalances[tx.walletId] += Math.abs(tx.amount);
          } else {
            walletBalances[tx.walletId] = Math.max(0, walletBalances[tx.walletId] - Math.abs(tx.amount));
          }
        }
      }
      txToWalletBalances[tx.id] = { ...walletBalances };
    } else if (ev.kind === 'transfer') {
      const tr = ev.transfer;
      if (walletBalances[tr.fromWalletId] !== undefined) {
        walletBalances[tr.fromWalletId] = Math.max(0, walletBalances[tr.fromWalletId] - Math.abs(tr.amount));
      }
      if (walletBalances[tr.toWalletId] !== undefined) {
        walletBalances[tr.toWalletId] += Math.abs(tr.amount);
      }
      txToWalletBalances[tr.id] = { ...walletBalances };
    }
  }

  return txToWalletBalances;
}

export function getWalletNickname(name?: string): string {
  if (!name) return 'Wallet';
  const lower = name.toLowerCase();
  if (lower.includes('saving')) return 'Saving wallet';
  if (lower.includes('telebirr') || lower.includes('tele')) return 'Telebirr';
  if (lower.includes('cbe birr') || lower.includes('cbebirr') || lower.includes('ebirr') || lower.includes('e-birr')) return 'eBirr';
  if (lower.includes('cbe') || lower.includes('commercial bank') || lower.includes('bank of ethiopia')) return 'CBE';
  if (lower.includes('cash') || lower.includes('vault') || lower.includes('drawer')) return 'Cash';
  return name.length > 14 ? name.slice(0, 12) + '...' : name;
}

export interface RelativeWalletInfo {
  walletId: string;
  walletName: string;
  amount?: number;
  balance: number;
}

export interface RelativeTransferWalletInfo {
  fromWalletId: string;
  fromWalletName: string;
  fromBalance: number;
  toWalletId: string;
  toWalletName: string;
  toBalance: number;
}

export function getRelativeWalletBalancesForTx(
  tx: Transaction,
  wallets: Wallet[],
  runningBalancesAtTx?: Record<string, number>
): RelativeWalletInfo[] {
  if (tx.splits && tx.splits.length > 0) {
    return tx.splits.map(s => {
      const w = wallets.find(item => item.id === s.walletId);
      return {
        walletId: s.walletId,
        walletName: w ? getWalletNickname(w.name) : 'Wallet',
        amount: s.amount,
        balance: runningBalancesAtTx ? (runningBalancesAtTx[s.walletId] ?? 0) : 0
      };
    });
  }

  const mainW = wallets.find(w => w.id === tx.walletId);
  return [
    {
      walletId: tx.walletId,
      walletName: mainW ? getWalletNickname(mainW.name) : 'Wallet',
      amount: tx.amount,
      balance: runningBalancesAtTx ? (runningBalancesAtTx[tx.walletId] ?? 0) : 0
    }
  ];
}

export function getRelativeWalletBalancesForTransfer(
  tr: Transfer,
  wallets: Wallet[],
  runningBalancesAtTransfer?: Record<string, number>
): RelativeTransferWalletInfo {
  const fromW = wallets.find(w => w.id === tr.fromWalletId);
  const toW = wallets.find(w => w.id === tr.toWalletId);
  return {
    fromWalletId: tr.fromWalletId,
    fromWalletName: fromW ? getWalletNickname(fromW.name) : 'Source Wallet',
    fromBalance: runningBalancesAtTransfer ? (runningBalancesAtTransfer[tr.fromWalletId] ?? 0) : 0,
    toWalletId: tr.toWalletId,
    toWalletName: toW ? getWalletNickname(toW.name) : 'Destination Wallet',
    toBalance: runningBalancesAtTransfer ? (runningBalancesAtTransfer[tr.toWalletId] ?? 0) : 0
  };
}

export function calculateMonthlyStats(transactions: Transaction[], receivables: Receivable[] = []) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let income = 0;
  let expense = 0;
  let creditWork = 0;

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

  // Include credit work (uncollected receivables created in this month) in business work totals
  // Note: If a receivable was already collected, the cash income transaction is already in transactions!
  if (Array.isArray(receivables)) {
    for (const r of receivables) {
      if (!r.createdDate && !r.dueDate) continue;
      const d = new Date(r.createdDate || r.dueDate);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        const uncollected = Math.max(0, (r.amountOwed || 0) - (r.amountCollected || 0));
        creditWork += uncollected;
        income += uncollected;
      }
    }
  }

  const profit = income - expense;
  return { income, expense, profit, creditWork };
}

export function calculateIncomeAverages(transactions: Transaction[], receivables: Receivable[] = []) {
  const validIncomes = transactions.filter(tx => !tx.reversed && tx.type === 'INCOME');
  
  // Calculate uncollected credit work from receivables
  const uncollectedReceivables = (receivables || []).filter(r => (r.amountOwed || 0) > (r.amountCollected || 0));
  const totalCreditWork = uncollectedReceivables.reduce((sum, r) => sum + Math.max(0, (r.amountOwed || 0) - (r.amountCollected || 0)), 0);

  if (validIncomes.length === 0 && totalCreditWork === 0) {
    return {
      weeklyAvg: 0,
      weeklyDailyAvg: 0,
      totalWeeklyAvg: 0,
      monthlyAvg: 0,
      dailyAvg: 0,
      currentWeekIncome: 0,
      currentMonthIncome: 0,
      totalIncome: 0,
      creditWork: 0
    };
  }

  const now = new Date();
  const nowMs = now.getTime();

  const timestamps = [
    ...transactions.filter(t => !t.reversed).map(tx => new Date(tx.date).getTime()),
    ...uncollectedReceivables.map(r => new Date(r.createdDate || r.dueDate).getTime())
  ].filter(t => !isNaN(t));

  const minTime = timestamps.length > 0 ? Math.min(...timestamps) : nowMs;

  const daysDiff = Math.max(1, Math.ceil((nowMs - minTime) / (1000 * 60 * 60 * 24)));
  const weeksDiff = Math.max(1, daysDiff / 7);
  const monthsDiff = Math.max(1, daysDiff / 30);

  const totalCashIncome = validIncomes.reduce((sum, tx) => sum + tx.amount, 0);
  const totalIncome = totalCashIncome + totalCreditWork;

  const dailyAvg = totalIncome / daysDiff;
  const totalWeeklyAvg = totalIncome / weeksDiff;
  const monthlyAvg = totalIncome / monthsDiff;

  const sevenDaysAgo = nowMs - (7 * 24 * 60 * 60 * 1000);
  let currentWeekTxs = validIncomes.filter(tx => new Date(tx.date).getTime() >= sevenDaysAgo);
  const currentWeekCredit = uncollectedReceivables
    .filter(r => new Date(r.createdDate || r.dueDate).getTime() >= sevenDaysAgo)
    .reduce((s, r) => s + Math.max(0, (r.amountOwed || 0) - (r.amountCollected || 0)), 0);

  if (currentWeekTxs.length === 0 && validIncomes.length > 0) {
    const latestTxTime = Math.max(...validIncomes.map(tx => new Date(tx.date).getTime()));
    const anchorSevenDaysAgo = latestTxTime - (7 * 24 * 60 * 60 * 1000);
    currentWeekTxs = validIncomes.filter(tx => {
      const t = new Date(tx.date).getTime();
      return t >= anchorSevenDaysAgo && t <= latestTxTime;
    });
  }

  const currentWeekIncome = currentWeekTxs.reduce((sum, tx) => sum + tx.amount, 0) + currentWeekCredit;
  const weeklyDailyAvg = currentWeekIncome / 7;
  const weeklyAvg = weeklyDailyAvg;

  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const currentMonthCredit = uncollectedReceivables
    .filter(r => {
      const d = new Date(r.createdDate || r.dueDate);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((s, r) => s + Math.max(0, (r.amountOwed || 0) - (r.amountCollected || 0)), 0);

  const currentMonthIncome = validIncomes
    .filter(tx => {
      const d = new Date(tx.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, tx) => sum + tx.amount, 0) + currentMonthCredit;

  return {
    dailyAvg,
    weeklyAvg,
    weeklyDailyAvg,
    totalWeeklyAvg,
    monthlyAvg,
    currentWeekIncome,
    currentMonthIncome,
    totalIncome,
    creditWork: totalCreditWork
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

export function isCreditSaleCollected(tx: { category?: string; description?: string; refType?: string; isCreditSale?: boolean; type?: string } | null | undefined): boolean {
  if (!tx) return false;
  // If explicitly tagged as an EXPENSE (e.g. loan repayment expense paid to others), not an income credit collection
  if (tx.type === 'EXPENSE' && tx.refType !== 'RECEIVABLE') return false;

  if (tx.refType === 'RECEIVABLE') return true;
  if (tx.isCreditSale) return true;
  
  const cat = (tx.category || '').toLowerCase().trim();
  const desc = (tx.description || '').toLowerCase().trim();

  // Category matching
  if (
    cat.includes('daily income / collected') ||
    cat.includes('daily income/collected') ||
    cat.includes('daily income/ collected') ||
    cat.includes('receivable collected') ||
    cat.includes('receivables collected') ||
    cat.includes('receivable') ||
    cat.includes('receivables') ||
    cat.includes('credit collected') ||
    cat.includes('credit sale') ||
    cat.includes('debt collection') ||
    cat.includes('debt collected') ||
    cat.includes('credit repayment')
  ) {
    return true;
  }

  // Description matching
  if (
    desc.includes('daily income / collected') ||
    desc.includes('daily income/collected') ||
    desc.includes('daily income/ collected') ||
    desc.includes('collected from') ||
    desc.includes('collected customer debt') ||
    desc.includes('repayment on receivable') ||
    desc.includes('repayment from') ||
    desc.includes('credit sale collected') ||
    desc.includes('credit collected') ||
    desc.includes('debt payment') ||
    desc.includes('customer debt') ||
    desc.includes('debt collected') ||
    desc.includes('receivable collected') ||
    desc.includes('receivables collected') ||
    desc.includes('split repayment on receivable') ||
    desc.includes('settled credit') ||
    desc.includes('settled receivable') ||
    desc.includes('weframu')
  ) {
    return true;
  }

  return false;
}

/**
 * Resolves the display title for collected receivables to "Collected from <CustomerName>".
 */
export function getReceivableCollectedTitle(
  tx: { description?: string; category?: string; refType?: string; refId?: string } | null | undefined,
  receivables?: Receivable[]
): string {
  if (!tx) return '';
  const desc = (tx.description || '').trim();

  // If already matches "Collected from <Name>", ensure proper capitalization and return
  if (/^Collected from\s+/i.test(desc)) {
    return 'Collected from ' + desc.replace(/^Collected from\s+/i, '').trim();
  }

  // If refId is provided, look up the receivable customer name
  if (tx.refId && receivables && receivables.length > 0) {
    const matched = receivables.find(r => r.id === tx.refId);
    if (matched && matched.customerName) {
      return `Collected from ${matched.customerName}`;
    }
  }

  // Check if description contains customer name in square brackets: "Repayment on receivable [Customer]"
  const bracketMatch = desc.match(/\[([^\]]+)\]/);
  if (bracketMatch && bracketMatch[1]) {
    return `Collected from ${bracketMatch[1].trim()}`;
  }

  // Check "Daily Income / Collected: <Name>"
  const dailyIncomePrefixMatch = desc.match(/^Daily Income\s*\/\s*Collected:\s*([^(]+)/i);
  if (dailyIncomePrefixMatch && dailyIncomePrefixMatch[1]) {
    const rawName = dailyIncomePrefixMatch[1].trim();
    if (rawName && !/^Repayment/i.test(rawName)) {
      return `Collected from ${rawName}`;
    }
  }

  // Check "Repayment from <Name>"
  const repaymentFromMatch = desc.match(/^Repayment from\s+([^(]+)/i);
  if (repaymentFromMatch && repaymentFromMatch[1]) {
    return `Collected from ${repaymentFromMatch[1].trim()}`;
  }

  // Check if refType is RECEIVABLE or category is Daily Income / Collected / Receivable Collected
  if (tx.refType === 'RECEIVABLE' || isCreditSaleCollected(tx)) {
    if (tx.refId?.toLowerCase().includes('solomon') || /solomon/i.test(desc)) return 'Collected from Solomon';
    if (tx.refId?.toLowerCase().includes('fike') || /fike/i.test(desc)) return 'Collected from Fike';
    if (tx.refId?.toLowerCase().includes('weframu') || /weframu/i.test(desc)) return 'Collected from Weframu lij';
    if (tx.refId?.toLowerCase().includes('fikadu') || /fikadu/i.test(desc)) return 'Collected from Fikadu';

    if (/repayment on receivable/i.test(desc) || /^Daily Income\s*\/\s*Collected$/i.test(desc)) {
      return 'Collected from Customer';
    }
  }

  return desc;
}

/**
 * Returns the primary display title of a transaction in list views and cards.
 * If the transaction represents a collected receivable, formats as "Collected from <CustomerName>".
 */
export function getTransactionDisplayTitle(
  tx: { description?: string; category?: string; refType?: string; refId?: string } | null | undefined,
  receivables?: Receivable[]
): string {
  if (!tx) return '';
  if (tx.refType === 'RECEIVABLE' || isCreditSaleCollected(tx)) {
    return getReceivableCollectedTitle(tx, receivables);
  }
  return tx.description || tx.category || 'Transaction';
}

export function formatETB(amount: number, compact = false): string {
  const absVal = Math.abs(amount || 0);
  let valStr = '';
  if (compact) {
    if (absVal >= 1_000_000) {
      valStr = `ETB ${(absVal / 1_000_000).toFixed(2)}M`;
    } else if (absVal >= 1_000) {
      valStr = `ETB ${(absVal / 1_000).toFixed(1)}K`;
    } else {
      valStr = `ETB ${Math.round(absVal).toLocaleString('en-US')}`;
    }
  } else {
    valStr = `ETB ${Math.round(absVal).toLocaleString('en-US')}`;
  }
  return amount < 0 ? `-${valStr}` : valStr;
}

export interface SummedAmountResult {
  total: number;
  count: number;
  items: number[];
  isValid: boolean;
  formattedExpression: string;
}

/**
 * Parses user input amounts that can be single numbers or expressions/comma-separated values.
 * Enforces positive absolute amounts for professional ERP ledger entries.
 */
export function parseSummedAmount(inputStr: string): SummedAmountResult {
  if (!inputStr || !inputStr.trim()) {
    return { total: 0, count: 0, items: [], isValid: false, formattedExpression: '' };
  }
  const trimmed = inputStr.trim();

  // If standard number without separators (e.g. "90" or "90.5" or "-90")
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    const val = Math.abs(parseFloat(trimmed));
    const valid = !isNaN(val) && val > 0;
    return {
      total: valid ? val : 0,
      count: 1,
      items: valid ? [val] : [],
      isValid: valid,
      formattedExpression: valid ? `${val}` : ''
    };
  }

  // Standard thousand separator number (e.g. "1,000" or "10,500.50" or "-1,000")
  if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(trimmed)) {
    const val = Math.abs(parseFloat(trimmed.replace(/,/g, '')));
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
    const num = Math.abs(parseFloat(cleanToken));
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

/**
 * Safely merges a local list and remote list by unique item ID.
 * Ensures that newly created local transactions, users, wallets, etc. are never lost during sync,
 * while strictly filtering out any IDs recorded in deletedEntityIds to prevent resurrected items.
 */
export function mergeListById<T extends { id: string }>(
  localList: T[] = [],
  remoteList: T[] = [],
  deletedEntityIds: string[] = []
): T[] {
  if (!Array.isArray(localList)) localList = [];
  if (!Array.isArray(remoteList)) remoteList = [];
  const deletedSet = new Set(Array.isArray(deletedEntityIds) ? deletedEntityIds : []);
  const map = new Map<string, T>();

  // 1. Populate remote items first (skipping deleted entities)
  remoteList.forEach(item => {
    if (item && typeof item === 'object' && item.id && !deletedSet.has(item.id)) {
      map.set(item.id, item);
    }
  });

  // 2. Local items overwrite remote items with the same ID (skipping deleted entities)
  localList.forEach(item => {
    if (item && typeof item === 'object' && item.id && !deletedSet.has(item.id)) {
      map.set(item.id, item);
    }
  });

  const merged = Array.from(map.values());

  // Additional safety check: If items are transactions with refType === 'RECEIVABLE', deduplicate accidental multi-posts
  if (merged.length > 0 && (merged[0] as any)?.refType !== undefined) {
    const seenRcv = new Set<string>();
    const deduplicated = merged.filter((item: any) => {
      if (item.refType === 'RECEIVABLE' && item.refId) {
        const timeBucket = Math.floor(new Date(item.date || 0).getTime() / 10000);
        const key = `${item.refId}_${item.amount}_${timeBucket}`;
        if (seenRcv.has(key)) {
          return false;
        }
        seenRcv.add(key);
      }
      return true;
    });
    return consolidateEqubSplitTransactions(deduplicated as any) as any;
  }

  return merged;
}

/**
 * Merges chat messages prioritizing authoritative server messages while preserving
 * locally queued / optimistic messages and sorting strictly by timestamp.
 */
export function mergeChatMessages(
  localList: ChatMessage[] = [],
  liveList: ChatMessage[] = [],
  deletedEntityIds: string[] = []
): ChatMessage[] {
  const deletedSet = new Set(Array.isArray(deletedEntityIds) ? deletedEntityIds : []);
  const map = new Map<string, ChatMessage>();

  // 1. First add local messages (optimistic / pending)
  (Array.isArray(localList) ? localList : []).forEach(item => {
    if (item && item.id && !deletedSet.has(item.id)) {
      map.set(item.id, item);
    }
  });

  // 2. Authoritative live server messages overwrite local copies (getting newest reactions, server timestamps, etc.)
  (Array.isArray(liveList) ? liveList : []).forEach(item => {
    if (item && item.id && !deletedSet.has(item.id)) {
      map.set(item.id, item);
    }
  });

  return Array.from(map.values()).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

/**
 * Automatically consolidates sibling split transactions generated for the same Equb round payment
 * into a single unified transaction showing the total payment, with itemized wallet splits.
 * Also ensures any transaction that contains `splits` has its `amount` equal to the total sum of the splits.
 */
export function consolidateEqubSplitTransactions(
  transactions: Transaction[],
  wallets?: Wallet[]
): Transaction[] {
  if (!Array.isArray(transactions) || transactions.length === 0) return [];

  // Helper to extract round number from string
  const extractRound = (str?: string): string | null => {
    if (!str) return null;
    const match = str.match(/round\s*#?\s*(\d+)/i);
    return match ? match[1] : null;
  };

  const getGroupKey = (tx: Transaction): string | null => {
    // 1. tx-eq-<timestamp>-<index> (multi-transaction generation from previous logic)
    const eqBatchMatch = tx.id.match(/^tx-eq-(\d+)-\d+$/);
    if (eqBatchMatch) {
      return `batch_${eqBatchMatch[1]}`;
    }

    const isEqub =
      tx.refType === 'EQUB' ||
      tx.category?.toLowerCase() === 'equb contribution' ||
      tx.category?.toLowerCase() === 'ekub' ||
      tx.category?.toLowerCase() === 'equb' ||
      tx.description?.toLowerCase().includes('round 21') ||
      tx.description?.toLowerCase().includes('round #21') ||
      (tx.description?.toLowerCase().includes('agerye') && tx.description?.toLowerCase().includes('round'));

    if (!isEqub || tx.type !== 'EXPENSE') return null;

    const roundNum = extractRound(tx.description);
    const datePrefix = (tx.date || '').slice(0, 10); // YYYY-MM-DD

    // Specifically handle Aug 17 Round 21 transactions
    if (
      (datePrefix === '2026-08-17' || tx.description?.includes('2026-08-17')) &&
      (roundNum === '21' || !roundNum || tx.description?.toLowerCase().includes('agerye'))
    ) {
      return 'equb_2026-08-17_round21';
    }

    // Handle any round with date
    if (roundNum && datePrefix) {
      return `equb_${datePrefix}_round${roundNum}`;
    }

    // Handle by refId & date
    if (tx.refId && datePrefix) {
      return `equb_${datePrefix}_${tx.refId}${roundNum ? `_r${roundNum}` : ''}`;
    }

    return null;
  };

  const groups: Record<string, Transaction[]> = {};
  const standalone: Transaction[] = [];

  for (const tx of transactions) {
    const key = getGroupKey(tx);
    if (key) {
      if (!groups[key]) groups[key] = [];
      groups[key].push(tx);
    } else {
      standalone.push(tx);
    }
  }

  const result: Transaction[] = [];

  // First process standalone transactions: ensure if any has splits, its amount is the sum of splits
  for (const tx of standalone) {
    if (tx.splits && tx.splits.length > 1) {
      const splitsTotal = tx.splits.reduce((sum, s) => sum + Math.abs(s.amount), 0);
      result.push({
        ...tx,
        amount: splitsTotal > 0 ? splitsTotal : tx.amount
      });
    } else {
      result.push(tx);
    }
  }

  // Next process groups
  for (const [key, groupTxs] of Object.entries(groups)) {
    if (groupTxs.length === 1) {
      const tx = groupTxs[0];
      if (tx.splits && tx.splits.length > 1) {
        const splitsTotal = tx.splits.reduce((sum, s) => sum + Math.abs(s.amount), 0);
        result.push({
          ...tx,
          amount: splitsTotal > 0 ? splitsTotal : tx.amount
        });
      } else {
        result.push(tx);
      }
      continue;
    }

    // Multiple transactions for the same Equb payment! Consolidate them into ONE.
    groupTxs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const baseTx = groupTxs[0];

    // Check if one of them already has the complete splits array
    const existingSplitsTx = groupTxs.find(t => t.splits && t.splits.length > 1);
    
    let consolidatedSplits: Array<{ walletId: string; amount: number }> = [];
    if (existingSplitsTx && existingSplitsTx.splits) {
      consolidatedSplits = existingSplitsTx.splits.map(s => ({
        walletId: s.walletId,
        amount: Math.abs(s.amount)
      }));
    } else {
      const walletMap = new Map<string, number>();
      for (const t of groupTxs) {
        if (t.splits && t.splits.length > 0) {
          for (const s of t.splits) {
            walletMap.set(s.walletId, (walletMap.get(s.walletId) || 0) + Math.abs(s.amount));
          }
        } else if (t.walletId) {
          walletMap.set(t.walletId, (walletMap.get(t.walletId) || 0) + Math.abs(t.amount));
        }
      }
      for (const [walletId, amount] of walletMap.entries()) {
        consolidatedSplits.push({ walletId, amount });
      }
    }

    const totalPaid = consolidatedSplits.reduce((sum, s) => sum + s.amount, 0) ||
      groupTxs.reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const primaryWalletId = consolidatedSplits[0]?.walletId || baseTx.walletId || 'w-cash';

    // Build clear description
    const roundNum = extractRound(baseTx.description) || (key.includes('round21') ? '21' : '');
    const equbName = baseTx.description?.toLowerCase().includes('agerye') ? 'Agerye' : 'Equb';

    const splitSummary = consolidatedSplits.map(s => {
      const w = wallets?.find(wal => wal.id === s.walletId);
      const name = w ? getWalletNickname(w.name) : s.walletId;
      return `${name}: ${formatETB(s.amount)}`;
    }).join(', ');

    const cleanDesc = roundNum
      ? `${equbName} Round #${roundNum} payment (Split: ${splitSummary})`
      : `${equbName} payment (Split: ${splitSummary})`;

    const consolidatedTx: Transaction = {
      ...baseTx,
      id: baseTx.id.replace(/-\d+$/, ''),
      amount: totalPaid,
      walletId: primaryWalletId,
      category: 'Equb Contribution',
      description: cleanDesc,
      splits: consolidatedSplits.length > 1 ? consolidatedSplits : undefined,
      refType: 'EQUB',
      refId: baseTx.refId || 'eq-agerye'
    };

    result.push(consolidatedTx);
  }

  // Sort descending by date
  return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Checks whether a transaction is an Equb contribution payment (expense).
 */
export function isEqubContributionTransaction(tx: Transaction): boolean {
  if (!tx) return false;
  if (tx.refType === 'EQUB' && tx.type === 'EXPENSE') return true;
  const cat = (tx.category || '').toLowerCase().trim();
  if (cat === 'equb contribution' || cat === 'ekub' || cat === 'equb') return true;
  const desc = (tx.description || '').toLowerCase();
  if (
    (desc.includes('equb') || desc.includes('ekub') || desc.includes('agerye')) &&
    (desc.includes('round') || desc.includes('contribution') || desc.includes('payment'))
  ) {
    return true;
  }
  return false;
}

/**
 * Checks whether a transaction is an Equb payout winning receipt (income).
 */
export function isEqubPayoutTransaction(tx: Transaction): boolean {
  if (!tx) return false;
  if (tx.refType === 'EQUB' && tx.type === 'INCOME') return true;
  const cat = (tx.category || '').toLowerCase().trim();
  if (cat === 'equb payout') return true;
  const desc = (tx.description || '').toLowerCase();
  return desc.includes('equb') && (desc.includes('payout') || desc.includes('winnings'));
}

/**
 * Finds the corresponding Equb circle for a transaction.
 */
export function findMatchingEqub(tx: Transaction, equbs: Equb[]): Equb | undefined {
  if (!equbs || equbs.length === 0 || !tx) return undefined;
  
  // 1. By refId
  if (tx.refId) {
    const found = equbs.find(e => e.id === tx.refId);
    if (found) return found;
  }
  
  // 2. By matching equb name in description
  const desc = (tx.description || '').toLowerCase();
  const byName = equbs.find(e => desc.includes(e.name.toLowerCase()));
  if (byName) return byName;
  
  // 3. If there is only one Equb registered
  if (equbs.length === 1) return equbs[0];
  
  // 4. Return matching active equb if amount matches contribution
  const byAmt = equbs.find(e => Math.abs(tx.amount) % e.contributionPerRound === 0);
  if (byAmt) return byAmt;

  return undefined;
}

/**
 * Reverts the Equb state when a contribution transaction is deleted or reversed.
 * Directly restores the previous round and sets status back to 'ACTIVE'.
 */
export function revertEqubForDeletedContribution(equb: Equb, tx: Transaction): {
  updatedEqub: Equb;
  restoredRound: number;
  previousRound: number;
} {
  const match = tx.description?.match(/round\s*#?\s*(\d+)/i);
  const roundInTx = match ? parseInt(match[1], 10) : null;

  let newRound = equb.currentRound;
  if (roundInTx !== null) {
    if (equb.currentRound > roundInTx) {
      // The equb had progressed past this round; restore back to this round so it can be re-paid
      newRound = roundInTx;
    } else if (equb.currentRound === roundInTx) {
      newRound = Math.max(1, roundInTx - 1);
    } else {
      newRound = Math.max(1, equb.currentRound - 1);
    }
  } else {
    newRound = Math.max(1, equb.currentRound - 1);
  }

  const updatedEqub: Equb = {
    ...equb,
    currentRound: newRound,
    status: 'ACTIVE'
  };

  return {
    updatedEqub,
    restoredRound: newRound,
    previousRound: equb.currentRound
  };
}

/**
 * Reverts the Equb state when a payout transaction is deleted or reversed.
 */
export function revertEqubForDeletedPayout(equb: Equb): Equb {
  return {
    ...equb,
    payoutsClaimed: Math.max(0, (equb.payoutsClaimed || 1) - 1)
  };
}



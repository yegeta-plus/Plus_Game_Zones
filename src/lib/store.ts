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
import { INITIAL_DATASET_JULY_AUG } from '../data/importedDataset';
import { CANONICAL_PDF_TRANSACTIONS } from '../data/canonicalPdfTransactions';

export type { ERPState } from '../types';

export const STORAGE_KEY = 'pluszone_fin_erp_state_v23_daily_income_names';

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
      { email: 'yegeta.huawei@gmail.com', name: 'Yegeta Huawei', role: 'SuperAdmin' },
      { email: 'kirubel@pluszone.com', name: 'Kirubel Haile', role: 'Admin' }
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
    email: 'ygyegeta@gmail.com',
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
  },
  {
    id: 'u-2',
    name: 'Kirubel Haile',
    email: 'kirubel@pluszone.com',
    username: 'kirubel',
    role: 'Admin',
    active: true,
    isApproved: true,
    isDigitalMoneyManager: false,
    invitationCode: 'PZ-ADM-2026',
    hasSetPassword: true,
    password: 'password123',
    isTemporaryPassword: false,
    mustChangePassword: false,
    permissions: DEFAULT_ROLE_PERMISSIONS.Admin,
    branch: 'Addis Ababa HQ',
    lastActive: '10 mins ago'
  },
  {
    id: 'u-3',
    name: 'Bethelhem Tadesse',
    email: 'bethelhem@pluszone.com',
    username: 'bethelhem',
    role: 'Partner',
    active: true,
    isApproved: true,
    isDigitalMoneyManager: false,
    invitationCode: 'PZ-PTR-3030',
    hasSetPassword: true,
    password: 'password123',
    isTemporaryPassword: false,
    mustChangePassword: false,
    permissions: DEFAULT_ROLE_PERMISSIONS.Partner,
    branch: 'Bole Branch',
    lastActive: '1 hour ago'
  },
  {
    id: 'u-4',
    name: 'Dagmawi Bekele',
    email: 'dagmawi@pluszone.com',
    username: 'dagmawi',
    role: 'Partner',
    active: true,
    isApproved: true,
    isDigitalMoneyManager: false,
    invitationCode: 'PZ-PTR-4040',
    hasSetPassword: true,
    password: 'password123',
    isTemporaryPassword: false,
    mustChangePassword: false,
    permissions: DEFAULT_ROLE_PERMISSIONS.Partner,
    branch: 'Addis Ababa HQ',
    lastActive: 'Yesterday'
  }
];

const DEFAULT_WALLETS: Wallet[] = [
  {
    id: 'w-cash',
    name: 'Main Cash Vault',
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
    id: 'w-cbe',
    name: 'Commercial Bank of Ethiopia (CBE)',
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
    id: 'w-telebirr',
    name: 'Telebirr Merchant Wallet',
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
    id: 'w-ebirr',
    name: 'eBirr Digital Wallet',
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
  }
];

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-0', name: 'Daily Income', type: 'INCOME', icon: 'TrendingUp', color: '#10B981', active: true },
  { id: 'cat-1', name: 'Sales Revenue', type: 'INCOME', icon: 'TrendingUp', color: '#22C55E', active: true },
  { id: 'cat-2', name: 'Receivables Collected', type: 'INCOME', icon: 'CheckCircle', color: '#00D4AA', active: true },
  { id: 'cat-cap', name: 'Capital Injection', type: 'INCOME', icon: 'PlusCircle', color: '#3B82F6', active: true },
  { id: 'cat-lr', name: 'Loans Received', type: 'INCOME', icon: 'ArrowDownLeft', color: '#8B5CF6', active: true },
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
const DEFAULT_RECURRING: RecurringTemplate[] = [];
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
          parsed.users = parsed.users.map((u: UserProfile) => {
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
        } else {
          parsed.users = DEFAULT_USERS;
        }

        parsed.deletedEntityIds = Array.isArray(parsed.deletedEntityIds) ? parsed.deletedEntityIds : [];
        const deletedSet = new Set(parsed.deletedEntityIds);

        parsed.equbs = Array.isArray(parsed.equbs) ? parsed.equbs.filter((e: any) => !deletedSet.has(e.id)) : [];
        parsed.loans = Array.isArray(parsed.loans) ? parsed.loans.filter((l: any) => !deletedSet.has(l.id)) : [];
        parsed.assets = Array.isArray(parsed.assets) ? parsed.assets.filter((a: any) => !deletedSet.has(a.id)) : [];
        parsed.receivables = Array.isArray(parsed.receivables) ? syncReceivablesLateStatus(parsed.receivables.filter((r: any) => !deletedSet.has(r.id))) : [];
        
        const loadedTxs = Array.isArray(parsed.transactions) ? parsed.transactions.filter((t: any) => !deletedSet.has(t.id)) : [];
        parsed.transactions = loadedTxs.length > 0 ? mergeListById(loadedTxs, CANONICAL_PDF_TRANSACTIONS, parsed.deletedEntityIds) : CANONICAL_PDF_TRANSACTIONS;
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
              color: '#F97316',
              status,
              isCreditAccount: isCredit,
              allowOverdraft: w.allowOverdraft ?? isCredit
            };
          }
          if (w.type === 'TELEBIRR') {
            return {
              ...w,
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
              color: '#10B981',
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
          if (!currentWallets.some(w => w.type === def.type)) {
            currentWallets.push(def);
          }
        });

        parsed.wallets = currentWallets;
        parsed.categories = Array.isArray(parsed.categories) && parsed.categories.length > 0 ? parsed.categories : DEFAULT_CATEGORIES;
        parsed.recurring = Array.isArray(parsed.recurring) ? parsed.recurring : DEFAULT_RECURRING;
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

        // Ensure users list is populated with multi-user accounts
        if (Array.isArray(parsed.users)) {
          const userMap = new Map<string, UserProfile>();
          for (const u of DEFAULT_USERS) userMap.set(u.id, u);
          for (const u of parsed.users) userMap.set(u.id, u);
          parsed.users = Array.from(userMap.values());
        } else {
          parsed.users = DEFAULT_USERS;
        }

        // Preserve currently logged-in user session if available
        if (parsed.currentUser && parsed.currentUser.id && Array.isArray(parsed.users)) {
          const matchingUser = parsed.users.find((u: UserProfile) => u.id === parsed.currentUser.id || u.email?.toLowerCase() === parsed.currentUser.email?.toLowerCase());
          parsed.currentUser = matchingUser || parsed.currentUser;
        } else {
          parsed.currentUser = parsed.users?.[0] || DEFAULT_USERS[0];
        }
        parsed.calendarType = parsed.calendarType || 'ETHIOPIAN';
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

export function createInitialState(): ERPState {
  return {
    currentUser: DEFAULT_USERS[0],
    users: DEFAULT_USERS,
    wallets: DEFAULT_WALLETS,
    transactions: DEFAULT_TRANSACTIONS,
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
    theme: 'dark',
    hideBalances: false,
    calendarType: 'ETHIOPIAN'
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
  let balance = wallet.openingBalance || 0;

  for (const tx of transactions) {
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

  for (const tr of transfers) {
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
  transfers: Transfer[]
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

  const currentFromBalance = calculateWalletBalance(fromWallet, transactions, transfers);
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
  wallets.forEach(w => {
    walletBalances[w.id] = w.openingBalance || 0;
  });

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
    if (ev.kind === 'tx') {
      const tx = ev.tx;
      if (!tx.reversed) {
        if (tx.splits && tx.splits.length > 0) {
          for (const s of tx.splits) {
            if (walletBalances[s.walletId] !== undefined) {
              if (tx.type === 'INCOME') {
                walletBalances[s.walletId] += Math.abs(s.amount);
              } else {
                walletBalances[s.walletId] -= Math.abs(s.amount);
              }
            }
          }
        } else if (tx.walletId && walletBalances[tx.walletId] !== undefined) {
          if (tx.type === 'INCOME') {
            walletBalances[tx.walletId] += Math.abs(tx.amount);
          } else {
            walletBalances[tx.walletId] -= Math.abs(tx.amount);
          }
        }
      }
      txToWalletBalances[tx.id] = { ...walletBalances };
    } else if (ev.kind === 'transfer') {
      const tr = ev.transfer;
      if (walletBalances[tr.fromWalletId] !== undefined) {
        walletBalances[tr.fromWalletId] -= Math.abs(tr.amount);
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
  if (lower.includes('telebirr') || lower.includes('tele')) return 'Tele';
  if (lower.includes('cbe birr') || lower.includes('cbebirr') || lower.includes('ebirr') || lower.includes('e-birr')) return 'Ebirr';
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
      weeklyDailyAvg: 0,
      totalWeeklyAvg: 0,
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
  const totalWeeklyAvg = totalIncome / weeksDiff;
  const monthlyAvg = totalIncome / monthsDiff;

  const sevenDaysAgo = nowMs - (7 * 24 * 60 * 60 * 1000);
  const currentWeekIncome = validIncomes
    .filter(tx => new Date(tx.date).getTime() >= sevenDaysAgo)
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Weekly daily income average: average daily income calculated over the 7-day week
  const weeklyDailyAvg = currentWeekIncome / 7;
  const weeklyAvg = weeklyDailyAvg;

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
    weeklyDailyAvg,
    totalWeeklyAvg,
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
 * while preventing deleted items from being resurrected.
 */
export function mergeListById<T extends { id: string }>(
  localList: T[] = [],
  remoteList: T[] = [],
  deletedIds: string[] = []
): T[] {
  if (!Array.isArray(localList)) localList = [];
  if (!Array.isArray(remoteList)) remoteList = [];
  const deletedSet = new Set(deletedIds || []);
  const map = new Map<string, T>();

  // 1. Populate remote items first (skip if deleted)
  remoteList.forEach(item => {
    if (item && typeof item === 'object' && item.id && !deletedSet.has(item.id)) {
      map.set(item.id, item);
    }
  });

  // 2. Local items overwrite remote items with the same ID (skip if deleted)
  localList.forEach(item => {
    if (item && typeof item === 'object' && item.id && !deletedSet.has(item.id)) {
      map.set(item.id, item);
    }
  });

  return Array.from(map.values());
}


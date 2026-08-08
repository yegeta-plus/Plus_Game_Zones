export type UserRole = 'SuperAdmin' | 'Admin' | 'Partner' | 'Viewer';

export interface UserPermissions {
  dashboard: boolean;
  income: boolean;
  expenses: boolean;
  equb: boolean;
  loans: boolean;
  reports: boolean;
  analytics: boolean;
  partners: boolean;
  settings: boolean;
  wallets: boolean;
  receivables: boolean;
  assets: boolean;
  auditLogs: boolean;

  // Action rights
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canReverse: boolean;
  viewOnly: boolean;
}

export type NavTab = 'dashboard' | 'transactions' | 'wallets' | 'equb' | 'more';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  username?: string;
  role: UserRole;
  avatarUrl?: string;
  active: boolean;
  isApproved?: boolean;
  invitationCode?: string;
  hasSetPassword?: boolean;
  password?: string;
  passwordHash?: string;
  isTemporaryPassword?: boolean;
  mustChangePassword?: boolean;
  permissions?: UserPermissions;
  branch: string;
  lastActive: string;
  createdBy?: string;
}

export type WalletType = 'CASH' | 'CBE_BANK' | 'TELEBIRR' | 'EBIRR' | 'SAVINGS' | 'OTHER';

export interface Wallet {
  id: string;
  name: string;
  type: WalletType;
  accountNumber?: string;
  openingBalance: number;
  totalIn: number;
  totalOut: number;
  color: string;
  iconName: string;
  customLogoUrl?: string;
  isDefault?: boolean;
}

export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Transaction {
  id: string;
  date: string; // ISO string
  type: TransactionType;
  amount: number;
  walletId: string;
  category: string;
  description: string;
  creatorId: string;
  creatorName: string;
  branch: string;
  notes?: string;
  refType?: 'EQUB' | 'LOAN' | 'ASSET' | 'RECEIVABLE' | 'RECURRING';
  refId?: string;
  reversed?: boolean;
  reversedAt?: string;
}

export interface Transfer {
  id: string;
  date: string;
  fromWalletId: string;
  toWalletId: string;
  amount: number;
  reason: string;
  creatorId: string;
  creatorName: string;
}

export type EqubInterval = 'WEEKLY' | 'EVERY_10_DAYS' | 'EVERY_15_DAYS' | 'MONTHLY';

export interface EqubMember {
  id: string;
  name: string;
  phone?: string;
  isWinner?: boolean;
  wonRound?: number;
}

export interface Equb {
  id: string;
  name: string;
  members: EqubMember[];
  contributionPerRound: number;
  mySlots?: number; // slots/shares owned by user (defaults to 1)
  interval: EqubInterval;
  currentRound: number;
  totalRounds: number;
  startDate: string; // ISO
  computedEndingDate: string;
  status: 'ACTIVE' | 'COMPLETED';
  walletId: string; // linked wallet for payouts/contributions
  payoutsClaimed?: number; // number of payouts claimed by user so far (max = mySlots)
}

export interface EqubRoundPayment {
  id: string;
  equbId: string;
  roundNumber: number;
  memberId: string;
  amount: number;
  date: string;
  paid: boolean;
}

export type LoanType = 'FRIEND_FAMILY' | 'PARTNER' | 'BANK' | 'MERCHANT' | 'OTHER';
export type LoanDirection = 'BORROWED' | 'LENT';

export interface LoanPayment {
  id: string;
  loanId: string;
  date: string;
  amount: number;
  principal: number;
  interest: number;
  walletId: string;
}

export interface Loan {
  id: string;
  title: string;
  counterparty: string;
  type: LoanType;
  direction?: LoanDirection; // 'BORROWED' (Debt owed) or 'LENT' (Money lent out)
  initialAmount: number;
  outstandingBalance: number;
  interestRatePercent?: number;
  monthlyInstallment?: number;
  dueDate: string;
  walletId: string;
  status: 'ACTIVE' | 'PAID';
  payments: LoanPayment[];
}

export interface Asset {
  id: string;
  name: string;
  category: string;
  purchaseDate: string;
  purchasePrice: number;
  currentValue: number;
  salvageValue: number;
  usefulLifeYears: number;
  depreciationMethod: 'STRAIGHT_LINE' | 'DECLINING_BALANCE';
  fundingWalletId: string;
  status: 'ACTIVE' | 'SOLD' | 'DISPOSED';
  soldPrice?: number;
  soldDate?: string;
}

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: string;
  color: string;
}

export type RecurringFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

export interface RecurringTemplate {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  walletId: string;
  frequency: RecurringFrequency;
  nextDueDate: string;
  autoProcess: boolean;
  status: 'ACTIVE' | 'PAUSED';
}

export interface Receivable {
  id: string;
  customerName: string;
  description: string;
  amountOwed: number;
  amountCollected: number;
  dueDate: string;
  status: 'OUTSTANDING' | 'COLLECTED' | 'WRITTEN_OFF';
  createdDate: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  action: string; // e.g., 'CREATE_TRANSACTION', 'REVERSE_TRANSACTION', 'PAY_EQUB_ROUND'
  entity: string; // e.g., 'Transaction', 'Wallet', 'Equb'
  entityId: string;
  diffBefore?: any;
  diffAfter?: any;
  branch: string;
}

export interface CalendarEventItem {
  id: string;
  title: string;
  date: string;
  type: 'EQUB_DUE' | 'LOAN_DUE' | 'RECURRING_DUE' | 'RECEIVABLE_DUE' | 'CUSTOM';
  amount?: number;
  completed?: boolean;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  active: boolean;
}

export interface AdminApprovalRequest {
  id: string;
  createdAt: string;
  requestedBy: string;
  requestedByName: string;
  targetAdminId?: string;
  targetAdminName?: string;
  actionType:
    | 'EDIT_EQUB'
    | 'DELETE_EQUB'
    | 'EDIT_LOAN'
    | 'DELETE_LOAN'
    | 'REVERSE_TRANSACTION'
    | 'DELETE_TRANSACTION'
    | 'EDIT_TRANSACTION'
    | 'DELETE_WALLET'
    | 'EDIT_WALLET'
    | 'DELETE_USER'
    | 'RESTORE_BACKUP'
    | 'DELETE_ASSET'
    | 'DELETE_RECEIVABLE'
    | 'SYSTEM_RESET';
  targetId: string;
  targetTitle: string;
  payload?: any;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
}

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
  approvalRequests?: AdminApprovalRequest[];
  theme: 'dark' | 'light';
  hideBalances: boolean;
  calendarType?: 'ETHIOPIAN' | 'GREGORIAN';
}

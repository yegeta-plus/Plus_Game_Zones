import { Transaction, Transfer, Receivable } from '../types';
import { normalizeTransactionScopes } from '../lib/expenseClassifier';

/**
 * Transactions imported from user ledger (Aug 18, 2026 - Sep 8, 2026).
 * Both Income breakdown (Telebirr, CBE, eBirr, Cash) and Expenses breakdown.
 */
const RAW_NEW_AUGUST_SEPTEMBER_TRANSACTIONS: Transaction[] = [
  // ==========================================
  // AUGUST 18, 2026
  // ==========================================
  // Income
  {
    id: 'tx-20260818-inc-telebirr',
    date: '2026-08-18T09:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 1050,
    walletId: 'w-telebirr',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260818-inc-cbe',
    date: '2026-08-18T09:30:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 100,
    walletId: 'w-cbe',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260818-inc-cash',
    date: '2026-08-18T10:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 2770,
    walletId: 'w-cash',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  // Expense
  {
    id: 'tx-20260818-exp-zeru-trans',
    date: '2026-08-18T12:00:00.000Z',
    type: 'EXPENSE',
    category: 'Transportation',
    amount: 1000,
    walletId: 'w-cash',
    description: 'zerubabel Transport',
    creatorName: 'Yegeta Huawei'
  },

  // ==========================================
  // AUGUST 19, 2026
  // ==========================================
  // Income
  {
    id: 'tx-20260819-inc-telebirr',
    date: '2026-08-19T09:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 1050,
    walletId: 'w-telebirr',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260819-inc-cbe',
    date: '2026-08-19T09:30:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 105,
    walletId: 'w-cbe',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260819-inc-cash',
    date: '2026-08-19T10:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 2830,
    walletId: 'w-cash',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  // Expense
  {
    id: 'tx-20260819-exp-hermi-dinner',
    date: '2026-08-19T19:00:00.000Z',
    type: 'EXPENSE',
    category: 'Food & Refreshments',
    amount: 100,
    walletId: 'w-cash',
    description: 'Hermi Dinner',
    creatorName: 'Yegeta Huawei'
  },

  // ==========================================
  // AUGUST 20, 2026
  // ==========================================
  // Income
  {
    id: 'tx-20260820-inc-telebirr',
    date: '2026-08-20T09:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 1080,
    walletId: 'w-telebirr',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260820-inc-cbe',
    date: '2026-08-20T09:30:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 60,
    walletId: 'w-cbe',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260820-inc-cash',
    date: '2026-08-20T10:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 2130,
    walletId: 'w-cash',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  // Expense
  {
    id: 'tx-20260820-exp-zeru-misa-erat',
    date: '2026-08-20T13:00:00.000Z',
    type: 'EXPENSE',
    category: 'Food & Refreshments',
    amount: 300,
    walletId: 'w-cash',
    description: 'zeru misa & erat',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260820-exp-berbere-home',
    date: '2026-08-20T15:00:00.000Z',
    type: 'EXPENSE',
    category: 'Other & Home Expenses',
    amount: 400,
    walletId: 'w-cash',
    description: 'berbere Home expense',
    creatorName: 'Yegeta Huawei'
  },

  // ==========================================
  // AUGUST 21, 2026
  // ==========================================
  // Income
  {
    id: 'tx-20260821-inc-telebirr',
    date: '2026-08-21T09:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 375,
    walletId: 'w-telebirr',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260821-inc-cbe',
    date: '2026-08-21T09:30:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 100,
    walletId: 'w-cbe',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260821-inc-cash',
    date: '2026-08-21T10:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 2150,
    walletId: 'w-cash',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  // Expense
  {
    id: 'tx-20260821-exp-hermi-trans',
    date: '2026-08-21T12:00:00.000Z',
    type: 'EXPENSE',
    category: 'Transportation',
    amount: 1000,
    walletId: 'w-cash',
    description: 'hermi Transport',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260821-exp-home',
    date: '2026-08-21T14:00:00.000Z',
    type: 'EXPENSE',
    category: 'Other & Home Expenses',
    amount: 125,
    walletId: 'w-cash',
    description: 'home expense',
    creatorName: 'Yegeta Huawei'
  },

  // ==========================================
  // AUGUST 22, 2026
  // ==========================================
  // Income
  {
    id: 'tx-20260822-inc-telebirr',
    date: '2026-08-22T09:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 495,
    walletId: 'w-telebirr',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260822-inc-cbe',
    date: '2026-08-22T09:30:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 100,
    walletId: 'w-cbe',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260822-inc-cash',
    date: '2026-08-22T10:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 1260,
    walletId: 'w-cash',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  // Expense
  {
    id: 'tx-20260822-exp-home',
    date: '2026-08-22T14:00:00.000Z',
    type: 'EXPENSE',
    category: 'Other & Home Expenses',
    amount: 800,
    walletId: 'w-cash',
    description: 'home expense',
    creatorName: 'Yegeta Huawei'
  },

  // ==========================================
  // AUGUST 23, 2026
  // ==========================================
  // Income
  {
    id: 'tx-20260823-inc-telebirr',
    date: '2026-08-23T09:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 350,
    walletId: 'w-telebirr',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260823-inc-cbe',
    date: '2026-08-23T09:30:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 830,
    walletId: 'w-cbe',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260823-inc-cash',
    date: '2026-08-23T10:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 2065,
    walletId: 'w-cash',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },

  // ==========================================
  // AUGUST 24, 2026
  // ==========================================
  // Income
  {
    id: 'tx-20260824-inc-telebirr',
    date: '2026-08-24T09:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 650,
    walletId: 'w-telebirr',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260824-inc-cbe',
    date: '2026-08-24T09:30:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 340,
    walletId: 'w-cbe',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260824-inc-cash',
    date: '2026-08-24T10:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 1470,
    walletId: 'w-cash',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  // Expense
  {
    id: 'tx-20260824-exp-mob-cleaning',
    date: '2026-08-24T11:00:00.000Z',
    type: 'EXPENSE',
    category: 'Cleaning & Supplies',
    amount: 2500,
    walletId: 'w-cash',
    description: 'Mob cleaning and suppies',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260824-exp-home',
    date: '2026-08-24T14:00:00.000Z',
    type: 'EXPENSE',
    category: 'Other & Home Expenses',
    amount: 200,
    walletId: 'w-cash',
    description: 'home expense',
    creatorName: 'Yegeta Huawei'
  },

  // ==========================================
  // AUGUST 25, 2026
  // ==========================================
  // Income
  {
    id: 'tx-20260825-inc-telebirr',
    date: '2026-08-25T09:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 920,
    walletId: 'w-telebirr',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260825-inc-cbe',
    date: '2026-08-25T09:30:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 320,
    walletId: 'w-cbe',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260825-inc-cash',
    date: '2026-08-25T10:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 1620,
    walletId: 'w-cash',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  // Expense
  {
    id: 'tx-20260825-exp-habte',
    date: '2026-08-25T11:00:00.000Z',
    type: 'EXPENSE',
    category: 'Other & Home Expenses',
    amount: 200,
    walletId: 'w-cash',
    description: 'habte yewsedew ke cbe gar yemitsaf',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260825-exp-lunch',
    date: '2026-08-25T13:00:00.000Z',
    type: 'EXPENSE',
    category: 'Food & Refreshments',
    amount: 1000,
    walletId: 'w-cash',
    description: 'Lunch yebalefew 200 and yezare 800',
    creatorName: 'Yegeta Huawei'
  },

  // ==========================================
  // AUGUST 26, 2026
  // ==========================================
  // Income
  {
    id: 'tx-20260826-inc-telebirr',
    date: '2026-08-26T09:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 695,
    walletId: 'w-telebirr',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260826-inc-cbe',
    date: '2026-08-26T09:30:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 100,
    walletId: 'w-cbe',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260826-inc-cash',
    date: '2026-08-26T10:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 1170,
    walletId: 'w-cash',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  // Expense
  {
    id: 'tx-20260826-exp-zeru-misa',
    date: '2026-08-26T13:00:00.000Z',
    type: 'EXPENSE',
    category: 'Food & Refreshments',
    amount: 120,
    walletId: 'w-cash',
    description: 'zeru misa',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260826-exp-home',
    date: '2026-08-26T15:00:00.000Z',
    type: 'EXPENSE',
    category: 'Other & Home Expenses',
    amount: 500,
    walletId: 'w-cash',
    description: 'home expense',
    creatorName: 'Yegeta Huawei'
  },

  // ==========================================
  // AUGUST 27, 2026
  // ==========================================
  // Income
  {
    id: 'tx-20260827-inc-telebirr',
    date: '2026-08-27T09:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 1285,
    walletId: 'w-telebirr',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260827-inc-cbe',
    date: '2026-08-27T09:30:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 320,
    walletId: 'w-cbe',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260827-inc-cash',
    date: '2026-08-27T10:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 1400,
    walletId: 'w-cash',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  // Expense
  {
    id: 'tx-20260827-exp-utilites',
    date: '2026-08-27T12:00:00.000Z',
    type: 'EXPENSE',
    category: 'Electricity & Utilities',
    amount: 2050,
    walletId: 'w-cash',
    description: 'utilites',
    creatorName: 'Yegeta Huawei'
  },

  // ==========================================
  // AUGUST 28, 2026
  // ==========================================
  // Income
  {
    id: 'tx-20260828-inc-telebirr',
    date: '2026-08-28T09:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 860,
    walletId: 'w-telebirr',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260828-inc-cbe',
    date: '2026-08-28T09:30:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 180,
    walletId: 'w-cbe',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260828-inc-cash',
    date: '2026-08-28T10:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 1525,
    walletId: 'w-cash',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  // Expense
  {
    id: 'tx-20260828-exp-gg-lunch',
    date: '2026-08-28T13:00:00.000Z',
    type: 'EXPENSE',
    category: 'Food & Refreshments',
    amount: 120,
    walletId: 'w-cash',
    description: 'gg lunch',
    creatorName: 'Yegeta Huawei'
  },

  // ==========================================
  // AUGUST 29, 2026
  // ==========================================
  // Income
  {
    id: 'tx-20260829-inc-telebirr',
    date: '2026-08-29T09:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 1255,
    walletId: 'w-telebirr',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260829-inc-cbe',
    date: '2026-08-29T09:30:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 420,
    walletId: 'w-cbe',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260829-inc-cash',
    date: '2026-08-29T10:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 520,
    walletId: 'w-cash',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  // Expense
  {
    id: 'tx-20260829-exp-hermi-din-telebirr',
    date: '2026-08-29T19:00:00.000Z',
    type: 'EXPENSE',
    category: 'Food & Refreshments',
    amount: 415,
    walletId: 'w-telebirr',
    description: 'Hermi Dinner',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260829-exp-home',
    date: '2026-08-29T20:00:00.000Z',
    type: 'EXPENSE',
    category: 'Other & Home Expenses',
    amount: 100,
    walletId: 'w-cash',
    description: 'home expense',
    creatorName: 'Yegeta Huawei'
  },

  // ==========================================
  // AUGUST 30, 2026
  // ==========================================
  // Income
  {
    id: 'tx-20260830-inc-telebirr',
    date: '2026-08-30T09:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 325,
    walletId: 'w-telebirr',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260830-inc-cbe',
    date: '2026-08-30T09:30:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 345,
    walletId: 'w-cbe',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260830-inc-cash',
    date: '2026-08-30T10:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 2025,
    walletId: 'w-cash',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  // Expense
  {
    id: 'tx-20260830-exp-jar-rice-home',
    date: '2026-08-30T14:00:00.000Z',
    type: 'EXPENSE',
    category: 'Other & Home Expenses',
    amount: 385,
    walletId: 'w-cash',
    description: 'jar, rice and others home expense',
    creatorName: 'Yegeta Huawei'
  },

  // ==========================================
  // AUGUST 31, 2026
  // ==========================================
  // Income
  {
    id: 'tx-20260831-inc-telebirr',
    date: '2026-08-31T09:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 1415,
    walletId: 'w-telebirr',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260831-inc-cash',
    date: '2026-08-31T10:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 750,
    walletId: 'w-cash',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  // Expense
  {
    id: 'tx-20260831-exp-gg-transport',
    date: '2026-08-31T12:00:00.000Z',
    type: 'EXPENSE',
    category: 'Transportation',
    amount: 1000,
    walletId: 'w-cash',
    description: 'gg transport',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260831-exp-home',
    date: '2026-08-31T15:00:00.000Z',
    type: 'EXPENSE',
    category: 'Other & Home Expenses',
    amount: 450,
    walletId: 'w-cash',
    description: 'home expense',
    creatorName: 'Yegeta Huawei'
  },

  // ==========================================
  // SEPTEMBER 1, 2026
  // ==========================================
  // Income
  {
    id: 'tx-20260901-inc-telebirr',
    date: '2026-09-01T09:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 505,
    walletId: 'w-telebirr',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260901-inc-cbe',
    date: '2026-09-01T09:30:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 330,
    walletId: 'w-cbe',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260901-inc-ebirr',
    date: '2026-09-01T09:45:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 180,
    walletId: 'w-ebirr',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260901-inc-cash',
    date: '2026-09-01T10:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 1285,
    walletId: 'w-cash',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  // Expense
  {
    id: 'tx-20260901-exp-dinner-tertibega',
    date: '2026-09-01T19:00:00.000Z',
    type: 'EXPENSE',
    category: 'Food & Refreshments',
    amount: 1000,
    walletId: 'w-cash',
    description: 'Dinner tertibega',
    creatorName: 'Yegeta Huawei'
  },

  // ==========================================
  // SEPTEMBER 2, 2026
  // ==========================================
  // Income
  {
    id: 'tx-20260902-inc-telebirr',
    date: '2026-09-02T09:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 1095,
    walletId: 'w-telebirr',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260902-inc-cbe',
    date: '2026-09-02T09:30:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 190,
    walletId: 'w-cbe',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260902-inc-cash',
    date: '2026-09-02T10:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 525,
    walletId: 'w-cash',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  // Expense
  {
    id: 'tx-20260902-exp-gg-hermi-lunch',
    date: '2026-09-02T13:00:00.000Z',
    type: 'EXPENSE',
    category: 'Food & Refreshments',
    amount: 670,
    walletId: 'w-cash',
    description: 'gg and hermi lunch',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260902-exp-ps5-joysticks',
    date: '2026-09-02T14:30:00.000Z',
    type: 'EXPENSE',
    category: 'Equipment / Asset Purchase',
    amount: 1450,
    walletId: 'w-telebirr',
    description: '2 ps5 joysticks',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260902-exp-zeru-trans',
    date: '2026-09-02T17:00:00.000Z',
    type: 'EXPENSE',
    category: 'Transportation',
    amount: 200,
    walletId: 'w-cash',
    description: 'zeru transport',
    creatorName: 'Yegeta Huawei'
  },

  // ==========================================
  // SEPTEMBER 3, 2026
  // ==========================================
  // Income
  {
    id: 'tx-20260903-inc-telebirr',
    date: '2026-09-03T09:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 1110,
    walletId: 'w-telebirr',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260903-inc-cbe',
    date: '2026-09-03T09:30:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 295,
    walletId: 'w-cbe',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260903-inc-cash',
    date: '2026-09-03T10:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 865,
    walletId: 'w-cash',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  // Expense
  {
    id: 'tx-20260903-exp-hermi-lunch-telebirr',
    date: '2026-09-03T13:00:00.000Z',
    type: 'EXPENSE',
    category: 'Food & Refreshments',
    amount: 280,
    walletId: 'w-telebirr',
    description: 'hermi lunch',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260903-exp-gg-transport',
    date: '2026-09-03T14:00:00.000Z',
    type: 'EXPENSE',
    category: 'Transportation',
    amount: 200,
    walletId: 'w-cash',
    description: 'gg transport',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260903-exp-internet-bill',
    date: '2026-09-03T16:00:00.000Z',
    type: 'EXPENSE',
    category: 'Internet & Phone',
    amount: 1000,
    walletId: 'w-cash',
    description: 'internet bill',
    creatorName: 'Yegeta Huawei'
  },

  // ==========================================
  // SEPTEMBER 4, 2026
  // ==========================================
  // Income
  {
    id: 'tx-20260904-inc-telebirr',
    date: '2026-09-04T09:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 850,
    walletId: 'w-telebirr',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260904-inc-cbe',
    date: '2026-09-04T09:30:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 120,
    walletId: 'w-cbe',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260904-inc-ebirr',
    date: '2026-09-04T09:45:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 150,
    walletId: 'w-ebirr',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260904-inc-cash',
    date: '2026-09-04T10:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 895,
    walletId: 'w-cash',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  // Expense
  {
    id: 'tx-20260904-exp-home',
    date: '2026-09-04T14:00:00.000Z',
    type: 'EXPENSE',
    category: 'Other & Home Expenses',
    amount: 230,
    walletId: 'w-cash',
    description: 'home expense',
    creatorName: 'Yegeta Huawei'
  },

  // ==========================================
  // SEPTEMBER 5, 2026
  // ==========================================
  // Income
  {
    id: 'tx-20260905-inc-telebirr',
    date: '2026-09-05T09:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 855,
    walletId: 'w-telebirr',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260905-inc-cbe',
    date: '2026-09-05T09:30:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 200,
    walletId: 'w-cbe',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260905-inc-cash',
    date: '2026-09-05T10:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 900,
    walletId: 'w-cash',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  // Expense
  {
    id: 'tx-20260905-exp-zeru-hermi-breakfast',
    date: '2026-09-05T10:30:00.000Z',
    type: 'EXPENSE',
    category: 'Food & Refreshments',
    amount: 1000,
    walletId: 'w-cash',
    description: 'zeru and hermi breakfast',
    creatorName: 'Yegeta Huawei'
  },

  // ==========================================
  // SEPTEMBER 6, 2026
  // ==========================================
  // Income
  {
    id: 'tx-20260906-inc-telebirr',
    date: '2026-09-06T09:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 525,
    walletId: 'w-telebirr',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260906-inc-cbe',
    date: '2026-09-06T09:30:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 270,
    walletId: 'w-cbe',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260906-inc-cash',
    date: '2026-09-06T10:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 1235,
    walletId: 'w-cash',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },

  // ==========================================
  // SEPTEMBER 7, 2026
  // ==========================================
  // Income
  {
    id: 'tx-20260907-inc-telebirr',
    date: '2026-09-07T09:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 245,
    walletId: 'w-telebirr',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260907-inc-cbe',
    date: '2026-09-07T09:30:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 195,
    walletId: 'w-cbe',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260907-inc-cash',
    date: '2026-09-07T10:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 1715,
    walletId: 'w-cash',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },

  // ==========================================
  // SEPTEMBER 8, 2026
  // ==========================================
  {
    id: 'tx-20260908-inc-telebirr',
    date: '2026-09-08T09:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 185,
    walletId: 'w-telebirr',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260908-inc-cbe',
    date: '2026-09-08T09:30:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 555,
    walletId: 'w-cbe',
    description: 'Daily Income',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260908-exp-baddebt-sol',
    date: '2026-09-08T21:33:00.000Z',
    type: 'EXPENSE',
    category: 'Bad Debt',
    amount: 180,
    walletId: 'w-cash',
    description: 'Bad debt write-off: Sol...',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260908-inc-cash',
    date: '2026-09-08T22:10:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 1510,
    walletId: 'w-cash',
    description: 'Daily Sales collection',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260908-exp-hermi-dinner',
    date: '2026-09-08T22:11:00.000Z',
    type: 'EXPENSE',
    category: 'Other & Home Expenses',
    amount: 135,
    walletId: 'w-cash',
    description: 'Dinner Hermi (home expense)',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260908-exp-home',
    date: '2026-09-08T22:41:00.000Z',
    type: 'EXPENSE',
    category: 'Other & Home Expenses',
    amount: 400,
    walletId: 'w-cash',
    description: 'Home expense',
    creatorName: 'Yegeta Huawei'
  },

  // ==========================================
  // SEPTEMBER 9, 2026
  // ==========================================
  {
    id: 'tx-20260909-inc-cash-0748',
    date: '2026-09-09T07:48:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 1300,
    walletId: 'w-cash',
    description: 'Daily Sales collection',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260909-inc-telebirr-2258',
    date: '2026-09-09T22:58:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 210,
    walletId: 'w-telebirr',
    description: 'Daily Sales collection',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260909-inc-cbe-2258',
    date: '2026-09-09T22:58:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 540,
    walletId: 'w-cbe',
    description: 'Daily Sales collection',
    creatorName: 'Yegeta Huawei'
  },

  // ==========================================
  // SEPTEMBER 13, 2026
  // ==========================================
  {
    id: 'tx-20260913-inc-cbe-2310',
    date: '2026-09-13T20:10:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 150,
    walletId: 'w-cbe',
    description: 'Daily Sales collection',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260913-inc-telebirr-2310',
    date: '2026-09-13T20:10:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 740,
    walletId: 'w-telebirr',
    description: 'Daily Sales collection',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260913-inc-cash-2312',
    date: '2026-09-13T20:12:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 2210,
    walletId: 'w-cash',
    description: 'Daily Sales collection',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260913-exp-ps5-pin-2316',
    date: '2026-09-13T20:16:00.000Z',
    type: 'EXPENSE',
    category: 'Equipment / Asset Purchase',
    amount: 120,
    walletId: 'w-cash',
    description: 'PS5 socket pin (Equipment)',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260913-exp-ps4-repair-2317',
    date: '2026-09-13T20:17:00.000Z',
    type: 'EXPENSE',
    category: 'Equipment / Asset Purchase',
    amount: 150,
    walletId: 'w-cash',
    description: 'PS4 socket repair (Equipment)',
    creatorName: 'Yegeta Huawei'
  },

  // ==========================================
  // SEPTEMBER 14, 2026
  // ==========================================
  {
    id: 'tx-20260914-inc-cash-0139',
    date: '2026-09-14T01:39:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 1395,
    walletId: 'w-cash',
    description: 'Daily Sales collection (Cash)',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260914-inc-telebirr-0139',
    date: '2026-09-14T01:39:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 480,
    walletId: 'w-telebirr',
    description: 'Daily Sales collection (Telebirr)',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260914-inc-cbe-0139',
    date: '2026-09-14T01:39:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 540,
    walletId: 'w-cbe',
    description: 'Daily Sales collection (CBE)',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260914-exp-dinner-0141',
    date: '2026-09-14T01:41:00.000Z',
    type: 'EXPENSE',
    category: 'Food & Refreshments',
    amount: 470,
    walletId: 'w-cash',
    description: 'gg and zeru dinner (Food)',
    expenseScope: 'BUSINESS',
    creatorName: 'Yegeta Huawei'
  },

  // ==========================================
  // SEPTEMBER 15, 2026
  // ==========================================
  {
    id: 'tx-20260915-inc-rcv-telebirr-1001',
    date: '2026-09-15T10:01:00.000Z',
    type: 'INCOME',
    category: 'Daily Income / Collected',
    amount: 130,
    walletId: 'w-telebirr',
    description: 'Repayment on receivable (Solomon)',
    refType: 'RECEIVABLE',
    refId: 'rcv-20260914-solomon',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260915-inc-telebirr-1005',
    date: '2026-09-15T10:05:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 610,
    walletId: 'w-telebirr',
    description: 'Daily Sales collection (Telebirr)',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260915-inc-cbe-1005',
    date: '2026-09-15T10:05:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 40,
    walletId: 'w-cbe',
    description: 'Daily Sales collection (CBE)',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260915-exp-tertibega-1007',
    date: '2026-09-15T10:07:00.000Z',
    type: 'EXPENSE',
    category: 'Food & Refreshments',
    amount: 980,
    walletId: 'w-telebirr',
    description: 'Tertibega dinner (Food)',
    expenseScope: 'PERSONAL',
    creatorName: 'Yegeta Huawei'
  },

  // ==========================================
  // SEPTEMBER 16, 2026
  // ==========================================
  {
    id: 'tx-20260916-inc-rcv-cbe-1357',
    date: '2026-09-16T13:57:00.000Z',
    type: 'INCOME',
    category: 'Daily Income / Collected',
    amount: 500,
    walletId: 'w-cbe',
    description: 'Repayment on receivable (Fike)',
    refType: 'RECEIVABLE',
    refId: 'rcv-20260914-fike',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260916-inc-telebirr-2117',
    date: '2026-09-16T21:17:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 175,
    walletId: 'w-telebirr',
    description: 'Daily Sales collection (Telebirr)',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260916-exp-hermi-dinner-2156',
    date: '2026-09-16T21:56:00.000Z',
    type: 'EXPENSE',
    category: 'Food & Refreshments',
    amount: 300,
    walletId: 'w-cash',
    description: 'Gg and hermi Dinner (Food)',
    expenseScope: 'PERSONAL',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260916-inc-cash-2213',
    date: '2026-09-16T22:13:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 1745,
    walletId: 'w-cash',
    description: 'Daily Sales collection (Cash)',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260916-exp-gg-lunch-2215',
    date: '2026-09-16T22:15:00.000Z',
    type: 'EXPENSE',
    category: 'Food & Refreshments',
    amount: 180,
    walletId: 'w-cash',
    description: 'gg Lunch [Edited]',
    expenseScope: 'PERSONAL',
    creatorName: 'Yegeta Huawei'
  },

  // ==========================================
  // SEPTEMBER 17, 2026
  // ==========================================
  {
    id: 'tx-20260917-inc-cash-1016',
    date: '2026-09-17T10:16:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 845,
    walletId: 'w-cash',
    description: 'Daily Sales collection (Cash)',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260917-exp-zeru-lunch-1016',
    date: '2026-09-17T10:16:00.000Z',
    type: 'EXPENSE',
    category: 'Food & Refreshments',
    amount: 430,
    walletId: 'w-telebirr',
    description: 'Zeru lunch (home expense)',
    expenseScope: 'PERSONAL',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260917-exp-gg-lunch-1017',
    date: '2026-09-17T10:17:00.000Z',
    type: 'EXPENSE',
    category: 'Food & Refreshments',
    amount: 550,
    walletId: 'w-cash',
    description: 'lunch gg & hermi (home expense)',
    expenseScope: 'PERSONAL',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260917-inc-telebirr-1701',
    date: '2026-09-17T17:01:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 435,
    walletId: 'w-telebirr',
    description: 'Daily Sales collection (Telebirr)',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260917-inc-cbe-1701',
    date: '2026-09-17T17:01:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 590,
    walletId: 'w-cbe',
    description: 'Daily Sales collection (CBE)',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260917-inc-ebirr-1701',
    date: '2026-09-17T17:01:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 30,
    walletId: 'w-ebirr',
    description: 'Daily Sales collection (Ebirr)',
    creatorName: 'Yegeta Huawei'
  },

  // ==========================================
  // SEPTEMBER 18, 2026
  // ==========================================
  {
    id: 'tx-20260918-inc-cash-1117',
    date: '2026-09-18T11:17:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 1565,
    walletId: 'w-cash',
    description: 'Daily Sales collection (Cash)',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260918-inc-telebirr-1259',
    date: '2026-09-18T12:59:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 245,
    walletId: 'w-telebirr',
    description: 'Daily Sales collection (Telebirr)',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260918-inc-cbe-1259',
    date: '2026-09-18T12:59:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 560,
    walletId: 'w-cbe',
    description: 'Daily Sales collection (CBE)',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260918-exp-hermi-lunch-2109',
    date: '2026-09-18T21:09:00.000Z',
    type: 'EXPENSE',
    category: 'Food & Refreshments',
    amount: 100,
    walletId: 'w-cash',
    description: 'hermi lunch (home expense)',
    expenseScope: 'PERSONAL',
    creatorName: 'Yegeta Huawei'
  },

  // ==========================================
  // SEPTEMBER 19, 2026
  // ==========================================
  {
    id: 'tx-20260919-inc-cash-2107',
    date: '2026-09-19T21:07:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 2150,
    walletId: 'w-cash',
    description: 'Daily Sales collection (Cash)',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260919-exp-dinner-hermi-2108',
    date: '2026-09-19T21:08:00.000Z',
    type: 'EXPENSE',
    category: 'Food & Refreshments',
    amount: 200,
    walletId: 'w-cash',
    description: 'dinner hermi (home expense)',
    expenseScope: 'PERSONAL',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260919-inc-telebirr-2235',
    date: '2026-09-19T22:35:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 775,
    walletId: 'w-telebirr',
    description: 'Daily Sales collection (Telebirr)',
    creatorName: 'Yegeta Huawei'
  },

  // ==========================================
  // SEPTEMBER 20, 2026
  // ==========================================
  {
    id: 'tx-20260920-exp-ekub-1456',
    date: '2026-09-20T14:56:00.000Z',
    type: 'EXPENSE',
    category: 'Equb Contribution',
    amount: 5000,
    walletId: 'w-cash',
    description: 'Ekub round contribution (Agerye)',
    refType: 'EQUB',
    refId: 'eq-agerye',
    expenseScope: 'PERSONAL',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260920-inc-cash-2022',
    date: '2026-09-20T20:22:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 2525,
    walletId: 'w-cash',
    description: 'Daily Sales collection (Cash)',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260920-inc-telebirr-2022',
    date: '2026-09-20T20:22:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 340,
    walletId: 'w-telebirr',
    description: 'Daily Sales collection (Telebirr)',
    creatorName: 'Yegeta Huawei'
  },

  // ==========================================
  // SEPTEMBER 21, 2026
  // ==========================================
  {
    id: 'tx-20260921-exp-lunch-2232',
    date: '2026-09-21T22:32:00.000Z',
    type: 'EXPENSE',
    category: 'Food & Refreshments',
    amount: 690,
    walletId: 'w-telebirr',
    description: 'Gg and hermi Lunch (home expense)',
    expenseScope: 'PERSONAL',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260921-inc-cash-2337',
    date: '2026-09-21T23:37:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 2010,
    walletId: 'w-cash',
    description: 'Daily Sales collection (Cash)',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260921-inc-telebirr-2341',
    date: '2026-09-21T23:41:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 295,
    walletId: 'w-telebirr',
    description: 'Daily Sales collection (Telebirr)',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260921-inc-cbe-2341',
    date: '2026-09-21T23:41:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 320,
    walletId: 'w-cbe',
    description: 'Daily Sales collection (CBE)',
    creatorName: 'Yegeta Huawei'
  },

  // ==========================================
  // SEPTEMBER 22, 2026
  // ==========================================
  {
    id: 'tx-20260922-inc-cash-2228',
    date: '2026-09-22T22:28:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 520,
    walletId: 'w-cash',
    description: 'Daily Sales collection (Cash)',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260922-inc-cbe-2228',
    date: '2026-09-22T22:28:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 215,
    walletId: 'w-cbe',
    description: 'Daily Sales collection (CBE)',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260922-inc-telebirr-2228',
    date: '2026-09-22T22:28:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 805,
    walletId: 'w-telebirr',
    description: 'Daily Sales collection (Telebirr)',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260922-exp-lunch-2233',
    date: '2026-09-22T22:33:00.000Z',
    type: 'EXPENSE',
    category: 'Food & Refreshments',
    amount: 900,
    walletId: 'w-telebirr',
    description: 'Keti Lunch (Food & Refreshments)',
    expenseScope: 'PERSONAL',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260922-exp-jar-2245',
    date: '2026-09-22T22:45:00.000Z',
    type: 'EXPENSE',
    category: 'Food & Refreshments',
    amount: 150,
    walletId: 'w-cash',
    description: 'Jar (home expense)',
    expenseScope: 'PERSONAL',
    creatorName: 'Yegeta Huawei'
  },

  // ==========================================
  // SEPTEMBER 23, 2026
  // ==========================================
  {
    id: 'tx-20260923-exp-home-1155',
    date: '2026-09-23T11:55:00.000Z',
    type: 'EXPENSE',
    category: 'Food & Refreshments',
    amount: 350,
    walletId: 'w-cash',
    description: 'home expense (home expense)',
    expenseScope: 'PERSONAL',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260923-inc-rcv-telebirr-2214',
    date: '2026-09-23T22:14:00.000Z',
    type: 'INCOME',
    category: 'Daily Income / Collected',
    amount: 465,
    walletId: 'w-telebirr',
    description: 'Repayment on receivable (Solomon)',
    refType: 'RECEIVABLE',
    refId: 'rcv-20260922-solomon',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260923-inc-cash-2217',
    date: '2026-09-23T22:17:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 1565,
    walletId: 'w-cash',
    description: 'Daily Sales collection (Cash)',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260923-inc-cbe-2217',
    date: '2026-09-23T22:17:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 135,
    walletId: 'w-cbe',
    description: 'Daily Sales collection (CBE)',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260923-inc-telebirr-2217',
    date: '2026-09-23T22:17:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 485,
    walletId: 'w-telebirr',
    description: 'Daily Sales collection (Telebirr)',
    creatorName: 'Yegeta Huawei'
  },

  // ==========================================
  // SEPTEMBER 24, 2026
  // ==========================================
  {
    id: 'tx-20260924-inc-telebirr-1215',
    date: '2026-09-24T12:15:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 150,
    walletId: 'w-telebirr',
    description: 'Gg Lunch — Daily Sales collection',
    creatorName: 'Yegeta Huawei'
  }
];

export const NEW_SEPTEMBER_TRANSFERS: Transfer[] = [
  {
    id: 'tr-20260909-cbe-to-cash',
    date: '2026-09-08T12:00:00.000Z',
    fromWalletId: 'w-cbe',
    toWalletId: 'w-cash',
    amount: 700,
    reason: 'Transfer — moved 700 ETB from CBE to Cash',
    creatorId: 'u-1',
    creatorName: 'Yegeta Huawei'
  }
];

export const NEW_SEPTEMBER_RECEIVABLES: Receivable[] = [
  {
    id: 'rcv-20260914-fike',
    customerName: 'Fike',
    description: "Bale'da credit for Fike",
    amountOwed: 520,
    amountCollected: 500,
    createdDate: '2026-09-14T01:43:00.000Z',
    dueDate: '2026-09-28T01:43:00.000Z',
    status: 'OUTSTANDING',
    walletId: 'w-cbe'
  },
  {
    id: 'rcv-20260914-solomon',
    customerName: 'Solomon',
    description: "Bale'da credit for Solomon",
    amountOwed: 150,
    amountCollected: 130,
    createdDate: '2026-09-14T01:44:00.000Z',
    dueDate: '2026-09-28T01:44:00.000Z',
    status: 'OUTSTANDING',
    walletId: 'w-telebirr'
  },
  {
    id: 'rcv-20260922-solomon',
    customerName: 'Solomon',
    description: "Bale'da credit for Solomon",
    amountOwed: 465,
    amountCollected: 465,
    createdDate: '2026-09-22T22:29:00.000Z',
    dueDate: '2026-10-06T22:29:00.000Z',
    status: 'COLLECTED',
    walletId: 'w-telebirr'
  },
  {
    id: 'rcv-20260922-fike',
    customerName: 'Fike',
    description: "Bale'da credit for Fike",
    amountOwed: 200,
    amountCollected: 0,
    createdDate: '2026-09-22T22:29:00.000Z',
    dueDate: '2026-10-06T22:29:00.000Z',
    status: 'OUTSTANDING',
    walletId: 'w-cbe'
  },
  {
    id: 'rcv-20260923-solomon',
    customerName: 'Solomon',
    description: "Bale'da credit for Solomon",
    amountOwed: 180,
    amountCollected: 0,
    createdDate: '2026-09-23T10:18:00.000Z',
    dueDate: '2026-10-07T10:18:00.000Z',
    status: 'OUTSTANDING',
    walletId: 'w-telebirr'
  }
];

export const NEW_AUGUST_SEPTEMBER_TRANSACTIONS: Transaction[] = normalizeTransactionScopes(RAW_NEW_AUGUST_SEPTEMBER_TRANSACTIONS);



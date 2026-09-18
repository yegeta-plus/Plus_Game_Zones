import { Transaction, Transfer, Receivable } from '../types';

export const VERIFIED_OPENING_BALANCES = {
  cash: 5705,
  telebirr: 3020,
  cbe: 3400,
  ebirr: 330
};

export const VERIFIED_TRANSFERS: Transfer[] = [
  {
    id: 'tr-20260908-cbe-cash',
    fromWalletId: 'w-cbe',
    toWalletId: 'w-cash',
    amount: 700,
    date: '2026-09-08T12:00:00.000Z',
    reason: 'Moved 700 ETB from CBE to Cash',
    creatorId: 'u-1',
    creatorName: 'Yegeta Huawei'
  }
];

export const VERIFIED_RECEIVABLES: Receivable[] = [
  {
    id: 'rcv-20260913-fike',
    customerName: 'Fike',
    description: "Bale'da credit for Fike",
    amountOwed: 520,
    amountCollected: 500,
    createdDate: '2026-09-13T13:00:00.000Z',
    dueDate: '2026-09-27T13:00:00.000Z',
    status: 'OUTSTANDING',
    walletId: 'w-cbe'
  },
  {
    id: 'rcv-20260913-solomon',
    customerName: 'Solomon',
    description: "Bale'da credit for Solomon",
    amountOwed: 150,
    amountCollected: 130,
    createdDate: '2026-09-13T13:05:00.000Z',
    dueDate: '2026-09-27T13:05:00.000Z',
    status: 'OUTSTANDING',
    walletId: 'w-telebirr'
  }
];

export const VERIFIED_TRANSACTIONS: Transaction[] = [
  // --- 2026-09-07 ---
  {
    id: 'tx-20260907-inc-cash-1510',
    date: '2026-09-07T14:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 1510,
    walletId: 'w-cash',
    description: 'Daily Income collection',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260907-exp-dinner-hermi-135',
    date: '2026-09-07T18:30:00.000Z',
    type: 'EXPENSE',
    category: 'Food & Refreshments',
    amount: 135,
    walletId: 'w-cash',
    description: 'dinner hermi (home expense)',
    expenseScope: 'PERSONAL',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260907-exp-home-400',
    date: '2026-09-07T19:00:00.000Z',
    type: 'EXPENSE',
    category: 'Other & Home Expenses',
    amount: 400,
    walletId: 'w-cash',
    description: 'home expense',
    expenseScope: 'PERSONAL',
    creatorName: 'Yegeta Huawei'
  },

  // --- 2026-09-08 ---
  {
    id: 'tx-20260908-inc-cash-1300',
    date: '2026-09-08T11:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 1300,
    walletId: 'w-cash',
    description: 'Daily Income collection',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260908-inc-telebirr-210',
    date: '2026-09-08T13:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 210,
    walletId: 'w-telebirr',
    description: 'Daily Income collection',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260908-inc-cbe-540',
    date: '2026-09-08T14:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 540,
    walletId: 'w-cbe',
    description: 'Daily Income collection',
    creatorName: 'Yegeta Huawei'
  },

  // --- 2026-09-09 ---
  {
    id: 'tx-20260909-inc-cbe-150',
    date: '2026-09-09T09:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 150,
    walletId: 'w-cbe',
    description: 'Daily Income collection',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260909-inc-telebirr-740',
    date: '2026-09-09T10:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 740,
    walletId: 'w-telebirr',
    description: 'Daily Income collection',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260909-inc-cash-2210',
    date: '2026-09-09T11:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 2210,
    walletId: 'w-cash',
    description: 'Daily Income collection',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260909-exp-ps5-pin-120',
    date: '2026-09-09T12:00:00.000Z',
    type: 'EXPENSE',
    category: 'Equipment / Asset Purchase',
    amount: 120,
    walletId: 'w-cash',
    description: 'Ps5 socket pin (Equipment)',
    expenseScope: 'BUSINESS',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260909-exp-ps4-repair-150',
    date: '2026-09-09T13:00:00.000Z',
    type: 'EXPENSE',
    category: 'Equipment / Asset Purchase',
    amount: 150,
    walletId: 'w-cash',
    description: 'Ps4 Socket repair (Equipment)',
    expenseScope: 'BUSINESS',
    creatorName: 'Yegeta Huawei'
  },

  // --- 2026-09-13 ---
  {
    id: 'tx-20260913-inc-cash-1395',
    date: '2026-09-13T09:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 1395,
    walletId: 'w-cash',
    description: 'Daily Income collection',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260913-inc-telebirr-480',
    date: '2026-09-13T10:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 480,
    walletId: 'w-telebirr',
    description: 'Daily Income collection',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260913-inc-cbe-540',
    date: '2026-09-13T11:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 540,
    walletId: 'w-cbe',
    description: 'Daily Income collection',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260913-exp-dinner-470',
    date: '2026-09-13T12:00:00.000Z',
    type: 'EXPENSE',
    category: 'Food & Refreshments',
    amount: 470,
    walletId: 'w-cash',
    description: 'gg and zeru dinner (Food)',
    expenseScope: 'BUSINESS',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260913-inc-rcv-solomon-130',
    date: '2026-09-13T14:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income / Collected',
    amount: 130,
    walletId: 'w-telebirr',
    description: 'Repayment on receivable [Solomon]',
    refType: 'RECEIVABLE',
    refId: 'rcv-20260913-solomon',
    creatorName: 'Yegeta Huawei'
  },

  // --- 2026-09-14 ---
  {
    id: 'tx-20260914-inc-telebirr-610',
    date: '2026-09-14T09:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 610,
    walletId: 'w-telebirr',
    description: 'Daily Income collection',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260914-inc-cbe-40',
    date: '2026-09-14T09:30:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 40,
    walletId: 'w-cbe',
    description: 'Daily Income collection',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260914-exp-tertibega-980',
    date: '2026-09-14T11:00:00.000Z',
    type: 'EXPENSE',
    category: 'Food & Refreshments',
    amount: 980,
    walletId: 'w-telebirr',
    description: 'Tertibega dinner (Food)',
    expenseScope: 'PERSONAL',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260914-inc-rcv-fike-500',
    date: '2026-09-14T12:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income / Collected',
    amount: 500,
    walletId: 'w-cbe',
    description: 'Repayment on receivable [Fike]',
    refType: 'RECEIVABLE',
    refId: 'rcv-20260913-fike',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260914-inc-telebirr-175',
    date: '2026-09-14T13:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 175,
    walletId: 'w-telebirr',
    description: 'Daily Income collection',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260914-inc-cash-1745',
    date: '2026-09-14T14:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 1745,
    walletId: 'w-cash',
    description: 'Daily Income collection',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260914-exp-hermi-dinner-300',
    date: '2026-09-14T15:00:00.000Z',
    type: 'EXPENSE',
    category: 'Food & Refreshments',
    amount: 300,
    walletId: 'w-telebirr',
    description: 'Gg and hermi Dinner',
    expenseScope: 'PERSONAL',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260914-exp-gg-lunch-180',
    date: '2026-09-14T16:00:00.000Z',
    type: 'EXPENSE',
    category: 'Food & Refreshments',
    amount: 180,
    walletId: 'w-cash',
    description: 'gg Lunch [Edited]',
    expenseScope: 'PERSONAL',
    creatorName: 'Yegeta Huawei'
  },

  // --- 2026-09-17 (Yesterday) ---
  {
    id: 'tx-20260917-inc-cash-845',
    date: '2026-09-17T10:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 845,
    walletId: 'w-cash',
    description: 'Daily Income collection',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260917-exp-zeru-lunch-430',
    date: '2026-09-17T11:00:00.000Z',
    type: 'EXPENSE',
    category: 'Food & Refreshments',
    amount: 430,
    walletId: 'w-telebirr',
    description: 'Zeru lunch (home expense)',
    expenseScope: 'PERSONAL',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260917-exp-gg-lunch-550',
    date: '2026-09-17T12:00:00.000Z',
    type: 'EXPENSE',
    category: 'Food & Refreshments',
    amount: 550,
    walletId: 'w-cash',
    description: 'Lunch gg & hermi (home expense)',
    expenseScope: 'PERSONAL',
    creatorName: 'Yegeta Huawei'
  }
];

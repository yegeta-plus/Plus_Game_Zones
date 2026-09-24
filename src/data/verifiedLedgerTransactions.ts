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

  // --- 2026-09-14 ---
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

  // --- 2026-09-15 ---
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

  // --- 2026-09-16 ---
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

  // --- 2026-09-17 ---
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

  // --- 2026-09-18 ---
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

  // --- 2026-09-19 ---
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

  // --- 2026-09-20 ---
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

  // --- 2026-09-21 ---
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

  // --- 2026-09-22 ---
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

  // --- 2026-09-23 ---
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

  // --- 2026-09-24 ---
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

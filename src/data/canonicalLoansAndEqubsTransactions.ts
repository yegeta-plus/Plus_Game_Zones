import { Transaction } from '../types';

/**
 * Canonical Transactions for:
 * 1. Loans & Debt (Borrowing disbursements & Repayment installments/settlements)
 * 2. Equb Circles (Round contributions & Winner payouts)
 * 3. September 10 - 12 Transactions (Shop rent, holiday, daily sales)
 */

export const CANONICAL_LOAN_TRANSACTIONS: Transaction[] = [
  // 1. Hermi (Active, 15,000 ETB Borrowed)
  {
    id: 'tx-loan-hermi-inflow',
    date: '2026-07-06T11:00:00.000Z',
    type: 'INCOME',
    category: 'Loans Received',
    amount: 15000,
    walletId: 'w-cash',
    description: 'Loan capital borrowed from Hermi',
    creatorName: 'Yegeta Huawei',
    refType: 'LOAN',
    refId: 'loan-hermi'
  },

  // 2. Zerubabel (27,000 ETB Borrowed)
  {
    id: 'tx-loan-zeru1-inflow',
    date: '2026-07-14T09:00:00.000Z',
    type: 'INCOME',
    category: 'Loans Received',
    amount: 27000,
    walletId: 'w-cash',
    description: 'Loan capital borrowed from Zerubabel',
    creatorName: 'Yegeta Huawei',
    refType: 'LOAN',
    refId: 'loan-zeru-1'
  },

  // 3. Zerubabel 2 (25,500 ETB Borrowed + 5,100 Repaid)
  {
    id: 'tx-loan-zeru2-inflow',
    date: '2026-07-26T09:00:00.000Z',
    type: 'INCOME',
    category: 'Loans Received',
    amount: 25500,
    walletId: 'w-cash',
    description: 'Loan capital borrowed from Zerubabel 2',
    creatorName: 'Yegeta Huawei',
    refType: 'LOAN',
    refId: 'loan-zeru-2'
  },
  {
    id: 'tx-loan-zeru2-repay-1',
    date: '2026-08-27T12:00:00.000Z',
    type: 'EXPENSE',
    category: 'Loan Repayments',
    amount: 5100,
    walletId: 'w-cash',
    description: 'Monthly installment repayment to Zerubabel 2',
    creatorName: 'Yegeta Huawei',
    refType: 'LOAN',
    refId: 'loan-zeru-2',
    expenseScope: 'BUSINESS'
  },

  // 4. Hermi father (50,000 ETB Borrowed + 35,000 Repaid across 3 installments)
  {
    id: 'tx-loan-hermi-father-inflow',
    date: '2026-07-05T09:00:00.000Z',
    type: 'INCOME',
    category: 'Loans Received',
    amount: 50000,
    walletId: 'w-cash',
    description: 'Loan capital borrowed from Hermi father',
    creatorName: 'Yegeta Huawei',
    refType: 'LOAN',
    refId: 'loan-hermi-father'
  },
  {
    id: 'tx-loan-hermi-father-repay-1',
    date: '2026-07-27T12:00:00.000Z',
    type: 'EXPENSE',
    category: 'Loan Repayments',
    amount: 15000,
    walletId: 'w-cash',
    description: 'Repayment installment to Hermi father',
    creatorName: 'Yegeta Huawei',
    refType: 'LOAN',
    refId: 'loan-hermi-father',
    expenseScope: 'BUSINESS'
  },
  {
    id: 'tx-loan-hermi-father-repay-2',
    date: '2026-08-10T12:00:00.000Z',
    type: 'EXPENSE',
    category: 'Loan Repayments',
    amount: 5000,
    walletId: 'w-cash',
    description: 'Repayment installment to Hermi father (Cash split)',
    creatorName: 'Yegeta Huawei',
    refType: 'LOAN',
    refId: 'loan-hermi-father',
    expenseScope: 'BUSINESS'
  },
  {
    id: 'tx-loan-hermi-father-repay-3',
    date: '2026-08-25T12:00:00.000Z',
    type: 'EXPENSE',
    category: 'Loan Repayments',
    amount: 15000,
    walletId: 'w-cash',
    description: 'Repayment installment to Hermi father',
    creatorName: 'Yegeta Huawei',
    refType: 'LOAN',
    refId: 'loan-hermi-father',
    expenseScope: 'BUSINESS'
  },

  // 5. Gg (25,500 ETB Borrowed)
  {
    id: 'tx-loan-gg-inflow',
    date: '2026-07-20T09:00:00.000Z',
    type: 'INCOME',
    category: 'Loans Received',
    amount: 25500,
    walletId: 'w-cash',
    description: 'Loan capital borrowed from Gg',
    creatorName: 'Yegeta Huawei',
    refType: 'LOAN',
    refId: 'loan-gg'
  },

  // 6. Zerubabel 3 (1,500 ETB Borrowed + 1,500 Settled)
  {
    id: 'tx-loan-zeru3-inflow',
    date: '2026-08-19T09:00:00.000Z',
    type: 'INCOME',
    category: 'Loans Received',
    amount: 1500,
    walletId: 'w-telebirr',
    description: 'Loan capital borrowed from Zerubabel 3',
    creatorName: 'Yegeta Huawei',
    refType: 'LOAN',
    refId: 'loan-zeru-3'
  },
  {
    id: 'tx-loan-zeru3-repay-1',
    date: '2026-08-19T12:00:00.000Z',
    type: 'EXPENSE',
    category: 'Loan Repayments',
    amount: 1500,
    walletId: 'w-telebirr',
    description: 'Settlement repayment on loan [Zerubabel 3]',
    creatorName: 'Yegeta Huawei',
    refType: 'LOAN',
    refId: 'loan-zeru-3',
    expenseScope: 'BUSINESS'
  },

  // 7. Hermi sister (5,000 ETB Borrowed + 5,000 Settled)
  {
    id: 'tx-loan-hermi-sister-inflow',
    date: '2026-07-15T09:00:00.000Z',
    type: 'INCOME',
    category: 'Loans Received',
    amount: 5000,
    walletId: 'w-cash',
    description: 'Loan capital borrowed from Hermi sister',
    creatorName: 'Yegeta Huawei',
    refType: 'LOAN',
    refId: 'loan-hermi-sister'
  },
  {
    id: 'tx-loan-hermi-sister-repay-1',
    date: '2026-08-01T12:00:00.000Z',
    type: 'EXPENSE',
    category: 'Loan Repayments',
    amount: 5000,
    walletId: 'w-cash',
    description: 'Full settlement repayment to Hermi sister',
    creatorName: 'Yegeta Huawei',
    refType: 'LOAN',
    refId: 'loan-hermi-sister',
    expenseScope: 'BUSINESS'
  },

  // 8. Gg sister (20,000 ETB Borrowed + 20,000 Settled)
  {
    id: 'tx-loan-gg-sister-inflow',
    date: '2026-07-10T09:00:00.000Z',
    type: 'INCOME',
    category: 'Loans Received',
    amount: 20000,
    walletId: 'w-cash',
    description: 'Loan capital borrowed from Gg sister',
    creatorName: 'Yegeta Huawei',
    refType: 'LOAN',
    refId: 'loan-gg-sister-20k'
  },
  {
    id: 'tx-loan-gg-sister-repay-1',
    date: '2026-07-27T12:00:00.000Z',
    type: 'EXPENSE',
    category: 'Loan Repayments',
    amount: 770,
    walletId: 'w-telebirr',
    description: 'Installment repayment to Gg sister',
    creatorName: 'Yegeta Huawei',
    refType: 'LOAN',
    refId: 'loan-gg-sister-20k',
    expenseScope: 'BUSINESS'
  },
  {
    id: 'tx-loan-gg-sister-repay-2',
    date: '2026-08-21T12:00:00.000Z',
    type: 'EXPENSE',
    category: 'Loan Repayments',
    amount: 19230,
    walletId: 'w-cash',
    description: 'Final settlement repayment to Gg sister',
    creatorName: 'Yegeta Huawei',
    refType: 'LOAN',
    refId: 'loan-gg-sister-20k',
    expenseScope: 'BUSINESS'
  },

  // 9. Gg sister 2 (9,000 ETB Borrowed + 9,000 Settled)
  {
    id: 'tx-loan-gg-sister2-inflow',
    date: '2026-07-06T12:00:00.000Z',
    type: 'INCOME',
    category: 'Loans Received',
    amount: 9000,
    walletId: 'w-cash',
    description: 'Loan capital borrowed from Gg sister 2',
    creatorName: 'Yegeta Huawei',
    refType: 'LOAN',
    refId: 'loan-gg-sister-9k'
  },
  {
    id: 'tx-loan-gg-sister2-repay-1',
    date: '2026-08-10T12:30:00.000Z',
    type: 'EXPENSE',
    category: 'Loan Repayments',
    amount: 1501,
    walletId: 'w-telebirr',
    description: 'Settlement repayment on loan [Gg sister 2] (Telebirr)',
    creatorName: 'Yegeta Huawei',
    refType: 'LOAN',
    refId: 'loan-gg-sister-9k',
    expenseScope: 'BUSINESS'
  },
  {
    id: 'tx-loan-gg-sister2-repay-2',
    date: '2026-08-10T13:00:00.000Z',
    type: 'EXPENSE',
    category: 'Loan Repayments',
    amount: 7499,
    walletId: 'w-cash',
    description: 'Settlement repayment on loan [Gg sister 2] (Cash)',
    creatorName: 'Yegeta Huawei',
    refType: 'LOAN',
    refId: 'loan-gg-sister-9k',
    expenseScope: 'BUSINESS'
  },

  // 10. Zerubabel Settled 1,200 (1,200 ETB Borrowed + 1,200 Settled)
  {
    id: 'tx-loan-zeru-settled-inflow',
    date: '2026-07-08T09:00:00.000Z',
    type: 'INCOME',
    category: 'Loans Received',
    amount: 1200,
    walletId: 'w-cash',
    description: 'Loan capital borrowed from Zerubabel',
    creatorName: 'Yegeta Huawei',
    refType: 'LOAN',
    refId: 'loan-zeru-settled-1200'
  },
  {
    id: 'tx-loan-zeru-settled-repay-1',
    date: '2026-07-11T12:00:00.000Z',
    type: 'EXPENSE',
    category: 'Loan Repayments',
    amount: 200,
    walletId: 'w-cash',
    description: 'Repayment installment to Zerubabel',
    creatorName: 'Yegeta Huawei',
    refType: 'LOAN',
    refId: 'loan-zeru-settled-1200',
    expenseScope: 'BUSINESS'
  },
  {
    id: 'tx-loan-zeru-settled-repay-2',
    date: '2026-07-11T12:30:00.000Z',
    type: 'EXPENSE',
    category: 'Loan Repayments',
    amount: 1000,
    walletId: 'w-cash',
    description: 'Settlement repayment to Zerubabel',
    creatorName: 'Yegeta Huawei',
    refType: 'LOAN',
    refId: 'loan-zeru-settled-1200',
    expenseScope: 'BUSINESS'
  }
];

export const CANONICAL_EQUB_TRANSACTIONS: Transaction[] = [
  // ==========================================
  // AGERYE EQUB (Every 10 days, 5,000 ETB / round)
  // Won Round 1 Payout: 135,000 ETB
  // 25 Completed Rounds (Current Round: 26, Remaining: 2 rounds, 10,000 ETB obligation)
  // ==========================================
  {
    id: 'tx-equb-agerye-payout',
    date: '2026-06-02T10:00:00.000Z',
    type: 'INCOME',
    category: 'Equb Payout',
    amount: 135000,
    walletId: 'w-cash',
    description: 'Ekub payout won: Agerye (Round 1 Pool Winnings)',
    creatorName: 'Yegeta Huawei',
    refType: 'EQUB',
    refId: 'eq-agerye'
  },
  // All 24 historical completed rounds prior to Round 25
  ...[
    { r: 1, date: '2026-06-01T10:00:00.000Z' },
    { r: 2, date: '2026-06-11T10:00:00.000Z' },
    { r: 3, date: '2026-06-21T10:00:00.000Z' },
    { r: 4, date: '2026-07-01T10:00:00.000Z' },
    { r: 5, date: '2026-07-08T10:00:00.000Z' },
    { r: 6, date: '2026-07-17T10:00:00.000Z' },
    { r: 7, date: '2026-07-29T10:00:00.000Z' },
    { r: 8, date: '2026-08-01T10:00:00.000Z' },
    { r: 9, date: '2026-08-04T10:00:00.000Z' },
    { r: 10, date: '2026-08-07T10:00:00.000Z' },
    { r: 11, date: '2026-08-10T10:00:00.000Z' },
    { r: 12, date: '2026-08-12T10:00:00.000Z' },
    { r: 13, date: '2026-08-14T10:00:00.000Z' },
    { r: 14, date: '2026-08-16T10:00:00.000Z' },
    { r: 15, date: '2026-08-18T10:00:00.000Z' },
    { r: 16, date: '2026-08-20T10:00:00.000Z' },
    { r: 17, date: '2026-08-22T10:00:00.000Z' },
    { r: 18, date: '2026-08-24T10:00:00.000Z' },
    { r: 19, date: '2026-08-26T10:00:00.000Z' },
    { r: 20, date: '2026-08-28T10:00:00.000Z' },
    { r: 21, date: '2026-08-29T10:00:00.000Z' },
    { r: 22, date: '2026-08-30T10:00:00.000Z' },
    { r: 23, date: '2026-08-31T10:00:00.000Z' },
    { r: 24, date: '2026-09-10T10:00:00.000Z' }
  ].map(({ r, date }): Transaction => ({
    id: `tx-equb-agerye-round-${r}`,
    date,
    type: 'EXPENSE',
    category: 'Equb Contribution',
    amount: 5000,
    walletId: 'w-cash',
    description: `Ekub round contribution: Agerye (Round ${r})`,
    creatorName: 'Yegeta Huawei',
    refType: 'EQUB',
    refId: 'eq-agerye',
    expenseScope: 'BUSINESS'
  })),
  // Round 25 (Verified payment on Sep 20, 2026)
  {
    id: 'tx-20260920-exp-ekub-1456',
    date: '2026-09-20T14:56:00.000Z',
    type: 'EXPENSE',
    category: 'Equb Contribution',
    amount: 5000,
    walletId: 'w-cash',
    description: 'Ekub round contribution: Agerye (Round 25)',
    creatorName: 'Yegeta Huawei',
    refType: 'EQUB',
    refId: 'eq-agerye',
    expenseScope: 'PERSONAL'
  },

  // ==========================================
  // LELI EQUB (Monthly, 3,000 ETB / round)
  // Won Round 1 Payout: 30,000 ETB
  // 10 Completed Rounds (Completed)
  // ==========================================
  {
    id: 'tx-equb-leli-payout',
    date: '2026-01-02T10:00:00.000Z',
    type: 'INCOME',
    category: 'Equb Payout',
    amount: 30000,
    walletId: 'w-cash',
    description: 'Ekub payout won: Leli (Round 1 Pool Winnings)',
    creatorName: 'Yegeta Huawei',
    refType: 'EQUB',
    refId: 'eq-leli'
  },
  // All 10 completed rounds for Leli
  ...[
    { r: 1, date: '2026-01-01T10:00:00.000Z' },
    { r: 2, date: '2026-02-01T10:00:00.000Z' },
    { r: 3, date: '2026-03-01T10:00:00.000Z' },
    { r: 4, date: '2026-04-01T10:00:00.000Z' },
    { r: 5, date: '2026-05-01T10:00:00.000Z' },
    { r: 6, date: '2026-06-01T10:00:00.000Z' },
    { r: 7, date: '2026-07-01T10:00:00.000Z' },
    { r: 8, date: '2026-07-10T10:00:00.000Z' },
    { r: 9, date: '2026-07-20T10:00:00.000Z' },
    { r: 10, date: '2026-07-27T10:00:00.000Z' }
  ].map(({ r, date }): Transaction => ({
    id: `tx-equb-leli-round-${r}`,
    date,
    type: 'EXPENSE',
    category: 'Equb Contribution',
    amount: 3000,
    walletId: 'w-cash',
    description: `Ekub round contribution: Leli (Round ${r})`,
    creatorName: 'Yegeta Huawei',
    refType: 'EQUB',
    refId: 'eq-leli',
    expenseScope: 'BUSINESS'
  }))
];

export const SEPTEMBER_10_TO_12_TRANSACTIONS: Transaction[] = [
  // ==========================================
  // SEPTEMBER 10, 2026
  // ==========================================
  {
    id: 'tx-20260910-exp-rent-14600',
    date: '2026-09-10T09:00:00.000Z',
    type: 'EXPENSE',
    category: 'Rent',
    amount: 14600,
    walletId: 'w-cbe',
    description: 'Shop Rent for September',
    creatorName: 'Yegeta Huawei',
    expenseScope: 'BUSINESS'
  },
  {
    id: 'tx-20260910-inc-cash-1420',
    date: '2026-09-10T14:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 1420,
    walletId: 'w-cash',
    description: 'Daily Sales collection (Cash)',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260910-inc-telebirr-450',
    date: '2026-09-10T14:30:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 450,
    walletId: 'w-telebirr',
    description: 'Daily Sales collection (Telebirr)',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260910-inc-cbe-200',
    date: '2026-09-10T15:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 200,
    walletId: 'w-cbe',
    description: 'Daily Sales collection (CBE)',
    creatorName: 'Yegeta Huawei'
  },

  // ==========================================
  // SEPTEMBER 11, 2026 (Enkutatash / Ethiopian New Year)
  // ==========================================
  {
    id: 'tx-20260911-exp-holiday-650',
    date: '2026-09-11T12:00:00.000Z',
    type: 'EXPENSE',
    category: 'Food & Refreshments',
    amount: 650,
    walletId: 'w-cash',
    description: 'Enkutatash holiday dinner & celebration',
    creatorName: 'Yegeta Huawei',
    expenseScope: 'PERSONAL'
  },
  {
    id: 'tx-20260911-inc-cash-890',
    date: '2026-09-11T16:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 890,
    walletId: 'w-cash',
    description: 'Holiday Daily Sales collection (Cash)',
    creatorName: 'Yegeta Huawei'
  },

  // ==========================================
  // SEPTEMBER 12, 2026
  // ==========================================
  {
    id: 'tx-20260912-inc-cash-850',
    date: '2026-09-12T14:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 850,
    walletId: 'w-cash',
    description: 'Daily Sales collection (Cash)',
    creatorName: 'Yegeta Huawei'
  },
  {
    id: 'tx-20260912-inc-telebirr-300',
    date: '2026-09-12T15:00:00.000Z',
    type: 'INCOME',
    category: 'Daily Income',
    amount: 300,
    walletId: 'w-telebirr',
    description: 'Daily Sales collection (Telebirr)',
    creatorName: 'Yegeta Huawei'
  }
];

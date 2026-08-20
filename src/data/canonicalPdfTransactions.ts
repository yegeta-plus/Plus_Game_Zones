import { Transaction } from '../types';

export const CANONICAL_PDF_TRANSACTIONS: Transaction[] = [
  // Jul 1
  { id: 'tx-jul-open-cash-equity', date: '2026-07-01T00:00:00.000Z', type: 'INCOME', category: 'Genesis / Setup', amount: 10699, walletId: 'w-cash', description: 'Owner Initial Capital & Cash Reserve Setup', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260701-01', date: '2026-07-01T08:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 130, walletId: 'w-cbe', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260701-02', date: '2026-07-01T08:30:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 1095, walletId: 'w-telebirr', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260701-03', date: '2026-07-01T09:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 750, walletId: 'w-cash', description: 'Daily Income', creatorName: 'Yegeta Huawei' },

  // Jul 2
  { id: 'tx-20260702-01', date: '2026-07-02T10:00:00.000Z', type: 'EXPENSE', category: 'Expense — Phone/Internet', amount: 1010, walletId: 'w-telebirr', description: 'Internet bill', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260702-02', date: '2026-07-02T11:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 1780, walletId: 'w-cash', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260702-03', date: '2026-07-02T12:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 1010, walletId: 'w-telebirr', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260702-04', date: '2026-07-02T13:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 60, walletId: 'w-ebirr', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260702-05', date: '2026-07-02T14:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 80, walletId: 'w-cbe', description: 'Daily Income', creatorName: 'Yegeta Huawei' },

  // Jul 3
  { id: 'tx-20260703-01', date: '2026-07-03T09:00:00.000Z', type: 'EXPENSE', category: 'Expense — Utilities', amount: 2050, walletId: 'w-cash', description: 'Electricity bill', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260703-02', date: '2026-07-03T10:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 80, walletId: 'w-cbe', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260703-03', date: '2026-07-03T11:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 60, walletId: 'w-ebirr', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260703-04', date: '2026-07-03T12:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 1010, walletId: 'w-telebirr', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260703-05', date: '2026-07-03T13:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 1780, walletId: 'w-cash', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260703-06', date: '2026-07-03T16:00:00.000Z', type: 'EXPENSE', category: 'Owner Withdrawal', amount: 2600, walletId: 'w-cash', description: 'Ye suk eda / home expense', creatorName: 'Yegeta Huawei' },

  // Jul 4
  { id: 'tx-20260704-01', date: '2026-07-04T09:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 135, walletId: 'w-telebirr', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260704-02', date: '2026-07-04T10:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 510, walletId: 'w-cbe', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260704-03', date: '2026-07-04T11:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 1765, walletId: 'w-cash', description: 'Daily Income', creatorName: 'Yegeta Huawei' },

  // Jul 5
  { id: 'tx-20260705-01', date: '2026-07-05T09:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 1870, walletId: 'w-cash', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260705-02', date: '2026-07-05T10:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 480, walletId: 'w-telebirr', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260705-03', date: '2026-07-05T11:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 555, walletId: 'w-cbe', description: 'Daily Income', creatorName: 'Yegeta Huawei' },

  // Jul 6
  { id: 'tx-20260706-01', date: '2026-07-06T09:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 1325, walletId: 'w-cash', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260706-02', date: '2026-07-06T10:00:00.000Z', type: 'EXPENSE', category: 'Owner Withdrawal', amount: 970, walletId: 'w-cash', splits: [{ walletId: 'w-cash', amount: 690 }, { walletId: 'w-telebirr', amount: 280 }], description: 'Kurs expense', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260706-03', date: '2026-07-06T11:00:00.000Z', type: 'INCOME', category: 'Loan Received', amount: 15000, walletId: 'w-cash', description: 'Loan disbursed/logged', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260706-04', date: '2026-07-06T12:00:00.000Z', type: 'INCOME', category: 'Loan Received', amount: 9000, walletId: 'w-cash', description: 'Loan disbursed/logged', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260706-05', date: '2026-07-06T13:00:00.000Z', type: 'INCOME', category: 'Loan Received', amount: 25500, walletId: 'w-cash', description: 'Loan disbursed/logged', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260706-06', date: '2026-07-06T14:00:00.000Z', type: 'EXPENSE', category: 'Expense — Tax & License', amount: 6880, walletId: 'w-cbe', splits: [{ walletId: 'w-cbe', amount: 2600 }, { walletId: 'w-telebirr', amount: 2400 }, { walletId: 'w-cash', amount: 1880 }], description: 'Tax & License', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260706-07', date: '2026-07-06T15:00:00.000Z', type: 'EXPENSE', category: 'Expense — Utilities', amount: 310, walletId: 'w-cash', description: '3-month water bill', creatorName: 'Yegeta Huawei' },

  // Jul 7
  { id: 'tx-20260707-01', date: '2026-07-07T09:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 1330, walletId: 'w-cash', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260707-02', date: '2026-07-07T10:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 370, walletId: 'w-telebirr', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260707-03', date: '2026-07-07T11:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 100, walletId: 'w-cbe', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260707-04', date: '2026-07-07T12:00:00.000Z', type: 'EXPENSE', category: 'Expense — Equipment', amount: 300, walletId: 'w-cash', description: 'Power cable purchase', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260707-05', date: '2026-07-07T13:00:00.000Z', type: 'EXPENSE', category: 'Expense — Phone/Internet', amount: 70, walletId: 'w-telebirr', description: '2.5 GB daily GB for PS4', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260707-06', date: '2026-07-07T14:00:00.000Z', type: 'EXPENSE', category: 'Expense — Transport', amount: 200, walletId: 'w-telebirr', description: 'Transport', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260707-07', date: '2026-07-07T15:00:00.000Z', type: 'INCOME', category: 'Receivable Collected', amount: 580, walletId: 'w-telebirr', description: 'Split repayment on receivable', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260707-08', date: '2026-07-07T16:00:00.000Z', type: 'EXPENSE', category: 'Expense — Equipment', amount: 49500, walletId: 'w-cash', description: 'PS4 Pro purchase', creatorName: 'Yegeta Huawei' },

  // Jul 8
  { id: 'tx-20260708-01', date: '2026-07-08T09:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 1445, walletId: 'w-cash', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260708-02', date: '2026-07-08T10:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 230, walletId: 'w-cbe', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260708-03', date: '2026-07-08T11:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 160, walletId: 'w-telebirr', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260708-04', date: '2026-07-08T12:00:00.000Z', type: 'INCOME', category: 'Receivable Collected', amount: 520, walletId: 'w-telebirr', description: 'Split repayment on receivable', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260708-05', date: '2026-07-08T13:00:00.000Z', type: 'EXPENSE', category: 'Ekub', amount: 3000, walletId: 'w-cash', description: 'Leli Ekub contribution', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260708-06', date: '2026-07-08T14:00:00.000Z', type: 'EXPENSE', category: 'Owner Withdrawal', amount: 320, walletId: 'w-cash', description: 'Asbeza / home expense', creatorName: 'Yegeta Huawei' },

  // Jul 9
  { id: 'tx-20260709-01', date: '2026-07-09T09:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 75, walletId: 'w-cbe', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260709-02', date: '2026-07-09T10:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 265, walletId: 'w-telebirr', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260709-03', date: '2026-07-09T11:00:00.000Z', type: 'EXPENSE', category: 'Ekub', amount: 5000, walletId: 'w-cash', description: 'Agerye Ekub contribution', creatorName: 'Yegeta Huawei' },

  // Jul 10
  { id: 'tx-20260710-01', date: '2026-07-10T09:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 1730, walletId: 'w-cash', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260710-02', date: '2026-07-10T10:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 80, walletId: 'w-cbe', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260710-03', date: '2026-07-10T11:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 1110, walletId: 'w-telebirr', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260710-04', date: '2026-07-10T12:00:00.000Z', type: 'EXPENSE', category: 'Expense — Transport', amount: 100, walletId: 'w-cash', description: 'Transport', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260710-05', date: '2026-07-10T13:00:00.000Z', type: 'EXPENSE', category: 'Expense — Transport', amount: 2000, walletId: 'w-telebirr', description: 'Chair transportation fee', creatorName: 'Yegeta Huawei' },

  // Jul 11
  { id: 'tx-20260711-01', date: '2026-07-11T09:00:00.000Z', type: 'EXPENSE', category: 'Owner Withdrawal', amount: 250, walletId: 'w-telebirr', description: 'Saturday dinner', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260711-02', date: '2026-07-11T09:30:00.000Z', type: 'EXPENSE', category: 'Loan Repayment', amount: 200, walletId: 'w-telebirr', description: 'Loan repayment', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260711-03', date: '2026-07-11T10:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 75, walletId: 'w-cbe', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260711-04', date: '2026-07-11T10:30:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 385, walletId: 'w-telebirr', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260711-05', date: '2026-07-11T11:00:00.000Z', type: 'EXPENSE', category: 'Owner Withdrawal', amount: 1700, walletId: 'w-cash', description: 'Tsom mefcha, Zeru & others', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260711-06', date: '2026-07-11T11:30:00.000Z', type: 'EXPENSE', category: 'Owner Withdrawal', amount: 180, walletId: 'w-cash', description: 'Home expense', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260711-07', date: '2026-07-11T12:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 1990, walletId: 'w-cash', description: 'Daily Income', creatorName: 'Yegeta Huawei' },

  // Jul 12
  { id: 'tx-20260712-01', date: '2026-07-12T09:00:00.000Z', type: 'EXPENSE', category: 'Owner Withdrawal', amount: 1000, walletId: 'w-cash', description: 'Gg transport', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260712-02', date: '2026-07-12T09:30:00.000Z', type: 'INCOME', category: 'Loan Received', amount: 1200, walletId: 'w-cash', description: 'Loan disbursed/logged', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260712-03', date: '2026-07-12T10:00:00.000Z', type: 'EXPENSE', category: 'Loan Repayment', amount: 15000, walletId: 'w-cash', splits: [{ walletId: 'w-cash', amount: 12000 }, { walletId: 'w-telebirr', amount: 3000 }], description: 'Loan repayment', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260712-04', date: '2026-07-12T10:30:00.000Z', type: 'INCOME', category: 'Receivable Collected', amount: 400, walletId: 'w-telebirr', description: 'Split repayment on receivable', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260712-05', date: '2026-07-12T11:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 1055, walletId: 'w-cash', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260712-06', date: '2026-07-12T11:30:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 60, walletId: 'w-cbe', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260712-07', date: '2026-07-12T12:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 420, walletId: 'w-telebirr', description: 'Daily Income', creatorName: 'Yegeta Huawei' },

  // Jul 13
  { id: 'tx-20260713-01', date: '2026-07-13T09:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 395, walletId: 'w-cbe', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260713-02', date: '2026-07-13T09:30:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 360, walletId: 'w-telebirr', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260713-03', date: '2026-07-13T10:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 1870, walletId: 'w-cash', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260713-04', date: '2026-07-13T11:00:00.000Z', type: 'EXPENSE', category: 'Owner Withdrawal', amount: 1000, walletId: 'w-cash', description: 'Zeru last-month transport', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260713-05', date: '2026-07-13T11:30:00.000Z', type: 'EXPENSE', category: 'Owner Withdrawal', amount: 1000, walletId: 'w-cash', splits: [{ walletId: 'w-cash', amount: 500 }, { walletId: 'w-telebirr', amount: 500 }], description: 'Hermi transport', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260713-06', date: '2026-07-13T12:00:00.000Z', type: 'EXPENSE', category: 'Owner Withdrawal', amount: 160, walletId: 'w-cash', description: 'Dinner', creatorName: 'Yegeta Huawei' },

  // Jul 14
  { id: 'tx-20260714-01', date: '2026-07-14T09:00:00.000Z', type: 'INCOME', category: 'Receivable Collected', amount: 615, walletId: 'w-cash', description: 'Split repayment on receivable', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260714-02', date: '2026-07-14T09:30:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 280, walletId: 'w-cbe', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260714-03', date: '2026-07-14T10:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 1420, walletId: 'w-cash', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260714-04', date: '2026-07-14T11:00:00.000Z', type: 'EXPENSE', category: 'Owner Withdrawal', amount: 510, walletId: 'w-cash', description: 'Lunch Zeru & Gg', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260714-05', date: '2026-07-14T11:30:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 505, walletId: 'w-telebirr', description: 'Daily Income', creatorName: 'Yegeta Huawei' },

  // Jul 15
  { id: 'tx-20260715-01', date: '2026-07-15T09:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 230, walletId: 'w-cbe', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260715-02', date: '2026-07-15T09:30:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 710, walletId: 'w-telebirr', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260715-03', date: '2026-07-15T10:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 1750, walletId: 'w-cash', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260715-04', date: '2026-07-15T11:00:00.000Z', type: 'EXPENSE', category: 'Owner Withdrawal', amount: 175, walletId: 'w-cash', description: 'Dinner', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260715-05', date: '2026-07-15T11:30:00.000Z', type: 'EXPENSE', category: 'Owner Withdrawal', amount: 1000, walletId: 'w-cash', description: 'Zeru transport', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260715-06', date: '2026-07-15T12:00:00.000Z', type: 'EXPENSE', category: 'Owner Withdrawal', amount: 1000, walletId: 'w-cash', splits: [{ walletId: 'w-cash', amount: 500 }, { walletId: 'w-telebirr', amount: 500 }], description: 'Hermi transport', creatorName: 'Yegeta Huawei' },

  // Jul 16
  { id: 'tx-20260716-01', date: '2026-07-16T09:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 530, walletId: 'w-cbe', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260716-02', date: '2026-07-16T10:00:00.000Z', type: 'EXPENSE', category: 'Owner Withdrawal', amount: 510, walletId: 'w-cash', description: 'Gg & Hermi lunch', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260716-03', date: '2026-07-16T10:30:00.000Z', type: 'EXPENSE', category: 'Owner Withdrawal', amount: 400, walletId: 'w-cash', description: 'Rice, jar and other items', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260716-04', date: '2026-07-16T11:00:00.000Z', type: 'INCOME', category: 'Receivable Collected', amount: 200, walletId: 'w-telebirr', description: 'Split repayment on receivable', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260716-05', date: '2026-07-16T12:00:00.000Z', type: 'EXPENSE', category: 'Ekub', amount: 5000, walletId: 'w-cash', splits: [{ walletId: 'w-cbe', amount: 1810 }, { walletId: 'w-cash', amount: 3190 }], description: 'Agerye — Round 18', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260716-06', date: '2026-07-16T13:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 1515, walletId: 'w-cash', description: 'Daily Income', creatorName: 'Yegeta Huawei' },

  // Jul 17
  { id: 'tx-20260717-01', date: '2026-07-17T09:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 635, walletId: 'w-telebirr', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260717-02', date: '2026-07-17T09:30:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 795, walletId: 'w-cbe', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260717-03', date: '2026-07-17T10:00:00.000Z', type: 'EXPENSE', category: 'Owner Withdrawal', amount: 600, walletId: 'w-cash', description: 'Home expense', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260717-04', date: '2026-07-17T10:30:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 100, walletId: 'w-telebirr', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260717-05', date: '2026-07-17T11:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 285, walletId: 'w-cbe', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260717-06', date: '2026-07-17T11:30:00.000Z', type: 'EXPENSE', category: 'Owner Withdrawal', amount: 900, walletId: 'w-cbe', description: 'Zeru, Gg & Hermi lunch', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260717-07', date: '2026-07-17T12:00:00.000Z', type: 'EXPENSE', category: 'Ekub', amount: 650, walletId: 'w-telebirr', description: 'Leli — Round 9', creatorName: 'Yegeta Huawei' },

  // Jul 18
  { id: 'tx-20260718-01', date: '2026-07-18T09:00:00.000Z', type: 'EXPENSE', category: 'Ekub', amount: 2350, walletId: 'w-cash', splits: [{ walletId: 'w-cash', amount: 700 }, { walletId: 'w-cbe', amount: 1650 }], description: 'Leli — Round 9', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260718-02', date: '2026-07-18T09:30:00.000Z', type: 'EXPENSE', category: 'Expense — Cleaning/Supplies', amount: 150, walletId: 'w-cash', description: 'Cleaning & supplies', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260718-03', date: '2026-07-18T10:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 1085, walletId: 'w-cash', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260718-04', date: '2026-07-18T10:30:00.000Z', type: 'EXPENSE', category: 'Owner Withdrawal', amount: 65, walletId: 'w-cash', description: 'Home expense', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260718-05', date: '2026-07-18T11:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 2105, walletId: 'w-cash', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260718-06', date: '2026-07-18T11:30:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 700, walletId: 'w-telebirr', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260718-07', date: '2026-07-18T12:00:00.000Z', type: 'EXPENSE', category: 'Owner Withdrawal', amount: 135, walletId: 'w-cash', description: 'Home expense', creatorName: 'Yegeta Huawei' },

  // Jul 19
  { id: 'tx-20260719-01', date: '2026-07-19T10:00:00.000Z', type: 'EXPENSE', category: 'Owner Withdrawal', amount: 800, walletId: 'w-cash', splits: [{ walletId: 'w-cash', amount: 400 }, { walletId: 'w-telebirr', amount: 400 }], description: 'World Cup / personal', creatorName: 'Yegeta Huawei' },

  // Jul 20
  { id: 'tx-20260720-01', date: '2026-07-20T09:00:00.000Z', type: 'EXPENSE', category: 'Loan Repayment', amount: 3000, walletId: 'w-cash', description: 'Split repayment on loan', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260720-02', date: '2026-07-20T09:30:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 245, walletId: 'w-telebirr', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260720-03', date: '2026-07-20T10:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 2220, walletId: 'w-cash', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260720-04', date: '2026-07-20T10:30:00.000Z', type: 'EXPENSE', category: 'Owner Withdrawal', amount: 150, walletId: 'w-cash', description: 'Home expense', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260720-05', date: '2026-07-20T11:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 200, walletId: 'w-cbe', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260720-06', date: '2026-07-20T11:30:00.000Z', type: 'INCOME', category: 'Receivable Collected', amount: 715, walletId: 'w-telebirr', description: 'Split repayment on receivable', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260720-07', date: '2026-07-20T12:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 300, walletId: 'w-cbe', description: 'Daily Income', creatorName: 'Yegeta Huawei' },

  // Jul 21
  { id: 'tx-20260721-01', date: '2026-07-21T09:00:00.000Z', type: 'EXPENSE', category: 'Owner Withdrawal', amount: 100, walletId: 'w-cash', description: 'Home expense', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260721-02', date: '2026-07-21T09:30:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 1590, walletId: 'w-cash', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260721-03', date: '2026-07-21T10:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 435, walletId: 'w-telebirr', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260721-04', date: '2026-07-21T10:30:00.000Z', type: 'EXPENSE', category: 'Owner Withdrawal', amount: 120, walletId: 'w-cash', description: 'Dinner', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260721-05', date: '2026-07-21T11:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 535, walletId: 'w-telebirr', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260721-06', date: '2026-07-21T11:30:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 425, walletId: 'w-cash', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260721-07', date: '2026-07-21T12:00:00.000Z', type: 'EXPENSE', category: 'Owner Withdrawal', amount: 340, walletId: 'w-cash', description: 'Lunch', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260721-08', date: '2026-07-21T13:00:00.000Z', type: 'EXPENSE', category: 'Loan Repayment', amount: 4730, walletId: 'w-cash', splits: [{ walletId: 'w-cash', amount: 3000 }, { walletId: 'w-telebirr', amount: 1500 }, { walletId: 'w-cbe', amount: 230 }], description: 'Loan repayment', creatorName: 'Yegeta Huawei' },

  // Jul 22
  { id: 'tx-20260722-01', date: '2026-07-22T09:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 555, walletId: 'w-cbe', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260722-02', date: '2026-07-22T10:00:00.000Z', type: 'EXPENSE', category: 'Loan Repayment', amount: 770, walletId: 'w-cash', splits: [{ walletId: 'w-cash', amount: 500 }, { walletId: 'w-telebirr', amount: 270 }], description: 'Loan repayment', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260722-03', date: '2026-07-22T11:00:00.000Z', type: 'EXPENSE', category: 'Expense — Utilities', amount: 1150, walletId: 'w-cash', description: 'Electricity & water', creatorName: 'Yegeta Huawei' },

  // Jul 23
  { id: 'tx-20260723-01', date: '2026-07-23T09:00:00.000Z', type: 'EXPENSE', category: 'Expense — Cleaning/Supplies', amount: 400, walletId: 'w-cash', description: 'Toilet detergent', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260723-02', date: '2026-07-23T09:30:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 2260, walletId: 'w-cash', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260723-03', date: '2026-07-23T10:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 420, walletId: 'w-telebirr', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260723-04', date: '2026-07-23T10:30:00.000Z', type: 'EXPENSE', category: 'Owner Withdrawal', amount: 1000, walletId: 'w-cash', description: 'Zeru transport', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260723-05', date: '2026-07-23T11:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 160, walletId: 'w-cbe', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260723-06', date: '2026-07-23T11:30:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 330, walletId: 'w-telebirr', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260723-07', date: '2026-07-23T12:00:00.000Z', type: 'EXPENSE', category: 'Owner Withdrawal', amount: 200, walletId: 'w-cbe', description: 'Gg transport', creatorName: 'Yegeta Huawei' },

  // Jul 24
  { id: 'tx-20260724-01', date: '2026-07-24T09:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 2145, walletId: 'w-cash', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260724-02', date: '2026-07-24T10:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 300, walletId: 'w-telebirr', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260724-03', date: '2026-07-24T11:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 610, walletId: 'w-cbe', description: 'Daily Income', creatorName: 'Yegeta Huawei' },

  // Jul 25
  { id: 'tx-20260725-01', date: '2026-07-25T09:00:00.000Z', type: 'EXPENSE', category: 'Loan Repayment', amount: 2000, walletId: 'w-cash', description: 'Zerubabel loan repayment', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260725-02', date: '2026-07-25T09:30:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 700, walletId: 'w-cash', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260725-03', date: '2026-07-25T10:00:00.000Z', type: 'EXPENSE', category: 'Owner Withdrawal', amount: 200, walletId: 'w-cash', description: 'Home expense', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260725-04', date: '2026-07-25T10:30:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 165, walletId: 'w-telebirr', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260725-05', date: '2026-07-25T11:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 75, walletId: 'w-cbe', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260725-06', date: '2026-07-25T11:30:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 2635, walletId: 'w-cash', description: 'Daily Income', creatorName: 'Yegeta Huawei' },

  // Jul 26
  { id: 'tx-20260726-01', date: '2026-07-26T09:00:00.000Z', type: 'EXPENSE', category: 'Owner Withdrawal', amount: 100, walletId: 'w-cash', description: 'Lunch Hermi', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260726-02', date: '2026-07-26T09:30:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 770, walletId: 'w-telebirr', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260726-03', date: '2026-07-26T10:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 40, walletId: 'w-telebirr', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260726-04', date: '2026-07-26T11:00:00.000Z', type: 'INCOME', category: 'Receivable Collected', amount: 500, walletId: 'w-telebirr', description: 'Repayment on receivable', creatorName: 'Yegeta Huawei' },

  // Jul 27
  { id: 'tx-20260727-01', date: '2026-07-27T09:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 1200, walletId: 'w-cash', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260727-02', date: '2026-07-27T09:30:00.000Z', type: 'EXPENSE', category: 'Owner Withdrawal', amount: 200, walletId: 'w-cash', description: 'Home expense', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260727-03', date: '2026-07-27T10:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 285, walletId: 'w-telebirr', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260727-04', date: '2026-07-27T10:30:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 280, walletId: 'w-ebirr', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260727-05', date: '2026-07-27T11:00:00.000Z', type: 'EXPENSE', category: 'Ekub', amount: 5000, walletId: 'w-cash', description: 'Agerye — Round 19', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260727-06', date: '2026-07-27T11:30:00.000Z', type: 'EXPENSE', category: 'Ekub', amount: 3100, walletId: 'w-cash', splits: [{ walletId: 'w-cash', amount: 2100 }, { walletId: 'w-telebirr', amount: 1000 }], description: 'Leli — Round 10', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260727-07', date: '2026-07-27T12:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 1715, walletId: 'w-cash', description: 'Daily Income', creatorName: 'Yegeta Huawei' },

  // Jul 28
  { id: 'tx-20260728-01', date: '2026-07-28T09:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 75, walletId: 'w-telebirr', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260728-02', date: '2026-07-28T09:30:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 50, walletId: 'w-cbe', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260728-03', date: '2026-07-28T10:00:00.000Z', type: 'EXPENSE', category: 'Owner Withdrawal', amount: 500, walletId: 'w-cash', description: 'Dinner / food & refreshments', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260728-04', date: '2026-07-28T10:30:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 1715, walletId: 'w-cash', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260728-05', date: '2026-07-28T11:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 590, walletId: 'w-telebirr', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260728-06', date: '2026-07-28T12:00:00.000Z', type: 'EXPENSE', category: 'Expense — Phone/Internet', amount: 1020, walletId: 'w-telebirr', splits: [{ walletId: 'w-telebirr', amount: 600 }, { walletId: 'w-cash', amount: 420 }], description: 'Phone & related expense', creatorName: 'Yegeta Huawei' },

  // Jul 29
  { id: 'tx-20260729-01', date: '2026-07-29T09:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 665, walletId: 'w-cash', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260729-02', date: '2026-07-29T09:30:00.000Z', type: 'EXPENSE', category: 'Owner Withdrawal', amount: 260, walletId: 'w-cash', description: 'Home expense', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260729-03', date: '2026-07-29T10:00:00.000Z', type: 'EXPENSE', category: 'Bad Debt', amount: 150, walletId: 'w-cash', description: 'Bad-debt write-off', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260729-04', date: '2026-07-29T10:30:00.000Z', type: 'INCOME', category: 'Receivable Collected', amount: 480, walletId: 'w-telebirr', description: 'Repayment on receivable', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260729-05', date: '2026-07-29T11:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 1345, walletId: 'w-cash', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260729-06', date: '2026-07-29T11:30:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 440, walletId: 'w-telebirr', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260729-07', date: '2026-07-29T12:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 100, walletId: 'w-cbe', description: 'Daily Income', creatorName: 'Yegeta Huawei' },

  // Jul 30
  { id: 'tx-20260730-01', date: '2026-07-30T09:00:00.000Z', type: 'EXPENSE', category: 'Owner Withdrawal', amount: 150, walletId: 'w-cash', description: 'Home expense', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260730-02', date: '2026-07-30T09:30:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 1150, walletId: 'w-cash', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260730-03', date: '2026-07-30T10:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 480, walletId: 'w-telebirr', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260730-04', date: '2026-07-30T10:30:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 520, walletId: 'w-cbe', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260730-05', date: '2026-07-30T11:00:00.000Z', type: 'EXPENSE', category: 'Owner Withdrawal', amount: 250, walletId: 'w-cash', description: 'Dinner', creatorName: 'Yegeta Huawei' },

  // Jul 31
  { id: 'tx-20260731-01', date: '2026-07-31T09:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 1150, walletId: 'w-cash', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260731-02', date: '2026-07-31T09:30:00.000Z', type: 'EXPENSE', category: 'Owner Withdrawal', amount: 250, walletId: 'w-cash', description: 'Dinner', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260731-03', date: '2026-07-31T10:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 480, walletId: 'w-telebirr', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260731-04', date: '2026-07-31T10:30:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 520, walletId: 'w-cbe', description: 'Daily Income', creatorName: 'Yegeta Huawei' },

  // Aug 1
  { id: 'tx-20260801-01', date: '2026-08-01T09:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 2555, walletId: 'w-cash', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260801-02', date: '2026-08-01T09:30:00.000Z', type: 'EXPENSE', category: 'Expense — Equipment', amount: 1600, walletId: 'w-telebirr', description: '2 PS5 joysticks', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260801-03', date: '2026-08-01T10:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 1455, walletId: 'w-cash', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260801-04', date: '2026-08-01T10:30:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 555, walletId: 'w-telebirr', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260801-05', date: '2026-08-01T11:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 140, walletId: 'w-cbe', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260801-06', date: '2026-08-01T11:30:00.000Z', type: 'EXPENSE', category: 'Owner Withdrawal', amount: 50, walletId: 'w-cash', description: 'Home expense', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260801-07', date: '2026-08-01T12:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 940, walletId: 'w-telebirr', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260801-08', date: '2026-08-01T12:30:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 585, walletId: 'w-cbe', description: 'Daily Income', creatorName: 'Yegeta Huawei' },

  // Aug 2
  { id: 'tx-20260802-01', date: '2026-08-02T09:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 1455, walletId: 'w-cash', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260802-02', date: '2026-08-02T09:30:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 555, walletId: 'w-telebirr', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260802-03', date: '2026-08-02T10:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 140, walletId: 'w-cbe', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260802-04', date: '2026-08-02T11:00:00.000Z', type: 'EXPENSE', category: 'Owner Withdrawal', amount: 50, walletId: 'w-cash', description: 'Home expense', creatorName: 'Yegeta Huawei' },

  // Aug 3
  { id: 'tx-20260803-01', date: '2026-08-03T09:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 1300, walletId: 'w-cash', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260803-02', date: '2026-08-03T09:30:00.000Z', type: 'EXPENSE', category: 'Loan Repayment', amount: 5000, walletId: 'w-cash', description: 'Hermi loan repayment', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260803-03', date: '2026-08-03T10:00:00.000Z', type: 'EXPENSE', category: 'Loan Repayment', amount: 3000, walletId: 'w-cash', description: 'Leli loan repayment', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260803-04', date: '2026-08-03T10:30:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 70, walletId: 'w-telebirr', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260803-05', date: '2026-08-03T11:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 420, walletId: 'w-cbe', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260803-06', date: '2026-08-03T11:30:00.000Z', type: 'EXPENSE', category: 'Owner Withdrawal', amount: 230, walletId: 'w-cash', description: 'Gg lunch', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260803-07', date: '2026-08-03T12:00:00.000Z', type: 'EXPENSE', category: 'Owner Withdrawal', amount: 200, walletId: 'w-cash', description: 'Gg transport', creatorName: 'Yegeta Huawei' },

  // Aug 4
  { id: 'tx-20260804-01', date: '2026-08-04T09:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 2085, walletId: 'w-cash', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260804-02', date: '2026-08-04T09:30:00.000Z', type: 'EXPENSE', category: 'Owner Withdrawal', amount: 200, walletId: 'w-cash', description: 'Gg transport', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260804-03', date: '2026-08-04T10:00:00.000Z', type: 'EXPENSE', category: 'Owner Withdrawal', amount: 230, walletId: 'w-cash', description: 'Gg lunch', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260804-04', date: '2026-08-04T10:30:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 420, walletId: 'w-cbe', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260804-05', date: '2026-08-04T11:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 70, walletId: 'w-telebirr', description: 'Daily Income', creatorName: 'Yegeta Huawei' },

  // Aug 5
  { id: 'tx-20260805-01', date: '2026-08-05T09:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 1605, walletId: 'w-cash', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260805-02', date: '2026-08-05T09:30:00.000Z', type: 'EXPENSE', category: 'Owner Withdrawal', amount: 2050, walletId: 'w-cash', description: 'Utilities', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260805-03', date: '2026-08-05T10:00:00.000Z', type: 'EXPENSE', category: 'Owner Withdrawal', amount: 350, walletId: 'w-cash', description: 'Zeru kurs/errat', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260805-04', date: '2026-08-05T10:30:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 880, walletId: 'w-telebirr', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260805-05', date: '2026-08-05T11:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 415, walletId: 'w-cbe', description: 'Daily Income', creatorName: 'Yegeta Huawei' },

  // Aug 6
  { id: 'tx-20260806-01', date: '2026-08-06T09:00:00.000Z', type: 'EXPENSE', category: 'Owner Withdrawal', amount: 850, walletId: 'w-cash', description: 'Zeru som / food', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260806-02', date: '2026-08-06T10:00:00.000Z', type: 'INCOME', category: 'Loan Received', amount: 27000, walletId: 'w-cash', description: 'Loan disbursed/logged', creatorName: 'Yegeta Huawei' },

  // Aug 7
  { id: 'tx-20260807-01', date: '2026-08-07T09:00:00.000Z', type: 'INCOME', category: 'Loan Received', amount: 25500, walletId: 'w-cash', description: 'Loan disbursed/logged', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260807-02', date: '2026-08-07T09:30:00.000Z', type: 'EXPENSE', category: 'Expense — Tax & License', amount: 41500, walletId: 'w-cash', splits: [{ walletId: 'w-cbe', amount: 7976 }, { walletId: 'w-cash', amount: 33524 }], description: 'Tax & License', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260807-03', date: '2026-08-07T10:00:00.000Z', type: 'EXPENSE', category: 'Loan Repayment', amount: 11000, walletId: 'w-cash', description: 'Zerubabel loan repayment', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260807-04', date: '2026-08-07T10:30:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 240, walletId: 'w-cbe', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260807-05', date: '2026-08-07T11:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 600, walletId: 'w-telebirr', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260807-06', date: '2026-08-07T11:30:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 1800, walletId: 'w-cash', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260807-07', date: '2026-08-07T12:00:00.000Z', type: 'EXPENSE', category: 'Owner Withdrawal', amount: 230, walletId: 'w-cash', description: 'Zeru dinner', creatorName: 'Yegeta Huawei' },

  // Aug 8
  { id: 'tx-20260808-01', date: '2026-08-08T09:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 210, walletId: 'w-telebirr', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260808-02', date: '2026-08-08T09:30:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 250, walletId: 'w-cbe', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260808-03', date: '2026-08-08T10:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 2850, walletId: 'w-cash', description: 'Daily Income', creatorName: 'Yegeta Huawei' },

  // Aug 9
  { id: 'tx-20260809-01', date: '2026-08-09T09:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 2235, walletId: 'w-cash', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260809-02', date: '2026-08-09T09:30:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 575, walletId: 'w-cbe', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260809-03', date: '2026-08-09T10:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 795, walletId: 'w-telebirr', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260809-04', date: '2026-08-09T11:00:00.000Z', type: 'EXPENSE', category: 'Ekub', amount: 5000, walletId: 'w-cash', description: 'Agerye contribution', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260809-05', date: '2026-08-09T12:00:00.000Z', type: 'EXPENSE', category: 'Loan Repayment', amount: 5000, walletId: 'w-cash', splits: [{ walletId: 'w-cash', amount: 3500 }, { walletId: 'w-telebirr', amount: 1500 }], description: 'Loan repayment', creatorName: 'Yegeta Huawei' },

  // Aug 10
  { id: 'tx-20260810-01', date: '2026-08-10T09:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 1700, walletId: 'w-cash', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260810-02', date: '2026-08-10T09:30:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 1085, walletId: 'w-telebirr', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260810-03', date: '2026-08-10T10:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 250, walletId: 'w-cbe', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260810-04', date: '2026-08-10T11:00:00.000Z', type: 'EXPENSE', category: 'Owner Withdrawal', amount: 200, walletId: 'w-cash', description: 'Gg transport', creatorName: 'Yegeta Huawei' },

  // Aug 11
  { id: 'tx-20260811-01', date: '2026-08-11T09:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 1620, walletId: 'w-cash', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260811-02', date: '2026-08-11T09:30:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 1095, walletId: 'w-telebirr', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260811-03', date: '2026-08-11T10:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 365, walletId: 'w-cbe', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260811-04', date: '2026-08-11T11:00:00.000Z', type: 'EXPENSE', category: 'Owner Withdrawal', amount: 130, walletId: 'w-cash', description: 'Food & refreshments', creatorName: 'Yegeta Huawei' },

  // Aug 12
  { id: 'tx-20260812-01', date: '2026-08-12T09:00:00.000Z', type: 'EXPENSE', category: 'Owner Withdrawal', amount: 150, walletId: 'w-cash', description: 'Home expense', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260812-02', date: '2026-08-12T09:30:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 825, walletId: 'w-telebirr', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260812-03', date: '2026-08-12T10:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 1365, walletId: 'w-cash', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260812-04', date: '2026-08-12T10:30:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 30, walletId: 'w-cbe', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260812-05', date: '2026-08-12T11:00:00.000Z', type: 'EXPENSE', category: 'Loan Repayment', amount: 5500, walletId: 'w-telebirr', description: 'Loan repayment', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260812-06', date: '2026-08-12T12:00:00.000Z', type: 'EXPENSE', category: 'Loan Repayment', amount: 7499, walletId: 'w-cash', splits: [{ walletId: 'w-cash', amount: 4000 }, { walletId: 'w-telebirr', amount: 2500 }, { walletId: 'w-cbe', amount: 999 }], description: 'Loan repayment', creatorName: 'Yegeta Huawei' },

  // Aug 13
  { id: 'tx-20260813-01', date: '2026-08-13T09:00:00.000Z', type: 'INCOME', category: 'Receivable Collected', amount: 345, walletId: 'w-telebirr', description: 'Repayment on receivable', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260813-02', date: '2026-08-13T09:30:00.000Z', type: 'INCOME', category: 'Loan Received', amount: 1500, walletId: 'w-telebirr', description: 'Loan disbursed/logged', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260813-03', date: '2026-08-13T10:00:00.000Z', type: 'EXPENSE', category: 'Loan Repayment', amount: 1501, walletId: 'w-telebirr', description: 'Loan repayment', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260813-04', date: '2026-08-13T10:30:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 715, walletId: 'w-cbe', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260813-05', date: '2026-08-13T11:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 120, walletId: 'w-telebirr', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260813-06', date: '2026-08-13T11:30:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 340, walletId: 'w-telebirr', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260813-07', date: '2026-08-13T12:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 1550, walletId: 'w-cash', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260813-08', date: '2026-08-13T12:30:00.000Z', type: 'INCOME', category: 'Receivable Collected', amount: 160, walletId: 'w-telebirr', description: 'Repayment on receivable', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260813-09', date: '2026-08-13T13:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 1085, walletId: 'w-telebirr', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260813-10', date: '2026-08-13T13:30:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 30, walletId: 'w-cbe', description: 'Daily Income', creatorName: 'Yegeta Huawei' },

  // Aug 14
  { id: 'tx-20260814-01', date: '2026-08-14T09:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 2110, walletId: 'w-cash', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260814-02', date: '2026-08-14T10:00:00.000Z', type: 'EXPENSE', category: 'Owner Withdrawal', amount: 780, walletId: 'w-cash', description: 'Home expense', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260814-03', date: '2026-08-14T11:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 315, walletId: 'w-telebirr', description: 'Daily Income', creatorName: 'Yegeta Huawei' },

  // Aug 15
  { id: 'tx-20260815-01', date: '2026-08-15T09:00:00.000Z', type: 'EXPENSE', category: 'Expense — Cleaning/Supplies', amount: 50, walletId: 'w-cash', description: 'Cleaning & supplies', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260815-02', date: '2026-08-15T09:30:00.000Z', type: 'EXPENSE', category: 'Owner Withdrawal', amount: 50, walletId: 'w-cash', description: 'Home expense', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260815-03', date: '2026-08-15T10:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 1490, walletId: 'w-cash', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260815-04', date: '2026-08-15T10:30:00.000Z', type: 'EXPENSE', category: 'Owner Withdrawal', amount: 430, walletId: 'w-cash', description: 'Food & refreshments', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260815-05', date: '2026-08-15T11:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 590, walletId: 'w-cbe', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260815-06', date: '2026-08-15T11:30:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 400, walletId: 'w-telebirr', description: 'Daily Income', creatorName: 'Yegeta Huawei' },

  // Aug 16
  { id: 'tx-20260816-01', date: '2026-08-16T09:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 400, walletId: 'w-telebirr', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260816-02', date: '2026-08-16T09:30:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 590, walletId: 'w-cbe', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260816-03', date: '2026-08-16T10:00:00.000Z', type: 'EXPENSE', category: 'Owner Withdrawal', amount: 430, walletId: 'w-cash', description: 'Food & refreshments', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260816-04', date: '2026-08-16T11:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 1490, walletId: 'w-cash', description: 'Daily Income', creatorName: 'Yegeta Huawei' },

  // Aug 17
  { id: 'tx-20260817-01', date: '2026-08-17T09:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 2010, walletId: 'w-cash', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260817-02', date: '2026-08-17T10:00:00.000Z', type: 'EXPENSE', category: 'Ekub', amount: 5000, walletId: 'w-cash', splits: [{ walletId: 'w-cash', amount: 3500 }, { walletId: 'w-telebirr', amount: 1000 }, { walletId: 'w-cbe', amount: 500 }], description: 'Agerye — Round 21', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260817-03', date: '2026-08-17T11:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 780, walletId: 'w-telebirr', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260817-04', date: '2026-08-17T12:00:00.000Z', type: 'INCOME', category: 'Daily Income', amount: 105, walletId: 'w-cbe', description: 'Daily Income', creatorName: 'Yegeta Huawei' },
  { id: 'tx-20260817-05', date: '2026-08-17T13:00:00.000Z', type: 'EXPENSE', category: 'Expense — Tax & License', amount: 249, walletId: 'w-telebirr', description: 'Telebirr merchant service & transfer fees settlement', creatorName: 'Yegeta Huawei' }
];

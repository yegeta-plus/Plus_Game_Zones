import { Transaction } from '../types';

export interface ExpenseSheetRecord {
  date: string;
  type: string;
  amount: number;
  remark: string;
  category: string;
  walletId?: string;
  splitWallets?: { walletId: string; amount: number }[];
}

// Exactly transcribed from user's provided Expenses spreadsheet ledger
export const IMPORTED_EXPENSE_RECORDS: ExpenseSheetRecord[] = [
  {
    date: '2026-07-23',
    type: 'Utilities (Electricity, Water)',
    amount: 1150,
    remark: 'Utilities (Electricity, Water)',
    category: 'Electricity & Utilities',
    walletId: 'w-cash'
  },
  {
    date: '2026-07-18',
    type: 'Cleaning & Supplies',
    amount: 150,
    remark: 'Cleaning & Supplies',
    category: 'Cleaning & Supplies',
    walletId: 'w-cash'
  },
  {
    date: '2026-07-25',
    type: 'Phone & Internet',
    amount: 1020,
    remark: 'Phone & Internet (Split: 800 ETB from Telebirr, 220 ETB from Cash)',
    category: 'Internet & Phone',
    walletId: 'w-telebirr' // Primary or split
  },
  {
    date: '2026-07-02',
    type: 'Phone & Internet',
    amount: 1010,
    remark: 'internet bill (Phone & Internet)',
    category: 'Internet & Phone',
    walletId: 'w-telebirr'
  },
  {
    date: '2026-08-07',
    type: 'Tax & License',
    amount: 41500,
    remark: 'Tax & License',
    category: 'Tax & License',
    walletId: 'w-cbe'
  },
  {
    date: '2026-07-10',
    type: 'Cleaning & Supplies',
    amount: 400,
    remark: 'Toilet Detergent (Cleaning & Supplies)',
    category: 'Cleaning & Supplies',
    walletId: 'w-cash'
  },
  {
    date: '2026-07-07',
    type: 'Equipment / Maintenance',
    amount: 300,
    remark: 'Power cable purchase for the ps4 pro (Equipment / Asset Purchase)',
    category: 'Equipment / Asset Purchase',
    walletId: 'w-cash'
  },
  {
    date: '2026-07-07',
    type: 'Utilities (Electricity, Water)',
    amount: 310,
    remark: '3 month water bill (Utilities (Electricity, Water))',
    category: 'Electricity & Utilities',
    walletId: 'w-cash'
  },
  {
    date: '2026-07-10',
    type: 'Transport',
    amount: 100,
    remark: 'Transport',
    category: 'Transportation',
    walletId: 'w-cash'
  },
  {
    date: '2026-07-13',
    type: 'Transport',
    amount: 2000,
    remark: "Chair transportation for gg father's car (Maintenance / Transport)",
    category: 'Transportation',
    walletId: 'w-cash'
  },
  {
    date: '2026-07-07',
    type: 'Food & Refreshments',
    amount: 970,
    remark: 'Kurs ena erat (Food & Refreshments) (Split: 600 ETB Telebirr, 370 ETB Cash)',
    category: 'Food & Refreshments',
    walletId: 'w-telebirr'
  },
  {
    date: '2026-08-03',
    type: 'home expense',
    amount: 200,
    remark: 'Jar and other (home expense)',
    category: 'Other & Home Expenses',
    walletId: 'w-cash'
  },
  {
    date: '2026-07-02',
    type: 'Phone & Internet',
    amount: 70,
    remark: '2.5 daily gb for ps4 pro (Phone & Internet)',
    category: 'Internet & Phone',
    walletId: 'w-telebirr'
  },
  {
    date: '2026-07-07',
    type: 'Asset Purchase',
    amount: 49500,
    remark: 'Ps4 pro purchase (Equipment / Asset Purchase)',
    category: 'Equipment / Asset Purchase',
    walletId: 'w-cbe'
  },
  {
    date: '2026-08-15',
    type: 'Cleaning & Supplies',
    amount: 50,
    remark: 'Cleaning & Supplies',
    category: 'Cleaning & Supplies',
    walletId: 'w-cash'
  },
  {
    date: '2026-07-03',
    type: 'Utilities (Electricity, Water)',
    amount: 2050,
    remark: 'electricity bill (Utilities (Electricity, Water))',
    category: 'Electricity & Utilities',
    walletId: 'w-cash'
  },
  {
    date: '2026-07-07',
    type: 'Tax & License',
    amount: 6880,
    remark: 'Tax & License (Split: 4,110 ETB from Telebirr, 2,770 ETB Cash)',
    category: 'Tax & License',
    walletId: 'w-telebirr'
  },
  {
    date: '2026-07-09',
    type: 'home expense',
    amount: 320,
    remark: 'Asbeza (home expense)',
    category: 'Other & Home Expenses',
    walletId: 'w-cash'
  },
  {
    date: '2026-07-04',
    type: 'home expense',
    amount: 2600,
    remark: 'Ye suk eda (home expense)',
    category: 'Other & Home Expenses',
    walletId: 'w-cash'
  },
  {
    date: '2026-07-07',
    type: 'Transport',
    amount: 200,
    remark: 'Transport',
    category: 'Transportation',
    walletId: 'w-cash'
  },
  {
    date: '2026-08-03',
    type: 'Equipment / Maintenance',
    amount: 1600,
    remark: '2 Ps5 joysticks: Ribbon cable 2 each 500 & Repair',
    category: 'Equipment / Asset Purchase',
    walletId: 'w-cash'
  }
];

export function convertExpenseSheetRecordsToTransactions(
  records: ExpenseSheetRecord[] = IMPORTED_EXPENSE_RECORDS,
  creatorName = 'Yegeta Huawei'
): Transaction[] {
  return records.map((rec, index) => ({
    id: `tx-expense-sheet-${rec.date.replace(/-/g, '')}-${index + 1}`,
    date: `${rec.date}T13:00:00.000Z`,
    type: 'EXPENSE',
    category: rec.category,
    amount: rec.amount,
    walletId: rec.walletId || 'w-cash',
    description: rec.remark,
    creatorId: 'u-1',
    creatorName,
    branch: 'Addis Ababa HQ'
  }));
}

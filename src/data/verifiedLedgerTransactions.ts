import { Transaction, Transfer, Receivable } from "../types";

export const VERIFIED_OPENING_BALANCES = {
  "cash": 5705,
  "telebirr": 3020,
  "cbe": 3400,
  "ebirr": 330
};

export const VERIFIED_TRANSFERS: Transfer[] = [
  {
    "id": "tr-20260908-cbe-cash",
    "fromWalletId": "w-cbe",
    "toWalletId": "w-cash",
    "amount": 700,
    "date": "2026-09-08T12:00:00.000Z",
    "reason": "Moved 700 ETB from CBE to Cash",
    "creatorId": "u-1",
    "creatorName": "Yegeta Huawei"
  }
];

export const VERIFIED_RECEIVABLES: Receivable[] = [
  {
    "id": "rcv-20260914-fike",
    "customerName": "Fike",
    "description": "Bale'da credit for Fike",
    "amountOwed": 520,
    "amountCollected": 500,
    "createdDate": "2026-09-14T01:43:00.000Z",
    "dueDate": "2026-09-28T01:43:00.000Z",
    "status": "OUTSTANDING",
    "walletId": "w-cbe"
  },
  {
    "id": "rcv-20260914-solomon",
    "customerName": "Solomon",
    "description": "Bale'da credit for Solomon",
    "amountOwed": 150,
    "amountCollected": 130,
    "createdDate": "2026-09-14T01:44:00.000Z",
    "dueDate": "2026-09-28T01:44:00.000Z",
    "status": "OUTSTANDING",
    "walletId": "w-telebirr"
  },
  {
    "id": "rcv-20260922-solomon",
    "customerName": "Solomon",
    "description": "Bale'da credit for Solomon",
    "amountOwed": 465,
    "amountCollected": 465,
    "createdDate": "2026-09-22T22:29:00.000Z",
    "dueDate": "2026-10-06T22:29:00.000Z",
    "status": "COLLECTED",
    "walletId": "w-telebirr"
  },
  {
    "id": "rcv-20260922-fike",
    "customerName": "Fike",
    "description": "Bale'da credit for Fike",
    "amountOwed": 200,
    "amountCollected": 0,
    "createdDate": "2026-09-22T22:29:00.000Z",
    "dueDate": "2026-10-06T22:29:00.000Z",
    "status": "OUTSTANDING",
    "walletId": "w-cbe"
  },
  {
    "id": "rcv-20260923-solomon",
    "customerName": "Solomon",
    "description": "Bale'da credit for Solomon",
    "amountOwed": 180,
    "amountCollected": 180,
    "createdDate": "2026-09-23T10:18:00.000Z",
    "dueDate": "2026-10-07T10:18:00.000Z",
    "status": "COLLECTED",
    "walletId": "w-telebirr"
  },
  {
    "id": "rcv-20261002-solomon",
    "customerName": "Solomon",
    "description": "Bale'da credit for Solomon",
    "amountOwed": 300,
    "amountCollected": 300,
    "createdDate": "2026-10-02T19:32:00.000Z",
    "dueDate": "2026-10-16T19:32:00.000Z",
    "status": "COLLECTED",
    "walletId": "w-telebirr"
  },
  {
    "id": "rcv-20261003-milit",
    "customerName": "Milit",
    "description": "Bale'da credit for Milit",
    "amountOwed": 420,
    "amountCollected": 0,
    "createdDate": "2026-10-03T23:06:00.000Z",
    "dueDate": "2026-10-17T23:06:00.000Z",
    "status": "OUTSTANDING",
    "walletId": "w-cash"
  },
  {
    "id": "rcv-20261004-weframu",
    "customerName": "Weframu lij",
    "description": "Bale'da credit for Weframu lij",
    "amountOwed": 240,
    "amountCollected": 240,
    "createdDate": "2026-10-04T22:12:00.000Z",
    "dueDate": "2026-10-18T22:12:00.000Z",
    "status": "COLLECTED",
    "walletId": "w-cash"
  },
  {
    "id": "rcv-20261004-miki",
    "customerName": "Miki",
    "description": "Bale'da credit for Miki",
    "amountOwed": 100,
    "amountCollected": 100,
    "createdDate": "2026-10-04T22:12:30.000Z",
    "dueDate": "2026-10-18T22:12:30.000Z",
    "status": "COLLECTED",
    "walletId": "w-cash"
  },
  {
    "id": "rcv-20261004-weframu-col-420",
    "customerName": "Weframu lij",
    "description": "Bale'da credit for Weframu lij",
    "amountOwed": 420,
    "amountCollected": 420,
    "createdDate": "2026-09-25T12:00:00.000Z",
    "dueDate": "2026-10-09T12:00:00.000Z",
    "status": "COLLECTED",
    "walletId": "w-cash"
  },
  {
    "id": "rcv-20261006-solomon-190",
    "customerName": "Solomon",
    "description": "Bale'da credit for Solomon",
    "amountOwed": 190,
    "amountCollected": 0,
    "createdDate": "2026-10-06T08:47:00.000Z",
    "dueDate": "2026-10-20T08:47:00.000Z",
    "status": "OUTSTANDING",
    "walletId": "w-cash"
  },
  {
    "id": "rcv-20261009-credit-440",
    "customerName": "Customer Credit",
    "description": "Bale'da credit for customer",
    "amountOwed": 440,
    "amountCollected": 440,
    "createdDate": "2026-10-09T22:02:00.000Z",
    "dueDate": "2026-10-23T22:02:00.000Z",
    "status": "COLLECTED",
    "walletId": "w-cash"
  },
  {
    "id": "rcv-20261010-col-700",
    "customerName": "Customer Credit",
    "description": "Bale'da credit collection",
    "amountOwed": 700,
    "amountCollected": 700,
    "createdDate": "2026-09-26T12:20:00.000Z",
    "dueDate": "2026-10-10T12:20:00.000Z",
    "status": "COLLECTED",
    "walletId": "w-telebirr"
  },
  {
    "id": "rcv-20261010-pending-700",
    "customerName": "Customer Credit",
    "description": "Bale'da credit for customer",
    "amountOwed": 700,
    "amountCollected": 0,
    "createdDate": "2026-10-10T20:29:00.000Z",
    "dueDate": "2026-10-24T20:29:00.000Z",
    "status": "OUTSTANDING",
    "walletId": "w-cash"
  }
];

export const VERIFIED_TRANSACTIONS: Transaction[] = [
  {
    "id": "tx-20260907-inc-cash-1510",
    "date": "2026-09-07T14:00:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 1510,
    "walletId": "w-cash",
    "description": "Daily Income collection",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260908-inc-cash-1300",
    "date": "2026-09-08T11:00:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 1300,
    "walletId": "w-cash",
    "description": "Daily Income collection",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260908-inc-telebirr-210",
    "date": "2026-09-08T13:00:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 210,
    "walletId": "w-telebirr",
    "description": "Daily Income collection",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260908-inc-cbe-540",
    "date": "2026-09-08T14:00:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 540,
    "walletId": "w-cbe",
    "description": "Daily Income collection",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260909-inc-cbe-150",
    "date": "2026-09-09T09:00:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 150,
    "walletId": "w-cbe",
    "description": "Daily Income collection",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260909-inc-telebirr-740",
    "date": "2026-09-09T10:00:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 740,
    "walletId": "w-telebirr",
    "description": "Daily Income collection",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260909-inc-cash-2210",
    "date": "2026-09-09T11:00:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 2210,
    "walletId": "w-cash",
    "description": "Daily Income collection",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260913-exp-ps4-repair-150",
    "date": "2026-09-13T10:00:00.000Z",
    "type": "EXPENSE",
    "category": "Equipment Maintenance",
    "amount": 150,
    "walletId": "w-cash",
    "description": "PS4 socket repair",
    "expenseScope": "BUSINESS",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260913-exp-ps5-pin-120",
    "date": "2026-09-13T10:30:00.000Z",
    "type": "EXPENSE",
    "category": "Equipment Maintenance",
    "amount": 120,
    "walletId": "w-cash",
    "description": "PS5 socket pin",
    "expenseScope": "BUSINESS",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260914-inc-cash-0139",
    "date": "2026-09-14T01:39:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 1395,
    "walletId": "w-cash",
    "description": "Daily Sales collection (Cash)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260914-inc-telebirr-0139",
    "date": "2026-09-14T01:39:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 480,
    "walletId": "w-telebirr",
    "description": "Daily Sales collection (Telebirr)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260914-inc-cbe-0139",
    "date": "2026-09-14T01:39:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 540,
    "walletId": "w-cbe",
    "description": "Daily Sales collection (CBE)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260914-exp-dinner-0141",
    "date": "2026-09-14T01:41:00.000Z",
    "type": "EXPENSE",
    "category": "Food & Refreshments",
    "amount": 470,
    "walletId": "w-cash",
    "description": "gg and zeru dinner (Food)",
    "expenseScope": "BUSINESS",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260915-inc-rcv-telebirr-1001",
    "date": "2026-09-15T10:01:00.000Z",
    "type": "INCOME",
    "category": "Daily Income / Collected",
    "amount": 130,
    "walletId": "w-telebirr",
    "description": "Repayment on receivable (Solomon)",
    "refType": "RECEIVABLE",
    "refId": "rcv-20260914-solomon",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260915-inc-telebirr-1005",
    "date": "2026-09-15T10:05:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 610,
    "walletId": "w-telebirr",
    "description": "Daily Sales collection (Telebirr)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260915-inc-cbe-1005",
    "date": "2026-09-15T10:05:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 40,
    "walletId": "w-cbe",
    "description": "Daily Sales collection (CBE)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260916-inc-rcv-cbe-1357",
    "date": "2026-09-16T13:57:00.000Z",
    "type": "INCOME",
    "category": "Daily Income / Collected",
    "amount": 500,
    "walletId": "w-cbe",
    "description": "Repayment on receivable (Fike)",
    "refType": "RECEIVABLE",
    "refId": "rcv-20260914-fike",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260916-inc-telebirr-2117",
    "date": "2026-09-16T21:17:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 175,
    "walletId": "w-telebirr",
    "description": "Daily Sales collection (Telebirr)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260916-inc-cash-2213",
    "date": "2026-09-16T22:13:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 1745,
    "walletId": "w-cash",
    "description": "Daily Sales collection (Cash)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260917-inc-cash-1016",
    "date": "2026-09-17T10:16:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 845,
    "walletId": "w-cash",
    "description": "Daily Sales collection (Cash)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260917-inc-telebirr-1701",
    "date": "2026-09-17T17:01:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 435,
    "walletId": "w-telebirr",
    "description": "Daily Sales collection (Telebirr)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260917-inc-cbe-1701",
    "date": "2026-09-17T17:01:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 590,
    "walletId": "w-cbe",
    "description": "Daily Sales collection (CBE)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260917-inc-ebirr-1701",
    "date": "2026-09-17T17:01:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 30,
    "walletId": "w-ebirr",
    "description": "Daily Sales collection (Ebirr)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260918-inc-cash-1117",
    "date": "2026-09-18T11:17:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 1565,
    "walletId": "w-cash",
    "description": "Daily Sales collection (Cash)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260918-inc-telebirr-1259",
    "date": "2026-09-18T12:59:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 245,
    "walletId": "w-telebirr",
    "description": "Daily Sales collection (Telebirr)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260918-inc-cbe-1259",
    "date": "2026-09-18T12:59:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 560,
    "walletId": "w-cbe",
    "description": "Daily Sales collection (CBE)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260919-inc-cash-2107",
    "date": "2026-09-19T21:07:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 2150,
    "walletId": "w-cash",
    "description": "Daily Sales collection (Cash)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260919-inc-telebirr-2235",
    "date": "2026-09-19T22:35:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 775,
    "walletId": "w-telebirr",
    "description": "Daily Sales collection (Telebirr)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260920-inc-cash-2022",
    "date": "2026-09-20T20:22:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 2525,
    "walletId": "w-cash",
    "description": "Daily Sales collection (Cash)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260920-inc-telebirr-2022",
    "date": "2026-09-20T20:22:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 340,
    "walletId": "w-telebirr",
    "description": "Daily Sales collection (Telebirr)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260921-inc-cash-2337",
    "date": "2026-09-21T23:37:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 2010,
    "walletId": "w-cash",
    "description": "Daily Sales collection (Cash)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260921-inc-telebirr-2341",
    "date": "2026-09-21T23:41:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 295,
    "walletId": "w-telebirr",
    "description": "Daily Sales collection (Telebirr)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260921-inc-cbe-2341",
    "date": "2026-09-21T23:41:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 320,
    "walletId": "w-cbe",
    "description": "Daily Sales collection (CBE)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260922-inc-cash-2228",
    "date": "2026-09-22T22:28:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 520,
    "walletId": "w-cash",
    "description": "Daily Sales collection (Cash)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260922-inc-cbe-2228",
    "date": "2026-09-22T22:28:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 215,
    "walletId": "w-cbe",
    "description": "Daily Sales collection (CBE)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260922-inc-telebirr-2228",
    "date": "2026-09-22T22:28:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 805,
    "walletId": "w-telebirr",
    "description": "Daily Sales collection (Telebirr)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260923-inc-rcv-telebirr-2214",
    "date": "2026-09-23T22:14:00.000Z",
    "type": "INCOME",
    "category": "Daily Income / Collected",
    "amount": 465,
    "walletId": "w-telebirr",
    "description": "Repayment on receivable (Solomon)",
    "refType": "RECEIVABLE",
    "refId": "rcv-20260922-solomon",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260923-inc-cash-2217",
    "date": "2026-09-23T22:17:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 1565,
    "walletId": "w-cash",
    "description": "Daily Sales collection (Cash)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260923-inc-cbe-2217",
    "date": "2026-09-23T22:17:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 135,
    "walletId": "w-cbe",
    "description": "Daily Sales collection (CBE)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260923-inc-telebirr-2217",
    "date": "2026-09-23T22:17:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 485,
    "walletId": "w-telebirr",
    "description": "Daily Sales collection (Telebirr)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260924-inc-telebirr-1215",
    "date": "2026-09-24T12:15:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 150,
    "walletId": "w-telebirr",
    "description": "Gg Lunch — Daily Sales collection",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260924-inc-telebirr-2231",
    "date": "2026-09-24T22:31:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 475,
    "walletId": "w-telebirr",
    "description": "Daily Sales collection (Telebirr)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260924-inc-cbe-2240",
    "date": "2026-09-24T22:40:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 500,
    "walletId": "w-cbe",
    "description": "Daily Sales collection (CBE)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260925-exp-cash-2002",
    "date": "2026-09-25T20:02:00.000Z",
    "type": "EXPENSE",
    "category": "Utilities (Electricity, Water)",
    "amount": 2050,
    "walletId": "w-cash",
    "description": "Utilities (Electricity, Water)",
    "expenseScope": "BUSINESS",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260925-inc-cash-2106",
    "date": "2026-09-25T21:06:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 1130,
    "walletId": "w-cash",
    "description": "Daily Sales collection (Cash)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260926-exp-cash-0939",
    "date": "2026-09-26T09:39:00.000Z",
    "type": "EXPENSE",
    "category": "Utilities (Electricity, Water)",
    "amount": 2100,
    "walletId": "w-cash",
    "description": "Card temola (Utilities (Electricity, Water))",
    "expenseScope": "BUSINESS",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260926-inc-cash-1055",
    "date": "2026-09-26T10:55:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 1685,
    "walletId": "w-cash",
    "description": "Daily Sales collection (Cash)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260926-exp-cash-1055",
    "date": "2026-09-26T10:55:30.000Z",
    "type": "EXPENSE",
    "category": "Food & Refreshment",
    "amount": 900,
    "walletId": "w-cash",
    "description": "Kurs and misa (Food & Refreshment)",
    "expenseScope": "PERSONAL",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260926-exp-cash-1127",
    "date": "2026-09-26T11:27:00.000Z",
    "type": "EXPENSE",
    "category": "Transport",
    "amount": 150,
    "walletId": "w-cash",
    "description": "Transport",
    "expenseScope": "BUSINESS",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260926-inc-telebirr-1206",
    "date": "2026-09-26T12:06:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 75,
    "walletId": "w-telebirr",
    "description": "Daily Sales collection (Telebirr)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260926-inc-cbe-1206",
    "date": "2026-09-26T12:06:30.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 315,
    "walletId": "w-cbe",
    "description": "Daily Sales collection (CBE)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260927-inc-cash-0825",
    "date": "2026-09-27T08:25:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 1950,
    "walletId": "w-cash",
    "description": "Daily Sales collection (Cash)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260927-exp-cash-0826",
    "date": "2026-09-27T08:26:00.000Z",
    "type": "EXPENSE",
    "category": "Food & Refreshment",
    "amount": 250,
    "walletId": "w-cash",
    "description": "Zeru dinner (Food & Refreshment)",
    "expenseScope": "PERSONAL",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260927-inc-telebirr-2209",
    "date": "2026-09-27T22:09:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 225,
    "walletId": "w-telebirr",
    "description": "Daily Sales collection (Telebirr)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260927-inc-cbe-2209",
    "date": "2026-09-27T22:09:30.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 715,
    "walletId": "w-cbe",
    "description": "Daily Sales collection (CBE)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260928-exp-cash-1131",
    "date": "2026-09-28T11:31:00.000Z",
    "type": "EXPENSE",
    "category": "Maintenance",
    "amount": 100,
    "walletId": "w-cash",
    "description": "Ye gbi sidat 2 month mebriya",
    "expenseScope": "BUSINESS",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260928-inc-telebirr-2119",
    "date": "2026-09-28T21:19:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 1230,
    "walletId": "w-telebirr",
    "description": "Daily Sales collection (Telebirr)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260928-inc-cbe-2119",
    "date": "2026-09-28T21:19:30.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 125,
    "walletId": "w-cbe",
    "description": "Daily Sales collection (CBE)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260928-exp-telebirr-2120",
    "date": "2026-09-28T21:20:00.000Z",
    "type": "EXPENSE",
    "category": "Phone & Internet",
    "amount": 1010,
    "walletId": "w-telebirr",
    "description": "Phone & Internet",
    "notes": "Account: acc-1782999486323-1",
    "expenseScope": "BUSINESS",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260928-inc-cash-2156",
    "date": "2026-09-28T21:56:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 1150,
    "walletId": "w-cash",
    "description": "Daily Sales collection (Cash)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260929-inc-telebirr-2122",
    "date": "2026-09-29T21:22:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 390,
    "walletId": "w-telebirr",
    "description": "Daily Sales collection (Telebirr)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260929-inc-cash-2148",
    "date": "2026-09-29T21:48:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 1190,
    "walletId": "w-cash",
    "description": "Daily Sales collection (Cash)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260930-inc-cbe-0945",
    "date": "2026-09-30T09:45:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 30,
    "walletId": "w-cbe",
    "description": "Daily Sales collection (CBE)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260930-inc-cash-1055",
    "date": "2026-09-30T10:55:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 1205,
    "walletId": "w-cash",
    "description": "Daily Sales collection (Cash)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20260930-inc-telebirr-1522",
    "date": "2026-09-30T15:22:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 470,
    "walletId": "w-telebirr",
    "description": "Daily Sales collection (Telebirr)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20261001-exp-cash-1141",
    "date": "2026-10-01T11:41:00.000Z",
    "type": "EXPENSE",
    "category": "Food & Refreshment",
    "amount": 1150,
    "walletId": "w-cash",
    "description": "berbere zeyt and others",
    "expenseScope": "BUSINESS",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20261001-inc-rcv-telebirr-1523",
    "date": "2026-10-01T15:23:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 180,
    "walletId": "w-telebirr",
    "description": "Repayment on receivable (Solomon)",
    "refType": "RECEIVABLE",
    "refId": "rcv-20260923-solomon",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20261002-inc-telebirr-1332",
    "date": "2026-10-02T13:32:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 1095,
    "walletId": "w-telebirr",
    "description": "Daily Sales collection (Telebirr)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20261002-inc-cbe-1332",
    "date": "2026-10-02T13:32:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 60,
    "walletId": "w-cbe",
    "description": "Daily Sales collection (CBE)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20261002-inc-cash-2155",
    "date": "2026-10-02T21:55:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 1245,
    "walletId": "w-cash",
    "description": "Daily Sales collection (Cash)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20261003-inc-telebirr-2208",
    "date": "2026-10-03T22:08:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 1175,
    "walletId": "w-telebirr",
    "description": "Daily Sales collection (Telebirr)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20261003-inc-cbe-2208",
    "date": "2026-10-03T22:08:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 170,
    "walletId": "w-cbe",
    "description": "Daily Sales collection (CBE)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20261003-inc-cash-2208",
    "date": "2026-10-03T22:08:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 1680,
    "walletId": "w-cash",
    "description": "Daily Sales collection (Cash)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20261003-exp-cash-2211",
    "date": "2026-10-03T22:11:00.000Z",
    "type": "EXPENSE",
    "category": "home expense",
    "amount": 150,
    "walletId": "w-cash",
    "description": "home expense",
    "expenseScope": "PERSONAL",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20261004-inc-telebirr-1116",
    "date": "2026-10-04T11:16:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 1260,
    "walletId": "w-telebirr",
    "description": "Daily Sales collection (Telebirr)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20261004-exp-cash-1117",
    "date": "2026-10-04T11:17:00.000Z",
    "type": "EXPENSE",
    "category": "home expense",
    "amount": 150,
    "walletId": "w-cash",
    "description": "home expense",
    "expenseScope": "PERSONAL",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20261004-inc-rcv-cash-1215",
    "date": "2026-10-04T12:15:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 420,
    "walletId": "w-cash",
    "description": "Repayment on receivable (Weframu lij)",
    "refType": "RECEIVABLE",
    "refId": "rcv-20261004-weframu-col-420",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20261004-exp-cash-1328",
    "date": "2026-10-04T13:28:00.000Z",
    "type": "EXPENSE",
    "category": "Food & Refreshment",
    "amount": 900,
    "walletId": "w-cash",
    "description": "lunch (Food & Refreshment)",
    "expenseScope": "PERSONAL",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20261004-exp-cash-1328b",
    "date": "2026-10-04T13:28:30.000Z",
    "type": "EXPENSE",
    "category": "home expense",
    "amount": 220,
    "walletId": "w-cash",
    "description": "home expense",
    "expenseScope": "PERSONAL",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20261004-inc-cash-2211",
    "date": "2026-10-04T22:11:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 1820,
    "walletId": "w-cash",
    "description": "Daily Sales collection (Cash)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20261004-exp-baddebt-cash-2214",
    "date": "2026-10-04T22:14:00.000Z",
    "type": "EXPENSE",
    "category": "Bad Debt",
    "amount": 380,
    "walletId": "w-cash",
    "description": "Bad debt write-off: Weframu lij",
    "expenseScope": "BUSINESS",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20261005-inc-rcv-telebirr-1011",
    "date": "2026-10-05T10:11:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 300,
    "walletId": "w-telebirr",
    "description": "Repayment on receivable (Solomon)",
    "refType": "RECEIVABLE",
    "refId": "rcv-20261002-solomon",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20261005-inc-telebirr-1011",
    "date": "2026-10-05T10:11:30.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 360,
    "walletId": "w-telebirr",
    "description": "Daily Sales collection (Telebirr)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20261005-inc-rcv-cash-1508",
    "date": "2026-10-05T15:08:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 100,
    "walletId": "w-cash",
    "description": "Repayment on receivable (Miki)",
    "refType": "RECEIVABLE",
    "refId": "rcv-20261004-miki",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20261005-inc-cbe-1543",
    "date": "2026-10-05T15:43:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 100,
    "walletId": "w-cbe",
    "description": "Daily Sales collection (CBE)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20261005-exp-ekub-1544",
    "date": "2026-10-05T15:44:00.000Z",
    "type": "EXPENSE",
    "category": "Equb Contribution",
    "amount": 10000,
    "walletId": "w-cash",
    "splits": [
      { "walletId": "w-telebirr", "amount": 3550 },
      { "walletId": "w-cbe", "amount": 400 },
      { "walletId": "w-cash", "amount": 6050 }
    ],
    "description": "Ekub round contribution: Leli ekub 2 (Round 3 - Split: Telebirr ETB 3,550, CBE ETB 400, Cash ETB 6,050)",
    "refType": "EQUB",
    "refId": "eq-leli-2",
    "expenseScope": "PERSONAL",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20261005-inc-cash-2250",
    "date": "2026-10-05T22:50:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 1375,
    "walletId": "w-cash",
    "description": "Daily Sales collection (Cash)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20261005-exp-cash-2251",
    "date": "2026-10-05T22:51:00.000Z",
    "type": "EXPENSE",
    "category": "home expense",
    "amount": 150,
    "walletId": "w-cash",
    "description": "Jar (home expense)",
    "expenseScope": "PERSONAL",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20261005-exp-cash-police-2252",
    "date": "2026-10-05T22:52:00.000Z",
    "type": "EXPENSE",
    "category": "Community & Security",
    "amount": 200,
    "walletId": "w-cash",
    "description": "Police support (Miscellaneous Expense)",
    "expenseScope": "BUSINESS",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20261006-inc-telebirr-2156",
    "date": "2026-10-06T21:56:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 770,
    "walletId": "w-telebirr",
    "description": "Daily Sales collection (Telebirr)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20261006-inc-cbe-2156",
    "date": "2026-10-06T21:56:30.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 75,
    "walletId": "w-cbe",
    "description": "Daily Sales collection (CBE)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20261006-exp-telebirr-gg-2158",
    "date": "2026-10-06T21:58:00.000Z",
    "type": "EXPENSE",
    "category": "Food & Refreshments",
    "amount": 250,
    "walletId": "w-telebirr",
    "description": "Gg launch (Food & Refreshments)",
    "expenseScope": "PERSONAL",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20261006-inc-cash-2158",
    "date": "2026-10-06T21:58:30.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 935,
    "walletId": "w-cash",
    "description": "Daily Sales collection (Cash)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20261006-exp-cash-home-2210",
    "date": "2026-10-06T22:10:00.000Z",
    "type": "EXPENSE",
    "category": "Other & Home Expenses",
    "amount": 225,
    "walletId": "w-cash",
    "description": "Home expense (edited)",
    "expenseScope": "PERSONAL",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20261007-inc-telebirr-0027",
    "date": "2026-10-07T00:27:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 320,
    "walletId": "w-telebirr",
    "description": "Daily Sales collection (Telebirr)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20261007-exp-cash-home-0839",
    "date": "2026-10-07T08:39:00.000Z",
    "type": "EXPENSE",
    "category": "Other & Home Expenses",
    "amount": 160,
    "walletId": "w-cash",
    "description": "Home expense",
    "expenseScope": "PERSONAL",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20261007-inc-cash-1821",
    "date": "2026-10-07T18:21:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 995,
    "walletId": "w-cash",
    "description": "Daily Sales collection (Cash)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20261008-inc-cash-0829",
    "date": "2026-10-08T08:29:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 905,
    "walletId": "w-cash",
    "description": "Daily Sales collection (Cash)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20261008-exp-cash-lunch-0839",
    "date": "2026-10-08T08:39:00.000Z",
    "type": "EXPENSE",
    "category": "Food & Refreshments",
    "amount": 850,
    "walletId": "w-cash",
    "description": "Zeru and Hermi lunch and refreshments",
    "expenseScope": "PERSONAL",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20261008-inc-telebirr-2327",
    "date": "2026-10-08T23:27:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 435,
    "walletId": "w-telebirr",
    "description": "Daily Sales collection (Telebirr)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20261008-inc-ebirr-2327",
    "date": "2026-10-08T23:27:30.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 320,
    "walletId": "w-ebirr",
    "description": "Daily Sales collection (eBirr)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20261009-inc-ebirr-0615",
    "date": "2026-10-09T06:15:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 60,
    "walletId": "w-ebirr",
    "description": "Daily Sales collection (eBirr)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20261009-inc-telebirr-0615",
    "date": "2026-10-09T06:15:30.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 380,
    "walletId": "w-telebirr",
    "description": "Daily Sales collection (Telebirr)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20261009-inc-cash-2202",
    "date": "2026-10-09T22:02:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 970,
    "walletId": "w-cash",
    "description": "Daily Sales collection (Cash)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20261009-exp-cash-home-2203",
    "date": "2026-10-09T22:03:00.000Z",
    "type": "EXPENSE",
    "category": "Home Expense",
    "amount": 200,
    "walletId": "w-cash",
    "description": "Owner withdrawal — Home expense",
    "expenseScope": "PERSONAL",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20261009-exp-cash-buna-2204",
    "date": "2026-10-09T22:04:00.000Z",
    "type": "EXPENSE",
    "category": "Food & Refreshments",
    "amount": 400,
    "walletId": "w-cash",
    "description": "Owner withdrawal — Buna yeteterakeme",
    "expenseScope": "PERSONAL",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20261010-inc-telebirr-rcv-1220",
    "date": "2026-10-10T12:20:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 700,
    "walletId": "w-telebirr",
    "description": "Receivable collected (Customer Credit)",
    "refType": "RECEIVABLE",
    "refId": "rcv-20261010-col-700",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20261010-inc-telebirr-1223",
    "date": "2026-10-10T12:23:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 745,
    "walletId": "w-telebirr",
    "description": "Daily Sales collection (Telebirr)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20261010-inc-cash-rcv-1355",
    "date": "2026-10-10T13:55:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 240,
    "walletId": "w-cash",
    "description": "Repayment on receivable (Weframu lij)",
    "refType": "RECEIVABLE",
    "refId": "rcv-20261004-weframu",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20261010-inc-cash-2029",
    "date": "2026-10-10T20:29:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 1975,
    "walletId": "w-cash",
    "description": "Daily Sales collection (Cash)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20261010-exp-cash-home-2108",
    "date": "2026-10-10T21:08:00.000Z",
    "type": "EXPENSE",
    "category": "Home Expense",
    "amount": 180,
    "walletId": "w-cash",
    "description": "Owner withdrawal — Home expense",
    "expenseScope": "PERSONAL",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20261011-inc-cash-rcv-1102",
    "date": "2026-10-11T11:02:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 440,
    "walletId": "w-cash",
    "description": "Repayment on receivable (Customer Credit)",
    "refType": "RECEIVABLE",
    "refId": "rcv-20261009-credit-440",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20261011-inc-cash-2111",
    "date": "2026-10-11T21:11:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 2180,
    "walletId": "w-cash",
    "description": "Daily Sales collection (Cash)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20261011-exp-cash-home-2111",
    "date": "2026-10-11T21:11:30.000Z",
    "type": "EXPENSE",
    "category": "Home Expense",
    "amount": 200,
    "walletId": "w-cash",
    "description": "Owner withdrawal — Home expense",
    "expenseScope": "PERSONAL",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20261011-inc-telebirr-2236",
    "date": "2026-10-11T22:36:00.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 1035,
    "walletId": "w-telebirr",
    "description": "Daily Sales collection (Telebirr)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20261011-inc-cbe-2236",
    "date": "2026-10-11T22:36:30.000Z",
    "type": "INCOME",
    "category": "Daily Income",
    "amount": 190,
    "walletId": "w-cbe",
    "description": "Daily Sales collection (CBE)",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20261011-adj-telebirr-4510",
    "date": "2026-10-11T22:50:00.000Z",
    "type": "EXPENSE",
    "category": "Balance Correction",
    "amount": 4510,
    "walletId": "w-telebirr",
    "description": "Balance correction — Telebirr ledger adjustment to actual 2,910 ETB",
    "expenseScope": "PERSONAL",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20261011-adj-cbe-6650",
    "date": "2026-10-11T22:50:30.000Z",
    "type": "EXPENSE",
    "category": "Balance Correction",
    "amount": 6650,
    "walletId": "w-cbe",
    "description": "Balance correction — CBE bank ledger adjustment to actual 320 ETB",
    "expenseScope": "PERSONAL",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20261011-adj-ebirr-600",
    "date": "2026-10-11T22:51:00.000Z",
    "type": "EXPENSE",
    "category": "Balance Correction",
    "amount": 600,
    "walletId": "w-ebirr",
    "description": "Balance correction — eBirr transfer adjustment to actual 140 ETB",
    "expenseScope": "PERSONAL",
    "creatorName": "Yegeta Huawei"
  },
  {
    "id": "tx-20261011-adj-cash-2530",
    "date": "2026-10-11T22:51:30.000Z",
    "type": "INCOME",
    "category": "Balance Correction",
    "amount": 2530,
    "walletId": "w-cash",
    "description": "Balance correction — Cash vault ledger adjustment to actual 4,850 ETB",
    "creatorName": "Yegeta Huawei"
  }
];

import { Transaction, Transfer, Receivable, Loan, Equb, Asset } from '../types';
import { CANONICAL_PDF_TRANSACTIONS } from './canonicalPdfTransactions';

export interface DatasetResult {
  openingBalances: {
    cash: number;
    telebirr: number;
    cbe: number;
    ebirr: number;
  };
  transactions: Transaction[];
  transfers: Transfer[];
  receivables: Receivable[];
  loans: Loan[];
  equbs: Equb[];
  assets: Asset[];
}

export const INITIAL_DATASET_JULY_AUG: DatasetResult = {
  openingBalances: {
    cash: 0,
    telebirr: 1360,
    cbe: 730,
    ebirr: 200
  },
  equbs: [
    {
      id: 'eq-agerye',
      name: 'Agerye',
      members: [{ id: 'm-1', name: 'Yegeta Huawei', isWinner: true, wonRound: 1 }],
      contributionPerRound: 5000,
      mySlots: 1,
      interval: 'EVERY_10_DAYS',
      currentRound: 21,
      totalRounds: 27,
      startDate: '2026-06-01T00:00:00.000Z',
      computedEndingDate: '2026-10-30T00:00:00.000Z',
      status: 'ACTIVE',
      walletId: 'w-cash',
      payoutsClaimed: 1
    },
    {
      id: 'eq-leli',
      name: 'Leli',
      members: [{ id: 'm-1', name: 'Yegeta Huawei', isWinner: true, wonRound: 1 }],
      contributionPerRound: 3000,
      mySlots: 1,
      interval: 'MONTHLY',
      currentRound: 10,
      totalRounds: 10,
      startDate: '2026-01-01T00:00:00.000Z',
      computedEndingDate: '2026-07-27T00:00:00.000Z',
      status: 'COMPLETED',
      walletId: 'w-cash',
      payoutsClaimed: 1
    }
  ],
  loans: [
    // 4 Active / Outstanding
    {
      id: 'loan-hermi',
      title: 'Hermi',
      counterparty: 'Hermi',
      type: 'FRIEND_FAMILY',
      direction: 'BORROWED',
      initialAmount: 15000,
      outstandingBalance: 15000,
      dueDate: '2026-09-05T00:00:00.000Z',
      walletId: 'w-cash',
      status: 'ACTIVE',
      payments: []
    },
    {
      id: 'loan-zeru-3',
      title: 'Zerubabel 3',
      counterparty: 'Zerubabel',
      type: 'FRIEND_FAMILY',
      direction: 'BORROWED',
      initialAmount: 1500,
      outstandingBalance: 1500,
      dueDate: '2026-08-19T00:00:00.000Z',
      walletId: 'w-telebirr',
      status: 'ACTIVE',
      payments: []
    },
    {
      id: 'loan-zeru-2',
      title: 'Zerubabel 2',
      counterparty: 'Zerubabel',
      type: 'FRIEND_FAMILY',
      direction: 'BORROWED',
      initialAmount: 25500,
      outstandingBalance: 25500,
      dueDate: '2026-08-27T00:00:00.000Z',
      walletId: 'w-cash',
      status: 'ACTIVE',
      payments: []
    },
    {
      id: 'loan-gg',
      title: 'Gg',
      counterparty: 'Gg',
      type: 'FRIEND_FAMILY',
      direction: 'BORROWED',
      initialAmount: 25500,
      outstandingBalance: 25500,
      dueDate: '2026-09-20T00:00:00.000Z',
      walletId: 'w-cash',
      status: 'ACTIVE',
      payments: []
    },
    // 2 Overdue Outstanding
    {
      id: 'loan-zeru-1',
      title: 'Zerubabel',
      counterparty: 'Zerubabel',
      type: 'FRIEND_FAMILY',
      direction: 'BORROWED',
      initialAmount: 27000,
      outstandingBalance: 27000,
      dueDate: '2026-08-14T00:00:00.000Z',
      walletId: 'w-cash',
      status: 'ACTIVE',
      payments: []
    },
    {
      id: 'loan-hermi-father',
      title: 'Hermi father',
      counterparty: 'Hermi father',
      type: 'FRIEND_FAMILY',
      direction: 'BORROWED',
      initialAmount: 50000,
      outstandingBalance: 30000,
      dueDate: '2026-08-06T00:00:00.000Z',
      walletId: 'w-cash',
      status: 'ACTIVE',
      payments: [
        {
          id: 'lp-hf-1',
          loanId: 'loan-hermi-father',
          date: '2026-07-27T12:00:00.000Z',
          amount: 15000,
          principal: 15000,
          interest: 0,
          walletId: 'w-cash'
        },
        {
          id: 'lp-hf-2',
          loanId: 'loan-hermi-father',
          date: '2026-08-10T12:00:00.000Z',
          amount: 5000,
          principal: 5000,
          interest: 0,
          walletId: 'w-cash'
        }
      ]
    },
    // 6 Settled (PAID) Loans
    {
      id: 'loan-zeru-settled-1200',
      title: 'Zerubabel (1,200)',
      counterparty: 'Zerubabel',
      type: 'FRIEND_FAMILY',
      direction: 'BORROWED',
      initialAmount: 1200,
      outstandingBalance: 0,
      dueDate: '2026-07-20T00:00:00.000Z',
      walletId: 'w-cash',
      status: 'PAID',
      payments: [
        {
          id: 'lp-zs-1',
          loanId: 'loan-zeru-settled-1200',
          date: '2026-07-16T12:00:00.000Z',
          amount: 200,
          principal: 200,
          interest: 0,
          walletId: 'w-cash'
        },
        {
          id: 'lp-zs-2',
          loanId: 'loan-zeru-settled-1200',
          date: '2026-07-18T12:00:00.000Z',
          amount: 1000,
          principal: 1000,
          interest: 0,
          walletId: 'w-cash'
        }
      ]
    },
    {
      id: 'loan-hermi-sister',
      title: 'Hermi sister',
      counterparty: 'Hermi sister',
      type: 'FRIEND_FAMILY',
      direction: 'BORROWED',
      initialAmount: 5000,
      outstandingBalance: 0,
      dueDate: '2026-08-05T00:00:00.000Z',
      walletId: 'w-cash',
      status: 'PAID',
      payments: [
        {
          id: 'lp-hs-1',
          loanId: 'loan-hermi-sister',
          date: '2026-08-03T12:00:00.000Z',
          amount: 5000,
          principal: 5000,
          interest: 0,
          walletId: 'w-cash'
        }
      ]
    },
    {
      id: 'loan-gg-sister-20k',
      title: 'Gg sister (20,000)',
      counterparty: 'Gg sister',
      type: 'FRIEND_FAMILY',
      direction: 'BORROWED',
      initialAmount: 20000,
      outstandingBalance: 0,
      dueDate: '2026-07-31T00:00:00.000Z',
      walletId: 'w-cash',
      status: 'PAID',
      payments: [
        {
          id: 'lp-ggs-1',
          loanId: 'loan-gg-sister-20k',
          date: '2026-07-27T12:00:00.000Z',
          amount: 770,
          principal: 770,
          interest: 0,
          walletId: 'w-telebirr'
        },
        {
          id: 'lp-ggs-2',
          loanId: 'loan-gg-sister-20k',
          date: '2026-07-30T12:00:00.000Z',
          amount: 4730,
          principal: 4730,
          interest: 0,
          walletId: 'w-cash'
        },
        {
          id: 'lp-ggs-3',
          loanId: 'loan-gg-sister-20k',
          date: '2026-08-13T12:00:00.000Z',
          amount: 5500,
          principal: 5500,
          interest: 0,
          walletId: 'w-telebirr'
        },
        {
          id: 'lp-ggs-4',
          loanId: 'loan-gg-sister-20k',
          date: '2026-08-13T12:30:00.000Z',
          amount: 1501,
          principal: 1501,
          interest: 0,
          walletId: 'w-telebirr'
        },
        {
          id: 'lp-ggs-5',
          loanId: 'loan-gg-sister-20k',
          date: '2026-08-13T13:00:00.000Z',
          amount: 7499,
          principal: 7499,
          interest: 0,
          walletId: 'w-cash'
        }
      ]
    },
    {
      id: 'loan-leli-settled',
      title: 'Leli (3,000)',
      counterparty: 'Leli',
      type: 'FRIEND_FAMILY',
      direction: 'BORROWED',
      initialAmount: 3000,
      outstandingBalance: 0,
      dueDate: '2026-08-04T00:00:00.000Z',
      walletId: 'w-cash',
      status: 'PAID',
      payments: [
        {
          id: 'lp-leli-1',
          loanId: 'loan-leli-settled',
          date: '2026-08-03T12:00:00.000Z',
          amount: 3000,
          principal: 3000,
          interest: 0,
          walletId: 'w-cash'
        }
      ]
    },
    {
      id: 'loan-zeru-settled-16k',
      title: 'Zerubabel (16,000)',
      counterparty: 'Zerubabel',
      type: 'FRIEND_FAMILY',
      direction: 'BORROWED',
      initialAmount: 16000,
      outstandingBalance: 0,
      dueDate: '2026-07-28T00:00:00.000Z',
      walletId: 'w-cash',
      status: 'PAID',
      payments: [
        {
          id: 'lp-zs16-1',
          loanId: 'loan-zeru-settled-16k',
          date: '2026-07-23T12:00:00.000Z',
          amount: 11000,
          principal: 11000,
          interest: 0,
          walletId: 'w-cash'
        },
        {
          id: 'lp-zs16-2',
          loanId: 'loan-zeru-settled-16k',
          date: '2026-08-07T12:00:00.000Z',
          amount: 11000,
          principal: 11000,
          interest: 0,
          walletId: 'w-cash'
        }
      ]
    },
    {
      id: 'loan-gg-sister-9k',
      title: 'Gg sister 2 (9,000)',
      counterparty: 'Gg sister 2',
      type: 'FRIEND_FAMILY',
      direction: 'BORROWED',
      initialAmount: 9000,
      outstandingBalance: 0,
      dueDate: '2026-08-15T00:00:00.000Z',
      walletId: 'w-cash',
      status: 'PAID',
      payments: [
        {
          id: 'lp-ggs2-1',
          loanId: 'loan-gg-sister-9k',
          date: '2026-08-13T12:30:00.000Z',
          amount: 1501,
          principal: 1501,
          interest: 0,
          walletId: 'w-telebirr'
        },
        {
          id: 'lp-ggs2-2',
          loanId: 'loan-gg-sister-9k',
          date: '2026-08-13T13:00:00.000Z',
          amount: 7499,
          principal: 7499,
          interest: 0,
          walletId: 'w-cash'
        }
      ]
    }
  ],
  assets: [
    {
      id: 'asset-ps4-pro',
      name: 'PS4 Pro Gaming Console',
      category: 'Equipment / Asset',
      purchaseDate: '2026-07-07T00:00:00.000Z',
      purchasePrice: 49500,
      currentValue: 49500,
      salvageValue: 15000,
      usefulLifeYears: 4,
      depreciationMethod: 'STRAIGHT_LINE',
      fundingWalletId: 'w-cash',
      status: 'ACTIVE'
    }
  ],
  receivables: [
    // 12 Settled Previous Receivables
    {
      id: 'rcv-weframu-1',
      customerName: 'Weframu lij',
      description: "Bale'da credit for Weframu lij",
      amountOwed: 580,
      amountCollected: 580,
      createdDate: '2026-07-04T12:00:00.000Z',
      dueDate: '2026-07-07T12:00:00.000Z',
      status: 'COLLECTED',
      walletId: 'w-telebirr'
    },
    {
      id: 'rcv-weframu-2',
      customerName: 'Weframu lij',
      description: "Bale'da credit for Weframu lij",
      amountOwed: 520,
      amountCollected: 520,
      createdDate: '2026-07-07T12:00:00.000Z',
      dueDate: '2026-07-08T12:00:00.000Z',
      status: 'COLLECTED',
      walletId: 'w-telebirr'
    },
    {
      id: 'rcv-weframu-3',
      customerName: 'Weframu lij',
      description: "Bale'da credit for Weframu lij",
      amountOwed: 400,
      amountCollected: 400,
      createdDate: '2026-07-08T12:00:00.000Z',
      dueDate: '2026-07-11T12:00:00.000Z',
      status: 'COLLECTED',
      walletId: 'w-telebirr'
    },
    {
      id: 'rcv-weframu-4',
      customerName: 'Weframu lij',
      description: "Bale'da credit for Weframu lij",
      amountOwed: 615,
      amountCollected: 615,
      createdDate: '2026-07-11T12:00:00.000Z',
      dueDate: '2026-07-14T12:00:00.000Z',
      status: 'COLLECTED',
      walletId: 'w-telebirr'
    },
    {
      id: 'rcv-weframu-5',
      customerName: 'Weframu lij',
      description: "Bale'da credit for Weframu lij",
      amountOwed: 220,
      amountCollected: 220,
      createdDate: '2026-07-14T12:00:00.000Z',
      dueDate: '2026-07-17T12:00:00.000Z',
      status: 'COLLECTED',
      walletId: 'w-telebirr'
    },
    {
      id: 'rcv-solomon-1',
      customerName: 'Solomon',
      description: "Bale'da credit for Solomon",
      amountOwed: 150,
      amountCollected: 150,
      createdDate: '2026-07-14T12:00:00.000Z',
      dueDate: '2026-07-29T12:00:00.000Z',
      status: 'COLLECTED',
      walletId: 'w-cash'
    },
    {
      id: 'rcv-weframu-6',
      customerName: 'Weframu lij',
      description: "Bale'da credit for Weframu lij",
      amountOwed: 740,
      amountCollected: 740,
      createdDate: '2026-07-17T12:00:00.000Z',
      dueDate: '2026-07-20T12:00:00.000Z',
      status: 'COLLECTED',
      walletId: 'w-telebirr'
    },
    {
      id: 'rcv-weframu-7',
      customerName: 'Weframu lij',
      description: "Bale'da credit for Weframu lij",
      amountOwed: 380,
      amountCollected: 380,
      createdDate: '2026-07-29T12:00:00.000Z',
      dueDate: '2026-07-30T12:00:00.000Z',
      status: 'COLLECTED',
      walletId: 'w-telebirr'
    },
    {
      id: 'rcv-weframu-8',
      customerName: 'Weframu lij',
      description: "Bale'da credit for Weframu lij",
      amountOwed: 345,
      amountCollected: 345,
      createdDate: '2026-08-09T12:00:00.000Z',
      dueDate: '2026-08-13T12:00:00.000Z',
      status: 'COLLECTED',
      walletId: 'w-telebirr'
    },
    {
      id: 'rcv-weframu-9',
      customerName: 'Weframu lij',
      description: "Bale'da credit for Weframu lij",
      amountOwed: 160,
      amountCollected: 160,
      createdDate: '2026-08-13T12:00:00.000Z',
      dueDate: '2026-08-15T12:00:00.000Z',
      status: 'COLLECTED',
      walletId: 'w-telebirr'
    },
    {
      id: 'rcv-settled-prev-11',
      customerName: 'Weframu lij',
      description: "Bale'da credit settlement",
      amountOwed: 250,
      amountCollected: 250,
      createdDate: '2026-07-20T12:00:00.000Z',
      dueDate: '2026-07-25T12:00:00.000Z',
      status: 'COLLECTED',
      walletId: 'w-telebirr'
    },
    {
      id: 'rcv-settled-prev-12',
      customerName: 'Customer Credit',
      description: "Bale'da credit settlement",
      amountOwed: 300,
      amountCollected: 300,
      createdDate: '2026-07-25T12:00:00.000Z',
      dueDate: '2026-07-28T12:00:00.000Z',
      status: 'COLLECTED',
      walletId: 'w-cash'
    },

    // 2 Currently Outstanding Receivables (Total 640 ETB)
    {
      id: 'rcv-fikadu-1',
      customerName: 'Fikadu',
      description: "Bale'da credit for Fikadu",
      amountOwed: 220,
      amountCollected: 0,
      createdDate: '2026-08-13T12:00:00.000Z',
      dueDate: '2026-08-13T12:00:00.000Z',
      status: 'LATE',
      walletId: 'w-cash'
    },
    {
      id: 'rcv-weframu-10',
      customerName: 'Weframu lij',
      description: "Bale'da credit for Weframu lij",
      amountOwed: 420,
      amountCollected: 0,
      createdDate: '2026-08-15T12:00:00.000Z',
      dueDate: '2026-08-22T12:00:00.000Z',
      status: 'OUTSTANDING',
      walletId: 'w-telebirr'
    }
  ],
  transfers: [
    {
      id: 'tr-1',
      date: '2026-07-06T12:00:00.000Z',
      fromWalletId: 'w-ebirr',
      toWalletId: 'w-cbe',
      amount: 260,
      reason: 'For tax',
      creatorId: 'u-1',
      creatorName: 'Yegeta Huawei'
    },
    {
      id: 'tr-2',
      date: '2026-07-12T12:00:00.000Z',
      fromWalletId: 'w-cash',
      toWalletId: 'w-telebirr',
      amount: 50,
      reason: 'Habte transfer',
      creatorId: 'u-1',
      creatorName: 'Yegeta Huawei'
    },
    {
      id: 'tr-3',
      date: '2026-07-13T12:00:00.000Z',
      fromWalletId: 'w-telebirr',
      toWalletId: 'w-cash',
      amount: 210,
      reason: 'Solomon transfer',
      creatorId: 'u-1',
      creatorName: 'Yegeta Huawei'
    },
    {
      id: 'tr-4',
      date: '2026-07-14T12:00:00.000Z',
      fromWalletId: 'w-telebirr',
      toWalletId: 'w-cash',
      amount: 100,
      reason: 'Solomon transfer',
      creatorId: 'u-1',
      creatorName: 'Yegeta Huawei'
    },
    {
      id: 'tr-5',
      date: '2026-07-16T12:00:00.000Z',
      fromWalletId: 'w-telebirr',
      toWalletId: 'w-cbe',
      amount: 2200,
      reason: 'Transfer including 9 ETB fee',
      creatorId: 'u-1',
      creatorName: 'Yegeta Huawei'
    },
    {
      id: 'tr-6',
      date: '2026-08-03T12:00:00.000Z',
      fromWalletId: 'w-telebirr',
      toWalletId: 'w-cash',
      amount: 1000,
      reason: 'Moved 1,000 ETB',
      creatorId: 'u-1',
      creatorName: 'Yegeta Huawei'
    },
    {
      id: 'tr-7-ebirr-settle',
      date: '2026-08-14T12:00:00.000Z',
      fromWalletId: 'w-ebirr',
      toWalletId: 'w-cbe',
      amount: 340,
      reason: 'eBirr digital tax settlement transfer to CBE account',
      creatorId: 'u-1',
      creatorName: 'Yegeta Huawei'
    }
  ],
  transactions: CANONICAL_PDF_TRANSACTIONS
};

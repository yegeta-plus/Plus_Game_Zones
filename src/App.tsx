import React, { useState, useEffect } from 'react';
import { PwaInstallBanner } from './components/pwa/PwaInstallBanner';
import { Header } from './components/layout/Header';
import { BottomNav, TabType } from './components/layout/BottomNav';
import { QuickEntryModal } from './components/modals/QuickEntryModal';
import { TransferModal } from './components/modals/TransferModal';
import { DashboardView } from './components/dashboard/DashboardView';
import { TransactionsView } from './components/transactions/TransactionsView';
import { WalletsView } from './components/wallets/WalletsView';
import { EqubView } from './components/equb/EqubView';
import { MoreHubView, SubViewType } from './components/more/MoreHubView';
import { AiAssistantWidget } from './components/ai/AiAssistantWidget';
import { LoginPage } from './components/auth/LoginPage';

import {
  ERPState,
  loadInitialState,
  saveStateToStorage,
  calculateWalletBalance,
  isTransactionEditable,
  formatETB
} from './lib/store';
import { calculateNextEthiopianDueDate } from './lib/ethiopianCalendar';
import { subscribeToFirebaseState, syncStateToFirebase } from './lib/firebase';
import { Transaction, Transfer, Wallet, UserProfile, TransactionType, Equb, NavTab, Receivable, Loan, LoanPayment, AdminApprovalRequest } from './types';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { triggerHaptic } from './lib/haptics';
import { FingerprintModal } from './components/auth/FingerprintModal';
import { sendExternalNotification } from './lib/notifications';

export default function App() {
  const [state, setState] = useState<ERPState>(() => loadInitialState());
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [moreSubView, setMoreSubView] = useState<SubViewType>('HUB');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [isSessionLocked, setIsSessionLocked] = useState<boolean>(false);

  const handleNavigateTab = (tab: TabType, subView?: SubViewType) => {
    setActiveTab(tab);
    if (tab === 'more') {
      setMoreSubView(subView || 'HUB');
    }
  };

  // Modals
  const [showQuickEntry, setShowQuickEntry] = useState(false);
  const [quickEntryWalletId, setQuickEntryWalletId] = useState<string | undefined>(undefined);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAiAssistant, setShowAiAssistant] = useState(false);

  // Auto Refresh State
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  // Specific Confirmation Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Real-time Firebase Firestore Subscription
  useEffect(() => {
    const unsubscribe = subscribeToFirebaseState((remoteState) => {
      if (remoteState && typeof remoteState === 'object') {
        setState(prev => ({
          ...prev,
          ...remoteState,
          currentUser: prev.currentUser
        }));
      }
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Sync state to local storage, Firebase, and document root theme class on change
  useEffect(() => {
    saveStateToStorage(state);
    syncStateToFirebase(state);
    if (state.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Auto Refresh Execution
  const performRefresh = (isManual = false) => {
    setIsRefreshing(true);
    if (isManual) triggerHaptic('light');

    // Auto-check for active recurring templates due today or earlier and auto-process if enabled
    const todayStr = new Date().toISOString().split('T')[0];
    setState(prev => {
      let updatedTransactions = [...prev.transactions];
      let updatedAudit = [...prev.auditLogs];
      let updatedRecurring = [...prev.recurring];
      let processedAny = false;

      updatedRecurring = updatedRecurring.map(rec => {
        if (rec.status === 'ACTIVE' && rec.autoProcess && rec.nextDueDate <= todayStr) {
          processedAny = true;
          const targetWallet = prev.wallets.find(w => w.id === rec.walletId);
          const newTx: Transaction = {
            id: `tx-auto-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            date: todayStr,
            type: rec.type,
            amount: rec.amount,
            walletId: rec.walletId,
            category: rec.category,
            description: `Auto-Processed Recurring: ${rec.title}`,
            creatorId: 'system',
            creatorName: 'Automated System',
            branch: prev.currentUser.branch
          };
          updatedTransactions.unshift(newTx);

          const nextDateObj = calculateNextEthiopianDueDate(rec.nextDueDate || todayStr, rec.frequency);

          return {
            ...rec,
            lastProcessedDate: todayStr,
            nextDueDate: nextDateObj.toISOString().split('T')[0]
          };
        }
        return rec;
      });

      if (processedAny) {
        updatedAudit.unshift({
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorId: 'system',
          actorName: 'Automated Auto-Refresh System',
          action: 'AUTO_PROCESS_RECURRING',
          entity: 'RecurringTemplate',
          entityId: 'recurring-batch',
          diffAfter: { autoProcessedCount: 1 },
          branch: prev.currentUser.branch
        });
      }

      return {
        ...prev,
        transactions: updatedTransactions,
        recurring: updatedRecurring,
        auditLogs: updatedAudit
      };
    });

    setLastRefreshedAt(new Date());

    setTimeout(() => {
      setIsRefreshing(false);
      if (isManual) {
        triggerToast('⚡ App data synchronized & refreshed!');
      }
    }, 450);
  };

  // Background Auto-Refresh Timer (every 15 seconds)
  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const interval = setInterval(() => {
      performRefresh(false);
    }, 15000);

    return () => clearInterval(interval);
  }, [autoRefreshEnabled]);

  // 1. Post Transaction (Supports standard Income/Expense & Sale on Credit / Customer Debt)
  const handlePostTransaction = (data: {
    type: TransactionType;
    amount: number;
    walletId: string;
    category: string;
    description: string;
    date: string;
    isCreditSale?: boolean;
    customerName?: string;
    dueDate?: string;
  }) => {
    const targetWallet = state.wallets.find(w => w.id === data.walletId);

    // If Sale on Credit is toggled, also generate a Receivable entry for tracking
    let newReceivable: Receivable | null = null;
    if (data.isCreditSale && data.customerName) {
      newReceivable = {
        id: `rcv-${Date.now()}`,
        customerName: data.customerName,
        description: data.description || `Credit Sale - ${data.category}`,
        amountOwed: data.amount,
        amountCollected: 0,
        status: 'OUTSTANDING',
        dueDate: data.dueDate || new Date(Date.now() + 86400000 * 14).toISOString(),
        createdDate: data.date || new Date().toISOString()
      };
    }

    const txDescription = data.isCreditSale && data.customerName
      ? `[Sale on Credit - Customer: ${data.customerName}] ${data.description}`
      : data.description;

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      date: data.date,
      type: data.type,
      amount: data.amount,
      walletId: data.walletId,
      category: data.category,
      description: txDescription,
      creatorId: state.currentUser.id,
      creatorName: state.currentUser.name,
      branch: state.currentUser.branch,
      refType: data.isCreditSale ? 'RECEIVABLE' : undefined,
      refId: newReceivable?.id
    };

    const newAuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: state.currentUser.id,
      actorName: state.currentUser.name,
      action: 'POST_TRANSACTION',
      entity: 'Transaction',
      entityId: newTx.id,
      diffAfter: { amount: data.amount, category: data.category, wallet: targetWallet?.name, isCreditSale: data.isCreditSale },
      branch: state.currentUser.branch
    };

    setState(prev => ({
      ...prev,
      transactions: [newTx, ...prev.transactions],
      receivables: newReceivable ? [newReceivable, ...prev.receivables] : prev.receivables,
      auditLogs: [newAuditLog, ...prev.auditLogs]
    }));

    if (data.isCreditSale) {
      triggerToast(`📋 Credit Sale recorded for ${data.customerName}! Saved to Receivables ledger.`);
    } else {
      triggerToast(`${formatETB(data.amount)} ${(data.type || '').toLowerCase()} logged to ${targetWallet?.name || 'wallet'}`);
    }
    performRefresh(true);
  };

  // 1b. Batch Post Multiple Transactions (Daily Income across all wallets)
  const handleBatchPostTransactions = (items: Array<{
    type: TransactionType;
    amount: number;
    walletId: string;
    category: string;
    description: string;
    date: string;
  }>) => {
    const timestamp = Date.now();
    const newTxs: Transaction[] = items.map((item, idx) => ({
      id: `tx-${timestamp}-${idx}`,
      date: item.date,
      type: item.type,
      amount: item.amount,
      walletId: item.walletId,
      category: item.category,
      description: item.description,
      creatorId: state.currentUser.id,
      creatorName: state.currentUser.name,
      branch: state.currentUser.branch
    }));

    const totalAmount = items.reduce((acc, i) => acc + i.amount, 0);

    const newAuditLog = {
      id: `aud-${timestamp}`,
      timestamp: new Date().toISOString(),
      userId: state.currentUser.id,
      userName: state.currentUser.name,
      action: 'POST_BATCH_TRANSACTIONS',
      entity: 'Transaction',
      entityId: `batch-${timestamp}`,
      diffAfter: { count: items.length, totalAmount },
      branch: state.currentUser.branch
    };

    setState(prev => ({
      ...prev,
      transactions: [...newTxs, ...prev.transactions],
      auditLogs: [newAuditLog, ...prev.auditLogs]
    }));

    triggerToast(`✨ Successfully posted ${items.length} daily income entries (${formatETB(totalAmount)}) across wallets!`);
    sendExternalNotification('PlusZone ERP - Financial Update 💸', {
      body: `${items.length} income transactions posted totaling ${formatETB(totalAmount)} by ${state.currentUser.name}.`
    });
    performRefresh(true);
  };

  // 2. Execute Transfer
  const handleExecuteTransfer = (data: {
    fromWalletId: string;
    toWalletId: string;
    amount: number;
    reason: string;
  }) => {
    const fromW = state.wallets.find(w => w.id === data.fromWalletId);
    const toW = state.wallets.find(w => w.id === data.toWalletId);

    const newTransfer: Transfer = {
      id: `tr-${Date.now()}`,
      date: new Date().toISOString(),
      fromWalletId: data.fromWalletId,
      toWalletId: data.toWalletId,
      amount: data.amount,
      reason: data.reason,
      creatorId: state.currentUser.id,
      creatorName: state.currentUser.name
    };

    const newAuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: state.currentUser.id,
      actorName: state.currentUser.name,
      action: 'POST_TRANSFER',
      entity: 'Transfer',
      entityId: newTransfer.id,
      diffAfter: { amount: data.amount, from: fromW?.name, to: toW?.name },
      branch: state.currentUser.branch
    };

    setState(prev => ({
      ...prev,
      transfers: [newTransfer, ...prev.transfers],
      auditLogs: [newAuditLog, ...prev.auditLogs]
    }));

    triggerToast(`${formatETB(data.amount)} transferred from ${fromW?.name} to ${toW?.name}`);
    performRefresh(true);
  };

  // 3. Reverse Transaction
  const handleReverseTransaction = (txId: string) => {
    setState(prev => {
      const updatedTxs = prev.transactions.map(t =>
        t.id === txId ? { ...t, reversed: true, reversedAt: new Date().toISOString() } : t
      );
      const target = prev.transactions.find(t => t.id === txId);

      const newAuditLog = {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorId: prev.currentUser.id,
        actorName: prev.currentUser.name,
        action: 'REVERSE_TRANSACTION',
        entity: 'Transaction',
        entityId: txId,
        diffAfter: { reversed: true, amount: target?.amount },
        branch: prev.currentUser.branch
      };

      return {
        ...prev,
        transactions: updatedTxs,
        auditLogs: [newAuditLog, ...prev.auditLogs]
      };
    });

    triggerToast(`Transaction reversed in ledger.`);
    performRefresh(true);
  };

  // 3.1 Update Transaction (CRUD Edit allowed only within 1 week of date)
  const handleUpdateTransaction = (
    txId: string,
    updatedData: {
      date: string;
      amount: number;
      type: TransactionType;
      category: string;
      description: string;
      walletId: string;
    }
  ) => {
    const existingTx = state.transactions.find(t => t.id === txId);
    if (!existingTx) return;

    if (!isTransactionEditable(existingTx.date) && state.currentUser.role !== 'SuperAdmin') {
      triggerToast(`⚠️ Can't be edited: transaction is older than 1 week!`);
      return;
    }

    setState(prev => {
      const updatedTxs = prev.transactions.map(t =>
        t.id === txId
          ? {
              ...t,
              ...updatedData
            }
          : t
      );

      const targetWallet = prev.wallets.find(w => w.id === updatedData.walletId);
      const newAuditLog = {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorId: prev.currentUser.id,
        actorName: prev.currentUser.name,
        action: 'UPDATE_TRANSACTION',
        entity: 'Transaction',
        entityId: txId,
        diffAfter: {
          amount: updatedData.amount,
          category: updatedData.category,
          date: updatedData.date,
          wallet: targetWallet?.name
        },
        branch: prev.currentUser.branch
      };

      return {
        ...prev,
        transactions: updatedTxs,
        auditLogs: [newAuditLog, ...prev.auditLogs]
      };
    });

    triggerToast(`Transaction successfully updated!`);
    performRefresh(true);
  };

  // 3.2 Delete Transaction (CRUD Delete allowed only within 1 week of date)
  const handleDeleteTransaction = (txId: string) => {
    const existingTx = state.transactions.find(t => t.id === txId);
    if (!existingTx) return;

    if (!isTransactionEditable(existingTx.date) && state.currentUser.role !== 'SuperAdmin') {
      triggerToast(`⚠️ Can't be deleted: transaction is older than 1 week!`);
      return;
    }

    setState(prev => {
      const updatedTxs = prev.transactions.filter(t => t.id !== txId);
      const newAuditLog = {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorId: prev.currentUser.id,
        actorName: prev.currentUser.name,
        action: 'DELETE_TRANSACTION',
        entity: 'Transaction',
        entityId: txId,
        diffAfter: { deleted: true, description: existingTx.description },
        branch: prev.currentUser.branch
      };

      return {
        ...prev,
        transactions: updatedTxs,
        auditLogs: [newAuditLog, ...prev.auditLogs]
      };
    });

    triggerToast(`Transaction deleted from ledger.`);
    performRefresh(true);
  };

  // 4. Pay Equb Round (Supports Single & Split Payments across multiple wallets)
  const handlePayEqubRound = (
    equbId: string,
    splits: Array<{ walletId: string; amount: number }>
  ) => {
    const targetEqub = state.equbs.find(e => e.id === equbId);
    if (!targetEqub || splits.length === 0) return;

    const newTxs: Transaction[] = splits.map((split, idx) => {
      const targetWallet = state.wallets.find(w => w.id === split.walletId);
      return {
        id: `tx-eq-${Date.now()}-${idx}`,
        date: new Date().toISOString(),
        type: 'EXPENSE',
        amount: split.amount,
        walletId: split.walletId,
        category: 'Equb Contribution',
        description: splits.length > 1
          ? `${targetEqub.name} Round #${targetEqub.currentRound} Split (${targetWallet?.name || 'Wallet'})`
          : `${targetEqub.name} Round #${targetEqub.currentRound} payment`,
        creatorId: state.currentUser.id,
        creatorName: state.currentUser.name,
        branch: state.currentUser.branch,
        refType: 'EQUB',
        refId: equbId
      };
    });

    const totalPaid = splits.reduce((sum, s) => sum + s.amount, 0);

    setState(prev => {
      const updatedEqubs = prev.equbs.map(e => {
        if (e.id !== equbId) return e;
        const nextRound = e.currentRound + 1;
        const isFinished = nextRound > e.totalRounds || e.currentRound >= e.totalRounds;
        return {
          ...e,
          currentRound: Math.min(e.totalRounds, nextRound),
          status: isFinished ? 'COMPLETED' : 'ACTIVE'
        };
      });

      return {
        ...prev,
        transactions: [...newTxs, ...prev.transactions],
        equbs: updatedEqubs
      };
    });

    if (splits.length > 1) {
      triggerToast(`Split payment of ${formatETB(totalPaid)} processed across ${splits.length} wallets!`);
    } else {
      const targetW = state.wallets.find(w => w.id === splits[0]?.walletId);
      triggerToast(`${formatETB(totalPaid)} Equb contribution paid via ${targetW?.name || 'wallet'}`);
    }
    performRefresh(true);
  };

  // 5. Claim Equb Payout
  const handleClaimEqubPayout = (equbId: string, walletId: string, netPool: number) => {
    const targetEqub = state.equbs.find(e => e.id === equbId);
    const targetWallet = state.wallets.find(w => w.id === walletId);

    const newTx: Transaction = {
      id: `tx-payout-eq-${Date.now()}`,
      date: new Date().toISOString(),
      type: 'INCOME',
      amount: netPool,
      walletId,
      category: 'Equb Payout',
      description: `Winnings Payout: ${targetEqub?.name}`,
      creatorId: state.currentUser.id,
      creatorName: state.currentUser.name,
      branch: state.currentUser.branch,
      refType: 'EQUB',
      refId: equbId
    };

    setState(prev => ({
      ...prev,
      transactions: [newTx, ...prev.transactions],
      equbs: prev.equbs.map(e => e.id === equbId ? { ...e, payoutsClaimed: (e.payoutsClaimed || 0) + 1 } : e)
    }));

    triggerToast(`🎉 ${formatETB(netPool)} Equb Payout credited to ${targetWallet?.name}!`);
    performRefresh(true);
  };

  // 6. Add, Update & Delete Wallet
  const handleAddWallet = (newW: Omit<Wallet, 'id' | 'totalIn' | 'totalOut'>) => {
    const created: Wallet = {
      ...newW,
      id: `w-${Date.now()}`,
      totalIn: 0,
      totalOut: 0
    };

    setState(prev => ({
      ...prev,
      wallets: [...prev.wallets, created]
    }));

    triggerToast(`Wallet "${created.name}" initialized.`);
    performRefresh(true);
  };

  const handleUpdateWallet = (walletId: string, updates: Partial<Wallet>) => {
    setState(prev => ({
      ...prev,
      wallets: prev.wallets.map(w => w.id === walletId ? { ...w, ...updates } : w)
    }));
    triggerToast(`Wallet settings updated.`);
    performRefresh(true);
  };

  const handleDeleteWallet = (walletId: string) => {
    const targetWallet = state.wallets.find(w => w.id === walletId);
    if (!targetWallet) return;

    setState(prev => ({
      ...prev,
      wallets: prev.wallets.filter(w => w.id !== walletId)
    }));

    triggerToast(`🗑️ Wallet "${targetWallet.name}" removed.`);
    performRefresh(true);
  };

  // 7. Add Equb
  const handleCreateEqub = (eq: Omit<Equb, 'id' | 'currentRound' | 'computedEndingDate' | 'status'> & { computedEndingDate?: string }) => {
    let daysPerRound = 7;
    if (eq.interval === 'EVERY_10_DAYS') daysPerRound = 10;
    else if (eq.interval === 'EVERY_15_DAYS') daysPerRound = 15;
    else if (eq.interval === 'MONTHLY') daysPerRound = 30;

    const start = new Date(eq.startDate || Date.now());
    const endingDate = eq.computedEndingDate || new Date(start.getTime() + 86400000 * daysPerRound * Math.max(0, eq.totalRounds - 1)).toISOString();

    const created: Equb = {
      ...eq,
      id: `eq-${Date.now()}`,
      currentRound: 1,
      mySlots: eq.mySlots || 1,
      payoutsClaimed: 0,
      computedEndingDate: endingDate,
      status: 'ACTIVE'
    };

    setState(prev => ({
      ...prev,
      equbs: [...prev.equbs, created]
    }));

    triggerToast(`Equb circle "${created.name}" launched.`);
    performRefresh(true);
  };

  // 8. Create Loan (Lent or Borrowed)
  const handleCreateLoan = (newLoan: Omit<Loan, 'id' | 'outstandingBalance' | 'status' | 'payments'>) => {
    const created: Loan = {
      ...newLoan,
      id: `ln-${Date.now()}`,
      outstandingBalance: newLoan.initialAmount,
      status: 'ACTIVE',
      payments: []
    };

    const isLent = created.direction === 'LENT';
    const tx: Transaction = {
      id: `tx-ln-${Date.now()}`,
      date: new Date().toISOString(),
      type: isLent ? 'EXPENSE' : 'INCOME',
      amount: created.initialAmount,
      walletId: created.walletId,
      category: isLent ? 'Loan Payment' : 'Sales Revenue',
      description: isLent
        ? `Lent money issued to ${created.counterparty}: ${created.title}`
        : `Loan capital received from ${created.counterparty}: ${created.title}`,
      creatorId: state.currentUser.id,
      creatorName: state.currentUser.name,
      branch: state.currentUser.branch,
      refType: 'LOAN',
      refId: created.id
    };

    setState(prev => ({
      ...prev,
      loans: [created, ...prev.loans],
      transactions: [tx, ...prev.transactions]
    }));

    triggerToast(isLent ? `Lent loan recorded for ${created.counterparty}` : `Borrowed loan "${created.title}" recorded.`);
    performRefresh(true);
  };

  // 9. Repay / Collect Loan
  const handleRepayLoan = (loanId: string, walletId: string, amount: number) => {
    const targetLoan = state.loans.find(l => l.id === loanId);
    if (!targetLoan) return;

    const isLent = targetLoan.direction === 'LENT';
    const newBal = Math.max(0, targetLoan.outstandingBalance - amount);
    const isPaid = newBal <= 0;

    const paymentRecord: LoanPayment = {
      id: `lp-${Date.now()}`,
      loanId,
      date: new Date().toISOString(),
      amount,
      principal: amount,
      interest: 0,
      walletId
    };

    const newTx: Transaction = {
      id: `tx-lp-${Date.now()}`,
      date: new Date().toISOString(),
      type: isLent ? 'INCOME' : 'EXPENSE',
      amount,
      walletId,
      category: 'Loan Payment',
      description: isLent
        ? `Collected loan repayment from ${targetLoan.counterparty}`
        : `Paid loan installment to ${targetLoan.counterparty}`,
      creatorId: state.currentUser.id,
      creatorName: state.currentUser.name,
      branch: state.currentUser.branch,
      refType: 'LOAN',
      refId: loanId
    };

    setState(prev => ({
      ...prev,
      loans: prev.loans.map(l =>
        l.id === loanId
          ? {
              ...l,
              outstandingBalance: newBal,
              status: isPaid ? 'PAID' : 'ACTIVE',
              payments: [paymentRecord, ...l.payments]
            }
          : l
      ),
      transactions: [newTx, ...prev.transactions]
    }));

    triggerToast(
      isLent
        ? `Collected ${formatETB(amount)} loan repayment from ${targetLoan.counterparty}!`
        : `Paid ${formatETB(amount)} installment to ${targetLoan.counterparty}!`
    );
    performRefresh(true);
  };

  // 10. Create Receivable
  const handleCreateReceivable = (newRcv: Omit<Receivable, 'id' | 'amountCollected' | 'status' | 'createdDate'>) => {
    const created: Receivable = {
      ...newRcv,
      id: `rcv-${Date.now()}`,
      amountCollected: 0,
      status: 'OUTSTANDING',
      createdDate: new Date().toISOString()
    };

    setState(prev => ({
      ...prev,
      receivables: [created, ...prev.receivables]
    }));

    triggerToast(`Receivable invoice for ${created.customerName} recorded.`);
    performRefresh(true);
  };

  // 11. Collect Receivable
  const handleCollectReceivable = (receivableId: string, walletId: string, amount: number) => {
    const target = state.receivables.find(r => r.id === receivableId);
    if (!target) return;

    const newCollected = target.amountCollected + amount;
    const isFull = newCollected >= target.amountOwed;

    const newTx: Transaction = {
      id: `tx-rcv-${Date.now()}`,
      date: new Date().toISOString(),
      type: 'INCOME',
      amount,
      walletId,
      category: 'Sales Revenue',
      description: `Collected customer debt: ${target.customerName} (${target.description})`,
      creatorId: state.currentUser.id,
      creatorName: state.currentUser.name,
      branch: state.currentUser.branch,
      refType: 'RECEIVABLE',
      refId: receivableId
    };

    setState(prev => ({
      ...prev,
      receivables: prev.receivables.map(r =>
        r.id === receivableId
          ? {
              ...r,
              amountCollected: newCollected,
              status: isFull ? 'COLLECTED' : 'OUTSTANDING'
            }
          : r
      ),
      transactions: [newTx, ...prev.transactions]
    }));

    triggerToast(`Collected ${formatETB(amount)} from ${target.customerName}!`);
    performRefresh(true);
  };

  // 12. Update & Delete Equb
  const handleUpdateEqub = (equbId: string, updates: Partial<Equb>) => {
    const targetEqub = state.equbs.find(e => e.id === equbId);
    if (!targetEqub) return;

    setState(prev => ({
      ...prev,
      equbs: prev.equbs.map(e => e.id === equbId ? { ...e, ...updates } : e),
      auditLogs: [
        {
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorId: prev.currentUser.id,
          actorName: prev.currentUser.name,
          action: 'UPDATE_EQUB',
          entity: 'Equb',
          entityId: equbId,
          diffAfter: updates,
          branch: prev.currentUser.branch
        },
        ...prev.auditLogs
      ]
    }));

    triggerToast(`Equb circle "${updates.name || targetEqub.name}" updated.`);
    performRefresh(true);
  };

  const handleDeleteEqub = (equbId: string) => {
    const targetEqub = state.equbs.find(e => e.id === equbId);
    if (!targetEqub) return;

    setState(prev => ({
      ...prev,
      equbs: prev.equbs.filter(e => e.id !== equbId),
      auditLogs: [
        {
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorId: prev.currentUser.id,
          actorName: prev.currentUser.name,
          action: 'DELETE_EQUB',
          entity: 'Equb',
          entityId: equbId,
          diffAfter: { deleted: true, name: targetEqub.name },
          branch: prev.currentUser.branch
        },
        ...prev.auditLogs
      ]
    }));

    triggerToast(`🗑️ Equb circle "${targetEqub.name}" deleted.`);
    performRefresh(true);
  };

  // 13. Update & Delete Loan
  const handleUpdateLoan = (loanId: string, updates: Partial<Loan>) => {
    const targetLoan = state.loans.find(l => l.id === loanId);
    if (!targetLoan) return;

    setState(prev => ({
      ...prev,
      loans: prev.loans.map(l => l.id === loanId ? { ...l, ...updates } : l),
      auditLogs: [
        {
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorId: prev.currentUser.id,
          actorName: prev.currentUser.name,
          action: 'UPDATE_LOAN',
          entity: 'Loan',
          entityId: loanId,
          diffAfter: updates,
          branch: prev.currentUser.branch
        },
        ...prev.auditLogs
      ]
    }));

    triggerToast(`Loan contract "${updates.title || targetLoan.title}" updated.`);
    performRefresh(true);
  };

  const handleDeleteLoan = (loanId: string) => {
    const targetLoan = state.loans.find(l => l.id === loanId);
    if (!targetLoan) return;

    setState(prev => ({
      ...prev,
      loans: prev.loans.filter(l => l.id !== loanId),
      auditLogs: [
        {
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorId: prev.currentUser.id,
          actorName: prev.currentUser.name,
          action: 'DELETE_LOAN',
          entity: 'Loan',
          entityId: loanId,
          diffAfter: { deleted: true, title: targetLoan.title },
          branch: prev.currentUser.branch
        },
        ...prev.auditLogs
      ]
    }));

    triggerToast(`🗑️ Loan contract "${targetLoan.title}" deleted.`);
    performRefresh(true);
  };

  // 14. Approval Request Handlers
  const handleCreateApprovalRequest = (reqData: Omit<AdminApprovalRequest, 'id' | 'createdAt' | 'requestedBy' | 'requestedByName' | 'status'>) => {
    const newReq: AdminApprovalRequest = {
      ...reqData,
      id: `req-${Date.now()}`,
      createdAt: new Date().toISOString(),
      requestedBy: state.currentUser.id,
      requestedByName: state.currentUser.name,
      status: 'PENDING'
    };

    setState(prev => ({
      ...prev,
      approvalRequests: [newReq, ...(prev.approvalRequests || [])]
    }));

    triggerToast(`📋 Approval request sent to co-admin.`);
    performRefresh(true);
  };

  const handleApproveRequest = (reqId: string) => {
    const req = (state.approvalRequests || []).find(r => r.id === reqId);
    if (!req) return;

    if (req.actionType === 'EDIT_EQUB' && req.payload) {
      handleUpdateEqub(req.targetId, req.payload);
    } else if (req.actionType === 'DELETE_EQUB') {
      handleDeleteEqub(req.targetId);
    } else if (req.actionType === 'EDIT_LOAN' && req.payload) {
      handleUpdateLoan(req.targetId, req.payload);
    } else if (req.actionType === 'DELETE_LOAN') {
      handleDeleteLoan(req.targetId);
    }

    setState(prev => ({
      ...prev,
      approvalRequests: (prev.approvalRequests || []).map(r => r.id === reqId ? {
        ...r,
        status: 'APPROVED',
        approvedBy: prev.currentUser.id,
        approvedByName: prev.currentUser.name,
        approvedAt: new Date().toISOString()
      } : r)
    }));

    triggerToast(`✅ Co-admin request approved and executed!`);
    performRefresh(true);
  };

  const handleRejectRequest = (reqId: string) => {
    setState(prev => ({
      ...prev,
      approvalRequests: (prev.approvalRequests || []).map(r => r.id === reqId ? {
        ...r,
        status: 'REJECTED',
        approvedBy: prev.currentUser.id,
        approvedByName: prev.currentUser.name,
        approvedAt: new Date().toISOString()
      } : r)
    }));

    triggerToast(`❌ Approval request rejected.`);
    performRefresh(true);
  };

  const headerNotifications = React.useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      message: string;
      type: 'HIGH' | 'MEDIUM' | 'INFO';
      time: string;
      actionTab?: NavTab;
    }> = [];

    // Equb notifications
    state.equbs.filter(e => e.status === 'ACTIVE').forEach(eq => {
      list.push({
        id: `notif-eq-${eq.id}`,
        title: `Equb Round #${eq.currentRound} Due`,
        message: `${eq.name} contribution of ${formatETB(eq.contributionPerRound)} is due.`,
        type: 'MEDIUM',
        time: 'Today',
        actionTab: 'equb'
      });
    });

    // Active Loan Notifications
    state.loans.filter(l => l.status === 'ACTIVE').forEach(l => {
      list.push({
        id: `notif-loan-${l.id}`,
        title: `Loan Repayment Scheduled`,
        message: `${l.lender} payment of ${formatETB(l.monthlyPayment)}. Rem: ${formatETB(l.remainingBalance)}.`,
        type: 'HIGH',
        time: 'Upcoming',
        actionTab: 'more'
      });
    });

    // Wallet low balance warnings
    state.wallets.forEach(w => {
      const bal = calculateWalletBalance(w, state.transactions, state.transfers);
      if (bal < 10000) {
        list.push({
          id: `notif-bal-${w.id}`,
          title: `Low Balance: ${w.name}`,
          message: `Wallet balance is ${formatETB(bal)}. Top-up recommended.`,
          type: 'HIGH',
          time: 'Urgent',
          actionTab: 'wallets'
        });
      }
    });

    // Recent Transaction
    if (state.transactions.length > 0) {
      const latest = state.transactions[0];
      list.push({
        id: `notif-tx-${latest.id}`,
        title: `Recent Ledger Entry`,
        message: `${latest.description} (${latest.type === 'INCOME' ? '+' : '-'}${formatETB(latest.amount)})`,
        type: 'INFO',
        time: 'Recent',
        actionTab: 'transactions'
      });
    }

    return list;
  }, [state.equbs, state.loans, state.wallets, state.transactions, state.transfers]);

  if (!isLoggedIn) {
    return (
      <LoginPage
        allUsers={state.users}
        currentUser={state.currentUser}
        onLogin={(selectedUser: UserProfile) => {
          setState((prev) => ({
            ...prev,
            currentUser: selectedUser,
            users: prev.users.map((u) => (u.id === selectedUser.id ? selectedUser : u))
          }));
          setIsLoggedIn(true);
        }}
        onRegisterUser={(newUser: UserProfile) => {
          setState((prev) => ({
            ...prev,
            users: [...prev.users, newUser],
            auditLogs: [
              {
                id: `aud-${Date.now()}`,
                timestamp: new Date().toISOString(),
                actorId: newUser.id,
                actorName: newUser.name,
                action: 'REQUEST_USER_REGISTRATION',
                entity: 'UserProfile',
                entityId: newUser.id,
                diffAfter: { name: newUser.name, email: newUser.email, isApproved: false },
                branch: newUser.branch
              },
              ...prev.auditLogs
            ]
          }));
        }}
        theme={state.theme}
        onToggleTheme={() =>
          setState((prev) => ({
            ...prev,
            theme: prev.theme === 'dark' ? 'light' : 'dark'
          }))
        }
      />
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 ${state.theme === 'dark' ? 'dark bg-[#0A0E1A] text-[#F0F4FF]' : 'bg-[#F8FAFC] text-slate-900'}`}>
      
      {/* PWA Install Banner & Offline Alert */}
      <PwaInstallBanner />

      {/* Specific Confirmation Toast Alert */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-[#00D4AA] text-[#0A0E1A] font-bold text-xs px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-[#0A0E1A]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <Header
        currentUser={state.currentUser}
        allUsers={state.users}
        onSwitchUser={(user: UserProfile) => setState(prev => ({ ...prev, currentUser: user }))}
        onLogout={() => setIsLoggedIn(false)}
        onLockSession={() => setIsSessionLocked(true)}
        theme={state.theme}
        onToggleTheme={() => setState(prev => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }))}
        hideBalances={state.hideBalances}
        onToggleHideBalances={() => setState(prev => ({ ...prev, hideBalances: !prev.hideBalances }))}
        onNavigateTab={(tab, subView) => handleNavigateTab(tab, subView)}
        notifications={headerNotifications}
        lastRefreshedAt={lastRefreshedAt}
        isRefreshing={isRefreshing}
        autoRefreshEnabled={autoRefreshEnabled}
        onToggleAutoRefresh={() => setAutoRefreshEnabled(prev => !prev)}
        onManualRefresh={() => performRefresh(true)}
      />

      {/* Main Screen Container */}
      <main className="max-w-md md:max-w-3xl lg:max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-28">
        {activeTab === 'dashboard' && (
          <DashboardView
            currentUser={state.currentUser}
            wallets={state.wallets}
            transactions={state.transactions}
            transfers={state.transfers}
            equbs={state.equbs}
            loans={state.loans}
            recurring={state.recurring}
            receivables={state.receivables}
            hideBalances={state.hideBalances}
            onToggleHideBalances={() => setState(prev => ({ ...prev, hideBalances: !prev.hideBalances }))}
            onOpenQuickEntry={() => setShowQuickEntry(true)}
            onOpenTransferModal={() => setShowTransferModal(true)}
            onNavigateTab={(tab, subView) => handleNavigateTab(tab, subView)}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsView
            transactions={state.transactions}
            wallets={state.wallets}
            categories={state.categories}
            currentUser={state.currentUser}
            hideBalances={state.hideBalances}
            onReverseTransaction={handleReverseTransaction}
            onUpdateTransaction={handleUpdateTransaction}
            onDeleteTransaction={handleDeleteTransaction}
          />
        )}

        {activeTab === 'wallets' && (
          <WalletsView
            wallets={state.wallets}
            transactions={state.transactions}
            transfers={state.transfers}
            users={state.users}
            currentUser={state.currentUser}
            hideBalances={state.hideBalances}
            onOpenTransferModal={() => setShowTransferModal(true)}
            onOpenQuickEntry={(wId) => {
              setQuickEntryWalletId(wId);
              setShowQuickEntry(true);
            }}
            onAddWallet={handleAddWallet}
            onUpdateWallet={handleUpdateWallet}
            onDeleteWallet={handleDeleteWallet}
            onAddTransaction={handlePostTransaction}
            onBatchPostTransactions={handleBatchPostTransactions}
          />
        )}

        {activeTab === 'equb' && (
          <EqubView
            equbs={state.equbs}
            loans={state.loans}
            receivables={state.receivables}
            wallets={state.wallets}
            currentUser={state.currentUser}
            users={state.users}
            approvalRequests={state.approvalRequests}
            hideBalances={state.hideBalances}
            onPayRound={handlePayEqubRound}
            onClaimPayout={handleClaimEqubPayout}
            onCreateEqub={handleCreateEqub}
            onUpdateEqub={handleUpdateEqub}
            onDeleteEqub={handleDeleteEqub}
            onCreateLoan={handleCreateLoan}
            onUpdateLoan={handleUpdateLoan}
            onDeleteLoan={handleDeleteLoan}
            onRepayLoan={handleRepayLoan}
            onCreateReceivable={handleCreateReceivable}
            onCollectReceivable={handleCollectReceivable}
            onRequestApproval={handleCreateApprovalRequest}
            onApproveRequest={handleApproveRequest}
            onRejectRequest={handleRejectRequest}
          />
        )}

        {activeTab === 'more' && (
          <MoreHubView
            state={state}
            onUpdateState={setState}
            onOpenAiAssistant={() => setShowAiAssistant(true)}
            onLogout={() => setIsLoggedIn(false)}
            initialSubView={moreSubView}
          />
        )}
      </main>

      {/* Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => handleNavigateTab(tab)}
        onOpenQuickEntry={() => {
          setQuickEntryWalletId(undefined);
          setShowQuickEntry(true);
        }}
      />

      {/* Quick Entry Sheet Modal */}
      <QuickEntryModal
        isOpen={showQuickEntry}
        onClose={() => setShowQuickEntry(false)}
        wallets={state.wallets}
        categories={state.categories}
        currentUser={state.currentUser}
        defaultWalletId={quickEntryWalletId}
        onSubmitTransaction={handlePostTransaction}
        onBatchSubmitTransactions={handleBatchPostTransactions}
      />

      {/* Inter-Wallet Transfer Modal */}
      <TransferModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        wallets={state.wallets}
        transactions={state.transactions}
        transfers={state.transfers}
        onExecuteTransfer={handleExecuteTransfer}
      />

      {/* Persistent Floating AI Assistant Bubble (Present on Every Page) */}
      <button
        onClick={() => {
          triggerHaptic('medium');
          setShowAiAssistant(prev => !prev);
        }}
        aria-label="Open AI Assistant"
        className="fixed bottom-20 right-4 z-40 w-13 h-13 rounded-full bg-gradient-to-tr from-[#00D4AA] via-[#3B82F6] to-[#A78BFA] p-0.5 shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer group flex items-center justify-center"
      >
        <div className="w-full h-full rounded-full bg-[#0A0E1A] flex items-center justify-center text-[#00D4AA] group-hover:bg-transparent group-hover:text-[#0A0E1A] transition-colors relative">
          <Sparkles className="w-5 h-5 animate-pulse text-[#00D4AA] group-hover:text-[#0A0E1A]" />
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-[#00D4AA] rounded-full border-2 border-[#0A0E1A] animate-ping" />
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-[#00D4AA] rounded-full border-2 border-[#0A0E1A]" />
        </div>
      </button>

      {/* AI Assistant Floating Chat Widget */}
      <AiAssistantWidget
        isOpen={showAiAssistant}
        onClose={() => setShowAiAssistant(false)}
        state={state}
      />

      {/* Session Lock Screen Biometric Fingerprint Modal */}
      <FingerprintModal
        isOpen={isSessionLocked}
        onClose={() => setIsSessionLocked(false)}
        userEmail={state.currentUser.email}
        userName={state.currentUser.name}
        onSuccess={() => setIsSessionLocked(false)}
        mode="SESSION_UNLOCK"
      />

    </div>
  );
}

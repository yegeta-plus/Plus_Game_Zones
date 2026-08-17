import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { ChatView } from './components/chat/ChatView';
import { AiAssistantWidget } from './components/ai/AiAssistantWidget';
import { LoginPage } from './components/auth/LoginPage';

import {
  ERPState,
  loadInitialState,
  saveStateToStorage,
  calculateWalletBalance,
  isTransactionEditable,
  formatETB,
  mergeListById,
  syncReceivablesLateStatus
} from './lib/store';
import { calculateNextEthiopianDueDate } from './lib/ethiopianCalendar';
import {
  subscribeToFirebaseState,
  syncStateToFirebase,
  syncStateToFirebaseNow,
  fetchLatestFirebaseState
} from './lib/firebase';
import { Transaction, Transfer, Wallet, UserProfile, TransactionType, Equb, NavTab, Receivable, Loan, LoanPayment, AdminApprovalRequest, ChatMessage, ChatChannel, AuditLogEntry } from './types';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { triggerHaptic } from './lib/haptics';
import { FingerprintModal } from './components/auth/FingerprintModal';
import { sendExternalNotification, formatRelativeNotifTime } from './lib/notifications';

export default function App() {
  const [state, setState] = useState<ERPState>(() => loadInitialState());
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [moreSubView, setMoreSubView] = useState<SubViewType>('HUB');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isSessionLocked, setIsSessionLocked] = useState<boolean>(false);
  const [lastSeenChatTime, setLastSeenChatTime] = useState<number>(() => {
    const saved = localStorage.getItem('pgz_last_read_chat_time');
    return saved ? parseInt(saved, 10) : Date.now();
  });

  const markChatAsRead = useCallback(() => {
    const now = Date.now();
    setLastSeenChatTime(now);
    try {
      localStorage.setItem('pgz_last_read_chat_time', now.toString());
    } catch (e) {}
  }, []);

  const handleNavigateTab = (tab: TabType, subView?: SubViewType | string) => {
    setActiveTab(tab);
    if (tab === 'chat') {
      markChatAsRead();
    }
    if (tab === 'more') {
      const raw = subView || 'HUB';
      const upper = raw.toUpperCase() as SubViewType;
      setMoreSubView(upper);
    }
  };

  useEffect(() => {
    if (activeTab === 'chat') {
      markChatAsRead();
    }
  }, [activeTab, state.chatMessages?.length, markChatAsRead]);

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

  // Dismissed Notifications Tracking (Persisted in localStorage so seen notifications stay removed)
  const [dismissedNotifIds, setDismissedNotifIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pluszone_dismissed_notif_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Banking Inactivity Auto-Lock Timeout logic
  const [sessionTimeoutMins, setSessionTimeoutMins] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pluszone_session_timeout_mins');
      return saved ? parseInt(saved, 10) : 5;
    } catch {
      return 5;
    }
  });

  const lastActivityRef = React.useRef<number>(Date.now());

  // Listen for session timeout settings changes
  useEffect(() => {
    const handleTimeoutChange = () => {
      try {
        const saved = localStorage.getItem('pluszone_session_timeout_mins');
        if (saved !== null) setSessionTimeoutMins(parseInt(saved, 10));
      } catch (err) {
        console.warn('Error reading session timeout config', err);
      }
    };
    window.addEventListener('sessionTimeoutChanged', handleTimeoutChange);
    return () => window.removeEventListener('sessionTimeoutChanged', handleTimeoutChange);
  }, []);

  // Monitor user activity and auto-lock after timeout
  useEffect(() => {
    if (!isLoggedIn || isSessionLocked || sessionTimeoutMins <= 0) return;

    const resetActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach(evt => window.addEventListener(evt, resetActivity, { passive: true }));

    const checkInterval = setInterval(() => {
      const elapsedMins = (Date.now() - lastActivityRef.current) / 60000;
      if (elapsedMins >= sessionTimeoutMins) {
        setIsSessionLocked(true);
        triggerHaptic('warning');
        setToastMessage(`Banking Session Locked: ${sessionTimeoutMins} min inactivity timeout.`);
        setTimeout(() => setToastMessage(null), 5000);
      }
    }, 5000);

    return () => {
      events.forEach(evt => window.removeEventListener(evt, resetActivity));
      clearInterval(checkInterval);
    };
  }, [isLoggedIn, isSessionLocked, sessionTimeoutMins]);

  useEffect(() => {
    try {
      localStorage.setItem('pluszone_dismissed_notif_ids', JSON.stringify(dismissedNotifIds));
    } catch (err) {
      console.warn('Failed to save dismissed notifications to storage', err);
    }
  }, [dismissedNotifIds]);

  const handleDismissNotification = React.useCallback((id: string) => {
    setDismissedNotifIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  // Real-time Firebase Firestore Subscription
  useEffect(() => {
    const unsubscribe = subscribeToFirebaseState((remoteState) => {
      if (remoteState && typeof remoteState === 'object') {
        setState(prev => {
          const mergedUsers = mergeListById(prev.users, remoteState.users);

          const activeUser = (prev.currentUser?.email
            ? mergedUsers.find(u => u.email.toLowerCase() === prev.currentUser.email.toLowerCase())
            : null) || (prev.currentUser?.id
            ? mergedUsers.find(u => u.id === prev.currentUser.id)
            : null) || prev.currentUser;

          const calType = prev.calendarType || remoteState.calendarType || 'ETHIOPIAN';

          return {
            ...prev,
            ...remoteState,
            calendarType: calType,
            users: mergedUsers,
            currentUser: activeUser
          };
        });
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
  const performRefresh = async (isManual = false) => {
    setIsRefreshing(true);
    if (isManual) triggerHaptic('light');

    // 1. Fetch latest remote state directly from Firebase Firestore on manual refresh
    const remoteState = await fetchLatestFirebaseState();
    if (remoteState && typeof remoteState === 'object') {
      setState(prev => {
        const mergedUsers = mergeListById(prev.users, remoteState.users);
        const mergedWallets = mergeListById(prev.wallets, remoteState.wallets);
        const mergedTransactions = mergeListById(prev.transactions, remoteState.transactions);
        const mergedTransfers = mergeListById(prev.transfers, remoteState.transfers);
        const mergedEqubs = mergeListById(prev.equbs, remoteState.equbs);
        const mergedLoans = mergeListById(prev.loans, remoteState.loans);
        const mergedAssets = mergeListById(prev.assets, remoteState.assets);
        const mergedGoals = mergeListById(prev.goals, remoteState.goals);
        const mergedRecurring = mergeListById(prev.recurring, remoteState.recurring);
        const mergedReceivables = syncReceivablesLateStatus(mergeListById(prev.receivables, remoteState.receivables));
        const mergedCategories = mergeListById(prev.categories, remoteState.categories);
        const mergedAuditLogs = mergeListById(prev.auditLogs, remoteState.auditLogs);
        const mergedPending = mergeListById(prev.pendingReviewTransactions, remoteState.pendingReviewTransactions);

        const activeUser = (prev.currentUser?.email
          ? mergedUsers.find(u => u.email.toLowerCase() === prev.currentUser.email.toLowerCase())
          : null) || (prev.currentUser?.id
          ? mergedUsers.find(u => u.id === prev.currentUser.id)
          : null) || prev.currentUser;
        const calType = prev.calendarType || remoteState.calendarType || 'ETHIOPIAN';

        const updated = {
          ...prev,
          ...remoteState,
          users: mergedUsers,
          wallets: mergedWallets,
          transactions: mergedTransactions,
          transfers: mergedTransfers,
          equbs: mergedEqubs,
          loans: mergedLoans,
          assets: mergedAssets,
          goals: mergedGoals,
          recurring: mergedRecurring,
          receivables: mergedReceivables,
          categories: mergedCategories,
          auditLogs: mergedAuditLogs,
          pendingReviewTransactions: mergedPending,
          calendarType: calType,
          currentUser: activeUser
        };
        saveStateToStorage(updated);
        return updated;
      });
    }

    // 2. Auto-check for active recurring templates due today or earlier and auto-process if enabled
    const todayStr = new Date().toISOString().split('T')[0];
    setState(prev => {
      let updatedTransactions = [...prev.transactions];
      let updatedAudit = [...prev.auditLogs];
      let updatedRecurring = [...prev.recurring];
      let processedAny = false;

      updatedRecurring = updatedRecurring.map(rec => {
        if (rec.status === 'ACTIVE' && rec.autoProcess && rec.nextDueDate <= todayStr) {
          processedAny = true;
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
          actorId: prev.currentUser.id,
          actorName: prev.currentUser.name,
          action: 'PROCESS_RECURRING',
          entity: 'RecurringTemplate',
          entityId: 'auto',
          diffAfter: { processedAt: todayStr },
          branch: prev.currentUser.branch
        });

        const updated = {
          ...prev,
          transactions: updatedTransactions,
          recurring: updatedRecurring,
          auditLogs: updatedAudit
        };
        saveStateToStorage(updated);
        syncStateToFirebaseNow(updated);
        return updated;
      }
      return prev;
    });

    setLastRefreshedAt(new Date());
    setIsRefreshing(false);
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

    // If Sale on Credit is toggled, only record the Receivable debt entry without posting uncollected money to the wallet ledger
    if (data.isCreditSale && data.customerName) {
      const newReceivable: Receivable = {
        id: `rcv-${Date.now()}`,
        customerName: data.customerName,
        description: data.description || `Credit Sale - ${data.category}`,
        amountOwed: data.amount,
        amountCollected: 0,
        status: 'OUTSTANDING',
        dueDate: data.dueDate || new Date(Date.now() + 86400000 * 14).toISOString(),
        createdDate: data.date || new Date().toISOString(),
        walletId: data.walletId
      };

      const newAuditLog = {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorId: state.currentUser.id,
        actorName: state.currentUser.name,
        action: 'CREATE_RECEIVABLE',
        entity: 'Receivable',
        entityId: newReceivable.id,
        diffAfter: {
          customerName: data.customerName,
          amountOwed: data.amount,
          category: data.category,
          dueDate: newReceivable.dueDate,
          isCreditSale: true,
          walletId: data.walletId,
          walletName: targetWallet?.name
        },
        branch: state.currentUser.branch
      };

      setState(prev => ({
        ...prev,
        receivables: [newReceivable, ...prev.receivables],
        auditLogs: [newAuditLog, ...prev.auditLogs]
      }));

      triggerToast(`📋 Credit Sale recorded for ${data.customerName}! Saved to Receivables ledger (Wallet balance unchanged until collected).`);
      sendExternalNotification('PlusZone ERP - Credit Sale 📋', {
        body: `Credit Sale of ${formatETB(data.amount)} recorded for customer ${data.customerName}. Money will enter wallet when collected.`
      });
      performRefresh(true);
      return;
    }

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      date: data.date,
      type: data.type,
      amount: data.amount,
      walletId: data.walletId,
      category: data.category,
      description: data.description,
      creatorId: state.currentUser.id,
      creatorName: state.currentUser.name,
      branch: state.currentUser.branch
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
      auditLogs: [newAuditLog, ...prev.auditLogs]
    }));

    triggerToast(`${formatETB(data.amount)} ${(data.type || '').toLowerCase()} logged to ${targetWallet?.name || 'wallet'}`);
    sendExternalNotification(`PlusZone ERP - ${data.type === 'INCOME' ? 'Income' : 'Expense'} Logged 💰`, {
      body: `${formatETB(data.amount)} ${data.type.toLowerCase()} logged to ${targetWallet?.name || 'wallet'} (${data.category}).`
    });
    performRefresh(true);
  };

  const handleAddGamingIncome = (amount: number, category: string, description: string) => {
    const mainWallet = state.wallets[0] || { id: 'w1', name: 'Main Cash Drawer' };
    const newTx: Transaction = {
      id: `tx-game-${Date.now()}`,
      type: 'INCOME',
      category: category || 'Gaming & Entertainment',
      amount,
      date: new Date().toISOString(),
      walletId: mainWallet.id,
      description,
      creatorId: state.currentUser.id,
      creatorName: state.currentUser.name,
      branch: state.currentUser.branch
    };
    setState(prev => ({
      ...prev,
      transactions: [newTx, ...prev.transactions]
    }));
    triggerToast(`🎮 ${formatETB(amount)} PS5 Gaming revenue logged to ${mainWallet.name}!`);
    sendExternalNotification('PlusZone ERP - Gaming Revenue 🎮', {
      body: `PS5 Revenue ${formatETB(amount)} logged (${category}) to ${mainWallet.name}.`
    });
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
    sendExternalNotification('PlusZone ERP - Wallet Transfer 🔄', {
      body: `Transferred ${formatETB(data.amount)} from ${fromW?.name || 'Wallet'} to ${toW?.name || 'Wallet'} (${data.reason}).`
    });
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

  // 3.3 Clear All Transactions
  const handleClearAllTransactions = () => {
    setState(prev => {
      const newAuditLog = {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorId: prev.currentUser.id,
        actorName: prev.currentUser.name,
        action: 'CLEAR_ALL_TRANSACTIONS',
        entity: 'Transaction',
        entityId: 'all',
        diffAfter: { clearedCount: prev.transactions.length },
        branch: prev.currentUser.branch
      };
      return {
        ...prev,
        transactions: [],
        auditLogs: [newAuditLog, ...prev.auditLogs]
      };
    });
    triggerToast(`🗑️ All transactions cleared! You can now add entries manually.`);
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
        refId: equbId,
        splits: splits.length > 1 ? splits : undefined
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
    sendExternalNotification('PlusZone ERP - Equb Contribution 🤝', {
      body: `Paid ${formatETB(totalPaid)} Equb round contribution for ${targetEqub.name}.`
    });
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
    sendExternalNotification('PlusZone ERP - Equb Payout Claimed 🎉', {
      body: `${formatETB(netPool)} Equb payout claimed & credited to ${targetWallet?.name || 'wallet'}!`
    });
    performRefresh(true);
  };

  // 6. Add, Update & Delete Wallet
  const handleAddWallet = (newW: Omit<Wallet, 'id' | 'totalIn' | 'totalOut'>) => {
    const created: Wallet = {
      ...newW,
      id: `w-${Date.now()}`,
      openingBalance: Number(newW.openingBalance) || 0,
      totalIn: 0,
      totalOut: 0
    };

    const newAuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: state.currentUser.id,
      actorName: state.currentUser.name,
      action: 'CREATE_WALLET',
      entity: 'Wallet',
      entityId: created.id,
      diffAfter: { name: created.name, type: created.type, openingBalance: created.openingBalance },
      branch: state.currentUser.branch
    };

    setState(prev => {
      const updated = {
        ...prev,
        wallets: [...prev.wallets, created],
        auditLogs: [newAuditLog, ...(prev.auditLogs || [])]
      };
      saveStateToStorage(updated);
      syncStateToFirebaseNow(updated);
      return updated;
    });

    triggerToast(`✓ Wallet "${created.name}" initialized.`);
    performRefresh(true);
  };

  const handleUpdateWallet = (walletId: string, updates: Partial<Wallet>) => {
    const target = state.wallets.find(w => w.id === walletId);
    const newAuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: state.currentUser.id,
      actorName: state.currentUser.name,
      action: 'UPDATE_WALLET',
      entity: 'Wallet',
      entityId: walletId,
      diffBefore: target,
      diffAfter: { ...target, ...updates },
      branch: state.currentUser.branch
    };

    setState(prev => {
      const updated = {
        ...prev,
        wallets: prev.wallets.map(w => w.id === walletId ? { ...w, ...updates } : w),
        auditLogs: [newAuditLog, ...(prev.auditLogs || [])]
      };
      saveStateToStorage(updated);
      syncStateToFirebaseNow(updated);
      return updated;
    });
    triggerToast(`Wallet "${updates.name || target?.name || 'settings'}" updated.`);
    performRefresh(true);
  };

  const handleDeleteWallet = (walletId: string) => {
    const targetWallet = state.wallets.find(w => w.id === walletId);
    if (!targetWallet) return;

    const newAuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: state.currentUser.id,
      actorName: state.currentUser.name,
      action: 'DELETE_WALLET',
      entity: 'Wallet',
      entityId: walletId,
      diffAfter: { deleted: true, name: targetWallet.name },
      branch: state.currentUser.branch
    };

    setState(prev => {
      const updated = {
        ...prev,
        wallets: prev.wallets.filter(w => w.id !== walletId),
        auditLogs: [newAuditLog, ...(prev.auditLogs || [])]
      };
      saveStateToStorage(updated);
      syncStateToFirebaseNow(updated);
      return updated;
    });

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
    sendExternalNotification('PlusZone ERP - Loan Activity 🏦', {
      body: `${isLent ? 'Lent' : 'Borrowed'} loan of ${formatETB(created.initialAmount)} recorded (${created.counterparty}).`
    });
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
    sendExternalNotification('PlusZone ERP - Loan Payment 💳', {
      body: isLent
        ? `Collected ${formatETB(amount)} loan repayment from ${targetLoan.counterparty}.`
        : `Paid ${formatETB(amount)} loan installment to ${targetLoan.counterparty}.`
    });
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

    // Resolve target wallet with safe fallback
    const targetWallet = state.wallets.find(w => w.id === walletId) || state.wallets.find(w => w.isDefault) || state.wallets[0];
    const resolvedWalletId = targetWallet?.id || walletId || 'w-cash';
    const walletName = targetWallet?.name || 'Wallet';

    const newCollected = (target.amountCollected || 0) + amount;
    const isFull = newCollected >= target.amountOwed;

    const newTx: Transaction = {
      id: `tx-rcv-${Date.now()}`,
      date: new Date().toISOString(),
      type: 'INCOME',
      amount,
      walletId: resolvedWalletId,
      category: 'Sales Revenue',
      description: `Collected customer debt: ${target.customerName}${target.description ? ` (${target.description})` : ''}`,
      creatorId: state.currentUser.id,
      creatorName: state.currentUser.name,
      branch: state.currentUser.branch,
      refType: 'RECEIVABLE',
      refId: receivableId
    };

    const newAuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: state.currentUser.id,
      actorName: state.currentUser.name,
      action: 'COLLECT_RECEIVABLE',
      entity: 'Receivable',
      entityId: receivableId,
      diffAfter: {
        amountCollected: amount,
        totalCollected: newCollected,
        walletId: resolvedWalletId,
        walletName,
        customerName: target.customerName,
        isFullyPaid: isFull
      },
      branch: state.currentUser.branch
    };

    setState(prev => {
      const updatedReceivables = syncReceivablesLateStatus(prev.receivables.map(r =>
        r.id === receivableId
          ? {
              ...r,
              amountCollected: newCollected,
              status: isFull ? ('COLLECTED' as const) : ('OUTSTANDING' as const),
              lastPaymentDate: new Date().toISOString()
            }
          : r
      ));

      const updatedState = {
        ...prev,
        receivables: updatedReceivables,
        transactions: [newTx, ...prev.transactions],
        auditLogs: [newAuditLog, ...(prev.auditLogs || [])]
      };

      saveStateToStorage(updatedState);
      syncStateToFirebaseNow(updatedState);
      return updatedState;
    });

    triggerToast(`✓ Collected ${formatETB(amount)} from ${target.customerName} → Deposited into ${walletName}!`);
    sendExternalNotification('PlusZone ERP - Receivable Collected 💰', {
      body: `Collected ${formatETB(amount)} from ${target.customerName} into ${walletName}.`
    });
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

  const handleUpdateReceivable = (receivableId: string, updates: Partial<Receivable>) => {
    const targetRcv = (state.receivables || []).find(r => r.id === receivableId);
    if (!targetRcv) return;

    setState(prev => {
      const updatedReceivables = syncReceivablesLateStatus((prev.receivables || []).map(r =>
        r.id === receivableId ? { ...r, ...updates } : r
      ));
      const updatedState = {
        ...prev,
        receivables: updatedReceivables,
        auditLogs: [
          {
            id: `aud-${Date.now()}`,
            timestamp: new Date().toISOString(),
            actorId: prev.currentUser.id,
            actorName: prev.currentUser.name,
            action: 'UPDATE_RECEIVABLE',
            entity: 'Receivable',
            entityId: receivableId,
            diffBefore: targetRcv,
            diffAfter: { ...targetRcv, ...updates },
            branch: prev.currentUser.branch
          },
          ...(prev.auditLogs || [])
        ]
      };
      saveStateToStorage(updatedState);
      syncStateToFirebaseNow(updatedState);
      return updatedState;
    });

    triggerToast(`Customer receivable for "${updates.customerName || targetRcv.customerName}" updated.`);
    performRefresh(true);
  };

  const handleDeleteReceivable = (receivableId: string) => {
    const targetRcv = (state.receivables || []).find(r => r.id === receivableId);
    if (!targetRcv) return;

    setState(prev => {
      const updatedState = {
        ...prev,
        receivables: (prev.receivables || []).filter(r => r.id !== receivableId),
        auditLogs: [
          {
            id: `aud-${Date.now()}`,
            timestamp: new Date().toISOString(),
            actorId: prev.currentUser.id,
            actorName: prev.currentUser.name,
            action: 'DELETE_RECEIVABLE',
            entity: 'Receivable',
            entityId: receivableId,
            diffAfter: { deleted: true, customerName: targetRcv.customerName },
            branch: prev.currentUser.branch
          },
          ...(prev.auditLogs || [])
        ]
      };
      saveStateToStorage(updatedState);
      syncStateToFirebaseNow(updatedState);
      return updatedState;
    });

    triggerToast(`🗑️ Customer receivable for "${targetRcv.customerName}" deleted.`);
    performRefresh(true);
  };

  // 14. Approval Request Handlers
  const handleCreateApprovalRequest = (reqData: Omit<AdminApprovalRequest, 'id' | 'createdAt' | 'requestedBy' | 'requestedByName' | 'status'>) => {
    const reasonText = reqData.reason || `Co-admin authorization requested for ${reqData.actionType.replace(/_/g, ' ')}`;
    const newReq: AdminApprovalRequest = {
      ...reqData,
      reason: reasonText,
      id: `req-${Date.now()}`,
      createdAt: new Date().toISOString(),
      requestedBy: state.currentUser.id,
      requestedByName: state.currentUser.name,
      status: 'PENDING'
    };

    const chatMsg: ChatMessage = {
      id: `msg-appr-${Date.now()}`,
      channelId: 'financial-approvals',
      senderId: state.currentUser.id,
      senderName: state.currentUser.name,
      senderRole: state.currentUser.role,
      text: `📋 **New Approval Request Submitted**\n• **Item:** ${newReq.targetTitle}\n• **Action:** ${newReq.actionType.replace(/_/g, ' ')}\n• **Reason:** ${reasonText}\n• **Requested By:** ${newReq.requestedByName}${newReq.targetAdminName ? `\n• **Assigned Co-Admin:** ${newReq.targetAdminName}` : ''}`,
      timestamp: new Date().toISOString(),
      reference: {
        type: 'APPROVAL',
        id: newReq.id,
        title: `Approval Request: ${newReq.targetTitle}`,
        subtitle: `Action: ${newReq.actionType.replace(/_/g, ' ')}`,
        reason: reasonText,
        status: 'PENDING'
      }
    };

    setState(prev => {
      const updatedState = {
        ...prev,
        approvalRequests: [newReq, ...(prev.approvalRequests || [])],
        chatMessages: [...(prev.chatMessages || []), chatMsg]
      };
      saveStateToStorage(updatedState);
      syncStateToFirebaseNow(updatedState);
      return updatedState;
    });

    triggerToast(`📋 Approval request with reason posted to live chat.`);
    performRefresh(true);
  };

  const handleResetAllData = () => {
    localStorage.clear();
    window.location.reload();
  };

  const handleApproveRequest = (reqId: string, approvalNote?: string) => {
    const req = (state.approvalRequests || []).find(r => r.id === reqId);
    if (!req) return;

    const activeOtherUsers = (state.users || []).filter(u => u.id !== state.currentUser.id && u.active !== false);
    if (req.requestedBy === state.currentUser.id && activeOtherUsers.length > 0) {
      triggerToast(`⚠️ 2-User Rule: Requests must be approved by a different admin or user!`);
      return;
    }

    triggerHaptic('success');

    const effectiveReason = approvalNote || req.reason || 'Verified and approved by co-admin';
    const approveMsg: ChatMessage = {
      id: `msg-appr-ok-${Date.now()}`,
      channelId: 'financial-approvals',
      senderId: state.currentUser.id,
      senderName: state.currentUser.name,
      senderRole: state.currentUser.role,
      text: `✅ **Approval Granted & Executed**\n• **Item:** ${req.targetTitle}\n• **Action:** ${req.actionType.replace(/_/g, ' ')}\n• **Reason for Approval:** ${effectiveReason}\n• **Approved By:** ${state.currentUser.name}`,
      timestamp: new Date().toISOString(),
      reference: {
        type: 'APPROVAL',
        id: req.id,
        title: `Approved: ${req.targetTitle}`,
        subtitle: `Action: ${req.actionType.replace(/_/g, ' ')}`,
        reason: effectiveReason,
        status: 'APPROVED'
      }
    };

    let toastText = `✅ Approval granted for "${req.targetTitle}". Change automatically executed!`;

    setState(prev => {
      let updatedTransactions = prev.transactions;
      let updatedEqubs = prev.equbs;
      let updatedLoans = prev.loans;
      let updatedReceivables = prev.receivables || [];
      let updatedWallets = prev.wallets;
      let updatedUsers = prev.users;
      let updatedCategories = prev.categories;
      let updatedAssets = prev.assets || [];
      const newAuditLogs: AuditLogEntry[] = [];

      if (req.actionType === 'DELETE_TRANSACTION') {
        const deletedTx = prev.transactions.find(t => t.id === req.targetId);
        updatedTransactions = prev.transactions.filter(t => t.id !== req.targetId);
        newAuditLogs.push({
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorId: prev.currentUser.id,
          actorName: prev.currentUser.name,
          action: 'DELETE_TRANSACTION',
          entity: 'Transaction',
          entityId: req.targetId,
          diffBefore: deletedTx,
          diffAfter: { deleted: true },
          branch: prev.currentUser.branch
        });
        toastText = `🗑️ Transaction deleted from financial ledger.`;
      } else if (req.actionType === 'EDIT_TRANSACTION' && req.payload) {
        const existingTx = prev.transactions.find(t => t.id === req.targetId);
        updatedTransactions = prev.transactions.map(t =>
          t.id === req.targetId ? { ...t, ...req.payload } : t
        );
        newAuditLogs.push({
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorId: prev.currentUser.id,
          actorName: prev.currentUser.name,
          action: 'UPDATE_TRANSACTION',
          entity: 'Transaction',
          entityId: req.targetId,
          diffBefore: existingTx,
          diffAfter: req.payload,
          branch: prev.currentUser.branch
        });
        toastText = `✏️ Transaction updated in financial ledger.`;
      } else if (req.actionType === 'REVERSE_TRANSACTION') {
        const existingTx = prev.transactions.find(t => t.id === req.targetId);
        updatedTransactions = prev.transactions.map(t =>
          t.id === req.targetId ? { ...t, reversed: true, reversedAt: new Date().toISOString() } : t
        );
        newAuditLogs.push({
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorId: prev.currentUser.id,
          actorName: prev.currentUser.name,
          action: 'REVERSE_TRANSACTION',
          entity: 'Transaction',
          entityId: req.targetId,
          diffBefore: existingTx,
          diffAfter: { reversed: true, reversedAt: new Date().toISOString() },
          branch: prev.currentUser.branch
        });
        toastText = `↩️ Transaction reversed in financial ledger.`;
      } else if (req.actionType === 'DELETE_EQUB') {
        const targetEqub = prev.equbs.find(e => e.id === req.targetId);
        updatedEqubs = prev.equbs.filter(e => e.id !== req.targetId);
        newAuditLogs.push({
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorId: prev.currentUser.id,
          actorName: prev.currentUser.name,
          action: 'DELETE_EQUB',
          entity: 'Equb',
          entityId: req.targetId,
          diffBefore: targetEqub,
          diffAfter: { deleted: true, name: targetEqub?.name },
          branch: prev.currentUser.branch
        });
        toastText = `🗑️ Equb circle "${targetEqub?.name || req.targetTitle}" deleted.`;
      } else if (req.actionType === 'EDIT_EQUB' && req.payload) {
        const targetEqub = prev.equbs.find(e => e.id === req.targetId);
        updatedEqubs = prev.equbs.map(e => e.id === req.targetId ? { ...e, ...req.payload } : e);
        newAuditLogs.push({
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorId: prev.currentUser.id,
          actorName: prev.currentUser.name,
          action: 'UPDATE_EQUB',
          entity: 'Equb',
          entityId: req.targetId,
          diffBefore: targetEqub,
          diffAfter: req.payload,
          branch: prev.currentUser.branch
        });
        toastText = `✏️ Equb circle "${targetEqub?.name || req.targetTitle}" updated.`;
      } else if (req.actionType === 'DELETE_LOAN') {
        const targetLoan = prev.loans.find(l => l.id === req.targetId);
        updatedLoans = prev.loans.filter(l => l.id !== req.targetId);
        newAuditLogs.push({
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorId: prev.currentUser.id,
          actorName: prev.currentUser.name,
          action: 'DELETE_LOAN',
          entity: 'Loan',
          entityId: req.targetId,
          diffBefore: targetLoan,
          diffAfter: { deleted: true, title: targetLoan?.title },
          branch: prev.currentUser.branch
        });
        toastText = `🗑️ Loan contract "${targetLoan?.title || req.targetTitle}" deleted.`;
      } else if (req.actionType === 'EDIT_LOAN' && req.payload) {
        const targetLoan = prev.loans.find(l => l.id === req.targetId);
        updatedLoans = prev.loans.map(l => l.id === req.targetId ? { ...l, ...req.payload } : l);
        newAuditLogs.push({
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorId: prev.currentUser.id,
          actorName: prev.currentUser.name,
          action: 'UPDATE_LOAN',
          entity: 'Loan',
          entityId: req.targetId,
          diffBefore: targetLoan,
          diffAfter: req.payload,
          branch: prev.currentUser.branch
        });
        toastText = `✏️ Loan contract "${targetLoan?.title || req.targetTitle}" updated.`;
      } else if (req.actionType === 'DELETE_RECEIVABLE') {
        const targetRcv = (prev.receivables || []).find(r => r.id === req.targetId);
        updatedReceivables = (prev.receivables || []).filter(r => r.id !== req.targetId);
        newAuditLogs.push({
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorId: prev.currentUser.id,
          actorName: prev.currentUser.name,
          action: 'DELETE_RECEIVABLE',
          entity: 'Receivable',
          entityId: req.targetId,
          diffBefore: targetRcv,
          diffAfter: { deleted: true, customerName: targetRcv?.customerName },
          branch: prev.currentUser.branch
        });
        toastText = `🗑️ Customer receivable for "${targetRcv?.customerName || req.targetTitle}" deleted.`;
      } else if (req.actionType === 'EDIT_RECEIVABLE' && req.payload) {
        const targetRcv = (prev.receivables || []).find(r => r.id === req.targetId);
        updatedReceivables = syncReceivablesLateStatus(
          (prev.receivables || []).map(r => r.id === req.targetId ? { ...r, ...req.payload } : r)
        );
        newAuditLogs.push({
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorId: prev.currentUser.id,
          actorName: prev.currentUser.name,
          action: 'UPDATE_RECEIVABLE',
          entity: 'Receivable',
          entityId: req.targetId,
          diffBefore: targetRcv,
          diffAfter: req.payload,
          branch: prev.currentUser.branch
        });
        toastText = `✏️ Customer receivable for "${targetRcv?.customerName || req.targetTitle}" updated.`;
      } else if (req.actionType === 'DELETE_WALLET') {
        const targetWallet = prev.wallets.find(w => w.id === req.targetId);
        updatedWallets = prev.wallets.filter(w => w.id !== req.targetId);
        newAuditLogs.push({
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorId: prev.currentUser.id,
          actorName: prev.currentUser.name,
          action: 'DELETE_WALLET',
          entity: 'Wallet',
          entityId: req.targetId,
          diffBefore: targetWallet,
          diffAfter: { deleted: true, name: targetWallet?.name },
          branch: prev.currentUser.branch
        });
        toastText = `🗑️ Wallet "${targetWallet?.name || req.targetTitle}" deleted.`;
      } else if (req.actionType === 'EDIT_WALLET' && req.payload) {
        const targetWallet = prev.wallets.find(w => w.id === req.targetId);
        updatedWallets = prev.wallets.map(w => w.id === req.targetId ? { ...w, ...req.payload } : w);
        newAuditLogs.push({
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorId: prev.currentUser.id,
          actorName: prev.currentUser.name,
          action: 'UPDATE_WALLET',
          entity: 'Wallet',
          entityId: req.targetId,
          diffBefore: targetWallet,
          diffAfter: req.payload,
          branch: prev.currentUser.branch
        });
        toastText = `✏️ Wallet "${targetWallet?.name || req.targetTitle}" updated.`;
      } else if (req.actionType === 'DELETE_USER') {
        const targetUser = prev.users.find(u => u.id === req.targetId);
        updatedUsers = prev.users.filter(u => u.id !== req.targetId);
        newAuditLogs.push({
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorId: prev.currentUser.id,
          actorName: prev.currentUser.name,
          action: 'DELETE_USER',
          entity: 'User',
          entityId: req.targetId,
          diffBefore: targetUser,
          diffAfter: { deleted: true, name: targetUser?.name },
          branch: prev.currentUser.branch
        });
        toastText = `🗑️ User profile "${targetUser?.name || req.targetTitle}" deleted.`;
      } else if (req.actionType === 'DELETE_CATEGORY') {
        const targetCat = prev.categories.find(c => c.id === req.targetId);
        updatedCategories = prev.categories.filter(c => c.id !== req.targetId);
        newAuditLogs.push({
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorId: prev.currentUser.id,
          actorName: prev.currentUser.name,
          action: 'DELETE_CATEGORY',
          entity: 'Category',
          entityId: req.targetId,
          diffBefore: targetCat,
          diffAfter: { deleted: true, name: targetCat?.name },
          branch: prev.currentUser.branch
        });
        toastText = `🗑️ Category "${targetCat?.name || req.targetTitle}" deleted.`;
      } else if (req.actionType === 'DELETE_ASSET') {
        const targetAsset = (prev.assets || []).find(a => a.id === req.targetId);
        updatedAssets = (prev.assets || []).filter(a => a.id !== req.targetId);
        newAuditLogs.push({
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorId: prev.currentUser.id,
          actorName: prev.currentUser.name,
          action: 'DELETE_ASSET',
          entity: 'Asset',
          entityId: req.targetId,
          diffBefore: targetAsset,
          diffAfter: { deleted: true, name: targetAsset?.name },
          branch: prev.currentUser.branch
        });
        toastText = `🗑️ Asset "${targetAsset?.name || req.targetTitle}" deleted.`;
      } else if (req.actionType === 'CLEAR_ALL_TRANSACTIONS') {
        updatedTransactions = [];
        newAuditLogs.push({
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorId: prev.currentUser.id,
          actorName: prev.currentUser.name,
          action: 'CLEAR_ALL_TRANSACTIONS',
          entity: 'Transaction',
          entityId: 'all',
          diffAfter: { clearedCount: prev.transactions.length },
          branch: prev.currentUser.branch
        });
        toastText = `🗑️ All transactions cleared from ledger.`;
      } else if (req.actionType === 'RESTORE_BACKUP' && req.payload) {
        const restoredState = req.payload;
        const updatedState = {
          ...prev,
          ...restoredState,
          approvalRequests: (prev.approvalRequests || []).map(r => r.id === reqId ? {
            ...r,
            status: 'APPROVED' as const,
            approvedBy: prev.currentUser.id,
            approvedByName: prev.currentUser.name,
            approvedAt: new Date().toISOString()
          } : r),
          chatMessages: [...(prev.chatMessages || []), approveMsg]
        };
        saveStateToStorage(updatedState);
        syncStateToFirebaseNow(updatedState);
        return updatedState;
      } else if (req.actionType === 'SYSTEM_RESET') {
        localStorage.clear();
        window.location.reload();
        return prev;
      }

      const updatedState = {
        ...prev,
        transactions: updatedTransactions,
        equbs: updatedEqubs,
        loans: updatedLoans,
        receivables: updatedReceivables,
        wallets: updatedWallets,
        users: updatedUsers,
        categories: updatedCategories,
        assets: updatedAssets,
        auditLogs: [...newAuditLogs, ...(prev.auditLogs || [])],
        approvalRequests: (prev.approvalRequests || []).map(r => r.id === reqId ? {
          ...r,
          status: 'APPROVED' as const,
          approvedBy: prev.currentUser.id,
          approvedByName: prev.currentUser.name,
          approvedAt: new Date().toISOString()
        } : r),
        chatMessages: [...(prev.chatMessages || []), approveMsg]
      };

      saveStateToStorage(updatedState);
      syncStateToFirebaseNow(updatedState);
      return updatedState;
    });

    triggerToast(toastText);
    performRefresh(true);
  };

  const handleRejectRequest = (reqId: string, rejectionNote?: string) => {
    const req = (state.approvalRequests || []).find(r => r.id === reqId);
    if (!req) return;

    const effectiveReason = rejectionNote || req.reason || 'Denied by co-admin';
    const rejectMsg: ChatMessage = {
      id: `msg-appr-rej-${Date.now()}`,
      channelId: 'financial-approvals',
      senderId: state.currentUser.id,
      senderName: state.currentUser.name,
      senderRole: state.currentUser.role,
      text: `❌ **Approval Request Rejected**\n• **Item:** ${req.targetTitle}\n• **Action:** ${req.actionType.replace(/_/g, ' ')}\n• **Reason for Rejection:** ${effectiveReason}\n• **Rejected By:** ${state.currentUser.name}`,
      timestamp: new Date().toISOString(),
      reference: {
        type: 'APPROVAL',
        id: req.id,
        title: `Rejected: ${req.targetTitle}`,
        subtitle: `Action: ${req.actionType.replace(/_/g, ' ')}`,
        reason: effectiveReason,
        status: 'REJECTED'
      }
    };

    setState(prev => {
      const updatedState = {
        ...prev,
        approvalRequests: (prev.approvalRequests || []).map(r => r.id === reqId ? {
          ...r,
          status: 'REJECTED' as const,
          approvedBy: prev.currentUser.id,
          approvedByName: prev.currentUser.name,
          approvedAt: new Date().toISOString()
        } : r),
        chatMessages: [...(prev.chatMessages || []), rejectMsg]
      };
      saveStateToStorage(updatedState);
      syncStateToFirebaseNow(updatedState);
      return updatedState;
    });

    triggerToast(`❌ Approval request rejected and status posted to live chat.`);
    performRefresh(true);
  };

  const headerNotifications = React.useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      message: string;
      type: 'HIGH' | 'MEDIUM' | 'INFO';
      time: string;
      timestamp: number;
      actionTab?: NavTab;
    }> = [];

    // Pending Approval Requests for Admins & SuperAdmins
    const pendingReqs = (state.approvalRequests || []).filter(r => r.status === 'PENDING');
    if (pendingReqs.length > 0 && (state.currentUser.role === 'SuperAdmin' || state.currentUser.role === 'Admin')) {
      const latestReq = pendingReqs[0];
      const reqTime = latestReq.createdAt ? new Date(latestReq.createdAt).getTime() : Date.now();
      list.push({
        id: `notif-approval-summary-${latestReq.id}`,
        title: `⚠️ ${pendingReqs.length} Action(s) Pending Admin Approval`,
        message: `Major changes requested by ${latestReq.requestedByName} (${latestReq.actionType.replace(/_/g, ' ')}) need sign-off.`,
        type: 'HIGH',
        time: formatRelativeNotifTime(reqTime),
        timestamp: reqTime,
        actionTab: 'equb'
      });
    }

    // Recent Transactions (include top 5 latest transactions)
    const sortedTxs = [...state.transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (sortedTxs.length > 0) {
      sortedTxs.slice(0, 5).forEach(tx => {
        const txTime = new Date(tx.date).getTime();
        list.push({
          id: `notif-tx-${tx.id}`,
          title: `Ledger Entry: ${tx.category}`,
          message: `${tx.description} (${tx.type === 'INCOME' ? '+' : '-'}${formatETB(tx.amount)}) by ${tx.creatorName}`,
          type: 'INFO',
          time: formatRelativeNotifTime(txTime),
          timestamp: txTime,
          actionTab: 'transactions'
        });
      });
    }

    // Active Equb Round Dues
    state.equbs.filter(e => e.status === 'ACTIVE').forEach(eq => {
      const eqTime = new Date(eq.startDate).getTime() || Date.now();
      list.push({
        id: `notif-eq-${eq.id}-r${eq.currentRound}`,
        title: `Equb Round #${eq.currentRound} Due`,
        message: `${eq.name} contribution of ${formatETB(eq.contributionPerRound)} is due.`,
        type: 'MEDIUM',
        time: 'Today',
        timestamp: eqTime + 100,
        actionTab: 'equb'
      });
    });

    // Active Loan Notifications
    state.loans.filter(l => l.status === 'ACTIVE').forEach(l => {
      const loanTime = new Date(l.dueDate).getTime() || Date.now();
      list.push({
        id: `notif-loan-${l.id}`,
        title: `Loan Repayment Scheduled`,
        message: `${l.counterparty || l.title} payment of ${formatETB(l.monthlyInstallment || l.outstandingBalance)}. Rem: ${formatETB(l.outstandingBalance)}.`,
        type: 'HIGH',
        time: 'Upcoming',
        timestamp: loanTime + 200,
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
          timestamp: Date.now(),
          actionTab: 'wallets'
        });
      }
    });

    // Uncollected Receivables Alert
    const uncollectedReceivablesTotal = (state.receivables || [])
      .filter(r => r.status === 'OUTSTANDING')
      .reduce((sum, r) => sum + (r.amountOwed - r.amountCollected), 0);
    if (uncollectedReceivablesTotal > 0) {
      list.push({
        id: 'notif-rcv-total',
        title: 'Outstanding Debtors & Invoices',
        message: `${formatETB(uncollectedReceivablesTotal)} waiting for customer collection.`,
        type: 'MEDIUM',
        time: 'Pending',
        timestamp: Date.now() - 3600000,
        actionTab: 'more'
      });
    }

    // Filter out dismissed notifications so seen ones stay removed!
    const unreadList = list.filter(n => !dismissedNotifIds.includes(n.id));

    // Sort descending by timestamp (LATEST FIRST)
    return unreadList.sort((a, b) => b.timestamp - a.timestamp);
  }, [state.equbs, state.loans, state.wallets, state.transactions, state.transfers, state.approvalRequests, state.receivables, state.currentUser, dismissedNotifIds]);

  const handleClearAllNotifications = React.useCallback(() => {
    const allIds = headerNotifications.map(n => n.id);
    setDismissedNotifIds(prev => Array.from(new Set([...prev, ...allIds])));
  }, [headerNotifications]);

  // Chat handlers
  const unreadChatCount = activeTab === 'chat'
    ? 0
    : (state.chatMessages || []).filter(
        m => m.senderId !== state.currentUser.id && new Date(m.timestamp).getTime() > lastSeenChatTime
      ).length;

  const handleSendMessage = (msgData: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMsg: ChatMessage = {
      ...msgData,
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString()
    };

    setState(prev => {
      const updatedMsgs = [...(prev.chatMessages || []), newMsg];
      const updatedState = {
        ...prev,
        chatMessages: updatedMsgs
      };
      saveStateToStorage(updatedState);
      syncStateToFirebaseNow(updatedState);
      return updatedState;
    });
  };

  const handleAddChatReaction = (messageId: string, emoji: string) => {
    setState(prev => {
      const updatedMsgs = (prev.chatMessages || []).map(msg => {
        if (msg.id !== messageId) return msg;

        const currentReactions = msg.reactions ? [...msg.reactions] : [];
        const existingIdx = currentReactions.findIndex(r => r.emoji === emoji);

        if (existingIdx >= 0) {
          const react = currentReactions[existingIdx];
          const hasReacted = react.users.includes(prev.currentUser.id);

          if (hasReacted) {
            const newUsers = react.users.filter(u => u !== prev.currentUser.id);
            if (newUsers.length === 0) {
              currentReactions.splice(existingIdx, 1);
            } else {
              currentReactions[existingIdx] = {
                ...react,
                count: newUsers.length,
                users: newUsers
              };
            }
          } else {
            currentReactions[existingIdx] = {
              ...react,
              count: react.count + 1,
              users: [...react.users, prev.currentUser.id]
            };
          }
        } else {
          currentReactions.push({
            emoji,
            count: 1,
            users: [prev.currentUser.id]
          });
        }

        return { ...msg, reactions: currentReactions };
      });

      const updatedState = { ...prev, chatMessages: updatedMsgs };
      saveStateToStorage(updatedState);
      syncStateToFirebaseNow(updatedState);
      return updatedState;
    });
  };

  const handleCreateChatChannel = (channelData: Omit<ChatChannel, 'id' | 'createdDate'>) => {
    const newChan: ChatChannel = {
      ...channelData,
      id: channelData.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      createdDate: new Date().toISOString()
    };

    setState(prev => {
      const existing = (prev.chatChannels || []).find(c => c.id === newChan.id);
      if (existing) return prev;

      const updatedChans = [...(prev.chatChannels || []), newChan];
      const updatedState = { ...prev, chatChannels: updatedChans };
      saveStateToStorage(updatedState);
      syncStateToFirebaseNow(updatedState);
      return updatedState;
    });
  };

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
        onDismissNotification={handleDismissNotification}
        onClearAllNotifications={handleClearAllNotifications}
        lastRefreshedAt={lastRefreshedAt}
        isRefreshing={isRefreshing}
        autoRefreshEnabled={autoRefreshEnabled}
        calendarType={state.calendarType || 'ETHIOPIAN'}
        onToggleCalendarType={(type) => setState(prev => ({ ...prev, calendarType: type }))}
        onToggleAutoRefresh={() => setAutoRefreshEnabled(prev => !prev)}
        onManualRefresh={() => performRefresh(true)}
        unreadChatCount={unreadChatCount}
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
            calendarType={state.calendarType || 'ETHIOPIAN'}
            dismissedNotifIds={dismissedNotifIds}
            onDismissNotification={handleDismissNotification}
            onClearAllNotifications={handleClearAllNotifications}
            onToggleHideBalances={() => setState(prev => ({ ...prev, hideBalances: !prev.hideBalances }))}
            onOpenQuickEntry={() => setShowQuickEntry(true)}
            onOpenTransferModal={() => setShowTransferModal(true)}
            onNavigateTab={(tab, subView) => handleNavigateTab(tab, subView)}
            onAddIncome={handleAddGamingIncome}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsView
            transactions={state.transactions}
            transfers={state.transfers}
            receivables={state.receivables}
            wallets={state.wallets}
            categories={state.categories}
            currentUser={state.currentUser}
            users={state.users}
            hideBalances={state.hideBalances}
            calendarType={state.calendarType || 'ETHIOPIAN'}
            onReverseTransaction={handleReverseTransaction}
            onUpdateTransaction={handleUpdateTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onClearAllTransactions={handleClearAllTransactions}
            onRequestApproval={handleCreateApprovalRequest}
            onNavigateTab={(tab, subView) => handleNavigateTab(tab, subView)}
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
            autoImportSettings={state.autoImportSettings}
            pendingReviewTransactions={state.pendingReviewTransactions}
            onUpdateState={setState}
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
            calendarType={state.calendarType || 'ETHIOPIAN'}
            onToggleCalendarType={(type) => setState(prev => ({ ...prev, calendarType: type }))}
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
            onUpdateReceivable={handleUpdateReceivable}
            onCollectReceivable={handleCollectReceivable}
            onDeleteReceivable={handleDeleteReceivable}
            onRequestApproval={handleCreateApprovalRequest}
            onApproveRequest={handleApproveRequest}
            onRejectRequest={handleRejectRequest}
          />
        )}

        {activeTab === 'chat' && (
          <ChatView
            state={state}
            onSendMessage={handleSendMessage}
            onAddReaction={handleAddChatReaction}
            onNavigateTab={(tab) => handleNavigateTab(tab)}
            onApproveRequest={handleApproveRequest}
            onRejectRequest={handleRejectRequest}
            onMarkRead={markChatAsRead}
          />
        )}

        {activeTab === 'more' && (
          <MoreHubView
            state={state}
            onUpdateState={setState}
            onOpenAiAssistant={() => setShowAiAssistant(true)}
            onLogout={() => setIsLoggedIn(false)}
            initialSubView={moreSubView}
            onNavigateTab={(tab) => handleNavigateTab(tab)}
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
        unreadChatCount={unreadChatCount}
      />

      {/* Quick Entry Sheet Modal */}
      <QuickEntryModal
        isOpen={showQuickEntry}
        onClose={() => setShowQuickEntry(false)}
        wallets={state.wallets}
        categories={state.categories}
        currentUser={state.currentUser}
        defaultWalletId={quickEntryWalletId}
        transactions={state.transactions}
        transfers={state.transfers}
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

      {/* Session Lock Screen Biometric & Password Unlock Modal */}
      <FingerprintModal
        isOpen={isSessionLocked}
        onClose={() => {
          // If closed in locked state without authentication, log out safely
          setIsSessionLocked(false);
          setIsLoggedIn(false);
        }}
        userEmail={state.currentUser.email}
        userName={state.currentUser.name}
        currentUserPassword={state.currentUser.password || 'password123'}
        onSuccess={() => setIsSessionLocked(false)}
        onLogout={() => {
          setIsSessionLocked(false);
          setIsLoggedIn(false);
        }}
        mode="SESSION_UNLOCK"
      />

    </div>
  );
}

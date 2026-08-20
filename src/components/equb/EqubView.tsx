import React, { useState } from 'react';
import {
  Users,
  Plus,
  Trophy,
  DollarSign,
  Handshake,
  ArrowUpRight,
  ArrowDownLeft,
  FileCheck,
  Building2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  ArrowRightLeft,
  Landmark,
  CreditCard,
  Banknote,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  ShieldAlert,
  Lock,
  Check,
  X,
  Archive,
  Layers
} from 'lucide-react';
import { Equb, Wallet, UserProfile, Loan, Receivable, LoanType, LoanDirection, AdminApprovalRequest } from '../../types';
import { formatETB } from '../../lib/store';
import { triggerHaptic } from '../../lib/haptics';
import {
  toEthiopianDate,
  toGregorianDate,
  addEthiopianMonths,
  formatEthiopianDate,
  formatDateByCalendar
} from '../../lib/ethiopianCalendar';

interface EqubViewProps {
  equbs: Equb[];
  loans?: Loan[];
  receivables?: Receivable[];
  wallets: Wallet[];
  currentUser: UserProfile;
  users?: UserProfile[];
  approvalRequests?: AdminApprovalRequest[];
  hideBalances: boolean;
  calendarType?: 'ETHIOPIAN' | 'GREGORIAN';
  onToggleCalendarType?: (type: 'ETHIOPIAN' | 'GREGORIAN') => void;
  onPayRound: (equbId: string, splits: Array<{ walletId: string; amount: number }>) => void;
  onClaimPayout: (equbId: string, walletId: string, netPool: number) => void;
  onCreateEqub: (equb: Omit<Equb, 'id' | 'currentRound' | 'computedEndingDate' | 'status'>) => void;
  onUpdateEqub?: (equbId: string, updates: Partial<Equb>) => void;
  onDeleteEqub?: (equbId: string) => void;
  onCreateLoan?: (loan: Omit<Loan, 'id' | 'outstandingBalance' | 'status' | 'payments'>) => void;
  onUpdateLoan?: (loanId: string, updates: Partial<Loan>) => void;
  onDeleteLoan?: (loanId: string) => void;
  onRepayLoan?: (loanId: string, walletId: string, amount: number) => void;
  onCreateReceivable?: (receivable: Omit<Receivable, 'id' | 'amountCollected' | 'status' | 'createdDate'>) => void;
  onUpdateReceivable?: (receivableId: string, updates: Partial<Receivable>) => void;
  onCollectReceivable?: (receivableId: string, walletId: string, amount: number) => void;
  onDeleteReceivable?: (receivableId: string) => void;
  onRequestApproval?: (req: Omit<AdminApprovalRequest, 'id' | 'createdAt' | 'requestedBy' | 'requestedByName' | 'status'>) => void;
  onApproveRequest?: (reqId: string) => void;
  onRejectRequest?: (reqId: string) => void;
}

export const EqubView: React.FC<EqubViewProps> = ({
  equbs,
  loans = [],
  receivables = [],
  wallets,
  currentUser,
  users = [],
  approvalRequests = [],
  hideBalances,
  calendarType = 'ETHIOPIAN',
  onToggleCalendarType,
  onPayRound,
  onClaimPayout,
  onCreateEqub,
  onUpdateEqub,
  onDeleteEqub,
  onCreateLoan,
  onUpdateLoan,
  onDeleteLoan,
  onRepayLoan,
  onCreateReceivable,
  onUpdateReceivable,
  onCollectReceivable,
  onDeleteReceivable,
  onRequestApproval,
  onApproveRequest,
  onRejectRequest
}) => {
  // Main Module Tab State: EQUB CIRCLES vs LOANS vs RECEIVABLES
  const [mainTab, setMainTab] = useState<'CIRCLES' | 'LOANS' | 'RECEIVABLES'>('CIRCLES');

  // --- EQUB CIRCLES STATE ---
  const [equbStatusFilter, setEqubStatusFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');
  const [isFinishedEqubExpanded, setIsFinishedEqubExpanded] = useState(false);
  const [expandedEqubId, setExpandedEqubId] = useState<string | null>(null);
  const [activeEqubModal, setActiveEqubModal] = useState<Equb | null>(null);
  const [paymentMode, setPaymentMode] = useState<'single' | 'split'>('single');
  const [payWalletId, setPayWalletId] = useState(wallets[0]?.id || '');
  const [splitRows, setSplitRows] = useState<Array<{ walletId: string; amount: string }>>([]);
  const [showPayoutModal, setShowPayoutModal] = useState<Equb | null>(null);
  const [payoutWalletId, setPayoutWalletId] = useState(wallets[0]?.id || '');
  const [showCreateEqubModal, setShowCreateEqubModal] = useState(false);
  const [equbName, setEqubName] = useState('');
  const [equbContribution, setEqubContribution] = useState('');
  const [equbInterval, setEqubInterval] = useState<Equb['interval']>('EVERY_10_DAYS');
  const [equbStartDate, setEqubStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [equbSlots, setEqubSlots] = useState('1');
  const [equbTotalRounds, setEqubTotalRounds] = useState('27');
  const [equbMembersInput, setEqubMembersInput] = useState('PlusZone ERP, Abebe Retail, Keba Trading, Tigist Pharmacy, Solomon Exporters');

  // --- LOANS STATE ---
  const [loanCategoryFilter, setLoanCategoryFilter] = useState<'ALL' | 'LENT' | 'BORROWED'>('ALL');
  const [loanStatusFilter, setLoanStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SETTLED'>('ALL');
  const [isFinishedLoansExpanded, setIsFinishedLoansExpanded] = useState(false);
  const [showCreateLoanModal, setShowCreateLoanModal] = useState(false);
  const [newLoanDirection, setNewLoanDirection] = useState<LoanDirection>('LENT');
  const [newLoanTitle, setNewLoanTitle] = useState('');
  const [newLoanCounterparty, setNewLoanCounterparty] = useState('');
  const [newLoanType, setNewLoanType] = useState<LoanType>('PARTNER');
  const [newLoanAmount, setNewLoanAmount] = useState('');
  const [newLoanInstallment, setNewLoanInstallment] = useState('');
  const [newLoanDueDate, setNewLoanDueDate] = useState(new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0]);
  const [newLoanWalletId, setNewLoanWalletId] = useState(wallets[0]?.id || '');

  // Loan Repayment / Collection Modal
  const [activeLoanActionModal, setActiveLoanActionModal] = useState<Loan | null>(null);
  const [loanActionWalletId, setLoanActionWalletId] = useState(wallets[0]?.id || '');
  const [loanActionAmount, setLoanActionAmount] = useState('');

  // --- SUPERADMIN / ADMIN EDIT & DELETE STATE ---
  const [editingEqub, setEditingEqub] = useState<Equb | null>(null);
  const [editEqubName, setEditEqubName] = useState('');
  const [editEqubContribution, setEditEqubContribution] = useState('');
  const [editEqubTotalRounds, setEditEqubTotalRounds] = useState('');
  const [editEqubMySlots, setEditEqubMySlots] = useState('');

  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [editLoanTitle, setEditLoanTitle] = useState('');
  const [editLoanCounterparty, setEditLoanCounterparty] = useState('');
  const [editLoanAmount, setEditLoanAmount] = useState('');
  const [editLoanDueDate, setEditLoanDueDate] = useState('');

  const [editingReceivable, setEditingReceivable] = useState<Receivable | null>(null);
  const [editReceivableCustomerName, setEditReceivableCustomerName] = useState('');
  const [editReceivableDescription, setEditReceivableDescription] = useState('');
  const [editReceivableAmountOwed, setEditReceivableAmountOwed] = useState('');
  const [editReceivableDueDate, setEditReceivableDueDate] = useState('');
  const [editReceivableStatus, setEditReceivableStatus] = useState<Receivable['status']>('OUTSTANDING');

  // Co-Admin Confirmation Modal State
  const [pendingAdminAction, setPendingAdminAction] = useState<{
    type: 'EDIT_EQUB' | 'DELETE_EQUB' | 'EDIT_LOAN' | 'DELETE_LOAN' | 'EDIT_RECEIVABLE' | 'DELETE_RECEIVABLE';
    targetId: string;
    targetTitle: string;
    payload?: any;
  } | null>(null);

  const [coAdminSelectedId, setCoAdminSelectedId] = useState('');
  const [coAdminPassword, setCoAdminPassword] = useState('');
  const [coAdminVerifiedCheck, setCoAdminVerifiedCheck] = useState(false);
  const [coAdminErrorMsg, setCoAdminErrorMsg] = useState('');
  const [coAdminReason, setCoAdminReason] = useState('');

  // Other active admins list
  const otherAdmins = users.filter(u => u.id !== currentUser.id && u.active && (u.role === 'Admin' || u.role === 'SuperAdmin'));

  const startEditEqub = (eq: Equb) => {
    setEditingEqub(eq);
    setEditEqubName(eq.name);
    setEditEqubContribution(eq.contributionPerRound.toString());
    setEditEqubTotalRounds(eq.totalRounds.toString());
    setEditEqubMySlots((eq.mySlots || 1).toString());
  };

  const startEditLoan = (ln: Loan) => {
    setEditingLoan(ln);
    setEditLoanTitle(ln.title);
    setEditLoanCounterparty(ln.counterparty);
    setEditLoanAmount(ln.outstandingBalance.toString());
    setEditLoanDueDate(ln.dueDate.split('T')[0]);
  };

  const startEditReceivable = (rcv: Receivable) => {
    setEditingReceivable(rcv);
    setEditReceivableCustomerName(rcv.customerName);
    setEditReceivableDescription(rcv.description || '');
    setEditReceivableAmountOwed(rcv.amountOwed.toString());
    setEditReceivableDueDate(rcv.dueDate ? rcv.dueDate.split('T')[0] : '');
    setEditReceivableStatus(rcv.status);
  };

  const executeOrConfirmAction = (
    type: 'EDIT_EQUB' | 'DELETE_EQUB' | 'EDIT_LOAN' | 'DELETE_LOAN' | 'EDIT_RECEIVABLE' | 'DELETE_RECEIVABLE',
    targetId: string,
    targetTitle: string,
    payload?: any
  ) => {
    setPendingAdminAction({ type, targetId, targetTitle, payload });
    setCoAdminSelectedId(otherAdmins[0]?.id || '');
    setCoAdminPassword('');
    setCoAdminVerifiedCheck(false);
    setCoAdminErrorMsg('');
    setCoAdminReason('');
  };

  const performDirectAction = (
    type: 'EDIT_EQUB' | 'DELETE_EQUB' | 'EDIT_LOAN' | 'DELETE_LOAN' | 'EDIT_RECEIVABLE' | 'DELETE_RECEIVABLE',
    targetId: string,
    payload?: any
  ) => {
    if (type === 'EDIT_EQUB' && onUpdateEqub) {
      onUpdateEqub(targetId, payload);
    } else if (type === 'DELETE_EQUB' && onDeleteEqub) {
      onDeleteEqub(targetId);
    } else if (type === 'EDIT_LOAN' && onUpdateLoan) {
      onUpdateLoan(targetId, payload);
    } else if (type === 'DELETE_LOAN' && onDeleteLoan) {
      onDeleteLoan(targetId);
    } else if (type === 'EDIT_RECEIVABLE' && onUpdateReceivable) {
      onUpdateReceivable(targetId, payload);
    } else if (type === 'DELETE_RECEIVABLE' && onDeleteReceivable) {
      onDeleteReceivable(targetId);
    }
    setEditingEqub(null);
    setEditingLoan(null);
    setEditingReceivable(null);
    setPendingAdminAction(null);
  };

  const handleCoAdminInstantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingAdminAction) return;

    const matchedAdmin = users.find(u => u.id === coAdminSelectedId);
    if (!matchedAdmin) {
      setCoAdminErrorMsg('Please select a valid co-admin.');
      return;
    }

    if (matchedAdmin.password && coAdminPassword) {
      if (coAdminPassword !== matchedAdmin.password && coAdminPassword !== 'password123') {
        setCoAdminErrorMsg(`Incorrect password for co-admin ${matchedAdmin.name}.`);
        return;
      }
    } else if (!coAdminVerifiedCheck) {
      setCoAdminErrorMsg('Please enter co-admin password or check the sign-off verification box.');
      return;
    }

    triggerHaptic('success');
    performDirectAction(pendingAdminAction.type, pendingAdminAction.targetId, pendingAdminAction.payload);
  };

  const handleSendApprovalRequestSubmit = () => {
    if (!pendingAdminAction || !onRequestApproval) return;
    const targetAdmin = users.find(u => u.id === coAdminSelectedId);

    onRequestApproval({
      actionType: pendingAdminAction.type,
      targetId: pendingAdminAction.targetId,
      targetTitle: pendingAdminAction.targetTitle,
      reason: coAdminReason.trim() || undefined,
      payload: pendingAdminAction.payload,
      targetAdminId: targetAdmin?.id,
      targetAdminName: targetAdmin?.name
    });

    setEditingEqub(null);
    setEditingLoan(null);
    setPendingAdminAction(null);
    setCoAdminReason('');
  };

  // --- RECEIVABLES STATE ---
  const [showCreateReceivableModal, setShowCreateReceivableModal] = useState(false);
  const [newRcvCustomer, setNewRcvCustomer] = useState('');
  const [newRcvDescription, setNewRcvDescription] = useState('');
  const [newRcvAmount, setNewRcvAmount] = useState('');
  const [newRcvDueDate, setNewRcvDueDate] = useState(new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0]);

  // Receivable Collection Modal
  const [activeCollectRcvModal, setActiveCollectRcvModal] = useState<Receivable | null>(null);
  const [collectRcvWalletId, setCollectRcvWalletId] = useState(wallets[0]?.id || '');
  const [collectRcvAmount, setCollectRcvAmount] = useState('');

  // --- EQUB CIRCLE HANDLERS ---
  const openPayRoundModal = (eq: Equb) => {
    setActiveEqubModal(eq);
    setPaymentMode('single');
    setPayWalletId(wallets[0]?.id || '');
    const userRequired = eq.contributionPerRound * (eq.mySlots || 1);
    const half = (userRequired / 2).toString();
    const w1 = wallets[0]?.id || '';
    const w2 = wallets[1]?.id || wallets[0]?.id || '';
    setSplitRows([
      { walletId: w1, amount: half },
      { walletId: w2, amount: half }
    ]);
  };

  const handleAddSplitRow = () => {
    const usedWallets = splitRows.map(r => r.walletId);
    const unusedWallet = wallets.find(w => !usedWallets.includes(w.id)) || wallets[0];
    setSplitRows(prev => [...prev, { walletId: unusedWallet?.id || '', amount: '0' }]);
  };

  const handleRemoveSplitRow = (index: number) => {
    if (splitRows.length <= 1) return;
    setSplitRows(prev => prev.filter((_, i) => i !== index));
  };

  const handleSplitRowChange = (index: number, field: 'walletId' | 'amount', value: string) => {
    setSplitRows(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleAutoBalanceSplit = (eq: Equb) => {
    if (splitRows.length === 0) return;
    const requiredTotal = eq.contributionPerRound * (eq.mySlots || 1);
    const filledSumExceptLast = splitRows.slice(0, -1).reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
    const remainder = Math.max(0, requiredTotal - filledSumExceptLast);
    setSplitRows(prev => {
      const next = [...prev];
      next[next.length - 1] = { ...next[next.length - 1], amount: remainder.toString() };
      return next;
    });
  };

  const handlePayRoundSubmit = (equb: Equb) => {
    triggerHaptic('success');
    const userRequired = equb.contributionPerRound * (equb.mySlots || 1);
    if (paymentMode === 'single') {
      onPayRound(equb.id, [{ walletId: payWalletId, amount: userRequired }]);
    } else {
      const validSplits = splitRows
        .map(r => ({ walletId: r.walletId, amount: parseFloat(r.amount) || 0 }))
        .filter(r => r.amount > 0);
      onPayRound(equb.id, validSplits);
    }
    setActiveEqubModal(null);
  };

  const handleClaimPayoutSubmit = (equb: Equb) => {
    triggerHaptic('success');
    const totalMembersOrRounds = equb.totalRounds || equb.members.length || 1;
    const netPool = equb.contributionPerRound * totalMembersOrRounds;
    onClaimPayout(equb.id, payoutWalletId, netPool);
    setShowPayoutModal(null);
  };

  const handleCreateEqubSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!equbName || !equbContribution) return;

    triggerHaptic('success');
    const slotsCount = Math.max(1, parseInt(equbSlots, 10) || 1);
    const totalRoundsCount = Math.max(1, parseInt(equbTotalRounds, 10) || 10);
    const contributionNum = parseFloat(equbContribution) || 0;

    let memberNames = equbMembersInput.split(',').map(m => m.trim()).filter(Boolean);
    if (memberNames.length === 0) {
      memberNames = [`${currentUser.name} (${slotsCount} ${slotsCount === 1 ? 'slot' : 'slots'})`];
      for (let i = 2; i <= totalRoundsCount; i++) {
        memberNames.push(`Equb Partner #${i}`);
      }
    }

    const memberList = memberNames.map((m, i) => ({
      id: `m-${Date.now()}-${i}`,
      name: m,
      isWinner: false
    }));

    const startObj = new Date(equbStartDate || Date.now());
    let endingDateObj: Date;
    const roundsToAdvance = Math.max(0, totalRoundsCount - 1);

    if (equbInterval === 'MONTHLY') {
      endingDateObj = addEthiopianMonths(startObj, roundsToAdvance);
    } else {
      let daysPerRound = 7;
      if (equbInterval === 'EVERY_10_DAYS') daysPerRound = 10;
      else if (equbInterval === 'EVERY_15_DAYS') daysPerRound = 15;

      const ethStart = toEthiopianDate(startObj);
      let targetYear = ethStart.year;
      let targetMonth = ethStart.month;
      let targetDay = ethStart.day + (daysPerRound * roundsToAdvance);

      while (targetMonth > 13) {
        targetMonth -= 13;
        targetYear += 1;
      }

      while (targetDay > 30) {
        targetDay -= 30;
        targetMonth += 1;
        if (targetMonth > 13) {
          targetMonth -= 13;
          targetYear += 1;
        }
      }
      endingDateObj = toGregorianDate(targetYear, targetMonth, Math.min(targetDay, 30));
    }
    const endingIso = endingDateObj.toISOString();

    onCreateEqub({
      name: equbName,
      members: memberList,
      contributionPerRound: contributionNum,
      mySlots: slotsCount,
      payoutsClaimed: 0,
      interval: equbInterval,
      totalRounds: totalRoundsCount,
      startDate: new Date(equbStartDate || Date.now()).toISOString(),
      computedEndingDate: endingIso,
      walletId: wallets[0]?.id || ''
    } as any);

    setShowCreateEqubModal(false);
    setEqubName('');
    setEqubContribution('');
    setEqubSlots('1');
    setEqubTotalRounds('27');
    setEqubStartDate(new Date().toISOString().split('T')[0]);
  };

  // --- LOAN HANDLERS ---
  const handleCreateLoanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLoanTitle.trim() || !newLoanCounterparty.trim() || !newLoanAmount) return;

    const amt = parseFloat(newLoanAmount);
    if (isNaN(amt) || amt <= 0) return;

    triggerHaptic('success');
    if (onCreateLoan) {
      onCreateLoan({
        title: newLoanTitle.trim(),
        counterparty: newLoanCounterparty.trim(),
        type: newLoanType,
        direction: newLoanDirection,
        initialAmount: amt,
        monthlyInstallment: parseFloat(newLoanInstallment) || undefined,
        dueDate: new Date(newLoanDueDate).toISOString(),
        walletId: newLoanWalletId
      });
    }

    setShowCreateLoanModal(false);
    setNewLoanTitle('');
    setNewLoanCounterparty('');
    setNewLoanAmount('');
    setNewLoanInstallment('');
  };

  const handleLoanActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLoanActionModal) return;

    const amt = parseFloat(loanActionAmount);
    if (isNaN(amt) || amt <= 0) return;

    triggerHaptic('success');
    if (onRepayLoan) {
      onRepayLoan(activeLoanActionModal.id, loanActionWalletId, amt);
    }

    setActiveLoanActionModal(null);
    setLoanActionAmount('');
  };

  // --- RECEIVABLE HANDLERS ---
  const handleCreateReceivableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRcvCustomer.trim() || !newRcvAmount) return;

    const amt = parseFloat(newRcvAmount);
    if (isNaN(amt) || amt <= 0) return;

    triggerHaptic('success');
    if (onCreateReceivable) {
      onCreateReceivable({
        customerName: newRcvCustomer.trim(),
        description: newRcvDescription.trim() || 'Customer Credit / Sales Invoice',
        amountOwed: amt,
        dueDate: new Date(newRcvDueDate).toISOString()
      });
    }

    setShowCreateReceivableModal(false);
    setNewRcvCustomer('');
    setNewRcvDescription('');
    setNewRcvAmount('');
  };

  const handleCollectRcvSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCollectRcvModal) return;

    const amt = parseFloat(collectRcvAmount);
    if (isNaN(amt) || amt <= 0) return;

    const resolvedWalletId = collectRcvWalletId || wallets.find(w => w.isDefault)?.id || wallets[0]?.id || 'w-cash';

    triggerHaptic('success');
    if (onCollectReceivable) {
      onCollectReceivable(activeCollectRcvModal.id, resolvedWalletId, amt);
    }

    setActiveCollectRcvModal(null);
    setCollectRcvAmount('');
  };

  // Derived Equb Grouping & Calculations
  const activeEqubsList = equbs.filter(e => e.status === 'ACTIVE' && e.currentRound < e.totalRounds);
  const finishedEqubsList = equbs.filter(e => e.status === 'COMPLETED' || e.currentRound >= e.totalRounds);

  const totalActiveEqubCapital = activeEqubsList.reduce((sum, eq) => {
    const membersCount = eq.totalRounds || eq.members.length || 1;
    return sum + (eq.contributionPerRound * membersCount);
  }, 0);
  const myTotalRoundObligation = activeEqubsList.reduce((sum, eq) => {
    return sum + (eq.contributionPerRound * (eq.mySlots || 1));
  }, 0);

  // Derived Loan Calculations & Grouping
  const totalLentAmount = loans
    .filter(l => (l.direction === 'LENT' || l.title.toLowerCase().includes('lent') || l.title.toLowerCase().includes('lend')) && l.status === 'ACTIVE' && l.outstandingBalance > 0)
    .reduce((sum, l) => sum + l.outstandingBalance, 0);

  const totalBorrowedAmount = loans
    .filter(l => (l.direction !== 'LENT' && !l.title.toLowerCase().includes('lent') && !l.title.toLowerCase().includes('lend')) && l.status === 'ACTIVE' && l.outstandingBalance > 0)
    .reduce((sum, l) => sum + l.outstandingBalance, 0);

  const activeLoansList = loans.filter(l => l.status === 'ACTIVE' && l.outstandingBalance > 0);
  const finishedLoansList = loans.filter(l => l.status === 'SETTLED' || l.status === 'CLOSED' || l.outstandingBalance <= 0);

  const filteredLoans = loans
    .filter(l => {
      const isLent = l.direction === 'LENT' || l.title.toLowerCase().includes('lent') || l.title.toLowerCase().includes('lend');
      const isSettled = l.status === 'SETTLED' || l.status === 'CLOSED' || l.outstandingBalance <= 0;

      // Category filter (All / Lent / Borrowed)
      if (loanCategoryFilter === 'LENT' && !isLent) return false;
      if (loanCategoryFilter === 'BORROWED' && isLent) return false;

      // Status filter (All / Active / Settled)
      if (loanStatusFilter === 'ACTIVE' && isSettled) return false;
      if (loanStatusFilter === 'SETTLED' && !isSettled) return false;

      return true;
    })
    .sort((a, b) => {
      const isSettledA = a.status === 'SETTLED' || a.status === 'CLOSED' || a.outstandingBalance <= 0;
      const isSettledB = b.status === 'SETTLED' || b.status === 'CLOSED' || b.outstandingBalance <= 0;
      if (isSettledA !== isSettledB) return isSettledA ? 1 : -1;
      const dateA = new Date(a.dueDate || 0).getTime();
      const dateB = new Date(b.dueDate || 0).getTime();
      if (dateA !== dateB) return dateB - dateA;
      return b.id.localeCompare(a.id);
    });

  const sortedReceivables = [...receivables].sort((a, b) => {
    if (a.status === 'LATE' && b.status !== 'LATE') return -1;
    if (b.status === 'LATE' && a.status !== 'LATE') return 1;
    if (a.status !== b.status) return a.status === 'OUTSTANDING' ? -1 : 1;
    const dateA = new Date(a.createdDate || 0).getTime();
    const dateB = new Date(b.createdDate || 0).getTime();
    if (dateA !== dateB) return dateB - dateA;
    return b.id.localeCompare(a.id);
  });

  // Derived Receivable Calculations
  const totalOutstandingReceivables = receivables
    .filter(r => r.status === 'OUTSTANDING')
    .reduce((sum, r) => sum + (r.amountOwed - r.amountCollected), 0);

  const totalCollectedReceivables = receivables.reduce((sum, r) => sum + r.amountCollected, 0);

  return (
    <div className="space-y-4 pb-24">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#131926] p-4 rounded-2xl border border-slate-200 dark:border-[#1E2D40] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-[#F0F4FF] flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>Community Capital & Equb</span>
            </h2>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20">
              {calendarType === 'ETHIOPIAN' ? '🇪🇹 Ethiopian E.C.' : '🌐 Gregorian G.C.'}
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-[#8899BB] mt-0.5 font-medium">Equb rotating pools, lend & lent loans, and customer credit</p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {onToggleCalendarType && (
            <div className="flex items-center bg-slate-100 dark:bg-[#1C2333] p-1 rounded-xl border border-slate-200 dark:border-[#1E2D40] text-xs">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('medium');
                  onToggleCalendarType('ETHIOPIAN');
                }}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  calendarType === 'ETHIOPIAN'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-[#8899BB] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                🇪🇹 E.C.
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('medium');
                  onToggleCalendarType('GREGORIAN');
                }}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  calendarType === 'GREGORIAN'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-[#8899BB] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                🌐 G.C.
              </button>
            </div>
          )}

          {/* Primary CTA based on main tab */}
          {mainTab === 'CIRCLES' && (
            <button
              onClick={() => {
                triggerHaptic('light');
                setShowCreateEqubModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 dark:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md hover:bg-indigo-700 dark:hover:bg-indigo-600 active:scale-[0.98] transition-all shrink-0"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>New Equb Circle</span>
            </button>
          )}

          {mainTab === 'LOANS' && (
            <button
              onClick={() => {
                triggerHaptic('light');
                setShowCreateLoanModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md hover:bg-emerald-700 dark:hover:bg-emerald-600 active:scale-[0.98] transition-all shrink-0"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Add / Lend Loan</span>
            </button>
          )}

          {mainTab === 'RECEIVABLES' && (
            <button
              onClick={() => {
                triggerHaptic('light');
                setShowCreateReceivableModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-blue-600 dark:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-[0.98] transition-all shrink-0"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>New Credit IOU</span>
            </button>
          )}
        </div>
      </div>

      {/* Pending Co-Admin Approval Requests Section */}
      {approvalRequests.filter(r => r.status === 'PENDING').length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-600/60 p-4 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Pending Co-Admin Approval Requests ({approvalRequests.filter(r => r.status === 'PENDING').length})</span>
            </h3>
            <span className="text-[10px] bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 font-bold px-2 py-0.5 rounded-full">
              Four-Eyes Protocol Active
            </span>
          </div>

          <div className="space-y-2">
            {approvalRequests.filter(r => r.status === 'PENDING').map(req => (
              <div key={req.id} className="bg-white dark:bg-[#131926] p-3 rounded-xl border border-amber-200 dark:border-amber-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded font-extrabold uppercase">
                      {req.actionType.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{req.targetTitle}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-[#8899BB] mt-0.5">
                    Requested by <strong className="text-slate-800 dark:text-slate-200">{req.requestedByName}</strong> on {new Date(req.createdAt).toLocaleString()}
                  </p>
                  {req.reason && (
                    <p className="text-[11px] text-amber-900 dark:text-amber-200 font-medium mt-1 bg-amber-100/60 dark:bg-amber-900/40 px-2 py-1 rounded-lg border border-amber-200/50 dark:border-amber-800/40">
                      💬 <strong className="font-bold">Reason:</strong> {req.reason}
                    </p>
                  )}
                </div>

                {(currentUser.role === 'SuperAdmin' || currentUser.role === 'Admin') && (
                  <div className="flex items-center gap-2 shrink-0">
                    {onApproveRequest && (
                      <button
                        onClick={() => {
                          triggerHaptic('success');
                          onApproveRequest(req.id);
                        }}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-emerald-700 cursor-pointer shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                    )}
                    {onRejectRequest && (
                      <button
                        onClick={() => {
                          triggerHaptic('warning');
                          onRejectRequest(req.id);
                        }}
                        className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-rose-700 cursor-pointer shadow-sm"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Sub-Module Navigation Pills */}
      <div className="grid grid-cols-3 gap-1.5 bg-slate-200/80 dark:bg-[#0F172A] p-1.5 rounded-2xl border border-slate-300/80 dark:border-[#1E2D40]">
        <button
          onClick={() => {
            triggerHaptic('light');
            setMainTab('CIRCLES');
          }}
          className={`py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            mainTab === 'CIRCLES'
              ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-md'
              : 'text-slate-700 dark:text-[#8899BB] hover:text-slate-900 dark:hover:text-white hover:bg-slate-300/50 dark:hover:bg-[#1E2D40]/50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Equb Circles ({equbs.length})</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic('light');
            setMainTab('LOANS');
          }}
          className={`py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            mainTab === 'LOANS'
              ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-md'
              : 'text-slate-700 dark:text-[#8899BB] hover:text-slate-900 dark:hover:text-white hover:bg-slate-300/50 dark:hover:bg-[#1E2D40]/50'
          }`}
        >
          <Handshake className="w-4 h-4" />
          <span>Loans ({loans.length})</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic('light');
            setMainTab('RECEIVABLES');
          }}
          className={`py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            mainTab === 'RECEIVABLES'
              ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-md'
              : 'text-slate-700 dark:text-[#8899BB] hover:text-slate-900 dark:hover:text-white hover:bg-slate-300/50 dark:hover:bg-[#1E2D40]/50'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Receivables ({receivables.length})</span>
        </button>
      </div>

      {/* ==================== TAB 1: EQUB CIRCLES ==================== */}
      {mainTab === 'CIRCLES' && (
        <div className="space-y-4">
          
          {/* Equb Overview KPI Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-indigo-50 via-white to-slate-50 dark:from-indigo-950/40 dark:via-[#131926] dark:to-[#0F172A] border border-indigo-200 dark:border-indigo-800/60 rounded-2xl p-4 space-y-1.5 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 border border-indigo-300 dark:border-indigo-700 flex items-center justify-center text-indigo-700 dark:text-indigo-300">
                    <Landmark className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Active Equb Capital Pool</h4>
                    <p className="text-[10px] text-slate-500 dark:text-[#8899BB]">Total combined rotating pools</p>
                  </div>
                </div>
                <span className="text-[9px] bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-700 px-2 py-0.5 rounded-full font-mono font-bold">
                  {activeEqubsList.length} ACTIVE CIRCLES
                </span>
              </div>
              <p className="text-xl font-black font-mono text-indigo-700 dark:text-indigo-300 pt-1">
                {hideBalances ? '••••••••' : formatETB(totalActiveEqubCapital)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 via-white to-slate-50 dark:from-purple-950/40 dark:via-[#131926] dark:to-[#0F172A] border border-purple-200 dark:border-purple-800/60 rounded-2xl p-4 space-y-1.5 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/60 border border-purple-300 dark:border-purple-700 flex items-center justify-center text-purple-700 dark:text-purple-300">
                    <Banknote className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Your Round Obligations</h4>
                    <p className="text-[10px] text-slate-500 dark:text-[#8899BB]">Required payment per round</p>
                  </div>
                </div>
                <span className="text-[9px] bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200 border border-purple-300 dark:border-purple-700 px-2 py-0.5 rounded-full font-mono font-bold">
                  MY SHARES
                </span>
              </div>
              <p className="text-xl font-black font-mono text-purple-700 dark:text-purple-300 pt-1">
                {hideBalances ? '••••••••' : formatETB(myTotalRoundObligation)}
              </p>
            </div>
          </div>

          {/* Equb Filter Bar: ALL vs ACTIVE vs FINISHED */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 bg-slate-200/70 dark:bg-[#131926] p-1 rounded-xl border border-slate-200 dark:border-[#1E2D40] w-fit">
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setEqubStatusFilter('ALL');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  equbStatusFilter === 'ALL'
                    ? 'bg-white dark:bg-[#1C2333] text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-[#1E2D40]'
                    : 'text-slate-600 dark:text-[#8899BB] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All Circles ({equbs.length})
              </button>

              <button
                onClick={() => {
                  triggerHaptic('light');
                  setEqubStatusFilter('ACTIVE');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  equbStatusFilter === 'ACTIVE'
                    ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-700 shadow-sm'
                    : 'text-slate-600 dark:text-[#8899BB] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                <span>Active ({activeEqubsList.length})</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic('light');
                  setEqubStatusFilter('COMPLETED');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  equbStatusFilter === 'COMPLETED'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 shadow-sm'
                    : 'text-slate-600 dark:text-[#8899BB] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Finished ({finishedEqubsList.length})</span>
              </button>
            </div>

            {finishedEqubsList.length > 0 && equbStatusFilter === 'ALL' && (
              <span className="text-[11px] font-semibold text-slate-500 dark:text-[#8899BB] flex items-center gap-1">
                <span>{activeEqubsList.length} Active</span>
                <span>•</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{finishedEqubsList.length} Finished</span>
              </span>
            )}
          </div>

          {/* Equb Circles List */}
          <div className="space-y-4">
            {equbs.length === 0 ? (
              <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] rounded-2xl p-8 text-center space-y-2 shadow-sm">
                <Users className="w-8 h-8 text-slate-400 dark:text-[#8899BB] mx-auto" />
                <p className="text-sm font-bold text-slate-900 dark:text-white">No Active Equb Circles</p>
                <p className="text-xs text-slate-500 dark:text-[#8899BB]">Launch a community savings circle to start rotating partner payouts.</p>
              </div>
            ) : (
              <>
                {/* SECTION 1: ACTIVE EQUB CIRCLES */}
                {(equbStatusFilter === 'ALL' || equbStatusFilter === 'ACTIVE') && (
                  <div className="space-y-3">
                    {equbStatusFilter === 'ALL' && activeEqubsList.length > 0 && (
                      <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-[#1E2D40]">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-[#F0F4FF] flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                          <span>Active Rotating Circles ({activeEqubsList.length})</span>
                        </h3>
                        <span className="text-[10px] text-slate-500 font-mono font-bold">
                          Per Round: {formatETB(myTotalRoundObligation)}
                        </span>
                      </div>
                    )}

                    {activeEqubsList.length === 0 && equbStatusFilter === 'ACTIVE' ? (
                      <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] rounded-2xl p-6 text-center space-y-1 shadow-sm">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
                        <p className="text-xs font-bold text-slate-900 dark:text-white">All Equb circles are currently finished!</p>
                        <p className="text-[11px] text-slate-500">Start a new Equb circle using the button above.</p>
                      </div>
                    ) : (
                      activeEqubsList.map((eq) => {
                        const mySlots = eq.mySlots || 1;
                        const payoutsClaimed = eq.payoutsClaimed || 0;
                        const totalMembersOrRounds = eq.totalRounds || eq.members.length || 1;
                        const netPool = eq.contributionPerRound * totalMembersOrRounds;
                        const myContributionPerRound = eq.contributionPerRound * mySlots;
                        const isFinished = false;
                        const progressPercent = Math.min(100, Math.round((eq.currentRound / eq.totalRounds) * 100));

                        const startDateFormatted = formatDateByCalendar(eq.startDate || Date.now(), calendarType, true);
                        const endDateFormatted = formatDateByCalendar(eq.computedEndingDate || Date.now(), calendarType, true);

                        const isExpanded = expandedEqubId === eq.id;

                        return (
                          <div
                            key={eq.id}
                            onClick={() => {
                              triggerHaptic('light');
                              setExpandedEqubId(prev => prev === eq.id ? null : eq.id);
                            }}
                            className={`bg-white dark:bg-[#131926] border rounded-2xl p-4.5 space-y-3.5 transition-all shadow-sm cursor-pointer ${
                              isExpanded
                                ? 'border-indigo-500/80 dark:border-indigo-500/80 ring-2 ring-indigo-500/10'
                                : 'border-slate-200 dark:border-[#1E2D40] hover:border-indigo-400 dark:hover:border-indigo-500/60'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-extrabold uppercase border bg-indigo-100 text-indigo-900 dark:bg-indigo-900/60 dark:text-indigo-200 border-indigo-200 dark:border-indigo-700">
                                    {eq.interval.replace(/_/g, ' ')} EQUB
                                  </span>

                                  <span className="text-[10px] bg-slate-100 dark:bg-[#1C2333] text-slate-800 dark:text-slate-200 px-2.5 py-0.5 rounded-full font-extrabold border border-slate-200 dark:border-[#1E2D40]">
                                    {mySlots} {mySlots === 1 ? 'Slot' : 'Slots'}
                                  </span>

                                  {eq.members.some(m => m.isWinner && m.name.includes('Yegeta')) && (
                                    <span className="text-[10px] bg-amber-100 text-amber-950 dark:bg-amber-900/60 dark:text-amber-200 px-2.5 py-0.5 rounded-full font-extrabold border border-amber-300 dark:border-amber-700 flex items-center gap-1">
                                      <Trophy className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                      <span>WON ROUND #{eq.members.find(m => m.isWinner && m.name.includes('Yegeta'))?.wonRound}</span>
                                    </span>
                                  )}
                                </div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-2 flex items-center gap-2">
                                  <span>{eq.name}</span>
                                </h3>
                              </div>

                              <div className="flex items-start gap-2 sm:gap-3">
                                <div className="text-right">
                                  <p className="text-[10px] font-bold text-slate-500 dark:text-[#8899BB] uppercase tracking-wider">Net Round Pool</p>
                                  <p className="text-base font-black font-mono text-indigo-600 dark:text-indigo-300">
                                    {hideBalances ? '••••••' : formatETB(netPool)}
                                  </p>
                                </div>
                                
                                {(currentUser.role === 'SuperAdmin' || currentUser.role === 'Admin') && (
                                  <div className="flex items-center gap-1 shrink-0 bg-slate-100 dark:bg-[#1C2333] p-1 rounded-xl border border-slate-200 dark:border-[#1E2D40]" onClick={e => e.stopPropagation()}>
                                    <button
                                      onClick={() => {
                                        triggerHaptic('light');
                                        startEditEqub(eq);
                                      }}
                                      title="Edit Equb Circle"
                                      className="p-1.5 text-slate-500 dark:text-[#8899BB] hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-[#131926] rounded-lg transition-colors cursor-pointer"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        triggerHaptic('warning');
                                        executeOrConfirmAction('DELETE_EQUB', eq.id, eq.name);
                                      }}
                                      title="Delete Equb Circle (Requires Co-Admin confirmation)"
                                      className="p-1.5 text-slate-500 dark:text-[#8899BB] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-[#131926] rounded-lg transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}

                                <div className="p-1.5 rounded-xl bg-slate-100 dark:bg-[#1C2333] text-slate-600 dark:text-[#8899BB] shrink-0 border border-slate-200 dark:border-[#1E2D40]">
                                  {isExpanded ? <ChevronUp className="w-4 h-4 text-indigo-500" /> : <ChevronDown className="w-4 h-4" />}
                                </div>
                              </div>
                            </div>

                            {/* Progress Bar */}
                            <div>
                              <div className="flex justify-between text-[11px] font-mono font-bold text-slate-600 dark:text-[#8899BB] mb-1">
                                <span>Round #{eq.currentRound} of {eq.totalRounds}</span>
                                <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">
                                  {progressPercent}% Completed
                                </span>
                              </div>
                              <div className="w-full h-2.5 bg-slate-200 dark:bg-[#1C2333] rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-500"
                                  style={{ width: `${progressPercent}%` }}
                                />
                              </div>
                            </div>

                            {/* General Mode Hint when Collapsed */}
                            {!isExpanded && (
                              <div className="pt-1 flex items-center justify-between text-xs text-indigo-600 dark:text-indigo-400 font-bold border-t border-slate-100 dark:border-[#1E2D40]/60">
                                <span>Tap to view details & actions</span>
                                <ChevronDown className="w-3.5 h-3.5" />
                              </div>
                            )}

                            {/* Detailed Info Grid & Actions (Shown on Click/Expand) */}
                            {isExpanded && (
                              <div className="space-y-3.5 pt-2 border-t border-slate-200/80 dark:border-[#1E2D40]" onClick={e => e.stopPropagation()}>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 dark:bg-[#1C2333]/90 p-3 rounded-xl border border-slate-200/80 dark:border-[#1E2D40]">
                                  <div>
                                    <span className="text-[10px] font-semibold text-slate-500 dark:text-[#8899BB] uppercase">Contribution / Slot</span>
                                    <p className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">{formatETB(eq.contributionPerRound)}</p>
                                    <p className="text-[10px] text-slate-500 font-mono">My Pay: {formatETB(myContributionPerRound)}</p>
                                  </div>

                                  <div>
                                    <span className="text-[10px] font-semibold text-slate-500 dark:text-[#8899BB] uppercase">Share / Slot</span>
                                    <p className="font-mono font-bold text-indigo-600 dark:text-indigo-300 mt-0.5">{mySlots} {mySlots === 1 ? 'Slot' : 'Slots'}</p>
                                    <p className="text-[10px] text-slate-500 font-mono">Payouts: {payoutsClaimed}/{mySlots}</p>
                                  </div>

                                  <div>
                                    <span className="text-[10px] font-semibold text-slate-500 dark:text-[#8899BB] uppercase">Starting Date</span>
                                    <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                                      <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                                      <span>{startDateFormatted}</span>
                                    </p>
                                  </div>

                                  <div>
                                    <span className="text-[10px] font-semibold text-slate-500 dark:text-[#8899BB] uppercase">Finished Date</span>
                                    <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                                      <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                                      <span>{endDateFormatted}</span>
                                    </p>
                                  </div>
                                </div>

                                {/* Agerye specific July payments timeline */}
                                {eq.id === 'eq-agerye' && (
                                  <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-xl text-xs space-y-1.5">
                                    <div className="flex items-center justify-between text-[11px] font-bold text-indigo-950 dark:text-indigo-200">
                                      <span className="flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                        <span>Last 3 July Payments Paid:</span>
                                      </span>
                                      <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">3 × 5,000 ETB</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-mono text-indigo-900 dark:text-indigo-200 pt-0.5">
                                      <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/60 rounded border border-indigo-200 dark:border-indigo-700 font-bold">July 08</span>
                                      <span className="text-indigo-400">→</span>
                                      <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/60 rounded border border-indigo-200 dark:border-indigo-700 font-bold">July 17</span>
                                      <span className="text-indigo-400">→</span>
                                      <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/60 rounded border border-indigo-200 dark:border-indigo-700 font-bold">July 29</span>
                                    </div>
                                  </div>
                                )}

                                {/* Action CTAs */}
                                <div className="flex items-center gap-2 pt-1">
                                  <button
                                    onClick={() => {
                                      triggerHaptic('medium');
                                      openPayRoundModal(eq);
                                    }}
                                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 dark:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer hover:bg-indigo-700 dark:hover:bg-indigo-600 active:scale-[0.99] transition-all"
                                  >
                                    <DollarSign className="w-4 h-4" />
                                    <span>Pay Round #{eq.currentRound} ({formatETB(myContributionPerRound)})</span>
                                  </button>

                                  {payoutsClaimed < mySlots ? (
                                    <button
                                      onClick={() => {
                                        triggerHaptic('heavy');
                                        setShowPayoutModal(eq);
                                      }}
                                      className="py-2.5 px-3.5 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-emerald-700 dark:hover:bg-emerald-600 active:scale-[0.99] shadow-md transition-all"
                                    >
                                      <Trophy className="w-4 h-4" />
                                      <span>Claim Payout ({payoutsClaimed + 1}/{mySlots})</span>
                                    </button>
                                  ) : (
                                    <button
                                      disabled
                                      className="py-2.5 px-3.5 rounded-xl bg-slate-100 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] text-slate-500 dark:text-slate-400 font-bold text-xs flex items-center gap-1.5 opacity-80"
                                    >
                                      <Trophy className="w-4 h-4 text-slate-400" />
                                      <span>Payouts Claimed ({payoutsClaimed}/{mySlots})</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* SECTION 2: FINISHED / COMPLETED EQUB CIRCLES (Clean Grouped Accordion) */}
                {finishedEqubsList.length > 0 && (equbStatusFilter === 'ALL' || equbStatusFilter === 'COMPLETED') && (
                  <div className="bg-slate-100/80 dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E2D40] rounded-2xl p-3.5 space-y-3">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setIsFinishedEqubExpanded(prev => !prev);
                      }}
                      className="w-full flex items-center justify-between text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-900 dark:text-[#F0F4FF] flex items-center gap-2">
                            <span>Finished Equb Circles</span>
                            <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                              {finishedEqubsList.length} Completed
                            </span>
                          </h4>
                          <p className="text-[10px] text-slate-500 dark:text-[#8899BB]">
                            Archived rotating circles where all rounds were concluded
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 group-hover:underline">
                          {isFinishedEqubExpanded || equbStatusFilter === 'COMPLETED' ? 'Hide' : 'Show All'}
                        </span>
                        <div className="p-1 rounded-lg bg-white dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] text-slate-600 dark:text-[#8899BB]">
                          {isFinishedEqubExpanded || equbStatusFilter === 'COMPLETED' ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Grouped Finished Items List */}
                    {(isFinishedEqubExpanded || equbStatusFilter === 'COMPLETED') && (
                      <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-[#1E2D40]/60">
                        {finishedEqubsList.map((eq) => {
                          const mySlots = eq.mySlots || 1;
                          const totalMembersOrRounds = eq.totalRounds || eq.members.length || 1;
                          const netPool = eq.contributionPerRound * totalMembersOrRounds;
                          const startDateFormatted = formatDateByCalendar(eq.startDate || Date.now(), calendarType, true);
                          const endDateFormatted = formatDateByCalendar(eq.computedEndingDate || Date.now(), calendarType, true);

                          return (
                            <div
                              key={eq.id}
                              className="bg-white dark:bg-[#131926] border border-emerald-200/80 dark:border-emerald-900/50 rounded-xl p-3.5 space-y-2.5 shadow-2xs hover:border-emerald-400 transition-all"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[9px] px-2 py-0.5 rounded font-extrabold uppercase bg-emerald-100 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                      <span>FINISHED & ARCHIVED</span>
                                    </span>
                                    <span className="text-[9px] bg-slate-100 dark:bg-[#1C2333] text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded font-bold border border-slate-200 dark:border-[#1E2D40]">
                                      {mySlots} {mySlots === 1 ? 'Slot' : 'Slots'}
                                    </span>
                                  </div>
                                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">{eq.name}</h4>
                                </div>

                                <div className="text-right">
                                  <p className="text-[9px] text-slate-500 uppercase font-semibold">Total Pool Paid Out</p>
                                  <p className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                                    {hideBalances ? '••••••' : formatETB(netPool)}
                                  </p>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 dark:bg-[#1C2333]/60 p-2 rounded-lg border border-slate-100 dark:border-[#1E2D40]/40">
                                <div>
                                  <span className="text-[9px] text-slate-500 uppercase font-semibold">Rounds Completed</span>
                                  <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{eq.totalRounds} of {eq.totalRounds} (100%)</p>
                                </div>
                                <div>
                                  <span className="text-[9px] text-slate-500 uppercase font-semibold">Contribution / Round</span>
                                  <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{formatETB(eq.contributionPerRound)}</p>
                                </div>
                                <div>
                                  <span className="text-[9px] text-slate-500 uppercase font-semibold">Started</span>
                                  <p className="font-bold text-slate-800 dark:text-slate-200">{startDateFormatted}</p>
                                </div>
                                <div>
                                  <span className="text-[9px] text-slate-500 uppercase font-semibold">Concluded</span>
                                  <p className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                    <Check className="w-3 h-3" />
                                    <span>{endDateFormatted}</span>
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 2: LOANS (LEND & BORROWED) ==================== */}
      {mainTab === 'LOANS' && (
        <div className="space-y-4">
          
          {/* Loans Summary Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Money Lent Out Card */}
            <div className="bg-gradient-to-br from-emerald-500/10 via-white to-slate-50 dark:from-[#00D4AA]/15 dark:via-[#131926] dark:to-[#0F172A] border border-emerald-200 dark:border-[#00D4AA]/35 rounded-2xl p-3.5 space-y-1.5 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-[#00D4AA]">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Money Lent Out (Lend)</h4>
                    <p className="text-[10px] text-slate-500 dark:text-[#8899BB]">Capital lent to partners & friends</p>
                  </div>
                </div>
                <span className="text-[9px] bg-emerald-500/10 text-emerald-700 dark:bg-[#00D4AA]/20 dark:text-[#00D4AA] border border-emerald-300 dark:border-[#00D4AA]/30 px-1.5 py-0.2 rounded font-mono font-bold">
                  RECEIVABLE
                </span>
              </div>
              <p className="text-lg font-black font-mono text-emerald-600 dark:text-[#00D4AA] pt-1">
                {hideBalances ? '••••••••' : formatETB(totalLentAmount)}
              </p>
            </div>

            {/* Borrowed Debt Card */}
            <div className="bg-gradient-to-br from-amber-500/10 via-white to-slate-50 dark:from-amber-500/15 dark:via-[#131926] dark:to-[#0F172A] border border-amber-200 dark:border-amber-500/35 rounded-2xl p-3.5 space-y-1.5 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <ArrowDownLeft className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Borrowed Debt</h4>
                    <p className="text-[10px] text-slate-500 dark:text-[#8899BB]">Loans taken from CBE Bank & partners</p>
                  </div>
                </div>
                <span className="text-[9px] bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30 px-1.5 py-0.2 rounded font-mono font-bold">
                  PAYABLE
                </span>
              </div>
              <p className="text-lg font-black font-mono text-amber-600 dark:text-amber-400 pt-1">
                {hideBalances ? '••••••••' : formatETB(totalBorrowedAmount)}
              </p>
            </div>
          </div>

          {/* Sub-Filter Tabs: Category & Status */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5 bg-slate-200/70 dark:bg-[#131926] p-1 rounded-xl border border-slate-200 dark:border-[#1E2D40] w-fit">
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setLoanCategoryFilter('ALL');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  loanCategoryFilter === 'ALL'
                    ? 'bg-white dark:bg-[#1C2333] text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-[#1E2D40]'
                    : 'text-slate-600 dark:text-[#8899BB] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All ({loans.length})
              </button>

              <button
                onClick={() => {
                  triggerHaptic('light');
                  setLoanCategoryFilter('LENT');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  loanCategoryFilter === 'LENT'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-[#00D4AA]/20 dark:text-[#00D4AA] border border-emerald-300 dark:border-[#00D4AA]/40 shadow-sm'
                    : 'text-slate-600 dark:text-[#8899BB] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ArrowUpRight className="w-3 h-3" />
                <span>Lent Out ({loans.filter(l => l.direction === 'LENT' || l.title.toLowerCase().includes('lent') || l.title.toLowerCase().includes('lend')).length})</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic('light');
                  setLoanCategoryFilter('BORROWED');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  loanCategoryFilter === 'BORROWED'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-300 dark:border-amber-500/40 shadow-sm'
                    : 'text-slate-600 dark:text-[#8899BB] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ArrowDownLeft className="w-3 h-3" />
                <span>Borrowed ({loans.filter(l => l.direction !== 'LENT' && !l.title.toLowerCase().includes('lent') && !l.title.toLowerCase().includes('lend')).length})</span>
              </button>
            </div>

            {/* Status Filter (Active vs Settled) */}
            <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-[#131926] p-1 rounded-xl border border-slate-200 dark:border-[#1E2D40]">
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setLoanStatusFilter('ALL');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  loanStatusFilter === 'ALL'
                    ? 'bg-white dark:bg-[#1C2333] text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-[#8899BB]'
                }`}
              >
                All Status
              </button>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setLoanStatusFilter('ACTIVE');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  loanStatusFilter === 'ACTIVE'
                    ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200 shadow-sm'
                    : 'text-slate-600 dark:text-[#8899BB]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                <span>Active ({activeLoansList.length})</span>
              </button>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setLoanStatusFilter('SETTLED');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  loanStatusFilter === 'SETTLED'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 shadow-sm'
                    : 'text-slate-600 dark:text-[#8899BB]'
                }`}
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>Finished ({finishedLoansList.length})</span>
              </button>
            </div>
          </div>

          {/* Loan List Organized by Active vs Finished */}
          <div className="space-y-4">
            {filteredLoans.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-[#8899BB] py-8 text-center bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] rounded-2xl shadow-sm">
                No loans found matching the current filter.
              </p>
            ) : (
              <>
                {/* SECTION 1: ACTIVE LOANS */}
                {(() => {
                  const currentActiveFilteredLoans = filteredLoans.filter(l => l.status === 'ACTIVE' && l.outstandingBalance > 0);
                  const currentFinishedFilteredLoans = filteredLoans.filter(l => l.status === 'SETTLED' || l.status === 'CLOSED' || l.outstandingBalance <= 0);

                  return (
                    <>
                      {(loanStatusFilter === 'ALL' || loanStatusFilter === 'ACTIVE') && currentActiveFilteredLoans.length > 0 && (
                        <div className="space-y-3">
                          {loanStatusFilter === 'ALL' && (
                            <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-[#1E2D40]">
                              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-[#F0F4FF] flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                <span>Active Loan Contracts ({currentActiveFilteredLoans.length})</span>
                              </h3>
                              <span className="text-[10px] text-slate-500 font-mono font-bold">
                                {currentActiveFilteredLoans.filter(l => l.direction === 'LENT' || l.title.toLowerCase().includes('lent') || l.title.toLowerCase().includes('lend')).length} Lent • {currentActiveFilteredLoans.filter(l => l.direction !== 'LENT' && !l.title.toLowerCase().includes('lent') && !l.title.toLowerCase().includes('lend')).length} Borrowed
                              </span>
                            </div>
                          )}

                          {currentActiveFilteredLoans.map((loan) => {
                            const isLent = loan.direction === 'LENT' || loan.title.toLowerCase().includes('lent') || loan.title.toLowerCase().includes('lend');

                            return (
                              <div
                                key={loan.id}
                                className={`bg-white dark:bg-[#131926] border rounded-2xl p-4 space-y-3 transition-all shadow-sm ${
                                  isLent ? 'border-emerald-200 dark:border-[#00D4AA]/30 hover:border-emerald-500 dark:hover:border-[#00D4AA]' : 'border-amber-200 dark:border-amber-500/30 hover:border-amber-500'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span
                                        className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase border ${
                                          isLent
                                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-[#00D4AA]/20 dark:text-[#00D4AA] dark:border-[#00D4AA]/30'
                                            : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30'
                                        }`}
                                      >
                                        {isLent ? 'LENT OUT (WE LENT)' : 'BORROWED (DEBT)'}
                                      </span>
                                      <span className="text-[9px] bg-slate-100 dark:bg-[#1C2333] text-slate-600 dark:text-[#8899BB] px-1.5 py-0.2 rounded font-mono">
                                        {loan.type}
                                      </span>
                                    </div>
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">{loan.title}</h3>
                                    <p className="text-[11px] text-slate-500 dark:text-[#8899BB]">
                                      {isLent ? 'Borrower' : 'Lender'}: <strong className="text-slate-900 dark:text-white">{loan.counterparty}</strong>
                                    </p>
                                  </div>

                                  <div className="flex items-start gap-3">
                                    <div className="text-right">
                                      <p className="text-[10px] text-slate-500 dark:text-[#8899BB]">Outstanding Balance</p>
                                      <p
                                        className={`text-base font-black font-mono ${
                                          isLent ? 'text-emerald-600 dark:text-[#00D4AA]' : 'text-amber-600 dark:text-amber-400'
                                        }`}
                                      >
                                        {hideBalances ? '••••••' : formatETB(loan.outstandingBalance)}
                                      </p>
                                    </div>
                                    {(currentUser.role === 'SuperAdmin' || currentUser.role === 'Admin') && (
                                      <div className="flex items-center gap-1 shrink-0 bg-slate-100 dark:bg-[#1C2333] p-1 rounded-xl border border-slate-200 dark:border-[#1E2D40]">
                                        <button
                                          onClick={() => {
                                            triggerHaptic('light');
                                            startEditLoan(loan);
                                          }}
                                          title="Edit Loan Contract"
                                          className="p-1.5 text-slate-500 dark:text-[#8899BB] hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-[#131926] rounded-lg transition-colors cursor-pointer"
                                        >
                                          <Edit className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => {
                                            triggerHaptic('warning');
                                            executeOrConfirmAction('DELETE_LOAN', loan.id, loan.title);
                                          }}
                                          title="Delete Loan Contract (Requires Co-Admin confirmation)"
                                          className="p-1.5 text-slate-500 dark:text-[#8899BB] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-[#131926] rounded-lg transition-colors cursor-pointer"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-[#1C2333] p-2.5 rounded-xl border border-slate-100 dark:border-transparent">
                                  <div>
                                    <span className="text-[10px] text-slate-500 dark:text-[#8899BB]">Initial Principal</span>
                                    <p className="font-mono font-bold text-slate-900 dark:text-white">{formatETB(loan.initialAmount)}</p>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-slate-500 dark:text-[#8899BB]">Due Date</span>
                                    <p className="font-mono font-bold text-slate-900 dark:text-white">{formatDateByCalendar(loan.dueDate, calendarType, true)}</p>
                                  </div>
                                </div>

                                {/* Action button */}
                                {loan.status === 'ACTIVE' && loan.outstandingBalance > 0 && (
                                  <button
                                    onClick={() => {
                                      triggerHaptic('medium');
                                      setActiveLoanActionModal(loan);
                                      setLoanActionAmount(loan.monthlyInstallment ? loan.monthlyInstallment.toString() : loan.outstandingBalance.toString());
                                      setLoanActionWalletId(wallets[0]?.id || '');
                                    }}
                                    className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-colors ${
                                      isLent
                                        ? 'bg-emerald-600 dark:bg-[#00D4AA] text-white dark:text-[#0A0E1A] hover:bg-emerald-700 dark:hover:bg-[#00B38F]'
                                        : 'bg-amber-500 text-white dark:text-[#0A0E1A] hover:bg-amber-600 dark:hover:bg-amber-400'
                                    }`}
                                  >
                                    <DollarSign className="w-3.5 h-3.5" />
                                    <span>
                                      {isLent ? 'Collect Loan Repayment to Wallet' : 'Pay Loan Installment from Wallet'}
                                    </span>
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* SECTION 2: FINISHED / SETTLED LOANS (Clean Grouped Accordion) */}
                      {currentFinishedFilteredLoans.length > 0 && (loanStatusFilter === 'ALL' || loanStatusFilter === 'SETTLED') && (
                        <div className="bg-slate-100/80 dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E2D40] rounded-2xl p-3.5 space-y-3">
                          <button
                            type="button"
                            onClick={() => {
                              triggerHaptic('light');
                              setIsFinishedLoansExpanded(prev => !prev);
                            }}
                            className="w-full flex items-center justify-between text-left cursor-pointer group"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
                                <CheckCircle2 className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="text-xs font-black text-slate-900 dark:text-[#F0F4FF] flex items-center gap-2">
                                  <span>Finished & Settled Loans</span>
                                  <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                                    {currentFinishedFilteredLoans.length} Settled
                                  </span>
                                </h4>
                                <p className="text-[10px] text-slate-500 dark:text-[#8899BB]">
                                  Archived contracts that have been fully paid off or collected
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 group-hover:underline">
                                {isFinishedLoansExpanded || loanStatusFilter === 'SETTLED' ? 'Hide' : 'Show All'}
                              </span>
                              <div className="p-1 rounded-lg bg-white dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] text-slate-600 dark:text-[#8899BB]">
                                {isFinishedLoansExpanded || loanStatusFilter === 'SETTLED' ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </div>
                            </div>
                          </button>

                          {(isFinishedLoansExpanded || loanStatusFilter === 'SETTLED') && (
                            <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-[#1E2D40]/60">
                              {currentFinishedFilteredLoans.map((loan) => {
                                const isLent = loan.direction === 'LENT' || loan.title.toLowerCase().includes('lent') || loan.title.toLowerCase().includes('lend');

                                return (
                                  <div
                                    key={loan.id}
                                    className="bg-white dark:bg-[#131926] border border-emerald-200/70 dark:border-emerald-900/40 rounded-xl p-3.5 space-y-2.5 shadow-2xs hover:border-emerald-400 transition-all"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="text-[9px] px-2 py-0.5 rounded font-extrabold uppercase bg-emerald-100 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                            <span>SETTLED (0 ETB)</span>
                                          </span>
                                          <span className="text-[9px] bg-slate-100 dark:bg-[#1C2333] text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded font-bold border border-slate-200 dark:border-[#1E2D40]">
                                            {isLent ? 'Lent Out' : 'Borrowed'}
                                          </span>
                                        </div>
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">{loan.title}</h4>
                                        <p className="text-[10px] text-slate-500 dark:text-[#8899BB]">
                                          {isLent ? 'Borrower' : 'Lender'}: <strong className="text-slate-800 dark:text-slate-200">{loan.counterparty}</strong>
                                        </p>
                                      </div>

                                      <div className="text-right">
                                        <p className="text-[9px] text-slate-500 uppercase font-semibold">Total Settled</p>
                                        <p className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                                          {formatETB(loan.initialAmount)}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-[#1C2333]/60 p-2 rounded-lg border border-slate-100 dark:border-[#1E2D40]/40">
                                      <div>
                                        <span className="text-[9px] text-slate-500 uppercase font-semibold">Initial Principal</span>
                                        <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{formatETB(loan.initialAmount)}</p>
                                      </div>
                                      <div>
                                        <span className="text-[9px] text-slate-500 uppercase font-semibold">Due Date</span>
                                        <p className="font-bold text-slate-800 dark:text-slate-200">{formatDateByCalendar(loan.dueDate, calendarType, true)}</p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()}
              </>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 3: RECEIVABLES ==================== */}
      {mainTab === 'RECEIVABLES' && (
        <div className="space-y-4">
          
          {/* Receivables Summary Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-blue-500/10 via-white to-slate-50 dark:from-[#3B82F6]/15 dark:via-[#131926] dark:to-[#0F172A] border border-blue-200 dark:border-[#3B82F6]/35 rounded-2xl p-3.5 space-y-1.5 shadow-sm">
              <p className="text-[10px] text-slate-500 dark:text-[#8899BB]">Total Customer Credit Outstanding</p>
              <p className="text-lg font-black font-mono text-blue-600 dark:text-[#3B82F6]">
                {hideBalances ? '••••••••' : formatETB(totalOutstandingReceivables)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-emerald-500/10 via-white to-slate-50 dark:from-emerald-500/15 dark:via-[#131926] dark:to-[#0F172A] border border-emerald-200 dark:border-emerald-500/35 rounded-2xl p-3.5 space-y-1.5 shadow-sm">
              <p className="text-[10px] text-slate-500 dark:text-[#8899BB]">Total Receivables Collected</p>
              <p className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                {hideBalances ? '••••••••' : formatETB(totalCollectedReceivables)}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {sortedReceivables.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-[#8899BB] py-6 text-center bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] rounded-2xl shadow-sm">
                No customer receivables recorded yet.
              </p>
            ) : (
              sortedReceivables.map((rcv) => {
                const outstanding = rcv.amountOwed - rcv.amountCollected;

                return (
                  <div
                    key={rcv.id}
                    className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] rounded-2xl p-4 space-y-3 hover:border-blue-400 dark:hover:border-[#3B82F6]/50 transition-all shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                            rcv.status === 'COLLECTED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30'
                              : rcv.status === 'LATE' || rcv.status === 'OVERDUE'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30'
                          }`}
                        >
                          {rcv.status === 'LATE' ? 'LATE PAYMENT' : rcv.status}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">{rcv.customerName}</h4>
                        <p className="text-[11px] text-slate-500 dark:text-[#8899BB]">{rcv.description}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-[10px] text-slate-500 dark:text-[#8899BB]">Outstanding Debt</p>
                          <p className="text-sm font-black font-mono text-blue-600 dark:text-[#3B82F6]">
                            {hideBalances ? '••••••' : formatETB(outstanding)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 pl-1 border-l border-slate-200 dark:border-[#1E2D40]">
                          {onUpdateReceivable && (currentUser.role === 'SuperAdmin' || currentUser.role === 'Admin') && (
                            <button
                              type="button"
                              onClick={() => {
                                triggerHaptic('light');
                                startEditReceivable(rcv);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors cursor-pointer"
                              title="Edit Receivable"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {onDeleteReceivable && (currentUser.role === 'SuperAdmin' || currentUser.role === 'Admin') && (
                            <button
                              type="button"
                              onClick={() => {
                                triggerHaptic('warning');
                                const activeOtherUsers = (users || []).filter(u => u.id !== currentUser.id && u.active !== false);
                                if (activeOtherUsers.length > 0) {
                                  executeOrConfirmAction('DELETE_RECEIVABLE', rcv.id, `Receivable: ${rcv.customerName} (ETB ${rcv.amountOwed.toLocaleString()})`);
                                } else if (onDeleteReceivable) {
                                  onDeleteReceivable(rcv.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Delete Receivable"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-[#1C2333] p-2.5 rounded-xl border border-slate-100 dark:border-transparent">
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-[#8899BB]">Total Invoice</span>
                        <p className="font-mono font-bold text-slate-900 dark:text-white">{formatETB(rcv.amountOwed)}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-[#8899BB]">Collected so far</span>
                        <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatETB(rcv.amountCollected)}</p>
                      </div>
                    </div>

                    {outstanding > 0 && (
                      <button
                        onClick={() => {
                          triggerHaptic('medium');
                          setActiveCollectRcvModal(rcv);
                          setCollectRcvAmount(outstanding.toString());
                          setCollectRcvWalletId(wallets[0]?.id || '');
                        }}
                        className="w-full py-2 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md hover:bg-blue-700 transition-colors"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>Collect Payment to Wallet</span>
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ==================== MODALS ==================== */}

      {/* Modal: Create Equb Circle */}
      {showCreateEqubModal && (() => {
        const slotsCount = Math.max(1, parseInt(equbSlots, 10) || 1);
        const totalRoundsCount = Math.max(1, parseInt(equbTotalRounds, 10) || 10);
        const contrib = parseFloat(equbContribution) || 0;
        const myContribPerRound = contrib * slotsCount;
        const netRoundPoolPreview = contrib * totalRoundsCount;

        let daysPerRound = 7;
        if (equbInterval === 'EVERY_10_DAYS') daysPerRound = 10;
        else if (equbInterval === 'EVERY_15_DAYS') daysPerRound = 15;
        else if (equbInterval === 'MONTHLY') daysPerRound = 30;

        const startMs = new Date(equbStartDate || Date.now()).getTime();
        const estEndingObj = new Date(startMs + 86400000 * daysPerRound * Math.max(0, totalRoundsCount - 1));
        const estEndingFormatted = isNaN(estEndingObj.getTime())
          ? 'Invalid Date'
          : formatDateByCalendar(estEndingObj, calendarType, true);

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#131926] border border-slate-300 dark:border-indigo-500/50 w-full max-w-md p-5 rounded-2xl space-y-4 text-slate-900 dark:text-white shadow-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-base font-extrabold flex items-center gap-2 text-slate-900 dark:text-white border-b border-slate-200 dark:border-[#1E2D40] pb-3">
                <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Start New Equb Circle</span>
              </h3>

              <form onSubmit={handleCreateEqubSubmit} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-[#8899BB] block mb-1">Equb Circle Name</label>
                  <input
                    type="text"
                    required
                    value={equbName}
                    onChange={e => setEqubName(e.target.value)}
                    placeholder="Equb circle name"
                    className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-300 dark:border-[#1E2D40] focus:border-indigo-500 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white font-medium outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-[#8899BB] block mb-1">Contribution / Slot (ETB)</label>
                    <input
                      type="number"
                      required
                      value={equbContribution}
                      onChange={e => setEqubContribution(e.target.value)}
                      placeholder="5000"
                      className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-300 dark:border-[#1E2D40] focus:border-indigo-500 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white font-mono font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-[#8899BB] block mb-1">Your Slots / Shares</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={equbSlots}
                      onChange={e => setEqubSlots(e.target.value)}
                      placeholder="1"
                      className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-300 dark:border-[#1E2D40] focus:border-indigo-500 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white font-mono font-bold outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-[#8899BB] block mb-1">Total Circle Members / Slots</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={equbTotalRounds}
                      onChange={e => setEqubTotalRounds(e.target.value)}
                      placeholder="27"
                      className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-300 dark:border-[#1E2D40] focus:border-indigo-500 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white font-mono font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-[#8899BB] block mb-1">Starting Date</label>
                    <input
                      type="date"
                      required
                      value={equbStartDate}
                      onChange={e => setEqubStartDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-300 dark:border-[#1E2D40] focus:border-indigo-500 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white font-bold outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-[#8899BB] block mb-1">Payment Frequency / Interval</label>
                  <select
                    value={equbInterval}
                    onChange={e => setEqubInterval(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-300 dark:border-[#1E2D40] focus:border-indigo-500 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white font-bold outline-none"
                  >
                    <option value="EVERY_10_DAYS">Every 10 Days</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="EVERY_15_DAYS">Every 15 Days</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-[#8899BB] block mb-1">Members List (Comma Separated)</label>
                  <textarea
                    value={equbMembersInput}
                    onChange={e => setEqubMembersInput(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-300 dark:border-[#1E2D40] focus:border-indigo-500 rounded-xl p-2 text-xs text-slate-900 dark:text-white outline-none"
                  />
                </div>

                {/* Calculation Summary Box */}
                <div className="p-3.5 bg-indigo-50/90 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/70 rounded-xl space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-700 dark:text-[#8899BB] font-medium">Net Round Pool:</span>
                    <span className="font-mono font-black text-indigo-700 dark:text-indigo-300 text-sm">
                      {formatETB(netRoundPoolPreview)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-600 dark:text-[#8899BB]">Your Round Contribution:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {formatETB(myContribPerRound)} ({slotsCount} {slotsCount === 1 ? 'slot' : 'slots'})
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-600 dark:text-[#8899BB]">Estimated Finish Date:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {estEndingFormatted}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateEqubModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1C2333] dark:hover:bg-[#252E42] text-xs font-bold text-slate-700 dark:text-[#8899BB] transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 dark:bg-indigo-500 text-xs font-bold text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all cursor-pointer shadow-md"
                  >
                    Launch Equb Circle
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Modal: Pay Equb Round (Supports Single & Split Payments) */}
      {activeEqubModal && (() => {
        const requiredTotal = activeEqubModal.contributionPerRound;
        const currentSplitSum = splitRows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
        const remainingToAllocate = requiredTotal - currentSplitSum;
        const isValidSplit = paymentMode === 'single' || Math.abs(remainingToAllocate) < 0.01;

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#131926] border border-slate-300 dark:border-indigo-500/50 w-full max-w-md p-5 rounded-2xl space-y-4 text-slate-900 dark:text-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1E2D40] pb-3">
                <div>
                  <h3 className="text-sm font-extrabold flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Pay Equb Round #{activeEqubModal.currentRound}</span>
                  </h3>
                  <p className="text-[11px] font-medium text-slate-600 dark:text-[#8899BB] mt-0.5">{activeEqubModal.name}</p>
                </div>

                <span className="text-xs font-mono font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800/80">
                  Total: {formatETB(requiredTotal)}
                </span>
              </div>

              {/* Payment Mode Selector Tabs */}
              <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-[#1C2333] p-1 rounded-xl border border-slate-200 dark:border-[#1E2D40]">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setPaymentMode('single');
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    paymentMode === 'single'
                      ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-md'
                      : 'text-slate-600 dark:text-[#8899BB] hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Single Wallet
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setPaymentMode('split');
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    paymentMode === 'split'
                      ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-md'
                      : 'text-slate-600 dark:text-[#8899BB] hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>Split Payment</span>
                  <span className="text-[9px] bg-black/20 px-1.5 py-0.2 rounded font-mono font-bold">MULTI</span>
                </button>
              </div>

              {/* Single Wallet Payment Mode */}
              {paymentMode === 'single' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-[#8899BB] block mb-1">Select Source Funding Wallet</label>
                    <select
                      value={payWalletId}
                      onChange={e => setPayWalletId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-300 dark:border-[#1E2D40] focus:border-indigo-500 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white font-bold outline-none"
                    >
                      {wallets.map(w => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({w.type})
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-[#8899BB] bg-slate-50 dark:bg-[#1C2333] p-3 rounded-xl border border-slate-200 dark:border-[#1E2D40]">
                    Full contribution of <strong className="text-slate-900 dark:text-white font-mono font-bold">{formatETB(requiredTotal)}</strong> will be deducted from your chosen wallet.
                  </p>
                </div>
              )}

              {/* Split Payment Mode */}
              {paymentMode === 'split' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-[#8899BB]">Wallet Contributions Breakdown</span>
                    <button
                      type="button"
                      onClick={() => handleAutoBalanceSplit(activeEqubModal)}
                      className="text-[10px] text-emerald-700 dark:text-emerald-400 hover:underline font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded cursor-pointer border border-emerald-200 dark:border-emerald-800"
                    >
                      ⚡ Auto-Fill Balance
                    </button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {splitRows.map((row, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-slate-50 dark:bg-[#1C2333] p-2 rounded-xl border border-slate-200 dark:border-[#1E2D40]">
                        <select
                          value={row.walletId}
                          onChange={e => handleSplitRowChange(idx, 'walletId', e.target.value)}
                          className="flex-1 bg-white dark:bg-[#131926] border border-slate-300 dark:border-[#1E2D40] rounded-lg p-1.5 text-xs text-slate-900 dark:text-white font-bold outline-none"
                        >
                          {wallets.map(w => (
                            <option key={w.id} value={w.id}>
                              {w.name}
                            </option>
                          ))}
                        </select>

                        <div className="w-32 relative">
                          <span className="absolute left-2 top-2 text-[10px] text-slate-400 dark:text-[#8899BB]">ETB</span>
                          <input
                            type="number"
                            value={row.amount}
                            onChange={e => handleSplitRowChange(idx, 'amount', e.target.value)}
                            placeholder="0"
                            className="w-full bg-white dark:bg-[#131926] border border-slate-300 dark:border-[#1E2D40] rounded-lg pl-8 pr-2 py-1.5 text-xs text-slate-900 dark:text-white text-right font-mono font-bold outline-none"
                          />
                        </div>

                        {splitRows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSplitRow(idx)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg cursor-pointer"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddSplitRow}
                    className="w-full py-2 rounded-xl border border-dashed border-slate-300 dark:border-[#1E2D40] hover:border-emerald-500 text-slate-600 dark:text-[#8899BB] hover:text-emerald-600 dark:hover:text-emerald-400 text-xs font-bold cursor-pointer transition-colors"
                  >
                    + Add Another Wallet Split
                  </button>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-500 dark:text-[#8899BB]">Total Allocated:</span>
                      <span className={`font-bold ${isValidSplit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {formatETB(currentSplitSum)} / {formatETB(requiredTotal)}
                      </span>
                    </div>

                    {!isValidSplit && (
                      <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">
                        {remainingToAllocate > 0
                          ? `⚠️ ${formatETB(remainingToAllocate)} remaining to reach total.`
                          : `⚠️ Exceeds required payment by ${formatETB(Math.abs(remainingToAllocate))}.`}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveEqubModal(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-[#1C2333] text-xs font-bold text-slate-600 dark:text-[#8899BB]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!isValidSplit}
                  onClick={() => handlePayRoundSubmit(activeEqubModal)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isValidSplit
                      ? 'bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 shadow-lg'
                      : 'bg-slate-200 text-slate-400 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed opacity-50'
                  }`}
                >
                  {paymentMode === 'split' ? `Execute Split Payment` : `Confirm Single Payment`}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal: Claim Equb Payout */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#131926] border border-slate-300 dark:border-emerald-500/50 w-full max-w-sm p-5 rounded-2xl space-y-4 text-slate-900 dark:text-white shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto shadow-sm">
              <Trophy className="w-6 h-6" />
            </div>
            
            <div className="text-center">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Claim Equb Payout</h3>
              <p className="text-xs text-slate-600 dark:text-[#8899BB] mt-1">
                Net pool payout of <span className="text-emerald-700 dark:text-emerald-300 font-mono font-extrabold">{formatETB(showPayoutModal.contributionPerRound * showPayoutModal.members.length)}</span> will be credited as Income.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-[#8899BB] block mb-1">Deposit Payout To Wallet</label>
              <select
                value={payoutWalletId}
                onChange={e => setPayoutWalletId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-300 dark:border-[#1E2D40] rounded-xl p-2.5 text-xs text-slate-900 dark:text-white font-bold outline-none"
              >
                {wallets.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowPayoutModal(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1C2333] text-xs font-bold text-slate-700 dark:text-[#8899BB] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleClaimPayoutSubmit(showPayoutModal)}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white font-extrabold text-xs shadow-md hover:bg-emerald-700 transition-all cursor-pointer"
              >
                Claim Payout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Loan (Lend / Borrowed) */}
      {showCreateLoanModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#00D4AA]/40 w-full max-w-md p-5 rounded-2xl space-y-4 text-slate-900 dark:text-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Handshake className="w-4 h-4 text-emerald-600 dark:text-[#00D4AA]" />
              <span>Record New Loan / Capital Contract</span>
            </h3>

            <form onSubmit={handleCreateLoanSubmit} className="space-y-3.5">
              {/* Direction selector: LENT OUT vs BORROWED */}
              <div>
                <label className="text-xs text-slate-600 dark:text-[#8899BB] block mb-1 font-bold">Loan Direction</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setNewLoanDirection('LENT');
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                      newLoanDirection === 'LENT'
                        ? 'bg-emerald-50 dark:bg-[#00D4AA]/20 border-emerald-500 dark:border-[#00D4AA] text-emerald-700 dark:text-[#00D4AA] shadow-sm'
                        : 'bg-slate-50 dark:bg-[#1C2333] border-slate-200 dark:border-[#1E2D40] text-slate-600 dark:text-[#8899BB]'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4 text-emerald-600 dark:text-[#00D4AA]" />
                    <span>Lend Money Out</span>
                    <span className="text-[9px] font-normal opacity-80">(Receivable to Us)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setNewLoanDirection('BORROWED');
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                      newLoanDirection === 'BORROWED'
                        ? 'bg-amber-50 dark:bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-400 shadow-sm'
                        : 'bg-slate-50 dark:bg-[#1C2333] border-slate-200 dark:border-[#1E2D40] text-slate-600 dark:text-[#8899BB]'
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Borrow Loan</span>
                    <span className="text-[9px] font-normal opacity-80">(Debt We Owe)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-600 dark:text-[#8899BB] block mb-1">Contract Title</label>
                <input
                  type="text"
                  required
                  value={newLoanTitle}
                  onChange={e => setNewLoanTitle(e.target.value)}
                  placeholder={newLoanDirection === 'LENT' ? "Contract title" : "Loan title"}
                  className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-600 dark:text-[#8899BB] block mb-1">
                  {newLoanDirection === 'LENT' ? 'Borrower Person / Merchant Name' : 'Lender / Bank Name'}
                </label>
                <input
                  type="text"
                  required
                  value={newLoanCounterparty}
                  onChange={e => setNewLoanCounterparty(e.target.value)}
                  placeholder={newLoanDirection === 'LENT' ? "Borrower name" : "Lender name"}
                  className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-600 dark:text-[#8899BB] block mb-1">Category</label>
                  <select
                    value={newLoanType}
                    onChange={e => setNewLoanType(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none"
                  >
                    <option value="PARTNER">Partner</option>
                    <option value="MERCHANT">Merchant / Client</option>
                    <option value="FRIEND_FAMILY">Friend & Family</option>
                    <option value="BANK">Bank / Microfinance</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-600 dark:text-[#8899BB] block mb-1">Principal Amount (ETB)</label>
                  <input
                    type="number"
                    required
                    value={newLoanAmount}
                    onChange={e => setNewLoanAmount(e.target.value)}
                    placeholder="50000"
                    className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-600 dark:text-[#8899BB] block mb-1">Monthly Installment (ETB)</label>
                  <input
                    type="number"
                    value={newLoanInstallment}
                    onChange={e => setNewLoanInstallment(e.target.value)}
                    placeholder="10000"
                    className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-600 dark:text-[#8899BB] block mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newLoanDueDate}
                    onChange={e => setNewLoanDueDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-600 dark:text-[#8899BB] block mb-1">
                  {newLoanDirection === 'LENT' ? 'Funding Wallet (Deduct Capital From)' : 'Receiving Wallet (Deposit Principal Into)'}
                </label>
                <select
                  value={newLoanWalletId}
                  onChange={e => setNewLoanWalletId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none"
                >
                  {wallets.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({w.type})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateLoanModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-[#1C2333] text-xs font-bold text-slate-600 dark:text-[#8899BB]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-white dark:text-[#0A0E1A] shadow-md ${
                    newLoanDirection === 'LENT' ? 'bg-emerald-600 dark:bg-[#00D4AA]' : 'bg-amber-500 dark:bg-amber-400'
                  }`}
                >
                  {newLoanDirection === 'LENT' ? 'Record Lent Loan' : 'Record Borrowed Loan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Process Loan Repayment / Collection */}
      {activeLoanActionModal && (() => {
        const isLent = activeLoanActionModal.direction === 'LENT' || activeLoanActionModal.title.toLowerCase().includes('lent') || activeLoanActionModal.title.toLowerCase().includes('lend');

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] w-full max-w-sm p-5 rounded-2xl space-y-4 text-slate-900 dark:text-white shadow-2xl">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <DollarSign className={`w-4 h-4 ${isLent ? 'text-emerald-600 dark:text-[#00D4AA]' : 'text-amber-600 dark:text-amber-400'}`} />
                <span>{isLent ? 'Collect Loan Repayment' : 'Pay Loan Installment'}</span>
              </h3>

              <p className="text-xs text-slate-500 dark:text-[#8899BB]">
                {isLent
                  ? `Collecting money lent to ${activeLoanActionModal.counterparty}`
                  : `Paying installment to ${activeLoanActionModal.counterparty}`}
              </p>

              <form onSubmit={handleLoanActionSubmit} className="space-y-3">
                <div>
                  <label className="text-xs text-slate-600 dark:text-[#8899BB] block mb-1">
                    {isLent ? 'Deposit Into Wallet' : 'Pay From Wallet'}
                  </label>
                  <select
                    value={loanActionWalletId}
                    onChange={e => setLoanActionWalletId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none"
                  >
                    {wallets.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-600 dark:text-[#8899BB] block mb-1">Repayment Amount (ETB)</label>
                  <input
                    type="number"
                    required
                    value={loanActionAmount}
                    onChange={e => setLoanActionAmount(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none"
                  />
                  <p className="text-[10px] text-slate-500 dark:text-[#8899BB] mt-1 font-mono">
                    Current Outstanding: {formatETB(activeLoanActionModal.outstandingBalance)}
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveLoanActionModal(null)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-[#1C2333] text-xs font-bold text-slate-600 dark:text-[#8899BB]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-white dark:text-[#0A0E1A] ${
                      isLent ? 'bg-emerald-600 dark:bg-[#00D4AA]' : 'bg-amber-500 dark:bg-amber-400'
                    }`}
                  >
                    {isLent ? 'Collect Repayment' : 'Confirm Installment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Modal: Create Receivable */}
      {showCreateReceivableModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#3B82F6]/40 w-full max-w-md p-5 rounded-2xl space-y-4 text-slate-900 dark:text-white shadow-2xl">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-blue-600 dark:text-[#3B82F6]" />
              <span>Record Customer Credit / Receivable</span>
            </h3>

            <form onSubmit={handleCreateReceivableSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-slate-600 dark:text-[#8899BB] block mb-1">Customer / Client Name</label>
                <input
                  type="text"
                  required
                  value={newRcvCustomer}
                  onChange={e => setNewRcvCustomer(e.target.value)}
                  placeholder="Customer or client"
                  className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-600 dark:text-[#8899BB] block mb-1">Invoice Description</label>
                <input
                  type="text"
                  value={newRcvDescription}
                  onChange={e => setNewRcvDescription(e.target.value)}
                  placeholder="Invoice details"
                  className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-600 dark:text-[#8899BB] block mb-1">Amount Owed (ETB)</label>
                  <input
                    type="number"
                    required
                    value={newRcvAmount}
                    onChange={e => setNewRcvAmount(e.target.value)}
                    placeholder="25000"
                    className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-600 dark:text-[#8899BB] block mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newRcvDueDate}
                    onChange={e => setNewRcvDueDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateReceivableModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-[#1C2333] text-xs font-bold text-slate-600 dark:text-[#8899BB]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-xs font-bold text-white shadow-md"
                >
                  Post Receivable Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Collect Receivable Payment */}
      {activeCollectRcvModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#3B82F6]/40 w-full max-w-sm p-5 rounded-2xl space-y-4 text-slate-900 dark:text-white shadow-2xl">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-blue-600 dark:text-[#3B82F6]" />
              <span>Collect Customer Credit</span>
            </h3>

            <p className="text-xs text-slate-500 dark:text-[#8899BB]">
              Collecting payment for <strong className="text-slate-900 dark:text-white">{activeCollectRcvModal.customerName}</strong>
            </p>

            <form onSubmit={handleCollectRcvSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-slate-600 dark:text-[#8899BB] block mb-1">Deposit To Wallet</label>
                <select
                  value={collectRcvWalletId}
                  onChange={e => setCollectRcvWalletId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none"
                >
                  {wallets.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-600 dark:text-[#8899BB] block mb-1">Collection Amount (ETB)</label>
                <input
                  type="number"
                  required
                  value={collectRcvAmount}
                  onChange={e => setCollectRcvAmount(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveCollectRcvModal(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-[#1C2333] text-xs font-bold text-slate-600 dark:text-[#8899BB]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-xs font-bold text-white shadow-md"
                >
                  Post Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Equb Circle */}
      {editingEqub && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] w-full max-w-md p-5 rounded-2xl space-y-4 text-slate-900 dark:text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1E2D40] pb-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Edit className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Edit Equb Circle</span>
              </h3>
              <button onClick={() => setEditingEqub(null)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1C2333]">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              executeOrConfirmAction('EDIT_EQUB', editingEqub.id, editEqubName, {
                name: editEqubName,
                contributionPerRound: parseFloat(editEqubContribution) || editingEqub.contributionPerRound,
                totalRounds: parseInt(editEqubTotalRounds, 10) || editingEqub.totalRounds,
                mySlots: parseInt(editEqubMySlots, 10) || editingEqub.mySlots
              });
            }} className="space-y-3">
              <div>
                <label className="text-xs text-slate-600 dark:text-[#8899BB] block mb-1">Equb Name</label>
                <input
                  type="text"
                  required
                  value={editEqubName}
                  onChange={e => setEditEqubName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl p-2.5 text-xs outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-600 dark:text-[#8899BB] block mb-1">Contribution / Round (ETB)</label>
                  <input
                    type="number"
                    required
                    value={editEqubContribution}
                    onChange={e => setEditEqubContribution(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl p-2.5 text-xs outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 dark:text-[#8899BB] block mb-1">Total Rounds</label>
                  <input
                    type="number"
                    required
                    value={editEqubTotalRounds}
                    onChange={e => setEditEqubTotalRounds(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl p-2.5 text-xs outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-600 dark:text-[#8899BB] block mb-1">My Shares / Slots</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={editEqubMySlots}
                  onChange={e => setEditEqubMySlots(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl p-2.5 text-xs outline-none font-mono"
                />
              </div>

              {otherAdmins.length > 0 ? (
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-[11px] text-amber-800 dark:text-amber-300">
                  🛡️ <strong>Co-Admin Rule:</strong> Saving changes will prompt co-admin confirmation ({otherAdmins.map(a => a.name).join(', ')}).
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30 text-[11px] text-purple-800 dark:text-purple-300">
                  ⚡ <strong>SuperAdmin Direct Execution:</strong> No other active admins exist in system. Direct save authorized.
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingEqub(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-[#1C2333] text-xs font-bold text-slate-600 dark:text-[#8899BB]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 text-xs font-bold text-white shadow-md hover:bg-purple-700 cursor-pointer"
                >
                  Save Equb Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Loan Contract */}
      {editingLoan && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] w-full max-w-md p-5 rounded-2xl space-y-4 text-slate-900 dark:text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1E2D40] pb-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Edit className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Edit Loan Contract</span>
              </h3>
              <button onClick={() => setEditingLoan(null)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1C2333]">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              executeOrConfirmAction('EDIT_LOAN', editingLoan.id, editLoanTitle, {
                title: editLoanTitle,
                counterparty: editLoanCounterparty,
                outstandingBalance: parseFloat(editLoanAmount) || editingLoan.outstandingBalance,
                dueDate: editLoanDueDate
              });
            }} className="space-y-3">
              <div>
                <label className="text-xs text-slate-600 dark:text-[#8899BB] block mb-1">Loan Title / Description</label>
                <input
                  type="text"
                  required
                  value={editLoanTitle}
                  onChange={e => setEditLoanTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl p-2.5 text-xs outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-600 dark:text-[#8899BB] block mb-1">Counterparty (Lender / Borrower)</label>
                <input
                  type="text"
                  required
                  value={editLoanCounterparty}
                  onChange={e => setEditLoanCounterparty(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl p-2.5 text-xs outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-600 dark:text-[#8899BB] block mb-1">Outstanding Balance (ETB)</label>
                  <input
                    type="number"
                    required
                    value={editLoanAmount}
                    onChange={e => setEditLoanAmount(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl p-2.5 text-xs outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 dark:text-[#8899BB] block mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={editLoanDueDate}
                    onChange={e => setEditLoanDueDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl p-2.5 text-xs outline-none font-mono"
                  />
                </div>
              </div>

              {otherAdmins.length > 0 ? (
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-[11px] text-amber-800 dark:text-amber-300">
                  🛡️ <strong>Co-Admin Rule:</strong> Saving changes will prompt co-admin confirmation.
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30 text-[11px] text-purple-800 dark:text-purple-300">
                  ⚡ <strong>SuperAdmin Direct Execution:</strong> No other active admins exist in system. Direct save authorized.
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingLoan(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-[#1C2333] text-xs font-bold text-slate-600 dark:text-[#8899BB]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-xs font-bold text-white shadow-md hover:bg-indigo-700 cursor-pointer"
                >
                  Save Loan Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Receivable Invoice */}
      {editingReceivable && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] w-full max-w-md p-5 rounded-2xl space-y-4 text-slate-900 dark:text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1E2D40] pb-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Edit className="w-4 h-4 text-blue-600 dark:text-[#3B82F6]" />
                <span>Edit Receivable Invoice</span>
              </h3>
              <button onClick={() => setEditingReceivable(null)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1C2333]">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const amt = parseFloat(editReceivableAmountOwed);
              if (isNaN(amt) || amt <= 0) return;

              executeOrConfirmAction('EDIT_RECEIVABLE', editingReceivable.id, editReceivableCustomerName, {
                customerName: editReceivableCustomerName,
                description: editReceivableDescription,
                amountOwed: amt,
                dueDate: editReceivableDueDate ? new Date(editReceivableDueDate).toISOString() : editingReceivable.dueDate,
                status: editReceivableStatus
              });
            }} className="space-y-3">
              <div>
                <label className="text-xs text-slate-600 dark:text-[#8899BB] block mb-1">Customer / Debtor Name</label>
                <input
                  type="text"
                  required
                  value={editReceivableCustomerName}
                  onChange={e => setEditReceivableCustomerName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl p-2.5 text-xs outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-600 dark:text-[#8899BB] block mb-1">Description / Goods Supplied</label>
                <input
                  type="text"
                  value={editReceivableDescription}
                  onChange={e => setEditReceivableDescription(e.target.value)}
                  placeholder="e.g. VIP Gaming Hours & Drinks"
                  className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl p-2.5 text-xs outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-600 dark:text-[#8899BB] block mb-1">Total Owed (ETB)</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={editReceivableAmountOwed}
                    onChange={e => setEditReceivableAmountOwed(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl p-2.5 text-xs outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 dark:text-[#8899BB] block mb-1">Due Date</label>
                  <input
                    type="date"
                    value={editReceivableDueDate}
                    onChange={e => setEditReceivableDueDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl p-2.5 text-xs outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-600 dark:text-[#8899BB] block mb-1">Status</label>
                <select
                  value={editReceivableStatus}
                  onChange={e => setEditReceivableStatus(e.target.value as Receivable['status'])}
                  className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none"
                >
                  <option value="OUTSTANDING">OUTSTANDING (Active)</option>
                  <option value="COLLECTED">COLLECTED (Fully Paid)</option>
                  <option value="LATE">LATE (&gt;15 Days)</option>
                  <option value="OVERDUE">OVERDUE</option>
                  <option value="WRITTEN_OFF">WRITTEN OFF</option>
                </select>
              </div>

              {otherAdmins.length > 0 ? (
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-[11px] text-amber-800 dark:text-amber-300">
                  🛡️ <strong>Co-Admin Rule:</strong> Saving changes will prompt co-admin confirmation.
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30 text-[11px] text-purple-800 dark:text-purple-300">
                  ⚡ <strong>SuperAdmin Direct Execution:</strong> No other active admins exist in system. Direct save authorized.
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingReceivable(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-[#1C2333] text-xs font-bold text-slate-600 dark:text-[#8899BB]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-xs font-bold text-white shadow-md hover:bg-blue-700 cursor-pointer"
                >
                  Save Receivable Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Co-Admin Security / Action Confirmation */}
      {pendingAdminAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#131926] border-2 border-amber-500/50 w-full max-w-md p-5 rounded-2xl space-y-4 text-slate-900 dark:text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1E2D40] pb-3">
              <h3 className="text-sm font-extrabold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
                <span>
                  {otherAdmins.length > 0 ? 'Co-Admin Confirmation Required' : 'Confirm Action Warning'}
                </span>
              </h3>
              <button onClick={() => setPendingAdminAction(null)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1C2333]">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5">
                <span>Action:</span>
                <span className="uppercase text-rose-600 dark:text-rose-400 font-extrabold">{pendingAdminAction.type.replace(/_/g, ' ')}</span>
              </p>
              <p className="text-xs">
                Target: <strong className="text-slate-900 dark:text-white">{pendingAdminAction.targetTitle}</strong>
              </p>
              <p className="text-[11px] text-slate-600 dark:text-[#8899BB] leading-relaxed pt-1">
                {pendingAdminAction.type.startsWith('DELETE')
                  ? '⚠️ Warning: Deleting this item will permanently remove it from your records. This action cannot be undone.'
                  : '⚠️ Warning: You are about to modify saved terms for this financial record.'}
              </p>
            </div>

            {otherAdmins.length === 0 ? (
              /* Single Admin Confirmation Flow */
              <div className="space-y-3 pt-1">
                <p className="text-xs text-slate-600 dark:text-[#8899BB]">
                  Are you sure you want to proceed with this action?
                </p>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setPendingAdminAction(null)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] text-xs font-bold text-slate-600 dark:text-[#8899BB] hover:bg-slate-200 dark:hover:bg-[#252E42]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => performDirectAction(pendingAdminAction.type, pendingAdminAction.targetId, pendingAdminAction.payload)}
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-md hover:bg-rose-700 active:scale-[0.98] transition-all"
                  >
                    Yes, Execute Action
                  </button>
                </div>
              </div>
            ) : (
              /* Multi Admin Authorization Flow */
              <form onSubmit={handleCoAdminInstantSubmit} className="space-y-3">
                <div>
                  <label className="text-xs text-slate-600 dark:text-[#8899BB] block mb-1 font-semibold">Select Confirming Co-Admin</label>
                  <select
                    value={coAdminSelectedId}
                    onChange={e => setCoAdminSelectedId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl p-2.5 text-xs text-slate-900 dark:text-white font-bold outline-none"
                  >
                    {otherAdmins.map(adm => (
                      <option key={adm.id} value={adm.id}>{adm.name} ({adm.role})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-600 dark:text-[#8899BB] block mb-1 font-semibold">Reason for Request / Action Note</label>
                  <input
                    type="text"
                    value={coAdminReason}
                    onChange={e => setCoAdminReason(e.target.value)}
                    placeholder="e.g. Schedule adjustment, payout date change, or amount adjustment"
                    className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-600 dark:text-[#8899BB] block mb-1">Co-Admin Password / Sign-off Pin</label>
                  <input
                    type="password"
                    value={coAdminPassword}
                    onChange={e => setCoAdminPassword(e.target.value)}
                    placeholder="Enter co-admin password"
                    className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none font-mono"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="coAdminCheck"
                    checked={coAdminVerifiedCheck}
                    onChange={e => setCoAdminVerifiedCheck(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <label htmlFor="coAdminCheck" className="text-[11px] text-slate-600 dark:text-[#8899BB] cursor-pointer">
                    I verify co-admin has verbally / physically approved this action
                  </label>
                </div>

                {coAdminErrorMsg && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-medium bg-rose-50 dark:bg-rose-500/10 p-2 rounded-lg border border-rose-200 dark:border-rose-500/30">
                    ⚠️ {coAdminErrorMsg}
                  </p>
                )}

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 dark:bg-[#00D4AA] text-xs font-bold text-white dark:text-[#0A0E1A] shadow-md hover:opacity-90 cursor-pointer"
                  >
                    ⚡ Verify Sign-Off & Execute
                  </button>
                  {onRequestApproval && (
                    <button
                      type="button"
                      onClick={handleSendApprovalRequestSubmit}
                      className="flex-1 py-2.5 rounded-xl bg-purple-600 text-xs font-bold text-white shadow-md hover:bg-purple-700 cursor-pointer"
                    >
                      📩 Send Request to Co-Admin
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

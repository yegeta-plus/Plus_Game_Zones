import React, { useState } from 'react';
import {
  Wallet as WalletIcon,
  Plus,
  ArrowRightLeft,
  Building2,
  Smartphone,
  Banknote,
  Vault,
  CreditCard,
  History,
  Check,
  Globe,
  DollarSign,
  Palette,
  Trash2,
  Zap,
  ShieldCheck,
  Upload,
  Image,
  X
} from 'lucide-react';
import { Wallet, Transaction, Transfer, UserProfile, TransactionType } from '../../types';
import { calculateWalletBalance, formatETB } from '../../lib/store';
import { triggerHaptic } from '../../lib/haptics';
import { TelebirrIntegrationModal } from './TelebirrIntegrationModal';
import { ShegerPayVerificationModal } from './ShegerPayVerificationModal';
import { BrandLogo } from '../common/BrandLogo';

interface WalletsViewProps {
  wallets: Wallet[];
  transactions: Transaction[];
  transfers: Transfer[];
  users?: UserProfile[];
  currentUser: UserProfile;
  hideBalances: boolean;
  onOpenTransferModal: () => void;
  onOpenQuickEntry?: (walletId?: string) => void;
  onAddWallet: (wallet: Omit<Wallet, 'id' | 'totalIn' | 'totalOut'>) => void;
  onUpdateWallet?: (walletId: string, updates: Partial<Wallet>) => void;
  onDeleteWallet?: (walletId: string) => void;
  onAddTransaction?: (data: {
    type: TransactionType;
    amount: number;
    walletId: string;
    category: string;
    description: string;
    date: string;
  }) => void;
  onBatchPostTransactions?: (items: Array<{
    type: TransactionType;
    amount: number;
    walletId: string;
    category: string;
    description: string;
    date: string;
  }>) => void;
}

const COLOR_PALETTE = [
  { name: 'Telebirr Cyan', hex: '#00D4AA' },
  { name: 'CBE Royal Blue', hex: '#3B82F6' },
  { name: 'Cash Emerald', hex: '#10B981' },
  { name: 'Gold Amber', hex: '#F5A623' },
  { name: 'Violet Purple', hex: '#8B5CF6' },
  { name: 'Crimson Red', hex: '#EF4444' },
  { name: 'Hot Pink', hex: '#EC4899' },
  { name: 'Bright Orange', hex: '#F97316' },
  { name: 'Deep Indigo', hex: '#6366F1' },
  { name: 'Ocean Cyan', hex: '#06B6D4' }
];

const DEFAULT_TYPE_COLORS: Record<Wallet['type'], string> = {
  CASH: '#F97316',      // Orange background
  CBE_BANK: '#8B5CF6',  // Purple background
  TELEBIRR: '#0EA5E9',  // Light Blue background
  EBIRR: '#10B981',     // Green background
  SAVINGS: '#3B82F6',
  OTHER: '#06B6D4'
};

export const WalletsView: React.FC<WalletsViewProps> = ({
  wallets,
  transactions,
  transfers,
  users = [],
  currentUser,
  hideBalances,
  onOpenTransferModal,
  onOpenQuickEntry,
  onAddWallet,
  onUpdateWallet,
  onDeleteWallet,
  onAddTransaction,
  onBatchPostTransactions
}) => {
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(wallets[0]?.id || null);
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'DIGITAL' | 'CASH'>('ALL');
  
  // Integration Modal state
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);
  const [showShegerModal, setShowShegerModal] = useState(false);
  
  // Create Wallet Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletType, setNewWalletType] = useState<Wallet['type']>('TELEBIRR');
  const [newWalletAccNum, setNewWalletAccNum] = useState('');
  const [newWalletBal, setNewWalletBal] = useState('');
  const [newWalletColor, setNewWalletColor] = useState('#00D4AA');
  const [newCustomLogoUrl, setNewCustomLogoUrl] = useState('');

  // Edit Wallet Modal state
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<Wallet['type']>('TELEBIRR');
  const [editColor, setEditColor] = useState('#00D4AA');
  const [editAccNum, setEditAccNum] = useState('');
  const [editCustomLogoUrl, setEditCustomLogoUrl] = useState('');

  // Delete Wallet Confirmation Modal state
  const [deletingWallet, setDeletingWallet] = useState<Wallet | null>(null);
  const [selectedApproverId, setSelectedApproverId] = useState<string>('');
  const [approvalConfirmed, setApprovalConfirmed] = useState<boolean>(false);
  const [approverPassword, setApproverPassword] = useState<string>('');
  const [approvalError, setApprovalError] = useState<string>('');

  const otherActiveUsers = users.filter(u => u.id !== currentUser.id && u.active);

  const openEditModal = (w: Wallet) => {
    triggerHaptic('light');
    setEditingWallet(w);
    setEditName(w.name);
    setEditType(w.type);
    setEditAccNum(w.accountNumber || '');
    setEditColor(w.color);
    setEditCustomLogoUrl(w.customLogoUrl || '');
  };

  const openDeleteModal = (w: Wallet) => {
    triggerHaptic('medium');
    setDeletingWallet(w);
    setSelectedApproverId(otherActiveUsers[0]?.id || '');
    setApprovalConfirmed(false);
    setApproverPassword('');
    setApprovalError('');
  };

  // Selected wallet for activity ledger
  const selectedWallet = wallets.find(w => w.id === selectedWalletId);
  const selectedBal = selectedWallet ? calculateWalletBalance(selectedWallet, transactions, transfers) : 0;

  // Wallet balances summary calculations
  const totalNetBalance = wallets.reduce(
    (sum, w) => sum + calculateWalletBalance(w, transactions, transfers),
    0
  );

  const digitalWallets = wallets.filter(w => w.type !== 'CASH');
  const cashWallets = wallets.filter(w => w.type === 'CASH');

  const totalDigitalAmount = digitalWallets.reduce(
    (sum, w) => sum + calculateWalletBalance(w, transactions, transfers),
    0
  );

  const totalCashAmount = cashWallets.reduce(
    (sum, w) => sum + calculateWalletBalance(w, transactions, transfers),
    0
  );

  // Filter wallets for grid display
  const filteredWallets = wallets.filter(w => {
    if (categoryFilter === 'DIGITAL') return w.type !== 'CASH';
    if (categoryFilter === 'CASH') return w.type === 'CASH';
    return true;
  });

  // Filter transactions for selected wallet (sorted latest first)
  const walletTxs = selectedWallet
    ? transactions
        .filter(tx => tx.walletId === selectedWallet.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  const handleLogoFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setLogoUrl: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert('File size must be under 3MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          triggerHaptic('success');
          setLogoUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTypeChange = (type: Wallet['type']) => {
    setNewWalletType(type);
    setNewWalletColor(DEFAULT_TYPE_COLORS[type] || '#00D4AA');
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWalletName.trim()) return;

    triggerHaptic('success');
    let defaultIcon = 'Building2';
    if (newWalletType === 'TELEBIRR') defaultIcon = 'Smartphone';
    else if (newWalletType === 'CASH') defaultIcon = 'Banknote';
    else if (newWalletType === 'EBIRR') defaultIcon = 'CreditCard';
    else if (newWalletType === 'SAVINGS') defaultIcon = 'Vault';

    onAddWallet({
      name: newWalletName.trim(),
      type: newWalletType,
      accountNumber: newWalletAccNum.trim() || undefined,
      openingBalance: parseFloat(newWalletBal) || 0,
      color: newWalletColor,
      iconName: defaultIcon,
      customLogoUrl: newCustomLogoUrl.trim() || undefined
    });

    setShowAddModal(false);
    setNewWalletName('');
    setNewWalletAccNum('');
    setNewWalletBal('');
    setNewWalletColor('#00D4AA');
    setNewCustomLogoUrl('');
  };

  const handleSaveEditWallet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWallet || !onUpdateWallet) return;

    triggerHaptic('success');
    let defaultIcon = editingWallet.iconName;
    if (editType === 'TELEBIRR') defaultIcon = 'Smartphone';
    else if (editType === 'CASH') defaultIcon = 'Banknote';
    else if (editType === 'EBIRR') defaultIcon = 'CreditCard';
    else if (editType === 'SAVINGS') defaultIcon = 'Vault';
    else if (editType === 'CBE_BANK') defaultIcon = 'Building2';

    onUpdateWallet(editingWallet.id, {
      name: editName.trim() || editingWallet.name,
      type: editType,
      color: editColor,
      accountNumber: editAccNum.trim() || undefined,
      iconName: defaultIcon,
      customLogoUrl: editCustomLogoUrl.trim() || undefined
    });

    setEditingWallet(null);
  };

  const getWalletIcon = (type: Wallet['type'], color: string, customLogoUrl?: string) => {
    return <BrandLogo type={type} size="sm" customColor={color} customLogoUrl={customLogoUrl} />;
  };

  return (
    <div className="space-y-4 pb-24">
      
      {/* Title & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-[#F0F4FF]">Business Wallets</h2>
          <p className="text-xs text-slate-500 dark:text-[#8899BB] mt-0.5">Multi-account liquid capital breakdown</p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
          {currentUser.role === 'SuperAdmin' && (
            <>
              <button
                onClick={() => {
                  triggerHaptic('medium');
                  setShowShegerModal(true);
                }}
                className="px-3 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md hover:brightness-110 transition-all border border-blue-400/30"
              >
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Verify ShegerPay FT</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic('medium');
                  setShowIntegrationModal(true);
                }}
                className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md hover:brightness-110 transition-all border border-emerald-400/30"
              >
                <Zap className="w-3.5 h-3.5 fill-current shrink-0" />
                <span className="truncate">Bank Sync</span>
              </button>
            </>
          )}

          <button
            onClick={() => {
              triggerHaptic('light');
              onOpenTransferModal();
            }}
            className="px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md hover:bg-blue-700 transition-colors"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 shrink-0" />
            <span>Transfer</span>
          </button>
          
          {(currentUser.role === 'SuperAdmin' || currentUser.role === 'Admin') && (
            <button
              onClick={() => {
                triggerHaptic('light');
                setShowAddModal(true);
              }}
              className="col-span-2 sm:col-span-1 px-3 py-2 rounded-xl bg-gradient-to-r from-[#00D4AA] to-[#00B894] text-[#0A0E1A] text-xs font-bold flex items-center justify-center gap-1 cursor-pointer shadow-md hover:brightness-110 transition-all"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span>Add New Wallet</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. Digital & Cash Capital Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

        {/* Total Digital Money Summary Card */}
        <div className="bg-gradient-to-br from-[#00D4AA]/15 via-white to-slate-50 dark:via-[#131926] dark:to-[#0F172A] border border-[#00D4AA]/35 rounded-2xl p-3.5 space-y-2 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#00D4AA]/10 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#00D4AA]/20 border border-[#00D4AA]/40 flex items-center justify-center text-[#00D4AA]">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                  <span>Digital Money</span>
                  <span className="text-[9px] bg-[#00D4AA]/20 text-[#00D4AA] border border-[#00D4AA]/30 px-1.5 py-0.2 rounded font-mono font-bold">
                    {digitalWallets.length} ACCTS
                  </span>
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-[#8899BB]">Telebirr, CBE Bank, E-birr</p>
              </div>
            </div>
            <Globe className="w-4 h-4 text-[#00D4AA]/70" />
          </div>

          <div className="pt-1 relative z-10">
            <p className="text-[10px] text-slate-500 dark:text-[#8899BB]">Total Digital Capital</p>
            <p className="text-lg font-black font-mono text-[#00D4AA]">
              {hideBalances ? '••••••••' : formatETB(totalDigitalAmount)}
            </p>
          </div>
        </div>

        {/* Total Cash Money Summary Card */}
        <div className="bg-gradient-to-br from-emerald-500/15 via-white to-slate-50 dark:via-[#131926] dark:to-[#0F172A] border border-emerald-500/35 rounded-2xl p-3.5 space-y-2 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Banknote className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                  <span>Cash Money</span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-mono font-bold">
                    {cashWallets.length} CASH
                  </span>
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-[#8899BB]">Physical register & drawer</p>
              </div>
            </div>
            <DollarSign className="w-4 h-4 text-emerald-600/70 dark:text-emerald-400/70" />
          </div>

          <div className="pt-1 relative z-10">
            <p className="text-[10px] text-slate-500 dark:text-[#8899BB]">Total Physical Cash</p>
            <p className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
              {hideBalances ? '••••••••' : formatETB(totalCashAmount)}
            </p>
          </div>
        </div>

        {/* Total Net Liquidity Card */}
        <div className="bg-gradient-to-br from-blue-500/15 via-white to-slate-50 dark:via-[#131926] dark:to-[#0F172A] border border-blue-500/35 rounded-2xl p-3.5 space-y-2 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Vault className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                  <span>Net Liquidity</span>
                  <span className="text-[9px] bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30 px-1.5 py-0.2 rounded font-mono font-bold">
                    COMBINED
                  </span>
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-[#8899BB]">Digital + Cash Liquid Pool</p>
              </div>
            </div>
          </div>

          <div className="pt-1 relative z-10">
            <p className="text-[10px] text-slate-500 dark:text-[#8899BB]">Grand Total Capital</p>
            <p className="text-lg font-black font-mono text-slate-900 dark:text-white">
              {hideBalances ? '••••••••' : formatETB(totalNetBalance)}
            </p>
          </div>
        </div>

      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#131926] p-1 rounded-xl border border-slate-200 dark:border-[#1E2D40] w-fit">
        <button
          onClick={() => {
            triggerHaptic('light');
            setCategoryFilter('ALL');
          }}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
            categoryFilter === 'ALL'
              ? 'bg-white dark:bg-[#1C2333] text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-[#1E2D40]'
              : 'text-slate-600 dark:text-[#8899BB] hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          All Accounts ({wallets.length})
        </button>

        <button
          onClick={() => {
            triggerHaptic('light');
            setCategoryFilter('DIGITAL');
          }}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
            categoryFilter === 'DIGITAL'
              ? 'bg-[#00D4AA]/20 text-[#00D4AA] border border-[#00D4AA]/40 shadow-sm'
              : 'text-slate-600 dark:text-[#8899BB] hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Smartphone className="w-3 h-3" />
          <span>Digital Money ({digitalWallets.length})</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic('light');
            setCategoryFilter('CASH');
          }}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
            categoryFilter === 'CASH'
              ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40 shadow-sm'
              : 'text-slate-600 dark:text-[#8899BB] hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Banknote className="w-3 h-3" />
          <span>Cash ({cashWallets.length})</span>
        </button>
      </div>

      {/* Wallet Cards Grid with Custom Color Styling */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredWallets.map((w) => {
          const bal = calculateWalletBalance(w, transactions, transfers);
          const isSelected = w.id === selectedWalletId;
          const isDigital = w.type !== 'CASH';

          return (
            <div
              key={w.id}
              onClick={() => {
                triggerHaptic('light');
                setSelectedWalletId(w.id);
              }}
              style={{
                borderColor: isSelected ? w.color : `${w.color}40`,
                boxShadow: isSelected ? `0 4px 20px ${w.color}25` : `0 2px 8px ${w.color}08`
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group hover:scale-[1.01] bg-white dark:bg-[#131926] ${
                isSelected ? 'ring-1' : ''
              }`}
            >
              {/* Radial gradient glow tailored to wallet color */}
              <div
                className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl pointer-events-none opacity-20 transition-opacity group-hover:opacity-35"
                style={{ backgroundColor: w.color }}
              />

              {/* Left accent color bar */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                style={{ backgroundColor: w.color }}
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white border transition-transform group-hover:scale-105"
                    style={{
                      backgroundColor: `${w.color}20`,
                      borderColor: `${w.color}40`
                    }}
                  >
                    {getWalletIcon(w.type, w.color, w.customLogoUrl)}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xs font-bold text-slate-900 dark:text-[#F0F4FF]">{w.name}</h3>
                      <span
                        className="text-[8px] font-mono font-bold px-1.5 py-0.2 rounded-full border"
                        style={{
                          backgroundColor: isDigital ? '#00D4AA15' : '#22C55E15',
                          color: isDigital ? '#00D4AA' : '#16A34A',
                          borderColor: isDigital ? '#00D4AA35' : '#22C55E35'
                        }}
                      >
                        {isDigital ? 'DIGITAL' : 'CASH'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-[#8899BB] font-mono mt-0.5">
                      {w.accountNumber || w.type}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Edit wallet button */}
                  {onUpdateWallet && (currentUser.role === 'SuperAdmin' || currentUser.role === 'Admin') && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(w);
                      }}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] text-slate-500 dark:text-[#8899BB] hover:text-slate-900 dark:hover:text-white transition-colors"
                      title="Edit Wallet Settings"
                    >
                      <Palette className="w-3 h-3" style={{ color: w.color }} />
                    </button>
                  )}

                  {/* Delete wallet button */}
                  {onDeleteWallet && (currentUser.role === 'SuperAdmin' || currentUser.role === 'Admin') && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteModal(w);
                      }}
                      className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors"
                      title="Delete / Remove Wallet"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}

                  <div
                    className="w-3.5 h-3.5 rounded-full border border-slate-200 dark:border-white/30 shadow-sm"
                    style={{ backgroundColor: w.color }}
                    title={`Theme: ${w.color}`}
                  />
                </div>
              </div>

              <div className="mt-3.5 flex items-end justify-between">
                <div>
                  <p className="text-[10px] text-slate-500 dark:text-[#8899BB]">Computed Balance</p>
                  <p
                    className="text-lg font-black font-mono mt-0.5"
                    style={{ color: w.color }}
                  >
                    {hideBalances ? '••••••••' : formatETB(bal)}
                  </p>
                </div>

                {isSelected && (
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] text-slate-800 dark:text-white flex items-center gap-1">
                    <Check className="w-3 h-3 text-[#00D4AA]" /> Selected
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Wallet Ledger History */}
      {selectedWallet && (
        <div
          className="bg-white dark:bg-[#131926] border rounded-2xl p-4 space-y-3 transition-colors shadow-sm"
          style={{ borderColor: `${selectedWallet.color}40` }}
        >
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1E2D40] pb-2.5">
            <h3 className="text-xs font-bold text-slate-900 dark:text-[#F0F4FF] flex items-center gap-2">
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center"
                style={{ backgroundColor: `${selectedWallet.color}25` }}
              >
                <History className="w-3 h-3" style={{ color: selectedWallet.color }} />
              </div>
              <span>{selectedWallet.name} — Recent Activity ({walletTxs.length})</span>
            </h3>
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-50 dark:bg-[#1C2333] border"
                style={{ color: selectedWallet.color, borderColor: `${selectedWallet.color}30` }}
              >
                Current: {formatETB(selectedBal)}
              </span>

              {/* Add Transaction removed from wallet page as requested */}
            </div>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-0.5">
            {walletTxs.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-[#8899BB] py-4 text-center">No transactions recorded for this wallet.</p>
            ) : (
              walletTxs.map((tx) => (
                <div
                  key={tx.id}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#1C2333] border border-slate-200/80 dark:border-[#1E2D40] flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-900 dark:text-[#F0F4FF]">{tx.description}</p>
                    <p className="text-[10px] text-slate-500 dark:text-[#8899BB] mt-0.5">{tx.category} • {new Date(tx.date).toLocaleDateString()}</p>
                  </div>
                  <span className={`font-mono font-bold ${tx.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-red-400'}`}>
                    {tx.type === 'INCOME' ? '+' : '-'}{formatETB(tx.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal: Create New Wallet with Custom Coloring */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] w-full max-w-md p-5 rounded-2xl space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl text-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1E2D40] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#00D4AA]/20 text-[#00D4AA] flex items-center justify-center">
                  <Palette className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Create Business Wallet</h3>
                  <p className="text-[10px] text-slate-500 dark:text-[#8899BB]">Choose custom coloring & account channel</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs text-slate-600 dark:text-[#8899BB] block mb-1">Wallet Name</label>
                <input
                  type="text"
                  required
                  value={newWalletName}
                  onChange={e => setNewWalletName(e.target.value)}
                  placeholder="e.g. Telebirr Bole Merchant, CBE Main Account"
                  className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 dark:focus:border-[#00D4AA]"
                />
              </div>

              <div>
                <label className="text-xs text-slate-600 dark:text-[#8899BB] block mb-1">Account Type & Channel</label>
                <select
                  value={newWalletType}
                  onChange={e => handleTypeChange(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 dark:focus:border-[#00D4AA]"
                >
                  <option value="TELEBIRR">Telebirr Mobile Money [Digital]</option>
                  <option value="CBE_BANK">CBE Commercial Bank [Digital]</option>
                  <option value="EBIRR">E-birr Mobile Account [Digital]</option>
                  <option value="CASH">Cash Register / Physical Drawer [Cash]</option>
                  <option value="SAVINGS">Bank Reserve / Savings [Digital]</option>
                  <option value="OTHER">Other Custom Account [Digital]</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-600 dark:text-[#8899BB] block mb-1">Account / Phone Number (Optional)</label>
                <input
                  type="text"
                  value={newWalletAccNum}
                  onChange={e => setNewWalletAccNum(e.target.value)}
                  placeholder="e.g. 10002938104 or 0911223344"
                  className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 dark:focus:border-[#00D4AA]"
                />
              </div>

              {/* Wallet Color Selection Palette */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-emerald-600 dark:text-[#00D4AA]" />
                    <span>Choose Wallet Theme Color</span>
                  </label>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-[#8899BB] uppercase">{newWalletColor}</span>
                </div>

                {/* Preset Color Swatches */}
                <div className="grid grid-cols-5 gap-2">
                  {COLOR_PALETTE.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setNewWalletColor(c.hex);
                      }}
                      className={`h-8 rounded-xl flex items-center justify-center transition-transform cursor-pointer relative ${
                        newWalletColor === c.hex ? 'ring-2 ring-slate-900 dark:ring-white scale-105' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    >
                      {newWalletColor === c.hex && (
                        <Check className="w-4 h-4 text-white drop-shadow-md" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Custom Hex / Color Picker input */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="color"
                    value={newWalletColor}
                    onChange={e => setNewWalletColor(e.target.value)}
                    className="w-9 h-9 rounded-xl border-0 bg-transparent cursor-pointer"
                    title="Custom Color Picker"
                  />
                  <input
                    type="text"
                    value={newWalletColor}
                    onChange={e => setNewWalletColor(e.target.value)}
                    placeholder="#00D4AA"
                    className="flex-1 bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl p-2 text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Custom Logo Upload Section */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-[#1E2D40]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-[#00D4AA]" />
                    <span>Custom Brand Logo (Upload / URL)</span>
                  </label>
                  {newCustomLogoUrl && (
                    <button
                      type="button"
                      onClick={() => setNewCustomLogoUrl('')}
                      className="text-[10px] text-rose-500 hover:underline flex items-center gap-0.5"
                    >
                      <X className="w-3 h-3" /> Reset Logo
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex-1 cursor-pointer bg-slate-50 dark:bg-[#1C2333] border border-dashed border-slate-300 dark:border-[#1E2D40] hover:border-emerald-500 dark:hover:border-[#00D4AA] rounded-xl p-2.5 flex items-center justify-center gap-2 transition-colors">
                    <Upload className="w-4 h-4 text-emerald-600 dark:text-[#00D4AA]" />
                    <span className="text-xs text-slate-700 dark:text-[#F0F4FF] font-medium">
                      {newCustomLogoUrl ? 'Change Image File...' : 'Upload Logo File (PNG/JPG/SVG)'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleLogoFileUpload(e, setNewCustomLogoUrl)}
                    />
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 dark:text-[#8899BB]">Or Web URL:</span>
                  <input
                    type="text"
                    value={newCustomLogoUrl}
                    onChange={(e) => setNewCustomLogoUrl(e.target.value)}
                    placeholder="https://... / logo.png"
                    className="flex-1 bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl p-1.5 text-xs text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              {/* Live Preview of Wallet Card */}
              <div className="pt-2">
                <p className="text-[10px] text-slate-500 dark:text-[#8899BB] mb-1 font-bold">Live Theme Preview:</p>
                <div
                  className="p-3 rounded-xl border flex items-center justify-between bg-slate-50 dark:bg-[#1C2333]"
                  style={{
                    borderColor: newWalletColor,
                    boxShadow: `0 4px 15px ${newWalletColor}20`
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white overflow-hidden"
                      style={{ backgroundColor: `${newWalletColor}30` }}
                    >
                      {getWalletIcon(newWalletType, newWalletColor, newCustomLogoUrl)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {newWalletName || 'Wallet Name Preview'}
                        </span>
                        <span
                          className="text-[8px] font-mono font-bold px-1.5 py-0.2 rounded-full border"
                          style={{
                            backgroundColor: newWalletType !== 'CASH' ? '#00D4AA15' : '#22C55E15',
                            color: newWalletType !== 'CASH' ? '#00D4AA' : '#22C55E',
                            borderColor: newWalletType !== 'CASH' ? '#00D4AA35' : '#22C55E35'
                          }}
                        >
                          {newWalletType !== 'CASH' ? 'DIGITAL' : 'CASH'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-[#8899BB] font-mono">
                        {newWalletAccNum || newWalletType}
                      </p>
                    </div>
                  </div>

                  <div
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: newWalletColor }}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-600 dark:text-[#8899BB] block mb-1">Opening Balance (ETB)</label>
                <input
                  type="number"
                  value={newWalletBal}
                  onChange={e => setNewWalletBal(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 dark:focus:border-[#00D4AA]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-[#1C2333] text-xs font-bold text-slate-600 dark:text-[#8899BB] hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-[#0A0E1A] transition-colors shadow-lg"
                  style={{ backgroundColor: newWalletColor }}
                >
                  Create Wallet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Existing Wallet (Full CRUD) */}
      {editingWallet && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] w-full max-w-md p-5 rounded-2xl space-y-4 shadow-2xl text-slate-900 dark:text-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1E2D40] pb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${editColor}25` }}
                >
                  <Palette className="w-4 h-4" style={{ color: editColor }} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Edit Wallet Details</h3>
                  <p className="text-[10px] text-slate-500 dark:text-[#8899BB]">{editingWallet.name}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveEditWallet} className="space-y-3.5">
              <div>
                <label className="text-xs text-slate-600 dark:text-[#8899BB] block mb-1">Wallet Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="e.g. Telebirr Primary Business Account"
                  className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-600 dark:text-[#8899BB] block mb-1">Account Category / Type</label>
                <select
                  value={editType}
                  onChange={e => {
                    const newT = e.target.value as Wallet['type'];
                    setEditType(newT);
                    if (DEFAULT_TYPE_COLORS[newT]) {
                      setEditColor(DEFAULT_TYPE_COLORS[newT]);
                    }
                  }}
                  className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none"
                >
                  <option value="TELEBIRR">Telebirr Merchant</option>
                  <option value="CBE_BANK">CBE Bank Account</option>
                  <option value="EBIRR">eBirr Agent Account</option>
                  <option value="CASH">Physical Cash Drawer</option>
                  <option value="SAVINGS">Bank Savings Account</option>
                  <option value="OTHER">Other Custom Account</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-600 dark:text-[#8899BB] block mb-1">Account / IBAN Number</label>
                <input
                  type="text"
                  value={editAccNum}
                  onChange={e => setEditAccNum(e.target.value)}
                  placeholder="e.g. 1000284918231"
                  className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none"
                />
              </div>

              {/* Color Swatches */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-900 dark:text-white block">Theme Color Palette</label>
                <div className="grid grid-cols-5 gap-2">
                  {COLOR_PALETTE.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setEditColor(c.hex);
                      }}
                      className={`h-8 rounded-xl flex items-center justify-center transition-transform cursor-pointer ${
                        editColor === c.hex ? 'ring-2 ring-slate-900 dark:ring-white scale-105' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    >
                      {editColor === c.hex && (
                        <Check className="w-4 h-4 text-white drop-shadow-md" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="color"
                    value={editColor}
                    onChange={e => setEditColor(e.target.value)}
                    className="w-9 h-9 rounded-xl border-0 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={editColor}
                    onChange={e => setEditColor(e.target.value)}
                    className="flex-1 bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl p-2 text-xs font-mono text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              {/* Custom Logo Upload Section */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-[#1E2D40]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-purple-500" />
                    <span>Upload Custom Brand Logo</span>
                  </label>
                  {editCustomLogoUrl && (
                    <button
                      type="button"
                      onClick={() => setEditCustomLogoUrl('')}
                      className="text-[10px] text-rose-500 hover:underline flex items-center gap-0.5"
                    >
                      <X className="w-3 h-3" /> Remove Custom Logo
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white border overflow-hidden shrink-0"
                    style={{ backgroundColor: `${editColor}25`, borderColor: `${editColor}50` }}
                  >
                    {getWalletIcon(editType, editColor, editCustomLogoUrl)}
                  </div>

                  <label className="flex-1 cursor-pointer bg-slate-50 dark:bg-[#1C2333] border border-dashed border-slate-300 dark:border-[#1E2D40] hover:border-purple-500 rounded-xl p-2.5 flex items-center justify-center gap-2 transition-colors">
                    <Upload className="w-4 h-4 text-purple-500" />
                    <span className="text-xs text-slate-700 dark:text-[#F0F4FF] font-medium">
                      {editCustomLogoUrl ? 'Replace Logo File...' : 'Choose Logo File (PNG/JPG/SVG)'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleLogoFileUpload(e, setEditCustomLogoUrl)}
                    />
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 dark:text-[#8899BB]">Or Web URL:</span>
                  <input
                    type="text"
                    value={editCustomLogoUrl}
                    onChange={(e) => setEditCustomLogoUrl(e.target.value)}
                    placeholder="https://... / logo.png"
                    className="flex-1 bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl p-1.5 text-xs text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              {onDeleteWallet && (currentUser.role === 'SuperAdmin' || currentUser.role === 'Admin') && (
                <div className="pt-2 border-t border-slate-200 dark:border-[#1E2D40]">
                  <button
                    type="button"
                    onClick={() => {
                      const w = editingWallet;
                      setEditingWallet(null);
                      openDeleteModal(w);
                    }}
                    className="w-full py-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Wallet Option</span>
                  </button>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingWallet(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-[#1C2333] text-xs font-bold text-slate-600 dark:text-[#8899BB]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-[#0A0E1A] shadow-md"
                  style={{ backgroundColor: editColor }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Wallet Confirmation (With Co-User Approval Flow) */}
      {deletingWallet && (() => {
        const canDeleteDirectly = otherActiveUsers.length === 0;
        const selectedApprover = otherActiveUsers.find(u => u.id === selectedApproverId);
        const isAuthorizedToConfirm = canDeleteDirectly || (selectedApprover && (approvalConfirmed || approverPassword.trim().length > 0));

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#131926] border border-rose-200 dark:border-rose-900/50 w-full max-w-md p-5 rounded-2xl space-y-4 shadow-2xl text-slate-900 dark:text-white max-h-[90vh] overflow-y-auto">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Delete Wallet</h3>
                  <p className="text-xs text-slate-500 dark:text-[#8899BB]">{deletingWallet.name}</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-[#8899BB]">Wallet Name:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{deletingWallet.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-[#8899BB]">Account / Type:</span>
                  <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{deletingWallet.accountNumber || deletingWallet.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-[#8899BB]">Current Balance:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-[#00D4AA]">
                    {formatETB(calculateWalletBalance(deletingWallet, transactions, transfers))}
                  </span>
                </div>
              </div>

              {/* User Availability & Multi-User Approval Logic */}
              {canDeleteDirectly ? (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                    <Check className="w-4 h-4" />
                    <span>Direct SuperAdmin Deletion Authorized</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-[#8899BB] leading-relaxed">
                    No other active co-users are registered in the system. As SuperAdmin, you can delete this wallet directly.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Co-User Approval Protocol Required</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 font-bold">
                      {otherActiveUsers.length} {otherActiveUsers.length === 1 ? 'co-user available' : 'co-users available'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-[#8899BB] leading-snug">
                    Because other active users exist in your workspace, deleting a company wallet requires approval or authorization sign-off from an available co-user.
                  </p>

                  <div className="space-y-2 pt-1">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-[#8899BB] block mb-1">
                        Select Approving Co-User
                      </label>
                      <select
                        value={selectedApproverId}
                        onChange={e => {
                          setSelectedApproverId(e.target.value);
                          setApprovalConfirmed(false);
                          setApprovalError('');
                        }}
                        className="w-full bg-white dark:bg-[#131926] border border-slate-300 dark:border-[#1E2D40] rounded-xl p-2 text-xs font-medium text-slate-900 dark:text-white outline-none"
                      >
                        {otherActiveUsers.map(u => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.role} - {u.branch})
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedApprover && (
                      <div className="p-2.5 bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] rounded-xl space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 dark:text-[#8899BB]">Approver Name:</span>
                          <span className="font-bold text-slate-900 dark:text-white">{selectedApprover.name} ({selectedApprover.role})</span>
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-500 dark:text-[#8899BB] block mb-1">
                            Approver Password or Auth Code (Optional)
                          </label>
                          <input
                            type="password"
                            value={approverPassword}
                            onChange={e => {
                              setApproverPassword(e.target.value);
                              setApprovalError('');
                            }}
                            placeholder="Enter approver password or leave blank for sign-off"
                            className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-lg p-2 text-xs text-slate-900 dark:text-white outline-none"
                          />
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer pt-1">
                          <input
                            type="checkbox"
                            checked={approvalConfirmed}
                            onChange={e => {
                              triggerHaptic('light');
                              setApprovalConfirmed(e.target.checked);
                            }}
                            className="rounded border-slate-300 dark:border-slate-700 text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                          />
                          <span className="text-[11px] font-medium text-slate-700 dark:text-slate-200">
                            I confirm that <strong>{selectedApprover.name}</strong> has granted authorization sign-off to remove this wallet.
                          </span>
                        </label>
                      </div>
                    )}

                    {approvalError && (
                      <p className="text-[11px] text-rose-500 font-bold">{approvalError}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingWallet(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-[#1C2333] text-xs font-bold text-slate-600 dark:text-[#8899BB]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!isAuthorizedToConfirm}
                  onClick={() => {
                    if (!canDeleteDirectly && selectedApprover) {
                      if (approverPassword.trim() && selectedApprover.password) {
                        if (approverPassword.trim() !== selectedApprover.password) {
                          setApprovalError(`Invalid password for ${selectedApprover.name}. Please enter correct password or check sign-off.`);
                          return;
                        }
                      }
                      if (!approvalConfirmed && !approverPassword.trim()) {
                        setApprovalError(`Please confirm sign-off or enter password for ${selectedApprover.name}.`);
                        return;
                      }
                    }

                    triggerHaptic('medium');
                    if (onDeleteWallet) {
                      onDeleteWallet(deletingWallet.id);
                    }
                    if (selectedWalletId === deletingWallet.id) {
                      const remaining = wallets.filter(w => w.id !== deletingWallet.id);
                      setSelectedWalletId(remaining[0]?.id || null);
                    }
                    setDeletingWallet(null);
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all ${
                    isAuthorizedToConfirm
                      ? 'bg-rose-600 hover:bg-rose-700 cursor-pointer'
                      : 'bg-rose-400 dark:bg-rose-950/60 opacity-50 cursor-not-allowed'
                  }`}
                >
                  {canDeleteDirectly ? 'Yes, Remove Wallet' : 'Approve & Delete Wallet'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Telebirr, CBE & eBirr Integration Modal */}
      <TelebirrIntegrationModal
        isOpen={showIntegrationModal}
        onClose={() => setShowIntegrationModal(false)}
        wallets={wallets}
        transactions={transactions}
        transfers={transfers}
        onUpdateWallet={onUpdateWallet}
        onAddTransaction={onAddTransaction}
        onBatchPostTransactions={onBatchPostTransactions}
      />

      {/* ShegerPay & CBE FT Verification Modal */}
      <ShegerPayVerificationModal
        isOpen={showShegerModal}
        onClose={() => setShowShegerModal(false)}
        wallets={wallets}
        onAddTransaction={onAddTransaction}
      />

    </div>
  );
};

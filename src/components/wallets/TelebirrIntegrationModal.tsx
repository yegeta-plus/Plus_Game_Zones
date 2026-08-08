import React, { useState } from 'react';
import {
  Smartphone,
  Building2,
  CreditCard,
  X,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  Send,
  FileText,
  Key,
  Webhook,
  Zap,
  ArrowDownRight,
  ArrowUpRight,
  Sliders,
  ShieldCheck,
  RefreshCw,
  Database,
  Scale,
  AlertCircle
} from 'lucide-react';
import { Wallet, TransactionType, Transaction, Transfer } from '../../types';
import { formatETB, calculateWalletBalance } from '../../lib/store';
import { triggerHaptic } from '../../lib/haptics';

interface TelebirrIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: Wallet[];
  transactions?: Transaction[];
  transfers?: Transfer[];
  onUpdateWallet?: (walletId: string, updates: Partial<Wallet>) => void;
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

type Provider = 'TELEBIRR' | 'CBE' | 'EBIRR';
type ActiveTab = 'SMS_PARSER' | 'BULK_IMPORT' | 'API_CONFIG' | 'SHEGERPAY_VERIFY';

const SAMPLE_MESSAGES = {
  TELEBIRR: [
    {
      label: 'Telebirr 0989367877 Received (Income)',
      text: 'Dear Customer, you have received ETB 12,500.00 from ABEBE KEBEDE (251989367877) on 2026-08-05 10:15:20. Transaction ID: 8A49204829. Your current balance is ETB 45,200.00. Thank you for using telebirr.'
    },
    {
      label: 'Telebirr Payment (Expense)',
      text: 'Dear Customer, you have paid ETB 2,400.00 to MERCHANTPAY (Store #4092) on 2026-08-05 11:30:10. Transaction ID: 8B90123981. Current balance: ETB 42,800.00. telebirr.'
    }
  ],
  CBE: [
    {
      label: 'CBE 1000751694559 Credit (Income)',
      text: 'Dear Customer, your account 1000751694559 has been credited with ETB 35,000.00 by BIRHANU WORKU on 05-AUG-2026. Ref: FT2608059082. Available balance ETB 145,200.00. Commercial Bank of Ethiopia.'
    },
    {
      label: 'CBE 1000751694559 Debit (Expense)',
      text: 'Dear Customer, your account 1000751694559 has been debited with ETB 8,500.00 to TELEBIRR TRANSFER on 05-AUG-2026. Ref: FT2608054412. Available balance ETB 136,700.00. Commercial Bank of Ethiopia.'
    }
  ],
  EBIRR: [
    {
      label: 'eBirr Received (Income)',
      text: 'You have received 5,800.00 ETB from eBirr User 251922334455. TxnRef: EB908231. Date: 05/08/2026. Current balance: 18,500.00 ETB. eBirr Mobile Money.'
    },
    {
      label: 'eBirr Payment (Expense)',
      text: 'Payment of 1,200.00 ETB to Merchant POS-882 successful. TxnRef: EB771209. Date: 05/08/2026. Balance: 17,300.00 ETB. eBirr.'
    }
  ]
};

export const TelebirrIntegrationModal: React.FC<TelebirrIntegrationModalProps> = ({
  isOpen,
  onClose,
  wallets,
  transactions = [],
  transfers = [],
  onUpdateWallet,
  onAddTransaction,
  onBatchPostTransactions
}) => {
  if (!isOpen) return null;

  const [provider, setProvider] = useState<Provider>('TELEBIRR');
  const [activeTab, setActiveTab] = useState<ActiveTab>('SMS_PARSER');

  // SMS Parser state
  const [smsText, setSmsText] = useState('');
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [overrideWalletId, setOverrideWalletId] = useState<string>('');
  const [autoReconcile, setAutoReconcile] = useState(true);

  const [parsedTx, setParsedTx] = useState<{
    amount: number;
    type: TransactionType;
    refId: string;
    counterparty: string;
    date: string;
    category: string;
    description: string;
    standingBalance?: number;
    matchedAccount?: string;
  } | null>(null);

  // Bulk Import state
  const [bulkText, setBulkText] = useState('');
  const [parsedBulkList, setParsedBulkList] = useState<Array<{
    amount: number;
    type: TransactionType;
    refId: string;
    counterparty: string;
    date: string;
    selected: boolean;
  }>>([]);

  // API Config / Webhook simulator state
  const [merchantAppId, setMerchantAppId] = useState('MB-ETH-9021');
  const [merchantSecret, setMerchantSecret] = useState('sec_live_9a8b7c6d5e4f3a2b1c');
  const [simAmount, setSimAmount] = useState('4500');
  const [simPayer, setSimPayer] = useState('Tadesse Alemu');
  const [simRef, setSimRef] = useState(`TXN-${Date.now().toString().slice(-6)}`);
  const [simSuccessToast, setSimSuccessToast] = useState(false);

  // ShegerPay & CBE FT Verifier state
  const [shegerFt, setShegerFt] = useState('FT260808901234');
  const [shegerLoading, setShegerLoading] = useState(false);
  const [shegerStep, setShegerStep] = useState(0);
  const [shegerResult, setShegerResult] = useState<any>(null);
  const [shegerError, setShegerError] = useState<string | null>(null);

  // Helper: auto select wallet matching provider & account number filter
  const getMatchingWallet = (prov: Provider, text: string = smsText): Wallet | undefined => {
    if (overrideWalletId) {
      const found = wallets.find(w => w.id === overrideWalletId);
      if (found) return found;
    }

    const cleanText = text.replace(/[\s-]/g, '');

    // 1. Direct match by specific account number in text
    for (const w of wallets) {
      if (w.accountNumber && w.accountNumber.length > 3) {
        const cleanAcc = w.accountNumber.replace(/[\s-]/g, '');
        if (cleanText.includes(cleanAcc)) {
          return w;
        }
      }
    }

    // 2. Account filter rules: CBE -> 1000751694559, Telebirr -> 0989367877
    if (prov === 'CBE' || text.includes('1000751694559')) {
      const cbeAcc = wallets.find(w => w.type === 'CBE_BANK' && w.accountNumber === '1000751694559');
      if (cbeAcc) return cbeAcc;
    }
    if (prov === 'TELEBIRR' || text.includes('0989367877') || text.includes('251989367877')) {
      const tbAcc = wallets.find(w => w.type === 'TELEBIRR' && (w.accountNumber === '0989367877' || w.accountNumber?.includes('989367877')));
      if (tbAcc) return tbAcc;
    }

    // 3. Fallback to first wallet of provider type
    if (prov === 'TELEBIRR') return wallets.find(w => w.type === 'TELEBIRR') || wallets[0];
    if (prov === 'CBE') return wallets.find(w => w.type === 'CBE_BANK') || wallets[0];
    if (prov === 'EBIRR') return wallets.find(w => w.type === 'EBIRR') || wallets[0];
    return wallets[0];
  };

  const selectedWallet = getMatchingWallet(provider, smsText);

  // Calculate wallet balance prior to this transaction
  const walletPreviousBalance = selectedWallet
    ? calculateWalletBalance(selectedWallet, transactions, transfers)
    : 0;

  // Parse Single SMS with account filter & standing balance extraction
  const parseSingleSMS = (text: string, prov: Provider) => {
    if (!text.trim()) {
      setParsedTx(null);
      return;
    }

    const cleanText = text.replace(/,/g, '');
    
    // Amount extraction regex
    const amountMatch = cleanText.match(/(?:ETB|Birr)\s*([\d.]+)|([\d.]+)\s*(?:ETB|Birr)/i);
    let amount = amountMatch ? parseFloat(amountMatch[1] || amountMatch[2]) : 0;

    // Direction detection
    const isIncome = /received|credited|credited with|received from|deposit|credited by|received \d/i.test(text);
    const type: TransactionType = isIncome ? 'INCOME' : 'EXPENSE';

    // Ref ID extraction
    const refMatch = text.match(/(?:Transaction ID|Ref|Ref:|Txn ID|TxnRef|TxnRef:)\s*:?\s*([A-Z0-9_-]+)/i);
    const refId = refMatch ? refMatch[1] : `REF-${Math.floor(Math.random() * 100000)}`;

    // Standing Balance extraction (e.g. "Your current balance is ETB 45,200.00" or "Available balance ETB 145,200.00")
    const balanceMatch = cleanText.match(/(?:current balance|available balance|balance|bal|new balance)\s*(?:is)?\s*:?\s*(?:ETB|Birr)?\s*([\d.]+)/i) || cleanText.match(/(?:ETB|Birr)\s*([\d.]+)\s*(?:Available|Current|Balance)/i);
    let standingBalance = balanceMatch ? parseFloat(balanceMatch[1]) : undefined;

    // Counterparty extraction
    let counterparty = prov + ' User';
    const fromMatch = text.match(/(?:from|by|paid to|to)\s+([A-Z0-9\s()#-]+?)(?=\s+on|\s+\d|\.|,|$)/i);
    if (fromMatch && fromMatch[1].trim()) {
      counterparty = fromMatch[1].trim();
    }

    // Account match extraction
    let matchedAccount: string | undefined = undefined;
    if (text.includes('1000751694559')) matchedAccount = '1000751694559 (CBE)';
    else if (text.includes('0989367877') || text.includes('251989367877')) matchedAccount = '0989367877 (Telebirr)';

    const date = new Date().toISOString().split('T')[0];
    const category = isIncome ? 'Sales' : 'Operational';
    const description = `[${prov} Auto-Sync] Ref: ${refId} - ${counterparty}`;

    setParsedTx({
      amount: amount || 0,
      type,
      refId,
      counterparty,
      date,
      category,
      description,
      standingBalance,
      matchedAccount
    });
  };

  const handleSmsChange = (val: string) => {
    setSmsText(val);
    parseSingleSMS(val, provider);
  };

  const handleLoadSample = (sampleText: string) => {
    triggerHaptic('light');
    setSmsText(sampleText);
    parseSingleSMS(sampleText, provider);
  };

  // Balance cross-check calculation
  const expectedNewBalance = parsedTx
    ? walletPreviousBalance + (parsedTx.type === 'INCOME' ? parsedTx.amount : -parsedTx.amount)
    : walletPreviousBalance;

  const balanceDiscrepancy = (parsedTx && parsedTx.standingBalance !== undefined)
    ? (parsedTx.standingBalance - expectedNewBalance)
    : 0;

  const isEquationBalanced = Math.abs(balanceDiscrepancy) < 0.01;

  const handleRegisterSingle = () => {
    if (!parsedTx || !selectedWallet || !onAddTransaction) return;
    triggerHaptic('success');

    // Auto-reconcile opening balance if discrepancy exists and auto-reconcile is enabled
    if (parsedTx.standingBalance !== undefined && !isEquationBalanced && autoReconcile && onUpdateWallet) {
      const adjustedOpeningBalance = (selectedWallet.openingBalance || 0) + balanceDiscrepancy;
      onUpdateWallet(selectedWallet.id, { openingBalance: adjustedOpeningBalance });
    }

    onAddTransaction({
      type: parsedTx.type,
      amount: parsedTx.amount,
      walletId: selectedWallet.id,
      category: parsedTx.category,
      description: parsedTx.standingBalance !== undefined
        ? `${parsedTx.description} (Standing Balance Verified: ${formatETB(parsedTx.standingBalance)})`
        : parsedTx.description,
      date: parsedTx.date
    });

    setSmsText('');
    setParsedTx(null);
  };

  // Bulk parser
  const handleParseBulk = (val: string) => {
    setBulkText(val);
    if (!val.trim()) {
      setParsedBulkList([]);
      return;
    }

    const lines = val.split('\n').filter(l => l.trim().length > 10);
    const results = lines.map(line => {
      const cleanLine = line.replace(/,/g, '');
      const amountMatch = cleanLine.match(/(?:ETB|Birr)?\s*([\d.]+)\s*(?:ETB|Birr)?/i);
      const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
      const isIncome = /received|credited|deposit|in/i.test(line);
      const refMatch = line.match(/(?:Ref|ID|Txn):\s*([A-Z0-9]+)/i);

      return {
        amount: amount || 0,
        type: (isIncome ? 'INCOME' : 'EXPENSE') as TransactionType,
        refId: refMatch ? refMatch[1] : `TX-${Math.floor(Math.random() * 89999 + 10000)}`,
        counterparty: provider + ' Transaction',
        date: new Date().toISOString().split('T')[0],
        selected: amount > 0
      };
    });

    setParsedBulkList(results);
  };

  const handleRegisterBulk = () => {
    if (!onBatchPostTransactions || !selectedWallet) return;
    const itemsToPost = parsedBulkList
      .filter(i => i.selected && i.amount > 0)
      .map(i => ({
        type: i.type,
        amount: i.amount,
        walletId: selectedWallet.id,
        category: i.type === 'INCOME' ? 'Sales' : 'Operational',
        description: `[${provider} Bulk Import] Ref: ${i.refId}`,
        date: i.date
      }));

    if (itemsToPost.length === 0) return;
    triggerHaptic('success');
    onBatchPostTransactions(itemsToPost);
    setBulkText('');
    setParsedBulkList([]);
  };

  // Webhook Simulator
  const handleSimulateCallback = () => {
    if (!selectedWallet || !onAddTransaction) return;
    const amount = parseFloat(simAmount) || 1000;
    triggerHaptic('success');

    onAddTransaction({
      type: 'INCOME',
      amount,
      walletId: selectedWallet.id,
      category: 'Sales',
      description: `[${provider} Live API Webhook] Instant Payment Received from ${simPayer} (Ref: ${simRef})`,
      date: new Date().toISOString().split('T')[0]
    });

    setSimSuccessToast(true);
    setSimRef(`TXN-${Date.now().toString().slice(-6)}`);
    setTimeout(() => setSimSuccessToast(false), 4000);
  };

  const webhookUrl = `https://ais-dev-cmzxjxoqayl4lgqgu3fd7m-316110543649.europe-west2.run.app/api/webhooks/${provider.toLowerCase()}`;

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    triggerHaptic('light');
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  // ShegerPay POST /api/v1/verify execution handler
  const handleShegerVerify = async () => {
    if (!shegerFt.trim()) {
      setShegerError('Please enter a valid CBE FT reference code.');
      return;
    }

    setShegerError(null);
    setShegerResult(null);
    setShegerLoading(true);
    triggerHaptic('medium');

    // Steps 1 to 5
    for (let s = 1; s <= 5; s++) {
      setShegerStep(s);
      await new Promise(r => setTimeout(r, 180));
    }

    try {
      const response = await fetch('/api/v1/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ftNumber: shegerFt.trim(),
          walletId: selectedWallet?.id
        })
      });

      const resData = await response.json();

      if (!response.ok || !resData.verified) {
        throw new Error(resData.error || 'FT Verification failed via ShegerPay');
      }

      setShegerStep(6);
      await new Promise(r => setTimeout(r, 150));

      // Step 7: Webhook
      setShegerStep(7);
      await fetch('/api/v1/shegerpay/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'PAYMENT_SETTLED',
          ftNumber: resData.data.ftNumber,
          amount: resData.data.amount,
          verified: true
        })
      });
      await new Promise(r => setTimeout(r, 150));

      // Step 8: Payment = VERIFIED
      setShegerStep(8);
      setShegerResult(resData.data);
      triggerHaptic('success');

      if (onAddTransaction && selectedWallet) {
        onAddTransaction({
          type: 'INCOME',
          amount: resData.data.amount,
          walletId: selectedWallet.id,
          category: 'Sales',
          description: `[ShegerPay Verified FT] Ref: ${resData.data.ftNumber} - Payer: ${resData.data.payerName}`,
          date: new Date().toISOString().split('T')[0]
        });
      }

    } catch (err: any) {
      setShegerError(err.message || 'ShegerPay API error');
      setShegerStep(0);
    } finally {
      setShegerLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-3 z-50 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] rounded-3xl max-w-2xl w-full p-5 space-y-4 shadow-2xl my-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1E2D40] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#00D4AA] to-[#00B894] text-[#0A0E1A] flex items-center justify-center font-bold shadow-md">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Account & Wallet Integration Hub</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-[#00D4AA] border border-emerald-500/20">
                  Live Sync
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#8899BB]">
                Register Telebirr, CBE Bank, & eBirr transactions into wallet
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#1C2333] text-slate-500 dark:text-[#8899BB] hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Provider Switcher */}
        <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-[#1C2333] rounded-2xl">
          <button
            onClick={() => {
              triggerHaptic('light');
              setProvider('TELEBIRR');
              setSmsText('');
              setParsedTx(null);
            }}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              provider === 'TELEBIRR'
                ? 'bg-[#00D4AA] text-[#0A0E1A] shadow-md scale-[1.02]'
                : 'text-slate-600 dark:text-[#8899BB] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Telebirr</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              setProvider('CBE');
              setSmsText('');
              setParsedTx(null);
            }}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              provider === 'CBE'
                ? 'bg-blue-600 text-white shadow-md scale-[1.02]'
                : 'text-slate-600 dark:text-[#8899BB] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>CBE Birr / Bank</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              setProvider('EBIRR');
              setSmsText('');
              setParsedTx(null);
            }}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              provider === 'EBIRR'
                ? 'bg-amber-500 text-slate-950 shadow-md scale-[1.02]'
                : 'text-slate-600 dark:text-[#8899BB] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>eBirr</span>
          </button>
        </div>

        {/* Selected Target Wallet Bar & Multi-Account Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#1C2333]/70 border border-slate-200 dark:border-[#1E2D40] text-xs font-mono gap-2">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-[#8899BB]">Target Wallet:</span>
            <select
              value={overrideWalletId || selectedWallet?.id || ''}
              onChange={(e) => setOverrideWalletId(e.target.value)}
              className="bg-white dark:bg-[#0A0E1A] border border-slate-200 dark:border-[#1E2D40] text-slate-900 dark:text-white font-bold rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#00D4AA]"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.accountNumber || w.type})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {parsedTx?.matchedAccount && (
              <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md flex items-center gap-1 border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span>Auto-Matched Account: {parsedTx.matchedAccount}</span>
              </span>
            )}
            <span className="text-[11px] text-slate-400">
              Current Bal: <strong className="text-slate-900 dark:text-white">{formatETB(walletPreviousBalance)}</strong>
            </span>
          </div>
        </div>

        {/* 2. Mode Sub-Tabs */}
        <div className="flex border-b border-slate-200 dark:border-[#1E2D40] text-xs font-bold gap-6">
          <button
            onClick={() => setActiveTab('SMS_PARSER')}
            className={`pb-2 transition-all cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === 'SMS_PARSER'
                ? 'border-emerald-500 text-emerald-600 dark:text-[#00D4AA]'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Instant SMS Alert Parser</span>
          </button>

          <button
            onClick={() => setActiveTab('BULK_IMPORT')}
            className={`pb-2 transition-all cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === 'BULK_IMPORT'
                ? 'border-emerald-500 text-emerald-600 dark:text-[#00D4AA]'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Statement / Bulk Paste</span>
          </button>

          <button
            onClick={() => setActiveTab('API_CONFIG')}
            className={`pb-2 transition-all cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === 'API_CONFIG'
                ? 'border-emerald-500 text-emerald-600 dark:text-[#00D4AA]'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Webhook className="w-3.5 h-3.5" />
            <span>API & Live Webhooks</span>
          </button>

          <button
            onClick={() => setActiveTab('SHEGERPAY_VERIFY')}
            className={`pb-2 transition-all cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === 'SHEGERPAY_VERIFY'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
            <span>ShegerPay CBE FT Verifier</span>
          </button>
        </div>

        {/* TAB 1: INSTANT SMS PARSER */}
        {activeTab === 'SMS_PARSER' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Paste {provider} SMS Payment Notification:
                </label>
                <span className="text-[10px] text-slate-400">Auto-detects Amount, Txn ID, & Type</span>
              </div>

              <textarea
                rows={3}
                value={smsText}
                onChange={(e) => handleSmsChange(e.target.value)}
                placeholder={`Paste ${provider} SMS here (e.g., "Dear Customer, you have received ETB 12,500.00 from ABEBE KEBEDE...")`}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-[#00D4AA] focus:outline-none"
              />
            </div>

            {/* Quick Sample Presets */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 dark:text-[#8899BB]">
                Test with Sample SMS Templates:
              </span>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_MESSAGES[provider].map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleLoadSample(s.text)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#1C2333] hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-[11px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#1E2D40] hover:border-emerald-500/50 transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-500" />
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Parsed Result Card & Standing Balance Equation Reconciler */}
            {parsedTx && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                  <span className="text-xs font-bold text-emerald-700 dark:text-[#00D4AA] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>SMS Transaction Extracted</span>
                  </span>
                  <span
                    className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-md flex items-center gap-1 ${
                      parsedTx.type === 'INCOME'
                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                        : 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {parsedTx.type === 'INCOME' ? (
                      <ArrowDownRight className="w-3 h-3" />
                    ) : (
                      <ArrowUpRight className="w-3 h-3" />
                    )}
                    <span>{parsedTx.type}</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-[#8899BB] block">Amount:</span>
                    <span className="font-bold text-base text-slate-900 dark:text-white">
                      {formatETB(parsedTx.amount)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-[#8899BB] block">Reference ID:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{parsedTx.refId}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-[#8899BB] block">Payer / Recipient:</span>
                    <span className="font-bold text-slate-900 dark:text-white truncate block">
                      {parsedTx.counterparty}
                    </span>
                  </div>
                </div>

                {/* Standing Balance Cross-Check Equation Box */}
                {parsedTx.standingBalance !== undefined && (
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/60 space-y-2 text-xs font-mono text-slate-200">
                    <div className="flex items-center justify-between border-b border-slate-700/60 pb-1.5">
                      <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5" />
                        <span>Standing Balance Equation Check:</span>
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        SMS Standing: {formatETB(parsedTx.standingBalance)}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 text-center text-[11px]">
                      <div className="p-1.5 rounded bg-slate-800/80 border border-slate-700/50">
                        <span className="text-[9px] text-slate-400 block">Previous Balance</span>
                        <span className="font-bold text-slate-200">{formatETB(walletPreviousBalance)}</span>
                      </div>
                      <div className="p-1.5 rounded bg-slate-800/80 border border-slate-700/50">
                        <span className="text-[9px] text-slate-400 block">{parsedTx.type}</span>
                        <span className={`font-bold ${parsedTx.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {parsedTx.type === 'INCOME' ? '+' : '-'}{formatETB(parsedTx.amount)}
                        </span>
                      </div>
                      <div className="p-1.5 rounded bg-slate-800/80 border border-slate-700/50">
                        <span className="text-[9px] text-slate-400 block">Calculated Total</span>
                        <span className="font-bold text-white">{formatETB(expectedNewBalance)}</span>
                      </div>
                    </div>

                    {isEquationBalanced ? (
                      <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>
                          <strong>Equation Verified!</strong> Previous ({formatETB(walletPreviousBalance)}) + {parsedTx.type === 'INCOME' ? 'Income' : 'Expense'} ({formatETB(parsedTx.amount)}) = SMS Standing Balance ({formatETB(parsedTx.standingBalance)}).
                        </span>
                      </div>
                    ) : (
                      <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-200 text-[11px] space-y-1.5">
                        <div className="flex items-center gap-1.5 font-semibold text-amber-300">
                          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                          <span>
                            Balance Discrepancy: SMS reports standing balance as <strong>{formatETB(parsedTx.standingBalance)}</strong> (Difference: {balanceDiscrepancy > 0 ? '+' : ''}{formatETB(balanceDiscrepancy)}).
                          </span>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer pt-1 border-t border-amber-500/30">
                          <input
                            type="checkbox"
                            checked={autoReconcile}
                            onChange={(e) => setAutoReconcile(e.target.checked)}
                            className="w-3.5 h-3.5 accent-[#00D4AA] rounded"
                          />
                          <span className="text-[11px] text-slate-200">
                            Auto-adjust wallet opening balance by {balanceDiscrepancy > 0 ? '+' : ''}{formatETB(balanceDiscrepancy)} so total equals SMS standing balance ({formatETB(parsedTx.standingBalance)}).
                          </span>
                        </label>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={handleRegisterSingle}
                  className="w-full mt-2 py-2.5 rounded-xl bg-emerald-600 dark:bg-[#00D4AA] text-white dark:text-[#0A0E1A] font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:brightness-110 transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    Register {formatETB(parsedTx.amount)} to {selectedWallet?.name}
                    {!isEquationBalanced && autoReconcile && parsedTx.standingBalance !== undefined ? ' & Reconcile Balance' : ''}
                  </span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: BULK STATEMENT IMPORT */}
        {activeTab === 'BULK_IMPORT' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Paste Multiple Statement Lines or CSV:
              </label>
              <textarea
                rows={4}
                value={bulkText}
                onChange={(e) => handleParseBulk(e.target.value)}
                placeholder={`Paste lines, e.g.:\nETB 4500 received from Kebede - Ref: TX901\nETB 1200 paid to Store - Ref: TX902`}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-[#00D4AA] focus:outline-none"
              />
            </div>

            {parsedBulkList.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    Parsed {parsedBulkList.length} Transactions
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Destination: {selectedWallet?.name}
                  </span>
                </div>

                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {parsedBulkList.map((item, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-xl bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] flex items-center justify-between text-xs font-mono"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={(e) => {
                            const updated = [...parsedBulkList];
                            updated[i].selected = e.target.checked;
                            setParsedBulkList(updated);
                          }}
                          className="rounded text-emerald-500 focus:ring-emerald-400 w-3.5 h-3.5 cursor-pointer"
                        />
                        <span className="font-bold text-slate-900 dark:text-white">{item.refId}</span>
                        <span className="text-[10px] text-slate-500">({item.type})</span>
                      </div>
                      <span className="font-bold text-emerald-600 dark:text-[#00D4AA]">
                        {formatETB(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleRegisterBulk}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 dark:bg-[#00D4AA] text-white dark:text-[#0A0E1A] font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:brightness-110 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Batch Post Selected Transactions to Ledger</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: API & WEBHOOK CONFIG + SIMULATOR */}
        {activeTab === 'API_CONFIG' && (
          <div className="space-y-4">
            
            {/* Live Webhook URL Card */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Webhook className="w-4 h-4 text-emerald-500" />
                  <span>{provider} Merchant API Webhook Endpoint URL</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-[#00D4AA]">
                  HTTP POST Callback
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={webhookUrl}
                  className="flex-1 p-2 rounded-xl bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300"
                />
                <button
                  onClick={handleCopyWebhook}
                  className="px-3 py-2 rounded-xl bg-emerald-600 dark:bg-[#00D4AA] text-white dark:text-[#0A0E1A] font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm hover:brightness-110"
                >
                  {copiedWebhook ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedWebhook ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Merchant Credentials Form */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Key className="w-3 h-3 text-slate-400" />
                  <span>Merchant App ID:</span>
                </label>
                <input
                  type="text"
                  value={merchantAppId}
                  onChange={(e) => setMerchantAppId(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Key className="w-3 h-3 text-slate-400" />
                  <span>App Secret Key:</span>
                </label>
                <input
                  type="password"
                  value={merchantSecret}
                  onChange={(e) => setMerchantSecret(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] font-mono"
                />
              </div>
            </div>

            {/* Live Webhook Callback Simulator */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-200 dark:border-indigo-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-700 dark:text-[#A78BFA] flex items-center gap-1.5">
                  <Sliders className="w-4 h-4" />
                  <span>Test Live API Webhook Callback Simulator</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Real-time simulation</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                <div>
                  <label className="text-[10px] text-slate-500 dark:text-[#8899BB] block">Amount (ETB):</label>
                  <input
                    type="number"
                    value={simAmount}
                    onChange={(e) => setSimAmount(e.target.value)}
                    className="w-full p-1.5 rounded-lg bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800 font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 dark:text-[#8899BB] block">Payer Name:</label>
                  <input
                    type="text"
                    value={simPayer}
                    onChange={(e) => setSimPayer(e.target.value)}
                    className="w-full p-1.5 rounded-lg bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800 font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 dark:text-[#8899BB] block">Txn Reference:</label>
                  <input
                    type="text"
                    value={simRef}
                    onChange={(e) => setSimRef(e.target.value)}
                    className="w-full p-1.5 rounded-lg bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800 font-bold"
                  />
                </div>
              </div>

              <button
                onClick={handleSimulateCallback}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Simulate Incoming {provider} Payment Callback</span>
              </button>

              {simSuccessToast && (
                <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-xs text-emerald-600 dark:text-emerald-300 font-bold flex items-center gap-2 animate-in fade-in duration-150">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Webhook Callback Executed! {formatETB(parseFloat(simAmount))} credited to {selectedWallet?.name}.</span>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 4: SHEGERPAY CBE FT VERIFIER */}
        {activeTab === 'SHEGERPAY_VERIFY' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-600/10 via-indigo-600/5 to-transparent border border-blue-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>ShegerPay CBE Financial Transfer (FT) Verification Workflow</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400">
                  POST /api/v1/verify
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  CBE FT Reference Code:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shegerFt}
                    onChange={(e) => setShegerFt(e.target.value)}
                    placeholder="e.g. FT260808901234"
                    className="flex-1 p-2.5 rounded-xl bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white"
                  />
                  <button
                    onClick={handleShegerVerify}
                    disabled={shegerLoading}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {shegerLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Verify FT</span>
                  </button>
                </div>

                <div className="flex gap-1.5 pt-1">
                  {['FT260808901234', 'FT260805908211', 'FT260801449012'].map((code) => (
                    <button
                      key={code}
                      onClick={() => setShegerFt(code)}
                      className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#1C2333] hover:bg-blue-50 dark:hover:bg-blue-950/40 text-[10px] font-mono text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800"
                    >
                      {code}
                    </button>
                  ))}
                </div>
              </div>

              {shegerStep > 0 && (
                <div className="p-2.5 rounded-xl bg-slate-900/80 text-white font-mono text-[11px] space-y-1">
                  <div className="text-blue-400 font-bold flex items-center justify-between">
                    <span>Workflow Progress: Step #{shegerStep}/8</span>
                    {shegerStep === 8 && <span className="text-emerald-400">VERIFIED</span>}
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 h-full transition-all duration-300"
                      style={{ width: `${(shegerStep / 8) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {shegerResult && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs font-mono space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between font-bold text-emerald-700 dark:text-[#00D4AA]">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>FT Verified via ShegerPay API & CBE</span>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20">Payment = VERIFIED</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>Amount: <strong className="text-slate-900 dark:text-white">{formatETB(shegerResult.amount)}</strong></div>
                    <div>Payer: <strong className="text-slate-900 dark:text-white">{shegerResult.payerName}</strong></div>
                    <div>Account: <strong className="text-slate-900 dark:text-white">{shegerResult.payerAccount}</strong></div>
                    <div>Auth Code: <strong className="text-blue-600 dark:text-blue-400">{shegerResult.authorizationCode}</strong></div>
                  </div>

                  <p className="text-[10px] text-slate-500 border-t border-emerald-500/20 pt-1">
                    ✨ Funds auto-deposited to {selectedWallet?.name} and recorded in ledger.
                  </p>
                </div>
              )}

              {shegerError && (
                <div className="p-2.5 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-300 text-xs">
                  {shegerError}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

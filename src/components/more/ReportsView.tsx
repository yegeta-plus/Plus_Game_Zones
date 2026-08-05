import React from 'react';
import { BarChart3, Download, Printer, PieChart } from 'lucide-react';
import { ERPState } from '../../types';
import { calculateTotalBusinessBalance, calculateMonthlyStats, formatETB } from '../../lib/store';
import { triggerHaptic } from '../../lib/haptics';

export const ReportsView: React.FC<{ state: ERPState }> = ({ state }) => {
  const totalBalance = calculateTotalBusinessBalance(state.wallets, state.transactions, state.transfers);
  const { income, expense, profit } = calculateMonthlyStats(state.transactions);

  const totalAssetsValue = state.assets.reduce((sum, a) => sum + a.currentValue, 0);
  const totalLoansOutstanding = state.loans.reduce((sum, l) => sum + l.outstandingBalance, 0);
  const netWorth = totalBalance + totalAssetsValue - totalLoansOutstanding;

  const handleExportCSV = () => {
    triggerHaptic('medium');
    const headers = 'ID,Date,Type,Amount (ETB),Category,Description,Wallet,Partner,Branch\n';
    const rows = state.transactions.map(t =>
      `"${t.id}","${t.date}","${t.type}",${t.amount},"${t.category}","${t.description}","${t.walletId}","${t.creatorName}","${t.branch}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PlusZone_Ledger_Export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#00D4AA]" />
            Financial Statements & CSV Export
          </h3>
          <p className="text-xs text-slate-500 dark:text-[#8899BB]">Audited P&L statements & business balance sheet</p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-3 py-1.5 rounded-xl bg-emerald-600 dark:bg-[#00D4AA] text-white dark:text-[#0A0E1A] font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer hover:brightness-110 transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Net Worth & Balance Sheet Card */}
      <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] rounded-2xl p-4 space-y-3 shadow-sm">
        <h4 className="text-xs font-bold text-slate-900 dark:text-[#F0F4FF] uppercase tracking-wider">Business Balance Sheet</h4>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-50 dark:bg-[#1C2333] p-3 rounded-xl border border-slate-100 dark:border-transparent">
            <span className="text-[10px] text-slate-500 dark:text-[#8899BB]">Liquid Wallet Cash</span>
            <p className="text-sm font-black font-mono text-emerald-600 dark:text-[#00D4AA] mt-0.5">{formatETB(totalBalance)}</p>
          </div>
          <div className="bg-slate-50 dark:bg-[#1C2333] p-3 rounded-xl border border-slate-100 dark:border-transparent">
            <span className="text-[10px] text-slate-500 dark:text-[#8899BB]">Fixed Assets Book Value</span>
            <p className="text-sm font-black font-mono text-amber-600 dark:text-[#F5A623] mt-0.5">{formatETB(totalAssetsValue)}</p>
          </div>
          <div className="bg-slate-50 dark:bg-[#1C2333] p-3 rounded-xl border border-slate-100 dark:border-transparent">
            <span className="text-[10px] text-slate-500 dark:text-[#8899BB]">Outstanding Loans Liabilities</span>
            <p className="text-sm font-black font-mono text-red-600 dark:text-red-400 mt-0.5">{formatETB(totalLoansOutstanding)}</p>
          </div>
          <div className="bg-slate-50 dark:bg-[#1C2333] p-3 rounded-xl border border-[#00D4AA]/30">
            <span className="text-[10px] text-slate-500 dark:text-[#8899BB]">Total Business Net Worth</span>
            <p className="text-sm font-black font-mono text-emerald-600 dark:text-[#00D4AA] mt-0.5">{formatETB(netWorth)}</p>
          </div>
        </div>
      </div>

      {/* P&L Statement */}
      <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] rounded-2xl p-4 space-y-3 shadow-sm">
        <h4 className="text-xs font-bold text-slate-900 dark:text-[#F0F4FF] uppercase tracking-wider">Income Statement (MTD)</h4>
        
        <div className="space-y-2 text-xs">
          <div className="flex justify-between p-2 rounded-xl bg-slate-50 dark:bg-[#1C2333] border border-slate-100 dark:border-transparent">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Total Gross Revenue</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatETB(income)}</span>
          </div>
          <div className="flex justify-between p-2 rounded-xl bg-slate-50 dark:bg-[#1C2333] border border-slate-100 dark:border-transparent">
            <span className="text-red-600 dark:text-red-400 font-bold">Total Operating Expenses</span>
            <span className="font-mono font-bold text-red-600 dark:text-red-400">{formatETB(expense)}</span>
          </div>
          <div className="flex justify-between p-2.5 rounded-xl bg-emerald-500/10 dark:bg-[#00D4AA]/15 border border-emerald-500/30 dark:border-[#00D4AA]/30">
            <span className="text-emerald-700 dark:text-[#00D4AA] font-black">Net Profit Margin</span>
            <span className="font-mono font-black text-emerald-700 dark:text-[#00D4AA] text-sm">{formatETB(profit)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

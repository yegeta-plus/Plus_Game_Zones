import React from 'react';
import { LayoutDashboard, ReceiptText, Wallet as WalletIcon, Users, Grid, Plus } from 'lucide-react';
import { triggerHaptic } from '../../lib/haptics';

export type TabType = 'dashboard' | 'transactions' | 'wallets' | 'equb' | 'more';

interface BottomNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onOpenQuickEntry: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenQuickEntry
}) => {
  const tabs = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions' as TabType, label: 'Transactions', icon: ReceiptText },
    { id: 'wallets' as TabType, label: 'Wallets', icon: WalletIcon },
    { id: 'equb' as TabType, label: 'Equb', icon: Users },
    { id: 'more' as TabType, label: 'More', icon: Grid }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0A0E1A]/95 backdrop-blur-xl border-t border-slate-200 dark:border-[#1E2D40] pb-safe shadow-lg dark:shadow-2xl transition-colors">
      <div className="max-w-md mx-auto relative">
        
        {/* Floating Quick Add Button - Elevated Above Nav Bar so it never obscures any tab */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center z-20">
          <button
            onClick={() => {
              triggerHaptic('heavy');
              onOpenQuickEntry();
            }}
            title="Quick Add Transaction"
            className="relative group cursor-pointer"
          >
            {/* Ambient Pulse Glow */}
            <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-[#00D4AA] to-[#3B82F6] blur-md opacity-40 group-hover:opacity-90 transition-opacity animate-pulse" />

            {/* Main Circular Button with subtle badge border */}
            <div className="relative w-12 h-12 rounded-full bg-gradient-to-tr from-[#00D4AA] to-[#00B894] text-[#0A0E1A] flex items-center justify-center shadow-xl shadow-[#00D4AA]/40 border-2 border-white dark:border-[#0A0E1A] group-hover:scale-110 active:scale-95 transition-transform duration-200">
              <Plus className="w-6 h-6 stroke-[3]" />
            </div>
          </button>
        </div>

        {/* 5 Symmetrically Spaced Navigation Tabs */}
        <div className="grid grid-cols-5 h-16 items-center px-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  triggerHaptic('light');
                  onSelectTab(tab.id);
                }}
                className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer ${
                  isActive ? 'text-emerald-600 dark:text-[#00D4AA]' : 'text-slate-500 hover:text-slate-900 dark:text-[#8899BB] dark:hover:text-[#F0F4FF]'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                <span className={`text-[10px] mt-1 font-medium truncate max-w-full ${isActive ? 'font-bold' : ''}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
};

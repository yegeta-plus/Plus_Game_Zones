import React, { useState } from 'react';
import {
  Target,
  Repeat,
  FileCheck,
  BarChart3,
  Shield,
  Briefcase,
  Tag,
  Calendar as CalendarIcon,
  Users,
  Database,
  ChevronRight,
  Sparkles,
  ArrowLeft,
  Settings,
  Sliders,
  LogOut
} from 'lucide-react';
import { ERPState } from '../../types';
import { triggerHaptic } from '../../lib/haptics';

// Subviews
import { GoalsView } from './GoalsView';
import { RecurringView } from './RecurringView';
import { ReceivablesView } from './ReceivablesView';
import { AssetsView } from './AssetsView';
import { ReportsView } from './ReportsView';
import { AuditLogView } from './AuditLogView';
import { UsersView } from './UsersView';
import { CalendarView } from './CalendarView';
import { BackupView } from './BackupView';
import { CategoriesView } from './CategoriesView';
import { SettingsView, SettingsTabType } from './SettingsView';
import { ProfileView } from './ProfileView';
import { User, Camera, Mail } from 'lucide-react';

export type SubViewType =
  | 'HUB'
  | 'PROFILE'
  | 'SETTINGS'
  | 'GOALS'
  | 'RECURRING'
  | 'RECEIVABLES'
  | 'ASSETS'
  | 'REPORTS'
  | 'AUDIT_LOG'
  | 'USERS'
  | 'CATEGORIES'
  | 'CALENDAR'
  | 'BACKUP';

interface MoreHubViewProps {
  state: ERPState;
  onUpdateState: (fn: (prev: ERPState) => ERPState) => void;
  onOpenAiAssistant: () => void;
  onLogout?: () => void;
  initialSubView?: SubViewType;
}

export const MoreHubView: React.FC<MoreHubViewProps> = ({
  state,
  onUpdateState,
  onOpenAiAssistant,
  onLogout,
  initialSubView
}) => {
  const [subView, setSubView] = useState<SubViewType>(initialSubView || 'HUB');
  const [settingsInitialTab, setSettingsInitialTab] = useState<SettingsTabType | null>(null);

  React.useEffect(() => {
    if (initialSubView) {
      setSubView(initialSubView);
    }
  }, [initialSubView]);

  const openSettings = (tab: SettingsTabType | null = null) => {
    triggerHaptic('light');
    setSettingsInitialTab(tab);
    setSubView('SETTINGS');
  };

  // Settings grouped items
  const settingItems = [
    {
      id: 'CATEGORIES' as SettingsTabType,
      title: 'Categories',
      subtitle: 'Income & Expense tags',
      icon: Tag,
      color: '#00D4AA',
      count: `${state.categories.length} categories`
    },
    {
      id: 'PARTNERS' as SettingsTabType,
      title: 'Partners & Roles',
      subtitle: 'Users & permissions',
      icon: Users,
      color: '#FB923C',
      count: `${state.users.length} partners`,
      superAdminOnly: true
    },
    {
      id: 'RECURRING' as SettingsTabType,
      title: 'Recurring Bills',
      subtitle: 'Rent, telecom & schedules',
      icon: Repeat,
      color: '#A78BFA',
      count: `${state.recurring.length} active bills`
    },
    {
      id: 'BACKUP' as SettingsTabType,
      title: 'Data Backup & Import',
      subtitle: 'Export JSON & reset',
      icon: Database,
      color: '#64748B',
      count: 'JSON Snapshot'
    }
  ];

  const operationalTiles = [
    {
      id: 'REPORTS' as SubViewType,
      title: 'Reports & P&L',
      subtitle: 'Cashflow, Balance Sheet, CSV Export',
      icon: BarChart3,
      color: '#3B82F6',
      onClick: () => {
        triggerHaptic('light');
        setSubView('REPORTS');
      }
    },
    {
      id: 'RECEIVABLES' as SubViewType,
      title: 'Receivables & Credit',
      subtitle: 'Customer IOUs & Cash Collections',
      icon: FileCheck,
      color: '#3B82F6',
      onClick: () => {
        triggerHaptic('light');
        setSubView('RECEIVABLES');
      }
    },
    {
      id: 'ASSETS' as SubViewType,
      title: 'Assets & Depreciation',
      subtitle: 'Equipment, Vehicles & Straight-line',
      icon: Briefcase,
      color: '#F5A623',
      onClick: () => {
        triggerHaptic('light');
        setSubView('ASSETS');
      }
    },
    {
      id: 'GOALS' as SubViewType,
      title: 'Savings Goals',
      subtitle: 'Expansion Targets & Dividend Reserves',
      icon: Target,
      color: '#22C55E',
      onClick: () => {
        triggerHaptic('light');
        setSubView('GOALS');
      }
    },
    {
      id: 'AUDIT_LOG' as SubViewType,
      title: 'Audit & Event Log',
      subtitle: 'Immutable Ledger Activity Log',
      icon: Shield,
      color: '#EC4899',
      superAdminOnly: true,
      onClick: () => {
        triggerHaptic('light');
        setSubView('AUDIT_LOG');
      }
    },
    {
      id: 'CALENDAR' as SubViewType,
      title: 'Financial Calendar',
      subtitle: 'Due Dates & Payment Schedules',
      icon: CalendarIcon,
      color: '#6366F1',
      onClick: () => {
        triggerHaptic('light');
        setSubView('CALENDAR');
      }
    }
  ];

  if (subView !== 'HUB') {
    return (
      <div className="space-y-4 pb-24">
        {/* Back navigation header */}
        <button
          onClick={() => {
            triggerHaptic('light');
            setSubView('HUB');
          }}
          className="flex items-center gap-1.5 text-xs font-bold text-[#00D4AA] bg-[#00D4AA]/10 border border-[#00D4AA]/30 px-3 py-1.5 rounded-xl cursor-pointer hover:bg-[#00D4AA]/20 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to More Operations</span>
        </button>

        {subView === 'PROFILE' && (
          <ProfileView currentUser={state.currentUser} onUpdateState={onUpdateState} />
        )}
        {subView === 'SETTINGS' && (
          <SettingsView
            state={state}
            onUpdateState={onUpdateState}
            initialTab={settingsInitialTab}
          />
        )}
        {subView === 'REPORTS' && <ReportsView state={state} />}
        {subView === 'RECEIVABLES' && (
          <ReceivablesView
            receivables={state.receivables}
            wallets={state.wallets}
            onCollect={(id, wId, amt) => {
              onUpdateState(prev => {
                const target = prev.receivables.find(r => r.id === id);
                if (!target) return prev;
                const updatedReceivables = prev.receivables.map(r =>
                  r.id === id
                    ? {
                        ...r,
                        amountCollected: r.amountCollected + amt,
                        status:
                          r.amountCollected + amt >= r.amountOwed
                            ? ('COLLECTED' as const)
                            : ('OUTSTANDING' as const)
                      }
                    : r
                );
                const newTx = {
                  id: `tx-rcv-${Date.now()}`,
                  date: new Date().toISOString(),
                  type: 'INCOME' as const,
                  amount: amt,
                  walletId: wId,
                  category: 'Sales Revenue',
                  description: `Receivable collection: ${target.customerName}`,
                  creatorId: prev.currentUser.id,
                  creatorName: prev.currentUser.name,
                  branch: prev.currentUser.branch
                };
                return {
                  ...prev,
                  receivables: updatedReceivables,
                  transactions: [newTx, ...prev.transactions]
                };
              });
            }}
          />
        )}
        {subView === 'CATEGORIES' && (
          <SettingsView
            state={state}
            onUpdateState={onUpdateState}
            initialTab="CATEGORIES"
          />
        )}
        {subView === 'USERS' && (
          <SettingsView
            state={state}
            onUpdateState={onUpdateState}
            initialTab="PARTNERS"
          />
        )}
        {subView === 'RECURRING' && (
          <SettingsView
            state={state}
            onUpdateState={onUpdateState}
            initialTab="RECURRING"
          />
        )}
        {subView === 'ASSETS' && <AssetsView assets={state.assets} wallets={state.wallets} />}
        {subView === 'GOALS' && <GoalsView goals={state.goals} />}
        {subView === 'AUDIT_LOG' && <AuditLogView auditLogs={state.auditLogs} />}
        {subView === 'CALENDAR' && (
          <CalendarView
            equbs={state.equbs}
            loans={state.loans}
            recurring={state.recurring}
            receivables={state.receivables}
            transactions={state.transactions}
          />
        )}
        {subView === 'BACKUP' && (
          <BackupView state={state} onRestore={newState => onUpdateState(() => newState)} />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-[#F0F4FF]">ERP Operations Hub</h2>
        <p className="text-xs text-slate-500 dark:text-[#8899BB] mt-0.5">Advanced business modules, compliance & settings</p>
      </div>

      {/* User Account Profile Card */}
      <div
        onClick={() => {
          triggerHaptic('light');
          setSubView('PROFILE');
        }}
        className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] hover:border-[#00D4AA]/60 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all shadow-sm hover:bg-slate-50 dark:hover:bg-[#1C2333] group"
      >
        <div className="flex items-center gap-3">
          {state.currentUser.avatarUrl ? (
            <img
              src={state.currentUser.avatarUrl}
              alt={state.currentUser.name}
              className="w-12 h-12 rounded-xl object-cover border-2 border-[#00D4AA]/40 group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 text-white flex items-center justify-center font-black text-sm border border-[#00D4AA]/40 group-hover:scale-105 transition-transform">
              {state.currentUser.name ? state.currentUser.name.substring(0, 2).toUpperCase() : 'US'}
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {state.currentUser.name || 'User Account'}
              </h3>
              <span className="text-[9px] bg-[#00D4AA]/20 text-[#00D4AA] px-1.5 py-0.2 rounded font-mono font-extrabold uppercase">
                {state.currentUser.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-[#8899BB] mt-0.5">
              {state.currentUser.email || 'Manage profile photo, password & account details'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-bold text-[#00D4AA]">
          <span className="hidden sm:inline">Manage Account</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>

      {/* Operational Modules Section */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-500 dark:text-[#8899BB] uppercase tracking-wider px-1">
          Business Operations & Reporting
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {operationalTiles.map((tile) => {
            const Icon = tile.icon;
            const isRestricted = tile.superAdminOnly && state.currentUser.role === 'Partner';

            return (
              <div
                key={tile.id}
                onClick={() => {
                  if (isRestricted) {
                    alert('Audit log requires Admin or SuperAdmin permissions.');
                    return;
                  }
                  tile.onClick();
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  isRestricted
                    ? 'bg-slate-100/50 dark:bg-[#131926]/50 border-slate-200 dark:border-[#1E2D40] opacity-50 cursor-not-allowed'
                    : 'bg-white dark:bg-[#131926] border-slate-200 dark:border-[#1E2D40] hover:border-[#00D4AA]/50 hover:bg-slate-50 dark:hover:bg-[#1C2333] shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${tile.color}20`, color: tile.color }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      {tile.title}
                      {tile.superAdminOnly && (
                        <span className="text-[9px] bg-purple-500/20 text-purple-600 dark:text-purple-400 px-1.5 py-0.2 rounded font-mono">
                          ADMIN
                        </span>
                      )}
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-[#8899BB] mt-0.5">{tile.subtitle}</p>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-400 dark:text-[#8899BB]" />
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Assistant Banner Launcher */}
      <div
        onClick={() => {
          triggerHaptic('medium');
          onOpenAiAssistant();
        }}
        className="p-4 rounded-2xl bg-gradient-to-r from-[#00D4AA]/15 via-[#3B82F6]/15 to-[#A78BFA]/15 border border-[#00D4AA]/30 flex items-center justify-between cursor-pointer hover:border-[#00D4AA]/60 transition-all shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#00D4AA]/20 text-[#00D4AA] flex items-center justify-center">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Gemini AI ERP Assistant</h4>
            <p className="text-[11px] text-slate-600 dark:text-[#8899BB]">Ask cash flow forecasts, Ethiopian tax & Equb strategies</p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-[#00D4AA]" />
      </div>

      {/* System Settings Tile (at the bottom of the page) - SuperAdmin Only */}
      {state.currentUser.role === 'SuperAdmin' && (
        <div
          onClick={() => openSettings(null)}
          className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#00D4AA]/40 hover:border-[#00D4AA] rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all shadow-sm group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00D4AA]/20 via-[#3B82F6]/20 to-[#A78BFA]/20 text-[#00D4AA] flex items-center justify-center border border-[#00D4AA]/30 group-hover:scale-105 transition-transform">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">System Settings</h3>
                <span className="text-[9px] bg-[#00D4AA]/20 text-[#00D4AA] px-1.5 py-0.2 rounded font-mono font-bold">
                  CONFIGURATIONS
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-[#8899BB] mt-0.5">
                Categories, Partners & Roles, Recurring Bills & Data Backup
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-[#00D4AA] group-hover:translate-x-1 transition-transform" />
        </div>
      )}

      {/* Logout Action Tile */}
      {onLogout && (
        <div
          onClick={() => {
            triggerHaptic('heavy');
            onLogout();
          }}
          className="bg-rose-500/10 hover:bg-rose-500/20 dark:bg-rose-950/30 dark:hover:bg-rose-900/50 border border-rose-300 dark:border-rose-900/60 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all shadow-sm group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/30 group-hover:scale-105 transition-transform">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-700 dark:text-rose-400">Sign Out / Log Out</h3>
              <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-0.5">
                Log out of partner session ({state.currentUser.name})
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-rose-500 group-hover:translate-x-1 transition-transform" />
        </div>
      )}
    </div>
  );
};

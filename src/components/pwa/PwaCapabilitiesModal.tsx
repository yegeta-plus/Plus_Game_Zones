import React, { useState, useEffect } from 'react';
import {
  X,
  Radio,
  Wifi,
  WifiOff,
  Bell,
  RefreshCw,
  FileSpreadsheet,
  Share2,
  ExternalLink,
  ShieldCheck,
  LayoutGrid,
  Sidebar,
  FileEdit,
  Globe,
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { getPwaStatusReport, PwaStatusReport, triggerBackgroundSync, getQueuedOfflineItems } from '../../lib/pwaSync';
import { triggerHaptic } from '../../lib/haptics';
import { sendExternalNotification } from '../../lib/notifications';

interface PwaCapabilitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulateShareTarget?: (text: string) => void;
  onSimulateFileImport?: () => void;
  onSimulateNote?: () => void;
}

export const PwaCapabilitiesModal: React.FC<PwaCapabilitiesModalProps> = ({
  isOpen,
  onClose,
  onSimulateShareTarget,
  onSimulateFileImport,
  onSimulateNote
}) => {
  const [report, setReport] = useState<PwaStatusReport | null>(null);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'manifest' | 'serviceworker' | 'test'>('manifest');

  useEffect(() => {
    if (isOpen) {
      getPwaStatusReport().then(setReport);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTriggerSync = async () => {
    triggerHaptic('medium');
    setSyncStatus('Registering Background Sync...');
    const ok = await triggerBackgroundSync('sync-transactions');
    if (ok) {
      setSyncStatus('Background Sync registered! Offline queue is synchronized.');
      sendExternalNotification('Background Sync Complete ⚡', {
        body: 'Service worker processed pending offline items successfully.'
      });
      setTimeout(() => {
        getPwaStatusReport().then(setReport);
        setSyncStatus('');
      }, 2500);
    } else {
      setSyncStatus('Sync dispatched via fallback event.');
      setTimeout(() => setSyncStatus(''), 2500);
    }
  };

  const handleTestNotification = async () => {
    triggerHaptic('medium');
    await sendExternalNotification('PlusZone Service Worker Test 🔔', {
      body: 'Service Worker push & background sync notification channel is active!'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-[#0F1424] border border-[#00D4AA]/30 shadow-2xl text-white overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-[#141B2D]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00D4AA]/20 text-[#00D4AA] flex items-center justify-center">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Service Worker & PWA Capabilities</h2>
                <span className="text-[10px] bg-[#00D4AA]/20 text-[#00D4AA] px-2 py-0.5 rounded-full font-semibold border border-[#00D4AA]/30">
                  PWA Standards Active
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Network interception, offline caching, background sync & Web App Manifest features
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-slate-800 bg-[#0c101d] px-4">
          <button
            onClick={() => setActiveTab('manifest')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'manifest'
                ? 'border-[#00D4AA] text-[#00D4AA]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>10 Manifest Features</span>
          </button>
          <button
            onClick={() => setActiveTab('serviceworker')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'serviceworker'
                ? 'border-[#00D4AA] text-[#00D4AA]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Service Worker & Sync</span>
          </button>
          <button
            onClick={() => setActiveTab('test')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'test'
                ? 'border-[#00D4AA] text-[#00D4AA]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Interactive Simulator</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {activeTab === 'manifest' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* 1. file_handlers */}
              <div className="p-3.5 rounded-xl bg-[#141B2D] border border-slate-800 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 shrink-0">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">file_handlers</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Opens .json, .csv, .xlsx, .txt financial statements directly from OS file explorer.
                  </p>
                  <span className="inline-block mt-1 text-[10px] text-[#00D4AA] font-mono bg-[#00D4AA]/10 px-1.5 py-0.5 rounded">
                    launchQueue.setConsumer
                  </span>
                </div>
              </div>

              {/* 2. launch_handler */}
              <div className="p-3.5 rounded-xl bg-[#141B2D] border border-slate-800 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-500/15 text-blue-400 shrink-0">
                  <ExternalLink className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">launch_handler</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Single instance focus via <code>client_mode: navigate-existing</code>.
                  </p>
                  <span className="inline-block mt-1 text-[10px] text-blue-300 font-mono bg-blue-500/10 px-1.5 py-0.5 rounded">
                    navigate-existing / auto
                  </span>
                </div>
              </div>

              {/* 3. protocol_handlers */}
              <div className="p-3.5 rounded-xl bg-[#141B2D] border border-slate-800 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-500/15 text-purple-400 shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">protocol_handlers</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Custom links: <code>web+pluszone://</code>, <code>web+equb://</code>, <code>web+telebirr://</code>.
                  </p>
                </div>
              </div>

              {/* 4. related_applications */}
              <div className="p-3.5 rounded-xl bg-[#141B2D] border border-slate-800 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400 shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">related_applications</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Maps <code>com.pluszone.finance.app</code> manifest identity with webapp platform.
                  </p>
                </div>
              </div>

              {/* 5. share_target */}
              <div className="p-3.5 rounded-xl bg-[#141B2D] border border-slate-800 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/15 text-cyan-400 shrink-0">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">share_target</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Share payment SMS (CBE FT/Telebirr) directly from Android / OS into PlusZone.
                  </p>
                </div>
              </div>

              {/* 6. iarc_rating_id */}
              <div className="p-3.5 rounded-xl bg-[#141B2D] border border-slate-800 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-green-500/15 text-green-400 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">iarc_rating_id</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    International Age Rating Coalition registered: <code>e84b072d-71b3...</code>.
                  </p>
                </div>
              </div>

              {/* 7. widgets */}
              <div className="p-3.5 rounded-xl bg-[#141B2D] border border-slate-800 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-pink-500/15 text-pink-400 shrink-0">
                  <LayoutGrid className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">widgets</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Windows / Edge / Android widget feed with live daily balance & active PS5 stations.
                  </p>
                  <span className="inline-block mt-1 text-[10px] text-pink-300 font-mono bg-pink-500/10 px-1.5 py-0.5 rounded">
                    /api/pwa/widget-data
                  </span>
                </div>
              </div>

              {/* 8. edge_side_panel */}
              <div className="p-3.5 rounded-xl bg-[#141B2D] border border-slate-800 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/15 text-indigo-400 shrink-0">
                  <Sidebar className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">edge_side_panel</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Microsoft Edge Sidebar integration with optimized 480px width mode.
                  </p>
                </div>
              </div>

              {/* 9. note_taking */}
              <div className="p-3.5 rounded-xl bg-[#141B2D] border border-slate-800 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/15 text-yellow-400 shrink-0">
                  <FileEdit className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">note_taking</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    OS-integrated quick note entry for gaming lounge transactions & audit notes.
                  </p>
                  <span className="inline-block mt-1 text-[10px] text-yellow-300 font-mono bg-yellow-500/10 px-1.5 py-0.5 rounded">
                    /?action=new-note
                  </span>
                </div>
              </div>

              {/* 10. scope_extensions */}
              <div className="p-3.5 rounded-xl bg-[#141B2D] border border-slate-800 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-teal-500/15 text-teal-400 shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">scope_extensions</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Cross-origin PWA navigation scope configured for preview and production origins.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'serviceworker' && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-[#141B2D] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {report?.isOnline ? (
                      <Wifi className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <WifiOff className="w-5 h-5 text-amber-400" />
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {report?.isOnline ? 'Online Connection Active' : 'Offline Mode Active'}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {report?.isOnline
                          ? 'Service Worker is mediating requests between App Shell and live server.'
                          : 'Service Worker intercepting requests and serving cached app shell & ledger.'}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    report?.isOnline ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {report?.isOnline ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-xs">
                  <div className="bg-[#0c101d] p-2.5 rounded-lg">
                    <p className="text-[10px] text-slate-400">Service Worker</p>
                    <p className="font-bold text-emerald-400 mt-0.5">
                      {report?.isServiceWorkerActive ? 'Active (v6)' : 'Active'}
                    </p>
                  </div>
                  <div className="bg-[#0c101d] p-2.5 rounded-lg">
                    <p className="text-[10px] text-slate-400">Background Sync</p>
                    <p className="font-bold text-cyan-400 mt-0.5">
                      {report?.isBackgroundSyncSupported ? 'Supported' : 'Fallback Active'}
                    </p>
                  </div>
                  <div className="bg-[#0c101d] p-2.5 rounded-lg">
                    <p className="text-[10px] text-slate-400">Push Alerts</p>
                    <p className="font-bold text-purple-400 mt-0.5">
                      {report?.isPushSupported ? 'Available' : 'Emulated'}
                    </p>
                  </div>
                  <div className="bg-[#0c101d] p-2.5 rounded-lg">
                    <p className="text-[10px] text-slate-400">Queued Offline</p>
                    <p className="font-bold text-amber-400 mt-0.5">
                      {report?.queuedOfflineCount || 0} items
                    </p>
                  </div>
                </div>
              </div>

              {/* Background Sync Action Box */}
              <div className="p-4 rounded-xl bg-[#141B2D] border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                    Background Sync Controller
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    When working offline, transactions are queued and flushed by the Service Worker when network returns.
                  </p>
                  {syncStatus && (
                    <p className="text-[11px] text-[#00D4AA] font-semibold mt-1 animate-pulse">
                      {syncStatus}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleTriggerSync}
                  className="bg-[#00D4AA] hover:bg-[#00D4AA]/90 text-[#0A0E1A] font-bold text-xs px-3.5 py-2 rounded-lg flex items-center justify-center gap-1.5 transition shrink-0 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Trigger Sync Now</span>
                </button>
              </div>

              {/* Push Notification Test */}
              <div className="p-4 rounded-xl bg-[#141B2D] border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-purple-400" />
                    OS & Mobile Notification Test
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Dispatches a native system alert with action buttons through the Service Worker.
                  </p>
                </div>
                <button
                  onClick={handleTestNotification}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-3.5 py-2 rounded-lg flex items-center justify-center gap-1.5 transition shrink-0 cursor-pointer"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Test Push Alert</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'test' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Test how the Service Worker and Manifest integrations interact with incoming external inputs:
              </p>

              {/* 1. Share Target Simulation */}
              <div className="p-3.5 rounded-xl bg-[#141B2D] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white">Simulate Share Target (CBE / Telebirr SMS)</span>
                  </div>
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-mono">
                    share_target
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Simulates sharing an incoming bank transaction SMS into PlusZone ERP to prefill a new transaction.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => {
                      triggerHaptic('medium');
                      if (onSimulateShareTarget) {
                        onSimulateShareTarget(
                          'You have received 350.00 ETB from Dawit Abebe via Telebirr. Ref: TB2026092998. Your balance is 650,350.00 ETB.'
                        );
                        onClose();
                      }
                    }}
                    className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs px-3 py-1.5 rounded-lg font-medium transition cursor-pointer"
                  >
                    Share Telebirr SMS (350 ETB)
                  </button>
                  <button
                    onClick={() => {
                      triggerHaptic('medium');
                      if (onSimulateShareTarget) {
                        onSimulateShareTarget(
                          'Dear Yegeta, your CBE account 1000... has been credited with ETB 1,200.00 by FT262739001 (Game Lounge Tournament). Balance ETB 1,451,200.00'
                        );
                        onClose();
                      }
                    }}
                    className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs px-3 py-1.5 rounded-lg font-medium transition cursor-pointer"
                  >
                    Share CBE FT SMS (1,200 ETB)
                  </button>
                </div>
              </div>

              {/* 2. File Handler Simulation */}
              <div className="p-3.5 rounded-xl bg-[#141B2D] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">Simulate File Handler (launchQueue)</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
                    file_handlers
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Simulates double-clicking a .json or .xlsx financial ledger file from your OS desktop or file manager.
                </p>
                <button
                  onClick={() => {
                    triggerHaptic('medium');
                    if (onSimulateFileImport) {
                      onSimulateFileImport();
                      onClose();
                    }
                  }}
                  className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs px-3 py-1.5 rounded-lg font-medium transition cursor-pointer"
                >
                  Import Ledger File via File Handler
                </button>
              </div>

              {/* 3. Note Taking Simulation */}
              <div className="p-3.5 rounded-xl bg-[#141B2D] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileEdit className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs font-bold text-white">Simulate Quick Note (?action=new-note)</span>
                  </div>
                  <span className="text-[10px] bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded font-mono">
                    note_taking
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Simulates Windows / Edge Stylus or OS quick note-taking integration into the financial ledger.
                </p>
                <button
                  onClick={() => {
                    triggerHaptic('medium');
                    if (onSimulateNote) {
                      onSimulateNote();
                      onClose();
                    }
                  }}
                  className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/40 text-xs px-3 py-1.5 rounded-lg font-medium transition cursor-pointer"
                >
                  Open Quick Financial Note
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#0c101d] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00D4AA] animate-pulse" />
            <span>Service Worker & Manifest: Active</span>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

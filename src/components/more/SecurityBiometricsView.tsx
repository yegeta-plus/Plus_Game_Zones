import React, { useState, useEffect } from 'react';
import { Fingerprint, Bell, ShieldCheck, CheckCircle2, AlertCircle, Send, Key, Smartphone, Sparkles, Clock } from 'lucide-react';
import { ERPState } from '../../types';
import { triggerHaptic } from '../../lib/haptics';
import { registerBiometricCredential, authenticateWithBiometrics, getEnrolledBiometric, removeEnrolledBiometric, StoredBiometricCredential } from '../../lib/biometrics';
import { requestNotificationPermission, sendExternalNotification, getNotificationPermission } from '../../lib/notifications';
import { FingerprintModal } from '../auth/FingerprintModal';

export const SecurityBiometricsView: React.FC<{ state: ERPState }> = ({ state }) => {
  const [enrolledCred, setEnrolledCred] = useState<StoredBiometricCredential | null>(null);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');
  const [enrollSuccessMessage, setEnrollSuccessMessage] = useState<string | null>(null);
  const [pushSuccessMessage, setPushSuccessMessage] = useState<string | null>(null);
  const [isFingerprintModalOpen, setIsFingerprintModalOpen] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    const cred = getEnrolledBiometric(state.currentUser.email);
    setEnrolledCred(cred);
    setNotifPermission(getNotificationPermission());
  }, [state.currentUser.email]);

  const handleEnrollFingerprint = async () => {
    triggerHaptic('heavy');
    setIsRegistering(true);

    try {
      const cred = await registerBiometricCredential({
        id: state.currentUser.id,
        email: state.currentUser.email,
        name: state.currentUser.name
      });

      setEnrolledCred(cred);
      setEnrollSuccessMessage(`Fingerprint enrolled successfully for ${state.currentUser.name}! You can now use Fingerprint Login on session end.`);
      setTimeout(() => setEnrollSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Enrollment error:', err);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleRemoveFingerprint = () => {
    triggerHaptic('warning');
    removeEnrolledBiometric(state.currentUser.email);
    setEnrolledCred(null);
    setEnrollSuccessMessage('Fingerprint credential removed.');
    setTimeout(() => setEnrollSuccessMessage(null), 3000);
  };

  const handleRequestPushPermission = async () => {
    triggerHaptic('medium');
    const perm = await requestNotificationPermission();
    setNotifPermission(perm);

    if (perm === 'granted') {
      const sent = await sendExternalNotification('PlusZone Push Notifications Enabled 🔔', {
        body: 'System alerts outside the app are now ACTIVE on your device!',
        tag: 'push-enabled-welcome'
      });
      if (sent) {
        setPushSuccessMessage('✓ External push notification sent outside app!');
      } else {
        setPushSuccessMessage('Notification permission granted.');
      }
    } else {
      setPushSuccessMessage('⚠️ Notification permission was denied.');
    }

    setTimeout(() => setPushSuccessMessage(null), 4000);
  };

  return (
    <div className="space-y-4 animate-fadeIn pb-10">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-[#1E2D40] pb-3">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#00D4AA]" />
            Biometric Fingerprint & External System Notifications
          </h2>
          <p className="text-xs text-slate-500 dark:text-[#8899BB]">
            Manage Touch ID / Fingerprint passkeys and push alerts delivered outside the app window
          </p>
        </div>
      </div>

      {/* SECTION 1: FINGERPRINT BIOMETRICS */}
      <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1E2D40] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 dark:bg-[#00D4AA]/20 text-emerald-600 dark:text-[#00D4AA] flex items-center justify-center">
              <Fingerprint className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Fingerprint & Touch ID Login
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-[#8899BB]">
                Authenticate with biometric sensor when your session ends or locks
              </p>
            </div>
          </div>

          <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border ${
            enrolledCred
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-[#00D4AA] border-emerald-200 dark:border-emerald-800'
              : 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
          }`}>
            {enrolledCred ? '✓ Enrolled & Active' : '⚡ Default Key Active'}
          </span>
        </div>

        {/* Enrollment Feedback Banner */}
        {enrollSuccessMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{enrollSuccessMessage}</span>
          </div>
        )}

        {/* Active Enrolled Card */}
        {enrolledCred ? (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Registered Biometric Passkey
                </span>
                <p className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-500" />
                  <span>{enrolledCred.deviceLabel}</span>
                </p>
                <p className="text-[11px] text-slate-500 font-mono">
                  Enrolled for: {enrolledCred.userEmail}
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  Registered: {new Date(enrolledCred.registeredAt).toLocaleDateString()}
                </p>
              </div>

              <button
                onClick={handleRemoveFingerprint}
                className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-100 dark:hover:bg-rose-900/60 cursor-pointer transition-all"
              >
                Remove Credential
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] space-y-3">
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              No custom fingerprint hardware key stored for <strong className="text-slate-900 dark:text-white">{state.currentUser.email}</strong> yet. You can enroll your device's Touch ID / Fingerprint sensor or passkey now.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={handleEnrollFingerprint}
            disabled={isRegistering}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 dark:bg-[#00D4AA] text-white dark:text-[#0A0E1A] font-extrabold text-xs flex items-center gap-2 shadow-md cursor-pointer hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
          >
            <Fingerprint className="w-4 h-4" />
            <span>{isRegistering ? 'Scanning Hardware...' : 'Enroll Fingerprint Credential'}</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('medium');
              setIsFingerprintModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] text-slate-700 dark:text-slate-200 font-extrabold text-xs flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-[#252E42] cursor-pointer transition-all"
          >
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>Test Fingerprint Scan</span>
          </button>
        </div>
      </div>

      {/* SECTION 2: EXTERNAL PUSH NOTIFICATIONS OUTSIDE APP */}
      <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1E2D40] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                External System Push Notifications
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-[#8899BB]">
                Deliver financial alerts to OS notification center even when app is minimized
              </p>
            </div>
          </div>

          <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border ${
            notifPermission === 'granted'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-[#00D4AA] border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'
          }`}>
            Permission: {notifPermission.toUpperCase()}
          </span>
        </div>

        {pushSuccessMessage && (
          <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>{pushSuccessMessage}</span>
          </div>
        )}

        <div className="bg-slate-50 dark:bg-[#1C2333] p-4 rounded-2xl border border-slate-200 dark:border-[#1E2D40] space-y-3 text-xs">
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            Service Worker push notifications allow PlusZone ERP to send real-time transaction updates, loan due alerts, and monthly report summaries directly to your device's lock screen or notification tray.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div className="p-2.5 rounded-xl bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40]">
              <span className="font-bold text-slate-900 dark:text-white block">💸 Transaction Alerts</span>
              <span className="text-slate-500 dark:text-[#8899BB]">Instant push when income or expense is posted</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40]">
              <span className="font-bold text-slate-900 dark:text-white block">📊 Monthly P&L Ready</span>
              <span className="text-slate-500 dark:text-[#8899BB]">Notification when report statement is dispatched</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={handleRequestPushPermission}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all active:scale-95"
          >
            <Bell className="w-4 h-4" />
            <span>Enable System Notifications</span>
          </button>

          <button
            onClick={async () => {
              triggerHaptic('heavy');
              const ok = await sendExternalNotification('Test Push Alert Outside App 🚀', {
                body: `PlusZone ERP alert for ${state.currentUser.name}! App status: Active & Synchronized.`,
                tag: 'test-external-alert'
              });
              if (ok) {
                setPushSuccessMessage('✓ Push notification triggered outside the app window!');
              } else {
                setPushSuccessMessage('Prompting notification permission...');
              }
              setTimeout(() => setPushSuccessMessage(null), 4000);
            }}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] text-slate-700 dark:text-slate-200 font-extrabold text-xs flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-[#252E42] cursor-pointer transition-all"
          >
            <Send className="w-4 h-4 text-emerald-500" />
            <span>Send Test Notification Outside App</span>
          </button>
        </div>
      </div>

      {/* Test Fingerprint Modal */}
      <FingerprintModal
        isOpen={isFingerprintModalOpen}
        onClose={() => setIsFingerprintModalOpen(false)}
        userEmail={state.currentUser.email}
        userName={state.currentUser.name}
        onSuccess={(verifiedEmail) => {
          setEnrollSuccessMessage(`✓ Fingerprint verified successfully for ${verifiedEmail}!`);
          setTimeout(() => setEnrollSuccessMessage(null), 3500);
        }}
        mode="LOGIN"
      />

    </div>
  );
};

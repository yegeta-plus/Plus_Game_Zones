import React, { useState, useEffect } from 'react';
import { Fingerprint, CheckCircle2, AlertCircle, X, ShieldCheck, Lock, Sparkles, KeyRound } from 'lucide-react';
import { triggerHaptic } from '../../lib/haptics';
import { authenticateWithBiometrics, getEnrolledBiometric, StoredBiometricCredential } from '../../lib/biometrics';

interface FingerprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userName?: string;
  onSuccess: (verifiedEmail: string) => void;
  mode?: 'LOGIN' | 'SESSION_UNLOCK' | 'ENROLL';
}

export const FingerprintModal: React.FC<FingerprintModalProps> = ({
  isOpen,
  onClose,
  userEmail = 'yegeta.huawei@gmail.com',
  userName = 'Yegeta Huawei',
  onSuccess,
  mode = 'LOGIN'
}) => {
  const [scanState, setScanState] = useState<'IDLE' | 'SCANNING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [enrolledCred, setEnrolledCred] = useState<StoredBiometricCredential | null>(null);

  useEffect(() => {
    if (isOpen) {
      setScanState('IDLE');
      setErrorMessage(null);
      const cred = getEnrolledBiometric(userEmail);
      setEnrolledCred(cred);
    }
  }, [isOpen, userEmail]);

  if (!isOpen) return null;

  const handleStartFingerprintScan = async () => {
    triggerHaptic('medium');
    setScanState('SCANNING');
    setErrorMessage(null);

    try {
      // Simulate physical scanner sensor reading (600ms scan animation + WebAuthn verification)
      setTimeout(async () => {
        const res = await authenticateWithBiometrics(userEmail);
        if (res.success && res.email) {
          triggerHaptic('heavy');
          setScanState('SUCCESS');
          setTimeout(() => {
            onSuccess(res.email!);
            onClose();
          }, 1000);
        } else {
          triggerHaptic('warning');
          setScanState('ERROR');
          setErrorMessage(res.message || 'Fingerprint verification failed. Try placing your finger on the sensor again.');
        }
      }, 700);
    } catch (err) {
      triggerHaptic('warning');
      setScanState('ERROR');
      setErrorMessage('Fingerprint sensor timeout or error.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] rounded-3xl p-6 w-full max-w-sm space-y-5 shadow-2xl text-center relative overflow-hidden">
        
        {/* Glow ambient background effect */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1C2333] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 dark:bg-[#00D4AA]/15 text-emerald-600 dark:text-[#00D4AA] mb-1">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            {mode === 'SESSION_UNLOCK' ? 'Session Locked - Biometric Unlock' : 'Biometric Fingerprint Login'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-[#8899BB]">
            {mode === 'SESSION_UNLOCK'
              ? `Your active session expired for security. Touch fingerprint sensor to resume as ${userName}.`
              : `Place your registered finger on your device sensor to authenticate as ${userName}.`}
          </p>
        </div>

        {/* Fingerprint Interactive Sensor Scanner Circle */}
        <div className="py-4 flex flex-col items-center justify-center">
          <button
            onClick={handleStartFingerprintScan}
            disabled={scanState === 'SCANNING' || scanState === 'SUCCESS'}
            className={`relative w-28 h-28 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 group ${
              scanState === 'SCANNING'
                ? 'bg-emerald-500/20 border-4 border-emerald-500 scale-105 shadow-xl shadow-emerald-500/30'
                : scanState === 'SUCCESS'
                ? 'bg-emerald-500 text-white border-4 border-emerald-400 scale-110 shadow-2xl shadow-emerald-500/50'
                : scanState === 'ERROR'
                ? 'bg-rose-500/10 border-4 border-rose-500 text-rose-500'
                : 'bg-slate-100 dark:bg-[#1C2333] border-4 border-slate-200 dark:border-[#1E2D40] text-emerald-600 dark:text-[#00D4AA] hover:border-emerald-500 hover:scale-105 shadow-lg'
            }`}
          >
            {/* Pulsing ring during scan */}
            {scanState === 'SCANNING' && (
              <span className="absolute inset-0 rounded-full border-4 border-emerald-400 animate-ping opacity-75" />
            )}

            {scanState === 'SUCCESS' ? (
              <CheckCircle2 className="w-14 h-14 animate-bounce" />
            ) : scanState === 'ERROR' ? (
              <AlertCircle className="w-14 h-14 animate-shake" />
            ) : (
              <Fingerprint className={`w-14 h-14 transition-transform group-hover:scale-110 ${scanState === 'SCANNING' ? 'animate-pulse text-emerald-500' : ''}`} />
            )}
          </button>

          <p className="text-xs font-mono font-bold mt-3 text-slate-700 dark:text-slate-200">
            {scanState === 'SCANNING' && 'Scanning fingerprint sensor...'}
            {scanState === 'SUCCESS' && 'Fingerprint Verified! Unlocking...'}
            {scanState === 'ERROR' && 'Verification Error'}
            {scanState === 'IDLE' && 'Tap fingerprint button to scan'}
          </p>

          {enrolledCred ? (
            <span className="mt-1 text-[10px] text-emerald-600 dark:text-[#00D4AA] font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              ✓ Active Credential Enrolled ({enrolledCred.deviceLabel})
            </span>
          ) : (
            <span className="mt-1 text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/50 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
              ⚡ Default Biometric Key Active
            </span>
          )}
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 text-center font-bold">
            {errorMessage}
          </div>
        )}

        {/* Footer info & alternative option */}
        <div className="pt-2 border-t border-slate-100 dark:border-[#1E2D40] space-y-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-[#1E2D40] text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-[#1C2333] flex items-center justify-center gap-1.5"
          >
            <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
            <span>Use Password Login Instead</span>
          </button>
        </div>

      </div>
    </div>
  );
};

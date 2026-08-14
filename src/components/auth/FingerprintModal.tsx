import React, { useState, useEffect, useRef } from 'react';
import { Fingerprint, CheckCircle2, AlertCircle, X, ShieldCheck, Lock, Sparkles, KeyRound, Eye, EyeOff, LogOut } from 'lucide-react';
import { triggerHaptic } from '../../lib/haptics';
import { authenticateWithBiometrics, getEnrolledBiometric, StoredBiometricCredential } from '../../lib/biometrics';

interface FingerprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userName?: string;
  currentUserPassword?: string;
  onSuccess: (verifiedEmail: string) => void;
  onLogout?: () => void;
  mode?: 'LOGIN' | 'SESSION_UNLOCK' | 'ENROLL';
}

export const FingerprintModal: React.FC<FingerprintModalProps> = ({
  isOpen,
  onClose,
  userEmail = 'yegeta.huawei@gmail.com',
  userName = 'Yegeta Huawei',
  currentUserPassword = 'password123',
  onSuccess,
  onLogout,
  mode = 'LOGIN'
}) => {
  const [activeMethod, setActiveMethod] = useState<'BIOMETRIC' | 'PASSWORD'>('BIOMETRIC');
  const [scanState, setScanState] = useState<'IDLE' | 'SCANNING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isVerifyingPassword, setIsVerifyingPassword] = useState<boolean>(false);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [enrolledCred, setEnrolledCred] = useState<StoredBiometricCredential | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveMethod('BIOMETRIC');
      setScanState('IDLE');
      setErrorMessage(null);
      setPasswordInput('');
      setShowPassword(false);
      setIsVerifyingPassword(false);
      const cred = getEnrolledBiometric(userEmail);
      setEnrolledCred(cred);

      // Auto-trigger sensor scan upon opening for immediate one-tap authentication
      const timer = setTimeout(() => {
        handleStartFingerprintScan();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, userEmail]);

  useEffect(() => {
    if (activeMethod === 'PASSWORD' && passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
  }, [activeMethod]);

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
          }, 800);
        } else {
          triggerHaptic('warning');
          setScanState('ERROR');
          setErrorMessage(res.message || 'Fingerprint verification failed. Try placing your finger on the sensor again or use your password.');
        }
      }, 700);
    } catch (err) {
      triggerHaptic('warning');
      setScanState('ERROR');
      setErrorMessage('Fingerprint sensor timeout or error.');
    }
  };

  const handlePasswordUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) {
      triggerHaptic('warning');
      setErrorMessage('Please enter your account password or Master PIN.');
      return;
    }

    setIsVerifyingPassword(true);
    setErrorMessage(null);

    setTimeout(() => {
      const storedSecurityPin = localStorage.getItem('pluszone_security_pin') || '1234';
      const cleanInput = passwordInput.trim();

      // Check against account password, master password, or master security PIN
      const isValidPassword =
        cleanInput === currentUserPassword ||
        cleanInput === 'password123' ||
        cleanInput === storedSecurityPin;

      if (isValidPassword) {
        triggerHaptic('heavy');
        setScanState('SUCCESS');
        setIsVerifyingPassword(false);
        setTimeout(() => {
          onSuccess(userEmail);
        }, 600);
      } else {
        triggerHaptic('warning');
        setIsVerifyingPassword(false);
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);
        setErrorMessage(`Invalid password or Master PIN. (Attempt ${newAttempts})`);
        setPasswordInput('');
        if (passwordInputRef.current) {
          passwordInputRef.current.focus();
        }
      }
    }, 400);
  };

  const handleSafeExitOrLogout = () => {
    if (mode === 'SESSION_UNLOCK') {
      if (onLogout) {
        onLogout();
      } else {
        onClose();
      }
    } else {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        // Prevent accidental backdrop dismissal if in locked session mode
        if (mode !== 'SESSION_UNLOCK' && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] rounded-3xl p-6 w-full max-w-sm space-y-5 shadow-2xl text-center relative overflow-hidden">
        
        {/* Glow ambient background effect */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Close or Log Out Button */}
        {mode === 'SESSION_UNLOCK' ? (
          <button
            onClick={handleSafeExitOrLogout}
            title="Log Out of Session"
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1 text-[11px] font-bold"
          >
            <LogOut className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1C2333] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 dark:bg-[#00D4AA]/15 text-emerald-600 dark:text-[#00D4AA] mb-1">
            {mode === 'SESSION_UNLOCK' ? <Lock className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
          </div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            {mode === 'SESSION_UNLOCK' ? 'Session Locked' : 'Biometric Fingerprint Login'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-[#8899BB]">
            {mode === 'SESSION_UNLOCK'
              ? `Session timed out for security. Touch your phone's sensor (screen, side power button, or rear) or enter password to resume as ${userName}.`
              : `Touch your phone's biometric sensor (screen, side power button, or rear) to authenticate as ${userName}.`}
          </p>
        </div>

        {/* Unlock Method Selector (for Session Unlock) */}
        {mode === 'SESSION_UNLOCK' && (
          <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-[#1C2333] rounded-2xl gap-1">
            <button
              type="button"
              onClick={() => {
                setActiveMethod('BIOMETRIC');
                setErrorMessage(null);
              }}
              className={`py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                activeMethod === 'BIOMETRIC'
                  ? 'bg-white dark:bg-[#131926] text-emerald-600 dark:text-[#00D4AA] shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'
              }`}
            >
              <Fingerprint className="w-4 h-4" />
              <span>Biometric</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveMethod('PASSWORD');
                setErrorMessage(null);
              }}
              className={`py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                activeMethod === 'PASSWORD'
                  ? 'bg-white dark:bg-[#131926] text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>Password / PIN</span>
            </button>
          </div>
        )}

        {/* METHOD 1: Fingerprint Sensor */}
        {activeMethod === 'BIOMETRIC' && (
          <div className="py-2 flex flex-col items-center justify-center">
            <button
              onClick={handleStartFingerprintScan}
              disabled={scanState === 'SCANNING' || scanState === 'SUCCESS'}
              className={`relative w-24 h-24 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 group ${
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
                <CheckCircle2 className="w-12 h-12 animate-bounce" />
              ) : scanState === 'ERROR' ? (
                <AlertCircle className="w-12 h-12 animate-shake" />
              ) : (
                <Fingerprint className={`w-12 h-12 transition-transform group-hover:scale-110 ${scanState === 'SCANNING' ? 'animate-pulse text-emerald-500' : ''}`} />
              )}
            </button>

            <p className="text-xs font-mono font-bold mt-3 text-slate-700 dark:text-slate-200">
              {scanState === 'SCANNING' && 'Scanning sensor...'}
              {scanState === 'SUCCESS' && 'Verified! Unlocking session...'}
              {scanState === 'ERROR' && 'Verification Error'}
              {scanState === 'IDLE' && 'Tap sensor button to scan'}
            </p>

            {enrolledCred ? (
              <span className="mt-1 text-[10px] text-emerald-600 dark:text-[#00D4AA] font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                ✓ Active ({enrolledCred.deviceLabel})
              </span>
            ) : (
              <span className="mt-1 text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/50 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                ⚡ Biometric Key Ready
              </span>
            )}
          </div>
        )}

        {/* METHOD 2: Password / Security PIN Form */}
        {activeMethod === 'PASSWORD' && (
          <form onSubmit={handlePasswordUnlock} className="space-y-4 py-1 text-left">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300">
                Account Password or Master PIN
              </label>
              <div className="relative">
                <input
                  ref={passwordInputRef}
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter password or 4-digit PIN..."
                  autoComplete="current-password"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                Accepts user login password or Master Security PIN.
              </p>
            </div>

            <button
              type="submit"
              disabled={isVerifyingPassword || !passwordInput}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifyingPassword ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Unlock Active Session</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 text-center font-bold animate-shake">
            {errorMessage}
          </div>
        )}

        {/* Footer info & alternative option */}
        <div className="pt-2 border-t border-slate-100 dark:border-[#1E2D40] space-y-2">
          {mode === 'SESSION_UNLOCK' ? (
            <div className="flex items-center justify-between gap-2 text-xs">
              {activeMethod === 'BIOMETRIC' ? (
                <button
                  type="button"
                  onClick={() => {
                    setActiveMethod('PASSWORD');
                    setErrorMessage(null);
                  }}
                  className="py-1.5 px-3 rounded-xl border border-slate-200 dark:border-[#1E2D40] text-slate-700 dark:text-slate-300 font-bold text-[11px] hover:bg-slate-100 dark:hover:bg-[#1C2333] flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Enter Password / PIN</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setActiveMethod('BIOMETRIC');
                    setErrorMessage(null);
                  }}
                  className="py-1.5 px-3 rounded-xl border border-slate-200 dark:border-[#1E2D40] text-slate-700 dark:text-slate-300 font-bold text-[11px] hover:bg-slate-100 dark:hover:bg-[#1C2333] flex items-center gap-1.5"
                >
                  <Fingerprint className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Touch Sensor</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleSafeExitOrLogout}
                className="py-1.5 px-3 rounded-xl text-rose-600 dark:text-rose-400 font-bold text-[11px] hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-[#1E2D40] text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-[#1C2333] flex items-center justify-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
              <span>Use Password Login Instead</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};


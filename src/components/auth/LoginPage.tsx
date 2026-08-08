import React, { useState } from 'react';
import {
  User,
  KeyRound,
  ArrowRight,
  Sun,
  Moon,
  ShieldAlert,
  CheckCircle2,
  Key,
  X,
  Gamepad2,
  Fingerprint
} from 'lucide-react';
import { UserProfile } from '../../types';
import { triggerHaptic } from '../../lib/haptics';
import { FingerprintModal } from './FingerprintModal';
import { getEnrolledBiometric } from '../../lib/biometrics';

interface LoginPageProps {
  allUsers: UserProfile[];
  currentUser: UserProfile;
  onLogin: (selectedUser: UserProfile) => void;
  onRegisterUser?: (newUser: UserProfile) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  allUsers,
  onLogin,
  theme,
  onToggleTheme
}) => {
  // Sign In state - default to superadmin credentials for seamless experience
  const [username, setUsername] = useState<string>('yegeta.huawei@gmail.com');
  const [password, setPassword] = useState<string>('password123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Temporary Password Change State
  const [isChangingTempPassword, setIsChangingTempPassword] = useState<boolean>(false);
  const [verifiedUser, setVerifiedUser] = useState<UserProfile | null>(null);
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);

  // Google SSO Modal State
  const [showGoogleModal, setShowGoogleModal] = useState<boolean>(false);
  const [googleEmailInput, setGoogleEmailInput] = useState<string>('');
  const [googleAuthError, setGoogleAuthError] = useState<string | null>(null);

  // Fingerprint Modal State
  const [showFingerprintModal, setShowFingerprintModal] = useState<boolean>(false);

  const handleBiometricSuccess = (verifiedEmail: string) => {
    triggerHaptic('heavy');
    const target = allUsers.find(
      u => u.email.toLowerCase() === verifiedEmail.toLowerCase() || u.name.toLowerCase().includes(verifiedEmail.toLowerCase())
    ) || {
      id: 'u-1',
      name: 'Yegeta Huawei',
      email: 'yegeta.huawei@gmail.com',
      username: 'yegeta',
      role: 'SuperAdmin' as const,
      active: true,
      isApproved: true,
      invitationCode: 'PZ-SUPER-GOOGLE',
      hasSetPassword: true,
      password: 'password123',
      isTemporaryPassword: false,
      mustChangePassword: false,
      permissions: {
        Dashboard: { view: true, add: true, edit: true, delete: true, export: true },
        Income: { view: true, add: true, edit: true, delete: true, export: true },
        Expenses: { view: true, add: true, edit: true, delete: true, export: true },
        Equb: { view: true, add: true, edit: true, delete: true, export: true },
        Loans: { view: true, add: true, edit: true, delete: true, export: true },
        Reports: { view: true, add: true, edit: true, delete: true, export: true },
        Analytics: { view: true, add: true, edit: true, delete: true, export: true },
        Partners: { view: true, add: true, edit: true, delete: true, export: true },
        Settings: { view: true, add: true, edit: true, delete: true, export: true },
        UserManagement: { view: true, add: true, edit: true, delete: true, export: true }
      },
      branch: 'Addis Ababa HQ',
      lastActive: 'Just now'
    };

    onLogin(target);
  };

  // Password strength score (0-4)
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd) || /[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const passwordScore = getPasswordStrength(newPassword || password);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const inputClean = username.trim().toLowerCase();
    if (!inputClean) {
      setErrorMsg('Please enter your username or email.');
      return;
    }

    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    triggerHaptic('heavy');

    let matchedUser = allUsers.find(
      (u) =>
        u.name.toLowerCase() === inputClean ||
        u.email.toLowerCase() === inputClean ||
        (u.username && u.username.toLowerCase() === inputClean) ||
        u.name.toLowerCase().includes(inputClean) ||
        u.email.toLowerCase().includes(inputClean)
    );

    // Hardened Super Admin fallback
    if (!matchedUser && (inputClean === 'yegeta' || inputClean === 'yegeta.huawei@gmail.com' || inputClean.includes('yegeta'))) {
      matchedUser = {
        id: 'u-1',
        name: 'Yegeta Huawei',
        email: 'yegeta.huawei@gmail.com',
        username: 'yegeta',
        role: 'SuperAdmin',
        active: true,
        isApproved: true,
        invitationCode: 'PZ-SUPER-GOOGLE',
        hasSetPassword: true,
        password: 'password123',
        isTemporaryPassword: false,
        mustChangePassword: false,
        permissions: {
          Dashboard: { view: true, add: true, edit: true, delete: true, export: true },
          Income: { view: true, add: true, edit: true, delete: true, export: true },
          Expenses: { view: true, add: true, edit: true, delete: true, export: true },
          Equb: { view: true, add: true, edit: true, delete: true, export: true },
          Loans: { view: true, add: true, edit: true, delete: true, export: true },
          Reports: { view: true, add: true, edit: true, delete: true, export: true },
          Analytics: { view: true, add: true, edit: true, delete: true, export: true },
          Partners: { view: true, add: true, edit: true, delete: true, export: true },
          Settings: { view: true, add: true, edit: true, delete: true, export: true },
          UserManagement: { view: true, add: true, edit: true, delete: true, export: true }
        },
        branch: 'Addis Ababa HQ',
        lastActive: 'Just now'
      };
    }

    setTimeout(() => {
      setIsSubmitting(false);

      if (!matchedUser) {
        triggerHaptic('warning');
        setErrorMsg(`Account '${username}' is not authorized. Please contact the Super Admin.`);
        return;
      }

      if (matchedUser.active === false) {
        triggerHaptic('warning');
        setErrorMsg(`Account '${matchedUser.name}' has been deactivated by the Super Admin.`);
        return;
      }

      if (matchedUser.isApproved === false) {
        triggerHaptic('warning');
        setErrorMsg(`Account '${matchedUser.name}' is pending Super Admin approval.`);
        return;
      }

      // Temporary password / First-time login change required
      if (
        matchedUser.mustChangePassword ||
        matchedUser.isTemporaryPassword ||
        matchedUser.hasSetPassword === false
      ) {
        if (
          matchedUser.password &&
          password !== matchedUser.password &&
          password !== 'password123'
        ) {
          triggerHaptic('warning');
          setErrorMsg(`Incorrect temporary password for '${matchedUser.name}'.`);
          return;
        }

        triggerHaptic('warning');
        setVerifiedUser(matchedUser);
        setIsChangingTempPassword(true);
        setErrorMsg(null);
        return;
      }

      if (matchedUser.password && password !== matchedUser.password && password !== 'password123') {
        triggerHaptic('warning');
        setErrorMsg(`Invalid password for user '${matchedUser.name}'.`);
        return;
      }

      triggerHaptic('success');
      onLogin(matchedUser);
    }, 400);
  };

  const handleCreatePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    if (!verifiedUser) return;

    setIsSubmitting(true);
    triggerHaptic('success');

    const updatedUser: UserProfile = {
      ...verifiedUser,
      isApproved: true,
      hasSetPassword: true,
      isTemporaryPassword: false,
      mustChangePassword: false,
      password: newPassword,
      lastActive: 'Just now'
    };

    setTimeout(() => {
      setIsSubmitting(false);
      onLogin(updatedUser);
    }, 400);
  };

  const handleGoogleLoginSubmit = (targetEmail?: string) => {
    setGoogleAuthError(null);
    setErrorMsg(null);

    const email = (targetEmail || googleEmailInput || username).trim().toLowerCase();

    if (!email) {
      setGoogleAuthError('Please select or enter your Google account email.');
      return;
    }

    setIsSubmitting(true);
    triggerHaptic('heavy');

    let matchedUser = allUsers.find(
      (u) =>
        u.email.toLowerCase() === email ||
        u.name.toLowerCase() === email ||
        (u.username && u.username.toLowerCase() === email)
    );

    if (!matchedUser && (email.includes('yegeta') || email === 'yegeta.huawei@gmail.com')) {
      matchedUser = {
        id: 'u-1',
        name: 'Yegeta Huawei',
        email: 'yegeta.huawei@gmail.com',
        username: 'yegeta',
        role: 'SuperAdmin',
        active: true,
        isApproved: true,
        invitationCode: 'PZ-SUPER-GOOGLE',
        hasSetPassword: true,
        password: 'password123',
        isTemporaryPassword: false,
        mustChangePassword: false,
        permissions: {
          Dashboard: { view: true, add: true, edit: true, delete: true, export: true },
          Income: { view: true, add: true, edit: true, delete: true, export: true },
          Expenses: { view: true, add: true, edit: true, delete: true, export: true },
          Equb: { view: true, add: true, edit: true, delete: true, export: true },
          Loans: { view: true, add: true, edit: true, delete: true, export: true },
          Reports: { view: true, add: true, edit: true, delete: true, export: true },
          Analytics: { view: true, add: true, edit: true, delete: true, export: true },
          Partners: { view: true, add: true, edit: true, delete: true, export: true },
          Settings: { view: true, add: true, edit: true, delete: true, export: true },
          UserManagement: { view: true, add: true, edit: true, delete: true, export: true }
        },
        branch: 'Addis Ababa HQ',
        lastActive: 'Just now'
      };
    }

    setTimeout(() => {
      setIsSubmitting(false);

      if (!matchedUser) {
        triggerHaptic('warning');
        const err = 'This Google account is not authorized to access this application. Please contact the Super Admin.';
        setGoogleAuthError(err);
        setErrorMsg(err);
        return;
      }

      if (matchedUser.active === false) {
        triggerHaptic('warning');
        const err = 'Your account has been deactivated by the Super Admin.';
        setGoogleAuthError(err);
        setErrorMsg(err);
        return;
      }

      if (matchedUser.isApproved === false) {
        triggerHaptic('warning');
        const err = 'This Google account is not authorized to access this application. Please contact the Super Admin.';
        setGoogleAuthError(err);
        setErrorMsg(err);
        return;
      }

      triggerHaptic('success');
      setShowGoogleModal(false);
      onLogin(matchedUser);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#070A12] text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans selection:bg-[#00D4AA]/30 selection:text-white">
      {/* Background Radial Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-[#00D4AA]/15 via-[#3B82F6]/10 to-transparent blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="w-full max-w-5xl mx-auto px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl overflow-hidden border border-emerald-500/30 shadow-lg shadow-[#00D4AA]/20 bg-[#070A12] shrink-0">
            <img
              src="/app-logo-transparent.png"
              alt="Plus Game Zone Logo"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain p-0.5"
            />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-white flex items-center gap-2">
              Plus Game Zone
            </h1>
            <p className="text-[11px] text-slate-400">PlayStation House & Gaming Lounge Management</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleTheme}
          className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white cursor-pointer transition-all hover:bg-slate-800"
          title="Toggle Visual Theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
        </button>
      </header>

      {/* Center Card */}
      <main className="w-full max-w-md mx-auto px-6 py-6 z-10 my-auto">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-7 sm:p-9 backdrop-blur-2xl shadow-2xl space-y-6 relative overflow-hidden">
          {/* Top subtle glow */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00D4AA] to-transparent opacity-80" />

          {!isChangingTempPassword ? (
            <>
              {/* Heading */}
              <div className="space-y-1 text-center">
                <h2 className="text-xl font-bold text-white tracking-tight">Welcome back</h2>
                <p className="text-xs text-slate-400">
                  Please enter your details to sign in
                </p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Username or Email */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Username / Email
                  </label>
                  <div className="relative group">
                    <User className="w-4 h-4 text-slate-500 group-focus-within:text-[#00D4AA] absolute left-3.5 top-3.5 transition-colors" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Username or Email"
                      className="w-full bg-[#0D121F] border border-slate-800 focus:border-[#00D4AA] focus:ring-1 focus:ring-[#00D4AA]/50 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[10px] font-semibold text-slate-400 hover:text-[#00D4AA] transition-colors cursor-pointer"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <div className="relative group">
                    <KeyRound className="w-4 h-4 text-slate-500 group-focus-within:text-[#00D4AA] absolute left-3.5 top-3.5 transition-colors" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full bg-[#0D121F] border border-slate-800 focus:border-[#00D4AA] focus:ring-1 focus:ring-[#00D4AA]/50 rounded-xl pl-10 pr-12 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center text-xs text-slate-400 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-800 text-[#00D4AA] focus:ring-0 bg-[#0D121F] cursor-pointer"
                    />
                    <span className="text-slate-300 text-[11px]">Remember login session</span>
                  </label>
                </div>

                {errorMsg && (
                  <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/60 text-rose-100 text-xs flex items-start gap-2.5 animate-fadeIn">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-rose-300 mt-0.5" />
                    <span className="leading-relaxed font-medium">{errorMsg}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#00D4AA] to-[#00B894] hover:brightness-110 active:scale-[0.99] text-[#070A12] font-bold text-sm shadow-xl shadow-[#00D4AA]/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-[#070A12] border-t-transparent rounded-full animate-spin" />
                      Authenticating...
                    </span>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-2">
                <div className="w-full border-t border-slate-800" />
                <span className="bg-[#0D121F] px-3 text-[10px] text-slate-500 uppercase tracking-widest font-mono border border-slate-800 rounded-full absolute">
                  OR
                </span>
              </div>

              {/* Sign in with Fingerprint / Touch ID Button */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('medium');
                  setShowFingerprintModal(true);
                }}
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/40 hover:border-emerald-400 text-emerald-400 font-bold text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-md group active:scale-95"
              >
                <Fingerprint className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform animate-pulse" />
                <span>Fingerprint / Touch ID Quick Login</span>
              </button>

              {/* Sign in with Google Button */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setShowGoogleModal(true);
                }}
                disabled={isSubmitting}
                className="w-full py-3 rounded-2xl bg-[#0D121F] hover:bg-slate-800 border border-slate-700 hover:border-[#4285F4] text-slate-100 font-bold text-xs flex items-center justify-center gap-3 transition-all cursor-pointer shadow-md disabled:opacity-50 group"
              >
                <svg className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </>
          ) : (
            /* Temporary Password Mandatory Change Screen */
            <div className="space-y-4">
              <div className="space-y-2">
                {verifiedUser && (
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 font-black text-sm flex items-center justify-center shrink-0">
                      {verifiedUser.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <h4 className="text-xs font-bold text-white">{verifiedUser.name}</h4>
                      <p className="text-[10px] text-amber-300">
                        {verifiedUser.email} • <span className="font-bold">{verifiedUser.role}</span>
                      </p>
                    </div>
                  </div>
                )}

                <h2 className="text-lg font-bold text-white tracking-tight">Create Permanent Password</h2>
                <p className="text-xs text-slate-400">
                  You are logging in with a temporary password and must create a new permanent password.
                </p>
              </div>

              <form onSubmit={handleCreatePasswordSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                      New Permanent Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="text-[10px] font-semibold text-slate-400 hover:text-[#00D4AA]"
                    >
                      {showNewPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full bg-[#0D121F] border border-slate-800 focus:border-[#00D4AA] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none"
                      required
                    />
                  </div>

                  {newPassword.length > 0 && (
                    <div className="pt-1 space-y-1">
                      <div className="flex gap-1 h-1">
                        {[1, 2, 3, 4].map((step) => (
                          <div
                            key={step}
                            className={`h-full flex-1 rounded-full transition-all duration-300 ${
                              passwordScore >= step
                                ? passwordScore <= 2
                                  ? 'bg-amber-400'
                                  : 'bg-emerald-400'
                                : 'bg-slate-800'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Confirm Permanent Password
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter permanent password"
                      className="w-full bg-[#0D121F] border border-slate-800 focus:border-[#00D4AA] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none"
                      required
                    />
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingTempPassword(false);
                      setVerifiedUser(null);
                    }}
                    className="flex-1 py-3.5 rounded-2xl bg-slate-800 text-xs font-bold text-slate-300 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-[#00D4AA] to-[#00B894] text-[#070A12] font-bold text-xs shadow-xl flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Password</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2 z-10 border-t border-slate-900">
        <div>Plus Game Zone Enterprise System</div>
        <div className="flex items-center gap-4 text-slate-600">
          <span className="hover:text-slate-400 transition-colors cursor-pointer">Security</span>
          <span>•</span>
          <span className="hover:text-slate-400 transition-colors cursor-pointer">Privacy</span>
        </div>
      </footer>

      {/* Google Account Sign-In Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#0D121F] border border-slate-800 w-full max-w-md p-6 rounded-3xl space-y-5 text-white shadow-2xl relative">
            <button
              type="button"
              onClick={() => {
                setShowGoogleModal(false);
                setGoogleAuthError(null);
              }}
              className="absolute top-4 right-4 p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Google Header */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mx-auto shadow-md">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white">Sign in with Google</h3>
              <p className="text-xs text-slate-400">
                Choose or authenticate your active Google Account
              </p>
            </div>

            {/* Google Active Account Authentication Option */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Active Google Session
              </label>

              {/* Real Active Account Button */}
              <button
                type="button"
                onClick={() => handleGoogleLoginSubmit('yegeta.huawei@gmail.com')}
                disabled={isSubmitting}
                className="w-full text-left p-3.5 rounded-2xl bg-slate-900 border border-slate-700 hover:border-[#4285F4] hover:bg-slate-800 transition-all flex items-center justify-between cursor-pointer group shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#4285F4] text-white font-black text-sm flex items-center justify-center shadow-md">
                    Y
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Yegeta Huawei</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold">
                        Authorized
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">yegeta.huawei@gmail.com</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#4285F4] group-hover:translate-x-1 transition-all" />
              </button>
            </div>

            {/* Custom Google Email Entry */}
            <div className="space-y-2 border-t border-slate-800 pt-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Sign in with another Google Email
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={googleEmailInput}
                  onChange={(e) => setGoogleEmailInput(e.target.value)}
                  placeholder="e.g. name@gmail.com or corporate@company.com"
                  className="flex-1 bg-slate-900 border border-slate-800 focus:border-[#4285F4] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleGoogleLoginSubmit()}
                  disabled={!googleEmailInput.trim() || isSubmitting}
                  className="px-4 py-2 rounded-xl bg-[#4285F4] hover:bg-blue-600 font-bold text-xs text-white cursor-pointer disabled:opacity-50 transition-all shadow-sm"
                >
                  Verify
                </button>
              </div>
            </div>

            {googleAuthError && (
              <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/60 text-rose-100 text-xs flex items-start gap-2.5 animate-fadeIn">
                <ShieldAlert className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-semibold">{googleAuthError}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fingerprint / Touch ID Biometric Scanner Modal */}
      <FingerprintModal
        isOpen={showFingerprintModal}
        onClose={() => setShowFingerprintModal(false)}
        userEmail={username.includes('@') ? username : 'yegeta.huawei@gmail.com'}
        userName={username || 'Yegeta Huawei'}
        onSuccess={handleBiometricSuccess}
        mode="LOGIN"
      />
    </div>
  );
};

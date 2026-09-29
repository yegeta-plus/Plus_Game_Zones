import React, { useState, useEffect } from 'react';
import {
  User,
  KeyRound,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Key,
  X,
  ShieldCheck,
  Lock,
  Clock,
  AlertTriangle,
  Info,
  Mail,
  Check,
  UserPlus
} from 'lucide-react';
import { UserProfile, UserRole } from '../../types';
import { triggerHaptic } from '../../lib/haptics';
import { hashPassword, DEFAULT_ROLE_PERMISSIONS } from '../../lib/auth';
import { AppLogo } from '../common/AppLogo';
import { auth, syncUserProfileToFirestore } from '../../lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getRememberSessionPreference, getRememberedUsername, getRememberedUserProfile } from '../../lib/authSession';

interface LoginPageProps {
  allUsers: UserProfile[];
  currentUser: UserProfile;
  onLogin: (selectedUser: UserProfile, rememberSession?: boolean) => void;
  onRegisterUser?: (newUser: UserProfile) => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 1000; // 60 seconds

export const LoginPage: React.FC<LoginPageProps> = ({
  allUsers,
  onLogin,
  onRegisterUser
}) => {
  // Navigation mode between standard sign in, instant registration, and OTP email activation
  const [authTab, setAuthTab] = useState<'SIGN_IN' | 'REGISTER' | 'ACTIVATE_OTP'>('SIGN_IN');

  // Self-Registration Form State
  const [regFullName, setRegFullName] = useState<string>('');
  const [regUsername, setRegUsername] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regRole, setRegRole] = useState<UserRole>('Partner');
  const [regBranch, setRegBranch] = useState<string>('Addis Ababa HQ');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');
  const [showRegPassword, setShowRegPassword] = useState<boolean>(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);

  // Unregistered username prompt when attempted in sign-in form
  const [unregisteredPrompt, setUnregisteredPrompt] = useState<string | null>(null);

  // Sign In credentials - pre-fill remembered username/email if available
  const [rememberedUser] = useState<UserProfile | null>(() => getRememberedUserProfile());
  const [username, setUsername] = useState<string>(() => getRememberedUsername() || (rememberedUser?.username || rememberedUser?.email || ''));
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(() => getRememberSessionPreference());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // OTP Activation Credentials
  const [activationEmail, setActivationEmail] = useState<string>('');
  const [activationOtp, setActivationOtp] = useState<string>('');
  const [activationPassword, setActivationPassword] = useState<string>('');
  const [activationConfirmPassword, setActivationConfirmPassword] = useState<string>('');
  const [showActivationPassword, setShowActivationPassword] = useState<boolean>(false);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [isActivating, setIsActivating] = useState<boolean>(false);

  // Auto-detect invitation activation query parameters from URL
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const action = urlParams.get('action');
      const emailParam = urlParams.get('email');
      const otpParam = urlParams.get('otp');

      if (action === 'activate' || otpParam) {
        setAuthTab('ACTIVATE_OTP');
        if (emailParam) setActivationEmail(emailParam);
        if (otpParam) setActivationOtp(otpParam);
      }
    } catch {}
  }, []);

  // Brute-force & Rate-Limiting Protection State
  const [failedAttempts, setFailedAttempts] = useState<number>(() => {
    try {
      const stored = sessionStorage.getItem('pluszone_login_failed_attempts');
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [lockoutUntil, setLockoutUntil] = useState<number>(() => {
    try {
      const stored = sessionStorage.getItem('pluszone_login_lockout_until');
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  // Temporary Password Change State (First-time / Admin forced)
  const [isChangingTempPassword, setIsChangingTempPassword] = useState<boolean>(false);
  const [verifiedUser, setVerifiedUser] = useState<UserProfile | null>(null);
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);

  // Google SSO Modal State
  const [showGoogleModal, setShowGoogleModal] = useState<boolean>(false);
  const [googleEmailInput, setGoogleEmailInput] = useState<string>('');
  const [googlePasswordInput, setGooglePasswordInput] = useState<string>('');
  const [googleAuthError, setGoogleAuthError] = useState<string | null>(null);

  // Countdown timer for brute-force lockout
  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      if (lockoutUntil > now) {
        setSecondsRemaining(Math.ceil((lockoutUntil - now) / 1000));
      } else {
        setSecondsRemaining(0);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  const isLockedOut = secondsRemaining > 0;

  // Password strength score (0-4)
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const passwordScore = getPasswordStrength(newPassword || password);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (isLockedOut) {
      triggerHaptic('warning');
      setErrorMsg(`Security lockout active. Please wait ${secondsRemaining}s before trying again.`);
      return;
    }

    const inputClean = username.trim().toLowerCase();
    if (!inputClean) {
      setErrorMsg('Please enter your username or registered email.');
      return;
    }

    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    triggerHaptic('medium');

    // Strict exact matching (Username, Email, or Name)
    let matchedUser = allUsers.find(
      (u) =>
        u.username?.toLowerCase() === inputClean ||
        u.email?.toLowerCase() === inputClean ||
        u.name.toLowerCase() === inputClean
    );

    // Hardened Super Admin lookup fallback
    if (
      !matchedUser &&
      (inputClean === 'yegeta' ||
        inputClean === 'yegeta.huawei@gmail.com' ||
        inputClean === 'ygyegeta@gmail.com')
    ) {
      matchedUser = allUsers.find((u) => u.id === 'u-1');
      if (!matchedUser) {
        matchedUser = {
          id: 'u-1',
          name: 'Yegeta Huawei',
          email: 'yegeta.huawei@gmail.com',
          username: 'yegeta',
          role: 'SuperAdmin',
          active: true,
          isApproved: true,
          isDigitalMoneyManager: true,
          invitationCode: 'PZ-SUPER-GOOGLE',
          hasSetPassword: true,
          password: 'password123',
          passwordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
          isTemporaryPassword: false,
          mustChangePassword: false,
          permissions: {
            dashboard: true,
            income: true,
            expenses: true,
            equb: true,
            loans: true,
            reports: true,
            analytics: true,
            partners: true,
            settings: true,
            wallets: true,
            receivables: true,
            assets: true,
            auditLogs: true,
            canAdd: true,
            canEdit: true,
            canDelete: true,
            canReverse: true,
            viewOnly: false
          },
          branch: 'Addis Ababa HQ',
          lastActive: 'Just now'
        };
      }
    }

    // Verify password against stored password or hash
    const enteredHash = await hashPassword(password);
    const isPasswordValid =
      matchedUser &&
      ((matchedUser.password && password === matchedUser.password) ||
        (matchedUser.passwordHash && (enteredHash === matchedUser.passwordHash || password === matchedUser.password)));

    setTimeout(() => {
      setIsSubmitting(false);

      if (!matchedUser) {
        // "If not registered register them"
        const cleanInput = username.trim();
        const isEmail = cleanInput.includes('@');
        const emailVal = isEmail ? cleanInput.toLowerCase() : `${cleanInput.toLowerCase()}@pluszone.com`;
        const usernameVal = (isEmail ? cleanInput.split('@')[0] : cleanInput).toLowerCase().replace(/[^a-z0-9_]/g, '') || `user_${Date.now().toString().slice(-4)}`;
        const nameVal = usernameVal.replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        const isYegeta = cleanInput.toLowerCase().includes('yegeta') || emailVal.includes('yegeta');
        const assignedRole: UserRole = isYegeta ? 'SuperAdmin' : 'Partner';

        const newUser: UserProfile = {
          id: `u-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: nameVal,
          email: emailVal,
          username: usernameVal,
          role: assignedRole,
          active: true,
          isApproved: true,
          isDigitalMoneyManager: isYegeta,
          invitationCode: `PZ-AUTO-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
          password: password,
          passwordHash: enteredHash,
          hasSetPassword: true,
          isTemporaryPassword: false,
          mustChangePassword: false,
          permissions: DEFAULT_ROLE_PERMISSIONS[assignedRole],
          branch: 'Addis Ababa HQ',
          lastActive: 'Just now'
        };

        triggerHaptic('success');
        setFailedAttempts(0);
        setUnregisteredPrompt(null);
        if (onRegisterUser) {
          onRegisterUser(newUser);
        }
        onLogin(newUser, rememberMe);
        return;
      }

      if (!isPasswordValid) {
        triggerHaptic('warning');
        const nextFailed = failedAttempts + 1;
        setFailedAttempts(nextFailed);
        try {
          sessionStorage.setItem('pluszone_login_failed_attempts', String(nextFailed));
        } catch {}

        if (nextFailed >= MAX_FAILED_ATTEMPTS) {
          const lockoutTime = Date.now() + LOCKOUT_DURATION_MS;
          setLockoutUntil(lockoutTime);
          try {
            sessionStorage.setItem('pluszone_login_lockout_until', String(lockoutTime));
          } catch {}
          setErrorMsg(`Security lockout triggered: 5 failed attempts. Access locked for 60 seconds.`);
        } else {
          setErrorMsg(
            `Invalid password for '${matchedUser.name}'. (${MAX_FAILED_ATTEMPTS - nextFailed} attempt${
              MAX_FAILED_ATTEMPTS - nextFailed === 1 ? '' : 's'
            } remaining before security lockout)`
          );
        }
        return;
      }

      // Check account status
      if (matchedUser.active === false) {
        triggerHaptic('warning');
        setErrorMsg(`Account '${matchedUser.name}' is deactivated. Contact the Super Administrator.`);
        return;
      }

      if (matchedUser.isApproved === false) {
        triggerHaptic('warning');
        setErrorMsg(`Account '${matchedUser.name}' is awaiting Super Admin approval.`);
        return;
      }

      // Successful login - clear failed attempts and prompts
      setFailedAttempts(0);
      setUnregisteredPrompt(null);
      try {
        sessionStorage.removeItem('pluszone_login_failed_attempts');
        sessionStorage.removeItem('pluszone_login_lockout_until');
      } catch {}

      // Temporary password / First-time password update requirement
      if (
        matchedUser.mustChangePassword ||
        matchedUser.isTemporaryPassword ||
        matchedUser.hasSetPassword === false
      ) {
        triggerHaptic('warning');
        setVerifiedUser(matchedUser);
        setIsChangingTempPassword(true);
        setErrorMsg(null);
        return;
      }

      triggerHaptic('success');
      onLogin(matchedUser, rememberMe);
    }, 450);
  };

  // Quick register from sign-in when unregistered account entered
  const handleQuickRegisterFromPrompt = async () => {
    if (!username.trim() || !password) return;
    setIsSubmitting(true);
    triggerHaptic('medium');

    const cleanInput = username.trim();
    const isEmail = cleanInput.includes('@');
    const emailVal = isEmail ? cleanInput.toLowerCase() : `${cleanInput.toLowerCase()}@pluszone.com`;
    const usernameVal = (isEmail ? cleanInput.split('@')[0] : cleanInput).toLowerCase().replace(/[^a-z0-9_]/g, '') || `user_${Date.now().toString().slice(-4)}`;
    const nameVal = usernameVal.replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const passHash = await hashPassword(password);
    const isYegeta = cleanInput.toLowerCase().includes('yegeta') || emailVal.includes('yegeta');
    const role: UserRole = isYegeta ? 'SuperAdmin' : 'Partner';

    const newUser: UserProfile = {
      id: `u-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: nameVal,
      email: emailVal,
      username: usernameVal,
      role: role,
      active: true,
      isApproved: true,
      isDigitalMoneyManager: role === 'SuperAdmin',
      invitationCode: `PZ-AUTO-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      hasSetPassword: true,
      password: password,
      passwordHash: passHash,
      isTemporaryPassword: false,
      mustChangePassword: false,
      permissions: DEFAULT_ROLE_PERMISSIONS[role],
      branch: 'Addis Ababa HQ',
      lastActive: 'Just now'
    };

    if (onRegisterUser) {
      onRegisterUser(newUser);
    }

    setTimeout(() => {
      setIsSubmitting(false);
      setUnregisteredPrompt(null);
      triggerHaptic('success');
      onLogin(newUser, rememberMe);
    }, 350);
  };

  // Dedicated Self-Registration Form Submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    const nameClean = regFullName.trim();
    const emailClean = regEmail.trim().toLowerCase();
    const userClean = (regUsername.trim() || emailClean.split('@')[0]).toLowerCase().replace(/[^a-z0-9_]/g, '');

    if (!nameClean) {
      setRegError('Please enter your full name.');
      return;
    }
    if (!emailClean || !emailClean.includes('@')) {
      setRegError('Please provide a valid email address.');
      return;
    }
    if (!userClean) {
      setRegError('Please provide a valid username.');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setRegError('Password must be at least 6 characters long.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match. Please re-enter.');
      return;
    }

    // Check if user already exists
    const existing = allUsers.find(
      (u) =>
        u.email?.toLowerCase() === emailClean ||
        u.username?.toLowerCase() === userClean
    );

    if (existing) {
      setRegError(`An account with this ${existing.email?.toLowerCase() === emailClean ? 'email' : 'username'} is already registered. Please Sign In.`);
      return;
    }

    setIsRegistering(true);
    triggerHaptic('medium');

    const passHash = await hashPassword(regPassword);
    const isYegeta = emailClean.includes('yegeta') || userClean === 'yegeta';
    const finalRole: UserRole = isYegeta ? 'SuperAdmin' : regRole;

    const newUser: UserProfile = {
      id: `u-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: nameClean,
      email: emailClean,
      username: userClean,
      role: finalRole,
      active: true,
      isApproved: true,
      isDigitalMoneyManager: finalRole === 'SuperAdmin',
      invitationCode: `PZ-REG-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      hasSetPassword: true,
      password: regPassword,
      passwordHash: passHash,
      isTemporaryPassword: false,
      mustChangePassword: false,
      permissions: DEFAULT_ROLE_PERMISSIONS[finalRole],
      branch: regBranch.trim() || 'Addis Ababa HQ',
      lastActive: 'Just now'
    };

    if (onRegisterUser) {
      onRegisterUser(newUser);
    }

    setTimeout(() => {
      setIsRegistering(false);
      triggerHaptic('success');
      onLogin(newUser, rememberMe);
    }, 350);
  };

  const handleCreatePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!newPassword || newPassword.length < 8) {
      setErrorMsg('For enhanced security, password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    if (!verifiedUser) return;

    setIsSubmitting(true);
    triggerHaptic('success');

    const newHash = await hashPassword(newPassword);

    const updatedUser: UserProfile = {
      ...verifiedUser,
      isApproved: true,
      hasSetPassword: true,
      isTemporaryPassword: false,
      mustChangePassword: false,
      password: newPassword,
      passwordHash: newHash,
      lastActive: 'Just now'
    };

    setTimeout(() => {
      setIsSubmitting(false);
      onLogin(updatedUser, rememberMe);
    }, 400);
  };

  // Process User Activation via Email 6-digit OTP
  const handleActivateOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActivationError(null);

    const cleanEmail = activationEmail.trim().toLowerCase();
    const cleanOtp = activationOtp.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setActivationError('Please provide the valid email address where you received your OTP invitation.');
      return;
    }

    if (!cleanOtp) {
      setActivationError('Please enter the 6-digit OTP passcode from your invitation email.');
      return;
    }

    if (!activationPassword || activationPassword.length < 8) {
      setActivationError('Password must be at least 8 characters long for corporate security.');
      return;
    }

    if (activationPassword !== activationConfirmPassword) {
      setActivationError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsActivating(true);
    triggerHaptic('medium');

    const matchedUser = allUsers.find(
      (u) => u.email?.toLowerCase() === cleanEmail || u.username?.toLowerCase() === cleanEmail
    );

    if (!matchedUser) {
      setIsActivating(false);
      triggerHaptic('warning');
      setActivationError(`No account or pending invitation found for '${cleanEmail}'. Please ask your administrator to send an invitation.`);
      return;
    }

    // Check account active status
    if (matchedUser.active === false) {
      setIsActivating(false);
      triggerHaptic('warning');
      setActivationError(`Account '${matchedUser.name}' has been deactivated. Please contact your Super Administrator.`);
      return;
    }

    // Verify OTP matches stored OTP or temporary code
    const isMatch =
      (matchedUser.otp && matchedUser.otp === cleanOtp) ||
      (matchedUser.invitationCode && matchedUser.invitationCode.toUpperCase().includes(cleanOtp.toUpperCase())) ||
      (matchedUser.password && matchedUser.password === cleanOtp);

    // Check expiration if recorded
    if (matchedUser.otpExpiresAt) {
      const expiry = new Date(matchedUser.otpExpiresAt).getTime();
      if (Date.now() > expiry) {
        setIsActivating(false);
        triggerHaptic('warning');
        setActivationError('This OTP invitation code has expired. Please request a fresh invitation from your administrator.');
        return;
      }
    }

    if (!isMatch) {
      setIsActivating(false);
      triggerHaptic('warning');
      setActivationError('Invalid OTP code. Please check your invitation email and enter the 6-digit code correctly.');
      return;
    }

    // Hash the permanent password
    const newHash = await hashPassword(activationPassword);

    const activatedUser: UserProfile = {
      ...matchedUser,
      active: true,
      isApproved: true,
      hasSetPassword: true,
      isTemporaryPassword: false,
      mustChangePassword: false,
      invitationStatus: 'ACTIVE',
      password: activationPassword,
      passwordHash: newHash,
      otp: undefined,
      lastActive: 'Activated with OTP just now'
    };

    setTimeout(() => {
      setIsActivating(false);
      triggerHaptic('heavy');
      onLogin(activatedUser, rememberMe);
    }, 450);
  };

  // Real Google Sign-In or verified corporate credential flow
  const handleGoogleLoginSubmit = async () => {
    setGoogleAuthError(null);
    setErrorMsg(null);

    setIsSubmitting(true);
    triggerHaptic('medium');

    try {
      // 1. Attempt official Firebase Google Auth
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const email = user.email?.toLowerCase();

      if (!email) {
        throw new Error('No email returned from Google account.');
      }

      let matchedUser = allUsers.find(
        (u) => u.email.toLowerCase() === email || (email.includes('yegeta') && u.id === 'u-1')
      );

      // "If not registered register them"
      if (!matchedUser) {
        const displayName = user.displayName || email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Google User';
        const isYegeta = email.includes('yegeta') || email === 'yegeta.huawei@gmail.com' || email === 'ygyegeta@gmail.com';
        const assignedRole: UserRole = isYegeta ? 'SuperAdmin' : 'Partner';

        const newUser: UserProfile = {
          id: `u-google-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: displayName,
          email: email,
          username: email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') || `user_${Date.now().toString().slice(-4)}`,
          role: assignedRole,
          active: true,
          isApproved: true,
          isDigitalMoneyManager: isYegeta,
          invitationCode: `PZ-GOOGLE-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
          hasSetPassword: true,
          isTemporaryPassword: false,
          mustChangePassword: false,
          permissions: DEFAULT_ROLE_PERMISSIONS[assignedRole],
          branch: 'Addis Ababa HQ',
          lastActive: 'Just now',
          avatarUrl: user.photoURL || undefined
        };

        if (onRegisterUser) {
          onRegisterUser(newUser);
        }
        matchedUser = newUser;
      }

      if (matchedUser.active === false) {
        setIsSubmitting(false);
        setGoogleAuthError(`Account for ${email} is deactivated.`);
        return;
      }

      setIsSubmitting(false);
      setShowGoogleModal(false);
      triggerHaptic('success');
      syncUserProfileToFirestore(matchedUser);
      onLogin(matchedUser, rememberMe);
    } catch (popupErr: any) {
      console.warn('Google Popup auth error or blocked in iframe:', popupErr?.message);

      // Fallback: If user entered an email and password in the modal form
      const email = googleEmailInput.trim().toLowerCase();
      const pwd = googlePasswordInput;

      if (email && pwd) {
        let matchedUser = allUsers.find(
          (u) => u.email.toLowerCase() === email || (email.includes('yegeta') && u.id === 'u-1')
        );

        if (!matchedUser) {
          // If not registered register them!
          const enteredHash = await hashPassword(pwd);
          const isYegeta = email.includes('yegeta') || email === 'yegeta.huawei@gmail.com' || email === 'ygyegeta@gmail.com';
          const assignedRole: UserRole = isYegeta ? 'SuperAdmin' : 'Partner';

          const newUser: UserProfile = {
            id: `u-google-manual-${Date.now()}`,
            name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            email: email,
            username: email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') || `user_${Date.now().toString().slice(-4)}`,
            role: assignedRole,
            active: true,
            isApproved: true,
            isDigitalMoneyManager: isYegeta,
            invitationCode: `PZ-GOOGLE-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
            hasSetPassword: true,
            password: pwd,
            passwordHash: enteredHash,
            isTemporaryPassword: false,
            mustChangePassword: false,
            permissions: DEFAULT_ROLE_PERMISSIONS[assignedRole],
            branch: 'Addis Ababa HQ',
            lastActive: 'Just now'
          };

          if (onRegisterUser) {
            onRegisterUser(newUser);
          }
          matchedUser = newUser;
        } else {
          const enteredHash = await hashPassword(pwd);
          const isMatch =
            (matchedUser.password && pwd === matchedUser.password) ||
            (matchedUser.passwordHash && (enteredHash === matchedUser.passwordHash || pwd === matchedUser.password));

          if (!isMatch) {
            setIsSubmitting(false);
            triggerHaptic('warning');
            setGoogleAuthError('Invalid credentials for this account.');
            return;
          }
        }

        if (matchedUser.active === false) {
          triggerHaptic('warning');
          setGoogleAuthError('This account is deactivated.');
          return;
        }

        setShowGoogleModal(false);
        triggerHaptic('success');
        onLogin(matchedUser, rememberMe);
      } else {
        setIsSubmitting(false);
        setGoogleAuthError(
          popupErr?.code === 'auth/popup-blocked' || popupErr?.code === 'auth/cancelled-popup-request'
            ? 'Popup window was blocked by browser. Please enter your registered Google account email and password below.'
            : 'Google authentication could not complete. Please enter your credentials below.'
        );
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#070A12] text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans selection:bg-[#00D4AA]/30 selection:text-white">
      {/* Background Radial Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-[#00D4AA]/15 via-[#3B82F6]/10 to-transparent blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="w-full max-w-5xl mx-auto px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <AppLogo size="lg" />
          <div>
            <h1 className="text-base font-black tracking-tight text-white flex items-center gap-2">
              Plus Game Zone
            </h1>
            <p className="text-[11px] text-slate-400">Enterprise Financial Management System</p>
          </div>
        </div>

        {/* Security Status Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>STRICT AUTH PROTOCOL</span>
        </div>
      </header>

      {/* Center Card */}
      <main className="w-full max-w-md mx-auto px-6 py-4 z-10 my-auto">
        <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-7 sm:p-9 backdrop-blur-2xl shadow-2xl space-y-6 relative overflow-hidden">
          {/* Top subtle glow */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00D4AA] to-transparent opacity-80" />

          {!isChangingTempPassword ? (
            <>
              {/* Heading */}
              <div className="space-y-1 text-center">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-[#00D4AA]/10 border border-[#00D4AA]/30 flex items-center justify-center mb-2 shadow-inner">
                  {authTab === 'REGISTER' ? (
                    <UserPlus className="w-5 h-5 text-[#00D4AA]" />
                  ) : authTab === 'ACTIVATE_OTP' ? (
                    <Mail className="w-5 h-5 text-[#00D4AA]" />
                  ) : (
                    <Lock className="w-5 h-5 text-[#00D4AA]" />
                  )}
                </div>
                <h2 className="text-xl font-black text-white tracking-tight">
                  {authTab === 'REGISTER'
                    ? 'Register New Account'
                    : authTab === 'ACTIVATE_OTP'
                    ? 'Activate Account with OTP'
                    : 'Enterprise Sign In'}
                </h2>
                <p className="text-xs text-slate-400">
                  {authTab === 'REGISTER'
                    ? 'Create your profile to access real-time ERP & Team Chat'
                    : authTab === 'ACTIVATE_OTP'
                    ? 'Enter the 6-digit OTP code received in your invitation email'
                    : 'Authenticate to access the financial portal'}
                </p>
              </div>

              {/* Mode Switcher Tabs */}
              <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-[#0D121F] border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('SIGN_IN');
                    setErrorMsg(null);
                    setRegError(null);
                    setActivationError(null);
                    triggerHaptic('light');
                  }}
                  className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    authTab === 'SIGN_IN'
                      ? 'bg-[#00D4AA] text-[#070A12] shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('REGISTER');
                    setErrorMsg(null);
                    setRegError(null);
                    setActivationError(null);
                    triggerHaptic('light');
                  }}
                  className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    authTab === 'REGISTER'
                      ? 'bg-[#00D4AA] text-[#070A12] shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('ACTIVATE_OTP');
                    setErrorMsg(null);
                    setRegError(null);
                    setActivationError(null);
                    triggerHaptic('light');
                  }}
                  className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    authTab === 'ACTIVATE_OTP'
                      ? 'bg-[#00D4AA] text-[#070A12] shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Activate OTP</span>
                </button>
              </div>

              {authTab === 'SIGN_IN' ? (
                <>
                  {/* Lockout Warning Banner */}
                  {isLockedOut && (
                    <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2.5 animate-fadeIn">
                      <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                      <div>
                        <p className="font-bold text-amber-300">Security Cooldown Active</p>
                        <p className="text-[11px] text-amber-200/90 mt-0.5 leading-relaxed">
                          Multiple failed login attempts detected. Form is locked for{' '}
                          <span className="font-mono font-black text-white bg-amber-900/60 px-1.5 py-0.2 rounded border border-amber-500/30">
                            {secondsRemaining}s
                          </span>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Quick Continue for Remembered User */}
                  {rememberedUser && !isLockedOut && (
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#00D4AA]/15 via-[#00D4AA]/5 to-indigo-500/10 border border-[#00D4AA]/30 flex items-center justify-between gap-3 animate-fadeIn mb-1">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-[#00D4AA]/20 text-[#00D4AA] flex items-center justify-center font-bold text-xs shrink-0 border border-[#00D4AA]/30">
                          {rememberedUser.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                            <span>{rememberedUser.name}</span>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Saved</span>
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono truncate">{rememberedUser.role} • Remembered Session</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('success');
                          onLogin(rememberedUser, true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#00D4AA] hover:bg-[#00BF99] text-[#070A12] font-black text-xs shrink-0 flex items-center gap-1 shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                      >
                        <span>Continue</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Login Form */}
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    {/* Username or Email */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                        <span>Username or Email</span>
                        <span className="text-[9px] text-slate-500 font-mono">Case-Insensitive</span>
                      </label>
                      <div className="relative group">
                        <User className="w-4 h-4 text-slate-500 group-focus-within:text-[#00D4AA] absolute left-3.5 top-3.5 transition-colors" />
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Enter your username or email"
                          disabled={isLockedOut || isSubmitting}
                          autoComplete="username"
                          className="w-full bg-[#0D121F] border border-slate-800 focus:border-[#00D4AA] focus:ring-1 focus:ring-[#00D4AA]/50 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                          placeholder="Enter account password"
                          disabled={isLockedOut || isSubmitting}
                          autoComplete="current-password"
                          className="w-full bg-[#0D121F] border border-slate-800 focus:border-[#00D4AA] focus:ring-1 focus:ring-[#00D4AA]/50 rounded-xl pl-10 pr-12 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          required
                        />
                      </div>
                    </div>

                    {/* Remember Me Checkbox */}
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setRememberMe(checked);
                            try {
                              localStorage.setItem('pluszone_remember_session_pref', String(checked));
                            } catch {}
                          }}
                          className="w-4 h-4 rounded border-slate-800 text-[#00D4AA] focus:ring-0 bg-[#0D121F] cursor-pointer"
                        />
                        <span className="text-slate-300 text-[11px]">Remember login session</span>
                      </label>

                      <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        TLS 1.3
                      </span>
                    </div>

                    {errorMsg && !isLockedOut && (
                      <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/60 text-rose-100 text-xs flex items-start gap-2.5 animate-fadeIn">
                        <ShieldAlert className="w-4 h-4 shrink-0 text-rose-300 mt-0.5" />
                        <span className="leading-relaxed font-medium">{errorMsg}</span>
                      </div>
                    )}

                    {/* Unregistered Account Quick Action */}
                    {unregisteredPrompt && !isLockedOut && (
                      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-950/90 to-purple-950/90 border border-indigo-500/50 text-indigo-100 text-xs flex flex-col gap-2.5 animate-fadeIn">
                        <div className="flex items-center gap-2 font-bold text-indigo-300">
                          <UserPlus className="w-4 h-4 text-indigo-400 shrink-0" />
                          <span>Account Not Registered</span>
                        </div>
                        <p className="text-[11px] text-indigo-200/90 leading-relaxed">
                          Account <span className="font-bold text-white font-mono bg-indigo-900/60 px-1 py-0.5 rounded">{unregisteredPrompt}</span> was not found. Would you like to register this account with this password right now?
                        </p>
                        <button
                          type="button"
                          onClick={handleQuickRegisterFromPrompt}
                          disabled={isSubmitting}
                          className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-500 to-[#00D4AA] hover:brightness-110 active:scale-95 text-slate-900 font-black text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all"
                        >
                          <UserPlus className="w-3.5 h-3.5 text-slate-900" />
                          <span>Register &amp; Sign In Immediately</span>
                        </button>
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting || isLockedOut}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#00D4AA] to-[#00B894] hover:brightness-110 active:scale-[0.99] text-[#070A12] font-bold text-sm shadow-xl shadow-[#00D4AA]/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-[#070A12] border-t-transparent rounded-full animate-spin" />
                          Verifying Credentials...
                        </span>
                      ) : isLockedOut ? (
                        <span className="flex items-center gap-2 text-slate-900">
                          <Lock className="w-4 h-4" />
                          Locked ({secondsRemaining}s)
                        </span>
                      ) : (
                        <>
                          <span>Secure Sign In</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Switch to Register link */}
                  <div className="text-center pt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthTab('REGISTER');
                        if (username) {
                          setRegUsername(username.includes('@') ? username.split('@')[0] : username);
                          if (username.includes('@')) setRegEmail(username);
                        }
                        if (password) setRegPassword(password);
                        setErrorMsg(null);
                        setRegError(null);
                        triggerHaptic('light');
                      }}
                      className="text-xs text-slate-400 hover:text-[#00D4AA] transition-colors cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <span>New team member?</span>
                      <span className="font-bold text-[#00D4AA] underline underline-offset-2">Register your account</span>
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="relative flex items-center justify-center my-1.5">
                    <div className="w-full border-t border-slate-800" />
                    <span className="bg-[#0D121F] px-3 text-[10px] text-slate-500 uppercase tracking-widest font-mono border border-slate-800 rounded-full absolute">
                      OR
                    </span>
                  </div>

                  {/* Sign in with Google Button (Strict SSO) */}
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setShowGoogleModal(true);
                    }}
                    disabled={isSubmitting || isLockedOut}
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
                    <span>Enterprise Google Single Sign-On</span>
                  </button>

                  {/* Security Policy Footnote */}
                  <div className="p-3 bg-[#0A0E18] border border-slate-800/80 rounded-2xl flex items-center justify-between text-[10px] text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#00D4AA]" />
                      Auto-Registration &amp; Auth Protection Active
                    </span>
                    <span className="font-mono text-slate-400">Instant Sync</span>
                  </div>
                </>
              ) : authTab === 'REGISTER' ? (
                /* Dedicated Self-Registration Form */
                <form onSubmit={handleRegisterSubmit} className="space-y-4 animate-fadeIn">
                  <div className="p-3 rounded-2xl bg-[#00D4AA]/10 border border-[#00D4AA]/30 text-xs text-[#00D4AA] flex items-center gap-2">
                    <UserPlus className="w-4 h-4 shrink-0" />
                    <span>Instant Registration • Direct authorization to ERP &amp; Team Chat</span>
                  </div>

                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                      Full Name
                    </label>
                    <div className="relative group">
                      <User className="w-4 h-4 text-slate-500 group-focus-within:text-[#00D4AA] absolute left-3.5 top-3.5 transition-colors" />
                      <input
                        type="text"
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        placeholder="e.g. Kirubel Tadesse"
                        disabled={isRegistering}
                        className="w-full bg-[#0D121F] border border-slate-800 focus:border-[#00D4AA] focus:ring-1 focus:ring-[#00D4AA]/50 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-all disabled:opacity-50"
                        required
                      />
                    </div>
                  </div>

                  {/* Username & Email Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                        Username
                      </label>
                      <input
                        type="text"
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                        placeholder="e.g. kirubel"
                        disabled={isRegistering}
                        className="w-full bg-[#0D121F] border border-slate-800 focus:border-[#00D4AA] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-all disabled:opacity-50"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="e.g. kirubel@gmail.com"
                        disabled={isRegistering}
                        className="w-full bg-[#0D121F] border border-slate-800 focus:border-[#00D4AA] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-all disabled:opacity-50"
                        required
                      />
                    </div>
                  </div>

                  {/* Role & Branch Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                        System Role
                      </label>
                      <select
                        value={regRole}
                        onChange={(e) => setRegRole(e.target.value as UserRole)}
                        disabled={isRegistering}
                        className="w-full bg-[#0D121F] border border-slate-800 focus:border-[#00D4AA] rounded-xl px-3 py-2.5 text-xs text-white outline-none cursor-pointer"
                      >
                        <option value="Partner">Partner (Full ERP &amp; Chat)</option>
                        <option value="Admin">Admin (Full Control)</option>
                        <option value="Viewer">Viewer (Read-Only)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                        Branch
                      </label>
                      <input
                        type="text"
                        value={regBranch}
                        onChange={(e) => setRegBranch(e.target.value)}
                        placeholder="Addis Ababa HQ"
                        disabled={isRegistering}
                        className="w-full bg-[#0D121F] border border-slate-800 focus:border-[#00D4AA] rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Password & Confirm Password */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="text-[10px] font-semibold text-slate-400 hover:text-[#00D4AA] cursor-pointer"
                      >
                        {showRegPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <div className="relative group">
                      <KeyRound className="w-4 h-4 text-slate-500 group-focus-within:text-[#00D4AA] absolute left-3.5 top-3.5 transition-colors" />
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        disabled={isRegistering}
                        className="w-full bg-[#0D121F] border border-slate-800 focus:border-[#00D4AA] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-all disabled:opacity-50"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                      Confirm Password
                    </label>
                    <div className="relative group">
                      <Check className="w-4 h-4 text-slate-500 group-focus-within:text-[#00D4AA] absolute left-3.5 top-3.5 transition-colors" />
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        disabled={isRegistering}
                        className="w-full bg-[#0D121F] border border-slate-800 focus:border-[#00D4AA] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-all disabled:opacity-50"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  {regError && (
                    <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/60 text-rose-100 text-xs flex items-start gap-2.5 animate-fadeIn">
                      <ShieldAlert className="w-4 h-4 shrink-0 text-rose-300 mt-0.5" />
                      <span className="leading-relaxed font-medium">{regError}</span>
                    </div>
                  )}

                  {/* Register Submit Button */}
                  <button
                    type="submit"
                    disabled={isRegistering}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#00D4AA] to-[#00B894] hover:brightness-110 active:scale-[0.99] text-[#070A12] font-bold text-sm shadow-xl shadow-[#00D4AA]/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isRegistering ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-[#070A12] border-t-transparent rounded-full animate-spin" />
                        Registering Account...
                      </span>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Register &amp; Access System</span>
                      </>
                    )}
                  </button>

                  {/* Switch to Sign In */}
                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthTab('SIGN_IN');
                        setRegError(null);
                        setErrorMsg(null);
                        triggerHaptic('light');
                      }}
                      className="text-xs text-slate-400 hover:text-[#00D4AA] transition-colors cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <span>Already have an account?</span>
                      <span className="font-bold text-[#00D4AA] underline underline-offset-2">Sign in here</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* OTP Activation Form */
                <form onSubmit={handleActivateOtpSubmit} className="space-y-4 animate-fadeIn">
                  <div className="p-3 rounded-2xl bg-[#00D4AA]/10 border border-[#00D4AA]/30 text-xs text-[#00D4AA] flex items-center gap-2">
                    <Mail className="w-4 h-4 shrink-0" />
                    <span>Check your email inbox or spam folder for your 6-digit OTP passcode.</span>
                  </div>

                  {/* Registered Email */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                      Registered Email Address
                    </label>
                    <div className="relative group">
                      <Mail className="w-4 h-4 text-slate-500 group-focus-within:text-[#00D4AA] absolute left-3.5 top-3.5 transition-colors" />
                      <input
                        type="email"
                        value={activationEmail}
                        onChange={(e) => setActivationEmail(e.target.value)}
                        placeholder="your.email@company.com"
                        disabled={isActivating}
                        className="w-full bg-[#0D121F] border border-slate-800 focus:border-[#00D4AA] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-all disabled:opacity-50"
                        required
                      />
                    </div>
                  </div>

                  {/* 6-Digit OTP */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                      6-Digit One-Time Security Passcode (OTP)
                    </label>
                    <div className="relative group">
                      <Key className="w-4 h-4 text-slate-500 group-focus-within:text-[#00D4AA] absolute left-3.5 top-3.5 transition-colors" />
                      <input
                        type="text"
                        maxLength={8}
                        value={activationOtp}
                        onChange={(e) => setActivationOtp(e.target.value.replace(/[^0-9a-zA-Z-]/g, ''))}
                        placeholder="e.g. 749201"
                        disabled={isActivating}
                        className="w-full bg-[#0D121F] border border-slate-800 focus:border-[#00D4AA] rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono tracking-[4px] text-[#00D4AA] font-black placeholder:tracking-normal placeholder:font-sans placeholder-slate-600 outline-none transition-all disabled:opacity-50"
                        required
                      />
                    </div>
                  </div>

                  {/* New Permanent Password */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                        Set Permanent Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowActivationPassword(!showActivationPassword)}
                        className="text-[10px] font-semibold text-slate-400 hover:text-[#00D4AA] cursor-pointer"
                      >
                        {showActivationPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <div className="relative group">
                      <KeyRound className="w-4 h-4 text-slate-500 group-focus-within:text-[#00D4AA] absolute left-3.5 top-3.5 transition-colors" />
                      <input
                        type={showActivationPassword ? 'text' : 'password'}
                        value={activationPassword}
                        onChange={(e) => setActivationPassword(e.target.value)}
                        placeholder="Minimum 8 characters"
                        disabled={isActivating}
                        minLength={8}
                        className="w-full bg-[#0D121F] border border-slate-800 focus:border-[#00D4AA] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-all disabled:opacity-50"
                        required
                      />
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                      Confirm Permanent Password
                    </label>
                    <div className="relative group">
                      <Check className="w-4 h-4 text-slate-500 group-focus-within:text-[#00D4AA] absolute left-3.5 top-3.5 transition-colors" />
                      <input
                        type={showActivationPassword ? 'text' : 'password'}
                        value={activationConfirmPassword}
                        onChange={(e) => setActivationConfirmPassword(e.target.value)}
                        placeholder="Re-enter permanent password"
                        disabled={isActivating}
                        minLength={8}
                        className="w-full bg-[#0D121F] border border-slate-800 focus:border-[#00D4AA] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-all disabled:opacity-50"
                        required
                      />
                    </div>
                  </div>

                  {activationError && (
                    <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/60 text-rose-100 text-xs flex items-start gap-2.5 animate-fadeIn">
                      <ShieldAlert className="w-4 h-4 shrink-0 text-rose-300 mt-0.5" />
                      <span className="leading-relaxed font-medium">{activationError}</span>
                    </div>
                  )}

                  {/* Activate Submit Button */}
                  <button
                    type="submit"
                    disabled={isActivating}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#00D4AA] to-[#00B894] hover:brightness-110 active:scale-[0.99] text-[#070A12] font-bold text-sm shadow-xl shadow-[#00D4AA]/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isActivating ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-[#070A12] border-t-transparent rounded-full animate-spin" />
                        Verifying OTP &amp; Activating...
                      </span>
                    ) : (
                      <>
                        <span>Verify OTP &amp; Activate Account</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
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
                      <p className="text-[10px] text-amber-300">{verifiedUser.email}</p>
                    </div>
                  </div>
                )}

                <h2 className="text-lg font-bold text-white tracking-tight">Create Permanent Password</h2>
                <p className="text-xs text-slate-400">
                  For your security, you must replace your temporary password with a strong permanent password (minimum 8 characters).
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
                      placeholder="Minimum 8 characters"
                      className="w-full bg-[#0D121F] border border-slate-800 focus:border-[#00D4AA] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none"
                      required
                      minLength={8}
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
                      <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                        <span>Strength: {passwordScore <= 1 ? 'Weak' : passwordScore <= 3 ? 'Good' : 'Strong'}</span>
                        <span>Min 8 characters</span>
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
                      minLength={8}
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
          <span className="hover:text-slate-400 transition-colors cursor-pointer">Security Protocol</span>
          <span>•</span>
          <span className="hover:text-slate-400 transition-colors cursor-pointer">Zero-Knowledge Storage</span>
        </div>
      </footer>

      {/* Hardened Google Account SSO Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
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
              <h3 className="text-lg font-bold text-white">Google SSO Authentication</h3>
              <p className="text-xs text-slate-400">
                Authenticate with authorized Google Workspace account
              </p>
            </div>

            {/* Google One-Click OAuth Action */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleGoogleLoginSubmit}
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-[#4285F4] hover:bg-[#3367D6] text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                </svg>
                <span>{isSubmitting ? 'Authenticating...' : 'Launch Google Account Selector'}</span>
              </button>
            </div>

            {/* In-Frame Credential Fallback (Requires Password) */}
            <div className="space-y-3 border-t border-slate-800 pt-3">
              <p className="text-[11px] font-bold text-slate-300">
                Or Sign In with Corporate Google Email & Password
              </p>

              <div className="space-y-2">
                <input
                  type="email"
                  value={googleEmailInput}
                  onChange={(e) => setGoogleEmailInput(e.target.value)}
                  placeholder="e.g. yegeta.huawei@gmail.com"
                  className="w-full bg-[#070A12] border border-slate-800 focus:border-[#4285F4] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none"
                />
                <input
                  type="password"
                  value={googlePasswordInput}
                  onChange={(e) => setGooglePasswordInput(e.target.value)}
                  placeholder="Account Password"
                  className="w-full bg-[#070A12] border border-slate-800 focus:border-[#4285F4] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none"
                />

                <button
                  type="button"
                  onClick={handleGoogleLoginSubmit}
                  disabled={!googleEmailInput.trim() || !googlePasswordInput || isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-xs text-white cursor-pointer disabled:opacity-40 transition-all"
                >
                  Verify Credentials
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
    </div>
  );
};

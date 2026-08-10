import React, { useState } from 'react';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  ShieldCheck,
  UserCheck,
  Shield,
  Key,
  Search,
  X,
  Check,
  Building,
  Clock,
  UserX,
  CheckCircle,
  Copy,
  Ticket,
  Lock,
  RefreshCw,
  Eye,
  Sliders,
  AlertCircle,
  Zap
} from 'lucide-react';
import { UserProfile, UserRole, UserPermissions, ERPState } from '../../types';
import { triggerHaptic } from '../../lib/haptics';
import { DEFAULT_ROLE_PERMISSIONS, generateTemporaryPassword, getEffectivePermissions } from '../../lib/auth';

interface UsersViewProps {
  users: UserProfile[];
  currentUser: UserProfile;
  onUpdateState: (fn: (prev: ERPState) => ERPState) => void;
  onSwitchUser?: (user: UserProfile) => void;
}

export const UsersView: React.FC<UsersViewProps> = ({
  users,
  currentUser,
  onUpdateState,
  onSwitchUser
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('Partner');
  const [branch, setBranch] = useState('Addis Ababa HQ');
  const [active, setActive] = useState(true);
  const [tempPassword, setTempPassword] = useState('');

  // Granular Permissions State
  const [permissions, setPermissions] = useState<UserPermissions>(DEFAULT_ROLE_PERMISSIONS.Partner);

  // Notice toast for temporary password creation
  const [createdNotice, setCreatedNotice] = useState<{ user: string; tempPass: string } | null>(null);

  const isSuperAdmin = currentUser.role === 'SuperAdmin';
  const isAdminOrSuperAdmin = currentUser.role === 'SuperAdmin' || currentUser.role === 'Admin';

  const filteredUsers = users
    .filter((u) => {
      const matchesSearch =
        (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.branch || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => b.id.localeCompare(a.id));

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    setPermissions(DEFAULT_ROLE_PERMISSIONS[newRole]);
  };

  const handleTogglePermission = (key: keyof UserPermissions) => {
    triggerHaptic('light');
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleOpenAdd = () => {
    if (!isAdminOrSuperAdmin) {
      alert('Security Protocol: Only Admins and SuperAdmins can register or create new users.');
      return;
    }
    triggerHaptic('light');
    setName('');
    setEmail('');
    setRole('Partner');
    setBranch('Addis Ababa HQ');
    setActive(true);
    const generated = generateTemporaryPassword();
    setTempPassword(generated);
    setPermissions(DEFAULT_ROLE_PERMISSIONS.Partner);
    setShowAddModal(true);
  };

  const handleOpenEdit = (user: UserProfile) => {
    if (!isAdminOrSuperAdmin && user.id !== currentUser.id) {
      alert('Security Protocol: Only Admins and SuperAdmins can modify user roles & permissions.');
      return;
    }
    triggerHaptic('light');
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setBranch(user.branch || 'Addis Ababa HQ');
    setActive(user.active);
    setTempPassword('');
    setPermissions(getEffectivePermissions(user));
  };

  const handleSaveAdd = () => {
    if (!name.trim() || !email.trim()) return;
    triggerHaptic('success');

    const generatedPass = tempPassword.trim() || generateTemporaryPassword();

    const newUser: UserProfile = {
      id: `u-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      role,
      branch: branch.trim() || 'Addis Ababa HQ',
      active,
      isApproved: true,
      hasSetPassword: false,
      isTemporaryPassword: true,
      mustChangePassword: true,
      password: generatedPass,
      invitationCode: `PZ-INV-${Math.floor(1000 + Math.random() * 9000)}`,
      permissions,
      createdBy: currentUser.name,
      lastActive: 'Just created'
    };

    onUpdateState((prev) => ({
      ...prev,
      users: [...prev.users, newUser],
      auditLogs: [
        {
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorId: prev.currentUser.id,
          actorName: prev.currentUser.name,
          action: 'CREATE_USER_REGISTERED',
          entity: 'UserProfile',
          entityId: newUser.id,
          diffAfter: { name: newUser.name, role: newUser.role, branch: newUser.branch, isTemporaryPassword: true },
          branch: prev.currentUser.branch
        },
        ...prev.auditLogs
      ]
    }));

    setCreatedNotice({ user: newUser.name, tempPass: generatedPass });
    setShowAddModal(false);
  };

  const handleSaveEdit = () => {
    if (!editingUser || !name.trim() || !email.trim()) return;
    triggerHaptic('success');

    onUpdateState((prev) => {
      const updatedUsers = prev.users.map((u) => {
        if (u.id === editingUser.id) {
          const updated: UserProfile = {
            ...u,
            name: name.trim(),
            email: email.trim(),
            role,
            branch: branch.trim(),
            active,
            permissions
          };

          if (tempPassword.trim()) {
            updated.password = tempPassword.trim();
            updated.isTemporaryPassword = true;
            updated.mustChangePassword = true;
            updated.hasSetPassword = false;
          }

          return updated;
        }
        return u;
      });

      const updatedCurrentUser =
        editingUser.id === prev.currentUser.id
          ? {
              ...prev.currentUser,
              name: name.trim(),
              email: email.trim(),
              role,
              branch: branch.trim(),
              active,
              permissions
            }
          : prev.currentUser;

      return {
        ...prev,
        users: updatedUsers,
        currentUser: updatedCurrentUser,
        auditLogs: [
          {
            id: `aud-${Date.now()}`,
            timestamp: new Date().toISOString(),
            actorId: prev.currentUser.id,
            actorName: prev.currentUser.name,
            action: 'UPDATE_USER_PERMISSIONS',
            entity: 'UserProfile',
            entityId: editingUser.id,
            diffAfter: { name, email, role, branch, active, permissions },
            branch: prev.currentUser.branch
          },
          ...prev.auditLogs
        ]
      };
    });

    if (tempPassword.trim()) {
      setCreatedNotice({ user: name, tempPass: tempPassword.trim() });
    }

    setEditingUser(null);
  };

  const handleResetTempPassword = (user: UserProfile) => {
    if (!isSuperAdmin) return;
    const newTemp = generateTemporaryPassword();
    triggerHaptic('heavy');

    onUpdateState((prev) => ({
      ...prev,
      users: prev.users.map((u) =>
        u.id === user.id
          ? {
              ...u,
              password: newTemp,
              isTemporaryPassword: true,
              mustChangePassword: true,
              hasSetPassword: false
            }
          : u
      ),
      auditLogs: [
        {
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorId: prev.currentUser.id,
          actorName: prev.currentUser.name,
          action: 'RESET_USER_TEMP_PASSWORD',
          entity: 'UserProfile',
          entityId: user.id,
          diffAfter: { name: user.name, mustChangePassword: true },
          branch: prev.currentUser.branch
        },
        ...prev.auditLogs
      ]
    }));

    setCreatedNotice({ user: user.name, tempPass: newTemp });
  };

  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);

  const confirmDeleteUser = () => {
    if (!deletingUser) return;
    triggerHaptic('warning');
    onUpdateState((prev) => ({
      ...prev,
      users: prev.users.filter((u) => u.id !== deletingUser.id),
      auditLogs: [
        {
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorId: prev.currentUser.id,
          actorName: prev.currentUser.name,
          action: 'DELETE_USER_ACCOUNT',
          entity: 'UserProfile',
          entityId: deletingUser.id,
          diffBefore: { name: deletingUser.name, role: deletingUser.role },
          branch: prev.currentUser.branch
        },
        ...prev.auditLogs
      ]
    }));
    setDeletingUser(null);
  };

  const handleDeleteUser = (user: UserProfile) => {
    if (!isSuperAdmin) {
      alert('Security Protocol: Only SuperAdmins can delete user accounts.');
      return;
    }
    if (user.id === currentUser.id) {
      alert('Security Violation: You cannot delete your own active session account.');
      return;
    }

    triggerHaptic('light');
    setDeletingUser(user);
  };

  const handleToggleActive = (user: UserProfile) => {
    if (!isSuperAdmin) return;
    if (user.id === currentUser.id) {
      alert('You cannot deactivate your own active session.');
      return;
    }
    const nextActive = !user.active;
    triggerHaptic(nextActive ? 'success' : 'warning');

    onUpdateState((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.id === user.id ? { ...u, active: nextActive } : u)),
      auditLogs: [
        {
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorId: prev.currentUser.id,
          actorName: prev.currentUser.name,
          action: nextActive ? 'ACTIVATE_USER_ACCOUNT' : 'DEACTIVATE_USER_ACCOUNT',
          entity: 'UserProfile',
          entityId: user.id,
          diffAfter: { name: user.name, active: nextActive },
          branch: prev.currentUser.branch
        },
        ...prev.auditLogs
      ]
    }));
  };

  const handleAssignDigitalMoneyManager = (targetUser: UserProfile) => {
    if (!isAdminOrSuperAdmin) {
      alert('Security Protocol: Only Admins or SuperAdmins can delegate the Digital Money Manager role.');
      return;
    }
    if (targetUser.isDigitalMoneyManager) {
      alert(`${targetUser.name} is already designated as the Digital Money Manager.`);
      return;
    }

    const confirmed = window.confirm(
      `Reassign Digital Money Manager?\n\nAre you sure you want to shift the Digital Money Manager role to "${targetUser.name}"?\n\nNote: Only ONE user can hold this role. All incoming bank SMS auto-parsers, notification listeners, and review queues will be assigned to ${targetUser.name}.`
    );

    if (!confirmed) return;

    triggerHaptic('success');
    onUpdateState((prev) => {
      const updatedUsers = prev.users.map((u) => ({
        ...u,
        isDigitalMoneyManager: u.id === targetUser.id
      }));

      const updatedCurrentUser =
        prev.currentUser.id === targetUser.id
          ? { ...prev.currentUser, isDigitalMoneyManager: true }
          : { ...prev.currentUser, isDigitalMoneyManager: false };

      return {
        ...prev,
        users: updatedUsers,
        currentUser: updatedCurrentUser,
        digitalMoneyManagerUserId: targetUser.id,
        auditLogs: [
          {
            id: `aud-${Date.now()}`,
            timestamp: new Date().toISOString(),
            actorId: prev.currentUser.id,
            actorName: prev.currentUser.name,
            action: 'DELEGATE_DIGITAL_MONEY_MANAGER',
            entity: 'UserProfile',
            entityId: targetUser.id,
            diffAfter: { name: targetUser.name, isDigitalMoneyManager: true },
            branch: prev.currentUser.branch
          },
          ...prev.auditLogs
        ]
      };
    });
  };

  return (
    <div className="space-y-4">
      {/* Created / Reset Password Notice Banner */}
      {createdNotice && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center justify-between text-xs animate-fadeIn">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <strong className="text-white block font-bold">Temporary Password Issued for {createdNotice.user}</strong>
              <span className="text-[11px] text-emerald-200/90 font-mono">
                Temporary Password: <span className="bg-emerald-950 px-2 py-0.5 rounded text-emerald-300 font-bold border border-emerald-500/40">{createdNotice.tempPass}</span> (User must change on first login)
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(createdNotice.tempPass);
              triggerHaptic('success');
            }}
            className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-[11px] flex items-center gap-1.5 cursor-pointer hover:bg-emerald-400"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy Password</span>
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-[#FB923C]" />
            Users & Role Permissions Matrix
          </h3>
          <p className="text-xs text-slate-500 dark:text-[#8899BB]">
            Role-Based Access Control (RBAC) • SuperAdmin user registration & privilege management
          </p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-orange-500 dark:bg-[#FB923C] text-white dark:text-[#0A0E1A] font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer hover:brightness-110 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Register New User</span>
          </button>
        )}
      </div>

      {/* Privileges Matrix Hierarchy Banner */}
      <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] rounded-2xl p-4 space-y-3 text-xs shadow-sm">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-900 dark:text-[#F0F4FF] flex items-center gap-1.5 uppercase tracking-wider">
            <Shield className="w-4 h-4 text-[#FB923C]" />
            Role Hierarchy & Granular Privileges
          </h4>
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
            Current Session: <strong className="text-orange-500 font-bold">{currentUser.role}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[11px]">
          <div className="bg-slate-50 dark:bg-[#1C2333] p-2.5 rounded-xl border border-purple-500/20">
            <span className="font-bold text-purple-600 dark:text-purple-400 block">SuperAdmin</span>
            <p className="text-slate-500 dark:text-[#8899BB] text-[10px] mt-0.5">
              Full system control, User CRUD, Role management, Temp Password resets & System resets.
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-[#1C2333] p-2.5 rounded-xl border border-blue-500/20">
            <span className="font-bold text-blue-600 dark:text-blue-400 block">Admin</span>
            <p className="text-slate-500 dark:text-[#8899BB] text-[10px] mt-0.5">
              Operational write rights across transactions, loans, equbs, wallets & reports.
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-[#1C2333] p-2.5 rounded-xl border border-emerald-500/20">
            <span className="font-bold text-emerald-600 dark:text-emerald-400 block">Partner</span>
            <p className="text-slate-500 dark:text-[#8899BB] text-[10px] mt-0.5">
              Standard financial recording & viewing rights for designated branch locations.
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-[#1C2333] p-2.5 rounded-xl border border-slate-500/20">
            <span className="font-bold text-slate-600 dark:text-slate-400 block">Viewer</span>
            <p className="text-slate-500 dark:text-[#8899BB] text-[10px] mt-0.5">
              Strict read-only privilege mode across authorized reports and financial views.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 dark:text-[#8899BB]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            className="w-full bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#8899BB] outline-none focus:border-orange-500 dark:focus:border-[#FB923C]"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as any)}
          className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none cursor-pointer"
        >
          <option value="ALL">All Roles ({users.length})</option>
          <option value="SuperAdmin">SuperAdmin</option>
          <option value="Admin">Admin</option>
          <option value="Partner">Partner</option>
          <option value="Viewer">Viewer</option>
        </select>
      </div>

      {/* Users List Cards */}
      <div className="space-y-2.5">
        {filteredUsers.map((u) => {
          const isCurrent = u.id === currentUser.id;
          const uPerms = getEffectivePermissions(u);

          return (
            <div
              key={u.id}
              className={`bg-white dark:bg-[#131926] border rounded-2xl p-4 transition-all space-y-3 ${
                isCurrent
                  ? 'border-orange-500 dark:border-[#FB923C]/60 shadow-md'
                  : u.active === false
                  ? 'border-red-500/30 opacity-70 bg-red-500/5'
                  : 'border-slate-200 dark:border-[#1E2D40]'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm text-white shrink-0 ${
                      u.role === 'SuperAdmin'
                        ? 'bg-purple-600'
                        : u.role === 'Admin'
                        ? 'bg-blue-600'
                        : u.role === 'Partner'
                        ? 'bg-emerald-600'
                        : 'bg-slate-600'
                    }`}
                  >
                    {u.name.slice(0, 2).toUpperCase()}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{u.name}</h4>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                          u.role === 'SuperAdmin'
                            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30'
                            : u.role === 'Admin'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
                            : u.role === 'Partner'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30'
                        }`}
                      >
                        {u.role}
                      </span>

                      {u.isDigitalMoneyManager && (
                        <span className="text-[9px] font-black bg-emerald-500/15 text-emerald-600 dark:text-[#00D4AA] px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                          <Zap className="w-2.5 h-2.5 fill-current" />
                          <span>Digital Money Manager</span>
                        </span>
                      )}

                      {isCurrent && (
                        <span className="text-[9px] font-bold bg-orange-500/15 text-orange-600 dark:text-[#FB923C] px-2 py-0.5 rounded-full border border-orange-500/30">
                          Active You
                        </span>
                      )}

                      {u.mustChangePassword && (
                        <span className="text-[9px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" />
                          <span>Temp Password</span>
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-500 dark:text-[#8899BB] flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 font-mono">
                      <span>{u.email}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Building className="w-3 h-3 text-slate-400" />
                        {u.branch}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right actions */}
                <div className="flex items-center gap-1.5 self-end sm:self-center">
                  {isAdminOrSuperAdmin && u.active && !u.isDigitalMoneyManager && (
                    <button
                      onClick={() => handleAssignDigitalMoneyManager(u)}
                      className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-[#00D4AA] border border-emerald-500/30 flex items-center gap-1 cursor-pointer transition-all"
                      title="Shift Digital Money Manager role to this user"
                    >
                      <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-[#00D4AA]" />
                      <span>Set as Manager</span>
                    </button>
                  )}

                  {isSuperAdmin && !isCurrent && (
                    <>
                      <button
                        onClick={() => handleResetTempPassword(u)}
                        className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1 cursor-pointer transition-all"
                        title="Reset temporary password for mandatory first-login change"
                      >
                        <Key className="w-3.5 h-3.5" />
                        <span>Reset Temp Pass</span>
                      </button>

                      <button
                        onClick={() => handleToggleActive(u)}
                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border flex items-center gap-1 cursor-pointer transition-all ${
                          u.active
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/40 hover:bg-red-500/30'
                        }`}
                        title={u.active ? 'Deactivate user access' : 'Activate user account'}
                      >
                        {u.active ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                        <span>{u.active ? 'Active' : 'Deactivated'}</span>
                      </button>
                    </>
                  )}

                  {onSwitchUser && !isCurrent && u.active && (
                    <button
                      onClick={() => {
                        triggerHaptic('medium');
                        onSwitchUser(u);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-[#00D4AA]/10 hover:bg-[#00D4AA]/20 text-[#00D4AA] text-[11px] font-bold cursor-pointer border border-[#00D4AA]/30"
                      title="Switch active session view"
                    >
                      Switch User
                    </button>
                  )}

                  {(isSuperAdmin || isCurrent) && (
                    <button
                      onClick={() => handleOpenEdit(u)}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-[#1C2333] hover:bg-[#FB923C]/20 text-slate-600 dark:text-[#8899BB] hover:text-[#FB923C] cursor-pointer"
                      title="Edit User & Permissions"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {isSuperAdmin && !isCurrent && (
                    <button
                      onClick={() => handleDeleteUser(u)}
                      className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 cursor-pointer"
                      title="Delete User"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Granular Permission Tags Preview */}
              <div className="pt-2 border-t border-slate-100 dark:border-[#1E2D40] flex flex-wrap items-center gap-1.5 text-[10px]">
                <span className="text-slate-400 dark:text-slate-500 font-mono font-bold mr-1">Modules:</span>
                <span className={`px-2 py-0.5 rounded ${uPerms.dashboard ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800/40 text-slate-500'}`}>Dashboard</span>
                <span className={`px-2 py-0.5 rounded ${uPerms.income ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800/40 text-slate-500'}`}>Income</span>
                <span className={`px-2 py-0.5 rounded ${uPerms.expenses ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800/40 text-slate-500'}`}>Expenses</span>
                <span className={`px-2 py-0.5 rounded ${uPerms.equb ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800/40 text-slate-500'}`}>Equb</span>
                <span className={`px-2 py-0.5 rounded ${uPerms.loans ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800/40 text-slate-500'}`}>Loans</span>
                <span className={`px-2 py-0.5 rounded ${uPerms.reports ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800/40 text-slate-500'}`}>Reports</span>
                <span className={`px-2 py-0.5 rounded ${uPerms.settings ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800/40 text-slate-500'}`}>Settings</span>

                <span className="text-slate-400 dark:text-slate-500 font-mono font-bold ml-2 mr-1">Actions:</span>
                <span className={`px-2 py-0.5 rounded ${uPerms.canAdd ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-800/40 text-slate-500'}`}>Add</span>
                <span className={`px-2 py-0.5 rounded ${uPerms.canEdit ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-800/40 text-slate-500'}`}>Edit</span>
                <span className={`px-2 py-0.5 rounded ${uPerms.canDelete ? 'bg-red-500/10 text-red-400' : 'bg-slate-800/40 text-slate-500'}`}>Delete</span>
                {uPerms.viewOnly && <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold">View Only</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit User Modal */}
      {(showAddModal || editingUser) && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn overflow-y-auto">
          <div className="bg-white dark:bg-[#131926] border border-orange-300 dark:border-[#FB923C]/40 w-full max-w-lg p-6 rounded-3xl space-y-5 text-slate-900 dark:text-white shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1E2D40] pb-3">
              <h3 className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                <Users className="w-5 h-5 text-orange-500 dark:text-[#FB923C]" />
                {editingUser ? `Edit User Privileges: ${editingUser.name}` : 'Register New User & Privileges'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingUser(null);
                }}
                className="text-slate-400 dark:text-[#8899BB] hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-[#8899BB] block mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] focus:border-orange-500 dark:focus:border-[#FB923C] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-[#8899BB] block mb-1">
                    Username / Email *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] focus:border-orange-500 dark:focus:border-[#FB923C] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none"
                    required
                  />
                </div>
              </div>

              {/* Temporary Password Assignment */}
              <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <Key className="w-4 h-4" />
                    <span>{editingUser ? 'Reset Temporary Password (Optional)' : 'Assigned Temporary Password'}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const gen = generateTemporaryPassword();
                      setTempPassword(gen);
                      triggerHaptic('light');
                    }}
                    className="text-[10px] font-bold text-[#00D4AA] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Generate Random</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    placeholder={editingUser ? 'Leave blank to keep existing password' : 'e.g. PZ-X92A1B'}
                    className="w-full bg-slate-900 border border-amber-500/30 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-slate-500 outline-none"
                  />
                </div>
                <p className="text-[10px] text-amber-300/80">
                  User will be required to change this temporary password on their first login.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-[#8899BB] block mb-1">
                    System Role Preset
                  </label>
                  <select
                    value={role}
                    onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                    className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] focus:border-orange-500 dark:focus:border-[#FB923C] rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none cursor-pointer"
                  >
                    <option value="SuperAdmin">SuperAdmin (Full Master Privileges)</option>
                    <option value="Admin">Admin (Operational Management)</option>
                    <option value="Partner">Partner (Standard Branch Operational)</option>
                    <option value="Viewer">Viewer (Read-Only Observer Mode)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-[#8899BB] block mb-1">
                    Assigned Branch Location
                  </label>
                  <input
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="Branch name"
                    className="w-full bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] focus:border-orange-500 dark:focus:border-[#FB923C] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              {/* Granular Module Privileges Matrix Checklist */}
              <div className="space-y-2 border-t border-slate-200 dark:border-[#1E2D40] pt-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-[#FB923C]" />
                    <span>Configurable Privileges Matrix</span>
                  </h4>
                  <span className="text-[10px] text-slate-400">Toggle individual module access</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {[
                    { key: 'dashboard', label: 'Dashboard' },
                    { key: 'income', label: 'Income Records' },
                    { key: 'expenses', label: 'Expense Records' },
                    { key: 'equb', label: 'Equb System' },
                    { key: 'loans', label: 'Loans / Microfinance' },
                    { key: 'reports', label: 'Reports & Export' },
                    { key: 'analytics', label: 'Analytics' },
                    { key: 'partners', label: 'Partners Directory' },
                    { key: 'settings', label: 'Settings & Users' },
                    { key: 'wallets', label: 'Wallets & Accounts' },
                    { key: 'receivables', label: 'Receivables' },
                    { key: 'assets', label: 'Fixed Assets' }
                  ].map((item) => (
                    <label
                      key={item.key}
                      className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] cursor-pointer hover:border-orange-500/50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(permissions[item.key as keyof UserPermissions])}
                        onChange={() => handleTogglePermission(item.key as keyof UserPermissions)}
                        className="w-4 h-4 rounded border-slate-700 text-[#00D4AA] focus:ring-0 bg-slate-900 cursor-pointer"
                      />
                      <span className="text-[11px] font-medium text-slate-700 dark:text-slate-200">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Action Permissions */}
              <div className="space-y-2 border-t border-slate-200 dark:border-[#1E2D40] pt-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Allowed Actions
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {[
                    { key: 'canAdd', label: 'Add Records' },
                    { key: 'canEdit', label: 'Edit Records' },
                    { key: 'canDelete', label: 'Delete Records' },
                    { key: 'canReverse', label: 'Reverse Ledger' }
                  ].map((action) => (
                    <label
                      key={action.key}
                      className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(permissions[action.key as keyof UserPermissions])}
                        onChange={() => handleTogglePermission(action.key as keyof UserPermissions)}
                        className="w-4 h-4 rounded border-slate-700 text-[#00D4AA] focus:ring-0 bg-slate-900 cursor-pointer"
                      />
                      <span className="text-[11px] font-medium text-slate-700 dark:text-slate-200">
                        {action.label}
                      </span>
                    </label>
                  ))}
                </div>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 cursor-pointer mt-2">
                  <input
                    type="checkbox"
                    checked={Boolean(permissions.viewOnly)}
                    onChange={() => handleTogglePermission('viewOnly')}
                    className="w-4 h-4 rounded border-slate-700 text-amber-500 focus:ring-0 bg-slate-900 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                    Enforce Strict View-Only Mode (Overrides write permissions)
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-between bg-slate-50 dark:bg-[#1C2333] p-3 rounded-2xl border border-slate-200 dark:border-[#1E2D40]">
                <span className="text-xs font-bold text-slate-600 dark:text-[#8899BB]">Account Status</span>
                <button
                  type="button"
                  onClick={() => setActive(!active)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    active
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30'
                  }`}
                >
                  {active ? 'Active' : 'Deactivated'}
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-[#1E2D40]">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingUser(null);
                }}
                className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-[#1C2333] text-xs font-bold text-slate-600 dark:text-[#8899BB] hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!name.trim() || !email.trim()}
                onClick={editingUser ? handleSaveEdit : handleSaveAdd}
                className="flex-1 py-3 rounded-2xl bg-orange-500 dark:bg-[#FB923C] hover:brightness-110 text-xs font-bold text-white dark:text-[#0A0E1A] shadow-lg cursor-pointer disabled:opacity-50"
              >
                {editingUser ? 'Save User Privileges' : 'Register User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#131926] border border-rose-200 dark:border-rose-900/50 max-w-sm w-full p-5 rounded-2xl space-y-4 shadow-2xl text-slate-900 dark:text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Delete User Account?</h3>
                <p className="text-xs text-slate-500 dark:text-[#8899BB] font-semibold">{deletingUser.name} ({deletingUser.role})</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-[#8899BB] leading-relaxed">
              Are you sure you want to permanently remove <strong className="text-slate-900 dark:text-white">"{deletingUser.name}"</strong> from your organization? Their login access will be revoked immediately.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeletingUser(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] text-xs font-bold text-slate-600 dark:text-[#8899BB] hover:bg-slate-200 dark:hover:bg-[#252E42]"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteUser}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-md hover:bg-rose-700 active:scale-[0.98] transition-all"
              >
                Yes, Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserX,
  KeyRound,
  RotateCcw,
  Search,
  CheckCircle2,
  Lock,
  ExternalLink,
  Sliders,
  X,
  AlertTriangle
} from 'lucide-react';

interface LocalUser {
  name: string;
  fullName: string;
  description: string;
  enabled: boolean;
  role: string;
  isAdmin: boolean;
  passwordRequired: boolean;
  passwordExpires: boolean;
  userMayChangePassword: boolean;
  lastLogon: string;
  passwordChangeDate: string;
  sid: string;
}

interface Props {
  setStatusBanner: (msg: string | null) => void;
}

export default function PowerUserManager({ setStatusBanner }: Props) {
  const [users, setUsers] = useState<LocalUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');

  // Modal State for Password Reset
  const [targetUser, setTargetUser] = useState<LocalUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setStatusBanner('Querying all Windows user accounts and administrator groups via Get-LocalUser…');
    try {
      if ((window as any).electronAPI?.getPowerUsers) {
        const list = await (window as any).electronAPI.getPowerUsers();
        setUsers(list || []);
        setStatusBanner(`Loaded ${list.length} Windows user accounts with complete security profiles.`);
      }
    } catch (err: any) {
      setStatusBanner(`User query notice: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleUserState = async (user: LocalUser) => {
    const targetState = !user.enabled;
    const actionWord = targetState ? 'Enable' : 'Disable';
    setStatusBanner(`Dispatching request to ${actionWord} account '${user.name}'…`);
    try {
      if ((window as any).electronAPI?.setUserState) {
        const res = await (window as any).electronAPI.setUserState(user.name, targetState);
        setStatusBanner(res.message);
        await new Promise((r) => setTimeout(r, 1200));
        await fetchUsers();
      }
    } catch (err: any) {
      setStatusBanner(`Account state error: ${err.message}`);
    }
  };

  const handleExecutePasswordReset = async () => {
    if (!targetUser) return;
    if (!newPassword || newPassword !== confirmPassword) {
      setStatusBanner('Passwords do not match or field is empty. Please enter matching passwords.');
      return;
    }

    setResetting(true);
    setStatusBanner(`Dispatching password reset for user '${targetUser.name}'…`);
    try {
      if ((window as any).electronAPI?.resetUserPassword) {
        const res = await (window as any).electronAPI.resetUserPassword(targetUser.name, newPassword);
        setStatusBanner(res.message);
        setTargetUser(null);
        setNewPassword('');
        setConfirmPassword('');
        await new Promise((r) => setTimeout(r, 1200));
        await fetchUsers();
      }
    } catch (err: any) {
      setStatusBanner(`Password reset notice: ${err.message}`);
    } finally {
      setResetting(false);
    }
  };

  const handleLaunchTool = async (tool: string) => {
    try {
      if ((window as any).electronAPI?.launchUserTool) {
        const res = await (window as any).electronAPI.launchUserTool(tool);
        setStatusBanner(res.message);
      }
    } catch (err: any) {
      setStatusBanner(`Tool notice: ${err.message}`);
    }
  };

  const totalUsers = users.length;
  const enabledUsers = users.filter((u) => u.enabled).length;
  const adminUsers = users.filter((u) => u.isAdmin).length;
  const disabledUsers = users.filter((u) => !u.enabled).length;

  const filteredUsers = users.filter((u) => {
    let matchesFilter = true;
    if (filterRole === 'ENABLED') matchesFilter = u.enabled;
    else if (filterRole === 'DISABLED') matchesFilter = !u.enabled;
    else if (filterRole === 'ADMINS') matchesFilter = u.isAdmin;

    const matchesSearch =
      (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.description || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.role || '').toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="workspace-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 24, fontWeight: 600 }}>Power User &amp; Account Security Manager</h1>
            <span
              style={{
                fontSize: 11,
                padding: '3px 8px',
                borderRadius: 6,
                background: 'rgba(139,61,255,0.2)',
                color: '#a66bff',
                border: '1px solid rgba(139,61,255,0.35)',
                fontWeight: 700
              }}
            >
              Power User Suite
            </span>
            <span
              style={{
                fontSize: 11,
                padding: '3px 8px',
                borderRadius: 6,
                background: 'rgba(24,226,153,0.18)',
                color: '#18e299',
                border: '1px solid rgba(24,226,153,0.3)',
                fontWeight: 700
              }}
            >
              Live SAM Database
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            Inspect all local Windows accounts, administrator privileges, password policies, toggle enable/disable, and reset user passwords.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-secondary" onClick={() => handleLaunchTool('netplwiz')} title="Open Advanced User Accounts (netplwiz)">
            <Sliders size={14} /> Advanced Netplwiz
          </button>
          <button className="btn-secondary" onClick={() => handleLaunchTool('lusrmgr')} title="Open Local Users and Groups (lusrmgr.msc)">
            <ExternalLink size={14} /> lusrmgr.msc
          </button>
          <button className="btn-primary" onClick={fetchUsers} disabled={loading}>
            <RotateCcw size={14} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Querying Accounts…' : 'Refresh Users'}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        <div className="glass-card" style={{ padding: '14px 18px' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Total System Accounts</div>
          <div style={{ fontSize: 24, fontWeight: 600, color: '#00e5ff', marginTop: 4 }}>
            {totalUsers} Accounts
          </div>
        </div>

        <div className="glass-card" style={{ padding: '14px 18px' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Active / Enabled Users</div>
          <div style={{ fontSize: 24, fontWeight: 600, color: '#18e299', marginTop: 4 }}>
            {enabledUsers} Active
          </div>
        </div>

        <div className="glass-card" style={{ padding: '14px 18px' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Administrator Accounts</div>
          <div style={{ fontSize: 24, fontWeight: 600, color: '#ffbe0b', marginTop: 4 }}>
            {adminUsers} Admins
          </div>
        </div>

        <div className="glass-card" style={{ padding: '14px 18px' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Disabled / Locked Accounts</div>
          <div style={{ fontSize: 24, fontWeight: 600, color: '#ff2a85', marginTop: 4 }}>
            {disabledUsers} Disabled
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            ['ALL', `All Users (${totalUsers})`],
            ['ENABLED', `Active (${enabledUsers})`],
            ['ADMINS', `Administrators (${adminUsers})`],
            ['DISABLED', `Disabled (${disabledUsers})`]
          ].map(([val, label]) => {
            const active = filterRole === val;
            return (
              <button
                key={val}
                onClick={() => setFilterRole(val)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: active ? 700 : 500,
                  border: active ? '1px solid #00e5ff' : '1px solid rgba(255,255,255,0.1)',
                  background: active ? 'rgba(0,229,255,0.18)' : 'rgba(255,255,255,0.04)',
                  color: active ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-secondary)' }} />
          <input
            type="text"
            className="input-box"
            placeholder="Search account name, full name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 240, paddingLeft: 30 }}
          />
        </div>
      </div>

      {/* Users Accounts List */}
      <div className="glass-card" style={{ flex: 1, padding: 14 }}>
        {loading && users.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <Users size={36} color="#00e5ff" style={{ margin: '0 auto 12px', animation: 'spin 2s linear infinite' }} />
            <div style={{ fontSize: 15, fontWeight: 700 }}>Enumerating Local Accounts &amp; SAM Database…</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
              Querying Win32_UserAccount &amp; Security Identifiers (SIDs)
            </div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <CheckCircle2 size={42} color="#18e299" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: 16, fontWeight: 600 }}>No accounts match the current filter</div>
          </div>
        ) : (
          <div className="scroll-table-container">
            {filteredUsers.map((user) => (
              <div
                key={user.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: user.enabled ? 'rgba(0,0,0,0.26)' : 'rgba(0,0,0,0.4)',
                  border: user.isAdmin
                    ? '1px solid rgba(255,190,11,0.35)'
                    : user.enabled
                    ? '1px solid rgba(0,229,255,0.18)'
                    : '1px solid rgba(255,255,255,0.06)',
                  gap: 12,
                  opacity: user.enabled ? 1 : 0.72
                }}
              >
                {/* User Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: user.isAdmin ? 'rgba(255,190,11,0.2)' : 'rgba(139,61,255,0.2)',
                      border: user.isAdmin ? '1px solid rgba(255,190,11,0.4)' : '1px solid rgba(139,61,255,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {user.isAdmin ? (
                      <Shield size={20} color="#ffbe0b" />
                    ) : (
                      <Users size={20} color="#00e5ff" />
                    )}
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14.5, fontWeight: 600, color: '#fff' }}>
                        {user.name}
                      </span>
                      {user.fullName && user.fullName !== user.name && (
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          ({user.fullName})
                        </span>
                      )}

                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: 5,
                          background: user.isAdmin
                            ? 'rgba(255,190,11,0.2)'
                            : 'rgba(139,61,255,0.2)',
                          color: user.isAdmin ? '#ffbe0b' : '#a66bff',
                          border: '1px solid currentColor'
                        }}
                      >
                        {user.role}
                      </span>

                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: 5,
                          background: user.enabled ? 'rgba(24,226,153,0.18)' : 'rgba(255,42,133,0.18)',
                          color: user.enabled ? '#18e299' : '#ff2a85',
                          border: '1px solid currentColor'
                        }}
                      >
                        {user.enabled ? '● Active' : '○ Disabled'}
                      </span>
                    </div>

                    <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 3 }}>
                      {user.description || 'Standard Windows Account'} • Last Logon: <strong>{user.lastLogon}</strong> • Pwd Changed: {user.passwordChangeDate}
                    </div>

                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace', marginTop: 2 }}>
                      SID: {user.sid}
                    </div>
                  </div>
                </div>

                {/* Actions Stack */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {/* Reset Password Button */}
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setTargetUser(user);
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    style={{ fontSize: 12, padding: '7px 12px' }}
                  >
                    <KeyRound size={13} color="#00e5ff" /> Reset Password
                  </button>

                  {/* Toggle Enable/Disable Button */}
                  <button
                    className={user.enabled ? 'btn-danger' : 'btn-primary'}
                    onClick={() => handleToggleUserState(user)}
                    style={{
                      fontSize: 12,
                      padding: '7px 14px',
                      background: user.enabled ? undefined : 'linear-gradient(135deg, #18e299, #00e5ff)'
                    }}
                  >
                    {user.enabled ? (
                      <>
                        <UserX size={13} /> Disable Account
                      </>
                    ) : (
                      <>
                        <UserCheck size={13} /> Enable Account
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PASSWORD RESET MODAL */}
      {targetUser && (
        <div className="modal-backdrop" onClick={() => setTargetUser(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 17, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                <KeyRound size={18} color="#00e5ff" />
                Reset Password: {targetUser.name}
              </div>
              <button
                onClick={() => setTargetUser(null)}
                style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Set a new Windows login password for account <strong>{targetUser.name}</strong> ({targetUser.role}). This executes elevated password reassignment via Windows Security Subsystem.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>
                  New Password
                </label>
                <input
                  type="password"
                  className="input-box"
                  placeholder="Enter new password…"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ width: '100%', fontFamily: 'monospace' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  className="input-box"
                  placeholder="Re-enter new password to verify…"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ width: '100%', fontFamily: 'monospace' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn-secondary" onClick={() => setTargetUser(null)} disabled={resetting}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleExecutePasswordReset}
                disabled={!newPassword || newPassword !== confirmPassword || resetting}
                style={{
                  background: 'linear-gradient(135deg, #00e5ff, #8b3dff)',
                  boxShadow: '0 0 16px rgba(0,229,255,0.4)'
                }}
              >
                {resetting ? 'Applying Password…' : 'Apply New Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { Settings, RefreshCw, Key, Info, ShieldCheck, Download, ExternalLink, CheckCircle2, AlertTriangle } from 'lucide-react';

interface SettingsPageProps {
  licenseStatus: any;
  dryRun: boolean;
  onToggleDryRun: () => void;
  onOpenLicense: () => void;
  onCheckForUpdates: () => Promise<void>;
  updateInfo: { updateAvailable: boolean; latestVersion?: string } | null;
  onOpenUpdate: () => void;
}

const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 14,
  padding: 18,
  marginBottom: 16
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  padding: '8px 0',
  fontSize: 12.5
};

const Toggle: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void }> = ({ label, checked, onChange }) => (
  <button
    onClick={() => onChange(!checked)}
    role="switch"
    aria-checked={checked}
    aria-label={label}
    style={{
      width: 42,
      height: 22,
      borderRadius: 11,
      border: 'none',
      cursor: 'pointer',
      background: checked ? '#00e676' : 'rgba(255,255,255,0.25)',
      position: 'relative',
      transition: 'background 0.2s'
    }}
  >
    <span
      style={{
        position: 'absolute',
        top: 2,
        left: checked ? 22 : 2,
        width: 18,
        height: 18,
        borderRadius: '50%',
        background: '#fff',
        transition: 'left 0.2s'
      }}
    />
  </button>
);

export const SettingsPage: React.FC<SettingsPageProps> = ({
  licenseStatus,
  dryRun,
  onToggleDryRun,
  onOpenLicense,
  onCheckForUpdates,
  updateInfo,
  onOpenUpdate
}) => {
  const api = (window as any).electronAPI;
  const [appInfo, setAppInfo] = useState<any>(null);
  const [settings, setSettings] = useState<{ autoCheckUpdates: boolean }>({ autoCheckUpdates: true });
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    api?.getAppInfo?.().then(setAppInfo).catch(() => {});
    api?.getAppSettings?.().then((s: any) => s && setSettings(s)).catch(() => {});
  }, []);

  const updateSetting = async (patch: { autoCheckUpdates?: boolean }) => {
    setSettings((prev) => ({ ...prev, ...patch }));
    try {
      const saved = await api?.setAppSettings?.(patch);
      if (saved) setSettings(saved);
    } catch (_) {}
  };

  const runCheck = async () => {
    setChecking(true);
    try {
      await onCheckForUpdates();
      const info = await api?.getAppInfo?.();
      if (info) setAppInfo(info);
    } finally {
      setChecking(false);
    }
  };

  const isPaid = licenseStatus?.isPro && !licenseStatus?.isTrial;

  return (
    <div style={{ maxWidth: 860 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <Settings size={22} color="#00e5ff" />
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>Settings</h1>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Updates, license and app information</div>
        </div>
      </div>

      {/* UPDATES */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, marginBottom: 6 }}>
          <Download size={16} color="#00e5ff" /> Software Updates
        </div>
        <div style={rowStyle}>
          <span>Installed version</span>
          <strong>v{appInfo?.version || '...'}</strong>
        </div>
        <div style={rowStyle}>
          <span>Last checked</span>
          <span>{appInfo?.lastCheckedAt ? new Date(appInfo.lastCheckedAt).toLocaleString() : 'Not yet'}</span>
        </div>
        <div style={rowStyle}>
          <span>Automatically check for updates on launch and every 4 hours</span>
          <Toggle label="Automatically check for updates" checked={settings.autoCheckUpdates} onChange={(v) => updateSetting({ autoCheckUpdates: v })} />
        </div>
        {updateInfo?.updateAvailable && (
          <div
            style={{
              ...rowStyle,
              background: 'rgba(0,230,118,0.12)',
              border: '1px solid rgba(0,230,118,0.4)',
              borderRadius: 8,
              padding: '8px 12px',
              marginTop: 6
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={14} color="#00e676" /> Update v{updateInfo.latestVersion} is available
            </span>
            <button className="btn-primary" onClick={onOpenUpdate} style={{ padding: '5px 12px', fontSize: 11.5 }}>
              View &amp; Update
            </button>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button className="btn-secondary" onClick={runCheck} disabled={checking} style={{ padding: '6px 14px', fontSize: 12 }}>
            <RefreshCw size={13} className={checking ? 'spin' : ''} /> {checking ? 'Checking...' : 'Check for Updates'}
          </button>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 10, lineHeight: 1.5 }}>
          <AlertTriangle size={11} style={{ verticalAlign: -1, marginRight: 4 }} />
          Updates are downloaded from the official release channel and verified (SHA-256) before install. Installers are
          not code-signed yet, so Windows SmartScreen may ask for confirmation (More info → Run anyway). Your license and
          settings are kept after updating.
        </div>
      </div>

      {/* LICENSE */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, marginBottom: 6 }}>
          <Key size={16} color="#00e5ff" /> License
        </div>
        <div style={rowStyle}>
          <span>Status</span>
          <strong style={{ color: isPaid ? '#00e676' : '#00e5ff' }}>{licenseStatus?.statusLabel || 'Unknown'}</strong>
        </div>
        <div style={rowStyle}>
          <span>Plan</span>
          <span>{licenseStatus?.plan || '-'}</span>
        </div>
        {licenseStatus?.licenseKeyMasked && (
          <div style={rowStyle}>
            <span>License key</span>
            <code>{licenseStatus.licenseKeyMasked}</code>
          </div>
        )}
        {licenseStatus?.isTrial && licenseStatus?.daysLeft !== undefined && (
          <div style={rowStyle}>
            <span>Trial days left</span>
            <span>{licenseStatus.daysLeft}</span>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button className="btn-primary" onClick={onOpenLicense} style={{ padding: '6px 14px', fontSize: 12 }}>
            <ShieldCheck size={13} /> {isPaid ? 'Manage License' : 'Enter License Key'}
          </button>
          <button
            className="btn-secondary"
            onClick={() => api?.openExternal?.('https://salman8002.gumroad.com/l/8002cleanup-windows')}
            style={{ padding: '6px 14px', fontSize: 12 }}
          >
            <ExternalLink size={13} /> Buy / Manage on Gumroad
          </button>
        </div>
      </div>

      {/* CLEANING SAFETY */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, marginBottom: 6 }}>
          <ShieldCheck size={16} color="#00e5ff" /> Cleaning Safety
        </div>
        <div style={rowStyle}>
          <span>Safe Preview mode (scan and report only, nothing is deleted)</span>
          <Toggle label="Safe Preview mode" checked={dryRun} onChange={() => onToggleDryRun()} />
        </div>
      </div>

      {/* ABOUT */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, marginBottom: 6 }}>
          <Info size={16} color="#00e5ff" /> About
        </div>
        <div style={rowStyle}><span>Application</span><span>8002CleanUp Pro for Windows</span></div>
        <div style={rowStyle}><span>Version</span><span>v{appInfo?.version || '...'}</span></div>
        <div style={rowStyle}><span>Platform</span><span>{appInfo ? `${appInfo.platform} ${appInfo.arch}` : '...'}</span></div>
        <div style={rowStyle}><span>Electron</span><span>{appInfo?.electron || '...'}</span></div>
        <div style={rowStyle}><span>Update channel</span><span>{appInfo?.channel || 'windows'}</span></div>
      </div>
    </div>
  );
};

export default SettingsPage;

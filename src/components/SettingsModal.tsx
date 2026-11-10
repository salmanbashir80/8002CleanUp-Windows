import React, { useState } from 'react';
import {
  Settings,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  X,
  Key,
  CheckCircle2,
  HardDrive,
  Download,
  Lock,
  Layers,
  Power
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentVersion: string;
  updateInfo: any;
  onCheckUpdates: () => Promise<void>;
  licenseStatus: any;
  onOpenLicense: () => void;
  dryRun: boolean;
  onToggleDryRun: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentVersion,
  updateInfo,
  onCheckUpdates,
  licenseStatus,
  onOpenLicense,
  dryRun,
  onToggleDryRun
}) => {
  if (!isOpen) return null;

  const [checking, setChecking] = useState(false);
  const [autoCheck, setAutoCheck] = useState(true);
  const [launchAtStartup, setLaunchAtStartup] = useState(true);
  const [highRamAlert, setHighRamAlert] = useState(true);

  const handleCheck = async () => {
    setChecking(true);
    try {
      await onCheckUpdates();
    } finally {
      setChecking(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 10, 25, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 620,
          background: 'linear-gradient(135deg, rgba(16, 26, 56, 0.96), rgba(10, 18, 42, 0.98))',
          borderRadius: 16,
          border: '1px solid rgba(0, 229, 255, 0.35)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(0, 229, 255, 0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(90deg, rgba(0, 229, 255, 0.1), transparent)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #00e5ff, #8b3dff)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 229, 255, 0.3)'
              }}
            >
              <Settings size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>
                Application Settings & Updates
              </div>
              <div style={{ fontSize: 11.5, color: 'rgba(255, 255, 255, 0.6)', marginTop: 2 }}>
                8002CleanUp Pro for Windows · Build Preferences & Cloud Delivery
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              borderRadius: 8,
              padding: 6,
              cursor: 'pointer',
              color: 'rgba(255, 255, 255, 0.7)'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* SECTION 1: UPDATES & CLOUD DELIVERY */}
          <div
            style={{
              background: 'rgba(0, 229, 255, 0.05)',
              border: '1px solid rgba(0, 229, 255, 0.25)',
              borderRadius: 12,
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={16} color="#00e5ff" />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                  Cloud Software Updates
                </span>
              </div>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  padding: '2px 8px',
                  borderRadius: 10,
                  background: 'rgba(0, 230, 118, 0.15)',
                  color: '#00e676',
                  border: '1px solid rgba(0, 230, 118, 0.3)'
                }}
              >
                v{currentVersion || '2.5.4'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255, 255, 255, 0.75)' }}>
              <span>Delivery Server:</span>
              <span style={{ color: '#00e676', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00e676', display: 'inline-block' }} />
                8002 Secure Cloud Network (Active)
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255, 255, 255, 0.75)' }}>
              <span>Auto-Check for Updates:</span>
              <button
                onClick={() => setAutoCheck(!autoCheck)}
                style={{
                  padding: '3px 10px',
                  borderRadius: 6,
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: autoCheck ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  color: autoCheck ? '#00e676' : 'rgba(255, 255, 255, 0.6)',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {autoCheck ? 'Enabled (Every 4 Hours)' : 'Manual Only'}
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.55)' }}>
                {updateInfo?.updateAvailable ? (
                  <span style={{ color: '#00e5ff', fontWeight: 600 }}>
                    ★ Update v{updateInfo.latestVersion} is ready to install!
                  </span>
                ) : (
                  <span>All components are running the newest official build.</span>
                )}
              </div>

              <button
                onClick={handleCheck}
                disabled={checking}
                style={{
                  padding: '7px 16px',
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #00e5ff, #8b3dff)',
                  border: 'none',
                  color: '#fff',
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: checking ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  opacity: checking ? 0.7 : 1
                }}
              >
                <RefreshCw size={12} className={checking ? 'animate-spin' : ''} />
                <span>{checking ? 'Checking…' : 'Check for Updates Now'}</span>
              </button>
            </div>
          </div>

          {/* SECTION 2: PRO LICENSE & ENCRYPTION */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 12,
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Key size={15} color="#a66bff" />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                  License & Vault Security
                </span>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenLicense();
                }}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: '1px solid rgba(166, 107, 255, 0.35)',
                  background: 'rgba(166, 107, 255, 0.12)',
                  color: '#a66bff',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Manage License
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5, color: 'rgba(255, 255, 255, 0.7)' }}>
              <span>Commercial Tier:</span>
              <span style={{ color: licenseStatus?.isPro ? '#00e676' : '#ffbe0b', fontWeight: 600 }}>
                {licenseStatus?.statusLabel || 'PRO Lifetime'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5, color: 'rgba(255, 255, 255, 0.7)' }}>
              <span>Windows Vault Storage:</span>
              <span style={{ color: '#00e5ff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Lock size={11} /> Native Windows DPAPI Encrypted
              </span>
            </div>
          </div>

          {/* SECTION 3: SYSTEM PREFERENCES */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 12,
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <HardDrive size={15} color="#00e5ff" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                System & Engine Preferences
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5, color: 'rgba(255, 255, 255, 0.7)' }}>
              <span>Launch Minimized on Windows Boot:</span>
              <button
                onClick={() => setLaunchAtStartup(!launchAtStartup)}
                style={{
                  padding: '3px 10px',
                  borderRadius: 6,
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: launchAtStartup ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  color: launchAtStartup ? '#00e676' : 'rgba(255, 255, 255, 0.5)',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {launchAtStartup ? 'ON' : 'OFF'}
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5, color: 'rgba(255, 255, 255, 0.7)' }}>
              <span>High Memory Alert (&gt;85% RAM):</span>
              <button
                onClick={() => setHighRamAlert(!highRamAlert)}
                style={{
                  padding: '3px 10px',
                  borderRadius: 6,
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: highRamAlert ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  color: highRamAlert ? '#00e676' : 'rgba(255, 255, 255, 0.5)',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {highRamAlert ? 'ON' : 'OFF'}
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5, color: 'rgba(255, 255, 255, 0.7)' }}>
              <span>Safety Execution Mode:</span>
              <button
                onClick={onToggleDryRun}
                style={{
                  padding: '3px 10px',
                  borderRadius: 6,
                  border: '1px solid rgba(0, 229, 255, 0.35)',
                  background: dryRun ? 'rgba(24, 226, 153, 0.15)' : 'rgba(0, 229, 255, 0.15)',
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {dryRun ? 'Safe Dry Run' : 'Active Live Clean'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 0, 0, 0.2)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(255, 255, 255, 0.55)' }}>
            <ShieldCheck size={13} color="#00e5ff" />
            <span>Official 8002 Commercial Build · All Rights Reserved</span>
          </div>

          <button
            onClick={onClose}
            style={{
              padding: '7px 20px',
              borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#fff',
              fontSize: 12,
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

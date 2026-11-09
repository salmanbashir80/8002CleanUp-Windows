import React, { useState } from 'react';
import { ShieldCheck, Key, CheckCircle2, AlertTriangle, ExternalLink, X, RotateCcw, Sparkles, Loader2, Award } from 'lucide-react';

interface LicenseStatus {
  isPro: boolean;
  isTrial: boolean;
  isExpired?: boolean;
  plan: string;
  statusLabel: string;
  licenseKeyMasked: string;
  daysLeft?: number;
  type?: string;
  activatedAt?: string;
  message?: string;
}

interface LicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: LicenseStatus;
  onRefreshStatus: () => Promise<void>;
  setStatusBanner: (msg: string | null) => void;
}

export const LicenseModal: React.FC<LicenseModalProps> = ({
  isOpen,
  onClose,
  status,
  onRefreshStatus,
  setStatusBanner
}) => {
  if (!isOpen) return null;

  const [inputKey, setInputKey] = useState('');
  const [inputEmail, setInputEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleActivate = async () => {
    if (!inputKey.trim()) {
      setErrorMsg('Please enter your license key.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if ((window as any).electronAPI?.activateLicense) {
        const res = await (window as any).electronAPI.activateLicense(inputKey.trim(), inputEmail.trim());
        if (res.success) {
          setSuccessMsg(res.message);
          setStatusBanner(res.message);
          await onRefreshStatus();
          setInputKey('');
        } else {
          setErrorMsg(res.message || 'Activation failed. Please check your key.');
        }
      }
    } catch (err: any) {
      setErrorMsg(`Activation error: ${err.message || 'Network error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!confirm('Are you sure you want to deactivate your license on this machine? You will return to evaluation mode.')) {
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if ((window as any).electronAPI?.deactivateLicense) {
        const res = await (window as any).electronAPI.deactivateLicense();
        if (res.success) {
          setSuccessMsg(res.message);
          setStatusBanner(res.message);
          await onRefreshStatus();
        } else {
          setErrorMsg(res.message || 'Deactivation failed.');
        }
      }
    } catch (err: any) {
      setErrorMsg(`Deactivation error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenGumroad = () => {
    if ((window as any).electronAPI?.openExternal) {
      (window as any).electronAPI.openExternal('https://salmanbashir80.gumroad.com/l/8002cleanup-pro');
    }
  };

  const isFullyPro = status.isPro && !status.isTrial;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 10, 25, 0.82)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: 20
      }}
      onClick={onClose}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: 540,
          background: 'linear-gradient(180deg, #121c38 0%, #0d152c 100%)',
          border: '1px solid rgba(0, 229, 255, 0.35)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(0, 229, 255, 0.2)',
          borderRadius: 16,
          padding: 28,
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                background: isFullyPro ? 'rgba(0, 230, 118, 0.2)' : 'rgba(0, 229, 255, 0.2)',
                border: isFullyPro ? '1px solid #00e676' : '1px solid #00e5ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {isFullyPro ? <Award size={22} color="#00e676" /> : <Key size={22} color="#00e5ff" />}
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#fff' }}>
                {isFullyPro ? '8002CleanUp Pro Activated' : '8002CleanUp Pro Licensing'}
              </h2>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                Commercial Windows Distribution • Gumroad Fulfillment
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: 4
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Current License Badge Box */}
        <div
          style={{
            background: isFullyPro ? 'rgba(0, 230, 118, 0.08)' : 'rgba(0, 229, 255, 0.08)',
            border: isFullyPro ? '1px solid rgba(0, 230, 118, 0.3)' : '1px solid rgba(0, 229, 255, 0.3)',
            borderRadius: 12,
            padding: 16,
            marginBottom: 20
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Status:</span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: 20,
                background: isFullyPro ? '#00e676' : '#00e5ff',
                color: '#051124'
              }}
            >
              {status.statusLabel}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Current Plan:</span>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#fff' }}>{status.plan}</span>
          </div>

          {status.licenseKeyMasked && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Key:</span>
              <code style={{ fontSize: 11.5, background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: 4, color: '#00e5ff' }}>
                {status.licenseKeyMasked}
              </code>
            </div>
          )}

          {status.message && (
            <div style={{ fontSize: 11.5, color: isFullyPro ? '#00e676' : 'var(--text-secondary)', marginTop: 8 }}>
              {status.message}
            </div>
          )}
        </div>

        {/* Status Messages */}
        {errorMsg && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              background: 'rgba(255, 71, 87, 0.15)',
              border: '1px solid #ff4757',
              color: '#ff4757',
              fontSize: 12,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <AlertTriangle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              background: 'rgba(0, 230, 118, 0.15)',
              border: '1px solid #00e676',
              color: '#00e676',
              fontSize: 12,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <CheckCircle2 size={15} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Activation Form */}
        {!isFullyPro ? (
          <div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#fff' }}>
                License Key (Gumroad or Offline Key):
              </label>
              <input
                type="text"
                placeholder="e.g. 8002-PRO-XXXX-XXXX-XXXX or Gumroad Key"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'rgba(0,0,0,0.35)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff',
                  fontSize: 13,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#fff' }}>
                Customer Email (Optional, matching purchase receipt):
              </label>
              <input
                type="email"
                placeholder="buyer@example.com"
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'rgba(0,0,0,0.35)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff',
                  fontSize: 13,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button
                className="btn-primary"
                onClick={handleActivate}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '11px 18px',
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: 'linear-gradient(135deg, #00e5ff 0%, #00b4d8 100%)',
                  color: '#051124',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer'
                }}
              >
                {loading ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
                Activate Pro License
              </button>

              <button
                onClick={handleOpenGumroad}
                style={{
                  padding: '11px 18px',
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 8,
                  cursor: 'pointer'
                }}
              >
                <ExternalLink size={15} />
                Get Pro on Gumroad
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
            <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
              License locked to this device. You can transfer it anytime.
            </span>
            <button
              onClick={handleDeactivate}
              disabled={loading}
              style={{
                padding: '8px 14px',
                fontSize: 12,
                background: 'rgba(255, 71, 87, 0.15)',
                color: '#ff4757',
                border: '1px solid rgba(255, 71, 87, 0.4)',
                borderRadius: 8,
                cursor: 'pointer'
              }}
            >
              Transfer / Deactivate
            </button>
          </div>
        )}

        {/* Footer Note */}
        <div style={{ marginTop: 22, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          🛡️ <strong>Commercial Readiness:</strong> Once activated, 8002CleanUp Pro operates 100% offline without mandatory internet connectivity. Air-gapped offline keys are fully supported.
        </div>
      </div>
    </div>
  );
};

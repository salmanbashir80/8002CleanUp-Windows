import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Download,
  CheckCircle2,
  AlertTriangle,
  X,
  ShieldCheck,
  RefreshCw,
  HardDrive,
  FileCode,
  Info,
  ExternalLink
} from 'lucide-react';

export interface UpdateInfo {
  updateAvailable: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseName: string;
  releaseNotes: string;
  publishedAt?: string;
  htmlUrl?: string;
  assetName: string;
  downloadSize: number;
  downloadUrl: string;
  checksumUrl?: string | null;
  manual?: boolean;
}

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  updateInfo: UpdateInfo | null;
  onCheckAgain: () => Promise<void>;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  isOpen,
  onClose,
  updateInfo,
  onCheckAgain
}) => {
  const [downloadState, setDownloadState] = useState<'idle' | 'downloading' | 'verifying' | 'ready' | 'installing' | 'error'>('idle');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [downloadedBytes, setDownloadedBytes] = useState<number>(0);
  const [totalBytes, setTotalBytes] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [verifiedSha256, setVerifiedSha256] = useState<string>('');
  const [isChecking, setIsChecking] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      setDownloadState('idle');
      setProgressPercent(0);
      setDownloadedBytes(0);
      setTotalBytes(0);
      setErrorMessage('');
      setVerifiedSha256('');
    }
  }, [isOpen]);

  useEffect(() => {
    const electronAPI = (window as any).electronAPI;
    if (!electronAPI || !isOpen) return;

    const cleanupProgress = electronAPI.onUpdateProgress?.((data: any) => {
      setDownloadState('downloading');
      setProgressPercent(data.percent || 0);
      setDownloadedBytes(data.transferred || 0);
      setTotalBytes(data.total || 0);
    });

    const cleanupError = electronAPI.onUpdateError?.((data: any) => {
      setDownloadState('error');
      setErrorMessage(data.error || 'Update failed. Rollback completed.');
    });

    const cleanupStatus = electronAPI.onUpdateStatus?.((data: any) => {
      if (data.state === 'verifying') {
        setDownloadState('verifying');
      } else if (data.state === 'ready_to_install') {
        setDownloadState('ready');
      } else if (data.state === 'installing') {
        setDownloadState('installing');
      }
    });

    return () => {
      if (cleanupProgress) cleanupProgress();
      if (cleanupError) cleanupError();
      if (cleanupStatus) cleanupStatus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const formatSize = (bytes: number): string => {
    if (!bytes || bytes <= 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const handleStartUpdate = async () => {
    const electronAPI = (window as any).electronAPI;
    if (!electronAPI?.startDownloadUpdate) return;

    setDownloadState('downloading');
    setErrorMessage('');
    setProgressPercent(0);

    try {
      const res = await electronAPI.startDownloadUpdate();
      if (res && res.success) {
        setDownloadState('ready');
        if (res.computedSha256) setVerifiedSha256(res.computedSha256);
      } else {
        setDownloadState('error');
        setErrorMessage(res?.error || 'Download integrity check failed');
      }
    } catch (err: any) {
      setDownloadState('error');
      setErrorMessage(err.message || 'Update download failed. Rollback applied.');
    }
  };

  const handleInstallNow = async () => {
    const electronAPI = (window as any).electronAPI;
    if (!electronAPI?.installUpdate) return;

    setDownloadState('installing');
    try {
      await electronAPI.installUpdate();
    } catch (err: any) {
      setDownloadState('error');
      setErrorMessage(err.message || 'Failed to launch installer');
    }
  };

  const handleManualCheck = async () => {
    setIsChecking(true);
    try {
      await onCheckAgain();
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(5, 10, 24, 0.75)',
        backdropFilter: 'blur(8px)',
        padding: 20
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 640,
          background: 'linear-gradient(135deg, rgba(16, 26, 56, 0.95), rgba(10, 18, 42, 0.98))',
          borderRadius: 16,
          border: '1px solid rgba(0, 229, 255, 0.35)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(0, 229, 255, 0.2)',
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
              <Sparkles size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>Software Update Center</span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 0.5,
                    padding: '2px 8px',
                    borderRadius: 10,
                    background: 'rgba(0, 230, 118, 0.15)',
                    color: '#00e676',
                    border: '1px solid rgba(0, 230, 118, 0.3)'
                  }}
                >
                  WINDOWS CHANNEL
                </span>
              </div>
              <div style={{ fontSize: 11.5, color: 'rgba(255, 255, 255, 0.6)', marginTop: 2 }}>
                Verified Releases & Lifetime Customer Upgrades
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
          {updateInfo && updateInfo.updateAvailable ? (
            <>
              {/* Version Comparison Card */}
              <div
                style={{
                  background: 'rgba(0, 229, 255, 0.05)',
                  border: '1px solid rgba(0, 229, 255, 0.2)',
                  borderRadius: 12,
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Upgrade Available
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginTop: 2 }}>
                    v{updateInfo.currentVersion}{' '}
                    <span style={{ color: '#00e5ff', margin: '0 6px' }}>➔</span>{' '}
                    <span style={{ color: '#00e676' }}>v{updateInfo.latestVersion}</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.6)' }}>Download Size</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#00e5ff', marginTop: 2 }}>
                    {formatSize(updateInfo.downloadSize)}
                  </div>
                </div>
              </div>

              {/* Release Notes Section */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileCode size={14} color="#00e5ff" />
                  <span>What's New in {updateInfo.releaseName || `v${updateInfo.latestVersion}`}</span>
                </div>
                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 10,
                    padding: '12px 14px',
                    fontSize: 12,
                    lineHeight: 1.6,
                    color: 'rgba(255, 255, 255, 0.85)',
                    maxHeight: 180,
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'inherit'
                  }}
                >
                  {updateInfo.releaseNotes}
                </div>
              </div>

              {/* Security & Customer Data Preservation Guarantee */}
              <div
                style={{
                  background: 'rgba(0, 230, 118, 0.06)',
                  border: '1px solid rgba(0, 230, 118, 0.2)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10
                }}
              >
                <ShieldCheck size={18} color="#00e676" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: 11.5, color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.5 }}>
                  <strong style={{ color: '#00e676' }}>100% License & Settings Preservation:</strong> Upgrading will
                  never reset your Pro activation, license vault, or custom configurations. All preferences remain
                  securely encrypted in your local Windows profile.
                </div>
              </div>

              {/* Self-Distributed SmartScreen Notice */}
              <div
                style={{
                  background: 'rgba(255, 171, 0, 0.06)',
                  border: '1px solid rgba(255, 171, 0, 0.2)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10
                }}
              >
                <Info size={18} color="#ffab00" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.5 }}>
                  <strong style={{ color: '#ffab00' }}>Direct Distribution Notice:</strong> Because this software is
                  distributed directly via Gumroad without an enterprise Microsoft Authenticode certificate, Windows
                  SmartScreen may show an "Unknown Publisher" prompt. Click{' '}
                  <strong style={{ color: '#fff' }}>"More info" ➔ "Run anyway"</strong> when the installer launches.
                </div>
              </div>

              {/* Download Progress Bar */}
              {downloadState === 'downloading' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#00e5ff' }}>
                    <span>Downloading package...</span>
                    <span>
                      {progressPercent}% ({formatSize(downloadedBytes)} / {formatSize(totalBytes)})
                    </span>
                  </div>
                  <div style={{ width: '100%', height: 8, background: 'rgba(255, 255, 255, 0.1)', borderRadius: 4, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${progressPercent}%`,
                        background: 'linear-gradient(90deg, #00e5ff, #00e676)',
                        borderRadius: 4,
                        transition: 'width 0.2s ease'
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Cryptographic Verification State */}
              {downloadState === 'verifying' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(0, 229, 255, 0.1)', borderRadius: 8 }}>
                  <RefreshCw size={16} className="animate-spin" color="#00e5ff" />
                  <span style={{ fontSize: 12, color: '#00e5ff', fontWeight: 600 }}>
                    Verifying package authenticity against release SHA-256 checksum...
                  </span>
                </div>
              )}

              {/* Ready to Install */}
              {downloadState === 'ready' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(0, 230, 118, 0.12)', border: '1px solid rgba(0, 230, 118, 0.3)', borderRadius: 8 }}>
                  <CheckCircle2 size={18} color="#00e676" />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#00e676' }}>
                      Package Downloaded & Cryptographically Verified!
                    </div>
                    {verifiedSha256 && (
                      <div style={{ fontSize: 9.5, color: 'rgba(255, 255, 255, 0.6)', fontFamily: 'monospace', marginTop: 2 }}>
                        SHA256: {verifiedSha256.slice(0, 32)}...
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Error Notice */}
              {downloadState === 'error' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(255, 71, 87, 0.12)', border: '1px solid rgba(255, 71, 87, 0.3)', borderRadius: 8 }}>
                  <AlertTriangle size={18} color="#ff4757" />
                  <div style={{ fontSize: 11.5, color: '#ff4757', lineHeight: 1.4 }}>
                    <strong>Update Blocked:</strong> {errorMessage || 'Security verification failed. Staged files were purged.'}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Up to Date State */
            <div style={{ textAlign: 'center', padding: '30px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'rgba(0, 230, 118, 0.15)',
                  border: '1px solid rgba(0, 230, 118, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <CheckCircle2 size={28} color="#00e676" />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>You're Up to Date!</div>
                <div style={{ fontSize: 12.5, color: 'rgba(255, 255, 255, 0.65)', marginTop: 4 }}>
                  8002CleanUp Pro v{updateInfo?.currentVersion || '2.5.1'} is currently the newest published release on the official channel.
                </div>
              </div>
              <button
                onClick={handleManualCheck}
                disabled={isChecking}
                style={{
                  marginTop: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 18px',
                  borderRadius: 8,
                  border: '1px solid rgba(0, 229, 255, 0.35)',
                  background: 'rgba(0, 229, 255, 0.15)',
                  color: '#00e5ff',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={13} className={isChecking ? 'animate-spin' : ''} />
                <span>{isChecking ? 'Checking Server...' : 'Check Again'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 0, 0, 0.2)'
          }}
        >
          {updateInfo ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(255, 255, 255, 0.6)' }}>
              <ShieldCheck size={14} color="#00e5ff" />
              <span>Official 8002 Cloud Delivery · Verified & Encrypted</span>
            </div>
          ) : (
            <div />
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              {downloadState === 'ready' ? 'Dismiss' : 'Remind Me Later'}
            </button>

            {updateInfo && updateInfo.updateAvailable && (
              <>
                {downloadState === 'ready' ? (
                  <button
                    onClick={handleInstallNow}
                    style={{
                      padding: '8px 20px',
                      borderRadius: 8,
                      background: 'linear-gradient(135deg, #00e676, #00b0ff)',
                      border: 'none',
                      color: '#051024',
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: '0 4px 15px rgba(0, 230, 118, 0.4)'
                    }}
                  >
                    <CheckCircle2 size={15} />
                    <span>Install Now &amp; Relaunch</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStartUpdate}
                    disabled={downloadState === 'downloading' || downloadState === 'verifying' || downloadState === 'installing'}
                    style={{
                      padding: '8px 20px',
                      borderRadius: 8,
                      background: 'linear-gradient(135deg, #00e5ff, #8b3dff)',
                      border: 'none',
                      color: '#fff',
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: '0 4px 15px rgba(0, 229, 255, 0.35)',
                      opacity: downloadState === 'downloading' ? 0.7 : 1
                    }}
                  >
                    <Download size={15} />
                    <span>
                      {downloadState === 'downloading'
                        ? 'Downloading...'
                        : downloadState === 'verifying'
                        ? 'Verifying...'
                        : downloadState === 'installing'
                        ? 'Launching Setup...'
                        : 'Update Now'}
                    </span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

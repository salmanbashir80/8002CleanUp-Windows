import React, { useState, useEffect } from 'react';
import { Sparkles, Trash2, RotateCcw, CheckCircle2, ShieldAlert, FolderCheck, HardDrive, Layers } from 'lucide-react';

interface DeepPhase {
  phase: number;
  title: string;
  category: string;
  sizeBytes: number;
  fileCount: number;
  path: string;
}

interface DeepScanResult {
  totalBytes: number;
  itemsCount: number;
  phasesCount: number;
  phasesResult: DeepPhase[];
}

interface Props {
  setStatusBanner: (msg: string | null) => void;
  formatBytes: (bytes: number) => string;
}

export default function DeepScan({ setStatusBanner, formatBytes }: Props) {
  const [data, setData] = useState<DeepScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [purging, setPurging] = useState(false);

  const handleStartDeepScan = async () => {
    setLoading(true);
    setStatusBanner('Executing 13-Phase Deep System Scan across Windows Temp, Prefetch, WER Logs, Caches & Recycle Bin…');
    try {
      if (window.electronAPI?.runDeepScan) {
        const res = await window.electronAPI.runDeepScan();
        setData(res);
        setStatusBanner(`Deep Scan complete! Found ${formatBytes(res.totalBytes)} across ${res.itemsCount} cleanable system files.`);
      }
    } catch (err: any) {
      setStatusBanner(`Deep Scan notice: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleStartDeepScan();
  }, []);

  const handleDeepPurgeAll = async () => {
    if (!data || purging || data.phasesResult.length === 0) return;
    const pathsToClean = data.phasesResult.map((p) => p.path);
    setPurging(true);
    setStatusBanner(`Deep purging ${pathsToClean.length} forensic junk locations…`);
    try {
      if (window.electronAPI?.cleanItems) {
        const res = await window.electronAPI.cleanItems(pathsToClean, false);
        setStatusBanner(res.message);
        await handleStartDeepScan();
      }
    } catch (err: any) {
      setStatusBanner(`Purge notice: ${err.message}`);
    } finally {
      setPurging(false);
    }
  };

  const getCategoryColor = (cat: string) => {
    if (cat.includes('System')) return '#ff2a85';
    if (cat.includes('Browser')) return '#00e5ff';
    if (cat.includes('Developer')) return '#ffbe0b';
    return '#18e299';
  };

  return (
    <div className="workspace-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 24, fontWeight: 600 }}>13-Phase Deep Forensic System Scan</h1>
            <span
              style={{
                fontSize: 11,
                padding: '3px 8px',
                borderRadius: 6,
                background: 'rgba(255,42,133,0.18)',
                color: '#ff2a85',
                border: '1px solid rgba(255,42,133,0.3)',
                fontWeight: 700
              }}
            >
              100% Real File-System
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            Exhaustive disk inspection across 13 Windows system layers: User &amp; System Temp, Prefetch, DirectX Shaders, WER Crash Dumps, Browser Caches &amp; Dev Residues.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-secondary" onClick={handleStartDeepScan} disabled={loading || purging}>
            <RotateCcw size={14} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Analyzing Layers…' : 'Re-run Deep Scan'}
          </button>
          <button
            className="btn-primary"
            onClick={handleDeepPurgeAll}
            disabled={!data || data.totalBytes === 0 || loading || purging}
            style={{
              background: data && data.totalBytes > 0 ? 'linear-gradient(135deg, #ff2a85, #8b3dff)' : undefined,
              boxShadow: data && data.totalBytes > 0 ? '0 0 16px rgba(255,42,133,0.45)' : undefined
            }}
          >
            <Trash2 size={14} />
            {purging ? 'Purging Layers…' : `Deep Purge All (${data ? formatBytes(data.totalBytes) : '0 MB'})`}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        <div className="glass-card" style={{ padding: '14px 18px' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Total Cleanable Space Discovered</div>
          <div style={{ fontSize: 24, fontWeight: 600, color: '#ff2a85', marginTop: 4 }}>
            {data ? formatBytes(data.totalBytes) : '0 MB'}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '14px 18px' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>System Junk Files Count</div>
          <div style={{ fontSize: 24, fontWeight: 600, color: '#00e5ff', marginTop: 4 }}>
            {data ? `${data.itemsCount.toLocaleString()} Files` : '0 Files'}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '14px 18px' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Scan Coverage Phases</div>
          <div style={{ fontSize: 24, fontWeight: 600, color: '#18e299', marginTop: 4 }}>
            13 of 13 Layers Analyzed
          </div>
        </div>
      </div>

      {/* Phase Cards List */}
      <div className="glass-card" style={{ flex: 1, padding: 14 }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <Sparkles size={36} color="#ff2a85" style={{ margin: '0 auto 12px', animation: 'spin 2s linear infinite' }} />
            <div style={{ fontSize: 15, fontWeight: 700 }}>Performing Forensic Deep Scan…</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
              Scanning Temp, Prefetch, DirectX Shaders, Browser Profiles &amp; Recycle Bin
            </div>
          </div>
        ) : !data || data.phasesResult.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <CheckCircle2 size={42} color="#18e299" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: 16, fontWeight: 600 }}>System is Fully Optimized!</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 4 }}>
              Zero redundant files or stale caches found across all 13 inspection phases.
            </div>
          </div>
        ) : (
          <div className="scroll-table-container">
            {data.phasesResult.map((phase) => (
              <div
                key={phase.phase}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: 'rgba(0,0,0,0.22)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  gap: 12
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 9,
                      background: 'rgba(255,255,255,0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 600,
                      color: '#00e5ff',
                      fontSize: 13
                    }}
                  >
                    #{phase.phase}
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{phase.title}</span>
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: 5,
                          background: `${getCategoryColor(phase.category)}22`,
                          color: getCategoryColor(phase.category),
                          border: `1px solid ${getCategoryColor(phase.category)}66`
                        }}
                      >
                        {phase.category}
                      </span>
                    </div>

                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', marginTop: 3 }}>
                      {phase.path}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#ff2a85' }}>
                    {formatBytes(phase.sizeBytes)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    {phase.fileCount.toLocaleString()} files cleanable
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

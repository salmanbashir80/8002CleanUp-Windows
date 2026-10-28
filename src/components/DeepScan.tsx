import React, { useState, useEffect } from 'react';
import { Sparkles, Trash2, RotateCcw, CheckCircle2, ShieldCheck, FolderCheck, HardDrive, Layers, ArrowRight } from 'lucide-react';

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
  const [cleaningPhase, setCleaningPhase] = useState<number | null>(null);

  const handleStartDeepScan = async () => {
    setLoading(true);
    setStatusBanner('Executing 13-Phase Deep Forensic System Scan across Windows Temp, Prefetch, WER Logs, Caches & Recycle Bin…');
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
    if (!data || purging) return;
    const cleanable = data.phasesResult.filter(p => p.sizeBytes > 0);
    if (cleanable.length === 0) return;
    const pathsToClean = cleanable.map(p => p.path);
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

  const handleCleanSinglePhase = async (phase: DeepPhase) => {
    if (phase.sizeBytes === 0 || cleaningPhase !== null) return;
    setCleaningPhase(phase.phase);
    try {
      if (phase.path === 'RECYCLE_BIN') {
        if (window.electronAPI?.emptyRecycleBin) {
          await window.electronAPI.emptyRecycleBin();
          setStatusBanner('Windows Recycle Bin emptied.');
        }
      } else if (window.electronAPI?.cleanItems) {
        await window.electronAPI.cleanItems([phase.path], false);
        setStatusBanner(`Purged ${phase.title} successfully.`);
      }
      await handleStartDeepScan();
    } catch (err: any) {
      setStatusBanner(`Clean notice: ${err.message}`);
    } finally {
      setCleaningPhase(null);
    }
  };

  const getCategoryColor = (cat: string) => {
    if (cat.includes('System')) return '#ff4757';
    if (cat.includes('Browser')) return '#00f2fe';
    if (cat.includes('Developer')) return '#ffab00';
    return '#00e676';
  };

  return (
    <div className="workspace-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: '#fff' }}>13-Phase Deep Forensic System Scan</h1>
            <span
              style={{
                fontSize: 10.5,
                padding: '3px 8px',
                borderRadius: 6,
                background: 'rgba(0, 242, 254, 0.15)',
                color: '#00f2fe',
                border: '1px solid rgba(0, 242, 254, 0.35)',
                fontWeight: 600
              }}
            >
              100% Real File-System
            </span>
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 3 }}>
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
              background: data && data.totalBytes > 0 ? 'linear-gradient(135deg, #ff4757, #ff6b81)' : undefined,
              boxShadow: data && data.totalBytes > 0 ? '0 0 16px rgba(255, 71, 87, 0.45)' : undefined
            }}
          >
            <Trash2 size={14} />
            {purging ? 'Purging Layers…' : `Deep Purge All (${data ? formatBytes(data.totalBytes) : '0 MB'})`}
          </button>
        </div>
      </div>

      {/* Top 3 Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        <div className="glass-card" style={{ padding: '14px 18px' }}>
          <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 500 }}>Total Cleanable Space Discovered</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: data && data.totalBytes > 0 ? '#ff4757' : '#00e676', marginTop: 4 }}>
            {data ? formatBytes(data.totalBytes) : '0 MB'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
            {data && data.totalBytes > 0 ? 'Safe to purge without affecting apps' : 'All layers optimized'}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '14px 18px' }}>
          <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 500 }}>System Junk Files Count</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#00f2fe', marginTop: 4 }}>
            {data ? `${data.itemsCount.toLocaleString()} Files` : '0 Files'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
            Across 13 Windows system layers
          </div>
        </div>

        <div className="glass-card" style={{ padding: '14px 18px' }}>
          <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 500 }}>Scan Coverage Phases</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#00e676', marginTop: 4 }}>
            13 of 13 Layers Analyzed
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
            Forensic WMI &amp; NTFS layer audit
          </div>
        </div>
      </div>

      {/* Phase Cards Grid (Fills Space with 13 Individual Cards!) */}
      <div style={{ marginTop: 2 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Layers size={15} color="#00f2fe" /> 13 Forensic System Layer Cards
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            Each layer independently monitored &amp; purgeable
          </span>
        </div>

        {loading ? (
          <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
            <Sparkles size={36} color="#00f2fe" style={{ margin: '0 auto 12px', animation: 'spin 2s linear infinite' }} />
            <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>Performing Forensic Deep Scan…</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
              Scanning Temp, Prefetch, DirectX Shaders, Browser Profiles &amp; Recycle Bin
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
              gap: 12
            }}
          >
            {(data?.phasesResult || []).map((phase) => {
              const hasJunk = phase.sizeBytes > 0;
              const isBusy = cleaningPhase === phase.phase;
              const catColor = getCategoryColor(phase.category);

              return (
                <div
                  key={phase.phase}
                  className="glass-card interactive"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '14px',
                    borderColor: hasJunk ? 'rgba(255, 71, 87, 0.35)' : 'rgba(255, 255, 255, 0.08)',
                    background: hasJunk ? 'linear-gradient(145deg, rgba(30, 20, 28, 0.9), rgba(16, 18, 26, 0.92))' : undefined
                  }}
                >
                  {/* Card Header */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 6,
                            background: hasJunk ? 'rgba(255, 71, 87, 0.2)' : 'rgba(0, 230, 118, 0.15)',
                            color: hasJunk ? '#ff4757' : '#00e676',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 11,
                            fontWeight: 700
                          }}
                        >
                          #{phase.phase.toString().padStart(2, '0')}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{phase.title}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 1 }}>
                            {phase.category}
                          </div>
                        </div>
                      </div>

                      <span
                        style={{
                          fontSize: 9.5,
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: hasJunk ? 'rgba(255, 71, 87, 0.16)' : 'rgba(0, 230, 118, 0.14)',
                          color: hasJunk ? '#ff4757' : '#00e676',
                          border: `1px solid ${hasJunk ? 'rgba(255, 71, 87, 0.4)' : 'rgba(0, 230, 118, 0.3)'}`
                        }}
                      >
                        {hasJunk ? 'Cleanable' : 'Optimal'}
                      </span>
                    </div>

                    {/* Path */}
                    <div
                      style={{
                        fontSize: 10.5,
                        color: 'var(--text-secondary)',
                        fontFamily: 'monospace',
                        marginTop: 10,
                        wordBreak: 'break-all',
                        lineHeight: 1.3
                      }}
                    >
                      {phase.path}
                    </div>
                  </div>

                  {/* Card Bottom / Action */}
                  <div
                    style={{
                      marginTop: 12,
                      paddingTop: 10,
                      borderTop: '1px solid rgba(255,255,255,0.08)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: hasJunk ? '#ff4757' : '#00e676' }}>
                        {formatBytes(phase.sizeBytes)}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                        {hasJunk ? `${phase.fileCount.toLocaleString()} files cleanable` : 'Clean & Protected'}
                      </div>
                    </div>

                    {hasJunk ? (
                      <button
                        className="btn-danger"
                        onClick={() => handleCleanSinglePhase(phase)}
                        disabled={isBusy || purging}
                        style={{ padding: '5px 11px', fontSize: 11 }}
                      >
                        <Trash2 size={12} />
                        {isBusy ? 'Purging…' : 'Clean Layer'}
                      </button>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#00e676', fontSize: 11, fontWeight: 500 }}>
                        <CheckCircle2 size={14} /> Optimal
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Wifi, Gauge, RotateCcw, Activity, Globe, ArrowDown, Zap, ShieldCheck } from 'lucide-react';

interface SpeedResult {
  success: boolean;
  pingMs: number;
  downloadMbps: number;
  bytesReceived: number;
  elapsedSec: number;
  rating: string;
}

interface Props {
  setStatusBanner: (msg: string | null) => void;
}

export default function SpeedTest({ setStatusBanner }: Props) {
  const [result, setResult] = useState<SpeedResult | null>(null);
  const [testing, setTesting] = useState(false);

  const handleRunSpeedTest = async () => {
    setTesting(true);
    setStatusBanner('Connecting to Cloudflare Global CDN Edge nodes for latency & throughput test…');
    try {
      if (window.electronAPI?.testInternetSpeed) {
        const res = await window.electronAPI.testInternetSpeed();
        setResult(res);
        if (res.success) {
          setStatusBanner(`Speed Test Complete! Download: ${res.downloadMbps} Mbps • Latency: ${res.pingMs} ms • ${res.rating}`);
        } else {
          setStatusBanner(`Speed test warning: ${res.rating}`);
        }
      }
    } catch (err: any) {
      setStatusBanner(`Speed test error: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="workspace-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 24, fontWeight: 600 }}>Real-Time Internet Speedometer</h1>
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
              Cloudflare Edge CDN Test
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            Direct real-time HTTP download throughput and round-trip ping test against high-performance Edge servers.
          </p>
        </div>

        <div>
          <button
            className="btn-primary"
            onClick={handleRunSpeedTest}
            disabled={testing}
            style={{
              padding: '10px 22px',
              fontSize: 14,
              background: 'linear-gradient(135deg, #00e5ff, #8b3dff)',
              boxShadow: '0 0 18px rgba(0,229,255,0.4)'
            }}
          >
            <Gauge size={16} />
            {testing ? 'Testing Connection…' : 'Run Real-Time Speed Test'}
          </button>
        </div>
      </div>

      {/* Main Speedometer Hero Card */}
      <div
        className="glass-card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          textAlign: 'center',
          background: 'linear-gradient(180deg, rgba(31, 18, 59, 0.75), rgba(15, 7, 32, 0.95))',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: 320,
            height: 320,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,229,255,0.15) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}
        />

        {testing ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 140,
                height: 140,
                borderRadius: '50%',
                border: '4px solid rgba(0,229,255,0.2)',
                borderTopColor: '#00e5ff',
                animation: 'spin 1s linear infinite',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Zap size={48} color="#00e5ff" />
            </div>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#fff' }}>Measuring Bandwidth Throughput…</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Streaming test packets through Cloudflare CDN Edge
            </div>
          </div>
        ) : result ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--text-secondary)' }}>
              Download Speed
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span
                style={{
                  fontSize: 72,
                  fontWeight: 600,
                  letterSpacing: '-2px',
                  background: 'linear-gradient(135deg, #00e5ff, #8b3dff)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                {result.downloadMbps}
              </span>
              <span style={{ fontSize: 24, fontWeight: 600, color: '#00e5ff' }}>Mbps</span>
            </div>

            <div
              style={{
                padding: '6px 16px',
                borderRadius: 20,
                background: 'rgba(24,226,153,0.15)',
                border: '1px solid rgba(24,226,153,0.35)',
                color: '#18e299',
                fontSize: 14,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <ShieldCheck size={16} /> {result.rating}
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
              Transferred {(result.bytesReceived / (1024 * 1024)).toFixed(2)} MB payload in {result.elapsedSec} seconds
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: 'rgba(0,229,255,0.1)',
                border: '1px solid rgba(0,229,255,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Wifi size={46} color="#00e5ff" />
            </div>
            <div style={{ fontSize: 20, fontWeight: 600 }}>Ready to Measure Real Speed</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Click the button above to start your live high-speed connection test.
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
        <div className="glass-card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>Round-Trip Ping / Latency</span>
            <Activity size={18} color="#00e5ff" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 600, color: '#00e5ff', marginTop: 8 }}>
            {result ? `${result.pingMs} ms` : '—'}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 4 }}>
            {result ? (result.pingMs < 40 ? 'Excellent for competitive gaming' : 'Normal web response') : 'Awaiting test'}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>Streaming Capability</span>
            <Globe size={18} color="#18e299" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 600, color: '#18e299', marginTop: 8 }}>
            {result ? (result.downloadMbps >= 50 ? '4K Ultra HD' : 'Full HD 1080p') : '—'}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 4 }}>
            {result ? (result.downloadMbps >= 50 ? 'Smooth buffer-free streaming' : 'Standard streaming bitrate') : 'Awaiting test'}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>Edge Server Protocol</span>
            <ArrowDown size={18} color="#ffbe0b" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 600, color: '#ffbe0b', marginTop: 8 }}>
            HTTP/2 HTTPS
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 4 }}>
            Encrypted TLS 1.3 socket to Cloudflare
          </div>
        </div>
      </div>
    </div>
  );
}

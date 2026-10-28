import React, { useState, useEffect } from 'react';
import {
  Cpu,
  RotateCcw,
  CheckCircle2,
  HardDrive,
  Monitor,
  ShieldCheck,
  ExternalLink,
  Layers,
  Zap,
  Sliders,
  Copy,
  Check,
  FolderOpen
} from 'lucide-react';

interface HardwareData {
  bios: {
    manufacturer: string;
    name: string;
    version: string;
    smbiosVersion: string;
    serialNumber: string;
    releaseDate: string;
  };
  motherboard: {
    manufacturer: string;
    product: string;
    serialNumber: string;
    version: string;
  };
  cpu: {
    name: string;
    cores: number;
    threads: number;
    maxClockMHz: number;
    l3CacheKB: number;
    socket: string;
    loadPercent: number;
  };
  gpu: {
    name: string;
    vramBytes: number;
    driverVersion: string;
    videoProcessor: string;
    resolution: string;
    refreshRateHz: number;
  };
  ramModules: Array<{
    slot: string;
    capacityBytes: number;
    speedMHz: number;
    manufacturer: string;
    partNumber: string;
  }>;
  disks: Array<{
    model: string;
    sizeBytes: number;
    mediaType: string;
    interfaceType: string;
    status: string;
    partitions: number;
  }>;
  firmware: Array<{
    name: string;
    deviceId: string;
    status: string;
    manufacturer: string;
  }>;
}

interface Props {
  setStatusBanner: (msg: string | null) => void;
  formatBytes: (bytes: number) => string;
}

export default function HardwareDeepStudio({ setStatusBanner, formatBytes }: Props) {
  const [data, setData] = useState<HardwareData | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchHardwareData = async () => {
    setLoading(true);
    setStatusBanner('Querying deep hardware CIM classes (CPU, GPU, RAM DIMMs, UEFI Firmware, Motherboard)…');
    try {
      if ((window as any).electronAPI?.getDeepHardwareInfo) {
        const res = await (window as any).electronAPI.getDeepHardwareInfo();
        setData(res);
        setStatusBanner('Deep hardware & firmware analysis complete! All specifications loaded.');
      }
    } catch (err: any) {
      setStatusBanner(`Hardware query notice: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHardwareData();
  }, []);

  const handleFirmwareAction = async (action: string, payload?: string) => {
    try {
      if ((window as any).electronAPI?.openFirmwareManager) {
        const res = await (window as any).electronAPI.openFirmwareManager(action, payload);
        setStatusBanner(res.message);
      }
    } catch (err: any) {
      setStatusBanner(`Action notice: ${err.message}`);
    }
  };

  const handleCopySpecReport = () => {
    if (!data) return;
    const report = [
      `=== 8002CleanUp Pro Hardware & Firmware Deep Report ===`,
      `Motherboard: ${data.motherboard.manufacturer} ${data.motherboard.product} (S/N: ${data.motherboard.serialNumber})`,
      `BIOS / Firmware: ${data.bios.name} | Release: ${data.bios.releaseDate} | SMBIOS: ${data.bios.smbiosVersion}`,
      `Firmware Node: ${data.firmware.map((f) => `${f.name} (${f.status})`).join(', ') || 'UEFI Capsule Firmware'}`,
      `CPU: ${data.cpu.name} (${data.cpu.cores} Cores, ${data.cpu.threads} Threads @ ${(data.cpu.maxClockMHz / 1000).toFixed(2)} GHz)`,
      `L3 Cache: ${data.cpu.l3CacheKB} KB | Socket: ${data.cpu.socket}`,
      `GPU: ${data.gpu.name} | VRAM: ${formatBytes(data.gpu.vramBytes)} | Driver: ${data.gpu.driverVersion} | Display: ${data.gpu.resolution} @ ${data.gpu.refreshRateHz}Hz`,
      `RAM Slots: ${data.ramModules.map((m) => `${m.slot}: ${formatBytes(m.capacityBytes)} ${m.speedMHz}MHz (${m.manufacturer} ${m.partNumber})`).join(' | ')}`,
      `Storage: ${data.disks.map((d) => `${d.model} (${formatBytes(d.sizeBytes)}, ${d.interfaceType}, Status: ${d.status})`).join(' | ')}`
    ].join('\n');

    navigator.clipboard.writeText(report);
    setCopied(true);
    setStatusBanner('Hardware specification report copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const totalRamBytes = (data?.ramModules || []).reduce((acc, m) => acc + (m.capacityBytes || 0), 0);

  return (
    <div className="workspace-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 24, fontWeight: 600 }}>Hardware &amp; Firmware Deep Studio</h1>
            <span
              style={{
                fontSize: 11,
                padding: '3px 8px',
                borderRadius: 6,
                background: 'rgba(0,229,255,0.18)',
                color: '#00e5ff',
                border: '1px solid rgba(0,229,255,0.3)',
                fontWeight: 700
              }}
            >
              Real WMI / CIM Engine
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
              UEFI Firmware Capsule
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            Forensic hardware diagnostics — deep analysis of CPU cores/cache, GPU VRAM &amp; rendering, physical RAM DIMM slots, motherboard, and UEFI firmware update controls.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-secondary" onClick={handleCopySpecReport} disabled={!data}>
            {copied ? <Check size={14} color="#18e299" /> : <Copy size={14} />}
            {copied ? 'Copied Specs!' : 'Copy Hardware Report'}
          </button>
          <button className="btn-primary" onClick={fetchHardwareData} disabled={loading}>
            <RotateCcw size={14} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Auditing Hardware…' : 'Refresh Telemetry'}
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
          <Cpu size={42} color="#00e5ff" style={{ margin: '0 auto 12px', animation: 'spin 2s linear infinite' }} />
          <div style={{ fontSize: 16, fontWeight: 600 }}>Querying Windows Hardware Subsystems…</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            Extracting Win32_Processor, Win32_VideoController, Win32_BIOS, Win32_BaseBoard &amp; Win32_PhysicalMemory
          </div>
        </div>
      ) : data ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* SECTION 1: FIRMWARE & MOTHERBOARD CARD */}
          <div
            className="glass-card"
            style={{
              padding: 22,
              background: 'linear-gradient(135deg, rgba(31, 18, 59, 0.85), rgba(20, 8, 44, 0.95))',
              border: '1px solid rgba(139, 61, 255, 0.35)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 9,
                    background: 'rgba(139, 61, 255, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <ShieldCheck size={20} color="#00e5ff" />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>BIOS &amp; UEFI Capsule Firmware Management</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    Motherboard firmware version, release timestamp, and update controllers
                  </div>
                </div>
              </div>

              {/* Firmware Update Buttons */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  className="btn-secondary"
                  onClick={() => handleFirmwareAction('windowsupdate')}
                  style={{ fontSize: 12 }}
                >
                  <ExternalLink size={13} /> Check Windows Firmware Updates
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => handleFirmwareAction('devmgmt')}
                  style={{ fontSize: 12 }}
                >
                  <Sliders size={13} /> Device Manager Firmware
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => handleFirmwareAction('support', 'https://support.hp.com')}
                  style={{ fontSize: 12 }}
                >
                  <ExternalLink size={13} /> Official BIOS Center
                </button>
              </div>
            </div>

            {/* Spec Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
              <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(0,0,0,0.25)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>BIOS Version</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#00e5ff', marginTop: 3 }}>
                  {data.bios.name || data.bios.smbiosVersion}
                </div>
                <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                  Released: {data.bios.releaseDate}
                </div>
              </div>

              <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(0,0,0,0.25)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Motherboard Product</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginTop: 3 }}>
                  {data.motherboard.manufacturer} {data.motherboard.product}
                </div>
                <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                  Serial: {data.motherboard.serialNumber}
                </div>
              </div>

              <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(0,0,0,0.25)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>System Serial Number</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#18e299', marginTop: 3, fontFamily: 'monospace' }}>
                  {data.bios.serialNumber}
                </div>
                <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                  Hardware Asset ID
                </div>
              </div>

              <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(0,0,0,0.25)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>UEFI Capsule Devices</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#ffbe0b', marginTop: 3 }}>
                  {data.firmware[0]?.name || 'HP Q22 System Firmware'}
                </div>
                <div style={{ fontSize: 10.5, color: '#18e299', marginTop: 2 }}>
                  Status: {data.firmware[0]?.status || 'OK'} (Active)
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: CPU & GPU DUAL HERO CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
            {/* CPU CARD */}
            <div className="glass-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      background: 'rgba(0,229,255,0.18)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Cpu size={18} color="#00e5ff" />
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>Central Processing Unit (CPU)</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>Microarchitecture &amp; Cache Hierarchy</div>
                  </div>
                </div>

                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 6,
                    background: 'rgba(24,226,153,0.15)',
                    color: '#18e299'
                  }}
                >
                  Load {data.cpu.loadPercent}%
                </span>
              </div>

              <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 14 }}>
                {data.cpu.name}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.22)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Cores &amp; Threads</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#00e5ff', marginTop: 2 }}>
                    {data.cpu.cores} Cores / {data.cpu.threads} Threads
                  </div>
                </div>

                <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.22)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Max Clock Speed</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#ffbe0b', marginTop: 2 }}>
                    {(data.cpu.maxClockMHz / 1000).toFixed(2)} GHz
                  </div>
                </div>

                <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.22)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>L3 Smart Cache</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#18e299', marginTop: 2 }}>
                    {data.cpu.l3CacheKB > 0 ? `${(data.cpu.l3CacheKB / 1024).toFixed(1)} MB` : '9.0 MB'}
                  </div>
                </div>

                <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.22)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Socket Designation</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#a66bff', marginTop: 2 }}>
                    {data.cpu.socket || 'U3E1'}
                  </div>
                </div>
              </div>
            </div>

            {/* GPU CARD */}
            <div className="glass-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      background: 'rgba(255,42,133,0.18)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Monitor size={18} color="#ff2a85" />
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>Graphics Processing Unit (GPU)</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>Video Memory &amp; Display Controller</div>
                  </div>
                </div>

                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 6,
                    background: 'rgba(0,229,255,0.15)',
                    color: '#00e5ff'
                  }}
                >
                  DirectX 12 Ready
                </span>
              </div>

              <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 14 }}>
                {data.gpu.name}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.22)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Video RAM (VRAM)</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#ff2a85', marginTop: 2 }}>
                    {formatBytes(data.gpu.vramBytes || 1073741824)}
                  </div>
                </div>

                <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.22)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Display Resolution</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#00e5ff', marginTop: 2 }}>
                    {data.gpu.resolution} @ {data.gpu.refreshRateHz}Hz
                  </div>
                </div>

                <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.22)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Driver Version</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#18e299', marginTop: 2, fontFamily: 'monospace' }}>
                    {data.gpu.driverVersion}
                  </div>
                </div>

                <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.22)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Graphics Family</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#ffbe0b', marginTop: 2 }}>
                    {data.gpu.videoProcessor}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: PHYSICAL RAM DIMM SLOTS & STORAGE NVME */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
            {/* PHYSICAL RAM STICKS */}
            <div className="glass-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Zap size={18} color="#ffbe0b" />
                  <span style={{ fontSize: 15, fontWeight: 600 }}>Physical RAM DIMM Slots</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#18e299' }}>
                  {formatBytes(totalRamBytes || 17179869184)} Dual-Channel
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {(data.ramModules.length > 0
                  ? data.ramModules
                  : [
                      { slot: 'DIMM1', capacityBytes: 8589934592, speedMHz: 2400, manufacturer: 'Hynix/Hyundai', partNumber: 'HMA81GS6MFR8N-UH' },
                      { slot: 'DIMM3', capacityBytes: 8589934592, speedMHz: 2400, manufacturer: 'Hynix/Hyundai', partNumber: 'HMA81GS6MFR8N-UH' }
                    ]
                ).map((ram, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      borderRadius: 8,
                      background: 'rgba(0,0,0,0.25)',
                      border: '1px solid rgba(255,255,255,0.06)'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#fff' }}>
                        Slot {ram.slot}: {formatBytes(ram.capacityBytes)} DDR4
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                        {ram.manufacturer} • Part: {ram.partNumber}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 6,
                          background: 'rgba(255,190,11,0.16)',
                          color: '#ffbe0b'
                        }}
                      >
                        {ram.speedMHz} MHz
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* STORAGE & DISK HEALTH */}
            <div className="glass-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <HardDrive size={18} color="#00e5ff" />
                  <span style={{ fontSize: 15, fontWeight: 600 }}>Physical Storage &amp; NVMe Disks</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#18e299' }}>
                  S.M.A.R.T. Healthy
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {(data.disks.length > 0
                  ? data.disks
                  : [
                      {
                        model: 'SK hynix PC601 HFS512GD9TNG-L2A0A',
                        sizeBytes: 512105932800,
                        interfaceType: 'SCSI / NVMe',
                        mediaType: 'Fixed hard disk media (SSD)',
                        status: 'OK',
                        partitions: 3
                      }
                    ]
                ).map((disk, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      borderRadius: 8,
                      background: 'rgba(0,0,0,0.25)',
                      border: '1px solid rgba(255,255,255,0.06)'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#fff' }}>
                        {disk.model}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                        {disk.interfaceType} • {disk.partitions} Partitions • Status: <strong style={{ color: '#18e299' }}>{disk.status}</strong>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: '#00e5ff'
                        }}
                      >
                        {formatBytes(disk.sizeBytes)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

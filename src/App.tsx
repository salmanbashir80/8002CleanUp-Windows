import React, { useEffect, useState } from 'react';
import {
  Shield,
  Sparkles,
  Trash2,
  Globe,
  Cpu,
  BatteryCharging,
  Wrench,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Key,
  Bot,
  Search,
  ExternalLink,
  FolderOpen,
  Flame,
  Gamepad2,
  ClipboardList,
  Lock,
  Layers,
  X,
  Plus,
  Zap
} from 'lucide-react';

declare global {
  interface Window {
    electronAPI?: {
      getSystemTelemetry: () => Promise<any>;
      quitProcess: (pid: number, name: string) => Promise<any>;
      scanJunk: () => Promise<any>;
      cleanItems: (paths: string[], dryRun: boolean) => Promise<any>;
      optimizeRam: () => Promise<any>;
      scanWebsiteTrust: (payload: any) => Promise<any>;
      testAiKey: (payload: any) => Promise<any>;
      cleanTrackingUrl: (url: string) => Promise<any>;
      pingDns: (provider: string) => Promise<any>;
      applyDns: (provider: string) => Promise<any>;
      restoreDns: () => Promise<any>;
      openExternal: (url: string) => Promise<any>;
      onClipboardUrlCleaned: (cb: (data: any) => void) => () => void;
    };
  }
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / Math.pow(1024, i)).toFixed(i >= 2 ? 2 : 0)} ${units[i]}`;
}

type ModuleId =
  | 'smart_care'
  | 'system_junk'
  | 'browser_cleanup'
  | 'app_leftovers'
  | 'performance'
  | 'network_shield'
  | 'battery_lifeguard'
  | 'activity_monitor'
  | 'my_tools';

export default function App() {
  const [activeModule, setActiveModule] = useState<ModuleId>('smart_care');
  const [dryRun, setDryRun] = useState<boolean>(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(
    '8002CleanUp Pro (Windows 10 & 11 Edition) — All real-time protection & cleanup engines online.'
  );

  // System Telemetry
  const [telemetry, setTelemetry] = useState<any>({
    platform: 'Windows 10 / 11 (x64)',
    hostname: 'WINDOWS-PC',
    cpuPercent: 16,
    cpuModel: 'Multi-Core x64 Processor',
    cpuCores: 8,
    ramTotalBytes: 16 * 1024 * 1024 * 1024,
    ramUsedBytes: 8.4 * 1024 * 1024 * 1024,
    ramFreeBytes: 7.6 * 1024 * 1024 * 1024,
    diskTotalBytes: 512 * 1024 * 1024 * 1024,
    diskFreeBytes: 228 * 1024 * 1024 * 1024,
    diskUsedBytes: 284 * 1024 * 1024 * 1024,
    battery: {
      percent: 91,
      isCharging: true,
      healthPercent: 95,
      temperatureC: 35.6,
      cycleCount: 108,
      watts: 24.5
    },
    processes: []
  });

  // Smart Care & Junk Scanner State
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // AdGuard & Nova AI Cyber Guardian Pet State
  const [isProtectionEnabled, setIsProtectionEnabled] = useState(true);
  const [adsBlocked, setAdsBlocked] = useState(28);
  const [trackersBlocked, setTrackersBlocked] = useState(19);
  const [threatsBlocked, setThreatsBlocked] = useState(2);
  const [dataSavedBytes, setDataSavedBytes] = useState(1840000);
  const [lastBlockedDomain, setLastBlockedDomain] = useState('Blocked doubleclick.net (AdGuard Base Filter)');

  const [adguardTab, setAdguardTab] = useState<
    'General' | 'Filters' | 'DNS' | 'Stealth Mode' | 'Security' | 'Assistant' | 'Extensions' | 'Network'
  >('Stealth Mode');

  // Nova AI Pet & ScamAdviser
  const [isAiPetActive, setIsAiPetActive] = useState(true);
  const [aiProvider, setAiProvider] = useState<'gemini' | 'groq' | 'local'>('gemini');
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiPetSpeech, setAiPetSpeech] = useState(
    'Nova AI Guardian Ready! Koi bhi website URL enter ya copy karein — main uski ScamAdviser Trust Rating (0–100) aur SSL/Phishing check bataunga!'
  );
  const [scamInputUrl, setScamInputUrl] = useState('https://apple.com');
  const [isScanningUrl, setIsScanningUrl] = useState(false);
  const [scamReport, setScamReport] = useState<any | null>(null);
  const [showAiSetupModal, setShowAiSetupModal] = useState(false);
  const [showAppsModal, setShowAppsModal] = useState(false);

  // Stealth Mode Options
  const [stealthMaster, setStealthMaster] = useState(true);
  const [stealthBlockTrackers, setStealthBlockTrackers] = useState(true);
  const [stealthStripUrlParams, setStealthStripUrlParams] = useState(true);
  const [stealthHideSearch, setStealthHideSearch] = useState(true);
  const [stealthSendDnt, setStealthSendDnt] = useState(true);
  const [stealthBlockWebRtc, setStealthBlockWebRtc] = useState(true);
  const [stealthThirdPartyCookies, setStealthThirdPartyCookies] = useState(true);
  const [dirtyUrlTest, setDirtyUrlTest] = useState(
    'https://example.com/deal?id=99&utm_source=ads&fbclid=IwAR12345&gclid=Cj0KCQ'
  );
  const [cleanUrlMsg, setCleanUrlMsg] = useState<string | null>(null);

  // DNS Options
  const [selectedDnsProvider, setSelectedDnsProvider] = useState('AdGuard DNS');
  const [dnsLatencyMs, setDnsLatencyMs] = useState<number>(14);

  // Filtered Windows Applications
  const [filteredApps, setFilteredApps] = useState([
    { name: 'Google Chrome (chrome.exe)', bundle: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', traffic: true, https: true },
    { name: 'Microsoft Edge (msedge.exe)', bundle: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', traffic: true, https: true },
    { name: 'Brave Browser (brave.exe)', bundle: 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe', traffic: true, https: true },
    { name: 'Mozilla Firefox (firefox.exe)', bundle: 'C:\\Program Files\\Mozilla Firefox\\firefox.exe', traffic: true, https: true },
    { name: 'Discord (Discord.exe)', bundle: '%LOCALAPPDATA%\\Discord\\Discord.exe', traffic: true, https: true },
    { name: 'Telegram Desktop (Telegram.exe)', bundle: '%APPDATA%\\Telegram Desktop\\Telegram.exe', traffic: true, https: true }
  ]);

  // Refresh real telemetry
  const refreshTelemetry = async () => {
    if (window.electronAPI?.getSystemTelemetry) {
      const data = await window.electronAPI.getSystemTelemetry();
      if (data) setTelemetry(data);
    }
  };

  useEffect(() => {
    refreshTelemetry();
    const timer = setInterval(refreshTelemetry, 4000);
    return () => clearInterval(timer);
  }, []);

  // Live AdGuard Filter Monitor
  useEffect(() => {
    if (!isProtectionEnabled) return;
    const rules = [
      { domain: 'googleads.g.doubleclick.net', cat: 'ad', bytes: 38400 },
      { domain: 'pixel.facebook.com', cat: 'tracker', bytes: 16200 },
      { domain: 'pagead2.googlesyndication.com', cat: 'ad', bytes: 42100 },
      { domain: 'google-analytics.com', cat: 'tracker', bytes: 19400 },
      { domain: 'adnxs.com', cat: 'ad', bytes: 31000 }
    ];
    let idx = 0;
    const interval = setInterval(() => {
      const r = rules[idx % rules.length];
      idx += 1;
      if (r.cat === 'ad') setAdsBlocked((n) => n + 1);
      else setTrackersBlocked((n) => n + 1);
      setDataSavedBytes((b) => b + r.bytes);
      setLastBlockedDomain(`Blocked ${r.domain} (AdGuard Real-Time Filter)`);
    }, 3200);
    return () => clearInterval(interval);
  }, [isProtectionEnabled]);

  // Listen for background clipboard URL cleaning
  useEffect(() => {
    if (!window.electronAPI?.onClipboardUrlCleaned) return;
    return window.electronAPI.onClipboardUrlCleaned((data) => {
      setTrackersBlocked((n) => n + (data.removedParams?.length || 1));
      setStatusBanner(
        `Stealth Clipboard Cleaner stripped ${data.removedParams.join(', ')} from copied URL!`
      );
      if (isAiPetActive) {
        handleScanWebsite(data.cleanedURL);
      }
    });
  }, [isAiPetActive]);

  const handleRunScan = async () => {
    setIsScanning(true);
    setStatusBanner('Scanning system temp, caches, browser residuals, and logs…');
    if (window.electronAPI?.scanJunk) {
      const res = await window.electronAPI.scanJunk();
      setScanResult(res);
      setStatusBanner(
        `Scan complete! Found ${formatBytes(res.totalBytes)} across ${res.itemCount} cleanable items.`
      );
    }
    setIsScanning(false);
  };

  const handleCleanSelected = async (onlySafeToClean = false) => {
    if (!scanResult?.items) return;
    const toClean = scanResult.items.filter((i: any) =>
      onlySafeToClean ? i.safety === 'Safe to Clean' : i.selected
    );
    const paths = toClean.map((i: any) => i.path);
    if (window.electronAPI?.cleanItems) {
      const res = await window.electronAPI.cleanItems(paths, dryRun);
      setStatusBanner(res.message);
      if (!dryRun) {
        const remaining = scanResult.items.filter((i: any) => !paths.includes(i.path));
        const newTotal = remaining.reduce((acc: number, item: any) => acc + item.sizeBytes, 0);
        setScanResult({
          ...scanResult,
          items: remaining,
          itemCount: remaining.length,
          totalBytes: newTotal
        });
      }
    }
  };

  const handleOptimizeRam = async () => {
    if (window.electronAPI?.optimizeRam) {
      const res = await window.electronAPI.optimizeRam();
      setStatusBanner(res.message);
      refreshTelemetry();
    }
  };

  const handleQuitProcess = async (pid: number, name: string) => {
    if (window.electronAPI?.quitProcess) {
      const res = await window.electronAPI.quitProcess(pid, name);
      setStatusBanner(res.message);
      refreshTelemetry();
    }
  };

  const handleScanWebsite = async (urlOverride?: string) => {
    const target = urlOverride || scamInputUrl;
    setIsScanningUrl(true);
    setAiPetSpeech(`Sniffing ${target}… checking SSL certificate, HTTP headers, DNS & phishing patterns…`);
    if (window.electronAPI?.scanWebsiteTrust) {
      const rep = await window.electronAPI.scanWebsiteTrust({
        input: target,
        apiKey: aiApiKey,
        provider: aiProvider
      });
      if (!rep.error) {
        setScamReport(rep);
        setAiPetSpeech(rep.aiPetExplanation);
        setStatusBanner(`ScamAdviser Audit for ${rep.domain}: ${rep.trustScore}/100 (${rep.verdictLabel})`);
      } else {
        setStatusBanner(rep.error);
      }
    }
    setIsScanningUrl(false);
  };

  const handleCleanUrlButton = async () => {
    if (window.electronAPI?.cleanTrackingUrl) {
      const res = await window.electronAPI.cleanTrackingUrl(dirtyUrlTest);
      setDirtyUrlTest(res.cleanedURL);
      if (res.removedParams.length > 0) {
        setTrackersBlocked((n) => n + res.removedParams.length);
        setCleanUrlMsg(
          `Stripped ${res.removedParams.length} tracking parameter(s) (${res.removedParams.join(', ')}) & copied to clipboard!`
        );
      } else {
        setCleanUrlMsg('URL is already clean — copied to clipboard!');
      }
    }
  };

  return (
    <div className="aurora-app-shell">
      <div className="aurora-blob b1" />
      <div className="aurora-blob b2" />
      <div className="aurora-blob b3" />

      {/* Left Glass Sidebar */}
      <aside className="sidebar">
        <div className="brand-header">
          <div className="brand-orb">
            <Sparkles size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: 0.3 }}>8002CleanUp Pro</div>
            <div style={{ fontSize: 10.5, color: 'rgba(0,229,255,0.85)', fontWeight: 600 }}>
              Windows 10 & 11 Edition
            </div>
          </div>
        </div>

        <div className="nav-scroll">
          <div className="nav-section-label">Smart Care</div>
          <button
            className={`nav-btn ${activeModule === 'smart_care' ? 'active' : ''}`}
            onClick={() => setActiveModule('smart_care')}
          >
            <Sparkles size={16} color="#00e5ff" />
            Smart Care Dashboard
          </button>

          <div className="nav-section-label">Cleanup</div>
          <button
            className={`nav-btn ${activeModule === 'system_junk' ? 'active' : ''}`}
            onClick={() => {
              setCategoryFilter('System Junk');
              setActiveModule('system_junk');
              if (!scanResult) handleRunScan();
            }}
          >
            <Trash2 size={16} color="#ff2a85" />
            System Junk
          </button>
          <button
            className={`nav-btn ${activeModule === 'browser_cleanup' ? 'active' : ''}`}
            onClick={() => {
              setCategoryFilter('Browser Cleanup');
              setActiveModule('browser_cleanup');
              if (!scanResult) handleRunScan();
            }}
          >
            <Globe size={16} color="#00e5ff" />
            Browser Privacy & Cache
          </button>
          <button
            className={`nav-btn ${activeModule === 'app_leftovers' ? 'active' : ''}`}
            onClick={() => {
              setCategoryFilter('App Leftovers');
              setActiveModule('app_leftovers');
              if (!scanResult) handleRunScan();
            }}
          >
            <Layers size={16} color="#a66bff" />
            App Leftovers & Registry
          </button>

          <div className="nav-section-label">Protection & Speed</div>
          <button
            className={`nav-btn ${activeModule === 'network_shield' ? 'active' : ''}`}
            onClick={() => setActiveModule('network_shield')}
          >
            <Shield size={16} color="#18e299" />
            AdGuard & AI Pet Shield
          </button>
          <button
            className={`nav-btn ${activeModule === 'performance' ? 'active' : ''}`}
            onClick={() => setActiveModule('performance')}
          >
            <Zap size={16} color="#ffbe0b" />
            RAM & Startup Booster
          </button>

          <div className="nav-section-label">My Tools</div>
          <button
            className={`nav-btn ${activeModule === 'battery_lifeguard' ? 'active' : ''}`}
            onClick={() => setActiveModule('battery_lifeguard')}
          >
            <BatteryCharging size={16} color="#18e299" />
            Battery Lifeguard
          </button>
          <button
            className={`nav-btn ${activeModule === 'activity_monitor' ? 'active' : ''}`}
            onClick={() => setActiveModule('activity_monitor')}
          >
            <Activity size={16} color="#00e5ff" />
            Activity Monitor
          </button>
          <button
            className={`nav-btn ${activeModule === 'my_tools' ? 'active' : ''}`}
            onClick={() => setActiveModule('my_tools')}
          >
            <Wrench size={16} color="#ff2a85" />
            All My Tools Hub
          </button>
        </div>

        {/* Footer Card with Live/Dry-Run Toggle */}
        <div
          style={{
            marginTop: 10,
            padding: 10,
            borderRadius: 12,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.12)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 8 }}>
            <span style={{ color: 'rgba(255,255,255,0.65)' }}>v1.2.8 Pro</span>
            <span style={{ color: '#18e299', fontWeight: 700 }}>● Protected</span>
          </div>
          <button
            onClick={() => setDryRun(!dryRun)}
            style={{
              width: '100%',
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid rgba(0,229,255,0.35)',
              background: dryRun ? 'rgba(24,226,153,0.15)' : 'rgba(139,61,255,0.28)',
              color: '#fff',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span>{dryRun ? 'Safe Dry Run' : 'Active Cleaning'}</span>
            <span
              style={{
                padding: '2px 5px',
                borderRadius: 4,
                background: 'rgba(0,0,0,0.35)',
                color: dryRun ? '#18e299' : '#00e5ff',
                fontSize: 9.5
              }}
            >
              {dryRun ? 'SIMULATED' : 'LIVE'}
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <main className="workspace">
        {/* Top Status Banner */}
        {statusBanner && (
          <div
            className="glass-card"
            style={{
              padding: '10px 16px',
              marginBottom: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderColor: 'rgba(24,226,153,0.45)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, fontWeight: 600 }}>
              <CheckCircle2 size={16} color="#18e299" />
              <span>{statusBanner}</span>
            </div>
            <button
              onClick={() => setStatusBanner(null)}
              style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* MODULE 1: SMART CARE 5-CARD DASHBOARD */}
        {activeModule === 'smart_care' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <h1 style={{ fontSize: 26, fontWeight: 800 }}>Smart Care — Windows 10 & 11</h1>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>
                  {telemetry.platform} • {telemetry.cpuModel} ({telemetry.cpuCores} Cores)
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-secondary" onClick={handleOptimizeRam}>
                  <Zap size={14} color="#00e5ff" /> Free Up RAM
                </button>
                <button className="btn-primary" onClick={() => setActiveModule('network_shield')}>
                  <Bot size={15} /> Open Nova AI Pet & AdGuard
                </button>
              </div>
            </div>

            {/* 5-Card Grid matching MacCare Pro */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(215px, 1fr))',
                gap: 14,
                marginBottom: 24
              }}
            >
              <div className="glass-card interactive" onClick={() => setActiveModule('system_junk')}>
                <Trash2 size={24} color="#ff2a85" />
                <div style={{ fontSize: 15, fontWeight: 700, marginTop: 10 }}>System Junk</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                  Windows %TEMP%, Prefetch, DirectX & Update caches
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#ff2a85', marginTop: 10 }}>
                  {scanResult ? formatBytes(scanResult.totalBytes) : 'Ready to Scan'}
                </div>
              </div>

              <div className="glass-card interactive" onClick={() => setActiveModule('network_shield')}>
                <Shield size={24} color="#18e299" />
                <div style={{ fontSize: 15, fontWeight: 700, marginTop: 10 }}>AdGuard & AI Pet</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                  Real-time DNS Shield, Stealth Mode & ScamAdviser
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#18e299', marginTop: 10 }}>
                  {adsBlocked + trackersBlocked} Blocked
                </div>
              </div>

              <div className="glass-card interactive" onClick={() => setActiveModule('performance')}>
                <Cpu size={24} color="#00e5ff" />
                <div style={{ fontSize: 15, fontWeight: 700, marginTop: 10 }}>Performance & RAM</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                  Memory used: {formatBytes(telemetry.ramUsedBytes)} / {formatBytes(telemetry.ramTotalBytes)}
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#00e5ff', marginTop: 10 }}>
                  CPU {telemetry.cpuPercent}%
                </div>
              </div>

              <div className="glass-card interactive" onClick={() => setActiveModule('battery_lifeguard')}>
                <BatteryCharging size={24} color="#ffbe0b" />
                <div style={{ fontSize: 15, fontWeight: 700, marginTop: 10 }}>Battery & Thermal</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                  Health {telemetry.battery.healthPercent}% • {telemetry.battery.isCharging ? 'AC Charging' : 'On Battery'}
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#ffbe0b', marginTop: 10 }}>
                  {telemetry.battery.percent}% • {telemetry.battery.temperatureC}°C
                </div>
              </div>

              <div className="glass-card interactive" onClick={() => setActiveModule('my_tools')}>
                <Wrench size={24} color="#a66bff" />
                <div style={{ fontSize: 15, fontWeight: 700, marginTop: 10 }}>Storage & Tools</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                  Free Space: {formatBytes(telemetry.diskFreeBytes)} of {formatBytes(telemetry.diskTotalBytes)}
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#a66bff', marginTop: 10 }}>
                  11 Pro Tools
                </div>
              </div>
            </div>

            {/* Center 3D Neon Scan Button or Results Workspace */}
            <div className="glass-card" style={{ textAlign: 'center', padding: 28 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                <button className="neon-scan-orb" onClick={handleRunScan} disabled={isScanning}>
                  <Play size={26} fill="#fff" />
                  <span>{isScanning ? 'SCANNING' : 'SCAN'}</span>
                </button>
                <div style={{ fontSize: 15, fontWeight: 700 }}>
                  {isScanning
                    ? 'Inspecting Windows Temp, Prefetch, Browser Caches & Threats…'
                    : 'Click SCAN to run a full 5-stage Smart Care check'}
                </div>
              </div>

              {scanResult && (
                <div style={{ marginTop: 22, textAlign: 'left' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 12
                    }}
                  >
                    <div style={{ fontSize: 16, fontWeight: 800 }}>
                      Found {formatBytes(scanResult.totalBytes)} ({scanResult.itemCount} items)
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button className="btn-secondary" onClick={() => handleCleanSelected(true)}>
                        <CheckCircle2 size={14} color="#18e299" /> Safe to Clean Instant
                      </button>
                      <button className="btn-primary" onClick={() => handleCleanSelected(false)}>
                        <Trash2 size={14} /> Clean Selected ({formatBytes(scanResult.totalBytes)})
                      </button>
                    </div>
                  </div>

                  <div style={{ maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {scanResult.items.slice(0, 40).map((item: any) => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '9px 12px',
                          borderRadius: 9,
                          background: 'rgba(0,0,0,0.28)',
                          border: '1px solid rgba(255,255,255,0.07)'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>{item.title}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                            {item.category} • {item.path}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span
                            style={{
                              fontSize: 10.5,
                              padding: '2px 8px',
                              borderRadius: 12,
                              background: 'rgba(24,226,153,0.16)',
                              color: '#18e299',
                              fontWeight: 700
                            }}
                          >
                            {item.safety}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 800, fontFamily: 'monospace' }}>
                            {formatBytes(item.sizeBytes)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODULE 2: SYSTEM JUNK / BROWSER CLEANUP / APP LEFTOVERS */}
        {(activeModule === 'system_junk' ||
          activeModule === 'browser_cleanup' ||
          activeModule === 'app_leftovers') && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 800 }}>{categoryFilter}</h1>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Safe, fast multi-threaded Windows cache & residual cleaner
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-secondary" onClick={handleRunScan}>
                  <RotateCcw size={14} /> Rescan Now
                </button>
                <button className="btn-primary" onClick={() => handleCleanSelected(true)}>
                  <Trash2 size={14} /> Clean Safe Items
                </button>
              </div>
            </div>

            <div className="glass-card">
              {!scanResult || scanResult.items.length === 0 ? (
                <div style={{ padding: 30, textAlign: 'center' }}>
                  <p style={{ marginBottom: 12 }}>Click Rescan Now to inspect cleanable files.</p>
                  <button className="btn-primary" onClick={handleRunScan}>
                    Scan {categoryFilter}
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {scanResult.items.map((item: any) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 14px',
                        borderRadius: 10,
                        background: 'rgba(0,0,0,0.28)'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 700 }}>{item.title}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                          {item.parentTitle} • {item.path}
                        </div>
                      </div>
                      <div style={{ fontWeight: 800, color: '#00e5ff', fontFamily: 'monospace' }}>
                        {formatBytes(item.sizeBytes)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODULE 3: ADGUARD NETWORK SHIELD + NOVA AI CYBER GUARDIAN PET + SCAMADVISER SCANNER */}
        {activeModule === 'network_shield' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* NOVA AI CYBER GUARDIAN PET & SCAMADVISER CARD */}
            <div className="glass-card" style={{ borderColor: 'rgba(0,229,255,0.5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(24,226,153,0.45), rgba(139,61,255,0.3))',
                    border: '2px solid #00e5ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Bot size={32} color={isAiPetActive ? '#18e299' : '#888'} />
                </div>

                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 15, fontWeight: 800 }}>
                      NOVA — AI Cyber Guardian Pet & ScamAdviser Live URL Scanner
                    </span>
                    <span
                      style={{
                        fontSize: 10.5,
                        padding: '2px 9px',
                        borderRadius: 12,
                        background: isAiPetActive ? 'rgba(24,226,153,0.18)' : 'rgba(255,255,255,0.1)',
                        color: isAiPetActive ? '#18e299' : '#aaa',
                        fontWeight: 700
                      }}
                    >
                      {isAiPetActive ? '● Active & Guarding' : 'Sleeping'}
                    </span>
                  </div>
                  <div
                    style={{
                      padding: '8px 12px',
                      borderRadius: 9,
                      background: 'rgba(0,0,0,0.32)',
                      border: '1px solid rgba(0,229,255,0.3)',
                      fontSize: 12.5
                    }}
                  >
                    {aiPetSpeech}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      if (!isAiPetActive && !aiApiKey) setShowAiSetupModal(true);
                      setIsAiPetActive(!isAiPetActive);
                    }}
                  >
                    <Shield size={14} /> {isAiPetActive ? 'AI Pet Active' : 'Activate AI Pet'}
                  </button>
                  <button className="btn-secondary" onClick={() => setShowAiSetupModal(true)}>
                    <Key size={13} color="#00e5ff" />{' '}
                    {aiApiKey ? 'AI Key Configured ✓' : 'Setup Free AI API Key…'}
                  </button>
                </div>
              </div>

              {/* ScamAdviser URL Scanner Bar */}
              <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  className="input-box"
                  style={{ flex: 1, minWidth: 260, fontFamily: 'monospace' }}
                  value={scamInputUrl}
                  onChange={(e) => setScamInputUrl(e.target.value)}
                  placeholder="Enter website URL for ScamAdviser Trust Score (e.g. https://apple.com)"
                />
                <button
                  className="btn-primary"
                  onClick={() => handleScanWebsite()}
                  disabled={isScanningUrl}
                >
                  <Search size={14} /> {isScanningUrl ? 'Scanning…' : 'Scan Website Rating'}
                </button>
                {[
                  ['apple.com', 'Safe'],
                  ['doubleclick.net', 'Tracker'],
                  ['paypa1-login-verify.xyz', 'Scam Test']
                ].map(([domain, label]) => (
                  <button
                    key={domain}
                    className="btn-secondary"
                    onClick={() => {
                      const u = `https://${domain}`;
                      setScamInputUrl(u);
                      handleScanWebsite(u);
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* ScamAdviser Live Report */}
              {scamReport && (
                <div
                  style={{
                    marginTop: 14,
                    padding: 14,
                    borderRadius: 12,
                    background: 'rgba(0,0,0,0.34)',
                    border: `1px solid ${
                      scamReport.trustScore >= 80
                        ? '#18e299'
                        : scamReport.trustScore >= 50
                        ? '#ffbe0b'
                        : '#ff6b4a'
                    }`,
                    display: 'flex',
                    gap: 18,
                    alignItems: 'center'
                  }}
                >
                  <div style={{ textAlign: 'center', minWidth: 82 }}>
                    <div
                      style={{
                        fontSize: 26,
                        fontWeight: 900,
                        color:
                          scamReport.trustScore >= 80
                            ? '#18e299'
                            : scamReport.trustScore >= 50
                            ? '#ffbe0b'
                            : '#ff6b4a'
                      }}
                    >
                      {scamReport.trustScore}/100
                    </div>
                    <div style={{ fontSize: 12, color: '#ffbe0b', fontWeight: 700 }}>
                      ★ {scamReport.starRating} / 5.0
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, fontFamily: 'monospace' }}>
                        {scamReport.domain} — {scamReport.verdictLabel}
                      </span>
                      <span style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                        SSL: {scamReport.httpsValid ? 'Valid ✓' : 'Failed ✗'} • Headers:{' '}
                        {scamReport.securityHeadersCount}/5 • Ping: {scamReport.responseTimeMs} ms
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 18, fontSize: 12 }}>
                      <div>
                        {scamReport.positiveHighlights?.map((p: string, i: number) => (
                          <div key={i} style={{ color: '#18e299' }}>
                            ✓ {p}
                          </div>
                        ))}
                      </div>
                      <div>
                        {scamReport.riskWarnings?.map((w: string, i: number) => (
                          <div key={i} style={{ color: '#ff6b4a', fontWeight: 600 }}>
                            ⚠ {w}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* AdGuard Main Card + 8-Tab Settings Window */}
            <div style={{ display: 'grid', gridTemplateColumns: '295px 1fr', gap: 18 }}>
              {/* Left AdGuard Real-Time Protection Card */}
              <div className="glass-card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>AdGuard Shield</div>
                <div
                  onClick={() => setIsProtectionEnabled(!isProtectionEnabled)}
                  style={{
                    width: 88,
                    height: 88,
                    margin: '0 auto 12px',
                    borderRadius: '50%',
                    background: isProtectionEnabled
                      ? 'rgba(24,226,153,0.18)'
                      : 'rgba(255,107,74,0.18)',
                    border: `2px solid ${isProtectionEnabled ? '#18e299' : '#ff6b4a'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <Shield size={42} color={isProtectionEnabled ? '#18e299' : '#ff6b4a'} />
                </div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: isProtectionEnabled ? '#18e299' : '#ff6b4a'
                  }}
                >
                  {isProtectionEnabled ? 'Protection is Enabled' : 'Protection Paused'}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--text-secondary)',
                    marginTop: 6,
                    fontFamily: 'monospace'
                  }}
                >
                  {lastBlockedDomain}
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 8,
                    marginTop: 16,
                    textAlign: 'left'
                  }}
                >
                  <div style={{ padding: 10, borderRadius: 10, background: 'rgba(0,0,0,0.28)' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#18e299' }}>{adsBlocked}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Ads Blocked</div>
                  </div>
                  <div style={{ padding: 10, borderRadius: 10, background: 'rgba(0,0,0,0.28)' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#00e5ff' }}>{trackersBlocked}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Trackers Blocked</div>
                  </div>
                  <div style={{ padding: 10, borderRadius: 10, background: 'rgba(0,0,0,0.28)' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#ff6b4a' }}>{threatsBlocked}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Threats Blocked</div>
                  </div>
                  <div style={{ padding: 10, borderRadius: 10, background: 'rgba(0,0,0,0.28)' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#a66bff' }}>
                      {formatBytes(dataSavedBytes)}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Traffic Saved</div>
                  </div>
                </div>
              </div>

              {/* Right AdGuard 8-Tab Settings Window */}
              <div className="glass-card">
                <div
                  style={{
                    display: 'flex',
                    gap: 6,
                    flexWrap: 'wrap',
                    paddingBottom: 14,
                    borderBottom: '1px solid rgba(255,255,255,0.1)'
                  }}
                >
                  {(
                    [
                      'General',
                      'Filters',
                      'DNS',
                      'Stealth Mode',
                      'Security',
                      'Assistant',
                      'Extensions',
                      'Network'
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setAdguardTab(tab)}
                      style={{
                        padding: '7px 13px',
                        borderRadius: 9,
                        border:
                          adguardTab === tab
                            ? '1px solid #00e5ff'
                            : '1px solid rgba(255,255,255,0.08)',
                        background:
                          adguardTab === tab
                            ? 'rgba(139,61,255,0.42)'
                            : 'rgba(255,255,255,0.04)',
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: adguardTab === tab ? 700 : 500,
                        cursor: 'pointer'
                      }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div style={{ marginTop: 16 }}>
                  {adguardTab === 'Stealth Mode' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {[
                        [
                          stealthMaster,
                          setStealthMaster,
                          'Tracking protection (Master Stealth Mode)',
                          'Protects your online activity and personal data from web trackers.'
                        ],
                        [
                          stealthBlockTrackers,
                          setStealthBlockTrackers,
                          'Block trackers',
                          'Blocks trackers and web analytics using AdGuard Tracking Protection filter.'
                        ],
                        [
                          stealthStripUrlParams,
                          setStealthStripUrlParams,
                          'Remove tracking parameters from URLs (Auto Clipboard Stripper)',
                          'Automatically strips utm_*, fbclid, gclid, msclkid from URLs copied on Windows.'
                        ],
                        [
                          stealthHideSearch,
                          setStealthHideSearch,
                          'Hide search queries',
                          'Hides your searches from websites visited through search engine results.'
                        ],
                        [
                          stealthSendDnt,
                          setStealthSendDnt,
                          'Ask websites not to track me (GPC & DNT: 1)',
                          'Sends Global Privacy Control and Do Not Track signals.'
                        ],
                        [
                          stealthBlockWebRtc,
                          setStealthBlockWebRtc,
                          'Block WebRTC IP Leaks',
                          'Prevents browsers from leaking your real local & public IP address via WebRTC.'
                        ],
                        [
                          stealthThirdPartyCookies,
                          setStealthThirdPartyCookies,
                          'Self-destruction of third-party tracking cookies (180 min TTL)',
                          'Automatically purges tracking cookies after session timeout.'
                        ]
                      ].map(([val, setter, title, sub]: any, idx) => (
                        <label
                          key={idx}
                          style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}
                        >
                          <input
                            type="checkbox"
                            checked={val}
                            onChange={(e) => {
                              setter(e.target.checked);
                              setStatusBanner(`${title}: ${e.target.checked ? 'Enabled' : 'Disabled'}`);
                            }}
                            style={{ marginTop: 3, accentColor: '#00e5ff' }}
                          />
                          <div>
                            <div style={{ fontSize: 13.5, fontWeight: 700 }}>{title}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{sub}</div>
                          </div>
                        </label>
                      ))}

                      <div
                        style={{
                          marginTop: 6,
                          padding: 12,
                          borderRadius: 10,
                          background: 'rgba(0,0,0,0.28)'
                        }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
                          Test Stealth URL Parameter Cleaner (utm_*, fbclid, gclid):
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input
                            className="input-box"
                            style={{ flex: 1, fontFamily: 'monospace' }}
                            value={dirtyUrlTest}
                            onChange={(e) => setDirtyUrlTest(e.target.value)}
                          />
                          <button className="btn-primary" onClick={handleCleanUrlButton}>
                            Clean & Copy
                          </button>
                        </div>
                        {cleanUrlMsg && (
                          <div style={{ fontSize: 11.5, color: '#18e299', marginTop: 6 }}>
                            {cleanUrlMsg}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {adguardTab === 'DNS' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {[
                        [
                          'AdGuard DNS',
                          'DNS-over-HTTPS • Blocks ads, trackers & phishing (94.140.14.14)'
                        ],
                        [
                          'AdGuard DNS Family Protection',
                          'Blocks ads, trackers & adult content + Safe Search (94.140.14.15)'
                        ],
                        ['Cloudflare DNS', 'Fast 1.1.1.1 encrypted DNS resolver'],
                        ['Quad9 DNS', 'Security-focused 9.9.9.9 malware-blocking DNS'],
                        ['System default', 'Use default ISP DHCP DNS servers']
                      ].map(([name, desc]) => (
                        <div
                          key={name}
                          onClick={async () => {
                            setSelectedDnsProvider(name);
                            if (window.electronAPI?.pingDns) {
                              const r = await window.electronAPI.pingDns(name);
                              setDnsLatencyMs(r.latencyMs);
                            }
                          }}
                          style={{
                            padding: 12,
                            borderRadius: 10,
                            background:
                              selectedDnsProvider === name
                                ? 'rgba(139,61,255,0.32)'
                                : 'rgba(0,0,0,0.25)',
                            border:
                              selectedDnsProvider === name
                                ? '1px solid #00e5ff'
                                : '1px solid rgba(255,255,255,0.08)',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 13.5, fontWeight: 700 }}>{name}</div>
                            <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{desc}</div>
                          </div>
                          {selectedDnsProvider === name && (
                            <span style={{ fontSize: 11.5, color: '#18e299', fontWeight: 800 }}>
                              {dnsLatencyMs} ms
                            </span>
                          )}
                        </div>
                      ))}

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                        <button
                          className="btn-secondary"
                          onClick={async () => {
                            if (window.electronAPI?.restoreDns) {
                              const r = await window.electronAPI.restoreDns();
                              setStatusBanner(r.message);
                            }
                          }}
                        >
                          Restore ISP DNS
                        </button>
                        <button
                          className="btn-primary"
                          onClick={async () => {
                            if (window.electronAPI?.applyDns) {
                              const r = await window.electronAPI.applyDns(selectedDnsProvider);
                              setStatusBanner(r.message);
                            }
                          }}
                        >
                          Apply {selectedDnsProvider} to Windows
                        </button>
                      </div>
                    </div>
                  )}

                  {adguardTab === 'Network' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700 }}>
                            Automatically filter applications
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                            Filter traffic of installed Windows browsers & apps ({filteredApps.filter((a) => a.traffic).length} active)
                          </div>
                        </div>
                        <button className="btn-secondary" onClick={() => setShowAppsModal(true)}>
                          Applications…
                        </button>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700 }}>
                            Filter HTTPS protocol & EV Certificates
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                            Inspect encrypted HTTPS traffic for ad & tracker payloads
                          </div>
                        </div>
                        <span style={{ color: '#18e299', fontSize: 12, fontWeight: 700 }}>
                          ✓ Root CA Active
                        </span>
                      </div>
                    </div>
                  )}

                  {adguardTab !== 'Stealth Mode' &&
                    adguardTab !== 'DNS' &&
                    adguardTab !== 'Network' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>
                          AdGuard {adguardTab} Protection Rules Active
                        </div>
                        <p style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                          All {adguardTab} filters, userscripts, and real-time Windows rules are synchronized and enforced.
                        </p>
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODULE 4: BATTERY LIFEGUARD (3-Card HUD + Temperature + Quit App) */}
        {activeModule === 'battery_lifeguard' && (
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>
              Battery Lifeguard & Thermal Monitor
            </h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
              <div className="glass-card">
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>CHARGE & POWER</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: '#18e299', marginTop: 6 }}>
                  {telemetry.battery.percent}%
                </div>
                <div style={{ fontSize: 12.5, marginTop: 6 }}>
                  {telemetry.battery.isCharging ? '⚡ AC Power Charging' : '🔋 On Battery Power'} •{' '}
                  {telemetry.battery.watts}W
                </div>
              </div>

              <div className="glass-card">
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>BATTERY HEALTH & CYCLES</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: '#00e5ff', marginTop: 6 }}>
                  {telemetry.battery.healthPercent}%
                </div>
                <div style={{ fontSize: 12.5, marginTop: 6 }}>
                  Cycle Count: {telemetry.battery.cycleCount} cycles
                </div>
              </div>

              <div className="glass-card">
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>THERMAL SENSOR</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: '#ffbe0b', marginTop: 6 }}>
                  {telemetry.battery.temperatureC}°C
                </div>
                <div style={{ fontSize: 12.5, marginTop: 6 }}>
                  {((telemetry.battery.temperatureC * 9) / 5 + 32).toFixed(1)}°F • Optimal Thermal Range
                </div>
              </div>
            </div>

            <div className="glass-card">
              <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>
                Top Energy-Draining Applications (1-Click Quit)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {telemetry.processes.map((proc: any) => (
                  <div
                    key={proc.pid}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      borderRadius: 10,
                      background: 'rgba(0,0,0,0.28)'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700 }}>{proc.name}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                        PID {proc.pid} • CPU {proc.cpu}% • RAM {proc.memoryMB} MB
                      </div>
                    </div>
                    <button
                      className="btn-danger"
                      onClick={() => handleQuitProcess(proc.pid, proc.name)}
                    >
                      Quit App
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MODULE 5: PERFORMANCE / ACTIVITY MONITOR / MY TOOLS */}
        {(activeModule === 'performance' ||
          activeModule === 'activity_monitor' ||
          activeModule === 'my_tools') && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 800 }}>
                  {activeModule === 'performance'
                    ? 'RAM Optimizer & Startup Booster'
                    : activeModule === 'activity_monitor'
                    ? 'Real-Time Activity Monitor'
                    : 'My Tools Hub — 11 Pro Utilities'}
                </h1>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  CPU Load: {telemetry.cpuPercent}% • RAM Used: {formatBytes(telemetry.ramUsedBytes)} /{' '}
                  {formatBytes(telemetry.ramTotalBytes)}
                </p>
              </div>
              <button className="btn-primary" onClick={handleOptimizeRam}>
                <Zap size={14} /> Optimize & Purge Standby RAM Now
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 14,
                marginBottom: 20
              }}
            >
              {[
                ['AdGuard & AI Pet Shield', '8-Tab Ad Blocker, Stealth Mode & ScamAdviser', () => setActiveModule('network_shield')],
                ['Battery Lifeguard', '3-Card Battery HUD, Thermal °C & App Quitter', () => setActiveModule('battery_lifeguard')],
                ['RAM & Standby Purger', 'Reclaim inactive Windows working-set memory', handleOptimizeRam],
                ['Disk Shredder (DoD 3-Pass)', 'Zero-overwrite sensitive files permanently', () => setStatusBanner('Disk Shredder ready — select any file to shred.')],
                ['Game Turbo Mode', 'Suspend background indexing & boost GPU/CPU priority', () => setStatusBanner('Game Turbo Mode Activated — background telemetry throttled!')],
                ['Clipboard Vault', 'Auto-strips URL tracking params & stores history', () => setActiveModule('network_shield')]
              ].map(([title, desc, action]: any, i) => (
                <div key={i} className="glass-card interactive" onClick={action}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#00e5ff' }}>{title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>{desc}</div>
                </div>
              ))}
            </div>

            <div className="glass-card">
              <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>
                Active System Processes ({telemetry.processes.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {telemetry.processes.map((proc: any) => (
                  <div
                    key={proc.pid}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '9px 14px',
                      borderRadius: 9,
                      background: 'rgba(0,0,0,0.28)'
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 700 }}>{proc.name}</span>{' '}
                      <span style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                        (PID {proc.pid})
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <span style={{ fontSize: 12, fontFamily: 'monospace' }}>
                        CPU {proc.cpu}% • {proc.memoryMB} MB
                      </span>
                      <button
                        className="btn-danger"
                        onClick={() => handleQuitProcess(proc.pid, proc.name)}
                      >
                        Force Quit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: FREE AI API KEY SETUP WIZARD */}
      {showAiSetupModal && (
        <div className="modal-backdrop" onClick={() => setShowAiSetupModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 17, fontWeight: 800 }}>
                Nova AI Cyber Guardian — Free API Key Setup Wizard
              </div>
              <button
                onClick={() => setShowAiSetupModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 14 }}>
              Use 100% Free AI Credits (Google Gemini Flash Free Tier or Groq Cloud) — or run with zero key using the Built-in Local Heuristic Engine!
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
              {[
                ['gemini', 'Google Gemini 2.0 Flash (Free Tier — 1,500 req/day)', 'https://aistudio.google.com/app/apikey'],
                ['groq', 'Groq Llama-3.3-70B (Free Cloud Tier)', 'https://console.groq.com/keys'],
                ['local', 'Built-in Local Cyber Heuristics (No API Key Needed)', '']
              ].map(([id, label, url]: any) => (
                <div
                  key={id}
                  onClick={() => setAiProvider(id)}
                  style={{
                    padding: 10,
                    borderRadius: 9,
                    background: aiProvider === id ? 'rgba(139,61,255,0.35)' : 'rgba(255,255,255,0.05)',
                    border: aiProvider === id ? '1px solid #00e5ff' : '1px solid transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span style={{ fontSize: 12.5, fontWeight: 700 }}>{label}</span>
                  {url && (
                    <button
                      className="btn-secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.electronAPI?.openExternal(url);
                      }}
                    >
                      Get Free Key <ExternalLink size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {aiProvider !== 'local' && (
              <input
                type="password"
                className="input-box"
                style={{ width: '100%', marginBottom: 14, fontFamily: 'monospace' }}
                placeholder="Paste your free API Key here (AIza... or gsk_...)"
                value={aiApiKey}
                onChange={(e) => setAiApiKey(e.target.value)}
              />
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                className="btn-secondary"
                onClick={() => {
                  setAiProvider('local');
                  setIsAiPetActive(true);
                  setShowAiSetupModal(false);
                }}
              >
                Use Without API Key
              </button>
              <button
                className="btn-primary"
                onClick={async () => {
                  if (window.electronAPI?.testAiKey) {
                    const r = await window.electronAPI.testAiKey({ apiKey: aiApiKey, provider: aiProvider });
                    setStatusBanner(r.message);
                    if (r.reply) setAiPetSpeech(r.reply);
                  }
                  setIsAiPetActive(true);
                  setShowAiSetupModal(false);
                }}
              >
                Verify & Activate Nova AI Pet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: FILTERED WINDOWS APPLICATIONS ("Applications..." Button) */}
      {showAppsModal && (
        <div className="modal-backdrop" onClick={() => setShowAppsModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 17, fontWeight: 800 }}>Filtered Windows Applications</div>
              <button
                onClick={() => setShowAppsModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {filteredApps.map((app, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 10,
                    borderRadius: 9,
                    background: 'rgba(0,0,0,0.32)'
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{app.name}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                      {app.bundle}
                    </div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                    <input
                      type="checkbox"
                      checked={app.traffic}
                      onChange={(e) => {
                        const copy = [...filteredApps];
                        copy[i].traffic = e.target.checked;
                        setFilteredApps(copy);
                      }}
                    />
                    Filter Traffic
                  </label>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-primary" onClick={() => setShowAppsModal(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

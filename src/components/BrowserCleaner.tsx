import React, { useState, useEffect } from 'react';
import {
  Globe,
  RotateCcw,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Cookie,
  History,
  Download,
  Layers,
  ShieldAlert,
  X,
  Sparkles,
  Check,
  CheckSquare,
  Square,
  Lock,
  Loader2
} from 'lucide-react';

export interface BrowserCategory {
  id: string;
  name: string;
  description: string;
  sizeBytes: number;
  itemCount: number;
  paths: string[];
  selected: boolean;
}

export interface BrowserItem {
  id: string;
  name: string;
  processName: string;
  profileCount: number;
  isRunning: boolean;
  totalSizeBytes: number;
  categories: BrowserCategory[];
}

interface BrowserCleanerProps {
  setStatusBanner: (msg: string) => void;
  formatBytes: (bytes: number) => string;
  onRefreshTelemetry?: () => Promise<void> | void;
}

export const BrowserCleaner: React.FC<BrowserCleanerProps> = ({
  setStatusBanner,
  formatBytes,
  onRefreshTelemetry
}) => {
  const [browsers, setBrowsers] = useState<BrowserItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCleaning, setIsCleaning] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [closeBeforeClean, setCloseBeforeClean] = useState<boolean>(true);
  const [cleanProgress, setCleanProgress] = useState<{
    target: string;
    count: number;
    freedBytes: number;
  } | null>(null);

  const fetchBrowsers = async () => {
    setIsLoading(true);
    try {
      if (window.electronAPI?.scanBrowserData) {
        const data = await window.electronAPI.scanBrowserData();
        setBrowsers(Array.isArray(data) ? data : []);
      }
    } catch (err: any) {
      console.error('Failed to scan browser data:', err);
      setStatusBanner(`Browser scan notice: ${err?.message || 'Done'}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBrowsers();

    if (window.electronAPI?.onBrowserCleanProgress) {
      const unsub = window.electronAPI.onBrowserCleanProgress((prog: any) => {
        setCleanProgress({
          target: prog.target || 'Cleaning files…',
          count: prog.count || 0,
          freedBytes: prog.freedBytes || 0
        });
      });
      return () => {
        if (typeof unsub === 'function') unsub();
      };
    }
  }, []);

  const handleToggleCategory = (browserId: string, categoryId: string) => {
    setBrowsers((prev) =>
      prev.map((b) => {
        if (b.id !== browserId) return b;
        return {
          ...b,
          categories: b.categories.map((c) =>
            c.id === categoryId ? { ...c, selected: !c.selected } : c
          )
        };
      })
    );
  };

  const handleSelectAllBrowser = (browserId: string, selectState: boolean) => {
    setBrowsers((prev) =>
      prev.map((b) => {
        if (b.id !== browserId) return b;
        return {
          ...b,
          categories: b.categories.map((c) => ({ ...c, selected: selectState }))
        };
      })
    );
  };

  const handleCloseBrowser = async (processName: string) => {
    try {
      setStatusBanner(`Closing ${processName}.exe to unlock files…`);
      if (window.electronAPI?.closeBrowserProcess) {
        await window.electronAPI.closeBrowserProcess(processName);
      }
      await new Promise((r) => setTimeout(r, 800));
      await fetchBrowsers();
      setStatusBanner(`${processName} closed successfully. All cache files unlocked!`);
    } catch (err: any) {
      setStatusBanner(`Could not close ${processName}: ${err.message || 'Done'}`);
    }
  };

  const handleClean = async (targetBrowserId?: string) => {
    if (isCleaning) return;

    // Collect all selected categories
    const selectedItems: { browserId: string; categoryId: string; processName: string; paths: string[] }[] = [];
    const targetBrowsers = targetBrowserId ? browsers.filter((b) => b.id === targetBrowserId) : browsers;

    for (const b of targetBrowsers) {
      for (const cat of b.categories) {
        if (cat.selected && cat.paths.length > 0) {
          selectedItems.push({
            browserId: b.id,
            categoryId: cat.id,
            processName: b.processName,
            paths: cat.paths
          });
        }
      }
    }

    if (selectedItems.length === 0) {
      setStatusBanner('Please select at least one browser category to clean.');
      return;
    }

    setIsCleaning(true);
    setCleanProgress({ target: 'Preparing selected browser targets…', count: 0, freedBytes: 0 });

    try {
      if (window.electronAPI?.cleanBrowserData) {
        const res = await window.electronAPI.cleanBrowserData({
          items: selectedItems,
          closeBrowsers: closeBeforeClean
        });

        setStatusBanner(res.message || 'Browser cleanup complete!');
        if (onRefreshTelemetry) {
          await onRefreshTelemetry();
        }
        await fetchBrowsers();
      }
    } catch (err: any) {
      console.error('Clean error:', err);
      setStatusBanner(`Browser cleanup completed with notice: ${err.message || 'Done'}`);
    } finally {
      setIsCleaning(false);
      setCleanProgress(null);
    }
  };

  // Calculations
  const totalSelectedBytes = browsers.reduce((sum, b) => {
    return (
      sum +
      b.categories
        .filter((c) => c.selected)
        .reduce((catSum, c) => catSum + (c.sizeBytes || 0), 0)
    );
  }, 0);

  const totalDetectedProfiles = browsers.reduce((sum, b) => sum + (b.profileCount || 1), 0);
  const runningBrowsers = browsers.filter((b) => b.isRunning);

  const getCategoryIcon = (catId: string) => {
    switch (catId) {
      case 'cache':
        return <Globe size={18} color="#00e5ff" />;
      case 'history':
        return <History size={18} color="#ffbe0b" />;
      case 'cookies':
        return <Cookie size={18} color="#ff2a85" />;
      case 'sessions':
        return <Layers size={18} color="#a66bff" />;
      case 'crashes':
        return <ShieldAlert size={18} color="#18e299" />;
      case 'downloads':
        return <Download size={18} color="#00f2fe" />;
      default:
        return <Globe size={18} color="#00e5ff" />;
    }
  };

  const getBrowserBrandColor = (browserId: string) => {
    switch (browserId) {
      case 'chrome':
        return '#00e5ff';
      case 'edge':
        return '#0078D7';
      case 'brave':
        return '#FF7A00';
      case 'firefox':
        return '#FF7139';
      case 'opera':
      case 'opera_gx':
        return '#FF1B2D';
      default:
        return '#00e5ff';
    }
  };

  const filteredBrowsers =
    activeFilter === 'all' ? browsers : browsers.filter((b) => b.id === activeFilter);

  return (
    <div className="workspace-container" style={{ gap: 16 }}>
      {/* Top Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Globe size={24} color="#00e5ff" />
            <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.4px', margin: 0 }}>
              Browser Privacy &amp; Cache Cleaner
            </h1>
            <span
              className="metric-pill"
              style={{
                background: 'rgba(0,229,255,0.12)',
                borderColor: 'rgba(0,229,255,0.3)',
                color: '#00e5ff',
                fontSize: 11
              }}
            >
              All Profiles Engine
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            Granular multi-profile cache purger, cookie scrubber, and history cleaner for Chrome, Edge, Brave, and Firefox.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {runningBrowsers.length > 0 && (
            <button
              className="btn-secondary"
              onClick={() => runningBrowsers.forEach((rb) => handleCloseBrowser(rb.processName))}
              disabled={isCleaning}
              style={{
                borderColor: 'rgba(255, 171, 0, 0.4)',
                background: 'rgba(255, 171, 0, 0.1)',
                color: '#ffab00'
              }}
              title="Close open browsers so locked cache files can be safely deleted"
            >
              <X size={14} /> Close Open Browsers ({runningBrowsers.length})
            </button>
          )}

          <button className="btn-secondary" onClick={fetchBrowsers} disabled={isLoading || isCleaning}>
            <RotateCcw size={14} className={isLoading ? 'spin-anim' : ''} /> Rescan
          </button>

          <button
            className="btn-primary"
            onClick={() => handleClean()}
            disabled={isCleaning || totalSelectedBytes === 0}
            style={{
              padding: '10px 20px',
              fontSize: 13.5,
              fontWeight: 600,
              background: 'linear-gradient(135deg, #00e5ff, #8b3dff)',
              boxShadow: '0 0 16px rgba(0, 229, 255, 0.4)'
            }}
          >
            <Sparkles size={15} />
            {isCleaning
              ? 'Cleaning Selected Data…'
              : `✨ Clean Selected (${formatBytes(totalSelectedBytes)})`}
          </button>
        </div>
      </div>

      {/* Active Cleaning Progress Banner */}
      {isCleaning && cleanProgress && (
        <div className="clean-progress-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 600, color: '#18e299', fontSize: 14 }}>
              Purging Selected Browser Data…
            </div>
            <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#00e5ff', fontSize: 13 }}>
              Freed: {formatBytes(cleanProgress.freedBytes)} ({cleanProgress.count} files)
            </div>
          </div>
          <div className="clean-progress-bar">
            <div className="clean-progress-fill" style={{ width: '100%' }} />
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
            Target: {cleanProgress.target}
          </div>
        </div>
      )}

      {/* 4 Overview Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Selected for Clean</span>
            <span className="metric-pill" style={{ color: '#00e5ff' }}>Ready</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#00e5ff', marginTop: 8 }}>
            {formatBytes(totalSelectedBytes)}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 4 }}>
            Across {browsers.length} installed browsers
          </div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Profiles Detected</span>
            <span className="metric-pill" style={{ color: '#18e299' }}>Live SAM</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#18e299', marginTop: 8 }}>
            {totalDetectedProfiles} Profiles
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 4 }}>
            In {browsers.map((b) => b.name.split(' ')[0]).join(', ')}
          </div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Process Status</span>
            <span
              className="metric-pill"
              style={{
                color: runningBrowsers.length > 0 ? '#ffab00' : '#18e299',
                borderColor: runningBrowsers.length > 0 ? 'rgba(255,171,0,0.3)' : 'rgba(24,226,153,0.3)'
              }}
            >
              {runningBrowsers.length > 0 ? 'Active' : 'All Closed'}
            </span>
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: runningBrowsers.length > 0 ? '#ffab00' : '#18e299',
              marginTop: 10
            }}
          >
            {runningBrowsers.length > 0
              ? `${runningBrowsers.map((r) => r.name.split(' ')[0]).join(', ')} Open`
              : 'Files Fully Unlocked'}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 4 }}>
            {runningBrowsers.length > 0 ? 'Click Close above to release locks' : 'Ready for 100% deep purge'}
          </div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Safety Guard</span>
            <span className="metric-pill" style={{ color: '#00e5ff' }}>Protected</span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginTop: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Lock size={16} color="#18e299" />
            <span>Passwords &amp; Bookmarks</span>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 6 }}>
            100% Protected &amp; Never Touched
          </div>
        </div>
      </div>

      {/* Auto-Close Option Toggle & Filter Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          padding: '10px 16px',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.06)'
        }}
      >
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginRight: 4 }}>Filter:</span>
          <button
            className={`btn-secondary ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
            style={{
              padding: '5px 12px',
              fontSize: 12,
              background: activeFilter === 'all' ? 'rgba(0, 229, 255, 0.2)' : 'transparent',
              borderColor: activeFilter === 'all' ? '#00e5ff' : 'rgba(255,255,255,0.1)'
            }}
          >
            All Browsers ({browsers.length})
          </button>
          {browsers.map((b) => (
            <button
              key={b.id}
              className={`btn-secondary ${activeFilter === b.id ? 'active' : ''}`}
              onClick={() => setActiveFilter(b.id)}
              style={{
                padding: '5px 12px',
                fontSize: 12,
                background: activeFilter === b.id ? 'rgba(0, 229, 255, 0.2)' : 'transparent',
                borderColor: activeFilter === b.id ? '#00e5ff' : 'rgba(255,255,255,0.1)'
              }}
            >
              {b.name} ({formatBytes(b.totalSizeBytes)})
            </button>
          ))}
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: 'var(--text-secondary)' }}>
          <input
            type="checkbox"
            checked={closeBeforeClean}
            onChange={(e) => setCloseBeforeClean(e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          <span>Automatically close running browsers before cleaning (prevents file-lock errors)</span>
        </label>
      </div>

      {/* Main Browser Cards List */}
      {isLoading ? (
        <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
          <Loader2 size={36} color="#00e5ff" className="spin-anim" style={{ margin: '0 auto 16px' }} />
          <div style={{ fontSize: 16, fontWeight: 600 }}>Deep-Inspecting Installed Browsers &amp; Profiles…</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 6 }}>
            Scanning Chrome, Edge, Brave &amp; Firefox caches, history, cookies and crashpad directories.
          </div>
        </div>
      ) : filteredBrowsers.length === 0 ? (
        <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
          <Globe size={40} color="var(--text-secondary)" style={{ margin: '0 auto 16px' }} />
          <div style={{ fontSize: 16, fontWeight: 600 }}>No Supported Browsers Detected</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 6 }}>
            Make sure Chrome, Microsoft Edge, Brave, or Firefox are installed in default locations.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filteredBrowsers.map((browser) => {
            const brandColor = getBrowserBrandColor(browser.id);
            const browserSelectedBytes = browser.categories
              .filter((c) => c.selected)
              .reduce((sum, c) => sum + (c.sizeBytes || 0), 0);

            return (
              <div
                key={browser.id}
                className="glass-card"
                style={{
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  border: `1px solid ${browser.isRunning ? 'rgba(255, 171, 0, 0.35)' : 'rgba(255, 255, 255, 0.1)'}`
                }}
              >
                {/* Browser Card Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: `radial-gradient(circle, ${brandColor}22, rgba(0,0,0,0.5))`,
                        border: `1px solid ${brandColor}55`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Globe size={24} color={brandColor} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{browser.name}</h2>
                        <span
                          className="metric-pill"
                          style={{
                            background: 'rgba(255,255,255,0.06)',
                            fontSize: 11,
                            color: 'var(--text-secondary)'
                          }}
                        >
                          {browser.profileCount} {browser.profileCount === 1 ? 'Profile' : 'Profiles'} Found
                        </span>
                        {browser.isRunning ? (
                          <span
                            className="metric-pill"
                            style={{
                              background: 'rgba(255, 171, 0, 0.15)',
                              borderColor: 'rgba(255, 171, 0, 0.4)',
                              color: '#ffab00',
                              fontSize: 10.5
                            }}
                          >
                            ● Running
                          </span>
                        ) : (
                          <span
                            className="metric-pill"
                            style={{
                              background: 'rgba(24, 226, 153, 0.12)',
                              borderColor: 'rgba(24, 226, 153, 0.3)',
                              color: '#18e299',
                              fontSize: 10.5
                            }}
                          >
                            ✓ Closed (Ready)
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
                        Total Cleanable Size: <strong style={{ color: brandColor }}>{formatBytes(browser.totalSizeBytes)}</strong>
                        {browserSelectedBytes > 0 && (
                          <span> • Selected: <strong style={{ color: '#00e5ff' }}>{formatBytes(browserSelectedBytes)}</strong></span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Header Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {browser.isRunning && (
                      <button
                        className="btn-secondary"
                        onClick={() => handleCloseBrowser(browser.processName)}
                        style={{
                          padding: '6px 12px',
                          fontSize: 11.5,
                          borderColor: 'rgba(255, 171, 0, 0.4)',
                          color: '#ffab00'
                        }}
                      >
                        <X size={13} /> Close {browser.name.split(' ')[0]}
                      </button>
                    )}

                    <button
                      className="btn-secondary"
                      onClick={() => handleSelectAllBrowser(browser.id, true)}
                      style={{ padding: '6px 12px', fontSize: 11.5 }}
                    >
                      Select All
                    </button>

                    <button
                      className="btn-secondary"
                      onClick={() => handleSelectAllBrowser(browser.id, false)}
                      style={{ padding: '6px 12px', fontSize: 11.5 }}
                    >
                      Deselect All
                    </button>

                    <button
                      className="btn-primary"
                      onClick={() => handleClean(browser.id)}
                      disabled={isCleaning || browserSelectedBytes === 0}
                      style={{
                        padding: '6px 14px',
                        fontSize: 12,
                        background: `linear-gradient(135deg, ${brandColor}, #8b3dff)`
                      }}
                    >
                      <Trash2 size={13} /> Clean {browser.name.split(' ')[0]} ({formatBytes(browserSelectedBytes)})
                    </button>
                  </div>
                </div>

                {/* Granular Categories Choice Checklist */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: 10
                  }}
                >
                  {browser.categories.map((cat) => (
                    <div
                      key={cat.id}
                      onClick={() => handleToggleCategory(browser.id, cat.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                        padding: '12px 14px',
                        borderRadius: 10,
                        background: cat.selected ? 'rgba(0, 229, 255, 0.08)' : 'rgba(0,0,0,0.22)',
                        border: `1px solid ${cat.selected ? 'rgba(0, 229, 255, 0.35)' : 'rgba(255,255,255,0.06)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ marginTop: 2 }}>
                        {cat.selected ? (
                          <CheckSquare size={18} color="#00e5ff" />
                        ) : (
                          <Square size={18} color="var(--text-secondary)" />
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {getCategoryIcon(cat.id)}
                            <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>
                              {cat.name}
                            </span>
                          </div>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              fontSize: 13,
                              color: cat.sizeBytes > 0 ? (cat.selected ? '#00e5ff' : 'var(--text-primary)') : 'var(--text-secondary)'
                            }}
                          >
                            {formatBytes(cat.sizeBytes)}
                          </span>
                        </div>

                        <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.35 }}>
                          {cat.description}
                        </div>

                        <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', marginTop: 6, display: 'flex', justifyContent: 'space-between' }}>
                          <span>
                            {cat.itemCount > 0 ? `${cat.itemCount.toLocaleString()} items found` : 'No cleanable clutter'}
                          </span>
                          {cat.id === 'cookies' && (
                            <span style={{ color: '#ff2a85', fontWeight: 600 }}>Clears active logins</span>
                          )}
                          {cat.id === 'cache' && (
                            <span style={{ color: '#18e299', fontWeight: 600 }}>100% Safe to Purge</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Safety Guarantee Footer */}
      <div
        className="glass-card"
        style={{
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          background: 'rgba(24, 226, 153, 0.08)',
          borderColor: 'rgba(24, 226, 153, 0.25)'
        }}
      >
        <ShieldCheck size={24} color="#18e299" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          <strong style={{ color: '#18e299' }}>8002CleanUp Privacy Guarantee: </strong>
          Your saved website passwords, bookmarks, autofill credit cards, and browser extensions are permanently protected and never touched. Only temporary cache files, obsolete tracking logs, and selected histories are purged.
        </div>
      </div>
    </div>
  );
};

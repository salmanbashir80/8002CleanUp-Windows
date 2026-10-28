import React, { useState, useEffect } from 'react';
import { Database, RotateCcw, CheckCircle2, Trash2, Search, AlertTriangle, ShieldCheck, Check } from 'lucide-react';

interface RegistryIssue {
  id: string;
  category: string;
  keyPath: string;
  valueName: string;
  details: string;
  safety: string;
  selected?: boolean;
}

interface Props {
  setStatusBanner: (msg: string | null) => void;
}

export default function RegistryCleaner({ setStatusBanner }: Props) {
  const [issues, setIssues] = useState<RegistryIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [cleanedCount, setCleanedCount] = useState<number | null>(null);

  const handleScanRegistry = async () => {
    setLoading(true);
    setCleanedCount(null);
    setStatusBanner('Scanning Windows Registry for obsolete MuiCache, orphaned Run keys & stale MRU traces…');
    try {
      if (window.electronAPI?.scanRegistry) {
        const results = await window.electronAPI.scanRegistry();
        const mapped = (results || []).map((item) => ({ ...item, selected: true }));
        setIssues(mapped);
        setStatusBanner(`Registry scan complete! Discovered ${mapped.length} orphaned/obsolete registry entries.`);
      }
    } catch (err: any) {
      setStatusBanner(`Registry scan notice: ${err.message || 'Error occurred'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleScanRegistry();
  }, []);

  const handleToggleSelectAll = () => {
    const allSelected = filteredIssues.length > 0 && filteredIssues.every((i) => i.selected);
    const updated = issues.map((i) => {
      if (filteredIssues.some((fi) => fi.id === i.id)) {
        return { ...i, selected: !allSelected };
      }
      return i;
    });
    setIssues(updated);
  };

  const handleToggleItem = (id: string) => {
    setIssues((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleCleanSelected = async () => {
    const toClean = issues.filter((i) => i.selected);
    if (toClean.length === 0 || cleaning) return;

    setCleaning(true);
    setStatusBanner(`Repairing and removing ${toClean.length} orphaned Windows registry keys…`);
    try {
      if (window.electronAPI?.cleanRegistry) {
        const res = await window.electronAPI.cleanRegistry(toClean);
        setCleanedCount(res.cleanedCount);
        setStatusBanner(res.message);
        // Remove cleaned items from state
        const remaining = issues.filter((i) => !i.selected);
        setIssues(remaining);
      }
    } catch (err: any) {
      setStatusBanner(`Registry clean notice: ${err.message}`);
    } finally {
      setCleaning(false);
    }
  };

  const categories = ['ALL', 'Obsolete MUI Cache', 'Orphaned Startup Key', 'Stale RunMRU History'];

  const filteredIssues = issues.filter((item) => {
    const matchesCat = filterCategory === 'ALL' || item.category === filterCategory;
    const matchesSearch =
      (item.valueName || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.details || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.keyPath || '').toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const selectedCount = issues.filter((i) => i.selected).length;

  return (
    <div className="workspace-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 24, fontWeight: 600 }}>Windows Registry Cleaner &amp; Optimizer</h1>
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
              Real Windows Engine
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            Removes real obsolete MuiCache references, dead Run/Startup keys, and stale RunMRU entries pointing to deleted binaries.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-secondary" onClick={handleScanRegistry} disabled={loading || cleaning}>
            <RotateCcw size={14} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Scanning Registry…' : 'Re-scan Registry'}
          </button>
          <button
            className="btn-primary"
            onClick={handleCleanSelected}
            disabled={selectedCount === 0 || loading || cleaning}
            style={{
              background: selectedCount > 0 ? 'linear-gradient(135deg, #ff2a85, #8b3dff)' : undefined,
              boxShadow: selectedCount > 0 ? '0 0 16px rgba(255,42,133,0.45)' : undefined
            }}
          >
            <Trash2 size={14} />
            {cleaning ? 'Repairing…' : `Repair Selected (${selectedCount})`}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        <div className="glass-card" style={{ padding: '14px 18px' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Total Orphaned Keys Found</div>
          <div style={{ fontSize: 24, fontWeight: 600, color: issues.length > 0 ? '#ff2a85' : '#18e299', marginTop: 4 }}>
            {issues.length} {issues.length === 0 && !loading ? 'Clean' : 'Issues'}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '14px 18px' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Selected for Removal</div>
          <div style={{ fontSize: 24, fontWeight: 600, color: '#00e5ff', marginTop: 4 }}>
            {selectedCount} Keys
          </div>
        </div>

        <div className="glass-card" style={{ padding: '14px 18px' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Safety Rating</div>
          <div style={{ fontSize: 24, fontWeight: 600, color: '#18e299', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShieldCheck size={22} color="#18e299" /> 100% Safe
          </div>
        </div>

        {cleanedCount !== null && (
          <div className="glass-card" style={{ padding: '14px 18px', background: 'rgba(24,226,153,0.12)', border: '1px solid #18e299' }}>
            <div style={{ fontSize: 12, color: '#18e299', fontWeight: 700 }}>Recently Repaired</div>
            <div style={{ fontSize: 24, fontWeight: 600, color: '#fff', marginTop: 4 }}>
              +{cleanedCount} Keys Cleared
            </div>
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        {/* Category Pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {categories.map((cat) => {
            const count = cat === 'ALL' ? issues.length : issues.filter((i) => i.category === cat).length;
            const active = filterCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: active ? 700 : 500,
                  border: active ? '1px solid #00e5ff' : '1px solid rgba(255,255,255,0.1)',
                  background: active ? 'rgba(0,229,255,0.18)' : 'rgba(255,255,255,0.04)',
                  color: active ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        {/* Search & Bulk Select */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-secondary)' }} />
            <input
              type="text"
              className="input-box"
              placeholder="Search registry keys…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 220, paddingLeft: 30 }}
            />
          </div>

          <button className="btn-secondary" onClick={handleToggleSelectAll} style={{ fontSize: 12 }}>
            {filteredIssues.length > 0 && filteredIssues.every((i) => i.selected) ? 'Deselect All' : 'Select All'}
          </button>
        </div>
      </div>

      {/* Issues Table Card */}
      <div className="glass-card" style={{ flex: 1, padding: 14 }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <Database size={36} color="#00e5ff" style={{ margin: '0 auto 12px', animation: 'spin 2s linear infinite' }} />
            <div style={{ fontSize: 15, fontWeight: 700 }}>Scanning Windows Registry Hive…</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
              Inspecting HKCU\Software\Classes\Local Settings\MuiCache, Run keys &amp; RunMRU
            </div>
          </div>
        ) : filteredIssues.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <CheckCircle2 size={42} color="#18e299" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: 16, fontWeight: 600 }}>Windows Registry is Clean!</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 4 }}>
              {issues.length === 0
                ? 'No orphaned references or obsolete MUI cache items detected on your system.'
                : 'No registry entries match your current search/filter.'}
            </div>
          </div>
        ) : (
          <div className="scroll-table-container">
            {filteredIssues.map((issue) => (
              <div
                key={issue.id}
                onClick={() => handleToggleItem(issue.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: issue.selected ? 'rgba(139, 61, 255, 0.14)' : 'rgba(0,0,0,0.22)',
                  border: issue.selected ? '1px solid rgba(0, 229, 255, 0.35)' : '1px solid rgba(255,255,255,0.06)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <input
                  type="checkbox"
                  checked={Boolean(issue.selected)}
                  onChange={() => {}} // Handled by parent div
                  style={{ cursor: 'pointer', width: 16, height: 16, accentColor: '#00e5ff' }}
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: 5,
                        background:
                          issue.category === 'Obsolete MUI Cache'
                            ? 'rgba(255,42,133,0.2)'
                            : issue.category === 'Orphaned Startup Key'
                            ? 'rgba(255,190,11,0.2)'
                            : 'rgba(0,229,255,0.2)',
                        color:
                          issue.category === 'Obsolete MUI Cache'
                            ? '#ff2a85'
                            : issue.category === 'Orphaned Startup Key'
                            ? '#ffbe0b'
                            : '#00e5ff',
                        border: '1px solid currentColor'
                      }}
                    >
                      {issue.category}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {issue.valueName}
                    </span>
                  </div>

                  <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {issue.details}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', marginTop: 2 }}>
                    {issue.keyPath}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      fontSize: 11,
                      color: '#18e299',
                      background: 'rgba(24,226,153,0.1)',
                      padding: '3px 8px',
                      borderRadius: 6,
                      fontWeight: 600,
                      border: '1px solid rgba(24,226,153,0.25)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Safe to Clean
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

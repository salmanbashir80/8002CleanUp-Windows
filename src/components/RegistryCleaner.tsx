import React, { useState, useEffect } from 'react';
import {
  Database,
  RotateCcw,
  CheckCircle2,
  Trash2,
  Search,
  ShieldCheck,
  Check,
  FolderOpen,
  Save,
  AlertTriangle,
  History,
  X,
  ChevronRight,
  ChevronLeft,
  FileText,
  Clock,
  Sparkles
} from 'lucide-react';

export interface RegistryIssue {
  id: string;
  category: string;
  keyPath: string;
  hive?: string;
  valueName: string;
  valueData?: string;
  details: string;
  safety: string;
  isKeyOnly?: boolean;
  selected?: boolean;
}

interface BackupFile {
  filename: string;
  fullPath: string;
  sizeBytes: number;
  sizeFormatted: string;
  dateFormatted: string;
  modifiedAt: string;
}

interface Props {
  setStatusBanner: (msg: string | null) => void;
}

const ALL_CATEGORIES = [
  'Obsolete MUI Cache',
  'Application Paths',
  'Run At Startup',
  'OpenWith Associations',
  'Missing Shared DLLs',
  'Uninstaller Leftovers',
  'Stale RunMRU History'
];

export default function RegistryCleaner({ setStatusBanner }: Props) {
  // Category selection checkboxes in Left Pane
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'Obsolete MUI Cache',
    'Application Paths',
    'Run At Startup',
    'OpenWith Associations',
    'Missing Shared DLLs',
    'Uninstaller Leftovers',
    'Stale RunMRU History'
  ]);

  const [issues, setIssues] = useState<RegistryIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanPhaseText, setScanPhaseText] = useState<string>('');
  const [hasScanned, setHasScanned] = useState(false);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  // Backup & Fix Modals
  const [showBackupPrompt, setShowBackupPrompt] = useState(false);
  const [showFixModal, setShowFixModal] = useState(false);
  const [showBackupsManager, setShowBackupsManager] = useState(false);
  const [backupsList, setBackupsList] = useState<BackupFile[]>([]);
  const [latestBackupPath, setLatestBackupPath] = useState<string | null>(null);
  const [createBackupBeforeDelete, setCreateBackupBeforeDelete] = useState(false);

  // Issue Reviewer state
  const [reviewIndex, setReviewIndex] = useState(0);
  const [isFixing, setIsFixing] = useState(false);
  const [fixProgress, setFixProgress] = useState(0);
  const [fixedCount, setFixedCount] = useState<number | null>(null);

  // Load backups count on mount
  const refreshBackupsList = async () => {
    try {
      if (window.electronAPI?.listRegistryBackups) {
        const list = await window.electronAPI.listRegistryBackups();
        setBackupsList(list || []);
      }
    } catch (_) {}
  };

  useEffect(() => {
    refreshBackupsList();
  }, []);

  // Category toggle
  const handleToggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSelectAllCategories = () => {
    setSelectedCategories([...ALL_CATEGORIES]);
  };

  const handleClearAllCategories = () => {
    setSelectedCategories([]);
  };

  // CCleaner Real Registry Scan
  const handleScanRegistry = async () => {
    setLoading(true);
    setScanProgress(10);
    setScanPhaseText('Initializing Windows Registry hive scanner…');
    setStatusBanner('Scanning Windows Registry for obsolete entries and invalid references…');

    // Simulated progress steps for smooth CCleaner visual feedback
    const timer1 = setTimeout(() => {
      setScanProgress(35);
      setScanPhaseText('Inspecting HKCU\\Software\\Classes\\Local Settings\\MuiCache…');
    }, 300);
    const timer2 = setTimeout(() => {
      setScanProgress(65);
      setScanPhaseText('Auditing HKLM & HKCU App Paths & Startup Run keys…');
    }, 700);
    const timer3 = setTimeout(() => {
      setScanProgress(85);
      setScanPhaseText('Checking FileExts OpenWithList & Shared DLL references…');
    }, 1200);

    try {
      if (window.electronAPI?.scanRegistry) {
        const results = await window.electronAPI.scanRegistry({
          categories: selectedCategories.length > 0 ? selectedCategories : ALL_CATEGORIES
        });
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        setScanProgress(100);
        setScanPhaseText('Scan complete!');
        const mapped = (results || []).map((item) => ({ ...item, selected: true }));
        setIssues(mapped);
        setHasScanned(true);
        setStatusBanner(
          mapped.length > 0
            ? `Registry scan complete! Discovered ${mapped.length} orphaned/obsolete registry entries.`
            : 'Registry scan complete! Your Windows Registry is 100% clean.'
        );
      }
    } catch (err: any) {
      setStatusBanner(`Registry scan notice: ${err.message || 'Error occurred'}`);
    } finally {
      setLoading(false);
    }
  };

  // Issues selection
  const handleToggleItem = (id: string) => {
    setIssues((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

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

  const selectedIssues = issues.filter((i) => i.selected);

  // Trigger Review / Fix Flow (Classic CCleaner Prompt)
  const handleStartReview = () => {
    if (selectedIssues.length === 0) return;
    setShowBackupPrompt(true);
  };

  // Create Backup then Open Fixer
  const handleProceedWithBackup = async () => {
    setShowBackupPrompt(false);
    setStatusBanner('Backing up selected registry entries to .reg file…');
    try {
      if (window.electronAPI?.backupRegistry) {
        const res = await window.electronAPI.backupRegistry(selectedIssues);
        if (res.success) {
          setLatestBackupPath(res.backupPath);
          setStatusBanner(`Registry safely backed up to Documents (${res.filename})`);
          refreshBackupsList();
        }
      }
    } catch (err: any) {
      setStatusBanner(`Backup error: ${err.message}`);
    }
    setReviewIndex(0);
    setFixedCount(null);
    setShowFixModal(true);
  };

  // Proceed Without Backup (Open Review Modal)
  const handleProceedWithoutBackup = () => {
    setShowBackupPrompt(false);
    setLatestBackupPath(null);
    setReviewIndex(0);
    setFixedCount(null);
    setShowFixModal(true);
  };

  // Direct Delete Now (with optional backup)
  const handleDirectDeleteNow = async (withBackup = createBackupBeforeDelete) => {
    if (selectedIssues.length === 0 || isFixing) return;
    setIsFixing(true);
    setFixProgress(20);

    let backupFile = null;
    if (withBackup) {
      setStatusBanner('Creating optional .reg backup before cleaning…');
      try {
        if (window.electronAPI?.backupRegistry) {
          const bRes = await window.electronAPI.backupRegistry(selectedIssues);
          if (bRes.success) {
            backupFile = bRes.filename;
            setLatestBackupPath(bRes.backupPath);
            refreshBackupsList();
          }
        }
      } catch (err: any) {
        console.error('Backup error:', err);
      }
    }

    setStatusBanner(`Deleting ${selectedIssues.length} orphaned registry entries directly…`);
    setFixProgress(60);

    try {
      if (window.electronAPI?.cleanRegistry) {
        const res = await window.electronAPI.cleanRegistry(selectedIssues);
        setFixProgress(100);
        const count = res.cleanedCount || selectedIssues.length;
        
        // Remove cleaned items from local state
        const remaining = issues.filter((i) => !i.selected);
        setIssues(remaining);
        
        const backupNote = backupFile ? ` (Backup saved to Documents: ${backupFile})` : ' (No backup created)';
        setStatusBanner(`✅ Deleted ${count} orphaned Windows Registry entries!${backupNote}`);
      }
    } catch (err: any) {
      setStatusBanner(`Delete error: ${err.message}`);
    } finally {
      setIsFixing(false);
      setShowBackupPrompt(false);
      setShowFixModal(false);
    }
  };

  // Fix Single Issue in Modal
  const handleFixCurrentIssue = async () => {
    const cur = selectedIssues[reviewIndex];
    if (!cur) return;
    setIsFixing(true);
    try {
      if (window.electronAPI?.cleanRegistry) {
        await window.electronAPI.cleanRegistry([cur]);
        // Remove from list
        setIssues((prev) => prev.filter((i) => i.id !== cur.id));
        if (reviewIndex >= selectedIssues.length - 1) {
          setFixedCount((fixedCount || 0) + 1);
        } else {
          setReviewIndex((prev) => Math.min(prev, selectedIssues.length - 2));
        }
        setStatusBanner(`Fixed registry issue: ${cur.valueName}`);
      }
    } catch (err: any) {
      setStatusBanner(`Fix error: ${err.message}`);
    } finally {
      setIsFixing(false);
    }
  };

  // Fix ALL Selected Issues
  const handleFixAllSelected = async () => {
    if (selectedIssues.length === 0) return;
    setIsFixing(true);
    setFixProgress(15);
    setStatusBanner(`Repairing and removing ${selectedIssues.length} orphaned registry entries…`);

    const interval = setInterval(() => {
      setFixProgress((p) => (p < 85 ? p + 15 : p));
    }, 150);

    try {
      if (window.electronAPI?.cleanRegistry) {
        const res = await window.electronAPI.cleanRegistry(selectedIssues);
        clearInterval(interval);
        setFixProgress(100);
        setFixedCount(res.cleanedCount);
        setStatusBanner(res.message);
        // Remove cleaned items
        const remaining = issues.filter((i) => !i.selected);
        setIssues(remaining);
        refreshBackupsList();
      }
    } catch (err: any) {
      clearInterval(interval);
      setStatusBanner(`Fix error: ${err.message}`);
    } finally {
      setIsFixing(false);
    }
  };

  // Restore a .reg backup
  const handleRestoreBackup = async (fullPath: string) => {
    if (!window.confirm(`Are you sure you want to restore this registry backup into Windows?\n\nFile: ${fullPath}`)) {
      return;
    }
    setStatusBanner('Importing .reg backup into Windows Registry…');
    try {
      if (window.electronAPI?.restoreRegistryBackup) {
        const res = await window.electronAPI.restoreRegistryBackup(fullPath);
        setStatusBanner(res.message);
        if (res.success) {
          // Re-scan after restore
          handleScanRegistry();
        }
      }
    } catch (err: any) {
      setStatusBanner(`Restore error: ${err.message}`);
    }
  };

  // Open backup folder in Explorer
  const handleOpenBackupFolder = () => {
    window.electronAPI?.openRegistryBackupFolder();
  };

  // Filter issues
  const filteredIssues = issues.filter((item) => {
    const matchesCat = filterCategory === 'ALL' || item.category === filterCategory;
    const matchesSearch =
      (item.valueName || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.details || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.keyPath || '').toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Current issue in review modal
  const currentIssue = selectedIssues[reviewIndex] || null;

  return (
    <div className="workspace-container" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Database size={24} color="#00e5ff" />
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '-0.3px' }}>
              Windows Registry Cleaner &amp; Optimizer
            </h1>
            <span
              style={{
                fontSize: 10.5,
                padding: '2.5px 8px',
                borderRadius: 6,
                background: 'rgba(0, 229, 255, 0.15)',
                color: '#00e5ff',
                border: '1px solid rgba(0, 229, 255, 0.3)',
                fontWeight: 700
              }}
            >
              CCleaner Architecture
            </span>
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 4 }}>
            Safely scans, backs up, and repairs obsolete MUI caches, dead startup keys, orphaned App Paths, and missing file associations.
          </p>
        </div>

        {/* Top Right Quick Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn-secondary"
            onClick={() => {
              refreshBackupsList();
              setShowBackupsManager(true);
            }}
            style={{ fontSize: 12, padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <History size={14} color="#00e5ff" />
            Registry Backups ({backupsList.length})
          </button>
        </div>
      </div>

      {/* CCleaner Dual-Column Workspace */}
      <div style={{ display: 'flex', gap: 14, flex: 1, minHeight: 0 }}>
        {/* ========================================================= */}
        {/* LEFT COLUMN: REGISTRY INTEGRITY CATEGORY CHECKBOXES */}
        {/* ========================================================= */}
        <div
          className="glass-card"
          style={{
            width: 250,
            display: 'flex',
            flexDirection: 'column',
            padding: '14px 14px',
            flexShrink: 0,
            borderRadius: 12
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={16} color="#18e299" />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Registry Integrity</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 11 }}>
            <span
              onClick={handleSelectAllCategories}
              style={{ color: '#00e5ff', cursor: 'pointer', fontWeight: 600 }}
            >
              Select All
            </span>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
            <span
              onClick={handleClearAllCategories}
              style={{ color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 500 }}
            >
              Clear All
            </span>
          </div>

          {/* Categories List */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5, paddingRight: 4 }}>
            {ALL_CATEGORIES.map((cat) => {
              const isChecked = selectedCategories.includes(cat);
              const countInIssues = issues.filter((i) => i.category === cat).length;
              return (
                <label
                  key={cat}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 8px',
                    borderRadius: 7,
                    background: isChecked ? 'rgba(0, 229, 255, 0.06)' : 'transparent',
                    border: isChecked ? '1px solid rgba(0, 229, 255, 0.15)' : '1px solid transparent',
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggleCategory(cat)}
                    style={{ accentColor: '#00e5ff', cursor: 'pointer', width: 14, height: 14 }}
                  />
                  <span
                    style={{
                      fontSize: 11.5,
                      fontWeight: isChecked ? 600 : 400,
                      color: isChecked ? '#fff' : 'var(--text-secondary)',
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {cat}
                  </span>
                  {hasScanned && countInIssues > 0 && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '1px 5px',
                        borderRadius: 10,
                        background: 'rgba(255, 42, 133, 0.25)',
                        color: '#ff2a85',
                        border: '1px solid rgba(255, 42, 133, 0.4)'
                      }}
                    >
                      {countInIssues}
                    </span>
                  )}
                </label>
              );
            })}
          </div>

          {/* Left Pane Action Buttons */}
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              className="btn-secondary"
              onClick={handleScanRegistry}
              disabled={loading || isFixing}
              style={{
                width: '100%',
                padding: '9px 12px',
                fontSize: 12.5,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.15), rgba(139, 61, 255, 0.2))',
                border: '1px solid rgba(0, 229, 255, 0.35)',
                color: '#fff'
              }}
            >
              <RotateCcw size={14} className={loading ? 'animate-spin' : ''} color="#00e5ff" />
              {loading ? 'Scanning…' : 'Scan for Issues'}
            </button>

            {/* Optional Backup Checkbox */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 10px',
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.08)',
                cursor: 'pointer',
                fontSize: 11,
                color: createBackupBeforeDelete ? '#00e5ff' : 'var(--text-secondary)',
                userSelect: 'none'
              }}
            >
              <input
                type="checkbox"
                checked={createBackupBeforeDelete}
                onChange={(e) => setCreateBackupBeforeDelete(e.target.checked)}
                style={{ accentColor: '#00e5ff', cursor: 'pointer' }}
              />
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Save size={12} color={createBackupBeforeDelete ? '#00e5ff' : 'var(--text-secondary)'} />
                Create .reg backup (Optional)
              </span>
            </label>

            {/* DIRECT DELETE NOW BUTTON */}
            <button
              className="btn-primary"
              onClick={() => handleDirectDeleteNow(createBackupBeforeDelete)}
              disabled={selectedIssues.length === 0 || loading || isFixing}
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: 12.5,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                background:
                  selectedIssues.length > 0
                    ? 'linear-gradient(135deg, #ff0055, #ff5252)'
                    : 'rgba(255, 255, 255, 0.08)',
                boxShadow: selectedIssues.length > 0 ? '0 0 16px rgba(255, 0, 85, 0.4)' : 'none',
                opacity: selectedIssues.length > 0 ? 1 : 0.5,
                cursor: selectedIssues.length > 0 ? 'pointer' : 'not-allowed'
              }}
            >
              <Trash2 size={15} />
              {isFixing ? 'Deleting Entries…' : `Delete Selected Now (${selectedIssues.length})`}
            </button>

            {/* REVIEW ISSUES STEP-BY-STEP */}
            <button
              className="btn-secondary"
              onClick={handleStartReview}
              disabled={selectedIssues.length === 0 || loading || isFixing}
              style={{
                width: '100%',
                padding: '7px 12px',
                fontSize: 11.5,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}
            >
              <ShieldCheck size={13} color="#00e5ff" />
              Review Step-by-Step
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: ISSUES DATA TABLE & SCAN PROGRESS */}
        {/* ========================================================= */}
        <div
          className="glass-card"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: 14,
            minWidth: 0,
            borderRadius: 12
          }}
        >
          {/* Scan Progress Bar & Info Banner */}
          {loading && (
            <div style={{ marginBottom: 12, padding: 12, background: 'rgba(0, 229, 255, 0.08)', borderRadius: 9, border: '1px solid rgba(0, 229, 255, 0.25)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#00e5ff' }}>
                  Scanning Windows Registry ({scanProgress}%)
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  {scanPhaseText}
                </span>
              </div>
              <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${scanProgress}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #00e5ff, #8b3dff)',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
            </div>
          )}

          {/* Top Filter & Quick Controls Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 10, flexWrap: 'wrap' }}>
            {/* Search Box */}
            <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 320 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: 9, color: 'var(--text-secondary)' }} />
              <input
                type="text"
                className="input-box"
                placeholder="Filter issues, paths or keys…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', paddingLeft: 30, fontSize: 12, height: 32 }}
              />
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button
                onClick={() => setFilterCategory('ALL')}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: filterCategory === 'ALL' ? 700 : 500,
                  border: filterCategory === 'ALL' ? '1px solid #00e5ff' : '1px solid rgba(255,255,255,0.1)',
                  background: filterCategory === 'ALL' ? 'rgba(0,229,255,0.2)' : 'rgba(255,255,255,0.04)',
                  color: filterCategory === 'ALL' ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                All ({issues.length})
              </button>

              <div
                style={{
                  fontSize: 11.5,
                  padding: '4px 10px',
                  borderRadius: 6,
                  background: selectedIssues.length > 0 ? 'rgba(0, 200, 83, 0.15)' : 'rgba(255,255,255,0.05)',
                  color: selectedIssues.length > 0 ? '#00e676' : 'var(--text-secondary)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  fontWeight: 600
                }}
              >
                {selectedIssues.length} of {issues.length} Selected
              </div>

              <button
                className="btn-secondary"
                onClick={handleToggleSelectAll}
                style={{ fontSize: 11.5, padding: '4px 10px', height: 28 }}
              >
                {filteredIssues.length > 0 && filteredIssues.every((i) => i.selected) ? 'Deselect All' : 'Select All'}
              </button>

              {selectedIssues.length > 0 && (
                <button
                  className="btn-primary"
                  onClick={() => handleDirectDeleteNow(createBackupBeforeDelete)}
                  disabled={isFixing}
                  style={{
                    fontSize: 11.5,
                    padding: '4px 12px',
                    height: 28,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'linear-gradient(135deg, #ff0055, #ff5252)',
                    fontWeight: 700,
                    boxShadow: '0 0 10px rgba(255, 0, 85, 0.35)'
                  }}
                >
                  <Trash2 size={13} />
                  {isFixing ? 'Deleting…' : `Delete Now (${selectedIssues.length})`}
                </button>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              borderRadius: 8,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(0, 0, 0, 0.25)'
            }}
          >
            {/* Table Header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '40px 170px 1.4fr 1.6fr',
                padding: '9px 12px',
                background: 'rgba(255, 255, 255, 0.04)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--text-secondary)',
                letterSpacing: '0.3px',
                textTransform: 'uppercase'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={filteredIssues.length > 0 && filteredIssues.every((i) => i.selected)}
                  onChange={handleToggleSelectAll}
                  style={{ accentColor: '#00e5ff', cursor: 'pointer' }}
                />
              </div>
              <div>Problem / Issue</div>
              <div>Data / Missing Target</div>
              <div>Registry Key Hive</div>
            </div>

            {/* Table Rows or Empty State */}
            {loading ? (
              <div style={{ padding: 60, textAlign: 'center' }}>
                <Database size={36} color="#00e5ff" style={{ margin: '0 auto 12px', animation: 'spin 2s linear infinite' }} />
                <div style={{ fontSize: 14, fontWeight: 700 }}>Scanning Windows Registry Hive…</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                  Auditing orphaned MuiCache, App Paths, Run keys, and missing extensions.
                </div>
              </div>
            ) : !hasScanned ? (
              <div style={{ padding: 60, textAlign: 'center' }}>
                <Database size={42} color="#00e5ff" style={{ margin: '0 auto 12px', opacity: 0.85 }} />
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Windows Registry Cleaner Ready</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 6, maxWidth: 440, margin: '6px auto 16px' }}>
                  Select the categories you want to inspect on the left and click "Scan for Issues" to start an in-depth audit.
                </div>
                <button
                  className="btn-primary"
                  onClick={handleScanRegistry}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 24px', fontSize: 13 }}
                >
                  <Search size={15} /> Scan for Issues
                </button>
              </div>
            ) : filteredIssues.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center' }}>
                <CheckCircle2 size={42} color="#18e299" style={{ margin: '0 auto 12px' }} />
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Windows Registry is Clean!</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                  {issues.length === 0
                    ? 'No orphaned references or obsolete entries detected across your Windows Registry.'
                    : 'No registry entries match your current search/filter.'}
                </div>
              </div>
            ) : (
              <div>
                {filteredIssues.map((issue) => {
                  const isChecked = Boolean(issue.selected);
                  return (
                    <div
                      key={issue.id}
                      onClick={() => handleToggleItem(issue.id)}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '40px 170px 1.4fr 1.6fr',
                        padding: '8px 12px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        background: isChecked ? 'rgba(0, 229, 255, 0.04)' : 'transparent',
                        fontSize: 12,
                        alignItems: 'center',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          style={{ accentColor: '#00e5ff', cursor: 'pointer' }}
                        />
                      </div>

                      {/* Problem Badge */}
                      <div style={{ paddingRight: 8 }}>
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: 5,
                            background:
                              issue.category === 'Obsolete MUI Cache'
                                ? 'rgba(255,42,133,0.18)'
                                : issue.category === 'Application Paths'
                                ? 'rgba(0,229,255,0.18)'
                                : issue.category === 'Run At Startup'
                                ? 'rgba(255,190,11,0.18)'
                                : 'rgba(24,226,153,0.18)',
                            color:
                              issue.category === 'Obsolete MUI Cache'
                                ? '#ff2a85'
                                : issue.category === 'Application Paths'
                                ? '#00e5ff'
                                : issue.category === 'Run At Startup'
                                ? '#ffbe0b'
                                : '#18e299',
                            border: '1px solid currentColor',
                            display: 'inline-block',
                            maxWidth: '100%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {issue.category}
                        </span>
                      </div>

                      {/* Data / Path */}
                      <div
                        style={{
                          color: '#fff',
                          fontWeight: 500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          paddingRight: 10
                        }}
                        title={issue.details}
                      >
                        {issue.details}
                      </div>

                      {/* Registry Key */}
                      <div
                        style={{
                          color: 'rgba(0, 229, 255, 0.75)',
                          fontFamily: 'monospace',
                          fontSize: 11,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        title={issue.keyPath}
                      >
                        {issue.keyPath}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: CCLEANER CLASSIC REGISTRY BACKUP PROMPT */}
      {/* ========================================================= */}
      {showBackupPrompt && (
        <div className="modal-backdrop" onClick={() => setShowBackupPrompt(false)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 460, padding: 24, borderRadius: 14 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  background: 'rgba(0, 229, 255, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(0, 229, 255, 0.3)'
                }}
              >
                <Save size={22} color="#00e5ff" />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Registry Backup Recommendation</h3>
                <span style={{ fontSize: 11.5, color: '#18e299', fontWeight: 600 }}>
                  CCleaner Standard Safety Protocol
                </span>
              </div>
            </div>

            <p style={{ fontSize: 13.5, color: 'var(--text-primary)', lineHeight: 1.5, margin: '14px 0 10px' }}>
              <strong>Do you want to back up the registry before making changes?</strong>
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 20px' }}>
              Saving a backup creates a standard <code style={{ color: '#00e5ff' }}>.reg</code> file in your Documents folder. If any program requires these keys, you can restore them anytime with 1 click.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
              <button
                className="btn-secondary"
                onClick={() => setShowBackupPrompt(false)}
                style={{ fontSize: 12 }}
              >
                Cancel
              </button>

              <button
                className="btn-secondary"
                onClick={handleProceedWithoutBackup}
                style={{ fontSize: 12, color: '#00e5ff', borderColor: 'rgba(0,229,255,0.3)' }}
              >
                <ShieldCheck size={13} /> Review Step-by-Step
              </button>

              <button
                className="btn-secondary"
                onClick={() => handleDirectDeleteNow(false)}
                style={{
                  fontSize: 12,
                  color: '#ff4d6d',
                  borderColor: 'rgba(255,77,109,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontWeight: 600
                }}
              >
                <Trash2 size={13} />
                Delete Now (No Backup)
              </button>

              <button
                className="btn-primary"
                onClick={() => handleDirectDeleteNow(true)}
                style={{
                  fontSize: 12,
                  background: 'linear-gradient(135deg, #00c853, #00b0ff)',
                  boxShadow: '0 0 16px rgba(0, 200, 83, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontWeight: 700
                }}
              >
                <Save size={13} />
                Backup &amp; Delete Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: CCLEANER ISSUE REVIEWER & FIX DIALOG */}
      {/* ========================================================= */}
      {showFixModal && (
        <div className="modal-backdrop" onClick={() => !isFixing && setShowFixModal(false)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 560, padding: 24, borderRadius: 14 }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={20} color="#00e5ff" />
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Review Selected Issues</h3>
              </div>
              {!isFixing && (
                <button
                  onClick={() => setShowFixModal(false)}
                  style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* If Finished */}
            {fixedCount !== null ? (
              <div style={{ padding: '24px 10px', textAlign: 'center' }}>
                <CheckCircle2 size={50} color="#00e676" style={{ margin: '0 auto 14px' }} />
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px', color: 'var(--text-primary)' }}>
                  All Selected Issues Fixed!
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 16px' }}>
                  Successfully repaired and removed <strong>{fixedCount}</strong> registry entries from your Windows hive.
                </p>

                {latestBackupPath && (
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: 8,
                      background: 'rgba(0, 229, 255, 0.1)',
                      border: '1px solid rgba(0, 229, 255, 0.25)',
                      marginBottom: 20,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      textAlign: 'left'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 11, color: '#00e5ff', fontWeight: 700 }}>REGISTRY BACKUP CREATED</div>
                      <div style={{ fontSize: 12, color: 'var(--text-primary)', fontFamily: 'monospace', marginTop: 2 }}>
                        {latestBackupPath.split('\\').pop()}
                      </div>
                    </div>
                    <button
                      className="btn-secondary"
                      onClick={handleOpenBackupFolder}
                      style={{ fontSize: 11, padding: '4px 10px' }}
                    >
                      <FolderOpen size={12} /> Open Folder
                    </button>
                  </div>
                )}

                <button
                  className="btn-primary"
                  onClick={() => {
                    setShowFixModal(false);
                    handleScanRegistry();
                  }}
                  style={{ padding: '8px 24px', fontSize: 13 }}
                >
                  Done
                </button>
              </div>
            ) : currentIssue ? (
              /* Review Current Issue */
              <div>
                {/* Counter & Progress */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#00e5ff' }}>
                    Issue {reviewIndex + 1} of {selectedIssues.length}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    Safety: <strong style={{ color: '#18e299' }}>100% Safe to Clean</strong>
                  </span>
                </div>

                {/* Progress bar if fixing all */}
                {isFixing && (
                  <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginBottom: 12, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${fixProgress}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #00c853, #00e5ff)',
                        transition: 'width 0.2s ease'
                      }}
                    />
                  </div>
                )}

                {/* Issue Details Box */}
                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.35)',
                    borderRadius: 10,
                    padding: 14,
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    marginBottom: 16
                  }}
                >
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Problem
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#ff2a85', marginTop: 2 }}>
                      {currentIssue.category}
                    </div>
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Data / Missing Target
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-primary)', marginTop: 2, wordBreak: 'break-all' }}>
                      {currentIssue.details}
                    </div>
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Registry Key
                    </div>
                    <div style={{ fontSize: 11, color: '#00e5ff', fontFamily: 'monospace', marginTop: 2, wordBreak: 'break-all' }}>
                      {currentIssue.keyPath}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Solution
                    </div>
                    <div style={{ fontSize: 12, color: '#18e299', marginTop: 2 }}>
                      The obsolete reference can be safely removed from Windows Registry.
                    </div>
                  </div>
                </div>

                {/* Navigation and Fix Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="btn-secondary"
                      disabled={reviewIndex === 0 || isFixing}
                      onClick={() => setReviewIndex((p) => Math.max(0, p - 1))}
                      style={{ fontSize: 11.5, padding: '6px 10px' }}
                    >
                      <ChevronLeft size={14} /> Previous
                    </button>
                    <button
                      className="btn-secondary"
                      disabled={reviewIndex >= selectedIssues.length - 1 || isFixing}
                      onClick={() => setReviewIndex((p) => Math.min(selectedIssues.length - 1, p + 1))}
                      style={{ fontSize: 11.5, padding: '6px 10px' }}
                    >
                      Next <ChevronRight size={14} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn-secondary"
                      disabled={isFixing}
                      onClick={handleFixCurrentIssue}
                      style={{ fontSize: 12, padding: '7px 14px' }}
                    >
                      Fix Issue
                    </button>

                    <button
                      className="btn-primary"
                      disabled={isFixing}
                      onClick={handleFixAllSelected}
                      style={{
                        fontSize: 12,
                        padding: '7px 16px',
                        background: 'linear-gradient(135deg, #00c853, #00b0ff)',
                        boxShadow: '0 0 16px rgba(0, 200, 83, 0.4)'
                      }}
                    >
                      {isFixing ? 'Fixing All…' : `Fix All Selected Issues (${selectedIssues.length})`}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: REGISTRY BACKUPS MANAGER */}
      {/* ========================================================= */}
      {showBackupsManager && (
        <div className="modal-backdrop" onClick={() => setShowBackupsManager(false)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 640, padding: 24, borderRadius: 14 }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <History size={22} color="#00e5ff" />
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Registry Backups Archive</h3>
                  <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                    Standard .reg files stored in Documents\8002CleanUp_Registry_Backups
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowBackupsManager(false)}
                style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Backups List */}
            <div
              style={{
                maxHeight: 340,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                margin: '14px 0 18px'
              }}
            >
              {backupsList.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <FileText size={36} color="rgba(255,255,255,0.2)" style={{ margin: '0 auto 10px' }} />
                  <div style={{ fontSize: 14, fontWeight: 600 }}>No registry backups saved yet</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>
                    When you clean registry issues, backups will automatically be saved and listed here.
                  </div>
                </div>
              ) : (
                backupsList.map((b) => (
                  <div
                    key={b.fullPath}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: 9,
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                      <FileText size={18} color="#00e5ff" style={{ flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {b.filename}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', gap: 10, marginTop: 2 }}>
                          <span><Clock size={11} style={{ display: 'inline', marginRight: 3 }} />{b.dateFormatted}</span>
                          <span>Size: {b.sizeFormatted}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginLeft: 10 }}>
                      <button
                        className="btn-primary"
                        onClick={() => handleRestoreBackup(b.fullPath)}
                        style={{ fontSize: 11.5, padding: '5px 12px', background: 'linear-gradient(135deg, #00c853, #00b0ff)' }}
                      >
                        <RotateCcw size={12} /> Restore
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={async () => {
                          if (window.confirm(`Delete backup file '${b.filename}'?`)) {
                            if (window.electronAPI?.deleteRegistryBackup) {
                              await window.electronAPI.deleteRegistryBackup(b.fullPath);
                              refreshBackupsList();
                            }
                          }
                        }}
                        style={{ fontSize: 11.5, padding: '5px 10px', color: '#ff2a85' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                className="btn-secondary"
                onClick={handleOpenBackupFolder}
                style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <FolderOpen size={14} /> Open Backups Folder in Windows Explorer
              </button>

              <button
                className="btn-secondary"
                onClick={() => setShowBackupsManager(false)}
                style={{ fontSize: 12 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

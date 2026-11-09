/**
 * 8002CleanUp Pro — Windows Safety Guard
 * Canonical Path Validation, Critical Process Protection, and URL Stripper
 */

const path = require('path');
const os = require('os');

// Critical Windows System Processes that must NEVER be terminated
const CRITICAL_SYSTEM_PROCESSES = new Set([
  'system',
  'system.exe',
  'idle',
  'smss.exe',
  'csrss.exe',
  'wininit.exe',
  'services.exe',
  'lsass.exe',
  'winlogon.exe',
  'svchost.exe',
  'fontdrvhost.exe',
  'dwm.exe',
  'explorer.exe',
  'taskhostw.exe',
  'sihost.exe',
  'ctfmon.exe',
  'runtimebroker.exe',
  'spoolsv.exe',
  'securityhealthservice.exe',
  'msmpeng.exe'
]);

function isCriticalProcess(pid, processName) {
  const numPid = Number(pid);
  if (!Number.isFinite(numPid) || numPid <= 4) {
    return {
      isCritical: true,
      reason: `PID ${pid} is a core kernel/system process and cannot be terminated.`
    };
  }

  const cleanName = (processName || '').toLowerCase().trim();
  const baseName = (path.win32 ? path.win32.basename(cleanName) : path.basename(cleanName)).split('\\').pop().split('/').pop();

  if (CRITICAL_SYSTEM_PROCESSES.has(cleanName) || CRITICAL_SYSTEM_PROCESSES.has(baseName)) {
    return {
      isCritical: true,
      reason: `${processName} is a critical Windows system process required for system stability.`
    };
  }

  return { isCritical: false };
}

/**
 * Validates whether a file/directory path is strictly within safe junk directories
 * Prevents directory traversal (../) and accidental wiping of system or user roots.
 */
function isSafeCleanTarget(targetPath, env = {}) {
  if (!targetPath || typeof targetPath !== 'string') return false;

  const trimmed = targetPath.trim();
  if (trimmed === 'RECYCLE_BIN') return true;

  const pMod = /^[a-zA-Z]:\\/i.test(trimmed) || /^[a-zA-Z]:\//i.test(trimmed) || (process.platform === 'win32') ? path.win32 : path;
  // Resolve to canonical absolute path and normalize slashes
  const resolved = pMod.resolve(pMod.normalize(trimmed));
  const lowerResolved = resolved.toLowerCase().replace(/\//g, '\\');

  const home = (env.home || os.homedir()).toLowerCase().replace(/\//g, '\\');
  const tmp = (env.tmp || os.tmpdir()).toLowerCase().replace(/\//g, '\\');
  const localAppData = (env.localAppData || process.env.LOCALAPPDATA || path.win32.join(os.homedir(), 'AppData', 'Local')).toLowerCase().replace(/\//g, '\\');
  const appData = (env.appData || process.env.APPDATA || path.win32.join(os.homedir(), 'AppData', 'Roaming')).toLowerCase().replace(/\//g, '\\');

  // 1. NEVER allow drive roots or core system root directories
  const dangerousRoots = [
    'c:\\',
    'd:\\',
    'e:\\',
    '/',
    'c:\\windows',
    'c:\\windows\\system32',
    'c:\\windows\\syswow64',
    'c:\\program files',
    'c:\\program files (x86)',
    'c:\\programdata',
    'c:\\users',
    home
  ];

  for (const root of dangerousRoots) {
    if (lowerResolved === root.toLowerCase() || lowerResolved === root.toLowerCase() + '\\') {
      return false;
    }
  }

  // 2. NEVER allow user personal document folders
  const userSpecialFolders = [
    pMod.join(home, 'desktop'),
    pMod.join(home, 'documents'),
    pMod.join(home, 'downloads'),
    pMod.join(home, 'pictures'),
    pMod.join(home, 'videos'),
    pMod.join(home, 'music'),
    pMod.join(home, 'onedrive')
  ];

  for (const uf of userSpecialFolders) {
    if (lowerResolved === uf.toLowerCase() || lowerResolved.startsWith(uf.toLowerCase() + '\\')) {
      return false;
    }
  }

  // 3. MUST match an approved safe cleanup zone
  const safePrefixes = [
    tmp,
    'c:\\windows\\temp',
    'c:\\windows\\prefetch',
    'c:\\windows\\softwaredistribution\\download',
    pMod.join(localAppData, 'temp'),
    pMod.join(localAppData, 'crashdumps'),
    pMod.join(localAppData, 'd3dscache'),
    pMod.join(localAppData, 'microsoft', 'windows', 'explorer'),
    pMod.join(localAppData, 'microsoft', 'windows', 'wer'),
    pMod.join(appData, 'npm-cache'),
    pMod.join(appData, 'code', 'cacheddata'),
    pMod.join(appData, 'logs'),
    pMod.join(home, '.gradle', 'caches'),
    pMod.join(home, '.cargo', 'registry', 'cache'),
    pMod.join(localAppData, 'pip', 'cache')
  ];

  for (const prefix of safePrefixes) {
    const pLower = prefix.toLowerCase();
    if (lowerResolved === pLower || lowerResolved.startsWith(pLower + '\\') || lowerResolved.startsWith(pLower + '/')) {
      return true;
    }
  }

  // 4. Safe browser cache subfolders (e.g. Chrome/Edge/Brave/Firefox profile caches)
  const isBrowserCache =
    (lowerResolved.includes('\\google\\chrome\\user data') ||
      lowerResolved.includes('\\microsoft\\edge\\user data') ||
      lowerResolved.includes('\\bravesoftware\\brave-browser\\user data') ||
      lowerResolved.includes('\\mozilla\\firefox\\profiles') ||
      lowerResolved.includes('\\opera software\\') ||
      lowerResolved.includes('\\vivaldi\\user data')) &&
    (lowerResolved.endsWith('\\cache') ||
      lowerResolved.includes('\\cache\\') ||
      lowerResolved.endsWith('\\code cache') ||
      lowerResolved.includes('\\code cache\\') ||
      lowerResolved.endsWith('\\gpucache') ||
      lowerResolved.includes('\\gpucache\\') ||
      lowerResolved.endsWith('\\shadercache') ||
      lowerResolved.includes('\\shadercache\\') ||
      lowerResolved.endsWith('\\dawngraphitecache') ||
      lowerResolved.includes('\\dawngraphitecache\\') ||
      lowerResolved.endsWith('\\crashpad') ||
      lowerResolved.includes('\\crashpad\\'));

  if (isBrowserCache) {
    return true;
  }

  // Fallback check: if it's inside tmpdir
  if (lowerResolved.startsWith(tmp)) {
    return true;
  }

  return false;
}

// Known tracking parameters for URL Tracking Removal
const TRACKING_PARAMS = new Set([
  'fbclid',
  'gclid',
  'dclid',
  'msclkid',
  'twclid',
  'ttclid',
  'mc_cid',
  'mc_eid',
  '_ga',
  '_gl',
  'yclid',
  'igshid',
  'vero_id',
  'wickedid',
  'sc_channel'
]);

function cleanTrackingURLString(rawInput) {
  const trimmed = (rawInput || '').trim();
  try {
    const u = new URL(trimmed);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      return { cleanedURL: trimmed, removedParams: [] };
    }
    const removed = [];
    const keys = Array.from(u.searchParams.keys());
    for (const key of keys) {
      const lower = key.toLowerCase();
      if (lower.startsWith('utm_') || TRACKING_PARAMS.has(lower)) {
        removed.push(key);
        u.searchParams.delete(key);
      }
    }
    return { cleanedURL: u.toString(), removedParams: removed };
  } catch (_e) {
    return { cleanedURL: trimmed, removedParams: [] };
  }
}

const HOSTS_START_TAG = '# --- 8002CleanUp Shield START ---';
const HOSTS_END_TAG = '# --- 8002CleanUp Shield END ---';

function generateHostsShieldContent(existingContent, adDomains) {
  const regex = new RegExp(`\\r?\\n?${HOSTS_START_TAG}[\\s\\S]*?${HOSTS_END_TAG}\\r?\\n?`, 'g');
  const baseContent = (existingContent || '').replace(regex, '\n').trim();

  const shieldEntries = [
    HOSTS_START_TAG,
    '# 8002CleanUp Pro Privacy & Tracker Sinkhole (0.0.0.0)',
    ...adDomains.map((d) => `0.0.0.0 ${d}`),
    HOSTS_END_TAG
  ].join('\r\n');

  return baseContent ? baseContent + '\r\n\r\n' + shieldEntries + '\r\n' : shieldEntries + '\r\n';
}

function removeHostsShieldContent(existingContent) {
  const regex = new RegExp(`\\r?\\n?${HOSTS_START_TAG}[\\s\\S]*?${HOSTS_END_TAG}\\r?\\n?`, 'g');
  return (existingContent || '').replace(regex, '\n').trim() + '\r\n';
}

module.exports = {
  isCriticalProcess,
  isSafeCleanTarget,
  cleanTrackingURLString,
  generateHostsShieldContent,
  removeHostsShieldContent,
  HOSTS_START_TAG,
  HOSTS_END_TAG
};

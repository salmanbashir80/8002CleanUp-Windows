const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getSystemTelemetry: () => ipcRenderer.invoke('get-system-telemetry'),
  quitProcess: (pid, name) => ipcRenderer.invoke('quit-process', { pid, name }),
  scanJunk: () => ipcRenderer.invoke('scan-junk'),
  cleanItems: (paths, dryRun) => ipcRenderer.invoke('clean-items', { paths, dryRun }),
  optimizeRam: () => ipcRenderer.invoke('optimize-ram'),
  flushDns: () => ipcRenderer.invoke('flush-dns'),
  toggleGameTurbo: (enable) => ipcRenderer.invoke('toggle-game-turbo', { enable }),
  getInstalledApps: () => ipcRenderer.invoke('get-installed-apps'),
  uninstallApp: (uninstallString, name) => ipcRenderer.invoke('uninstall-app', { uninstallString, name }),
  getStartupApps: () => ipcRenderer.invoke('get-startup-apps'),
  scanLargeFiles: (minSizeMB) => ipcRenderer.invoke('scan-large-files', { minSizeMB }),
  selectFileForShred: () => ipcRenderer.invoke('select-file-for-shred'),
  shredFile: (filePath) => ipcRenderer.invoke('shred-file', { filePath }),
  showItemInFolder: (fullPath) => ipcRenderer.invoke('show-item-in-folder', { fullPath }),
  scanWebsiteTrust: (payload) => ipcRenderer.invoke('scan-website-trust', payload),
  testAiKey: (payload) => ipcRenderer.invoke('test-ai-key', payload),
  cleanTrackingUrl: (url) => ipcRenderer.invoke('clean-tracking-url', { url }),
  pingDns: (provider) => ipcRenderer.invoke('ping-dns', { provider }),
  applyDns: (provider) => ipcRenderer.invoke('apply-dns', { provider }),
  restoreDns: () => ipcRenderer.invoke('restore-dns'),
  openExternal: (url) => ipcRenderer.invoke('open-external', { url }),
  onClipboardUrlCleaned: (callback) => {
    const listener = (_event, data) => callback(data);
    ipcRenderer.on('clipboard-url-cleaned', listener);
    return () => ipcRenderer.removeListener('clipboard-url-cleaned', listener);
  },
  onCleanProgress: (callback) => {
    const listener = (_event, data) => callback(data);
    ipcRenderer.on('clean-progress', listener);
    return () => ipcRenderer.removeListener('clean-progress', listener);
  }
});

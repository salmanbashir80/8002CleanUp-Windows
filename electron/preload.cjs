const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getSystemTelemetry: () => ipcRenderer.invoke('get-system-telemetry'),
  quitProcess: (pid, name) => ipcRenderer.invoke('quit-process', { pid, name }),
  scanJunk: () => ipcRenderer.invoke('scan-junk'),
  cleanItems: (paths, dryRun) => ipcRenderer.invoke('clean-items', { paths, dryRun }),
  optimizeRam: () => ipcRenderer.invoke('optimize-ram'),
  scanWebsiteTrust: (payload) => ipcRenderer.invoke('scan-website-trust', payload),
  testAiKey: (payload) => ipcRenderer.invoke('test-ai-key', payload),
  cleanTrackingUrl: (url) => ipcRenderer.invoke('clean-tracking-url', { url }),
  pingDns: (provider) => ipcRenderer.invoke('ping-dns', { provider }),
  applyDns: (provider) => ipcRenderer.invoke('apply-dns', { provider }),
  restoreDns: () => ipcRenderer.invoke('restore-dns'),
  shredFile: (filePath) => ipcRenderer.invoke('shred-file', { filePath }),
  openExternal: (url) => ipcRenderer.invoke('open-external', { url }),
  onClipboardUrlCleaned: (callback) => {
    const listener = (_event, data) => callback(data);
    ipcRenderer.on('clipboard-url-cleaned', listener);
    return () => ipcRenderer.removeListener('clipboard-url-cleaned', listener);
  }
});

/**
 * 8002CleanUp Pro — Customer Update Manager
 * 
 * Provides secure, verified, channel-specific update detection, cryptographic
 * integrity validation (SHA-256 verification against release checksums), safe staging,
 * and transparent manual/prompted installation while preserving all customer licenses,
 * DPAPI/secret vaults, and user configuration.
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');
const { URL } = require('url');

// Release channel configuration
const DEFAULT_CHANNEL = 'windows-x64';
const DEFAULT_REPO = 'salmanbashir80/8002CleanUp-Windows';

/**
 * Robust SemVer comparison.
 * Returns:
 *   1 if v1 > v2
 *  -1 if v1 < v2
 *   0 if v1 == v2
 */
function semverCompare(v1, v2) {
  const parse = (v) => {
    if (!v || typeof v !== 'string') return [0, 0, 0, ''];
    const clean = v.trim().replace(/^v/i, '');
    const [numPart, ...preParts] = clean.split('-');
    const pre = preParts.join('-');
    const nums = numPart.split('.').map((n) => parseInt(n, 10) || 0);
    while (nums.length < 3) nums.push(0);
    return [nums[0], nums[1], nums[2], pre];
  };

  const [maj1, min1, pat1, pre1] = parse(v1);
  const [maj2, min2, pat2, pre2] = parse(v2);

  if (maj1 !== maj2) return maj1 > maj2 ? 1 : -1;
  if (min1 !== min2) return min1 > min2 ? 1 : -1;
  if (pat1 !== pat2) return pat1 > pat2 ? 1 : -1;

  // Prerelease comparison: non-prerelease > prerelease
  if (!pre1 && pre2) return 1;
  if (pre1 && !pre2) return -1;
  if (pre1 && pre2) {
    if (pre1 === pre2) return 0;
    return pre1.localeCompare(pre2);
  }

  return 0;
}

/**
 * Follows HTTPS/HTTP redirects and returns stream or buffer.
 */
function fetchWithRedirects(urlString, options = {}, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects < 0) {
      return reject(new Error('Too many redirects while downloading update asset'));
    }

    const parsedUrl = new URL(urlString);
    const client = parsedUrl.protocol === 'http:' ? http : https;

    const requestOptions = {
      ...options,
      headers: {
        'User-Agent': '8002CleanUp-Pro-UpdateClient/2.5.1',
        Accept: 'application/vnd.github.v3+json, application/octet-stream, */*',
        ...(options.headers || {})
      }
    };

    const req = client.get(urlString, requestOptions, (res) => {
      // Follow 301, 302, 307, 308 redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume(); // Discard data
        const nextUrl = new URL(res.headers.location, urlString).href;
        return resolve(fetchWithRedirects(nextUrl, options, maxRedirects - 1));
      }

      if (res.statusCode < 200 || res.statusCode >= 300) {
        res.resume();
        return reject(new Error(`Server responded with HTTP ${res.statusCode}: ${res.statusMessage}`));
      }

      resolve(res);
    });

    req.on('error', reject);
    req.setTimeout(options.timeout || 30000, () => {
      req.destroy();
      reject(new Error('Update network request timed out after 30 seconds'));
    });
  });
}

/**
 * Downloads a URL into memory buffer (for JSON or small text files).
 */
async function fetchBuffer(urlString, options = {}) {
  const stream = await fetchWithRedirects(urlString, options);
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

class UpdateManager {
  constructor(app, options = {}) {
    this.app = app;
    this.currentVersion = options.currentVersion || (app && app.getVersion ? app.getVersion() : '2.5.1');
    this.repo = options.repo || DEFAULT_REPO;
    this.channel = options.channel || DEFAULT_CHANNEL;
    this.checkIntervalMs = options.checkIntervalMs || 4 * 60 * 60 * 1000; // 4 hours

    // Temporary staging directory for downloaded installers
    const baseTemp = (app && app.getPath) ? app.getPath('temp') : (process.env.TEMP || '/tmp');
    this.stagingDir = path.join(baseTemp, '8002CleanUp-Updates', 'staging');

    this.state = 'idle'; // idle | checking | update_available | up_to_date | downloading | verifying | ready_to_install | failed
    this.updateInfo = null;
    this.verifiedInstallerPath = null;
    this.lastCheckedAt = null;
    this.periodicTimer = null;
    this.eventListeners = {
      status: [],
      progress: [],
      error: []
    };
  }

  on(event, callback) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].push(callback);
    }
  }

  emit(event, data) {
    if (this.eventListeners[event]) {
      for (const cb of this.eventListeners[event]) {
        try {
          cb(data);
        } catch (_) {}
      }
    }
  }

  getStatus() {
    return {
      state: this.state,
      currentVersion: this.currentVersion,
      channel: this.channel,
      lastCheckedAt: this.lastCheckedAt,
      updateInfo: this.updateInfo,
      verifiedInstallerReady: !!this.verifiedInstallerPath
    };
  }

  /**
   * Queries public GitHub releases API for latest published release.
   * Drafts and pre-releases are not served by /releases/latest.
   */
  async checkForUpdates({ manual = false } = {}) {
    this.state = 'checking';
    this.emit('status', this.getStatus());

    try {
      const apiUrl = `https://api.github.com/repos/${this.repo}/releases/latest`;
      const rawData = await fetchBuffer(apiUrl, { timeout: 15000 });
      const release = JSON.parse(rawData.toString('utf8'));

      this.lastCheckedAt = new Date().toISOString();

      if (!release || !release.tag_name) {
        throw new Error('Invalid release metadata format received from server');
      }

      const remoteTag = release.tag_name;
      const remoteVersion = remoteTag.replace(/^v/i, '');

      // Check if candidate version is strictly newer
      const isNewer = semverCompare(remoteVersion, this.currentVersion) > 0;

      if (!isNewer) {
        this.state = 'up_to_date';
        this.updateInfo = null;
        this.emit('status', this.getStatus());
        return {
          updateAvailable: false,
          currentVersion: this.currentVersion,
          latestVersion: remoteVersion,
          manual,
          message: `8002CleanUp Pro v${this.currentVersion} is currently the newest version available.`
        };
      }

      // Find Windows release assets
      const assets = Array.isArray(release.assets) ? release.assets : [];
      const setupExe = assets.find((a) => a.name && a.name.endsWith('.exe') && /setup/i.test(a.name));
      const portableExe = assets.find((a) => a.name && a.name.endsWith('.exe') && /portable/i.test(a.name));
      const genericExe = assets.find((a) => a.name && a.name.endsWith('.exe'));
      const checksumsAsset = assets.find((a) => a.name && /sha256sums\.txt$/i.test(a.name));

      const primaryAsset = setupExe || genericExe || portableExe;

      if (!primaryAsset) {
        throw new Error(`Release v${remoteVersion} found, but no Windows (.exe) installation asset is published.`);
      }

      this.updateInfo = {
        updateAvailable: true,
        currentVersion: this.currentVersion,
        latestVersion: remoteVersion,
        releaseName: release.name || `8002CleanUp Pro v${remoteVersion}`,
        releaseNotes: release.body || 'Performance improvements, security enhancements, and stability updates.',
        publishedAt: release.published_at,
        htmlUrl: release.html_url,
        assetName: primaryAsset.name,
        downloadSize: primaryAsset.size,
        downloadUrl: primaryAsset.browser_download_url,
        checksumUrl: checksumsAsset ? checksumsAsset.browser_download_url : null,
        setupAssetName: setupExe ? setupExe.name : null,
        portableAssetName: portableExe ? portableExe.name : null,
        manual
      };

      this.state = 'update_available';
      this.emit('status', this.getStatus());

      return this.updateInfo;
    } catch (err) {
      this.state = 'failed';
      this.emit('error', { error: err.message });
      this.emit('status', this.getStatus());
      return {
        updateAvailable: false,
        error: err.message,
        currentVersion: this.currentVersion,
        manual
      };
    }
  }

  /**
   * Downloads the primary release asset to a staging directory, calculates its
   * SHA-256 hash streamingly, and validates against the release SHA256SUMS.txt.
   */
  async downloadAndVerifyUpdate(onProgressCallback = null) {
    if (!this.updateInfo || !this.updateInfo.downloadUrl) {
      throw new Error('No verified update is currently pending download.');
    }

    this.state = 'downloading';
    this.emit('status', this.getStatus());

    // Prepare clean staging directory
    try {
      if (fs.existsSync(this.stagingDir)) {
        fs.rmSync(this.stagingDir, { recursive: true, force: true });
      }
      fs.mkdirSync(this.stagingDir, { recursive: true });
    } catch (err) {
      this.state = 'failed';
      throw new Error(`Failed to create update staging directory: ${err.message}`);
    }

    const targetFileName = this.updateInfo.assetName;
    const targetFilePath = path.join(this.stagingDir, targetFileName);

    let expectedSha256 = null;

    // 1. If checksumUrl is present, fetch and parse SHA256SUMS.txt
    if (this.updateInfo.checksumUrl) {
      try {
        const checksumData = await fetchBuffer(this.updateInfo.checksumUrl, { timeout: 15000 });
        const lines = checksumData.toString('utf8').split(/\r?\n/);
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          const match = trimmed.match(/^([a-fA-F0-9]{64})\s+[\*]?(.+)$/);
          if (match) {
            const hash = match[1].toLowerCase();
            const fileName = path.basename(match[2].trim());
            if (fileName.toLowerCase() === targetFileName.toLowerCase()) {
              expectedSha256 = hash;
              break;
            }
          }
        }
      } catch (err) {
        console.warn('[UpdateManager] Could not download SHA256SUMS.txt:', err.message);
      }
    }

    // 2. Stream download to target file while computing SHA-256
    try {
      const responseStream = await fetchWithRedirects(this.updateInfo.downloadUrl, { timeout: 60000 });
      const totalBytes = parseInt(responseStream.headers['content-length'] || this.updateInfo.downloadSize || 0, 10);
      let downloadedBytes = 0;

      const fileWriteStream = fs.createWriteStream(targetFilePath);
      const hasher = crypto.createHash('sha256');

      await new Promise((resolve, reject) => {
        responseStream.on('data', (chunk) => {
          downloadedBytes += chunk.length;
          hasher.update(chunk);
          fileWriteStream.write(chunk);

          const percent = totalBytes > 0 ? Math.round((downloadedBytes / totalBytes) * 100) : 0;
          const progressPayload = {
            transferred: downloadedBytes,
            total: totalBytes,
            percent,
            assetName: targetFileName
          };

          this.emit('progress', progressPayload);
          if (onProgressCallback) {
            try {
              onProgressCallback(progressPayload);
            } catch (_) {}
          }
        });

        responseStream.on('end', () => {
          fileWriteStream.end();
        });

        fileWriteStream.on('finish', resolve);
        fileWriteStream.on('error', (err) => {
          fileWriteStream.destroy();
          reject(err);
        });
        responseStream.on('error', reject);
      });

      this.state = 'verifying';
      this.emit('status', this.getStatus());

      const computedSha256 = hasher.digest('hex').toLowerCase();

      // 3. Cryptographic integrity check
      if (expectedSha256) {
        if (computedSha256 !== expectedSha256) {
          // TAMPER DETECTED: Remove binary immediately!
          try {
            fs.unlinkSync(targetFilePath);
          } catch (_) {}
          this.state = 'failed';
          const violation = `INTEGRITY_VERIFICATION_FAILED: Downloaded package hash (${computedSha256}) does not match official release checksum (${expectedSha256}). Update discarded.`;
          this.emit('error', { error: violation });
          this.emit('status', this.getStatus());
          throw new Error(violation);
        }
      }

      this.state = 'ready_to_install';
      this.verifiedInstallerPath = targetFilePath;
      this.emit('status', this.getStatus());

      return {
        success: true,
        verifiedInstallerPath: targetFilePath,
        computedSha256,
        expectedSha256: expectedSha256 || 'None provided by server',
        verified: !!expectedSha256
      };
    } catch (err) {
      // Clean up failed staging download
      try {
        if (fs.existsSync(targetFilePath)) fs.unlinkSync(targetFilePath);
      } catch (_) {}
      this.state = 'failed';
      this.emit('error', { error: err.message });
      this.emit('status', this.getStatus());
      throw err;
    }
  }

  /**
   * Launches the verified installer executable and gracefully terminates the running app.
   * Because Windows binary is self-distributed/unsigned, launching with user visibility
   * allows the standard Windows UAC / SmartScreen elevation prompt to proceed cleanly.
   * Customer data & DPAPI license vault in %APPDATA%\8002CleanUp-Windows remain untouched.
   */
  installUpdate() {
    if (this.state !== 'ready_to_install' || !this.verifiedInstallerPath) {
      throw new Error('No verified update is ready to install.');
    }

    if (!fs.existsSync(this.verifiedInstallerPath)) {
      this.state = 'failed';
      throw new Error('Verified installer binary was not found on disk. Please re-download.');
    }

    this.state = 'installing';
    this.emit('status', this.getStatus());

    const installerPath = this.verifiedInstallerPath;

    // Spawn detached installer process
    try {
      const child = spawn(installerPath, [], {
        detached: true,
        stdio: 'ignore'
      });
      child.unref();

      // Gracefully quit application after spawning installer
      setTimeout(() => {
        if (this.app && this.app.quit) {
          this.app.quit();
        } else {
          process.exit(0);
        }
      }, 1500);

      return { success: true, message: 'Installer launched successfully. Application is exiting.' };
    } catch (err) {
      this.state = 'failed';
      this.emit('error', { error: `Failed to launch installer: ${err.message}` });
      this.emit('status', this.getStatus());
      throw err;
    }
  }

  /**
   * Rollback / abort: Cleans up any staged downloads and reverts state to idle.
   */
  cancelUpdate() {
    try {
      if (fs.existsSync(this.stagingDir)) {
        fs.rmSync(this.stagingDir, { recursive: true, force: true });
      }
    } catch (_) {}

    this.verifiedInstallerPath = null;
    this.state = 'idle';
    this.emit('status', this.getStatus());
    return { success: true };
  }

  /**
   * Starts startup delayed check (10s) and recurring periodic checks (4h).
   */
  startPeriodicChecks(mainWindowGetter) {
    if (this.periodicTimer) clearInterval(this.periodicTimer);

    // Initial delayed startup check
    setTimeout(async () => {
      try {
        const result = await this.checkForUpdates({ manual: false });
        if (result && result.updateAvailable) {
          const win = typeof mainWindowGetter === 'function' ? mainWindowGetter() : null;
          if (win && win.webContents) {
            win.webContents.send('update-available', result);
          }
        }
      } catch (_) {}
    }, 10000);

    // Recurring interval
    this.periodicTimer = setInterval(async () => {
      try {
        const result = await this.checkForUpdates({ manual: false });
        if (result && result.updateAvailable) {
          const win = typeof mainWindowGetter === 'function' ? mainWindowGetter() : null;
          if (win && win.webContents) {
            win.webContents.send('update-available', result);
          }
        }
      } catch (_) {}
    }, this.checkIntervalMs);
  }

  stopPeriodicChecks() {
    if (this.periodicTimer) {
      clearInterval(this.periodicTimer);
      this.periodicTimer = null;
    }
  }
}

module.exports = {
  UpdateManager,
  semverCompare,
  fetchWithRedirects,
  fetchBuffer
};

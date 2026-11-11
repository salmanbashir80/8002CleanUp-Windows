const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const https = require('node:https');
const { EventEmitter } = require('node:events');
const { Readable } = require('node:stream');
const crypto = require('node:crypto');
const { UpdateManager } = require('../electron/updateManager.cjs');

// Replace only external HTTPS I/O. Production detection, download, persistence,
// hash checking and installer launch guards execute unchanged.
test('production updater rejects unpublished metadata and unverifiable installers', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), '8002-security-'));
  const originalGet = https.get;
  const payload = Buffer.from('synthetic installer, never executed');
  const hash = crypto.createHash('sha256').update(payload).digest('hex');
  const name = '8002CleanUp-Windows-Setup-v2.5.5.exe';
  const base = 'https://github.com/salmanbashir80/8002CleanUp-Windows/releases/download/v2.5.5/';
  let metadata = {
    tag_name: 'v2.5.5', draft: false, prerelease: false,
    published_at: '2026-11-11T00:00:00Z',
    html_url: 'https://github.com/salmanbashir80/8002CleanUp-Windows/releases/tag/v2.5.5',
    assets: [
      { name, size: payload.length, browser_download_url: base + name },
      { name: 'SHA256SUMS.txt', browser_download_url: base + 'SHA256SUMS.txt' }
    ]
  };
  let checksumBody = `${hash}  ${name}\n`;
  let checksumStatus = 200;
  https.get = (url, options, callback) => {
    assert.ok(url.startsWith('https://api.github.com/repos/salmanbashir80/8002CleanUp-Windows/releases/latest') || url.startsWith(base));
    const req = new EventEmitter();
    req.setTimeout = () => req;
    req.destroy = () => {};
    process.nextTick(() => {
      const isMetadata = url.includes('/releases/latest');
      const isChecksum = url.endsWith('SHA256SUMS.txt');
      const body = isMetadata ? Buffer.from(JSON.stringify(metadata)) : isChecksum ? Buffer.from(checksumBody) : payload;
      const response = Readable.from([body]);
      response.statusCode = isChecksum ? checksumStatus : 200;
      response.headers = { 'content-length': String(body.length) };
      response.statusMessage = 'fixture';
      callback(response);
    });
    return req;
  };
  const app = { quit: () => {}, getVersion: () => '2.5.4', getPath: () => root };
  const manager = new UpdateManager(app);
  try {
    for (const flag of ['draft', 'prerelease']) {
      metadata[flag] = true;
      const result = await manager.checkForUpdates({ manual: true });
      assert.equal(result.updateAvailable, false, `${flag} must remain invisible`);
      assert.equal(manager.updateInfo, null);
      metadata[flag] = false;
    }
    assert.equal((await manager.checkForUpdates()).latestVersion, '2.5.5');
    assert.equal((await manager.downloadAndVerifyUpdate()).verified, true);
    // A failed second download must invalidate prior installer readiness.
    for (const invalid of [null, 'malformed', 'missing-entry', 'unavailable', 'wrong-hash']) {
      await manager.checkForUpdates();
      if (invalid === null) manager.updateInfo.checksumUrl = null;
      checksumStatus = invalid === 'unavailable' ? 404 : 200;
      checksumBody = invalid === 'malformed' ? 'bad checksum' : invalid === 'missing-entry' ? `${hash}  different.exe\n` : invalid === 'wrong-hash' ? `${'0'.repeat(64)}  ${name}\n` : `${hash}  ${name}\n`;
      await assert.rejects(manager.downloadAndVerifyUpdate(), /INTEGRITY_VERIFICATION_FAILED/);
      assert.equal(manager.verifiedInstallerPath, null);
      assert.equal(manager.getStatus().verifiedInstallerReady, false);
      assert.equal(manager.state, 'failed');
      assert.throws(() => manager.installUpdate(), /No verified update/);
      assert.deepEqual(fs.readdirSync(manager.stagingDir), []);
    }
    checksumStatus = 200;
    checksumBody = `${hash}  ${name}\n`;
    await manager.checkForUpdates();
    const verified = await manager.downloadAndVerifyUpdate();
    fs.appendFileSync(verified.verifiedInstallerPath, 'tampered after verification');
    assert.throws(() => manager.installUpdate(), /INTEGRITY_VERIFICATION_FAILED/);
    assert.equal(manager.verifiedInstallerPath, null);
    assert.equal(fs.existsSync(verified.verifiedInstallerPath), false);
    manager.setSettings({ autoCheckUpdates: false });
    const restarted = new UpdateManager(app);
    assert.equal(restarted.getSettings().autoCheckUpdates, false);
    assert.equal((await restarted.checkForUpdates({ manual: true })).updateAvailable, true, 'manual check remains available when auto-check is off');
    manager.cancelUpdate();
    assert.equal(manager.state, 'idle');
  } finally {
    https.get = originalGet;
    fs.rmSync(root, { recursive: true, force: true });
  }
});

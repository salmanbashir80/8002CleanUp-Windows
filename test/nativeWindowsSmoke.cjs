// Runs only on a disposable GitHub-hosted Windows QA runner. No cleanup,
// networking changes, real purchase keys or installer auto-update is exercised.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { _electron: electron } = require('playwright-core');

(async () => {
  assert.equal(process.platform, 'win32', 'Native Windows required');
  assert.equal(process.env.GITHUB_ACTIONS, 'true', 'Disposable CI runner required');
  const executablePath = path.resolve('release/win-unpacked/8002CleanUp Pro.exe');
  const expectedVersion = require('../package.json').version;
  const report = { status: 'NOT TESTED', source: process.env.GITHUB_SHA, checks: [] };
  let instance;
  let before;
  try {
    for (const restart of [false, true]) {
      instance = await electron.launch({ executablePath, timeout: 60000 });
      instance.process().stderr?.on('data', data => process.stderr.write(data));
      instance.process().on('exit', (code, signal) => console.log(`Native app exit: code=${code}, signal=${signal}`));
      const page = await instance.firstWindow();
      await page.waitForFunction(() => Boolean(window.electronAPI?.getAppInfo), { timeout: 30000 });
      const appInfo = await page.evaluate(() => window.electronAPI.getAppInfo());
      assert.equal(appInfo.version, expectedVersion);
      assert.equal(appInfo.platform, 'win32');
      assert.equal(appInfo.arch, 'x64');
      const status = await page.evaluate(() => window.electronAPI.getLicenseStatus());
      assert.equal(status.isTrial, true, 'This smoke test must not modify a paid customer profile');
      if (restart) {
        assert.equal(status.machineId, before.machineId);
        assert.equal(status.daysLeft, before.daysLeft);
        assert.equal((await page.evaluate(() => window.electronAPI.getAppSettings())).autoCheckUpdates, false);
        report.checks.push('Actual application restart preserved trial identity/duration and auto-check=false');
      } else {
        before = { machineId: status.machineId, daysLeft: status.daysLeft };
      }
      await page.getByRole('button', { name: 'Settings', exact: true }).click();
      await page.getByRole('heading', { name: 'Settings', exact: true }).waitFor();
      for (const label of ['Software Updates', 'Cleaning Safety', 'About']) {
        await page.getByText(label, { exact: true }).first().waitFor();
      }
      const toggle = page.getByRole('switch', { name: 'Automatically check for updates' });
      const wanted = restart;
      await page.waitForFunction(async () => {
        const value = (await window.electronAPI.getAppSettings()).autoCheckUpdates;
        return document.querySelector('[aria-label="Automatically check for updates"]')?.getAttribute('aria-checked') === String(value);
      });
      if ((await toggle.getAttribute('aria-checked')) !== String(wanted)) await toggle.click();
      await page.waitForFunction(async expected => (await window.electronAPI.getAppSettings()).autoCheckUpdates === expected, wanted);
      if (restart) {
        const dpapi = await instance.evaluate(({ safeStorage }) => {
          if (!safeStorage.isEncryptionAvailable()) return false;
          const fixture = 'Synthetic DPAPI round-trip fixture';
          return safeStorage.decryptString(safeStorage.encryptString(fixture)) === fixture;
        });
        assert.equal(dpapi, true, 'Native OS-backed encryption must be available');
        report.checks.push('Native safeStorage encryption/decryption round trip');
        report.checks.push('Settings rendered updates, safety, About and persisted toggles');
        await page.screenshot({ path: 'release/NATIVE_SETTINGS.png', fullPage: true });
      }
      await instance.close();
      instance = null;
    }
    report.status = 'PASS';
    report.limitations = 'Trial/runtime/settings smoke only; not a paid Gumroad activation, installed upgrade, rollback or silent installation test.';
  } catch (error) {
    report.status = 'FAIL';
    report.reason = error.message;
    throw error;
  } finally {
    if (instance) await instance.close().catch(() => {});
    fs.writeFileSync('release/NATIVE_SMOKE.json', JSON.stringify(report, null, 2));
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });

const assert = require('assert');
const path = require('path');
const os = require('os');
const {
  isCriticalProcess,
  isSafeCleanTarget,
  cleanTrackingURLString,
  generateHostsShieldContent,
  removeHostsShieldContent
} = require('../electron/safetyGuard.cjs');

console.log('--- Testing Safety Guard ---');

// 1. Critical Process Protection
assert.strictEqual(isCriticalProcess(0, 'System Idle Process').isCritical, true);
assert.strictEqual(isCriticalProcess(4, 'System').isCritical, true);
assert.strictEqual(isCriticalProcess(1234, 'csrss.exe').isCritical, true);
assert.strictEqual(isCriticalProcess(5678, 'lsass.exe').isCritical, true);
assert.strictEqual(isCriticalProcess(9999, 'explorer.exe').isCritical, true);
assert.strictEqual(isCriticalProcess(8888, 'C:\\Windows\\System32\\svchost.exe').isCritical, true);
assert.strictEqual(isCriticalProcess(45000, 'notepad.exe').isCritical, false);
assert.strictEqual(isCriticalProcess(55000, 'chrome.exe').isCritical, false);
console.log('✓ Critical process protection verified');

// 2. Safe Directory Allowlist
const mockEnv = {
  home: 'C:\\Users\\TestUser',
  tmp: 'C:\\Users\\TestUser\\AppData\\Local\\Temp',
  localAppData: 'C:\\Users\\TestUser\\AppData\\Local',
  appData: 'C:\\Users\\TestUser\\AppData\\Roaming'
};

// Dangerous targets that MUST be rejected
assert.strictEqual(isSafeCleanTarget('C:\\', mockEnv), false, 'C:\\ must be rejected');
assert.strictEqual(isSafeCleanTarget('C:\\Windows', mockEnv), false, 'C:\\Windows must be rejected');
assert.strictEqual(isSafeCleanTarget('C:\\Windows\\System32', mockEnv), false, 'System32 must be rejected');
assert.strictEqual(isSafeCleanTarget('C:\\Program Files', mockEnv), false, 'Program Files must be rejected');
assert.strictEqual(isSafeCleanTarget('C:\\Users\\TestUser', mockEnv), false, 'Home dir must be rejected');
assert.strictEqual(isSafeCleanTarget('C:\\Users\\TestUser\\Desktop', mockEnv), false, 'Desktop must be rejected');
assert.strictEqual(isSafeCleanTarget('C:\\Users\\TestUser\\Documents', mockEnv), false, 'Documents must be rejected');
assert.strictEqual(isSafeCleanTarget('C:\\Users\\TestUser\\Downloads\\file.zip', mockEnv), false, 'Downloads must be rejected');

// Traversal attempts
assert.strictEqual(isSafeCleanTarget('C:\\Windows\\Temp\\..\\..\\Windows\\System32', mockEnv), false, 'Traversal must be rejected');

// Safe targets that MUST be accepted
assert.strictEqual(isSafeCleanTarget('RECYCLE_BIN', mockEnv), true, 'RECYCLE_BIN is safe');
assert.strictEqual(isSafeCleanTarget('C:\\Windows\\Temp', mockEnv), true, 'Windows Temp is safe');
assert.strictEqual(isSafeCleanTarget('C:\\Windows\\Prefetch', mockEnv), true, 'Prefetch is safe');
assert.strictEqual(isSafeCleanTarget('C:\\Windows\\SoftwareDistribution\\Download', mockEnv), true, 'Update download cache is safe');
assert.strictEqual(isSafeCleanTarget('C:\\Users\\TestUser\\AppData\\Local\\Temp', mockEnv), true, 'User temp is safe');
assert.strictEqual(isSafeCleanTarget('C:\\Users\\TestUser\\AppData\\Local\\CrashDumps', mockEnv), true, 'CrashDumps is safe');
assert.strictEqual(isSafeCleanTarget('C:\\Users\\TestUser\\AppData\\Local\\D3DSCache', mockEnv), true, 'D3DSCache is safe');
assert.strictEqual(isSafeCleanTarget('C:\\Users\\TestUser\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Cache', mockEnv), true, 'Chrome cache is safe');
console.log('✓ Path allowlist and traversal protection verified');

// 3. Tracking URL Stripping
const rawUrl = 'https://example.com/product?utm_source=fb&utm_medium=cpc&fbclid=12345&gclid=67890&keep_me=yes';
const cleaned = cleanTrackingURLString(rawUrl);
assert.strictEqual(cleaned.cleanedURL, 'https://example.com/product?keep_me=yes');
assert.strictEqual(cleaned.removedParams.length, 4);
console.log('✓ Tracking URL stripper verified');

// 4. Hosts Shield Generator and Remover
const initialHosts = '127.0.0.1 localhost\r\n::1 localhost\r\n';
const withShield = generateHostsShieldContent(initialHosts, ['doubleclick.net', 'adservice.google.com']);
assert.strictEqual(withShield.includes('# --- 8002CleanUp Shield START ---'), true);
assert.strictEqual(withShield.includes('0.0.0.0 doubleclick.net'), true);
assert.strictEqual(withShield.includes('127.0.0.1 localhost'), true);

const restoredHosts = removeHostsShieldContent(withShield);
assert.strictEqual(restoredHosts.includes('0.0.0.0 doubleclick.net'), false);
assert.strictEqual(restoredHosts.includes('127.0.0.1 localhost'), true);
console.log('✓ Hosts sinkhole generation and clean removal verified');

console.log('ALL SAFETY TESTS PASSED!');

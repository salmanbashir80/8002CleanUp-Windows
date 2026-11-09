const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const {
  LicenseManager,
  verifyOfflineKey,
  verifyGumroadApi,
  getMachineFingerprint,
  VENDOR_PUBLIC_KEY,
  DEFAULT_GUMROAD_PRODUCT_ID
} = require('../electron/licenseManager.cjs');

console.log('--- Testing Hardened Commercial License Manager ---');

// 1. Test machine fingerprint
const fp = getMachineFingerprint();
assert.strictEqual(typeof fp, 'string');
assert.strictEqual(fp.length, 32);
console.log('✓ Machine fingerprint generated correctly:', fp);

// 2. Test asymmetric offline key verification with ephemeral Ed25519 keypair
const testKeyPair = crypto.generateKeyPairSync('ed25519');
const testPrivKeyPem = testKeyPair.privateKey.export({ type: 'pkcs8', format: 'pem' });
const testPubKeyPem = testKeyPair.publicKey.export({ type: 'spki', format: 'pem' });

function createSignedTestKey(payloadObj, privKey = testPrivKeyPem) {
  const payloadStr = JSON.stringify(payloadObj);
  const payloadBuf = Buffer.from(payloadStr, 'utf8');
  const sig = crypto.sign(null, payloadBuf, privKey);
  return `8002-PRO.${payloadBuf.toString('base64url')}.${sig.toString('base64url')}`;
}

const validKey = createSignedTestKey({
  product: '8002cleanup-pro',
  email: 'customer@example.com',
  tier: 'Lifetime Pro',
  issuedAt: new Date().toISOString()
});

// Verify with custom test public key
const checkValid = verifyOfflineKey(validKey, testPubKeyPem);
assert.strictEqual(checkValid.valid, true);
assert.strictEqual(checkValid.email, 'customer@example.com');
console.log('✓ Genuine Ed25519 signed key verified successfully against public key');

// Test tampered key signature
const tamperedKey = validKey.slice(0, -6) + 'AAAAAA';
assert.strictEqual(verifyOfflineKey(tamperedKey, testPubKeyPem).valid, false, 'Tampered signature must fail');
console.log('✓ Tampered signature rejected');

// Test key for wrong product
const wrongProductKey = createSignedTestKey({
  product: 'wrong-product',
  email: 'attacker@example.com'
});
assert.strictEqual(verifyOfflineKey(wrongProductKey, testPubKeyPem).valid, false, 'Wrong product must fail');
console.log('✓ Wrong product signature rejected');

// Test random bogus string against default VENDOR_PUBLIC_KEY
assert.strictEqual(verifyOfflineKey('8002-PRO.fake.fake').valid, false);
assert.strictEqual(verifyOfflineKey('completely-invalid').valid, false);
console.log('✓ Bogus keys rejected');

// 3. Security Correction Test: Local JSON file tampering CANNOT grant Pro license
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), '8002-lic-security-test-'));
const tmpApp = { getPath: () => tmpDir };
const mgr = new LicenseManager(tmpApp, { publicKey: testPubKeyPem });

// Expire trial first to test unlicensed state
const tamperedTrialEpoch = { epoch: 1000, hmac: 'fakehmac1234567890abcdef' };
fs.writeFileSync(mgr.trialFile, JSON.stringify(tamperedTrialEpoch), 'utf8');
const expiredCheck = mgr.getStatus();
assert.strictEqual(expiredCheck.isPro, false, 'Tampered trial file must be treated as expired');
assert.strictEqual(expiredCheck.isExpired, true);
console.log('✓ Tampered trial file safely rejected as expired');

// Attempt local tampering: attacker manually writes { isGumroad: true, verified: true }
const fakeGumroadVault = {
  isGumroad: true,
  verified: true,
  type: 'gumroad',
  licenseKey: 'PIRATED-GUMROAD-KEY',
  productId: '8002cleanup-pro-windows',
  email: 'pirate@example.com',
  verifiedAt: Date.now(),
  entitlementHmac: 'bad_hmac_cannot_spoof_secret'
};
fs.writeFileSync(mgr.licenseFile, JSON.stringify(fakeGumroadVault, null, 2), 'utf8');
const pirateCheck = mgr.getStatus();
assert.strictEqual(pirateCheck.isPro, false, 'Forged isGumroad: true in local JSON must NOT grant Pro');
console.log('✓ Forged local JSON flags rejected by entitlement HMAC verification');

// Attempt local tampering: attacker manually writes fake offline_ed25519
const fakeOfflineVault = {
  type: 'offline_ed25519',
  licenseKey: '8002-PRO.fake_payload.fake_sig',
  email: 'pirate@example.com'
};
fs.writeFileSync(mgr.licenseFile, JSON.stringify(fakeOfflineVault, null, 2), 'utf8');
const pirateOfflineCheck = mgr.getStatus();
assert.strictEqual(pirateOfflineCheck.isPro, false, 'Forged offline key must fail cryptographic verification');
console.log('✓ Forged offline key rejected by crypto.verify');

// Clean up fake files
try { fs.unlinkSync(mgr.licenseFile); } catch (_) {}
try { fs.unlinkSync(mgr.trialFile); } catch (_) {}

// 4. Test genuine activation & lifecycle
const cleanTmpApp = { getPath: () => fs.mkdtempSync(path.join(os.tmpdir(), '8002-lic-clean-test-')) };
const cleanMgr = new LicenseManager(cleanTmpApp, { publicKey: testPubKeyPem });

// Initial clean state: trial mode (7 days left)
const initialStatus = cleanMgr.getStatus();
assert.strictEqual(initialStatus.isTrial, true);
assert.strictEqual(initialStatus.isPro, true);
assert.strictEqual(initialStatus.daysLeft, 7);
console.log('✓ Initial trial status verified: 7 days remaining');

// Activate with genuine Ed25519 key
cleanMgr.activate(validKey, 'buyer@example.com').then((actRes) => {
  assert.strictEqual(actRes.success, true);
  const activeStatus = cleanMgr.getStatus();
  assert.strictEqual(activeStatus.isPro, true);
  assert.strictEqual(activeStatus.isTrial, false);
  assert.strictEqual(activeStatus.statusLabel, 'PRO ACTIVATED');
  console.log('✓ Genuine license activated successfully: PRO ACTIVATED');

  // Deactivate
  const deactRes = cleanMgr.deactivate();
  assert.strictEqual(deactRes.success, true);
  const postDeact = cleanMgr.getStatus();
  assert.strictEqual(postDeact.isTrial, true);
  console.log('✓ Deactivation restored clean evaluation state');

  console.log('ALL HARDENED COMMERCIAL LICENSE TESTS PASSED!');
});

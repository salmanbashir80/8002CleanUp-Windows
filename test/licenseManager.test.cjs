const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const {
  LicenseManager,
  verifyOfflineKey,
  getMachineFingerprint,
  VENDOR_PUBLIC_KEY
} = require('../electron/licenseManager.cjs');

console.log('--- Testing Asymmetric License Manager ---');

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
console.log('✓ Genuine Ed25519 signed key verified successfully against ephemeral public key');

// Test tampered key
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

// 3. Test LicenseManager lifecycle with test public key
const tmpApp = {
  getPath: () => fs.mkdtempSync(path.join(os.tmpdir(), '8002-lic-test-'))
};
const mgr = new LicenseManager(tmpApp, { publicKey: testPubKeyPem });

// Initial state: trial mode
const initialStatus = mgr.getStatus();
assert.strictEqual(initialStatus.isTrial, true);
assert.strictEqual(initialStatus.isPro, true);
assert.strictEqual(initialStatus.daysLeft, 7);
console.log('✓ Initial trial status verified: 7 days remaining');

// Activate with genuine key
mgr.activate(validKey).then((actRes) => {
  assert.strictEqual(actRes.success, true);
  const activeStatus = mgr.getStatus();
  assert.strictEqual(activeStatus.isPro, true);
  assert.strictEqual(activeStatus.isTrial, false);
  assert.strictEqual(activeStatus.statusLabel, 'PRO ACTIVATED');
  console.log('✓ License activated successfully: PRO ACTIVATED');

  // Deactivate
  const deactRes = mgr.deactivate();
  assert.strictEqual(deactRes.success, true);
  const postDeact = mgr.getStatus();
  assert.strictEqual(postDeact.isTrial, true);
  console.log('✓ Deactivation restored clean evaluation state');

  console.log('ALL ASYMMETRIC LICENSE TESTS PASSED!');
});

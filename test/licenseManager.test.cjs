const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const {
  LicenseManager,
  verifyOfflineKey,
  inspectPurchaseStatus,
  encryptEnvelope,
  decryptEnvelope,
  getMachineFingerprint,
  VENDOR_PUBLIC_KEY,
  OFFLINE_GRACE_MS
} = require('../electron/licenseManager.cjs');

console.log('--- Testing Hardened Commercial License Manager & Storage ---');

// 1. Test machine fingerprint
const fp = getMachineFingerprint();
assert.strictEqual(typeof fp, 'string');
assert.strictEqual(fp.length, 32);
console.log('✓ Machine fingerprint generated correctly:', fp);

// 2. Test Purchase Fraud & Revocation Engine
const validPurchase = { id: 'p_123', email: 'test@example.com', refunded: false, chargebacked: false };
assert.strictEqual(inspectPurchaseStatus(validPurchase).valid, true);

const refundedPurchase = { id: 'p_124', email: 'test@example.com', refunded: true };
const refCheck = inspectPurchaseStatus(refundedPurchase);
assert.strictEqual(refCheck.valid, false);
assert.strictEqual(refCheck.reason, 'REFUNDED');

const chargebackedPurchase = { id: 'p_125', email: 'test@example.com', chargebacked: true };
const cbCheck = inspectPurchaseStatus(chargebackedPurchase);
assert.strictEqual(cbCheck.valid, false);
assert.strictEqual(cbCheck.reason, 'CHARGEBACKED');

const disputedPurchase = { id: 'p_126', email: 'test@example.com', disputed: true };
const dispCheck = inspectPurchaseStatus(disputedPurchase);
assert.strictEqual(dispCheck.valid, false);
assert.strictEqual(dispCheck.reason, 'DISPUTED');

const cancelledPurchase = {
  id: 'p_127',
  email: 'test@example.com',
  subscription_cancelled_at: new Date(Date.now() - 10000).toISOString()
};
const canCheck = inspectPurchaseStatus(cancelledPurchase);
assert.strictEqual(canCheck.valid, false);
assert.strictEqual(canCheck.reason, 'SUBSCRIPTION_CANCELLED');

console.log('✓ Refund, chargeback, dispute, and subscription cancellation rejection verified');

// 3. Test OS-backed / AES-256-GCM Encrypted Storage
const testSecretKey = crypto.randomBytes(32);
const plainEntitlement = JSON.stringify({
  type: 'gumroad',
  licenseKey: 'TEST-KEY-1234',
  email: 'customer@example.com',
  verifiedAt: Date.now()
});

const envelope = encryptEnvelope(plainEntitlement, testSecretKey);
assert.strictEqual(typeof envelope.data, 'string');

const decrypted = decryptEnvelope(envelope, testSecretKey);
assert.strictEqual(decrypted, plainEntitlement);

// Tamper with encrypted envelope
const tamperedEnvelope = { ...envelope, data: envelope.data.slice(0, -4) + 'AAAA' };
const tamperedDecrypted = decryptEnvelope(tamperedEnvelope, testSecretKey);
assert.strictEqual(tamperedDecrypted, null, 'Tampered ciphertext must fail decryption');
console.log('✓ Authenticated storage encryption and tamper detection verified');

// 4. Test Asymmetric Ed25519 Offline Receipts
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

const checkValid = verifyOfflineKey(validKey, testPubKeyPem);
assert.strictEqual(checkValid.valid, true);
assert.strictEqual(checkValid.email, 'customer@example.com');
console.log('✓ Genuine Ed25519 signed key verified successfully');

const tamperedKey = validKey.slice(0, -6) + 'AAAAAA';
assert.strictEqual(verifyOfflineKey(tamperedKey, testPubKeyPem).valid, false);

const wrongProductKey = createSignedTestKey({ product: 'wrong-product' });
assert.strictEqual(verifyOfflineKey(wrongProductKey, testPubKeyPem).valid, false);
console.log('✓ Tampered and invalid offline receipts rejected');

// 5. Test LicenseManager Lifecycle, Persistence & Reinstall Simulation
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), '8002-lic-test-'));
const tmpApp = { getPath: () => tmpDir };
const mgr = new LicenseManager(tmpApp, { publicKey: testPubKeyPem });

// Initial state: trial mode
const initialStatus = mgr.getStatus();
assert.strictEqual(initialStatus.isTrial, true);
assert.strictEqual(initialStatus.isPro, true);
assert.strictEqual(initialStatus.daysLeft, 7);
console.log('✓ Initial trial status verified: 7 days remaining');

// Activate with genuine key
mgr.activate(validKey, 'buyer@example.com').then((actRes) => {
  assert.strictEqual(actRes.success, true);
  const activeStatus = mgr.getStatus();
  assert.strictEqual(activeStatus.isPro, true);
  assert.strictEqual(activeStatus.statusLabel, 'PRO ACTIVATED');
  console.log('✓ Genuine license activated successfully: PRO ACTIVATED');

  // Simulate Reinstall: new LicenseManager instance pointing to same storage
  const reinstalledMgr = new LicenseManager(tmpApp, { publicKey: testPubKeyPem });
  const reinstalledStatus = reinstalledMgr.getStatus();
  assert.strictEqual(reinstalledStatus.isPro, true);
  assert.strictEqual(reinstalledStatus.statusLabel, 'PRO ACTIVATED');
  console.log('✓ Simulated reinstall successfully retained activated license');

  // Deactivate
  const deactRes = reinstalledMgr.deactivate();
  assert.strictEqual(deactRes.success, true);
  const postDeact = reinstalledMgr.getStatus();
  assert.strictEqual(postDeact.isTrial, true);
  console.log('✓ Deactivation restored clean evaluation state');

  console.log('ALL HARDENED COMMERCIAL LICENSE & STORAGE TESTS PASSED!');
});

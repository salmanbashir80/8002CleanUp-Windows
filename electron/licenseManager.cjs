/**
 * 8002CleanUp Pro — Commercial Licensing & Trial Management Engine
 * Windows 10 & 11 Commercial Distribution
 *
 * Security Architecture:
 * 1. OS-Backed Encrypted Storage (Windows DPAPI via Electron safeStorage with AES-256-GCM fallback)
 * 2. Cryptographic Server-Signed Offline Receipts (Ed25519 verified against VENDOR_PUBLIC_KEY)
 * 3. Configurable Gumroad Product ID (Rejects unconfigured / provisional product IDs)
 * 4. Comprehensive Fraud & Revocation Engine (Refund, dispute, chargeback, and subscription cancellation rejection)
 * 5. 14-day Offline Grace Period with Non-Incrementing Re-verification
 * 6. Protected 7-Day Evaluation Trial
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const https = require('https');

let electronSafeStorage = null;
try {
  const electron = require('electron');
  if (electron && electron.safeStorage) {
    electronSafeStorage = electron.safeStorage;
  }
} catch (_) {}

const TRIAL_DAYS = 7;
const OFFLINE_GRACE_MS = 14 * 24 * 60 * 60 * 1000; // 14 days
const DEFAULT_GUMROAD_PRODUCT_ID = process.env.GUMROAD_PRODUCT_ID || '';

// Vendor Ed25519 Public Key for offline commercial license verification.
// PRIVATE SIGNING KEY IS NEVER EMBEDDED IN CLIENT BUILDS OR COMMITTED TO THE REPO.
const VENDOR_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAAmka4vkGQZi2aswH+22Pw6YxELT1FS3qH2tPY5t2FG4=
-----END PUBLIC KEY-----`;

function isOsStorageAvailable() {
  return Boolean(
    electronSafeStorage &&
    typeof electronSafeStorage.isEncryptionAvailable === 'function' &&
    electronSafeStorage.isEncryptionAvailable()
  );
}

function getMachineFingerprint() {
  const parts = [
    os.hostname() || 'localhost',
    os.arch() || 'x64',
    os.platform() || 'win32',
    process.env.COMPUTERNAME || '',
    process.env.USERDOMAIN || '',
    process.env.HOMEPATH || os.homedir() || ''
  ];
  return crypto.createHash('sha256').update(parts.join('::')).digest('hex').slice(0, 32);
}

function getStorageDir(appInstance) {
  if (appInstance && typeof appInstance.getPath === 'function') {
    try {
      const p = path.join(appInstance.getPath('userData'), 'license');
      if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
      return p;
    } catch (_) {}
  }
  const fallback = path.join(
    process.env.APPDATA || os.homedir(),
    '8002CleanUp Pro',
    'license'
  );
  if (!fs.existsSync(fallback)) fs.mkdirSync(fallback, { recursive: true });
  return fallback;
}

/**
 * Gets or creates a local 256-bit secret key for authenticated fallback encryption (AES-256-GCM).
 */
function getVaultSecretKey(storageDir, machineId) {
  const secretFile = path.join(storageDir, '.vault_secret');
  try {
    if (fs.existsSync(secretFile)) {
      const raw = fs.readFileSync(secretFile);
      if (raw.length === 32) return raw;
    }
    const newKey = crypto.randomBytes(32);
    fs.writeFileSync(secretFile, newKey, { mode: 0o600 });
    return newKey;
  } catch (_) {
    // If filesystem write fails, derive from machineId as ephemeral fallback
    return crypto.createHash('sha256').update(`8002::${machineId}::vault_secret_2026`).digest();
  }
}

/**
 * Encrypts sensitive entitlement data using OS DPAPI (Windows safeStorage)
 * with authenticated AES-256-GCM fallback.
 */
function encryptEnvelope(plainText, secretKey) {
  if (isOsStorageAvailable()) {
    try {
      const encBuf = electronSafeStorage.encryptString(plainText);
      return {
        mechanism: 'os_dpapi',
        data: encBuf.toString('base64')
      };
    } catch (_) {}
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', secretKey, iv);
  let enc = cipher.update(plainText, 'utf8', 'base64');
  enc += cipher.final('base64');
  const authTag = cipher.getAuthTag().toString('base64');

  return {
    mechanism: 'aes_256_gcm',
    iv: iv.toString('base64'),
    authTag,
    data: enc
  };
}

/**
 * Decrypts sensitive entitlement data.
 */
function decryptEnvelope(envelope, secretKey) {
  if (!envelope || !envelope.data) return null;

  if (envelope.mechanism === 'os_dpapi') {
    if (isOsStorageAvailable()) {
      try {
        const buf = Buffer.from(envelope.data, 'base64');
        return electronSafeStorage.decryptString(buf);
      } catch (_) {
        return null;
      }
    }
    return null;
  }

  if (envelope.mechanism === 'aes_256_gcm') {
    try {
      const iv = Buffer.from(envelope.iv, 'base64');
      const authTag = Buffer.from(envelope.authTag, 'base64');
      const decipher = crypto.createDecipheriv('aes-256-gcm', secretKey, iv);
      decipher.setAuthTag(authTag);
      let dec = decipher.update(envelope.data, 'base64', 'utf8');
      dec += decipher.final('utf8');
      return dec;
    } catch (_) {
      return null;
    }
  }

  return null;
}

/**
 * Validates purchase state for refunds, disputes, chargebacks, and cancellations.
 */
function inspectPurchaseStatus(purchase) {
  if (!purchase) {
    return { valid: false, reason: 'NO_PURCHASE_DATA', message: 'No purchase data returned.' };
  }
  if (purchase.refunded === true) {
    return { valid: false, reason: 'REFUNDED', message: 'License Revoked: This Gumroad purchase has been refunded.' };
  }
  if (purchase.chargebacked === true) {
    return { valid: false, reason: 'CHARGEBACKED', message: 'License Revoked: Chargeback detected for this purchase.' };
  }
  if (purchase.disputed === true) {
    return { valid: false, reason: 'DISPUTED', message: 'License Inactive: Purchase is currently under dispute.' };
  }
  if (purchase.subscription_cancelled_at) {
    const cancelTime = Date.parse(purchase.subscription_cancelled_at);
    if (!isNaN(cancelTime) && Date.now() > cancelTime) {
      return { valid: false, reason: 'SUBSCRIPTION_CANCELLED', message: 'Subscription cancelled or expired.' };
    }
  }
  if (purchase.subscription_failed_at) {
    return { valid: false, reason: 'PAYMENT_FAILED', message: 'Subscription payment failed.' };
  }
  return { valid: true };
}

/**
 * Validates an asymmetric offline Pro license key / server-signed receipt.
 * Format: 8002-PRO.<base64url(payload)>.<base64url(signature)>
 * Verified exclusively against VENDOR_PUBLIC_KEY using Ed25519.
 */
function verifyOfflineKey(rawKey, pubKey = VENDOR_PUBLIC_KEY) {
  if (!rawKey || typeof rawKey !== 'string') return { valid: false };
  const clean = rawKey.trim();

  if (!clean.startsWith('8002-PRO.')) return { valid: false };

  const parts = clean.slice('8002-PRO.'.length).split('.');
  if (parts.length !== 2) return { valid: false };

  const [payloadB64, sigB64] = parts;

  try {
    const payloadBuf = Buffer.from(payloadB64, 'base64url');
    const sigBuf = Buffer.from(sigB64, 'base64url');

    const isValid = crypto.verify(null, payloadBuf, pubKey, sigBuf);
    if (!isValid) return { valid: false };

    const payload = JSON.parse(payloadBuf.toString('utf8'));
    if (!payload || payload.product !== '8002cleanup-pro') {
      return { valid: false };
    }

    if (payload.expiresAt && Date.now() > Date.parse(payload.expiresAt)) {
      return { valid: false, expired: true, message: 'License receipt has expired.' };
    }

    return {
      valid: true,
      email: payload.email || 'Licensed Customer',
      tier: payload.tier || 'Lifetime Pro',
      issuedAt: payload.issuedAt,
      machineId: payload.machineId
    };
  } catch (_e) {
    return { valid: false };
  }
}

/**
 * Verifies key with Gumroad API:
 * POST https://api.gumroad.com/v2/licenses/verify
 */
function verifyGumroadApi(licenseKey, options = {}) {
  const productId = options.productId || DEFAULT_GUMROAD_PRODUCT_ID;
  const incrementUsesCount = Boolean(options.incrementUsesCount);

  if (!productId) {
    return Promise.resolve({
      success: false,
      pendingConfig: true,
      message: 'Gumroad Product ID is pending seller configuration. Use an offline Pro key or contact support.'
    });
  }

  return new Promise((resolve) => {
    const postData = `product_id=${encodeURIComponent(productId)}&license_key=${encodeURIComponent(licenseKey)}&increment_uses_count=${incrementUsesCount ? 'true' : 'false'}`;
    const req = https.request(
      'https://api.gumroad.com/v2/licenses/verify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 9000
      },
      (res) => {
        let body = '';
        res.on('data', (d) => (body += d));
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (!data || data.success !== true) {
              return resolve({
                success: false,
                message: data && data.message ? data.message : 'Invalid Gumroad license key.'
              });
            }

            const purchase = data.purchase || {};
            const statusCheck = inspectPurchaseStatus(purchase);
            if (!statusCheck.valid) {
              return resolve({
                success: false,
                revoked: true,
                reason: statusCheck.reason,
                message: statusCheck.message
              });
            }

            resolve({
              success: true,
              uses: data.uses || 1,
              purchase,
              message: 'Verified successfully via Gumroad API.'
            });
          } catch (e) {
            resolve({ success: false, message: 'Could not parse Gumroad response.' });
          }
        });
      }
    );

    req.on('error', (err) => {
      resolve({ success: false, error: err.message, networkError: true });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ success: false, timeout: true, networkError: true });
    });
    req.write(postData);
    req.end();
  });
}

class LicenseManager {
  constructor(appInstance, options = {}) {
    this.appInstance = appInstance;
    this.publicKey = options.publicKey || VENDOR_PUBLIC_KEY;
    this.productId = options.productId !== undefined ? options.productId : DEFAULT_GUMROAD_PRODUCT_ID;
    this.machineId = getMachineFingerprint();
    this.storageDir = getStorageDir(appInstance);
    this.vaultKey = getVaultSecretKey(this.storageDir, this.machineId);
    this.licenseFile = path.join(this.storageDir, 'license_vault.json');
    this.trialFile = path.join(this.storageDir, '.trial_epoch');
    this.offlineGraceMs = options.offlineGraceMs || OFFLINE_GRACE_MS;
    this.isReverifying = false;
  }

  getTrialInfo() {
    let epoch = 0;
    try {
      if (fs.existsSync(this.trialFile)) {
        const raw = fs.readFileSync(this.trialFile, 'utf8').trim();
        const envelope = JSON.parse(raw);
        const decrypted = decryptEnvelope(envelope, this.vaultKey);
        if (decrypted) {
          const parsed = JSON.parse(decrypted);
          if (parsed && typeof parsed.epoch === 'number' && parsed.machineId === this.machineId) {
            epoch = parsed.epoch;
          }
        }
      } else {
        epoch = Date.now();
        const payload = JSON.stringify({ epoch, machineId: this.machineId });
        const envelope = encryptEnvelope(payload, this.vaultKey);
        fs.writeFileSync(this.trialFile, JSON.stringify(envelope, null, 2), 'utf8');
      }
    } catch (_) {
      epoch = 0;
    }

    if (epoch === 0) {
      return {
        isTrial: false,
        trialStartedAt: new Date(0).toISOString(),
        daysElapsed: TRIAL_DAYS + 1,
        daysLeft: 0,
        isExpired: true
      };
    }

    const elapsedDays = Math.floor((Date.now() - epoch) / (1000 * 60 * 60 * 24));
    const daysLeft = Math.max(0, TRIAL_DAYS - elapsedDays);
    const isExpired = elapsedDays >= TRIAL_DAYS;

    return {
      isTrial: true,
      trialStartedAt: new Date(epoch).toISOString(),
      daysElapsed: elapsedDays,
      daysLeft,
      isExpired
    };
  }

  getStatus() {
    const trial = this.getTrialInfo();

    try {
      if (fs.existsSync(this.licenseFile)) {
        const raw = fs.readFileSync(this.licenseFile, 'utf8');
        const envelope = JSON.parse(raw);

        // 1. Server-Signed Asymmetric Ed25519 Offline Key / Receipt
        if (envelope && envelope.type === 'offline_ed25519' && envelope.licenseKey) {
          const offlineCheck = verifyOfflineKey(envelope.licenseKey, this.publicKey);
          if (offlineCheck.valid) {
            const masked = envelope.licenseKey.length > 16
              ? `${envelope.licenseKey.slice(0, 12)}...${envelope.licenseKey.slice(-6)}`
              : 'PRO-ACTIVATED';
            return {
              isPro: true,
              isTrial: false,
              isExpired: false,
              plan: 'Commercial Pro Lifetime',
              statusLabel: 'PRO ACTIVATED',
              licenseKeyMasked: masked,
              activatedAt: envelope.activatedAt || new Date().toISOString(),
              machineId: this.machineId,
              type: 'Asymmetric Offline Pro Key (Ed25519)',
              customerEmail: offlineCheck.email || 'Commercial Customer',
              message: '8002CleanUp Pro is fully licensed and active.'
            };
          }
        }

        // 2. OS-Backed Encrypted Gumroad Entitlement
        if (envelope && envelope.mechanism) {
          const decrypted = decryptEnvelope(envelope, this.vaultKey);
          if (decrypted) {
            const data = JSON.parse(decrypted);

            if (data && data.type === 'gumroad' && data.licenseKey && data.machineId === this.machineId) {
              const elapsedSinceVerification = Date.now() - (data.verifiedAt || 0);

              // Offline grace period check
              if (elapsedSinceVerification > this.offlineGraceMs) {
                return {
                  isPro: false,
                  isTrial: false,
                  isExpired: true,
                  plan: 'Offline Grace Expired',
                  statusLabel: 'RE-VERIFY GUMROAD',
                  licenseKeyMasked: 'REQUIRES-ONLINE-CHECK',
                  daysLeft: 0,
                  type: 'Gumroad License (Offline Grace Expired)',
                  message: 'Offline grace period (14 days) expired. Please connect to the internet to re-verify your Gumroad license.'
                };
              }

              // Background periodic re-verification (at most once every 24h, increment_uses_count: false)
              if (this.productId && elapsedSinceVerification > 24 * 60 * 60 * 1000 && !this.isReverifying) {
                this.isReverifying = true;
                verifyGumroadApi(data.licenseKey, { productId: this.productId, incrementUsesCount: false })
                  .then((reCheck) => {
                    this.isReverifying = false;
                    if (reCheck.success) {
                      data.verifiedAt = Date.now();
                      const updatedEnvelope = encryptEnvelope(JSON.stringify(data), this.vaultKey);
                      try { fs.writeFileSync(this.licenseFile, JSON.stringify(updatedEnvelope, null, 2), 'utf8'); } catch (_) {}
                    } else if (reCheck.revoked) {
                      // Refunded or chargebacked -> revoke immediately
                      try { fs.unlinkSync(this.licenseFile); } catch (_) {}
                    }
                  })
                  .catch(() => {
                    this.isReverifying = false;
                  });
              }

              const masked = data.licenseKey.length > 12
                ? `${data.licenseKey.slice(0, 8)}...${data.licenseKey.slice(-4)}`
                : 'PRO-ACTIVATED';

              const graceDaysLeft = Math.max(0, Math.ceil((this.offlineGraceMs - elapsedSinceVerification) / (1000 * 60 * 60 * 24)));

              return {
                isPro: true,
                isTrial: false,
                isExpired: false,
                plan: 'Commercial Pro Lifetime',
                statusLabel: 'PRO ACTIVATED',
                licenseKeyMasked: masked,
                activatedAt: data.activatedAt || new Date().toISOString(),
                machineId: this.machineId,
                type: 'Gumroad Commercial License',
                customerEmail: data.email || 'Gumroad Customer',
                graceDaysLeft,
                storageSecurity: envelope.mechanism === 'os_dpapi' ? 'Windows DPAPI' : 'AES-256-GCM',
                message: '8002CleanUp Pro is fully licensed via Gumroad.'
              };
            }
          }
        }
      }
    } catch (_) {}

    // No valid Pro license file, return trial status
    if (!trial.isExpired) {
      return {
        isPro: true,
        isTrial: true,
        isExpired: false,
        plan: `7-Day Free Trial (${trial.daysLeft}d left)`,
        statusLabel: `TRIAL: ${trial.daysLeft} DAYS LEFT`,
        licenseKeyMasked: 'TRIAL-EVALUATION-MODE',
        daysLeft: trial.daysLeft,
        trialStartedAt: trial.trialStartedAt,
        type: 'Free Trial Evaluation',
        message: `Evaluation Trial active. ${trial.daysLeft} day(s) remaining.`
      };
    }

    // Trial expired
    return {
      isPro: false,
      isTrial: false,
      isExpired: true,
      plan: 'Trial Expired',
      statusLabel: 'ACTIVATE PRO',
      licenseKeyMasked: 'NONE',
      daysLeft: 0,
      type: 'Unlicensed',
      message: 'Your 7-day free trial has expired. Activate a Pro license to continue live cleaning.'
    };
  }

  async activate(rawKey, email = '') {
    if (!rawKey || typeof rawKey !== 'string') {
      return { success: false, message: 'Please enter a valid license key.' };
    }

    const key = rawKey.trim();

    // 1. Check Server-Signed Asymmetric Offline Key (Ed25519 signature)
    const offlineCheck = verifyOfflineKey(key, this.publicKey);
    if (offlineCheck.valid) {
      const payload = {
        type: 'offline_ed25519',
        licenseKey: key,
        email: email.trim() || offlineCheck.email || 'Offline Activation',
        activatedAt: new Date().toISOString(),
        machineId: this.machineId
      };
      fs.writeFileSync(this.licenseFile, JSON.stringify(payload, null, 2), 'utf8');
      return {
        success: true,
        type: 'Asymmetric Offline Pro Key (Ed25519)',
        message: '✅ 8002CleanUp Pro successfully activated with your Pro key!'
      };
    }

    // 2. Check Gumroad Online API
    if (!this.productId) {
      return {
        success: false,
        message: 'Gumroad Product ID is pending live seller setup. If you purchased on Gumroad, enter your offline receipt key or contact support.'
      };
    }

    const gumroadRes = await verifyGumroadApi(key, { productId: this.productId, incrementUsesCount: true });
    if (gumroadRes.success) {
      const verifiedAt = Date.now();
      const purchaseId = gumroadRes.purchase?.id || '';
      const customerEmail = email.trim() || gumroadRes.purchase?.email || 'Gumroad Customer';

      const entitlementData = {
        type: 'gumroad',
        licenseKey: key,
        productId: this.productId,
        purchaseId,
        email: customerEmail,
        activatedAt: new Date().toISOString(),
        verifiedAt,
        machineId: this.machineId,
        purchaseDetails: {
          productName: gumroadRes.purchase?.product_name || '8002CleanUp Pro Windows',
          price: gumroadRes.purchase?.price || 0,
          currency: gumroadRes.purchase?.currency || 'usd'
        }
      };

      const envelope = encryptEnvelope(JSON.stringify(entitlementData), this.vaultKey);
      fs.writeFileSync(this.licenseFile, JSON.stringify(envelope, null, 2), 'utf8');

      return {
        success: true,
        type: 'Gumroad Commercial License',
        message: '✅ Gumroad License successfully verified! 8002CleanUp Pro is fully activated.'
      };
    }

    if (gumroadRes.networkError) {
      return {
        success: false,
        message: 'Network error connecting to Gumroad verification server. If you have an offline Pro key, you can activate immediately without internet.'
      };
    }

    return {
      success: false,
      message: gumroadRes.message || 'The license key provided is invalid or not recognized.'
    };
  }

  deactivate() {
    try {
      if (fs.existsSync(this.licenseFile)) {
        fs.unlinkSync(this.licenseFile);
        return { success: true, message: 'License deactivated on this machine. You can now use your key on another device.' };
      }
    } catch (e) {
      return { success: false, message: e.message };
    }
    return { success: true, message: 'No active license to deactivate.' };
  }
}

module.exports = {
  LicenseManager,
  verifyOfflineKey,
  verifyGumroadApi,
  inspectPurchaseStatus,
  encryptEnvelope,
  decryptEnvelope,
  isOsStorageAvailable,
  getMachineFingerprint,
  VENDOR_PUBLIC_KEY,
  DEFAULT_GUMROAD_PRODUCT_ID,
  OFFLINE_GRACE_MS
};

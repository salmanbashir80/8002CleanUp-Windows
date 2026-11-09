/**
 * 8002CleanUp Pro — Commercial Licensing & Trial Management Engine
 * Windows 10 & 11 Commercial Distribution
 *
 * Security Hardening:
 * 1. Tamper-Resistant Local Entitlements (Machine-Bound HMAC)
 * 2. Cryptographic Ed25519 Offline Receipts (Verified exclusively with VENDOR_PUBLIC_KEY)
 * 3. Gumroad API (product_id, refund/dispute/chargeback rejection, non-incrementing re-verification)
 * 4. 14-day Offline Grace Period with Automatic Revocation Check
 * 5. Tamper-Resistant 7-Day Evaluation Trial
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const https = require('https');

const TRIAL_DAYS = 7;
const OFFLINE_GRACE_MS = 14 * 24 * 60 * 60 * 1000; // 14 days
const DEFAULT_GUMROAD_PRODUCT_ID = '8002cleanup-pro-windows';

// Vendor Ed25519 Public Key for offline commercial license verification.
// PRIVATE SIGNING KEY IS NEVER EMBEDDED IN CLIENT BUILDS OR COMMITTED TO THE REPO.
const VENDOR_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAAmka4vkGQZi2aswH+22Pw6YxELT1FS3qH2tPY5t2FG4=
-----END PUBLIC KEY-----`;

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
 * Validates an asymmetric offline Pro license key / server-signed receipt.
 * Format: 8002-PRO.<base64url(payload)>.<base64url(signature)>
 * Verified exclusively against VENDOR_PUBLIC_KEY using Ed25519.
 * An attacker cannot forge this without the vendor's private key.
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
      return { valid: false, expired: true, message: 'License has expired.' };
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
 * Uses product_id. Rejects refunds, disputes, and chargebacks.
 * increment_uses_count is true only on first activation, false on status checks.
 */
function verifyGumroadApi(licenseKey, options = {}) {
  const productId = options.productId || process.env.GUMROAD_PRODUCT_ID || DEFAULT_GUMROAD_PRODUCT_ID;
  const incrementUsesCount = Boolean(options.incrementUsesCount);

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

            // Reject invalid, refunded, disputed, or chargebacked purchases
            if (purchase.refunded) {
              return resolve({
                success: false,
                refunded: true,
                message: 'License Revoked: This purchase has been refunded.'
              });
            }
            if (purchase.chargebacked) {
              return resolve({
                success: false,
                chargebacked: true,
                message: 'License Revoked: Chargeback detected for this purchase.'
              });
            }
            if (purchase.disputed) {
              return resolve({
                success: false,
                disputed: true,
                message: 'License Inactive: This purchase is currently disputed.'
              });
            }
            if (purchase.subscription_cancelled_at || purchase.subscription_failed_at) {
              return resolve({
                success: false,
                cancelled: true,
                message: 'License Inactive: Associated subscription was cancelled or payment failed.'
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
    this.productId = options.productId || process.env.GUMROAD_PRODUCT_ID || DEFAULT_GUMROAD_PRODUCT_ID;
    this.machineId = getMachineFingerprint();
    this.machineSecret = crypto.createHash('sha256').update(`8002::${this.machineId}::salt_2026`).digest();
    this.storageDir = getStorageDir(appInstance);
    this.licenseFile = path.join(this.storageDir, 'license_vault.json');
    this.trialFile = path.join(this.storageDir, '.trial_epoch');
    this.offlineGraceMs = options.offlineGraceMs || OFFLINE_GRACE_MS;
    this.isReverifying = false;
  }

  _signEntitlement(fields) {
    const raw = fields.join('::');
    return crypto.createHmac('sha256', this.machineSecret).update(raw).digest('hex');
  }

  _verifyEntitlement(fields, expectedHmac) {
    if (!expectedHmac || typeof expectedHmac !== 'string') return false;
    const computed = this._signEntitlement(fields);
    return crypto.timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(expectedHmac, 'hex'));
  }

  getTrialInfo() {
    let epoch = 0;
    try {
      if (fs.existsSync(this.trialFile)) {
        const raw = fs.readFileSync(this.trialFile, 'utf8').trim();
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.epoch === 'number' && parsed.hmac) {
          const expected = this._signEntitlement(['trial', String(parsed.epoch), this.machineId]);
          if (crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(parsed.hmac, 'hex'))) {
            epoch = parsed.epoch;
          } else {
            // Tampered trial epoch file -> immediate expiration
            epoch = 0;
          }
        }
      } else {
        epoch = Date.now();
        const hmac = this._signEntitlement(['trial', String(epoch), this.machineId]);
        fs.writeFileSync(this.trialFile, JSON.stringify({ epoch, hmac }, null, 2), 'utf8');
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
        const data = JSON.parse(raw);

        if (data && data.licenseKey) {
          // 1. Server-Signed Asymmetric Ed25519 Offline Key / Receipt
          if (data.type === 'offline_ed25519' || data.licenseKey.startsWith('8002-PRO.')) {
            // NEVER trust any boolean flags in JSON. Always cryptographically verify against VENDOR_PUBLIC_KEY.
            const offlineCheck = verifyOfflineKey(data.licenseKey, this.publicKey);
            if (offlineCheck.valid) {
              const masked = data.licenseKey.length > 16
                ? `${data.licenseKey.slice(0, 12)}...${data.licenseKey.slice(-6)}`
                : 'PRO-ACTIVATED';
              return {
                isPro: true,
                isTrial: false,
                isExpired: false,
                plan: 'Commercial Pro Lifetime',
                statusLabel: 'PRO ACTIVATED',
                licenseKeyMasked: masked,
                activatedAt: data.activatedAt || new Date().toISOString(),
                machineId: this.machineId,
                type: 'Asymmetric Offline Pro Key (Ed25519)',
                customerEmail: offlineCheck.email || data.email || 'Commercial Customer',
                message: '8002CleanUp Pro is fully licensed and active.'
              };
            }
          }

          // 2. Gumroad Verified Entitlement
          if (data.type === 'gumroad') {
            // Verify tamper-resistant HMAC. If user hand-edited the JSON, HMAC check fails.
            const isValidHmac = this._verifyEntitlement(
              [data.licenseKey, data.productId, data.purchaseId || '', data.email || '', String(data.verifiedAt), this.machineId],
              data.entitlementHmac
            );

            if (isValidHmac && data.machineId === this.machineId) {
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

              // Trigger background periodic re-verification (at most once every 24 hours, non-incrementing)
              if (elapsedSinceVerification > 24 * 60 * 60 * 1000 && !this.isReverifying) {
                this.isReverifying = true;
                verifyGumroadApi(data.licenseKey, { productId: this.productId, incrementUsesCount: false })
                  .then((reCheck) => {
                    this.isReverifying = false;
                    if (reCheck.success) {
                      // Update verifiedAt timestamp and recompute HMAC
                      data.verifiedAt = Date.now();
                      data.entitlementHmac = this._signEntitlement([
                        data.licenseKey,
                        data.productId,
                        data.purchaseId || '',
                        data.email || '',
                        String(data.verifiedAt),
                        this.machineId
                      ]);
                      try { fs.writeFileSync(this.licenseFile, JSON.stringify(data, null, 2), 'utf8'); } catch (_) {}
                    } else if (reCheck.refunded || reCheck.chargebacked || reCheck.disputed || reCheck.cancelled) {
                      // Revoke immediately
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
        isPro: true, // During trial, all features are enabled
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

    // 2. Check Gumroad Online API (first activation: increment_uses_count = true)
    const gumroadRes = await verifyGumroadApi(key, { productId: this.productId, incrementUsesCount: true });
    if (gumroadRes.success) {
      const verifiedAt = Date.now();
      const purchaseId = gumroadRes.purchase?.id || '';
      const customerEmail = email.trim() || gumroadRes.purchase?.email || 'Gumroad Customer';

      const entitlementHmac = this._signEntitlement([
        key,
        this.productId,
        purchaseId,
        customerEmail,
        String(verifiedAt),
        this.machineId
      ]);

      const payload = {
        type: 'gumroad',
        licenseKey: key,
        productId: this.productId,
        purchaseId,
        email: customerEmail,
        activatedAt: new Date().toISOString(),
        verifiedAt,
        machineId: this.machineId,
        entitlementHmac,
        purchaseDetails: {
          productName: gumroadRes.purchase?.product_name || '8002CleanUp Pro Windows',
          price: gumroadRes.purchase?.price || 0,
          currency: gumroadRes.purchase?.currency || 'usd'
        }
      };
      fs.writeFileSync(this.licenseFile, JSON.stringify(payload, null, 2), 'utf8');
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
  getMachineFingerprint,
  VENDOR_PUBLIC_KEY,
  DEFAULT_GUMROAD_PRODUCT_ID,
  OFFLINE_GRACE_MS
};

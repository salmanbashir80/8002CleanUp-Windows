/**
 * 8002CleanUp Pro — Commercial Licensing & Trial Management Engine
 * Uses Asymmetric Ed25519 Public-Key Verification (No private keys embedded)
 * + Gumroad Online License API + 7-Day Free Evaluation Trial
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const https = require('https');

const TRIAL_DAYS = 7;
const GUMROAD_PERMALINK = '8002cleanup-pro';

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
    process.env.USERDOMAIN || ''
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
 * Validates an asymmetric offline Pro license key.
 * Format: 8002-PRO.<base64url(payload)>.<base64url(signature)>
 * Verified exclusively against VENDOR_PUBLIC_KEY using Ed25519.
 */
function verifyOfflineKey(rawKey, pubKey = VENDOR_PUBLIC_KEY) {
  if (!rawKey || typeof rawKey !== 'string') return { valid: false };
  const clean = rawKey.trim();

  // Must match prefix
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

    return {
      valid: true,
      email: payload.email || 'Licensed Customer',
      tier: payload.tier || 'Lifetime Pro',
      issuedAt: payload.issuedAt
    };
  } catch (_e) {
    return { valid: false };
  }
}

/**
 * Verifies key with Gumroad API:
 * POST https://api.gumroad.com/v2/licenses/verify
 */
function verifyGumroadApi(licenseKey, permalink = GUMROAD_PERMALINK) {
  return new Promise((resolve) => {
    const postData = `product_permalink=${encodeURIComponent(permalink)}&license_key=${encodeURIComponent(licenseKey)}&increment_uses_count=true`;
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
            if (data && data.success === true) {
              resolve({
                success: true,
                uses: data.uses || 1,
                purchase: data.purchase || {},
                message: 'Verified successfully via Gumroad.'
              });
            } else {
              resolve({
                success: false,
                message: data.message || 'Invalid Gumroad license key.'
              });
            }
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
    this.machineId = getMachineFingerprint();
    this.storageDir = getStorageDir(appInstance);
    this.licenseFile = path.join(this.storageDir, 'license_vault.json');
    this.trialFile = path.join(this.storageDir, '.trial_epoch');
  }

  getTrialInfo() {
    let epoch = 0;
    try {
      if (fs.existsSync(this.trialFile)) {
        const raw = fs.readFileSync(this.trialFile, 'utf8').trim();
        epoch = parseInt(raw, 10) || 0;
      } else {
        epoch = Date.now();
        fs.writeFileSync(this.trialFile, String(epoch), 'utf8');
      }
    } catch (_) {
      epoch = Date.now();
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
          const offlineCheck = verifyOfflineKey(data.licenseKey, this.publicKey);
          const isVerifiedGumroad = data.isGumroad && data.verified;

          if (offlineCheck.valid || isVerifiedGumroad) {
            const masked = data.licenseKey.length > 12
              ? `${data.licenseKey.slice(0, 8)}...${data.licenseKey.slice(-4)}`
              : 'PRO-ACTIVATED';
            return {
              isPro: true,
              isTrial: false,
              plan: 'Commercial Pro Lifetime',
              statusLabel: 'PRO ACTIVATED',
              licenseKeyMasked: masked,
              activatedAt: data.activatedAt || new Date().toISOString(),
              machineId: this.machineId,
              type: offlineCheck.valid ? 'Asymmetric Offline Pro Key (Ed25519)' : 'Gumroad Verified License',
              customerEmail: data.email || 'Commercial Customer',
              message: '8002CleanUp Pro is fully licensed and active.'
            };
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

    // 1. Check Asymmetric Offline Key First (Ed25519 signature)
    const offlineCheck = verifyOfflineKey(key, this.publicKey);
    if (offlineCheck.valid) {
      const payload = {
        licenseKey: key,
        isGumroad: false,
        verified: true,
        email: email.trim() || offlineCheck.email || 'Offline Activation',
        activatedAt: new Date().toISOString(),
        machineId: this.machineId,
        checksum: crypto.createHash('sha256').update(key + this.machineId).digest('hex')
      };
      fs.writeFileSync(this.licenseFile, JSON.stringify(payload, null, 2), 'utf8');
      return {
        success: true,
        type: 'Asymmetric Offline Pro Key (Ed25519)',
        message: '✅ 8002CleanUp Pro successfully activated with your Pro key!'
      };
    }

    // 2. Check Gumroad Online API
    const gumroadRes = await verifyGumroadApi(key);
    if (gumroadRes.success) {
      const payload = {
        licenseKey: key,
        isGumroad: true,
        verified: true,
        email: email.trim() || gumroadRes.purchase?.email || 'Gumroad Customer',
        activatedAt: new Date().toISOString(),
        machineId: this.machineId,
        uses: gumroadRes.uses,
        purchaseDetails: {
          productName: gumroadRes.purchase?.product_name || '8002CleanUp Pro Windows',
          price: gumroadRes.purchase?.price || 0,
          currency: gumroadRes.purchase?.currency || 'usd'
        },
        checksum: crypto.createHash('sha256').update(key + this.machineId).digest('hex')
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
  getMachineFingerprint,
  VENDOR_PUBLIC_KEY
};

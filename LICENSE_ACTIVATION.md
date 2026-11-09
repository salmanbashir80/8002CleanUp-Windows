# 8002CleanUp Pro — Commercial License Activation Guide

Thank you for choosing **8002CleanUp Pro for Windows 10 & 11**.

---

## 🔑 Activating via Gumroad License Key (Online)

When you purchase 8002CleanUp Pro on Gumroad, your purchase confirmation email contains a unique **License Key**.

1. Launch **8002CleanUp Pro**.
2. Click the **"ACTIVATE PRO"** badge located in the top-right toolbar.
3. In the License Activation modal:
   - Paste your **Gumroad License Key** into the license key input field.
   - Enter your **Email Address** associated with your Gumroad order.
4. Click **"Activate Pro License"**.
5. Once verified, your status will update to **`PRO ACTIVATED`**.
6. Your license token is securely cached locally, so 8002CleanUp Pro continues operating **100% offline** without needing a persistent internet connection.

---

## 📴 Activating on Offline / Air-Gapped Machines

If your Windows PC does not have internet access:
1. Contact customer support (`salmanbashir80@github.com`) or check your Gumroad delivery receipt for your **Asymmetric Offline Pro Key**.
2. Format: `8002-PRO.<base64_payload>.<base64_signature>`
3. Paste this key into the activation modal.
4. The key is verified locally via the built-in **Ed25519 vendor public key** without making any network calls.

---

## 🛠️ Seller Note: Connecting Your Live Gumroad Product

When creating your product listing on Gumroad:
1. Under Product Settings, enable **"Generate a unique license key per sale"**.
2. Copy your unique alphanumeric **Product ID** (or permalink) from the Gumroad URL.
3. Configure `process.env.GUMROAD_PRODUCT_ID` or pass it when initializing the build.
4. Test purchase using Gumroad's "Test purchase" toggle to verify live online fulfillment.

---

## 🔄 Transferring Your License to a New PC

Your commercial license allows you to transfer your activation when migrating to a new computer:
1. Open 8002CleanUp Pro on your existing PC.
2. Click the **PRO ACTIVATED** badge in the top bar.
3. Click **"Transfer / Deactivate"**.
4. Confirm deactivation.
5. On your new PC, enter your license key to activate.

# 8002CleanUp Pro v2.5.4 — Commercial Gumroad Internal Product ID Alignment

**Release Date:** November 9, 2026  
**Target Operating Systems:** Windows 10 & Windows 11 (64-bit / x64)  
**Distribution:** Gumroad & GitHub Commercial Release  
**Official Gumroad Product ID:** `lpv4uWXtGoUHvGYrSqKq2w==`  
**Live Store Link:** `https://salman8002.gumroad.com/l/8002cleanup-windows`

---

## 🌟 What's New in Version 2.5.4

### 1. Verified Gumroad Internal Product ID (`lpv4uWXtGoUHvGYrSqKq2w==`)
- Updated native license verification configuration with the verified internal Product ID (`lpv4uWXtGoUHvGYrSqKq2w==`) required by Gumroad's official License Key API (`POST https://api.gumroad.com/v2/licenses/verify`).
- Retains non-incrementing background re-check logic (`increment_uses_count: false`) to prevent duplicate activation counting on standard application launches.

### 2. Complete Auto-Update & Security Preservation
- Maintains the in-app Software Update Center (`UpdateModal.tsx` and `updateManager.cjs`), automated draft release isolation, and streaming SHA-256 integrity verification.
- Fully preserves DPAPI-encrypted customer license tokens (`%APPDATA%\8002CleanUp Pro\license\license_vault.json`) and user preferences across upgrades.

---

# 8002CleanUp Pro v2.5.3 — Commercial Auto-Update Release Notes

**Release Date:** November 9, 2026  
**Target Operating Systems:** Windows 10 & Windows 11 (64-bit / x64)  
**Distribution:** Gumroad & GitHub Commercial Release  
**Official Product ID:** `eyirop`  
**Live Store Link:** `https://salman8002.gumroad.com/l/8002cleanup-windows`

---

## 🌟 What's New in Version 2.5.3

### 1. In-App Software Update Center (`src/components/UpdateModal.tsx`)
- Native Windows 10/11 Cyber Glass modal featuring version comparison (`v2.5.2 → v2.5.3`), package selection (Setup Installer vs Portable), release notes, real-time download progress bar, and cryptographic SHA-256 integrity validation.
- One-click update launch with clear Windows SmartScreen transparency guidance (*"More info" → "Run anyway"* for direct Gumroad releases).

### 2. Automated Draft Release Filtering & Cryptographic Verification
- Auto-update engine (`electron/updateManager.cjs`) strictly checks official GitHub Releases, automatically ignoring draft releases so pre-release builds remain invisible to customers.
- On-the-fly streaming SHA-256 calculation against published `SHA256SUMS.txt`. If a mismatched or corrupted hash is detected, the staged binary is **instantly deleted from disk** to guarantee safety.

### 3. Lifetime Customer License & Settings Retention Guarantee
- All commercial licensing tokens in `%APPDATA%\8002CleanUp Pro\license\license_vault.json` and user configurations remain 100% active and untouched across NSIS installer upgrades. No license re-entry or repurchase needed.

---

# 8002CleanUp Pro v2.5.2 — Commercial Gumroad Integration Release Notes

**Release Date:** November 9, 2026  
**Target Operating Systems:** Windows 10 & Windows 11 (64-bit / x64)  
**Distribution:** Gumroad & GitHub Commercial Release  
**Official Product ID:** `eyirop`  
**Live Store Link:** `https://salman8002.gumroad.com/l/8002cleanup-windows`

---

## 🌟 What's New in Version 2.5.2

### 1. Permanent Gumroad Product ID `eyirop`
- Permanently embedded official Gumroad Product ID `eyirop` into distribution builds and runtime fallback configuration. No missing shell environment variables required on end-user machines.
- Confirmed against live Gumroad license verification endpoint (`POST https://api.gumroad.com/v2/licenses/verify`).

### 2. Live Store Links & Customer Experience
- Updated in-app purchase triggers, welcome guides, and license modal buttons directly to the live commercial listing `https://salman8002.gumroad.com/l/8002cleanup-windows`.

### 3. OS-Backed DPAPI Encryption & Tamper Resistance
- Uses Windows DPAPI via Electron `safeStorage` (with authenticated AES-256-GCM fallback) to secure all local license state.
- Automated revocation for refunded, disputed, and chargebacked purchases.

---

# 8002CleanUp Pro v2.5.1 — Commercial Security Release Notes

**Release Date:** November 9, 2026  
**Target Operating Systems:** Windows 10 & Windows 11 (64-bit / x64)  
**Distribution:** Gumroad & GitHub Commercial Release  

---

## 🌟 Security & Integrity Corrections in Version 2.5.1

Version 2.5.1 delivers critical security enhancements and hardening across commercial licensing, telemetry truthfulness, and Windows filesystem safety:

### 1. License File Anti-Tampering & Entitlement HMAC
- **Eliminated Editable Flags:** Completely removed reliance on local boolean flags (`isGumroad`, `verified`). Local JSON edits cannot grant Pro status.
- **Cryptographic Machine-Bound Entitlements:** Gumroad cached tokens are protected by a machine-secret HMAC (`entitlementHmac`). Any manual alteration invalidates the license instantly.
- **Asymmetric Offline Verification:** Offline keys and receipts (`8002-PRO.<payload>.<sig>`) are cryptographically verified against the embedded Ed25519 vendor public key on every status check.

### 2. Gumroad API Architecture Hardening
- **Product ID Migration:** Updated license verification endpoint to use `product_id` (`8002cleanup-pro-windows`).
- **Fraud & Refund Prevention:** Explicitly checks and rejects refunded, disputed, chargebacked, and cancelled purchases.
- **Activation Count Protection:** `increment_uses_count` is set to `true` strictly during initial activation, and `false` during background re-verifications.
- **14-Day Offline Grace Period:** Allows 14 days of offline operation with background revocation checks when internet connectivity is present.

### 3. Privileged Main-Process IPC Enforcement
- **Comprehensive License Auditing:** Privileged cleanup actions (`clean-items`, `clean-browser-data`, `empty-recycle-bin`, `clean-registry`, `shred-file`, `optimize-ram`, and `apply-dns`) evaluate license state directly in the Electron main process via `isProOrActiveTrial()`. Tampering with React state in DevTools cannot bypass Pro requirements.
- **Free Feature Preservation:** Dry-run preview scans, system telemetry, activity monitoring, registry backups, network restores, and ScamAdviser trust checks remain 100% free and fully functional.

### 4. Hardware Telemetry Accuracy
- **Eliminated Simulated Metrics:** Removed synthetic formulas for battery temperature and wattage.
- **Genuine Hardware Queries:** Battery charge, charging state, and health are retrieved directly via WMI/CIM. When hardware sensors are not exposed by the operating system, values are accurately presented as "Not available".
- **Instantaneous Delta CPU Calculation:** Replaced cumulative lifetime CPU tick math with real instantaneous delta sampling across CPU intervals.

### 5. Filesystem Safety & Junction / Symlink Protection
- **Anti-Junction Traversal:** Iterative directory traversal detects NTFS junctions, reparse points, and symlinks (`st.isSymbolicLink()`), safely unlinking the pointer without recursing into target directories.
- **System Directory Shredding Guard:** `shred-file` explicitly blocks attempts to overwrite Windows system roots (`C:\Windows`, `C:\Program Files`).
- **Canonical Allowlist Enforcement:** `clean-browser-data` and `clean-items` enforce strict allowlists before touching any filesystem node.

---

## 📦 Package Deliverables

| File | Type | Description |
|---|---|---|
| `8002CleanUp-Windows-Setup-v2.5.1.exe` | NSIS Setup | Standard Windows Setup Wizard with Desktop & Start Menu shortcuts |
| `8002CleanUp-Windows-Portable-v2.5.1.exe` | Portable EXE | Zero-install standalone executable for USB & on-the-go maintenance |
| `8002CleanUp-Windows-v2.5.1-Gumroad.zip` | Archive | Commercial bundle containing EXEs, checksums, and documentation |
| `SHA256SUMS.txt` | Checksums | Cryptographic SHA-256 verification hashes |

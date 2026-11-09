# 8002CleanUp Pro v2.5.0 — Release Notes

**Release Date:** November 9, 2026  
**Target Operating Systems:** Windows 10 & Windows 11 (64-bit / x64)  
**Distribution:** Gumroad & GitHub Commercial Release  

---

## 🌟 Highlights of Version 2.5.0

Version 2.5.0 represents a major milestone for **8002CleanUp Pro**, delivering an audited, production-grade native Windows application designed for commercial distribution. This release hardens system cleaning safety, introduces asymmetric cryptographic licensing, adds automatic network configuration backups with one-click rollback, refines the dark/light UI for high-DPI scaling, and delivers both standard Windows Setup and Portable editions.

---

## 🛡️ Key Features & Improvements

### 1. Robust SafetyGuard & Canonical Path Allowlists
- **Anti-Traversal Protection:** Strict canonical path validation (`isSafeCleanTarget`) ensures cleaning operations cannot delete system-critical roots (`C:\Windows`, `C:\Program Files`, `C:\Windows\System32`, `UserProfiles`, etc.).
- **Windows Core Process Guard:** `isCriticalProcess` blocks accidental termination of essential operating system services (`csrss.exe`, `lsass.exe`, `services.exe`, `explorer.exe`, `smss.exe`, `svchost.exe`, and Windows Defender).
- **Preview-First Architecture:** Potentially destructive operations display preview item counts and byte sizes with user confirmation before executing.
- **PowerShell Argument Sanitization:** Safe array-based parameter passing replaces raw interpolated command strings.

### 2. Commercial Gumroad & Offline Asymmetric Licensing
- **Asymmetric Ed25519 Offline Verification:** Client verifies genuine cryptographically signed licenses using an embedded vendor public key. Private keys are never embedded in client binaries or repositories.
- **Gumroad License Verification API:** Live verification against Gumroad's license API with secure local token caching.
- **Fair 7-Day Free Trial:** Full feature access during trial period without intrusive telemetry or always-online requirements.
- **Renderer Tamper Resistance:** IPC backend enforces license verification directly within the Electron main process; renderer state manipulation cannot bypass Pro requirements.
- **License Management UI:** Clickable header badge, dedicated `LicenseModal` for activation, status checks, and license deactivation/transfers.

### 3. Network Shield & Reversible DNS/Hosts Configuration
- **Automatic Configuration Backups:** Saves original DNS adapter configurations (`dns_state.json`) and hosts file (`hosts.original.bak`) before applying any modifications.
- **One-Click Network Restore:** Added "Restore Network Backup" feature allowing users to instantly roll back DNS and hosts changes to their previous states.
- **Idempotent Hosts Sinkhole:** Managed block markers (`# --- 8002CleanUp Pro Hosts Shield Start ---`) prevent configuration bloat and duplication.
- **Accurate Branding:** Replaced third-party trademarks with transparent descriptions ("Privacy & Network Shield with Anycast DNS and 0.0.0.0 Hosts Sinkhole").

### 4. Native Windows Desktop Polish & High-DPI UI
- **Windows 10 & 11 Design Language:** Compact, responsive layout tuned for 100%, 125%, 150%, and 200% Windows display scaling.
- **Dark & Light Themes:** High-contrast, accessible visual themes with complete color token consistency.
- **Real-Time Telemetry:** Activity Monitor, RAM working set optimization via `psapi.dll`, battery & thermal lifeguards displaying accurate system metrics.
- **Electron Security Hardening:** Enforced Content Security Policy (CSP), disabled `nodeIntegration` in renderer, enabled `contextIsolation`, and restricted navigation to trusted external handlers.

---

## 📦 Package Deliverables

| File | Type | Description |
|---|---|---|
| `8002CleanUp-Windows-Setup-v2.5.0.exe` | NSIS Setup | Standard Windows Setup Wizard with Desktop & Start Menu shortcuts |
| `8002CleanUp-Windows-Portable-v2.5.0.exe` | Portable EXE | Zero-install standalone executable for USB & on-the-go maintenance |
| `8002CleanUp-Windows-v2.5.0-Gumroad.zip` | Archive | Customer distribution bundle containing both EXEs, checksums, and documentation |
| `SHA256SUMS.txt` | Checksums | Cryptographic SHA-256 verification hashes |

---

## 🔒 Security & Dependency Verification

- **Runtime Production Dependencies:** 0 vulnerabilities (`npm audit --omit=dev`).
- **Automated Test Suites:** 100% pass rate across Asymmetric License Manager and Windows Safety Guard test suites.

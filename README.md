# 8002CleanUp Pro — Windows 10 & Windows 11 Edition (`v2.5.2`)

[![Build Windows 10 & 11 EXE](https://github.com/salmanbashir80/8002CleanUp-Windows/actions/workflows/build-windows.yml/badge.svg)](https://github.com/salmanbashir80/8002CleanUp-Windows/actions/workflows/build-windows.yml)
[![Commercial License](https://img.shields.io/badge/License-Commercial%20%2F%20Gumroad-brightgreen)](https://salman8002.gumroad.com/l/8002cleanup-windows)
[![Platform](https://img.shields.io/badge/Platform-Windows%2010%20%7C%20Windows%2011%20(x64)-blue)](#)

**8002CleanUp Pro for Windows 10 & 11** is a commercial-grade, native Windows desktop optimization and privacy utility featuring a signature **3D Aurora Glass UI**, genuine native Windows system cleaning, dual-layer Network Shield, **NOVA AI Cyber Guardian Pet**, **Live Website Trust Scanner (0–100 Score)**, Battery Lifeguard, Activity Monitor, and commercial Gumroad fulfillment.

---

## ✨ Features (Windows 10 & Windows 11)

1. **Smart Care & System Junk Engine**
   - Scans & cleans real Windows paths with canonical path allowlists:
     - `%TEMP%` & `C:\Windows\Temp`
     - `C:\Windows\Prefetch`
     - `C:\Windows\SoftwareDistribution\Download` (Windows Update Cache)
     - `%LOCALAPPDATA%\D3DSCache` & `%LOCALAPPDATA%\CrashDumps`
     - `%LOCALAPPDATA%\Microsoft\Windows\Explorer` (Thumbnail caches)
     - Chrome, Edge, Brave, Opera & Firefox profile caches (`Cache_Data`, `Code Cache`, `GPUCache`, `ShaderCache`)
   - Safe dry-run preview before live cleaning.

2. **Network & Stealth Shield (Anycast Privacy DNS + 0.0.0.0 Hosts Sinkhole)**
   - **Dual-Layer Protection:** Switches to encrypted Anycast DNS resolvers (AdGuard DNS `94.140.14.14`, Cloudflare `1.1.1.1`, or Quad9 `9.9.9.9`) combined with local `0.0.0.0` hosts sinkhole.
   - **One-Click Backup & Recovery:** Automatically backs up original hosts and DNS configurations prior to modifications with one-click restore.
   - **NOVA AI Cyber Guardian Pet:** Live clipboard URL tracking parameter stripper (`utm_*`, `fbclid`, `gclid`).
   - **Live Website Trust Scanner:** 0–100 reputation score, HTTPS TLS certificate validation, HTTP security header inspection, and optional AI deep analysis via free Gemini 2.0 Flash or Groq Llama 3.3.

3. **Battery Lifeguard & Thermal HUD**
   - Real Windows WMI battery charge %, AC power state, thermal `°C` sensor (`MSAcpi_ThermalZoneTemperature`), health %, and cycle count.

4. **Activity Monitor & Process Manager**
   - Live Windows process list (`tasklist`) with memory & CPU impact metrics.
   - Core Windows system process protection prevents accidental termination of `csrss.exe`, `lsass.exe`, `explorer.exe`, etc.

5. **Performance Utilities & My Tools**
   - Windows WorkingSet RAM Optimizer via native `psapi.dll EmptyWorkingSet`.
   - Windows Game Turbo powercfg profile switching.
   - Windows DNS resolver cache flushing (`ipconfig /flushdns`).
   - Windows Registry orphan scanner with automatic `.reg` backups and restore manager.
   - PnP signed driver inspector & Windows Update launcher.
   - Deep File Recovery Studio for `$Recycle.Bin` hives.
   - DoD 5220 multi-pass secure file shredder.

6. **Commercial Licensing & Gumroad Fulfillment**
   - Online Gumroad license key verification (`https://api.gumroad.com/v2/licenses/verify`) with official Product ID `lpv4uWXtGoUHvGYrSqKq2w==`.
   - Store Link: `https://salman8002.gumroad.com/l/8002cleanup-windows`
   - Offline Cryptographic Pro keys (`8002-PRO-XXXX-XXXX-XXXX`) for air-gapped systems.
   - 7-Day Free Trial evaluation mode.

---

## 🚀 Download Windows `.exe`

Go to [**GitHub Releases**](https://github.com/salmanbashir80/8002CleanUp-Windows/releases) or [**Gumroad**](https://salman8002.gumroad.com/l/8002cleanup-windows) to download:
- **`8002CleanUp-Windows-Setup-v2.5.2.exe`** (Full Windows 10/11 Setup Installer with Desktop & Start Menu shortcuts)
- **`8002CleanUp-Windows-Portable-v2.5.2.exe`** (Single-click Portable `.exe` — no installation required)
- **`8002CleanUp-Windows-Commercial-v2.5.2.zip`** (Commercial distribution bundle with EULA and Setup guide)

---

## 💻 System Requirements

- **OS:** Windows 10 or Windows 11 (64-bit / x64)
- **Memory:** 4 GB RAM minimum (8 GB recommended)
- **Storage:** 180 MB free disk space
- **Display Scaling:** Fully compatible with 100%, 125%, 150%, and 200% Windows DPI scaling.

---

## 🛠️ Local Development & Automated Testing

```bash
# Install dependencies
npm install

# Run type checking and automated safety tests
npm run check

# Run live desktop app
npm run electron:dev

# Package Windows NSIS installer + portable executable
npm run dist:win
```

---

## ⚖️ Legal Disclaimers & Transparency

8002CleanUp Pro is an independent commercial utility developed by Salman Bashir / 8002.
8002CleanUp Pro is NOT affiliated with, sponsored by, or endorsed by Microsoft Corporation, AdGuard, ScamAdviser, or Apple Inc. All third-party trademarks are the property of their respective owners.

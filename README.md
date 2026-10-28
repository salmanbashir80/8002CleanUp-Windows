# 8002CleanUp Pro — Windows 10 & Windows 11 Edition (`v1.2.8`)

**8002CleanUp Pro for Windows 10 & 11** brings the signature **3D Aurora Glass UI** from MacCare Pro to Windows with real native Windows system cleaning, AdGuard-grade Network & Stealth Protection, **NOVA AI Cyber Guardian Pet**, **ScamAdviser Live Website Trust Scanner (0–100 Score)**, Battery Lifeguard (`°C` thermal & charge stats), Activity Monitor, and My Tools.

---

## ✨ Features (Windows 10 & Windows 11)

1. **Smart Care & System Junk Engine**
   - Scans & cleans real Windows paths:
     - `%TEMP%` & `C:\Windows\Temp`
     - `C:\Windows\Prefetch`
     - `C:\Windows\SoftwareDistribution\Download` (Windows Update Cache)
     - `%LOCALAPPDATA%\D3DSCache` & `%LOCALAPPDATA%\CrashDumps`
     - `%LOCALAPPDATA%\Microsoft\Windows\Explorer` (Thumbnail caches)
     - Chrome, Edge, Brave & Firefox caches (`Cache_Data`, `Code Cache`, `GPUCache`)
   - Moves cleaned files safely to Recycle Bin (`shell.trashItem`) with fallback removal.
2. **Network Shield (8-Tab AdGuard Suite + NOVA AI Cyber Guardian)**
   - **General, Filters, DNS, Stealth Mode, Assistant, Network (`Applications...` manager)**
   - **NOVA AI Cyber Guardian Pet** with live Clipboard URL Tracking Stripper (`utm_*`, `fbclid`, `gclid`)
   - **ScamAdviser Live Website Trust Scanner** (`0–100` Trust Score, `1–5 ★` Rating, HTTPS/TLD/Phishing heuristics + Live AI Deep Analysis)
   - **Free AI API Key Setup Wizard** (Supports free **Google Gemini 2.0 Flash** & **Groq Llama 3.3 70B** keys)
   - Real Windows DNS switching via PowerShell (`Set-DnsClientServerAddress`) for AdGuard DNS, Cloudflare `1.1.1.2`, and Quad9 `9.9.9.9`.
3. **Battery Lifeguard (3D Aurora Cards)**
   - Real Windows WMI battery charge %, charging state, thermal `°C` sensor (`MSAcpi_ThermalZoneTemperature`), health %, and cycle estimation.
4. **Activity Monitor & Process Manager**
   - Live Windows process list (`tasklist`) + one-click process termination (`taskkill /PID <pid> /F`).
5. **My Tools**
   - DNS Cache Flush (`ipconfig /flushdns`), Windows RAM Optimizer, Storage Analyzer, and Safe Startup items check.

---

## 🚀 Download Windows `.exe` Installer

Go to [**Releases**](https://github.com/salmanbashir80/8002CleanUp-Windows/releases) to download:
- **`8002CleanUp-Windows-Setup-1.2.8.exe`** (Full Windows 10/11 Installer with Desktop & Start Menu shortcuts)
- **`8002CleanUp-Windows-Portable-1.2.8.exe`** (Single-click Portable `.exe` — no installation required)

---

## 🛠️ Local Development & Build

```bash
npm install

# Run live desktop app (works on Windows 10/11 and macOS preview)
npm run electron:dev

# Package Windows 10/11 .exe installer + portable executable
npm run dist:win
```

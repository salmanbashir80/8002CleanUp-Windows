# 8002CleanUp Pro — Installation & Setup Guide (Windows 10 & 11)

Welcome to **8002CleanUp Pro for Windows 10 & 11** (`v2.5.5`).

---

## 📦 Available Editions

You can choose between two executables depending on your workflow:

1. **Setup Installer (`8002CleanUp-Windows-Setup-v2.5.5.exe`)**
   - Standard Windows setup wizard
   - Adds shortcuts to Desktop and Start Menu
   - Registers Clean uninstaller in Windows Settings -> Installed Apps
   - Recommended for daily primary PC usage

2. **Portable Edition (`8002CleanUp-Windows-Portable-v2.5.5.exe`)**
   - Single-file executable with zero installation
   - Run directly from any folder, USB thumb drive, or external storage
   - Leaves no permanent installer registry footprints
   - Recommended for IT technicians and on-the-go maintenance

---

## 🚀 How to Install and Launch

### Using the Setup Installer:
1. Download `8002CleanUp-Windows-Setup-v2.5.5.exe`.
2. Double-click the installer.
3. Select your preferred installation destination folder (default: `C:\Users\<YourUser>\AppData\Local\Programs\8002CleanUp Pro`).
4. Follow the setup wizard to complete the installation.
5. Launch **8002CleanUp Pro** from your Desktop shortcut or Start Menu.

### Using the Portable Edition:
1. Download `8002CleanUp-Windows-Portable-v2.5.5.exe`.
2. Move it to your preferred folder (or USB drive).
3. Double-click to launch immediately.

---

## 🛡️ Windows Defender & SmartScreen Notice

If Windows SmartScreen displays a prompt such as:
> *"Windows protected your PC — Microsoft Defender SmartScreen prevented an unrecognized app from starting"*

This occurs on newly released direct-distribution Windows binaries that have not yet accumulated millions of global download telemetry points in Microsoft's cloud reputation catalog.

**To continue safely:**
1. Click **More info**.
2. Click **Run anyway**.
3. Verify the publisher and SHA-256 hash match `SHA256SUMS.txt` if desired.

---

## ⚡ Permissions & UAC Elevation
- **Standard User:** Basic system telemetry, memory stats, dry-run scan preview, and web trust scanning run without administrator elevation.
- **Administrator Elevation:** System-wide operations (cleaning Windows Update cache, clearing `C:\Windows\Temp`, trimming RAM working sets via `psapi.dll`, and applying Anycast DNS or hosts sinkholes) will trigger a standard Windows User Account Control (UAC) prompt to request authorized permission.

---

## 🔄 Uninstallation
To cleanly uninstall:
1. Open Windows **Settings** (`Win + I`) -> **Apps** -> **Installed Apps**.
2. Locate **8002CleanUp Pro**.
3. Click **Uninstall** and confirm.

## Administrator actions

The app starts with your normal Windows permissions. For system-wide DNS, registry or other administrator-only actions, right-click the app and choose **Run as administrator**. This preserves Windows UAC and allows Chromium sandboxed child processes to launch correctly. Ordinary scans and user-cache operations do not require blanket elevation.

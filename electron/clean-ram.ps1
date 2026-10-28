$definition = @"
using System;
using System.Runtime.InteropServices;
public class MemoryCleaner {
    [DllImport("psapi.dll")]
    public static extern int EmptyWorkingSet(IntPtr hwProc);
    public static int CleanAll() {
        int freedCount = 0;
        foreach (System.Diagnostics.Process p in System.Diagnostics.Process.GetProcesses()) {
            try {
                if (EmptyWorkingSet(p.Handle) != 0) {
                    freedCount++;
                }
            } catch {}
        }
        return freedCount;
    }
}
"@
Add-Type -TypeDefinition $definition
$before = (Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory
$count = [MemoryCleaner]::CleanAll()
$after = (Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory
$diffMB = [math]::Round(($after - $before) / 1024, 1)
$freedBytes = [math]::Max(0, ($after - $before) * 1024)
$res = @{
    processesCleaned = $count
    beforeFreeMB = [math]::Round($before / 1024)
    afterFreeMB = [math]::Round($after / 1024)
    freedMB = $diffMB
    freedBytes = $freedBytes
}
$res | ConvertTo-Json -Compress

$ErrorActionPreference = 'Stop'
$started = Get-Date
$report = [ordered]@{ status='NOT TESTED'; started=$started.ToUniversalTime().ToString('o'); source=$env:GITHUB_SHA; reason=$null }
try {
    $status = Get-MpComputerStatus
    if (-not $status.AntivirusEnabled -or -not $status.AMServiceEnabled) { throw 'Defender antivirus service is not enabled on this runner' }
    $report.engineVersion = $status.AMEngineVersion
    $report.signatureVersion = $status.AntivirusSignatureVersion
    $report.signatureUpdated = $status.AntivirusSignatureLastUpdated.ToUniversalTime().ToString('o')
    $path = (Resolve-Path release).Path
    Start-MpScan -ScanType CustomScan -ScanPath $path
    $detections = @(Get-MpThreatDetection | Where-Object { $_.InitialDetectionTime -ge $started -and ($_.Resources | Where-Object { $_ -like "*$path*" }) })
    if ($detections.Count -gt 0) { $report.status='FAIL'; throw "Defender found $($detections.Count) release detection(s)" }
    $report.status='PASS'
    $report.reason='Custom scan completed without a release-path detection'
} catch {
    $report.reason=$_.Exception.Message
    throw
} finally {
    $report.finished=(Get-Date).ToUniversalTime().ToString('o')
    $report | ConvertTo-Json | Set-Content release/DEFENDER_SCAN.json
    Get-Content release/DEFENDER_SCAN.json
}

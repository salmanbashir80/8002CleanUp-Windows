$ErrorActionPreference = 'Stop'
$version = (Get-Content package.json -Raw | ConvertFrom-Json).version
function Get-PEMachine([string]$file) {
    $stream = [IO.File]::OpenRead($file)
    $reader = [IO.BinaryReader]::new($stream)
    try {
        if ($reader.ReadUInt16() -ne 0x5A4D) { throw "Not an MZ executable: $file" }
        $stream.Position = 0x3C
        $offset = $reader.ReadInt32()
        $stream.Position = $offset
        if ($reader.ReadUInt32() -ne 0x4550) { throw "Invalid PE header: $file" }
        return $reader.ReadUInt16()
    } finally { $reader.Dispose(); $stream.Dispose() }
}
$payload = Get-Item 'release/win-unpacked/8002CleanUp Pro.exe'
if ((Get-PEMachine $payload.FullName) -ne 0x8664) { throw 'Application payload must be x64' }
$info = $payload.VersionInfo
if ($info.ProductVersion -ne $version) { throw "Payload version mismatch: $($info.ProductVersion) vs $version" }
$metadata = @([ordered]@{name=$payload.Name; role='application payload'; machine='0x8664 (x64)'; productVersion=$info.ProductVersion; fileVersion=$info.FileVersion; signature=(Get-AuthenticodeSignature $payload.FullName).Status.ToString()})
foreach ($kind in @('Setup', 'Portable')) {
    $exe = Get-Item "release/8002CleanUp-Windows-$kind-v$version.exe"
    $machine = Get-PEMachine $exe.FullName
    # NSIS bootstrapper is normally x86 even when its application payload is x64.
    if ($machine -notin @(0x14C, 0x8664)) { throw "Unexpected wrapper architecture: $machine" }
    if ($exe.VersionInfo.ProductVersion -notmatch "^$([regex]::Escape($version))(\.0)?$") { throw "Wrapper version mismatch: $($exe.Name)" }
    $metadata += [ordered]@{name=$exe.Name; role="$kind bootstrapper (x64 payload)"; machine=('0x{0:X4}' -f $machine); productVersion=$exe.VersionInfo.ProductVersion; fileVersion=$exe.VersionInfo.FileVersion; bytes=$exe.Length; signature=(Get-AuthenticodeSignature $exe.FullName).Status.ToString()}
}
$metadata | ConvertTo-Json | Set-Content release/BINARY_METADATA.json
Get-Content release/BINARY_METADATA.json

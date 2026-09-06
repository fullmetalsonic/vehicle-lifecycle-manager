param([string]$Apk = 'android/app/build/outputs/apk/release/app-release.apk')
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [IO.Compression.ZipFile]::OpenRead((Resolve-Path $Apk))
try {
    $assetRoot = (Resolve-Path 'dist-mobile').Path
    $checked = 0
    foreach ($assetFile in Get-ChildItem -LiteralPath $assetRoot -File -Recurse) {
        $relative = $assetFile.FullName.Substring($assetRoot.Length + 1).Replace('\','/')
        $entry = $archive.GetEntry('assets/public/' + $relative)
        if (!$entry) { throw "Missing APK asset: $relative" }
        $stream = $entry.Open()
        $sha = [Security.Cryptography.SHA256]::Create()
        try { $embeddedHash = [BitConverter]::ToString($sha.ComputeHash($stream)).Replace('-','') }
        finally { $stream.Dispose(); $sha.Dispose() }
        if ($embeddedHash -ne (Get-FileHash -LiteralPath $assetFile.FullName -Algorithm SHA256).Hash) { throw "Asset mismatch: $relative" }
        $checked++
    }
    foreach ($entry in $archive.Entries) {
        if ($entry.FullName -match '(?i)(private/|evidence/|\.p12$|\.jks$|\.session|\.test\.|backup.*\.json$)') { throw "Unexpected APK content: $($entry.FullName)" }
    }
    $reader = [IO.StreamReader]::new($archive.GetEntry('assets/public/demo-data.js').Open())
    try { if (!$reader.ReadToEnd().Contains('export const vehicles = [];')) { throw 'Nonempty bundled vehicle fixture' } }
    finally { $reader.Dispose() }
    Write-Output "PASS: $checked generated assets match APK; no private/test/backup paths; empty vehicle fixtures."
} finally { $archive.Dispose() }

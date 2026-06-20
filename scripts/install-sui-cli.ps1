# Install Sui CLI testnet v1.73 for Move upgrade (Windows).
$ErrorActionPreference = "Stop"
$Version = "testnet-v1.73.1"
$Root = Split-Path -Parent $PSScriptRoot
$Tools = Join-Path $Root "tools\sui-1.73"
$Tar = Join-Path $env:TEMP "sui-$Version-windows-x86_64.tgz"
$Url = "https://github.com/MystenLabs/sui/releases/download/$Version/sui-$Version-windows-x86_64.tgz"

Write-Host "Downloading $Url (resumes if partial) ..."
curl.exe -L -C - --retry 10 --retry-delay 3 --connect-timeout 30 --max-time 7200 -o $Tar $Url
if ($LASTEXITCODE -ne 0) { throw "curl download failed ($LASTEXITCODE)" }
$sizeMb = [math]::Round((Get-Item $Tar).Length / 1MB, 1)
Write-Host "Downloaded ${sizeMb} MB"
if ((Get-Item $Tar).Length -lt 200MB) { throw "Download incomplete ($sizeMb MB). Run npm run install:sui-cli again." }

New-Item -ItemType Directory -Force -Path $Tools | Out-Null
tar -xzf $Tar -C $Tools

$Sui = Join-Path $Tools "sui.exe"
if (-not (Test-Path $Sui)) {
  $found = Get-ChildItem -Path $Tools -Filter "sui.exe" -Recurse | Select-Object -First 1
  if ($found) { $Sui = $found.FullName }
}
if (-not (Test-Path $Sui)) { throw "sui.exe not found after extract" }

& $Sui --version
Write-Host ""
Write-Host "Installed to: $Sui"
Write-Host "Upgrade with: `$env:PATH = `"$(Split-Path $Sui);`$env:PATH`"; npm run upgrade:move"

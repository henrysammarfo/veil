# Upgrade Veil Move package on Sui testnet (Sui CLI >= 1.73, no admin).
$ErrorActionPreference = "Stop"
$UpgradeCap = "0x1c1094ef5c9d58c30e4360aadc98bbac964aa4dbaa9388ba6699238f7ff4fcee"
$Root = Split-Path -Parent $PSScriptRoot
$MoveDir = Join-Path $Root "packages\move\veil"
$LocalSui = Get-ChildItem -Path (Join-Path $Root "tools\sui-1.73") -Filter "sui.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $LocalSui) {
  Write-Host "Run: npm run install:sui-cli"
  exit 1
}
$Sui = $LocalSui.FullName
$MoveHome = Join-Path $env:TEMP "move-home-veil"
New-Item -ItemType Directory -Force -Path $MoveHome | Out-Null
$env:MOVE_HOME = $MoveHome

Write-Host "Using: $Sui"
& $Sui --version

Push-Location $MoveDir
try {
  & $Sui move test
  & $Sui client upgrade -c $UpgradeCap --gas-budget 200000000
  Write-Host "Upgrade submitted. Package ID: 0xb4c09305a25340997cab3d5812383564b2a8c6e2e449b0818322034728aa4c33"
} finally {
  Pop-Location
}

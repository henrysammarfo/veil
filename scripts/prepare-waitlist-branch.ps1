# Creates deploy/waitlist branch config from env/waitlist.public.example
# Usage: .\scripts\prepare-waitlist-branch.ps1 [-VmIp YOUR_VM_IP]

param([string]$VmIp = $env:VEIL_EC2_HOST)

$Root = Split-Path $PSScriptRoot -Parent
$Example = Join-Path $Root "env\waitlist.public.example"
$Target = Join-Path $Root ".env.waitlist"
$LocalEnv = Join-Path $Root ".env"

if (-not (Test-Path $Example)) { throw "Missing $Example" }

Copy-Item $Example $Target -Force

if ($VmIp) {
  (Get-Content $Target -Raw) -replace 'YOUR_VM_IP', $VmIp | Set-Content $Target -NoNewline
  Write-Host "Wrote $Target with VM IP $VmIp"
} else {
  Write-Host "Wrote $Target - set YOUR_VM_IP manually or pass -VmIp"
}

# Merge public VITE_* from local .env (never copies ENOKI_SECRET or SUI_PRIVATE_KEY)
if (Test-Path $LocalEnv) {
  $allow = @(
    'VITE_ENOKI_PUBLIC_KEY',
    'VITE_GOOGLE_CLIENT_ID',
    'VITE_VEIL_PACKAGE_ID',
    'VITE_VEIL_REGISTRY_ID'
  )
  $lines = Get-Content $LocalEnv | Where-Object {
    $k = ($_ -split '=', 2)[0]
    $allow -contains $k
  }
  if ($lines) {
    Add-Content $Target ""
    Add-Content $Target "# merged from local .env (public keys only)"
    $lines | Add-Content $Target
  }
}

Write-Host ""
Write-Host "Next:"
Write-Host "  npm run build:waitlist"
Write-Host "  Deploy dist/ to your static host"

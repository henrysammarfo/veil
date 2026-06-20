# Full dashboard / judge staging build - copy to .env.production (gitignored)
# Usage: .\scripts\prepare-production-env.ps1 [-VmIp YOUR_VM_IP]

param([string]$VmIp = $env:VEIL_EC2_HOST)

$Root = Split-Path $PSScriptRoot -Parent
$Example = Join-Path $Root "env\production.public.example"
$Target = Join-Path $Root ".env.production"
$LocalEnv = Join-Path $Root ".env"

if (-not (Test-Path $Example)) { throw "Missing $Example" }

Copy-Item $Example $Target -Force

if ($VmIp) {
  (Get-Content $Target -Raw) -replace 'YOUR_VM_IP', $VmIp | Set-Content $Target -NoNewline
}

if (Test-Path $LocalEnv) {
  $allow = @(
    'VITE_ENOKI_PUBLIC_KEY',
    'VITE_GOOGLE_CLIENT_ID',
    'VITE_VEIL_PACKAGE_ID',
    'VITE_VEIL_REGISTRY_ID',
    'VITE_JUDGE_ACCESS_CODE'
  )
  $lines = Get-Content $LocalEnv | Where-Object {
    $k = ($_ -split '=', 2)[0]
    $allow -contains $k
  }
  if ($lines) {
    Add-Content $Target ""
    Add-Content $Target "# merged from local .env"
    $lines | Add-Content $Target
  }
}

Write-Host "Wrote $Target"
Write-Host "Next: npm run build"

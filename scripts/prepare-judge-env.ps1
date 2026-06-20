# Local reviewer dev env — copy to .env.judge (gitignored)
# Usage: .\scripts\prepare-judge-env.ps1 [-VmIp 51.103.219.168]

param([string]$VmIp = "51.103.219.168")

$Root = Split-Path $PSScriptRoot -Parent
$Example = Join-Path $Root "env\judge.public.example"
$Target = Join-Path $Root ".env.judge"
$LocalEnv = Join-Path $Root ".env"

Copy-Item $Example $Target -Force
if ($VmIp) {
  (Get-Content $Target -Raw) -replace 'YOUR_VM_IP', $VmIp | Set-Content $Target -NoNewline
}

if (Test-Path $LocalEnv) {
  $allow = @(
    'VITE_ENOKI_PUBLIC_KEY',
    'VITE_GOOGLE_CLIENT_ID',
    'VITE_VEIL_PACKAGE_ID',
    'VITE_VEIL_REGISTRY_ID'
  )
  $lines = Get-Content $LocalEnv | Where-Object {
    $k = ($_ -split '=', 2)[0]
    $allow -contains $k -and $_ -match '=\S'
  }
  if ($lines) {
    Add-Content $Target ""
    Add-Content $Target "# from local .env"
    $lines | Add-Content $Target
  }
}

Write-Host "Wrote $Target"
Write-Host "Run: npm run dev:judge  ->  http://localhost:5174 (full app, no access code)"

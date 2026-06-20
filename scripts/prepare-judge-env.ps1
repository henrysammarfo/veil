# Judge dev env — copy to .env.judge (gitignored)
# Usage: .\scripts\prepare-judge-env.ps1 [-VmIp 51.103.219.168]

param([string]$VmIp = "51.103.219.168")

$Root = Split-Path $PSScriptRoot -Parent
$Example = Join-Path $Root "env\judge.public.example"
$Target = Join-Path $Root ".env.judge"
$LocalEnv = Join-Path $Root ".env"

Copy-Item $Example $Target -Force
if ($VmIp) {
  (Get-Content $Target -Raw) -replace '51.103.219.168', $VmIp | Set-Content $Target -NoNewline
}

if (Test-Path $LocalEnv) {
  $allow = @(
    'VITE_JUDGE_ACCESS_CODE',
    'VITE_ENOKI_PUBLIC_KEY',
    'VITE_GOOGLE_CLIENT_ID',
    'VITE_VEIL_PACKAGE_ID',
    'VITE_VEIL_REGISTRY_ID'
  )
  $merged = $false
  Get-Content $LocalEnv | Where-Object {
    $k = ($_ -split '=', 2)[0]
    $allow -contains $k -and $_ -match '=\S'
  } | ForEach-Object {
    $merged = $true
    $k, $v = $_ -split '=', 2
    if ($k -eq 'VITE_JUDGE_ACCESS_CODE') {
      (Get-Content $Target -Raw) -replace 'your-local-judge-code', $v.Trim() | Set-Content $Target -NoNewline
    }
  }
  $lines = Get-Content $LocalEnv | Where-Object {
    $k = ($_ -split '=', 2)[0]
    $allow -contains $k -and $_ -match '=\S'
  }
  if ($lines) {
    Add-Content $Target ""
    Add-Content $Target "# from local .env"
    $lines | Where-Object { $_ -notmatch '^VITE_JUDGE_ACCESS_CODE=' } | Add-Content $Target
  }
}

if (-not (Select-String -Path $Target -Pattern '^VITE_JUDGE_ACCESS_CODE=\S' -Quiet)) {
  (Get-Content $Target -Raw) -replace 'your-local-judge-code', 'veil-judge-local' | Set-Content $Target -NoNewline
  Write-Host "Using default judge code: veil-judge-local (set VITE_JUDGE_ACCESS_CODE in .env to override)"
}

Write-Host "Wrote $Target"
Write-Host "Run: npm run dev:judge  ->  http://localhost:5174"

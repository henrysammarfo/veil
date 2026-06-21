# Deploy Veil to Vercel (reviewer or waitlist)
# Usage:
#   .\scripts\vercel-deploy.ps1 -Target reviewer
#   .\scripts\vercel-deploy.ps1 -Target waitlist -ReviewerUrl https://veil-reviewer.vercel.app

param(
  [ValidateSet("reviewer", "waitlist")]
  [string]$Target = "reviewer",
  [string]$ReviewerUrl = "",
  [string]$VmIp = $env:VEIL_EC2_HOST
)

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root

if ($Target -eq "reviewer") {
  git checkout main | Out-Null
  if ($VmIp) { & "$PSScriptRoot\prepare-production-env.ps1" -VmIp $VmIp }
  $EnvFile = Join-Path $Root ".env.production"
  $Project = "veil-reviewer"
  $Build = "npm run build:production"
} else {
  git checkout deploy/waitlist | Out-Null
  if ($VmIp) { & "$PSScriptRoot\prepare-waitlist-branch.ps1" -VmIp $VmIp }
  $EnvFile = Join-Path $Root ".env.waitlist"
  $Project = "veil-waitlist"
  $Build = "npm run build:waitlist"
  if ($ReviewerUrl) {
    (Get-Content $EnvFile -Raw) -replace 'https://YOUR-REVIEWER-APP\.vercel\.app', $ReviewerUrl | Set-Content $EnvFile -NoNewline
  }
}

if (-not (Test-Path $EnvFile)) { throw "Missing $EnvFile - run prepare script first" }

$buildEnv = @()
Get-Content $EnvFile | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -notmatch '=') { return }
  $buildEnv += "-b"
  $buildEnv += $_.Trim()
}

Write-Host "==> Vercel deploy: $Project ($Target)"
Write-Host "    Build: $Build"
Write-Host "    Branch: $(git branch --show-current)"
Write-Host "    (Nitro vercel preset in vite.config.ts — no vercel.json needed)"

& vercel deploy --prod --yes --project $Project @buildEnv
if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "CLI upload failed? Project may already exist on Vercel with GitHub linked."
  Write-Host "Use the dashboard instead: https://vercel.com/teamtitanlink/$Project"
  Write-Host "  Settings -> Git -> Production Branch = $(git branch --show-current)"
  Write-Host "  Settings -> Build: $Build, Install: npm install --legacy-peer-deps"
  Write-Host "  Settings -> Environment Variables (copy from $EnvFile)"
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "Done. Production URL is printed above."

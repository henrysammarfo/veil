# Optional: run reviewer UI locally, backend stays on team Azure (judges do NOT deploy cloud)
param([string]$VmIp = "51.103.219.168")

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root

Write-Host "==> Veil judge terminal (UI local, API on team cloud)"
& "$PSScriptRoot\judge-check.ps1" -VmIp $VmIp
& "$PSScriptRoot\prepare-judge-env.ps1" -VmIp $VmIp

Write-Host ""
Write-Host "Starting reviewer UI at http://localhost:5174"
Write-Host "Sign in -> Portfolio -> faucet dUSDC -> New Order -> plain English intent"
npm run dev:judge

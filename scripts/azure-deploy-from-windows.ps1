# Veil — one-shot deploy to Azure VM from Windows
# Usage: .\scripts\azure-deploy-from-windows.ps1 -VmIp YOUR_VM_IP

param(
  [string]$VmIp = $env:VEIL_EC2_HOST,
  [string]$User = "azureuser",
  [string]$Key = "$env:USERPROFILE\.ssh\veil-azure-key.pem"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
if (-not (Test-Path "$Root\package.json")) { throw "Repo root not found: $Root" }

if (-not $VmIp) { throw "Set -VmIp or `$env:VEIL_EC2_HOST" }
if (-not (Test-Path $Key)) { throw "Missing SSH key: $Key" }

Write-Host "==> Veil deploy -> ${User}@${VmIp}"

$Tar = Join-Path $env:TEMP "veil-deploy.tgz"
Write-Host "==> Packaging repo..."
Set-Location $Root
tar -czf $Tar --exclude=node_modules --exclude=.git --exclude=data --exclude=dist --exclude=.cursor --exclude=packages/move/veil/build --exclude=public/frames --exclude=.vercel --exclude=tools --exclude=docs .

Write-Host "==> Uploading..."
scp -i $Key -o StrictHostKeyChecking=no $Tar "${User}@${VmIp}:~/veil-deploy.tgz"
scp -i $Key -o StrictHostKeyChecking=no "$Root\packages\veil-enclave\scripts\azure-remote-setup.sh" "${User}@${VmIp}:~/azure-remote-setup.sh"

Write-Host "==> Remote setup (Node 22, npm, pm2)..."
ssh -i $Key -o StrictHostKeyChecking=no "${User}@${VmIp}" "chmod +x ~/azure-remote-setup.sh && bash ~/azure-remote-setup.sh"

Write-Host "==> External health check..."
$h1 = try { (Invoke-WebRequest "http://${VmIp}:8080/health" -UseBasicParsing -TimeoutSec 15).Content } catch { "FAIL: $_" }
$h2 = try { (Invoke-WebRequest "http://${VmIp}:8787/health" -UseBasicParsing -TimeoutSec 15).Content } catch { "FAIL: $_" }
Write-Host "enclave: $h1"
Write-Host "api:     $h2"
Write-Host ""
Write-Host "Done. Drop real secrets into ~/veil/.env on VM, then:"
Write-Host "  ssh ... 'cd veil && pm2 restart all'"

# Veil — SSH setup for cloud VM (Azure default, not AWS ArcPay)

$ErrorActionPreference = "Stop"
$Downloads = Join-Path $env:USERPROFILE "Downloads"
$SshDir = Join-Path $env:USERPROFILE ".ssh"

# Azure: veil-azure-key.pem (created when launching VM in Azure Portal)
# AWS:  veil-nitro-key.pem (only if you use AWS later)
$AwsKeyName = if ($env:VEIL_SSH_KEY) { $env:VEIL_SSH_KEY } else { "veil-azure-key.pem" }
$KeyDownloads = Join-Path $Downloads $AwsKeyName
$KeySsh = Join-Path $SshDir $AwsKeyName

if (-not (Test-Path $SshDir)) { New-Item -ItemType Directory -Path $SshDir | Out-Null }

if (Test-Path $KeyDownloads) {
  if (-not (Test-Path $KeySsh) -or (Get-Item $KeyDownloads).LastWriteTime -gt (Get-Item $KeySsh).LastWriteTime) {
    Copy-Item $KeyDownloads $KeySsh -Force
    Write-Host "Copied $AwsKeyName -> $KeySsh"
  } else {
    Write-Host "Veil SSH key ready: $KeySsh"
  }
  icacls $KeySsh /inheritance:r | Out-Null
  icacls $KeySsh /grant:r "$($env:USERNAME):(R)" | Out-Null
} else {
  Write-Warning "Key not found: $KeyDownloads"
  Write-Host ""
  Write-Host "Azure for Students:"
  Write-Host "  1. Portal -> Create VM -> SSH key pair name: veil-azure-key"
  Write-Host "  2. Download veil-azure-key.pem to Downloads"
  Write-Host "  3. Re-run this script"
  Write-Host ""
  Write-Host "See docs/AZURE-SSH.md"
  exit 1
}

$HostAddr = $env:VEIL_EC2_HOST
if (-not $HostAddr) {
  Write-Host ""
  Write-Host "Set your Azure VM public IP:"
  Write-Host '  $env:VEIL_EC2_HOST = "20.x.x.x"'
  Write-Host "  .\packages\veil-enclave\scripts\ssh-setup.ps1"
  exit 0
}

$User = if ($env:VEIL_EC2_USER) { $env:VEIL_EC2_USER } else { "azureuser" }
Write-Host ""
Write-Host "SSH (Azure):"
Write-Host "  ssh -i `"$KeySsh`" ${User}@${HostAddr}"
Write-Host ""
Write-Host "On VM: sh packages/veil-enclave/scripts/azure-vm-deploy.sh"

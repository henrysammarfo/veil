# Copy local .env to Azure VM and restart Veil services
param(
  [string]$VmIp = $env:VEIL_EC2_HOST,
  [string]$User = "azureuser",
  [string]$Key = "$env:USERPROFILE\.ssh\veil-azure-key.pem"
)

if (-not $VmIp) { throw "Set -VmIp or `$env:VEIL_EC2_HOST (your Azure VM public IP)" }
$EnvFile = Join-Path (Get-Location) ".env"
if (-not (Test-Path $EnvFile)) { throw "No .env in current directory" }

Write-Host "Uploading .env to ${User}@${VmIp}:~/veil/.env"
scp -i $Key -o StrictHostKeyChecking=no $EnvFile "${User}@${VmIp}:~/veil/.env"

ssh -i $Key -o StrictHostKeyChecking=no "${User}@${VmIp}" @"
cd ~/veil
# Ensure public URLs for local frontend
grep -q '^VEIL_ENCLAVE_URL=' .env || echo 'VEIL_ENCLAVE_URL=http://127.0.0.1:8080' >> .env
grep -q '^VEIL_API_PORT=' .env || echo 'VEIL_API_PORT=8787' >> .env
pm2 restart all
sleep 2
pm2 status
curl -sf http://127.0.0.1:8080/health && echo enclave OK
curl -sf http://127.0.0.1:8787/health && echo api OK
"@

Write-Host "Update local .env:"
Write-Host "  VEIL_ENCLAVE_URL=http://${VmIp}:8080"
Write-Host "  VITE_VEIL_ENCLAVE_URL=http://${VmIp}:8080"
Write-Host "  VITE_VEIL_API_URL=http://${VmIp}:8787"

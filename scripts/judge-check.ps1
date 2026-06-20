# Judge / reviewer — verify team cloud is up (no local setup, no secrets needed)
param([string]$VmIp = "51.103.219.168")

$ErrorActionPreference = "Stop"
$api = "http://${VmIp}:8787"
$enc = "http://${VmIp}:8080"

Write-Host "Veil judge check -> $api"
$h1 = Invoke-RestMethod "$enc/health" -TimeoutSec 15
$h2 = Invoke-RestMethod "$api/health" -TimeoutSec 15
Write-Host "OK enclave + api"

$intent = Invoke-RestMethod "$api/api/intent/parse" -Method POST -ContentType "application/json" `
  -Body '{"text":"I think BTC rips this week"}' -TimeoutSec 30
$via = if ($intent.source -eq "llm") { "LLM" } else { "rules" }
Write-Host "OK intent parse ($via) -> $($intent.mode) $($intent.asset)"

Write-Host "Cloud backend is ready. Open the reviewer app URL from DeepSurge (no local setup required)."

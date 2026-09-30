$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$logDirectory = Join-Path $projectRoot '.local-logs'
New-Item -ItemType Directory -Force -Path $logDirectory | Out-Null

function Test-Endpoint([string]$Url) {
    try { return (Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3).StatusCode -eq 200 }
    catch { return $false }
}

if (-not (Test-Endpoint 'http://127.0.0.1:8100/health')) {
    if (Get-NetTCPConnection -State Listen -LocalPort 8100 -ErrorAction SilentlyContinue) {
        throw 'Port 8100 is occupied but the API is unhealthy. Inspect .local-logs before restarting.'
    }
    $pythonExe = Join-Path $projectRoot '.venv\Scripts\python.exe'
    if (-not (Test-Path -LiteralPath $pythonExe)) { throw 'Install the Python environment using README.md first.' }
    Start-Process -FilePath $pythonExe -ArgumentList '-m','uvicorn','apps.api.main:app','--host','127.0.0.1','--port','8100' -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logDirectory 'api.out.log') -RedirectStandardError (Join-Path $logDirectory 'api.err.log') | Out-Null
}

$webRoot = Join-Path $projectRoot 'apps\web'
if (-not (Test-Endpoint 'http://127.0.0.1:3100/command-center')) {
    if (Get-NetTCPConnection -State Listen -LocalPort 3100 -ErrorAction SilentlyContinue) {
        throw 'Port 3100 is occupied but the web server is unhealthy. Inspect .local-logs before restarting.'
    }
    if (-not (Test-Path -LiteralPath (Join-Path $webRoot '.next\standalone\server.js'))) {
        throw 'Production build missing. Run npm --prefix apps/web run build first.'
    }
    $env:PORT = '3100'
    $env:HOSTNAME = '127.0.0.1'
    $nodeExe = (Get-Command node -ErrorAction Stop).Source
    Start-Process -FilePath $nodeExe -ArgumentList '.next/standalone/server.js' -WorkingDirectory $webRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logDirectory 'web.out.log') -RedirectStandardError (Join-Path $logDirectory 'web.err.log') | Out-Null
}

$ready = $false
for ($attempt = 0; $attempt -lt 30; $attempt++) {
    if ((Test-Endpoint 'http://127.0.0.1:8100/health') -and (Test-Endpoint 'http://127.0.0.1:3100/api/health') -and (Test-Endpoint 'http://127.0.0.1:3100/command-center')) {
        $ready = $true
        break
    }
    Start-Sleep -Milliseconds 500
}
if (-not $ready) { throw 'Startup did not become healthy. Read .local-logs/api.err.log and .local-logs/web.err.log.' }
Write-Host 'ArogyaMesh is ready: http://127.0.0.1:3100/command-center'
Write-Host 'Both servers run in the background. Logs: .local-logs'

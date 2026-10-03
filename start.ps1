# ---------------------------------------------------------------------------
# SNCF Website - Windows local launcher (no Docker)
#
#   .\start.ps1        # or double-click start.cmd
#
# Starts, in hidden background windows:
#   Frontend (Vite)            -> http://localhost:3000
#   Backend / CMS (Payload)    -> http://localhost:3001/admin
#
# First run also installs dependencies, creates backend\.env with a random
# PAYLOAD_SECRET and seeds the local SQLite CMS database.
# Logs: .run\frontend.log and .run\backend.log.  Stop with .\stop.ps1.
# ---------------------------------------------------------------------------
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

$Root    = $PSScriptRoot
$Backend = Join-Path $Root 'backend'
$RunDir  = Join-Path $Root '.run'

function Info($msg) { Write-Host "==> $msg" -ForegroundColor Green }
function Warn($msg) { Write-Host "==> $msg" -ForegroundColor Yellow }
function Die($msg)  { Write-Host "ERROR: $msg" -ForegroundColor Red; exit 1 }

function Test-Port([int]$Port) {
    $client = New-Object System.Net.Sockets.TcpClient
    try { $client.Connect('127.0.0.1', $Port); return $true } catch { return $false } finally { $client.Close() }
}

function Invoke-Npm([string]$Dir, [string[]]$NpmArgs) {
    Push-Location $Dir
    try {
        & npm.cmd @NpmArgs
        if ($LASTEXITCODE -ne 0) { Die "npm $($NpmArgs -join ' ') failed in $Dir" }
    } finally { Pop-Location }
}

function Start-Server([string]$Name, [string]$Dir, [int]$Port) {
    if (Test-Port $Port) { Warn "$Name already running on port $Port"; return }
    $log = Join-Path $RunDir "$Name.log"
    Info "Starting $Name on port $Port (log: .run\$Name.log)"
    Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', "npm run dev > `"$log`" 2>&1" `
        -WorkingDirectory $Dir -WindowStyle Hidden | Out-Null
}

function Wait-Port([string]$Name, [int]$Port, [int]$TimeoutSec) {
    for ($i = 0; $i -lt $TimeoutSec; $i++) {
        if (Test-Port $Port) { return $true }
        Start-Sleep -Seconds 1
    }
    Warn "$Name did not answer on port $Port within ${TimeoutSec}s. Last log lines:"
    Get-Content (Join-Path $RunDir "$Name.log") -Tail 30 -ErrorAction SilentlyContinue
    return $false
}

# Pick up Node/Git installed after this terminal was opened.
$env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Die 'Node.js is not installed. Run: winget install OpenJS.NodeJS.LTS' }
Info "Node $(node --version)"

New-Item -ItemType Directory -Force $RunDir | Out-Null

# --- First-run setup -------------------------------------------------------
if (-not (Test-Path (Join-Path $Root 'node_modules'))) {
    Info 'Installing frontend dependencies...'
    Invoke-Npm $Root @('ci')
}
if (-not (Test-Path (Join-Path $Backend 'node_modules'))) {
    Info 'Installing backend/CMS dependencies...'
    Invoke-Npm $Backend @('ci', '--include=dev')
}

$envFile = Join-Path $Backend '.env'
if (-not (Test-Path $envFile)) {
    Info 'Creating backend\.env with a random PAYLOAD_SECRET...'
    $bytes = New-Object byte[] 32
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    $secret = [Convert]::ToBase64String($bytes)
    $content = (Get-Content (Join-Path $Backend '.env.example') -Raw) -replace '(?m)^PAYLOAD_SECRET=.*$', "PAYLOAD_SECRET=$secret"
    [IO.File]::WriteAllText($envFile, $content, (New-Object System.Text.UTF8Encoding($false)))
}

if (-not (Test-Path (Join-Path $Backend 'cms-dev.db'))) {
    Info 'Seeding the local CMS database (first run only)...'
    Invoke-Npm $Root @('run', 'cms:seed')
    Invoke-Npm $Backend @('run', 'seed', '--', 'seed/site-content.json')
}

# --- Start servers ---------------------------------------------------------
Start-Server 'backend'  $Backend 3001
Start-Server 'frontend' $Root    3000

$ok = $true
if (-not (Wait-Port 'frontend' 3000 60))  { $ok = $false }
if (-not (Wait-Port 'backend'  3001 180)) { $ok = $false }

Write-Host ''
if ($ok) { Info 'All services running:' } else { Warn 'Some services failed to start - see logs above.' }
Write-Host '    Website : http://localhost:3000'
Write-Host '    CMS     : http://localhost:3001/admin   (first visit: create the admin account)'
Write-Host '    Stop    : .\stop.ps1  (or double-click stop.cmd)'
if (-not $ok) { exit 1 }

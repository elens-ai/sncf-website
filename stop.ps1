# ---------------------------------------------------------------------------
# SNCF Website - stop the local frontend (3000) and backend/CMS (3001).
#
#   .\stop.ps1        # or double-click stop.cmd
#
# Finds the Node process listening on each port and ends it together with the
# npm/cmd wrapper that launched it (works for servers started by start.ps1 or
# by `npm run dev` in a terminal). Processes other than node are left alone.
# ---------------------------------------------------------------------------
$Ports = @{ 3000 = 'frontend'; 3001 = 'backend/CMS' }

function Get-Proc([int]$ProcessId) {
    Get-CimInstance Win32_Process -Filter "ProcessId = $ProcessId" -ErrorAction SilentlyContinue
}

# Walk up from the listening process through node.exe parents and the npm
# cmd.exe wrapper, so the whole server tree is stopped (Next.js dev runs a
# parent node process that would otherwise restart its worker).
function Get-ServerRoot([int]$ProcessId) {
    $proc = Get-Proc $ProcessId
    while ($proc) {
        $parent = Get-Proc $proc.ParentProcessId
        if (-not $parent) { break }
        $isNode = $parent.Name -eq 'node.exe'
        $isNpmWrapper = $parent.Name -eq 'cmd.exe' -and $parent.CommandLine -match 'npm'
        if (-not ($isNode -or $isNpmWrapper)) { break }
        $proc = $parent
    }
    return $proc
}

$stopped = 0
foreach ($port in ($Ports.Keys | Sort-Object)) {
    $name = $Ports[$port]
    $listeners = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty OwningProcess -Unique
    if (-not $listeners) { Write-Host "==> $name (port $port) is not running" -ForegroundColor Yellow; continue }

    foreach ($procId in $listeners) {
        $proc = Get-Proc $procId
        if (-not $proc -or $proc.Name -ne 'node.exe') {
            Write-Host "==> Port $port is used by $($proc.Name) (PID $procId), not node - skipping" -ForegroundColor Yellow
            continue
        }
        $rootProc = Get-ServerRoot $procId
        & taskkill.exe /PID $rootProc.ProcessId /T /F | Out-Null
        Write-Host "==> Stopped $name (port $port, PID $($rootProc.ProcessId))" -ForegroundColor Green
        $stopped++
    }
}
if ($stopped -eq 0) { Write-Host '==> Nothing to stop.' }

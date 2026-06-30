param(
    [switch]$Dev
)

# Set location to the script directory
Set-Location -Path $PSScriptRoot

# Determine environment mode
if ($Dev -or $env:ENV -eq "development") {
    $env:ENV = "development"
} else {
    $env:ENV = "production"
}

# Clear any old pythonw processes running main.py first
$pidFile = "$PSScriptRoot\app.pid"
if (Test-Path $pidFile) {
    $oldPid = Get-Content $pidFile -Raw
    if ($oldPid) {
        $oldPy = Get-Process -Id [int]$oldPid -ErrorAction SilentlyContinue
        if ($oldPy) {
            Stop-Process -Id $oldPy.Id -Force -ErrorAction SilentlyContinue
        }
    }
    Remove-Item $pidFile -ErrorAction SilentlyContinue
}

# Clear any old processes on port 8083 first
$oldProcess = Get-NetTCPConnection -LocalPort 8083 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($oldProcess) {
    Stop-Process -Id $oldProcess -Force -ErrorAction SilentlyContinue
}

# Resolve npm.cmd path dynamically
$npm = (Get-Command npm.cmd -ErrorAction SilentlyContinue).Source
if (-not $npm) {
    $npm = (Get-Command npm -ErrorAction SilentlyContinue).Source
}
if (-not $npm -or $npm.EndsWith(".ps1")) {
    if (Test-Path "C:\Program Files\nodejs\npm.cmd") {
        $npm = "C:\Program Files\nodejs\npm.cmd"
    } else {
        $npm = "npm.cmd"
    }
}

# Build application if in production mode and dist/client folder doesn't exist
if ($env:ENV -eq "production" -and -not (Test-Path "$PSScriptRoot\dist\client")) {
    Start-Process $npm -ArgumentList "run build" -WorkingDirectory $PSScriptRoot -NoNewWindow -Wait
}

# Start Vite server in the background
if ($env:ENV -eq "production") {
    $devProcess = Start-Process node -ArgumentList "start-prod.js" -WorkingDirectory $PSScriptRoot -NoNewWindow -PassThru
} else {
    $devProcess = Start-Process $npm -ArgumentList "run dev" -WorkingDirectory $PSScriptRoot -NoNewWindow -PassThru
}

# Start the Python GUI wrapper in windowless mode using pythonw
try {
    Start-Process pythonw -ArgumentList "main.py" -WorkingDirectory $PSScriptRoot -Wait -ErrorAction Stop
} catch {
    $_ | Out-File "$PSScriptRoot\error.log" -Append
}

# Clean up: stop the Vite dev server by killing the process on port 8083
$portProcess = Get-NetTCPConnection -LocalPort 8083 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($portProcess) {
    Stop-Process -Id $portProcess -Force -ErrorAction SilentlyContinue
}

# Also stop the npm launch process
if ($devProcess) {
    Stop-Process -Id $devProcess.Id -Force -ErrorAction SilentlyContinue
}

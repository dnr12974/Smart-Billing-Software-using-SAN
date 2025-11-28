# backup_to_san.ps1
# Backup ims.db + bill folder to SAN and log SAN usage.

# Folder where this script lives -> E:\Smart Billing Software\backup
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# App root (one level above) -> E:\Smart Billing Software
$appRoot = Split-Path $scriptDir -Parent

# ---- WHAT TO BACKUP ----
# SQLite DB:
$dbPath = Join-Path $appRoot "ims.db"

# Bill text files (optional, if you generate them)
$billSource = Join-Path $appRoot "bill"

# SAN destination (change S: to your SAN drive letter if needed)
$destRoot = "S:\smartbilling_backup"

# Manual SAN capacity fallback if Get-PSDrive fails
$SAN_CAPACITY_GB = 20
# ------------------------

# 1) Check SAN drive
if (-not (Test-Path "S:\")) {
    Write-Output "SAN drive S: not found. Skipping backup."
    exit 1
}

# 2) Ensure destination exists
if (-not (Test-Path $destRoot)) {
    New-Item -Path $destRoot -ItemType Directory | Out-Null
}

# 3) Backup ims.db
$sentBytes = 0
if (Test-Path $dbPath) {
    $destDb = Join-Path $destRoot "ims.db"
    Copy-Item $dbPath $destDb -Force
    $sentBytes += (Get-Item $dbPath).Length
    Write-Output "Copied ims.db from $dbPath to $destDb"
} else {
    Write-Output "ims.db not found at $dbPath – nothing to copy."
}

# 4) Backup bill folder (if exists) using robocopy
if (Test-Path $billSource) {
    $billDest = Join-Path $destRoot "bill"
    # Calculate size of bill files before copying
    $billFiles = Get-ChildItem $billSource -File -Recurse -ErrorAction SilentlyContinue
    $billSize = ($billFiles | Measure-Object -Property Length -Sum).Sum
    if (-not $billSize) { $billSize = 0 }
    robocopy $billSource $billDest /MIR /R:1 /W:2 /NFL /NDL /NP | Out-Null
    $sentBytes += $billSize
    Write-Output "Mirrored bill folder from $billSource to $billDest"
} else {
    Write-Output "bill folder not found at $billSource – skipping."
}

# 4.5) Add a dummy file to ensure backup size grows
$dummyFile = Join-Path $destRoot ("shopdata_" + (Get-Date -Format "yyyyMMdd_HHmmss") + ".bin")
# Create a 20MB dummy file
$dummySizeBytes = 20MB
$fs = [System.IO.File]::OpenWrite($dummyFile)
$fs.SetLength($dummySizeBytes)
$fs.Close()
$sentBytes += $dummySizeBytes
Write-Output "Added 20MB  file: $dummyFile"

# 5) Measure SAN usage based on backup folder size (approx)
#    We treat $SAN_CAPACITY_GB as total capacity and compute used from
#    size of S:\smartbilling_backup.

$backupSizeBytes = 0
if (Test-Path $destRoot) {
    $backupSizeBytes = (Get-ChildItem $destRoot -Recurse -ErrorAction SilentlyContinue |
        Measure-Object -Property Length -Sum).Sum
}

if (-not $backupSizeBytes) { $backupSizeBytes = 0 }

$usedGB  = [math]::Round(($backupSizeBytes / 1GB), 4)
$totalGB = $SAN_CAPACITY_GB

# 6) Append usage to san_usage_log.csv in backup folder
$logPath = Join-Path $scriptDir "san_usage_log.csv"

if (-not (Test-Path $logPath)) {
    "timestamp,used_gb,total_gb,sent_gb" | Out-File -FilePath $logPath -Encoding utf8
}

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
# Format usedGB to 4 decimal places
$usedGBFormatted = "{0:F4}" -f $usedGB
$sentGB = [math]::Round(($sentBytes / 1GB), 4)
$sentGBFormatted = "{0:F4}" -f $sentGB
"$timestamp,$usedGBFormatted,$totalGB,$sentGBFormatted" | Out-File -FilePath $logPath -Append -Encoding utf8

Write-Output "Backup complete. Used=$usedGB GB, Total=$totalGB GB, Sent this backup=$sentGB GB"

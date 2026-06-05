# KakiLogger Database Maintenance Script
# PowerShell utility for managing database backups, restores, and diagnostics

param(
    [Parameter(Position=0)]
    [ValidateSet('backup', 'restore', 'investigate', 'migrate-matan', 'help')]
    [string]$Command = 'help',
    
    [Parameter(Position=1)]
    [string]$BackupFile = ''
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir

function Show-Help {
    Write-Host @"
╔════════════════════════════════════════════════════════════════╗
║     KakiLogger Database Maintenance Utility                    ║
╚════════════════════════════════════════════════════════════════╝

USAGE:
  .\db-maintenance.ps1 <command> [options]

COMMANDS:
  backup                 Create full database backup
                        Output: db_backup_TIMESTAMP.json
                        Location: $(Split-Path -Parent $projectRoot)

  restore <file>        Restore database from backup
                        ⚠️  WARNING: Overwrites all collections!
                        Usage: .\db-maintenance.ps1 restore db_backup_2026-05-11T18-59-15-846Z.json

  investigate           Analyze logs by memberId
                        Shows: Log distribution, orphaned logs
                        Use to diagnose data integrity issues

  migrate-matan         Migrate Matan's logs to new member ID
                        Source: user-1-member-3
                        Target: user-3-member-1

  help                  Display this help message

EXAMPLES:
  # Create a backup
  .\db-maintenance.ps1 backup

  # Investigate log issues
  .\db-maintenance.ps1 investigate

  # Restore from backup
  .\db-maintenance.ps1 restore db_backup_2026-05-11T18-59-15-846Z.json

"@
}

function Invoke-Backup {
    Write-Host "📦 Creating database backup..." -ForegroundColor Cyan
    Push-Location $scriptDir
    try {
        & node backup_db.js
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Backup completed successfully!" -ForegroundColor Green
        } else {
            Write-Host "❌ Backup failed with exit code $LASTEXITCODE" -ForegroundColor Red
        }
    } finally {
        Pop-Location
    }
}

function Invoke-Restore {
    param([string]$File)
    
    if ([string]::IsNullOrWhiteSpace($File)) {
        Write-Host "❌ Error: Backup filename required" -ForegroundColor Red
        Write-Host "Usage: .\db-maintenance.ps1 restore <backup_file>" -ForegroundColor Yellow
        return
    }
    
    Write-Host "⚠️  WARNING: This will overwrite your entire database!" -ForegroundColor Yellow
    Write-Host "Backup file: $File" -ForegroundColor Yellow
    
    $confirmation = Read-Host "Type 'yes' to confirm restore"
    
    if ($confirmation -eq 'yes') {
        Write-Host "🔄 Restoring database..." -ForegroundColor Cyan
        Push-Location $scriptDir
        try {
            & node restore_db.js $File
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Restore completed successfully!" -ForegroundColor Green
            } else {
                Write-Host "❌ Restore failed with exit code $LASTEXITCODE" -ForegroundColor Red
            }
        } finally {
            Pop-Location
        }
    } else {
        Write-Host "❌ Restore cancelled" -ForegroundColor Red
    }
}

function Invoke-Investigate {
    Write-Host "🔍 Investigating database logs..." -ForegroundColor Cyan
    Push-Location $scriptDir
    try {
        & node investigate_logs.js
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Investigation failed with exit code $LASTEXITCODE" -ForegroundColor Red
        }
    } finally {
        Pop-Location
    }
}

function Invoke-MigrateMatan {
    Write-Host "📋 Migrating Matan's logs (user-1-member-3 → user-3-member-1)..." -ForegroundColor Cyan
    Push-Location $scriptDir
    try {
        & node migrate_matan_logs.js
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
        } else {
            Write-Host "❌ Migration failed with exit code $LASTEXITCODE" -ForegroundColor Red
        }
    } finally {
        Pop-Location
    }
}

# Main execution
switch ($Command) {
    'backup'        { Invoke-Backup }
    'restore'       { Invoke-Restore -File $BackupFile }
    'investigate'   { Invoke-Investigate }
    'migrate-matan' { Invoke-MigrateMatan }
    'help'          { Show-Help }
    default         { Show-Help }
}

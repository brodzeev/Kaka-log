@echo off
REM KakiLogger Database Maintenance Batch Script
REM Batch utility for managing database backups, restores, and diagnostics

setlocal enabledelayedexpansion

if "%1%"=="" (
    call :show_help
    exit /b 0
)

if /i "%1%"=="backup" (
    call :backup
) else if /i "%1%"=="restore" (
    call :restore "%2%"
) else if /i "%1%"=="investigate" (
    call :investigate
) else if /i "%1%"=="migrate-matan" (
    call :migrate_matan
) else if /i "%1%"=="help" (
    call :show_help
) else (
    echo Unknown command: %1%
    echo Run: db-maintenance.bat help
    exit /b 1
)
exit /b %ERRORLEVEL%

:show_help
cls
echo.
echo ================================================================================
echo                 KakiLogger Database Maintenance Utility
echo ================================================================================
echo.
echo USAGE:
echo   db-maintenance.bat ^<command^> [options]
echo.
echo COMMANDS:
echo   backup                 Create full database backup
echo                         Output: db_backup_TIMESTAMP.json at project root
echo.
echo   restore ^<file^>        Restore database from backup
echo                         WARNING: Overwrites all collections!
echo                         Usage: db-maintenance.bat restore db_backup_2026-05-11T18-59-15-846Z.json
echo.
echo   investigate            Analyze logs by memberId
echo                         Shows: Log distribution, orphaned logs
echo.
echo   migrate-matan          Migrate Matan's logs to new member ID
echo                         Source: user-1-member-3
echo                         Target: user-3-member-1
echo.
echo   help                   Display this help message
echo.
echo EXAMPLES:
echo   db-maintenance.bat backup
echo   db-maintenance.bat investigate
echo   db-maintenance.bat restore db_backup_2026-05-11T18-59-15-846Z.json
echo.
exit /b 0

:backup
echo.
echo [*] Creating database backup...
pushd "%~dp0"
node backup_db.js
if %ERRORLEVEL% equ 0 (
    echo [OK] Backup completed successfully!
) else (
    echo [ERROR] Backup failed with exit code %ERRORLEVEL%
)
popd
exit /b %ERRORLEVEL%

:restore
if "%1%"=="" (
    echo.
    echo [ERROR] Backup filename required
    echo Usage: db-maintenance.bat restore ^<backup_file^>
    exit /b 1
)

echo.
echo [WARNING] This will overwrite your entire database!
echo Backup file: %1%
set /p confirmation="Type 'yes' to confirm restore: "

if /i not "%confirmation%"=="yes" (
    echo [ERROR] Restore cancelled
    exit /b 1
)

echo.
echo [*] Restoring database...
pushd "%~dp0"
node restore_db.js "%1%"
if %ERRORLEVEL% equ 0 (
    echo [OK] Restore completed successfully!
) else (
    echo [ERROR] Restore failed with exit code %ERRORLEVEL%
)
popd
exit /b %ERRORLEVEL%

:investigate
echo.
echo [*] Investigating database logs...
pushd "%~dp0"
node investigate_logs.js
popd
exit /b %ERRORLEVEL%

:migrate_matan
echo.
echo [*] Migrating Matan's logs (user-1-member-3 to user-3-member-1)...
pushd "%~dp0"
node migrate_matan_logs.js
if %ERRORLEVEL% equ 0 (
    echo [OK] Migration completed successfully!
) else (
    echo [ERROR] Migration failed with exit code %ERRORLEVEL%
)
popd
exit /b %ERRORLEVEL%

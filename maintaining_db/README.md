# Database Maintenance Guide

This directory contains utilities for managing the KakiLogger database, including backup, restore, investigation, and data migration tools.

## 📁 Directory Contents

| File | Purpose |
|------|---------|
| `backup_db.js` | Creates timestamped backup of all database collections |
| `restore_db.js` | Restores database from a backup file |
| `investigate_logs.js` | Analyzes logs to identify orphaned entries and data issues |
| `migrate_matan_logs.js` | Migrates Matan's logs from old to new member ID |
| `db-maintenance.ps1` | PowerShell wrapper for all utilities (recommended) |
| `db-maintenance.bat` | Batch file wrapper (alternative) |

## 🚀 Quick Start

### Using PowerShell (Recommended)

```powershell
# View help
.\db-maintenance.ps1 help

# Create a backup
.\db-maintenance.ps1 backup

# Investigate database issues
.\db-maintenance.ps1 investigate

# Restore from backup (with confirmation)
.\db-maintenance.ps1 restore db_backup_2026-05-11T18-59-15-846Z.json
```

### Using Batch File

```batch
# View help
db-maintenance.bat help

# Create a backup
db-maintenance.bat backup

# Investigate database issues
db-maintenance.bat investigate

# Restore from backup
db-maintenance.bat restore db_backup_2026-05-11T18-59-15-846Z.json
```

### Using Node Directly

```bash
# Backup
node backup_db.js

# Restore
node restore_db.js db_backup_2026-05-11T18-59-15-846Z.json

# Investigate
node investigate_logs.js

# Migrate Matan's logs
node migrate_matan_logs.js
```

## 📋 Commands Reference

### `backup` - Create Database Backup

Creates a full backup of all collections (users, logs, inviteCodes) with a timestamp.

**Output:** `db_backup_YYYY-MM-DDTHH-mm-ss-sssZ.json` (saved at project root)

**Usage:**
```powershell
.\db-maintenance.ps1 backup
```

**When to use:**
- Before making any database changes
- Regular scheduled backups for safety
- Before testing data migrations

---

### `restore <file>` - Restore from Backup

⚠️ **WARNING:** This completely overwrites your database. Use with caution!

**Usage:**
```powershell
.\db-maintenance.ps1 restore db_backup_2026-05-11T18-59-15-846Z.json
```

**Process:**
1. Script prompts for confirmation
2. Clears all collections
3. Restores all data from backup file
4. Displays completion status

---

### `investigate` - Analyze Database

Examines logs and user data to identify:
- Log distribution by memberId
- Orphaned logs (logs without matching user)
- Data integrity issues

**Usage:**
```powershell
.\db-maintenance.ps1 investigate
```

**Output example:**
```
Total logs: 50
Logs by memberId:
  user-1-member-1: 22 logs
  user-1-member-2: 19 logs
  user-1-member-3: 8 logs (ORPHANED)
  user-1-member-4: 1 log
```

---

### `migrate-matan` - Migrate Matan's Logs

Migrates Matan's 8 logs from old member ID to new ID after user reconfiguration.

- **From:** `user-1-member-3` (old Matan ID)
- **To:** `user-3-member-1` (new Matan ID)

**Usage:**
```powershell
.\db-maintenance.ps1 migrate-matan
```

---

## 📝 Common Workflows

### Scenario 1: Regular Database Backup

```powershell
# Run daily/weekly backup
.\db-maintenance.ps1 backup

# Backup is saved to parent directory automatically
```

### Scenario 2: Database Corruption / Data Loss Recovery

```powershell
# 1. Investigate the issue
.\db-maintenance.ps1 investigate

# 2. If data loss confirmed, restore from backup
.\db-maintenance.ps1 restore db_backup_2026-05-11T18-59-15-846Z.json

# 3. Verify restoration
.\db-maintenance.ps1 investigate
```

### Scenario 3: User Reconfiguration (Member ID Changes)

```powershell
# 1. Back up before changes
.\db-maintenance.ps1 backup

# 2. Make user configuration changes in MongoDB manually

# 3. Investigate if logs became orphaned
.\db-maintenance.ps1 investigate

# 4. If needed, run appropriate migration script or create custom one
# (For Matan specifically: .\db-maintenance.ps1 migrate-matan)
```

---

## 🔧 Customization

### Creating Custom Migration Scripts

If you need to migrate data for other users, follow the pattern in `migrate_matan_logs.js`:

```javascript
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const client = new MongoClient(MONGODB_URI);

async function migrateLogs() {
  await client.connect();
  const db = client.db('KakiLogger');
  const logs = db.collection('logs');
  
  const result = await logs.updateMany(
    { memberId: 'OLD_MEMBER_ID' },
    { $set: { memberId: 'NEW_MEMBER_ID' } }
  );
  
  console.log(`Migrated ${result.modifiedCount} logs`);
  await client.close();
}

migrateLogs().catch(console.error);
```

---

## ⚠️ Important Notes

1. **Backup Location:** Backup files are saved to the **project root**, not this directory
2. **Restore Confirmation:** Always confirm restore operations - this cannot be undone!
3. **Environment Setup:** Ensure `.env.local` with `MONGODB_URI` is configured
4. **Database Connection:** All operations connect directly to MongoDB cluster
5. **Execution Environment:** PowerShell scripts require execution policy:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

---

## 🐛 Troubleshooting

### "Command not found" error
- Ensure you're in the `maintaining_db` directory
- For PowerShell: prefix with `.\` (e.g., `.\db-maintenance.ps1`)
- For batch: run `db-maintenance.bat` directly

### MongoDB Connection Error
- Verify `.env.local` contains correct `MONGODB_URI`
- Check network connectivity to MongoDB cluster
- Confirm IP whitelist if using MongoDB Atlas

### Script Execution Policy Error (PowerShell)
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
# Then retry the command
```

---

## 📞 Support

For database-related issues:
1. Run `.\db-maintenance.ps1 investigate` to analyze current state
2. Create a backup before making changes
3. Check MongoDB connection in `.env.local`
4. Review script output for specific error messages

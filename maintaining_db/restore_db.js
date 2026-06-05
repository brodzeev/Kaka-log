const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

async function restoreDatabase(backupFile) {
  try {
    if (!fs.existsSync(backupFile)) {
      console.error(`❌ Backup file not found: ${backupFile}`);
      console.log('\nAvailable backups:');
      const files = fs.readdirSync(__dirname).filter(f => f.startsWith('db_backup_'));
      files.forEach(f => console.log(`  - ${f}`));
      return;
    }

    console.log(`📦 Reading backup from: ${backupFile}`);
    const backup = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    
    const uri = 'mongodb+srv://brodzeev_db_user:XDDUgtep2b1z1l1q@clustersimpleapps.puun6bp.mongodb.net/?appName=ClusterSimpleApps';
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('kakilogger');
    
    console.log('\n⚠️  WARNING: This will OVERWRITE the current database!');
    console.log('Make sure you have confirmed this operation.\n');
    
    // Drop all collections first
    const collections = await db.listCollections().toArray();
    for (const collection of collections) {
      await db.collection(collection.name).deleteMany({});
      console.log(`🗑️  Cleared collection: ${collection.name}`);
    }
    
    // Restore all collections
    for (const [collName, documents] of Object.entries(backup)) {
      const coll = db.collection(collName);
      if (documents.length > 0) {
        await coll.insertMany(documents);
        console.log(`✓ Restored collection "${collName}": ${documents.length} documents`);
      }
    }
    
    console.log('\n✅ Database restore complete!');
    await client.close();
  } catch (error) {
    console.error('❌ Restore failed:', error.message);
  }
}

// Get backup file from command line argument
const backupFile = process.argv[2];
if (!backupFile) {
  console.log('Usage: node restore_db.js <backup_file>');
  console.log('\nExample: node restore_db.js db_backup_2026-05-11T18-59-15-846Z.json');
  console.log('\nAvailable backups:');
  const files = fs.readdirSync(__dirname).filter(f => f.startsWith('db_backup_'));
  if (files.length === 0) {
    console.log('  (No backups found)');
  } else {
    files.forEach(f => console.log(`  - ${f}`));
  }
} else {
  restoreDatabase(path.join(__dirname, backupFile));
}

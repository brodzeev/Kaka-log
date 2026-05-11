const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const uri = 'mongodb+srv://brodzeev_db_user:XDDUgtep2b1z1l1q@clustersimpleapps.puun6bp.mongodb.net/?appName=ClusterSimpleApps';
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('kakilogger');
    
    // Get all collections
    const collections = await db.listCollections().toArray();
    const backup = {};
    
    console.log('Starting backup...\n');
    
    for (const collection of collections) {
      const collName = collection.name;
      const coll = db.collection(collName);
      const data = await coll.find({}).toArray();
      backup[collName] = data;
      console.log(`✓ Backed up collection "${collName}": ${data.length} documents`);
    }
    
    // Save to file with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(__dirname, `db_backup_${timestamp}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    
    console.log(`\n✅ Full backup saved to: ${backupFile}`);
    console.log(`📊 Total collections: ${Object.keys(backup).length}`);
    
    await client.close();
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
  }
})();

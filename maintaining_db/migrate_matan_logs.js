const { MongoClient } = require('mongodb');

(async () => {
  try {
    const uri = 'mongodb+srv://brodzeev_db_user:XDDUgtep2b1z1l1q@clustersimpleapps.puun6bp.mongodb.net/?appName=ClusterSimpleApps';
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('kakilogger');
    const logs = db.collection('logs');
    
    console.log('🔧 Migrating Matan\'s logs from user-1-member-3 to user-3-member-1...\n');
    
    // Find all logs with the old member ID
    const oldLogs = await logs.find({ memberId: 'user-1-member-3' }).toArray();
    console.log(`Found ${oldLogs.length} logs with old member ID: user-1-member-3`);
    
    if (oldLogs.length > 0) {
      // Update all logs to the new member ID
      const result = await logs.updateMany(
        { memberId: 'user-1-member-3' },
        { $set: { memberId: 'user-3-member-1' } }
      );
      
      console.log(`✓ Updated ${result.modifiedCount} logs`);
      
      // Verify the update
      const newLogs = await logs.find({ memberId: 'user-3-member-1' }).toArray();
      console.log(`✓ Now there are ${newLogs.length} logs with member ID: user-3-member-1`);
      
      console.log('\n✅ Matan\'s logs have been restored!');
      console.log('Sample logs:');
      newLogs.slice(0, 3).forEach(log => {
        console.log(`  - ${log.date}: ${log.type} (${log.quantity})`);
      });
    } else {
      console.log('⚠️  No logs found with old member ID');
    }
    
    await client.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
})();

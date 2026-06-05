const { MongoClient } = require('mongodb');

(async () => {
  try {
    const uri = 'mongodb+srv://brodzeev_db_user:XDDUgtep2b1z1l1q@clustersimpleapps.puun6bp.mongodb.net/?appName=ClusterSimpleApps';
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('kakilogger');
    const users = db.collection('users');
    const logs = db.collection('logs');
    
    // Get Matan
    const matan = await users.findOne({ name: 'Matan' });
    console.log('=== MATAN\'S USER RECORD ===');
    console.log('ID:', matan.id);
    console.log('Name:', matan.name);
    console.log('Role:', matan.role);
    console.log('Family Members:', matan.familyMembers);
    
    // Extract all member IDs for Matan
    const matanMemberIds = matan.familyMembers.map(m => m.id);
    console.log('\n=== MATAN\'S MEMBER IDs ===');
    matanMemberIds.forEach(id => console.log(`  - ${id}`));
    
    // Search for logs by Matan's user ID
    console.log('\n=== SEARCHING FOR LOGS ===');
    const logsByMemberId = await logs.find({ 
      memberId: { $in: matanMemberIds } 
    }).toArray();
    console.log(`\nLogs with Matan's member IDs: ${logsByMemberId.length}`);
    logsByMemberId.slice(0, 5).forEach(log => {
      console.log(`  - Date: ${log.date}, Type: ${log.type}, Member: ${log.memberId}`);
    });
    
    // Check ALL logs and find any that might be Matan's old ones
    console.log('\n=== ALL LOGS IN DATABASE ===');
    const allLogs = await logs.find({}).toArray();
    console.log(`Total logs in database: ${allLogs.length}`);
    
    // Group logs by memberId
    const logsByMember = {};
    allLogs.forEach(log => {
      if (!logsByMember[log.memberId]) {
        logsByMember[log.memberId] = [];
      }
      logsByMember[log.memberId].push(log);
    });
    
    console.log('\nLogs by memberId:');
    Object.entries(logsByMember).forEach(([memberId, memberLogs]) => {
      console.log(`  ${memberId}: ${memberLogs.length} logs`);
    });
    
    // Check if there are logs with old "user-3" references
    const user3Logs = allLogs.filter(l => l.memberId.startsWith('user-3'));
    console.log(`\n⚠️  Logs for 'user-3': ${user3Logs.length}`);
    if (user3Logs.length > 0) {
      console.log('Sample user-3 logs:');
      user3Logs.slice(0, 3).forEach(log => {
        console.log(`  - ${log.memberId}: ${log.date} (type: ${log.type})`);
      });
    }
    
    await client.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
})();

import pool from './src/db.js';

async function testConnection() {
  console.log('🔗 Testing PostgreSQL connection...');
  
  try {
    // Test basic connection
    const healthCheck = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Database connected successfully!');
    console.log('⏰ Current time:', healthCheck.rows[0].current_time);
    
    // Test if Test-Table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Test-Table'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ Test-Table exists!');
      
      // Get table data
      const data = await pool.query('SELECT * FROM "Test-Table" LIMIT 5');
      console.log('📊 Sample data from Test-Table:');
      console.table(data.rows);
    } else {
      console.log('⚠️  Test-Table does not exist. Run setup_db.sql first.');
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error);
  } finally {
    await pool.end();
    console.log('🔒 Connection closed');
  }
}

testConnection();
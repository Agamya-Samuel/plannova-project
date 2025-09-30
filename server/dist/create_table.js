import pool from './src/db.js';
async function createTable() {
    console.log('🔧 Creating Test-Table...');
    try {
        // Create the table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS "Test-Table" (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        value TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log('✅ Test-Table created successfully!');
        // Insert sample data
        await pool.query(`
      INSERT INTO "Test-Table" (name, value) VALUES 
        ('Sample Data 1', 'This is test value 1'),
        ('Sample Data 2', 'This is test value 2'),
        ('Sample Data 3', 'This is test value 3')
      ON CONFLICT DO NOTHING
    `);
        console.log('✅ Sample data inserted!');
        // Create index
        await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_test_table_name ON "Test-Table"(name)
    `);
        console.log('✅ Index created!');
        // Verify by selecting data
        const result = await pool.query('SELECT * FROM "Test-Table"');
        console.log('📊 Table contents:');
        console.table(result.rows);
    }
    catch (error) {
        console.error('❌ Error creating table:', error);
    }
    finally {
        await pool.end();
        console.log('🔒 Connection closed');
    }
}
createTable();
//# sourceMappingURL=create_table.js.map
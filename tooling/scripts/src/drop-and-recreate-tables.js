// Drop PipeTrak tables and recreate with Prisma
const { Pool } = require('pg');

async function dropAndRecreateTables() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error("Missing DATABASE_URL or DIRECT_URL environment variable");
  }

  const pool = new Pool({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log("🗑️  Dropping existing PipeTrak tables...");
    
    const client = await pool.connect();
    
    try {
      // Drop tables in reverse dependency order
      const dropSQL = `
        DROP TABLE IF EXISTS audit_log CASCADE;
        DROP TABLE IF EXISTS import_job CASCADE;
        DROP TABLE IF EXISTS component_milestone CASCADE;
        DROP TABLE IF EXISTS component CASCADE;
        DROP TABLE IF EXISTS milestone_template CASCADE;
        DROP TABLE IF EXISTS drawing CASCADE;
        DROP TABLE IF EXISTS project CASCADE;
      `;
      
      await client.query(dropSQL);
      console.log("✅ Tables dropped successfully");
      
      // Verify tables are dropped
      const checkSQL = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('project', 'drawing', 'milestone_template', 'component', 'component_milestone', 'import_job', 'audit_log');
      `;
      
      const result = await client.query(checkSQL);
      
      if (result.rows && result.rows.length > 0) {
        console.log("⚠️  Some tables still exist:");
        result.rows.forEach((row) => {
          console.log(`  - ${row.table_name}`);
        });
      } else {
        console.log("✅ All PipeTrak tables successfully removed");
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("❌ Error dropping tables:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the script
dropAndRecreateTables()
  .then(() => {
    console.log("🎉 Table cleanup complete!");
    console.log("Now run: pnpm --filter database push");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Table cleanup failed:", error);
    process.exit(1);
  });
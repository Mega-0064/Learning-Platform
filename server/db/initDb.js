const pg = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Base configuration without database specified
const baseConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
};

// Database-specific configuration
const dbConfig = {
  ...baseConfig,
  database: process.env.DB_NAME,
};

/**
 * Create the database if it doesn't exist
 */
async function createDatabaseIfNotExists() {
  const client = new pg.Client({
    ...baseConfig,
    database: 'postgres', // Connect to default postgres database first
  });

  try {
    console.log('Connecting to default PostgreSQL database...');
    await client.connect();
    console.log('Connected to default database successfully.');

    // Check if our target database exists
    const dbName = process.env.DB_NAME;
    const checkResult = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (checkResult.rows.length === 0) {
      console.log(`Database "${dbName}" does not exist. Creating it now...`);
      // Need to use template0 to avoid encoding issues
      await client.query(`CREATE DATABASE ${dbName} WITH TEMPLATE template0 ENCODING 'UTF8'`);
      console.log(`Database "${dbName}" created successfully.`);
      return { success: true, message: `Database "${dbName}" created successfully.` };
    } else {
      console.log(`Database "${dbName}" already exists.`);
      return { success: true, message: `Database "${dbName}" already exists.` };
    }
  } catch (error) {
    console.error('Error creating database:', error.message);
    return { success: false, message: error.message, error };
  } finally {
    try {
      await client.end();
      console.log('Default database connection closed.');
    } catch (err) {
      console.error('Error closing default database connection:', err.message);
    }
  }
}

/**
 * Initialize the database with schema and sample data
 */
async function initializeDatabase() {
  // First, create the database if it doesn't exist
  const createResult = await createDatabaseIfNotExists();
  if (!createResult.success) {
    return createResult; // Return early if database creation failed
  }

  // Now connect to the learning platform database to create tables
  const client = new pg.Client(dbConfig);
  
  try {
    console.log(`Connecting to "${process.env.DB_NAME}" database...`);
    await client.connect();
    console.log('Connected to database successfully.');
    
    // Read SQL file
    const sqlFilePath = path.join(__dirname, 'init.sql');
    const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('Executing database initialization script...');
    await client.query(sqlScript);
    console.log('Database tables and sample data initialized successfully.');
    
    return { success: true, message: 'Database initialized successfully.' };
  } catch (error) {
    console.error('Error initializing database tables:', error.message);
    return { success: false, message: error.message, error };
  } finally {
    try {
      await client.end();
      console.log('Database connection closed.');
    } catch (err) {
      console.error('Error closing database connection:', err.message);
    }
  }
}

// Run the initialization if this script is executed directly
if (require.main === module) {
  console.log('Running database initialization...');
  initializeDatabase()
    .then((result) => {
      if (result.success) {
        console.log('✅ Database initialization completed successfully!');
        process.exit(0);
      } else {
        console.error('❌ Database initialization failed:', result.message);
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error('❌ Unexpected error during database initialization:', err);
      process.exit(1);
    });
}

module.exports = initializeDatabase;

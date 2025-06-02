const pg = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create a pool of connections
const pool = new pg.Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
});

// Test the connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
  } else {
    console.log('Successfully connected to PostgreSQL database');
    release();
  }
});

// Export the pool for usage throughout the application
// The pool object already has a query method that can be used like: pool.query(text, params)
module.exports = pool;

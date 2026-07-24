// =============================================================================
// db.js — MySQL Database Connection Pool
// =============================================================================
// This file creates a "pool" of database connections that our app can reuse.
// A pool is more efficient than opening and closing a new connection for
// every single database query.
//
// We read all credentials from environment variables (the .env file) so that
// no passwords or secrets are ever written directly in the source code.
// =============================================================================

// Load the dotenv library so process.env can read from the .env file
require('dotenv').config();

// Import the mysql2 library — we use the 'promise' version so we can use
// async/await instead of old-style callbacks
const mysql = require('mysql2/promise');

// Create the connection pool using values from the .env file
const pool = mysql.createPool({
  host: process.env.DB_HOST,         // e.g. "localhost"
  port: process.env.DB_PORT,         // e.g. 3306
  user: process.env.DB_USER,         // e.g. "root"
  password: process.env.DB_PASSWORD, // your MySQL password
  database: process.env.DB_NAME,     // e.g. "ward_management_db"
  waitForConnections: true,          // wait if all connections are busy
  connectionLimit: 10,               // maximum 10 simultaneous connections
  queueLimit: 0,                     // unlimited waiting queue
  ssl: process.env.DB_SSL === 'false' ? undefined : { rejectUnauthorized: false }
});

// Export the pool so other files can import it and run queries
module.exports = pool;

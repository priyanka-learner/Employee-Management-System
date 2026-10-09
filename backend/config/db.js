/**
 * db.js — MySQL connection pool using mysql2/promise
 * Reads credentials from environment variables (never hard-coded).
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               parseInt(process.env.DB_PORT || '3306', 10),
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || 'employee_management',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  timezone:           'Z',          // Store/retrieve dates in UTC
  decimalNumbers:     true,         // Return DECIMAL columns as JS numbers
});

/**
 * Test the pool connection at startup and log the result.
 * Does NOT throw — the server continues; individual queries will fail fast
 * if the DB is genuinely unreachable.
 */
pool.getConnection()
  .then(conn => {
    console.log(`✅  MySQL connected  →  ${process.env.DB_HOST}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME}`);
    conn.release();
  })
  .catch(err => {
    console.error('❌  MySQL connection error:', err.message);
  });

module.exports = pool;

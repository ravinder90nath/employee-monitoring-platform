const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: process.env.DB_HOST||'localhost', port: process.env.DB_PORT||3306,
  user: process.env.DB_USER||'root', password: process.env.DB_PASS||'',
  database: process.env.DB_NAME||'desk_watch',
  waitForConnections: true, connectionLimit: 20, timezone: '+05:30',
});
module.exports = pool;

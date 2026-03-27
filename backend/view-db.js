require('dotenv').config();
const mysql = require('mysql2/promise');

const dbUrl = process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL) : null;

async function main() {
  const conn = await mysql.createConnection({
    host: dbUrl?.hostname || process.env.DB_HOST || 'localhost',
    port: Number(dbUrl?.port || process.env.DB_PORT || 3306),
    user: dbUrl ? decodeURIComponent(dbUrl.username) : (process.env.DB_USER || 'root'),
    password: dbUrl ? decodeURIComponent(dbUrl.password) : (process.env.DB_PASSWORD || ''),
    database: dbUrl ? dbUrl.pathname.replace(/^\//, '') : (process.env.DB_NAME || 'slokane_db'),
  });

  const [, , table, filter] = process.argv;

  try {
    if (!table) {
      const [[{ users }]] = await conn.execute('SELECT COUNT(*) AS users FROM users');
      const [[{ contacts }]] = await conn.execute('SELECT COUNT(*) AS contacts FROM contacts');
      const [[{ subscribers }]] = await conn.execute('SELECT COUNT(*) AS subscribers FROM subscribers');
      const [[{ orders }]] = await conn.execute('SELECT COUNT(*) AS orders FROM orders');
      console.log({
        database: dbUrl ? dbUrl.pathname.replace(/^\//, '') : (process.env.DB_NAME || 'slokane_db'),
        users,
        contacts,
        subscribers,
        orders,
      });
      return;
    }

    if (table === 'users') {
      const [rows] = await conn.execute('SELECT id, name, email, phone, created_at FROM users ORDER BY id DESC');
      console.table(rows);
      return;
    }

    if (table === 'contacts') {
      const sql = filter
        ? 'SELECT * FROM contacts WHERE status = ? ORDER BY id DESC'
        : 'SELECT * FROM contacts ORDER BY id DESC';
      const [rows] = await conn.execute(sql, filter ? [filter] : []);
      console.table(rows);
      return;
    }

    if (table === 'orders') {
      const sql = filter
        ? 'SELECT * FROM orders WHERE status = ? ORDER BY id DESC'
        : 'SELECT * FROM orders ORDER BY id DESC';
      const [rows] = await conn.execute(sql, filter ? [filter] : []);
      console.table(rows);
      return;
    }

    if (table === 'subscribers') {
      const [rows] = await conn.execute('SELECT * FROM subscribers ORDER BY id DESC');
      console.table(rows);
      return;
    }

    console.error('Unknown table. Use: users | contacts | orders | subscribers');
    process.exit(1);
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

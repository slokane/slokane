require('dotenv').config();
const mysql = require('mysql2/promise');

const dbUrl = process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL) : null;
const config = dbUrl
  ? {
      host: dbUrl.hostname,
      port: Number(dbUrl.port || 3306),
      user: decodeURIComponent(dbUrl.username),
      password: decodeURIComponent(dbUrl.password),
      database: dbUrl.pathname.replace(/^\//, ''),
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'slokane_db',
    };

async function main() {
  let conn;
  try {
    conn = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
    });
    console.log(`MySQL server reachable: ${config.host}:${config.port}`);
  } catch (err) {
    console.error(`MySQL connect failed: ${err.code || err.name} ${err.message}`);
    process.exit(1);
  }

  try {
    const [dbRows] = await conn.execute(
      'SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?',
      [config.database]
    );
    console.log(`Database "${config.database}" exists: ${dbRows.length > 0}`);

    await conn.execute(`USE \`${config.database}\``);
    const [tables] = await conn.execute('SHOW TABLES');
    const names = tables.map((t) => Object.values(t)[0]);
    console.log(`Tables: ${names.join(', ') || '(none)'}`);

    for (const table of ['users', 'orders', 'contacts', 'subscribers']) {
      console.log(`${table}: ${names.includes(table) ? 'OK' : 'MISSING'}`);
    }
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

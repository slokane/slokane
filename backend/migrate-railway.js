require('dotenv').config();
const mysql = require('mysql2/promise');

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  const dbUrl = new URL(process.env.DATABASE_URL);
  const conn = await mysql.createConnection({
    host: dbUrl.hostname,
    port: Number(dbUrl.port || 3306),
    user: decodeURIComponent(dbUrl.username),
    password: decodeURIComponent(dbUrl.password),
    database: dbUrl.pathname.replace(/^\//, ''),
  });

  try {
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT NOT NULL AUTO_INCREMENT,
        name VARCHAR(150) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL DEFAULT '',
        password VARCHAR(255) NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_users_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    const [existingColumns] = await conn.execute('SHOW COLUMNS FROM users');
    const hasPhone = existingColumns.some((column) => column.Field === 'phone');
    if (!hasPhone) {
      await conn.execute(
        "ALTER TABLE users ADD COLUMN phone VARCHAR(20) NOT NULL DEFAULT '' AFTER email"
      );
    }

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT NOT NULL AUTO_INCREMENT,
        user_id INT NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        variant VARCHAR(100) NOT NULL DEFAULT '',
        quantity INT NOT NULL DEFAULT 1,
        price DECIMAL(10,2) NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        customer_name VARCHAR(150) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(20) NOT NULL,
        address TEXT NOT NULL,
        city VARCHAR(100) NOT NULL DEFAULT '',
        pincode VARCHAR(10) NOT NULL DEFAULT '',
        status ENUM('pending','confirmed','processing','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending',
        tracking_id VARCHAR(100) NOT NULL DEFAULT '',
        notes TEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        INDEX idx_orders_user (user_id),
        INDEX idx_orders_status (status),
        INDEX idx_orders_phone (customer_phone),
        CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INT NOT NULL AUTO_INCREMENT,
        name VARCHAR(150) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(30) NOT NULL DEFAULT '',
        service VARCHAR(100) NOT NULL DEFAULT '',
        message TEXT NOT NULL,
        status ENUM('new','read','replied','closed') NOT NULL DEFAULT 'new',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        INDEX idx_contacts_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS subscribers (
        id INT NOT NULL AUTO_INCREMENT,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(150) NOT NULL DEFAULT '',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_subscribers_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    const [columns] = await conn.execute('SHOW COLUMNS FROM users');
    const [tables] = await conn.execute('SHOW TABLES');

    console.log(JSON.stringify({
      database: dbUrl.pathname.replace(/^\//, ''),
      usersColumns: columns.map((c) => c.Field),
      tables: tables.map((t) => Object.values(t)[0]),
    }, null, 2));
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error(err.code || err.name, err.message);
  process.exit(1);
});

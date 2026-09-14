require('dotenv').config();
const mysql = require('mysql2/promise');

async function updateDB() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'false' ? undefined : { rejectUnauthorized: false }
  });

  try {
    console.log('Connected to DB. Starting updates...');

    // 1. Update ENUM for users table
    // MySQL altering ENUM requires knowing the full definition.
    // Existing: ENUM('admin','wardAdmin','staff','doctor')
    // New: ENUM('admin','wardAdmin','admissionDoctor','nurse','doctor')
    // We should safely convert 'staff' to 'nurse' just in case there are records, or keep 'staff' temporarily.
    // Let's modify the column to support all of them, then update 'staff' -> 'nurse', then alter again to remove 'staff' if needed, 
    // but simply updating the ENUM list is safer.
    await pool.query(`
      ALTER TABLE users 
      MODIFY COLUMN role ENUM('admin','wardAdmin','staff','admissionDoctor','nurse','doctor') NOT NULL;
    `);
    
    console.log('Role ENUM updated.');

    // Convert any existing 'staff' to 'nurse'
    await pool.query(`UPDATE users SET role = 'nurse' WHERE role = 'staff';`);
    console.log('Converted existing staff to nurse.');

    // Now strict ENUM
    await pool.query(`
      ALTER TABLE users 
      MODIFY COLUMN role ENUM('admin','wardAdmin','admissionDoctor','nurse','doctor') NOT NULL;
    `);
    console.log('Role ENUM restricted to official roles.');

    // 2. Add isTemporaryPassword column if not exists
    // We can use a try-catch for adding columns to avoid crashing if it already exists
    try {
      await pool.query(`ALTER TABLE users ADD COLUMN isTemporaryPassword BOOLEAN DEFAULT TRUE;`);
      console.log('Added isTemporaryPassword column.');
    } catch(err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('isTemporaryPassword column already exists.');
      } else {
        throw err;
      }
    }

    // 3. Create user_ward_assignments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_ward_assignments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        wardId INT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (wardId) REFERENCES ward(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_ward (userId, wardId)
      );
    `);
    console.log('user_ward_assignments table created.');

    console.log('Database updates completed successfully.');
  } catch (err) {
    console.error('Database update failed:', err);
  } finally {
    await pool.end();
  }
}

updateDB();

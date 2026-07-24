// =============================================================================
// seed.js — Database Seed Script
// =============================================================================
// PURPOSE:
//   This script inserts 4 default test users into the `users` table —
//   one for each role in the system (admin, wardAdmin, staff, doctor).
//   It is meant to be run ONCE after the database schema has been created.
//
// HOW TO RUN:
//   1. Make sure your .env file is configured with correct DB credentials.
//   2. Make sure the database schema has been applied (run schema.sql first).
//   3. From the /server directory, run:
//        node seed.js
//
// SAFETY:
//   The script checks if a user with each email already exists before inserting.
//   This makes it safe to run multiple times without creating duplicates.
// =============================================================================

// Load environment variables so we can connect to the database
require('dotenv').config();

// Import bcryptjs to hash passwords before storing them
const bcrypt = require('bcryptjs');

// Import the database connection pool
const db = require('./src/config/db');

// =============================================================================
// SEED DATA
// These are the 4 default test accounts.
// In a real system, you would change these passwords immediately after setup.
// =============================================================================
const defaultUsers = [
  {
    fullName: 'System Administrator',
    email: 'admin@hospital.com',
    password: 'Admin@1234',    // Plaintext — will be hashed below
    role: 'admin',
    contactNumber: '01112345678'
  },
  {
    fullName: 'Ward Admin User',
    email: 'wardadmin@hospital.com',
    password: 'WardAdmin@1234',
    role: 'wardAdmin',
    contactNumber: '01112345679'
  },
  {
    fullName: 'Staff Nurse',
    email: 'staff@hospital.com',
    password: 'Staff@1234',
    role: 'staff',
    contactNumber: '01112345680'
  },
  {
    fullName: 'Doctor Ahmad',
    email: 'doctor@hospital.com',
    password: 'Doctor@1234',
    role: 'doctor',
    contactNumber: '01112345681'
  }
];

// =============================================================================
// MAIN SEED FUNCTION
// =============================================================================
// This async function runs through each user in the list above and inserts
// them into the database if they do not already exist.
// =============================================================================
const runSeed = async () => {
  console.log('========================================================');
  console.log('  Hospital Ward Management — Database Seed Script');
  console.log('========================================================');
  console.log('Starting to seed default users...\n');

  // The number of bcrypt salt rounds — 10 is the standard recommendation
  const saltRounds = 10;

  // Loop through each user in the defaultUsers array
  for (const userData of defaultUsers) {
    try {
      // --- Step 1: Check if this user already exists in the database ---
      const checkEmailSql = 'SELECT id FROM users WHERE email = ? LIMIT 1';
      const [existingRows] = await db.query(checkEmailSql, [userData.email]);

      // If the user already exists, skip to the next one
      if (existingRows.length > 0) {
        console.log(`  [SKIP] User already exists: ${userData.email}`);
        continue;
      }

      // --- Step 2: Hash the plaintext password ---
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      // --- Step 3: Insert the new user ---
      // Note: For the very first user (admin), createdBy is set to NULL
      // because there is no prior user to reference.
      // After the first insert, we use the admin's ID for subsequent users.
      const insertUserSql = `
        INSERT INTO users (fullName, email, passwordHash, role, contactNumber, status, createdBy, updatedBy)
        VALUES (?, ?, ?, ?, ?, 'active', NULL, NULL)
      `;

      const insertValues = [
        userData.fullName,
        userData.email,
        hashedPassword,
        userData.role,
        userData.contactNumber
      ];

      const [insertResult] = await db.query(insertUserSql, insertValues);

      console.log(`  [OK]   Created user: ${userData.email} (Role: ${userData.role}, ID: ${insertResult.insertId})`);

    } catch (error) {
      // If something went wrong for this specific user, log the error and continue
      console.error(`  [ERROR] Failed to create user ${userData.email}:`, error.message);
    }
  }

  console.log('\n========================================================');
  console.log('  Seed script completed!');
  console.log('========================================================');
  console.log('\nDefault login credentials (change these in production):');
  console.log('  Admin       → admin@hospital.com      / Admin@1234');
  console.log('  Ward Admin  → wardadmin@hospital.com  / WardAdmin@1234');
  console.log('  Staff       → staff@hospital.com      / Staff@1234');
  console.log('  Doctor      → doctor@hospital.com     / Doctor@1234');
  console.log('\n');

  // Close the database connection pool so the script exits cleanly
  await db.end();
};

// Run the seed function and catch any top-level errors
runSeed().catch((error) => {
  console.error('\n[FATAL] Seed script encountered an unexpected error:', error);
  process.exit(1); // Exit with error code 1 to signal failure
});

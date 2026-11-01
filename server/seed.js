// =============================================================================
// seed.js — Database Seed Script
// =============================================================================
// PURPOSE:
//   This script inserts default test users into the `users` table for each role:
//   admin, wardAdmin, admissionDoctor, nurse, doctor.
//   It is meant to be run ONCE after the database schema has been created.
//
// HOW TO RUN:
//   1. Make sure your .env file is configured with correct DB credentials.
//   2. Run schema.sql first in MySQL.
//   3. From the /server directory, run:
//        node seed.js
// =============================================================================

require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./src/config/db');

const defaultUsers = [
  {
    fullName: 'System Administrator',
    email: 'admin@hospital.com',
    password: 'Admin@1234',
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
    fullName: 'Dr. Jane (Admission Doctor)',
    email: 'admissiondoctor@hospital.com',
    password: 'Doctor@1234',
    role: 'admissionDoctor',
    contactNumber: '01112345680'
  },
  {
    fullName: 'Nurse Sarah',
    email: 'nurse@hospital.com',
    password: 'Nurse@1234',
    role: 'nurse',
    contactNumber: '01112345681'
  },
  {
    fullName: 'Dr. Ahmad (Ward Doctor)',
    email: 'doctor@hospital.com',
    password: 'Doctor@1234',
    role: 'doctor',
    contactNumber: '01112345682'
  }
];

const runSeed = async () => {
  console.log('========================================================');
  console.log('  Hospital Ward Management — Database Seed Script');
  console.log('========================================================');
  console.log('Starting to seed default users...\n');

  const saltRounds = 10;

  for (const userData of defaultUsers) {
    try {
      const checkEmailSql = 'SELECT id FROM users WHERE email = ? LIMIT 1';
      const [existingRows] = await db.query(checkEmailSql, [userData.email]);

      if (existingRows.length > 0) {
        console.log(`  [SKIP] User already exists: ${userData.email}`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

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
      console.error(`  [ERROR] Failed to create user ${userData.email}:`, error.message);
    }
  }

  console.log('\n========================================================');
  console.log('  Seed script completed!');
  console.log('========================================================');
  console.log('\nDefault login credentials:');
  console.log('  Admin             -> admin@hospital.com           / Admin@1234');
  console.log('  Ward Admin        -> wardadmin@hospital.com       / WardAdmin@1234');
  console.log('  Admission Doctor  -> admissiondoctor@hospital.com / Doctor@1234');
  console.log('  Nurse             -> nurse@hospital.com           / Nurse@1234');
  console.log('  Ward Doctor       -> doctor@hospital.com          / Doctor@1234');
  console.log('\n');

  await db.end();
};

runSeed().catch((error) => {
  console.error('\n[FATAL] Seed script encountered an error:', error);
  process.exit(1);
});

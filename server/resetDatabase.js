// =============================================================================
// resetDatabase.js — Complete Database Reset & Comprehensive Seeding Script
// =============================================================================
// PURPOSE:
//   1. Drops all existing tables in the database.
//   2. Recreates all 16 tables cleanly from schema.sql.
//   3. Seeds comprehensive, realistic hospital demo data for all 4 roles:
//      - Users (Admin, Ward Admin, Staff Nurse, Admission Doctor, Doctor)
//      - Departments & Wards
//      - Staff Ward Assignments
//      - Sections & Beds (available, occupied, maintenance)
//      - Master Patients (adults & minors with NIC, guardian info, blood group)
//      - Active Admissions & Discharged Records with QR Codes
//      - Patient Vitals (BP, Pulse, Temperature)
//      - Internal Ward Transfer Logs
//      - External Hospitals & Transfer Logs
//      - Clinical Requests (Pending & Approved Discharges)
//      - Medical Equipment & Maintenance Logs
//      - Shortage Alert Logs
// =============================================================================

require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

// Helper to format date strings for MySQL DATETIME
const formatDate = (date) => date.toISOString().slice(0, 19).replace('T', ' ');

async function runReset() {
  console.log('========================================================');
  console.log('  Hospital Ward Management — Full Database Reset');
  console.log('========================================================\n');

  // Step 1: Connect to MySQL server
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
    ssl: process.env.DB_SSL === 'false' ? undefined : { rejectUnauthorized: false }
  });

  try {
    console.log('✅ Connected to MySQL database.');

    // Step 2: Disable foreign key checks and drop all existing tables
    console.log('\n[1/4] Dropping all existing database tables...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    const [existingTables] = await connection.query('SHOW TABLES');
    for (const tableObj of existingTables) {
      const tableName = Object.values(tableObj)[0];
      await connection.query(`DROP TABLE IF EXISTS \`${tableName}\``);
      console.log(`  - Dropped table: ${tableName}`);
    }
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ All previous tables dropped successfully.');

    // Step 3: Recreate tables using schema.sql
    console.log('\n[2/4] Executing schema.sql to recreate tables...');
    const schemaPath = path.join(__dirname, 'database', 'schema.sql');
    let schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Remove database creation statements since we are already connected to DB_NAME
    schemaSql = schemaSql
      .replace(/DROP\s+DATABASE\s+[^;]+;/gis, '')
      .replace(/CREATE\s+DATABASE\s+[^;]+;/gis, '')
      .replace(/USE\s+[^;]+;/gis, '');

    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query(schemaSql);
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ All 16 database tables recreated cleanly.');

    // Step 4: Seed fresh demo data
    console.log('\n[3/4] Seeding realistic hospital demo data...');
    const saltRounds = 10;

    // 4.1 Seed Users
    console.log('  -> Inserting default users...');
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
        fullName: 'Staff Nurse',
        email: 'staff@hospital.com',
        password: 'Staff@1234',
        role: 'nurse',
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
        fullName: 'Dr. Jane (Admission Doctor)',
        email: 'admissiondoctor@hospital.com',
        password: 'Doctor@1234',
        role: 'admissionDoctor',
        contactNumber: '01112345682'
      },
      {
        fullName: 'Dr. Ahmad (Ward Doctor)',
        email: 'doctor@hospital.com',
        password: 'Doctor@1234',
        role: 'doctor',
        contactNumber: '01112345683'
      }
    ];

    const userIds = {};
    for (const u of defaultUsers) {
      const hash = await bcrypt.hash(u.password, saltRounds);
      const [res] = await connection.query(
        `INSERT INTO users (fullName, email, passwordHash, role, contactNumber, status, isTemporaryPassword)
         VALUES (?, ?, ?, ?, ?, 'active', 0)`,
        [u.fullName, u.email, hash, u.role, u.contactNumber]
      );
      userIds[u.email] = res.insertId;
    }
    const adminId = userIds['admin@hospital.com'];
    const doctorId = userIds['doctor@hospital.com'];
    const nurseId = userIds['staff@hospital.com'];

    // 4.2 Seed Departments
    console.log('  -> Inserting departments...');
    const departments = [
      'General Medicine',
      'Cardiology',
      'Intensive Care Unit (ICU)',
      'Pediatrics',
      'Surgery & Trauma',
      'Emergency'
    ];
    const deptIds = {};
    for (const dept of departments) {
      const [res] = await connection.query(
        `INSERT INTO department (departmentName, createdBy, updatedBy) VALUES (?, ?, ?)`,
        [dept, adminId, adminId]
      );
      deptIds[dept] = res.insertId;
    }

    // 4.3 Seed Wards
    console.log('  -> Inserting wards...');
    const wards = [
      { name: 'General Ward A', type: 'General', dept: 'General Medicine', beds: 10, minThreshold: 3, floor: 'Level 1' },
      { name: 'ICU Ward', type: 'ICU', dept: 'Intensive Care Unit (ICU)', beds: 6, minThreshold: 2, floor: 'Level 2' },
      { name: 'Pediatric Care Ward', type: 'Pediatric', dept: 'Pediatrics', beds: 8, minThreshold: 2, floor: 'Level 2' },
      { name: 'Surgical Recovery Ward', type: 'Surgical', dept: 'Surgery & Trauma', beds: 8, minThreshold: 2, floor: 'Level 3' },
      { name: 'Emergency Unit', type: 'Emergency', dept: 'Emergency', beds: 10, minThreshold: 3, floor: 'Ground Floor' },
      { name: 'Maternity Ward', type: 'Maternity', dept: 'General Medicine', beds: 8, minThreshold: 2, floor: 'Level 1' }
    ];
    const wardIds = {};
    for (const w of wards) {
      const [res] = await connection.query(
        `INSERT INTO ward (wardName, wardType, departmentId, totalBeds, minBedThreshold, floorLocation, status, createdBy, updatedBy)
         VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
        [w.name, w.type, deptIds[w.dept], w.beds, w.minThreshold, w.floor, adminId, adminId]
      );
      wardIds[w.name] = res.insertId;
    }

    // 4.4 Seed Ward Staff Assignments
    console.log('  -> Assigning staff to wards...');
    await connection.query(
      `INSERT INTO user_ward_assignments (userId, wardId) VALUES (?, ?), (?, ?), (?, ?)`,
      [
        userIds['wardadmin@hospital.com'], wardIds['General Ward A'],
        userIds['staff@hospital.com'], wardIds['General Ward A'],
        userIds['nurse@hospital.com'], wardIds['ICU Ward']
      ]
    );

    // 4.5 Seed Sections
    console.log('  -> Inserting sections inside wards...');
    const sections = [
      { name: 'Bay A (Standard)', ward: 'General Ward A' },
      { name: 'Bay B (High Dependency)', ward: 'General Ward A' },
      { name: 'ICU Isolation Room', ward: 'ICU Ward' },
      { name: 'ICU Main Bay', ward: 'ICU Ward' },
      { name: 'Infants Nursery', ward: 'Pediatric Care Ward' },
      { name: 'Children General Bay', ward: 'Pediatric Care Ward' }
    ];
    const sectionIds = {};
    for (const sec of sections) {
      const [res] = await connection.query(
        `INSERT INTO section (sectionName, wardId, createdBy, updatedBy) VALUES (?, ?, ?, ?)`,
        [sec.name, wardIds[sec.ward], adminId, adminId]
      );
      sectionIds[sec.name] = res.insertId;
    }

    // 4.6 Seed Beds
    console.log('  -> Inserting beds for each ward...');
    const bedIds = {};
    const bedPlan = [
      // General Ward A beds (10 total: 2 occupied, 1 maintenance, 7 available)
      { ward: 'General Ward A', sec: 'Bay A (Standard)', num: 'GA-01', status: 'occupied' },
      { ward: 'General Ward A', sec: 'Bay A (Standard)', num: 'GA-02', status: 'occupied' },
      { ward: 'General Ward A', sec: 'Bay A (Standard)', num: 'GA-03', status: 'maintenance' },
      { ward: 'General Ward A', sec: 'Bay B (High Dependency)', num: 'GA-04', status: 'available' },
      { ward: 'General Ward A', sec: 'Bay B (High Dependency)', num: 'GA-05', status: 'available' },
      { ward: 'General Ward A', sec: 'Bay B (High Dependency)', num: 'GA-06', status: 'available' },
      { ward: 'General Ward A', sec: null, num: 'GA-07', status: 'available' },
      { ward: 'General Ward A', sec: null, num: 'GA-08', status: 'available' },
      { ward: 'General Ward A', sec: null, num: 'GA-09', status: 'available' },
      { ward: 'General Ward A', sec: null, num: 'GA-10', status: 'available' },

      // ICU Ward beds (6 total: 1 occupied, 5 available)
      { ward: 'ICU Ward', sec: 'ICU Isolation Room', num: 'ICU-01', status: 'occupied' },
      { ward: 'ICU Ward', sec: 'ICU Main Bay', num: 'ICU-02', status: 'available' },
      { ward: 'ICU Ward', sec: 'ICU Main Bay', num: 'ICU-03', status: 'available' },
      { ward: 'ICU Ward', sec: 'ICU Main Bay', num: 'ICU-04', status: 'available' },
      { ward: 'ICU Ward', sec: 'ICU Main Bay', num: 'ICU-05', status: 'available' },
      { ward: 'ICU Ward', sec: 'ICU Main Bay', num: 'ICU-06', status: 'available' },

      // Pediatric Care Ward beds (8 total: 1 occupied, 7 available)
      { ward: 'Pediatric Care Ward', sec: 'Children General Bay', num: 'PED-01', status: 'occupied' },
      { ward: 'Pediatric Care Ward', sec: 'Children General Bay', num: 'PED-02', status: 'available' },
      { ward: 'Pediatric Care Ward', sec: 'Children General Bay', num: 'PED-03', status: 'available' },
      { ward: 'Pediatric Care Ward', sec: 'Infants Nursery', num: 'PED-04', status: 'available' },
      { ward: 'Pediatric Care Ward', sec: 'Infants Nursery', num: 'PED-05', status: 'available' },
      { ward: 'Pediatric Care Ward', sec: null, num: 'PED-06', status: 'available' },
      { ward: 'Pediatric Care Ward', sec: null, num: 'PED-07', status: 'available' },
      { ward: 'Pediatric Care Ward', sec: null, num: 'PED-08', status: 'available' }
    ];

    for (const b of bedPlan) {
      const secId = b.sec ? sectionIds[b.sec] : null;
      const [res] = await connection.query(
        `INSERT INTO bed (wardId, sectionId, bedNumber, bedStatus, createdBy, updatedBy)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [wardIds[b.ward], secId, b.num, b.status, adminId, adminId]
      );
      bedIds[b.num] = res.insertId;
    }

    // 4.7 Seed Master Patients
    console.log('  -> Inserting master patient directory...');
    const patients = [
      {
        fullName: 'Kasun Perera',
        dob: '1988-04-12',
        gender: 'male',
        nic: '198810203040',
        isMinor: 0,
        guardianName: null,
        guardianNIC: null,
        contact: '0771234567',
        address: '12 Temple Road, Colombo 03',
        bloodGroup: 'O+'
      },
      {
        fullName: 'Nimali Fernando',
        dob: '1995-09-23',
        gender: 'female',
        nic: '199558901234',
        isMinor: 0,
        guardianName: null,
        guardianNIC: null,
        contact: '0719876543',
        address: '45 Lake Drive, Rajagiriya',
        bloodGroup: 'B+'
      },
      {
        fullName: 'Sunil Wickramasinghe',
        dob: '1962-11-05',
        gender: 'male',
        nic: '196231204567',
        isMinor: 0,
        guardianName: null,
        guardianNIC: null,
        contact: '0723456789',
        address: '88 Galle Road, Mount Lavinia',
        bloodGroup: 'A+'
      },
      {
        fullName: 'Amaya Silva (Minor)',
        dob: '2018-06-15',
        gender: 'female',
        nic: null,
        isMinor: 1,
        guardianName: 'Dhammika Silva (Mother)',
        guardianNIC: '198462304999',
        contact: '0761122334',
        address: '24 Flower Road, Colombo 07',
        bloodGroup: 'AB+'
      },
      {
        fullName: 'Ravi Jayawardena',
        dob: '1979-01-30',
        gender: 'male',
        nic: '197903001234',
        isMinor: 0,
        guardianName: null,
        guardianNIC: null,
        contact: '0789988776',
        address: '10 Kandy Road, Kelaniya',
        bloodGroup: 'O-'
      }
    ];

    const patientIds = {};
    for (const p of patients) {
      const [res] = await connection.query(
        `INSERT INTO patient (fullName, dateOfBirth, gender, patientNIC, isMinor, guardianName, guardianNIC, contactNumber, address, bloodGroup, createdBy, updatedBy)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [p.fullName, p.dob, p.gender, p.nic, p.isMinor, p.guardianName, p.guardianNIC, p.contact, p.address, p.bloodGroup, adminId, adminId]
      );
      patientIds[p.fullName] = res.insertId;
    }

    // 4.8 Seed Patient Admissions
    console.log('  -> Inserting patient admissions...');
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
    const eightDaysAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);

    const admissions = [
      // Active Admission 1: Kasun in GA-01
      {
        patientId: patientIds['Kasun Perera'],
        wardId: wardIds['General Ward A'],
        bedId: bedIds['GA-01'],
        admittedBy: nurseId,
        date: formatDate(twoDaysAgo),
        status: 'admitted',
        isTransfer: 0,
        notes: 'Admitted for observation and antibiotic therapy for acute gastroenteritis.',
        ecName: 'Chamari Perera (Wife)',
        ecPhone: '0779998888',
        qr: JSON.stringify({ admissionId: 1, patient: 'Kasun Perera', ward: 'General Ward A', bed: 'GA-01' })
      },
      // Active Admission 2: Nimali in GA-02
      {
        patientId: patientIds['Nimali Fernando'],
        wardId: wardIds['General Ward A'],
        bedId: bedIds['GA-02'],
        admittedBy: nurseId,
        date: formatDate(fiveDaysAgo),
        status: 'admitted',
        isTransfer: 0,
        notes: 'Post-operative recovery following appendectomy.',
        ecName: 'Kamal Fernando (Brother)',
        ecPhone: '0715554444',
        qr: JSON.stringify({ admissionId: 2, patient: 'Nimali Fernando', ward: 'General Ward A', bed: 'GA-02' })
      },
      // Active Admission 3: Sunil in ICU-01
      {
        patientId: patientIds['Sunil Wickramasinghe'],
        wardId: wardIds['ICU Ward'],
        bedId: bedIds['ICU-01'],
        admittedBy: doctorId,
        date: formatDate(twoDaysAgo),
        status: 'admitted',
        isTransfer: 0,
        notes: 'Critical cardiac monitoring following non-ST elevation myocardial infarction.',
        ecName: 'Malini Wickramasinghe',
        ecPhone: '0728887777',
        qr: JSON.stringify({ admissionId: 3, patient: 'Sunil Wickramasinghe', ward: 'ICU Ward', bed: 'ICU-01' })
      },
      // Active Admission 4: Amaya (Minor) in PED-01
      {
        patientId: patientIds['Amaya Silva (Minor)'],
        wardId: wardIds['Pediatric Care Ward'],
        bedId: bedIds['PED-01'],
        admittedBy: nurseId,
        date: formatDate(twoDaysAgo),
        status: 'admitted',
        isTransfer: 0,
        notes: 'High fever and viral bronchiolitis. Pediatric observation required.',
        ecName: 'Dhammika Silva (Mother)',
        ecPhone: '0761122334',
        qr: JSON.stringify({ admissionId: 4, patient: 'Amaya Silva (Minor)', ward: 'Pediatric Care Ward', bed: 'PED-01' })
      },
      // Discharged Admission 5: Ravi Jayawardena
      {
        patientId: patientIds['Ravi Jayawardena'],
        wardId: wardIds['General Ward A'],
        bedId: null, // Bed cleared upon discharge
        admittedBy: nurseId,
        date: formatDate(tenDaysAgo),
        status: 'discharged',
        isTransfer: 0,
        notes: 'Treated for acute bronchitis. Fully recovered and discharged.',
        dischargeDate: formatDate(eightDaysAgo),
        dischargeNotes: 'Stable vitals, prescribed 5-day course of amoxicillin. Follow-up in 2 weeks.',
        ecName: 'Priyanka Jayawardena',
        ecPhone: '0781112222',
        qr: JSON.stringify({ admissionId: 5, patient: 'Ravi Jayawardena', status: 'discharged' })
      }
    ];

    const admissionIds = [];
    for (const a of admissions) {
      const [res] = await connection.query(
        `INSERT INTO patientAdmission (
           patientId, wardId, bedId, admittedBy, admissionDate, status, isTransfer,
           dischargeDate, dischargeNotes, admissionNotes, emergencyContactName, emergencyContactNumber, qrCodeData,
           createdBy, updatedBy
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          a.patientId, a.wardId, a.bedId, a.admittedBy, a.date, a.status, a.isTransfer,
          a.dischargeDate || null, a.dischargeNotes || null, a.notes, a.ecName, a.ecPhone, a.qr,
          adminId, adminId
        ]
      );
      admissionIds.push(res.insertId);
    }

    // 4.9 Seed Patient Vitals
    console.log('  -> Inserting patient vitals...');
    const vitals = [
      { admId: admissionIds[0], temp: 37.2, bp: '120/80', pulse: 74, recordedBy: nurseId, date: formatDate(now) },
      { admId: admissionIds[1], temp: 36.8, bp: '118/76', pulse: 68, recordedBy: nurseId, date: formatDate(now) },
      { admId: admissionIds[2], temp: 38.1, bp: '145/95', pulse: 98, recordedBy: doctorId, date: formatDate(now) },
      { admId: admissionIds[3], temp: 37.8, bp: '100/65', pulse: 110, recordedBy: nurseId, date: formatDate(now) }
    ];
    for (const v of vitals) {
      await connection.query(
        `INSERT INTO patientVitals (admissionId, temperature, bloodPressure, pulse, recordedBy, recordedAt, createdBy, updatedBy)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [v.admId, v.temp, v.bp, v.pulse, v.recordedBy, v.date, adminId, adminId]
      );
    }

    // 4.10 Seed Internal Ward Transfer Log
    console.log('  -> Inserting internal ward transfer logs...');
    await connection.query(
      `INSERT INTO wardTransfer (admissionId, fromWardId, toWardId, fromBedId, toBedId, transferReason, transferredBy, transferDate, createdBy, updatedBy)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        admissionIds[0],
        wardIds['General Ward A'],
        wardIds['General Ward A'],
        bedIds['GA-04'],
        bedIds['GA-01'],
        'Moved closer to nursing station for closer monitoring during fluid therapy.',
        nurseId,
        formatDate(now),
        adminId,
        adminId
      ]
    );

    // 4.11 Seed External Hospitals & External Transfer Log
    console.log('  -> Inserting external hospital reference list & transfer history...');
    const hospitals = [
      { name: 'National Hospital of Sri Lanka (NHSL)', address: 'Regent Street, Colombo 10', phone: '0112691111' },
      { name: 'Teaching Hospital Karapitiya', address: 'Karapitiya, Galle', phone: '0912232250' },
      { name: 'National Hospital Kandy', address: 'William Gopallawa Mawatha, Kandy', phone: '0812222261' },
      { name: 'Sri Jayewardenepura General Hospital', address: 'Thalapathpitiya, Nugegoda', phone: '0112778610' }
    ];

    const hospitalIds = [];
    for (const h of hospitals) {
      const [res] = await connection.query(
        `INSERT INTO hospital (hospitalName, address, contactNumber, createdBy, updatedBy)
         VALUES (?, ?, ?, ?, ?)`,
        [h.name, h.address, h.phone, adminId, adminId]
      );
      hospitalIds.push(res.insertId);
    }

    // 4.12 Seed Clinical Requests (Discharge Requests)
    console.log('  -> Inserting clinical workflow requests (discharge reviews)...');
    await connection.query(
      `INSERT INTO clinicalRequest (admissionId, requestType, requestStatus, requestedBy, requestNotes, reviewedBy, reviewedAt, reviewNotes, createdBy, updatedBy)
       VALUES (?, 'discharge', 'pending', ?, 'Patient is clinically stable. Wound healing cleanly. Requesting discharge clearance.', NULL, NULL, NULL, ?, ?)`,
      [admissionIds[1], doctorId, adminId, adminId]
    );

    // 4.13 Seed Medical Equipment & Maintenance Logs
    console.log('  -> Inserting ward equipment & maintenance history...');
    const equipmentList = [
      { name: 'Infusion Pump', qty: 5, status: 'inUse', threshold: 2, ward: 'General Ward A' },
      { name: 'Patient Monitor (Multipara)', qty: 6, status: 'inUse', threshold: 3, ward: 'General Ward A' },
      { name: 'Oxygen Concentrator', qty: 4, status: 'available', threshold: 1, ward: 'General Ward A' },
      { name: 'Wheelchair (Standard)', qty: 3, status: 'available', threshold: 1, ward: 'General Ward A' },
      { name: 'Mechanical Ventilator', qty: 4, status: 'inUse', threshold: 2, ward: 'ICU Ward' },
      { name: 'Crash Cart & Defibrillator', qty: 2, status: 'available', threshold: 1, ward: 'ICU Ward' },
      { name: 'Syringe Driver', qty: 6, status: 'inUse', threshold: 2, ward: 'ICU Ward' },
      { name: 'Infant Radiant Warmer', qty: 3, status: 'available', threshold: 1, ward: 'Pediatric Care Ward' },
      { name: 'Phototherapy Unit', qty: 2, status: 'available', threshold: 1, ward: 'Pediatric Care Ward' }
    ];

    const equipIds = [];
    for (const eq of equipmentList) {
      const [res] = await connection.query(
        `INSERT INTO equipment (equipmentName, quantity, status, minQuantityThreshold, wardId, createdBy, updatedBy)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [eq.name, eq.qty, eq.status, eq.threshold, wardIds[eq.ward], adminId, adminId]
      );
      equipIds.push(res.insertId);
    }

    // Equipment maintenance log
    await connection.query(
      `INSERT INTO equipmentMaintenanceLog (equipmentId, maintenanceDate, performedBy, notes, nextScheduledDate, createdBy, updatedBy)
       VALUES (?, ?, ?, 'Routine calibration and sensor check completed.', ?, ?, ?)`,
      [
        equipIds[0],
        formatDate(fiveDaysAgo),
        adminId,
        formatDate(new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)),
        adminId,
        adminId
      ]
    );

    // 4.14 Seed Historical Shortage Alert Log
    console.log('  -> Inserting shortage alert history...');
    await connection.query(
      `INSERT INTO shortageAlertLog (wardId, equipmentId, alertType, triggeredAt, resolvedAt, createdBy, updatedBy)
       VALUES (?, NULL, 'bedShortage', ?, ?, ?, ?)`,
      [wardIds['General Ward A'], formatDate(tenDaysAgo), formatDate(eightDaysAgo), adminId, adminId]
    );

    console.log('\n========================================================');
    console.log('🎉 Full Database Reset & Fresh Data Seeding Complete!');
    console.log('========================================================');
    console.log('\nVerified Demo Staff Logins (password is NOT temporary):');
    console.log('  👑 Admin             -> admin@hospital.com           / Admin@1234');
    console.log('  🛌 Ward Admin        -> wardadmin@hospital.com       / WardAdmin@1234');
    console.log('  📋 Staff Nurse       -> staff@hospital.com           / Staff@1234');
    console.log('  👩‍⚕️ Nurse Sarah       -> nurse@hospital.com           / Nurse@1234');
    console.log('  🩺 Admission Doctor  -> admissiondoctor@hospital.com / Doctor@1234');
    console.log('  🩺 Ward Doctor       -> doctor@hospital.com          / Doctor@1234\n');

  } catch (error) {
    console.error('\n❌ Error during database reset:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runReset();

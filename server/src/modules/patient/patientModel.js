// =============================================================================
// patientModel.js — Database Queries for Patients
// =============================================================================
// This model manages all database operations for the `patient` master table.
// It uses raw mysql2 parameterized queries.
// It provides methods to find patients, search by NIC, view their complete
// hospital stay history, and create/update patient profile records.
// =============================================================================

const db = require('../../config/db');

// This function retrieves all patients with an optional search term.
// The search term checks both fullName and patientNIC.
// It also computes total hospital admissions count for each patient.
const findAllPatients = async (searchTerm) => {
  let sql = `
    SELECT 
      p.id,
      p.fullName,
      p.dateOfBirth,
      p.gender,
      p.patientNIC,
      p.isMinor,
      p.guardianName,
      p.guardianNIC,
      p.contactNumber,
      p.address,
      p.bloodGroup,
      p.createdAt,
      p.updatedAt,
      COUNT(pa.id) AS totalAdmissions,
      MAX(pa.admissionDate) AS lastAdmissionDate
    FROM patient p
    LEFT JOIN patientAdmission pa ON p.id = pa.patientId
  `;
  const queryParams = [];

  // If a search term was provided, filter by patient name, NIC, or guardian NIC
  if (searchTerm && searchTerm.trim()) {
    sql += `
      WHERE p.fullName LIKE ? 
         OR p.patientNIC LIKE ? 
         OR p.guardianNIC LIKE ?
    `;
    const wildcard = `%${searchTerm.trim()}%`;
    queryParams.push(wildcard, wildcard, wildcard);
  }

  // Group by patient ID since we are calculating aggregate counts
  sql += ' GROUP BY p.id ORDER BY p.createdAt DESC';

  const [rows] = await db.query(sql, queryParams);
  return rows;
};

// This function finds a single patient by their primary key ID
const findPatientById = async (id) => {
  const sql = `
    SELECT 
      p.id,
      p.fullName,
      p.dateOfBirth,
      p.gender,
      p.patientNIC,
      p.isMinor,
      p.guardianName,
      p.guardianNIC,
      p.contactNumber,
      p.address,
      p.bloodGroup,
      p.createdAt,
      p.updatedAt,
      COUNT(pa.id) AS totalAdmissions
    FROM patient p
    LEFT JOIN patientAdmission pa ON p.id = pa.patientId
    WHERE p.id = ?
    GROUP BY p.id
    LIMIT 1
  `;

  const [rows] = await db.query(sql, [id]);
  if (rows.length > 0) {
    return rows[0];
  }
  return null;
};

// This function finds a patient by their unique National Identity Card (NIC) number.
// Used during admission to auto-fill patient details if they previously registered.
const findPatientByNIC = async (patientNIC) => {
  const sql = `
    SELECT 
      p.id,
      p.fullName,
      p.dateOfBirth,
      p.gender,
      p.patientNIC,
      p.isMinor,
      p.guardianName,
      p.guardianNIC,
      p.contactNumber,
      p.address,
      p.bloodGroup,
      p.createdAt,
      p.updatedAt
    FROM patient p
    WHERE p.patientNIC = ?
    LIMIT 1
  `;

  const [rows] = await db.query(sql, [patientNIC]);
  if (rows.length > 0) {
    return rows[0];
  }
  return null;
};

// This function checks if a patient is currently already admitted in any ward.
// A patient cannot have two active 'admitted' stays at the same time.
const findActiveAdmissionByPatientId = async (patientId) => {
  const sql = `
    SELECT pa.id, pa.wardId, pa.bedId, w.wardName, b.bedNumber
    FROM patientAdmission pa
    JOIN ward w ON pa.wardId = w.id
    LEFT JOIN bed b ON pa.bedId = b.id
    WHERE pa.patientId = ? AND pa.status = 'admitted'
    LIMIT 1
  `;

  const [rows] = await db.query(sql, [patientId]);
  if (rows.length > 0) {
    return rows[0];
  }
  return null;
};

// This function retrieves all past and current admissions for a given patient.
// This forms the patient's comprehensive medical admission history.
const findAdmissionHistoryByPatientId = async (patientId) => {
  const sql = `
    SELECT 
      pa.id AS admissionId,
      pa.wardId,
      pa.bedId,
      pa.admissionDate,
      pa.status,
      pa.dischargeDate,
      pa.dischargeNotes,
      pa.admissionNotes,
      pa.emergencyContactName,
      pa.emergencyContactNumber,
      pa.qrCodeData,
      w.wardName,
      w.wardType,
      b.bedNumber,
      u.fullName AS admittedByName
    FROM patientAdmission pa
    JOIN ward w ON pa.wardId = w.id
    LEFT JOIN bed b ON pa.bedId = b.id
    LEFT JOIN users u ON pa.admittedBy = u.id
    WHERE pa.patientId = ?
    ORDER BY pa.admissionDate DESC
  `;

  const [rows] = await db.query(sql, [patientId]);
  return rows;
};

// This function inserts a new patient record into the database
const createPatient = async (patientData, userId) => {
  const {
    fullName,
    dateOfBirth,
    gender,
    patientNIC,
    isMinor,
    guardianName,
    guardianNIC,
    contactNumber,
    address,
    bloodGroup
  } = patientData;

  const sql = `
    INSERT INTO patient (
      fullName,
      dateOfBirth,
      gender,
      patientNIC,
      isMinor,
      guardianName,
      guardianNIC,
      contactNumber,
      address,
      bloodGroup,
      createdBy,
      updatedBy
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    fullName,
    dateOfBirth,
    gender,
    patientNIC || null,
    isMinor ? 1 : 0,
    guardianName || null,
    guardianNIC || null,
    contactNumber || null,
    address || null,
    bloodGroup || 'Unknown',
    userId,
    userId
  ];

  const [result] = await db.query(sql, values);
  return result.insertId;
};

// This function updates an existing patient's details
const updatePatient = async (id, patientData, userId) => {
  const {
    fullName,
    dateOfBirth,
    gender,
    patientNIC,
    isMinor,
    guardianName,
    guardianNIC,
    contactNumber,
    address,
    bloodGroup
  } = patientData;

  const sql = `
    UPDATE patient
    SET 
      fullName = ?,
      dateOfBirth = ?,
      gender = ?,
      patientNIC = ?,
      isMinor = ?,
      guardianName = ?,
      guardianNIC = ?,
      contactNumber = ?,
      address = ?,
      bloodGroup = ?,
      updatedBy = ?
    WHERE id = ?
  `;

  const values = [
    fullName,
    dateOfBirth,
    gender,
    patientNIC || null,
    isMinor ? 1 : 0,
    guardianName || null,
    guardianNIC || null,
    contactNumber || null,
    address || null,
    bloodGroup || 'Unknown',
    userId,
    id
  ];

  const [result] = await db.query(sql, values);
  return result.affectedRows;
};

module.exports = {
  findAllPatients,
  findPatientById,
  findPatientByNIC,
  findActiveAdmissionByPatientId,
  findAdmissionHistoryByPatientId,
  createPatient,
  updatePatient
};

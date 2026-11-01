// =============================================================================
// admissionModel.js — Database Queries for Patient Admissions
// =============================================================================
// This model manages all database operations for patient admissions.
// It joins the `patient` master table so that patient demographic and identity
// fields (fullName, NIC, DOB, blood group, guardian details) are always populated.
// =============================================================================

const db = require('../../config/db');

// Retrieve all admissions matching a specific status (e.g. 'admitted')
const findAllAdmissionsByStatus = async (status) => {
  const sql = `
    SELECT 
      a.*,
      p.fullName AS patientName,
      p.patientNIC,
      p.dateOfBirth,
      p.gender,
      p.isMinor,
      p.guardianName,
      p.guardianNIC,
      p.contactNumber,
      p.bloodGroup,
      w.wardName,
      b.bedNumber 
    FROM patientAdmission a
    JOIN patient p ON a.patientId = p.id
    JOIN ward w ON a.wardId = w.id
    LEFT JOIN bed b ON a.bedId = b.id
    WHERE a.status = ?
    ORDER BY a.admissionDate DESC
  `;
  const [rows] = await db.query(sql, [status]);
  return rows;
};

// Retrieve a single admission record by ID with full patient, ward, bed, and staff info
const findAdmissionById = async (id) => {
  const sql = `
    SELECT 
      a.*,
      p.fullName AS patientName,
      p.patientNIC,
      p.dateOfBirth,
      p.gender,
      p.isMinor,
      p.guardianName,
      p.guardianNIC,
      p.contactNumber,
      p.address,
      p.bloodGroup,
      w.wardName,
      b.bedNumber,
      u.fullName AS admittedByName
    FROM patientAdmission a
    JOIN patient p ON a.patientId = p.id
    JOIN ward w ON a.wardId = w.id
    LEFT JOIN bed b ON a.bedId = b.id
    LEFT JOIN users u ON a.admittedBy = u.id
    WHERE a.id = ? 
    LIMIT 1
  `;
  const [rows] = await db.query(sql, [id]);
  return rows.length > 0 ? rows[0] : null;
};

// Create a new admission row and lock/update the bed status to 'occupied'
const transactionCreateAdmission = async (admissionData, userId) => {
  const { 
    patientId,
    wardId,
    bedId,
    admissionDate,
    status,
    admissionNotes,
    emergencyContactName,
    emergencyContactNumber
  } = admissionData;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // If a bed is selected, lock the bed row and verify it is available
    if (bedId) {
      const [bedRows] = await connection.query('SELECT bedStatus FROM bed WHERE id = ? FOR UPDATE', [bedId]);
      if (bedRows.length === 0) {
        throw new Error('Bed not found');
      }
      if (bedRows[0].bedStatus !== 'available') {
        throw new Error('The selected bed is not available');
      }
    }

    const insertSql = `
      INSERT INTO patientAdmission (
        patientId,
        wardId,
        bedId,
        admittedBy,
        admissionDate,
        status,
        isTransfer,
        admissionNotes,
        emergencyContactName,
        emergencyContactNumber,
        qrCodeData,
        createdBy,
        updatedBy
      ) VALUES (?, ?, ?, ?, ?, ?, FALSE, ?, ?, ?, 'pending', ?, ?)
    `;
    
    const insertValues = [
      patientId,
      wardId,
      bedId || null,
      userId,
      admissionDate,
      status,
      admissionNotes || null,
      emergencyContactName || null,
      emergencyContactNumber || null,
      userId,
      userId
    ];

    const [result] = await connection.query(insertSql, insertValues);
    const admissionId = result.insertId;

    // Mark the bed as occupied
    if (bedId) {
      await connection.query(
        'UPDATE bed SET bedStatus = ?, updatedBy = ? WHERE id = ?', 
        ['occupied', userId, bedId]
      );
    }

    await connection.commit();
    return admissionId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Update the admission record with the generated QR code Data URL
const updateAdmissionQR = async (admissionId, qrCodeDataUrl) => {
  const sql = 'UPDATE patientAdmission SET qrCodeData = ? WHERE id = ?';
  await db.query(sql, [qrCodeDataUrl, admissionId]);
};

// Discharge a patient: update status to 'discharged' and free up the bed
const transactionDischargePatient = async (id, dischargeNotes, userId) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [admissionRows] = await connection.query(
      'SELECT bedId, status FROM patientAdmission WHERE id = ? FOR UPDATE',
      [id]
    );
    if (admissionRows.length === 0) {
      throw new Error('Admission record not found');
    }

    const admission = admissionRows[0];
    if (admission.status === 'discharged') {
      throw new Error('Patient is already discharged');
    }

    const dischargeDate = new Date();
    const updateSql = `
      UPDATE patientAdmission 
      SET status = ?, dischargeDate = ?, dischargeNotes = ?, updatedBy = ? 
      WHERE id = ?
    `;
    await connection.query(updateSql, [
      'discharged', dischargeDate, dischargeNotes || null, userId, id
    ]);

    // Free up the bed if one was assigned
    if (admission.bedId) {
      await connection.query(
        'UPDATE bed SET bedStatus = ?, updatedBy = ? WHERE id = ?',
        ['available', userId, admission.bedId]
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Search admissions history with optional status and patient name/NIC filter
const searchAdmissions = async (status, search) => {
  let sql = `
    SELECT 
      a.*,
      p.fullName AS patientName,
      p.patientNIC,
      p.dateOfBirth,
      p.gender,
      p.bloodGroup,
      w.wardName,
      b.bedNumber 
    FROM patientAdmission a
    JOIN patient p ON a.patientId = p.id
    JOIN ward w ON a.wardId = w.id
    LEFT JOIN bed b ON a.bedId = b.id
    WHERE 1=1
  `;
  const values = [];

  if (status) {
    sql += ' AND a.status = ?';
    values.push(status);
  }

  if (search && search.trim()) {
    sql += ' AND (p.fullName LIKE ? OR p.patientNIC LIKE ?)';
    const wildcard = `%${search.trim()}%`;
    values.push(wildcard, wildcard);
  }

  sql += ' ORDER BY a.admissionDate DESC';
  const [rows] = await db.query(sql, values);
  return rows;
};

// Retrieve a single admission record joined with basic patient details
const findSimpleAdmissionById = async (id) => {
  const sql = `
    SELECT 
      a.*,
      p.fullName AS patientName,
      p.patientNIC,
      p.gender,
      p.dateOfBirth,
      p.bloodGroup
    FROM patientAdmission a
    JOIN patient p ON a.patientId = p.id
    WHERE a.id = ?
    LIMIT 1
  `;
  const [rows] = await db.query(sql, [id]);
  return rows.length > 0 ? rows[0] : null;
};

module.exports = {
  findAllAdmissionsByStatus,
  findAdmissionById,
  transactionCreateAdmission,
  updateAdmissionQR,
  transactionDischargePatient,
  searchAdmissions,
  findSimpleAdmissionById
};

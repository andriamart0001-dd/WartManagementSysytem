// =============================================================================
// admissionModel.js — Database Queries for Patient Admissions
// =============================================================================

const db = require('../../config/db');

const findAllAdmissionsByStatus = async (status) => {
  const sql = `
    SELECT a.*, w.wardName, b.bedNumber 
    FROM patientAdmission a
    JOIN ward w ON a.wardId = w.id
    LEFT JOIN bed b ON a.bedId = b.id
    WHERE a.status = ?
    ORDER BY a.admissionDate DESC
  `;
  const [rows] = await db.query(sql, [status]);
  return rows;
};

const findAdmissionById = async (id) => {
  const sql = `
    SELECT a.*, w.wardName, b.bedNumber, u.fullName as admittedByName
    FROM patientAdmission a
    JOIN ward w ON a.wardId = w.id
    LEFT JOIN bed b ON a.bedId = b.id
    JOIN users u ON a.admittedBy = u.id
    WHERE a.id = ? LIMIT 1
  `;
  const [rows] = await db.query(sql, [id]);
  return rows.length > 0 ? rows[0] : null;
};

const transactionCreateAdmission = async (admissionData, userId) => {
  const { 
    patientName, age, gender, contactNumber, address, 
    emergencyContactName, emergencyContactNumber, wardId, bedId, admissionDate, status
  } = admissionData;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

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
        patientName, age, gender, contactNumber, address, 
        emergencyContactName, emergencyContactNumber, wardId, bedId, 
        admittedBy, admissionDate, status, isTransfer, qrCodeData, createdBy, updatedBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE, 'pending', ?, ?)
    `;
    
    const insertValues = [
      patientName, age, gender, contactNumber || null, address || null,
      emergencyContactName || null, emergencyContactNumber || null, wardId, bedId || null,
      userId, admissionDate, status, userId, userId
    ];

    const [result] = await connection.query(insertSql, insertValues);
    const admissionId = result.insertId;

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

const updateAdmissionQR = async (admissionId, qrCodeDataUrl) => {
  await db.query('UPDATE patientAdmission SET qrCodeData = ? WHERE id = ?', [qrCodeDataUrl, admissionId]);
};

const transactionDischargePatient = async (id, dischargeNotes, userId) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [admissionRows] = await connection.query('SELECT bedId, status FROM patientAdmission WHERE id = ? FOR UPDATE', [id]);
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

const searchAdmissions = async (status, search) => {
  let sql = `
    SELECT a.*, w.wardName, b.bedNumber 
    FROM patientAdmission a
    JOIN ward w ON a.wardId = w.id
    LEFT JOIN bed b ON a.bedId = b.id
    WHERE 1=1
  `;
  const values = [];

  if (status) {
    sql += ' AND a.status = ?';
    values.push(status);
  }

  if (search) {
    sql += ' AND a.patientName LIKE ?';
    values.push(`%${search}%`);
  }

  sql += ' ORDER BY a.admissionDate DESC';
  const [rows] = await db.query(sql, values);
  return rows;
};

// Also used for finding admission simply (no join)
const findSimpleAdmissionById = async (id) => {
  const [rows] = await db.query('SELECT * FROM patientAdmission WHERE id = ?', [id]);
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

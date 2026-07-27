// =============================================================================
// admissionController.js — Patient Admission Management
// =============================================================================
// Endpoints provided:
//   GET    /api/admissions              — getAdmissions    : List all active admissions
//   GET    /api/admissions/:id          — getAdmissionById : Get details of a specific admission
//   POST   /api/admissions              — createAdmission  : Admit a new patient (generates QR)
//   POST   /api/admissions/:id/discharge— dischargePatient : Discharge a patient and free bed
// =============================================================================

const db = require('../../config/db');
const qrcode = require('qrcode');
const { ADMISSION_STATUS, BED_STATUS, GENDER } = require('../../constants');

// =============================================================================
// FUNCTION: getAdmissions
// =============================================================================
const getAdmissions = async (req, res) => {
  try {
    // Only get active admissions by default
    const sql = `
      SELECT a.*, w.wardName, b.bedNumber 
      FROM patientAdmission a
      JOIN ward w ON a.wardId = w.id
      LEFT JOIN bed b ON a.bedId = b.id
      WHERE a.status = ?
      ORDER BY a.admissionDate DESC
    `;
    const [admissions] = await db.query(sql, [ADMISSION_STATUS.ADMITTED]);

    return res.status(200).json({
      message: 'Active admissions retrieved successfully',
      count: admissions.length,
      admissions
    });
  } catch (error) {
    console.error('Get admissions error:', error);
    return res.status(500).json({ message: 'Error retrieving admissions' });
  }
};

// =============================================================================
// FUNCTION: getAdmissionById
// =============================================================================
const getAdmissionById = async (req, res) => {
  const { id } = req.params;

  try {
    const sql = `
      SELECT a.*, w.wardName, b.bedNumber, u.fullName as admittedByName
      FROM patientAdmission a
      JOIN ward w ON a.wardId = w.id
      LEFT JOIN bed b ON a.bedId = b.id
      JOIN users u ON a.admittedBy = u.id
      WHERE a.id = ? LIMIT 1
    `;
    const [admissions] = await db.query(sql, [id]);

    if (admissions.length === 0) {
      return res.status(404).json({ message: 'Admission record not found' });
    }

    return res.status(200).json({
      message: 'Admission record retrieved successfully',
      admission: admissions[0]
    });
  } catch (error) {
    console.error('Get admission by id error:', error);
    return res.status(500).json({ message: 'Error retrieving admission record' });
  }
};

// =============================================================================
// FUNCTION: createAdmission
// =============================================================================
const createAdmission = async (req, res) => {
  const { 
    patientName, age, gender, contactNumber, address, 
    emergencyContactName, emergencyContactNumber, wardId, bedId 
  } = req.body;
  const userId = req.user.id;

  // Basic validation
  if (!patientName || !age || !gender || !wardId) {
    return res.status(400).json({ message: 'patientName, age, gender, and wardId are required' });
  }

  if (!GENDER.includes(gender)) {
    return res.status(400).json({ message: `Invalid gender. Allowed: ${GENDER.join(', ')}` });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. If a bed is specified, verify it is available
    if (bedId) {
      const [bedRows] = await connection.query('SELECT bedStatus FROM bed WHERE id = ? FOR UPDATE', [bedId]);
      if (bedRows.length === 0) {
        await connection.rollback();
        return res.status(404).json({ message: 'Bed not found' });
      }
      if (bedRows[0].bedStatus !== BED_STATUS.AVAILABLE) {
        await connection.rollback();
        return res.status(400).json({ message: 'The selected bed is not available' });
      }
    }

    // 2. Generate initial QR code data (can be just JSON with patientName and timestamp for now)
    // Real ID will be added after insert, but we need a placeholder or just wait.
    // Actually, we'll insert first, then generate QR code, then update the record with QR data.
    const admissionDate = new Date();

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
      userId, admissionDate, ADMISSION_STATUS.ADMITTED, userId, userId
    ];

    const [result] = await connection.query(insertSql, insertValues);
    const admissionId = result.insertId;

    // 3. Generate QR Code containing the admission ID
    const qrPayload = JSON.stringify({
      admissionId: admissionId,
      patientName: patientName,
      admissionDate: admissionDate.toISOString()
    });
    
    // Generate base64 encoded image data URL
    const qrCodeDataUrl = await qrcode.toDataURL(qrPayload);

    // 4. Update the admission record with the generated QR code
    await connection.query('UPDATE patientAdmission SET qrCodeData = ? WHERE id = ?', [qrCodeDataUrl, admissionId]);

    // 5. Update bed status if a bed was assigned
    if (bedId) {
      await connection.query(
        'UPDATE bed SET bedStatus = ?, updatedBy = ? WHERE id = ?', 
        [BED_STATUS.OCCUPIED, userId, bedId]
      );
    }

    await connection.commit();

    const [newAdmissionRows] = await db.query('SELECT * FROM patientAdmission WHERE id = ?', [admissionId]);

    return res.status(201).json({
      message: 'Patient admitted successfully',
      admission: newAdmissionRows[0]
    });
  } catch (error) {
    await connection.rollback();
    console.error('Create admission error:', error);
    return res.status(500).json({ message: 'Error admitting patient' });
  } finally {
    connection.release();
  }
};

// =============================================================================
// FUNCTION: dischargePatient
// =============================================================================
const dischargePatient = async (req, res) => {
  const { id } = req.params;
  const { dischargeNotes } = req.body;
  const userId = req.user.id;

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Get the admission record
    const [admissionRows] = await connection.query('SELECT bedId, status FROM patientAdmission WHERE id = ? FOR UPDATE', [id]);
    
    if (admissionRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Admission record not found' });
    }

    const admission = admissionRows[0];

    if (admission.status === ADMISSION_STATUS.DISCHARGED) {
      await connection.rollback();
      return res.status(400).json({ message: 'Patient is already discharged' });
    }

    // 2. Update admission record to discharged
    const dischargeDate = new Date();
    const updateAdmissionSql = `
      UPDATE patientAdmission 
      SET status = ?, dischargeDate = ?, dischargeNotes = ?, updatedBy = ? 
      WHERE id = ?
    `;
    await connection.query(updateAdmissionSql, [
      ADMISSION_STATUS.DISCHARGED, dischargeDate, dischargeNotes || null, userId, id
    ]);

    // 3. Free up the bed if one was assigned
    if (admission.bedId) {
      await connection.query(
        'UPDATE bed SET bedStatus = ?, updatedBy = ? WHERE id = ?',
        [BED_STATUS.AVAILABLE, userId, admission.bedId]
      );
    }

    await connection.commit();

    const [updatedRows] = await db.query('SELECT * FROM patientAdmission WHERE id = ?', [id]);

    return res.status(200).json({
      message: 'Patient discharged successfully',
      admission: updatedRows[0]
    });
  } catch (error) {
    await connection.rollback();
    console.error('Discharge patient error:', error);
    return res.status(500).json({ message: 'Error discharging patient' });
  } finally {
    connection.release();
  }
};

// =============================================================================
// FUNCTION: getAllAdmissions (History)
// =============================================================================
const getAllAdmissions = async (req, res) => {
  const { status, search } = req.query;

  try {
    let sql = `
      SELECT a.*, w.wardName, b.bedNumber 
      FROM patientAdmission a
      JOIN ward w ON a.wardId = w.id
      LEFT JOIN bed b ON a.bedId = b.id
      WHERE 1=1
    `;
    const values = [];

    if (status) {
      // e.g. status=discharged or status=transferredOut
      sql += ' AND a.status = ?';
      values.push(status);
    }

    if (search) {
      // Partial match on patientName
      sql += ' AND a.patientName LIKE ?';
      values.push(`%${search}%`);
    }

    sql += ' ORDER BY a.admissionDate DESC';
    const [admissions] = await db.query(sql, values);

    return res.status(200).json({
      message: 'Admission history retrieved successfully',
      count: admissions.length,
      admissions
    });
  } catch (error) {
    console.error('Get all admissions error:', error);
    return res.status(500).json({ message: 'Error retrieving admission history' });
  }
};

module.exports = {
  getAdmissions,
  getAdmissionById,
  createAdmission,
  dischargePatient,
  getAllAdmissions
};

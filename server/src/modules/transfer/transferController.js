// =============================================================================
// transferController.js — Patient Transfer Operations
// =============================================================================
// Endpoints provided:
//   POST /api/transfers/internal         — internalTransfer       : Transfer within the hospital
//   POST /api/transfers/external         — externalTransfer       : Send patient to external hospital
//   POST /api/transfers/external/:id/return — returnExternalTransfer : Process returning patient
//   GET  /api/transfers/hospitals        — getHospitals           : Get reference list of external hospitals
// =============================================================================

const db = require('../../config/db');
const { ADMISSION_STATUS, BED_STATUS } = require('../../constants');

// =============================================================================
// FUNCTION: internalTransfer
// =============================================================================
const internalTransfer = async (req, res) => {
  const { admissionId, toWardId, toBedId, transferReason } = req.body;
  const userId = req.user.id;

  if (!admissionId || !toWardId || !toBedId) {
    return res.status(400).json({ message: 'admissionId, toWardId, and toBedId are required' });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Get current admission record
    const [admissionRows] = await connection.query(
      'SELECT wardId as fromWardId, bedId as fromBedId, status FROM patientAdmission WHERE id = ? FOR UPDATE', 
      [admissionId]
    );

    if (admissionRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Admission record not found' });
    }

    const admission = admissionRows[0];

    if (admission.status !== ADMISSION_STATUS.ADMITTED) {
      await connection.rollback();
      return res.status(400).json({ message: 'Can only transfer currently admitted patients' });
    }

    // 2. Verify target bed is available
    const [targetBedRows] = await connection.query(
      'SELECT bedStatus, wardId FROM bed WHERE id = ? FOR UPDATE', 
      [toBedId]
    );

    if (targetBedRows.length === 0 || targetBedRows[0].bedStatus !== BED_STATUS.AVAILABLE) {
      await connection.rollback();
      return res.status(400).json({ message: 'Target bed is not available' });
    }

    if (parseInt(targetBedRows[0].wardId) !== parseInt(toWardId)) {
      await connection.rollback();
      return res.status(400).json({ message: 'Target bed does not belong to the specified ward' });
    }

    // 3. Log the transfer in wardTransfer table
    const transferDate = new Date();
    const insertTransferSql = `
      INSERT INTO wardTransfer (
        admissionId, fromWardId, toWardId, fromBedId, toBedId, 
        transferReason, transferredBy, transferDate, createdBy, updatedBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await connection.query(insertTransferSql, [
      admissionId, admission.fromWardId, toWardId, admission.fromBedId, toBedId,
      transferReason || null, userId, transferDate, userId, userId
    ]);

    // 4. Update the admission record to point to the new ward and bed
    await connection.query(
      'UPDATE patientAdmission SET wardId = ?, bedId = ?, updatedBy = ? WHERE id = ?',
      [toWardId, toBedId, userId, admissionId]
    );

    // 5. Free up the old bed
    if (admission.fromBedId) {
      await connection.query(
        'UPDATE bed SET bedStatus = ?, updatedBy = ? WHERE id = ?',
        [BED_STATUS.AVAILABLE, userId, admission.fromBedId]
      );
    }

    // 6. Occupy the new bed
    await connection.query(
      'UPDATE bed SET bedStatus = ?, updatedBy = ? WHERE id = ?',
      [BED_STATUS.OCCUPIED, userId, toBedId]
    );

    await connection.commit();

    return res.status(200).json({ message: 'Internal transfer completed successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Internal transfer error:', error);
    return res.status(500).json({ message: 'Error processing internal transfer' });
  } finally {
    connection.release();
  }
};

// =============================================================================
// FUNCTION: externalTransfer
// =============================================================================
const externalTransfer = async (req, res) => {
  const { admissionId, hospitalId, transferReason } = req.body;
  const userId = req.user.id;

  if (!admissionId || !hospitalId) {
    return res.status(400).json({ message: 'admissionId and hospitalId are required' });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Get the current admission
    const [admissionRows] = await connection.query(
      'SELECT bedId, status, isTransfer FROM patientAdmission WHERE id = ? FOR UPDATE', 
      [admissionId]
    );

    if (admissionRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Admission record not found' });
    }

    const admission = admissionRows[0];

    if (admission.status !== ADMISSION_STATUS.ADMITTED || admission.isTransfer) {
      await connection.rollback();
      return res.status(400).json({ message: 'Patient cannot be transferred externally at this time' });
    }

    // 2. Log in hospitalTransfer
    const transferOutDate = new Date();
    const insertTransferSql = `
      INSERT INTO hospitalTransfer (
        admissionId, hospitalId, transferOutDate, transferReason, 
        transferredBy, createdBy, updatedBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    await connection.query(insertTransferSql, [
      admissionId, hospitalId, transferOutDate, transferReason || null, 
      userId, userId, userId
    ]);

    // 3. Update patientAdmission
    await connection.query(
      'UPDATE patientAdmission SET status = ?, isTransfer = ?, updatedBy = ? WHERE id = ?',
      [ADMISSION_STATUS.TRANSFERRED_OUT, true, userId, admissionId]
    );

    // 4. Free up the bed
    if (admission.bedId) {
      await connection.query(
        'UPDATE bed SET bedStatus = ?, updatedBy = ? WHERE id = ?',
        [BED_STATUS.AVAILABLE, userId, admission.bedId]
      );
    }

    await connection.commit();

    return res.status(200).json({ message: 'External transfer completed successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('External transfer error:', error);
    return res.status(500).json({ message: 'Error processing external transfer' });
  } finally {
    connection.release();
  }
};

// =============================================================================
// FUNCTION: returnExternalTransfer
// =============================================================================
const returnExternalTransfer = async (req, res) => {
  const { id } = req.params; // this is the hospitalTransfer record ID
  const { toWardId, toBedId } = req.body;
  const userId = req.user.id;

  if (!toWardId || !toBedId) {
    return res.status(400).json({ message: 'toWardId and toBedId are required for returning patient' });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Get the hospital transfer record
    const [transferRows] = await connection.query(
      'SELECT * FROM hospitalTransfer WHERE id = ? FOR UPDATE', 
      [id]
    );

    if (transferRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Transfer record not found' });
    }

    const transferRecord = transferRows[0];

    if (transferRecord.returnDate) {
      await connection.rollback();
      return res.status(400).json({ message: 'Patient has already returned from this transfer' });
    }

    // 2. Verify target bed is available
    const [targetBedRows] = await connection.query(
      'SELECT bedStatus, wardId FROM bed WHERE id = ? FOR UPDATE', 
      [toBedId]
    );

    if (targetBedRows.length === 0 || targetBedRows[0].bedStatus !== BED_STATUS.AVAILABLE) {
      await connection.rollback();
      return res.status(400).json({ message: 'Target bed is not available' });
    }

    if (parseInt(targetBedRows[0].wardId) !== parseInt(toWardId)) {
      await connection.rollback();
      return res.status(400).json({ message: 'Target bed does not belong to the specified ward' });
    }

    const returnDate = new Date();

    // 3. Mark return date on transfer record
    await connection.query(
      'UPDATE hospitalTransfer SET returnDate = ?, updatedBy = ? WHERE id = ?',
      [returnDate, userId, id]
    );

    // 4. Update admission record to admitted, flip isTransfer to false, assign new bed
    await connection.query(`
      UPDATE patientAdmission 
      SET status = ?, isTransfer = ?, wardId = ?, bedId = ?, updatedBy = ? 
      WHERE id = ?
    `, [ADMISSION_STATUS.ADMITTED, false, toWardId, toBedId, userId, transferRecord.admissionId]);

    // 5. Occupy the new bed
    await connection.query(
      'UPDATE bed SET bedStatus = ?, updatedBy = ? WHERE id = ?',
      [BED_STATUS.OCCUPIED, userId, toBedId]
    );

    await connection.commit();

    return res.status(200).json({ message: 'Patient returned successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Return transfer error:', error);
    return res.status(500).json({ message: 'Error returning patient from external transfer' });
  } finally {
    connection.release();
  }
};

// =============================================================================
// FUNCTION: getHospitals
// =============================================================================
const getHospitals = async (req, res) => {
  try {
    const sql = 'SELECT * FROM hospital ORDER BY hospitalName ASC';
    const [hospitals] = await db.query(sql);

    return res.status(200).json({
      message: 'Hospitals retrieved successfully',
      hospitals
    });
  } catch (error) {
    console.error('Get hospitals error:', error);
    return res.status(500).json({ message: 'Error retrieving hospitals' });
  }
};

// =============================================================================
// FUNCTION: getInternalTransferHistory
// =============================================================================
const getInternalTransferHistory = async (req, res) => {
  const { admissionId } = req.query;

  try {
    let sql = `
      SELECT t.*, a.patientName, w1.wardName AS fromWardName, w2.wardName AS toWardName, u.fullName AS transferredByName
      FROM wardTransfer t
      JOIN patientAdmission a ON t.admissionId = a.id
      JOIN ward w1 ON t.fromWardId = w1.id
      JOIN ward w2 ON t.toWardId = w2.id
      JOIN users u ON t.transferredBy = u.id
      WHERE 1=1
    `;
    const values = [];

    if (admissionId) {
      sql += ' AND t.admissionId = ?';
      values.push(admissionId);
    }

    sql += ' ORDER BY t.transferDate DESC';

    const [transfers] = await db.query(sql, values);

    return res.status(200).json({
      message: 'Internal transfer history retrieved successfully',
      count: transfers.length,
      transfers
    });
  } catch (error) {
    console.error('Get internal transfer history error:', error);
    return res.status(500).json({ message: 'Error retrieving internal transfer history' });
  }
};

// =============================================================================
// FUNCTION: getExternalTransferHistory
// =============================================================================
const getExternalTransferHistory = async (req, res) => {
  const { admissionId, pending } = req.query;

  try {
    let sql = `
      SELECT ht.*, a.patientName, h.hospitalName, u.fullName AS transferredByName
      FROM hospitalTransfer ht
      JOIN patientAdmission a ON ht.admissionId = a.id
      JOIN hospital h ON ht.hospitalId = h.id
      JOIN users u ON ht.transferredBy = u.id
      WHERE 1=1
    `;
    const values = [];

    if (admissionId) {
      sql += ' AND ht.admissionId = ?';
      values.push(admissionId);
    }

    if (pending === 'true') {
      sql += ' AND ht.returnDate IS NULL';
    }

    sql += ' ORDER BY ht.transferOutDate DESC';

    const [transfers] = await db.query(sql, values);

    return res.status(200).json({
      message: 'External transfer history retrieved successfully',
      count: transfers.length,
      transfers
    });
  } catch (error) {
    console.error('Get external transfer history error:', error);
    return res.status(500).json({ message: 'Error retrieving external transfer history' });
  }
};

module.exports = {
  internalTransfer,
  externalTransfer,
  returnExternalTransfer,
  getHospitals,
  getInternalTransferHistory,
  getExternalTransferHistory
};

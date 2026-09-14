// =============================================================================
// transferModel.js — Database Queries for Transfers
// =============================================================================

const db = require('../../config/db');
const { ADMISSION_STATUS, BED_STATUS } = require('../../constants');

const transactionInternalTransfer = async (admissionId, toWardId, toBedId, transferReason, userId) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [admissionRows] = await connection.query(
      'SELECT wardId as fromWardId, bedId as fromBedId, status FROM patientAdmission WHERE id = ? FOR UPDATE', 
      [admissionId]
    );

    if (admissionRows.length === 0) throw new Error('Admission record not found');
    const admission = admissionRows[0];

    if (admission.status !== ADMISSION_STATUS.ADMITTED) {
      throw new Error('Can only transfer currently admitted patients');
    }

    const [targetBedRows] = await connection.query(
      'SELECT bedStatus, wardId FROM bed WHERE id = ? FOR UPDATE', 
      [toBedId]
    );

    if (targetBedRows.length === 0 || targetBedRows[0].bedStatus !== BED_STATUS.AVAILABLE) {
      throw new Error('Target bed is not available');
    }

    if (parseInt(targetBedRows[0].wardId) !== parseInt(toWardId)) {
      throw new Error('Target bed does not belong to the specified ward');
    }

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

    await connection.query(
      'UPDATE patientAdmission SET wardId = ?, bedId = ?, updatedBy = ? WHERE id = ?',
      [toWardId, toBedId, userId, admissionId]
    );

    if (admission.fromBedId) {
      await connection.query(
        'UPDATE bed SET bedStatus = ?, updatedBy = ? WHERE id = ?',
        [BED_STATUS.AVAILABLE, userId, admission.fromBedId]
      );
    }

    await connection.query(
      'UPDATE bed SET bedStatus = ?, updatedBy = ? WHERE id = ?',
      [BED_STATUS.OCCUPIED, userId, toBedId]
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const transactionExternalTransfer = async (admissionId, hospitalId, transferReason, userId) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [admissionRows] = await connection.query(
      'SELECT bedId, status, isTransfer FROM patientAdmission WHERE id = ? FOR UPDATE', 
      [admissionId]
    );

    if (admissionRows.length === 0) throw new Error('Admission record not found');
    const admission = admissionRows[0];

    if (admission.status !== ADMISSION_STATUS.ADMITTED || admission.isTransfer) {
      throw new Error('Patient cannot be transferred externally at this time');
    }

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

    await connection.query(
      'UPDATE patientAdmission SET status = ?, isTransfer = ?, updatedBy = ? WHERE id = ?',
      [ADMISSION_STATUS.TRANSFERRED_OUT, true, userId, admissionId]
    );

    if (admission.bedId) {
      await connection.query(
        'UPDATE bed SET bedStatus = ?, updatedBy = ? WHERE id = ?',
        [BED_STATUS.AVAILABLE, userId, admission.bedId]
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

const transactionReturnExternalTransfer = async (transferId, toWardId, toBedId, userId) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [transferRows] = await connection.query(
      'SELECT * FROM hospitalTransfer WHERE id = ? FOR UPDATE', 
      [transferId]
    );

    if (transferRows.length === 0) throw new Error('Transfer record not found');
    const transferRecord = transferRows[0];

    if (transferRecord.returnDate) {
      throw new Error('Patient has already returned from this transfer');
    }

    const [targetBedRows] = await connection.query(
      'SELECT bedStatus, wardId FROM bed WHERE id = ? FOR UPDATE', 
      [toBedId]
    );

    if (targetBedRows.length === 0 || targetBedRows[0].bedStatus !== BED_STATUS.AVAILABLE) {
      throw new Error('Target bed is not available');
    }

    if (parseInt(targetBedRows[0].wardId) !== parseInt(toWardId)) {
      throw new Error('Target bed does not belong to the specified ward');
    }

    const returnDate = new Date();

    await connection.query(
      'UPDATE hospitalTransfer SET returnDate = ?, updatedBy = ? WHERE id = ?',
      [returnDate, userId, transferId]
    );

    await connection.query(`
      UPDATE patientAdmission 
      SET status = ?, isTransfer = ?, wardId = ?, bedId = ?, updatedBy = ? 
      WHERE id = ?
    `, [ADMISSION_STATUS.ADMITTED, false, toWardId, toBedId, userId, transferRecord.admissionId]);

    await connection.query(
      'UPDATE bed SET bedStatus = ?, updatedBy = ? WHERE id = ?',
      [BED_STATUS.OCCUPIED, userId, toBedId]
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const findAllHospitals = async () => {
  const [rows] = await db.query('SELECT * FROM hospital ORDER BY hospitalName ASC');
  return rows;
};

const findInternalTransferHistory = async (admissionId) => {
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
  const [rows] = await db.query(sql, values);
  return rows;
};

const findExternalTransferHistory = async (admissionId, pending) => {
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
  const [rows] = await db.query(sql, values);
  return rows;
};

module.exports = {
  transactionInternalTransfer,
  transactionExternalTransfer,
  transactionReturnExternalTransfer,
  findAllHospitals,
  findInternalTransferHistory,
  findExternalTransferHistory
};

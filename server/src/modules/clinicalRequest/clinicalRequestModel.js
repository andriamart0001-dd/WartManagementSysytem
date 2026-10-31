// =============================================================================
// clinicalRequestModel.js — Database Queries for Clinical Requests
// =============================================================================
// This file executes raw parameterized MySQL queries on the "clinicalRequest"
// table. It links admissions, requesting doctors, and reviewing staff/admins.
// =============================================================================

const db = require('../../config/db');

// This function queries all clinical requests with optional filters
// Joins patientAdmission, ward, bed, and user tables to return rich data
const findAllRequests = async ({ status, requestedBy, wardId } = {}) => {
  // Query to select clinical requests with patient and user details
  let sql = `
    SELECT 
      cr.id,
      cr.admissionId,
      cr.requestType,
      cr.requestStatus,
      cr.requestedBy,
      cr.requestNotes,
      cr.reviewedBy,
      cr.reviewedAt,
      cr.reviewNotes,
      cr.createdAt,
      cr.updatedAt,
      p.fullName AS patientName,
      p.patientNIC,
      pa.wardId,
      pa.bedId,
      w.wardName,
      b.bedNumber,
      uReq.fullName AS requestedByName,
      uRev.fullName AS reviewedByName
    FROM clinicalRequest cr
    JOIN patientAdmission pa ON cr.admissionId = pa.id
    JOIN patient p ON pa.patientId = p.id
    JOIN ward w ON pa.wardId = w.id
    LEFT JOIN bed b ON pa.bedId = b.id
    JOIN users uReq ON cr.requestedBy = uReq.id
    LEFT JOIN users uRev ON cr.reviewedBy = uRev.id
    WHERE 1=1
  `;
  const queryParams = [];

  // Filter by status (e.g., 'pending', 'approved', 'rejected')
  if (status) {
    sql += ' AND cr.requestStatus = ?';
    queryParams.push(status);
  }

  // Filter by doctor who made the request
  if (requestedBy) {
    sql += ' AND cr.requestedBy = ?';
    queryParams.push(requestedBy);
  }

  // Filter by ward
  if (wardId) {
    sql += ' AND pa.wardId = ?';
    queryParams.push(wardId);
  }

  // Order latest first
  sql += ' ORDER BY cr.createdAt DESC';

  const [rows] = await db.query(sql, queryParams);
  return rows;
};

// This function retrieves a single clinical request by ID
const findRequestById = async (id) => {
  // Query to get a single clinical request with joined names
  const sql = `
    SELECT 
      cr.id,
      cr.admissionId,
      cr.requestType,
      cr.requestStatus,
      cr.requestedBy,
      cr.requestNotes,
      cr.reviewedBy,
      cr.reviewedAt,
      cr.reviewNotes,
      cr.createdAt,
      cr.updatedAt,
      p.fullName AS patientName,
      p.patientNIC,
      pa.wardId,
      pa.bedId,
      pa.status AS admissionStatus,
      w.wardName,
      b.bedNumber,
      uReq.fullName AS requestedByName,
      uRev.fullName AS reviewedByName
    FROM clinicalRequest cr
    JOIN patientAdmission pa ON cr.admissionId = pa.id
    JOIN patient p ON pa.patientId = p.id
    JOIN ward w ON pa.wardId = w.id
    LEFT JOIN bed b ON pa.bedId = b.id
    JOIN users uReq ON cr.requestedBy = uReq.id
    LEFT JOIN users uRev ON cr.reviewedBy = uRev.id
    WHERE cr.id = ?
    LIMIT 1
  `;

  const [rows] = await db.query(sql, [id]);
  if (rows.length > 0) {
    return rows[0];
  }
  return null;
};

// This function checks if an admission already has an open pending request
const findPendingRequestByAdmissionId = async (admissionId) => {
  // Query to find existing pending request for an admission
  const sql = `
    SELECT id, requestType, requestStatus 
    FROM clinicalRequest 
    WHERE admissionId = ? AND requestStatus = 'pending' 
    LIMIT 1
  `;

  const [rows] = await db.query(sql, [admissionId]);
  if (rows.length > 0) {
    return rows[0];
  }
  return null;
};

// This function counts all pending requests across the system
const countPendingRequests = async () => {
  // Query to count all requests waiting for review
  const sql = "SELECT COUNT(*) AS total FROM clinicalRequest WHERE requestStatus = 'pending'";
  const [rows] = await db.query(sql);
  return rows[0].total;
};

// This function inserts a new clinical request
const createRequest = async (admissionId, requestType, requestedBy, requestNotes, userId) => {
  // Query to insert a new clinical request record
  const sql = `
    INSERT INTO clinicalRequest (
      admissionId,
      requestType,
      requestStatus,
      requestedBy,
      requestNotes,
      createdBy,
      updatedBy
    )
    VALUES (?, ?, 'pending', ?, ?, ?, ?)
  `;

  const [result] = await db.query(sql, [
    admissionId,
    requestType,
    requestedBy,
    requestNotes || null,
    userId,
    userId
  ]);

  return result.insertId;
};

// This function updates the status of a request to 'approved' or 'rejected'
const updateRequestStatus = async (id, requestStatus, reviewedBy, reviewNotes, userId) => {
  // Query to update request status, reviewer, and review notes
  const sql = `
    UPDATE clinicalRequest
    SET 
      requestStatus = ?,
      reviewedBy = ?,
      reviewedAt = NOW(),
      reviewNotes = ?,
      updatedBy = ?
    WHERE id = ?
  `;

  const [result] = await db.query(sql, [
    requestStatus,
    reviewedBy,
    reviewNotes || null,
    userId,
    id
  ]);

  return result.affectedRows;
};

module.exports = {
  findAllRequests,
  findRequestById,
  findPendingRequestByAdmissionId,
  countPendingRequests,
  createRequest,
  updateRequestStatus
};

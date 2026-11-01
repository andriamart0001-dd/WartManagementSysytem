// =============================================================================
// clinicalRequestService.js — Business Logic for Clinical Requests
// =============================================================================
// This service coordinates clinical workflows (like discharge requests).
// Instead of doctors directly discharging patients, doctors submit a request.
// A Nurse or Ward Admin reviews the request:
//   - If approved: the patient is automatically discharged and bed freed up.
//   - If rejected: the request is closed with notes, patient stays admitted.
// =============================================================================

const clinicalRequestModel = require('./clinicalRequestModel');
const admissionModel = require('../admission/admissionModel');
const admissionService = require('../admission/admissionService');
const { REQUEST_STATUS, REQUEST_TYPE, ADMISSION_STATUS } = require('../../constants');

// This function gets all clinical requests according to query filters
const getRequests = async (filters = {}) => {
  const requests = await clinicalRequestModel.findAllRequests(filters);
  return requests;
};

// This function retrieves a single request by its ID
const getRequestById = async (id) => {
  const request = await clinicalRequestModel.findRequestById(id);
  if (!request) {
    throw new Error('Clinical request not found');
  }
  return request;
};

// This function returns the total count of pending requests
const getPendingCount = async () => {
  const total = await clinicalRequestModel.countPendingRequests();
  return total;
};

// This function allows a doctor to submit a discharge request
const createDischargeRequest = async (data, userId) => {
  const { admissionId, requestNotes } = data;

  // Step 1: Validate admissionId
  if (!admissionId) {
    throw new Error('admissionId is required');
  }

  // Step 2: Verify the admission exists and the patient is currently admitted
  const admission = await admissionModel.findAdmissionById(admissionId);
  if (!admission) {
    throw new Error('Admission record not found');
  }

  if (admission.status !== ADMISSION_STATUS.ADMITTED) {
    throw new Error(`Cannot request discharge: Patient status is '${admission.status}'`);
  }

  // Step 3: Check if there is already an active pending request for this admission
  const existingPending = await clinicalRequestModel.findPendingRequestByAdmissionId(admissionId);
  if (existingPending) {
    throw new Error('A pending discharge request already exists for this patient');
  }

  // Step 4: Create the request row in MySQL
  const newRequestId = await clinicalRequestModel.createRequest(
    admissionId,
    REQUEST_TYPE.DISCHARGE,
    userId,
    requestNotes,
    userId
  );

  // Step 5: Return the newly created request
  const createdRequest = await clinicalRequestModel.findRequestById(newRequestId);
  return createdRequest;
};

// This function allows a Ward Admin or Nurse to approve a discharge request
const approveRequest = async (id, reviewNotes, userId) => {
  // Step 1: Verify the request exists
  const request = await clinicalRequestModel.findRequestById(id);
  if (!request) {
    throw new Error('Clinical request not found');
  }

  // Step 2: Ensure the request is still pending
  if (request.requestStatus !== REQUEST_STATUS.PENDING) {
    throw new Error(`This request has already been ${request.requestStatus}`);
  }

  // Step 3: If it's a discharge request, execute the discharge
  if (request.requestType === REQUEST_TYPE.DISCHARGE) {
    const combinedNotes = reviewNotes 
      ? `Approved: ${reviewNotes} | Doctor Notes: ${request.requestNotes || 'None'}`
      : (request.requestNotes || 'Discharged upon doctor request');

    // Call admissionService to discharge patient and mark bed available
    await admissionService.dischargePatient(request.admissionId, combinedNotes, userId);
  }

  // Step 4: Update the request status to 'approved'
  await clinicalRequestModel.updateRequestStatus(
    id,
    REQUEST_STATUS.APPROVED,
    userId,
    reviewNotes,
    userId
  );

  // Step 5: Return the updated request
  const updatedRequest = await clinicalRequestModel.findRequestById(id);
  return updatedRequest;
};

// This function allows a Ward Admin or Nurse to reject a request
const rejectRequest = async (id, reviewNotes, userId) => {
  // Step 1: Verify the request exists
  const request = await clinicalRequestModel.findRequestById(id);
  if (!request) {
    throw new Error('Clinical request not found');
  }

  // Step 2: Ensure the request is still pending
  if (request.requestStatus !== REQUEST_STATUS.PENDING) {
    throw new Error(`This request has already been ${request.requestStatus}`);
  }

  // Step 3: Update request status to 'rejected'
  await clinicalRequestModel.updateRequestStatus(
    id,
    REQUEST_STATUS.REJECTED,
    userId,
    reviewNotes,
    userId
  );

  // Step 4: Return the updated request
  const updatedRequest = await clinicalRequestModel.findRequestById(id);
  return updatedRequest;
};

module.exports = {
  getRequests,
  getRequestById,
  getPendingCount,
  createDischargeRequest,
  approveRequest,
  rejectRequest
};

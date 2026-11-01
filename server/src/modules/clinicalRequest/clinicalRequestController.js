// =============================================================================
// clinicalRequestController.js — HTTP Handlers for Clinical Requests
// =============================================================================
// This controller exposes REST endpoints for managing clinical requests:
//   - Viewing requests (filterable by status, doctor, or ward)
//   - Submitting discharge requests
//   - Approving and rejecting requests
// =============================================================================

const clinicalRequestService = require('./clinicalRequestService');

// This handler retrieves clinical requests with optional filtering
const getRequests = async (req, res) => {
  try {
    const filters = {};

    if (req.query.status) {
      filters.status = req.query.status;
    }

    if (req.query.wardId) {
      filters.wardId = req.query.wardId;
    }

    // If doctor wants to see only their own requests
    if (req.query.myRequests === 'true') {
      filters.requestedBy = req.user.id;
    }

    const requests = await clinicalRequestService.getRequests(filters);

    return res.status(200).json({
      message: 'Requests retrieved successfully',
      count: requests.length,
      requests: requests
    });
  } catch (error) {
    console.error('Error fetching clinical requests:', error);
    return res.status(500).json({
      message: 'Error retrieving clinical requests'
    });
  }
};

// This handler retrieves a single request by its ID
const getRequestById = async (req, res) => {
  try {
    const requestId = req.params.id;
    const request = await clinicalRequestService.getRequestById(requestId);

    return res.status(200).json({
      message: 'Request retrieved successfully',
      request: request
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    console.error('Error fetching clinical request by ID:', error);
    return res.status(500).json({
      message: 'Error retrieving clinical request'
    });
  }
};

// This handler gets the count of pending clinical requests
const getPendingCount = async (req, res) => {
  try {
    const count = await clinicalRequestService.getPendingCount();
    return res.status(200).json({
      count: count
    });
  } catch (error) {
    console.error('Error fetching pending request count:', error);
    return res.status(500).json({
      message: 'Error retrieving pending request count'
    });
  }
};

// This handler creates a new discharge request
const createDischargeRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const request = await clinicalRequestService.createDischargeRequest(req.body, userId);

    return res.status(201).json({
      message: 'Discharge request submitted successfully',
      request: request
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    if (
      error.message.includes('required') || 
      error.message.includes('already') ||
      error.message.includes('Cannot')
    ) {
      return res.status(400).json({ message: error.message });
    }
    console.error('Error submitting discharge request:', error);
    return res.status(500).json({
      message: 'Error submitting discharge request'
    });
  }
};

// This handler approves a clinical request
const approveRequest = async (req, res) => {
  try {
    const requestId = req.params.id;
    const reviewNotes = req.body.reviewNotes;
    const userId = req.user.id;

    const request = await clinicalRequestService.approveRequest(requestId, reviewNotes, userId);

    return res.status(200).json({
      message: 'Discharge request approved and patient discharged successfully',
      request: request
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('already')) {
      return res.status(400).json({ message: error.message });
    }
    console.error('Error approving clinical request:', error);
    return res.status(500).json({
      message: 'Error approving clinical request'
    });
  }
};

// This handler rejects a clinical request
const rejectRequest = async (req, res) => {
  try {
    const requestId = req.params.id;
    const reviewNotes = req.body.reviewNotes;
    const userId = req.user.id;

    const request = await clinicalRequestService.rejectRequest(requestId, reviewNotes, userId);

    return res.status(200).json({
      message: 'Discharge request rejected',
      request: request
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('already')) {
      return res.status(400).json({ message: error.message });
    }
    console.error('Error rejecting clinical request:', error);
    return res.status(500).json({
      message: 'Error rejecting clinical request'
    });
  }
};

module.exports = {
  getRequests,
  getRequestById,
  getPendingCount,
  createDischargeRequest,
  approveRequest,
  rejectRequest
};

// =============================================================================
// bedController.js — HTTP Handler for Beds
// =============================================================================

const bedService = require('./bedService');
const { ROLES } = require('../../constants');

// Retrieve all beds, enforcing ward isolation for Ward Admins
const getBeds = async (req, res) => {
  try {
    let targetWardId = req.query.wardId;

    // Ward Admins can only view beds within their own assigned ward
    if (req.user && req.user.role === ROLES.WARD_ADMIN) {
      if (!req.user.assignedWardId) {
        return res.status(403).json({ 
          message: 'Access denied. You do not have an assigned ward.' 
        });
      }
      // If the client requested a different ward, reject the request
      if (targetWardId && Number(targetWardId) !== Number(req.user.assignedWardId)) {
        return res.status(403).json({ 
          message: 'Access denied. You are only authorized to view beds in your assigned ward.' 
        });
      }
      // Enforce the Ward Admin's assigned ward
      targetWardId = req.user.assignedWardId;
    }

    const beds = await bedService.getBeds(targetWardId);
    return res.status(200).json({
      message: 'Beds retrieved successfully',
      count: beds.length,
      beds
    });
  } catch (error) {
    console.error('Get beds error:', error);
    return res.status(500).json({ message: 'Error retrieving beds' });
  }
};

// Create a new bed, ensuring Ward Admins only create beds in their own ward
const createBed = async (req, res) => {
  try {
    // Ward Admins cannot create beds in other wards
    if (req.user && req.user.role === ROLES.WARD_ADMIN) {
      if (!req.user.assignedWardId || Number(req.body.wardId) !== Number(req.user.assignedWardId)) {
        return res.status(403).json({ 
          message: 'Access denied. You can only create beds in your assigned ward.' 
        });
      }
    }

    const bed = await bedService.createBed(req.body, req.user.id);
    return res.status(201).json({
      message: 'Bed created successfully',
      bed
    });
  } catch (error) {
    if (error.message === 'Ward not found') return res.status(404).json({ message: error.message });
    if (error.message.includes('required') || error.message.includes('already exists') || error.message.includes('Section not found')) {
      return res.status(400).json({ message: error.message });
    }
    console.error('Create bed error:', error);
    return res.status(500).json({ message: 'Error creating bed' });
  }
};

// Update bed status (e.g. mark for maintenance)
const updateBedStatus = async (req, res) => {
  try {
    // Ward Admins can only update status of beds in their own assigned ward
    if (req.user && req.user.role === ROLES.WARD_ADMIN) {
      const existingBed = await bedService.getBedById(req.params.id);
      if (!existingBed) {
        return res.status(404).json({ message: 'Bed not found' });
      }
      if (Number(existingBed.wardId) !== Number(req.user.assignedWardId)) {
        return res.status(403).json({ 
          message: 'Access denied. You can only update beds in your assigned ward.' 
        });
      }
    }

    const bed = await bedService.updateBedStatus(req.params.id, req.body.status, req.user.id);
    return res.status(200).json({
      message: 'Bed status updated successfully',
      bed
    });
  } catch (error) {
    if (error.message === 'Bed not found') return res.status(404).json({ message: error.message });
    if (error.message.includes('required') || error.message.includes('Invalid status')) {
      return res.status(400).json({ message: error.message });
    }
    console.error('Update bed status error:', error);
    return res.status(500).json({ message: 'Error updating bed status' });
  }
};

// Update bed details (number, section, or status)
const updateBed = async (req, res) => {
  try {
    // Ward Admins can only edit beds in their own assigned ward
    if (req.user && req.user.role === ROLES.WARD_ADMIN) {
      const existingBed = await bedService.getBedById(req.params.id);
      if (!existingBed) {
        return res.status(404).json({ message: 'Bed not found' });
      }
      if (Number(existingBed.wardId) !== Number(req.user.assignedWardId)) {
        return res.status(403).json({ 
          message: 'Access denied. You can only edit beds in your assigned ward.' 
        });
      }
      // Ward Admins cannot reassign a bed to another ward
      if (req.body.wardId && Number(req.body.wardId) !== Number(req.user.assignedWardId)) {
        return res.status(403).json({ 
          message: 'Access denied. You cannot reassign a bed to another ward.' 
        });
      }
    }

    const bed = await bedService.updateBed(req.params.id, req.body, req.user.id);
    return res.status(200).json({
      message: 'Bed updated successfully',
      bed
    });
  } catch (error) {
    if (error.message === 'Bed not found' || error.message === 'New Ward not found') {
      return res.status(404).json({ message: error.message });
    }
    if (
      error.message.includes('required') || 
      error.message.includes('Invalid status') || 
      error.message.includes('already exists') ||
      error.message.includes('Section not found')
    ) {
      return res.status(400).json({ message: error.message });
    }
    console.error('Update bed error:', error);
    return res.status(500).json({ message: 'Error updating bed' });
  }
};

module.exports = {
  getBeds,
  createBed,
  updateBedStatus,
  updateBed
};

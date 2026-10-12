// =============================================================================
// bedController.js — HTTP Handler for Beds
// =============================================================================

const bedService = require('./bedService');

const getBeds = async (req, res) => {
  try {
    const beds = await bedService.getBeds(req.query.wardId);
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

const createBed = async (req, res) => {
  try {
    const bed = await bedService.createBed(req.body, req.user.id);
    return res.status(201).json({
      message: 'Bed created successfully',
      bed
    });
  } catch (error) {
    if (error.message === 'Ward not found') return res.status(404).json({ message: error.message });
    if (error.message.includes('required') || error.message.includes('already exists')) {
      return res.status(400).json({ message: error.message });
    }
    console.error('Create bed error:', error);
    return res.status(500).json({ message: 'Error creating bed' });
  }
};

const updateBedStatus = async (req, res) => {
  try {
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

const updateBed = async (req, res) => {
  try {
    const bed = await bedService.updateBed(req.params.id, req.body, req.user.id);
    return res.status(200).json({
      message: 'Bed updated successfully',
      bed
    });
  } catch (error) {
    if (error.message === 'Bed not found' || error.message === 'New Ward not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('required') || error.message.includes('Invalid status') || error.message.includes('already exists')) {
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

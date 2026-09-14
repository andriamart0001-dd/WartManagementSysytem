// =============================================================================
// transferController.js — HTTP Handler for Transfers
// =============================================================================

const transferService = require('./transferService');

const internalTransfer = async (req, res) => {
  try {
    await transferService.processInternalTransfer(req.body, req.user.id);
    return res.status(200).json({ message: 'Internal transfer completed successfully' });
  } catch (error) {
    if (error.message === 'Admission record not found') return res.status(404).json({ message: error.message });
    if (error.message.includes('required') || error.message.includes('not available') || error.message.includes('belong') || error.message.includes('Can only transfer')) {
      return res.status(400).json({ message: error.message });
    }
    console.error('Internal transfer error:', error);
    return res.status(500).json({ message: 'Error processing internal transfer' });
  }
};

const externalTransfer = async (req, res) => {
  try {
    await transferService.processExternalTransfer(req.body, req.user.id);
    return res.status(200).json({ message: 'External transfer completed successfully' });
  } catch (error) {
    if (error.message === 'Admission record not found') return res.status(404).json({ message: error.message });
    if (error.message.includes('required') || error.message.includes('cannot be transferred')) {
      return res.status(400).json({ message: error.message });
    }
    console.error('External transfer error:', error);
    return res.status(500).json({ message: 'Error processing external transfer' });
  }
};

const returnExternalTransfer = async (req, res) => {
  try {
    await transferService.returnExternalTransfer(req.params.id, req.body, req.user.id);
    return res.status(200).json({ message: 'Patient returned successfully' });
  } catch (error) {
    if (error.message === 'Transfer record not found') return res.status(404).json({ message: error.message });
    if (error.message.includes('required') || error.message.includes('already returned') || error.message.includes('not available') || error.message.includes('belong')) {
      return res.status(400).json({ message: error.message });
    }
    console.error('Return transfer error:', error);
    return res.status(500).json({ message: 'Error returning patient from external transfer' });
  }
};

const getHospitals = async (req, res) => {
  try {
    const hospitals = await transferService.getAllHospitals();
    return res.status(200).json({
      message: 'Hospitals retrieved successfully',
      hospitals
    });
  } catch (error) {
    console.error('Get hospitals error:', error);
    return res.status(500).json({ message: 'Error retrieving hospitals' });
  }
};

const getInternalTransferHistory = async (req, res) => {
  try {
    const transfers = await transferService.getInternalTransferHistory(req.query.admissionId);
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

const getExternalTransferHistory = async (req, res) => {
  try {
    const transfers = await transferService.getExternalTransferHistory(req.query.admissionId, req.query.pending);
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

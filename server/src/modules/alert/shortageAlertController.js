// =============================================================================
// shortageAlertController.js — HTTP Handler for Shortage Alerts
// =============================================================================

const shortageAlertService = require('./shortageAlertService');
const { ROLES } = require('../../constants');

// Retrieve shortage alerts (scoped to assigned ward for Ward Admins)
const getAlerts = async (req, res) => {
  try {
    let targetWardId = null;

    // Ward Admins should only see alerts concerning their assigned ward
    if (req.user && req.user.role === ROLES.WARD_ADMIN) {
      if (!req.user.assignedWardId) {
        return res.status(403).json({ 
          message: 'Access denied. You do not have an assigned ward.' 
        });
      }
      targetWardId = req.user.assignedWardId;
    }

    const alerts = await shortageAlertService.getAlerts(req.query.status, targetWardId);
    return res.status(200).json({
      message: 'Shortage alerts retrieved successfully',
      alerts
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    return res.status(500).json({ message: 'Error retrieving alerts' });
  }
};

const logAlert = async (req, res) => {
  try {
    // Ward Admins can only log alerts for their own assigned ward
    if (req.user && req.user.role === ROLES.WARD_ADMIN) {
      if (req.body.wardId && Number(req.body.wardId) !== Number(req.user.assignedWardId)) {
        return res.status(403).json({ 
          message: 'Access denied. You can only log alerts for your assigned ward.' 
        });
      }
    }

    const alert = await shortageAlertService.logAlert(req.body, req.user.id);
    return res.status(201).json({
      message: 'Alert logged successfully',
      alert
    });
  } catch (error) {
    if (error.message.includes('required') || error.message.includes('already exists')) {
      return res.status(400).json({ message: error.message });
    }
    console.error('Log alert error:', error);
    return res.status(500).json({ message: 'Error logging alert' });
  }
};

const resolveAlert = async (req, res) => {
  try {
    // Ward Admins can only resolve alerts belonging to their assigned ward
    if (req.user && req.user.role === ROLES.WARD_ADMIN) {
      const existingAlert = await shortageAlertService.getAlertById(req.params.id);
      if (!existingAlert) {
        return res.status(404).json({ message: 'Alert not found' });
      }
      if (existingAlert.wardId && Number(existingAlert.wardId) !== Number(req.user.assignedWardId)) {
        return res.status(403).json({ 
          message: 'Access denied. You can only resolve alerts in your assigned ward.' 
        });
      }
    }

    const alert = await shortageAlertService.resolveAlert(req.params.id, req.user.id);
    return res.status(200).json({
      message: 'Alert resolved successfully',
      alert
    });
  } catch (error) {
    if (error.message === 'Alert not found') return res.status(404).json({ message: error.message });
    if (error.message === 'Alert is already resolved') return res.status(400).json({ message: error.message });
    console.error('Resolve alert error:', error);
    return res.status(500).json({ message: 'Error resolving alert' });
  }
};

module.exports = {
  getAlerts,
  logAlert,
  resolveAlert
};

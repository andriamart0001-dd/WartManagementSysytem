// =============================================================================
// shortageAlertController.js — HTTP Handler for Shortage Alerts
// =============================================================================

const shortageAlertService = require('./shortageAlertService');

const getAlerts = async (req, res) => {
  try {
    const alerts = await shortageAlertService.getAlerts(req.query.status);
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

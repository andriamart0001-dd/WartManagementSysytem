// =============================================================================
// shortageAlertService.js — Business Logic for Shortage Alerts
// =============================================================================

const shortageAlertModel = require('./shortageAlertModel');
const { ALERT_TYPES } = require('../../constants');

const getAlerts = async (status) => {
  return await shortageAlertModel.findAlertsByStatus(status);
};

const logAlert = async (alertData, userId) => {
  const { wardId, equipmentId, alertType } = alertData;

  if (!alertType || !Object.values(ALERT_TYPES).includes(alertType)) {
    throw new Error('Valid alertType is required');
  }

  if (alertType === ALERT_TYPES.BED_SHORTAGE && !wardId) {
    throw new Error('wardId is required for bed shortage alerts');
  }

  if (alertType === ALERT_TYPES.EQUIPMENT_SHORTAGE && !equipmentId) {
    throw new Error('equipmentId is required for equipment shortage alerts');
  }

  const existingAlerts = await shortageAlertModel.findActiveAlert(alertType, wardId, equipmentId);
  if (existingAlerts.length > 0) {
    throw new Error('An active alert already exists for this resource');
  }

  const triggeredAt = new Date();
  const insertValues = [
    wardId || null, 
    equipmentId || null, 
    alertType, 
    triggeredAt, 
    userId, 
    userId
  ];

  const newId = await shortageAlertModel.insertAlert(insertValues);
  return await shortageAlertModel.findAlertById(newId);
};

const resolveAlert = async (id, userId) => {
  const existingAlert = await shortageAlertModel.findAlertById(id);
  
  if (!existingAlert) {
    throw new Error('Alert not found');
  }

  if (existingAlert.resolvedAt) {
    throw new Error('Alert is already resolved');
  }

  const resolvedAt = new Date();
  await shortageAlertModel.updateAlertResolved(id, resolvedAt, userId);
  
  return await shortageAlertModel.findAlertById(id);
};

module.exports = {
  getAlerts,
  logAlert,
  resolveAlert
};

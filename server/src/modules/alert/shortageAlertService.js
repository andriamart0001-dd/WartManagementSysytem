// =============================================================================
// shortageAlertService.js — Business Logic for Shortage Alerts
// =============================================================================

const shortageAlertModel = require('./shortageAlertModel');
const dashboardModel = require('../dashboard/dashboardModel');
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

const syncShortages = async (userId = 1) => {
  // Get current state
  const currentWardShortages = await dashboardModel.getWardShortages();
  const currentEqShortages = await dashboardModel.getEquipmentShortages();
  
  // Get active alerts
  const activeAlerts = await shortageAlertModel.findAlertsByStatus('active');

  // Find alerts to resolve
  for (const alert of activeAlerts) {
    if (alert.alertType === ALERT_TYPES.BED_SHORTAGE) {
      const stillShort = currentWardShortages.find(w => w.id === alert.wardId);
      if (!stillShort) await resolveAlert(alert.id, userId);
    } else if (alert.alertType === ALERT_TYPES.EQUIPMENT_SHORTAGE) {
      const stillShort = currentEqShortages.find(e => e.id === alert.equipmentId);
      if (!stillShort) await resolveAlert(alert.id, userId);
    }
  }

  // Find alerts to create
  for (const ward of currentWardShortages) {
    const hasAlert = activeAlerts.find(a => a.alertType === ALERT_TYPES.BED_SHORTAGE && a.wardId === ward.id);
    if (!hasAlert) {
      await logAlert({ wardId: ward.id, alertType: ALERT_TYPES.BED_SHORTAGE }, userId);
    }
  }

  for (const eq of currentEqShortages) {
    const hasAlert = activeAlerts.find(a => a.alertType === ALERT_TYPES.EQUIPMENT_SHORTAGE && a.equipmentId === eq.id);
    if (!hasAlert) {
      await logAlert({ equipmentId: eq.id, alertType: ALERT_TYPES.EQUIPMENT_SHORTAGE }, userId);
    }
  }
};

module.exports = {
  getAlerts,
  logAlert,
  resolveAlert,
  syncShortages
};

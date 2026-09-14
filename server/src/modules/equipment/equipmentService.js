// =============================================================================
// equipmentService.js — Business Logic for Equipment
// =============================================================================

const equipmentModel = require('./equipmentModel');
const { EQUIPMENT_STATUS } = require('../../constants');

const getAllEquipment = async (wardId) => {
  const equipmentList = await equipmentModel.findAllEquipment(wardId);
  return equipmentList.map(eq => ({
    ...eq,
    hasShortage: eq.quantity < eq.minQuantityThreshold
  }));
};

const createEquipment = async (equipmentData, userId) => {
  const { equipmentName, quantity, minQuantityThreshold, wardId } = equipmentData;

  if (!equipmentName || quantity === undefined || !wardId) {
    throw new Error('equipmentName, quantity, and wardId are required');
  }

  const ward = await equipmentModel.findWardById(wardId);
  if (!ward) {
    throw new Error('Ward not found');
  }

  const insertValues = [
    equipmentName, 
    quantity, 
    EQUIPMENT_STATUS.AVAILABLE,
    minQuantityThreshold || 0, 
    wardId, 
    userId, 
    userId
  ];

  const newId = await equipmentModel.insertEquipment(insertValues);
  return await equipmentModel.findEquipmentById(newId);
};

const updateEquipment = async (id, updateData, userId) => {
  const { equipmentName, quantity, status, minQuantityThreshold } = updateData;

  const existingEq = await equipmentModel.findEquipmentById(id);
  if (!existingEq) {
    throw new Error('Equipment not found');
  }

  const fieldsToUpdate = [];
  const updateValues = [];

  if (equipmentName !== undefined) {
    fieldsToUpdate.push('equipmentName = ?');
    updateValues.push(equipmentName);
  }
  if (quantity !== undefined) {
    fieldsToUpdate.push('quantity = ?');
    updateValues.push(quantity);
  }
  if (status !== undefined) {
    if (!Object.values(EQUIPMENT_STATUS).includes(status)) {
      throw new Error('Invalid status');
    }
    fieldsToUpdate.push('status = ?');
    updateValues.push(status);
  }
  if (minQuantityThreshold !== undefined) {
    fieldsToUpdate.push('minQuantityThreshold = ?');
    updateValues.push(minQuantityThreshold);
  }

  if (fieldsToUpdate.length === 0) {
    throw new Error('No fields provided for update');
  }

  fieldsToUpdate.push('updatedBy = ?');
  updateValues.push(userId);

  const updateSql = `UPDATE equipment SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;
  updateValues.push(id);

  await equipmentModel.updateEquipmentById(updateSql, updateValues);
  return await equipmentModel.findEquipmentById(id);
};

const logMaintenance = async (equipmentId, maintenanceData, userId) => {
  const { notes, nextScheduledDate } = maintenanceData;
  if (!notes) {
    throw new Error('Maintenance notes are required');
  }
  await equipmentModel.transactionLogMaintenance(equipmentId, notes, nextScheduledDate, userId);
};

const getMaintenanceLogs = async (equipmentId) => {
  return await equipmentModel.findMaintenanceLogs(equipmentId);
};

module.exports = {
  getAllEquipment,
  createEquipment,
  updateEquipment,
  logMaintenance,
  getMaintenanceLogs
};

// =============================================================================
// bedService.js — Business Logic for Beds
// =============================================================================

const bedModel = require('./bedModel');
const { BED_STATUS } = require('../../constants');

const getBeds = async (wardId) => {
  return await bedModel.findAllBeds(wardId);
};

const createBed = async (bedData, userId) => {
  const { wardId, bedNumber } = bedData;

  if (!wardId || !bedNumber) {
    throw new Error('wardId and bedNumber are required');
  }

  const newId = await bedModel.transactionCreateBed(wardId, bedNumber, BED_STATUS.AVAILABLE, userId);
  return await bedModel.findBedById(newId);
};

const updateBedStatus = async (id, status, userId) => {
  if (!status) {
    throw new Error('status is required');
  }

  if (!Object.values(BED_STATUS).includes(status)) {
    throw new Error(`Invalid status. Allowed: ${Object.values(BED_STATUS).join(', ')}`);
  }

  const affectedRows = await bedModel.updateBedStatusById(id, status, userId);
  if (affectedRows === 0) {
    throw new Error('Bed not found');
  }

  return await bedModel.findBedById(id);
};

const updateBed = async (id, bedData, userId) => {
  const { wardId, bedNumber, bedStatus } = bedData;

  if (!wardId || !bedNumber || !bedStatus) {
    throw new Error('wardId, bedNumber, and bedStatus are required');
  }

  if (!Object.values(BED_STATUS).includes(bedStatus)) {
    throw new Error(`Invalid status. Allowed: ${Object.values(BED_STATUS).join(', ')}`);
  }

  await bedModel.transactionUpdateBed(id, wardId, bedNumber, bedStatus, userId);
  return await bedModel.findBedById(id);
};

module.exports = {
  getBeds,
  createBed,
  updateBedStatus,
  updateBed
};

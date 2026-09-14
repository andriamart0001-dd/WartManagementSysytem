// =============================================================================
// transferService.js — Business Logic for Transfers
// =============================================================================

const transferModel = require('./transferModel');

const processInternalTransfer = async (transferData, userId) => {
  const { admissionId, toWardId, toBedId, transferReason } = transferData;

  if (!admissionId || !toWardId || !toBedId) {
    throw new Error('admissionId, toWardId, and toBedId are required');
  }

  await transferModel.transactionInternalTransfer(admissionId, toWardId, toBedId, transferReason, userId);
};

const processExternalTransfer = async (transferData, userId) => {
  const { admissionId, hospitalId, transferReason } = transferData;

  if (!admissionId || !hospitalId) {
    throw new Error('admissionId and hospitalId are required');
  }

  await transferModel.transactionExternalTransfer(admissionId, hospitalId, transferReason, userId);
};

const returnExternalTransfer = async (transferId, returnData, userId) => {
  const { toWardId, toBedId } = returnData;

  if (!toWardId || !toBedId) {
    throw new Error('toWardId and toBedId are required for returning patient');
  }

  await transferModel.transactionReturnExternalTransfer(transferId, toWardId, toBedId, userId);
};

const getAllHospitals = async () => {
  return await transferModel.findAllHospitals();
};

const getInternalTransferHistory = async (admissionId) => {
  return await transferModel.findInternalTransferHistory(admissionId);
};

const getExternalTransferHistory = async (admissionId, pending) => {
  return await transferModel.findExternalTransferHistory(admissionId, pending);
};

module.exports = {
  processInternalTransfer,
  processExternalTransfer,
  returnExternalTransfer,
  getAllHospitals,
  getInternalTransferHistory,
  getExternalTransferHistory
};

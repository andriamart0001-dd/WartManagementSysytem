// =============================================================================
// hospitalService.js — Business Logic for Hospitals
// =============================================================================

const hospitalModel = require('./hospitalModel');

const getAllHospitals = async () => {
  return await hospitalModel.findAllHospitals();
};

const createHospital = async (hospitalData, userId) => {
  const { hospitalName, address, contactNumber } = hospitalData;

  if (!hospitalName) {
    throw new Error('Hospital name is required');
  }

  const insertValues = [hospitalName, address || null, contactNumber || null, userId, userId];
  const newId = await hospitalModel.insertHospital(insertValues);
  
  return await hospitalModel.findHospitalById(newId);
};

const updateHospital = async (id, hospitalData, userId) => {
  const { hospitalName, address, contactNumber } = hospitalData;

  if (!hospitalName) {
    throw new Error('Hospital name is required');
  }

  const updateSql = `
    UPDATE hospital 
    SET hospitalName = ?, address = ?, contactNumber = ?, updatedBy = ?
    WHERE id = ?
  `;
  
  const affected = await hospitalModel.updateHospitalById(updateSql, [hospitalName, address || null, contactNumber || null, userId, id]);
  
  if (affected === 0) {
    throw new Error('Hospital not found');
  }

  return await hospitalModel.findHospitalById(id);
};

const deleteHospital = async (id) => {
  const transfers = await hospitalModel.findTransfersByHospitalId(id);
  if (transfers.length > 0) {
    throw new Error('Cannot delete hospital because there are transfer records associated with it.');
  }

  const affected = await hospitalModel.deleteHospitalById(id);
  if (affected === 0) {
    throw new Error('Hospital not found');
  }
};

module.exports = {
  getAllHospitals,
  createHospital,
  updateHospital,
  deleteHospital
};

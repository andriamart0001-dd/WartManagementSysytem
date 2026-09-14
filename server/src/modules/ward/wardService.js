// =============================================================================
// wardService.js — Business Logic for Wards and Departments
// =============================================================================

const wardModel = require('./wardModel');
const { WARD_TYPES, WARD_STATUS } = require('../../constants');

// --- Wards ---

const getAllWards = async () => {
  const wards = await wardModel.findAllWards();
  return wards.map(ward => ({
    ...ward,
    hasShortage: ward.totalBeds < ward.minBedThreshold
  }));
};

const getWardById = async (id) => {
  const ward = await wardModel.findWardById(id);
  if (!ward) throw new Error('Ward not found');
  ward.hasShortage = ward.totalBeds < ward.minBedThreshold;
  return ward;
};

const createWard = async (wardData, adminId) => {
  const { wardName, wardType, departmentId, minBedThreshold, floorLocation } = wardData;

  if (!wardName || !wardType || !departmentId) {
    throw new Error('wardName, wardType, and departmentId are required');
  }
  if (!WARD_TYPES.includes(wardType)) {
    throw new Error(`Invalid wardType. Allowed types: ${WARD_TYPES.join(', ')}`);
  }

  const dept = await wardModel.findDepartmentById(departmentId);
  if (!dept) throw new Error('Department not found');

  const insertValues = [
    wardName,
    wardType,
    departmentId,
    minBedThreshold || 0,
    floorLocation || null,
    WARD_STATUS.ACTIVE,
    adminId,
    adminId
  ];

  const newId = await wardModel.insertWard(insertValues);
  return await wardModel.findWardById(newId);
};

const updateWard = async (id, updateData, userId) => {
  const { wardName, wardType, departmentId, minBedThreshold, floorLocation, status } = updateData;

  const existingWard = await wardModel.findWardById(id);
  if (!existingWard) throw new Error('Ward not found');

  const fieldsToUpdate = [];
  const updateValues = [];

  if (wardName !== undefined) {
    fieldsToUpdate.push('wardName = ?');
    updateValues.push(wardName);
  }

  if (wardType !== undefined) {
    if (!WARD_TYPES.includes(wardType)) {
      throw new Error(`Invalid wardType. Allowed: ${WARD_TYPES.join(', ')}`);
    }
    fieldsToUpdate.push('wardType = ?');
    updateValues.push(wardType);
  }

  if (departmentId !== undefined) {
    const dept = await wardModel.findDepartmentById(departmentId);
    if (!dept) throw new Error('Department not found');
    fieldsToUpdate.push('departmentId = ?');
    updateValues.push(departmentId);
  }

  if (minBedThreshold !== undefined) {
    fieldsToUpdate.push('minBedThreshold = ?');
    updateValues.push(minBedThreshold);
  }

  if (floorLocation !== undefined) {
    fieldsToUpdate.push('floorLocation = ?');
    updateValues.push(floorLocation);
  }

  if (status !== undefined) {
    if (!Object.values(WARD_STATUS).includes(status)) {
      throw new Error('Invalid status');
    }
    fieldsToUpdate.push('status = ?');
    updateValues.push(status);
  }

  if (fieldsToUpdate.length === 0) {
    throw new Error('No fields provided for update');
  }

  fieldsToUpdate.push('updatedBy = ?');
  updateValues.push(userId);

  const updateSql = `UPDATE ward SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;
  updateValues.push(id);

  await wardModel.updateWard(updateSql, updateValues);
  return await wardModel.findWardById(id);
};

const deleteWard = async (id) => {
  const existingWard = await wardModel.findWardById(id);
  if (!existingWard) throw new Error('Ward not found');

  const activeAdmissions = await wardModel.findActiveAdmissionsInWard(id);
  if (activeAdmissions.length > 0) {
    throw new Error('Cannot delete ward. There are currently admitted patients in this ward.');
  }

  const beds = await wardModel.findBedsInWard(id);
  if (beds.length > 0) {
    throw new Error('Cannot delete ward. There are beds assigned to this ward. Please remove or reassign the beds first.');
  }

  await wardModel.deleteWardById(id);
};

// --- Departments ---

const getAllDepartments = async () => {
  return await wardModel.findAllDepartments();
};

const createDepartment = async (departmentName, adminId) => {
  if (!departmentName) throw new Error('Department name is required');
  
  const newId = await wardModel.insertDepartment([departmentName, adminId, adminId]);
  const depts = await wardModel.findAllDepartments();
  return depts.find(d => d.id === newId);
};

const updateDepartment = async (id, departmentName, adminId) => {
  if (!departmentName) throw new Error('Department name is required');

  const updateSql = 'UPDATE department SET departmentName = ?, updatedBy = ? WHERE id = ?';
  const affected = await wardModel.updateDepartmentById(updateSql, [departmentName, adminId, id]);
  
  if (affected === 0) throw new Error('Department not found');
  
  const depts = await wardModel.findAllDepartments();
  return depts.find(d => parseInt(d.id) === parseInt(id));
};

const deleteDepartment = async (id) => {
  const wards = await wardModel.findWardsByDepartmentId(id);
  if (wards.length > 0) {
    throw new Error('Cannot delete department because it contains wards. Remove or reassign wards first.');
  }

  const affected = await wardModel.deleteDepartmentById(id);
  if (affected === 0) throw new Error('Department not found');
};

module.exports = {
  getAllWards,
  getWardById,
  createWard,
  updateWard,
  deleteWard,
  getAllDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment
};

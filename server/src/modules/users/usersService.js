// =============================================================================
// usersService.js — Business Logic for Users
// =============================================================================
// This file contains the rules: "what should happen and in what order?"
// It calls the Model for database access. It does NOT touch req/res.
// =============================================================================

const bcrypt = require('bcryptjs');
const usersModel = require('./usersModel');
const { USER_STATUS, ROLES } = require('../../constants');

// Helper to remove passwordHash from user object
const sanitizeUser = (userRecord) => {
  const { passwordHash, ...safeUserData } = userRecord;
  return safeUserData;
};

const getAllUsers = async () => {
  const users = await usersModel.findAllUsers();
  return users.map(sanitizeUser);
};

const getUserById = async (userId) => {
  const user = await usersModel.findUserById(userId);
  if (!user) throw new Error('User not found');
  return sanitizeUser(user);
};

const createUser = async (userData, adminUserId) => {
  const { fullName, email, password, role, contactNumber, assignedWardId } = userData;

  // Basic validation
  if (!fullName || !email || !password || !role) {
    throw new Error('Please provide fullName, email, password, and role');
  }

  // Validate role
  if (!Object.values(ROLES).includes(role)) {
    throw new Error(`Invalid role specified. Allowed roles are: ${Object.values(ROLES).join(', ')}`);
  }

  // Ward assignment validation
  if ((role === ROLES.NURSE || role === ROLES.WARD_ADMIN) && !assignedWardId) {
    throw new Error(`Role ${role} requires an assignedWardId`);
  }

  // Check email uniqueness
  const existingUser = await usersModel.findUserByEmail(email);
  if (existingUser) {
    throw new Error('A user with this email address already exists');
  }

  // Hash password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Insert user
  const insertValues = [
    fullName,
    email,
    hashedPassword,
    role,
    contactNumber || null,
    USER_STATUS.ACTIVE,
    true, // isTemporaryPassword
    adminUserId,
    adminUserId
  ];
  
  const newUserId = await usersModel.insertUser(insertValues);

  // Handle ward assignment
  if (assignedWardId && (role === ROLES.NURSE || role === ROLES.WARD_ADMIN)) {
    await usersModel.assignWardToUser(newUserId, assignedWardId);
  }

  // Fetch newly created user
  const newUser = await usersModel.findUserById(newUserId);
  return sanitizeUser(newUser);
};

const updateUser = async (targetUserId, updateData, adminUserId) => {
  const { fullName, email, password, role, contactNumber, status, assignedWardId } = updateData;

  // Confirm user exists
  const existingUser = await usersModel.findUserById(targetUserId);
  if (!existingUser) {
    throw new Error('User not found');
  }

  const fieldsToUpdate = [];
  const updateValues = [];

  if (fullName !== undefined) {
    fieldsToUpdate.push('fullName = ?');
    updateValues.push(fullName);
  }

  if (email !== undefined) {
    fieldsToUpdate.push('email = ?');
    updateValues.push(email);
  }

  if (role !== undefined) {
    if (!Object.values(ROLES).includes(role)) {
      throw new Error(`Invalid role specified. Allowed roles are: ${Object.values(ROLES).join(', ')}`);
    }
    fieldsToUpdate.push('role = ?');
    updateValues.push(role);
  }

  if (contactNumber !== undefined) {
    fieldsToUpdate.push('contactNumber = ?');
    updateValues.push(contactNumber);
  }

  if (status !== undefined) {
    fieldsToUpdate.push('status = ?');
    updateValues.push(status);
  }

  if (password !== undefined) {
    const saltRounds = 10;
    const newHashedPassword = await bcrypt.hash(password, saltRounds);
    fieldsToUpdate.push('passwordHash = ?');
    updateValues.push(newHashedPassword);
    fieldsToUpdate.push('isTemporaryPassword = ?');
    updateValues.push(true);
  }

  fieldsToUpdate.push('updatedBy = ?');
  updateValues.push(adminUserId);

  if (fieldsToUpdate.length === 1 && assignedWardId === undefined) {
    throw new Error('No update fields were provided in the request body');
  }

  if (fieldsToUpdate.length > 1) {
    const updateSql = `UPDATE users SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;
    updateValues.push(targetUserId);
    await usersModel.updateUser(updateSql, updateValues);
  }

  if (assignedWardId !== undefined) {
    await usersModel.deleteUserWardAssignment(targetUserId);
    if (assignedWardId !== null && assignedWardId !== '') {
      await usersModel.assignWardToUser(targetUserId, assignedWardId);
    }
  }

  const updatedUser = await usersModel.findUserById(targetUserId);
  return sanitizeUser(updatedUser);
};

const deactivateUser = async (targetUserId, adminUserId) => {
  if (parseInt(targetUserId) === parseInt(adminUserId)) {
    throw new Error('You cannot deactivate your own account');
  }

  const existingUser = await usersModel.findUserStatus(targetUserId);
  if (!existingUser) {
    throw new Error('User not found');
  }

  if (existingUser.status === USER_STATUS.INACTIVE) {
    throw new Error('This user is already inactive');
  }

  await usersModel.deactivateUserStatus(targetUserId, USER_STATUS.INACTIVE, adminUserId);
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deactivateUser
};

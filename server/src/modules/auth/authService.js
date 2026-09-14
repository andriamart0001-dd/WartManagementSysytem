// =============================================================================
// authService.js — Business Logic for Auth
// =============================================================================
// This file contains the rules. It calls the Model for database access.
// =============================================================================

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authModel = require('./authModel');
const { USER_STATUS } = require('../../constants');

// Process login request
const authenticateUser = async (email, password) => {
  // Find user by email
  const userRecord = await authModel.findUserByEmail(email);
  if (!userRecord) {
    throw new Error('Invalid email or password');
  }

  // Check if account is active
  if (userRecord.status !== USER_STATUS.ACTIVE) {
    throw new Error('Your account has been deactivated. Please contact an administrator.');
  }

  // Verify password
  const isPasswordCorrect = await bcrypt.compare(password, userRecord.passwordHash);
  if (!isPasswordCorrect) {
    throw new Error('Invalid email or password');
  }

  // Build JWT payload
  const tokenPayload = {
    id: userRecord.id,
    role: userRecord.role,
    fullName: userRecord.fullName
  };

  // Create JWT token
  const token = jwt.sign(
    tokenPayload,
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  return {
    token,
    requirePasswordChange: userRecord.isTemporaryPassword === 1,
    user: {
      id: userRecord.id,
      fullName: userRecord.fullName,
      email: userRecord.email,
      role: userRecord.role
    }
  };
};

// Process change password request
const changeUserPassword = async (userId, currentPassword, newPassword) => {
  const passwordHash = await authModel.getPasswordHashById(userId);
  if (!passwordHash) {
    throw new Error('User not found');
  }

  const isMatch = await bcrypt.compare(currentPassword, passwordHash);
  if (!isMatch) {
    throw new Error('Current password is incorrect');
  }

  const saltRounds = 10;
  const newHashedPassword = await bcrypt.hash(newPassword, saltRounds);

  await authModel.updatePassword(userId, newHashedPassword);
};

// Fetch user profile
const getUserProfile = async (userId) => {
  const userProfile = await authModel.findUserProfileById(userId);
  if (!userProfile) {
    throw new Error('User profile not found');
  }
  return userProfile;
};

module.exports = {
  authenticateUser,
  changeUserPassword,
  getUserProfile
};

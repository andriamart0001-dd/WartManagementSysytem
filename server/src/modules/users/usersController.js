// =============================================================================
// usersController.js — HTTP Handler for Users
// =============================================================================
// This file ONLY handles HTTP: reads the request, calls the service, sends the response.
// =============================================================================

const usersService = require('./usersService');

const getAllUsers = async (req, res) => {
  try {
    const users = await usersService.getAllUsers();
    return res.status(200).json({
      message: 'Users retrieved successfully',
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Get all users error:', error);
    return res.status(500).json({
      message: 'An internal server error occurred while retrieving users.'
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const user = await usersService.getUserById(targetUserId);
    return res.status(200).json({
      message: 'User retrieved successfully',
      user
    });
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({ message: error.message });
    }
    console.error('Get user by ID error:', error);
    return res.status(500).json({
      message: 'An internal server error occurred while retrieving the user.'
    });
  }
};

const createUser = async (req, res) => {
  try {
    const adminUserId = req.user.id;
    const user = await usersService.createUser(req.body, adminUserId);
    return res.status(201).json({
      message: 'User created successfully',
      user
    });
  } catch (error) {
    if (error.message.includes('already exists')) {
      return res.status(409).json({ message: error.message });
    }
    if (
      error.message.includes('Please provide') || 
      error.message.includes('Invalid role') ||
      error.message.includes('requires an assignedWardId')
    ) {
      return res.status(400).json({ message: error.message });
    }
    console.error('Create user error:', error);
    return res.status(500).json({
      message: 'An internal server error occurred while creating the user.'
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const adminUserId = req.user.id;
    const user = await usersService.updateUser(targetUserId, req.body, adminUserId);
    return res.status(200).json({
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('Invalid role') || error.message.includes('No update fields')) {
      return res.status(400).json({ message: error.message });
    }
    console.error('Update user error:', error);
    return res.status(500).json({
      message: 'An internal server error occurred while updating the user.'
    });
  }
};

const deactivateUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const adminUserId = req.user.id;
    await usersService.deactivateUser(targetUserId, adminUserId);
    return res.status(200).json({ message: 'User deactivated successfully' });
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('cannot deactivate') || error.message.includes('already inactive')) {
      return res.status(400).json({ message: error.message });
    }
    console.error('Deactivate user error:', error);
    return res.status(500).json({
      message: 'An internal server error occurred while deactivating the user.'
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deactivateUser
};

// =============================================================================
// authController.js — HTTP Handler for Auth
// =============================================================================
// This file ONLY handles HTTP: reads the request, calls the service, sends the response.
// =============================================================================

const authService = require('./authService');

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide both email and password' });
  }

  try {
    const authData = await authService.authenticateUser(email, password);
    return res.status(200).json({
      message: 'Login successful',
      ...authData
    });
  } catch (error) {
    // If it's a known error from our service, return 401 or 403
    if (error.message === 'Invalid email or password') {
      return res.status(401).json({ message: error.message });
    }
    if (error.message.includes('deactivated')) {
      return res.status(403).json({ message: error.message });
    }
    
    console.error('Login error:', error);
    return res.status(500).json({ message: 'An internal server error occurred. Please try again later.' });
  }
};

const changePassword = async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Please provide both current and new passwords' });
  }

  try {
    await authService.changeUserPassword(userId, currentPassword, newPassword);
    return res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    if (error.message === 'User not found') return res.status(404).json({ message: error.message });
    if (error.message === 'Current password is incorrect') return res.status(401).json({ message: error.message });
    
    console.error('Change password error:', error);
    return res.status(500).json({ message: 'Error changing password' });
  }
};

const getMe = async (req, res) => {
  try {
    const userId = req.user.id;
    const userProfile = await authService.getUserProfile(userId);
    return res.status(200).json({
      message: 'User profile retrieved successfully',
      user: userProfile
    });
  } catch (error) {
    if (error.message === 'User profile not found') {
      return res.status(404).json({ message: error.message });
    }
    console.error('Get me error:', error);
    return res.status(500).json({ message: 'An internal server error occurred while retrieving user profile.' });
  }
};

module.exports = {
  loginUser,
  changePassword,
  getMe
};

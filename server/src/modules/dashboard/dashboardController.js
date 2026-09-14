// =============================================================================
// dashboardController.js — HTTP Handler for Dashboard Summary
// =============================================================================

const dashboardService = require('./dashboardService');

const getSummary = async (req, res) => {
  try {
    const data = await dashboardService.getDashboardSummary();
    return res.status(200).json({
      message: 'Dashboard summary retrieved successfully',
      data
    });
  } catch (error) {
    console.error('Get dashboard summary error:', error);
    return res.status(500).json({ message: 'Error retrieving dashboard summary' });
  }
};

module.exports = {
  getSummary
};

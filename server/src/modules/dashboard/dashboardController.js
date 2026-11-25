// =============================================================================
// dashboardController.js — HTTP Handler for Dashboard Summary
// =============================================================================

const dashboardService = require('./dashboardService');

const getSummary = async (req, res) => {
  try {
    const data = await dashboardService.getDashboardSummary(req.user);
    return res.status(200).json({
      message: 'Dashboard summary retrieved successfully',
      data
    });
  } catch (error) {
    console.error('Get dashboard summary error:', error);
    return res.status(500).json({ message: 'Error retrieving dashboard summary' });
  }
};

// This controller handles GET /api/dashboard/report to return full system statistics
const getReport = async (req, res) => {
  try {
    const reportData = await dashboardService.getSystemReport();
    return res.status(200).json({
      message: 'System report retrieved successfully',
      report: reportData
    });
  } catch (error) {
    console.error('Get system report error:', error);
    return res.status(500).json({ message: 'Error retrieving system report' });
  }
};

module.exports = {
  getSummary,
  getReport
};

// =============================================================================
// dashboardService.js — Business Logic for Dashboard Summary
// =============================================================================

const dashboardModel = require('./dashboardModel');
const shortageAlertService = require('../alert/shortageAlertService');

const getDashboardSummary = async () => {
  // Sync alerts first so they reflect the latest reality in DB
  await shortageAlertService.syncShortages();

  const totalActiveAdmissions = await dashboardModel.countActiveAdmissions();
  const totalUsers = await dashboardModel.countTotalUsers();
  const totalWards = await dashboardModel.countTotalWards();
  const bedStats = await dashboardModel.getBedStats();
  const wardShortagesResult = await dashboardModel.getWardShortages();
  const eqShortagesResult = await dashboardModel.getEquipmentShortages();

  return {
    totalUsers,
    totalWards,
    totalActiveAdmissions,
    bedStats: {
      available: parseInt(bedStats.availableBeds) || 0,
      occupied: parseInt(bedStats.occupiedBeds) || 0,
      maintenance: parseInt(bedStats.maintenanceBeds) || 0,
      total: parseInt(bedStats.totalBeds) || 0
    },
    shortages: {
      wards: wardShortagesResult,
      equipment: eqShortagesResult
    }
  };
};

module.exports = {
  getDashboardSummary
};

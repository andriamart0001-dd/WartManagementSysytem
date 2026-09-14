// =============================================================================
// dashboardService.js — Business Logic for Dashboard Summary
// =============================================================================

const dashboardModel = require('./dashboardModel');

const getDashboardSummary = async () => {
  const totalActiveAdmissions = await dashboardModel.countActiveAdmissions();
  const bedStats = await dashboardModel.getBedStats();
  const wardShortagesResult = await dashboardModel.getWardShortages();
  const eqShortagesResult = await dashboardModel.getEquipmentShortages();

  return {
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

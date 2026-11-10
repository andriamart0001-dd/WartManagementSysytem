// =============================================================================
// dashboardService.js — Business Logic for Dashboard Summary
// =============================================================================

const dashboardModel = require('./dashboardModel');
const shortageAlertService = require('../alert/shortageAlertService');
const { ROLES } = require('../../constants');

const getDashboardSummary = async (currentUser = null) => {
  // Sync alerts first so they reflect the latest reality in DB
  await shortageAlertService.syncShortages();

  // If the logged-in user is a Ward Admin, scope all statistics to their assigned ward
  let targetWardId = null;
  if (currentUser && currentUser.role === ROLES.WARD_ADMIN) {
    targetWardId = currentUser.assignedWardId || null;
  }

  const totalActiveAdmissions = await dashboardModel.countActiveAdmissions(targetWardId);
  const totalPatients = await dashboardModel.countTotalPatients(targetWardId);
  const totalUsers = await dashboardModel.countTotalUsers(targetWardId);
  const totalWards = await dashboardModel.countTotalWards(targetWardId);
  const bedStats = await dashboardModel.getBedStats(targetWardId);
  const wardShortagesResult = await dashboardModel.getWardShortages(targetWardId);
  const eqShortagesResult = await dashboardModel.getEquipmentShortages(targetWardId);

  return {
    totalUsers,
    totalWards,
    totalPatients,
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

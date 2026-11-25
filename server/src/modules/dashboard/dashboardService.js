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

// This function gathers all hospital-wide metrics needed for the Admin System Report page
const getSystemReport = async () => {
  // Step 1: Sync shortage alerts first so the report shows accurate current alerts
  await shortageAlertService.syncShortages();

  // Step 2: Fetch overall counts across the whole hospital
  const totalUsers = await dashboardModel.countTotalUsers(null);
  const totalWards = await dashboardModel.countTotalWards(null);
  const totalPatients = await dashboardModel.countTotalPatients(null);
  const activeAdmissions = await dashboardModel.countActiveAdmissions(null);
  const bedStats = await dashboardModel.getBedStats(null);

  // Step 3: Fetch active ward and equipment shortages
  const wardShortages = await dashboardModel.getWardShortages(null);
  const equipmentShortages = await dashboardModel.getEquipmentShortages(null);

  // Step 4: Fetch per-ward breakdowns, monthly summary, and top 5 busiest wards
  const rawBedBreakdown = await dashboardModel.getBedsBreakdownByWard();
  const rawEquipmentBreakdown = await dashboardModel.getEquipmentBreakdownByWard();
  const rawMonthlySummary = await dashboardModel.getMonthlyAdmissionSummary();
  const rawTopWards = await dashboardModel.getTopFiveBusiestWards();

  // Step 5: Format bed breakdown rows with clean integers and occupancy percentage
  const bedBreakdownByWard = rawBedBreakdown.map((wardRow) => {
    const available = parseInt(wardRow.availableBeds, 10) || 0;
    const occupied = parseInt(wardRow.occupiedBeds, 10) || 0;
    const maintenance = parseInt(wardRow.maintenanceBeds, 10) || 0;
    const total = parseInt(wardRow.totalBeds, 10) || 0;
    const occupancyPercent = total > 0 ? Math.round((occupied / total) * 100) : 0;

    return {
      wardId: wardRow.wardId,
      wardName: wardRow.wardName,
      wardType: wardRow.wardType,
      minBedThreshold: parseInt(wardRow.minBedThreshold, 10) || 0,
      available,
      occupied,
      maintenance,
      total,
      occupancyPercent
    };
  });

  // Step 6: Format equipment breakdown rows with a simple shortage flag
  const equipmentBreakdown = rawEquipmentBreakdown.map((equipmentRow) => {
    const quantity = parseInt(equipmentRow.quantity, 10) || 0;
    const minQuantityThreshold = parseInt(equipmentRow.minQuantityThreshold, 10) || 0;
    const isShortage = quantity < minQuantityThreshold;

    return {
      id: equipmentRow.id,
      wardName: equipmentRow.wardName,
      equipmentName: equipmentRow.equipmentName,
      quantity,
      status: equipmentRow.status,
      minQuantityThreshold,
      isShortage
    };
  });

  // Step 7: Format top 5 busiest wards with occupancy percentage
  const topFiveBusiestWards = rawTopWards.map((wardRow) => {
    const occupiedBeds = parseInt(wardRow.occupiedBeds, 10) || 0;
    const totalBeds = parseInt(wardRow.totalBeds, 10) || 0;
    const occupancyPercent = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    return {
      wardId: wardRow.wardId,
      wardName: wardRow.wardName,
      wardType: wardRow.wardType,
      occupiedBeds,
      totalBeds,
      occupancyPercent
    };
  });

  // Step 8: Format monthly admission counts safely
  const monthlyAdmissions = {
    totalThisMonth: parseInt(rawMonthlySummary?.totalThisMonth, 10) || 0,
    currentlyAdmitted: parseInt(rawMonthlySummary?.currentlyAdmitted, 10) || 0,
    dischargedThisMonth: parseInt(rawMonthlySummary?.dischargedThisMonth, 10) || 0,
    transferredThisMonth: parseInt(rawMonthlySummary?.transferredThisMonth, 10) || 0
  };

  // Step 9: Return the complete report object
  return {
    generatedAt: new Date().toISOString(),
    overview: {
      totalUsers: parseInt(totalUsers, 10) || 0,
      totalWards: parseInt(totalWards, 10) || 0,
      totalBeds: parseInt(bedStats.totalBeds, 10) || 0,
      availableBeds: parseInt(bedStats.availableBeds, 10) || 0,
      occupiedBeds: parseInt(bedStats.occupiedBeds, 10) || 0,
      maintenanceBeds: parseInt(bedStats.maintenanceBeds, 10) || 0,
      totalPatients: parseInt(totalPatients, 10) || 0,
      activeAdmissions: parseInt(activeAdmissions, 10) || 0,
      totalAlerts: wardShortages.length + equipmentShortages.length
    },
    bedBreakdownByWard,
    equipmentBreakdown,
    monthlyAdmissions,
    topFiveBusiestWards,
    shortages: {
      wards: wardShortages,
      equipment: equipmentShortages
    }
  };
};

module.exports = {
  getDashboardSummary,
  getSystemReport
};

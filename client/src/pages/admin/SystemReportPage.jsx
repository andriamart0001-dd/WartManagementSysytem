// =============================================================================
// SystemReportPage.jsx — Hospital System Summary Report Page
// =============================================================================
// Purpose:
//   Provides System Administrators with a printable, single-page summary
//   report covering all major metrics across the hospital.
//   Includes 6 sections:
//     1. Hospital Overview Summary (Users, Wards, Beds, Patients, Alerts)
//     2. Bed Status Breakdown Per Ward
//     3. Equipment Status Breakdown Per Ward
//     4. This Month's Admission Summary
//     5. Top 5 Busiest Wards (by Occupancy %)
//     6. Active Shortage Alerts Log
//
// Route: /admin/report
// Allowed Role: Admin only
// =============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useToast } from '../../context/ToastContext';
import { EQUIPMENT_STATUS } from '../../constants';

// Shared UI Components
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';

const SystemReportPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  // State to store the full report object returned by GET /api/dashboard/report
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Format current month & year label for Section 4 (e.g., "November 2026")
  const currentMonthLabel = new Date().toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  // ---------------------------------------------------------------------------
  // Fetch Full System Report from Backend
  // ---------------------------------------------------------------------------
  const fetchSystemReport = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await axiosInstance.get('/dashboard/report');
      const report = response.data?.report || null;
      setReportData(report);
    } catch (error) {
      console.error('Error loading system report:', error);
      const message = error.response?.data?.message || 'Failed to load hospital system report';
      setErrorMessage(message);
      addToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Load report automatically when the page opens
  useEffect(() => {
    fetchSystemReport();
    // eslint-disable-next-line
  }, []);

  // Trigger browser print dialog for university project demo/submission
  const handlePrintReport = () => {
    window.print();
  };

  // Helper to get a medal or rank label for the top 5 busiest wards list
  const getRankLabel = (index) => {
    if (index === 0) return '🥇 #1';
    if (index === 1) return '🥈 #2';
    if (index === 2) return '🥉 #3';
    return `#${index + 1}`;
  };

  // Helper to convert raw equipment status string into a readable label
  const formatEquipmentStatusLabel = (statusValue) => {
    if (statusValue === EQUIPMENT_STATUS.AVAILABLE) return 'Available';
    if (statusValue === EQUIPMENT_STATUS.IN_USE) return 'In Use';
    if (statusValue === EQUIPMENT_STATUS.MAINTENANCE) return 'Maintenance';
    return statusValue || 'Unknown';
  };

  // ---------------------------------------------------------------------------
  // Loading View
  // ---------------------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="dashboard-page">
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📊</div>
          <p style={{ fontSize: '16px', fontWeight: 500 }}>Generating hospital system report...</p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Error View
  // ---------------------------------------------------------------------------
  if (errorMessage || !reportData) {
    return (
      <div className="dashboard-page">
        <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</div>
          <h3 style={{ color: '#0f172a', marginBottom: '8px' }}>Could Not Load Report</h3>
          <p style={{ color: '#64748b', marginBottom: '20px' }}>{errorMessage || 'No report data available.'}</p>
          <button
            type="button"
            className="action-btn"
            style={{ padding: '8px 18px', backgroundColor: '#0284c7', color: '#ffffff' }}
            onClick={fetchSystemReport}
          >
            🔄 Try Again
          </button>
        </div>
      </div>
    );
  }

  // Extract report sections safely with default fallbacks
  const overview = reportData.overview || {};
  const bedBreakdownByWard = Array.isArray(reportData.bedBreakdownByWard) ? reportData.bedBreakdownByWard : [];
  const equipmentBreakdown = Array.isArray(reportData.equipmentBreakdown) ? reportData.equipmentBreakdown : [];
  const monthlyAdmissions = reportData.monthlyAdmissions || {};
  const topFiveBusiestWards = Array.isArray(reportData.topFiveBusiestWards) ? reportData.topFiveBusiestWards : [];
  const wardShortages = Array.isArray(reportData.shortages?.wards) ? reportData.shortages.wards : [];
  const equipmentShortages = Array.isArray(reportData.shortages?.equipment) ? reportData.shortages.equipment : [];

  const formattedGeneratedTime = reportData.generatedAt
    ? new Date(reportData.generatedAt).toLocaleString()
    : new Date().toLocaleString();

  return (
    <div className="dashboard-page">
      {/* Top Action Bar (hidden when printing) */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <button
          type="button"
          className="action-btn"
          style={{ padding: '6px 14px', fontSize: '13px' }}
          onClick={() => navigate('/admin')}
        >
          ← Back to Admin Dashboard
        </button>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="action-btn"
            style={{ padding: '8px 16px', fontSize: '13px', backgroundColor: '#f8fafc' }}
            onClick={fetchSystemReport}
          >
            🔄 Refresh Data
          </button>
          <button
            type="button"
            className="action-btn"
            style={{ padding: '8px 18px', fontSize: '13px', backgroundColor: '#0284c7', color: '#ffffff', borderColor: '#0284c7', fontWeight: 600 }}
            onClick={handlePrintReport}
          >
            🖨️ Print Report
          </button>
        </div>
      </div>

      {/* Report Title Banner */}
      <PageHeader
        title="Hospital System Report"
        subtitle={`Snapshot generated on ${formattedGeneratedTime}`}
        icon="📊"
      />

      {/* =====================================================================
          SECTION 1: HOSPITAL OVERVIEW SUMMARY
          ===================================================================== */}
      <div className="dashboard-section-header">
        <h2 className="dashboard-section-title">
          <span>🏥</span> Section 1: Hospital Overview Summary
        </h2>
      </div>

      <div className="dashboard-cards-grid" style={{ marginBottom: '32px' }}>
        <StatCard
          title="Total Staff Users"
          value={overview.totalUsers || 0}
          icon="👥"
          description="Registered system accounts"
        />
        <StatCard
          title="Active Wards"
          value={overview.totalWards || 0}
          icon="🏥"
          description="Operational clinical units"
        />
        <StatCard
          title="Total Beds"
          value={overview.totalBeds || 0}
          icon="🛏️"
          description={`${overview.availableBeds || 0} available • ${overview.occupiedBeds || 0} occupied`}
        />
        <StatCard
          title="Registered Patients"
          value={overview.totalPatients || 0}
          icon="🗂️"
          description={`${overview.activeAdmissions || 0} currently admitted`}
        />
        <StatCard
          title="Active Alerts"
          value={overview.totalAlerts || 0}
          icon="🚨"
          type={(overview.totalAlerts || 0) > 0 ? 'shortage' : 'available'}
          description={(overview.totalAlerts || 0) > 0 ? 'Thresholds exceeded' : 'All resources normal'}
        />
      </div>

      {/* =====================================================================
          SECTION 2: BED STATUS BREAKDOWN PER WARD
          ===================================================================== */}
      <div className="dashboard-section-header">
        <h2 className="dashboard-section-title">
          <span>🛏️</span> Section 2: Bed Status Breakdown Per Ward ({bedBreakdownByWard.length} Wards)
        </h2>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <DataTable
          columns={['Ward Name', 'Ward Type', 'Available', 'Occupied', 'Maintenance', 'Total Beds', 'Occupancy %']}
          isEmpty={bedBreakdownByWard.length === 0}
          emptyMessage="No active wards found in the system."
        >
          {bedBreakdownByWard.map((ward) => (
            <tr key={ward.wardId}>
              <td style={{ fontWeight: 600, color: '#0f172a' }}>{ward.wardName}</td>
              <td>{ward.wardType}</td>
              <td style={{ color: '#15803d', fontWeight: 600 }}>{ward.available}</td>
              <td style={{ color: '#1d4ed8', fontWeight: 600 }}>{ward.occupied}</td>
              <td style={{ color: '#b45309', fontWeight: 600 }}>{ward.maintenance}</td>
              <td style={{ fontWeight: 700 }}>{ward.total}</td>
              <td>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 700,
                    backgroundColor: ward.occupancyPercent >= 80 ? '#fee2e2' : '#e0f2fe',
                    color: ward.occupancyPercent >= 80 ? '#b91c1c' : '#0369a1'
                  }}
                >
                  {ward.occupancyPercent}%
                </span>
              </td>
            </tr>
          ))}
        </DataTable>
      </div>

      {/* =====================================================================
          SECTION 3: EQUIPMENT STATUS BREAKDOWN PER WARD
          ===================================================================== */}
      <div className="dashboard-section-header">
        <h2 className="dashboard-section-title">
          <span>🔧</span> Section 3: Equipment Breakdown Per Ward ({equipmentBreakdown.length} Records)
        </h2>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <DataTable
          columns={['Ward Name', 'Equipment Name', 'Quantity', 'Status', 'Min Threshold', 'Stock Check']}
          isEmpty={equipmentBreakdown.length === 0}
          emptyMessage="No medical equipment registered yet."
        >
          {equipmentBreakdown.map((item) => (
            <tr key={item.id}>
              <td style={{ fontWeight: 600, color: '#0f172a' }}>{item.wardName}</td>
              <td>{item.equipmentName}</td>
              <td style={{ fontWeight: 700 }}>{item.quantity}</td>
              <td>
                <StatusBadge status={formatEquipmentStatusLabel(item.status)} />
              </td>
              <td>{item.minQuantityThreshold}</td>
              <td>
                {item.isShortage ? (
                  <span style={{ color: '#dc2626', fontWeight: 700, fontSize: '12px' }}>
                    ⚠️ Low Stock Shortage
                  </span>
                ) : (
                  <span style={{ color: '#16a34a', fontWeight: 600, fontSize: '12px' }}>
                    ✅ OK
                  </span>
                )}
              </td>
            </tr>
          ))}
        </DataTable>
      </div>

      {/* =====================================================================
          SECTION 4: THIS MONTH'S ADMISSION SUMMARY
          ===================================================================== */}
      <div className="dashboard-section-header">
        <h2 className="dashboard-section-title">
          <span>🗓️</span> Section 4: Admission Summary — {currentMonthLabel}
        </h2>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}
      >
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '18px' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
            Total Admissions This Month
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', marginTop: '6px' }}>
            {monthlyAdmissions.totalThisMonth || 0}
          </div>
        </div>

        <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', padding: '18px' }}>
          <div style={{ fontSize: '12px', color: '#0369a1', fontWeight: 600, textTransform: 'uppercase' }}>
            Currently Admitted (From Month)
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#0c4a6e', marginTop: '6px' }}>
            {monthlyAdmissions.currentlyAdmitted || 0}
          </div>
        </div>

        <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '18px' }}>
          <div style={{ fontSize: '12px', color: '#15803d', fontWeight: 600, textTransform: 'uppercase' }}>
            Discharged This Month
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#14532d', marginTop: '6px' }}>
            {monthlyAdmissions.dischargedThisMonth || 0}
          </div>
        </div>

        <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '18px' }}>
          <div style={{ fontSize: '12px', color: '#b45309', fontWeight: 600, textTransform: 'uppercase' }}>
            Transferred Out This Month
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#78350f', marginTop: '6px' }}>
            {monthlyAdmissions.transferredThisMonth || 0}
          </div>
        </div>
      </div>

      {/* =====================================================================
          SECTION 5: TOP 5 BUSIEST WARDS BY OCCUPANCY
          ===================================================================== */}
      <div className="dashboard-section-header">
        <h2 className="dashboard-section-title">
          <span>🏆</span> Section 5: Top 5 Busiest Wards (By Bed Occupancy)
        </h2>
      </div>

      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '32px' }}>
        {topFiveBusiestWards.length === 0 ? (
          <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>
            No wards with configured beds found.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {topFiveBusiestWards.map((ward, index) => (
              <div
                key={ward.wardId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  padding: '12px 16px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '220px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', minWidth: '48px' }}>
                    {getRankLabel(index)}
                  </span>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>
                      {ward.wardName}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      {ward.wardType} • {ward.occupiedBeds} / {ward.totalBeds} beds occupied
                    </div>
                  </div>
                </div>

                {/* Simple occupancy progress bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, maxWidth: '320px' }}>
                  <div style={{ flex: 1, height: '10px', backgroundColor: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${ward.occupancyPercent}%`,
                        height: '100%',
                        backgroundColor: ward.occupancyPercent >= 80 ? '#dc2626' : '#0284c7',
                        borderRadius: '999px'
                      }}
                    />
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a', minWidth: '42px', textAlign: 'right' }}>
                    {ward.occupancyPercent}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =====================================================================
          SECTION 6: ACTIVE SHORTAGE ALERTS LOG
          ===================================================================== */}
      <div className="dashboard-section-header">
        <h2 className="dashboard-section-title">
          <span>🚨</span> Section 6: Active Shortage Alerts ({wardShortages.length + equipmentShortages.length})
        </h2>
      </div>

      <div style={{ marginBottom: '24px' }}>
        {wardShortages.length === 0 && equipmentShortages.length === 0 ? (
          <div
            style={{
              padding: '20px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '10px',
              color: '#166534',
              fontSize: '14px',
              fontWeight: 600
            }}
          >
            ✅ All wards and medical equipment quantities are currently above their minimum thresholds.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {/* Ward Bed Shortages */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #fecaca', borderRadius: '10px', padding: '18px' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#991b1b', fontSize: '14px' }}>
                🛏️ Ward Bed Shortages ({wardShortages.length})
              </h4>
              {wardShortages.length === 0 ? (
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>No ward bed shortages detected.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {wardShortages.map((ward) => (
                    <div
                      key={ward.id}
                      style={{
                        padding: '10px 12px',
                        backgroundColor: '#fef2f2',
                        borderRadius: '6px',
                        borderLeft: '3px solid #dc2626',
                        fontSize: '13px',
                        color: '#7f1d1d'
                      }}
                    >
                      <strong>{ward.wardName}</strong>: Only <strong>{ward.availableBeds}</strong> available bed(s) (minimum required: {ward.minBedThreshold})
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Equipment Shortages */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #fecaca', borderRadius: '10px', padding: '18px' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#991b1b', fontSize: '14px' }}>
                🔧 Equipment Shortages ({equipmentShortages.length})
              </h4>
              {equipmentShortages.length === 0 ? (
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>No equipment shortages detected.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {equipmentShortages.map((eq) => (
                    <div
                      key={eq.id}
                      style={{
                        padding: '10px 12px',
                        backgroundColor: '#fef2f2',
                        borderRadius: '6px',
                        borderLeft: '3px solid #dc2626',
                        fontSize: '13px',
                        color: '#7f1d1d'
                      }}
                    >
                      <strong>{eq.equipmentName}</strong> ({eq.wardName}): Only <strong>{eq.quantity}</strong> unit(s) (minimum required: {eq.minQuantityThreshold})
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemReportPage;

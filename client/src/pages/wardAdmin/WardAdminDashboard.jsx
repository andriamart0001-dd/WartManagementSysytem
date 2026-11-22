import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

// Components
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';

// =============================================================================
// WardAdminDashboard.jsx
// =============================================================================
// Purpose:
//   Ward Administrator Dashboard View.
//   Displays live statistics strictly for the Ward Admin's assigned ward,
//   including pending discharge requests, bed availability, and shortage alerts.
// =============================================================================

const WardAdminDashboard = () => {
  // Grab current authenticated ward admin details
  const { user } = useAuth();
  const { addToast } = useToast();
  
  // Dashboard state for ward admin metrics
  const [stats, setStats] = useState({
    assignedWardName: '',
    totalBeds: 0,
    activeAlerts: 0,
    pendingRequests: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // Formatted date string for the student project welcome banner
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  // Fetch metrics from backend endpoints
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const [summaryRes, wardsRes, requestsRes] = await Promise.allSettled([
          axiosInstance.get('/dashboard/summary'),
          axiosInstance.get('/wards'),
          axiosInstance.get('/requests/pending-count')
        ]);

        const summaryData = summaryRes.status === 'fulfilled' ? (summaryRes.value.data?.data || summaryRes.value.data) : {};
        const wardsList = wardsRes.status === 'fulfilled' ? (wardsRes.value.data?.wards || wardsRes.value.data) : [];
        const pendingCount = requestsRes.status === 'fulfilled' ? (requestsRes.value.data?.count || 0) : 0;

        const assignedWard = Array.isArray(wardsList) && wardsList.length > 0 ? wardsList[0].wardName : (user?.assignedWardName || 'Assigned Ward');
        const totalBeds = summaryData.bedStats?.total || summaryData.totalBeds || 0;
        const wardShortageCount = Array.isArray(summaryData.shortages?.wards) ? summaryData.shortages.wards.length : 0;
        const equipShortageCount = Array.isArray(summaryData.shortages?.equipment) ? summaryData.shortages.equipment.length : 0;

        setStats({
          assignedWardName: assignedWard,
          totalBeds,
          activeAlerts: wardShortageCount + equipShortageCount || summaryData.activeAlerts || 0,
          pendingRequests: pendingCount
        });

      } catch (error) {
        console.error('Error fetching ward admin dashboard stats:', error);
        addToast('Failed to load dashboard statistics', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardStats();
  }, [addToast, user?.assignedWardName]);

  return (
    <div className="dashboard-page">
      {/* Top Header */}
      <PageHeader 
        title="Ward Admin Dashboard" 
        subtitle="Ward Operations, Bed Allocations & Resource Management"
        icon="🛌"
      />

      {/* University Project Welcome Banner Strip */}
      <div className="dashboard-welcome-strip">
        <div className="welcome-strip-left">
          <div className="welcome-strip-avatar">🛌</div>
          <div className="welcome-strip-text">
            <h3>Welcome back, {user?.fullName || 'Ward Admin'}</h3>
            <p>
              Ward Administrator • Managing: <strong>{stats.assignedWardName || user?.assignedWardName || 'Ward Unit'}</strong>
            </p>
          </div>
        </div>
        <div className="welcome-strip-right">
          <span>📅 {currentDate}</span>
        </div>
      </div>

      {/* Section 1: KPI Statistics Grid */}
      <div className="dashboard-section-header">
        <h2 className="dashboard-section-title">
          <span>📊</span> Ward Status & Real-Time Metrics
        </h2>
      </div>

      <div className="dashboard-cards-grid" style={{ marginBottom: '32px' }}>
        <StatCard 
          title="Assigned Ward" 
          value={isLoading ? '...' : (stats.assignedWardName || user?.assignedWardName || 'Ward')} 
          icon="🏥" 
          description="Designated clinical care area"
        />
        <StatCard 
          title="Total Ward Beds" 
          value={isLoading ? '...' : stats.totalBeds} 
          icon="🛏️" 
          description="Physical beds configured in ward"
        />
        <StatCard 
          title="Pending Discharges" 
          value={isLoading ? '...' : stats.pendingRequests} 
          icon="📋"
          type={stats.pendingRequests > 0 ? 'maintenance' : 'default'}
          description={stats.pendingRequests > 0 ? 'Doctor clearance pending approval' : 'No pending discharges'}
          to="/ward-admin/requests"
        />
        <StatCard 
          title="Ward Shortages" 
          value={isLoading ? '...' : stats.activeAlerts} 
          icon="🚨"
          type={stats.activeAlerts > 0 ? 'shortage' : 'default'}
          description={stats.activeAlerts > 0 ? 'Resource threshold exceeded' : 'Normal equipment & bed levels'}
          to="/alerts"
        />
      </div>

      {/* Section 2: Ward Operations Categorized */}
      <div className="dashboard-section-header">
        <h2 className="dashboard-section-title">
          <span>🛠️</span> Ward Management Operations
        </h2>
      </div>

      {/* Group 1: Patient Care & Beds */}
      <div className="action-group">
        <div className="action-group-title">
          <span>🛏️</span> Patient Care & Bed Management
        </div>
        <div className="quick-actions-grid">
          <Link 
            to="/ward-admin/requests" 
            className={`quick-action-card ${stats.pendingRequests > 0 ? 'highlight-amber' : ''}`}
          >
            <div className="quick-action-icon">📋</div>
            <div className="quick-action-content">
              <h4>
                Discharge Requests
                {stats.pendingRequests > 0 && (
                  <span className="badge-counter amber">{stats.pendingRequests}</span>
                )}
              </h4>
              <p>Approve or decline doctor discharge orders</p>
            </div>
          </Link>

          <Link to="/ward-admin/beds" className="quick-action-card">
            <div className="quick-action-icon">🛏️</div>
            <div className="quick-action-content">
              <h4>Manage Beds</h4>
              <p>View occupancy grid & set maintenance</p>
            </div>
          </Link>

          <Link to="/ward-admin/sections" className="quick-action-card">
            <div className="quick-action-icon">📂</div>
            <div className="quick-action-content">
              <h4>Ward Sections</h4>
              <p>Organize bays, rooms, and isolation units</p>
            </div>
          </Link>

          <Link to="/admin/patients" className="quick-action-card">
            <div className="quick-action-icon">🗂️</div>
            <div className="quick-action-content">
              <h4>Patient Directory</h4>
              <p>Search all current and discharged patients</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Group 2: Equipment & Audits */}
      <div className="action-group">
        <div className="action-group-title">
          <span>🪛</span> Equipment & History
        </div>
        <div className="quick-actions-grid">
          <Link to="/ward-admin/equipment" className="quick-action-card">
            <div className="quick-action-icon">🪛</div>
            <div className="quick-action-content">
              <h4>Equipment Inventory</h4>
              <p>Quantities, maintenance logs & thresholds</p>
            </div>
          </Link>

          <Link 
            to="/alerts" 
            className={`quick-action-card ${stats.activeAlerts > 0 ? 'highlight-red' : ''}`}
          >
            <div className="quick-action-icon">🚨</div>
            <div className="quick-action-content">
              <h4>
                Shortage Alerts
                {stats.activeAlerts > 0 && (
                  <span className="badge-counter">{stats.activeAlerts}</span>
                )}
              </h4>
              <p>Active bed and equipment shortage logs</p>
            </div>
          </Link>

          <Link to="/ward-admin/transfers" className="quick-action-card">
            <div className="quick-action-icon">🔄</div>
            <div className="quick-action-content">
              <h4>Transfer History</h4>
              <p>Review internal and external ward transfers</p>
            </div>
          </Link>
        </div>
      </div>

    </div>
  );
};

export default WardAdminDashboard;

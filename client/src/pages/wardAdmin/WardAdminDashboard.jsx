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
//   Note: Direct in-page shortage banners have been moved to the top-bar notification
//   bell and Alert Center page to keep the dashboard clean.
// =============================================================================

const WardAdminDashboard = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [stats, setStats] = useState({
    assignedWardName: '',
    totalBeds: 0,
    activeAlerts: 0,
    pendingRequests: 0
  });
  const [isLoading, setIsLoading] = useState(true);

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
      <PageHeader 
        title="Ward Admin Dashboard" 
        subtitle={
          user?.assignedWardName 
            ? `Welcome back, ${user?.fullName}. Managing assigned ward: ${user?.assignedWardName}.`
            : `Welcome back, ${user?.fullName}. Manage your ward's operations and equipment.`
        }
        icon="🛌"
      />

      {/* KPI Cards Grid */}
      <div className="dashboard-cards-grid" style={{ marginBottom: '40px' }}>
        <StatCard 
          title="Assigned Ward" 
          value={isLoading ? '...' : (stats.assignedWardName || user?.assignedWardName || 'Ward')} 
          icon="🏥" 
        />
        <StatCard 
          title="Total Ward Beds" 
          value={isLoading ? '...' : stats.totalBeds} 
          icon="🛏️" 
        />
        <Link to="/ward-admin/requests" style={{ textDecoration: 'none' }}>
          <StatCard 
            title="Pending Discharges" 
            value={isLoading ? '...' : stats.pendingRequests} 
            icon="📋"
            type={stats.pendingRequests > 0 ? 'maintenance' : 'default'}
          />
        </Link>
        <Link to="/alerts" style={{ textDecoration: 'none' }}>
          <StatCard 
            title="Ward Shortages" 
            value={isLoading ? '...' : stats.activeAlerts} 
            icon="🚨"
            type={stats.activeAlerts > 0 ? 'shortage' : 'default'}
          />
        </Link>
      </div>

      {/* Quick Links Section */}
      <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>Ward Management Operations</h2>
      <div className="dashboard-cards-grid">
        <Link to="/ward-admin/requests" style={{ textDecoration: 'none' }}>
          <div className="dash-card" style={{ cursor: 'pointer', borderLeft: stats.pendingRequests > 0 ? '4px solid #f59e0b' : '4px solid #3b82f6' }}>
            <div className="card-header">
              <span className="card-icon">📋</span>
              <h3>Discharge Requests {stats.pendingRequests > 0 && `(${stats.pendingRequests})`}</h3>
            </div>
            <p className="card-description">
              Review doctor discharge requests and authorize patient departure and bed release.
            </p>
          </div>
        </Link>

        <Link to="/ward-admin/beds" style={{ textDecoration: 'none' }}>
          <div className="dash-card" style={{ cursor: 'pointer' }}>
            <div className="card-header">
              <span className="card-icon">🛏️</span>
              <h3>Manage Beds</h3>
            </div>
            <p className="card-description">
              View bed grid, mark beds for maintenance, and check availability.
            </p>
          </div>
        </Link>

        <Link to="/ward-admin/sections" style={{ textDecoration: 'none' }}>
          <div className="dash-card" style={{ cursor: 'pointer' }}>
            <div className="card-header">
              <span className="card-icon">📂</span>
              <h3>Ward Sections</h3>
            </div>
            <p className="card-description">
              Organize beds into bays, isolation rooms, and patient units.
            </p>
          </div>
        </Link>

        <Link to="/ward-admin/equipment" style={{ textDecoration: 'none' }}>
          <div className="dash-card" style={{ cursor: 'pointer' }}>
            <div className="card-header">
              <span className="card-icon">🪛</span>
              <h3>Equipment Inventory</h3>
            </div>
            <p className="card-description">
              Manage medical equipment quantities and log maintenance.
            </p>
          </div>
        </Link>

        <Link to="/alerts" style={{ textDecoration: 'none' }}>
          <div className="dash-card" style={{ cursor: 'pointer', borderLeft: stats.activeAlerts > 0 ? '4px solid #ef4444' : undefined }}>
            <div className="card-header">
              <span className="card-icon">🚨</span>
              <h3>Shortage Alerts {stats.activeAlerts > 0 && `(${stats.activeAlerts})`}</h3>
            </div>
            <p className="card-description">
              View and resolve active shortage alerts and equipment threshold warnings.
            </p>
          </div>
        </Link>
      </div>

    </div>
  );
};

export default WardAdminDashboard;

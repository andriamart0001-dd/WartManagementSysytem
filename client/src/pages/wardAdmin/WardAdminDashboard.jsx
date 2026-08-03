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
//   Fetches live stats from /api/dashboard/summary.
// =============================================================================

const WardAdminDashboard = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [stats, setStats] = useState({
    totalWards: 0,
    totalBeds: 0,
    activeAlerts: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await axiosInstance.get('/dashboard/summary');
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching ward admin dashboard stats:', error);
        addToast('Failed to load dashboard statistics', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardStats();
  }, [addToast]);

  return (
    <div className="dashboard-page">
      <PageHeader 
        title="Ward Admin Dashboard" 
        subtitle={`Welcome back, ${user?.fullName}. Manage your ward's operations and equipment.`}
        icon="🛌"
      />

      {/* KPI Cards Grid */}
      <div className="dashboard-cards-grid" style={{ marginBottom: '40px' }}>
        <StatCard 
          title="Total Wards" 
          value={isLoading ? '...' : stats.totalWards} 
          icon="🏥" 
        />
        <StatCard 
          title="Total Beds" 
          value={isLoading ? '...' : stats.totalBeds} 
          icon="🛏️" 
        />
        <StatCard 
          title="Shortage Alerts" 
          value={isLoading ? '...' : stats.activeAlerts} 
          icon="🚨"
          type={stats.activeAlerts > 0 ? 'shortage' : 'default'}
        />
      </div>

      {/* Quick Links Section */}
      <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>Ward Management</h2>
      <div className="dashboard-cards-grid">
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
      </div>

    </div>
  );
};

export default WardAdminDashboard;

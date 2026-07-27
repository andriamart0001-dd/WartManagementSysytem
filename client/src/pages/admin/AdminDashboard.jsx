import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

// Components
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';

// =============================================================================
// AdminDashboard.jsx
// =============================================================================
// Purpose:
//   System Administrator Dashboard View.
//   Fetches live stats from /api/dashboard/summary.
// =============================================================================

const AdminDashboard = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [stats, setStats] = useState({
    totalUsers: 0,
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
        console.error('Error fetching admin dashboard stats:', error);
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
        title="Admin Dashboard" 
        subtitle={`Welcome back, ${user?.fullName}. Here is the system overview.`}
        icon="👑"
      />

      {/* KPI Cards Grid */}
      <div className="dashboard-cards-grid" style={{ marginBottom: '40px' }}>
        <StatCard 
          title="Total Users" 
          value={isLoading ? '...' : stats.totalUsers} 
          icon="👥" 
        />
        <StatCard 
          title="Active Wards" 
          value={isLoading ? '...' : stats.totalWards} 
          icon="🏥" 
        />
        <StatCard 
          title="Total Beds" 
          value={isLoading ? '...' : stats.totalBeds} 
          icon="🛌" 
        />
        <StatCard 
          title="Shortage Alerts" 
          value={isLoading ? '...' : stats.activeAlerts} 
          icon="🚨"
          type={stats.activeAlerts > 0 ? 'shortage' : 'default'}
        />
      </div>

      {/* Quick Links Section */}
      <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>Quick Management</h2>
      <div className="dashboard-cards-grid">
        <Link to="/admin/users" style={{ textDecoration: 'none' }}>
          <div className="dash-card" style={{ cursor: 'pointer' }}>
            <div className="card-header">
              <span className="card-icon">👥</span>
              <h3>Manage Users</h3>
            </div>
            <p className="card-description">
              Create, edit, and deactivate hospital staff accounts.
            </p>
          </div>
        </Link>

        <Link to="/admin/wards" style={{ textDecoration: 'none' }}>
          <div className="dash-card" style={{ cursor: 'pointer' }}>
            <div className="card-header">
              <span className="card-icon">🏢</span>
              <h3>Manage Wards</h3>
            </div>
            <p className="card-description">
              Configure hospital departments and ward capacities.
            </p>
          </div>
        </Link>
      </div>

    </div>
  );
};

export default AdminDashboard;

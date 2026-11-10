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
//   Note: Shortage alerts and warnings are now centralized in the top notification
//   bell and Alert Center page to keep the dashboard clean.
// =============================================================================

const AdminDashboard = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalWards: 0,
    totalBeds: 0,
    activePatients: 0,
    activeAlerts: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const summaryRes = await axiosInstance.get('/dashboard/summary');
        
        const summaryData = summaryRes.data?.data || summaryRes.data;

        const totalUsers = summaryData.totalUsers || 0;
        const totalWards = summaryData.totalWards || 0;
        const totalBeds = summaryData.bedStats?.total || 0;
        const activePatients = summaryData.totalActiveAdmissions || 0;
        
        const wardShortageCount = Array.isArray(summaryData.shortages?.wards) ? summaryData.shortages.wards.length : 0;
        const equipShortageCount = Array.isArray(summaryData.shortages?.equipment) ? summaryData.shortages.equipment.length : 0;

        setStats({
          totalUsers,
          totalWards,
          totalBeds,
          activePatients,
          activeAlerts: wardShortageCount + equipShortageCount
        });

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
          icon="🛏️" 
        />
        <StatCard 
          title="Admitted Patients" 
          value={isLoading ? '...' : stats.activePatients} 
          icon="🩺" 
        />
        <Link to="/alerts" style={{ textDecoration: 'none' }}>
          <StatCard 
            title="Shortage Alerts" 
            value={isLoading ? '...' : stats.activeAlerts} 
            icon="🚨"
            type={stats.activeAlerts > 0 ? 'shortage' : 'default'}
          />
        </Link>
      </div>

      {/* Quick Action Operations */}
      <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>Administrative Modules</h2>
      <div className="dashboard-cards-grid">
        <Link to="/admin/users" style={{ textDecoration: 'none' }}>
          <div className="dash-card" style={{ cursor: 'pointer' }}>
            <div className="card-header">
              <span className="card-icon">👥</span>
              <h3>Manage Users</h3>
            </div>
            <p className="card-description">
              Create, update, and manage role-based staff accounts and ward assignments.
            </p>
          </div>
        </Link>

        <Link to="/admin/wards" style={{ textDecoration: 'none' }}>
          <div className="dash-card" style={{ cursor: 'pointer' }}>
            <div className="card-header">
              <span className="card-icon">🏥</span>
              <h3>Manage Wards</h3>
            </div>
            <p className="card-description">
              Configure hospital wards, bed thresholds, and assigned specialties.
            </p>
          </div>
        </Link>

        <Link to="/admin/departments" style={{ textDecoration: 'none' }}>
          <div className="dash-card" style={{ cursor: 'pointer' }}>
            <div className="card-header">
              <span className="card-icon">🏢</span>
              <h3>Departments</h3>
            </div>
            <p className="card-description">
              Organize medical departments, clinical disciplines, and facilities.
            </p>
          </div>
        </Link>

        <Link to="/admin/hospitals" style={{ textDecoration: 'none' }}>
          <div className="dash-card" style={{ cursor: 'pointer' }}>
            <div className="card-header">
              <span className="card-icon">🚑</span>
              <h3>External Hospitals</h3>
            </div>
            <p className="card-description">
              Manage partner hospitals and transfer destination directory.
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
              Review and resolve active bed shortages and medical equipment flags.
            </p>
          </div>
        </Link>

        <Link to="/admin/admissions" style={{ textDecoration: 'none' }}>
          <div className="dash-card" style={{ cursor: 'pointer' }}>
            <div className="card-header">
              <span className="card-icon">📜</span>
              <h3>Admission History</h3>
            </div>
            <p className="card-description">
              Search and audit all historical patient stays, admissions, and discharges.
            </p>
          </div>
        </Link>
      </div>

    </div>
  );
};

export default AdminDashboard;

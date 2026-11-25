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
//   System Administrator Dashboard View for the Hospital Ward Management System.
//   Presents high-level hospital statistics, bed occupancy, and quick access
//   to administrative modules (users, wards, departments, and audit logs).
// =============================================================================

const AdminDashboard = () => {
  // Grab current authenticated admin user details
  const { user } = useAuth();
  const { addToast } = useToast();
  
  // Dashboard statistics state
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalWards: 0,
    totalBeds: 0,
    activePatients: 0,
    activeAlerts: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // Formatted date string for the welcome strip
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  // Fetch summary metrics from the backend
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
      {/* Top Header */}
      <PageHeader 
        title="Admin Dashboard" 
        subtitle="Hospital Ward & Resource Management System"
        icon="👑"
      />

      {/* University Project Welcome Banner Strip */}
      <div className="dashboard-welcome-strip">
        <div className="welcome-strip-left">
          <div className="welcome-strip-avatar">👑</div>
          <div className="welcome-strip-text">
            <h3>Welcome back, {user?.fullName || 'Administrator'}</h3>
            <p>System Administrator • Full Hospital Oversight</p>
          </div>
        </div>
        <div className="welcome-strip-right">
          <span>📅 {currentDate}</span>
        </div>
      </div>

      {/* Section 1: KPI Statistics Overview */}
      <div className="dashboard-section-header">
        <h2 className="dashboard-section-title">
          <span>📊</span> Hospital Overview & Live Metrics
        </h2>
      </div>

      <div className="dashboard-cards-grid" style={{ marginBottom: '32px' }}>
        <StatCard 
          title="Total Users" 
          value={isLoading ? '...' : stats.totalUsers} 
          icon="👥"
          description="Registered hospital staff accounts"
        />
        <StatCard 
          title="Active Wards" 
          value={isLoading ? '...' : stats.totalWards} 
          icon="🏥" 
          description="Operational clinical units"
        />
        <StatCard 
          title="Total Beds" 
          value={isLoading ? '...' : stats.totalBeds} 
          icon="🛏️" 
          description="Configured patient beds"
        />
        <StatCard 
          title="Admitted Patients" 
          value={isLoading ? '...' : stats.activePatients} 
          icon="🩺" 
          description="Currently admitted patients"
        />
        <StatCard 
          title="Shortage Alerts" 
          value={isLoading ? '...' : stats.activeAlerts} 
          icon="🚨"
          type={stats.activeAlerts > 0 ? 'shortage' : 'default'}
          description={stats.activeAlerts > 0 ? 'Resource threshold exceeded' : 'All resources normal'}
          to="/alerts"
        />
      </div>

      {/* Section 2: Administrative Modules categorized */}
      <div className="dashboard-section-header">
        <h2 className="dashboard-section-title">
          <span>⚙️</span> Hospital Management Modules
        </h2>
      </div>

      {/* Group 1: Configuration & Accounts */}
      <div className="action-group">
        <div className="action-group-title">
          <span>🏢</span> System Structure & Staff
        </div>
        <div className="quick-actions-grid">
          <Link to="/admin/users" className="quick-action-card">
            <div className="quick-action-icon">👥</div>
            <div className="quick-action-content">
              <h4>Manage Users</h4>
              <p>Staff accounts and role permissions</p>
            </div>
          </Link>

          <Link to="/admin/wards" className="quick-action-card">
            <div className="quick-action-icon">🏥</div>
            <div className="quick-action-content">
              <h4>Manage Wards</h4>
              <p>Wards, capacities and thresholds</p>
            </div>
          </Link>

          <Link to="/admin/departments" className="quick-action-card">
            <div className="quick-action-icon">🏢</div>
            <div className="quick-action-content">
              <h4>Departments</h4>
              <p>Clinical departments & branches</p>
            </div>
          </Link>

          <Link to="/admin/hospitals" className="quick-action-card">
            <div className="quick-action-icon">🚑</div>
            <div className="quick-action-content">
              <h4>External Hospitals</h4>
              <p>Partner transfer network directory</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Group 2: Audits, Logs & Resource Tracking */}
      <div className="action-group">
        <div className="action-group-title">
          <span>📜</span> Monitoring, History & Alerts
        </div>
        <div className="quick-actions-grid">
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
              <p>Bed and equipment threshold alerts</p>
            </div>
          </Link>

          <Link to="/admin/admissions" className="quick-action-card">
            <div className="quick-action-icon">📜</div>
            <div className="quick-action-content">
              <h4>Admission History</h4>
              <p>Audit historical patient records</p>
            </div>
          </Link>

          <Link to="/admin/transfers" className="quick-action-card">
            <div className="quick-action-icon">🔄</div>
            <div className="quick-action-content">
              <h4>Transfer History</h4>
              <p>Internal and external transfer audits</p>
            </div>
          </Link>

          <Link to="/admin/patients" className="quick-action-card">
            <div className="quick-action-icon">🗂️</div>
            <div className="quick-action-content">
              <h4>Patient Directory</h4>
              <p>Complete hospital master patient search</p>
            </div>
          </Link>

          <Link to="/admin/report" className="quick-action-card highlight-blue">
            <div className="quick-action-icon">📊</div>
            <div className="quick-action-content">
              <h4>System Report</h4>
              <p>Printable hospital summary & breakdowns</p>
            </div>
          </Link>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;

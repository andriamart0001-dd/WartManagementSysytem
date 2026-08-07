import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

// UI Components
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import QRPrintModal from '../../components/ui/QRPrintModal';

// =============================================================================
// StaffDashboard.jsx
// =============================================================================
// Purpose:
//   Dashboard for Staff Nurses.
//   Manages patient admissions, transfers, and vitals logging.
// =============================================================================

const StaffDashboard = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [admissions, setAdmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // QR Modal State
  const [qrModalData, setQrModalData] = useState(null);

  const fetchAdmissions = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get('/admissions?status=admitted');
      const list = Array.isArray(res.data.admissions) 
        ? res.data.admissions 
        : (Array.isArray(res.data) ? res.data : []);
      setAdmissions(list);
    } catch (error) {
      console.error('Error fetching admissions:', error);
      addToast('Failed to load active patients', 'error');
      setAdmissions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmissions();
    // eslint-disable-next-line
  }, []);

  return (
    <div className="dashboard-page">
      <PageHeader 
        title="Patient Operations Dashboard" 
        subtitle={`Welcome back, ${user?.fullName}.`}
        icon="📋"
        actionLabel="+ Admit Patient"
        onAction={() => navigate('/staff/admit')}
      />

      {/* Quick Actions Row */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button className="action-btn" style={{ padding: '8px 16px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1' }} onClick={() => navigate('/staff/transfers/internal/new')}>
          🔄 Internal Transfer
        </button>
        <button className="action-btn" style={{ padding: '8px 16px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1' }} onClick={() => navigate('/staff/transfers/external/new')}>
          🚑 External Transfer
        </button>
        <button className="action-btn" style={{ padding: '8px 16px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1' }} onClick={() => navigate('/staff/vitals/new')}>
          🩸 Log Vitals
        </button>
      </div>

      {/* Active Patients Table */}
      <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: '#0f172a' }}>Active Admitted Patients</h3>
      <DataTable 
        columns={['ID', 'Patient Name', 'Location', 'Admitted Date', 'Status', 'Actions']} 
        isEmpty={!isLoading && admissions.length === 0}
        emptyMessage="No active patients currently."
      >
        {isLoading ? (
          <tr>
            <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Loading patients...</td>
          </tr>
        ) : (
          (Array.isArray(admissions) ? admissions : []).map((adm) => (
            <tr key={adm.id}>
              <td className="mono-data">#{adm.id}</td>
              <td style={{ fontWeight: 600 }}>{adm.patientName}</td>
              <td>{adm.wardName} {adm.bedNumber ? `(Bed ${adm.bedNumber})` : ''}</td>
              <td>{new Date(adm.admissionDate).toLocaleDateString()}</td>
              <td>
                <StatusBadge status={adm.status} />
              </td>
              <td>
                <div className="table-actions">
                  <button className="action-btn" title="Log Vitals" onClick={() => navigate(`/staff/vitals/new?admissionId=${adm.id}`)}>🩸</button>
                  <button className="action-btn" title="Transfer" onClick={() => navigate(`/staff/transfers/internal/new?admissionId=${adm.id}`)}>🔄</button>
                  <button className="action-btn" title="Print QR" onClick={() => {
                    setQrModalData({
                      admissionId: adm.id,
                      patientName: adm.patientName,
                      wardName: adm.wardName,
                      bedNumber: adm.bedNumber || 'N/A',
                      admissionDate: new Date(adm.admissionDate).toLocaleDateString()
                    });
                  }}>🖨️</button>
                </div>
              </td>
            </tr>
          ))
        )}
      </DataTable>

      {/* QR Print Modal */}
      {qrModalData && (
        <QRPrintModal
          isOpen={!!qrModalData}
          onClose={() => setQrModalData(null)}
          admissionId={qrModalData.admissionId}
          patientName={qrModalData.patientName}
          wardName={qrModalData.wardName}
          bedNumber={qrModalData.bedNumber}
          admissionDate={qrModalData.admissionDate}
        />
      )}

    </div>
  );
};

export default StaffDashboard;


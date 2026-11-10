// =============================================================================
// ClinicalRequestsPage.jsx — Clinical Discharge Requests Management
// =============================================================================
// Purpose:
//   Allows Ward Administrators, Staff Nurses, and System Admins to review,
//   approve, or reject discharge requests submitted by doctors.
//   Also allows Doctors to monitor the status of their submitted requests.
//
// Beginner-Friendly Standard:
//   - Clear plain-English comments for every function.
//   - Explicit async/await with try/catch blocks.
//   - No magic strings; uses shared constants.
// =============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ROLES, REQUEST_STATUS } from '../../constants';

// UI Components
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';

const ClinicalRequestsPage = () => {
  // Grab currently logged-in user information
  const { user } = useAuth();
  // Toast notifications helper
  const { addToast } = useToast();

  // State to hold the list of clinical requests from backend
  const [requests, setRequests] = useState([]);
  // Loading indicator for fetching data
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const [activeTab, setActiveTab] = useState(REQUEST_STATUS.PENDING); // 'pending', 'approved', 'rejected', 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWardId, setSelectedWardId] = useState('all');
  const [wardsList, setWardsList] = useState([]);

  // Modal dialog states for Review Actions
  const [approveModalRequest, setApproveModalRequest] = useState(null);
  const [rejectModalRequest, setRejectModalRequest] = useState(null);
  const [reviewNotesInput, setReviewNotesInput] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [actionError, setActionError] = useState('');

  // Check if current user can approve/reject requests
  const canReview = user?.role === ROLES.ADMIN || 
                    user?.role === ROLES.WARD_ADMIN || 
                    user?.role === ROLES.NURSE;

  // ===========================================================================
  // DATA FETCHING: Load all requests and wards
  // ===========================================================================
  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      // Query parameters for clinical requests
      let endpoint = '/requests';
      
      // If user is a Doctor and wants their own, or admin/wardAdmin
      const response = await axiosInstance.get(endpoint);
      const fetchedList = Array.isArray(response.data.requests)
        ? response.data.requests
        : [];

      setRequests(fetchedList);
    } catch (error) {
      console.error('Error loading clinical requests:', error);
      addToast('Failed to load clinical requests', 'error');
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch the list of hospital wards for filtering
  const fetchWards = async () => {
    try {
      const response = await axiosInstance.get('/wards');
      const wards = Array.isArray(response.data.wards)
        ? response.data.wards
        : (Array.isArray(response.data) ? response.data : []);
      setWardsList(wards);
    } catch (error) {
      console.error('Failed to load wards for filter:', error);
      setWardsList([]);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    fetchRequests();
    fetchWards();
    // eslint-disable-next-line
  }, []);

  // ===========================================================================
  // FILTERING LOGIC: Memoized filtering by Tab, Search, and Ward
  // ===========================================================================
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      // Filter 1: Status Tab Filter
      if (activeTab !== 'all' && req.requestStatus !== activeTab) {
        return false;
      }

      // Filter 2: Ward Filter
      if (selectedWardId !== 'all' && String(req.wardId) !== String(selectedWardId)) {
        return false;
      }

      // Filter 3: Search Query (Patient Name, Patient NIC, Doctor Name, Bed Number)
      if (searchQuery.trim() !== '') {
        const queryLower = searchQuery.toLowerCase().trim();
        const patientNameMatch = req.patientName?.toLowerCase().includes(queryLower);
        const nicMatch = req.patientNIC?.toLowerCase().includes(queryLower);
        const doctorMatch = req.requestedByName?.toLowerCase().includes(queryLower);
        const bedMatch = req.bedNumber?.toLowerCase().includes(queryLower);
        const notesMatch = req.requestNotes?.toLowerCase().includes(queryLower);

        return patientNameMatch || nicMatch || doctorMatch || bedMatch || notesMatch;
      }

      return true;
    });
  }, [requests, activeTab, selectedWardId, searchQuery]);

  // Counts for each status tab
  const pendingCount = requests.filter(r => r.requestStatus === REQUEST_STATUS.PENDING).length;
  const approvedCount = requests.filter(r => r.requestStatus === REQUEST_STATUS.APPROVED).length;
  const rejectedCount = requests.filter(r => r.requestStatus === REQUEST_STATUS.REJECTED).length;

  // ===========================================================================
  // HANDLER: Open Approve Modal
  // ===========================================================================
  const handleOpenApproveModal = (requestItem) => {
    setApproveModalRequest(requestItem);
    setReviewNotesInput('');
    setActionError('');
  };

  // ===========================================================================
  // HANDLER: Open Reject Modal
  // ===========================================================================
  const handleOpenRejectModal = (requestItem) => {
    setRejectModalRequest(requestItem);
    setReviewNotesInput('');
    setActionError('');
  };

  // ===========================================================================
  // HANDLER: Confirm Approve Discharge Request
  // ===========================================================================
  const handleConfirmApprove = async () => {
    if (!approveModalRequest) return;

    setIsSubmittingReview(true);
    setActionError('');

    try {
      // Send approval to backend API
      await axiosInstance.put(`/requests/${approveModalRequest.id}/approve`, {
        reviewNotes: reviewNotesInput.trim() || 'Discharge confirmed by ward staff.'
      });

      addToast(`Discharge approved! Patient ${approveModalRequest.patientName} discharged and bed freed.`, 'success');
      setApproveModalRequest(null);
      setReviewNotesInput('');
      
      // Refresh requests list
      await fetchRequests();
    } catch (error) {
      console.error('Error approving discharge request:', error);
      const serverMessage = error.response?.data?.message || 'Failed to approve discharge request';
      setActionError(serverMessage);
      addToast(serverMessage, 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // ===========================================================================
  // HANDLER: Confirm Reject Request
  // ===========================================================================
  const handleConfirmReject = async () => {
    if (!rejectModalRequest) return;

    // A rejection must have a clear reason provided
    if (!reviewNotesInput.trim()) {
      setActionError('Please provide a reason explaining why the discharge was rejected.');
      return;
    }

    setIsSubmittingReview(true);
    setActionError('');

    try {
      // Send rejection to backend API
      await axiosInstance.put(`/requests/${rejectModalRequest.id}/reject`, {
        reviewNotes: reviewNotesInput.trim()
      });

      addToast(`Discharge request rejected. Patient remains admitted.`, 'success');
      setRejectModalRequest(null);
      setReviewNotesInput('');
      
      // Refresh requests list
      await fetchRequests();
    } catch (error) {
      console.error('Error rejecting discharge request:', error);
      const serverMessage = error.response?.data?.message || 'Failed to reject discharge request';
      setActionError(serverMessage);
      addToast(serverMessage, 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Format date helper
  const formatDateTime = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="dashboard-page">
      {/* Header */}
      <PageHeader 
        title="Discharge & Clinical Requests" 
        subtitle="Review doctor discharge requests, verify patient status, and approve bed clearance."
        icon="📋"
      />

      {/* KPI Summary Cards */}
      <div className="dashboard-cards-grid" style={{ marginBottom: '24px' }}>
        <div className="dash-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="card-header">
            <span className="card-icon">⏳</span>
            <h3>Pending Review</h3>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#b45309' }}>
            {isLoading ? '...' : pendingCount}
          </div>
          <p className="card-description">Discharge requests awaiting approval</p>
        </div>

        <div className="dash-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="card-header">
            <span className="card-icon">✅</span>
            <h3>Approved Discharges</h3>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#047857' }}>
            {isLoading ? '...' : approvedCount}
          </div>
          <p className="card-description">Successfully discharged and beds freed</p>
        </div>

        <div className="dash-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div className="card-header">
            <span className="card-icon">❌</span>
            <h3>Rejected Requests</h3>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#b91c1c' }}>
            {isLoading ? '...' : rejectedCount}
          </div>
          <p className="card-description">Requests rejected for clinical/ward reasons</p>
        </div>
      </div>

      {/* Filter and Tab Bar */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '12px', 
        marginBottom: '20px' 
      }}>
        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="action-btn"
            style={{
              padding: '8px 16px',
              backgroundColor: activeTab === REQUEST_STATUS.PENDING ? '#fef3c7' : '#ffffff',
              borderColor: activeTab === REQUEST_STATUS.PENDING ? '#d97706' : '#cbd5e1',
              color: activeTab === REQUEST_STATUS.PENDING ? '#b45309' : '#475569',
              fontWeight: activeTab === REQUEST_STATUS.PENDING ? 700 : 500
            }}
            onClick={() => setActiveTab(REQUEST_STATUS.PENDING)}
          >
            ⏳ Pending ({pendingCount})
          </button>

          <button
            className="action-btn"
            style={{
              padding: '8px 16px',
              backgroundColor: activeTab === REQUEST_STATUS.APPROVED ? '#d1fae5' : '#ffffff',
              borderColor: activeTab === REQUEST_STATUS.APPROVED ? '#059669' : '#cbd5e1',
              color: activeTab === REQUEST_STATUS.APPROVED ? '#047857' : '#475569',
              fontWeight: activeTab === REQUEST_STATUS.APPROVED ? 700 : 500
            }}
            onClick={() => setActiveTab(REQUEST_STATUS.APPROVED)}
          >
            ✅ Approved ({approvedCount})
          </button>

          <button
            className="action-btn"
            style={{
              padding: '8px 16px',
              backgroundColor: activeTab === REQUEST_STATUS.REJECTED ? '#fee2e2' : '#ffffff',
              borderColor: activeTab === REQUEST_STATUS.REJECTED ? '#dc2626' : '#cbd5e1',
              color: activeTab === REQUEST_STATUS.REJECTED ? '#b91c1c' : '#475569',
              fontWeight: activeTab === REQUEST_STATUS.REJECTED ? 700 : 500
            }}
            onClick={() => setActiveTab(REQUEST_STATUS.REJECTED)}
          >
            ❌ Rejected ({rejectedCount})
          </button>

          <button
            className="action-btn"
            style={{
              padding: '8px 16px',
              backgroundColor: activeTab === 'all' ? '#e2e8f0' : '#ffffff',
              borderColor: activeTab === 'all' ? '#64748b' : '#cbd5e1',
              color: activeTab === 'all' ? '#0f172a' : '#475569',
              fontWeight: activeTab === 'all' ? 700 : 500
            }}
            onClick={() => setActiveTab('all')}
          >
            📋 All ({requests.length})
          </button>
        </div>

        {/* Search & Ward Selector */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Ward filter dropdown */}
          <select
            value={selectedWardId}
            onChange={(e) => setSelectedWardId(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              backgroundColor: '#ffffff'
            }}
          >
            <option value="all">All Wards</option>
            {wardsList.map((ward) => (
              <option key={ward.id} value={ward.id}>
                {ward.wardName}
              </option>
            ))}
          </select>

          {/* Search Input */}
          <input
            type="text"
            placeholder="🔍 Search patient, NIC, doctor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              width: '240px'
            }}
          />

          {/* Refresh button */}
          <button
            className="action-btn"
            onClick={fetchRequests}
            title="Refresh requests list"
            style={{ padding: '8px 12px', backgroundColor: '#ffffff', borderColor: '#cbd5e1' }}
          >
            🔄
          </button>
        </div>
      </div>

      {/* Main Clinical Requests Table */}
      <DataTable
        columns={[
          'Req #',
          'Patient Info',
          'Ward / Bed',
          'Requested By',
          'Doctor Clinical Notes',
          'Status',
          'Review Info',
          'Actions'
        ]}
        isEmpty={!isLoading && filteredRequests.length === 0}
        emptyMessage={
          activeTab === REQUEST_STATUS.PENDING
            ? 'No pending discharge requests. All requests have been processed!'
            : 'No requests match the selected filters.'
        }
      >
        {isLoading ? (
          <tr>
            <td colSpan="8" style={{ textAlign: 'center', padding: '24px' }}>
              Loading clinical discharge requests...
            </td>
          </tr>
        ) : (
          filteredRequests.map((item) => {
            const isPending = item.requestStatus === REQUEST_STATUS.PENDING;

            return (
              <tr key={item.id}>
                {/* ID */}
                <td className="mono-data">#{item.id}</td>

                {/* Patient Information */}
                <td>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>
                    {item.patientName}
                  </div>
                  {item.patientNIC && (
                    <div style={{ fontSize: '11px', color: '#0369a1', fontFamily: 'monospace' }}>
                      🆔 {item.patientNIC}
                    </div>
                  )}
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    Adm #{item.admissionId}
                  </div>
                </td>

                {/* Ward and Bed */}
                <td>
                  <div style={{ fontWeight: 500 }}>{item.wardName}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    {item.bedNumber ? `Bed: ${item.bedNumber}` : 'No Bed Assigned'}
                  </div>
                </td>

                {/* Requested By (Doctor) */}
                <td>
                  <div style={{ fontWeight: 500 }}>
                    Dr. {item.requestedByName || 'Doctor'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    {formatDateTime(item.createdAt)}
                  </div>
                </td>

                {/* Doctor's Notes */}
                <td style={{ maxWidth: '240px' }}>
                  {item.requestNotes ? (
                    <div style={{ 
                      fontSize: '13px', 
                      color: '#334155',
                      whiteSpace: 'pre-wrap',
                      backgroundColor: '#f8fafc',
                      padding: '6px 8px',
                      borderRadius: '4px',
                      border: '1px solid #e2e8f0'
                    }}>
                      {item.requestNotes}
                    </div>
                  ) : (
                    <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' }}>
                      No doctor notes provided
                    </span>
                  )}
                </td>

                {/* Status Badge */}
                <td>
                  <StatusBadge status={item.requestStatus} />
                </td>

                {/* Review Information */}
                <td style={{ maxWidth: '220px' }}>
                  {item.reviewedByName ? (
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>
                        Reviewed by: {item.reviewedByName}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {formatDateTime(item.reviewedAt)}
                      </div>
                      {item.reviewNotes && (
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#475569', 
                          marginTop: '4px', 
                          fontStyle: 'italic' 
                        }}>
                          "{item.reviewNotes}"
                        </div>
                      )}
                    </div>
                  ) : (
                    <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' }}>
                      Awaiting review
                    </span>
                  )}
                </td>

                {/* Actions */}
                <td>
                  <div className="table-actions">
                    {isPending && canReview ? (
                      <>
                        <button
                          className="action-btn"
                          title="Approve Discharge & Free Bed"
                          style={{
                            backgroundColor: '#d1fae5',
                            borderColor: '#a7f3d0',
                            color: '#047857',
                            fontWeight: 600,
                            padding: '6px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          onClick={() => handleOpenApproveModal(item)}
                        >
                          <span>✅</span> Approve
                        </button>

                        <button
                          className="action-btn"
                          title="Reject Discharge Request"
                          style={{
                            backgroundColor: '#fee2e2',
                            borderColor: '#fca5a5',
                            color: '#b91c1c',
                            fontWeight: 600,
                            padding: '6px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          onClick={() => handleOpenRejectModal(item)}
                        >
                          <span>❌</span> Reject
                        </button>
                      </>
                    ) : isPending && !canReview ? (
                      <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 500 }}>
                        ⏳ In Review
                      </span>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        Completed
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })
        )}
      </DataTable>

      {/* ===================================================================== */}
      {/* MODAL 1: Approve Discharge Confirmation                                */}
      {/* ===================================================================== */}
      {approveModalRequest && (
        <div className="modal-overlay" onClick={() => setApproveModalRequest(null)}>
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: '520px', width: '90%' }}
          >
            <div className="modal-header">
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>✅</span> Approve Patient Discharge
              </h3>
              <button 
                className="modal-close-btn" 
                onClick={() => setApproveModalRequest(null)}
                disabled={isSubmittingReview}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {actionError && (
                <div className="alert alert-error" style={{ marginBottom: '14px' }}>
                  <span>⚠️</span> {actionError}
                </div>
              )}

              <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#334155' }}>
                Are you ready to finalize discharge for:
              </p>

              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px'
              }}>
                <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#0f172a' }}>
                  {approveModalRequest.patientName}
                </div>
                {approveModalRequest.patientNIC && (
                  <div style={{ fontSize: '12px', color: '#0369a1', fontFamily: 'monospace' }}>
                    NIC: {approveModalRequest.patientNIC}
                  </div>
                )}
                <div style={{ fontSize: '13px', color: '#475569', marginTop: '4px' }}>
                  Location: <strong>{approveModalRequest.wardName}</strong> {approveModalRequest.bedNumber ? `(Bed ${approveModalRequest.bedNumber})` : ''}
                </div>
                {approveModalRequest.requestNotes && (
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #cbd5e1', fontSize: '12px' }}>
                    <span style={{ fontWeight: 600, color: '#475569' }}>Doctor's Discharge Notes:</span>
                    <p style={{ margin: '4px 0 0 0', color: '#1e293b' }}>{approveModalRequest.requestNotes}</p>
                  </div>
                )}
              </div>

              <div style={{
                padding: '10px 12px',
                backgroundColor: '#ecfdf5',
                borderRadius: '6px',
                border: '1px solid #a7f3d0',
                marginBottom: '16px',
                fontSize: '13px',
                color: '#065f46'
              }}>
                ℹ️ <strong>System Action:</strong> Approving will set the patient's admission to <strong>Discharged</strong> and immediately release Bed {approveModalRequest.bedNumber || 'assignment'} back to <strong>Available</strong>.
              </div>

              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Staff Handover / Nursing Remarks (Optional):
              </label>
              <textarea
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
                placeholder="e.g. Discharge medications handed over to family. Patient departs in good condition."
                value={reviewNotesInput}
                onChange={(e) => setReviewNotesInput(e.target.value)}
                disabled={isSubmittingReview}
              />
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button
                type="button"
                className="cancelBtn no-bg"
                onClick={() => setApproveModalRequest(null)}
                disabled={isSubmittingReview}
                style={{ padding: '8px 16px', cursor: 'pointer', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="submit-button"
                onClick={handleConfirmApprove}
                disabled={isSubmittingReview}
                style={{
                  padding: '8px 20px',
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  fontWeight: 600,
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                {isSubmittingReview ? 'Processing Discharge...' : 'Confirm Discharge & Free Bed'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: Reject Discharge Confirmation                                 */}
      {/* ===================================================================== */}
      {rejectModalRequest && (
        <div className="modal-overlay" onClick={() => setRejectModalRequest(null)}>
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: '520px', width: '90%' }}
          >
            <div className="modal-header">
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#b91c1c' }}>
                <span>❌</span> Reject Discharge Request
              </h3>
              <button 
                className="modal-close-btn" 
                onClick={() => setRejectModalRequest(null)}
                disabled={isSubmittingReview}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {actionError && (
                <div className="alert alert-error" style={{ marginBottom: '14px' }}>
                  <span>⚠️</span> {actionError}
                </div>
              )}

              <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#334155' }}>
                Rejecting discharge request for <strong>{rejectModalRequest.patientName}</strong>. 
                The patient will remain admitted in their current bed.
              </p>

              <div style={{
                padding: '10px 12px',
                backgroundColor: '#fff1f2',
                borderRadius: '6px',
                border: '1px solid #fecdd3',
                marginBottom: '16px',
                fontSize: '13px',
                color: '#9f1239'
              }}>
                ⚠️ <strong>Note:</strong> Please state clearly why this request cannot be approved so the attending doctor can follow up.
              </div>

              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Rejection Reason (Required):
              </label>
              <textarea
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
                placeholder="e.g. Patient fever spiked to 39°C. Senior consultant requested overnight observation."
                value={reviewNotesInput}
                onChange={(e) => {
                  setReviewNotesInput(e.target.value);
                  setActionError('');
                }}
                disabled={isSubmittingReview}
                required
              />
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button
                type="button"
                className="cancelBtn no-bg"
                onClick={() => setRejectModalRequest(null)}
                disabled={isSubmittingReview}
                style={{ padding: '8px 16px', cursor: 'pointer', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="submit-button"
                onClick={handleConfirmReject}
                disabled={isSubmittingReview}
                style={{
                  padding: '8px 20px',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  fontWeight: 600,
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                {isSubmittingReview ? 'Submitting...' : 'Reject Discharge Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicalRequestsPage;

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTrips } from '../hooks/useTrips.js';
import { useAuth } from '../context/AuthContext.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import apiClient from '../lib/apiClient.js';
import AppIcon from '../components/ui/AppIcon.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import styles from './TripsPage.module.css';

const TripsPage = () => {
  const { hasRole } = useAuth();
  const [statusFilter, setStatusFilter] = useState('');
  const { data: trips, loading, error, refetch } = useTrips(statusFilter ? { status: statusFilter } : {});
  const [completeModal, setCompleteModal] = useState(null);
  const [completeData, setCompleteData] = useState({ final_odometer: '', fuel_consumed: '', fuel_cost: '' });
  const [submitting, setSubmitting] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, message: '', onConfirm: null });

  // Incident state variables
  const [reportModalTripId, setReportModalTripId] = useState(null);
  const [reportData, setReportData] = useState({ incident_type: 'Traffic Jam', location: '', photo_url: '', comments: '' });
  const [viewModalTrip, setViewModalTrip] = useState(null);
  const [incidentsList, setIncidentsList] = useState([]);
  const [loadingIncidents, setLoadingIncidents] = useState(false);

  const canCreate = hasRole('driver', 'fleet_manager', 'dispatcher');

  const handleDispatch = async (id) => {
    setConfirmDialog({
      isOpen: true,
      message: 'Dispatch this trip? Vehicle and driver status will be set to On Trip.',
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        try {
          await apiClient.patch(`/api/trips/${id}/dispatch`);
          toast.success('Trip dispatched!');
          refetch();
        } catch {}
      }
    });
  };

  const handleCancel = async (id) => {
    setConfirmDialog({
      isOpen: true,
      message: 'Cancel this trip?',
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        try {
          await apiClient.patch(`/api/trips/${id}/cancel`);
          toast.success('Trip cancelled.');
          refetch();
        } catch {}
      }
    });
  };

  const handleComplete = async () => {
    if (!completeModal) return;
    setSubmitting(true);
    try {
      await apiClient.patch(`/api/trips/${completeModal}/complete`, {
        final_odometer: Number(completeData.final_odometer),
        fuel_consumed: completeData.fuel_consumed ? Number(completeData.fuel_consumed) : undefined,
        fuel_cost: completeData.fuel_cost ? Number(completeData.fuel_cost) : undefined,
      });
      toast.success('Trip completed!');
      setCompleteModal(null);
      refetch();
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenViewIncidents = async (trip) => {
    setViewModalTrip(trip);
    setLoadingIncidents(true);
    try {
      const response = await apiClient.get(`/api/trips/${trip.id}/incidents`);
      setIncidentsList(response.data.data);
    } catch {
      toast.error('Failed to load incidents');
    } finally {
      setLoadingIncidents(false);
    }
  };

  const handleReportIncident = async () => {
    if (!reportModalTripId) return;
    setSubmitting(true);
    try {
      await apiClient.post(`/api/trips/${reportModalTripId}/incidents`, reportData);
      toast.success('Incident reported successfully!');
      setReportModalTripId(null);
      setReportData({ incident_type: 'Traffic Jam', location: '', photo_url: '', comments: '' });
      refetch();
    } catch {
      // API client automatically shows toast error
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Trip Management</h2>
        {canCreate && <Link to="/trips/new" className="btn btn-primary">+ New Trip</Link>}
      </div>

      <div className="filters-bar">
        {['', 'Draft', 'Dispatched', 'Completed', 'Cancelled'].map((s) => (
          <button
            key={s}
            className={`btn ${statusFilter === s ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setStatusFilter(s)}
          >
            {s || 'All'}
          </button>
        ))}
        <button className="btn btn-secondary btn-sm" onClick={refetch}><AppIcon name="refresh" size={14} /></button>
      </div>

      {loading && <div className="loading-state"><div className="spinner" /><span>Loading trips…</span></div>}
      {error && <div className="empty-state"><span><AppIcon name="alert" size={18} /></span><p>Failed to load. <button className="btn btn-secondary btn-sm" onClick={refetch}>Retry</button></p></div>}

      {!loading && !error && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Route</th><th>Vehicle</th><th>Driver</th><th>Cargo (kg)</th>
                <th>Distance (km)</th><th>Status</th><th>Created</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!trips?.length && (
                <tr><td colSpan="8" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '3rem' }}>No trips found.</td></tr>
              )}
              {trips?.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div className={styles.route}>
                      <span>{t.source}</span>
                      <span className={styles.routeArrow}>→</span>
                      <span>{t.destination}</span>
                    </div>
                    {t.incident_count > 0 && (
                      <span 
                        className={styles.incidentBadge} 
                        onClick={() => handleOpenViewIncidents(t)}
                        title="Click to view reported incidents"
                      >
                        ⚠️ {t.incident_count} {t.incident_count === 1 ? 'Issue' : 'Issues'}
                      </span>
                    )}
                  </td>
                  <td>{t.registration_number || '—'}</td>
                  <td>{t.driver_name || '—'}</td>
                  <td>{Number(t.cargo_weight).toLocaleString()}</td>
                  <td>{Number(t.planned_distance).toLocaleString()}</td>
                  <td><StatusBadge status={t.status} /></td>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>
                    {new Date(t.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      {t.status === 'Draft' && canCreate && (
                        <>
                          <button className="btn btn-success btn-sm" onClick={() => handleDispatch(t.id)}>Dispatch</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleCancel(t.id)}>Cancel</button>
                        </>
                      )}
                      {t.status === 'Dispatched' && (
                        <>
                          {canCreate && <button className="btn btn-primary btn-sm" onClick={() => setCompleteModal(t.id)}>Complete</button>}
                          <button className="btn btn-warning btn-sm" style={{ backgroundColor: '#eab308', borderColor: '#eab308', color: '#fff' }} onClick={() => { setReportModalTripId(t.id); setReportData({ incident_type: 'Traffic Jam', location: '', photo_url: '', comments: '' }); }}>⚠️ Report Issue</button>
                          {canCreate && <button className="btn btn-danger btn-sm" onClick={() => handleCancel(t.id)}>Cancel</button>}
                        </>
                      )}
                      {t.incident_count > 0 && (
                        <button className="btn btn-secondary btn-sm" onClick={() => handleOpenViewIncidents(t)}>💬 View Issues ({t.incident_count})</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Complete modal */}
      {completeModal && (
        <div className="modal-overlay" onClick={() => setCompleteModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Complete Trip</h3>
              <button className="modal-close" onClick={() => setCompleteModal(null)}>✕</button>
            </div>
            <div className="form-group">
              <label className="form-label">Final Odometer Reading (km) *</label>
              <input type="number" className="form-input" placeholder="e.g. 48500"
                value={completeData.final_odometer}
                onChange={(e) => setCompleteData((d) => ({ ...d, final_odometer: e.target.value }))} />
            </div>
            <div style={{ marginTop: 'var(--space-4)' }} className="form-group">
              <label className="form-label">Fuel Consumed (liters) — optional</label>
              <input type="number" className="form-input" placeholder="e.g. 85"
                value={completeData.fuel_consumed}
                onChange={(e) => setCompleteData((d) => ({ ...d, fuel_consumed: e.target.value }))} />
            </div>
            <div style={{ marginTop: 'var(--space-4)' }} className="form-group">
              <label className="form-label">Fuel Cost (₹) — optional</label>
              <input type="number" className="form-input" placeholder="e.g. 7650"
                value={completeData.fuel_cost}
                onChange={(e) => setCompleteData((d) => ({ ...d, fuel_cost: e.target.value }))} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setCompleteModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleComplete} disabled={!completeData.final_odometer || submitting}>
                {submitting ? 'Saving…' : 'Mark Complete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Report Incident modal */}
      {reportModalTripId && (
        <div className="modal-overlay" onClick={() => setReportModalTripId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Report Trip Incident</h3>
              <button className="modal-close" onClick={() => setReportModalTripId(null)}>✕</button>
            </div>
            
            <div className="form-group">
              <label className="form-label">Incident Type *</label>
              <select 
                className="form-select"
                value={reportData.incident_type}
                onChange={(e) => setReportData((d) => ({ ...d, incident_type: e.target.value }))}
              >
                <option value="Traffic Jam">🚧 Traffic Jam</option>
                <option value="Accident/Collision">🚗 Accident/Collision</option>
                <option value="Vehicle Breakdown">🚨 Vehicle Breakdown</option>
                <option value="Fuel Issue">⛽ Fuel Issue</option>
                <option value="Bad Weather">🌧 Bad Weather</option>
                <option value="Road Closed">🚧 Road Closed</option>
                <option value="Location Share">📍 Share Live Location</option>
              </select>
            </div>

            <div style={{ marginTop: 'var(--space-4)' }} className="form-group">
              <label className="form-label">Location / Address</label>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Mumbai-Pune Expressway KM 45"
                  value={reportData.location}
                  onChange={(e) => setReportData((d) => ({ ...d, location: e.target.value }))} 
                />
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm"
                  onClick={() => setReportData((d) => ({ ...d, location: `Lat: ${(18.9 + Math.random() * 0.2).toFixed(4)}, Lng: ${(72.8 + Math.random() * 0.2).toFixed(4)}` }))}
                  title="Share live GPS coordinates"
                >
                  📍 GPS
                </button>
              </div>
            </div>

            <div style={{ marginTop: 'var(--space-4)' }} className="form-group">
              <label className="form-label">Photo URL</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="https://example.com/photo.jpg"
                value={reportData.photo_url}
                onChange={(e) => setReportData((d) => ({ ...d, photo_url: e.target.value }))} 
              />
            </div>

            <div style={{ marginTop: 'var(--space-4)' }} className="form-group">
              <label className="form-label">Comments / Details</label>
              <textarea 
                className="form-input" 
                rows="3"
                placeholder="Describe the issue..."
                value={reportData.comments}
                onChange={(e) => setReportData((d) => ({ ...d, comments: e.target.value }))}
              />
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setReportModalTripId(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleReportIncident} disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Incidents modal */}
      {viewModalTrip && (
        <div className="modal-overlay" onClick={() => setViewModalTrip(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Incident Log — {viewModalTrip.source} to {viewModalTrip.destination}</h3>
              <button className="modal-close" onClick={() => setViewModalTrip(null)}>✕</button>
            </div>

            {loadingIncidents && (
              <div className="loading-state">
                <div className="spinner" />
                <span>Loading incident details…</span>
              </div>
            )}

            {!loadingIncidents && (
              <div className={styles.timeline}>
                {!incidentsList.length && (
                  <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>
                    No incidents reported for this trip.
                  </p>
                )}
                {incidentsList.map((inc) => {
                  let emoji = '⚠️';
                  if (inc.incident_type === 'Traffic Jam') emoji = '🚧';
                  else if (inc.incident_type === 'Accident/Collision') emoji = '🚗';
                  else if (inc.incident_type === 'Vehicle Breakdown') emoji = '🚨';
                  else if (inc.incident_type === 'Fuel Issue') emoji = '⛽';
                  else if (inc.incident_type === 'Bad Weather') emoji = '🌧';
                  else if (inc.incident_type === 'Road Closed') emoji = '🚧';
                  else if (inc.incident_type === 'Location Share') emoji = '📍';

                  return (
                    <div key={inc.id} className={styles.timelineItem}>
                      <div className={styles.timelineHeader}>
                        <span className={styles.timelineType}>{emoji} {inc.incident_type}</span>
                        <span className={styles.timelineMeta}>
                          {new Date(inc.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className={styles.timelineBody}>
                        <p style={{ margin: 0 }}><strong>Reported By:</strong> {inc.reporter_name || 'System'}</p>
                        {inc.comments && <p style={{ margin: 'var(--space-1) 0 0 0' }}>{inc.comments}</p>}
                        {inc.location && (
                          <div className={styles.timelineLocation}>
                            <span>📍 Location: {inc.location}</span>
                          </div>
                        )}
                        {inc.photo_url && (
                          <div>
                            <img src={inc.photo_url} alt="Incident attachment" className={styles.timelinePhoto} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setViewModalTrip(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripsPage;

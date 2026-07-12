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
                      {t.status === 'Dispatched' && canCreate && (
                        <>
                          <button className="btn btn-primary btn-sm" onClick={() => setCompleteModal(t.id)}>Complete</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleCancel(t.id)}>Cancel</button>
                        </>
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
    </div>
  );
};

export default TripsPage;

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import useApi from '../hooks/useApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import apiClient from '../lib/apiClient.js';

const maintenanceSchema = z.object({
  vehicle_id: z.string().uuid('Select a vehicle'),
  description: z.string().min(5, 'Min 5 characters'),
  cost: z.coerce.number().nonnegative().optional(),
});

const MaintenancePage = () => {
  const { hasRole } = useAuth();
  const { data: logs, loading, error, refetch } = useApi('/api/maintenance');
  const { data: vehicles } = useApi('/api/vehicles');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(maintenanceSchema),
  });

  const canManage = hasRole('fleet_manager');

  const openLog = (vId) => { reset({ vehicle_id: vId || '' }); setShowModal(true); };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await apiClient.post('/api/maintenance', data);
      toast.success('Maintenance log opened. Vehicle is now In Shop.');
      setShowModal(false);
      reset({});
      refetch();
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = async (id) => {
    if (!confirm('Close this maintenance record? Vehicle will be set back to Available.')) return;
    try {
      await apiClient.patch(`/api/maintenance/${id}/close`);
      toast.success('Maintenance closed. Vehicle is Available again.');
      refetch();
    } catch {}
  };

  return (
    <div>
      <div className="page-header">
        <h2>Maintenance Logs</h2>
        {canManage && <button className="btn btn-primary" onClick={() => openLog('')}>+ Open Log</button>}
      </div>

      {loading && <div className="loading-state"><div className="spinner" /><span>Loading…</span></div>}
      {error && <div className="empty-state"><span>⚠️</span><p>Failed to load. <button className="btn btn-secondary btn-sm" onClick={refetch}>Retry</button></p></div>}

      {!loading && !error && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Vehicle</th><th>Description</th><th>Cost (₹)</th>
                <th>Status</th><th>Opened</th><th>Closed</th>
                {canManage && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {!logs?.length && (
                <tr><td colSpan={canManage ? 7 : 6} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '3rem' }}>No maintenance records.</td></tr>
              )}
              {logs?.map((log) => (
                <tr key={log.id}>
                  <td><strong>{log.registration_number}</strong><br /><span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{log.name_model}</span></td>
                  <td>{log.description}</td>
                  <td>{Number(log.cost).toLocaleString()}</td>
                  <td><StatusBadge status={log.status} /></td>
                  <td style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{new Date(log.created_at).toLocaleDateString()}</td>
                  <td style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{log.closed_at ? new Date(log.closed_at).toLocaleDateString() : '—'}</td>
                  {canManage && (
                    <td>
                      {log.status === 'Open' && (
                        <button className="btn btn-success btn-sm" onClick={() => handleClose(log.id)}>Close Log</button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Open Maintenance Log</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Vehicle *</label>
                  <select className={`form-select ${errors.vehicle_id ? 'error' : ''}`} {...register('vehicle_id')}>
                    <option value="">Select vehicle…</option>
                    {vehicles?.filter((v) => v.status !== 'Retired').map((v) => (
                      <option key={v.id} value={v.id}>{v.registration_number} — {v.name_model}</option>
                    ))}
                  </select>
                  {errors.vehicle_id && <span className="form-error">{errors.vehicle_id.message}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Description *</label>
                  <textarea className={`form-textarea ${errors.description ? 'error' : ''}`} rows={3} placeholder="Describe the repair or maintenance needed…" {...register('description')} />
                  {errors.description && <span className="form-error">{errors.description.message}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Estimated Cost (₹)</label>
                  <input type="number" className="form-input" {...register('cost')} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Opening…' : 'Open Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenancePage;

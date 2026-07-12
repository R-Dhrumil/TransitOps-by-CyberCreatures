import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useVehicles } from '../hooks/useVehicles.js';
import { useAuth } from '../context/AuthContext.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import apiClient from '../lib/apiClient.js';
import AppIcon from '../components/ui/AppIcon.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import CustomSelect from '../components/ui/CustomSelect.jsx';

const vehicleSchema = z.object({
  registration_number: z.string().min(1, 'Required'),
  name_model: z.string().min(1, 'Required'),
  type: z.string().min(1, 'Required'),
  max_load_capacity: z.coerce.number().positive('Must be positive'),
  acquisition_cost: z.coerce.number().nonnegative('Must be non-negative'),
  odometer: z.coerce.number().nonnegative().optional(),
  region: z.string().optional(),
});

const VEHICLE_TYPES = ['Heavy Truck', 'Medium Truck', 'Light Truck', 'Van', 'Bus', 'Tanker'];

const VehiclesPage = () => {
  const { hasRole } = useAuth();
  const { searchQuery } = useOutletContext() || {};
  const [filters, setFilters] = useState({ status: '', type: '', region: '' });
  const { data: vehicles, loading, error, refetch } = useVehicles(
    Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
  );

  const filteredVehicles = (vehicles || []).filter((v) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (v.registration_number && v.registration_number.toLowerCase().includes(query)) ||
      (v.name_model && v.name_model.toLowerCase().includes(query)) ||
      (v.type && v.type.toLowerCase().includes(query)) ||
      (v.region && v.region.toLowerCase().includes(query))
    );
  });

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, message: '', onConfirm: null });

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(vehicleSchema),
  });

  const openAdd = () => { setEditing(null); reset({}); setShowModal(true); };
  const openEdit = (v) => { setEditing(v); reset({ ...v }); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditing(null); reset({}); };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      if (editing) {
        await apiClient.patch(`/api/vehicles/${editing.id}`, data);
        toast.success('Vehicle updated.');
      } else {
        await apiClient.post('/api/vehicles', data);
        toast.success('Vehicle registered.');
      }
      closeModal();
      refetch();
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetire = async (id) => {
    setConfirmDialog({
      isOpen: true,
      message: 'Retire this vehicle? It will no longer be available for dispatch.',
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        try {
          await apiClient.delete(`/api/vehicles/${id}`);
          toast.success('Vehicle retired.');
          refetch();
        } catch {}
      }
    });
  };

  const canManage = hasRole('fleet_manager');

  return (
    <div>
      <div className="page-header">
        <h2>Vehicle Registry</h2>
        {canManage && <button className="btn btn-primary" onClick={openAdd}>+ Add Vehicle</button>}
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <CustomSelect 
          value={filters.status} 
          onChange={(val) => setFilters((f) => ({ ...f, status: val }))}
          options={[
            { label: 'All Statuses', value: '' },
            { label: 'Available', value: 'Available' },
            { label: 'On Trip', value: 'On Trip' },
            { label: 'In Shop', value: 'In Shop' },
            { label: 'Retired', value: 'Retired' }
          ]}
        />
        <CustomSelect 
          value={filters.type} 
          onChange={(val) => setFilters((f) => ({ ...f, type: val }))}
          options={[
            { label: 'All Types', value: '' },
            ...VEHICLE_TYPES.map(t => ({ label: t, value: t }))
          ]}
        />
        <input className="form-input" placeholder="Region…" value={filters.region} onChange={(e) => setFilters((f) => ({ ...f, region: e.target.value }))} />
        <button className="btn btn-secondary btn-sm" onClick={() => setFilters({ status: '', type: '', region: '' })}>Clear</button>
      </div>

      {loading && <div className="loading-state"><div className="spinner" /><span>Loading vehicles…</span></div>}
      {error && <div className="empty-state"><span><AppIcon name="alert" size={18} /></span><p>Failed to load. <button className="btn btn-secondary btn-sm" onClick={refetch}>Retry</button></p></div>}

      {!loading && !error && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Reg. Number</th><th>Model</th><th>Type</th>
                <th>Max Load (kg)</th><th>Odometer (km)</th><th>Region</th><th>Status</th>
                {canManage && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {!filteredVehicles?.length && (
                <tr><td colSpan={canManage ? 8 : 7} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '3rem' }}>No vehicles found.</td></tr>
              )}
              {filteredVehicles?.map((v) => (
                <tr key={v.id}>
                  <td data-label="Reg. Number"><strong>{v.registration_number}</strong></td>
                  <td data-label="Model">{v.name_model}</td>
                  <td data-label="Type">{v.type}</td>
                  <td data-label="Max Load (kg)">{Number(v.max_load_capacity).toLocaleString()}</td>
                  <td data-label="Odometer (km)">{Number(v.odometer).toLocaleString()}</td>
                  <td data-label="Region">{v.region || '—'}</td>
                  <td data-label="Status"><StatusBadge status={v.status} /></td>
                  {canManage && (
                    <td data-label="Actions" style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(v)}>Edit</button>
                      {v.status !== 'Retired' && (
                        <button className="btn btn-danger btn-sm" onClick={() => handleRetire(v.id)}>Retire</button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Edit Vehicle' : 'Register Vehicle'}</h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Registration Number *</label>
                  <input className={`form-input ${errors.registration_number ? 'error' : ''}`} {...register('registration_number')} disabled={!!editing} />
                  {errors.registration_number && <span className="form-error">{errors.registration_number.message}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Model *</label>
                  <input className={`form-input ${errors.name_model ? 'error' : ''}`} {...register('name_model')} />
                  {errors.name_model && <span className="form-error">{errors.name_model.message}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Type *</label>
                  <select className={`form-select ${errors.type ? 'error' : ''}`} {...register('type')}>
                    <option value="">Select type…</option>
                    {VEHICLE_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                  {errors.type && <span className="form-error">{errors.type.message}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Max Load Capacity (kg) *</label>
                  <input type="number" className={`form-input ${errors.max_load_capacity ? 'error' : ''}`} {...register('max_load_capacity')} />
                  {errors.max_load_capacity && <span className="form-error">{errors.max_load_capacity.message}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Acquisition Cost (₹) *</label>
                  <input type="number" className={`form-input ${errors.acquisition_cost ? 'error' : ''}`} {...register('acquisition_cost')} />
                  {errors.acquisition_cost && <span className="form-error">{errors.acquisition_cost.message}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Odometer (km)</label>
                  <input type="number" className="form-input" {...register('odometer')} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Region</label>
                  <input className="form-input" placeholder="e.g. North, West…" {...register('region')} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving…' : editing ? 'Update Vehicle' : 'Register Vehicle'}
                </button>
              </div>
            </form>
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

export default VehiclesPage;

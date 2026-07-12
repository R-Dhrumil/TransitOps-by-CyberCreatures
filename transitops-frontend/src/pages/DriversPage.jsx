import React, { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useDrivers } from '../hooks/useDrivers.js';
import { useAuth } from '../context/AuthContext.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import apiClient from '../lib/apiClient.js';
import AppIcon from '../components/ui/AppIcon.jsx';
import CustomSelect from '../components/ui/CustomSelect.jsx';

const driverSchema = z.object({
  name: z.string().min(2, 'Min 2 characters'),
  license_number: z.string().min(5, 'Min 5 characters'),
  license_category: z.string().min(2, 'Required'),
  license_expiry_date: z.string().min(1, 'Required'),
  contact_number: z.string().optional(),
  safety_score: z.coerce.number().min(0).max(100).optional(),
  status: z.enum(['Available', 'On Trip', 'Off Duty', 'Suspended', 'Retired']).optional(),
});

const DriversPage = () => {
  const { hasRole } = useAuth();
  const { searchQuery } = useOutletContext() || {};
  const [filters, setFilters] = useState({ status: '' });
  const { data: drivers, loading, error, refetch } = useDrivers(
    Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
  );

  const filteredDrivers = (drivers || []).filter((d) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (d.name && d.name.toLowerCase().includes(query)) ||
      (d.license_number && d.license_number.toLowerCase().includes(query)) ||
      (d.license_category && d.license_category.toLowerCase().includes(query)) ||
      (d.contact_number && d.contact_number.toLowerCase().includes(query))
    );
  });
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    resolver: zodResolver(driverSchema),
  });

  const watchExpiry = watch('license_expiry_date');
  const isExpired = watchExpiry && new Date(watchExpiry) < new Date(new Date().setHours(0,0,0,0));

  const openAdd = () => { setEditing(null); reset({}); setShowModal(true); };
  const openEdit = (d) => { setEditing(d); reset({ ...d, license_expiry_date: d.license_expiry_date?.slice(0, 10) }); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditing(null); reset({}); };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      if (editing) {
        await apiClient.patch(`/api/drivers/${editing.id}`, data);
        toast.success('Driver updated.');
      } else {
        await apiClient.post('/api/drivers', data);
        toast.success('Driver added.');
      }
      closeModal();
      refetch();
    } finally {
      setSubmitting(false);
    }
  };

  const canManage = hasRole('safety_officer', 'fleet_manager', 'dispatcher');
  const today = new Date();

  const getLicenseStatus = (driver) => {
    const expiry = new Date(driver.license_expiry_date);
    const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return { label: 'EXPIRED', color: 'var(--color-danger)' };
    if (daysLeft <= 30) return { label: `${daysLeft}d left`, color: 'var(--color-warning)' };
    return { label: expiry.toLocaleDateString(), color: 'var(--color-text-secondary)' };
  };

  return (
    <div>
      <div className="page-header">
        <h2>Driver Management</h2>
        {canManage && <button className="btn btn-primary" onClick={openAdd}>+ Add Driver</button>}
      </div>

      <div className="filters-bar">
        <CustomSelect 
          value={filters.status} 
          onChange={(val) => setFilters({ status: val })}
          options={[
            { label: 'All Statuses', value: '' },
            { label: 'Available', value: 'Available' },
            { label: 'On Trip', value: 'On Trip' },
            { label: 'Off Duty', value: 'Off Duty' },
            { label: 'Suspended', value: 'Suspended' },
            { label: 'Retired', value: 'Retired' }
          ]}
        />
        <button className="btn btn-secondary btn-sm" onClick={() => setFilters({ status: '' })}>Clear</button>
      </div>

      {loading && <div className="loading-state"><div className="spinner" /><span>Loading drivers…</span></div>}
      {error && <div className="empty-state"><span><AppIcon name="alert" size={18} /></span><p>Failed to load. <button className="btn btn-secondary btn-sm" onClick={refetch}>Retry</button></p></div>}

      {!loading && !error && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th><th>License No.</th><th>Category</th>
                <th>Expiry</th><th>Safety Score</th><th>Contact</th><th>Status</th>
                {canManage && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {!filteredDrivers?.length && (
                <tr><td colSpan={canManage ? 8 : 7} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '3rem' }}>No drivers found.</td></tr>
              )}
              {filteredDrivers?.map((d) => {
                const licSt = getLicenseStatus(d);
                return (
                  <tr key={d.id}>
                    <td data-label="Name"><strong>{d.name}</strong></td>
                    <td data-label="License No.">{d.license_number}</td>
                    <td data-label="Category">{d.license_category}</td>
                    <td data-label="Expiry" style={{ color: licSt.color, fontWeight: licSt.label === 'EXPIRED' ? 700 : 400 }}>{licSt.label}</td>
                    <td data-label="Safety Score">
                      <span style={{ color: d.safety_score >= 90 ? 'var(--color-success)' : d.safety_score >= 70 ? 'var(--color-warning)' : 'var(--color-danger)', fontWeight: 600 }}>
                        {d.safety_score}/100
                      </span>
                    </td>
                    <td data-label="Contact">{d.contact_number || '—'}</td>
                    <td data-label="Status"><StatusBadge status={d.status} /></td>
                     {canManage && (
                      <td data-label="Actions">
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(d)}>Edit</button>
                          {d.status === 'Available' && (
                            <Link to={`/trips/new?driver_id=${d.id}`} className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>
                              Assign Trip
                            </Link>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Edit Driver' : 'Add Driver'}</h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className={`form-input ${errors.name ? 'error' : ''}`} {...register('name')} />
                  {errors.name && <span className="form-error">{errors.name.message}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">License Number *</label>
                  <input className={`form-input ${errors.license_number ? 'error' : ''}`} {...register('license_number')} disabled={!!editing} />
                  {errors.license_number && <span className="form-error">{errors.license_number.message}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">License Category *</label>
                  <select className={`form-select ${errors.license_category ? 'error' : ''}`} {...register('license_category')}>
                    <option value="">Select…</option>
                    <option>HMV</option><option>LMV</option><option>HPMV</option><option>PSV</option>
                  </select>
                  {errors.license_category && <span className="form-error">{errors.license_category.message}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">License Expiry *</label>
                  <input type="date" className={`form-input ${errors.license_expiry_date ? 'error' : ''}`} {...register('license_expiry_date')} />
                  {errors.license_expiry_date && <span className="form-error">{errors.license_expiry_date.message}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Safety Score (0–100)</label>
                  <input type="number" min="0" max="100" className="form-input" {...register('safety_score')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Number</label>
                  <input className="form-input" {...register('contact_number')} />
                </div>
                {editing && (
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Status</label>
                    <select className="form-select" {...register('status')}>
                      <option value="Available" disabled={isExpired}>Available {isExpired ? '(Expired)' : ''}</option>
                      <option value="On Trip">On Trip</option>
                      <option value="Off Duty">Off Duty</option>
                      <option value="Suspended">Suspended</option>
                      <option value="Retired">Retired</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving…' : editing ? 'Update Driver' : 'Add Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriversPage;

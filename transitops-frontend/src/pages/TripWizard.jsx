import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useVehicles } from '../hooks/useVehicles.js';
import { useDrivers } from '../hooks/useDrivers.js';
import apiClient from '../lib/apiClient.js';
import styles from './TripWizard.module.css';

const STEPS = ['Route', 'Vehicle', 'Driver', 'Cargo'];

const schema = z.object({
  source: z.string().min(1, 'Origin required'),
  destination: z.string().min(1, 'Destination required'),
  vehicle_id: z.string().uuid('Select a vehicle'),
  driver_id: z.string().uuid('Select a driver'),
  cargo_weight: z.coerce.number().positive('Must be positive'),
  planned_distance: z.coerce.number().positive('Must be positive'),
});

const TripWizard = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const { data: vehicles } = useVehicles({ status: 'Available' });
  const { data: drivers } = useDrivers({ status: 'Available' });

  const { register, handleSubmit, watch, trigger, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const selectedVehicleId = watch('vehicle_id');
  const selectedVehicle = vehicles?.find((v) => v.id === selectedVehicleId);

  const stepFields = [
    ['source', 'destination'],
    ['vehicle_id'],
    ['driver_id'],
    ['cargo_weight', 'planned_distance'],
  ];

  const next = async () => {
    const valid = await trigger(stepFields[step]);
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await apiClient.post('/api/trips', data);
      toast.success('Trip created as Draft. You can now dispatch it from the Trips page.');
      navigate('/trips');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h2>New Trip</h2>
          <p>Create a trip in 4 steps</p>
        </div>

        {/* Progress */}
        <div className={styles.progress}>
          {STEPS.map((s, i) => (
            <div key={s} className={`${styles.step} ${i <= step ? styles.active : ''} ${i < step ? styles.done : ''}`}>
              <div className={styles.stepNum}>{i < step ? '✓' : i + 1}</div>
              <span className={styles.stepLabel}>{s}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Step 0: Route */}
          {step === 0 && (
            <div className={styles.stepContent}>
              <h3>Where is this trip going?</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Origin *</label>
                  <input className={`form-input ${errors.source ? 'error' : ''}`} placeholder="e.g. Mumbai" {...register('source')} />
                  {errors.source && <span className="form-error">{errors.source.message}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Destination *</label>
                  <input className={`form-input ${errors.destination ? 'error' : ''}`} placeholder="e.g. Pune" {...register('destination')} />
                  {errors.destination && <span className="form-error">{errors.destination.message}</span>}
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Vehicle */}
          {step === 1 && (
            <div className={styles.stepContent}>
              <h3>Select an available vehicle</h3>
              {errors.vehicle_id && <p className="form-error" style={{ marginBottom: 'var(--space-3)' }}>{errors.vehicle_id.message}</p>}
              <div className={styles.selectGrid}>
                {!vehicles?.length && <p style={{ color: 'var(--color-text-muted)' }}>No available vehicles.</p>}
                {vehicles?.map((v) => (
                  <label key={v.id} className={styles.selectCard}>
                    <input type="radio" value={v.id} {...register('vehicle_id')} />
                    <div className={styles.selectCardContent}>
                      <strong>{v.registration_number}</strong>
                      <span>{v.name_model}</span>
                      <span className={styles.selectCardMeta}>Max {Number(v.max_load_capacity).toLocaleString()} kg · {v.type}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Driver */}
          {step === 2 && (
            <div className={styles.stepContent}>
              <h3>Select an available driver</h3>
              {errors.driver_id && <p className="form-error" style={{ marginBottom: 'var(--space-3)' }}>{errors.driver_id.message}</p>}
              <div className={styles.selectGrid}>
                {!drivers?.length && <p style={{ color: 'var(--color-text-muted)' }}>No available drivers.</p>}
                {drivers?.map((d) => {
                  const expiry = new Date(d.license_expiry_date);
                  const expired = expiry < new Date();
                  return (
                    <label key={d.id} className={`${styles.selectCard} ${expired ? styles.disabled : ''}`}>
                      <input type="radio" value={d.id} {...register('driver_id')} disabled={expired} />
                      <div className={styles.selectCardContent}>
                        <strong>{d.name}</strong>
                        <span>{d.license_category} · Score: {d.safety_score}/100</span>
                        <span className={styles.selectCardMeta} style={{ color: expired ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
                          Exp: {expiry.toLocaleDateString()} {expired ? '⚠️ EXPIRED' : ''}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Cargo */}
          {step === 3 && (
            <div className={styles.stepContent}>
              <h3>Cargo & Distance</h3>
              {selectedVehicle && (
                <div className={styles.capacityHint}>
                  Vehicle max capacity: <strong>{Number(selectedVehicle.max_load_capacity).toLocaleString()} kg</strong>
                </div>
              )}
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Cargo Weight (kg) *</label>
                  <input type="number" className={`form-input ${errors.cargo_weight ? 'error' : ''}`} {...register('cargo_weight')} />
                  {errors.cargo_weight && <span className="form-error">{errors.cargo_weight.message}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Planned Distance (km) *</label>
                  <input type="number" className={`form-input ${errors.planned_distance ? 'error' : ''}`} {...register('planned_distance')} />
                  {errors.planned_distance && <span className="form-error">{errors.planned_distance.message}</span>}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className={styles.nav}>
            <button type="button" className="btn btn-secondary" onClick={step === 0 ? () => navigate('/trips') : prev}>
              {step === 0 ? '← Back' : '← Previous'}
            </button>
            {step < STEPS.length - 1 ? (
              <button type="button" className="btn btn-primary" onClick={next}>Next →</button>
            ) : (
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Creating…' : '🚀 Create Trip'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default TripWizard;

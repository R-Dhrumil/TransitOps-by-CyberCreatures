import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useTrips } from '../hooks/useTrips.js';
import { useVehicles } from '../hooks/useVehicles.js';
import { useDrivers } from '../hooks/useDrivers.js';
import { useAuth } from '../context/AuthContext.jsx';
import apiClient from '../lib/apiClient.js';
import AppIcon from '../components/ui/AppIcon.jsx';
import styles from './TripsPage.module.css';

const schema = z.object({
  source: z.string().min(1, 'Origin required'),
  destination: z.string().min(1, 'Destination required'),
  vehicle_id: z.string().uuid('Select a vehicle'),
  driver_id: z.string().uuid('Select a driver'),
  cargo_weight: z.coerce.number().positive('Must be positive'),
  planned_distance: z.coerce.number().positive('Must be positive'),
});

const TripsPage = () => {
  const { hasRole } = useAuth();
  const { searchQuery } = useOutletContext() || {};
  
  const { data: trips, refetch: refetchTrips } = useTrips({});
  const { data: vehicles } = useVehicles({ status: 'Available' });
  const { data: drivers } = useDrivers({ status: 'Available' });

  const [submitting, setSubmitting] = useState(false);
  const [boardFilter, setBoardFilter] = useState('Active'); // Active or All

  const canCreate = hasRole('driver', 'fleet_manager', 'dispatcher');

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema)
  });

  const onSubmitDraft = async (data) => {
    setSubmitting(true);
    try {
      await apiClient.post('/api/trips', data);
      toast.success('Draft saved successfully.');
      reset();
      refetchTrips();
    } catch (err) {
      // API client handles toast
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmitDispatch = async (data) => {
    setSubmitting(true);
    try {
      const res = await apiClient.post('/api/trips', data);
      const newTrip = res.data.data;
      await apiClient.patch(`/api/trips/${newTrip.id}/dispatch`);
      toast.success('Trip dispatched successfully!');
      reset();
      refetchTrips();
    } catch (err) {
      // API client handles toast
    } finally {
      setSubmitting(false);
    }
  };

  // Filter trips for the Live Board
  const activeTrips = (trips || []).filter((trip) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesSearch = (trip.trip_number?.toLowerCase().includes(q) || trip.source?.toLowerCase().includes(q) || trip.destination?.toLowerCase().includes(q));
      if (!matchesSearch) return false;
    }
    if (boardFilter === 'Active') {
      return trip.status === 'Dispatched';
    }
    return true; // All
  });

  // Helper to generate visual flair for progress based on ID length or character codes
  const getSimulatedProgress = (tripId) => {
    if (!tripId) return { pct: 0, str: '0%' };
    const num = tripId.charCodeAt(0) + tripId.charCodeAt(tripId.length - 1);
    const pct = num % 100;
    return { pct, str: `${pct}%` };
  };

  return (
    <div className={styles.pageLayout}>
      
      {/* LEFT PANEL: New Dispatch Order */}
      <div className={styles.formCard}>
        <div className={styles.formHeader}>
          <h2 className={styles.formTitle}>New Dispatch Order</h2>
          <span className={styles.draftBadge}>Draft</span>
        </div>

        <div className={styles.formBody}>
          <div className={styles.stepper}>
            <div className={styles.stepperFill} style={{ width: '10%' }}></div>
            <div className={`${styles.step} ${styles.active}`}>
              <div className={styles.stepDot}></div>
              <span className={styles.stepLabel}>Draft</span>
            </div>
            <div className={styles.step}>
              <div className={styles.stepDot}></div>
              <span className={styles.stepLabel}>Dispatched</span>
            </div>
            <div className={styles.step}>
              <div className={styles.stepDot}></div>
              <span className={styles.stepLabel}>Completed</span>
            </div>
          </div>

          <form id="dispatchForm" onSubmit={handleSubmit(onSubmitDraft)}>
            {/* Routing Details */}
            <div className={styles.sectionTitle}>Routing Details</div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Source Location</label>
              <div className={styles.inputWrapper}>
                <AppIcon name="mapPin" size={16} className={styles.inputIcon} />
                <input 
                  type="text" 
                  className={styles.customInput} 
                  placeholder="Warehouse Alpha, Sector 4"
                  {...register('source')}
                />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Destination</label>
              <div className={styles.inputWrapper}>
                <AppIcon name="mapPin" size={16} className={styles.inputIcon} />
                <input 
                  type="text" 
                  className={styles.customInput} 
                  placeholder="Distribution Hub Beta"
                  {...register('destination')}
                />
              </div>
            </div>

            {/* Asset Assignment */}
            <div className={styles.sectionTitle} style={{ marginTop: 'var(--space-2)' }}>Asset Assignment</div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <div className={styles.labelRow}>
                  <label className={styles.formLabel}>Vehicle</label>
                  <span className={styles.availableCount}>{vehicles?.length || 0} Available</span>
                </div>
                <select className={styles.customSelect} {...register('vehicle_id')}>
                  <option value="">Select Available Vehicle...</option>
                  {vehicles?.map(v => (
                    <option key={v.id} value={v.id}>{v.registration_number}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <div className={styles.labelRow}>
                  <label className={styles.formLabel}>Driver</label>
                  <span className={styles.availableCount}>{drivers?.length || 0} Available</span>
                </div>
                <select className={styles.customSelect} {...register('driver_id')}>
                  <option value="">Select Available Driver...</option>
                  {drivers?.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Load Metrics */}
            <div className={styles.sectionTitle} style={{ marginTop: 'var(--space-2)' }}>Load Metrics</div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Cargo Weight (lbs)</label>
                <input 
                  type="number" 
                  step="0.01"
                  className={styles.customInput} 
                  style={{ paddingLeft: 'var(--space-3)' }}
                  placeholder="0.00"
                  {...register('cargo_weight')}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Planned Distance (mi)</label>
                <input 
                  type="number" 
                  step="0.1"
                  className={styles.customInput} 
                  style={{ paddingLeft: 'var(--space-3)' }}
                  placeholder="0.0"
                  {...register('planned_distance')}
                />
              </div>
            </div>
            
            {/* Show any validation errors at the bottom */}
            {Object.keys(errors).length > 0 && (
              <div style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-xs)', marginTop: 'var(--space-2)' }}>
                Please fill all required fields correctly.
              </div>
            )}
          </form>
        </div>

        <div className={styles.formActions}>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={handleSubmit(onSubmitDraft)}
            disabled={submitting || !canCreate}
          >
            Save Draft
          </button>
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={handleSubmit(onSubmitDispatch)}
            disabled={submitting || !canCreate}
          >
            <AppIcon name="rocket" size={14} /> Dispatch Trip
          </button>
        </div>
      </div>

      {/* RIGHT PANEL: Live Board */}
      <div className={styles.boardPanel}>
        <div className={styles.boardHeader}>
          <div className={styles.boardTitle}>
            <h2>Live Board</h2>
            <p>Monitoring {activeTrips.length} {boardFilter === 'Active' ? 'Active Dispatches' : 'Total Trips'}</p>
          </div>
          <div className={styles.boardControls}>
            <button 
              className={styles.iconBtn} 
              title="View Active Only"
              onClick={() => setBoardFilter('Active')}
              style={{ background: boardFilter === 'Active' ? 'var(--color-bg-hover)' : '' }}
            >
              <AppIcon name="filter" size={16} />
            </button>
            <button 
              className={styles.iconBtn} 
              title="View All"
              onClick={() => setBoardFilter('All')}
              style={{ background: boardFilter === 'All' ? 'var(--color-bg-hover)' : '' }}
            >
              <AppIcon name="menu" size={16} />
            </button>
          </div>
        </div>

        <div className={styles.boardList}>
          {activeTrips.length === 0 && (
            <div className="empty-state">
              <AppIcon name="alert" size={24} />
              <p>No trips found.</p>
            </div>
          )}
          {activeTrips.map(trip => {
            const { pct, str } = getSimulatedProgress(trip.id);
            const distDone = Math.floor((trip.planned_distance || 0) * (pct / 100));
            
            let statusClass = styles.inTransit;
            let displayStatus = 'IN TRANSIT';
            let etaText = `ETA: ${new Date(Date.now() + 1000 * 60 * 60 * 2).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
            
            if (trip.status === 'Draft') {
              displayStatus = 'DRAFT';
              statusClass = styles.loading;
              etaText = 'NOT STARTED';
            } else if (trip.status === 'Completed') {
              displayStatus = 'COMPLETED';
              statusClass = styles.unloading;
              etaText = 'ARRIVED';
            } else if (trip.status === 'Cancelled') {
              displayStatus = 'CANCELLED';
              statusClass = styles.loading;
              etaText = 'CANCELLED';
            } else {
              // Simulated dynamic status based on %
              if (pct < 15) { displayStatus = 'LOADING'; statusClass = styles.loading; etaText = 'Wait: 45m'; }
              else if (pct > 90) { displayStatus = 'UNLOADING'; statusClass = styles.unloading; etaText = 'ETA: ARRIVED'; }
            }

            return (
              <div key={trip.id} className={styles.dispatchCard}>
                <div className={styles.cardTop}>
                  <div className={styles.cardInfo}>
                    <div className={styles.truckIconWrapper}>
                      <AppIcon name="truck" size={18} />
                    </div>
                    <div>
                      <h4 className={styles.tripId}>{trip.trip_number || trip.id.split('-')[0].toUpperCase()}</h4>
                      <p className={styles.tripMeta}>
                        Driver: {trip.driver_name?.split(' ')[0] || 'Unassigned'} • Asset: {trip.registration_number || 'TBD'}
                      </p>
                    </div>
                  </div>
                  <div className={styles.cardStatus}>
                    <span className={`${styles.statusText} ${statusClass}`}>{displayStatus}</span>
                    <span className={styles.timeMeta}>{etaText}</span>
                  </div>
                </div>

                <div className={styles.cardMiddle}>
                  <div className={styles.locationCol}>
                    <span className={styles.locationLabel}>Origin</span>
                    <span className={styles.locationName}>{trip.source}</span>
                  </div>
                  <div className={`${styles.locationCol} ${styles.right}`}>
                    <span className={styles.locationLabel}>Destination</span>
                    <span className={styles.locationName}>{trip.destination}</span>
                  </div>
                </div>

                <div className={styles.cardBottom}>
                  <span>{trip.status === 'Draft' ? '0%' : str}</span>
                  <div className={styles.progressBarContainer}>
                    <div 
                      className={`${styles.progressBarFill} ${statusClass}`} 
                      style={{ width: trip.status === 'Draft' ? '0%' : str }} 
                    />
                  </div>
                  <span>
                    {trip.status === 'Draft' ? '0' : distDone}mi
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TripsPage;

import React from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useDashboard } from '../hooks/useDashboard.js';
import { useTrips } from '../hooks/useTrips.js';
import styles from './DashboardPage.module.css';

const STATUS_MAP = {
  on_trip: { label: 'ON TRIP', className: 'ontrip' },
  dispatched: { label: 'DISPATCHED', className: 'dispatched' },
  completed: { label: 'COMPLETED', className: 'completed' },
  draft: { label: 'DRAFT', className: 'draft' },
  cancelled: { label: 'CANCELLED', className: 'cancelled' },
};

const DashboardPage = () => {
  const { searchQuery } = useOutletContext() || {};
  const { data: dashboardData, loading: dashLoading, error: dashError, refetch: refetchDash } = useDashboard();
  const { data: tripsData, loading: tripsLoading, error: tripsError, refetch: refetchTrips } = useTrips();

  const handleRefresh = () => {
    refetchDash();
    refetchTrips();
  };

  if (dashLoading || tripsLoading) return (
    <div className="loading-state"><div className="spinner" /><span>Loading dashboard…</span></div>
  );
  if (dashError || tripsError) return (
    <div className="empty-state"><span>⚠️</span><p>Failed to load dashboard. <button className="btn btn-secondary btn-sm" onClick={handleRefresh}>Retry</button></p></div>
  );

  const v = dashboardData?.vehicles || {};
  const d = dashboardData?.drivers || {};
  const t = dashboardData?.trips || {};
  const utilization = dashboardData?.fleet_utilization_percent ?? 0;
  const totalVehicles = v.total || 100;
  const activeCount = v.on_trip ?? 0;
  const availableCount = v.available ?? 0;
  const maintCount = v.in_maintenance ?? 0;
  const activePct = totalVehicles > 0 ? Math.round((activeCount / totalVehicles) * 100) : 0;
  const availPct = totalVehicles > 0 ? Math.round((availableCount / totalVehicles) * 100) : 0;
  const maintPct = totalVehicles > 0 ? Math.round((maintCount / totalVehicles) * 100) : 0;

  const filteredTrips = (tripsData || []).filter((trip) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (trip.trip_number && trip.trip_number.toLowerCase().includes(query)) ||
      (trip.source && trip.source.toLowerCase().includes(query)) ||
      (trip.destination && trip.destination.toLowerCase().includes(query)) ||
      (trip.driver_name && trip.driver_name.toLowerCase().includes(query)) ||
      (trip.vehicle_number && trip.vehicle_number.toLowerCase().includes(query)) ||
      (trip.vehicle && trip.vehicle.toLowerCase().includes(query)) ||
      (trip.driver && trip.driver.toLowerCase().includes(query))
    );
  });

  const recentTrips = filteredTrips.slice(0, 5);

  const pad = (n) => String(n ?? 0).padStart(2, '0');

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Live Operations Dashboard</h2>
          <p className={styles.subtitle}>Real-time overview of fleet, trips, and personnel.</p>
        </div>
        <div className={styles.sysStatus}>
          <span className={styles.sysDot} />
          SYS.ONLINE
        </div>
      </div>

      {/* KPI Row */}
      <div className={styles.kpiRow}>
        <div className={`${styles.kpiCard} ${styles.activeVehCard}`}>
          <span className={styles.kpiLabel}>ACTIVE VEH</span>
          <span className={styles.kpiValue}>{pad(activeCount)}</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>AVAILABLE</span>
          <span className={styles.kpiValue}>{pad(availableCount)}</span>
        </div>
        <div className={`${styles.kpiCard} ${styles.maintenanceCard}`}>
          <span className={styles.kpiLabel}>MAINTENANCE</span>
          <span className={styles.kpiValue}>{pad(maintCount)}</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>ACTIVE TRIPS</span>
          <span className={styles.kpiValue}>{pad(t.active)}</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>PENDING</span>
          <span className={styles.kpiValue}>{pad(t.pending)}</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>DRIVERS DUTY</span>
          <span className={styles.kpiValue}>{pad(d.on_trip)}</span>
        </div>

        {/* Utilization donut */}
        <div className={`${styles.kpiCard} ${styles.utilizationCard}`}>
          <div className={styles.utilizationCircle}>
            <svg viewBox="0 0 36 36" className={styles.circularChart}>
              <path
                className={styles.circleBg}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={styles.circle}
                strokeDasharray={`${utilization}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <text x="18" y="20.35" className={styles.percentage}>{utilization}%</text>
            </svg>
          </div>
          <span className={styles.utilizationLabel}>UTILIZED</span>
        </div>
      </div>

      {/* Bottom Section: Recent Trips + Vehicle Status */}
      <div className={styles.bottomSection}>
        {/* Recent Trips */}
        <div className={styles.recentTripsCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Recent Trips</h3>
            <button className={styles.filterBtn}>
              <svg className={styles.filterIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="8" y1="12" x2="16" y2="12" />
                <line x1="11" y1="18" x2="13" y2="18" />
              </svg>
              Filter
            </button>
          </div>

          <div className={styles.tableResponsive}>
            <table className={styles.tripsTable}>
              <thead>
                <tr>
                  <th>TRIP ID</th>
                  <th>VEHICLE</th>
                  <th>DRIVER</th>
                  <th>STATUS</th>
                  <th>ETA</th>
                </tr>
              </thead>
              <tbody>
                {recentTrips.length > 0 ? recentTrips.map((trip, idx) => {
                  const statusKey = (trip.status || '').toLowerCase().replace(/\s+/g, '_');
                  const statusInfo = STATUS_MAP[statusKey] || { label: trip.status, className: '' };
                  return (
                    <tr key={trip.id || idx}>
                      <td>{trip.trip_number || trip.id || `TR${String(idx + 1).padStart(3, '0')}`}</td>
                      <td>
                        <span className={styles.vehicleCell}>
                          <svg className={styles.truckIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="1" y="3" width="15" height="13" />
                            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                            <circle cx="5.5" cy="18.5" r="2.5" />
                            <circle cx="18.5" cy="18.5" r="2.5" />
                          </svg>
                          {trip.vehicle_number || trip.vehicle || '—'}
                        </span>
                      </td>
                      <td>{trip.driver_name || trip.driver || 'Unassigned'}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[statusInfo.className] || ''}`}>
                          <span style={{ marginRight: '4px' }}>●</span>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td>{trip.eta || '—:—'}</td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#8b949e' }}>No recent trips</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vehicle Status */}
        <div className={styles.vehicleStatusCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Vehicle Status</h3>
            <svg className={styles.chartIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </div>

          <div className={styles.statusBars}>
            {/* Active */}
            <div className={styles.statusBarRow}>
              <div className={styles.barLabel}>
                <span>ACTIVE ({pad(activeCount)})</span>
                <span>{activePct}%</span>
              </div>
              <div className={styles.barContainer}>
                <div className={styles.barFillActive} style={{ width: `${activePct}%` }} />
              </div>
            </div>

            {/* Available */}
            <div className={styles.statusBarRow}>
              <div className={styles.barLabel}>
                <span>AVAILABLE ({pad(availableCount)})</span>
                <span>{availPct}%</span>
              </div>
              <div className={styles.barContainer}>
                <div className={styles.barFillAvailable} style={{ width: `${availPct}%` }} />
              </div>
            </div>

            {/* Maintenance */}
            <div className={styles.statusBarRow}>
              <div className={styles.barLabel}>
                <span>MAINTENANCE ({pad(maintCount)})</span>
                <span className={styles.maintText}>{maintPct}%</span>
              </div>
              <div className={styles.barContainer}>
                <div className={styles.barFillMaint} style={{ width: `${maintPct}%` }} />
              </div>
            </div>
          </div>

          <Link to="/reports" className={styles.viewReportBtn}>
            VIEW FULL REPORT →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

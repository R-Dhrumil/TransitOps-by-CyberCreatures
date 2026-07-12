import React from 'react';
import { Link } from 'react-router-dom';
import { useDashboard } from '../hooks/useDashboard.js';
import { useTrips } from '../hooks/useTrips.js';
import styles from './DashboardPage.module.css';

const DashboardPage = () => {
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
    <div className="empty-state">
      <span>⚠️</span>
      <p>Failed to load dashboard data. <button className="btn btn-secondary btn-sm" onClick={handleRefresh}>Retry</button></p>
    </div>
  );

  const v = dashboardData?.vehicles || {};
  const d = dashboardData?.drivers || {};
  const t = dashboardData?.trips || {};

  const recentTrips = (tripsData || []).slice(0, 5);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Live Operations Dashboard</h2>
          <p className={styles.subtitle}>Real-time overview of fleet, trips, and personnel.</p>
        </div>
        <div className={styles.sysStatus}>
          <span className={styles.sysDot}></span> SYS.ONLINE
        </div>
      </div>

      {/* KPI Row */}
      <div className={styles.kpiRow}>
        <div className={`${styles.kpiCard} ${styles.activeVehCard}`}>
          <span className={styles.kpiLabel}>ACTIVE VEH</span>
          <span className={styles.kpiValue}>
            {v.on_trip !== undefined ? String(v.on_trip).padStart(2, '0') : '00'}
          </span>
          <div className={styles.cardUnderline}></div>
        </div>
        
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>AVAILABLE</span>
          <span className={styles.kpiValue}>
            {v.available !== undefined ? String(v.available).padStart(2, '0') : '00'}
          </span>
        </div>

        <div className={`${styles.kpiCard} ${styles.maintenanceCard}`}>
          <span className={styles.kpiLabel}>MAINTENANCE</span>
          <span className={styles.kpiValue}>
            {v.in_maintenance !== undefined ? String(v.in_maintenance).padStart(2, '0') : '00'}
          </span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>ACTIVE TRIPS</span>
          <span className={styles.kpiValue}>
            {t.active !== undefined ? String(t.active).padStart(2, '0') : '00'}
          </span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>PENDING</span>
          <span className={styles.kpiValue}>
            {t.pending !== undefined ? String(t.pending).padStart(2, '0') : '00'}
          </span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>DRIVERS DUTY</span>
          <span className={styles.kpiValue}>
            {d.available !== undefined ? String(d.available).padStart(2, '0') : '00'}
          </span>
        </div>

        <div className={`${styles.kpiCard} ${styles.utilizationCard}`}>
          <div className={styles.utilizationCircle}>
            <svg viewBox="0 0 36 36" className={styles.circularChart}>
              <path className={styles.circleBg}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path className={styles.circle}
                strokeDasharray={`${dashboardData?.fleet_utilization_percent ?? 0}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <text x="18" y="20.35" className={styles.percentage}>{dashboardData?.fleet_utilization_percent ?? 0}%</text>
            </svg>
          </div>
          <span className={styles.utilizationLabel}>UTILIZED</span>
        </div>
      </div>

      <div className={styles.bottomSection}>
        {/* Recent Trips Table */}
        <div className={styles.recentTripsCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Recent Trips</h3>
            <button className={styles.filterBtn}>
              <svg className={styles.filterIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
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
                {recentTrips.map(trip => (
                  <tr key={trip.id}>
                    <td>TR{trip.id.substring(0, 3).toUpperCase()}</td>
                    <td className={styles.vehicleCell}>
                      <svg className={styles.truckIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="1" y="3" width="15" height="13"></rect>
                        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                        <circle cx="5.5" cy="18.5" r="2.5"></circle>
                        <circle cx="18.5" cy="18.5" r="2.5"></circle>
                      </svg>
                      {trip.registration_number || 'VH-N/A'}
                    </td>
                    <td>{trip.driver_name || 'Unassigned'}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[trip.status.toLowerCase().replace(' ', '')]}`}>
                        ● {trip.status.toUpperCase()}
                      </span>
                    </td>
                    <td>{trip.eta || 'TBD'}</td>
                  </tr>
                ))}
                {recentTrips.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: '#666' }}>No recent trips.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vehicle Status Distributions */}
        <div className={styles.vehicleStatusCard}>
          <div>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Vehicle Status</h3>
              <svg className={styles.chartIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
            </div>

            <div className={styles.statusBars}>
              <div className={styles.statusBarRow}>
                <div className={styles.barLabel}>
                  <span>ACTIVE ({v.on_trip || 0})</span>
                  <span>{v.total ? Math.round((v.on_trip / v.total) * 100) : 0}%</span>
                </div>
                <div className={styles.barContainer}>
                  <div className={styles.barFillActive} style={{ width: `${v.total ? (v.on_trip / v.total) * 100 : 0}%` }}></div>
                </div>
              </div>

              <div className={styles.statusBarRow}>
                <div className={styles.barLabel}>
                  <span>AVAILABLE ({v.available || 0})</span>
                  <span>{v.total ? Math.round((v.available / v.total) * 100) : 0}%</span>
                </div>
                <div className={styles.barContainer}>
                  <div className={styles.barFillAvailable} style={{ width: `${v.total ? (v.available / v.total) * 100 : 0}%` }}></div>
                </div>
              </div>

              <div className={styles.statusBarRow}>
                <div className={styles.barLabel}>
                  <span className={styles.maintText}>MAINTENANCE ({v.in_maintenance || 0})</span>
                  <span className={styles.maintText}>{v.total ? Math.round((v.in_maintenance / v.total) * 100) : 0}%</span>
                </div>
                <div className={styles.barContainer}>
                  <div className={styles.barFillMaint} style={{ width: `${v.total ? (v.in_maintenance / v.total) * 100 : 0}%` }}></div>
                </div>
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

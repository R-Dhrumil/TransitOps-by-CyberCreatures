import React from 'react';
import { Link } from 'react-router-dom';
import { useDashboard } from '../hooks/useDashboard.js';
import KpiCard from '../components/ui/KpiCard.jsx';
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
  if (error) return (
    <div className="empty-state"><span>⚠️</span><p>Failed to load dashboard. <button className="btn btn-secondary btn-sm" onClick={refetch}>Retry</button></p></div>
  );

  const v = dashboardData?.vehicles || {};
  const d = dashboardData?.drivers || {};
  const t = dashboardData?.trips || {};

  const recentTrips = (tripsData || []).slice(0, 5);

  return (
    <div className={styles.page}>
      <div className="page-header">
        <h2>Overview</h2>
        <button className="btn btn-secondary btn-sm" onClick={refetch}>↻ Refresh</button>
      </div>

      {/* Vehicle KPIs */}
      <section className={styles.section}>
        <h3 className={styles.sectionLabel}>🚛 Fleet Status</h3>
        <div className={styles.kpiGrid}>
          <KpiCard title="Available" value={v.available} icon="✅" subtitle="Ready to dispatch" />
          <KpiCard title="On Trip" value={v.on_trip} icon="🚛" subtitle="Currently deployed" />
          <KpiCard title="In Maintenance" value={v.in_maintenance} icon="🔧" subtitle="Under repair" />
          <KpiCard title="Total Vehicles" value={v.total} icon="🏭" subtitle={`${v.retired || 0} retired`} />
        </div>
      </section>

      {/* Driver KPIs */}
      <section className={styles.section}>
        <h3 className={styles.sectionLabel}>👤 Driver Status</h3>
        <div className={styles.kpiGrid}>
          <KpiCard title="Available Drivers" value={d.available} icon="🟢" />
          <KpiCard title="On Trip" value={d.on_trip} icon="🛣️" />
          <KpiCard title="Off Duty" value={d.off_duty} icon="🔵" />
          <KpiCard title="Suspended" value={d.suspended} icon="🔴" />
        </div>
      </section>

      {/* Trip KPIs */}
      <section className={styles.section}>
        <h3 className={styles.sectionLabel}>🗺️ Trips</h3>
        <div className={styles.kpiGrid}>
          <KpiCard title="Active Trips" value={t.active} icon="⚡" />
          <KpiCard title="Pending (Draft)" value={t.pending} icon="⏳" />
          <KpiCard title="Completed" value={t.completed} icon="✔️" />
          <KpiCard title="Cancelled" value={t.cancelled} icon="✖️" />
        </div>
      </section>

      {/* Utilization */}
      <section className={styles.section}>
        <h3 className={styles.sectionLabel}>📊 Fleet Utilization</h3>
        <div className={styles.utilizationCard}>
          <div className={styles.utilizationValue}>{data?.fleet_utilization_percent ?? 0}%</div>
          <div className={styles.utilizationBar}>
            <div
              className={styles.utilizationFill}
              style={{ width: `${data?.fleet_utilization_percent ?? 0}%` }}
            />
          </div>

          <Link to="/reports" className={styles.viewReportBtn}>
            VIEW FULL REPORT →
          </Link>
        </div>
    </div>
    </div >
  );
};

export default DashboardPage;

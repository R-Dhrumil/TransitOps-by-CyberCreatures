import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid,
} from 'recharts';
import useApi from '../hooks/useApi.js';
import apiClient from '../lib/apiClient.js';
import toast from 'react-hot-toast';
import AppIcon from '../components/ui/AppIcon.jsx';
import {
  exportFuelEfficiencyPDF,
  exportUtilizationPDF,
  exportCostPDF,
  exportRoiPDF,
} from '../lib/pdfExport.js';
import styles from './ReportsPage.module.css';


const CHART_COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#a78bfa', '#ef4444', '#06b6d4'];

const ReportsPage = () => {
  const [activeReport, setActiveReport] = useState('fuel-efficiency');
  const { data: fuelData, loading: fLoading } = useApi('/api/reports/fuel-efficiency');
  const { data: utilData, loading: uLoading } = useApi('/api/reports/utilization');
  const { data: costData, loading: cLoading } = useApi('/api/reports/cost');
  const { data: roiData, loading: rLoading } = useApi('/api/reports/roi');

  const handleExport = async (type) => {
    try {
      const res = await apiClient.get(`/api/reports/export/csv?type=${type}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_report.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV downloaded.');
    } catch { toast.error('Export failed.'); }
  };

  const handleExportPDF = () => {
    try {
      const dataMap = {
        'fuel-efficiency': { fn: exportFuelEfficiencyPDF, data: fuelData },
        'utilization':     { fn: exportUtilizationPDF,   data: utilData },
        'cost':            { fn: exportCostPDF,           data: costData },
        'roi':             { fn: exportRoiPDF,            data: roiData  },
      };
      const { fn, data } = dataMap[activeReport] || {};
      if (fn && data?.length) {
        fn(data);
        toast.success('PDF downloaded.');
      } else {
        toast.error('No data to export yet.');
      }
    } catch { toast.error('PDF export failed.'); }
  };


  const REPORTS = [
    { id: 'fuel-efficiency', label: 'Fuel Efficiency', icon: 'fuel', loading: fLoading },
    { id: 'utilization',     label: 'Utilization', icon: 'reports', loading: uLoading },
    { id: 'cost',            label: 'Cost Breakdown', icon: 'dollar', loading: cLoading },
    { id: 'roi',             label: 'ROI Analysis', icon: 'trend', loading: rLoading },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className={styles.tooltip}>
        <p className={styles.tooltipLabel}>{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }}>{p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</strong></p>
        ))}
      </div>
    );
  };

  return (
    <div>
      <div className="page-header">
        <h2>Reports & Analytics</h2>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="btn btn-secondary" onClick={() => handleExport(activeReport)}>
            <AppIcon name="download" size={14} /> Export CSV
          </button>
          <button className="btn btn-secondary" onClick={handleExportPDF}>
            <AppIcon name="download" size={14} /> Export PDF
          </button>
        </div>
      </div>

      {/* Report tabs */}
      <div className={styles.reportTabs}>
        {REPORTS.map((r) => (
          <button
            key={r.id}
            className={`${styles.reportTab} ${activeReport === r.id ? styles.activeTab : ''}`}
            onClick={() => setActiveReport(r.id)}
          >
            <AppIcon name={r.icon} size={14} /> {r.label}
          </button>
        ))}
      </div>

      {/* Fuel Efficiency */}
      {activeReport === 'fuel-efficiency' && (
        <div className={styles.chartSection}>
          <h3>Fuel Efficiency by Vehicle (km/liter)</h3>
          {fLoading ? <div className="loading-state"><div className="spinner" /></div> : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={fuelData} margin={{ top: 10, right: 20, left: 10, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="registration_number" tick={{ fill: '#94a3b8', fontSize: 12 }} angle={-30} textAnchor="end" />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} label={{ value: 'km/L', angle: -90, position: 'insideLeft', fill: '#64748b' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="km_per_liter" name="km/Liter" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
          {!fLoading && fuelData && (
            <div className="table-container" style={{ marginTop: 'var(--space-5)' }}>
              <table>
                <thead><tr><th>Vehicle</th><th>Model</th><th>Total Distance (km)</th><th>Total Fuel (L)</th><th>Efficiency (km/L)</th></tr></thead>
                <tbody>
                  {fuelData.map((r) => (
                    <tr key={r.id}>
                      <td><strong>{r.registration_number}</strong></td>
                      <td>{r.name_model}</td>
                      <td>{Number(r.total_distance_km).toLocaleString()}</td>
                      <td>{Number(r.total_fuel_liters).toLocaleString()}</td>
                      <td style={{ color: 'var(--color-brand)', fontWeight: 600 }}>{r.km_per_liter ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Utilization */}
      {activeReport === 'utilization' && (
        <div className={styles.chartSection}>
          <h3>Fleet Utilization (Completed Trips per Vehicle)</h3>
          {uLoading ? <div className="loading-state"><div className="spinner" /></div> : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={utilData} margin={{ top: 10, right: 20, left: 10, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="registration_number" tick={{ fill: '#94a3b8', fontSize: 12 }} angle={-30} textAnchor="end" />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="completed_trips" name="Completed Trips" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="active_trips" name="Active Trips" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Cost */}
      {activeReport === 'cost' && (
        <div className={styles.chartSection}>
          <h3>Operational Cost Breakdown (₹)</h3>
          {cLoading ? <div className="loading-state"><div className="spinner" /></div> : (
            <div className={styles.chartRow}>
              <ResponsiveContainer width="60%" height={320}>
                <BarChart data={costData} margin={{ top: 10, right: 20, left: 10, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="registration_number" tick={{ fill: '#94a3b8', fontSize: 12 }} angle={-30} textAnchor="end" />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total_fuel_cost" name="Fuel Cost" fill="#f59e0b" radius={[4, 4, 0, 0]} stackId="cost" />
                  <Bar dataKey="total_maintenance_cost" name="Maintenance Cost" fill="#ef4444" radius={[4, 4, 0, 0]} stackId="cost" />
                </BarChart>
              </ResponsiveContainer>
              <ResponsiveContainer width="40%" height={320}>
                <PieChart>
                  <Pie data={costData?.map((r) => ({ name: r.registration_number, value: Number(r.total_operating_cost) || 0 }))}
                    cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {costData?.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `₹${Number(v).toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* ROI */}
      {activeReport === 'roi' && (
        <div className={styles.chartSection}>
          <h3>Cost-to-Acquisition Ratio (%)</h3>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>
            Total operating cost as % of vehicle acquisition cost. Lower = more efficient investment.
          </p>
          {rLoading ? <div className="loading-state"><div className="spinner" /></div> : (
            <div className="table-container">
              <table>
                <thead><tr><th>Vehicle</th><th>Acquisition Cost (₹)</th><th>Total Operating Cost (₹)</th><th>Cost/Acquisition %</th></tr></thead>
                <tbody>
                  {roiData?.map((r) => (
                    <tr key={r.id}>
                      <td><strong>{r.registration_number}</strong><br /><span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{r.name_model}</span></td>
                      <td>₹{Number(r.acquisition_cost).toLocaleString()}</td>
                      <td>₹{Number(r.total_cost).toLocaleString()}</td>
                      <td>
                        <span style={{ color: r.cost_to_acquisition_pct > 50 ? 'var(--color-danger)' : r.cost_to_acquisition_pct > 20 ? 'var(--color-warning)' : 'var(--color-success)', fontWeight: 600 }}>
                          {r.cost_to_acquisition_pct ?? '0'}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportsPage;

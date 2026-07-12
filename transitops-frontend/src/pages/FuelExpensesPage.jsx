import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import useApi from '../hooks/useApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import apiClient from '../lib/apiClient.js';
import AppIcon from '../components/ui/AppIcon.jsx';
import styles from './FuelExpensesPage.module.css';

const fuelSchema = z.object({
  vehicle_id: z.string().uuid('Select a vehicle'),
  liters: z.coerce.number().positive(),
  cost: z.coerce.number().positive(),
  log_date: z.string().optional(),
});

const expenseSchema = z.object({
  vehicle_id: z.string().optional(),
  category: z.string().min(1, 'Required'),
  amount: z.coerce.number().positive(),
  expense_date: z.string().optional(),
  notes: z.string().optional(),
});

const EXPENSE_CATEGORIES = ['Toll', 'Parking', 'Driver Allowance', 'Loading/Unloading', 'Insurance', 'Tax/RTO', 'Miscellaneous'];

const FuelExpensesPage = () => {
  const { hasRole } = useAuth();
  const [tab, setTab] = useState('fuel');
  const { data: fuelLogs, loading: fLoading, refetch: refetchFuel } = useApi('/api/fuel-logs');
  
  const canLogFuel = hasRole('driver', 'fleet_manager');
  const canManageExpenses = hasRole('financial_analyst');
  const canViewExpenses = hasRole('financial_analyst', 'fleet_manager');

  const { data: expenses, loading: eLoading, refetch: refetchExpense } = useApi(canViewExpenses ? '/api/expenses' : null);
  const { data: vehicles } = useApi('/api/vehicles');
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showExpModal, setShowExpModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fuelForm = useForm({ resolver: zodResolver(fuelSchema) });
  const expForm = useForm({ resolver: zodResolver(expenseSchema) });

  const onFuelSubmit = async (data) => {
    setSubmitting(true);
    try {
      await apiClient.post('/api/fuel-logs', data);
      toast.success('Fuel log added.');
      setShowFuelModal(false);
      fuelForm.reset();
      refetchFuel();
    } finally { setSubmitting(false); }
  };

  const onExpSubmit = async (data) => {
    setSubmitting(true);
    try {
      await apiClient.post('/api/expenses', data);
      toast.success('Expense recorded.');
      setShowExpModal(false);
      expForm.reset();
      refetchExpense();
    } finally { setSubmitting(false); }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Fuel & Expenses</h2>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          {canLogFuel && <button className="btn btn-primary" onClick={() => setShowFuelModal(true)}>+ Log Fuel</button>}
          {canManageExpenses && <button className="btn btn-secondary" onClick={() => setShowExpModal(true)}>+ Add Expense</button>}
        </div>
      </div>

      {/* Tab Switch */}
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'fuel' ? styles.activeTab : ''}`} onClick={() => setTab('fuel')}><AppIcon name="fuel" size={14} /> Fuel Logs</button>
        {canViewExpenses && (
          <button className={`${styles.tab} ${tab === 'expenses' ? styles.activeTab : ''}`} onClick={() => setTab('expenses')}><AppIcon name="dollar" size={14} /> Expenses</button>
        )}
      </div>

      {/* Fuel Logs */}
      {tab === 'fuel' && (
        <>
          {fLoading && <div className="loading-state"><div className="spinner" /></div>}
          {!fLoading && (
            <div className="table-container">
              <table>
                <thead><tr><th>Vehicle</th><th>Date</th><th>Liters</th><th>Cost (₹)</th><th>₹/Liter</th></tr></thead>
                <tbody>
                  {!fuelLogs?.length && <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '3rem' }}>No fuel logs.</td></tr>}
                  {fuelLogs?.map((fl) => (
                    <tr key={fl.id}>
                      <td data-label="Vehicle"><strong>{fl.registration_number}</strong><br /><span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{fl.name_model}</span></td>
                      <td data-label="Date">{new Date(fl.log_date).toLocaleDateString()}</td>
                      <td data-label="Liters">{Number(fl.liters).toLocaleString()}</td>
                      <td data-label="Cost (₹)">₹{Number(fl.cost).toLocaleString()}</td>
                      <td data-label="₹/Liter" style={{ color: 'var(--color-brand)' }}>₹{(fl.cost / fl.liters).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Expenses */}
      {tab === 'expenses' && (
        <>
          {eLoading && <div className="loading-state"><div className="spinner" /></div>}
          {!eLoading && (
            <div className="table-container">
              <table>
                <thead><tr><th>Vehicle</th><th>Category</th><th>Amount (₹)</th><th>Date</th><th>Notes</th></tr></thead>
                <tbody>
                  {!expenses?.length && <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '3rem' }}>No expenses recorded.</td></tr>}
                  {expenses?.map((e) => (
                    <tr key={e.id}>
                      <td data-label="Vehicle">{e.registration_number || '—'}</td>
                      <td data-label="Category">{e.category}</td>
                      <td data-label="Amount (₹)">₹{Number(e.amount).toLocaleString()}</td>
                      <td data-label="Date">{new Date(e.expense_date).toLocaleDateString()}</td>
                      <td data-label="Notes" style={{ color: 'var(--color-text-muted)' }}>{e.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Fuel Modal */}
      {showFuelModal && (
        <div className="modal-overlay" onClick={() => setShowFuelModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3>Log Fuel</h3><button className="modal-close" onClick={() => setShowFuelModal(false)}>✕</button></div>
            <form onSubmit={fuelForm.handleSubmit(onFuelSubmit)} noValidate>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Vehicle *</label>
                  <select className={`form-select ${fuelForm.formState.errors.vehicle_id ? 'error' : ''}`} {...fuelForm.register('vehicle_id')}>
                    <option value="">Select…</option>
                    {vehicles?.map((v) => <option key={v.id} value={v.id}>{v.registration_number} — {v.name_model}</option>)}
                  </select>
                  {fuelForm.formState.errors.vehicle_id && <span className="form-error">{fuelForm.formState.errors.vehicle_id.message}</span>}
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Liters *</label>
                    <input type="number" step="0.01" className="form-input" {...fuelForm.register('liters')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cost (₹) *</label>
                    <input type="number" step="0.01" className="form-input" {...fuelForm.register('cost')} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input type="date" className="form-input" {...fuelForm.register('log_date')} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowFuelModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving…' : 'Log Fuel'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {showExpModal && (
        <div className="modal-overlay" onClick={() => setShowExpModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3>Add Expense</h3><button className="modal-close" onClick={() => setShowExpModal(false)}>✕</button></div>
            <form onSubmit={expForm.handleSubmit(onExpSubmit)} noValidate>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select className={`form-select ${expForm.formState.errors.category ? 'error' : ''}`} {...expForm.register('category')}>
                    <option value="">Select…</option>
                    {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Amount (₹) *</label>
                  <input type="number" className="form-input" {...expForm.register('amount')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Vehicle (optional)</label>
                  <select className="form-select" {...expForm.register('vehicle_id')}>
                    <option value="">Not vehicle-specific</option>
                    {vehicles?.map((v) => <option key={v.id} value={v.id}>{v.registration_number}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <input className="form-input" {...expForm.register('notes')} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowExpModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving…' : 'Add Expense'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FuelExpensesPage;

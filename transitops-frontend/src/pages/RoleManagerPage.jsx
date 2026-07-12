import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import apiClient from '../lib/apiClient.js';
import AppIcon from '../components/ui/AppIcon.jsx';
import toast from 'react-hot-toast';
import styles from './RoleManagerPage.module.css';

/* ── Role config ─────────────────────────────────────────────── */
const ROLE_META = {
  fleet_manager:     { label: 'Fleet Manager',     color: 'brand'   },
  dispatcher:        { label: 'Dispatcher',         color: 'info'    },
  driver:            { label: 'Driver',             color: 'success' },
  safety_officer:    { label: 'Safety Officer',     color: 'warning' },
  financial_analyst: { label: 'Financial Analyst',  color: 'purple'  },
};

const ASSIGNABLE_ROLES = ['dispatcher', 'driver', 'safety_officer', 'financial_analyst'];

/* ── Sub-components ──────────────────────────────────────────── */
function RoleBadge({ role }) {
  const meta = ROLE_META[role] || { label: role, color: 'neutral' };
  return (
    <span className={`${styles.badge} ${styles[`badge_${meta.color}`]}`}>
      {meta.label}
    </span>
  );
}

function AddMemberModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'dispatcher' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.full_name.trim() || form.full_name.trim().length < 2)
      e.full_name = 'Full name must be at least 2 characters';
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Please enter a valid email address';
    if (!form.password || form.password.length < 8)
      e.password = 'Password must be at least 8 characters';
    if (!form.role) e.role = 'Please select a role';
    return e;
  };

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((err) => ({ ...err, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const { data } = await apiClient.post('/api/users/create', form);
      toast.success(data.message || 'Team member created!');
      onSuccess(data.data);
      onClose();
    } catch {
      // apiClient already toasted the error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className={styles.modalTitle}>
            <span className={styles.modalTitleIcon}>
              <AppIcon name="userPlus" size={20} />
            </span>
            Add Team Member
          </h3>
          <button className="modal-close" onClick={onClose}>
            <AppIcon name="x" size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className={styles.formStack}>
            {/* Full Name */}
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className={`form-input ${errors.full_name ? 'error' : ''}`}
                type="text"
                placeholder="e.g. John Smith"
                value={form.full_name}
                onChange={handleChange('full_name')}
                autoFocus
              />
              {errors.full_name && <span className="form-error">{errors.full_name}</span>}
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className={`form-input ${errors.email ? 'error' : ''}`}
                type="email"
                placeholder="e.g. john@company.com"
                value={form.email}
                onChange={handleChange('email')}
              />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Temporary Password</label>
              <div className={styles.passwordField}>
                <input
                  className={`form-input ${errors.password ? 'error' : ''}`}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={handleChange('password')}
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPassword((s) => !s)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <AppIcon name={showPassword ? 'eyeOff' : 'eye'} size={16} />
                </button>
              </div>
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>

            {/* Role */}
            <div className="form-group">
              <label className="form-label">Assign Role</label>
              <select
                className={`form-select ${errors.role ? 'error' : ''}`}
                value={form.role}
                onChange={handleChange('role')}
              >
                {ASSIGNABLE_ROLES.map((r) => (
                  <option key={r} value={r}>{ROLE_META[r].label}</option>
                ))}
              </select>
              {errors.role && <span className="form-error">{errors.role}</span>}
            </div>

            <div className={styles.infoNote}>
              <AppIcon name="info" size={15} />
              <span>The member will use this email and password to log in. Share credentials securely.</span>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <><span className="spinner" style={{ width: 14, height: 14 }} /> Creating…</>
              ) : (
                <><AppIcon name="userPlus" size={15} /> Create Account</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditRoleModal({ user, onClose, onSuccess }) {
  const [role, setRole] = useState(user.role);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (role === user.role) { onClose(); return; }
    setLoading(true);
    try {
      const { data } = await apiClient.patch(`/api/users/${user.id}/role`, { role });
      toast.success(data.message || 'Role updated!');
      onSuccess(data.data);
      onClose();
    } catch {
      // apiClient handles toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className={styles.modalTitle}>
            <span className={styles.modalTitleIcon}>
              <AppIcon name="pencil" size={18} />
            </span>
            Change Role
          </h3>
          <button className="modal-close" onClick={onClose}>
            <AppIcon name="x" size={16} />
          </button>
        </div>
        <p style={{ marginBottom: 'var(--space-4)', color: 'var(--color-text-secondary)' }}>
          Updating role for <strong style={{ color: 'var(--color-text-primary)' }}>{user.full_name}</strong>
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 'var(--space-6)' }}>
            <label className="form-label">New Role</label>
            <select
              className="form-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              autoFocus
            >
              {ASSIGNABLE_ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_META[r].label}</option>
              ))}
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading || role === user.role}>
              {loading
                ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving…</>
                : <><AppIcon name="check" size={15} /> Save Role</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ user, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.delete(`/api/users/${user.id}`);
      toast.success(data.message || 'User removed.');
      onSuccess(user.id);
      onClose();
    } catch {
      // apiClient handles toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className={styles.modalTitle}>
            <span className={`${styles.modalTitleIcon} ${styles.modalTitleIconDanger}`}>
              <AppIcon name="trash" size={18} />
            </span>
            Remove Member
          </h3>
          <button className="modal-close" onClick={onClose}>
            <AppIcon name="x" size={16} />
          </button>
        </div>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
          Are you sure you want to remove{' '}
          <strong style={{ color: 'var(--color-danger)' }}>{user.full_name}</strong> from the fleet?
          This action cannot be undone.
        </p>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={loading}>
            {loading
              ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Removing…</>
              : <><AppIcon name="trash" size={15} /> Remove</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────── */
export default function RoleManagerPage() {
  const { user: currentUser, hasRole } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const [showAddModal, setShowAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Redirect non-fleet-managers
  useEffect(() => {
    if (!hasRole('fleet_manager')) {
      navigate('/dashboard', { replace: true });
    }
  }, [hasRole, navigate]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/api/users');
      setUsers(data.data);
    } catch {
      // apiClient handles toast
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleUserCreated = (newUser) => setUsers((u) => [newUser, ...u]);
  const handleRoleUpdated = (updated) =>
    setUsers((u) => u.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)));
  const handleUserDeleted = (id) => setUsers((u) => u.filter((x) => x.id !== id));

  const filtered = users.filter((u) => {
    const matchSearch =
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'all' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const stats = ASSIGNABLE_ROLES.map((r) => ({
    role: r,
    count: users.filter((u) => u.role === r).length,
    meta: ROLE_META[r],
  }));

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  if (!hasRole('fleet_manager')) return null;

  return (
    <div className={styles.page}>
      {/* ── Header ──────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>
            <span className={styles.titleIcon}>
              <AppIcon name="shield" size={26} />
            </span>
            Role Manager
          </h2>
          <p className={styles.subtitle}>
            Manage your fleet team — assign roles, create accounts, and control access.
          </p>
        </div>
        <button
          id="add-member-btn"
          className={`btn btn-primary ${styles.addBtn}`}
          onClick={() => setShowAddModal(true)}
        >
          <AppIcon name="userPlus" size={16} />
          Add Team Member
        </button>
      </div>

      {/* ── Stats Strip ─────────────────────────────────────── */}
      <div className={styles.statsStrip}>
        <div className={styles.statCard}>
          <span className={styles.statNum}>{users.length}</span>
          <span className={styles.statLabel}>Total Members</span>
        </div>
        {stats.map(({ role, count, meta }) => (
          <div
            key={role}
            className={`${styles.statCard} ${styles[`statCard_${meta.color}`]} ${filterRole === role ? styles.statCardActive : ''}`}
            onClick={() => setFilterRole(filterRole === role ? 'all' : role)}
            style={{ cursor: 'pointer' }}
            title={`Filter by ${meta.label}`}
          >
            <span className={styles.statNum}>{count}</span>
            <span className={styles.statLabel}>{meta.label}</span>
          </div>
        ))}
      </div>

      {/* ── Filters ─────────────────────────────────────────── */}
      <div className="filters-bar">
        <div className={styles.searchWrapper}>
          <AppIcon name="search" size={15} className={styles.searchIcon} />
          <input
            id="role-manager-search"
            className={`form-input ${styles.searchInput}`}
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          id="role-manager-filter"
          className="form-select"
          style={{ maxWidth: 200 }}
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="all">All Roles</option>
          {['fleet_manager', ...ASSIGNABLE_ROLES].map((r) => (
            <option key={r} value={r}>{ROLE_META[r]?.label || r}</option>
          ))}
        </select>
        {(search || filterRole !== 'all') && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => { setSearch(''); setFilterRole('all'); }}
          >
            <AppIcon name="x" size={13} /> Clear
          </button>
        )}
        <span className={styles.resultCount}>
          {filtered.length} of {users.length} members
        </span>
      </div>

      {/* ── Table ───────────────────────────────────────────── */}
      {loading ? (
        <div className="loading-state">
          <span className="spinner" />
          Loading team members…
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <AppIcon name="users" size={40} />
          <strong>{search || filterRole !== 'all' ? 'No members match your filters' : 'No team members yet'}</strong>
          <p>Click "Add Team Member" to create the first account.</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const isSelf = u.id === currentUser?.id;
                const isFleetManager = u.role === 'fleet_manager';
                return (
                  <tr key={u.id} className={isSelf ? styles.selfRow : ''}>
                    <td data-label="Member">
                      <div className={styles.memberCell}>
                        <div className={styles.avatar}>
                          {u.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className={styles.memberName}>
                          {u.full_name}
                          {isSelf && <span className={styles.youBadge}>You</span>}
                        </div>
                      </div>
                    </td>
                    <td data-label="Email">
                      <span className={styles.email}>{u.email}</span>
                    </td>
                    <td data-label="Role">
                      <RoleBadge role={u.role} />
                    </td>
                    <td data-label="Joined">
                      <span className={styles.dateText}>{formatDate(u.created_at)}</span>
                    </td>
                    <td data-label="Actions">
                      <div className={styles.actions}>
                        {!isSelf && !isFleetManager ? (
                          <>
                            <button
                              className={`btn btn-secondary btn-sm ${styles.actionBtn}`}
                              onClick={() => setEditTarget(u)}
                              title="Change role"
                            >
                              <AppIcon name="pencil" size={13} /> Role
                            </button>
                            <button
                              className={`btn btn-danger btn-sm ${styles.iconBtn}`}
                              onClick={() => setDeleteTarget(u)}
                              title="Remove member"
                            >
                              <AppIcon name="trash" size={13} />
                            </button>
                          </>
                        ) : (
                          <span className={styles.lockedLabel}>
                            <AppIcon name={isSelf ? 'userCheck' : 'lock'} size={13} />
                            {isSelf ? 'You' : 'Protected'}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────────── */}
      {showAddModal && (
        <AddMemberModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handleUserCreated}
        />
      )}
      {editTarget && (
        <EditRoleModal
          user={editTarget}
          onClose={() => setEditTarget(null)}
          onSuccess={handleRoleUpdated}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          user={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onSuccess={handleUserDeleted}
        />
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import styles from './LoginPage.module.css';


const loginSchema = z.object({
  email: z.string().min(1, 'Email or Phone is required'),
  password: z.string().min(1, 'Password is required'),
});

const DEMO_ACCOUNTS = [
  { role: 'Fleet Manager',      email: 'manager@transitops.dev',  password: 'Manager@123' },
  { role: 'Dispatcher',         email: 'dispatcher@transitops.dev',password: 'Dispatcher@123' },
  { role: 'Driver',             email: '9876543210',               password: 'Driver@123' },
  { role: 'Safety Officer',     email: 'safety@transitops.dev',   password: 'Safety@123' },
  { role: 'Financial Analyst',  email: 'finance@transitops.dev',  password: 'Finance@123' },
];

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async ({ email, password }) => {
    setLoading(true);
    try {
      await login(email, password);
      const from = location.state?.from?.pathname || '/dashboard';
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (e) => {
    const role = e.target.value;
    const account = DEMO_ACCOUNTS.find(a => a.role === role);
    if (account) {
      setValue('email', account.email);
      setValue('password', account.password);
    } else {
      setValue('email', '');
      setValue('password', '');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.leftPanel}>
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <img src="/logo.svg" alt="TransitOps Logo" style={{ maxWidth: '100%', maxHeight: '80px', objectFit: 'contain' }} />
        </div>
        <p className={styles.tagline}>Smart Transport Operations Platform</p>

        <p className={styles.rolesTitle}>One login, five roles:</p>
        <ul className={styles.rolesList}>
          <li>Fleet Manager</li>
          <li>Dispatcher</li>
          <li>Driver (Email or Phone)</li>
          <li>Safety Officer</li>
          <li>Financial Analyst</li>
        </ul>

        <div className={styles.footer}>
          TRANSITOPS © 2026 · RBAC & PHONE LOGIN ENABLED
        </div>
      </div>

      <div className={styles.rightPanel}>
        <div className={styles.formContainer}>
          <h2 className={styles.formTitle}>Sign in to your account</h2>
          <p className={styles.formSubtitle}>Enter your credentials to continue</p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="email">Email or Phone / ईमेल या फोन</label>
              <input
                id="email"
                type="text"
                className={styles.input}
                placeholder="driver@transitops.dev or 9876543210"
                autoComplete="username"
                {...register('email')}
              />
              {errors.email && <span style={{color: '#fc8181', fontSize: '0.8rem', marginTop: '4px'}}>{errors.email.message}</span>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className={styles.input}
                placeholder="••••••••"
                autoComplete="current-password"
                {...register('password')}
              />
              {errors.password && <span style={{color: '#fc8181', fontSize: '0.8rem', marginTop: '4px'}}>{errors.password.message}</span>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="role">Role (RBAC)</label>
              <select id="role" className={styles.select} onChange={handleRoleChange} defaultValue="">
                <option value="" disabled>Select a role...</option>
                {DEMO_ACCOUNTS.map(a => (
                  <option key={a.role} value={a.role}>{a.role}</option>
                ))}
              </select>
            </div>

            <div className={styles.optionsRow}>
              <label className={styles.rememberMe}>
                <input type="checkbox" />
                Remember me
              </label>
              <a href="#" className={styles.forgotPassword} onClick={(e) => e.preventDefault()}>Forgot password?</a>
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', color: '#64748b' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#2d3748' }}></div>
              <span style={{ padding: '0 10px', fontSize: '0.8rem', color: '#94a3b8' }}>OR / या</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#2d3748' }}></div>
            </div>

            <Link
              to="/quick-report"
              style={{
                display: 'block',
                textAlign: 'center',
                padding: '12px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(245, 158, 11, 0.15))',
                border: '1px dashed #f59e0b',
                color: '#f59e0b',
                fontWeight: '600',
                fontSize: '0.9rem',
                textDecoration: 'none',
              }}
            >
              🚧 Driver Quick Report / ड्राइवर तुरंत रिपोर्ट दर्ज करें
            </Link>
          </form>

          <div className={styles.accessScoped}>
            <p>Access is scoped by role after login:</p>
            <ul>
              <li>• Fleet Manager → Fleet, Maintenance</li>
              <li>• Dispatcher → Dashboard, Trips (Assign & Dispatch)</li>
              <li>• Driver → Trips (Complete), Fuel Logs</li>
              <li>• Safety Officer → Drivers, Compliance</li>
              <li>• Financial Analyst → Fuel & Expenses, Analytics</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

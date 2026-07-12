import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import styles from './LoginPage.module.css';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const DEMO_ACCOUNTS = [
  { role: 'Fleet Manager',      email: 'manager@transitops.dev',  password: 'Manager@123',  color: '#0ea5e9' },
  { role: 'Driver',             email: 'driver@transitops.dev',   password: 'Driver@123',   color: '#22c55e' },
  { role: 'Safety Officer',     email: 'safety@transitops.dev',   password: 'Safety@123',   color: '#f59e0b' },
  { role: 'Financial Analyst',  email: 'finance@transitops.dev',  password: 'Finance@123',  color: '#a78bfa' },
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
      toast.error(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (account) => {
    setValue('email', account.email);
    setValue('password', account.password);
  };

  return (
    <div className={styles.page}>
      <div className={styles.glow} />

      <Link to="/" className={styles.backLink}>← Back to Home</Link>

      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.logo}>🚌</span>
          <h1>TransitOps</h1>
          <p>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="you@transitops.dev"
              autoComplete="email"
              {...register('email')}
            />
            {errors.email && <span className="form-error">{errors.email.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className={`form-input ${errors.password ? 'error' : ''}`}
              placeholder="••••••••"
              autoComplete="current-password"
              {...register('password')}
            />
            {errors.password && <span className="form-error">{errors.password.message}</span>}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: 'var(--space-3)' }}
            disabled={loading}
          >
            {loading ? '⏳ Signing in…' : 'Sign In →'}
          </button>
        </form>

        <div className={styles.divider}><span>Demo accounts</span></div>

        <div className={styles.demoGrid}>
          {DEMO_ACCOUNTS.map((a) => (
            <button
              key={a.role}
              className={styles.demoBtn}
              style={{ '--role-color': a.color }}
              onClick={() => fillDemo(a)}
              type="button"
            >
              {a.role}
            </button>
          ))}
        </div>
        <p className={styles.demoNote}>Click a role to auto-fill credentials, then sign in.</p>
      </div>
    </div>
  );
};

export default LoginPage;

import React from 'react';
import { Link } from 'react-router-dom';
import AppIcon from '../components/ui/AppIcon.jsx';
import styles from './LandingPage.module.css';
import logoImg from '../assets/logo.svg';

const FEATURES = [
  { icon: 'vehicle', title: 'Fleet Registry', desc: 'Track every vehicle — status, odometer, capacity, region — in one place.' },
  { icon: 'users', title: 'Driver Management', desc: 'License expiry alerts, safety scores, and real-time availability.' },
  { icon: 'route', title: 'Trip Dispatch', desc: 'Multi-step wizard with live validation. Atomic status transitions prevent double-booking.' },
  { icon: 'maintenance', title: 'Maintenance Logs', desc: 'Open a repair record and the vehicle auto-moves to In Shop. Close it and it\'s Available again.' },
  { icon: 'fuel', title: 'Fuel & Expenses', desc: 'Per-trip fuel logging. Running operational cost per vehicle at a glance.' },
  { icon: 'trend', title: 'Analytics & Reports', desc: 'Fuel efficiency, fleet utilization, cost breakdown, ROI — with one-click CSV export.' },
];

const ROLES = [
  { role: 'Fleet Manager', color: '#0ea5e9', desc: 'Full vehicle CRUD, maintenance workflows, and fleet-wide visibility.' },
  { role: 'Driver', color: '#22c55e', desc: 'Create & dispatch trips, log fuel, view available vehicles and drivers.' },
  { role: 'Safety Officer', color: '#f59e0b', desc: 'Manage driver records, safety scores, and license compliance.' },
  { role: 'Financial Analyst', color: '#a78bfa', desc: 'Full expense management, cost reports, and CSV data export.' },
];

const LandingPage = () => (
  <div className={styles.page}>
    {/* Nav */}
    <nav className={styles.nav}>
      <div className={styles.navBrand}>
        <img src={logoImg} alt="TransitOps" style={{ maxHeight: '32px', objectFit: 'contain' }} />
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <Link to="/quick-report" className="btn btn-secondary" style={{ borderColor: '#f59e0b', color: '#f59e0b' }}>
          🚨 Quick Report
        </Link>
        <Link to="/login" className="btn btn-primary">Sign In <AppIcon name="arrowRight" size={14} /></Link>
      </div>
    </nav>

    {/* Hero */}
    <section className={styles.hero}>
      <div className={styles.heroGlow} />
      <div className={styles.heroBadge}>Smart Transport Operations</div>
      <h1 className={styles.heroTitle}>
        Move fleets.<br />
        <span className={styles.heroGradient}>Move smarter.</span>
      </h1>
      <p className={styles.heroSubtitle}>
        TransitOps is a real-time transport operations platform built for fleet managers, drivers,
        safety officers, and financial analysts — all in one powerful dashboard.
      </p>
      <div className={styles.heroActions}>
        <Link to="/login" className="btn btn-primary">Get Started Free <AppIcon name="arrowRight" size={14} /></Link>
        <Link to="/quick-report" className="btn btn-secondary" style={{ borderColor: '#f59e0b', color: '#f59e0b' }}>
          🚨 Driver Quick Report / ड्राइवर तुरंत रिपोर्ट
        </Link>
        <a href="#features" className="btn btn-secondary">See Features</a>
      </div>
      <div className={styles.heroStats}>
        {[['Live Data', 'from Railway Postgres'], ['4 Roles', 'RBAC enforced'], ['Atomic', 'DB Transactions']].map(([val, label]) => (
          <div key={val} className={styles.heroStat}>
            <span className={styles.heroStatValue}>{val}</span>
            <span className={styles.heroStatLabel}>{label}</span>
          </div>
        ))}
      </div>
    </section>

    {/* Features */}
    <section className={styles.section} id="features">
      <h2 className={styles.sectionTitle}>Everything your fleet needs</h2>
      <p className={styles.sectionSubtitle}>Built around real transport workflows — not generic dashboards.</p>
      <div className={styles.featureGrid}>
        {FEATURES.map((f) => (
          <div key={f.title} className={styles.featureCard}>
            <span className={styles.featureIcon}><AppIcon name={f.icon} size={28} /></span>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>

    {/* Roles */}
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Built for every stakeholder</h2>
      <p className={styles.sectionSubtitle}>Each role sees exactly what they need — nothing more, nothing less.</p>
      <div className={styles.rolesGrid}>
        {ROLES.map((r) => (
          <div key={r.role} className={styles.roleCard} style={{ '--role-color': r.color }}>
            <div className={styles.roleTitle}>{r.role}</div>
            <p>{r.desc}</p>
          </div>
        ))}
      </div>
    </section>

    {/* CTA */}
    <section className={styles.ctaSection}>
      <div className={styles.ctaCard}>
        <h2>Ready to dispatch?</h2>
        <p>Sign in with a role-specific demo account and explore the full platform.</p>
        <Link to="/login" className="btn btn-primary">Sign In Now <AppIcon name="arrowRight" size={14} /></Link>
      </div>
    </section>

    <footer className={styles.footer}>
      <p>© 2026 TransitOps · Built with React + Express + PostgreSQL</p>
    </footer>
  </div>
);

export default LandingPage;

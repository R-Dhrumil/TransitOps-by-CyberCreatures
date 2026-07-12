import React from 'react';
import { Link } from 'react-router-dom';
import AppIcon from '../components/ui/AppIcon.jsx';
import styles from './LandingPage.module.css';

const FEATURES = [
  { icon: 'vehicle', title: 'Real-time Fleet Registry', desc: 'Monitor vehicle status, odometer readings, and assignments with instant updates across the network.' },
  { icon: 'users', title: 'Driver Management', desc: 'Track safety scores, manage license renewals automatically, and ensure drivers are always compliant.' },
  { icon: 'route', title: 'Intelligent Dispatch', desc: 'Assign trips with built-in conflict prevention. Drivers get instantly notified on their mobile devices.' },
  { icon: 'maintenance', title: 'Predictive Maintenance', desc: 'Log repairs and track vehicle health. Vehicles automatically route to the shop when flagged for service.' },
  { icon: 'fuel', title: 'Expense Tracking', desc: 'Drivers can log fuel receipts on the go. Managers get a bird\'s-eye view of operational costs.' },
  { icon: 'trend', title: 'Advanced Analytics', desc: 'Generate reports on fleet utilization, fuel efficiency, and driver performance with one click.' },
];

const ROLES = [
  { role: 'Fleet Manager', color: '#3B82F6', icon: 'dashboard', desc: 'Full command over vehicles, maintenance, and high-level operations.' },
  { role: 'Dispatcher', color: '#10B981', icon: 'route', desc: 'Assign trips, monitor routes, and resolve conflicts in real-time.' },
  { role: 'Driver', color: '#F59E0B', icon: 'vehicle', desc: 'Mobile-first access for quick reporting, trip completion, and fuel logs.' },
  { role: 'Safety Officer', color: '#EF4444', icon: 'users', desc: 'Ensure compliance, track driver scores, and manage safety incidents.' },
  { role: 'Financial Analyst', color: '#8B5CF6', icon: 'trend', desc: 'Track ROI, export detailed expense reports, and analyze fuel efficiency.' },
];

const LandingPage = () => {
  return (
    <div className={styles.page}>
      {/* Dynamic Background */}
      <div className={styles.bgBlobs}>
        <div className={styles.blob1}></div>
        <div className={styles.blob2}></div>
      </div>

      {/* Navbar */}
      <nav className={styles.nav}>
        <div className={styles.navBrand}>
          <img src="/logo.svg" alt="TransitOps" className={styles.logo} />
        </div>
        <div className={styles.navLinks}>
          <Link to="/quick-report" className={styles.quickLink}>
            <AppIcon name="alert" size={16} /> Driver Quick Report
          </Link>
          <Link to="/login" className={styles.loginBtn}>
            Try it <AppIcon name="arrowRight" size={16} />
          </Link>
        </div>
      </nav>

      <main className={styles.main}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.badge}>
            <span className={styles.badgeDot}></span>
            TransitOps v1.0 is Live
          </div>
          
          <h1 className={styles.title}>
            Command your fleet. <br />
            <span className={styles.titleGradient}>Control your costs.</span>
          </h1>
          
          <p className={styles.subtitle}>
            A unified operations platform bringing dispatchers, drivers, and managers into a single, real-time ecosystem. Eliminate double-booking, track every drop of fuel, and streamline your entire transit network.
          </p>

          <div className={styles.actions}>
            <Link to="/login" className={styles.primaryBtn}>
              Launch Workspace
            </Link>
            <a href="#features" className={styles.secondaryBtn}>
              Explore Features
            </a>
          </div>

          <div className={styles.stats}>
            <div className={styles.statBox}>
              <h3>100%</h3>
              <p>Real-time Sync</p>
            </div>
            <div className={styles.statBox}>
              <h3>5</h3>
              <p>Dedicated Roles</p>
            </div>
            <div className={styles.statBox}>
              <h3>Zero</h3>
              <p>Double-booking</p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Powerful Operations Toolkit</h2>
            <p>Everything you need to run a modern transport fleet, seamlessly integrated.</p>
          </div>
          
          <div className={styles.featuresGrid}>
            {FEATURES.map((feature, i) => (
              <div key={i} className={styles.featureCard}>
                <div className={styles.featureIconBox}>
                  <AppIcon name={feature.icon} size={24} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Roles Section */}
        <section className={styles.sectionAlt}>
          <div className={styles.sectionHeader}>
            <h2>Built for every stakeholder</h2>
            <p>Role-Based Access Control ensures everyone sees exactly what they need.</p>
          </div>

          <div className={styles.rolesGrid}>
            {ROLES.map((r, i) => (
              <div key={i} className={styles.roleCard} style={{ '--theme': r.color }}>
                <div className={styles.roleHeader}>
                  <div className={styles.roleIcon}><AppIcon name={r.icon} size={20} /></div>
                  <h3>{r.role}</h3>
                </div>
                <p>{r.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className={styles.cta}>
          <div className={styles.ctaContent}>
            <h2>Ready to transform your operations?</h2>
            <p>Log in using our pre-configured demo accounts to experience the full platform.</p>
            <Link to="/login" className={styles.primaryBtn}>
              Sign In Now <AppIcon name="arrowRight" size={16} />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>
            <img src="/logo.svg" alt="TransitOps" style={{ maxHeight: '24px', opacity: 0.7 }} />
            <p>Smart Transport Operations Platform</p>
          </div>
          <div className={styles.footerLinks}>
            <p>© 2026 TransitOps. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

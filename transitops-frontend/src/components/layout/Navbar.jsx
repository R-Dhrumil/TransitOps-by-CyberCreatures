import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import AppIcon from '../ui/AppIcon.jsx';
import styles from './Navbar.module.css';

const PAGE_TITLES = {
  '/dashboard':     'Dashboard',
  '/vehicles':      'Vehicle Registry',
  '/drivers':       'Driver Management',
  '/trips':         'Trip Management',
  '/trips/new':     'New Trip',
  '/maintenance':   'Maintenance',
  '/fuel-expenses': 'Fuel & Expenses',
  '/reports':       'Reports & Analytics',
};

const Navbar = ({ onMenuToggle }) => {
  const { user } = useAuth();
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'TransitOps';

  return (
    <header className={styles.navbar}>
      <div className={styles.left}>
        <button className={styles.menuBtn} onClick={onMenuToggle} aria-label="Toggle menu">
          <AppIcon name="menu" size={18} />
        </button>
        <h1 className={styles.pageTitle}>{title}</h1>
      </div>
      <div className={styles.right}>
        <div className={styles.userChip}>
          <span className={styles.avatar}>{user?.full_name?.[0]?.toUpperCase()}</span>
          <span className={styles.name}>{user?.full_name}</span>
          <span className={styles.roleBadge}>{user?.role?.replace(/_/g, ' ')}</span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

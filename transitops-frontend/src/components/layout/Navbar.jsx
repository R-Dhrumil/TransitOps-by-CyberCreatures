import React, { useState } from 'react';
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
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className={styles.navbar}>
      {/* Left — Search bar */}
      <div className={styles.left}>
        <button className={styles.menuBtn} onClick={onMenuToggle} aria-label="Toggle menu">
          <AppIcon name="menu" size={18} />
        </button>

        <div className={styles.searchWrapper}>
          <svg
            className={styles.searchIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search operations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search operations"
          />
        </div>
      </div>

      {/* Right — Actions + Avatar */}
      <div className={styles.right}>
        {/* Notification bell */}
        <button className={styles.iconBtn} aria-label="Notifications">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>

        {/* Help */}
        <button className={styles.iconBtn} aria-label="Help">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </button>

        {/* User avatar */}
        <button className={styles.avatarBtn} aria-label="User menu">
          <span className={styles.avatarRing}>
            <span className={styles.avatar}>
              {user?.full_name?.[0]?.toUpperCase() || 'U'}
            </span>
          </span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;

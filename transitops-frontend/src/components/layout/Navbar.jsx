import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import AppIcon from '../ui/AppIcon.jsx';
import NotificationDropdown from '../ui/NotificationDropdown.jsx';
import { useNotifications } from '../../hooks/useNotifications.js';
import styles from './Navbar.module.css';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/vehicles': 'Vehicle Registry',
  '/drivers': 'Driver Management',
  '/trips': 'Trip Management',
  '/trips/new': 'New Trip',
  '/maintenance': 'Maintenance',
  '/fuel-expenses': 'Fuel & Expenses',
  '/reports': 'Reports & Analytics',
};

const Navbar = ({ onMenuToggle }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const title = PAGE_TITLES[location.pathname] || 'TransitOps';

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
        <div className={styles.notifContainer}>
          <NotificationDropdown />
        </div>
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

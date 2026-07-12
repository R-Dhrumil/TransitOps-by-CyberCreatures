import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import AppIcon from '../ui/AppIcon.jsx';
import NotificationDropdown from '../ui/NotificationDropdown.jsx';
import { useNotifications } from '../../hooks/useNotifications.js';
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

  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className={styles.navbar}>
      <div className={styles.left}>
        <button className={styles.menuBtn} onClick={onMenuToggle} aria-label="Toggle menu">
          <AppIcon name="menu" size={18} />
        </button>
        <h1 className={styles.pageTitle}>{title}</h1>
      </div>
      <div className={styles.right}>
        <div className={styles.notifContainer} ref={notifRef}>
          <button 
            className={styles.notifBtn} 
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
          >
            <AppIcon name="bell" size={20} />
            {unreadCount > 0 && <span className={styles.notifBadge}>{unreadCount}</span>}
          </button>
          {showNotifications && (
            <NotificationDropdown 
              notifications={notifications}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
              onClose={() => setShowNotifications(false)}
            />
          )}
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

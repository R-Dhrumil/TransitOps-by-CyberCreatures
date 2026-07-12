import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
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

const Navbar = ({ onMenuToggle, searchQuery, onSearchChange, collapsed }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const title = PAGE_TITLES[location.pathname] || 'TransitOps';

  return (
    <header className={`${styles.navbar} ${collapsed ? styles.collapsed : ''}`}>
      {/* Left — Search bar */}
      <div className={styles.left}>
        <button className={styles.menuBtn} onClick={onMenuToggle} aria-label="Toggle menu">
          <AppIcon name="menu" size={18} />
        </button>

        <div className={styles.mobileBrand}>
          <img src="/logo.svg" alt="TransitOps" />
        </div>

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
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search operations"
          />
        </div>
      </div>

      {/* Right — Actions + Avatar */}
      <div className={styles.right}>
        {/* Theme Toggle */}
        <button 
          className={styles.iconBtn} 
          onClick={toggleTheme}
          aria-label="Toggle theme"
          title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          <AppIcon name={theme === 'dark' ? 'sun' : 'moon'} size={20} />
        </button>

        <div className={styles.notifContainer} ref={notifRef}>
          <button 
            className={styles.iconBtn} 
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
          >
            <AppIcon name="bell" size={20} />
            {unreadCount > 0 && <span className={styles.notifBadge}>{unreadCount}</span>}
          </button>
          
          {showNotifications && (
            <NotificationDropdown 
              notifications={notifications || []} 
              onMarkAsRead={markAsRead} 
              onMarkAllAsRead={markAllAsRead} 
              onClose={() => setShowNotifications(false)}
            />
          )}
        </div>
        <div 
          className={styles.userChip}
          ref={profileRef}
          onMouseEnter={() => setShowProfileMenu(true)}
          onMouseLeave={() => setShowProfileMenu(false)}
          onClick={() => setShowProfileMenu(!showProfileMenu)}
        >
          <span className={styles.avatar}>{user?.full_name?.[0]?.toUpperCase()}</span>
          
          {showProfileMenu && (
            <div className={styles.profileMenu} onClick={(e) => e.stopPropagation()}>
              <div className={styles.profileMenuHeader}>
                <span className={styles.profileName}>{user?.full_name}</span>
                <span className={styles.profileRole}>{user?.role?.replace(/_/g, ' ')}</span>
              </div>
              <button className={styles.profileLogoutBtn} onClick={handleLogout}>
                <AppIcon name="logout" size={16} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;

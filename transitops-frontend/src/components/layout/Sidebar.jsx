import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { path: '/dashboard',      label: 'Dashboard',       icon: '📊', roles: [] },
  { path: '/vehicles',       label: 'Vehicles',         icon: '🚛', roles: [] },
  { path: '/drivers',        label: 'Drivers',          icon: '👤', roles: [] },
  { path: '/trips',          label: 'Trips',            icon: '🗺️', roles: [] },
  { path: '/maintenance',    label: 'Maintenance',      icon: '🔧', roles: ['fleet_manager'] },
  { path: '/fuel-expenses',  label: 'Fuel & Expenses',  icon: '⛽', roles: ['driver', 'fleet_manager', 'financial_analyst'] },
  { path: '/reports',        label: 'Reports',          icon: '📈', roles: ['fleet_manager', 'financial_analyst', 'safety_officer'] },
];

const Sidebar = ({ collapsed, onToggle }) => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  const visibleItems = NAV_ITEMS.filter(
    (item) => item.roles.length === 0 || hasRole(...item.roles)
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.brand}>
        <span className={styles.logo}>🚌</span>
        {!collapsed && <span className={styles.brandName}>TransitOps</span>}
      </div>

      <nav className={styles.nav}>
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
            title={collapsed ? item.label : undefined}
          >
            <span className={styles.icon}>{item.icon}</span>
            {!collapsed && <span className={styles.label}>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className={styles.footer}>
        {!collapsed && (
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user?.full_name}</span>
            <span className={styles.userRole}>{user?.role?.replace('_', ' ')}</span>
          </div>
        )}
        <button className={styles.logoutBtn} onClick={handleLogout} title="Logout">
          🚪 {!collapsed && 'Logout'}
        </button>
      </div>

      <button className={styles.collapseBtn} onClick={onToggle} aria-label="Toggle sidebar">
        {collapsed ? '›' : '‹'}
      </button>
    </aside>
  );
};

export default Sidebar;

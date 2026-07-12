import React from 'react';
import { Link } from 'react-router-dom';
import AppIcon from './AppIcon';
import styles from './NotificationDropdown.module.css';

const TYPE_ICONS = {
  info: { name: 'info', color: 'var(--color-primary)' },
  success: { name: 'check', color: 'var(--color-success)' },
  warning: { name: 'alert', color: 'var(--color-warning)' },
  error: { name: 'x', color: 'var(--color-danger)' },
};

const formatTime = (isoString) => {
  const date = new Date(isoString);
  const now = new Date();
  const diffInMinutes = Math.floor((now - date) / 60000);
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  return date.toLocaleDateString();
};

const NotificationDropdown = ({ notifications, onMarkAsRead, onMarkAllAsRead, onClose }) => {
  return (
    <div className={styles.dropdownOverlay}>
      <div className={styles.header}>
        <h3 className={styles.title}>Notifications</h3>
        {notifications.some(n => !n.is_read) && (
          <button className={styles.markAllBtn} onClick={onMarkAllAsRead}>
            Mark all as read
          </button>
        )}
      </div>
      <div className={styles.list}>
        {notifications.length === 0 ? (
          <div className={styles.empty}>No notifications yet.</div>
        ) : (
          notifications.map((notif) => {
            const iconSettings = TYPE_ICONS[notif.type] || TYPE_ICONS.info;
            return (
              <Link 
                key={notif.id} 
                to={notif.link || '#'} 
                className={`${styles.notification} ${!notif.is_read ? styles.unread : ''}`}
                onClick={() => {
                  if (!notif.is_read) onMarkAsRead(notif.id);
                  onClose();
                }}
              >
                <div className={styles.iconWrapper} style={{ color: iconSettings.color }}>
                  <AppIcon name={iconSettings.name} size={16} />
                </div>
                <div className={styles.content}>
                  <h4 className={styles.notifTitle}>
                    {notif.title}
                    {!notif.is_read && <span className={styles.unreadDot}></span>}
                  </h4>
                  <p className={styles.notifMessage}>{notif.message}</p>
                  <span className={styles.time}>{formatTime(notif.created_at)}</span>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;

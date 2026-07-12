import React from 'react';
import styles from './StatusBadge.module.css';

const STATUS_CONFIG = {
  // Vehicle
  Available:   { className: styles.success, label: 'Available' },
  'On Trip':   { className: styles.info,    label: 'On Trip' },
  'In Shop':   { className: styles.warning, label: 'In Shop' },
  Retired:     { className: styles.neutral, label: 'Retired' },
  // Driver
  'Off Duty':  { className: styles.neutral,  label: 'Off Duty' },
  Suspended:   { className: styles.danger,   label: 'Suspended' },
  // Trip
  Draft:       { className: styles.neutral,  label: 'Draft' },
  Dispatched:  { className: styles.info,     label: 'Dispatched' },
  Completed:   { className: styles.success,  label: 'Completed' },
  Cancelled:   { className: styles.danger,   label: 'Cancelled' },
  // Maintenance
  Open:        { className: styles.warning, label: 'Open' },
  Closed:      { className: styles.success, label: 'Closed' },
};

const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || { className: styles.neutral, label: status };
  return (
    <span className={`${styles.badge} ${config.className}`}>
      {config.label}
    </span>
  );
};

export default StatusBadge;

import React from 'react';
import styles from './KpiCard.module.css';

/**
 * KpiCard — displays a single KPI metric.
 * Props: title, value, icon, subtitle, trend (optional: 'up' | 'down' | 'neutral')
 */
const KpiCard = ({ title, value, icon, subtitle, trend }) => (
  <div className={styles.card}>
    <div className={styles.header}>
      <span className={styles.icon}>{icon}</span>
      <span className={`${styles.trend} ${trend ? styles[trend] : ''}`}>
        {trend === 'up' ? '↑' : trend === 'down' ? '↓' : ''}
      </span>
    </div>
    <div className={styles.value}>{value ?? '—'}</div>
    <div className={styles.title}>{title}</div>
    {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
  </div>
);

export default KpiCard;

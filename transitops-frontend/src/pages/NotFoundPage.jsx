import React from 'react';
import { Link } from 'react-router-dom';
import AppIcon from '../components/ui/AppIcon.jsx';
import styles from './NotFoundPage.module.css';

const NotFoundPage = () => (
  <div className={styles.page}>
    <div className={styles.content}>
      <div className={styles.code}>404</div>
      <h1>Page Not Found</h1>
      <p>The route you're looking for doesn't exist or you don't have access to it.</p>
      <Link to="/dashboard" className="btn btn-primary"><AppIcon name="arrowLeft" size={14} /> Back to Dashboard</Link>
    </div>
  </div>
);

export default NotFoundPage;

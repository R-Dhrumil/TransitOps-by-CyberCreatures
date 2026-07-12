import React from 'react';
import { Link } from 'react-router-dom';
import styles from './ErrorPage.module.css';

const ErrorPage = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  detail,
  primaryActionLabel = 'Go home',
  primaryAction,
  secondaryActionLabel,
  secondaryAction,
}) => (
  <div className={styles.page} role="alert" aria-live="assertive">
    <div className={styles.backdrop} />
    <div className={styles.card}>
      <div className={styles.badge}>Error</div>
      <h1>{title}</h1>
      <p>{message}</p>
      {detail ? <pre className={styles.detail}>{detail}</pre> : null}
      <div className={styles.actions}>
        {primaryAction ? (
          <button type="button" className={styles.primaryButton} onClick={primaryAction}>
            {primaryActionLabel}
          </button>
        ) : (
          <Link to="/dashboard" className={styles.primaryButton}>
            {primaryActionLabel}
          </Link>
        )}
        {secondaryActionLabel ? (
          <button type="button" className={styles.secondaryButton} onClick={secondaryAction}>
            {secondaryActionLabel}
          </button>
        ) : null}
      </div>
    </div>
  </div>
);

export default ErrorPage;
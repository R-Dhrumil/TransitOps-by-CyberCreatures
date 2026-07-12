import React from 'react';
import styles from './PageLoader.module.css';

const PageLoader = () => (
  <div className={styles.container}>
    <div className={styles.spinner} />
    <p className={styles.text}>Loading TransitOps…</p>
  </div>
);

export default PageLoader;

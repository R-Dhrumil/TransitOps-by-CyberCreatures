import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Navbar from './Navbar.jsx';
import styles from './AppLayout.module.css';

const AppLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className={`${styles.layout} ${sidebarCollapsed ? styles.collapsed : ''}`}>
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((c) => !c)} />
      <div className={styles.main}>
        <Navbar 
          searchQuery={searchQuery} 
          onSearchChange={setSearchQuery} 
          onMenuToggle={() => setSidebarCollapsed((c) => !c)} 
        />
        <main className={styles.content}>
          <Outlet context={{ searchQuery }} />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;

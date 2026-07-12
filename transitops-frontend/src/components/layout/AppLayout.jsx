import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Navbar from './Navbar.jsx';
import styles from './AppLayout.module.css';

const AppLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize(); // Init
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => setSidebarCollapsed((c) => !c);
  const closeSidebar = () => {
    if (isMobile) setSidebarCollapsed(true);
  };

  return (
    <div className={`${styles.layout} ${sidebarCollapsed ? styles.collapsed : ''} ${isMobile ? styles.isMobile : ''}`}>
      {isMobile && !sidebarCollapsed && (
        <div className={styles.backdrop} onClick={closeSidebar}></div>
      )}
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} isMobile={isMobile} />
      <div className={styles.main}>
        <Navbar 
          onMenuToggle={toggleSidebar}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        <main className={styles.content}>
          <Outlet context={{ searchQuery }} />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;

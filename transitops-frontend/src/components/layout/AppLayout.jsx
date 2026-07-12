import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Navbar from './Navbar.jsx';
import styles from './AppLayout.module.css';

const AppLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Touch gesture states
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Minimum swipe distance (in px) to register a swipe
  const minSwipeDistance = 50;

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

  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    // Swipe left to close
    if (isLeftSwipe && !sidebarCollapsed && isMobile) {
      setSidebarCollapsed(true);
    }
    
    // Swipe right to open (only if started near the left edge)
    if (isRightSwipe && sidebarCollapsed && isMobile && touchStart < 50) {
      setSidebarCollapsed(false);
    }
  };

  return (
    <div 
      className={`${styles.layout} ${sidebarCollapsed ? styles.collapsed : ''} ${isMobile ? styles.isMobile : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {isMobile && !sidebarCollapsed && (
        <div className={styles.backdrop} onClick={closeSidebar}></div>
      )}
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} isMobile={isMobile} />
      <div className={styles.main}>
        <Navbar 
          collapsed={sidebarCollapsed}
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

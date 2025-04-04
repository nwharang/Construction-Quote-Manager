import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslation } from '~/hooks/useTranslation';
import { Navigation } from '~/components/shared/Navigation';
import { Sidebar } from '~/components/shared/Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * Main layout component for the application
 * Includes sidebar navigation, top navbar, and content area
 * Fully responsive with mobile-optimized sidebar
 */
export function MainLayout({ children }: MainLayoutProps) {
  useSession();
  useTranslation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Only run client-side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen((prevState) => !prevState);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // Add event listener to close sidebar on window resize (to desktop)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Lock body scroll when sidebar is open on mobile
  useEffect(() => {
    if (!isMounted) return;
    
    if (isSidebarOpen && window.innerWidth < 768) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isSidebarOpen, isMounted]);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden" 
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Main content area with navbar */}
      <div className="flex flex-grow flex-col w-full">
        {/* Top Navigation */}
        <Navigation onMenuClick={toggleSidebar} />

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6">          
          {children}
        </main>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslation } from '~/utils/i18n';
import { Navigation } from '~/components/shared/Navigation';
import { Sidebar } from '~/components/shared/Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * Main layout component for the application
 * Includes sidebar navigation, top navbar, and content area
 */
export function MainLayout({ children }: MainLayoutProps) {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen((prevState) => !prevState);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      {/* Main content area with navbar */}
      <div className="flex flex-grow flex-col">
        {/* Top Navigation */}
        <Navigation onMenuClick={toggleSidebar} />

        {/* Main content */}
        <main className="flex-1 p-4">{children}</main>
      </div>
    </div>
  );
}

export default MainLayout;

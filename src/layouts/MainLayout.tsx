import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
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
 * Relies on Tailwind CSS for responsiveness
 */
export function MainLayout({ children }: MainLayoutProps) {
  useSession();
  const { t } = useTranslation();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
      <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
        <Navigation onMenuClick={toggleSidebar} />

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

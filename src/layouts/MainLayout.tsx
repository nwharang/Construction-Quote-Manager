import React from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Navigation } from '~/components/shared/Navigation';
import { Sidebar } from '~/components/shared/Sidebar';
import { useConfigStore } from '~/store';

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
  const { isNavOpen, toggleNav } = useConfigStore((state) => ({
    isNavOpen: state.isNavOpen,
    toggleNav: state.toggleNav,
  }));

  const toggleSidebar = () => toggleNav();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
      <Sidebar isOpen={isNavOpen} onClose={toggleSidebar} />

      {isNavOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
        <Navigation onMenuClick={toggleSidebar} />

        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

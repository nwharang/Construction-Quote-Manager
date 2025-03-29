import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Home, FileText, Package, Settings, ChevronLeft, Menu, Users } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { routes, navigationMenu } from '~/config/routes';

interface SidebarLink {
  name: string;
  href: string;
  icon: React.ReactNode;
}

export function SidebarComponent() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  // Map icons to navigation menu items
  const links: SidebarLink[] = navigationMenu.map((item) => {
    let icon;
    switch (item.icon) {
      case 'HomeIcon':
        icon = <Home className="h-5 w-5" />;
        break;
      case 'DocumentTextIcon':
        icon = <FileText className="h-5 w-5" />;
        break;
      case 'CubeIcon':
        icon = <Package className="h-5 w-5" />;
        break;
      case 'UserIcon':
        icon = <Users className="h-5 w-5" />;
        break;
      default:
        icon = <Home className="h-5 w-5" />;
    }
    return {
      name: item.label,
      href: item.href,
      icon,
    };
  });

  const isActive = (path: string) => {
    if (path === routes.admin.dashboard) {
      return router.pathname === path;
    }
    return router.pathname.startsWith(path);
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  if (!session) return null;

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="bg-primary fixed right-6 bottom-6 z-50 flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg md:hidden"
        aria-label="Toggle Sidebar"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Sidebar Background Overlay */}
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`bg-background fixed top-0 left-0 z-40 h-screen w-64 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between px-4">
            <h2 className="text-foreground text-xl font-bold">TTXD</h2>
            <button onClick={toggleSidebar} className="hover:bg-secondary rounded-md p-1 md:hidden">
              <ChevronLeft className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <ul className="space-y-1">
              {links.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className={`flex items-center rounded-md px-4 py-3 text-sm font-medium transition-colors ${
                      isActive(link.href)
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }`}
                    onClick={() => isMobile && setIsOpen(false)}
                  >
                    <span className="mr-3">{link.icon}</span>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="border-foreground/5 border-t p-4">
            <div className="text-muted-foreground text-xs">
              © {new Date().getFullYear()} TTXD Construction
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

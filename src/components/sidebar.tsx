import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Home, Menu, X, Settings, FileText, Package } from 'lucide-react';
import { Button, Card } from '@heroui/react';
import { routes, navigationMenu } from '~/config/routes';

// Icon mapping
const iconMap = {
  HomeIcon: Home,
  DocumentTextIcon: FileText,
  CubeIcon: Package,
  SettingsIcon: Settings,
} as const;

export default function Sidebar() {
  const router = useRouter();
  const sidebarRef = useRef(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isActive = (pathname: string) => router.pathname.includes(pathname);

  const toggleMobileMenu = () => {
    if (sidebarRef.current) {
      setIsMobileMenuOpen(!isMobileMenuOpen);
      (sidebarRef.current as HTMLElement).classList.toggle('-translate-x-full');
    }
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <Button
        isIconOnly
        color="primary"
        className="fixed md:hidden bottom-4 right-4 z-50 rounded-full shadow-lg"
        onPress={toggleMobileMenu}
        aria-label="Toggle mobile menu"
      >
        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </Button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Card
        ref={sidebarRef}
        className={`fixed sm:static sm:translate-x-0 top-0 left-0 h-full w-64 z-50 transform transition-transform duration-300 ease-in-out border-none shadow-none rounded-none ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full p-4">
          <div className="flex-1 space-y-1">
            {navigationMenu.map((item) => {
              const Icon = iconMap[item.icon as keyof typeof iconMap];
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center px-4 py-2 text-sm font-medium transition-colors rounded-lg duration-200 ${
                    isActive(item.href)
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-default-100 hover:text-foreground'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </Card>
    </>
  );
}

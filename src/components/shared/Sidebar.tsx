import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Listbox,
  ListboxItem,
  ListboxSection,
  Button,
  cn,
} from '@heroui/react';
import { Home, FileText, Package, Users, ChevronLeft } from 'lucide-react';
import { routes } from '~/config/routes';
import { useTranslation } from '~/hooks/useTranslation';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: session } = useSession();
  const [isMounted, setIsMounted] = useState(false);

  // Only run client-side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null; // Return nothing during SSR
  }

  // Navigation links with translated names
  const navItems = [
    { name: t('nav.dashboard'), href: routes.admin.dashboard, icon: <Home className="h-5 w-5" /> },
    { name: t('nav.quotes'), href: routes.admin.quotes.list, icon: <FileText className="h-5 w-5" /> },
    { name: t('nav.customers'), href: routes.admin.customers.list, icon: <Users className="h-5 w-5" /> },
    { name: t('nav.products'), href: routes.admin.products.list, icon: <Package className="h-5 w-5" /> },
  ];

  const isActive = (path: string) => {
    if (path === routes.admin.dashboard) {
      return router.pathname === path;
    }
    return router.pathname.startsWith(path);
  };

  // Use Tailwind's responsive utility for transform
  const sidebarClasses = cn(
    "fixed md:sticky top-0 left-0 z-40 min-h-screen w-[280px] bg-background flex flex-col shadow-lg md:shadow-none",
    "transition-transform duration-300 ease-in-out",
    isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
  );

  if (!session) {
    return null;
  }

  return (
    <aside className={sidebarClasses}>
      {/* Header */}
      <div className="flex h-16 items-center justify-between p-4 border-b border-divider">
        <Link href="/admin/dashboard" className="text-foreground text-xl font-bold">
          TTXD
        </Link>
        <Button
          isIconOnly
          variant="light"
          className="md:hidden"
          onPress={onClose}
          aria-label={t('common.closeSidebar')}
        >
          <ChevronLeft size={20} />
        </Button>
      </div>

      {/* Navigation Items */}
      <Listbox
        aria-label="Navigation menu"
        className="sticky flex-1 overflow-y-auto py-4"
        itemClasses={{
          base: 'px-4 py-3 rounded-none my-1',
          title: 'text-medium',
          selectedIcon: 'hidden',
        }}
        autoFocus={false}
        selectionMode="single"
      >
        <ListboxSection title={t('common.menu')} className="px-4 py-2 text-xs font-medium text-default-500">
          {navItems.map((item) => (
            <ListboxItem
              key={item.name}
              startContent={item.icon}
              onPress={() => {
                router.push(item.href);
                if (window.innerWidth < 768) {
                  onClose(); // Close sidebar on mobile when navigating
                }
              }}
              className={cn(
                'rounded-lg transition-colors hover:bg-default-100',
                isActive(item.href) ? 'bg-primary/10 text-primary font-medium' : ''
              )}
              aria-current={isActive(item.href) ? 'page' : undefined}
            >
              {item.name}
            </ListboxItem>
          ))}
        </ListboxSection>
      </Listbox>

      {/* Footer */}
      <div className="border-t border-divider p-4 text-xs text-default-400">
        {t('footer.copyright', { year: new Date().getFullYear() })}
      </div>
    </aside>
  );
}

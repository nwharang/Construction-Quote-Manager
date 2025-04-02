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
  const responsiveStyle = isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0';

  if (!session) {
    return null;
  }

  return (
    <>
      {/* Sidebar Container */}
      <aside
        className={`bg-background sticky flex h-dvh w-[280px] flex-col transition-transform duration-300 ease-in-out ${responsiveStyle}`}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between p-4">
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
          className="flex-1"
          itemClasses={{
            base: 'px-4 py-3 rounded-none',
            title: 'text-medium',
            selectedIcon: 'hidden',
          }}
          autoFocus={false}
          selectionMode="single"
        >
          <ListboxSection title={t('common.menu')} className="px-4 py-2 text-xs font-medium">
            {navItems.map((item) => (
              <ListboxItem
                key={item.name}
                startContent={item.icon}
                onPress={() => router.push(item.href)}
                className={cn(
                  'rounded-lg',
                  isActive(item.href) ? 'bg-primary/10 text-primary' : ''
                )}
                aria-current={isActive(item.href) ? 'page' : undefined}
              >
                {item.name}
              </ListboxItem>
            ))}
          </ListboxSection>
        </Listbox>

        {/* Footer */}
        <div className="text-default-400 p-4 text-xs">
          {t('footer.copyright', { year: new Date().getFullYear() })}
        </div>
      </aside>

      {/* Backdrop Overlay (mobile only) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
    </>
  );
}

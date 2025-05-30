import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Tabs, Tab, Button, cn, Avatar, Chip, Divider, Tooltip, Badge } from '@heroui/react';
import {
  Home,
  FileText,
  Package,
  Users,
  ChevronLeft,
  Settings,
  LogOut,
  Newspaper,
  Briefcase,
  Wrench,
  Folder,
  User,
} from 'lucide-react';
import { routes } from '~/config/routes';
import { useTranslation } from '~/hooks/useTranslation';
import { useConfigStore } from '~/store';
import { useAuthNavigation } from '~/utils/auth';
import { APP_NAME, APP_SHORT_NAME } from '~/config/constants';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const { settings } = useConfigStore();
  const [isMounted, setIsMounted] = useState(false);

  // Navigation tabs config (moved before getActiveKey)
  const mainNavItems = [
    {
      key: 'dashboard',
      label: t('nav.dashboard'),
      href: routes.admin.dashboard,
      icon: <Home size={18} />,
    },
    {
      key: 'quotes',
      label: t('nav.quotes'),
      href: routes.admin.quotes.list,
      icon: <FileText size={18} />,
      badgeCount: 3,
    },
    {
      key: 'customers',
      label: t('nav.customers'),
      href: routes.admin.customers.list,
      icon: <Users size={18} />,
    },
    {
      key: 'products',
      label: t('nav.products'),
      href: routes.admin.products.list,
      icon: <Package size={18} />,
    },
    {
      key: 'categories',
      label: t('categories.title'),
      href: routes.admin.categories.list,
      icon: <Folder size={18} />,
    },
  ];

  const instructionsNavItems = [
    {
      key: 'instructions',
      label: t('nav.instructions'),
      href: routes.instruction.list,
      icon: <Newspaper size={18} />,
    },
  ];
  // Find the active key based on the current pathname (now accesses initialized mainNavItems)
  const getActiveKey = () => {
    // 1. Handle Instructions route explicitly
    if (pathname.startsWith(routes.instruction.list)) {
      return 'instructions'; // Assuming 'instructions' is the key for the Instructions tab
    }

    // 2. Check for exact match for other main routes
    let active = mainNavItems.find((item) => item.href === pathname)?.key;
    if (active) return active;

    // 3. Check for starting path for other main routes (excluding dashboard)
    const sortedItems = [...mainNavItems].sort((a, b) => b.href.length - a.href.length);
    active = sortedItems.find(
      (item) => pathname.startsWith(item.href) && item.href !== routes.admin.dashboard
    )?.key;

    // 4. Default fallback
    return active || 'dashboard'; // Default to dashboard if nothing else matches
  };
  const activeKey = getActiveKey();

  // Only run client-side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null; // Return nothing during SSR
  }

  // Handle signout
  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: routes.auth.signIn });
  };

  // Use Tailwind's responsive utility for transform
  const sidebarClasses = cn(
    'fixed md:sticky top-0 left-0 z-40 min-h-screen w-[280px] bg-background',
    'border-r border-divider shadow-lg md:shadow-sm transition-transform duration-300 ease-in-out',
    'flex flex-col backdrop-blur-sm bg-background/95 dark:bg-background/90',
    isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
  );

  if (!session) {
    return null;
  }

  return (
    <aside className={sidebarClasses}>
      {/* Header with Logo */}
      <div className="border-divider bg-background/80 flex h-16 items-center justify-between border-b p-4">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-lg">
            <Wrench size={24} className="text-primary" />
          </div>
          <span className="text-foreground text-lg font-semibold">
            {settings?.companyName || APP_SHORT_NAME}
          </span>
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

      {/* Main Navigation Items */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <Tabs
          fullWidth
          variant="light"
          aria-label="Main Navigation"
          isVertical={true}
          selectedKey={activeKey}
          onSelectionChange={(key) => {
            if (window.innerWidth < 768) {
              onClose();
            }
          }}
        >
          <>
            {mainNavItems.map((tab) => (
              <Tab
                key={tab.key}
                href={tab.href}
                as={Link}
                className="justify-start"
                title={
                  <div className="flex w-full items-center gap-2.5">
                    <span>{tab.icon}</span>
                    <span className="text-default-700 group-data-[selected=true]:text-foreground">
                      {tab.label}
                    </span>
                  </div>
                }
              />
            ))}
          </>
        </Tabs>
        <Divider className="my-4" />
        <Tabs
          fullWidth
          variant="light"
          aria-label="Main Navigation"
          isVertical={true}
          selectedKey={activeKey}
          onSelectionChange={(key) => {
            if (window.innerWidth < 768) {
              onClose();
            }
          }}
        >
          {instructionsNavItems.map((tab) => (
            <Tab
              key={tab.key}
              href={tab.href}
              as={Link}
              className="justify-start"
              title={
                <div className="flex w-full items-center gap-2.5">
                  <span>{tab.icon}</span>
                  <span className="text-default-700 group-data-[selected=true]:text-foreground">
                    {tab.label}
                  </span>
                </div>
              }
            />
          ))}
        </Tabs>
      </div>

      {/* Footer section */}
      <div className="border-divider bg-default-50/40 dark:bg-default-50/5 border-t p-4">
        <div className="flex items-center justify-between">
          {/* Quick action buttons - Consider making these Tabs or Buttons with href if applicable */}
          <div className="flex gap-2">
            <Tooltip content={t('nav.account')}>
              <Button
                isIconOnly
                variant="light"
                size="sm"
                aria-label={t('nav.account')}
                onPress={() => router.push(routes.admin.account)}
                className={pathname === routes.admin.account ? 'bg-default-200' : ''}
              >
                <User size={18} />
              </Button>
            </Tooltip>
            <Tooltip content={t('nav.settings')}>
              <Button
                isIconOnly
                variant="light"
                size="sm"
                aria-label={t('nav.settings')}
                onPress={() => router.push(routes.admin.settings)}
                className={pathname === routes.admin.settings ? 'bg-default-200' : ''}
              >
                <Settings size={18} />
              </Button>
            </Tooltip>
          </div>

          {/* Logout Button */}
          <Tooltip content={t('userMenu.signOut')}>
            <Button
              isIconOnly
              variant="light"
              color="danger"
              size="sm"
              aria-label={t('userMenu.signOut')}
              onPress={handleSignOut}
            >
              <LogOut size={18} />
            </Button>
          </Tooltip>
        </div>
      </div>
    </aside>
  );
}

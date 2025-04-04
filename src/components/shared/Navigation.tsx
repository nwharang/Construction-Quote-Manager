import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';
import {
  Navbar,
  NavbarContent,
  NavbarItem,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar,
  Button,
} from '@heroui/react';
import { Menu, Settings, LogOut, Users } from 'lucide-react';
import { ThemeToggle } from '~/components/ThemeToggle';
import { LocaleSwitch } from '~/components/LocaleSwitch';
import { useTranslation } from '~/hooks/useTranslation';

interface NavigationProps {
  onMenuClick: () => void;
}

/**
 * Top navigation bar component with user dropdown and theme toggle
 * Fully responsive with mobile-optimized menu button
 */
export function Navigation({ onMenuClick }: NavigationProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isMounted, setIsMounted] = useState(false);

  // Only run client-side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null; // Return nothing during SSR
  }

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/auth/signin' });
  };

  // Check if path is active
  const isActive = (path: string) => router.pathname.startsWith(path);
  const isProfileActive = isActive('/admin/profile');
  const isSettingsActive = isActive('/admin/settings');

  if (!session && status !== 'loading') {
    return null;
  }

  return (
    <Navbar 
      maxWidth="full" 
      position="sticky" 
      className="border-b border-divider h-16 z-20"
    >
      {/* Mobile menu button */}
      <NavbarContent className="md:hidden" justify="start">
        <Button 
          isIconOnly 
          variant="light" 
          onClick={onMenuClick} 
          aria-label={t('common.openMenu')}
          className="text-default-600"
        >
          <Menu size={24} />
        </Button>
      </NavbarContent>

      {/* Title for mobile (optional) */}
      <NavbarContent className="md:hidden" justify="center">
        <span className="text-foreground font-semibold">TTXD</span>
      </NavbarContent>

      {/* Right side items */}
      <NavbarContent justify="end" className="gap-2">
        <NavbarItem>
          <LocaleSwitch />
        </NavbarItem>

        <NavbarItem>
          <ThemeToggle />
        </NavbarItem>

        {/* Notifications dropdown */}
        {/* <NavbarItem>
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button
                variant="light"
                isIconOnly
                aria-label="Notifications"
                className="text-default-500"
              >
                <Badge content="3" color="danger" size="sm">
                  <Bell size={20} />
                </Badge>
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Notifications">
              <DropdownItem key="notification-1">New quote request</DropdownItem>
              <DropdownItem key="notification-2">Customer message</DropdownItem>
              <DropdownItem key="view-all">View all notifications</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </NavbarItem> */}

        {/* User menu dropdown */}
        <NavbarItem>
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Avatar
                as="button"
                className="transition-transform"
                size="sm"
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                  session?.user?.name || t('common.user')
                )}`}
                fallback={session?.user?.name?.[0] || t('common.user')[0]}
              />
            </DropdownTrigger>
            <DropdownMenu aria-label={t('userMenu.title')}>
              <DropdownItem
                key="profile"
                startContent={<Users size={16} />}
                className={isProfileActive ? 'text-primary' : ''}
                href="/admin/profile"
              >
                {t('userMenu.profile')}
              </DropdownItem>
              <DropdownItem
                key="settings"
                startContent={<Settings size={16} />}
                className={isSettingsActive ? 'text-primary' : ''}
                href="/admin/settings"
              >
                {t('userMenu.settings')}
              </DropdownItem>
              <DropdownItem
                key="logout"
                color="danger"
                startContent={<LogOut size={16} />}
                onPress={handleSignOut}
              >
                {t('userMenu.signOut')}
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}

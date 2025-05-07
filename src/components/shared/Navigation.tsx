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
import { LocaleSelector } from '~/components/ui/LocaleSelector';
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
  const isSettingsActive = isActive('/admin/settings');

  if (!session && status !== 'loading') {
    return null;
  }

  return (
    <Navbar maxWidth="full" position="sticky" className="border-divider z-20 h-16 border-b">
      {/* Mobile menu button */}
      <NavbarContent className="md:hidden" justify="start">
        <Button
          isIconOnly
          variant="light"
          onPress={onMenuClick}
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
          <LocaleSelector variant="mini" />
        </NavbarItem>

        <NavbarItem>
          <ThemeToggle />
        </NavbarItem>

        {/* User menu dropdown */}
        <NavbarItem>
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Avatar
                as="button"
                className="rounded-full transition-transform"
                size="sm"
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                  session?.user?.name || t('common.user')
                )}`}
                fallback={session?.user?.name?.[0] || t('common.user')[0]}
              />
            </DropdownTrigger>
            <DropdownMenu aria-label={t('userMenu.title')}>
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

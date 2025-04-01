import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar,
  Button,
  Badge,
} from '@heroui/react';
import { Menu, Bell, Settings, LogOut, Users } from 'lucide-react';
import { ThemeToggle } from '~/components/ThemeToggle';
import { LocaleSwitch } from '~/components/LocaleSwitch';

interface NavigationProps {
  onMenuClick: () => void;
}

/**
 * Top navigation bar component with user dropdown and theme toggle
 */
export function Navigation({ onMenuClick }: NavigationProps) {
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
    <Navbar maxWidth="full" position="sticky">
      {/* Mobile menu button */}
      <NavbarContent className="md:hidden" justify="start">
        <Button isIconOnly variant="light" onClick={onMenuClick} aria-label="Open menu">
          <Menu size={24} />
        </Button>
      </NavbarContent>

      {/* Right side items */}
      <NavbarContent justify="end">
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
                  session?.user?.name || 'User'
                )}`}
                fallback={session?.user?.name?.[0] || 'U'}
              />
            </DropdownTrigger>
            <DropdownMenu aria-label="User menu">
              <DropdownItem
                key="profile"
                startContent={<Users size={16} />}
                className={isProfileActive ? 'text-primary' : ''}
              >
                <Link href="/admin/profile">Profile</Link>
              </DropdownItem>
              <DropdownItem
                key="settings"
                startContent={<Settings size={16} />}
                className={isSettingsActive ? 'text-primary' : ''}
              >
                <Link href="/admin/settings">Settings</Link>
              </DropdownItem>
              <DropdownItem
                key="logout"
                color="danger"
                startContent={<LogOut size={16} />}
                onPress={handleSignOut}
              >
                Sign Out
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}

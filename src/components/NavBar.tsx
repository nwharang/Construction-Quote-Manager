import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';
import { PlusCircle, User, LogOut, Settings, Bell } from 'lucide-react';
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar,
  Badge,
} from '@heroui/react';
import { ThemeToggle } from './ThemeToggle';
import { routes } from '~/config/routes';

export function NavBar() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/auth/signin' });
  };

  const isQuotesPage = router.pathname.includes('/admin/quotes');

  return (
    <Navbar maxWidth="full" position="static" isBordered={false} isBlurred={false}>
      <NavbarContent justify="end" className="gap-3">
        {isQuotesPage && (
          <Button
            as={Link}
            href={routes.admin.quotes.new}
            color="primary"
            startContent={<PlusCircle size={18} />}
            className="mr-2"
          >
            New Quote
          </Button>
        )}

        <ThemeToggle />

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
            <DropdownItem key="notification-1">Notification 1</DropdownItem>
            <DropdownItem key="notification-2">Notification 2</DropdownItem>
            <DropdownItem key="view-all">View all notifications</DropdownItem>
          </DropdownMenu>
        </Dropdown>

        {session ? (
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button variant="light" className="p-0">
                <Avatar
                  name={session.user?.name?.charAt(0) ?? 'U'}
                  size="sm"
                  className="cursor-pointer transition-transform"
                />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="User menu">
              <DropdownItem
                key="profile"
                startContent={<User size={16} />}
                onPress={() => router.push('/admin/profile')}
              >
                Profile
              </DropdownItem>
              <DropdownItem
                key="settings"
                startContent={<Settings size={16} />}
                onPress={() => router.push('/admin/settings')}
              >
                Settings
              </DropdownItem>
              <DropdownItem
                key="logout"
                className="text-danger"
                color="danger"
                startContent={<LogOut size={16} />}
                onPress={handleSignOut}
              >
                Sign Out
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        ) : (
          <Button as={Link} href="/auth/signin" color="primary" variant="flat">
            Sign In
          </Button>
        )}
      </NavbarContent>
    </Navbar>
  );
}

import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Button,
  Link,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/react';
import { LogIn, LogOut, User, ChevronDown, Settings } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { signOut, signIn } from 'next-auth/react';
import { routes } from '~/config/routes';
import { ThemeToggle } from './ThemeToggle';
import { LanguageMetaData } from './accessibility/LanguageMetaData';
import { KeyboardFocusIndicator } from './ui/KeyboardFocusIndicator';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

interface Route {
  name: string;
  href: string;
}

const navigationRoutes: Route[] = [
  { name: 'Dashboard', href: routes.admin.dashboard },
  { name: 'Quotes', href: routes.admin.quotes.list },
  { name: 'Products', href: routes.admin.products.list },
];

/**
 * Main layout component for the application
 * Includes accessibility features like skip to content, semantic landmarks, and aria attributes
 */
export function Layout({ children, title, description }: LayoutProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  const handleSignIn = () => {
    signIn(undefined, { callbackUrl: '/admin/dashboard' });
  };

  return (
    <KeyboardFocusIndicator className="min-h-screen">
      <Head>
        <title>
          {title ? `${title} | Construction Quote Manager` : 'Construction Quote Manager'}
        </title>
        <meta name="description" content={description || 'Construction Quote Manager'} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Language metadata for screen readers */}
      <LanguageMetaData />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Navigation Header */}
        <Navbar maxWidth={'full'} as="header" role="navigation" aria-label="Main Navigation">
          <NavbarBrand className="hidden sm:block">
            <Link href="/" className="text-foreground/90 text-xl font-bold">
              TTXD
            </Link>
          </NavbarBrand>

          <NavbarContent justify="end">
            <NavbarItem>
              <ThemeToggle />
            </NavbarItem>

            {session ? (
              <NavbarItem>
                <Dropdown>
                  <DropdownTrigger>
                    <Button
                      variant="light"
                      startContent={<User size={20} />}
                      endContent={<ChevronDown size={16} />}
                      aria-label="User account menu"
                    >
                      {session.user?.name}
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
              </NavbarItem>
            ) : (
              <NavbarItem>
                <Button
                  color="primary"
                  startContent={<LogIn size={20} />}
                  onPress={handleSignIn}
                  aria-label="Sign in to your account"
                >
                  Sign In
                </Button>
              </NavbarItem>
            )}
          </NavbarContent>
        </Navbar>

        <div className="flex flex-1">
          {/* Main content area with id for skip link */}
          <main id="main-content" className="flex-1 overflow-y-auto p-4" tabIndex={-1}>
            {children}
          </main>
        </div>
      </div>
    </KeyboardFocusIndicator>
  );
}

import React, { useEffect, useState } from 'react';
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
import { Moon, Sun, LogIn, LogOut, User, ChevronDown, Settings } from 'lucide-react';
import Sidebar from './sidebar';
import { useTheme } from 'next-themes';
import { useSession } from 'next-auth/react';
import { signOut, signIn } from 'next-auth/react';
import { routes } from '~/config/routes';

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

export function Layout({ children, title, description }: LayoutProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  const handleSignIn = () => {
    signIn(undefined, { callbackUrl: '/admin/dashboard' });
  };

  return (
    <div className="min-h-screen">
      <Head>
        <title>
          {title ? `${title} | Construction Quote Manager` : 'Construction Quote Manager'}
        </title>
        <meta name="description" content={description || 'Construction Quote Manager'} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex h-screen">
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar maxWidth={'full'}>
            <NavbarBrand className='hidden sm:block'>
              <Link href="/" className="font-bold text-xl text-foreground/90">
                TTXD
              </Link>
            </NavbarBrand>

            <NavbarContent justify="end">
              <NavbarItem>
                <Button
                  isIconOnly
                  variant="light"
                  onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  aria-label="Toggle theme"
                >
                  {mounted && (theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />)}
                </Button>
              </NavbarItem>

              {session ? (
                <NavbarItem>
                  <Dropdown>
                    <DropdownTrigger>
                      <Button
                        variant="light"
                        startContent={<User size={20} />}
                        endContent={<ChevronDown size={16} />}
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
                  <Button color="primary" startContent={<LogIn size={20} />} onPress={handleSignIn}>
                    Sign In
                  </Button>
                </NavbarItem>
              )}
            </NavbarContent>
          </Navbar>
          <div className="mx-auto flex-1 flex size-full min-h-[calc(100vh-3.5rem)]">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
}

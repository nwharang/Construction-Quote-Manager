import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Navbar, NavbarBrand, NavbarContent, NavbarItem, Button, Link } from '@heroui/react';
import { Moon, Sun, LogIn, LogOut } from 'lucide-react';
import Sidebar from './sidebar';
import { useTheme } from 'next-themes';
import { useSession } from 'next-auth/react';
import { signOut, signIn } from 'next-auth/react';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

// Define header height as a constant
export function Layout({ children, title, description }: LayoutProps) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { data: session, status } = useSession();

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Default metadata
  const pageTitle = title || 'Application';
  const pageDescription = description || 'Manage your business with our application';

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex justify-center content-center overflow-hidden">
        <Navbar className="border-b shadow-sm border-divider px-4 ">
          <NavbarBrand>
            <Link href="/" className="font-bold text-inherit">
              MyApp
            </Link>
          </NavbarBrand>

          <NavbarContent justify="end">
            {mounted && (
              <NavbarItem>
                <Button isIconOnly aria-label="Toggle theme"  onPress={toggleTheme}>
                  {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </Button>
              </NavbarItem>
            )}
            <NavbarItem>
              {status != 'authenticated' && (
                <Button as={Link} color="primary" onPress={() => signIn()}>
                  <LogIn size={20} />
                </Button>
              )}
              {status == 'authenticated' && (
                <Button as={Link} color="primary" onPress={() => signOut()}>
                  <LogOut size={20} />
                </Button>
              )}
            </NavbarItem>
          </NavbarContent>
        </Navbar>
      </div>

      <div className="flex-1 flex size-full min-h-[calc(100vh-60px)]">
        {mounted && <Sidebar />}
        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
      </div>
    </>
  );
}

import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Navbar, NavbarBrand, NavbarContent, NavbarItem, Button, Link } from '@nextui-org/react';
import { Plus, Moon, Sun } from 'lucide-react';
import Sidebar from './sidebar';
import { useTheme } from 'next-themes';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

// Define header height as a constant
const HEADER_HEIGHT = '60px';

export function Layout({ children, title, description }: LayoutProps) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  
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
      
      <div className="flex flex-col min-h-screen">
        <Navbar 
          className="border-b shadow-sm border-divider"
          style={{ height: HEADER_HEIGHT }}
        >
          <NavbarBrand>
            <Link href="/" className="font-bold text-inherit">
              MyApp
            </Link>
          </NavbarBrand>
          
          <NavbarContent justify="end">
            {mounted && (
              <NavbarItem>
                <Button
                  isIconOnly
                  aria-label="Toggle theme"
                  variant="light"
                  onClick={toggleTheme}
                >
                  {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </Button>
              </NavbarItem>
            )}
            <NavbarItem>
              <Button 
                as={Link} 
                color="primary" 
                href="/quotes/new" 
                variant="flat"
                startContent={<Plus size={16} />}
              >
                New Quote
              </Button>
            </NavbarItem>
          </NavbarContent>
        </Navbar>
        
        <div className="flex-1 flex" style={{ height: `calc(100vh - ${HEADER_HEIGHT})` }}>
          {mounted && <Sidebar />}
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </>
  );
} 
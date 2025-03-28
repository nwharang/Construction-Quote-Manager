'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import {
  Button,
  DropdownItem,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  Avatar,
} from '@heroui/react';
import { Menu, LogOut, Moon, Sun, Monitor, LogIn } from 'lucide-react';

interface HeaderProps {
  onSidebarOpen?: () => void;
}

export function Header({ onSidebarOpen }: HeaderProps) {
  const { data: session, status: sessionStatus } = useSession();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="border-b border-divider bg-background/70 backdrop-blur-lg" role="banner">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Button
            isIconOnly
            className="md:hidden"
            onPress={onSidebarOpen}
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Link href="/" className="text-xl font-bold" aria-label="Construction Quote Manager home">
            Construction Quote Manager
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <nav className="hidden md:flex" aria-label="Main navigation">
            <ul className="flex gap-4">
              <li>
                <Button as={Link} href="/quotes" aria-label="View all quotes">
                  Quotes
                </Button>
              </li>
              <li>
                <Button as={Link} href="/products" aria-label="Manage products">
                  Products
                </Button>
              </li>
              <li>
                <Button as={Link} href="/quotes/new" color="primary" aria-label="Create new quote">
                  New Quote
                </Button>
              </li>
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            {mounted && (
              <Dropdown>
                <DropdownTrigger>
                  <Button isIconOnly aria-label="Change theme">
                    {theme === 'light' ? (
                      <Sun className="h-5 w-5" />
                    ) : theme === 'dark' ? (
                      <Moon className="h-5 w-5" />
                    ) : (
                      <Monitor className="h-5 w-5" />
                    )}
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Theme options">
                  <DropdownItem
                    key="light"
                    textValue="Light theme"
                    startContent={<Sun className="h-4 w-4" />}
                    onPress={() => setTheme('light')}
                  >
                    Light
                  </DropdownItem>
                  <DropdownItem
                    key="dark"
                    textValue="Dark theme"
                    startContent={<Moon className="h-4 w-4" />}
                    onPress={() => setTheme('dark')}
                  >
                    Dark
                  </DropdownItem>
                  <DropdownItem
                    key="system"
                    textValue="System theme"
                    startContent={<Monitor className="h-4 w-4" />}
                    onPress={() => setTheme('system')}
                  >
                    System
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            )}

            {sessionStatus === 'authenticated' && session ? (
              <Dropdown>
                <DropdownTrigger></DropdownTrigger>
                <DropdownMenu aria-label="User account actions">
                  <DropdownItem key="profile" textValue="Profile">
                    Profile
                  </DropdownItem>
                  <DropdownItem
                    key="logout"
                    textValue="Logout"
                    onPress={() => signOut()}
                    startContent={<LogOut className="h-4 w-4" />}
                  >
                    Logout
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            ) : (
              <Button
                as={Link}
                href="/auth/signin"
                startContent={<LogIn className="h-4 w-4" />}
                aria-label="Sign in"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

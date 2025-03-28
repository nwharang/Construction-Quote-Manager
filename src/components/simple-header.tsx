"use client";

import * as React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  Button,
  DropdownItem,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
} from "@heroui/react";
import { Menu, Moon, Sun, Monitor } from "lucide-react";

interface SimpleHeaderProps {
  onSidebarOpen?: () => void;
}

export function SimpleHeader({ onSidebarOpen }: SimpleHeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="fixed top-0 z-50 w-full border-b border-divider bg-background/90 backdrop-blur-lg shadow-sm" role="banner">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Button 
            isIconOnly 
             
            className="md:hidden" 
            onClick={onSidebarOpen}
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
                <Button as={Link} href="/quotes"  aria-label="View all quotes">
                  Quotes
                </Button>
              </li>
              <li>
                <Button as={Link} href="/products"  aria-label="Manage products">
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
                  <Button 
                    isIconOnly 
                     
                    aria-label="Change theme"
                    className="rounded-full bg-default-100 hover:bg-default-200 dark:bg-default-800 dark:hover:bg-default-700 transition-all focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {theme === "light" ? (
                      <Sun className="h-5 w-5 text-yellow-500" />
                    ) : theme === "dark" ? (
                      <Moon className="h-5 w-5 text-blue-400" />
                    ) : (
                      <Monitor className="h-5 w-5" />
                    )}
                  </Button>
                </DropdownTrigger>
                <DropdownMenu 
                  aria-label="Theme options"
                  className="p-1"
                >
                  <DropdownItem 
                    key="light" 
                    textValue="Light theme"
                    startContent={<Sun className="h-4 w-4 text-yellow-500" />}
                    onClick={() => setTheme("light")}
                    className="hover:bg-default-100 data-[hover=true]:bg-default-100 transition-colors"
                  >
                    <span className="font-medium">Light</span>
                  </DropdownItem>
                  <DropdownItem 
                    key="dark" 
                    textValue="Dark theme"
                    startContent={<Moon className="h-4 w-4 text-blue-400" />}
                    onClick={() => setTheme("dark")}
                    className="hover:bg-default-100 data-[hover=true]:bg-default-100 transition-colors"
                  >
                    <span className="font-medium">Dark</span>
                  </DropdownItem>
                  <DropdownItem 
                    key="system" 
                    textValue="System theme"
                    startContent={<Monitor className="h-4 w-4" />}
                    onClick={() => setTheme("system")}
                    className="hover:bg-default-100 data-[hover=true]:bg-default-100 transition-colors"
                  >
                    <span className="font-medium">System</span>
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 
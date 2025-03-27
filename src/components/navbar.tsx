"use client";

import * as React from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import {
  Navbar as NextUINavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Button,
  DropdownItem,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  Avatar,
} from "@nextui-org/react";
import { Menu, Moon, Sun, Monitor, LogOut } from "lucide-react";

interface NavbarProps {
  onSidebarOpen?: () => void;
}

export function Navbar({ onSidebarOpen }: NavbarProps) {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="border-b border-divider bg-background/70 backdrop-blur-lg" role="navigation" aria-label="Main Navigation">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Button 
            isIconOnly 
            variant="light" 
            className="md:hidden" 
            onClick={onSidebarOpen}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Link href="/" className="text-xl font-bold">
            Construction Quote Manager
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex gap-4">
            <Button as={Link} href="/quotes" variant="light" aria-label="View all quotes">
              Quotes
            </Button>
            <Button as={Link} href="/products" variant="light" aria-label="Manage products">
              Products
            </Button>
            <Button as={Link} href="/quotes/new" color="primary" aria-label="Create new quote">
              New Quote
            </Button>
          </div>
          
          {session ? (
            <Dropdown>
              <DropdownTrigger>
                <Button isIconOnly variant="light" aria-label="User menu">
                  <Avatar 
                    name={session.user?.name || "User"} 
                    size="sm" 
                    src={session.user?.image || undefined} 
                    alt="User avatar" 
                  />
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="User actions">
                <DropdownItem key="profile" textValue="Profile">
                  Profile
                </DropdownItem>
                <DropdownItem 
                  key="logout" 
                  textValue="Logout"
                  onClick={() => signOut()}
                  startContent={<LogOut className="h-4 w-4" />}
                >
                  Logout
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          ) : (
            <Button as={Link} href="/auth/signin" variant="light" aria-label="Sign in">
              Sign In
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}

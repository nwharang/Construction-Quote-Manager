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
import { Menu, Moon, Sun, Monitor } from "lucide-react";

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
    <nav className="border-b border-divider bg-background/70 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold">
          Quote Manager
        </Link>
        <div className="flex gap-4">
          <Button as={Link} href="/quotes" variant="light">
            Quotes
          </Button>
          <Button as={Link} href="/quotes/new" color="primary">
            New Quote
          </Button>
        </div>
      </div>
    </nav>
  );
}

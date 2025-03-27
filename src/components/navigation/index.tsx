"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
  Link,
  Button,
} from "@nextui-org/react";
import { useSession, signOut } from "next-auth/react";

const navigationItems = [
  { name: "Home", href: "/" },
  { name: "Dashboard", href: "/dashboard" },
  { name: "Settings", href: "/settings" },
];

export function Navigation() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <Navbar
      isBordered
      isMenuOpen={isMenuOpen}
      onMenuOpenChange={setIsMenuOpen}
      className="bg-background/70 backdrop-blur-lg"
      maxWidth="full"
      position="sticky"
    >
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <Link className="font-bold text-inherit" href="/">
            TTXD
          </Link>
        </NavbarBrand>
        <ul className="hidden sm:flex gap-4 justify-start ml-2">
          {navigationItems.map((item) => (
            <NavbarItem
              key={item.href}
              isActive={pathname === item.href}
              className="data-[active=true]:font-medium"
            >
              <Link
                color={pathname === item.href ? "primary" : "foreground"}
                href={item.href}
                size="sm"
              >
                {item.name}
              </Link>
            </NavbarItem>
          ))}
        </ul>
      </NavbarContent>

      <NavbarContent justify="end">
        {session ? (
          <NavbarItem>
            <Button
              variant="flat"
              color="danger"
              onClick={() => void signOut()}
              size="sm"
            >
              Sign Out
            </Button>
          </NavbarItem>
        ) : (
          <>
            <NavbarItem className="hidden sm:flex">
              <Link href="/auth/signin" size="sm">
                Sign In
              </Link>
            </NavbarItem>
            <NavbarItem>
              <Button
                as={Link}
                color="primary"
                href="/auth/signup"
                variant="flat"
                size="sm"
              >
                Sign Up
              </Button>
            </NavbarItem>
          </>
        )}
        <NavbarMenuToggle
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          className="sm:hidden"
        />
      </NavbarContent>

      <NavbarMenu>
        {navigationItems.map((item) => (
          <NavbarMenuItem key={item.href}>
            <Link
              color={pathname === item.href ? "primary" : "foreground"}
              className="w-full"
              href={item.href}
              size="lg"
            >
              {item.name}
            </Link>
          </NavbarMenuItem>
        ))}
        {!session && (
          <NavbarMenuItem>
            <Link
              color="foreground"
              className="w-full"
              href="/auth/signin"
              size="lg"
            >
              Sign In
            </Link>
          </NavbarMenuItem>
        )}
      </NavbarMenu>
    </Navbar>
  );
} 
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Settings, 
  Home,
  X,
  Users,
  Calendar,
  BarChart
} from "lucide-react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
  ScrollShadow,
} from "@nextui-org/react";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/analytics", label: "Analytics", icon: BarChart },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/team", label: "Team", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      classNames={{
        base: "h-screen m-0 max-w-[300px] rounded-none",
        header: "border-b",
        body: "p-0",
      }}
      motionProps={{
        variants: {
          enter: {
            x: 0,
            opacity: 1,
            transition: {
              duration: 0.3,
              ease: "easeOut",
            },
          },
          exit: {
            x: -300,
            opacity: 0,
            transition: {
              duration: 0.2,
              ease: "easeIn",
            },
          },
        }
      }}
    >
      <ModalContent>
        <ModalHeader className="flex items-center justify-between">
          <span className="text-lg font-bold">TTXD</span>
          <Button
            isIconOnly
            variant="light"
            onPress={onClose}
            className="data-[hover]:bg-default-100"
          >
            <X className="h-5 w-5" />
          </Button>
        </ModalHeader>
        <ModalBody>
          <ScrollShadow className="h-[calc(100vh-80px)]">
            <nav className="flex flex-col gap-2 p-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Button
                    key={item.href}
                    as={Link}
                    href={item.href}
                    variant={isActive ? "flat" : "light"}
                    color={isActive ? "primary" : "default"}
                    className="justify-start gap-2"
                    startContent={<Icon className="h-5 w-5" />}
                    onClick={onClose}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </nav>
          </ScrollShadow>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
} 
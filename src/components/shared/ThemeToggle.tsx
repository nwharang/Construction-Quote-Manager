'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '~/components/providers/ThemeProvider';
import { Button, Tooltip, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/react';
import { Sun, Moon, Monitor } from 'lucide-react';

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  // After mounting, we can access the theme
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get icon based on resolved theme
  const getThemeIcon = () => {
    if (!mounted) return null;
    switch (resolvedTheme) {
      case 'dark':
        return <Moon size={18} />;
      case 'light':
        return <Sun size={18} />;
      default:
        return <Sun size={18} />;
    }
  };

  if (!mounted) {
    // Prevent hydration issues with a placeholder
    return <Button isIconOnly variant="light" className="h-9 w-9" />;
  }

  return (
    <Dropdown placement="bottom-end">
      <DropdownTrigger>
        <Button
          isIconOnly
          variant="light"
          aria-label="Toggle theme"
          className="h-9 w-9 text-default-500"
        >
          {getThemeIcon()}
        </Button>
      </DropdownTrigger>
      <DropdownMenu aria-label="Theme options">
        <DropdownItem
          key="light"
          startContent={<Sun size={16} />}
          onClick={() => setTheme('light')}
          className={theme === 'light' ? 'text-primary font-medium' : ''}
        >
          Light
        </DropdownItem>
        <DropdownItem
          key="dark"
          startContent={<Moon size={16} />}
          onClick={() => setTheme('dark')}
          className={theme === 'dark' ? 'text-primary font-medium' : ''}
        >
          Dark
        </DropdownItem>
        <DropdownItem
          key="system"
          startContent={<Monitor size={16} />}
          onClick={() => setTheme('system')}
          className={theme === 'system' ? 'text-primary font-medium' : ''}
        >
          System
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
} 
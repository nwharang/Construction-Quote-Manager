import React, { useEffect, useState } from 'react';
import { Button } from '@nextui-org/react';
import { Moon, Sun } from 'lucide-react';

// Simple theme toggle component that works on the client-side only
export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Check the initial theme on mount
  useEffect(() => {
    // Check if we're in the browser
    if (typeof window !== 'undefined') {
      // Check if dark mode is enabled
      const isDarkMode = document.documentElement.classList.contains('dark');
      setIsDark(isDarkMode);
      setMounted(true);
    }
  }, []);

  // Toggle the theme
  const toggleTheme = () => {
    if (typeof window !== 'undefined') {
      // Toggle the dark class on the html element
      document.documentElement.classList.toggle('dark');
      // Update the state
      setIsDark(!isDark);
      // Save the preference
      localStorage.setItem('theme', isDark ? 'light' : 'dark');
    }
  };

  // Return a placeholder until mounted to avoid hydration mismatch
  if (!mounted) {
    return <div className="w-10 h-10" />;
  }

  return (
    <Button 
      isIconOnly
      variant="light"
      className="rounded-full bg-default-100/80 hover:bg-default-200 dark:bg-default-800/80 dark:hover:bg-default-700"
      aria-label="Toggle theme"
      onClick={toggleTheme}
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </Button>
  );
} 
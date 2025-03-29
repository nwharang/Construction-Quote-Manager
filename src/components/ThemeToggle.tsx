import { useTheme } from '@/components/providers/ThemeProvider';
import { Button } from '@heroui/react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useAppToast } from '@/components/providers/ToastProvider';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { success } = useAppToast();

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    success(`Theme changed to ${newTheme}`);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        isIconOnly
        variant={theme === 'light' ? 'solid' : 'ghost'}
        onPress={() => handleThemeChange('light')}
        className="p-2"
        aria-label="Light theme"
      >
        <Sun className="h-5 w-5" />
      </Button>
      <Button
        isIconOnly
        variant={theme === 'dark' ? 'solid' : 'ghost'}
        onPress={() => handleThemeChange('dark')}
        className="p-2"
        aria-label="Dark theme"
      >
        <Moon className="h-5 w-5" />
      </Button>
      <Button
        isIconOnly
        variant={theme === 'system' ? 'solid' : 'ghost'}
        onPress={() => handleThemeChange('system')}
        className="p-2"
        aria-label="System theme"
      >
        <Monitor className="h-5 w-5" />
      </Button>
    </div>
  );
} 
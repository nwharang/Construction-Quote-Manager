import { useTheme } from '~/components/providers/ThemeProvider';
import { Button } from '@heroui/react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useAppToast } from '~/components/providers/ToastProvider';

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
        variant={theme === 'light' ? 'solid' : 'ghost'}
        onClick={() => handleThemeChange('light')}
        className="p-2"
      >
        <Sun className="h-5 w-5" />
      </Button>
      <Button
        variant={theme === 'dark' ? 'solid' : 'ghost'}
        onClick={() => handleThemeChange('dark')}
        className="p-2"
      >
        <Moon className="h-5 w-5" />
      </Button>
      <Button
        variant={theme === 'system' ? 'solid' : 'ghost'}
        onClick={() => handleThemeChange('system')}
        className="p-2"
      >
        <Monitor className="h-5 w-5" />
      </Button>
    </div>
  );
} 
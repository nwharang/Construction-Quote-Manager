import React from 'react';
import { Navbar, NavbarBrand, NavbarContent, NavbarItem, Link, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button, Avatar } from '@heroui/react';
import { useSession, signOut } from 'next-auth/react';
import { useTranslation } from '~/utils/i18n';
import { LocaleSwitch } from '~/components/LocaleSwitch';

interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * Main layout component for the application
 * Includes navigation header and content area
 */
export function MainLayout({ children }: MainLayoutProps) {
  const { data: session } = useSession();
  const { t } = useTranslation();
  
  // Get user info with safe type checking
  const userName = session?.user?.name || 'User';
  const userInitial = userName[0] || 'U';
  
  // Generate avatar URL - either from session or using a fallback
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}`;
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar maxWidth="full" position="sticky" className="border-b">
        <NavbarBrand>
          <Link href="/admin/dashboard" color="foreground">
            <span className="font-bold text-inherit">Construction Pro</span>
          </Link>
        </NavbarBrand>
        
        <NavbarContent className="hidden sm:flex gap-4" justify="center">
          <NavbarItem>
            <Link color="foreground" href="/admin/dashboard">
              {t('nav.dashboard')}
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link color="foreground" href="/admin/quotes">
              {t('nav.quotes')}
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link color="foreground" href="/admin/customers">
              {t('nav.customers')}
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link color="foreground" href="/admin/products">
              {t('nav.products')}
            </Link>
          </NavbarItem>
        </NavbarContent>
        
        <NavbarContent justify="end">
          <NavbarItem>
            <LocaleSwitch />
          </NavbarItem>
          
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Avatar
                as="button"
                className="transition-transform"
                size="sm"
                src={avatarUrl}
                fallback={userInitial}
              />
            </DropdownTrigger>
            <DropdownMenu aria-label="User menu">
              <DropdownItem key="profile">
                <Link href="/admin/profile">{t('nav.profile')}</Link>
              </DropdownItem>
              <DropdownItem key="settings">
                <Link href="/admin/settings">{t('nav.settings')}</Link>
              </DropdownItem>
              <DropdownItem key="logout" color="danger" onClick={() => signOut()}>
                {t('nav.logout')}
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </NavbarContent>
      </Navbar>
      
      <main className="flex-grow p-4 bg-gray-50 dark:bg-gray-900">
        {children}
      </main>
      
      <footer className="py-4 px-6 border-t text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Construction Pro. {t('footer.allRightsReserved')}</p>
      </footer>
    </div>
  );
}

export default MainLayout; 
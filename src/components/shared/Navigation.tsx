import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';
import {
  Navbar,
  NavbarContent,
  NavbarItem,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar,
  Button,
} from '@heroui/react';
import { Menu, Settings, LogOut, Users, User } from 'lucide-react';
import { ThemeToggle } from '~/components/ThemeToggle';
import { LocaleSelector } from '~/components/ui/LocaleSelector';
import { useTranslation } from '~/hooks/useTranslation';
import { useAuthNavigation } from '~/utils/auth';
import { APP_NAME, APP_SHORT_NAME } from '~/config/constants';
import { api } from '~/trpc/react'; // Import tRPC API

interface NavigationProps {
  onMenuClick: () => void;
}

/**
 * Top navigation bar component with user dropdown and theme toggle
 * Fully responsive with mobile-optimized menu button
 */
export function Navigation({ onMenuClick }: NavigationProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [isMounted, setIsMounted] = useState(false);

  // Fetch user profile data for navigation display
  const { data: userProfileData, isLoading: isLoadingNavProfile } = api.auth.getProfile.useQuery(
    undefined,
    {
      enabled: sessionStatus === 'authenticated',
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: true, // Consider if this is too aggressive or desired
    }
  );

  // Determine display values: Profile Data > Session Data > Fallback
  const displayName = userProfileData?.name || session?.user?.name || t('common.user');
  const displayEmail = userProfileData?.email || session?.user?.email;
  const displayImage = userProfileData?.image || session?.user?.image;
  const fallbackInitial = displayName?.[0]?.toUpperCase() || 'U';

  // Only run client-side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null; // Return nothing during SSR
  }

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/auth/signin' });
  };

  // Check if path is active
  const isActive = (path: string) => router.pathname.startsWith(path);
  const isSettingsActive = isActive('/admin/settings');
  const isAccountActive = isActive('/admin/account');

  if (!session && sessionStatus !== 'loading') {
    return null;
  }

  return (
    <Navbar maxWidth="full" position="sticky" className="border-divider z-20 h-16 border-b">
      {/* Mobile menu button */}
      <NavbarContent className="md:hidden" justify="start">
        <Button
          isIconOnly
          variant="light"
          onPress={onMenuClick}
          aria-label={t('common.openMenu')}
          className="text-default-600"
        >
          <Menu size={24} />
        </Button>
      </NavbarContent>

      {/* Title for mobile (optional) */}
      <NavbarContent className="md:hidden" justify="center">
        <span className="text-foreground font-semibold">TTXD</span>
      </NavbarContent>

      {/* Right side items */}
      <NavbarContent justify="end" className="gap-2">
        <NavbarItem>
          <LocaleSelector variant="mini" />
        </NavbarItem>

        <NavbarItem>
          <ThemeToggle />
        </NavbarItem>

        {/* User menu dropdown */}
        <NavbarItem>
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Avatar
                as="button"
                className="rounded-full transition-transform"
                size="sm"
                src={
                  displayImage ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0D8ABC&color=fff`
                }
                fallback={fallbackInitial}
              />
            </DropdownTrigger>
            <DropdownMenu aria-label={t('userMenu.title')}>
              {(() => {
                const items = [];
                if (userProfileData || session?.user) {
                  items.push(
                    <DropdownItem
                      key="userInfo"
                      className="pointer-events-none cursor-default p-2 opacity-100"
                      textValue={displayName} // For accessibility
                    >
                      <div className="flex items-center gap-3">
                        <Avatar
                          size="md"
                          src={
                            displayImage ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0D8ABC&color=fff`
                          }
                          fallback={fallbackInitial}
                        />
                        <div className="flex flex-col">
                          <span className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {displayName}
                          </span>
                          {displayEmail && (
                            <span className="block text-xs text-gray-600 dark:text-gray-400">
                              {displayEmail}
                            </span>
                          )}
                        </div>
                      </div>
                    </DropdownItem>
                  );
                  // Makeshift divider - replace with actual HeroUI divider if known
                  items.push(
                    <DropdownItem
                      key="divider-after-user"
                      className="pointer-events-none my-1 h-px cursor-default bg-gray-200 p-0 dark:bg-gray-700"
                      textValue="---"
                    />
                  );
                }
                items.push(
                  <DropdownItem
                    key="account"
                    startContent={<User size={16} />}
                    className={isAccountActive ? 'text-primary' : ''}
                    href="/admin/account"
                  >
                    {t('userMenu.account')}
                  </DropdownItem>
                );
                items.push(
                  <DropdownItem
                    key="settings"
                    startContent={<Settings size={16} />}
                    className={isSettingsActive ? 'text-primary' : ''}
                    href="/admin/settings"
                  >
                    {t('userMenu.settings')}
                  </DropdownItem>
                );
                items.push(
                  <DropdownItem
                    key="logout"
                    startContent={<LogOut size={16} />}
                    onPress={handleSignOut}
                  >
                    {t('userMenu.signOut')}
                  </DropdownItem>
                );
                return items;
              })()}
            </DropdownMenu>
          </Dropdown>
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}

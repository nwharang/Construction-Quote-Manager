import { useRouter } from 'next/router';
import { useI18n } from '~/hooks/useI18n';

/**
 * Custom hook for navigating between auth pages while preserving locale
 * 
 * @returns A function that takes a route and navigates to it with the current locale
 */
export function useAuthNavigation() {
  const router = useRouter();
  const { currentLocale } = useI18n();
  
  /**
   * Navigate to an auth page while preserving the current locale
   * 
   * @param path The path to navigate to
   */
  const navigateWithLocale = (path: string) => {
    console.log(`[AuthNav] Navigating to ${path} with locale ${currentLocale}`);
    // Use router.push with locale option to preserve current locale
    return router.push(path, path, { locale: currentLocale });
  };
  
  return { navigateWithLocale };
}

/**
 * Helper function to create a locale-aware URL for Auth pages
 * 
 * @param path The auth path to navigate to
 * @param locale The current locale
 * @returns A URL with the locale query parameter
 */
export function getLocalizedAuthUrl(path: string, locale: string): string {
  // Create a URL object
  const url = new URL(path, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
  
  // Add the locale as a query parameter
  url.searchParams.set('locale', locale);
  
  return url.pathname + url.search;
} 
import { NextRequest, NextResponse } from 'next/server';
import { match as matchLocale } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';
import { DEFAULT_LOCALE, locales as appLocales } from './src/i18n/locales';

// Define supported locales for easy access
const supportedLocales = Object.keys(appLocales);

/**
 * Get the preferred locale from request headers
 */
function getLocaleFromHeaders(request: NextRequest): string {
  const negotiatorHeaders: Record<string, string> = {};

  // Convert headers to a format Negotiator can understand
  request.headers.forEach((value, key) => {
    negotiatorHeaders[key] = value;
  });

  // Get preferred language from headers
  const languages = new Negotiator({ headers: negotiatorHeaders }).languages(
    supportedLocales
  );

  return matchLocale(languages, supportedLocales, DEFAULT_LOCALE);
}

/**
 * Next.js middleware function for handling i18n
 * This implementation supports both Pages router and App router
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for non-page resources
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') || // Matches any file with an extension
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Check if path already has a locale
  const hasLocale = supportedLocales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (hasLocale) {
    return NextResponse.next();
  }

  // Get preferred locale from cookie or accept-language header
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  const headersLocale = getLocaleFromHeaders(request);
  const locale = cookieLocale && supportedLocales.includes(cookieLocale)
    ? cookieLocale
    : headersLocale;

  // Create a URL with the locale prefix
  const url = new URL(
    `/${locale}${pathname.startsWith('/') ? pathname : `/${pathname}`}`,
    request.url
  );
  url.search = request.nextUrl.search;

  return NextResponse.redirect(url);
}

/**
 * Configure middleware to run only on pages
 */
export const config = {
  matcher: ['/((?!_next|api|static|.*\\.|favicon.ico).*)'],
};

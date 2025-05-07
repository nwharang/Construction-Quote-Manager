import { NextRequest, NextResponse } from 'next/server';
import { match as matchLocale } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';
import { DEFAULT_LOCALE, locales as appLocales } from './i18n/locales';
import { LOCALE_COOKIE_KEY } from '~/config/constants';

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
  const languages = new Negotiator({ headers: negotiatorHeaders }).languages(supportedLocales);

  return matchLocale(languages, supportedLocales, DEFAULT_LOCALE);
}

/**
 * Next.js middleware function for handling i18n
 * This implementation supports both Pages router and App router
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const nextJsDefaultLocale = 'vi'; // From next.config.mjs

  // Skip middleware for non-page resources
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Check if path already has a locale
  const hasLocale = supportedLocales.some(
    (loc) => pathname.startsWith(`/${loc}/`) || pathname === `/${loc}`
  );

  if (hasLocale) {
    return NextResponse.next();
  }

  // At this point, pathname has no locale prefix (e.g., /admin/dashboard)

  // Get preferred locale from cookie or accept-language header
  const cookieLocale = request.cookies.get(LOCALE_COOKIE_KEY)?.value;
  const headersLocale = getLocaleFromHeaders(request); // Defaults to DEFAULT_LOCALE from i18n/locales ('vi')

  let resolvedLocale =
    cookieLocale && supportedLocales.includes(cookieLocale) ? cookieLocale : headersLocale;

  // Ensure resolvedLocale is one of the supported locales, fallback to site default if not
  if (!supportedLocales.includes(resolvedLocale)) {
    resolvedLocale = nextJsDefaultLocale;
  }

  // If the resolved locale is the default locale, don't redirect to a prefixed path.
  // Let Next.js handle serving the default locale content without a prefix.
  if (resolvedLocale === nextJsDefaultLocale) {
    return NextResponse.next();
  }

  // If the resolved locale is NOT the default, then redirect to the prefixed path.
  const url = new URL(
    `/${resolvedLocale}${pathname.startsWith('/') ? pathname : `/${pathname}`}`,
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

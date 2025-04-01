/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  /* config options here */
  // Enable ESLint checking during builds
  eslint: {
    // Don't fail the build on ESLint warnings for now
    ignoreDuringBuilds: true,
    // Lint the entire project during builds
  },

  // Temporarily allow TypeScript errors during builds while we fix the warnings
  typescript: {
    // Allow the build to complete with TypeScript errors
    // This should be set to false once all TypeScript issues are fixed
    ignoreBuildErrors: false,
  },

  reactStrictMode: true,

  // i18n configuration for pages directory
  i18n: {
    // These are all the locales supported in the application
    locales: ['en', 'vi', 'es'],
    // Default locale used when a non-locale path is visited
    defaultLocale: 'en',
    // Set to false to let our custom middleware handle detection
  },

  images: {
    domains: ['images.unsplash.com', 'tailwindui.com'],
  },

  // Improve hydration performance for theme switching
  experimental: {
    // Allow components with suppressHydrationWarning
    optimizePackageImports: ['@heroui/react'],
  },
};

export default nextConfig;

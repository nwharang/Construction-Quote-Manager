// @ts-check

/**
 * This file contains the Next.js configuration.
 * It handles environment validation and webpack configuration.
 */

/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
 * This is especially useful for Docker builds.
 */
if (!process.env.SKIP_ENV_VALIDATION) {
  await import("./src/env.mjs").catch((e) => {
    console.error("Failed to load env module:", e);
  });
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@nextui-org/react"],
  
  // Build configuration
  distDir: '.next',
  
  // Handle Node.js modules in browser context
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // These modules are only available in Node.js
      // We need to tell webpack not to try to bundle them for the browser
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        crypto: false,
        dns: false,
        stream: false,
        os: false,
        path: false,
        perf_hooks: false,
      };
    }
    return config;
  },
  
  // Silence ESLint errors during builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Silence TypeScript errors during builds
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Allow dual routing system (App + Pages)
  // Note: In Next.js 15+, this is the default behavior
  // without needing explicit configuration
};

export default nextConfig; 
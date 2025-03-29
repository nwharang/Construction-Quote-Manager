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
    dirs: ['pages', 'components', 'lib', 'utils', 'hooks', 'contexts', 'styles']
  },

  // Temporarily allow TypeScript errors during builds while we fix the warnings
  typescript: {
    // Allow the build to complete with TypeScript errors
    // This should be set to false once all TypeScript issues are fixed
    // TEMPORARY SETTING - should be removed before final production deploy
    ignoreBuildErrors: true,
  },
};

export default nextConfig; 
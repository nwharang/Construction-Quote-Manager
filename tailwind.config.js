import { heroui } from '@heroui/react';

/**
 * Tailwind CSS v4 configuration with @heroui/react v2 integration
 * Note: This is using Tailwind CSS v4 alpha which may have compatibility issues
 */
const config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@@heroui/react-org/theme/dist/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  plugins: [
    // @heroui/react plugin for improved component styling
    heroui(),
  ],
};

export default config;

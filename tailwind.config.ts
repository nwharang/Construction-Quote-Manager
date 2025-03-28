import type { Config } from 'tailwindcss';
import { nextui } from '@nextui-org/react';

/**
 * Tailwind CSS v4 configuration with NextUI v2 integration
 * Note: This is using Tailwind CSS v4 alpha which may have compatibility issues
 */
const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  plugins: [
    // NextUI plugin for improved component styling
    nextui(),
  ],
};

export default config;

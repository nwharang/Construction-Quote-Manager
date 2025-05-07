import { heroui } from '@heroui/react';

/**
 * Tailwind CSS v4 configuration with @heroui/react v2 integration
 * Note: This is using Tailwind CSS v4 alpha which may have compatibility issues
 */
const config = {
  darkMode: 'class',
  important: true,
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      typography: ({ theme }: { theme: any }) => ({
        sm: {
          css: {
            h1: {
              fontSize: theme('fontSize.base'),
            },
          },
        },
      }),
    },
  },
  plugins: [
    // @heroui/react plugin for improved component styling
    heroui(),
    require('@tailwindcss/typography'),
  ],
};

export default config;

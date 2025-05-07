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
      // The type for theme can be improved with JSDoc for .js files if strict type checking is desired
      // For now, allowing implicit any for simplicity in JS config
      typography: ({ theme }: any) => ({ 
        sm: { // Targets .prose-sm
          css: {
            h1: {
              fontSize: theme('fontSize.base'),
            },
            code: { // Styles for inline code
              color: 'inherit', // Inherit text color from parent
              backgroundColor: 'transparent', // No background color
              fontWeight: 'inherit', // Inherit font weight
              padding: '0', // No extra padding
              borderRadius: '0', // No border radius
              fontFamily: 'inherit', // Inherit font family
            },
            'code::before': {
              content: 'none', // Remove before pseudo-element (e.g., backticks)
            },
            'code::after': {
              content: 'none', // Remove after pseudo-element (e.g., backticks)
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
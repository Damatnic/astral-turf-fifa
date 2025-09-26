/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./App.tsx",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'],
      },
      // Ensure logo size classes are always generated
      width: {
        '8': '2rem',
        '10': '2.5rem',
        '12': '3rem',
        '16': '4rem',
        '20': '5rem', 
        '24': '6rem',
        '32': '8rem',
      },
      height: {
        '8': '2rem',
        '10': '2.5rem', 
        '12': '3rem',
        '16': '4rem',
        '20': '5rem',
        '24': '6rem', 
        '32': '8rem',
      },
    },
  },
  // Force generation of specific classes
  safelist: [
    'w-8', 'w-10', 'w-12', 'w-16', 'w-20', 'w-24', 'w-32',
    'h-8', 'h-10', 'h-12', 'h-16', 'h-20', 'h-24', 'h-32',
    'text-3xl', 'text-4xl', 'text-5xl',
    'mobile-p-3', 'mobile-full-height', 'mobile-safe-area',
    'animate-fade-in-scale'
  ],
  plugins: [],
};

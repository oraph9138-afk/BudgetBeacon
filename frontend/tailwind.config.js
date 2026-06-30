/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fcfdfd',
          100: '#c8fad6',
          200: '#a8f0b5',
          300: '#5be49b',
          400: '#00c853',
          500: '#00a76f',
          600: '#008a5c',
          700: '#007867',
          800: '#005c4b',
          900: '#004b50',
        },
        gray: {
          50: '#fcfdfd',
          100: '#f9fafb',
          200: '#f4f6f8',
          300: '#dfe3e8',
          400: '#c4cdd5',
          500: '#919eab',
          600: '#637381',
          700: '#454f5b',
          800: '#1c252e',
          900: '#141a21',
        },
        success: {
          50: '#d3fcd2',
          100: '#d3fcd2',
          500: '#22c55e',
          700: '#118d57',
        },
        warning: {
          50: '#fff5cc',
          500: '#ffab00',
          700: '#b76e00',
        },
        danger: {
          50: '#ffe9d5',
          500: '#ff5630',
          700: '#b71d18',
        },
        info: {
          50: '#cafdf5',
          500: '#00b8d9',
          700: '#006c9c',
        },
      },
      fontFamily: {
        sans: ['"Public Sans"', 'sans-serif'],
      },
      fontSize: {
        base: '0.875rem',
      },
      fontWeight: {
        base: '500',
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
      },
      boxShadow: {
        card: '0 8px 16px 0 rgba(145, 158, 171, 0.16)',
        lg: '0 12px 24px -4px rgba(145, 158, 171, 0.16)',
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Severance-inspired color palette
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#4A9D7C',
          600: '#1A535C',
          700: '#0c4a6e',
          800: '#075985',
          900: '#0c4a6e',
        },
        gray: {
          50: '#FAFAFA',
          100: '#F8F9FA',
          200: '#E9ECEF',
          300: '#DEE2E6',
          400: '#CED4DA',
          500: '#9E9E9E',
          600: '#607D8B',
          700: '#495057',
          800: '#343a40',
          900: '#1A535C',
        },
        accent: {
          red: '#E63946',
          orange: '#F77F00',
          yellow: '#FCBF49',
          green: '#4A9D7C',
        }
      },
      fontFamily: {
        'mono': ['IBM Plex Mono', 'monospace'],
        'sans': ['IBM Plex Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

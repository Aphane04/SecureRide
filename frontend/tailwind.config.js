/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core Palette from the SecureRide Design
        'brand-green': '#008751',      // The main action color
        'brand-dark': '#0a0a0a',       // Deep background
        'brand-gray': '#121212',       // Surface/Card color
        'brand-input': '#1a1a1a',      // Input fields
        'brand-border': '#1f1f1f',     // Subtle dividers
      },
      fontFamily: {
        // Professional, clean sans-serif for dashboard feel
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        // Glowing effect for safety alerts and buttons
        'glow-green': '0 0 15px rgba(0, 135, 81, 0.3)',
        'glow-red': '0 0 15px rgba(220, 38, 38, 0.4)',
      },
      animation: {
        // Slow pulse for the "AI Monitoring" indicator
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
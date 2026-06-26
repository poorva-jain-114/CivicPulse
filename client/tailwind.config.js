/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          navy: '#0b132b',      // Deep Corporate Navy
          slate: '#1c2541',     // Slate Blue for containers
          accent: '#3a506b',    // Lighter accent slate
          emerald: '#10b981',   // Resolved/Active emerald
          amber: '#f59e0b',     // Warning/Medium priority amber
          crimson: '#ef4444',   // Emergency/High priority crimson
          bg: '#f8fafc',        // Light slate layout bg
          card: '#ffffff'       // Pure white cards
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}

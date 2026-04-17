/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FAF8F5',
        'cream-dark': '#F3F0EB',
        sage: '#89c29b',
        'sage-dark': '#6aab80',
        'sage-light': '#edf6f0',
        ink: '#020303',
        'ink-soft': '#1A1A1A',
        muted: '#595959',
        'border-col': '#E8E6E1',
        amber: '#C49A3C',
      },
      fontFamily: {
        heading: ['"Cormorant Garamond"', 'Lora', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}


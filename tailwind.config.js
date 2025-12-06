export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'bg-dark': '#1F2937',
        'bg-hover': '#374151',
        'border-dark': '#374151',
        'accent': '#3B82F6',
        'text-primary': '#FFFFFF',
        'text-secondary': '#9CA3AF',
        'text-muted': '#6B7280',
      },
    },
  },
  plugins: [],
}

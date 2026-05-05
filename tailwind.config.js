export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  safelist: [
    { pattern: /^(from|via|to)-som-(green|yellow)$/ },
    { pattern: /^(bg|from|to)-(ssaam-dark|ssaam-light|ssaam-gold)$/ },
    { pattern: /^hover:(from|to)-(ssaam-dark|ssaam-light)$/ },
    'bg-gradient-to-r',
    'bg-gradient-to-br',
    'bg-gradient-to-b',
  ],
  theme: {
    extend: {
      colors: {
        'purple-primary': '#7d2fa3',
        'purple-dark':    '#3d1154',
        'som-primary': '#0ea5a4',
        'som-dark':    '#0b7b75',
        'som-green':   '#0ea5a4',
        'som-yellow':  '#facc15',
        /* SSAAM brand — CCS royal purple + antique gold */
        'ssaam-dark':       '#3d1154',
        'ssaam-light':      '#7d2fa3',
        'ssaam-gold':       '#c9952b',
        'ssaam-gold-light': '#e8c840',
        /* Override Tailwind's default blue palette with CCS purple tones.
           Every blue-* class (bg-blue-600, text-blue-700, ring-blue-300 …)
           automatically becomes brand-purple across ~1750 usages.           */
        blue: {
          50:  '#f5f0ff',
          100: '#ebe0ff',
          200: '#d4b8f5',
          300: '#b889e0',
          400: '#9a5dd0',
          500: '#7d2fa3',
          600: '#6a2590',
          700: '#561c78',
          800: '#451462',
          900: '#3d1154',
          950: '#2a0a3d',
        },
      },
    },
  },
  plugins: [],
}

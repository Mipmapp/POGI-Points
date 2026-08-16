export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  /* Explicit safelist for the gradient classes used in this app. */
  safelist: [
    'from-ssaam-dark',
    'from-ssaam-light',
    'to-ssaam-dark',
    'to-ssaam-light',
    'hover:from-ssaam-dark',
    'hover:from-ssaam-light',
    'hover:to-ssaam-dark',
    'hover:to-ssaam-light',
    'from-som-green',
    'from-som-yellow',
    'to-som-green',
    'to-som-yellow',
    'via-som-green',
    'via-som-yellow',
    'bg-gradient-to-r',
    'bg-gradient-to-br',
    'bg-gradient-to-b',
  ],
  theme: {
    extend: {
      colors: {
        'purple-primary': '#8b5cf6',
        'purple-dark': '#6d28d9',
        'som-primary': '#0ea5a4',
        'som-dark': '#0b7b75',
        /* colors used by the SOM theme swaps */
        'som-green': '#0ea5a4',
        'som-yellow': '#facc15',
        /* SSAAM brand gradient colors */
        'ssaam-dark': '#1e3bdb',
        'ssaam-light': '#4f62ff',
      },
    },
  },
  plugins: [],
}
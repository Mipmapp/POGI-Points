export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  /* make sure our dynamic SOM gradient classes survive purification */
  safelist: [
    { pattern: /^(from|via|to)-som-(green|yellow)$/ },
    { pattern: /^(bg|from|to)-(ssaam-dark|ssaam-light)$/ },
    { pattern: /^hover:(from|to)-(ssaam-dark|ssaam-light)$/ },
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
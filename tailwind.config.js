/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  // Preflight off so Tailwind's reset doesn't disturb the existing dark
  // admin / home pages that use plain globals.css.
  corePlugins: { preflight: false },
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        "on-secondary-container": "#006f66",
        "surface-container-lowest": "#ffffff",
        "inverse-surface": "#213145",
        "on-surface-variant": "#45464d",
        error: "#ba1a1a",
        "on-error": "#ffffff",
        "on-error-container": "#93000a",
        surface: "#f8f9ff",
        "surface-container-highest": "#d3e4fe",
        "surface-container-high": "#dce9ff",
        "outline-variant": "#c6c6cd",
        "primary-container": "#131b2e",
        "on-background": "#0b1c30",
        "on-primary": "#ffffff",
        "surface-container-low": "#eff4ff",
        "on-primary-container": "#7c839b",
        "secondary-container": "#86f2e4",
        background: "#f8f9ff",
        "on-surface": "#0b1c30",
        "surface-dim": "#cbdbf5",
        tertiary: "#000000",
        "surface-bright": "#f8f9ff",
        outline: "#76777d",
        secondary: "#006a61",
        "on-secondary": "#ffffff",
        "surface-variant": "#d3e4fe",
        "surface-container": "#e5eeff",
        "error-container": "#ffdad6",
        primary: "#000000",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};

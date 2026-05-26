/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#090A0F",
        card: "#12141F",
        cardLight: "#1A1D2E",
        border: "#23273B",
        electricBlue: "#00E5FF",
        neonGreen: "#39FF14",
        warningAmber: "#FF9100",
        criticalRed: "#FF3B30",
        textSecondary: "#8E9AA8",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
}

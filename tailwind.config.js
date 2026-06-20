/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("nativewind/preset")],
  darkMode: "class",
  content: ["./src/app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0f0f1a",
        surface: "#1a1a2e",
        "surface-light": "#252542",
        primary: {
          DEFAULT: "#8b7cf7",
          dark: "#6b5ce7",
          light: "#a89bf9",
        },
        accent: {
          green: "#10b981",
          red: "#ef4444",
          orange: "#f59e0b",
          violet: "#8b5cf6",
          rose: "#f43f5e",
        },
        text: {
          primary: "#ffffff",
          secondary: "#9ca3af",
          muted: "#6b7280",
        },
        border: "#2d2d44",
      },
      fontFamily: {
        sans: [
          "DMSans_400Regular",
          "DMSans_500Medium",
          "DMSans_700Bold",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

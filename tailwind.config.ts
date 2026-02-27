import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#faf9f7",
        panel: "#ffffff",
        panel2: "#f8f7f4",
        accent: "#e07a1f",
        accentWarm: "#f4a261",
        accentSoft: "rgba(224, 122, 31, 0.12)",
        inkText: "#1f2937",
        inkMuted: "#4b5563",
      },
      boxShadow: {
        glow: "0 16px 36px rgba(15, 23, 42, 0.12)",
      },
      fontFamily: {
        display: ["DM Serif Display", "Iowan Old Style", "Georgia", "serif"],
        sans: ["DM Sans", "Avenir Next", "Avenir", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

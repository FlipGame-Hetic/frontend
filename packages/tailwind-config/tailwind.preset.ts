import type { Config } from "tailwindcss";

const preset: Config = {
  content: [], // Each app fills its own content paths
  theme: {
    extend: {
      // Cyberpunk palette — shared across both screens
      colors: {
        neon: {
          pink: "#FF2D6B",
          cyan: "#00F0FF",
          purple: "#B026FF",
          yellow: "#FFE156",
        },
        surface: {
          dark: "#0A0A0F",
          card: "#12121A",
          border: "#1E1E2E",
        },
      },
      fontFamily: {
        display: ['"Orbitron"', "sans-serif"],
        body: ['"Inter"', "sans-serif"],
      },
      boxShadow: {
        neon: "0 0 12px rgba(0, 240, 255, 0.4)",
      },
    },
  },
  plugins: [],
};

export default preset;

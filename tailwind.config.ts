import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Space Grotesk", "ui-sans-serif", "system-ui"],
        body: ["Plus Jakarta Sans", "ui-sans-serif", "system-ui"],
      },
      boxShadow: {
        glow: "0 24px 80px rgba(10, 17, 40, 0.42)",
        soft: "0 10px 35px rgba(4, 10, 29, 0.18)",
      },
      keyframes: {
        pulseRing: {
          "0%": { transform: "scale(0.7)", opacity: "0.75" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
      },
      animation: {
        pulseRing: "pulseRing 1.6s cubic-bezier(0, 0.45, 0.2, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#eef4fb",
          100: "#d5e4f4",
          200: "#abc9e9",
          300: "#75a6d8",
          400: "#3d80c4",
          500: "#2563a8",
          600: "#1b4d8a",
          700: "#183f70",
          800: "#16365d",
          900: "#142e4e",
          950: "#0c1c32",
        },
        gold: {
          400: "#d4a017",
          500: "#c49214",
          600: "#a67a10",
        },
      },
      fontFamily: {
        sans: ["var(--font-plus-jakarta)", "system-ui", "sans-serif"],
        display: ["var(--font-fraunces)", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(12,28,50,0.04), 0 8px 24px rgba(12,28,50,0.06)",
        lift: "0 12px 40px rgba(12,28,50,0.12)",
      },
    },
  },
  plugins: [],
};

export default config;

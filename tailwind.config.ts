import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        charcoal: "#0f172a",
        ink: "#111827",
        sky: "#22c55e",
        mint: "#34d399",
        sand: "#f3f4f6"
      },
      boxShadow: {
        card: "0 10px 40px rgba(15, 23, 42, 0.15)",
        soft: "0 10px 30px rgba(15, 23, 42, 0.08)"
      },
      backgroundImage: {
        glow: "radial-gradient(circle at 20% 20%, rgba(52, 211, 153, 0.15), transparent 25%), radial-gradient(circle at 80% 0%, rgba(34, 197, 94, 0.12), transparent 25%)"
      }
    }
  },
  plugins: []
};

export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5", // Primary Indigo
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
        pos: {
          noun: "#3B82F6",
          verb: "#EC4899",
          adj: "#10B981",
          adv: "#F59E0B",
          phrasal: "#8B5CF6",
        },
      },
      fontFamily: {
        heading: ["Fredoka", "system-ui", "sans-serif"],
        body: ["Nunito", "system-ui", "sans-serif"],
        ipa: ["'Noto Sans'", "sans-serif"],
      },
      animation: {
        "pulse-subtle": "pulseSubtle 2s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
        "shake": "shake 0.3s ease-in-out",
      },
      keyframes: {
        pulseSubtle: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.04)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-6px)" },
          "75%": { transform: "translateX(6px)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Backgrounds
        bg: {
          DEFAULT: "#0a0a0f",
          surface: "#111118",
          surface2: "#18181f",
          border: "#25252f",
        },
        // Brand accent
        accent: {
          DEFAULT: "#5b6ef5",
          hover: "#6e80ff",
          muted: "#5b6ef520",
        },
        // Status colors
        success: {
          DEFAULT: "#22d37a",
          muted: "#22d37a20",
        },
        danger: {
          DEFAULT: "#f55b5b",
          muted: "#f55b5b20",
        },
        warning: {
          DEFAULT: "#f5c542",
          muted: "#f5c54220",
        },
        // Text
        text: {
          DEFAULT: "#e8e8f0",
          muted: "#8888a8",
          subtle: "#55556a",
        },
      },
      fontFamily: {
        display: ["var(--font-syne)", "sans-serif"],
        body: ["var(--font-dm-sans)", "sans-serif"],
        sans: ["var(--font-dm-sans)", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        glow: "0 0 20px rgba(91, 110, 245, 0.25)",
        "glow-sm": "0 0 10px rgba(91, 110, 245, 0.15)",
        "glow-green": "0 0 20px rgba(34, 211, 122, 0.25)",
        card: "0 4px 24px rgba(0, 0, 0, 0.4)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-accent":
          "linear-gradient(135deg, #5b6ef5 0%, #8b5cf6 100%)",
        "gradient-dark":
          "linear-gradient(180deg, #111118 0%, #0a0a0f 100%)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 10px rgba(91, 110, 245, 0.15)" },
          "50%": { boxShadow: "0 0 25px rgba(91, 110, 245, 0.4)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

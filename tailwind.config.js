/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./panel.html",
    "./panelV2.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        space: {
          DEFAULT: "#0B0F1A",
          50: "#0E1225",
          100: "#111630",
          200: "#161B3A",
          300: "#1C2245",
          400: "#252B52",
        },
        surface: {
          DEFAULT: "#0B0F1A",
          card: "rgba(17, 22, 48, 0.6)",
          elevated: "rgba(28, 34, 69, 0.5)",
        },
        accent: {
          DEFAULT: "#6366F1",
          light: "#818CF8",
          dark: "#4F46E5",
        },
        ai: {
          indigo: "#6366F1",
          purple: "#8B5CF6",
          blue: "#38BDF8",
        },
        neon: {
          green: "#22C55E",
          blue: "#38BDF8",
          purple: "#8B5CF6",
          pink: "#EC4899",
        },
        deal: "#22C55E",
        warning: "#F59E0B",
        risk: "#EF4444",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Satoshi", "Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        hero: ["28px", { lineHeight: "1.15", fontWeight: "700" }],
        section: ["18px", { lineHeight: "1.3", fontWeight: "600" }],
        data: ["13px", { lineHeight: "1.5", fontWeight: "500" }],
        micro: ["10px", { lineHeight: "1.4", fontWeight: "500" }],
      },
      animation: {
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        "typing-dot": "typing-dot 1.4s infinite",
        "gradient-x": "gradient-x 8s ease infinite",
        "slide-up": "slide-up 0.5s ease-out",
        "fade-in": "fade-in 0.4s ease-out",
        "bar-grow": "bar-grow 1s ease-out forwards",
        "spin-slow": "spin 3s linear infinite",
        "pulse-ring": "pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "price-pulse": "price-pulse 2s ease-in-out infinite",
        "radar-scan": "radar-scan 2s linear infinite",
        "draw-line": "draw-line 1.5s ease-out forwards",
        orbit: "orbit 12s linear infinite",
      },
      keyframes: {
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(99, 102, 241, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(99, 102, 241, 0.6)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-4px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "typing-dot": {
          "0%, 80%, 100%": { opacity: "0" },
          "40%": { opacity: "1" },
        },
        "gradient-x": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "bar-grow": {
          "0%": { width: "0%" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.95)", opacity: "1" },
          "50%": { transform: "scale(1)", opacity: "0.8" },
          "100%": { transform: "scale(0.95)", opacity: "1" },
        },
        "price-pulse": {
          "0%, 100%": { textShadow: "0 0 8px rgba(34, 197, 94, 0)" },
          "50%": { textShadow: "0 0 16px rgba(34, 197, 94, 0.4)" },
        },
        "radar-scan": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "draw-line": {
          "0%": { strokeDashoffset: "1000" },
          "100%": { strokeDashoffset: "0" },
        },
        orbit: {
          "0%": { transform: "rotate(0deg) translateX(60px) rotate(0deg)" },
          "100%": {
            transform: "rotate(360deg) translateX(60px) rotate(-360deg)",
          },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};

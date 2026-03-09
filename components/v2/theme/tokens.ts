/**
 * SmartCompare AI — Design Tokens (2026 Edition)
 * Futuristic, cyberpunk-inspired visual system
 */

export const colors = {
  // Primary palette
  electricPurple: "#7B2FF2",
  neonBlue: "#00C2FF",
  deepSpaceBlack: "#05060F",

  // Accent palette
  cyberPink: "#FF2E97",
  glowingCyan: "#00FFE0",
  gradientViolet: "#A855F7",

  // Surfaces
  surface: {
    base: "#080A14",
    card: "rgba(12, 14, 28, 0.65)",
    elevated: "rgba(20, 22, 44, 0.55)",
    glass: "rgba(16, 18, 36, 0.45)",
    hover: "rgba(30, 32, 60, 0.7)",
  },

  // Borders
  border: {
    subtle: "rgba(123, 47, 242, 0.12)",
    glow: "rgba(0, 194, 255, 0.25)",
    active: "rgba(0, 255, 224, 0.4)",
  },

  // Semantic
  success: "#00FF94",
  warning: "#FFB800",
  danger: "#FF3366",
  info: "#00C2FF",

  // Text
  text: {
    primary: "#F0F2FF",
    secondary: "#8B8FAE",
    muted: "#4A4D6A",
    accent: "#00C2FF",
  },
} as const;

export const gradients = {
  // Hero gradients
  heroRadial:
    "radial-gradient(ellipse at 50% 0%, rgba(123, 47, 242, 0.15) 0%, transparent 70%)",
  heroConic:
    "conic-gradient(from 180deg at 50% 50%, #7B2FF2 0deg, #00C2FF 120deg, #FF2E97 240deg, #7B2FF2 360deg)",

  // Card gradients
  cardShine:
    "linear-gradient(135deg, rgba(123, 47, 242, 0.08) 0%, rgba(0, 194, 255, 0.04) 50%, rgba(255, 46, 151, 0.06) 100%)",
  borderGlow: "linear-gradient(135deg, #7B2FF2, #00C2FF, #FF2E97)",

  // Text gradients
  textPrimary: "linear-gradient(135deg, #7B2FF2, #00C2FF)",
  textAccent: "linear-gradient(135deg, #00C2FF, #00FFE0)",
  textFire: "linear-gradient(135deg, #FF2E97, #FFB800)",

  // Background ambient
  ambientOrb1:
    "radial-gradient(circle at 20% 30%, rgba(123, 47, 242, 0.12) 0%, transparent 50%)",
  ambientOrb2:
    "radial-gradient(circle at 80% 70%, rgba(0, 194, 255, 0.08) 0%, transparent 50%)",
  ambientOrb3:
    "radial-gradient(circle at 50% 50%, rgba(255, 46, 151, 0.06) 0%, transparent 40%)",
} as const;

export const shadows = {
  glow: {
    purple:
      "0 0 30px rgba(123, 47, 242, 0.3), 0 0 60px rgba(123, 47, 242, 0.1)",
    blue: "0 0 30px rgba(0, 194, 255, 0.3), 0 0 60px rgba(0, 194, 255, 0.1)",
    pink: "0 0 30px rgba(255, 46, 151, 0.3), 0 0 60px rgba(255, 46, 151, 0.1)",
    cyan: "0 0 30px rgba(0, 255, 224, 0.3), 0 0 60px rgba(0, 255, 224, 0.1)",
  },
  card: "0 8px 40px rgba(0, 0, 0, 0.4), 0 0 1px rgba(123, 47, 242, 0.2)",
  elevated: "0 20px 60px rgba(0, 0, 0, 0.5), 0 0 2px rgba(0, 194, 255, 0.15)",
} as const;

export const typography = {
  fontFamily: {
    display: '"Inter", "SF Pro Display", system-ui, sans-serif',
    body: '"Inter", "SF Pro Text", system-ui, sans-serif',
    mono: '"JetBrains Mono", "SF Mono", monospace',
  },
  fontSize: {
    xs: "0.7rem",
    sm: "0.8rem",
    base: "0.875rem",
    lg: "1rem",
    xl: "1.15rem",
    "2xl": "1.4rem",
    "3xl": "1.75rem",
    "4xl": "2.25rem",
    "5xl": "3rem",
  },
} as const;

export const animation = {
  duration: {
    fast: 0.2,
    normal: 0.4,
    slow: 0.7,
    xslow: 1.2,
  },
  easing: {
    smooth: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
    bounce: [0.68, -0.55, 0.265, 1.55] as [number, number, number, number],
    expo: [0.16, 1, 0.3, 1] as [number, number, number, number],
    spring: "elastic.out(1, 0.5)",
  },
  stagger: {
    fast: 0.05,
    normal: 0.1,
    slow: 0.15,
  },
} as const;

export const spacing = {
  gutter: 16,
  sectionGap: 32,
  cardPadding: 20,
  borderRadius: {
    sm: 8,
    md: 14,
    lg: 20,
    xl: 28,
    full: 9999,
  },
} as const;

import React, { useRef } from "react";
import { useMagnetic } from "../motion/animations";
import { colors } from "../theme/tokens";

/* ─── Glowing border wrapper ─── */
export const GlowCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  onClick?: () => void;
}> = ({
  children,
  className = "",
  glowColor = colors.electricPurple,
  onClick,
}) => {
  return (
    <div
      className={`relative group ${className}`}
      onClick={onClick}
      style={{ perspective: "800px" }}
    >
      {/* Animated gradient border */}
      <div
        className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-[1px]"
        style={{
          background: `linear-gradient(135deg, ${glowColor}, ${colors.neonBlue}, ${colors.cyberPink})`,
        }}
      />
      {/* Card body */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: colors.surface.card,
          backdropFilter: "blur(24px)",
          border: `1px solid ${colors.border.subtle}`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

/* ─── Magnetic CTA button ─── */
export const MagneticButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
}> = ({ children, onClick, variant = "primary", className = "" }) => {
  const btnRef = useRef<HTMLButtonElement>(null);
  useMagnetic(btnRef, 0.25);

  const baseStyles =
    "relative px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 overflow-hidden cursor-pointer";

  const variantStyles = {
    primary: `bg-gradient-to-r from-[#7B2FF2] to-[#00C2FF] text-white hover:shadow-[0_0_30px_rgba(123,47,242,0.4)]`,
    secondary: `border border-[rgba(123,47,242,0.3)] text-[#F0F2FF] hover:border-[#7B2FF2] hover:shadow-[0_0_20px_rgba(123,47,242,0.2)]`,
    ghost: `text-[#8B8FAE] hover:text-[#F0F2FF] hover:bg-[rgba(123,47,242,0.1)]`,
  };

  return (
    <button
      ref={btnRef}
      onClick={onClick}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
    >
      {/* Ripple highlight */}
      <span className="absolute inset-0 bg-white/5 opacity-0 hover:opacity-100 transition-opacity duration-300" />
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
};

/* ─── Holographic badge ─── */
export const HoloBadge: React.FC<{
  children: React.ReactNode;
  color?: string;
  className?: string;
}> = ({ children, color = colors.neonBlue, className = "" }) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${className}`}
      style={{
        background: `linear-gradient(135deg, ${color}15, ${color}08)`,
        border: `1px solid ${color}30`,
        color,
        textShadow: `0 0 10px ${color}50`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full animate-pulse"
        style={{ background: color, boxShadow: `0 0 6px ${color}` }}
      />
      {children}
    </span>
  );
};

/* ─── Gradient divider ─── */
export const GradientDivider: React.FC<{ className?: string }> = ({
  className = "",
}) => (
  <div
    className={`h-px w-full ${className}`}
    style={{
      background:
        "linear-gradient(90deg, transparent, rgba(123, 47, 242, 0.3), rgba(0, 194, 255, 0.2), transparent)",
    }}
  />
);

/* ─── Stat display ─── */
export const StatGlow: React.FC<{
  label: string;
  value: string;
  color?: string;
  icon?: React.ReactNode;
}> = ({ label, value, color = colors.neonBlue, icon }) => (
  <div className="flex flex-col items-center gap-1">
    {icon && (
      <div style={{ color }} className="text-xl mb-1">
        {icon}
      </div>
    )}
    <span
      className="text-2xl font-bold"
      style={{
        background: `linear-gradient(135deg, ${color}, ${color}CC)`,
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        filter: `drop-shadow(0 0 8px ${color}40)`,
      }}
    >
      {value}
    </span>
    <span className="text-xs text-[#8B8FAE] uppercase tracking-widest">
      {label}
    </span>
  </div>
);

/* ─── Animated noise background overlay ─── */
export const NoiseOverlay: React.FC = () => (
  <div
    className="pointer-events-none fixed inset-0 z-50 opacity-[0.025]"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      backgroundRepeat: "repeat",
    }}
  />
);

/* ─── Ambient light orbs ─── */
export const AmbientOrbs: React.FC = () => (
  <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
    {/* Large purple orb — top left */}
    <div
      className="absolute w-[800px] h-[800px] rounded-full blur-[150px] orb-drift-1"
      style={{
        top: "-300px",
        left: "-200px",
        background:
          "radial-gradient(circle, rgba(123, 47, 242, 0.18) 0%, rgba(123, 47, 242, 0.05) 40%, transparent 70%)",
      }}
    />
    {/* Cyan orb — bottom right */}
    <div
      className="absolute w-[700px] h-[700px] rounded-full blur-[130px] orb-drift-2"
      style={{
        bottom: "-200px",
        right: "-150px",
        background:
          "radial-gradient(circle, rgba(0, 194, 255, 0.14) 0%, rgba(0, 194, 255, 0.04) 40%, transparent 70%)",
      }}
    />
    {/* Pink orb — center right */}
    <div
      className="absolute w-[600px] h-[600px] rounded-full blur-[120px] orb-drift-3"
      style={{
        top: "35%",
        right: "10%",
        background:
          "radial-gradient(circle, rgba(255, 46, 151, 0.10) 0%, transparent 60%)",
      }}
    />
    {/* Green accent orb — mid left */}
    <div
      className="absolute w-[500px] h-[500px] rounded-full blur-[100px] orb-drift-4"
      style={{
        top: "60%",
        left: "-5%",
        background:
          "radial-gradient(circle, rgba(0, 255, 148, 0.06) 0%, transparent 55%)",
      }}
    />
    {/* Violet orb — bottom center */}
    <div
      className="absolute w-[650px] h-[650px] rounded-full blur-[140px] orb-drift-5"
      style={{
        bottom: "10%",
        left: "30%",
        background:
          "radial-gradient(circle, rgba(168, 85, 247, 0.08) 0%, transparent 60%)",
      }}
    />
  </div>
);

/* ─── Animated grid mesh background ─── */
export const GridMesh: React.FC = () => (
  <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
    {/* Perspective grid floor */}
    <div
      className="absolute inset-0 opacity-[0.04]"
      style={{
        backgroundImage:
          "linear-gradient(rgba(123, 47, 242, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(123, 47, 242, 0.5) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
        maskImage:
          "linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)",
      }}
    />
    {/* Radial dot mesh */}
    <div
      className="absolute inset-0 opacity-[0.035]"
      style={{
        backgroundImage:
          "radial-gradient(circle, rgba(0, 194, 255, 0.8) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
        maskImage:
          "radial-gradient(ellipse at 50% 50%, black 0%, transparent 70%)",
        WebkitMaskImage:
          "radial-gradient(ellipse at 50% 50%, black 0%, transparent 70%)",
      }}
    />
  </div>
);

/* ─── Moving light beams ─── */
export const LightBeams: React.FC = () => (
  <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
    <div className="light-beam light-beam-1" />
    <div className="light-beam light-beam-2" />
    <div className="light-beam light-beam-3" />
  </div>
);

/* ─── Section background wrapper ─── */
export const SectionBg: React.FC<{
  children: React.ReactNode;
  variant?: "purple" | "blue" | "pink" | "green";
  className?: string;
}> = ({ children, variant = "purple", className = "" }) => {
  const gradientMap = {
    purple:
      "radial-gradient(ellipse at 50% 0%, rgba(123, 47, 242, 0.08) 0%, transparent 60%)",
    blue: "radial-gradient(ellipse at 30% 50%, rgba(0, 194, 255, 0.06) 0%, transparent 55%)",
    pink: "radial-gradient(ellipse at 70% 30%, rgba(255, 46, 151, 0.06) 0%, transparent 55%)",
    green:
      "radial-gradient(ellipse at 50% 80%, rgba(0, 255, 148, 0.05) 0%, transparent 55%)",
  };

  return (
    <div className={`relative ${className}`}>
      {/* Section ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: gradientMap[variant] }}
      />
      {/* Subtle horizontal light streak */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(123, 47, 242, 0.15), rgba(0, 194, 255, 0.1), transparent)",
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

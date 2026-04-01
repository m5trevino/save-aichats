import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Legacy colors (keeping for compatibility during transition)
        void: "#050505",
        matrix: "#00FF41",
        voltage: "#FFD700",
        hazard: "#FF0000",
        
        // Kinetik Extraction Colors
        "surface-container-low": "#1c1b1b",
        "secondary-fixed-dim": "#b8c8da",
        "secondary-fixed": "#d4e4f6",
        "on-secondary": "#223240",
        "on-surface-variant": "#c4c9ac",
        "background": "#131313",
        "on-surface": "#e5e2e1",
        "secondary": "#b8c8da",
        "surface-tint": "#abd600",
        "tertiary-fixed-dim": "#bbc3ff",
        "on-tertiary": "#112286",
        "on-primary-container": "#556d00",
        "inverse-surface": "#e5e2e1",
        "on-tertiary-container": "#4d5cbc",
        "tertiary": "#ffffff",
        "surface-variant": "#353534",
        "primary-fixed": "#c3f400",
        "on-error-container": "#ffdad6",
        "on-secondary-container": "#a7b7c8",
        "primary-fixed-dim": "#abd600",
        "on-error": "#690005",
        "surface-container": "#201f1f",
        "on-tertiary-fixed": "#000d5f",
        "inverse-primary": "#506600",
        "outline": "#8e9379",
        "on-background": "#e5e2e1",
        "surface-container-lowest": "#0e0e0e",
        "tertiary-container": "#dfe0ff",
        "surface-bright": "#3a3939",
        "secondary-container": "#394857",
        "surface-dim": "#131313",
        "on-secondary-fixed": "#0d1d2a",
        "primary-container": "#c3f400",
        "outline-variant": "#444933",
        "on-primary-fixed": "#161e00",
        "on-primary": "#283500",
        "on-secondary-fixed-variant": "#394857",
        "primary": "#ffffff", // Note: code.html has "primary": "#ffffff" but DESIGN.md says Primary is #CCFF00
        "inverse-on-surface": "#313030",
        "tertiary-fixed": "#dfe0ff",
        "surface-container-high": "#2a2a2a",
        "on-tertiary-fixed-variant": "#2d3c9c",
        "surface-container-highest": "#353534",
        "on-primary-fixed-variant": "#3c4d00",
        "surface": "#131313",
        "error": "#ffb4ab",
        "error-container": "#93000a",
        "kinetik-lime": "#CCFF00",
      },
      fontFamily: {
        "headline": ["var(--font-space-grotesk)", "sans-serif"],
        "body": ["var(--font-inter)", "sans-serif"],
        "label": ["var(--font-space-grotesk)", "sans-serif"],
        "mono": ["var(--font-jetbrains-mono)", "monospace"],
      },
      borderRadius: {
        "DEFAULT": "0px",
        "lg": "0px",
        "xl": "0px",
        "full": "9999px",
      },
      animation: {
        'scanline': 'scanline 10s linear infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '0.6' },
        }
      }
    },
  },
  plugins: [],
};
export default config;

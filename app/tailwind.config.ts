import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx,js,jsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0E0C0A",
          900: "#1A1612",
          700: "#3D3530",
          500: "#6B5F54",
          300: "#A89E92",
        },
        paper: {
          50:  "#FFFDF8",
          100: "#F8F5EE",
          200: "#F0EBE0",
          300: "#E5DFD0",
          400: "#D1C9B5",
        },
        amber: {
          50:  "#FEF3E2",
          600: "#D97706",
          700: "#B45309",
        },
        success: "#15803D",
        warning: "#CA8A04",
        danger:  "#B91C1C",
        info:    "#1E40AF",
        // semantic alias
        bg:           "#F8F5EE",
        "bg-elev":    "#FFFDF8",
        "bg-subtle":  "#F0EBE0",
        "border-default": "#E5DFD0",
        "border-strong": "#D1C9B5",
        text: {
          DEFAULT: "#1A1612",
          muted: "#6B5F54",
        },
        link:         "#D97706",
        "link-hover": "#B45309",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Source Serif Pro", "Source Han Serif SC", "Noto Serif SC", "Georgia", "serif"],
        sans:  ["var(--font-sans)", "Inter", "Source Han Sans SC", "system-ui", "sans-serif"],
        mono:  ["JetBrains Mono", "Menlo", "monospace"],
      },
      fontSize: {
        xs:   ["12px", { lineHeight: "1.4" }],
        sm:   ["14px", { lineHeight: "1.5" }],
        base: ["16px", { lineHeight: "1.65" }],
        md:   ["17px", { lineHeight: "1.65" }],
        lg:   ["18px", { lineHeight: "1.5" }],
        xl:   ["20px", { lineHeight: "1.4" }],
        "2xl":["24px", { lineHeight: "1.3" }],
        "3xl":["28px", { lineHeight: "1.3" }],
        "4xl":["32px", { lineHeight: "1.25" }],
        "5xl":["36px", { lineHeight: "1.25", letterSpacing: "-0.02em" }],
        "6xl":["40px", { lineHeight: "1.2", letterSpacing: "-0.02em" }],
        "7xl":["44px", { lineHeight: "1.2", letterSpacing: "-0.02em" }],
      },
      borderRadius: {
        none: "0",
        sm:   "2px",
        DEFAULT: "4px",
        md:   "6px",
        lg:   "8px",
        full: "9999px",
      },
      boxShadow: {
        none: "none",
        sm:   "0 1px 2px rgba(26, 22, 18, 0.04)",
        md:   "0 2px 8px rgba(26, 22, 18, 0.06)",
        focus:"0 0 0 3px rgba(217, 119, 6, 0.3)",
      },
      spacing: {
        header: "64px",
        footer: "120px",
        content: "680px",
      },
      maxWidth: {
        content:   "680px",
        container: "1280px",
      },
      transitionDuration: {
        fast: "150ms",
        base: "200ms",
        slow: "300ms",
      },
      zIndex: {
        sticky:  "10",
        header:  "30",
        overlay: "40",
        modal:   "50",
        toast:   "60",
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // B2B Enterprise SaaS Palette (TasteSkill & 21st standards)
        navy: {
          950: "#090d16",
          900: "#0f172a",
          850: "#131d33",
          800: "#1e293b",
          700: "#334155",
          600: "#475569",
        },
        surface: {
          DEFAULT: "#ffffff",
          subtle: "#f8fafc",
          muted: "#f1f5f9",
          border: "#e2e8f0",
          hover: "#f8fafc",
        },
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        accent: {
          DEFAULT: "#2563eb",
          hover: "#1d4ed8",
          subtle: "#eff6ff",
        },
        status: {
          success: "#059669",
          "success-bg": "#ecfdf5",
          "success-border": "#a7f3d0",
          warning: "#d97706",
          "warning-bg": "#fffbeb",
          "warning-border": "#fde68a",
          danger: "#dc2626",
          "danger-bg": "#fef2f2",
          "danger-border": "#fecaca",
          info: "#2563eb",
          "info-bg": "#eff6ff",
          "info-border": "#bfdbfe",
        },
        risk: {
          critical: "#dc2626",
          high: "#ea580c",
          medium: "#d97706",
          low: "#059669",
        },
        obsidian: {
          950: '#03050c',
          900: '#070913',
          850: '#0b0f1d',
          800: '#11172b',
          700: '#1a233f',
        },
        cyber: {
          cyan: '#06b6d4',
          neon: '#22d3ee',
          violet: '#8b5cf6',
          purple: '#a855f7',
          emerald: '#10b981',
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "sans-serif",
        ],
        mono: [
          '"JetBrains Mono"',
          '"Fira Code"',
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        md: "0.625rem",
        lg: "0.75rem",
        xl: "0.875rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(0, 0, 0, 0.04)",
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.06)",
        dropdown: "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)",
        modal: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.06)",
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-slow': 'float 6s ease-in-out infinite',
        'float-reverse': 'floatRev 7s ease-in-out infinite',
        'spin-slow': 'spin 30s linear infinite',
        'spin-reverse': 'spinRev 40s linear infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'radar': 'radar 2s linear infinite',
        'shimmer': 'shimmer 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        floatRev: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(12px)' },
        },
        spinRev: {
          '0%': { transform: 'rotate(360deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.4', filter: 'drop-shadow(0 0 15px rgba(139, 92, 246, 0.3))' },
          '50%': { opacity: '0.9', filter: 'drop-shadow(0 0 35px rgba(6, 182, 212, 0.6))' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
        radar: {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
export default config;

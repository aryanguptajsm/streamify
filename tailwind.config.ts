import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}", "./hooks/**/*.{ts,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        premium: "0 24px 80px rgba(0, 0, 0, 0.35)",
        soft: "0 14px 40px rgba(15, 23, 42, 0.24)"
      },
      backgroundImage: {
        "radial-fade": "radial-gradient(circle at top, rgba(120, 119, 198, 0.18), transparent 36%), radial-gradient(circle at right, rgba(56, 189, 248, 0.12), transparent 28%)"
      },
      fontFamily: {
        sans: ["var(--font-body)", "ui-sans-serif", "system-ui"],
        display: ["var(--font-display)", "ui-sans-serif", "system-ui"]
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translate3d(0, 0, 0)" },
          "50%": { transform: "translate3d(0, -10px, 0)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        }
      },
      animation: {
        float: "float 9s ease-in-out infinite",
        shimmer: "shimmer 1.8s linear infinite"
      }
    }
  },
  plugins: []
};

export default config;

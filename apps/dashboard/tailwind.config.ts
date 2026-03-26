import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        "fade-in-up": {
          "from": { opacity: "0", transform: "translateY(20px)" },
          "to": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "from": { opacity: "0" },
          "to": { opacity: "1" },
        },
        "slide-in-right": {
          "from": { opacity: "0", transform: "translateX(20px)" },
          "to": { opacity: "1", transform: "translateX(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 8px rgba(16,185,129,0.3)" },
          "50%": { boxShadow: "0 0 20px rgba(16,185,129,0.6)" },
        },
        "pulse-glow-amber": {
          "0%, 100%": { boxShadow: "0 0 8px rgba(245,158,11,0.3)" },
          "50%": { boxShadow: "0 0 20px rgba(245,158,11,0.6)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) both",
        "fade-in": "fade-in 0.4s ease both",
        "slide-in-right": "slide-in-right 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) both",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "pulse-glow-amber": "pulse-glow-amber 2s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;

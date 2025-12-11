import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FDFBF9", // Warm Ivory
        surface: "#F2F0EB", // Sand
        foreground: "#2D2D2D", // Ink Body
        title: "#1A1A1A", // Ink Title
        sub: "#595959",
        accent: {
          DEFAULT: "#D97757", // Terracotta
          foreground: "#FFFFFF",
        },
        alert: "#944C4C", // Muted Red
        border: "#E6E4DD",
        input: "#E0DDD5",
      },
      fontFamily: {
        serif: [
          "var(--font-merriweather)",
          "var(--font-noto-serif-kr)",
          "serif",
        ],
        sans: ["var(--font-noto-sans-kr)", "sans-serif"],
        hand: ["var(--font-nanum-pen)", "cursive"],
      },
      borderRadius: {
        lg: "16px",
        md: "12px",
        sm: "8px",
      },
      boxShadow: {
        soft: "0 4px 20px rgba(0, 0, 0, 0.05)",
        card: "0 2px 10px rgba(0, 0, 0, 0.03)",
        modal: "0 10px 30px rgba(0, 0, 0, 0.1)",
      },
    },
  },
  plugins: [],
};
export default config;

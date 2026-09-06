import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: "#0c4cc9",
        "primary-dark": "#082f83",
        background: "#ffffff",
        foreground: "#111c35",
        muted: "#657086",
        line: "#d8dee8",
        soft: "#f5f8fc",
        danger: "#dc2626",
        success: "#16a34a",
        warning: "#d97706",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
      },
    },
  },
  plugins: [],
};
export default config;

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        paper: "#f1f5f9",
        card: "#ffffff",
        line: "#e2e8f0",
        muted: "#64748b",
        accent: "#059669",
        accentSoft: "#d1fae5",
        warn: "#dc2626",
        gold: "#d97706",
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      borderRadius: {
        card: "12px",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)",
        "card-hover": "0 8px 24px 0 rgba(0,0,0,0.10), 0 2px 8px -2px rgba(0,0,0,0.06)",
        modal: "0 25px 60px -12px rgba(0,0,0,0.30)",
      },
    },
  },
  plugins: [],
};

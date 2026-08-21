/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0d1f23",
        "teal-deep": "#132e35",
        "teal-mid": "#2d4a53",
        "teal-soft": "#69818d",
        mist: "#afb3b7",
        slate: "#5a636a",
        paper: "#f2f0ea",
        "paper-light": "#fcfbf9",
        spark: "#e8a33d",
        "spark-hover": "#d4902b",
        line: "rgba(13, 31, 35, 0.14)",
      },
      fontFamily: {
        space: ["'Space Grotesk'", "sans-serif"],
        inter: ["'Inter'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      boxShadow: {
        premium: "0 20px 50px -20px rgba(13, 31, 35, 0.45)",
        card: "0 10px 30px -10px rgba(13, 31, 35, 0.1)",
      },
    },
  },
  plugins: [],
};

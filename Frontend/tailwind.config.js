/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1e5eff",
        light: "#eef4ff",
        soft: "#f5f7fb",
        textGray: "#6b7280",
      },
    },
  },
  plugins: [],
};
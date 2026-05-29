/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#fbfaf8",
        panel: "#ffffff",
        panel2: "#f8fafc",
        line: "#e5e7eb",
        mint: "#7c3aed",
        amber: "#8b5cf6",
        rose: "#ef4444"
      },
      boxShadow: {
        glow: "0 18px 45px rgba(124, 58, 237, 0.16)"
      }
    }
  },
  plugins: []
};

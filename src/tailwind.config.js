/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#2563EB", foreground: "#FFFFFF" },
        secondary: { DEFAULT: "#F1F5F9", foreground: "#1E293B" },
        success: { DEFAULT: "#16A34A", foreground: "#FFFFFF" },
        danger: { DEFAULT: "#DC2626", foreground: "#FFFFFF" },
        warning: { DEFAULT: "#F59E0B", foreground: "#FFFFFF" },
      },
    },
  },
  plugins: [],
};

import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        rosebrand: {
          50: "#fff1f7",
          100: "#ffe3ef",
          200: "#ffc6df",
          300: "#ff95c4",
          400: "#fb5ba5",
          500: "#ec2f86",
          600: "#d41b6f",
          700: "#b01459",
          800: "#92134b",
          900: "#7a1542"
        }
      },
      boxShadow: {
        soft: "0 18px 60px rgba(146, 19, 75, 0.12)"
      }
    }
  },
  plugins: []
} satisfies Config;

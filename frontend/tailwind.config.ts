import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        DEFAULT: "8px",
        lg: "12px",
        md: "8px",
        sm: "6px",
      },
    },
  },
  plugins: [],
} satisfies Config;

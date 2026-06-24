import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0D0D12",
        surface: "#16161E",
        surface2: "#1E1E28",
        accent: "#7C5CFC",
        foreground: "#ededed",
      },
    },
  },
  plugins: [],
};
export default config;

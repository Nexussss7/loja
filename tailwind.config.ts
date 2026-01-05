import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
            },
            fontFamily: {
                sans: ["var(--font-sans)", "system-ui", "sans-serif"],
            },
        },
    },
    plugins: [],
};
export default config;

import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['var(--font-inter)', 'sans-serif'],
                serif: ['Didot', '"Bodoni MT"', '"Times New Roman"', 'serif'],
                didot: ['Didot', '"Bodoni MT"', '"Times New Roman"', 'serif'],
                display: ['var(--font-inter)', 'sans-serif'],
            },
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                booking: {
                    bg: "#EBE6DF",
                    card: "#F4F1EC",
                    primary: "#2F4B3A",
                    primaryHover: "#243A2C",
                    textMain: "#312F2D",
                    textMuted: "#8A837A",
                    border: "#D9D2C7",
                    glass: "rgba(255, 255, 255, 0.40)",
                    glassBorder: "rgba(255, 255, 255, 0.60)",
                },
                primary: {
                    DEFAULT: "#fc0", // Yandex Yellow
                    foreground: "#000000",
                },
                secondary: {
                    DEFAULT: "#f5f5f7", // Light Gray
                    foreground: "#000000",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "#f0f0f2",
                    foreground: "#737373",
                },
                accent: {
                    DEFAULT: "#fff",
                    foreground: "#000",
                },
                popover: {
                    DEFAULT: "#ffffff",
                    foreground: "#000000",
                },
                card: {
                    DEFAULT: "#ffffff",
                    foreground: "#000000",
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            boxShadow: {
                'soft-out': '8px 8px 16px rgba(200, 193, 183, 0.6), -8px -8px 16px rgba(255, 255, 255, 0.8)',
                'soft-in': 'inset 4px 4px 8px rgba(200, 193, 183, 0.6), inset -4px -4px 8px rgba(255, 255, 255, 0.8)',
                'glass': '0 8px 32px 0 rgba(47, 75, 58, 0.1)',
            },
            keyframes: {
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
                "glass-shimmer": {
                    "0%": { backgroundPosition: "-200% 0" },
                    "100%": { backgroundPosition: "200% 0" },
                },
                "manifesto-enter": {
                    "0%": { opacity: "0", transform: "translateY(20px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                "glass-shimmer": "glass-shimmer 2s ease-in-out 1",
                "manifesto-enter": "manifesto-enter 0.6s ease-out forwards",
            },
        }
    },
    plugins: [require("tailwindcss-animate")],
};
export default config;

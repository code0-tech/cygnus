import type { Config } from "tailwindcss"

function withOpacity(variableName: string) {
    return `hsl(var(${variableName}) / <alpha-value>)`;
}

export default {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/stories/*.{js,ts,jsx,tsx,mdx}",
    ],
    darkMode: "class",
    theme: {
        variants: {
            fill: ['hover', 'focus'], // this line does the trick
        },
        extend: {
            fill: {
                primary: withOpacity('--fill-primary'),
                secondary: withOpacity('--fill-secondary'),
                error: withOpacity('--fill-error'),
                warning: withOpacity('--fill-warning'),
                success: withOpacity('--fill-success'),
                info: withOpacity('--fill-info'),
                black: withOpacity('--fill-black'),
                white: withOpacity('--fill-white'),
            },
            backgroundColor: {
                primary: withOpacity('--bg-primary'),
                secondary: withOpacity('--bg-secondary'),
                error: withOpacity('--bg-error'),
                warning: withOpacity('--bg-warning'),
                success: withOpacity('--bg-success'),
                info: withOpacity('--bg-info'),
                black: withOpacity('--bg-black'),
                white: withOpacity('--bg-white'),
            },
            textColor: {
                primary: withOpacity('--text-primary'),
                secondary: withOpacity('--text-secondary'),
                error: withOpacity('--text-error'),
                warning: withOpacity('--text-warning'),
                success: withOpacity('--text-success'),
                info: withOpacity('--text-info'),
                black: withOpacity('--text-black'),
                white: withOpacity('--text-white'),
            },
            borderColor: {
                primary: withOpacity('--border-primary'),
                secondary: withOpacity('--border-secondary'),
                error: withOpacity('--border-error'),
                warning: withOpacity('--border-warning'),
                success: withOpacity('--border-success'),
                info: withOpacity('--border-info'),
                black: withOpacity('--border-black'),
                white: withOpacity('--border-white'),
            },
        },
    },
    plugins: [
        require("tailwindcss-animate")
    ],
} satisfies Config
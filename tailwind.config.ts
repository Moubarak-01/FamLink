import type { Config } from 'tailwindcss';

export default {
    content: [
        "./index.html",
        "./**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class', // Enable class-based dark mode
    theme: {
        extend: {
            boxShadow: {
                'glow': 'inset 0 0 20px rgba(236, 72, 153, 0.3)', // Custom inner glow (Light mode base)
                'glow-dark': 'inset 0 0 40px rgba(236, 72, 153, 0.6)', // Intense inner glow (Dark mode)
            },
        },
    },
    plugins: [],
} satisfies Config;

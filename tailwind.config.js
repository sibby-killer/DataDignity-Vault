/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Custom color palette for SecureVault
                primary: {
                    DEFAULT: '#3B82F6', // Muted blue
                    hover: '#2563EB',
                },
                destructive: {
                    DEFAULT: '#EF4444', // Red-500
                    hover: '#DC2626', // Red-600
                },
                neutral: {
                    50: '#F8FAFC',
                    100: '#F1F5F9',
                    200: '#E2E8F0',
                    300: '#CBD5E1',
                    700: '#334155',
                    800: '#1E293B',
                    900: '#0F172A',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            fontSize: {
                'h1': ['32px', { lineHeight: '1.2', fontWeight: '600' }],
                'h2': ['24px', { lineHeight: '1.3', fontWeight: '600' }],
                'h3': ['18px', { lineHeight: '1.4', fontWeight: '500' }],
                'body': ['16px', { lineHeight: '1.5', fontWeight: '400' }],
                'caption': ['14px', { lineHeight: '1.4', fontWeight: '400' }],
            },
            boxShadow: {
                'card': '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            },
            borderRadius: {
                'card': '0.75rem', // 12px
            },
            animation: {
                'fade-in': 'fadeIn 250ms ease-in-out',
                'slide-in': 'slideIn 250ms ease-in-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideIn: {
                    '0%': { transform: 'translateY(-10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
            },
        },
    },
    plugins: [],
}

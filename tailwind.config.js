/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // shadcn/ui semantic tokens mapped to outdoor theme CSS variables
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Outdoor Natural Campfire Roo Orange Palette
        roo: {
          50: '#FFF5F2',
          100: '#FFE9E3',
          200: '#FFD4C7',
          300: '#FFB39F',
          400: '#FF886B',
          500: '#FF5A1F', // Signature Campfire Roo Orange
          600: '#FA490D',
          700: '#E03600',
          800: '#BA2E02',
          900: '#822103',
        },
        // Outdoor Pine & Conifer Forest Palette
        forest: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
          950: '#052E16',
        },
        // Clean Minimalist Dark Tones
        dark: {
          950: '#0A0A0A',
          900: '#111111',
          800: '#222222',
          700: '#484848',
          600: '#717171',
          500: '#888888',
          400: '#B0B0B0',
          300: '#DDDDDD',
          200: '#EBEBEB',
          100: '#F7F7F7',
          50: '#FAFAFA',
        },
      },
      borderColor: {
        DEFAULT: "hsl(var(--border))",
        border: "hsl(var(--border))",
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      boxShadow: {
        'airbnb': '0 1px 2px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.05)',
        'airbnb-hover': '0 6px 20px rgba(0, 0, 0, 0.12)',
        'search': '0 3px 12px 0 rgba(0,0,0,0.1), 0 1px 2px 0 rgba(0,0,0,0.08)',
        'search-hover': '0 6px 20px rgba(0,0,0,0.15)',
        'float-pill': '0 8px 28px rgba(0, 0, 0, 0.28)',
        'subtle-glow': '0 0 20px -3px rgba(255, 90, 31, 0.25)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
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
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        float: 'float 3.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

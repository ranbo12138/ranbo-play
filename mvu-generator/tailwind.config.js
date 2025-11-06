/** @type {import('tailwindcss').Config} */
const withOpacityValue = (variable) => ({ opacityValue }) => {
  if (opacityValue === undefined) {
    return `rgb(var(${variable}))`
  }

  return `rgb(var(${variable}) / ${opacityValue})`
}

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    screens: {
      'xs': '360px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        background: withOpacityValue('--color-background'),
        surface: withOpacityValue('--color-surface'),
        foreground: withOpacityValue('--color-foreground'),
        border: withOpacityValue('--color-border'),
        muted: withOpacityValue('--color-muted'),
        accent: withOpacityValue('--color-accent'),
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', '"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 20px 45px -20px rgba(15, 23, 42, 0.45)',
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      minHeight: {
        '44': '44px',
        'touch-target': '44px',
      },
      minWidth: {
        '44': '44px',
        'touch-target': '44px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

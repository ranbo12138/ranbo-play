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
    },
  },
  plugins: [],
}

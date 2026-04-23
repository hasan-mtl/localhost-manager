/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#061222',
        ocean: '#08162a',
        panel: '#0e1b2f',
        line: 'rgba(142, 181, 255, 0.12)',
        accent: '#2d73ff',
        accentSoft: '#1f4eb4',
        success: '#21c36f',
        warning: '#f59e0b',
        danger: '#ef4444',
        muted: '#8fa3c7',
      },
      boxShadow: {
        panel: '0 20px 55px rgba(1, 7, 18, 0.45)',
      },
      backgroundImage: {
        shell:
          'radial-gradient(circle at top, rgba(42, 111, 255, 0.22), transparent 35%), linear-gradient(180deg, #041122 0%, #07121f 50%, #050d19 100%)',
      },
      borderRadius: {
        shell: '28px',
      },
    },
  },
  plugins: [],
};


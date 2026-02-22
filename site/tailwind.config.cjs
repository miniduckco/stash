/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				background: 'var(--background)',
				foreground: 'var(--foreground)',
				primary: 'var(--primary)',
				'primary-foreground': 'var(--primary-foreground)',
				secondary: 'var(--secondary)',
				'secondary-foreground': 'var(--secondary-foreground)',
				muted: 'var(--muted)',
				'muted-foreground': 'var(--muted-foreground)',
				accent: 'var(--accent)',
				'accent-foreground': 'var(--accent-foreground)',
				border: 'var(--border)',
				ring: 'var(--ring)'
			},
			fontFamily: {
				sans: ['Figtree', 'system-ui', 'sans-serif'],
				serif: ['Source Serif 4', 'serif']
			}
		}
	},
	plugins: [require('@tailwindcss/typography')]
};

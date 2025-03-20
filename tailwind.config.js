module.exports = {
	content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
	darkMode: 'class',
	theme: {
		extend: {
			colors: {
				dark: {
					bg: '#121212',
					card: '#1a1a1a',
					border: '#333333',
					text: '#e9e9e9',
					accent: '#24b47e',
				},
			},
		},
	},
	plugins: [],
};

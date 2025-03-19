import '../styles/globals.css';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

function MyApp({ Component, pageProps }) {
	return (
		<div className="flex flex-col min-h-screen bg-gray-100">
			<Nav />
			<Component {...pageProps} />
			<Footer />
		</div>
	);
}

export default MyApp;

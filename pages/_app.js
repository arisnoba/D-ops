import { useState, useEffect } from 'react';
import Head from 'next/head';
import '../styles/globals.css';
import Layout from '../components/Layout';
import { AuthProvider } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';

// 보호되지 않은 경로 목록
const unprotectedRoutes = ['/login'];

function MyApp({ Component, pageProps, router }) {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
		// 다크 모드를 기본으로 설정
		document.documentElement.classList.add('dark');
	}, []);

	// 페이지 로딩 전에 마운트 상태 확인
	if (!mounted) {
		return null;
	}

	// 현재 경로가 보호되어야 하는지 확인
	const isProtectedRoute = !unprotectedRoutes.includes(router.pathname);

	return (
		<AuthProvider>
			<Head>
				<title>D:OPS - 운영 관리 시스템</title>
				<meta key="main-viewport" name="viewport" content="width=device-width, initial-scale=1" />
			</Head>

			<div className="min-h-screen bg-gray-50 dark:bg-dark-bg dark:text-dark-text">
				{isProtectedRoute ? (
					<ProtectedRoute>
						<Layout>
							<Component {...pageProps} key={router.route} />
						</Layout>
					</ProtectedRoute>
				) : (
					<Component {...pageProps} key={router.route} />
				)}
			</div>
		</AuthProvider>
	);
}

export default MyApp;

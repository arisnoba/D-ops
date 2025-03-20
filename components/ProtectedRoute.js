import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
	const { user, loading } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (!loading && !user) {
			router.push('/login');
		}
	}, [user, loading, router]);

	// 로딩 중이거나 인증되지 않은 경우 컨텐츠를 숨김
	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-dark-bg">
				<div className="text-center">
					<div className="w-16 h-16 border-4 border-blue-500 dark:border-dark-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
					<p className="mt-4 text-gray-600 dark:text-gray-400">로딩 중...</p>
				</div>
			</div>
		);
	}

	if (!user) {
		return null; // 로그인 페이지로 리디렉션되기 전에 빈 화면 표시
	}

	return <>{children}</>;
}

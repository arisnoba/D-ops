import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

export default function Login() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const { login, user } = useAuth();
	const router = useRouter();

	// 이미 로그인된 경우 메인 페이지로 리디렉션
	useEffect(() => {
		if (user) {
			router.push('/');
		}
	}, [user, router]);

	const handleSubmit = async e => {
		e.preventDefault();

		if (!email || !password) {
			setError('이메일과 비밀번호를 모두 입력해주세요.');
			return;
		}

		try {
			setLoading(true);
			setError('');

			const result = await login(email, password);

			if (!result.success) {
				setError(result.error || '로그인에 실패했습니다.');
			}
		} catch (err) {
			setError('로그인 중 오류가 발생했습니다.');
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<Head>
				<title>로그인 | D-ops</title>
			</Head>

			<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg">
				<div className="w-full max-w-md">
					<div className="bg-white dark:bg-dark-card p-8 rounded-lg shadow-md">
						<h1 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-white">D-ops</h1>

						<form onSubmit={handleSubmit}>
							{error && <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-4">{error}</div>}

							<div className="mb-6">
								<label htmlFor="email" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
									이메일
								</label>
								<input
									id="email"
									type="email"
									value={email}
									onChange={e => setEmail(e.target.value)}
									className="w-full px-4 py-2 border dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-dark-accent dark:bg-dark-bg dark:text-dark-text"
									required
								/>
							</div>

							<div className="mb-6">
								<label htmlFor="password" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
									비밀번호
								</label>
								<input
									id="password"
									type="password"
									value={password}
									onChange={e => setPassword(e.target.value)}
									className="w-full px-4 py-2 border dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-dark-accent dark:bg-dark-bg dark:text-dark-text"
									required
								/>
							</div>

							<button
								type="submit"
								disabled={loading}
								className={`w-full py-2 bg-blue-500 dark:bg-dark-accent text-white rounded-lg hover:bg-blue-600 dark:hover:bg-dark-accent/90 transition duration-200 ${
									loading ? 'opacity-70 cursor-not-allowed' : ''
								}`}>
								{loading ? '로그인 중...' : '로그인'}
							</button>
						</form>
					</div>
				</div>
			</div>
		</>
	);
}

import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';

export default function SideNav({ setClientModalOpen, setTaskModalOpen, setPriceModalOpen }) {
	const router = useRouter();
	const { user, logout } = useAuth();
	const [showTaskActions, setShowTaskActions] = useState(false);
	const [showClientActions, setShowClientActions] = useState(false);
	const [showSettings, setShowSettings] = useState(false);

	useEffect(() => {
		const { pathname } = router;
		// 대시보드
		if (pathname === '/' || pathname === '/dashboard') {
			setShowTaskActions(false);
			setShowClientActions(false);
			setShowSettings(false);
		}
		// 운영 업무
		else if (pathname.startsWith('/tasks')) {
			setShowTaskActions(true);
			setShowClientActions(false);
			setShowSettings(true);
		}
		// 클라이언트
		else if (pathname.startsWith('/clients')) {
			setShowTaskActions(false);
			setShowClientActions(true);
			setShowSettings(false);
		}
	}, [router.pathname]);

	const isActive = path => router.pathname === path || router.pathname.startsWith(`${path}/`);

	const handleLogout = async () => {
		if (confirm('로그아웃 하시겠습니까?')) {
			await logout();
		}
	};

	return (
		<div className="flex fixed top-0 left-0 flex-col justify-between w-48 h-screen bg-white border-r border-gray-200 dark:bg-dark-bg dark:border-dark-border">
			<div>
				<div className="flex items-center p-4 border-b border-gray-200 dark:border-dark-border" style={{ height: '72px' }}>
					<h1 className="text-xl font-bold text-gray-800 dark:text-white">D:OPS</h1>
				</div>

				<div className="py-4">
					<ul className="space-y-1">
						<li>
							<Link href="/">
								<a
									className={`flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 ${
										isActive('/') || isActive('/dashboard')
											? 'bg-blue-50 dark:bg-dark-accent/10 text-blue-600 dark:text-dark-accent font-medium'
											: 'hover:bg-gray-100 dark:hover:bg-dark-border/50'
									}`}>
									<span className="mr-3">
										<i className="text-xl fa-duotone fa-house"></i>
									</span>
									<span>대시보드</span>
								</a>
							</Link>
						</li>
						<li>
							<Link href="/tasks">
								<a
									className={`flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 ${
										isActive('/tasks') ? 'font-medium text-blue-600 bg-blue-50 dark:bg-dark-accent/10 dark:text-dark-accent' : 'hover:bg-gray-100 dark:hover:bg-dark-border/50'
									}`}>
									<span className="mr-3">
										<i className="text-xl fa-duotone fa-list-check"></i>
									</span>
									<span>운영 업무</span>
								</a>
							</Link>
						</li>
						<li>
							<Link href="/clients">
								<a
									className={`flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 ${
										isActive('/clients') ? 'font-medium text-blue-600 bg-blue-50 dark:bg-dark-accent/10 dark:text-dark-accent' : 'hover:bg-gray-100 dark:hover:bg-dark-border/50'
									}`}>
									<span className="mr-3">
										<i className="text-xl fa-duotone fa-building"></i>
									</span>
									<span>클라이언트</span>
								</a>
							</Link>
						</li>
						<li>
							<Link href="/expenses">
								<a
									className={`flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 ${
										isActive('/expenses') ? 'font-medium text-blue-600 bg-blue-50 dark:bg-dark-accent/10 dark:text-dark-accent' : 'hover:bg-gray-100 dark:hover:bg-dark-border/50'
									}`}>
									<span className="mr-3">
										<i className="text-xl fa-duotone fa-wallet"></i>
									</span>
									<span>지출 관리</span>
								</a>
							</Link>
						</li>
					</ul>
				</div>

				{(showTaskActions || showClientActions) && (
					<div className="py-4 border-t border-gray-200 dark:border-dark-border">
						<h3 className="px-4 mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">작업</h3>
						<ul className="space-y-1">
							{showTaskActions && (
								<li>
									<button
										onClick={() => setTaskModalOpen(true)}
										className="flex items-center px-4 py-2 w-full text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-border/50">
										<span className="mr-3">
											<i className="text-xl fa-duotone fa-circle-plus"></i>
										</span>
										<span>업무 등록</span>
									</button>
								</li>
							)}
							{showClientActions && (
								<li>
									<button
										onClick={() => setClientModalOpen(true)}
										className="flex items-center px-4 py-2 w-full text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-border/50">
										<span className="mr-3">
											<i className="text-xl fa-duotone fa-user-plus"></i>
										</span>
										<span>클라이언트 등록</span>
									</button>
								</li>
							)}
						</ul>
					</div>
				)}

				{showSettings && (
					<div className="py-4 border-t border-gray-200 dark:border-dark-border">
						<h3 className="px-4 mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">Settings</h3>
						<ul className="space-y-1">
							<li>
								<button
									onClick={() => setPriceModalOpen(true)}
									className="flex items-center px-4 py-2 w-full text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-border/50">
									<span className="mr-3">
										<i className="text-xl fa-duotone fa-sliders-simple"></i>
									</span>
									<span>운영 단가 설정</span>
								</button>
							</li>
						</ul>
					</div>
				)}
			</div>

			<div className="p-4 border-t border-gray-200 dark:border-dark-border">
				{user && (
					<div className="flex flex-col">
						<span className="mb-2 text-xs text-gray-600 truncate dark:text-gray-300">{user.email}</span>
						<button onClick={handleLogout} className="flex items-center text-sm text-left text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
							<i className="mr-1 fa-duotone fa-sign-out-alt"></i>
							로그아웃
						</button>
					</div>
				)}
			</div>
		</div>
	);
}

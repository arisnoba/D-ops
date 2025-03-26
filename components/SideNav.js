import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function SideNav({ setClientModalOpen, setTaskModalOpen }) {
	const router = useRouter();
	const { user, logout } = useAuth();

	const isActive = path => router.pathname === path || router.pathname.startsWith(`${path}/`);

	const handleLogout = async () => {
		if (confirm('로그아웃 하시겠습니까?')) {
			await logout();
		}
	};

	return (
		<div className="w-48 h-screen fixed left-0 top-0 bg-white dark:bg-dark-bg border-r border-gray-200 dark:border-dark-border">
			<div className="p-4 border-b border-gray-200 dark:border-dark-border">
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
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="20"
										height="20"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="1.5"
										strokeLinecap="round"
										strokeLinejoin="round"
										className="lucide lucide-home">
										<path d="M9.43414 20.803V13.0557C9.43414 12.5034 9.88186 12.0557 10.4341 12.0557H14.7679C15.3202 12.0557 15.7679 12.5034 15.7679 13.0557V20.803M12.0181 3.48798L5.53031 7.9984C5.26145 8.18532 5.10114 8.49202 5.10114 8.81948L5.10117 18.803C5.10117 19.9075 5.9966 20.803 7.10117 20.803H18.1012C19.2057 20.803 20.1012 19.9075 20.1012 18.803L20.1011 8.88554C20.1011 8.55988 19.9426 8.25462 19.6761 8.06737L13.1639 3.49088C12.8204 3.24951 12.3627 3.24836 12.0181 3.48798Z"></path>
									</svg>
								</span>
								<span>대시보드</span>
							</a>
						</Link>
					</li>
					<li>
						<Link href="/tasks">
							<a
								className={`flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 ${
									isActive('/tasks') ? 'bg-blue-50 dark:bg-dark-accent/10 text-blue-600 dark:text-dark-accent font-medium' : 'hover:bg-gray-100 dark:hover:bg-dark-border/50'
								}`}>
								<span className="mr-3">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="20"
										height="20"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="1.5"
										strokeLinecap="round"
										strokeLinejoin="round"
										className="lucide lucide-list">
										<line x1="8" x2="21" y1="6" y2="6"></line>
										<line x1="8" x2="21" y1="12" y2="12"></line>
										<line x1="8" x2="21" y1="18" y2="18"></line>
										<line x1="3" x2="3.01" y1="6" y2="6"></line>
										<line x1="3" x2="3.01" y1="12" y2="12"></line>
										<line x1="3" x2="3.01" y1="18" y2="18"></line>
									</svg>
								</span>
								<span>운영 업무</span>
							</a>
						</Link>
					</li>
					<li>
						<Link href="/clients">
							<a
								className={`flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 ${
									isActive('/clients') ? 'bg-blue-50 dark:bg-dark-accent/10 text-blue-600 dark:text-dark-accent font-medium' : 'hover:bg-gray-100 dark:hover:bg-dark-border/50'
								}`}>
								<span className="mr-3">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="20"
										height="20"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="1.5"
										strokeLinecap="round"
										strokeLinejoin="round"
										className="lucide lucide-realtime">
										<path d="M8.04273 1.58203V5.32205M5.24354 5.32205L2.04712 2.02791M5.24354 7.90979H1.57764M15.3776 15.5507L21.079 14.1316C21.5417 14.0164 21.5959 13.3806 21.1595 13.1887L8.00828 7.40586C7.59137 7.22254 7.16643 7.64661 7.3489 8.06389L13.0321 21.0607C13.2224 21.496 13.8556 21.4454 13.9743 20.9854L15.3776 15.5507Z"></path>
									</svg>
								</span>
								<span>클라이언트</span>
							</a>
						</Link>
					</li>
					<li className="px-4 pt-6 pb-2">
						<h3 className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">작업</h3>
					</li>
					<li>
						<button onClick={() => setTaskModalOpen(true)} className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-border/50">
							<span className="mr-3">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									class="lucide lucide-plus text-foreground">
									<path d="M5 12h14"></path>
									<path d="M12 5v14"></path>
								</svg>
							</span>
							<span>업무 등록</span>
						</button>
					</li>
					<li>
						<button
							onClick={() => setClientModalOpen(true)}
							className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-border/50">
							<span className="mr-3">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									class="lucide lucide-plus text-foreground">
									<path d="M5 12h14"></path>
									<path d="M12 5v14"></path>
								</svg>
							</span>
							<span>클라이언트 등록</span>
						</button>
					</li>
				</ul>
			</div>

			<div className="absolute bottom-0 w-full border-t border-gray-200 dark:border-dark-border p-4">
				{user && (
					<div className="flex flex-col">
						<span className="text-xs text-gray-600 dark:text-gray-300 truncate mb-2">{user.email}</span>
						<button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-left">
							로그아웃
						</button>
					</div>
				)}
			</div>
		</div>
	);
}

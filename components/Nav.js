import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Modal from './Modal';
import ClientForm from './ClientForm';
import TaskForm from './TaskForm';

export default function Nav() {
	const router = useRouter();
	const [clientModalOpen, setClientModalOpen] = useState(false);
	const [taskModalOpen, setTaskModalOpen] = useState(false);

	// 현재 경로에 따라 active 스타일 적용
	const isActive = path => {
		return router.pathname === path || router.pathname.startsWith(`${path}/`);
	};

	const handleClientSuccess = () => {
		setClientModalOpen(false);
		if (taskModalOpen) {
			// 작업 등록 모달 내에서 클라이언트 등록을 한 경우
			// 클라이언트 목록을 새로고침하기 위해 작업 폼을 새로고침 할 필요가 있음
			// TaskForm 컴포넌트 내에서 useEffect로 자동 새로고침됨
		} else {
			// 클라이언트 등록 후 클라이언트 페이지로 이동
			router.push('/clients');
		}
	};

	const handleTaskSuccess = () => {
		setTaskModalOpen(false);
		// 업무 등록 후 메인 페이지로 이동
		router.push('/');
	};

	return (
		<>
			<header className="bg-white shadow-md">
				<div className="container mx-auto px-4 py-6">
					<div className="flex justify-between items-center">
						<Link href="/">
							<a className="text-2xl font-bold text-gray-800">D-ops</a>
						</Link>
						<div className="flex items-center">
							<nav className="mr-6">
								<ul className="flex space-x-6">
									<li>
										<Link href="/">
											<a className={`hover:text-blue-600 ${isActive('/') && !isActive('/clients') && !isActive('/tasks') ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>대시보드</a>
										</Link>
									</li>
									<li>
										<Link href="/clients">
											<a className={`hover:text-blue-600 ${isActive('/clients') ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>클라이언트</a>
										</Link>
									</li>
								</ul>
							</nav>
							<div className="flex space-x-2">
								<button onClick={() => setClientModalOpen(true)} className="border border-blue-500 text-blue-500 hover:bg-blue-50 font-bold py-2 px-4 rounded-lg transition duration-200">
									+ 클라이언트
								</button>
								<button onClick={() => setTaskModalOpen(true)} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200">
									+ 업무 등록
								</button>
							</div>
						</div>
					</div>
				</div>
			</header>

			{/* 클라이언트 등록 모달 */}
			<Modal isOpen={clientModalOpen} onClose={() => setClientModalOpen(false)} title="새 클라이언트 등록">
				<ClientForm onSuccess={handleClientSuccess} onCancel={() => setClientModalOpen(false)} />
			</Modal>

			{/* 업무 등록 모달 */}
			<Modal isOpen={taskModalOpen} onClose={() => setTaskModalOpen(false)} title="새 업무 등록">
				<TaskForm
					onSuccess={handleTaskSuccess}
					onCancel={() => setTaskModalOpen(false)}
					onClientRequired={() => {
						setClientModalOpen(true);
						// 클라이언트 등록 완료 후 다시 업무 모달로 돌아오도록 taskModalOpen은 유지
					}}
				/>
			</Modal>
		</>
	);
}

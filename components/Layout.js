import { useState } from 'react';
import SideNav from './SideNav';
import Modal from './Modal';
import ClientForm from './ClientForm';
import TaskForm from './TaskForm';
import { useRouter } from 'next/router';

export default function Layout({ children }) {
	const [clientModalOpen, setClientModalOpen] = useState(false);
	const [taskModalOpen, setTaskModalOpen] = useState(false);
	const router = useRouter();

	const handleClientSuccess = () => {
		setClientModalOpen(false);
		if (taskModalOpen) {
			// 작업 등록 모달 내에서 클라이언트 등록을 한 경우
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
		<div className="flex bg-gray-50 dark:bg-[#121212]">
			<SideNav />
			<div className="flex-1 ml-48">
				<header className="h-14 border-b border-gray-200 dark:border-dark-border flex items-center justify-end px-6 bg-white dark:bg-[#181818]">
					<div className="flex items-center space-x-4">
						<button
							onClick={() => setClientModalOpen(true)}
							className="px-3 py-1 border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-200 rounded-md text-sm hover:bg-gray-50 dark:hover:bg-dark-border">
							+ 클라이언트
						</button>
						<button onClick={() => setTaskModalOpen(true)} className="px-3 py-1 bg-dark-accent text-white rounded-md text-sm hover:bg-dark-accent/90">
							+ 업무 등록
						</button>
					</div>
				</header>
				<main className="p-6 min-h-[calc(100vh-3.5rem)]">{children}</main>
			</div>

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
		</div>
	);
}

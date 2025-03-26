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
		// 현재 페이지에서 업데이트만 수행
		if (router.pathname === '/tasks') {
			// tasks 페이지에서는 페이지 새로고침 없이 데이터만 업데이트
			window.dispatchEvent(new CustomEvent('updateTasks'));
		} else {
			// 다른 페이지에서는 현재 페이지 새로고침
			router.replace(router.asPath);
		}
	};

	return (
		<div className="flex h-screen bg-gray-50 dark:bg-[#121212] overflow-auto">
			<SideNav setClientModalOpen={setClientModalOpen} setTaskModalOpen={setTaskModalOpen} />
			<div className="flex-1 ml-48">
				<main className="h-screen ">{children}</main>
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

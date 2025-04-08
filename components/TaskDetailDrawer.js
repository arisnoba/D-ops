import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import Drawer from './Drawer';
import TaskEditDrawer from './TaskEditDrawer';

export default function TaskDetailDrawer({ isOpen, onClose, taskId }) {
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	const [task, setTask] = useState(null);
	const [error, setError] = useState(null);
	const [deleteLoading, setDeleteLoading] = useState(false);
	const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);

	useEffect(() => {
		if (isOpen && taskId) {
			fetchTask();
		}
	}, [isOpen, taskId]);

	// Edit 드로어가 닫히면 상세 정보 다시 불러오기
	useEffect(() => {
		if (!isEditDrawerOpen && isOpen && taskId) {
			fetchTask();
		}
	}, [isEditDrawerOpen]);

	async function fetchTask() {
		try {
			setLoading(true);
			setError(null);

			const { data, error } = await supabase
				.from('tasks')
				.select(
					`
          *,
          clients:client_id (
            id,
            name,
            contact_person,
            contact_email,
            contact_phone
          )
        `
				)
				.eq('id', taskId)
				.single();

			if (error) throw error;
			if (data) setTask(data);
		} catch (error) {
			console.error('Error fetching task:', error.message);
			setError('업무를 불러오는 중 오류가 발생했습니다.');
		} finally {
			setLoading(false);
		}
	}

	async function handleDelete() {
		if (!confirm('정말로 이 업무를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
			return;
		}

		try {
			setDeleteLoading(true);

			const { error } = await supabase.from('tasks').delete().eq('id', taskId);

			if (error) throw error;

			// 삭제 성공 후 드로어 닫기
			onClose();
			// 페이지 새로고침
			router.reload();
		} catch (error) {
			console.error('Error deleting task:', error.message);
			alert('업무 삭제 중 오류가 발생했습니다.');
		} finally {
			setDeleteLoading(false);
		}
	}

	// 수정 드로어 열기
	const handleEdit = () => {
		setIsEditDrawerOpen(true);
	};

	// 수정 드로어 닫기
	const handleCloseEditDrawer = () => {
		setIsEditDrawerOpen(false);
	};

	// 카테고리 이름 매핑
	const getCategoryName = category => {
		switch (category) {
			case 'design':
				return '디자인';
			case 'development':
				return '개발';
			case 'operation':
				return '운영';
			default:
				return category;
		}
	};

	// 카테고리별 스타일 클래스
	const getCategoryStyle = category => {
		switch (category) {
			case 'design':
				return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
			case 'development':
				return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
			case 'operation':
				return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
			default:
				return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
		}
	};

	// 시간 단위 포맷
	const formatTimeUnit = hours => {
		if (hours >= 8) {
			const days = Math.floor(hours / 8);
			const remainingHours = hours % 8;

			if (remainingHours === 0) {
				return `${days}일`;
			} else {
				return `${days}일 ${remainingHours}시간`;
			}
		} else {
			return `${hours}시간`;
		}
	};

	// 날짜 포맷
	const formatDate = dateString => {
		const date = new Date(dateString);
		return date.toLocaleDateString('ko-KR', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	return (
		<>
			<Drawer isOpen={isOpen} onClose={onClose} title="업무 상세 정보">
				{loading ? (
					<div className="py-8 text-center">
						<p className="text-gray-500">로딩 중...</p>
					</div>
				) : error || !task ? (
					<div className="py-8">
						<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error || '업무를 찾을 수 없습니다.'}</div>
					</div>
				) : (
					<div>
						<div className="flex justify-between items-start mb-4">
							<h1 className="text-2xl font-bold">{task.title}</h1>
							<span className={`rounded-full px-4 py-1 text-sm font-medium ${getCategoryStyle(task.category)}`}>{getCategoryName(task.category)}</span>
						</div>

						<div className="mb-6 text-sm">
							<p>업무일: {task.task_date ? new Date(task.task_date).toLocaleDateString('ko-KR') : '지정되지 않음'}</p>
							<p className="text-gray-500 dark:text-gray-400">등록일: {formatDate(task.created_at)}</p>
							<p>담당자: {task.manager || '지정되지 않음'}</p>
						</div>

						<div className="mb-6">
							<h3 className="text-lg font-semibold mb-2">업무 설명</h3>
							<div className="bg-gray-50 dark:bg-dark-bg/60 p-4 rounded-lg whitespace-pre-wrap dark:text-white">{task.description || '설명이 없습니다.'}</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
							<div className="bg-gray-50 dark:bg-dark-bg/60 p-4 rounded-lg">
								<h3 className="text-md font-semibold mb-1 dark:text-gray-300">소요 시간</h3>
								<p className="text-xl font-bold dark:text-white">{formatTimeUnit(task.hours)}</p>
							</div>
							<div className="bg-gray-50 dark:bg-dark-bg/60 p-4 rounded-lg">
								<h3 className="text-md font-semibold mb-1 dark:text-gray-300">시간당 단가</h3>
								<p className="text-xl font-bold dark:text-white">{task.price_per_hour.toLocaleString()}원</p>
							</div>
							<div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
								<h3 className="text-md font-semibold mb-1 dark:text-gray-300">총 가격</h3>
								<p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{task.price.toLocaleString()}원</p>
							</div>
						</div>

						{task.clients && (
							<div className="mb-4">
								<details className="group">
									<summary className="flex items-center justify-between cursor-pointer text-sm text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
										<span>클라이언트 정보</span>
										<svg className="w-5 h-5 transition-transform group-open:rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
											<path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
										</svg>
									</summary>
									<div className="mt-2 px-2 py-3 bg-gray-50 dark:bg-dark-bg/40 rounded text-sm">
										<div className="flex flex-wrap">
											<div className="w-full flex items-center mb-1">
												<span className="text-gray-500 dark:text-gray-400 mr-2 w-16">이름:</span>
												<span className="font-medium dark:text-gray-300">{task.clients.name}</span>
											</div>
											{task.clients.contact_person && (
												<div className="w-full flex items-center mb-1">
													<span className="text-gray-500 dark:text-gray-400 mr-2 w-16">담당자:</span>
													<span className="dark:text-gray-300">{task.clients.contact_person}</span>
												</div>
											)}
											{task.clients.contact_email && (
												<div className="w-full flex items-center mb-1">
													<span className="text-gray-500 dark:text-gray-400 mr-2 w-16">이메일:</span>
													<span className="dark:text-gray-300">{task.clients.contact_email}</span>
												</div>
											)}
											{task.clients.contact_phone && (
												<div className="w-full flex items-center">
													<span className="text-gray-500 dark:text-gray-400 mr-2 w-16">연락처:</span>
													<span className="dark:text-gray-300">{task.clients.contact_phone}</span>
												</div>
											)}
										</div>
									</div>
								</details>
							</div>
						)}

						<div className="flex justify-between mt-6">
							<button onClick={handleDelete} disabled={deleteLoading} className="text-red-800 hover:text-red-600 py-2 px-2 rounded-lg shadow-md transition duration-200">
								{deleteLoading ? '삭제 중...' : '삭제하기'}
							</button>
							<button
								onClick={handleEdit}
								className="bg-green-900 hover:bg-green-800 border border-green-700 hover:border-green-600 text-white py-2 px-4 rounded-lg shadow-md transition duration-200 mr-2">
								수정하기
							</button>
						</div>
					</div>
				)}
			</Drawer>

			<TaskEditDrawer isOpen={isEditDrawerOpen} onClose={handleCloseEditDrawer} taskId={taskId} onSuccess={fetchTask} />
		</>
	);
}

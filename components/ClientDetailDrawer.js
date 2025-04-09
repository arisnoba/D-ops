import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import Drawer from './Drawer';
import ClientEditDrawer from './ClientEditDrawer';

export default function ClientDetailDrawer({ isOpen, onClose, clientId }) {
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	const [client, setClient] = useState(null);
	const [tasks, setTasks] = useState([]);
	const [deleteLoading, setDeleteLoading] = useState(false);
	const [error, setError] = useState(null);
	const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);

	useEffect(() => {
		if (isOpen && clientId) {
			fetchClient();
			fetchClientTasks();
		}
	}, [isOpen, clientId]);

	// Edit 드로어가 닫히면 상세 정보 다시 불러오기
	useEffect(() => {
		if (!isEditDrawerOpen && isOpen && clientId) {
			fetchClient();
		}
	}, [isEditDrawerOpen]);

	async function fetchClient() {
		try {
			setLoading(true);
			setError(null);

			const { data, error } = await supabase.from('clients').select('*').eq('id', clientId).single();

			if (error) throw error;
			if (data) setClient(data);
		} catch (error) {
			console.error('Error fetching client:', error.message);
			setError('클라이언트를 불러오는 중 오류가 발생했습니다.');
		} finally {
			setLoading(false);
		}
	}

	async function fetchClientTasks() {
		try {
			const { data, error } = await supabase.from('tasks').select('*').eq('client_id', clientId).order('created_at', { ascending: false });

			if (error) throw error;
			if (data) setTasks(data);
		} catch (error) {
			console.error('Error fetching client tasks:', error.message);
		}
	}

	async function handleDelete() {
		if (!confirm('정말로 이 클라이언트를 삭제하시겠습니까? 클라이언트와 관련된 모든 업무 데이터도 함께 삭제될 수 있습니다.')) {
			return;
		}

		try {
			setDeleteLoading(true);

			const { error } = await supabase.from('clients').delete().eq('id', clientId);

			if (error) throw error;

			// 삭제 성공 후 드로어 닫기
			onClose();
			// 페이지 새로고침
			router.reload();
		} catch (error) {
			console.error('Error deleting client:', error.message);
			alert('클라이언트 삭제 중 오류가 발생했습니다.');
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
				return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
			case 'operation':
				return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
			default:
				return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
		}
	};

	// 날짜 포맷
	const formatDate = dateString => {
		const date = new Date(dateString);
		return date.toLocaleDateString('ko-KR', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
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

	// 총 비용 계산
	const calculateTotalCost = () => {
		return tasks.reduce((total, task) => total + task.price, 0);
	};

	// 총 시간 계산
	const calculateTotalHours = () => {
		return tasks.reduce((total, task) => total + task.hours, 0);
	};

	return (
		<>
			<Drawer isOpen={isOpen} onClose={onClose} title="클라이언트 상세 정보">
				{loading ? (
					<div className="py-8 text-center">
						<p className="text-gray-500">로딩 중...</p>
					</div>
				) : error || !client ? (
					<div className="py-8">
						<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error || '클라이언트를 찾을 수 없습니다.'}</div>
					</div>
				) : (
					<div>
						<div className="mb-6">
							<h1 className="text-2xl font-bold mb-2">{client.name}</h1>
							{client.description && <p className="text-gray-600 dark:text-gray-400">{client.description}</p>}
						</div>

						<div className="mb-6 bg-gray-50 dark:bg-dark-bg/60 p-4 rounded-lg">
							<h3 className="text-lg font-semibold mb-2">연락처 정보</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{client.contact_person && (
									<div>
										<p className="text-gray-600 dark:text-gray-400">담당자</p>
										<p className="font-medium dark:text-white">{client.contact_person}</p>
									</div>
								)}
								{client.contact_email && (
									<div>
										<p className="text-gray-600 dark:text-gray-400">이메일</p>
										<p className="font-medium dark:text-white">{client.contact_email}</p>
									</div>
								)}
								{client.contact_phone && (
									<div>
										<p className="text-gray-600 dark:text-gray-400">전화번호</p>
										<p className="font-medium dark:text-white">{client.contact_phone}</p>
									</div>
								)}
								<div>
									<p className="text-gray-600 dark:text-gray-400">등록일</p>
									<p className="font-medium dark:text-white">{formatDate(client.created_at)}</p>
								</div>
							</div>
						</div>

						<div className="mb-6">
							<h3 className="text-lg font-semibold mb-2">업무 요약</h3>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div className="bg-gray-50 dark:bg-dark-bg/60 p-4 rounded-lg">
									<h4 className="text-md font-semibold mb-1 dark:text-gray-300">진행한 업무</h4>
									<p className="text-xl font-bold dark:text-white">{tasks.length}건</p>
								</div>
								<div className="bg-gray-50 dark:bg-dark-bg/60 p-4 rounded-lg">
									<h4 className="text-md font-semibold mb-1 dark:text-gray-300">총 작업 시간</h4>
									<p className="text-xl font-bold dark:text-white">{formatTimeUnit(calculateTotalHours())}</p>
								</div>
								<div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
									<h4 className="text-md font-semibold mb-1 dark:text-gray-300">총 비용</h4>
									<p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{calculateTotalCost().toLocaleString()}원</p>
								</div>
							</div>
						</div>

						{tasks.length > 0 && (
							<div className="mb-6">
								<h3 className="text-lg font-semibold mb-2">최근 업무</h3>
								<div className="bg-gray-50 dark:bg-dark-bg/60 p-4 rounded-lg overflow-x-auto">
									<table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
										<thead>
											<tr>
												<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">날짜</th>
												<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">업무</th>
												<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">카테고리</th>
												<th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">금액</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-gray-200 dark:divide-dark-border">
											{tasks.slice(0, 10).map(task => (
												<tr key={task.id}>
													<td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(task.created_at)}</td>
													<td className="px-4 py-2">
														<div className="text-sm font-medium text-gray-900 dark:text-white">{task.title}</div>
													</td>
													<td className="px-4 py-2">
														<span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryStyle(task.category)}`}>{getCategoryName(task.category)}</span>
													</td>
													<td className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 text-right whitespace-nowrap">{task.price.toLocaleString()}원</td>
												</tr>
											))}
										</tbody>
									</table>
									{tasks.length > 10 && (
										<div className="mt-3 text-center">
											<span className="text-sm text-gray-500 dark:text-gray-400">외 {tasks.length - 10}건의 업무가 더 있습니다.</span>
										</div>
									)}
								</div>
							</div>
						)}

						<div className="flex justify-end mt-6">
							<button onClick={handleEdit} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200 mr-2">
								수정하기
							</button>
							<button onClick={handleDelete} disabled={deleteLoading} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200">
								{deleteLoading ? '삭제 중...' : '삭제하기'}
							</button>
						</div>
					</div>
				)}
			</Drawer>

			<ClientEditDrawer isOpen={isEditDrawerOpen} onClose={handleCloseEditDrawer} clientId={clientId} onSuccess={fetchClient} />
		</>
	);
}

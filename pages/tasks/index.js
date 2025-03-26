import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import TaskDetailDrawer from '../../components/TaskDetailDrawer';

export default function TaskList() {
	const [loading, setLoading] = useState(false);
	const [tasks, setTasks] = useState([]);
	const [clients, setClients] = useState([]);
	const [filteredTasks, setFilteredTasks] = useState([]);
	const [selectedTaskId, setSelectedTaskId] = useState(null);
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);

	// 필터링 상태
	const [selectedClient, setSelectedClient] = useState('all');
	const [selectedMonth, setSelectedMonth] = useState('all');
	const [months, setMonths] = useState([]);

	useEffect(() => {
		fetchTasks();
		fetchClients();

		// 업무 등록 완료 이벤트 리스너 추가
		const handleUpdateTasks = () => {
			fetchTasks();
		};
		window.addEventListener('updateTasks', handleUpdateTasks);

		// 컴포넌트 언마운트 시 이벤트 리스너 제거
		return () => {
			window.removeEventListener('updateTasks', handleUpdateTasks);
		};
	}, []);

	// 필터링된 작업 목록 업데이트
	useEffect(() => {
		filterTasks();
	}, [tasks, selectedClient, selectedMonth]);

	async function fetchTasks() {
		try {
			setLoading(true);
			const { data, error } = await supabase
				.from('tasks')
				.select(
					`
					*,
					clients:client_id (
						id,
						name
					)
				`
				)
				.order('task_date', { ascending: false });

			if (error) throw error;
			if (data) {
				setTasks(data);

				// 월 목록 추출
				const monthSet = new Set();
				data.forEach(task => {
					const date = new Date(task.task_date || task.created_at);
					const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
					monthSet.add(monthYear);
				});

				const sortedMonths = Array.from(monthSet).sort((a, b) => b.localeCompare(a));
				setMonths(sortedMonths);
			}
		} catch (error) {
			console.error('Error fetching tasks:', error.message);
		} finally {
			setLoading(false);
		}
	}

	async function fetchClients() {
		try {
			const { data, error } = await supabase.from('clients').select('id, name').order('name', { ascending: true });

			if (error) throw error;
			if (data) setClients(data);
		} catch (error) {
			console.error('Error fetching clients:', error.message);
		}
	}

	function filterTasks() {
		let filtered = [...tasks];

		// 클라이언트별 필터링
		if (selectedClient !== 'all') {
			filtered = filtered.filter(task => String(task.client_id) === String(selectedClient));
		}

		// 월별 필터링
		if (selectedMonth !== 'all') {
			filtered = filtered.filter(task => {
				const date = new Date(task.task_date || task.created_at);
				const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
				return monthYear === selectedMonth;
			});
		}

		setFilteredTasks(filtered);
	}

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

	// 날짜 포맷
	const formatDate = dateString => {
		const date = new Date(dateString);
		const year = date.getFullYear().toString().slice(2); // 연도의 마지막 2자리
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}. ${month}. ${day}`;
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

	// 월 표시 포맷
	const formatMonth = monthStr => {
		const [year, month] = monthStr.split('-');
		return `${year}년 ${month}월`;
	};

	// 월별 합계 계산
	const calculateMonthlyTotal = () => {
		if (selectedMonth === 'all') return null;

		let totalAmount = 0;
		let totalHours = 0;
		const clientTotals = {};

		filteredTasks.forEach(task => {
			totalAmount += task.price;
			totalHours += task.hours;

			// 클라이언트별 합계
			if (!clientTotals[task.clients.name]) {
				clientTotals[task.clients.name] = { amount: 0, hours: 0 };
			}
			clientTotals[task.clients.name].amount += task.price;
			clientTotals[task.clients.name].hours += task.hours;
		});

		return { totalAmount, totalHours, clientTotals };
	};

	const monthlyTotal = calculateMonthlyTotal();

	const handleTaskClick = taskId => {
		setSelectedTaskId(taskId);
		setIsDrawerOpen(true);
	};

	const handleCloseDrawer = () => {
		setIsDrawerOpen(false);
	};

	return (
		<>
			<Head>
				<title>업무 관리 | D-ops</title>
			</Head>

			<div className="h-full flex flex-col">
				{/* 필터 영역 */}
				<div className="flex-none p-4 sticky top-0">
					<div className="bg-gray-50 dark:bg-dark-bg/60 rounded-md border dark:border-dark-border shadow-sm mb-4 md:mb-8 px-4 py-4">
						<div className="flex flex-wrap gap-4">
							<div className="flex-1 min-w-[200px]">
								<label htmlFor="client-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
									클라이언트
								</label>
								<select
									id="client-filter"
									value={selectedClient}
									onChange={e => setSelectedClient(e.target.value)}
									className="block w-full rounded-md border-gray-300 dark:border-dark-border dark:bg-dark-bg shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:text-gray-200">
									<option value="all">모든 클라이언트</option>
									{clients.map(client => (
										<option key={client.id} value={client.id}>
											{client.name}
										</option>
									))}
								</select>
							</div>
							<div className="flex-1 min-w-[200px]">
								<label htmlFor="month-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
									월별 보기
								</label>
								<select
									id="month-filter"
									value={selectedMonth}
									onChange={e => setSelectedMonth(e.target.value)}
									className="block w-full rounded-md border-gray-300 dark:border-dark-border dark:bg-dark-bg shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:text-gray-200">
									<option value="all">모든 기간</option>
									{months.map(month => (
										<option key={month} value={month}>
											{formatMonth(month)}
										</option>
									))}
								</select>
							</div>
						</div>
					</div>

					{/* 월별 합계 정보 */}
					{monthlyTotal && (
						<div className="bg-white dark:bg-dark-card rounded-lg shadow-md p-4 mb-4">
							<h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">{formatMonth(selectedMonth)} 통계</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<p className="text-sm text-gray-600 dark:text-gray-400">총 매출: {monthlyTotal.totalAmount.toLocaleString()}원</p>
									<p className="text-sm text-gray-600 dark:text-gray-400">총 작업시간: {formatTimeUnit(monthlyTotal.totalHours)}</p>
								</div>
								<div>
									<p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">클라이언트별 통계:</p>
									{Object.entries(monthlyTotal.clientTotals).map(([clientName, { amount, hours }]) => (
										<div key={clientName} className="text-sm text-gray-600 dark:text-gray-400">
											{clientName}: {amount.toLocaleString()}원 ({formatTimeUnit(hours)})
										</div>
									))}
								</div>
							</div>
						</div>
					)}
				</div>

				{/* 테이블 영역 */}
				<div className="flex-1 overflow-hidden">
					<div className=" rounded-lg shadow-md h-full flex flex-col">
						<div className="overflow-auto">
							<table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
								<thead className="bg-gray-50 dark:bg-neutral-800 sticky top-0">
									<tr>
										<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
											클라이언트
										</th>
										<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											업무
										</th>
										<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
											카테고리
										</th>
										<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
											시간
										</th>
										<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
											단가
										</th>
										<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
											금액
										</th>
										<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
											날짜
										</th>
									</tr>
								</thead>
								<tbody className="bg-white dark:bg-dark-card divide-y divide-gray-200 dark:divide-dark-border">
									{loading ? (
										<tr>
											<td colSpan="7" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
												로딩 중...
											</td>
										</tr>
									) : filteredTasks.length === 0 ? (
										<tr>
											<td colSpan="7" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
												데이터가 없습니다
											</td>
										</tr>
									) : (
										filteredTasks.map(task => (
											<tr key={task.id} onClick={() => handleTaskClick(task.id)} className="hover:bg-gray-50 dark:hover:bg-dark-bg/60 cursor-pointer transition-colors duration-150">
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{task.clients?.name}</td>
												<td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{task.title}</td>
												<td className="px-6 py-4 whitespace-nowrap">
													<span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryStyle(task.category)}`}>{getCategoryName(task.category)}</span>
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{formatTimeUnit(task.hours)}</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{task.price_per_hour?.toLocaleString()}원</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400">{task.price?.toLocaleString()}원</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-500">{formatDate(task.task_date || task.created_at)}</td>
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>

			<TaskDetailDrawer isOpen={isDrawerOpen} onClose={handleCloseDrawer} taskId={selectedTaskId} onUpdate={fetchTasks} />
		</>
	);
}

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

			<main className="flex-grow container mx-auto p-4">
				{/* <div className="flex justify-between items-center mb-8">
					<h1 className="text-3xl font-bold dark:text-white">업무 관리</h1>
				</div> */}

				<div className="bg-white dark:bg-dark-card rounded-lg shadow-md p-6 mb-8">
					<div className="flex flex-col md:flex-row gap-4 mb-4">
						<div className="flex-1">
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">클라이언트</label>
							<div className="relative">
								<select
									value={selectedClient}
									onChange={e => setSelectedClient(e.target.value)}
									className="appearance-none w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-bg dark:border-dark-border dark:text-white pr-10">
									<option value="all">모든 클라이언트</option>
									{clients.map(client => (
										<option key={client.id} value={client.id}>
											{client.name}
										</option>
									))}
								</select>
								<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
									<svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
										<path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
									</svg>
								</div>
							</div>
						</div>
						<div className="flex-1">
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">월별</label>
							<div className="relative">
								<select
									value={selectedMonth}
									onChange={e => setSelectedMonth(e.target.value)}
									className="appearance-none w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-bg dark:border-dark-border dark:text-white pr-10">
									<option value="all">모든 기간</option>
									{months.map(month => (
										<option key={month} value={month}>
											{formatMonth(month)}
										</option>
									))}
								</select>
								<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
									<svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
										<path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
									</svg>
								</div>
							</div>
						</div>
					</div>

					{selectedMonth !== 'all' && monthlyTotal && (
						<div className="bg-gray-50 dark:bg-dark-bg/60 rounded-md border dark:border-dark-border shadow-sm overflow-hidden mb-4 md:mb-8 px-4 py-4">
							<h3 className="text-lg font-semibold mb-2 dark:text-white">{formatMonth(selectedMonth)} 정산 요약</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<div className="text-sm text-gray-600 dark:text-gray-400">총 업무 시간</div>
									<div className="text-xl font-bold dark:text-white">{formatTimeUnit(monthlyTotal.totalHours)}</div>
								</div>
								<div>
									<div className="text-sm text-gray-600 dark:text-gray-400">총 금액</div>
									<div className="text-xl font-bold text-blue-600 dark:text-blue-400">{monthlyTotal.totalAmount.toLocaleString()}원</div>
								</div>
							</div>

							{Object.keys(monthlyTotal.clientTotals).length > 1 && (
								<div className="mt-4">
									<h4 className="text-sm font-semibold mb-2 dark:text-gray-300">클라이언트별 요약</h4>
									<div className="space-y-2">
										{Object.entries(monthlyTotal.clientTotals).map(([clientName, data]) => (
											<div key={clientName} className="flex justify-between items-center py-1 border-b border-gray-200 dark:border-dark-border">
												<div className="dark:text-white">{clientName}</div>
												<div className="flex space-x-4">
													<div className="text-sm text-gray-600 dark:text-gray-400">{formatTimeUnit(data.hours)}</div>
													<div className="font-medium text-blue-600 dark:text-blue-400">{data.amount.toLocaleString()}원</div>
												</div>
											</div>
										))}
									</div>
								</div>
							)}
						</div>
					)}
				</div>

				{loading ? (
					<p className="text-center py-4 dark:text-gray-300">로딩 중...</p>
				) : filteredTasks.length === 0 ? (
					<div className="bg-white dark:bg-dark-card rounded-lg shadow-md p-8 text-center">
						<p className="text-gray-500 dark:text-gray-400 mb-4">해당 조건에 맞는 업무가 없습니다.</p>
						<Link href="/tasks/new">
							<a className="text-blue-500 dark:text-blue-400 hover:underline">+ 새 업무 등록하기</a>
						</Link>
					</div>
				) : (
					<div className="bg-white dark:bg-dark-card rounded-lg shadow-md overflow-hidden">
						<div className="overflow-x-auto">
							<table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
								<thead className="bg-gray-50 dark:bg-dark-card/80">
									<tr>
										<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
											날짜
										</th>
										<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
											클라이언트
										</th>
										<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
											업무
										</th>
										<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
											카테고리
										</th>
										<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
											시간
										</th>
										<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
											단가
										</th>
										<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
											금액
										</th>
										{/* <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
											관리
										</th> */}
									</tr>
								</thead>
								<tbody className="bg-white dark:bg-dark-card divide-y divide-gray-200 dark:divide-dark-border">
									{filteredTasks.map(task => (
										<tr key={task.id} className="transition duration-100 cursor-pointer transition-colors hover:!bg-alternative" onClick={() => handleTaskClick(task.id)}>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{task.task_date ? formatDate(task.task_date) : formatDate(task.created_at)}</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="text-sm text-gray-900 dark:text-white">{task.clients?.name || '(삭제된 클라이언트)'}</div>
											</td>
											<td className="px-6 py-4">
												<div className="text-sm text-gray-900 dark:text-white">{task.title}</div>
												{task.description && <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{task.description}</div>}
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryStyle(task.category)}`}>{getCategoryName(task.category)}</span>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatTimeUnit(task.hours)}</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{task.price_per_hour.toLocaleString()}원</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400">{task.price.toLocaleString()}원</td>
											{/* <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">수정 버튼 제거</td> */}
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				)}
			</main>

			<TaskDetailDrawer isOpen={isDrawerOpen} onClose={handleCloseDrawer} taskId={selectedTaskId} />
		</>
	);
}

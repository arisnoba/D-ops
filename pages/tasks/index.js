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
	const [error, setError] = useState(null);
	const [selectedTasks, setSelectedTasks] = useState(new Set());
	const [isAllSelected, setIsAllSelected] = useState(false);
	const [isBulkActionsVisible, setIsBulkActionsVisible] = useState(false);
	const [bulkActionLoading, setBulkActionLoading] = useState(false);
	const [lastSelectedIndex, setLastSelectedIndex] = useState(null);

	// 필터링 상태
	const [selectedClient, setSelectedClient] = useState('all');
	const [selectedMonth, setSelectedMonth] = useState('all');
	const [months, setMonths] = useState([]);
	const [settlementStatus, setSettlementStatus] = useState('pending');

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
	}, [tasks, selectedClient, selectedMonth, settlementStatus]);

	// 필터링 시 선택 상태 업데이트
	useEffect(() => {
		const newSelectedTasks = new Set(Array.from(selectedTasks).filter(taskId => filteredTasks.some(task => task.id === taskId)));
		setSelectedTasks(newSelectedTasks);
		setIsAllSelected(newSelectedTasks.size === filteredTasks.length && filteredTasks.length > 0);
		setIsBulkActionsVisible(newSelectedTasks.size > 0);
	}, [filteredTasks]);

	async function fetchTasks() {
		try {
			setLoading(true);
			setError(null);

			const { data, error } = await supabase.from('tasks').select('*, clients(name)').order('task_date', { ascending: false }).order('created_at', { ascending: false });

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
			setError('업무 목록을 불러오는 중 오류가 발생했습니다.');
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

		// 정산 상태 필터링
		if (settlementStatus !== 'all') {
			filtered = filtered.filter(task => task.settlement_status === settlementStatus);
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

	// 일괄 처리 관련 함수들
	const handleSelectAll = e => {
		if (e.target.checked) {
			const allTaskIds = new Set(filteredTasks.map(task => task.id));
			setSelectedTasks(allTaskIds);
			setIsAllSelected(true);
		} else {
			setSelectedTasks(new Set());
			setIsAllSelected(false);
		}
		setIsBulkActionsVisible(e.target.checked);
		setLastSelectedIndex(null);
	};

	const handleSelectTask = (e, taskId, index) => {
		// 이벤트 전파 중단
		e.stopPropagation();

		// 새로운 선택 상태 생성
		const newSelectedTasks = new Set(selectedTasks);

		if (e.nativeEvent.shiftKey && lastSelectedIndex !== null) {
			// Shift 키를 사용한 범위 선택
			const start = Math.min(index, lastSelectedIndex);
			const end = Math.max(index, lastSelectedIndex);

			// 현재 클릭한 항목의 상태를 기준으로 범위 선택
			const isSelecting = !selectedTasks.has(taskId);

			// 범위 내의 모든 항목 선택/해제
			for (let i = start; i <= end; i++) {
				const task = filteredTasks[i];
				if (isSelecting) {
					newSelectedTasks.add(task.id);
				} else {
					newSelectedTasks.delete(task.id);
				}
			}
		} else {
			// 단일 항목 선택/해제
			if (selectedTasks.has(taskId)) {
				newSelectedTasks.delete(taskId);
			} else {
				newSelectedTasks.add(taskId);
			}
			// 마지막 선택 인덱스 업데이트
			setLastSelectedIndex(index);
		}

		// 상태 업데이트
		setSelectedTasks(newSelectedTasks);
		setIsAllSelected(newSelectedTasks.size === filteredTasks.length);
		setIsBulkActionsVisible(newSelectedTasks.size > 0);
	};

	const handleBulkSettlement = async status => {
		if (!selectedTasks.size) return;

		try {
			setBulkActionLoading(true);
			const { error } = await supabase.from('tasks').update({ settlement_status: status }).in('id', Array.from(selectedTasks));

			if (error) throw error;

			// 성공적으로 업데이트된 후 데이터 새로고침
			await fetchTasks();
			setSelectedTasks(new Set());
			setIsBulkActionsVisible(false);
			setIsAllSelected(false);
		} catch (error) {
			console.error('Error updating settlement status:', error.message);
			alert('정산 상태 업데이트 중 오류가 발생했습니다.');
		} finally {
			setBulkActionLoading(false);
		}
	};

	return (
		<>
			<Head>
				<title>업무 관리 | D-ops</title>
			</Head>

			<div className="h-full flex flex-col">
				{/* 필터 영역 */}
				<div className="flex-none p-4 sticky top-0 z-10" id="filter-area">
					<div className=" flex items-center justify-between">
						<div className="flex items-center">
							{/* 일괄 처리 액션 바 */}
							{isBulkActionsVisible && (
								<div className="flex items-center justify-between mr-5">
									<div className="flex items-center space-x-2 mr-4">
										<input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} className="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out" />
										<span className="text-sm text-gray-600 dark:text-gray-300">{selectedTasks.size}개 선택됨</span>
									</div>
									<div className="flex items-center space-x-2">
										<button
											onClick={() => handleBulkSettlement('completed')}
											disabled={bulkActionLoading}
											className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-150 ease-in-out disabled:opacity-50">
											정산 완료
										</button>
										<button
											onClick={() => handleBulkSettlement('pending')}
											disabled={bulkActionLoading}
											className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition duration-150 ease-in-out disabled:opacity-50">
											정산 대기
										</button>
									</div>
								</div>
							)}
							{/* 정산 상태 필터 버튼 그룹 */}
							<div className="inline-flex rounded-lg border border-gray-200 dark:border-dark-border">
								<button
									onClick={() => setSettlementStatus('all')}
									className={`px-4 py-2 text-sm font-medium first:rounded-l-lg last:rounded-r-lg border-r dark:border-dark-border transition-colors duration-150 ease-in-out
									${
										settlementStatus === 'all'
											? 'bg-gray-900 text-white dark:bg-gray-600 hover:bg-gray-800 dark:hover:bg-gray-700'
											: 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-dark-card dark:text-gray-300 dark:hover:bg-dark-bg/60'
									} focus:z-10`}>
									전체
								</button>
								<button
									onClick={() => setSettlementStatus('pending')}
									className={`px-4 py-2 text-sm font-medium border-r dark:border-dark-border transition-colors duration-150 ease-in-out
									${
										settlementStatus === 'pending'
											? 'bg-yellow-600 text-white hover:bg-yellow-700'
											: 'bg-white text-yellow-700 hover:bg-yellow-50 dark:bg-dark-card dark:text-yellow-300 dark:hover:bg-yellow-900/20'
									} focus:z-10`}>
									정산 대기
								</button>
								<button
									onClick={() => setSettlementStatus('completed')}
									className={`px-4 py-2 text-sm font-medium first:rounded-l-lg last:rounded-r-lg transition-colors duration-150 ease-in-out
									${
										settlementStatus === 'completed'
											? 'bg-green-600 text-white hover:bg-green-700'
											: 'bg-white text-green-700 hover:bg-green-50 dark:bg-dark-card dark:text-green-300 dark:hover:bg-green-900/20'
									} focus:z-10`}>
									정산 완료
								</button>
							</div>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<div className="relative">
									<select
										id="client-filter"
										value={selectedClient}
										onChange={e => setSelectedClient(e.target.value)}
										className="block w-full rounded-lg border-gray-300 dark:bg-dark-card shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:text-gray-200 text-sm pl-4 pr-10 py-2.5 appearance-none">
										<option value="all">모든 클라이언트</option>
										{clients.map(client => (
											<option key={client.id} value={client.id}>
												{client.name}
											</option>
										))}
									</select>
									<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 dark:text-gray-400">
										<svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
											<path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
										</svg>
									</div>
								</div>
							</div>
							<div>
								<div className="relative">
									<select
										id="month-filter"
										value={selectedMonth}
										onChange={e => setSelectedMonth(e.target.value)}
										className="block w-full rounded-lg border-gray-300 dark:bg-dark-card shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:text-gray-200 text-sm pl-4 pr-10 py-2.5 appearance-none">
										<option value="all">모든 기간</option>
										{months.map(month => (
											<option key={month} value={month}>
												{formatMonth(month)}
											</option>
										))}
									</select>
									<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 dark:text-gray-400">
										<svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
											<path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
										</svg>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* 월별 합계 정보 */}
					{monthlyTotal && (
						<div className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-6 mb-4">
							<h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">{formatMonth(selectedMonth)} 통계</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div className="space-y-3">
									<div className="bg-gray-50 dark:bg-dark-bg rounded-lg p-4">
										<p className="text-sm text-gray-500 dark:text-gray-400 mb-1">총 매출</p>
										<p className="text-xl font-semibold text-gray-900 dark:text-gray-100">{monthlyTotal.totalAmount.toLocaleString()}원</p>
									</div>
									<div className="bg-gray-50 dark:bg-dark-bg rounded-lg p-4">
										<p className="text-sm text-gray-500 dark:text-gray-400 mb-1">총 작업시간</p>
										<p className="text-xl font-semibold text-gray-900 dark:text-gray-100">{formatTimeUnit(monthlyTotal.totalHours)}</p>
									</div>
								</div>
								<div className="bg-gray-50 dark:bg-dark-bg rounded-lg p-4">
									<p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">클라이언트별 통계</p>
									<div className="space-y-2">
										{Object.entries(monthlyTotal.clientTotals).map(([clientName, { amount, hours }]) => (
											<div key={clientName} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-dark-border last:border-0">
												<span className="text-sm font-medium text-gray-700 dark:text-gray-300">{clientName}</span>
												<div className="text-right">
													<p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{amount.toLocaleString()}원</p>
													<p className="text-xs text-gray-500 dark:text-gray-400">{formatTimeUnit(hours)}</p>
												</div>
											</div>
										))}
									</div>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* 테이블 영역 */}
				<div className="flex-1 overflow-hidden" id="task-table">
					<div className="bg-white dark:bg-dark-card rounded-lg shadow-sm h-full flex flex-col">
						<div className="overflow-auto">
							<table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
								<thead className="bg-gray-50 dark:bg-neutral-800 sticky top-0">
									<tr>
										<th scope="col" className="px-6 py-4 text-left">
											<div className="flex items-center">
												<input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} className="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out" />
											</div>
										</th>
										<th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
											정산 상태
										</th>
										<th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
											클라이언트
										</th>
										<th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											업무
										</th>
										<th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
											담당자
										</th>
										<th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
											카테고리
										</th>
										<th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
											시간
										</th>
										<th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
											단가
										</th>
										<th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
											금액
										</th>
										<th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
											날짜
										</th>
									</tr>
								</thead>
								<tbody className="bg-white dark:bg-dark-card divide-y divide-gray-200 dark:divide-dark-border">
									{loading ? (
										<tr>
											<td colSpan="9" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
												로딩 중...
											</td>
										</tr>
									) : filteredTasks.length === 0 ? (
										<tr>
											<td colSpan="9" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
												데이터가 없습니다
											</td>
										</tr>
									) : (
										filteredTasks.map((task, index) => (
											<tr
												key={task.id}
												onClick={() => handleTaskClick(task.id)}
												className={`hover:bg-gray-50 dark:hover:bg-dark-bg/60 cursor-pointer transition-colors duration-150
													${task.settlement_status === 'completed' ? 'opacity-60' : ''}`}>
												<td className="px-6 py-4" onClick={e => e.stopPropagation()}>
													<div className="flex items-center">
														<input
															type="checkbox"
															checked={selectedTasks.has(task.id)}
															onChange={e => handleSelectTask(e, task.id, index)}
															className="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out cursor-pointer"
														/>
													</div>
												</td>
												<td className="px-6 py-4 whitespace-nowrap">
													<span
														className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
															task.settlement_status === 'completed'
																? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
																: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
														}`}>
														{task.settlement_status === 'completed' ? '정산 완료' : '정산 대기'}
													</span>
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{task.clients?.name}</td>
												<td className="px-6 py-4">
													<div className="text-sm text-gray-900 dark:text-gray-100">{task.title}</div>
													{task.description && <div className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{task.description}</div>}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{task.manager || '-'}</td>
												<td className="px-6 py-4 whitespace-nowrap">
													<span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryStyle(task.category)}`}>{getCategoryName(task.category)}</span>
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{formatTimeUnit(task.hours)}</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{task.price_per_hour?.toLocaleString()}원</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400">{task.price?.toLocaleString()}원</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDate(task.task_date || task.created_at)}</td>
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

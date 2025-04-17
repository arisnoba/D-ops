import { useState, useEffect, useRef, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import TaskDetailDrawer from '../../components/TaskDetailDrawer';
import TaskDescription from '../../components/TaskDescription';

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
	const [hoveredTaskId, setHoveredTaskId] = useState(null);
	const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
	const [isTooltipVisible, setIsTooltipVisible] = useState(false);
	const [hoveredTaskDescription, setHoveredTaskDescription] = useState('');
	const checkboxRef = useRef(null);
	const tableHeaderCheckboxRef = useRef(null);

	// 필터링 상태
	const [selectedClient, setSelectedClient] = useState('all');
	const [selectedMonth, setSelectedMonth] = useState('all');
	const [months, setMonths] = useState([]);
	const [settlementStatus, setSettlementStatus] = useState('pending');

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [pendingSettlementStatus, setPendingSettlementStatus] = useState(null);

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

		// 전체 선택 상태 업데이트
		const isAllTasksSelected = newSelectedTasks.size === filteredTasks.length && filteredTasks.length > 0;
		setIsAllSelected(isAllTasksSelected);

		// indeterminate 상태 설정
		const isIndeterminate = newSelectedTasks.size > 0 && !isAllTasksSelected;
		if (checkboxRef.current) {
			checkboxRef.current.indeterminate = isIndeterminate;
		}
		if (tableHeaderCheckboxRef.current) {
			tableHeaderCheckboxRef.current.indeterminate = isIndeterminate;
		}

		setIsBulkActionsVisible(newSelectedTasks.size > 0);
		setSelectedTasks(newSelectedTasks);
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

	// 월별 합계 계산 함수 수정
	const calculateMonthlyTotal = () => {
		// 선택된 클라이언트나 기간이 없으면 null 반환
		if (selectedClient === 'all' && selectedMonth === 'all') return null;

		let totalAmount = 0;
		let totalHours = 0;
		let pendingAmount = 0; // 정산 대기 금액
		let completedAmount = 0; // 정산 완료 금액
		const managerTotals = {}; // 담당자별 통계

		filteredTasks.forEach(task => {
			const taskPrice = task.price || 0;
			const taskHours = task.hours || 0;

			totalAmount += taskPrice;
			totalHours += taskHours;

			// 정산 상태별 금액
			if (task.settlement_status === 'pending') {
				pendingAmount += taskPrice;
			} else if (task.settlement_status === 'completed') {
				completedAmount += taskPrice;
			}

			// 담당자별 통계
			// 담당자 정보가 없는 경우 '담당자 미지정'으로 처리
			let managers = task.manager ? task.manager.split(',').map(m => m.trim()) : ['담당자 미지정'];

			// 담당자가 비어 있거나 유효하지 않은 경우 '담당자 미지정'으로 처리
			if (managers.length === 0 || (managers.length === 1 && !managers[0])) {
				managers = ['담당자 미지정'];
			}

			// 각 담당자에게 금액과 시간 균등 분배
			const pricePerManager = taskPrice / managers.length;
			const hoursPerManager = taskHours / managers.length;

			managers.forEach(manager => {
				if (!managerTotals[manager]) {
					managerTotals[manager] = { amount: 0, hours: 0 };
				}
				managerTotals[manager].amount += pricePerManager;
				managerTotals[manager].hours += hoursPerManager;
			});
		});

		// 금액 반올림 처리
		Object.keys(managerTotals).forEach(manager => {
			managerTotals[manager].amount = Math.round(managerTotals[manager].amount);
			managerTotals[manager].hours = Math.round(managerTotals[manager].hours * 10) / 10; // 소수점 첫째자리까지 유지
		});

		return {
			totalAmount,
			totalHours,
			pendingAmount,
			completedAmount,
			managerTotals,
		};
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
	const handleSelectTask = (e, taskId, index) => {
		e.stopPropagation();

		const newSelectedTasks = new Set(selectedTasks);

		if (e.nativeEvent.shiftKey && lastSelectedIndex !== null) {
			const start = Math.min(index, lastSelectedIndex);
			const end = Math.max(index, lastSelectedIndex);
			const isSelecting = !selectedTasks.has(taskId);

			for (let i = start; i <= end; i++) {
				const task = filteredTasks[i];
				if (isSelecting) {
					newSelectedTasks.add(task.id);
				} else {
					newSelectedTasks.delete(task.id);
				}
			}
		} else {
			if (selectedTasks.has(taskId)) {
				newSelectedTasks.delete(taskId);
			} else {
				newSelectedTasks.add(taskId);
			}
			setLastSelectedIndex(index);
		}

		setSelectedTasks(newSelectedTasks);
		const isAllTasksSelected = newSelectedTasks.size === filteredTasks.length;
		setIsAllSelected(isAllTasksSelected);
		setIsBulkActionsVisible(newSelectedTasks.size > 0);

		// indeterminate 상태 설정
		const isIndeterminate = newSelectedTasks.size > 0 && !isAllTasksSelected;
		if (checkboxRef.current) {
			checkboxRef.current.indeterminate = isIndeterminate;
		}
		if (tableHeaderCheckboxRef.current) {
			tableHeaderCheckboxRef.current.indeterminate = isIndeterminate;
		}
	};

	const handleSelectAll = e => {
		const isChecked = e.target.checked;
		const newSelectedTasks = isChecked ? new Set(filteredTasks.map(task => task.id)) : new Set();

		setSelectedTasks(newSelectedTasks);
		setIsAllSelected(isChecked);
		setIsBulkActionsVisible(isChecked);
		setLastSelectedIndex(null);

		// indeterminate 상태 해제
		if (checkboxRef.current) {
			checkboxRef.current.indeterminate = false;
		}
		if (tableHeaderCheckboxRef.current) {
			tableHeaderCheckboxRef.current.indeterminate = false;
		}
	};

	const handleBulkSettlementClick = status => {
		setPendingSettlementStatus(status);
		setIsModalOpen(true);
	};

	const handleConfirmSettlement = async () => {
		if (!pendingSettlementStatus) return;

		try {
			setBulkActionLoading(true);
			const { error } = await supabase.from('tasks').update({ settlement_status: pendingSettlementStatus }).in('id', Array.from(selectedTasks));

			if (error) throw error;

			await fetchTasks();
			setSelectedTasks(new Set());
			setIsBulkActionsVisible(false);
			setIsAllSelected(false);
		} catch (error) {
			console.error('Error updating settlement status:', error.message);
			alert('정산 상태 업데이트 중 오류가 발생했습니다.');
		} finally {
			setBulkActionLoading(false);
			setIsModalOpen(false);
			setPendingSettlementStatus(null);
		}
	};

	// 마우스 이벤트 핸들러
	const handleDescriptionMouseEnter = (e, description) => {
		if (description) {
			setTooltipPosition({ x: e.clientX + 15, y: e.clientY + 15 });
			setHoveredTaskDescription(description);
			setIsTooltipVisible(true);
		}
	};

	const handleDescriptionMouseLeave = () => {
		setIsTooltipVisible(false);
		setHoveredTaskDescription('');
	};

	// 마우스 이동 이벤트 리스너
	useEffect(() => {
		const handleMouseMove = e => {
			if (isTooltipVisible) {
				setTooltipPosition({ x: e.clientX + 15, y: e.clientY + 15 });
			}
		};

		// 이벤트 추가/제거
		if (isTooltipVisible) {
			window.addEventListener('mousemove', handleMouseMove);
		}

		return () => {
			window.removeEventListener('mousemove', handleMouseMove);
		};
	}, [isTooltipVisible]);

	const getSelectedTasksStatusCount = () => {
		const statusCount = {
			completed: 0,
			pending: 0,
		};

		selectedTasks.forEach(taskId => {
			const task = filteredTasks.find(t => t.id === taskId);
			if (task) {
				statusCount[task.settlement_status]++;
			}
		});

		return statusCount;
	};

	const getSelectedTasksDateRange = () => {
		const selectedTasksList = filteredTasks.filter(task => selectedTasks.has(task.id));
		if (selectedTasksList.length === 0) return null;

		const dates = selectedTasksList.map(task => new Date(task.task_date || task.created_at));
		const oldestDate = new Date(Math.min(...dates));
		const latestDate = new Date(Math.max(...dates));

		return {
			oldestDate: formatDate(oldestDate),
			latestDate: formatDate(latestDate),
		};
	};

	return (
		<>
			<Head>
				<title>업무 관리 - D:OPS</title>
			</Head>

			{/* 모달 */}
			{isModalOpen && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setIsModalOpen(false)}>
					<div className="bg-white dark:bg-dark-card rounded-lg p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
						<h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">정산 상태 변경 확인</h3>
						<div className="text-gray-600 dark:text-gray-300 space-y-4 mb-6">
							<div>
								<span className="font-medium text-gray-900 dark:text-gray-100">
									총 <span className="text-green-900 dark:text-green-500">{getSelectedTasksStatusCount().completed + getSelectedTasksStatusCount().pending}</span>개
								</span>
								의 업무를{' '}
								<span className={`font-medium ${pendingSettlementStatus === 'completed' ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
									정산 {pendingSettlementStatus === 'completed' ? '완료' : '대기'}
								</span>{' '}
								상태로 변경하시겠습니까?
								{getSelectedTasksDateRange() && (
									<div className="text-sm mt-1 opacity-60">
										<span className="font-medium text-green-900 dark:text-green-500">{getSelectedTasksDateRange().oldestDate}</span>
										{' 부터 '}
										<span className="font-medium text-green-900 dark:text-green-500">{getSelectedTasksDateRange().latestDate}</span>의 업무
									</div>
								)}
							</div>
						</div>
						<div className="flex justify-end space-x-3">
							<button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-bg rounded-md transition-colors">
								취소
							</button>
							<button
								onClick={handleConfirmSettlement}
								disabled={bulkActionLoading}
								className={`px-4 py-2 text-white rounded-md transition-colors ${
									pendingSettlementStatus === 'completed' ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'
								} disabled:opacity-50`}>
								확인
							</button>
						</div>
					</div>
				</div>
			)}

			<div className="h-full flex flex-col">
				{/* 필터 영역 */}
				<div className="flex-none px-4 pt-4 pb-4 sticky top-0 z-10" id="filter-area">
					<div className=" flex items-center justify-between">
						<div className="flex items-center">
							{/* 일괄 처리 액션 바 */}
							{isBulkActionsVisible && (
								<div className="flex items-center justify-between mr-5">
									<div className="flex items-center space-x-2 mr-4">
										{/* <input ref={checkboxRef} type="checkbox" checked={isAllSelected} onChange={handleSelectAll} /> */}
										<span className="text-lg text-gray-600 dark:text-gray-300">
											정산 대기 <span className="font-bold text-gray-900 dark:text-yellow-500">{getSelectedTasksStatusCount().pending}</span>개, 정산 완료{' '}
											<span className="font-bold text-gray-900 dark:text-green-500">{getSelectedTasksStatusCount().completed}</span>개 선택됨
										</span>
									</div>
									<div className="flex items-center space-x-2">
										<button
											onClick={() => handleBulkSettlementClick('completed')}
											disabled={bulkActionLoading}
											className="bg-green-950 hover:bg-green-900 border border-green-800 hover:border-green-600 text-gray-300 py-1.5 px-3 rounded-lg shadow-md transition duration-200">
											완료로 변경
										</button>
										<button
											onClick={() => handleBulkSettlementClick('pending')}
											disabled={bulkActionLoading}
											className="bg-yellow-950 hover:bg-yellow-900 border border-yellow-800 hover:border-yellow-600 text-gray-300 py-1.5 px-3 rounded-lg shadow-md transition duration-200">
											대기로 변경
										</button>
									</div>
								</div>
							)}
							{/* 정산 상태 필터 버튼 그룹 */}
							{!isBulkActionsVisible && (
								<div className="inline-flex rounded-lg bg-gray-100 dark:bg-neutral-900 p-1">
									<button
										onClick={() => setSettlementStatus('all')}
										className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors duration-150 ease-in-out
											${settlementStatus === 'all' ? 'bg-white dark:bg-neutral-950 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
										전체
									</button>
									<button
										onClick={() => setSettlementStatus('pending')}
										className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors duration-150 ease-in-out
											${settlementStatus === 'pending' ? 'bg-white dark:bg-neutral-950 shadow text-yellow-600 dark:text-yellow-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
										정산 대기
									</button>
									<button
										onClick={() => setSettlementStatus('completed')}
										className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors duration-150 ease-in-out
											${settlementStatus === 'completed' ? 'bg-white dark:bg-neutral-950 shadow text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
										정산 완료
									</button>
								</div>
							)}
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

					{/* 월별 합계 정보 - 수정된 부분 */}
					{monthlyTotal && (
						<div className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-4 mt-4">
							<h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
								{selectedMonth !== 'all' ? formatMonth(selectedMonth) : ''}
								{selectedClient !== 'all' ? clients.find(c => c.id.toString() === selectedClient)?.name : '전체'} 통계
							</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="rounded-lg overflow-hidden">
									{settlementStatus === 'all' && (
										<div className="bg-gray-50 dark:bg-dark-bg  p-4">
											<p className="text-sm text-gray-500 dark:text-gray-400 mb-1">총 매출</p>
											<p className="text-xl font-semibold text-gray-900 dark:text-gray-100">{monthlyTotal.totalAmount.toLocaleString()}원</p>
										</div>
									)}

									{(settlementStatus === 'all' || settlementStatus === 'pending') && (
										<div className={`${settlementStatus === 'pending' ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-yellow-50/70 dark:bg-yellow-900/10'}  p-4`}>
											<p className="text-sm text-yellow-600 dark:text-yellow-400 mb-1">정산 대기</p>
											<p className="text-xl font-semibold text-yellow-700 dark:text-yellow-300">{monthlyTotal.pendingAmount.toLocaleString()}원</p>
										</div>
									)}

									{(settlementStatus === 'all' || settlementStatus === 'completed') && (
										<div className={`${settlementStatus === 'completed' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-green-50/70 dark:bg-green-900/10'}  p-4`}>
											<p className="text-sm text-green-600 dark:text-green-400 mb-1">정산 완료</p>
											<p className="text-xl font-semibold text-green-700 dark:text-green-300">{monthlyTotal.completedAmount.toLocaleString()}원</p>
										</div>
									)}

									<div className="bg-gray-50 dark:bg-dark-bg  p-4">
										<p className="text-sm text-gray-500 dark:text-gray-400 mb-1">총 작업시간</p>
										<p className="text-xl font-semibold text-gray-900 dark:text-gray-100">{formatTimeUnit(monthlyTotal.totalHours)}</p>
									</div>
								</div>
								<div className="bg-gray-50 dark:bg-dark-bg rounded-lg p-4">
									<p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">담당자별 수익률</p>
									<div className="space-y-2">
										{Object.entries(monthlyTotal.managerTotals).map(([manager, { amount, hours }]) => (
											<div key={manager} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-dark-border last:border-0">
												<span className="text-sm font-medium text-gray-700 dark:text-gray-300">{manager}</span>
												<div className="text-right">
													<p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{amount.toLocaleString()}원</p>
													<p className="text-xs text-gray-500 dark:text-gray-400">
														{formatTimeUnit(hours)} | {Math.round((amount / monthlyTotal.totalAmount) * 100)}%
													</p>
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
						<div className="overflow-auto scrollbar-custom">
							<style jsx>{`
								.scrollbar-custom::-webkit-scrollbar {
									width: 8px;
									height: 8px;
								}
								.scrollbar-custom::-webkit-scrollbar-track {
									background: transparent;
								}
								.scrollbar-custom::-webkit-scrollbar-thumb {
									background: #cbd5e1;
									border-radius: 4px;
								}
								.scrollbar-custom::-webkit-scrollbar-thumb:hover {
									background: #94a3b8;
								}
								:global(.dark) .scrollbar-custom::-webkit-scrollbar-thumb {
									background: rgb(104, 104, 104);
								}
								:global(.dark) .scrollbar-custom::-webkit-scrollbar-thumb:hover {
									background: #64748b;
								}
							`}</style>
							<table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
								<thead className="bg-gray-50 dark:bg-neutral-800 sticky top-0 z-10">
									<tr>
										<th scope="col" className="px-4 py-3 text-left">
											<div className="flex items-center">
												<input ref={tableHeaderCheckboxRef} type="checkbox" checked={isAllSelected} onChange={handleSelectAll} />
											</div>
										</th>
										<th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
											정산 상태
										</th>
										<th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
											클라이언트
										</th>
										<th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											업무
										</th>
										<th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap text-right">
											금액
										</th>
										<th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
											카테고리
										</th>
										<th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
											시간
										</th>
										<th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap text-right">
											단가
										</th>

										<th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
											담당자
										</th>
										<th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
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
													${task.settlement_status === 'completed' ? 'opacity-60' : ''}
													${selectedTasks.has(task.id) ? 'bg-gray-50/50 dark:bg-gray-900/50 hover:bg-gray-50/70 dark:hover:bg-gray-900/70' : ''}`}>
												<td className="px-4 py-3" onClick={e => e.stopPropagation()}>
													<div className="flex items-center">
														<input type="checkbox" checked={selectedTasks.has(task.id)} onChange={e => handleSelectTask(e, task.id, index)} />
													</div>
												</td>
												<td className="px-4 py-3 whitespace-nowrap">
													<span
														className={`px-3 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${
															task.settlement_status === 'completed' ? 'border text-green-500 border-green-500/30 ' : 'border text-yellow-500 border-yellow-500/30'
														}`}>
														{task.settlement_status === 'completed' ? '정산 완료' : '정산 대기'}
													</span>
												</td>
												<td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{task.clients?.name}</td>
												<td
													id="tdSec"
													className="px-4 py-3 relative group cursor-pointer"
													onMouseEnter={e => handleDescriptionMouseEnter(e, task.description)}
													onMouseLeave={handleDescriptionMouseLeave}>
													<TaskDescription title={task.title} description={task.description} />
												</td>
												{/* 총금액 */}
												<td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400 text-right">{task.price?.toLocaleString()}원</td>
												{/* 카테고리 */}
												<td className="px-4 py-3 whitespace-nowrap">
													<span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryStyle(task.category)}`}>{getCategoryName(task.category)}</span>
												</td>
												{/* 시간 */}
												<td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{formatTimeUnit(task.hours)}</td>
												{/* 단가 */}
												<td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-right">
													{task.price_per_hour ? `${(task.price_per_hour / 10000).toLocaleString()}만원` : '-'}
												</td>

												<td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-400">{task.manager || '-'}</td>
												<td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDate(task.task_date || task.created_at)}</td>
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

			{/* 툴팁 */}
			{isTooltipVisible && hoveredTaskDescription && (
				<div
					className="fixed z-[9999] text-sm p-3 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-md shadow-lg whitespace-pre-wrap break-words pointer-events-none"
					style={{
						left: tooltipPosition.x + 'px',
						top: tooltipPosition.y + 'px',
						maxWidth: '260px',
					}}>
					{hoveredTaskDescription}
				</div>
			)}
		</>
	);
}

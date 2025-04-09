import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

// Chart.js 등록
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

// 카테고리별 색상 정의
function getCategoryColor(category) {
	switch (category) {
		case 'design':
			return { bg: 'rgba(168, 85, 247, 0.2)', border: 'rgba(168, 85, 247, 1)' }; // 퍼플
		case 'development':
			return { bg: 'rgba(34, 197, 94, 0.2)', border: 'rgba(34, 197, 94, 1)' }; // 초록
		case 'operation':
			return { bg: 'rgba(59, 130, 246, 0.2)', border: 'rgba(59, 130, 246, 1)' }; // 파랑
		default:
			return { bg: 'rgba(107, 114, 128, 0.2)', border: 'rgba(107, 114, 128, 1)' }; // 회색
	}
}

// 색상 생성 함수 수정
function generateColors(count) {
	// 기본 카테고리 색상
	const categoryColors = [
		{ bg: 'rgba(59, 130, 246, 0.2)', border: 'rgba(59, 130, 246, 1)' }, // 파랑 (운영)
		{ bg: 'rgba(168, 85, 247, 0.2)', border: 'rgba(168, 85, 247, 1)' }, // 퍼플 (디자인)
		{ bg: 'rgba(34, 197, 94, 0.2)', border: 'rgba(34, 197, 94, 1)' }, // 초록 (개발)
	];

	// 추가 색상 세트
	const additionalColors = [
		{ bg: 'rgba(239, 68, 68, 0.2)', border: 'rgba(239, 68, 68, 1)' }, // 빨강
		{ bg: 'rgba(249, 115, 22, 0.2)', border: 'rgba(249, 115, 22, 1)' }, // 주황
		{ bg: 'rgba(234, 179, 8, 0.2)', border: 'rgba(234, 179, 8, 1)' }, // 노랑
		{ bg: 'rgba(16, 185, 129, 0.2)', border: 'rgba(16, 185, 129, 1)' }, // 티일
		{ bg: 'rgba(6, 182, 212, 0.2)', border: 'rgba(6, 182, 212, 1)' }, // 사이언
		{ bg: 'rgba(99, 102, 241, 0.2)', border: 'rgba(99, 102, 241, 1)' }, // 인디고
		{ bg: 'rgba(217, 70, 239, 0.2)', border: 'rgba(217, 70, 239, 1)' }, // 푸시아
		{ bg: 'rgba(236, 72, 153, 0.2)', border: 'rgba(236, 72, 153, 1)' }, // 핑크
	];

	// 필요한 색상이 기본 카테고리 색상보다 많으면 추가 색상을 사용
	const colors = [...categoryColors];
	if (count > categoryColors.length) {
		// 추가 색상을 반복해서 필요한 만큼 추가
		for (let i = 0; i < count - categoryColors.length; i++) {
			colors.push(additionalColors[i % additionalColors.length]);
		}
	}

	return {
		backgroundColor: colors.slice(0, count).map(c => c.bg),
		borderColor: colors.slice(0, count).map(c => c.border),
	};
}

export default function Dashboard() {
	const [loading, setLoading] = useState(true);
	const [tasks, setTasks] = useState([]);
	const [clients, setClients] = useState([]);
	const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
	const [years, setYears] = useState([]);

	// 클라이언트별 데이터
	const [clientData, setClientData] = useState({
		revenue: null,
		hours: null,
		tasks: null,
	});

	// 월별 추이 데이터
	const [monthlyTrend, setMonthlyTrend] = useState(null);

	// 카테고리별 데이터
	const [categoryData, setCategoryData] = useState(null);

	useEffect(() => {
		fetchData();
	}, []);

	useEffect(() => {
		if (tasks.length > 0 && clients.length > 0) {
			processData();
		}
	}, [tasks, clients, selectedYear]);

	async function fetchData() {
		try {
			setLoading(true);

			// 업무 데이터 가져오기
			const { data: tasksData, error: tasksError } = await supabase
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
				.order('created_at', { ascending: false });

			if (tasksError) throw tasksError;

			// 클라이언트 데이터 가져오기
			const { data: clientsData, error: clientsError } = await supabase.from('clients').select('*').order('name', { ascending: true });

			if (clientsError) throw clientsError;

			setTasks(tasksData);
			setClients(clientsData);

			// 연도 목록 추출
			const yearSet = new Set();
			tasksData.forEach(task => {
				const year = new Date(task.created_at).getFullYear();
				yearSet.add(year);
			});

			const sortedYears = Array.from(yearSet).sort((a, b) => b - a);
			setYears(sortedYears);
			if (sortedYears.length > 0) {
				setSelectedYear(sortedYears[0]); // 가장 최근 연도 선택
			}
		} catch (error) {
			console.error('Error fetching data:', error.message);
		} finally {
			setLoading(false);
		}
	}

	// 데이터 처리 및 차트 데이터 생성
	function processData() {
		// 선택된 연도의 업무만 필터링
		const yearTasks = tasks.filter(task => {
			const taskYear = new Date(task.created_at).getFullYear();
			return taskYear === selectedYear;
		});

		// 클라이언트별 수익 데이터
		processClientRevenueData(yearTasks);

		// 클라이언트별 시간 데이터
		processClientHoursData(yearTasks);

		// 클라이언트별 업무 수 데이터
		processClientTasksData(yearTasks);

		// 월별 추이 데이터
		processMonthlyTrendData(yearTasks);

		// 카테고리별 데이터
		processCategoryData(yearTasks);
	}

	// 클라이언트별 수익 차트 데이터
	function processClientRevenueData(filteredTasks) {
		// 클라이언트별 금액 합계
		const clientRevenue = {};

		filteredTasks.forEach(task => {
			const clientName = task.clients?.name || '(삭제된 클라이언트)';
			if (!clientRevenue[clientName]) {
				clientRevenue[clientName] = 0;
			}
			clientRevenue[clientName] += task.price;
		});

		// 금액이 높은 순서대로 정렬
		const sortedClients = Object.keys(clientRevenue).sort((a, b) => clientRevenue[b] - clientRevenue[a]);

		// 색상 생성
		const colors = generateColors(sortedClients.length);

		const chartData = {
			labels: sortedClients,
			datasets: [
				{
					label: '수익',
					data: sortedClients.map(client => clientRevenue[client]),
					backgroundColor: colors.backgroundColor,
					borderColor: colors.borderColor,
					borderWidth: 1,
				},
			],
		};

		setClientData(prev => ({ ...prev, revenue: chartData }));
	}

	// 클라이언트별 시간 차트 데이터
	function processClientHoursData(filteredTasks) {
		// 클라이언트별 시간 합계
		const clientHours = {};

		filteredTasks.forEach(task => {
			const clientName = task.clients?.name || '(삭제된 클라이언트)';
			if (!clientHours[clientName]) {
				clientHours[clientName] = 0;
			}
			clientHours[clientName] += task.hours;
		});

		// 시간이 많은 순서대로 정렬
		const sortedClients = Object.keys(clientHours).sort((a, b) => clientHours[b] - clientHours[a]);

		// 색상 생성
		const colors = generateColors(sortedClients.length);

		const chartData = {
			labels: sortedClients,
			datasets: [
				{
					label: '시간 (시간)',
					data: sortedClients.map(client => clientHours[client]),
					backgroundColor: colors.backgroundColor,
					borderColor: colors.borderColor,
					borderWidth: 1,
				},
			],
		};

		setClientData(prev => ({ ...prev, hours: chartData }));
	}

	// 클라이언트별 업무 수 차트 데이터
	function processClientTasksData(filteredTasks) {
		// 클라이언트별 업무 수
		const clientTaskCount = {};

		filteredTasks.forEach(task => {
			const clientName = task.clients?.name || '(삭제된 클라이언트)';
			if (!clientTaskCount[clientName]) {
				clientTaskCount[clientName] = 0;
			}
			clientTaskCount[clientName] += 1;
		});

		// 업무 수가 많은 순서대로 정렬
		const sortedClients = Object.keys(clientTaskCount).sort((a, b) => clientTaskCount[b] - clientTaskCount[a]);

		// 색상 생성
		const colors = generateColors(sortedClients.length);

		const chartData = {
			labels: sortedClients,
			datasets: [
				{
					label: '업무 수',
					data: sortedClients.map(client => clientTaskCount[client]),
					backgroundColor: colors.backgroundColor,
					borderColor: colors.borderColor,
					borderWidth: 1,
				},
			],
		};

		setClientData(prev => ({ ...prev, tasks: chartData }));
	}

	// 월별 추이 차트 데이터
	function processMonthlyTrendData(filteredTasks) {
		// 월별 금액과 시간
		const monthlyData = {
			1: { revenue: 0, hours: 0 },
			2: { revenue: 0, hours: 0 },
			3: { revenue: 0, hours: 0 },
			4: { revenue: 0, hours: 0 },
			5: { revenue: 0, hours: 0 },
			6: { revenue: 0, hours: 0 },
			7: { revenue: 0, hours: 0 },
			8: { revenue: 0, hours: 0 },
			9: { revenue: 0, hours: 0 },
			10: { revenue: 0, hours: 0 },
			11: { revenue: 0, hours: 0 },
			12: { revenue: 0, hours: 0 },
		};

		filteredTasks.forEach(task => {
			const month = new Date(task.created_at).getMonth() + 1; // 0-based to 1-based
			monthlyData[month].revenue += task.price;
			monthlyData[month].hours += task.hours;
		});

		const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

		const chartData = {
			labels: monthNames,
			datasets: [
				{
					label: '수익 (만원)',
					data: Object.values(monthlyData).map(data => Math.round(data.revenue / 10000)), // 만원 단위로 변환
					borderColor: 'rgba(75, 192, 192, 1)',
					backgroundColor: 'rgba(75, 192, 192, 0.2)',
					yAxisID: 'y',
					tension: 0.3,
				},
				{
					label: '시간 (시간)',
					data: Object.values(monthlyData).map(data => data.hours),
					borderColor: 'rgba(255, 99, 132, 1)',
					backgroundColor: 'rgba(255, 99, 132, 0.2)',
					yAxisID: 'y1',
					tension: 0.3,
				},
			],
		};

		setMonthlyTrend(chartData);
	}

	// 카테고리별 차트 데이터를 담당자별 차트 데이터로 변경
	function processCategoryData(filteredTasks) {
		// 담당자별 금액
		const managerRevenue = {};

		filteredTasks.forEach(task => {
			// 담당자 정보가 없는 경우 '담당자 미지정'으로 처리
			let managers = task.manager ? task.manager.split(',').map(m => m.trim()) : ['담당자 미지정'];

			// 담당자가 비어 있거나 유효하지 않은 경우 '담당자 미지정'으로 처리
			if (managers.length === 0 || (managers.length === 1 && !managers[0])) {
				managers = ['담당자 미지정'];
			}

			// 업무 가격이 있는 경우에만 처리
			if (task.price) {
				// 담당자별로 금액 분배 (균등 분배)
				const pricePerManager = task.price / managers.length;

				// 각 담당자에게 금액 할당
				managers.forEach(manager => {
					if (!managerRevenue[manager]) {
						managerRevenue[manager] = 0;
					}
					managerRevenue[manager] += pricePerManager;
				});
			}
		});

		// 금액이 높은 순서대로 정렬
		const sortedManagers = Object.keys(managerRevenue).sort((a, b) => managerRevenue[b] - managerRevenue[a]);

		// 색상 생성
		const colors = generateColors(sortedManagers.length);

		const chartData = {
			labels: sortedManagers,
			datasets: [
				{
					data: sortedManagers.map(manager => Math.round(managerRevenue[manager])), // 소수점 반올림
					backgroundColor: colors.backgroundColor,
					borderColor: colors.borderColor,
					borderWidth: 1,
				},
			],
		};

		setCategoryData(chartData);
	}

	// 시간 포맷
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

	return (
		<>
			<Head>
				<title>대시보드 - D:OPS</title>
			</Head>

			<main className="flex-grow container mx-auto py-4 px-4">
				<div className="mb-8">
					<h1 className="text-3xl font-bold">대시보드</h1>
					<p className="text-gray-600 dark:text-gray-300 mt-2">프로젝트 및 클라이언트 현황을 한눈에 확인하세요.</p>
				</div>

				{loading ? (
					<div className="flex justify-center items-center h-64">
						<p className="text-center">데이터를 불러오는 중...</p>
					</div>
				) : tasks.length === 0 ? (
					<div className="bg-white dark:bg-dark-card rounded-lg shadow-md p-8 text-center">
						<p className="text-gray-500 dark:text-gray-400 mb-4">등록된 업무가 없습니다.</p>
						<Link href="/tasks/new">
							<a className="text-blue-500 hover:underline">+ 새 업무 등록하기</a>
						</Link>
					</div>
				) : (
					<>
						<div className="mb-8">
							<div className="bg-white dark:bg-dark-card rounded-lg shadow-md p-6">
								<div className="flex justify-between items-center mb-4">
									<h2 className="text-xl font-semibold dark:text-white">연도 선택</h2>
									<div>
										<select
											value={selectedYear}
											onChange={e => setSelectedYear(Number(e.target.value))}
											className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-card dark:border-dark-border dark:text-white">
											{years.map(year => (
												<option key={year} value={year}>
													{year}년
												</option>
											))}
										</select>
									</div>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
									<div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
										<h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">총 수익</h3>
										<div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
											{tasks
												.filter(task => new Date(task.created_at).getFullYear() === selectedYear)
												.reduce((sum, task) => sum + task.price, 0)
												.toLocaleString()}
											원
										</div>
									</div>
									<div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
										<h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">총 업무 시간</h3>
										<div className="text-2xl font-bold text-green-600 dark:text-green-400">
											{formatTimeUnit(tasks.filter(task => new Date(task.created_at).getFullYear() === selectedYear).reduce((sum, task) => sum + task.hours, 0))}
										</div>
									</div>
									<div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
										<h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">업무 수</h3>
										<div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{tasks.filter(task => new Date(task.created_at).getFullYear() === selectedYear).length}건</div>
									</div>
								</div>

								<div className="mb-6">
									<h2 className="text-xl font-semibold mb-4 dark:text-white">월별 추이</h2>
									<div className="h-80">
										{monthlyTrend && (
											<Line
												data={monthlyTrend}
												options={{
													responsive: true,
													maintainAspectRatio: false,
													scales: {
														y: {
															type: 'linear',
															display: true,
															position: 'left',
															title: {
																display: true,
																text: '수익 (만원)',
																color: document.documentElement.classList.contains('dark') ? '#e9e9e9' : undefined,
															},
															ticks: {
																color: document.documentElement.classList.contains('dark') ? '#e9e9e9' : undefined,
															},
															grid: {
																color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.1)' : undefined,
															},
														},
														y1: {
															type: 'linear',
															display: true,
															position: 'right',
															title: {
																display: true,
																text: '시간 (시간)',
																color: document.documentElement.classList.contains('dark') ? '#e9e9e9' : undefined,
															},
															ticks: {
																color: document.documentElement.classList.contains('dark') ? '#e9e9e9' : undefined,
															},
															grid: {
																drawOnChartArea: false,
																color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.1)' : undefined,
															},
														},
														x: {
															ticks: {
																color: document.documentElement.classList.contains('dark') ? '#e9e9e9' : undefined,
															},
															grid: {
																color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.1)' : undefined,
															},
														},
													},
													plugins: {
														legend: {
															labels: {
																color: document.documentElement.classList.contains('dark') ? '#e9e9e9' : undefined,
															},
														},
													},
												}}
											/>
										)}
									</div>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
									<div>
										<h2 className="text-xl font-semibold mb-4 dark:text-white">클라이언트별 수익</h2>
										<div className="h-80">
											{clientData.revenue && (
												<Bar
													data={clientData.revenue}
													options={{
														maintainAspectRatio: false,
														scales: {
															y: {
																ticks: {
																	color: document.documentElement.classList.contains('dark') ? '#e9e9e9' : undefined,
																},
																grid: {
																	color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.1)' : undefined,
																},
															},
															x: {
																ticks: {
																	color: document.documentElement.classList.contains('dark') ? '#e9e9e9' : undefined,
																},
																grid: {
																	color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.1)' : undefined,
																},
															},
														},
														plugins: {
															legend: {
																labels: {
																	color: document.documentElement.classList.contains('dark') ? '#e9e9e9' : undefined,
																},
															},
														},
													}}
												/>
											)}
										</div>
									</div>
									<div>
										<h2 className="text-xl font-semibold mb-4 dark:text-white">클라이언트별 시간</h2>
										<div className="h-80">
											{clientData.hours && (
												<Bar
													data={clientData.hours}
													options={{
														maintainAspectRatio: false,
														scales: {
															y: {
																ticks: {
																	color: document.documentElement.classList.contains('dark') ? '#e9e9e9' : undefined,
																},
																grid: {
																	color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.1)' : undefined,
																},
															},
															x: {
																ticks: {
																	color: document.documentElement.classList.contains('dark') ? '#e9e9e9' : undefined,
																},
																grid: {
																	color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.1)' : undefined,
																},
															},
														},
														plugins: {
															legend: {
																labels: {
																	color: document.documentElement.classList.contains('dark') ? '#e9e9e9' : undefined,
																},
															},
														},
													}}
												/>
											)}
										</div>
									</div>
									<div>
										<h2 className="text-xl font-semibold mb-4 dark:text-white">담당자별 수익</h2>
										<div className="h-80 flex justify-center items-center">
											{categoryData && (
												<Pie
													data={categoryData}
													options={{
														maintainAspectRatio: false,
														plugins: {
															legend: {
																labels: {
																	color: document.documentElement.classList.contains('dark') ? '#e9e9e9' : undefined,
																},
															},
														},
													}}
												/>
											)}
										</div>
									</div>
								</div>
							</div>
						</div>

						<div className="mb-8">
							<h2 className="text-xl font-semibold mb-4 dark:text-white">최근 업무</h2>
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
													금액
												</th>
												<th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
													액션
												</th>
											</tr>
										</thead>
										<tbody className="bg-white dark:bg-dark-card divide-y divide-gray-200 dark:divide-dark-border">
											{tasks.slice(0, 5).map(task => (
												<tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-dark-card/80">
													<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(task.created_at).toLocaleDateString()}</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{task.clients?.name || '(삭제된 클라이언트)'}</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{task.title}</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400">{task.price.toLocaleString()}원</td>
													<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
														<Link href={`/tasks/${task.id}`}>
															<a className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">상세</a>
														</Link>
													</td>
												</tr>
											))}
										</tbody>
									</table>
									{tasks.length > 5 && (
										<div className="px-6 py-3 bg-gray-50 dark:bg-dark-card/80 text-right">
											<Link href="/tasks">
												<a className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium">모든 업무 보기 &rarr;</a>
											</Link>
										</div>
									)}
								</div>
							</div>
						</div>
					</>
				)}
			</main>
		</>
	);
}

const { createClient } = require('@supabase/supabase-js');
const { IncomingWebhook } = require('@slack/webhook');
const dayjs = require('dayjs');
require('dayjs/locale/ko');

// 한국어 로케일 설정
dayjs.locale('ko');

// Supabase 클라이언트 초기화
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Slack 웹훅 초기화
const slack = new IncomingWebhook(process.env.SLACK_WEBHOOK_URL);

async function getStats(startDate, endDate) {
	// 클라이언트 정보 가져오기
	const { data: clients } = await supabase.from('clients').select('id, name');
	const clientMap = Object.fromEntries(clients.map(c => [c.id, c.name]));

	const { data, error } = await supabase.from('tasks').select('*').gte('task_date', startDate).lte('task_date', endDate);

	if (error) throw error;

	// 담당자별 통계
	const managerStats = data.reduce((acc, task) => {
		const managers = task.manager.split(',').map(m => m.trim());
		managers.forEach(manager => {
			if (!acc[manager]) {
				acc[manager] = {
					clients: {}, // 클라이언트별 카운트
					hours: 0,
					price: 0,
				};
			}
			// 클라이언트별 카운트 증가
			const clientName = clientMap[task.client_id];
			acc[manager].clients[clientName] = (acc[manager].clients[clientName] || 0) + 1;
			acc[manager].hours += task.hours;
			acc[manager].price += task.price;
		});
		return acc;
	}, {});

	// 카테고리별 통계
	const categoryStats = data.reduce((acc, task) => {
		if (!acc[task.category]) {
			acc[task.category] = {
				clients: {}, // 클라이언트별 카운트
				hours: 0,
				price: 0,
			};
		}
		// 클라이언트별 카운트 증가
		const clientName = clientMap[task.client_id];
		acc[task.category].clients[clientName] = (acc[task.category].clients[clientName] || 0) + 1;
		acc[task.category].hours += task.hours;
		acc[task.category].price += task.price;
		return acc;
	}, {});

	// 클라이언트별 통계
	const clientStats = data.reduce((acc, task) => {
		const clientName = clientMap[task.client_id];
		if (!acc[clientName]) {
			acc[clientName] = 0;
		}
		acc[clientName] += 1;
		return acc;
	}, {});

	return {
		managerStats,
		categoryStats,
		clientStats,
		totalTasks: data.length,
		totalHours: data.reduce((sum, task) => sum + parseFloat(task.hours), 0),
		totalPrice: data.reduce((sum, task) => sum + parseFloat(task.price), 0),
	};
}

function formatCurrency(price) {
	return `${(price / 10000).toFixed(1)}만원`;
}

function formatClientCounts(clients) {
	if (!clients) return '';

	return Object.entries(clients)
		.filter(([client, count]) => client && count)
		.map(([client, count]) => `${client}(${count})`)
		.join(', ');
}

async function generateDailyReport() {
	const today = dayjs();
	const startOfDay = today.startOf('day').format('YYYY-MM-DD');
	const endOfDay = today.endOf('day').format('YYYY-MM-DD');

	const stats = await getStats(startOfDay, endOfDay);

	return [
		{
			type: 'header',
			text: {
				type: 'plain_text',
				text: `📊 일일 업무 리포트 (${today.format('YYYY년 M월 D일 dddd')})`,
			},
		},
		{
			type: 'divider',
		},
		{
			type: 'section',
			text: {
				type: 'mrkdwn',
				text:
					`*📈 전체 현황*\n` + `• 총 업무: ${formatClientCounts(stats.clientStats)}\n` + `• 총 소요 시간: ${stats.totalHours.toFixed(1)}시간\n` + `• 총 비용: ${formatCurrency(stats.totalPrice)}`,
			},
		},
		{
			type: 'divider',
		},
		{
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: '*👥 담당자별 현황*',
			},
		},
		...Object.entries(stats.managerStats).map(([manager, stat]) => ({
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: `*${manager}*\n` + `• 업무: ${formatClientCounts(stat.clients)}\n` + `• 총 시간: ${stat.hours.toFixed(1)}시간\n` + `• 총 비용: ${formatCurrency(stat.price)}`,
			},
		})),
		{
			type: 'divider',
		},
		{
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: '*🔖 카테고리별 현황*',
			},
		},
		...Object.entries(stats.categoryStats).map(([category, stat]) => ({
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: `*${category}*\n` + `• 업무: ${formatClientCounts(stat.clients)}\n` + `• 총 시간: ${stat.hours.toFixed(1)}시간\n` + `• 총 비용: ${formatCurrency(stat.price)}`,
			},
		})),
	];
}

async function generateWeeklyReport() {
	const today = dayjs();
	const lastWeek = today.subtract(1, 'week');

	// 지난 주 월요일과 금요일 구하기
	const monday = lastWeek.startOf('week').add(1, 'day'); // 월요일
	const friday = monday.add(4, 'day'); // 금요일

	const startOfWeek = monday.format('YYYY-MM-DD');
	const endOfWeek = friday.format('YYYY-MM-DD');

	const stats = await getStats(startOfWeek, endOfWeek);

	return [
		{
			type: 'header',
			text: {
				type: 'plain_text',
				text: `📊 주간 업무 리포트 (${monday.format('YYYY년 M월 D일')} ~ ${friday.format('M월 D일')})`,
			},
		},
		{
			type: 'divider',
		},
		{
			type: 'section',
			text: {
				type: 'mrkdwn',
				text:
					`*📈 주간 전체 현황*\n` +
					`• 총 업무: ${formatClientCounts(stats.clientStats)}\n` +
					`• 총 소요 시간: ${stats.totalHours.toFixed(1)}시간\n` +
					`• 총 비용: ${formatCurrency(stats.totalPrice)}`,
			},
		},
		{
			type: 'divider',
		},
		{
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: '*👥 담당자별 주간 현황*',
			},
		},
		...Object.entries(stats.managerStats).map(([manager, stat]) => ({
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: `*${manager}*\n` + `• 업무: ${formatClientCounts(stat.clients)}\n` + `• 총 시간: ${stat.hours.toFixed(1)}시간\n` + `• 총 비용: ${formatCurrency(stat.price)}`,
			},
		})),
		{
			type: 'divider',
		},
		{
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: '*🔖 카테고리별 주간 현황*',
			},
		},
		...Object.entries(stats.categoryStats).map(([category, stat]) => ({
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: `*${category}*\n` + `• 업무: ${formatClientCounts(stat.clients)}\n` + `• 총 시간: ${stat.hours.toFixed(1)}시간\n` + `• 총 비용: ${formatCurrency(stat.price)}`,
			},
		})),
	];
}

// 리포트 생성 실행
async function generateReport() {
	try {
		const reportType = process.env.REPORT_TYPE || 'daily';
		const blocks = reportType === 'weekly' ? await generateWeeklyReport() : await generateDailyReport();

		await slack.send({ blocks });
	} catch (error) {
		console.error('Error generating report:', error);
		process.exit(1);
	}
}

generateReport();

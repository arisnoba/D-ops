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

async function getDailyStats(startDate, endDate) {
	const { data, error } = await supabase.from('tasks').select('*').gte('task_date', startDate).lte('task_date', endDate);

	if (error) throw error;

	// 담당자별 통계
	const managerStats = data.reduce((acc, task) => {
		const managers = task.manager.split(',').map(m => m.trim());
		managers.forEach(manager => {
			if (!acc[manager]) {
				acc[manager] = { tasks: 0, hours: 0, price: 0 };
			}
			acc[manager].tasks += 1;
			acc[manager].hours += task.hours;
			acc[manager].price += task.price;
		});
		return acc;
	}, {});

	// 카테고리별 통계
	const categoryStats = data.reduce((acc, task) => {
		if (!acc[task.category]) {
			acc[task.category] = { tasks: 0, hours: 0, price: 0 };
		}
		acc[task.category].tasks += 1;
		acc[task.category].hours += task.hours;
		acc[task.category].price += task.price;
		return acc;
	}, {});

	return {
		managerStats,
		categoryStats,
		totalTasks: data.length,
		totalHours: data.reduce((sum, task) => sum + task.hours, 0),
		totalPrice: data.reduce((sum, task) => sum + task.price, 0),
	};
}

function formatCurrency(price) {
	return `${(price / 10000).toFixed(1)}만원`;
}

async function generateReport() {
	const today = dayjs();
	const startOfDay = today.startOf('day').format('YYYY-MM-DD');
	const endOfDay = today.endOf('day').format('YYYY-MM-DD');

	// 일일 통계 가져오기
	const dailyStats = await getDailyStats(startOfDay, endOfDay);

	// Slack 메시지 블록 생성
	const blocks = [
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
					`*📈 전체 현황*\n` +
					`• 총 업무 건수: ${dailyStats.totalTasks}건\n` +
					`• 총 소요 시간: ${dailyStats.totalHours.toFixed(1)}시간\n` +
					`• 총 비용: ${formatCurrency(dailyStats.totalPrice)}`,
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
		...Object.entries(dailyStats.managerStats).map(([manager, stats]) => ({
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: `*${manager}*\n` + `• 업무 건수: ${stats.tasks}건\n` + `• 총 시간: ${stats.hours.toFixed(1)}시간\n` + `• 총 비용: ${formatCurrency(stats.price)}`,
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
		...Object.entries(dailyStats.categoryStats).map(([category, stats]) => ({
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: `*${category}*\n` + `• 업무 건수: ${stats.tasks}건\n` + `• 총 시간: ${stats.hours.toFixed(1)}시간\n` + `• 총 비용: ${formatCurrency(stats.price)}`,
			},
		})),
	];

	// Slack으로 전송
	await slack.send({ blocks });
}

// 리포트 생성 실행
generateReport().catch(error => {
	console.error('Error generating report:', error);
	process.exit(1);
});

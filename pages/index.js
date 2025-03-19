import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Home() {
	const [loading, setLoading] = useState(false);
	const [tasks, setTasks] = useState([]);

	useEffect(() => {
		fetchTasks();
	}, []);

	async function fetchTasks() {
		try {
			setLoading(true);
			const { data, error } = await supabase
				.from('tasks')
				.select(
					`
					*,
					clients:client_id (
						name
					)
				`
				)
				.order('created_at', { ascending: false });

			if (error) throw error;
			if (data) setTasks(data);
		} catch (error) {
			console.error('Error fetching tasks:', error.message);
		} finally {
			setLoading(false);
		}
	}

	return (
		<>
			<Head>
				<title>D-ops: 디자인/개발/운영 업무 관리</title>
				<meta name="description" content="디자인, 개발, 운영 업무량을 기록하고 가격을 산출하는 웹앱" />
				<link rel="icon" href="/favicon.ico" />
			</Head>

			<main className="flex-grow container mx-auto py-12 px-4">
				<div className="mb-8">
					<h2 className="text-3xl font-bold">업무 목록</h2>
				</div>

				{loading ? (
					<p className="text-center">로딩 중...</p>
				) : tasks.length === 0 ? (
					<div className="bg-white rounded-lg shadow-md p-8 text-center">
						<p className="text-gray-500 mb-4">등록된 업무가 없습니다.</p>
						<p className="text-blue-500">상단 메뉴에서 업무를 등록해보세요</p>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{tasks.map(task => (
							<div key={task.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-200">
								<div className="p-6">
									<div className="flex justify-between items-start mb-3">
										<h3 className="text-xl font-semibold">{task.title}</h3>
										<span className="bg-gray-200 text-gray-800 rounded-full px-3 py-1 text-sm">
											{task.category === 'design' ? '디자인' : task.category === 'development' ? '개발' : '운영'}
										</span>
									</div>

									{task.clients && (
										<div className="text-sm text-gray-600 mb-2">
											클라이언트: <span className="font-medium">{task.clients.name}</span>
										</div>
									)}

									<p className="text-gray-600 mb-4 line-clamp-2">{task.description || '설명 없음'}</p>
									<div className="flex justify-between items-end">
										<div className="text-sm text-gray-500">
											<div>소요 시간: {task.hours}시간</div>
											<div>단가: {task.price_per_hour.toLocaleString()}원/시간</div>
										</div>
										<span className="text-xl font-bold text-blue-600">{task.price.toLocaleString()}원</span>
									</div>
								</div>
								<div className="border-t border-gray-200 bg-gray-50 px-6 py-3 text-right">
									<Link href={`/tasks/${task.id}`}>
										<a className="text-blue-600 hover:text-blue-800 text-sm font-medium">상세 보기 &rarr;</a>
									</Link>
								</div>
							</div>
						))}
					</div>
				)}
			</main>
		</>
	);
}

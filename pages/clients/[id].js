import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

export default function ClientDetail() {
	const router = useRouter();
	const { id } = router.query;
	const [loading, setLoading] = useState(true);
	const [client, setClient] = useState(null);
	const [tasks, setTasks] = useState([]);
	const [deleteLoading, setDeleteLoading] = useState(false);
	const [error, setError] = useState(null);

	useEffect(() => {
		if (id) {
			fetchClient();
			fetchClientTasks();
		}
	}, [id]);

	async function fetchClient() {
		try {
			setLoading(true);
			setError(null);

			const { data, error } = await supabase.from('clients').select('*').eq('id', id).single();

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
			const { data, error } = await supabase.from('tasks').select('*').eq('client_id', id).order('created_at', { ascending: false });

			if (error) throw error;
			if (data) setTasks(data);
		} catch (error) {
			console.error('Error fetching client tasks:', error.message);
		}
	}

	async function handleDelete() {
		if (!confirm('정말로 이 클라이언트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
			return;
		}

		try {
			setDeleteLoading(true);

			// 먼저 이 클라이언트에 연결된 업무가 있는지 확인
			if (tasks.length > 0) {
				alert('이 클라이언트에 연결된 업무가 있어 삭제할 수 없습니다. 먼저 연결된 업무를 삭제하거나 다른 클라이언트로 변경해주세요.');
				setDeleteLoading(false);
				return;
			}

			const { error } = await supabase.from('clients').delete().eq('id', id);

			if (error) throw error;

			// 삭제 성공 후 목록 페이지로 이동
			router.push('/clients');
		} catch (error) {
			console.error('Error deleting client:', error.message);
			alert('클라이언트 삭제 중 오류가 발생했습니다.');
		} finally {
			setDeleteLoading(false);
		}
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

	if (loading) {
		return (
			<div className="flex-grow container mx-auto py-12 px-4">
				<p className="text-center">로딩 중...</p>
			</div>
		);
	}

	if (error || !client) {
		return (
			<div className="flex-grow container mx-auto py-12 px-4">
				<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error || '클라이언트를 찾을 수 없습니다.'}</div>
				<div className="text-center mt-4">
					<Link href="/clients">
						<a className="text-blue-500 hover:underline">클라이언트 목록으로 돌아가기</a>
					</Link>
				</div>
			</div>
		);
	}

	return (
		<>
			<Head>
				<title>{client.name} | D-ops</title>
			</Head>

			<main className="flex-grow container mx-auto py-12 px-4">
				<div className="mb-6">
					<Link href="/clients">
						<a className="text-blue-500 hover:underline flex items-center">
							<svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
							</svg>
							클라이언트 목록으로 돌아가기
						</a>
					</Link>
				</div>

				<div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
					<div className="p-6">
						<div className="flex justify-between items-start mb-4">
							<h1 className="text-3xl font-bold">{client.name}</h1>
							<div className="text-sm text-gray-500">
								<p>등록일: {formatDate(client.created_at)}</p>
							</div>
						</div>

						{client.description && (
							<div className="mb-6">
								<h3 className="text-lg font-semibold mb-2">설명</h3>
								<div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">{client.description}</div>
							</div>
						)}

						<div className="mb-6">
							<h3 className="text-lg font-semibold mb-2">담당자 정보</h3>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-md">
								{client.contact_person ? (
									<div>
										<div className="text-sm text-gray-500">담당자 이름</div>
										<div>{client.contact_person}</div>
									</div>
								) : (
									<div>
										<div className="text-sm text-gray-500">담당자 이름</div>
										<div className="text-gray-400">미등록</div>
									</div>
								)}

								{client.contact_email ? (
									<div>
										<div className="text-sm text-gray-500">이메일</div>
										<div>
											<a href={`mailto:${client.contact_email}`} className="text-blue-500 hover:underline">
												{client.contact_email}
											</a>
										</div>
									</div>
								) : (
									<div>
										<div className="text-sm text-gray-500">이메일</div>
										<div className="text-gray-400">미등록</div>
									</div>
								)}

								{client.contact_phone ? (
									<div>
										<div className="text-sm text-gray-500">연락처</div>
										<div>
											<a href={`tel:${client.contact_phone}`} className="text-blue-500 hover:underline">
												{client.contact_phone}
											</a>
										</div>
									</div>
								) : (
									<div>
										<div className="text-sm text-gray-500">연락처</div>
										<div className="text-gray-400">미등록</div>
									</div>
								)}
							</div>
						</div>

						<div className="flex justify-end mt-6">
							<Link href={`/clients/${client.id}/edit`}>
								<a className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200 mr-2">수정하기</a>
							</Link>
							<button
								onClick={handleDelete}
								disabled={deleteLoading || tasks.length > 0}
								className={`bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200 ${
									deleteLoading || tasks.length > 0 ? 'opacity-70 cursor-not-allowed' : ''
								}`}>
								{deleteLoading ? '삭제 중...' : '삭제하기'}
							</button>
						</div>
					</div>
				</div>

				<div className="mb-4">
					<h2 className="text-2xl font-bold mb-4">관련 업무</h2>
					{tasks.length === 0 ? (
						<div className="bg-white rounded-lg shadow-md p-8 text-center">
							<p className="text-gray-500">이 클라이언트와 관련된 업무가 없습니다.</p>
							<Link href="/tasks/new">
								<a className="text-blue-500 hover:underline mt-2 inline-block">+ 새 업무 등록하기</a>
							</Link>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{tasks.map(task => (
								<div key={task.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-200">
									<div className="p-6">
										<div className="flex justify-between items-start mb-3">
											<h3 className="text-xl font-semibold">{task.title}</h3>
											<span className="bg-gray-200 text-gray-800 rounded-full px-3 py-1 text-sm">{getCategoryName(task.category)}</span>
										</div>

										<p className="text-gray-600 mb-4 line-clamp-2">{task.description || '설명 없음'}</p>
										<div className="flex justify-between items-end">
											<div className="text-sm text-gray-500">
												<div>소요 시간: {formatTimeUnit(task.hours)}</div>
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
				</div>
			</main>
		</>
	);
}

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

export default function TaskDetail() {
	const router = useRouter();
	const { id } = router.query;
	const [loading, setLoading] = useState(true);
	const [task, setTask] = useState(null);
	const [error, setError] = useState(null);
	const [deleteLoading, setDeleteLoading] = useState(false);

	useEffect(() => {
		if (id) {
			fetchTask();
		}
	}, [id]);

	async function fetchTask() {
		try {
			setLoading(true);
			setError(null);

			const { data, error } = await supabase
				.from('tasks')
				.select(
					`
          *,
          clients:client_id (
            id,
            name,
            contact_person,
            contact_email,
            contact_phone
          )
        `
				)
				.eq('id', id)
				.single();

			if (error) throw error;
			if (data) setTask(data);
		} catch (error) {
			console.error('Error fetching task:', error.message);
			setError('업무를 불러오는 중 오류가 발생했습니다.');
		} finally {
			setLoading(false);
		}
	}

	async function handleDelete() {
		if (!confirm('정말로 이 업무를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
			return;
		}

		try {
			setDeleteLoading(true);

			const { error } = await supabase.from('tasks').delete().eq('id', id);

			if (error) throw error;

			// 삭제 성공 후 목록 페이지로 이동
			router.push('/');
		} catch (error) {
			console.error('Error deleting task:', error.message);
			alert('업무 삭제 중 오류가 발생했습니다.');
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

	// 날짜 포맷
	const formatDate = dateString => {
		const date = new Date(dateString);
		return date.toLocaleDateString('ko-KR', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	if (loading) {
		return (
			<div className="flex-grow container mx-auto py-12 px-4">
				<p className="text-center">로딩 중...</p>
			</div>
		);
	}

	if (error || !task) {
		return (
			<div className="flex-grow container mx-auto py-12 px-4">
				<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error || '업무를 찾을 수 없습니다.'}</div>
				<div className="text-center mt-4">
					<Link href="/">
						<a className="text-blue-500 hover:underline">홈으로 돌아가기</a>
					</Link>
				</div>
			</div>
		);
	}

	return (
		<>
			<Head>
				<title>{task.title} | D-ops</title>
			</Head>

			<main className="flex-grow container mx-auto py-12 px-4">
				<div className="mb-6">
					<Link href="/">
						<a className="text-blue-500 hover:underline flex items-center">
							<svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
							</svg>
							목록으로 돌아가기
						</a>
					</Link>
				</div>

				<div className="bg-white rounded-lg shadow-lg overflow-hidden">
					<div className="p-6">
						<div className="flex justify-between items-start mb-4">
							<h1 className="text-3xl font-bold">{task.title}</h1>
							<span className="bg-blue-100 text-blue-800 rounded-full px-4 py-1 text-sm font-medium">{getCategoryName(task.category)}</span>
						</div>

						<div className="mb-6 text-sm text-gray-500">
							<p>등록일: {formatDate(task.created_at)}</p>
						</div>

						{task.clients && (
							<div className="mb-6 bg-gray-50 p-4 rounded-lg">
								<h3 className="text-lg font-semibold mb-2">클라이언트 정보</h3>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<p className="text-gray-600">이름</p>
										<p className="font-medium">{task.clients.name}</p>
									</div>
									{task.clients.contact_person && (
										<div>
											<p className="text-gray-600">담당자</p>
											<p className="font-medium">{task.clients.contact_person}</p>
										</div>
									)}
									{task.clients.contact_email && (
										<div>
											<p className="text-gray-600">이메일</p>
											<p className="font-medium">{task.clients.contact_email}</p>
										</div>
									)}
									{task.clients.contact_phone && (
										<div>
											<p className="text-gray-600">연락처</p>
											<p className="font-medium">{task.clients.contact_phone}</p>
										</div>
									)}
								</div>
							</div>
						)}

						<div className="mb-6">
							<h3 className="text-lg font-semibold mb-2">업무 설명</h3>
							<div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">{task.description || '설명이 없습니다.'}</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
							<div className="bg-gray-50 p-4 rounded-lg">
								<h3 className="text-md font-semibold mb-1">소요 시간</h3>
								<p className="text-xl font-bold">{formatTimeUnit(task.hours)}</p>
							</div>
							<div className="bg-gray-50 p-4 rounded-lg">
								<h3 className="text-md font-semibold mb-1">시간당 단가</h3>
								<p className="text-xl font-bold">{task.price_per_hour.toLocaleString()}원</p>
							</div>
							<div className="bg-blue-50 p-4 rounded-lg">
								<h3 className="text-md font-semibold mb-1">총 가격</h3>
								<p className="text-2xl font-bold text-blue-600">{task.price.toLocaleString()}원</p>
							</div>
						</div>

						<div className="flex justify-end mt-6">
							<Link href={`/tasks/${task.id}/edit`}>
								<a className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200 mr-2">수정하기</a>
							</Link>
							<button onClick={handleDelete} disabled={deleteLoading} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200">
								{deleteLoading ? '삭제 중...' : '삭제하기'}
							</button>
						</div>
					</div>
				</div>
			</main>
		</>
	);
}

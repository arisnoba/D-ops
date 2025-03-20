import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase';

export default function EditTask() {
	const router = useRouter();
	const { id } = router.query;
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [clients, setClients] = useState([]);
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [clientId, setClientId] = useState('');
	const [category, setCategory] = useState('design');
	const [timeValue, setTimeValue] = useState('');
	const [timeUnit, setTimeUnit] = useState('hour');
	const [pricePerHour, setPricePerHour] = useState('');
	const [error, setError] = useState(null);

	const categories = [
		{ id: 'design', name: '디자인', defaultPrice: 50000 },
		{ id: 'development', name: '개발', defaultPrice: 70000 },
		{ id: 'operation', name: '운영', defaultPrice: 40000 },
	];

	// 클라이언트 목록 가져오기
	useEffect(() => {
		fetchClients();
	}, []);

	// 업무 정보 가져오기
	useEffect(() => {
		if (id) {
			fetchTask();
		}
	}, [id]);

	async function fetchClients() {
		try {
			const { data, error } = await supabase.from('clients').select('id, name').order('name', { ascending: true });

			if (error) throw error;
			if (data) setClients(data);
		} catch (error) {
			console.error('Error fetching clients:', error.message);
		}
	}

	async function fetchTask() {
		try {
			setLoading(true);
			setError(null);

			const { data, error } = await supabase.from('tasks').select('*').eq('id', id).single();

			if (error) throw error;

			if (data) {
				setTitle(data.title);
				setDescription(data.description || '');
				setClientId(data.client_id);
				setCategory(data.category);

				// 시간 값 설정
				const hours = data.hours;
				if (hours >= 8 && hours % 8 === 0) {
					// 8시간 단위로 나누어 떨어지면 일 단위로 설정
					setTimeValue(hours / 8);
					setTimeUnit('day');
				} else {
					setTimeValue(hours);
					setTimeUnit('hour');
				}

				setPricePerHour(data.price_per_hour);
			}
		} catch (error) {
			console.error('Error fetching task:', error.message);
			setError('업무를 불러오는 중 오류가 발생했습니다.');
		} finally {
			setLoading(false);
		}
	}

	// 시간 값을 시간 단위로 변환
	const convertToHours = () => {
		if (!timeValue) return 0;
		const value = parseFloat(timeValue);

		if (timeUnit === 'day') {
			return value * 8; // 1일 = 8시간
		}
		return value;
	};

	// 총 가격 계산
	const calculateTotalPrice = () => {
		const hours = convertToHours();
		if (!hours || !pricePerHour) return 0;
		return hours * parseFloat(pricePerHour);
	};

	async function handleSubmit(e) {
		e.preventDefault();

		if (!title || !category || !timeValue || !pricePerHour || !clientId) {
			setError('필수 항목을 모두 입력해주세요.');
			return;
		}

		try {
			setSubmitting(true);
			setError(null);

			const hours = convertToHours();
			const totalPrice = calculateTotalPrice();

			const { data, error } = await supabase
				.from('tasks')
				.update({
					title,
					description,
					client_id: clientId,
					category,
					hours: hours,
					price_per_hour: parseFloat(pricePerHour),
					price: totalPrice,
				})
				.eq('id', id);

			if (error) throw error;

			// 업무 상세 페이지로 이동
			router.push(`/tasks/${id}`);
		} catch (error) {
			console.error('Error updating task:', error.message);
			setError('업무 수정 중 오류가 발생했습니다.');
		} finally {
			setSubmitting(false);
		}
	}

	if (loading) {
		return (
			<div className="flex-grow container mx-auto py-12 px-4">
				<p className="text-center">로딩 중...</p>
			</div>
		);
	}

	if (error && !title) {
		return (
			<div className="flex-grow container mx-auto py-12 px-4">
				<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>
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
				<title>업무 수정 | D-ops</title>
			</Head>

			<main className="flex-grow container mx-auto py-12 px-4">
				<div className="mb-6">
					<Link href={`/tasks/${id}`}>
						<a className="text-blue-500 hover:underline flex items-center">
							<svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
							</svg>
							업무 상세로 돌아가기
						</a>
					</Link>
				</div>

				<h1 className="text-3xl font-bold mb-8">업무 수정</h1>

				<form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto">
					{error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

					<div className="mb-6">
						<label className="block text-gray-700 font-semibold mb-2" htmlFor="clientId">
							클라이언트 *
						</label>
						{clients.length === 0 ? (
							<div>
								<p className="text-red-500 mb-2">등록된 클라이언트가 없습니다.</p>
								<Link href="/clients/new">
									<a className="text-blue-500 hover:text-blue-700" target="_blank" rel="noopener noreferrer">
										+ 새 클라이언트 등록하기
									</a>
								</Link>
							</div>
						) : (
							<select
								id="clientId"
								value={clientId}
								onChange={e => setClientId(e.target.value)}
								className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
								required>
								<option value="">클라이언트 선택</option>
								{clients.map(client => (
									<option key={client.id} value={client.id}>
										{client.name}
									</option>
								))}
							</select>
						)}
					</div>

					<div className="mb-6">
						<label className="block text-gray-700 font-semibold mb-2" htmlFor="title">
							업무 제목 *
						</label>
						<input
							id="title"
							type="text"
							value={title}
							onChange={e => setTitle(e.target.value)}
							className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							required
						/>
					</div>

					<div className="mb-6">
						<label className="block text-gray-700 font-semibold mb-2" htmlFor="description">
							업무 설명
						</label>
						<textarea
							id="description"
							value={description}
							onChange={e => setDescription(e.target.value)}
							className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							rows="4"
						/>
					</div>

					<div className="mb-6">
						<label className="block text-gray-700 font-semibold mb-2" htmlFor="category">
							업무 카테고리 *
						</label>
						<select
							id="category"
							value={category}
							onChange={e => {
								setCategory(e.target.value);
								// 기본 단가 설정
								const selectedCategory = categories.find(c => c.id === e.target.value);
								if (selectedCategory && !pricePerHour) {
									setPricePerHour(selectedCategory.defaultPrice);
								}
							}}
							className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							required>
							{categories.map(category => (
								<option key={category.id} value={category.id}>
									{category.name}
								</option>
							))}
						</select>
					</div>

					<div className="mb-6">
						<label className="block text-gray-700 font-semibold mb-2">소요 시간 *</label>
						<div className="flex space-x-2">
							<div className="flex-1">
								<input
									type="number"
									min="0.25"
									step="0.25"
									value={timeValue}
									onChange={e => setTimeValue(e.target.value)}
									className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
									required
								/>
							</div>
							<div className="w-1/3">
								<select value={timeUnit} onChange={e => setTimeUnit(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
									<option value="hour">시간</option>
									<option value="day">일</option>
								</select>
							</div>
						</div>
						<div className="text-xs text-gray-500 mt-1">1일 = 8시간으로 계산됩니다.</div>
					</div>

					<div className="mb-6">
						<label className="block text-gray-700 font-semibold mb-2" htmlFor="pricePerHour">
							시간당 단가 (원) *
						</label>
						<input
							id="pricePerHour"
							type="number"
							min="0"
							step="1000"
							value={pricePerHour}
							onChange={e => setPricePerHour(e.target.value)}
							className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							required
						/>
					</div>

					<div className="bg-blue-50 p-4 rounded-lg mb-6">
						<div className="flex justify-between">
							<span className="font-semibold">총 소요 시간:</span>
							<span>{timeUnit === 'day' ? `${timeValue}일 (${convertToHours()}시간)` : `${timeValue}시간`}</span>
						</div>
						<div className="flex justify-between mt-2">
							<span className="font-semibold">총 가격:</span>
							<span className="text-xl font-bold text-blue-600">{calculateTotalPrice().toLocaleString()}원</span>
						</div>
					</div>

					<div className="flex justify-between">
						<Link href={`/tasks/${id}`}>
							<a className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition duration-200">취소</a>
						</Link>
						<button
							type="submit"
							disabled={submitting}
							className={`px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200 ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}>
							{submitting ? '저장 중...' : '업무 수정하기'}
						</button>
					</div>
				</form>
			</main>
		</>
	);
}

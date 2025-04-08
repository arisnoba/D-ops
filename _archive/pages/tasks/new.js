import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

export default function NewTask() {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [clients, setClients] = useState([]);
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [clientId, setClientId] = useState('');
	const [category, setCategory] = useState('design'); // design, development, operation
	const [timeValue, setTimeValue] = useState('');
	const [timeUnit, setTimeUnit] = useState('hour'); // hour, day
	const [pricePerHour, setPricePerHour] = useState('');
	const [error, setError] = useState(null);

	const categories = [
		{ id: 'design', name: '디자인', defaultPrice: 50000 },
		{ id: 'development', name: '개발', defaultPrice: 50000 },
		{ id: 'operation', name: '운영', defaultPrice: 25000 },
	];

	useEffect(() => {
		fetchClients();
	}, []);

	useEffect(() => {
		// 카테고리가 변경되면 기본 단가로 설정
		const categoryInfo = categories.find(cat => cat.id === category);
		if (categoryInfo) {
			setPricePerHour(categoryInfo.defaultPrice);
		}
	}, [category]);

	async function fetchClients() {
		try {
			const { data, error } = await supabase.from('clients').select('id, name').order('name', { ascending: true });

			if (error) throw error;
			if (data) {
				setClients(data);
				if (data.length > 0) {
					setClientId(data[0].id);
				}
			}
		} catch (error) {
			console.error('Error fetching clients:', error.message);
		}
	}

	// 시간을 시간 단위로 변환 (일 -> 시간)
	const convertToHours = () => {
		if (!timeValue) return 0;
		const value = parseFloat(timeValue);
		return timeUnit === 'day' ? value * 8 : value;
	};

	// 총 가격 계산
	const calculateTotalPrice = () => {
		if (!timeValue || !pricePerHour) return 0;
		const hoursValue = convertToHours();
		return hoursValue * parseFloat(pricePerHour);
	};

	// handleCategoryChange 함수 추가
	const handleCategoryChange = e => {
		const selectedCategory = e.target.value;
		setCategory(selectedCategory);

		const categoryInfo = categories.find(cat => cat.id === selectedCategory);
		if (categoryInfo) {
			setPricePerHour(categoryInfo.defaultPrice);
		}
	};

	async function handleSubmit(e) {
		e.preventDefault();

		if (!title || !category || !timeValue || !pricePerHour || !clientId) {
			setError('필수 항목을 모두 입력해주세요.');
			return;
		}

		try {
			setLoading(true);
			setError(null);

			const hours = convertToHours();
			const totalPrice = calculateTotalPrice();

			const { data, error } = await supabase.from('tasks').insert([
				{
					title,
					description,
					client_id: clientId,
					category,
					hours: hours,
					price_per_hour: parseFloat(pricePerHour),
					price: totalPrice,
					created_at: new Date(),
				},
			]);

			if (error) throw error;

			router.push('/');
		} catch (error) {
			console.error('Error adding task:', error.message);
			setError('업무 등록 중 오류가 발생했습니다.');
		} finally {
			setLoading(false);
		}
	}

	// 시간 단위 포맷 (UI 표시용)
	const formatTimeUnit = (value, unit) => {
		if (!value) return '';

		if (unit === 'day') {
			return `${value}일 (${value * 8}시간)`;
		} else {
			if (value >= 8) {
				const days = Math.floor(value / 8);
				const remainingHours = value % 8;

				if (remainingHours === 0) {
					return `${value}시간 (${days}일)`;
				} else {
					return `${value}시간 (${days}일 ${remainingHours}시간)`;
				}
			} else {
				return `${value}시간`;
			}
		}
	};

	return (
		<>
			<Head>
				<title>새 업무 등록 | D-ops</title>
			</Head>

			<main className="flex-grow container mx-auto py-12 px-4">
				<h1 className="text-3xl font-bold mb-8">새 업무 등록</h1>

				<form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto">
					{error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

					<div className="mb-6">
						<label className="block text-gray-700 font-semibold mb-2" htmlFor="clientId">
							클라이언트 *
						</label>
						{clients.length === 0 ? (
							<div>
								<p className="text-red-500 mb-2">등록된 클라이언트가 없습니다.</p>
								<a href="/clients/new" className="text-blue-500 hover:text-blue-700" target="_blank" rel="noopener noreferrer">
									+ 새 클라이언트 등록하기
								</a>
							</div>
						) : (
							<select
								id="clientId"
								value={clientId}
								onChange={e => setClientId(e.target.value)}
								className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
								required>
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
						<label className="block text-gray-700 font-semibold mb-2">업무 카테고리 및 시간당 단가 *</label>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
							{categories.map(cat => (
								<label
									key={cat.id}
									className={`flex flex-col border rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-all ${
										category === cat.id ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50' : ''
									}`}>
									<div className="flex items-center">
										<input type="radio" name="category" value={cat.id} checked={category === cat.id} onChange={handleCategoryChange} className="form-radio h-4 w-4 text-blue-600" />
										<span className="ml-2 text-gray-700 font-medium">{cat.name}</span>
									</div>
									<div className="mt-1 ml-6 text-sm font-medium text-blue-600">{cat.defaultPrice.toLocaleString()}원/시간</div>
								</label>
							))}
						</div>
					</div>

					<div className="mb-6">
						<label className="block text-gray-700 font-semibold mb-2">소요 시간 *</label>
						<div className="flex space-x-3 items-center">
							<div className="flex-1">
								<input
									id="timeValue"
									type="number"
									min="0.5"
									step="0.5"
									value={timeValue}
									onChange={e => setTimeValue(e.target.value)}
									className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
									required
									placeholder="예: 2.5"
								/>
							</div>
							<div className="flex items-center space-x-3 whitespace-nowrap">
								<label className="inline-flex items-center">
									<input type="radio" className="form-radio h-4 w-4 text-blue-600" name="timeUnit" value="hour" checked={timeUnit === 'hour'} onChange={e => setTimeUnit(e.target.value)} />
									<span className="ml-1 text-sm">시간</span>
								</label>
								<label className="inline-flex items-center">
									<input type="radio" className="form-radio h-4 w-4 text-blue-600" name="timeUnit" value="day" checked={timeUnit === 'day'} onChange={e => setTimeUnit(e.target.value)} />
									<span className="ml-1 text-sm">일</span>
								</label>
							</div>
						</div>
						{timeValue && <div className="mt-1 text-sm text-gray-600">{formatTimeUnit(timeValue, timeUnit)}</div>}
					</div>

					<div className="mb-6">
						<label className="block text-gray-700 font-semibold mb-2" htmlFor="pricePerHour">
							시간당 단가 (원) *
						</label>
						<div className="relative">
							<input
								id="pricePerHour"
								type="number"
								value={pricePerHour}
								onChange={e => setPricePerHour(e.target.value)}
								className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
								required
							/>
							{category && (
								<p className="text-xs text-gray-500 mt-1">
									선택한 카테고리({categories.find(c => c.id === category)?.name})의 기본 단가: {categories.find(c => c.id === category)?.defaultPrice.toLocaleString()}원
								</p>
							)}
						</div>
					</div>

					<div className="mb-6 bg-blue-50 p-4 rounded-lg">
						<div className="flex justify-between items-center">
							<span className="font-semibold">총 가격:</span>
							<span className="text-xl font-bold text-blue-600">{calculateTotalPrice().toLocaleString()}원</span>
						</div>
						<div className="text-sm text-gray-600 mt-2">
							{timeValue && pricePerHour ? (
								<>
									{convertToHours().toLocaleString()}시간 × {parseInt(pricePerHour).toLocaleString()}원 = {calculateTotalPrice().toLocaleString()}원
								</>
							) : (
								'시간과 단가를 입력하면 총 가격이 계산됩니다.'
							)}
						</div>
					</div>

					<div className="flex justify-between">
						<Link href="/">
							<a className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition duration-200">취소</a>
						</Link>
						<button
							type="submit"
							disabled={loading}
							className={`px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}>
							{loading ? '등록 중...' : '업무 등록하기'}
						</button>
					</div>
				</form>
			</main>
		</>
	);
}

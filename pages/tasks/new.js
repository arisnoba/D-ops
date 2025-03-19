import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase } from '../../lib/supabase';

export default function NewTask() {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [clients, setClients] = useState([]);
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [clientId, setClientId] = useState('');
	const [category, setCategory] = useState('design'); // design, development, operation
	const [hours, setHours] = useState('');
	const [pricePerHour, setPricePerHour] = useState('');
	const [error, setError] = useState(null);

	const categories = [
		{ id: 'design', name: '디자인', defaultPrice: 50000 },
		{ id: 'development', name: '개발', defaultPrice: 70000 },
		{ id: 'operation', name: '운영', defaultPrice: 40000 },
	];

	useEffect(() => {
		fetchClients();
	}, []);

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

	// 카테고리 변경 시 해당 카테고리의 기본 단가로 업데이트
	const handleCategoryChange = e => {
		const selectedCategory = e.target.value;
		setCategory(selectedCategory);

		const categoryInfo = categories.find(cat => cat.id === selectedCategory);
		if (categoryInfo) {
			setPricePerHour(categoryInfo.defaultPrice);
		}
	};

	// 총 가격 계산
	const calculateTotalPrice = () => {
		if (!hours || !pricePerHour) return 0;
		return parseFloat(hours) * parseFloat(pricePerHour);
	};

	async function handleSubmit(e) {
		e.preventDefault();

		if (!title || !category || !hours || !pricePerHour || !clientId) {
			setError('필수 항목을 모두 입력해주세요.');
			return;
		}

		try {
			setLoading(true);
			setError(null);

			const totalPrice = calculateTotalPrice();

			const { data, error } = await supabase.from('tasks').insert([
				{
					title,
					description,
					client_id: clientId,
					category,
					hours: parseFloat(hours),
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
						<label className="block text-gray-700 font-semibold mb-2" htmlFor="category">
							업무 카테고리 *
						</label>
						<select id="category" value={category} onChange={handleCategoryChange} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
							{categories.map(cat => (
								<option key={cat.id} value={cat.id}>
									{cat.name}
								</option>
							))}
						</select>
					</div>

					<div className="mb-6">
						<label className="block text-gray-700 font-semibold mb-2" htmlFor="hours">
							소요 시간 (시간) *
						</label>
						<input
							id="hours"
							type="number"
							min="0.1"
							step="0.1"
							value={hours}
							onChange={e => setHours(e.target.value)}
							className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							required
						/>
					</div>

					<div className="mb-6">
						<label className="block text-gray-700 font-semibold mb-2" htmlFor="pricePerHour">
							시간당 단가 (원) *
						</label>
						<input
							id="pricePerHour"
							type="number"
							min="1000"
							step="1000"
							value={pricePerHour}
							onChange={e => setPricePerHour(e.target.value)}
							className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							required
						/>
					</div>

					<div className="mb-8 p-4 bg-gray-100 rounded-lg">
						<h3 className="font-semibold mb-2">총 가격</h3>
						<p className="text-2xl font-bold text-blue-600">{calculateTotalPrice().toLocaleString()}원</p>
					</div>

					<div className="flex justify-between">
						<button type="button" onClick={() => router.push('/')} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition duration-200">
							취소
						</button>
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

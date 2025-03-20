import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function TaskForm({ onSuccess, onCancel, onClientRequired }) {
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

			// 폼 초기화
			setTitle('');
			setDescription('');
			setTimeValue('');

			// 성공 콜백 호출
			if (onSuccess) {
				onSuccess(data[0]);
			}
		} catch (error) {
			console.error('Error adding task:', error.message);
			setError('업무 등록 중 오류가 발생했습니다.');
		} finally {
			setLoading(false);
		}
	}

	return (
		<form onSubmit={handleSubmit}>
			{error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

			<div className="mb-6">
				<label className="block text-gray-700 font-semibold mb-2" htmlFor="clientId">
					클라이언트 *
				</label>
				{clients.length === 0 ? (
					<div>
						<p className="text-red-500 mb-2">등록된 클라이언트가 없습니다.</p>
						<button type="button" onClick={onClientRequired} className="text-blue-500 hover:text-blue-700 font-medium">
							+ 새 클라이언트 등록하기
						</button>
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
				<label className="block text-gray-700 font-semibold mb-2">소요 시간 *</label>
				<div className="grid grid-cols-3 gap-4 items-center">
					<div className="col-span-2">
						<input
							id="timeValue"
							type="number"
							min="0.1"
							step="0.1"
							value={timeValue}
							onChange={e => setTimeValue(e.target.value)}
							className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							required
							placeholder="예: 2.5"
						/>
					</div>
					<div className="flex items-center space-x-4">
						<label className="inline-flex items-center">
							<input type="radio" className="form-radio h-4 w-4 text-blue-600" name="timeUnit" value="hour" checked={timeUnit === 'hour'} onChange={e => setTimeUnit(e.target.value)} />
							<span className="ml-2">시간</span>
						</label>
						<label className="inline-flex items-center">
							<input type="radio" className="form-radio h-4 w-4 text-blue-600" name="timeUnit" value="day" checked={timeUnit === 'day'} onChange={e => setTimeUnit(e.target.value)} />
							<span className="ml-2">일</span>
						</label>
					</div>
				</div>
				<p className="text-xs text-gray-500 mt-1">{timeUnit === 'day' ? '1일 = 8시간으로 계산됩니다.' : ''}</p>
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
				<p className="text-xs text-gray-600 mt-1">
					{timeUnit === 'day'
						? `${timeValue || 0}일 x 8시간 x ${pricePerHour ? pricePerHour.toLocaleString() : 0}원`
						: `${timeValue || 0}시간 x ${pricePerHour ? pricePerHour.toLocaleString() : 0}원`}
				</p>
			</div>

			<div className="flex justify-between">
				<button type="button" onClick={onCancel} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition duration-200">
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
	);
}

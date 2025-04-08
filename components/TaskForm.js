import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function TaskForm({ onSuccess, onCancel, onClientRequired }) {
	const [loading, setLoading] = useState(false);
	const [clients, setClients] = useState([]);
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [clientId, setClientId] = useState('');
	const [manager, setManager] = useState('');
	const [category, setCategory] = useState('');
	const [timeValue, setTimeValue] = useState('');
	const [timeUnit, setTimeUnit] = useState('hour'); // hour, day
	const [pricePerHour, setPricePerHour] = useState('');
	const [taskDate, setTaskDate] = useState(new Date().toISOString().split('T')[0]);
	const [error, setError] = useState(null);

	const categories = [
		{ id: 'design', name: '디자인', defaultPrice: 3 },
		{ id: 'development', name: '개발', defaultPrice: 5 },
		{ id: 'operation', name: '운영', defaultPrice: 2.5 },
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
		// 단가는 만원 단위이므로 10000을 곱해서 원 단위로 변환
		return hours * parseFloat(pricePerHour) * 10000;
	};

	async function handleSubmit(e) {
		e.preventDefault();

		// 기본 필수 필드 검증
		if (!title || !category || !timeValue || !pricePerHour || !clientId) {
			setError('필수 항목을 모두 입력해주세요.');
			return;
		}

		// 추가 입력 유효성 검사
		if (title.length < 2 || title.length > 200) {
			setError('업무 제목은 2자 이상 200자 이하로 입력해주세요.');
			return;
		}

		if (description && description.length > 1000) {
			setError('업무 설명은 1000자 이하로 입력해주세요.');
			return;
		}

		const timeValueNum = parseFloat(timeValue);
		if (isNaN(timeValueNum) || timeValueNum <= 0 || timeValueNum > 999) {
			setError('유효한 시간을 입력해주세요 (0보다 크고 999 이하).');
			return;
		}

		const pricePerHourNum = parseFloat(pricePerHour);
		if (isNaN(pricePerHourNum) || pricePerHourNum <= 0 || pricePerHourNum > 1000000) {
			setError('유효한 시간당 단가를 입력해주세요 (0보다 크고 1,000,000 이하).');
			return;
		}

		try {
			setLoading(true);
			setError(null);

			const hours = convertToHours();
			const totalPrice = calculateTotalPrice();

			// 클라이언트 ID 숫자 형식으로 변환 및 검증
			const clientIdNum = parseInt(clientId);
			if (isNaN(clientIdNum)) {
				throw new Error('유효하지 않은 클라이언트 ID입니다.');
			}

			const sanitizedData = {
				title: title.trim(),
				description: description ? description.trim() : '',
				client_id: clientIdNum,
				manager: manager.trim(),
				category,
				hours: parseFloat(hours.toFixed(2)),
				price_per_hour: parseFloat((parseFloat(pricePerHour) * 10000).toFixed(0)), // 데이터베이스에는 원 단위로 저장
				price: parseInt(totalPrice),
				task_date: taskDate,
				created_at: new Date(),
			};

			const { data, error } = await supabase.from('tasks').insert([sanitizedData]);

			if (error) throw error;

			// 폼 초기화
			setTitle('');
			setDescription('');
			setTimeValue('');
			setManager('');
			setTaskDate(new Date().toISOString().split('T')[0]);

			// 성공 콜백 호출
			if (onSuccess) {
				onSuccess(data[0]);
			}
		} catch (error) {
			console.error('Error adding task:', error.message);
			setError('업무 등록 중 오류가 발생했습니다: ' + error.message);
		} finally {
			setLoading(false);
		}
	}

	return (
		<form onSubmit={handleSubmit}>
			{error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
				<div>
					<label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2" htmlFor="clientId">
						클라이언트 *
					</label>
					{clients.length === 0 ? (
						<div>
							<p className="text-red-500 mb-2">등록된 클라이언트가 없습니다.</p>
							<button type="button" onClick={onClientRequired} className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
								+ 새 클라이언트 등록하기
							</button>
						</div>
					) : (
						<select
							id="clientId"
							value={clientId}
							onChange={e => setClientId(e.target.value)}
							className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-bg dark:border-dark-border dark:text-gray-200"
							required>
							<option value="">선택해주세요</option>
							{clients.map(client => (
								<option key={client.id} value={client.id}>
									{client.name}
								</option>
							))}
						</select>
					)}
				</div>

				<div>
					<label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2" htmlFor="manager">
						담당자
					</label>
					<input
						id="manager"
						type="text"
						value={manager}
						onChange={e => setManager(e.target.value)}
						className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-bg dark:border-dark-border dark:text-gray-200"
						placeholder="담당자 이름"
					/>
				</div>
			</div>

			<div className="mb-6">
				<label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">업무 카테고리 및 시간당 단가 *</label>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					{categories.map(cat => (
						<label
							key={cat.id}
							className={`flex flex-col border dark:border-dark-border rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-border/40 transition-all ${
								category === cat.id ? 'ring-2 ring-blue-500 border-blue-500 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
							}`}>
							<div className="flex items-center">
								<input type="radio" name="category" value={cat.id} checked={category === cat.id} onChange={handleCategoryChange} className="form-radio h-4 w-4 text-blue-600" required />
								<span className="ml-2 text-gray-700 dark:text-gray-200 font-medium">{cat.name}</span>
							</div>
							<div className="mt-2 ml-6 text-sm font-medium text-blue-600 dark:text-blue-400">{cat.defaultPrice} 만원/시간</div>
						</label>
					))}
				</div>
			</div>

			<div className="mb-2">
				<input
					id="title"
					type="text"
					value={title}
					onChange={e => setTitle(e.target.value)}
					className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-bg dark:border-dark-border dark:text-gray-200"
					required
					placeholder="(필수) 업무 제목을 입력해주세요."
				/>
			</div>

			<div className="mb-6">
				<textarea
					id="description"
					value={description}
					onChange={e => setDescription(e.target.value)}
					className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-bg dark:border-dark-border dark:text-gray-200"
					rows="5"
					placeholder={`업무 설명을 입력해주세요.\n \n$ 중요하거나 업무 비중이 높은(돈되는) 업무는 앞에 '$'표기를 해서 표기\n$$ 존나 중요한 업무\n- 일반 업무는 '-' 표기로 구분해주세요.`}
				/>
			</div>

			<div className="mb-6">
				<label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">소요 시간 *</label>
				<div className="grid grid-cols-3 gap-4 items-center">
					<div className="col-span-2">
						<input
							id="timeValue"
							type="number"
							min="0.1"
							step="0.1"
							value={timeValue}
							onChange={e => setTimeValue(e.target.value)}
							className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-bg dark:border-dark-border dark:text-gray-200"
							required
							placeholder="예: 2.5"
						/>
					</div>
					<div className="flex items-center space-x-4">
						<label className="inline-flex items-center">
							<input type="radio" className="form-radio h-4 w-4 text-blue-600" name="timeUnit" value="hour" checked={timeUnit === 'hour'} onChange={e => setTimeUnit(e.target.value)} />
							<span className="ml-2 dark:text-gray-200">시간</span>
						</label>
						<label className="inline-flex items-center">
							<input type="radio" className="form-radio h-4 w-4 text-blue-600" name="timeUnit" value="day" checked={timeUnit === 'day'} onChange={e => setTimeUnit(e.target.value)} />
							<span className="ml-2 dark:text-gray-200">일</span>
						</label>
					</div>
				</div>
				<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{timeUnit === 'day' ? '1일 = 8시간으로 계산됩니다.' : ''}</p>
			</div>

			<div className="mb-6">
				<label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2" htmlFor="pricePerHour">
					시간당 단가 (만원) *
				</label>
				<div className="relative">
					<input
						id="pricePerHour"
						type="number"
						min="0.1"
						step="0.1"
						value={pricePerHour}
						onChange={e => setPricePerHour(e.target.value)}
						className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-bg dark:border-dark-border dark:text-gray-200"
						required
						placeholder="예: 5.5"
					/>
					{category && (
						<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
							선택한 카테고리({categories.find(c => c.id === category)?.name})의 기본 단가: {categories.find(c => c.id === category)?.defaultPrice} 만원
						</p>
					)}
				</div>
			</div>

			<div className="mb-6">
				<label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2" htmlFor="taskDate">
					날짜
				</label>
				<div className="relative">
					<input
						id="taskDate"
						type="date"
						value={taskDate}
						onChange={e => setTaskDate(e.target.value)}
						className="appearance-none w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-bg dark:border-dark-border dark:text-gray-200 [&::-webkit-calendar-picker-indicator]:opacity-0"
						onClick={e => e.target.showPicker()}
					/>
					<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
						<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
						</svg>
					</div>
				</div>
			</div>

			<div className="mb-8 p-4 bg-gray-100 dark:bg-dark-bg/60 rounded-lg">
				<h3 className="font-semibold mb-2 dark:text-gray-200">총 가격</h3>
				<p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{calculateTotalPrice().toLocaleString()}원</p>
				<p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
					{timeUnit === 'day' ? `${timeValue || 0}일 x 8시간 x ${pricePerHour || 0}만원` : `${timeValue || 0}시간 x ${pricePerHour || 0}만원`}
				</p>
			</div>

			<div className="flex justify-between">
				<button
					type="button"
					onClick={onCancel}
					className="px-6 py-2 border border-gray-300 dark:border-dark-border rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-border/40 transition duration-200">
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

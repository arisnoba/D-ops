import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Drawer from './Drawer';

export default function TaskEditDrawer({ isOpen, onClose, taskId, onSuccess }) {
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
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
		{ id: 'design', name: '디자인', defaultPrice: 3, color: 'text-purple-400' },
		{ id: 'development', name: '개발', defaultPrice: 5, color: 'text-green-400' },
		{ id: 'operation', name: '운영', defaultPrice: 2.5, color: 'text-blue-400' },
	];

	// 드로어가 열리면 데이터 로드
	useEffect(() => {
		if (isOpen && taskId) {
			fetchClients();
			fetchTask();
		}
	}, [isOpen, taskId]);

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

	async function fetchTask() {
		try {
			setLoading(true);
			setError(null);

			const { data, error } = await supabase.from('tasks').select('*').eq('id', taskId).single();

			if (error) throw error;

			if (data) {
				setTitle(data.title);
				setDescription(data.description || '');
				setClientId(data.client_id);
				setManager(data.manager || '');
				setCategory(data.category);
				setTaskDate(data.task_date || new Date().toISOString().split('T')[0]);

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

				// 단가는 DB에 원 단위로 저장되어 있으므로 만원 단위로 변환
				setPricePerHour((data.price_per_hour / 10000).toString());
			}
		} catch (error) {
			console.error('Error fetching task:', error.message);
			setError('업무를 불러오는 중 오류가 발생했습니다.');
		} finally {
			setLoading(false);
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
			setSubmitting(true);
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
			};

			const { data, error } = await supabase.from('tasks').update(sanitizedData).eq('id', taskId);

			if (error) throw error;

			// 성공 콜백 호출
			if (onSuccess) {
				onSuccess();
			}

			// tasks 페이지에서 업데이트 이벤트 발생
			window.dispatchEvent(new CustomEvent('updateTasks'));

			// 드로어 닫기
			onClose();
		} catch (error) {
			console.error('Error updating task:', error.message);
			setError('업무 수정 중 오류가 발생했습니다: ' + error.message);
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<Drawer isOpen={isOpen} onClose={onClose} title="업무 수정">
			{loading ? (
				<div className="py-8 text-center">
					<p className="text-gray-500">로딩 중...</p>
				</div>
			) : (
				<form onSubmit={handleSubmit}>
					{error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

					<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
						<div>
							<label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2" htmlFor="clientId">
								클라이언트 *
							</label>
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
						<div id="selectCategory" className="grid grid-flow-col auto-cols-fr items-center self-stretch rounded-lg bg-neutral-800 p-1 mb-4">
							<button
								type="button"
								onClick={() => handleCategoryChange({ target: { value: 'operation' } })}
								className={`flex items-center justify-center gap-2 rounded-lg bg-clip-border duration-200 ease-out border-none text-white px-3 h-10 ${
									category === 'operation' ? 'bg-neutral-950' : 'hover:bg-neutral-900'
								}`}>
								<div className="flex items-center gap-2">
									<span className="text-blue-400">
										<i className="fa-duotone fa-clipboard-list"></i>
									</span>
									<p>운영</p>
								</div>
							</button>
							<button
								type="button"
								onClick={() => handleCategoryChange({ target: { value: 'design' } })}
								className={`flex items-center justify-center gap-2 rounded-lg bg-clip-border duration-200 ease-out border-none text-white px-3 h-10 ${
									category === 'design' ? 'bg-neutral-950' : 'hover:bg-neutral-900'
								}`}>
								<div className="flex items-center gap-2">
									<span className="text-purple-400">
										<i className="fa-duotone fa-paint-brush"></i>
									</span>
									<p>디자인</p>
								</div>
							</button>
							<button
								type="button"
								onClick={() => handleCategoryChange({ target: { value: 'development' } })}
								className={`flex items-center justify-center gap-2 rounded-lg bg-clip-border duration-200 ease-out border-none text-white px-3 h-10 ${
									category === 'development' ? 'bg-neutral-950' : 'hover:bg-neutral-900'
								}`}>
								<div className="flex items-center gap-2">
									<span className="text-green-400">
										<i className="fa-duotone fa-code"></i>
									</span>
									<p>개발</p>
								</div>
							</button>
						</div>
					</div>

					<div className="mb-6">
						<label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2" htmlFor="title">
							업무 제목 *
						</label>
						<input
							id="title"
							type="text"
							value={title}
							onChange={e => setTitle(e.target.value)}
							className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-bg dark:border-dark-border dark:text-gray-200"
							required
						/>
					</div>

					<div className="mb-6">
						<label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2" htmlFor="description">
							업무 설명
						</label>
						<textarea
							id="description"
							value={description}
							onChange={e => setDescription(e.target.value)}
							className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-bg dark:border-dark-border dark:text-gray-200"
							rows="4"
						/>
					</div>

					<div className="mb-6">
						<label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">소요 시간 *</label>
						<div className="flex gap-2">
							<div className="w-full">
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
							<div id="selectTimeUnit" className="grid grid-flow-col auto-cols-fr items-center self-stretch rounded-lg bg-neutral-800 p-1 w-full">
								<button
									type="button"
									onClick={() => setTimeUnit('hour')}
									className={`flex items-center justify-center gap-2 rounded-lg bg-clip-border duration-200 ease-out border-none text-white px-3 h-9 ${
										timeUnit === 'hour' ? 'bg-neutral-950' : 'hover:bg-neutral-900'
									}`}>
									<div className="flex items-center gap-2">
										<span className="text-blue-400">
											<i className="fa-duotone fa-clock"></i>
										</span>
										<p>시간</p>
									</div>
								</button>
								<button
									type="button"
									onClick={() => setTimeUnit('day')}
									className={`flex items-center justify-center gap-2 rounded-lg bg-clip-border duration-200 ease-out border-none text-white px-3 h-9 ${
										timeUnit === 'day' ? 'bg-neutral-950' : 'hover:bg-neutral-900'
									}`}>
									<div className="flex items-center gap-2">
										<span className="text-green-400">
											<i className="fa-duotone fa-calendar-day"></i>
										</span>
										<p>일</p>
									</div>
								</button>
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
								<i className="fa-duotone fa-calendar-days"></i>
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
							onClick={onClose}
							className="px-6 py-2 border border-gray-300 dark:border-dark-border rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-border/40 transition duration-200">
							취소
						</button>
						<button
							type="submit"
							disabled={submitting}
							className={`px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200 ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}>
							{submitting ? '저장 중...' : '저장하기'}
						</button>
					</div>
				</form>
			)}
		</Drawer>
	);
}

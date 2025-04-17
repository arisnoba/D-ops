import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Input from './ui/Input';
import Select from './ui/Select';
import Button from './ui/Button';
import RadioGroup from './ui/RadioGroup';
import TextArea from './ui/TextArea';
import Card from './ui/Card';

export default function TaskForm({ onSuccess, onCancel, onClientRequired, initialData }) {
	const [formData, setFormData] = useState({
		title: initialData?.title || '',
		description: initialData?.description || '',
		client_id: initialData?.client_id || '',
		category: initialData?.category || 'operation',
		manager: initialData?.manager || '',
		hours: initialData?.hours || '',
		price_per_hour: initialData?.price_per_hour || '',
		task_date: initialData?.task_date || new Date().toISOString().split('T')[0],
		settlement_status: initialData?.settlement_status || 'pending',
		timeUnit: initialData?.timeUnit || 'hour',
	});

	const [error, setError] = useState(null);
	const [clients, setClients] = useState([]);
	const [loading, setLoading] = useState(false);
	const [defaultPrices, setDefaultPrices] = useState({
		operation: 2.5,
		design: 3,
		development: 5,
	});

	const categories = [
		{ id: 'design', name: '디자인', defaultPrice: 3 },
		{ id: 'development', name: '개발', defaultPrice: 5 },
		{ id: 'operation', name: '운영', defaultPrice: 2.5 },
	];

	useEffect(() => {
		fetchClients();
		fetchDefaultPrices();
	}, []);

	useEffect(() => {
		// 카테고리가 변경될 때마다 해당하는 기본 단가로 설정
		if (!initialData?.price_per_hour) {
			setFormData(prev => ({
				...prev,
				price_per_hour: defaultPrices[prev.category] || '',
			}));
		}
	}, [formData.category, defaultPrices]);

	const fetchDefaultPrices = async () => {
		try {
			const { data, error } = await supabase.from('settings').select('*').single();

			if (error) throw error;

			if (data) {
				const prices = {
					operation: data.operation_price / 10000, // 만원 단위로 변환
					design: data.design_price / 10000,
					development: data.development_price / 10000,
				};
				setDefaultPrices(prices);

				// 초기 로드 시 현재 카테고리에 맞는 단가 설정
				if (!initialData?.price_per_hour) {
					setFormData(prev => ({
						...prev,
						price_per_hour: prices[prev.category] || '',
					}));
				}
			}
		} catch (error) {
			console.error('Error fetching default prices:', error);
		}
	};

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

	// 카테고리 선택 버튼 클릭 핸들러 추가
	const handleCategoryButtonClick = cat => {
		setFormData(prev => ({
			...prev,
			category: cat,
			price_per_hour: defaultPrices[cat] || '',
		}));
	};

	// 시간 값을 시간 단위로 변환
	const convertToHours = () => {
		if (!formData.hours) return 0;
		const value = parseFloat(formData.hours);

		if (formData.timeUnit === 'day') {
			return value * 8; // 1일 = 8시간
		}
		return value;
	};

	// 총 가격 계산
	const calculateTotalPrice = () => {
		const hours = convertToHours();
		if (!hours || !formData.price_per_hour) return 0;
		// 단가는 만원 단위이므로 10000을 곱해서 원 단위로 변환
		return hours * parseFloat(formData.price_per_hour) * 10000;
	};

	async function handleSubmit(e) {
		e.preventDefault();

		// 기본 필수 필드 검증
		if (!formData.title || !formData.category || !formData.hours || !formData.price_per_hour || !formData.client_id) {
			setError('필수 항목을 모두 입력해주세요.');
			return;
		}

		// 추가 입력 유효성 검사
		if (formData.title.length < 2 || formData.title.length > 200) {
			setError('업무 제목은 2자 이상 200자 이하로 입력해주세요.');
			return;
		}

		if (formData.description && formData.description.length > 1000) {
			setError('업무 설명은 1000자 이하로 입력해주세요.');
			return;
		}

		const timeValueNum = parseFloat(formData.hours);
		if (isNaN(timeValueNum) || timeValueNum <= 0 || timeValueNum > 999) {
			setError('유효한 시간을 입력해주세요 (0보다 크고 999 이하).');
			return;
		}

		const pricePerHourNum = parseFloat(formData.price_per_hour);
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
			const clientIdNum = parseInt(formData.client_id);
			if (isNaN(clientIdNum)) {
				throw new Error('유효하지 않은 클라이언트 ID입니다.');
			}

			const sanitizedData = {
				title: formData.title.trim(),
				description: formData.description ? formData.description.trim() : '',
				client_id: clientIdNum,
				manager: formData.manager.trim(),
				category: formData.category,
				hours: parseFloat(hours.toFixed(2)),
				price_per_hour: parseFloat((parseFloat(formData.price_per_hour) * 10000).toFixed(0)), // 데이터베이스에는 원 단위로 저장
				price: parseInt(totalPrice),
				task_date: formData.task_date,
				settlement_status: formData.settlement_status,
				created_at: new Date(),
			};

			const { data, error } = await supabase.from('tasks').insert([sanitizedData]);

			if (error) throw error;

			// 폼 초기화
			setFormData({
				title: '',
				description: '',
				client_id: '',
				manager: '',
				category: 'operation',
				hours: '',
				price_per_hour: '',
				task_date: new Date().toISOString().split('T')[0],
				settlement_status: 'pending',
				timeUnit: 'hour',
			});

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
			{error && (
				<Card variant="subtle" className="border border-red-400 text-red-700 mb-6">
					{error}
				</Card>
			)}

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
				<Select
					id="client"
					value={formData.client_id}
					onChange={e => setFormData(prev => ({ ...prev, client_id: e.target.value }))}
					options={clients.map(client => ({ value: client.id, label: client.name }))}
					placeholder="클라이언트 선택"
					label="클라이언트"
					required
				/>
				<Input id="manager" value={formData.manager} onChange={e => setFormData(prev => ({ ...prev, manager: e.target.value }))} placeholder="시월 담당자, 구분은 콤마로 구분" label="담당자" />
			</div>

			<RadioGroup
				label="업무 카테고리"
				required
				value={formData.category}
				onChange={handleCategoryButtonClick}
				variant="dark"
				className="mb-6"
				options={[
					{
						value: 'operation',
						label: '운영',
						icon: <i className="fa-duotone fa-clipboard-list" />,
						iconClassName: 'text-blue-400',
					},
					{
						value: 'design',
						label: '디자인',
						icon: <i className="fa-duotone fa-paint-brush" />,
						iconClassName: 'text-purple-400',
					},
					{
						value: 'development',
						label: '개발',
						icon: <i className="fa-duotone fa-code" />,
						iconClassName: 'text-green-400',
					},
				]}
			/>

			<Input id="title" value={formData.title} onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))} placeholder="(필수) 업무 제목을 입력해주세요." required className="mb-2" />

			<TextArea
				id="description"
				value={formData.description}
				onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
				placeholder={`업무 설명을 입력해주세요.\n \n$ 중요하거나 업무 비중이 높은(돈되는) 업무는 앞에 '$'표기를 해서 표기\n$$ 존나 중요한 업무\n- 일반 업무는 '-' 표기로 구분해주세요.`}
				rows={6}
				className="mb-6"
			/>

			<div className="mb-6">
				<label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">소요 시간 *</label>
				<div className="flex gap-2">
					<Input id="hours" type="number" min="0.1" step="0.1" value={formData.hours} onChange={e => setFormData(prev => ({ ...prev, hours: e.target.value }))} placeholder="예: 2.5" required />
					<RadioGroup
						value={formData.timeUnit}
						onChange={value => setFormData(prev => ({ ...prev, timeUnit: value }))}
						variant="dark"
						className="flex-shrink-0"
						options={[
							{
								value: 'hour',
								label: '시간',
								icon: <i className="fa-duotone fa-clock" />,
								iconClassName: 'text-blue-400',
							},
							{
								value: 'day',
								label: '일',
								icon: <i className="fa-duotone fa-calendar-day" />,
								iconClassName: 'text-green-400',
							},
						]}
					/>
				</div>
				<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formData.timeUnit === 'day' ? '1일 = 8시간으로 계산됩니다.' : ''}</p>
			</div>

			<Input
				id="pricePerHour"
				type="number"
				min="0.1"
				step="0.1"
				value={formData.price_per_hour}
				onChange={e => setFormData(prev => ({ ...prev, price_per_hour: e.target.value }))}
				placeholder="예: 5.5"
				required
				label="시간당 단가 (만원) *"
				className="mb-6"
			/>

			<Input
				id="taskDate"
				type="date"
				value={formData.task_date}
				onChange={e => setFormData(prev => ({ ...prev, task_date: e.target.value }))}
				label="날짜"
				className="mb-6 [&::-webkit-calendar-picker-indicator]:opacity-0"
				icon={<i className="fa-duotone fa-calendar-days" />}
				onClick={e => e.target.showPicker()}
			/>

			<Card variant="subtle" className="mb-8">
				<h3 className="font-semibold mb-2 dark:text-gray-200">총 가격</h3>
				<p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{calculateTotalPrice().toLocaleString()}원</p>
				<p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
					{formData.timeUnit === 'day' ? `${formData.hours || 0}일 x 8시간 x ${formData.price_per_hour || 0}만원` : `${formData.hours || 0}시간 x ${formData.price_per_hour || 0}만원`}
				</p>
			</Card>

			<div className="flex justify-between">
				<Button variant="secondary" onClick={onCancel}>
					취소
				</Button>
				<Button type="submit" disabled={loading}>
					{loading ? '등록 중...' : '업무 등록하기'}
				</Button>
			</div>
		</form>
	);
}

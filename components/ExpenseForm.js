import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function ExpenseForm({ users, onSubmit, onCancel, initialData }) {
	const [formData, setFormData] = useState({
		date: new Date().toISOString().split('T')[0],
		type: '식대',
		title: '',
		payer: '',
		userAmounts: users.reduce((acc, user) => ({ ...acc, [user]: 0 }), {}),
		total: 0,
	});

	const [isDutchPay, setIsDutchPay] = useState(false);
	const [dutchPayAmount, setDutchPayAmount] = useState('');
	const [dutchPayParticipants, setDutchPayParticipants] = useState(users.reduce((acc, user) => ({ ...acc, [user]: true }), {}));
	const [titleSuggestions, setTitleSuggestions] = useState([]);

	// 초기 데이터 설정
	useEffect(() => {
		if (initialData) {
			setFormData({
				date: initialData.date,
				type: initialData.type,
				title: initialData.title,
				payer: initialData.payer || '',
				userAmounts: initialData.user_amounts,
				total: initialData.total,
			});
		}
	}, [initialData]);

	// 제목 자동완성 데이터 로드
	useEffect(() => {
		const loadTitleSuggestions = async () => {
			try {
				const { data, error } = await supabase.from('expenses').select('title').order('created_at', { ascending: false }).limit(50);

				if (error) throw error;

				const uniqueTitles = [...new Set(data.map(item => item.title))];
				setTitleSuggestions(uniqueTitles.slice(0, 10));
			} catch (error) {
				console.error('제목 자동완성 로드 실패:', error);
			}
		};

		loadTitleSuggestions();
	}, []);

	// 총액 계산
	const calculateTotal = amounts => {
		return Object.values(amounts).reduce((sum, amount) => sum + Number(amount || 0), 0);
	};

	// 사용자 금액 변경 처리
	const handleUserAmountChange = (user, amount) => {
		const newAmounts = { ...formData.userAmounts, [user]: Number(amount || 0) };

		// 결제자가 선택된 경우, 결제자 금액을 다른 금액들의 합의 음수로 설정
		if (formData.payer && formData.payer !== user) {
			const otherUsersTotal = Object.entries(newAmounts)
				.filter(([u]) => u !== formData.payer)
				.reduce((sum, [, amt]) => sum + amt, 0);
			newAmounts[formData.payer] = -otherUsersTotal;
		}

		setFormData(prev => ({
			...prev,
			userAmounts: newAmounts,
			total: calculateTotal(newAmounts),
		}));
	};

	// 결제자 변경 처리
	const handlePayerChange = payer => {
		const newAmounts = { ...formData.userAmounts };

		if (payer) {
			// 결제자 금액을 다른 사용자들 금액의 합의 음수로 설정
			const otherUsersTotal = Object.entries(newAmounts)
				.filter(([user]) => user !== payer)
				.reduce((sum, [, amount]) => sum + Number(amount || 0), 0);
			newAmounts[payer] = -otherUsersTotal;
		}

		setFormData(prev => ({
			...prev,
			payer,
			userAmounts: newAmounts,
			total: calculateTotal(newAmounts),
		}));
	};

	// 더치페이 처리
	const handleDutchPayToggle = () => {
		setIsDutchPay(!isDutchPay);
		if (!isDutchPay) {
			// 더치페이 모드로 전환
			setDutchPayAmount('');
			setDutchPayParticipants(users.reduce((acc, user) => ({ ...acc, [user]: true }), {}));
		}
	};

	// 더치페이 금액 분배
	const applyDutchPay = () => {
		const totalAmount = Number(dutchPayAmount || 0);
		const participants = Object.entries(dutchPayParticipants)
			.filter(([, isParticipant]) => isParticipant)
			.map(([user]) => user);

		if (participants.length === 0) {
			alert('참여자를 선택해주세요.');
			return;
		}

		const amountPerPerson = Math.floor(totalAmount / participants.length);
		const newAmounts = users.reduce((acc, user) => {
			acc[user] = participants.includes(user) ? amountPerPerson : 0;
			return acc;
		}, {});

		// 결제자가 있는 경우: 결제자는 (개별 부담금 - 전체 결제금액)
		if (formData.payer && participants.includes(formData.payer)) {
			newAmounts[formData.payer] = amountPerPerson - totalAmount;
		}

		setFormData(prev => ({
			...prev,
			userAmounts: newAmounts,
			total: calculateTotal(newAmounts),
		}));
	};

	// 폼 제출
	const handleSubmit = e => {
		e.preventDefault();

		if (!formData.title.trim()) {
			alert('제목을 입력해주세요.');
			return;
		}

		// 총액이 0이어도 결제자가 지정되어 있으면 허용
		if (formData.total === 0 && !formData.payer) {
			alert('금액을 입력해주세요.');
			return;
		}

		const submitData = {
			date: formData.date,
			type: formData.type,
			title: formData.title.trim(),
			payer: formData.payer || null,
			user_amounts: formData.userAmounts,
			total: formData.total,
		};

		onSubmit(submitData);
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			{/* 기본 정보 */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				<div>
					<label className="block mb-2 text-sm font-medium text-gray-300">날짜</label>
					<input
						type="date"
						value={formData.date}
						onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
						className="px-3 py-2 w-full text-white bg-gray-800 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
						required
					/>
				</div>

				<div>
					<label className="block mb-2 text-sm font-medium text-gray-300">지출 유형</label>
					<div className="flex p-1 space-x-2 bg-gray-100 rounded-lg dark:bg-neutral-800">
						{['식대', '기타'].map(type => (
							<button
								key={type}
								type="button"
								onClick={() => {
									setFormData(prev => ({
										...prev,
										type: type,
									}));
								}}
								className={`px-3 h-10 text-sm font-medium rounded-md transition-colors duration-150 ease-in-out
									${formData.type === type ? 'bg-white dark:bg-neutral-950 shadow text-gray-900 dark:text-white w-full' : 'w-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
								{type}
							</button>
						))}
					</div>
				</div>
			</div>

			{/* 제목 */}
			<div>
				<label className="block mb-2 text-sm font-medium text-gray-300">제목</label>
				<input
					type="text"
					value={formData.title}
					onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
					list="title-suggestions"
					className="px-3 py-2 w-full text-white bg-gray-800 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
					placeholder="지출 제목을 입력하세요"
					required
				/>
				<datalist id="title-suggestions">
					{titleSuggestions.map((title, index) => (
						<option key={index} value={title} />
					))}
				</datalist>
			</div>

			{/* 결제자 선택 */}
			<div>
				<label className="block mb-2 text-sm font-medium text-gray-300">결제자 (선택사항)</label>
				<select
					value={formData.payer}
					onChange={e => handlePayerChange(e.target.value)}
					className="px-3 py-2 w-full text-white bg-gray-800 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500">
					<option value="">결제자 없음</option>
					{users.map(user => (
						<option key={user} value={user}>
							{user}
						</option>
					))}
				</select>
			</div>

			{/* 더치페이 토글 */}
			<div className="flex items-center space-x-4">
				<label className="flex items-center">
					<input type="checkbox" checked={isDutchPay} onChange={handleDutchPayToggle} className="mr-2" />
					<span className="text-white">더치페이 모드</span>
				</label>
			</div>

			{/* 더치페이 설정 */}
			{isDutchPay && (
				<div className="p-4 space-y-4 bg-gray-800 rounded-lg">
					<div>
						<label className="block mb-2 text-sm font-medium text-gray-300">총 금액</label>
						<input
							type="number"
							value={dutchPayAmount}
							onChange={e => setDutchPayAmount(e.target.value)}
							className="px-3 py-2 w-full text-white bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
							placeholder="총 금액을 입력하세요"
						/>
					</div>

					<div>
						<label className="block mb-2 text-sm font-medium text-gray-300">참여자 선택</label>
						<div className="grid grid-cols-2 gap-2 md:grid-cols-3">
							{users.map(user => (
								<label key={user} className="flex items-center">
									<input
										type="checkbox"
										checked={dutchPayParticipants[user]}
										onChange={e =>
											setDutchPayParticipants(prev => ({
												...prev,
												[user]: e.target.checked,
											}))
										}
										className="mr-2"
									/>
									<span className="text-white">{user}</span>
								</label>
							))}
						</div>
					</div>

					<button type="button" onClick={applyDutchPay} className="px-4 py-2 text-white bg-blue-600 rounded-lg transition-colors hover:bg-blue-700">
						금액 분배 적용
					</button>
				</div>
			)}

			{/* 사용자별 금액 입력 */}
			<div>
				<label className="block mb-2 text-sm font-medium text-gray-300">사용자별 금액</label>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					{users.map(user => (
						<div key={user}>
							<label className="block mb-1 text-sm text-gray-400">
								{user} {formData.payer === user && '(결제자)'}
							</label>
							<input
								type="number"
								value={formData.userAmounts[user] || ''}
								onChange={e => handleUserAmountChange(user, e.target.value)}
								disabled={formData.payer === user}
								className={`w-full px-3 py-2 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 ${
									formData.payer === user ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gray-800 text-white'
								}`}
								placeholder="0"
							/>
						</div>
					))}
				</div>
			</div>

			{/* 총액 표시 */}
			<div className="p-4 bg-gray-800 rounded-lg">
				<div className="text-center">
					<div className="text-sm text-gray-400">총액</div>
					<div className="text-2xl font-bold text-white">{formData.total.toLocaleString()}원</div>
				</div>
			</div>

			{/* 버튼 */}
			<div className="flex justify-end space-x-3">
				<button type="button" onClick={onCancel} className="px-6 py-2 text-white bg-gray-600 rounded-lg transition-colors hover:bg-gray-700">
					취소
				</button>
				<button type="submit" className="px-6 py-2 text-white bg-blue-600 rounded-lg transition-colors hover:bg-blue-700">
					{initialData ? '수정' : '추가'}
				</button>
			</div>
		</form>
	);
}

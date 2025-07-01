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
	const [birthdaySettings, setBirthdaySettings] = useState([]);
	const [selectedBirthdayUser, setSelectedBirthdayUser] = useState('');

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

	// 생일 설정 로드
	useEffect(() => {
		const loadBirthdaySettings = async () => {
			try {
				const { data, error } = await supabase.from('birthday_settings').select('*').order('user_name');
				if (error) throw error;
				setBirthdaySettings(data || []);
			} catch (error) {
				console.error('생일 설정 로드 실패:', error);
			}
		};

		loadBirthdaySettings();
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
		const amount = Number(dutchPayAmount || 0);
		const participants = Object.entries(dutchPayParticipants)
			.filter(([, isParticipant]) => isParticipant)
			.map(([user]) => user);

		if (participants.length === 0) {
			alert('참여자를 선택해주세요.');
			return;
		}

		const amountPerPerson = Math.floor(amount / participants.length);
		const newAmounts = users.reduce((acc, user) => {
			acc[user] = participants.includes(user) ? amountPerPerson : 0;
			return acc;
		}, {});

		setFormData(prev => ({
			...prev,
			userAmounts: newAmounts,
			total: calculateTotal(newAmounts),
		}));
	};

	// 생일 축하금 적용 (새로운 로직: 생일자는 총액을 받고, 나머지가 나눠서 지불)
	const applyBirthdayAmount = () => {
		if (!selectedBirthdayUser) {
			alert('생일자를 선택해주세요.');
			return;
		}

		const birthdaySetting = birthdaySettings.find(setting => setting.user_name === selectedBirthdayUser);
		if (!birthdaySetting) {
			alert('선택한 사용자의 생일 설정을 찾을 수 없습니다.');
			return;
		}

		const totalAmount = birthdaySetting.amount; // 생일자가 받을 총 축하금
		const otherUsers = users.filter(user => user !== selectedBirthdayUser);
		const amountPerPerson = Math.round(totalAmount / otherUsers.length); // 나머지가 나눠서 낼 금액

		const newAmounts = users.reduce((acc, user) => {
			if (user === selectedBirthdayUser) {
				acc[user] = -totalAmount; // 생일자는 받는 금액 (음수)
			} else {
				acc[user] = amountPerPerson; // 나머지는 나눠서 내는 금액
			}
			return acc;
		}, {});

		// 제목도 자동으로 설정
		const birthdayTitle = `${selectedBirthdayUser} 생일 축하금`;

		setFormData(prev => ({
			...prev,
			title: birthdayTitle,
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

		if (formData.total === 0) {
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
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label className="block text-sm font-medium text-gray-300 mb-2">날짜</label>
					<input
						type="date"
						value={formData.date}
						onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
						className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
						required
					/>
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-300 mb-2">지출 유형</label>
					<div className="flex space-x-4">
						{['식대', '기타', '생일'].map(type => (
							<label key={type} className="flex items-center">
								<input
									type="radio"
									name="type"
									value={type}
									checked={formData.type === type}
									onChange={e => {
										const newType = e.target.value;
										setFormData(prev => ({
											...prev,
											type: newType,
											// 생일 타입 선택 시 결제자 초기화
											payer: newType === '생일' ? '' : prev.payer,
										}));
										// 생일 타입 변경 시 더치페이 모드도 초기화
										if (newType === '생일') {
											setIsDutchPay(false);
											setSelectedBirthdayUser('');
										}
									}}
									className="mr-2"
								/>
								<span className="text-white">{type}</span>
							</label>
						))}
					</div>
				</div>
			</div>

			{/* 제목 */}
			<div>
				<label className="block text-sm font-medium text-gray-300 mb-2">제목</label>
				<input
					type="text"
					value={formData.title}
					onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
					list="title-suggestions"
					className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
					placeholder="지출 제목을 입력하세요"
					required
				/>
				<datalist id="title-suggestions">
					{titleSuggestions.map((title, index) => (
						<option key={index} value={title} />
					))}
				</datalist>
			</div>

			{/* 결제자 선택 (생일 타입이 아닌 경우만) */}
			{formData.type !== '생일' && (
				<div>
					<label className="block text-sm font-medium text-gray-300 mb-2">결제자 (선택사항)</label>
					<select
						value={formData.payer}
						onChange={e => handlePayerChange(e.target.value)}
						className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500">
						<option value="">결제자 없음</option>
						{users.map(user => (
							<option key={user} value={user}>
								{user}
							</option>
						))}
					</select>
				</div>
			)}

			{/* 더치페이 토글 (생일 타입이 아닌 경우만) */}
			{formData.type !== '생일' && (
				<div className="flex items-center space-x-4">
					<label className="flex items-center">
						<input type="checkbox" checked={isDutchPay} onChange={handleDutchPayToggle} className="mr-2" />
						<span className="text-white">더치페이 모드</span>
					</label>
				</div>
			)}

			{/* 생일 축하금 설정 */}
			{formData.type === '생일' && (
				<div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-4 space-y-4">
					<div className="text-purple-400 text-sm font-medium">생일 축하금 설정</div>
					<div>
						<label className="block text-sm font-medium text-gray-300 mb-2">생일자 선택</label>
						<select
							value={selectedBirthdayUser}
							onChange={e => setSelectedBirthdayUser(e.target.value)}
							className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:border-purple-500">
							<option value="">생일자를 선택하세요</option>
							{users.map(user => {
								const setting = birthdaySettings.find(s => s.user_name === user);
								return (
									<option key={user} value={user}>
										{user} {setting ? `(${setting.amount.toLocaleString()}원)` : '(설정 없음)'}
									</option>
								);
							})}
						</select>
					</div>
					{selectedBirthdayUser && (
						<div className="space-y-2">
							{(() => {
								const setting = birthdaySettings.find(s => s.user_name === selectedBirthdayUser);
								if (!setting) return <div className="text-red-400 text-sm">선택한 사용자의 생일 설정이 없습니다.</div>;

								const totalAmount = setting.amount;
								const otherUsers = users.filter(user => user !== selectedBirthdayUser);
								const amountPerPerson = Math.round(totalAmount / otherUsers.length);

								return (
									<div className="text-sm text-gray-400">
										<div>• 총 축하금: {totalAmount.toLocaleString()}원</div>
										<div>
											• 개별 분담: {amountPerPerson.toLocaleString()}원 × {otherUsers.length}명
										</div>
										<div>
											• {selectedBirthdayUser}: -{totalAmount.toLocaleString()}원 (받음)
										</div>
										<div>• 나머지: 각각 +{amountPerPerson.toLocaleString()}원</div>
									</div>
								);
							})()}
						</div>
					)}
					<button
						type="button"
						onClick={applyBirthdayAmount}
						disabled={!selectedBirthdayUser}
						className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
						생일 축하금 적용
					</button>
				</div>
			)}

			{/* 더치페이 설정 */}
			{isDutchPay && formData.type !== '생일' && (
				<div className="bg-gray-800 p-4 rounded-lg space-y-4">
					<div>
						<label className="block text-sm font-medium text-gray-300 mb-2">총 금액</label>
						<input
							type="number"
							value={dutchPayAmount}
							onChange={e => setDutchPayAmount(e.target.value)}
							className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
							placeholder="총 금액을 입력하세요"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-300 mb-2">참여자 선택</label>
						<div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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

					<button type="button" onClick={applyDutchPay} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
						금액 분배 적용
					</button>
				</div>
			)}

			{/* 사용자별 금액 입력 */}
			<div>
				<label className="block text-sm font-medium text-gray-300 mb-2">사용자별 금액</label>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{users.map(user => (
						<div key={user}>
							<label className="block text-sm text-gray-400 mb-1">
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
			<div className="bg-gray-800 p-4 rounded-lg">
				<div className="text-center">
					<div className="text-gray-400 text-sm">총액</div>
					<div className="text-2xl font-bold text-white">{formData.total.toLocaleString()}원</div>
				</div>
			</div>

			{/* 버튼 */}
			<div className="flex justify-end space-x-3">
				<button type="button" onClick={onCancel} className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
					취소
				</button>
				<button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
					{initialData ? '수정' : '추가'}
				</button>
			</div>
		</form>
	);
}

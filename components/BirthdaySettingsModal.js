import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Modal from './Modal';

export default function BirthdaySettingsModal({ isOpen, onClose, users }) {
	const [birthdaySettings, setBirthdaySettings] = useState([]);
	const [loading, setLoading] = useState(false);
	const [formData, setFormData] = useState(
		users.reduce(
			(acc, user) => ({
				...acc,
				[user]: {
					birth_month: 1,
					birth_day: 1,
					amount: 240000, // 생일자가 받을 총 축하금으로 변경
				},
			}),
			{}
		)
	);

	// 생일 설정 로드
	const loadBirthdaySettings = async () => {
		setLoading(true);
		try {
			const { data, error } = await supabase.from('birthday_settings').select('*').order('user_name');

			if (error) throw error;

			// 기존 설정을 formData에 반영
			const existingSettings = {};
			users.forEach(user => {
				const existing = data?.find(setting => setting.user_name === user);
				existingSettings[user] = existing
					? {
							birth_month: existing.birth_month,
							birth_day: existing.birth_day,
							amount: existing.amount,
					  }
					: {
							birth_month: 1,
							birth_day: 1,
							amount: 240000, // 기본값도 변경
					  };
			});

			setFormData(existingSettings);
			setBirthdaySettings(data || []);
		} catch (error) {
			console.error('생일 설정 로드 실패:', error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (isOpen) {
			loadBirthdaySettings();
		}
	}, [isOpen]);

	// 월별 일수 계산
	const getDaysInMonth = month => {
		const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
		return daysInMonth[month - 1];
	};

	// 폼 데이터 변경 처리
	const handleFormChange = (user, field, value) => {
		setFormData(prev => ({
			...prev,
			[user]: {
				...prev[user],
				[field]: Number(value),
			},
		}));
	};

	// 설정 저장
	const handleSave = async () => {
		try {
			// 기존 설정 삭제
			await supabase.from('birthday_settings').delete().in('user_name', users);

			// 새 설정 삽입
			const insertData = users.map(user => ({
				user_name: user,
				birth_month: formData[user].birth_month,
				birth_day: formData[user].birth_day,
				amount: formData[user].amount,
			}));

			const { error } = await supabase.from('birthday_settings').insert(insertData);

			if (error) throw error;

			alert('생일 설정이 저장되었습니다.');
			onClose();
		} catch (error) {
			console.error('생일 설정 저장 실패:', error);
			alert('생일 설정 저장에 실패했습니다.');
		}
	};

	// 모든 사용자에게 같은 금액 적용
	const applyAmountToAll = () => {
		const firstUserAmount = formData[users[0]]?.amount || 240000;
		const newFormData = { ...formData };

		users.forEach(user => {
			newFormData[user] = {
				...newFormData[user],
				amount: firstUserAmount,
			};
		});

		setFormData(newFormData);
	};

	// 개별 분담 금액 계산 (생일자 제외한 인원으로 나누기)
	const calculateIndividualAmount = totalAmount => {
		const participantCount = users.length - 1; // 생일자 제외
		return Math.round(totalAmount / participantCount);
	};

	return (
		<Modal isOpen={isOpen} onClose={onClose} title="생일 설정">
			<div className="space-y-6">
				{/* 설명 */}
				<div className="p-4 rounded-lg border bg-blue-900/30 border-blue-500/30">
					<div className="text-sm text-blue-400">
						<div className="mb-2 font-medium">생일 축하금 자동 생성 안내</div>
						<ul className="space-y-1 text-xs">
							<li>• 매월 1일에 해당 월의 생일자가 있는지 자동으로 확인합니다.</li>
							<li>
								• <strong>설정 금액은 생일자가 받을 총 축하금입니다</strong>
							</li>
							<li>• 생일자는 설정된 금액만큼 받습니다 (음수로 표시)</li>
							<li>• 나머지 인원은 총 축하금을 더치페이로 나눠서 지불합니다</li>
							<li>• 예: 총 축하금 240,000원 → 생일자 -240,000원, 나머지 4명이 각각 +60,000원</li>
							<li>• 생성된 생일 축하금은 수정/삭제가 가능합니다</li>
						</ul>
					</div>
				</div>

				{loading ? (
					<div className="text-center text-gray-400">로딩 중...</div>
				) : (
					<div className="space-y-6">
						{/* 공통 금액 설정 */}
						<div className="p-4 bg-gray-800 rounded-lg">
							<div className="flex justify-between items-center mb-4">
								<h4 className="font-medium text-white">생일자가 받을 총 축하금</h4>
								<button onClick={applyAmountToAll} className="px-3 py-1 text-sm text-white bg-blue-600 rounded transition-colors hover:bg-blue-700">
									모든 사용자에게 적용
								</button>
							</div>

							<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
								{users.map(user => {
									const totalAmount = formData[user]?.amount || 240000;
									const individualAmount = calculateIndividualAmount(totalAmount);

									return (
										<div key={user}>
											<label className="block mb-1 text-sm text-gray-400">{user}</label>
											<input
												type="number"
												value={totalAmount}
												onChange={e => handleFormChange(user, 'amount', e.target.value)}
												className="px-3 py-2 mb-2 w-full text-white bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
												min="0"
												step="10000"
											/>
											<div className="text-xs text-gray-500">
												개별 분담: {individualAmount.toLocaleString()}원 × {users.length - 1}명
											</div>
										</div>
									);
								})}
							</div>
						</div>

						{/* 생일 설정 */}
						<div className="p-4 bg-gray-800 rounded-lg">
							<h4 className="mb-4 font-medium text-white">생일 날짜</h4>

							<div className="space-y-4">
								{users.map(user => (
									<div key={user} className="flex items-center space-x-4">
										<div className="w-20 text-sm text-gray-400">{user}</div>

										{/* 월 선택 */}
										<div>
											<select
												value={formData[user]?.birth_month || 1}
												onChange={e => handleFormChange(user, 'birth_month', e.target.value)}
												className="px-3 py-2 text-white bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500">
												{Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
													<option key={month} value={month}>
														{month}월
													</option>
												))}
											</select>
										</div>

										{/* 일 선택 */}
										<div>
											<select
												value={formData[user]?.birth_day || 1}
												onChange={e => handleFormChange(user, 'birth_day', e.target.value)}
												className="px-3 py-2 text-white bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500">
												{Array.from({ length: getDaysInMonth(formData[user]?.birth_month || 1) }, (_, i) => i + 1).map(day => (
													<option key={day} value={day}>
														{day}일
													</option>
												))}
											</select>
										</div>

										{/* 축하금 표시 */}
										<div className="flex-1 text-right">
											<span className="font-medium text-green-400">{(formData[user]?.amount || 240000).toLocaleString()}원</span>
											<div className="mt-1 text-xs text-gray-500">분담: {calculateIndividualAmount(formData[user]?.amount || 240000).toLocaleString()}원씩</div>
										</div>
									</div>
								))}
							</div>
						</div>

						{/* 미리보기 */}
						<div className="p-4 bg-gray-800 rounded-lg">
							<h4 className="mb-4 font-medium text-white">월별 생일 미리보기</h4>

							<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
								{Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
									const monthBirthdays = users.filter(user => formData[user]?.birth_month === month);

									return (
										<div key={month} className="text-center">
											<div className="mb-2 text-sm text-gray-400">{month}월</div>
											{monthBirthdays.length > 0 ? (
												<div className="space-y-1">
													{monthBirthdays.map(user => (
														<div key={user} className="text-sm text-purple-400">
															{user} ({formData[user]?.birth_day}일)
															<div className="text-xs text-gray-500">{(formData[user]?.amount || 240000).toLocaleString()}원</div>
														</div>
													))}
												</div>
											) : (
												<div className="text-sm text-gray-600">-</div>
											)}
										</div>
									);
								})}
							</div>
						</div>

						{/* 저장 버튼 */}
						<div className="flex justify-end space-x-3">
							<button onClick={onClose} className="px-6 py-2 text-white bg-gray-600 rounded-lg transition-colors hover:bg-gray-700">
								취소
							</button>
							<button onClick={handleSave} className="px-6 py-2 text-white bg-blue-600 rounded-lg transition-colors hover:bg-blue-700">
								저장
							</button>
						</div>
					</div>
				)}
			</div>
		</Modal>
	);
}

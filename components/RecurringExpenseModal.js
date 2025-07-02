import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Modal from './Modal';

export default function RecurringExpenseModal({ isOpen, onClose, users, onUpdate }) {
	const [recurringExpenses, setRecurringExpenses] = useState([]);
	const [loading, setLoading] = useState(false);
	const [showForm, setShowForm] = useState(false);
	const [editingExpense, setEditingExpense] = useState(null);
	const [formData, setFormData] = useState({
		title: '',
		payer: '',
		userAmounts: users.reduce((acc, user) => ({ ...acc, [user]: 0 }), {}),
		total: 0,
	});

	// 고정비 목록 로드
	const loadRecurringExpenses = async () => {
		setLoading(true);
		try {
			const { data, error } = await supabase.from('recurring_expenses').select('*').eq('is_active', true).order('created_at', { ascending: false });

			if (error) throw error;
			setRecurringExpenses(data || []);
		} catch (error) {
			console.error('고정비 로드 실패:', error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (isOpen) {
			loadRecurringExpenses();
		}
	}, [isOpen]);

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

	// 폼 초기화
	const resetForm = () => {
		setFormData({
			title: '',
			payer: '',
			userAmounts: users.reduce((acc, user) => ({ ...acc, [user]: 0 }), {}),
			total: 0,
		});
		setEditingExpense(null);
	};

	// 새 고정비 추가/수정
	const handleSubmit = async e => {
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

		try {
			const expenseData = {
				title: formData.title.trim(),
				payer: formData.payer || null,
				user_amounts: formData.userAmounts,
				total: formData.total,
			};

			if (editingExpense) {
				// 수정
				const { error } = await supabase.from('recurring_expenses').update(expenseData).eq('id', editingExpense.id);

				if (error) throw error;
			} else {
				// 새로 추가
				const { error } = await supabase.from('recurring_expenses').insert(expenseData);

				if (error) throw error;
			}

			await loadRecurringExpenses();
			onUpdate(); // 부모 컴포넌트 업데이트
			setShowForm(false);
			resetForm();
		} catch (error) {
			console.error('고정비 저장 실패:', error);
			alert('고정비 저장에 실패했습니다.');
		}
	};

	// 고정비 수정
	const handleEdit = expense => {
		setEditingExpense(expense);
		setFormData({
			title: expense.title,
			payer: expense.payer || '',
			userAmounts: expense.user_amounts,
			total: expense.total,
		});
		setShowForm(true);
	};

	// 고정비 삭제
	const handleDelete = async expenseId => {
		if (!confirm('정말 삭제하시겠습니까?')) return;

		try {
			const { error } = await supabase.from('recurring_expenses').update({ is_active: false }).eq('id', expenseId);

			if (error) throw error;
			await loadRecurringExpenses();
			onUpdate(); // 부모 컴포넌트 업데이트
		} catch (error) {
			console.error('고정비 삭제 실패:', error);
			alert('고정비 삭제에 실패했습니다.');
		}
	};

	// 모달 닫기
	const handleClose = () => {
		setShowForm(false);
		resetForm();
		onClose();
	};

	return (
		<Modal isOpen={isOpen} onClose={handleClose} title="고정비 관리">
			<div className="space-y-6">
				{/* 헤더 */}
				<div className="flex justify-between items-center">
					<h3 className="text-lg font-semibold text-white">등록된 고정비</h3>
					<button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
						고정비 추가
					</button>
				</div>

				{/* 고정비 목록 */}
				{loading ? (
					<div className="text-center text-gray-400">로딩 중...</div>
				) : recurringExpenses.length === 0 ? (
					<div className="text-center text-gray-400 py-8">등록된 고정비가 없습니다.</div>
				) : (
					<div className="space-y-4">
						{recurringExpenses.map(expense => (
							<div key={expense.id} className="bg-gray-800 rounded-lg p-4 border border-gray-600">
								<div className="flex justify-between items-start mb-3">
									<div>
										<h4 className="text-white font-medium">{expense.title}</h4>
										{expense.payer && <div className="text-sm text-blue-400 mt-1">결제자: {expense.payer}</div>}
									</div>
									<div className="flex space-x-2">
										<button onClick={() => handleEdit(expense)} className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
											수정
										</button>
										<button onClick={() => handleDelete(expense.id)} className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors">
											삭제
										</button>
									</div>
								</div>

								{/* 사용자별 금액 */}
								<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-3">
									{users.map(user => {
										const amount = expense.user_amounts[user] || 0;
										const isNegative = amount < 0;
										const isPayer = expense.payer === user;
										return (
											<div key={user} className="text-center">
												<div className="text-gray-400 text-sm">
													{user}
													{isPayer && <span className="text-blue-400 ml-1">(결제자)</span>}
												</div>
												<div className={`font-medium ${isNegative ? 'text-red-400' : 'text-green-400'}`}>{amount.toLocaleString()}원</div>
											</div>
										);
									})}
								</div>

								{/* 총액 */}
								<div className="pt-3 border-t border-gray-700 text-center">
									<div className="text-gray-400 text-sm">총액</div>
									<div className="text-white font-semibold">{expense.total.toLocaleString()}원</div>
								</div>
							</div>
						))}
					</div>
				)}

				{/* 고정비 추가/수정 폼 */}
				{showForm && (
					<div className="bg-gray-800 rounded-lg p-6 border border-gray-600">
						<h4 className="text-white font-medium mb-4">{editingExpense ? '고정비 수정' : '고정비 추가'}</h4>

						<form onSubmit={handleSubmit} className="space-y-4">
							{/* 제목 */}
							<div>
								<label className="block text-sm font-medium text-gray-300 mb-2">제목</label>
								<input
									type="text"
									value={formData.title}
									onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
									className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
									placeholder="고정비 제목을 입력하세요"
									required
								/>
							</div>

							{/* 결제자 선택 */}
							<div>
								<label className="block text-sm font-medium text-gray-300 mb-2">결제자 (선택사항)</label>
								<select
									value={formData.payer}
									onChange={e => handlePayerChange(e.target.value)}
									className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500">
									<option value="">결제자 없음</option>
									{users.map(user => (
										<option key={user} value={user}>
											{user}
										</option>
									))}
								</select>
							</div>

							{/* 사용자별 금액 */}
							<div>
								<label className="block text-sm font-medium text-gray-300 mb-2">사용자별 금액</label>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									{users.map(user => (
										<div key={user}>
											<label className="block text-sm text-gray-400 mb-1">{user}</label>
											<input
												type="number"
												value={formData.userAmounts[user] || ''}
												onChange={e => handleUserAmountChange(user, e.target.value)}
												className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
												placeholder="0"
											/>
										</div>
									))}
								</div>
							</div>

							{/* 총액 표시 */}
							<div className="bg-gray-700 p-4 rounded-lg">
								<div className="text-center">
									<div className="text-gray-400 text-sm">총액</div>
									<div className="text-xl font-bold text-white">{formData.total.toLocaleString()}원</div>
								</div>
							</div>

							{/* 버튼 */}
							<div className="flex justify-end space-x-3">
								<button
									type="button"
									onClick={() => {
										setShowForm(false);
										resetForm();
									}}
									className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
									취소
								</button>
								<button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
									{editingExpense ? '수정' : '추가'}
								</button>
							</div>
						</form>
					</div>
				)}
			</div>
		</Modal>
	);
}

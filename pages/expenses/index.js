import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import Modal from '../../components/Modal';
import ExpenseForm from '../../components/ExpenseForm';
import RecurringExpenseModal from '../../components/RecurringExpenseModal';
import BirthdaySettingsModal from '../../components/BirthdaySettingsModal';

const USERS = ['유재욱', '신성원', '김정현', '김정민', '권순신'];

export default function Expenses() {
	const { user } = useAuth();
	const [expenses, setExpenses] = useState([]);
	const [loading, setLoading] = useState(true);
	const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
	const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth() + 1);
	const [showExpenseForm, setShowExpenseForm] = useState(false);
	const [showRecurringModal, setShowRecurringModal] = useState(false);
	const [showBirthdayModal, setShowBirthdayModal] = useState(false);
	const [editingExpense, setEditingExpense] = useState(null);

	// 지출 내역 로드
	const loadExpenses = async () => {
		try {
			const { data, error } = await supabase.from('expenses').select('*').order('date', { ascending: false }).order('created_at', { ascending: false });

			if (error) throw error;
			setExpenses(data || []);
		} catch (error) {
			console.error('지출 내역 로드 실패:', error);
		}
	};

	useEffect(() => {
		if (user) {
			const initializeData = async () => {
				setLoading(true);
				await loadExpenses();
				setLoading(false);
			};
			initializeData();
		}
	}, [user]);

	// 월별 필터링된 지출 내역
	const filteredExpenses = expenses.filter(expense => {
		const expenseMonth = new Date(expense.date).getMonth() + 1;
		const expenseYear = new Date(expense.date).getFullYear();
		return expenseMonth === selectedMonth && expenseYear === selectedYear;
	});

	// 사용자별 총액 계산
	const userTotals = USERS.reduce((totals, user) => {
		totals[user] = filteredExpenses.reduce((sum, expense) => {
			return sum + (expense.user_amounts[user] || 0);
		}, 0);
		return totals;
	}, {});

	// 전체 총액
	const grandTotal = Object.values(userTotals).reduce((sum, total) => sum + total, 0);

	// 날짜 포맷
	const formatDate = dateString => {
		const date = new Date(dateString);
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${month}.${day}`;
	};

	// 지출 유형별 정렬 우선순위
	const getTypePriority = type => {
		switch (type) {
			case '고정':
				return 1;
			case '생일':
				return 2;
			case '식대':
				return 3;
			case '기타':
				return 4;
			default:
				return 5;
		}
	};

	// 정렬된 지출 목록
	const sortedExpenses = [...filteredExpenses].sort((a, b) => {
		// 먼저 유형별로 정렬
		const typeDiff = getTypePriority(a.type) - getTypePriority(b.type);
		if (typeDiff !== 0) return typeDiff;

		// 같은 유형 내에서는 날짜순 (최신순)
		return new Date(b.date) - new Date(a.date);
	});

	// 지출 유형별 스타일
	const getTypeStyle = type => {
		switch (type) {
			case '고정':
				return 'bg-blue-600 text-white';
			case '생일':
				return 'bg-purple-600 text-white';
			case '식대':
				return 'bg-green-600 text-white';
			case '기타':
				return 'bg-yellow-600 text-white';
			default:
				return 'bg-gray-600 text-white';
		}
	};

	const handleExpenseSubmit = async expenseData => {
		try {
			if (editingExpense) {
				// 수정
				const { error } = await supabase
					.from('expenses')
					.update({
						...expenseData,
						updated_at: new Date().toISOString(),
					})
					.eq('id', editingExpense.id);

				if (error) throw error;
			} else {
				// 새로 추가
				const { error } = await supabase.from('expenses').insert(expenseData);

				if (error) throw error;
			}

			await loadExpenses();
			setShowExpenseForm(false);
			setEditingExpense(null);
		} catch (error) {
			console.error('지출 저장 실패:', error);
			alert('지출 저장에 실패했습니다.');
		}
	};

	const handleExpenseEdit = expense => {
		setEditingExpense(expense);
		setShowExpenseForm(true);
	};

	const handleExpenseDelete = async (expenseId, expenseType) => {
		const confirmMessage = expenseType === '생일' ? '생일 축하금을 삭제하시겠습니까?' : '정말 삭제하시겠습니까?';

		if (!confirm(confirmMessage)) return;

		try {
			const { error } = await supabase.from('expenses').delete().eq('id', expenseId);

			if (error) throw error;
			await loadExpenses();
		} catch (error) {
			console.error('지출 삭제 실패:', error);
			alert('지출 삭제에 실패했습니다.');
		}
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center h-64">
				<div className="text-gray-400">로딩 중...</div>
			</div>
		);
	}

	return (
		<div className="p-6 space-y-6">
			{/* 헤더 */}
			<div className="flex flex-col gap-4 justify-between items-start">
				<div>
					<h1 className="text-2xl font-bold text-white">Bob 지출 관리</h1>
					<p className="mt-1 text-gray-400">공동 지출 내역 관리</p>
				</div>

				{/* 월별 네비게이션 */}
				<div className="flex flex-col gap-4 justify-between items-start w-full sm:flex-row sm:items-center">
					<div className="flex gap-4 items-center">
						<div className="text-lg font-semibold text-white">
							{selectedYear}년 {String(selectedMonth).padStart(2, '0')}월
						</div>
						<div className="flex gap-2">
							<button
								onClick={() => {
									if (selectedMonth === 1) {
										setSelectedYear(selectedYear - 1);
										setSelectedMonth(12);
									} else {
										setSelectedMonth(selectedMonth - 1);
									}
								}}
								className="px-3 py-1 text-sm text-white bg-blue-600 rounded transition-colors hover:bg-blue-700">
								이전달
							</button>
							<button
								onClick={() => {
									const now = new Date();
									setSelectedYear(now.getFullYear());
									setSelectedMonth(now.getMonth() + 1);
								}}
								className="px-3 py-1 text-sm text-white bg-blue-600 rounded transition-colors hover:bg-blue-700">
								이번달
							</button>
							<button
								onClick={() => {
									if (selectedMonth === 12) {
										setSelectedYear(selectedYear + 1);
										setSelectedMonth(1);
									} else {
										setSelectedMonth(selectedMonth + 1);
									}
								}}
								className="px-3 py-1 text-sm text-white bg-blue-600 rounded transition-colors hover:bg-blue-700">
								다음달
							</button>
						</div>
					</div>

					{/* 기능 버튼들 */}
					<div className="flex flex-wrap gap-2">
						<button onClick={() => setShowExpenseForm(true)} className="px-3 py-2 text-sm text-white bg-green-600 rounded-lg transition-colors hover:bg-green-700">
							지출 추가
						</button>
						<button onClick={() => setShowRecurringModal(true)} className="px-3 py-2 text-sm text-white bg-blue-600 rounded-lg transition-colors hover:bg-blue-700">
							고정비 관리
						</button>
						<button onClick={() => setShowBirthdayModal(true)} className="px-3 py-2 text-sm text-white bg-purple-600 rounded-lg transition-colors hover:bg-purple-700">
							생일 설정
						</button>
					</div>
				</div>

				{/* 지출 통계 */}
				<div className="text-sm text-gray-400">총 {filteredExpenses.length}건의 지출</div>
			</div>

			{/* 사용자별 총액 */}
			<div className="p-6 bg-gray-800 rounded-lg">
				<h3 className="mb-4 text-lg font-semibold text-white">사용자별 정산</h3>
				<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
					{USERS.map(user => (
						<div key={user} className="text-center">
							<div className="text-sm text-gray-400">{user}</div>
							<div className={`text-lg font-semibold ${userTotals[user] < 0 ? 'text-red-400' : 'text-green-400'}`}>{userTotals[user].toLocaleString()}원</div>
						</div>
					))}
				</div>
				<div className="pt-4 mt-4 text-center border-t border-gray-700">
					<div className="text-sm text-gray-400">전체 총액</div>
					<div className="text-xl font-bold text-white">{grandTotal.toLocaleString()}원</div>
				</div>
			</div>

			{/* 지출 목록 */}
			<div className="overflow-hidden bg-gray-800 rounded-lg">
				<div className="overflow-x-auto">
					<table className="w-full">
						<thead className="bg-gray-700">
							<tr>
								<th className="px-4 py-3 text-left text-sm font-medium text-gray-300 min-w-[80px]">날짜</th>
								<th className="px-4 py-3 text-left text-sm font-medium text-gray-300 min-w-[60px]">타입</th>
								<th className="px-4 py-3 text-left text-sm font-medium text-gray-300 min-w-[200px]">항목</th>
								{USERS.map(user => (
									<th key={user} className="px-4 py-3 text-right text-sm font-medium text-gray-300 min-w-[100px]">
										{user}
									</th>
								))}
								<th className="px-4 py-3 text-right text-sm font-medium text-gray-300 min-w-[100px]">총액</th>
								<th className="px-4 py-3 text-center text-sm font-medium text-gray-300 min-w-[120px]">작업</th>
							</tr>
						</thead>

						<tbody className="divide-y divide-gray-700">
							{sortedExpenses.map(expense => (
								<tr key={expense.id} className="transition-colors hover:bg-gray-750">
									{/* 날짜 */}
									<td className="px-4 py-3 text-sm text-gray-300">{formatDate(expense.date)}</td>

									{/* 타입 */}
									<td className="px-4 py-3">
										<span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getTypeStyle(expense.type)}`}>{expense.type}</span>
									</td>

									{/* 항목 */}
									<td className="px-4 py-3 text-sm text-white">
										<div className="font-medium">{expense.title}</div>
										{expense.payer && <div className="mt-1 text-xs text-blue-400">결제자: {expense.payer}</div>}
									</td>

									{/* 사용자별 금액 */}
									{USERS.map(user => {
										const amount = expense.user_amounts[user] || 0;
										return (
											<td key={user} className="px-4 py-3 text-sm text-right">
												{amount === 0 ? (
													<span className="text-gray-500">-</span>
												) : (
													<span className={amount < 0 ? 'text-red-400 font-medium' : 'text-green-400 font-medium'}>{amount.toLocaleString()}</span>
												)}
											</td>
										);
									})}

									{/* 총액 */}
									<td className="px-4 py-3 text-sm font-medium text-right text-white">{expense.total.toLocaleString()}</td>

									{/* 작업 버튼 */}
									<td className="px-4 py-3 text-center">
										<div className="flex justify-center space-x-2">
											<button onClick={() => handleExpenseEdit(expense)} className="px-2 py-1 text-xs text-white bg-blue-600 rounded transition-colors hover:bg-blue-700">
												수정
											</button>
											<button onClick={() => handleExpenseDelete(expense.id, expense.type)} className="px-2 py-1 text-xs text-white bg-red-600 rounded transition-colors hover:bg-red-700">
												삭제
											</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>

						{/* 총계 행 */}
						<tfoot className="bg-gray-900">
							<tr className="font-semibold">
								<td className="px-4 py-4 text-white" colSpan="3">
									총계
								</td>
								{USERS.map(user => (
									<td key={user} className="px-4 py-4 text-right">
										<span className={userTotals[user] < 0 ? 'text-red-400 font-bold' : 'text-green-400 font-bold'}>{userTotals[user].toLocaleString()}</span>
									</td>
								))}
								<td className="px-4 py-4 font-bold text-right text-white">{grandTotal.toLocaleString()}</td>
								<td className="px-4 py-4"></td>
							</tr>
						</tfoot>
					</table>

					{sortedExpenses.length === 0 && <div className="p-8 text-center text-gray-500">등록된 지출이 없습니다.</div>}
				</div>
			</div>

			{/* 모달들 */}
			{showExpenseForm && (
				<Modal
					isOpen={showExpenseForm}
					onClose={() => {
						setShowExpenseForm(false);
						setEditingExpense(null);
					}}
					title={editingExpense ? '지출 수정' : '지출 추가'}>
					<ExpenseForm
						users={USERS}
						onSubmit={handleExpenseSubmit}
						onCancel={() => {
							setShowExpenseForm(false);
							setEditingExpense(null);
						}}
						initialData={editingExpense}
					/>
				</Modal>
			)}

			{showRecurringModal && <RecurringExpenseModal isOpen={showRecurringModal} onClose={() => setShowRecurringModal(false)} users={USERS} onUpdate={loadExpenses} />}

			{showBirthdayModal && <BirthdaySettingsModal isOpen={showBirthdayModal} onClose={() => setShowBirthdayModal(false)} users={USERS} />}
		</div>
	);
}

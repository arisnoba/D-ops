import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import PriceSettingModal from './PriceSettingModal';
import SideNav from './SideNav';
import Modal from './Modal';
import ClientForm from './ClientForm';
import TaskForm from './TaskForm';
import ExpenseForm from './ExpenseForm';
import RecurringExpenseModal from './RecurringExpenseModal';
import BirthdaySettingsModal from './BirthdaySettingsModal';

const USERS = ['유재욱', '신성원', '김정현', '김정민', '권순신'];

export default function Layout({ children }) {
	const [clientModalOpen, setClientModalOpen] = useState(false);
	const [taskModalOpen, setTaskModalOpen] = useState(false);
	const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
	const [expenseModalOpen, setExpenseModalOpen] = useState(false);
	const [recurringModalOpen, setRecurringModalOpen] = useState(false);
	const [birthdayModalOpen, setBirthdayModalOpen] = useState(false);
	const router = useRouter();

	const handleSignOut = async () => {
		try {
			const { error } = await supabase.auth.signOut();
			if (error) throw error;
			router.push('/signin');
		} catch (error) {
			console.error('Error signing out:', error.message);
		}
	};

	const handleClientSuccess = () => {
		setClientModalOpen(false);
		if (taskModalOpen) {
			// 작업 등록 모달 내에서 클라이언트 등록을 한 경우
		} else {
			// 클라이언트 등록 후 클라이언트 페이지로 이동
			router.push('/clients');
		}
	};

	const handleTaskSuccess = () => {
		setTaskModalOpen(false);
		// 현재 페이지에서 업데이트만 수행
		if (router.pathname === '/tasks') {
			// tasks 페이지에서는 페이지 새로고침 없이 데이터만 업데이트
			window.dispatchEvent(new CustomEvent('updateTasks'));
		} else {
			// 다른 페이지에서는 현재 페이지 새로고침
			router.replace(router.asPath);
		}
	};

	const handleExpenseSuccess = () => {
		setExpenseModalOpen(false);
		// 지출 페이지에서 업데이트 이벤트 발생
		if (router.pathname === '/expenses') {
			window.dispatchEvent(new CustomEvent('updateExpenses'));
		} else {
			router.push('/expenses');
		}
	};

	const handleRecurringUpdate = () => {
		// 고정비 관리는 모달 내에서 자체적으로 관리
		if (router.pathname === '/expenses') {
			window.dispatchEvent(new CustomEvent('updateExpenses'));
		}
	};

	return (
		<div className="flex h-screen bg-gray-50 dark:bg-[#121212] overflow-auto">
			<SideNav
				setClientModalOpen={setClientModalOpen}
				setTaskModalOpen={setTaskModalOpen}
				setPriceModalOpen={setIsPriceModalOpen}
				setExpenseModalOpen={setExpenseModalOpen}
				setRecurringModalOpen={setRecurringModalOpen}
				setBirthdayModalOpen={setBirthdayModalOpen}
			/>
			<div className="flex-1 ml-48">
				<main className="h-screen">{children}</main>
			</div>

			{/* 클라이언트 등록 모달 */}
			<Modal isOpen={clientModalOpen} onClose={() => setClientModalOpen(false)} title="새 클라이언트 등록">
				<ClientForm onSuccess={handleClientSuccess} onCancel={() => setClientModalOpen(false)} />
			</Modal>

			{/* 업무 등록 모달 */}
			<Modal isOpen={taskModalOpen} onClose={() => setTaskModalOpen(false)} title="새 업무 등록">
				<TaskForm
					onSuccess={handleTaskSuccess}
					onCancel={() => setTaskModalOpen(false)}
					onClientRequired={() => {
						setClientModalOpen(true);
						// 클라이언트 등록 완료 후 다시 업무 모달로 돌아오도록 taskModalOpen은 유지
					}}
				/>
			</Modal>

			{/* 단가 설정 모달 */}
			<PriceSettingModal isOpen={isPriceModalOpen} onClose={() => setIsPriceModalOpen(false)} />

			{/* 지출 추가 모달 */}
			{expenseModalOpen && (
				<Modal isOpen={expenseModalOpen} onClose={() => setExpenseModalOpen(false)} title="지출 추가">
					<ExpenseForm users={USERS} onSubmit={handleExpenseSuccess} onCancel={() => setExpenseModalOpen(false)} />
				</Modal>
			)}

			{/* 고정비 관리 모달 */}
			{recurringModalOpen && <RecurringExpenseModal isOpen={recurringModalOpen} onClose={() => setRecurringModalOpen(false)} users={USERS} onUpdate={handleRecurringUpdate} />}

			{/* 생일 설정 모달 */}
			{birthdayModalOpen && <BirthdaySettingsModal isOpen={birthdayModalOpen} onClose={() => setBirthdayModalOpen(false)} users={USERS} />}
		</div>
	);
}

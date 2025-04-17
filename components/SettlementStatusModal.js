import React from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Card from './ui/Card';

export default function SettlementStatusModal({ isOpen, onClose, onConfirm, loading, selectedTasksCount, targetStatus, dateRange }) {
	return (
		<Modal isOpen={isOpen} onClose={onClose} title="정산 상태 변경 확인">
			<div className="space-y-4">
				<div className="text-gray-600 dark:text-gray-300">
					<span className="font-medium text-gray-900 dark:text-gray-100">
						총 <span className="text-green-900 dark:text-green-500">{selectedTasksCount}</span>개
					</span>
					의 업무를{' '}
					<span className={`font-medium ${targetStatus === 'completed' ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
						정산 {targetStatus === 'completed' ? '완료' : '대기'}
					</span>{' '}
					상태로 변경하시겠습니까?
				</div>

				{dateRange && (
					<Card variant="subtle" className="text-sm">
						<div className="opacity-60">
							<span className="font-medium text-green-900 dark:text-green-500">{dateRange.oldestDate}</span>
							{' 부터 '}
							<span className="font-medium text-green-900 dark:text-green-500">{dateRange.latestDate}</span>의 업무
						</div>
					</Card>
				)}

				<div className="flex justify-end space-x-3 mt-6">
					<Button variant="secondary" onClick={onClose}>
						취소
					</Button>
					<Button variant={targetStatus === 'completed' ? 'success' : 'warning'} onClick={onConfirm} disabled={loading}>
						{loading ? '처리 중...' : '확인'}
					</Button>
				</div>
			</div>
		</Modal>
	);
}

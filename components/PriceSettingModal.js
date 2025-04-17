import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function PriceSettingModal({ isOpen, onClose }) {
	const [prices, setPrices] = useState({
		operation: 25000,
		design: 30000,
		development: 50000,
	});

	const [loading, setLoading] = useState(false);

	useEffect(() => {
		fetchPrices();
	}, []);

	const fetchPrices = async () => {
		try {
			const { data, error } = await supabase.from('settings').select('*').single();

			if (error) throw error;

			if (data) {
				setPrices({
					operation: data.operation_price || 25000,
					design: data.design_price || 30000,
					development: data.development_price || 50000,
				});
			}
		} catch (error) {
			console.error('Error fetching prices:', error);
		}
	};

	const handleSave = async () => {
		try {
			setLoading(true);
			const { error } = await supabase.from('settings').upsert({
				id: 1, // 단일 설정 레코드 사용
				operation_price: prices.operation,
				design_price: prices.design,
				development_price: prices.development,
				updated_at: new Date(),
			});

			if (error) throw error;

			onClose();
		} catch (error) {
			console.error('Error saving prices:', error);
			alert('설정 저장 중 오류가 발생했습니다.');
		} finally {
			setLoading(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white dark:bg-dark-card rounded-lg p-6 max-w-md w-full mx-4">
				<h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">시간당 단가 설정</h2>

				<div className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">운영 단가</label>
						<div className="relative">
							<input
								type="number"
								value={prices.operation / 10000}
								onChange={e => setPrices(prev => ({ ...prev, operation: e.target.value * 10000 }))}
								className="block w-full rounded-md border-gray-300 dark:bg-dark-bg dark:border-gray-600 pr-12 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
							/>
							<div className="absolute inset-y-0 right-0 flex items-center pr-3">
								<span className="text-gray-500 sm:text-sm">만원</span>
							</div>
						</div>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">디자인 단가</label>
						<div className="relative">
							<input
								type="number"
								value={prices.design / 10000}
								onChange={e => setPrices(prev => ({ ...prev, design: e.target.value * 10000 }))}
								className="block w-full rounded-md border-gray-300 dark:bg-dark-bg dark:border-gray-600 pr-12 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
							/>
							<div className="absolute inset-y-0 right-0 flex items-center pr-3">
								<span className="text-gray-500 sm:text-sm">만원</span>
							</div>
						</div>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">개발 단가</label>
						<div className="relative">
							<input
								type="number"
								value={prices.development / 10000}
								onChange={e => setPrices(prev => ({ ...prev, development: e.target.value * 10000 }))}
								className="block w-full rounded-md border-gray-300 dark:bg-dark-bg dark:border-gray-600 pr-12 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
							/>
							<div className="absolute inset-y-0 right-0 flex items-center pr-3">
								<span className="text-gray-500 sm:text-sm">만원</span>
							</div>
						</div>
					</div>
				</div>

				<div className="mt-6 flex justify-end space-x-3">
					<button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-bg rounded-md transition-colors">
						취소
					</button>
					<button onClick={handleSave} disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50">
						{loading ? '저장 중...' : '저장'}
					</button>
				</div>
			</div>
		</div>
	);
}

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Modal from './ui/Modal';
import Input from './ui/Input';
import Button from './ui/Button';

export default function PriceSettingModal({ isOpen, onClose }) {
	const [prices, setPrices] = useState({
		operation: '',
		design: '',
		development: '',
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [isDataLoaded, setIsDataLoaded] = useState(false);

	useEffect(() => {
		if (isOpen && !isDataLoaded) {
			fetchPrices();
		}
	}, [isOpen]);

	const fetchPrices = async () => {
		try {
			const { data, error } = await supabase.from('settings').select('*').single();

			if (error) throw error;

			if (data) {
				setPrices({
					operation: (data.operation_price / 10000).toString(),
					design: (data.design_price / 10000).toString(),
					development: (data.development_price / 10000).toString(),
				});
			}
			setIsDataLoaded(true);
		} catch (error) {
			console.error('Error fetching prices:', error);
			setError('가격 정보를 불러오는 중 오류가 발생했습니다.');
		}
	};

	const handleSubmit = async e => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		try {
			const { error: updateError } = await supabase
				.from('settings')
				.update({
					operation_price: parseFloat(prices.operation) * 10000,
					design_price: parseFloat(prices.design) * 10000,
					development_price: parseFloat(prices.development) * 10000,
				})
				.eq('id', 1);

			if (updateError) throw updateError;

			onClose();
			setIsDataLoaded(false);
		} catch (error) {
			console.error('Error updating prices:', error);
			setError('가격 설정 중 오류가 발생했습니다.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<Modal isOpen={isOpen && isDataLoaded} onClose={onClose} title="시간당 단가 설정" className="w-full max-w-lg mx-4">
			<form onSubmit={handleSubmit}>
				{error && <div className="mb-4 text-sm text-red-600">{error}</div>}

				<div className="space-y-4">
					<Input
						id="operation"
						type="number"
						value={prices.operation}
						onChange={e => setPrices(prev => ({ ...prev, operation: e.target.value }))}
						label="운영 단가 (만원)"
						placeholder="예: 2.5"
						required
						min="0.1"
						step="0.1"
					/>

					<Input
						id="design"
						type="number"
						value={prices.design}
						onChange={e => setPrices(prev => ({ ...prev, design: e.target.value }))}
						label="디자인 단가 (만원)"
						placeholder="예: 3"
						required
						min="0.1"
						step="0.1"
					/>

					<Input
						id="development"
						type="number"
						value={prices.development}
						onChange={e => setPrices(prev => ({ ...prev, development: e.target.value }))}
						label="개발 단가 (만원)"
						placeholder="예: 5"
						required
						min="0.1"
						step="0.1"
					/>
				</div>

				<div className="mt-6 flex justify-end space-x-3">
					<Button variant="secondary" onClick={onClose}>
						취소
					</Button>
					<Button type="submit" disabled={loading}>
						{loading ? '저장 중...' : '저장하기'}
					</Button>
				</div>
			</form>
		</Modal>
	);
}

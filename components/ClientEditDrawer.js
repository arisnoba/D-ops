import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Drawer from './Drawer';

export default function ClientEditDrawer({ isOpen, onClose, clientId, onSuccess }) {
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [contactPerson, setContactPerson] = useState('');
	const [contactEmail, setContactEmail] = useState('');
	const [contactPhone, setContactPhone] = useState('');
	const [error, setError] = useState(null);

	// 드로어가 열리면 데이터 로드
	useEffect(() => {
		if (isOpen && clientId) {
			fetchClient();
		}
	}, [isOpen, clientId]);

	async function fetchClient() {
		try {
			setLoading(true);
			setError(null);

			const { data, error } = await supabase.from('clients').select('*').eq('id', clientId).single();

			if (error) throw error;

			if (data) {
				setName(data.name);
				setDescription(data.description || '');
				setContactPerson(data.contact_person || '');
				setContactEmail(data.contact_email || '');
				setContactPhone(data.contact_phone || '');
			}
		} catch (error) {
			console.error('Error fetching client:', error.message);
			setError('클라이언트를 불러오는 중 오류가 발생했습니다.');
		} finally {
			setLoading(false);
		}
	}

	async function handleSubmit(e) {
		e.preventDefault();

		if (!name) {
			setError('클라이언트 이름은 필수 항목입니다.');
			return;
		}

		try {
			setSubmitting(true);
			setError(null);

			const { data, error } = await supabase
				.from('clients')
				.update({
					name,
					description,
					contact_person: contactPerson,
					contact_email: contactEmail,
					contact_phone: contactPhone,
				})
				.eq('id', clientId);

			if (error) throw error;

			// 성공 콜백 호출
			if (onSuccess) {
				onSuccess();
			}

			// 드로어 닫기
			onClose();
		} catch (error) {
			console.error('Error updating client:', error.message);
			setError('클라이언트 수정 중 오류가 발생했습니다: ' + error.message);
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<Drawer isOpen={isOpen} onClose={onClose} title="클라이언트 수정">
			{loading ? (
				<div className="py-8 text-center">
					<p className="text-gray-500">로딩 중...</p>
				</div>
			) : (
				<form onSubmit={handleSubmit}>
					{error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

					<div className="mb-6">
						<label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2" htmlFor="name">
							클라이언트 이름 *
						</label>
						<input
							id="name"
							type="text"
							value={name}
							onChange={e => setName(e.target.value)}
							className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-bg dark:border-dark-border dark:text-gray-200"
							required
						/>
					</div>

					<div className="mb-6">
						<label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2" htmlFor="description">
							설명
						</label>
						<textarea
							id="description"
							value={description}
							onChange={e => setDescription(e.target.value)}
							className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-bg dark:border-dark-border dark:text-gray-200"
							rows="3"
						/>
					</div>

					<div className="mb-6">
						<label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2" htmlFor="contactPerson">
							담당자 이름
						</label>
						<input
							id="contactPerson"
							type="text"
							value={contactPerson}
							onChange={e => setContactPerson(e.target.value)}
							className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-bg dark:border-dark-border dark:text-gray-200"
						/>
					</div>

					<div className="mb-6">
						<label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2" htmlFor="contactEmail">
							담당자 이메일
						</label>
						<input
							id="contactEmail"
							type="email"
							value={contactEmail}
							onChange={e => setContactEmail(e.target.value)}
							className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-bg dark:border-dark-border dark:text-gray-200"
						/>
					</div>

					<div className="mb-6">
						<label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2" htmlFor="contactPhone">
							담당자 연락처
						</label>
						<input
							id="contactPhone"
							type="text"
							value={contactPhone}
							onChange={e => setContactPhone(e.target.value)}
							className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-bg dark:border-dark-border dark:text-gray-200"
						/>
					</div>

					<div className="flex justify-between">
						<button
							type="button"
							onClick={onClose}
							className="px-6 py-2 border border-gray-300 dark:border-dark-border rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-border/40 transition duration-200">
							취소
						</button>
						<button
							type="submit"
							disabled={submitting}
							className={`px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200 ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}>
							{submitting ? '저장 중...' : '저장하기'}
						</button>
					</div>
				</form>
			)}
		</Drawer>
	);
}

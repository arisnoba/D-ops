import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function ClientForm({ onSuccess, onCancel }) {
	const [loading, setLoading] = useState(false);
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [contactPerson, setContactPerson] = useState('');
	const [contactEmail, setContactEmail] = useState('');
	const [contactPhone, setContactPhone] = useState('');
	const [error, setError] = useState(null);

	async function handleSubmit(e) {
		e.preventDefault();

		if (!name) {
			setError('클라이언트 이름은 필수 항목입니다.');
			return;
		}

		try {
			setLoading(true);
			setError(null);

			const { data, error } = await supabase.from('clients').insert([
				{
					name,
					description,
					contact_person: contactPerson,
					contact_email: contactEmail,
					contact_phone: contactPhone,
					created_at: new Date(),
				},
			]);

			if (error) throw error;

			// 폼 초기화
			setName('');
			setDescription('');
			setContactPerson('');
			setContactEmail('');
			setContactPhone('');

			// 성공 콜백 호출
			if (onSuccess) {
				onSuccess(data[0]);
			}
		} catch (error) {
			console.error('Error adding client:', error.message);
			setError('클라이언트 등록 중 오류가 발생했습니다.');
		} finally {
			setLoading(false);
		}
	}

	return (
		<form onSubmit={handleSubmit}>
			{error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

			<div className="mb-6">
				<label className="block text-gray-700 font-semibold mb-2" htmlFor="name">
					클라이언트 이름 *
				</label>
				<input
					id="name"
					type="text"
					value={name}
					onChange={e => setName(e.target.value)}
					className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					required
				/>
			</div>

			<div className="mb-6">
				<label className="block text-gray-700 font-semibold mb-2" htmlFor="description">
					설명
				</label>
				<textarea
					id="description"
					value={description}
					onChange={e => setDescription(e.target.value)}
					className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					rows="3"
				/>
			</div>

			<div className="mb-6">
				<label className="block text-gray-700 font-semibold mb-2" htmlFor="contactPerson">
					담당자 이름
				</label>
				<input
					id="contactPerson"
					type="text"
					value={contactPerson}
					onChange={e => setContactPerson(e.target.value)}
					className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<div className="mb-6">
				<label className="block text-gray-700 font-semibold mb-2" htmlFor="contactEmail">
					담당자 이메일
				</label>
				<input
					id="contactEmail"
					type="email"
					value={contactEmail}
					onChange={e => setContactEmail(e.target.value)}
					className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<div className="mb-6">
				<label className="block text-gray-700 font-semibold mb-2" htmlFor="contactPhone">
					담당자 연락처
				</label>
				<input
					id="contactPhone"
					type="text"
					value={contactPhone}
					onChange={e => setContactPhone(e.target.value)}
					className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<div className="flex justify-between">
				<button type="button" onClick={onCancel} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition duration-200">
					취소
				</button>
				<button
					type="submit"
					disabled={loading}
					className={`px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}>
					{loading ? '등록 중...' : '클라이언트 등록하기'}
				</button>
			</div>
		</form>
	);
}

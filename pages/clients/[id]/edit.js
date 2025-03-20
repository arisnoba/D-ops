import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase';

export default function EditClient() {
	const router = useRouter();
	const { id } = router.query;
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [contactPerson, setContactPerson] = useState('');
	const [contactEmail, setContactEmail] = useState('');
	const [contactPhone, setContactPhone] = useState('');
	const [error, setError] = useState(null);

	// 클라이언트 정보 가져오기
	useEffect(() => {
		if (id) {
			fetchClient();
		}
	}, [id]);

	async function fetchClient() {
		try {
			setLoading(true);
			setError(null);

			const { data, error } = await supabase.from('clients').select('*').eq('id', id).single();

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
				.eq('id', id);

			if (error) throw error;

			// 클라이언트 상세 페이지로 이동
			router.push(`/clients/${id}`);
		} catch (error) {
			console.error('Error updating client:', error.message);
			setError('클라이언트 수정 중 오류가 발생했습니다.');
		} finally {
			setSubmitting(false);
		}
	}

	if (loading) {
		return (
			<div className="flex-grow container mx-auto py-12 px-4">
				<p className="text-center">로딩 중...</p>
			</div>
		);
	}

	if (error && !name) {
		return (
			<div className="flex-grow container mx-auto py-12 px-4">
				<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>
				<div className="text-center mt-4">
					<Link href="/clients">
						<a className="text-blue-500 hover:underline">클라이언트 목록으로 돌아가기</a>
					</Link>
				</div>
			</div>
		);
	}

	return (
		<>
			<Head>
				<title>클라이언트 수정 | D-ops</title>
			</Head>

			<main className="flex-grow container mx-auto py-12 px-4">
				<div className="mb-6">
					<Link href={`/clients/${id}`}>
						<a className="text-blue-500 hover:underline flex items-center">
							<svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
							</svg>
							클라이언트 상세로 돌아가기
						</a>
					</Link>
				</div>

				<h1 className="text-3xl font-bold mb-8">클라이언트 수정</h1>

				<form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto">
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
						<Link href={`/clients/${id}`}>
							<a className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition duration-200">취소</a>
						</Link>
						<button
							type="submit"
							disabled={submitting}
							className={`px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200 ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}>
							{submitting ? '저장 중...' : '클라이언트 수정하기'}
						</button>
					</div>
				</form>
			</main>
		</>
	);
}

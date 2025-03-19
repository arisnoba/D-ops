import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

export default function ClientList() {
	const [loading, setLoading] = useState(false);
	const [clients, setClients] = useState([]);

	useEffect(() => {
		fetchClients();
	}, []);

	async function fetchClients() {
		try {
			setLoading(true);
			const { data, error } = await supabase.from('clients').select('*').order('name', { ascending: true });

			if (error) throw error;
			if (data) setClients(data);
		} catch (error) {
			console.error('Error fetching clients:', error.message);
		} finally {
			setLoading(false);
		}
	}

	async function deleteClient(id) {
		try {
			if (confirm('정말 이 클라이언트를 삭제하시겠습니까?')) {
				setLoading(true);
				const { error } = await supabase.from('clients').delete().eq('id', id);

				if (error) throw error;
				fetchClients(); // 목록 새로고침
			}
		} catch (error) {
			console.error('Error deleting client:', error.message);
		} finally {
			setLoading(false);
		}
	}

	return (
		<>
			<Head>
				<title>클라이언트 관리 | D-ops</title>
			</Head>

			<main className="flex-grow container mx-auto py-12 px-4">
				<div className="mb-8">
					<h1 className="text-3xl font-bold">클라이언트 관리</h1>
				</div>

				{loading ? (
					<p className="text-center py-4">로딩 중...</p>
				) : clients.length === 0 ? (
					<div className="bg-white rounded-lg shadow-md p-8 text-center">
						<p className="text-gray-500 mb-4">등록된 클라이언트가 없습니다.</p>
						<p className="text-blue-500">상단 메뉴에서 클라이언트를 등록해보세요</p>
					</div>
				) : (
					<div className="bg-white rounded-lg shadow-md overflow-hidden">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										이름
									</th>
									<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										연락처
									</th>
									<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										등록일
									</th>
									<th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
										관리
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{clients.map(client => (
									<tr key={client.id} className="hover:bg-gray-50">
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="font-medium text-gray-900">{client.name}</div>
											{client.description && <div className="text-sm text-gray-500 truncate max-w-xs">{client.description}</div>}
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											{client.contact_person && <div className="text-sm text-gray-900">{client.contact_person}</div>}
											{client.contact_email && <div className="text-sm text-gray-500">{client.contact_email}</div>}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(client.created_at).toLocaleDateString()}</td>
										<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
											<Link href={`/clients/${client.id}`}>
												<a className="text-blue-600 hover:text-blue-900 mr-4">상세</a>
											</Link>
											<Link href={`/clients/${client.id}/edit`}>
												<a className="text-indigo-600 hover:text-indigo-900 mr-4">수정</a>
											</Link>
											<button onClick={() => deleteClient(client.id)} className="text-red-600 hover:text-red-900">
												삭제
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</main>
		</>
	);
}

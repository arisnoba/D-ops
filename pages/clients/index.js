import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import ClientDetailDrawer from '../../components/ClientDetailDrawer';

export default function ClientList() {
	const [loading, setLoading] = useState(false);
	const [clients, setClients] = useState([]);
	const [selectedClientId, setSelectedClientId] = useState(null);
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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

	async function deleteClient(id, e) {
		// 이벤트 전파 중지 (테이블 행 클릭 이벤트 방지)
		e.stopPropagation();

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

	const handleClientClick = clientId => {
		setSelectedClientId(clientId);
		setIsDrawerOpen(true);
	};

	const handleCloseDrawer = () => {
		setIsDrawerOpen(false);
		// Drawer가 닫힐 때 클라이언트 목록 새로고침
		fetchClients();
	};

	return (
		<>
			<Head>
				<title>클라이언트 관리 | D-ops</title>
			</Head>

			<main className="flex-grow ">
				{/* <div className="mb-8">
					<h1 className="text-3xl font-bold dark:text-white">클라이언트 관리</h1>
				</div> */}

				{loading ? (
					<p className="text-center py-4 dark:text-gray-300">로딩 중...</p>
				) : clients.length === 0 ? (
					<div className="bg-white dark:bg-dark-card rounded-lg shadow-md p-8 text-center">
						<p className="text-gray-500 dark:text-gray-400 mb-4">등록된 클라이언트가 없습니다.</p>
						<p className="text-blue-500 dark:text-blue-400">상단 메뉴에서 클라이언트를 등록해보세요</p>
					</div>
				) : (
					<div className="bg-white dark:bg-dark-card rounded-lg shadow-md overflow-hidden">
						<table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
							<thead className="bg-gray-50 dark:bg-dark-card/80">
								<tr>
									<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
										이름
									</th>
									<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
										연락처
									</th>
									<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
										등록일
									</th>
									<th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
										관리
									</th>
								</tr>
							</thead>
							<tbody className="bg-white dark:bg-dark-card divide-y divide-gray-200 dark:divide-dark-border">
								{clients.map(client => (
									<tr key={client.id} className="transition duration-100 cursor-pointer transition-colors hover:!bg-alternative" onClick={() => handleClientClick(client.id)}>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="font-medium text-gray-900 dark:text-white">{client.name}</div>
											{client.description && <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{client.description}</div>}
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											{client.contact_person && <div className="text-sm text-gray-900 dark:text-white">{client.contact_person}</div>}
											{client.contact_email && <div className="text-sm text-gray-500 dark:text-gray-400">{client.contact_email}</div>}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(client.created_at).toLocaleDateString()}</td>
										<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={e => e.stopPropagation()}>
											<button onClick={e => deleteClient(client.id, e)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
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

			<ClientDetailDrawer isOpen={isDrawerOpen} onClose={handleCloseDrawer} clientId={selectedClientId} />
		</>
	);
}

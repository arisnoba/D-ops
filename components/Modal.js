import { useEffect } from 'react';

export default function Modal({ isOpen, onClose, title, children }) {
	useEffect(() => {
		if (isOpen) {
			// 모달이 열릴 때 현재 스크롤 위치 저장
			const scrollY = window.scrollY;
			document.body.style.position = 'fixed';
			document.body.style.width = '100%';
			document.body.style.top = `-${scrollY}px`;
		} else {
			// 모달이 닫힐 때 원래 스크롤 위치로 복원
			const scrollY = document.body.style.top;
			document.body.style.position = '';
			document.body.style.width = '';
			document.body.style.top = '';
			window.scrollTo(0, parseInt(scrollY || '0', 10) * -1);
		}

		return () => {
			document.body.style.position = '';
			document.body.style.width = '';
			document.body.style.top = '';
		};
	}, [isOpen]);

	// 모달이 닫혀있으면 렌더링하지 않음
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto">
			{/* 배경 오버레이 */}
			<div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>

			{/* 모달 콘텐츠 */}
			<div className="flex items-center justify-center min-h-screen p-4">
				<div className="relative bg-white dark:bg-[#1a1a1a] rounded-lg shadow-xl z-10 w-full max-w-2xl">
					<div className="flex justify-between items-center border-b dark:border-dark-border px-6 py-4">
						<h2 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h2>
						<button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none">
							<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>

					<div className="p-6">{children}</div>
				</div>
			</div>
		</div>
	);
}

import { useEffect } from 'react';

export default function Drawer({ isOpen, onClose, title, children, width = 'max-w-2xl' }) {
	// 드로어가 열렸을 때 배경 스크롤 막기
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = 'unset';
		}

		return () => {
			document.body.style.overflow = 'unset';
		};
	}, [isOpen]);

	// 드로어가 닫혀있으면 렌더링하지 않음
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex justify-end">
			{/* 배경 오버레이 */}
			<div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300" onClick={onClose}></div>

			{/* 드로어 콘텐츠 */}
			<div className={`bg-white dark:bg-dark-card h-full ${width} w-full shadow-xl z-10 transform transition-transform duration-300 ease-in-out overflow-y-auto`}>
				<div className="flex justify-between items-center border-b dark:border-dark-border px-6 py-4 sticky top-0 bg-white dark:bg-dark-card z-10">
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
	);
}

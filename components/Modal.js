import { useEffect } from 'react';

export default function Modal({ isOpen, onClose, title, children }) {
	// 모달 열렸을 때 배경 스크롤 막기
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

	// 모달이 닫혀있으면 렌더링하지 않음
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			{/* 배경 오버레이 */}
			<div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>

			{/* 모달 콘텐츠 */}
			<div className="bg-white rounded-lg shadow-xl z-10 w-full max-w-2xl mx-4 overflow-hidden">
				<div className="flex justify-between items-center border-b px-6 py-4">
					<h2 className="text-xl font-bold">{title}</h2>
					<button onClick={onClose} className="text-gray-400 hover:text-gray-600 focus:outline-none">
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

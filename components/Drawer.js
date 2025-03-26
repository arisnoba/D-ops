import { useEffect, useState } from 'react';

export default function Drawer({ isOpen, onClose, title, children, width = 'max-w-2xl' }) {
	const [isAnimating, setIsAnimating] = useState(false);
	const [shouldRender, setShouldRender] = useState(false);

	// 드로어가 열렸을 때 배경 스크롤 막기
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden';
			setShouldRender(true);
			// 애니메이션을 위해 약간의 지연 후 isAnimating을 true로 설정
			requestAnimationFrame(() => {
				setIsAnimating(true);
			});
		} else {
			document.body.style.overflow = 'unset';
			setIsAnimating(false);
			// 애니메이션이 끝난 후에 컴포넌트를 언마운트
			const timer = setTimeout(() => {
				setShouldRender(false);
			}, 300); // 애니메이션 지속 시간과 동일하게 설정
			return () => clearTimeout(timer);
		}

		return () => {
			document.body.style.overflow = 'unset';
		};
	}, [isOpen]);

	if (!shouldRender) return null;

	return (
		<div className="fixed inset-0 z-50 flex justify-end ">
			{/* 배경 오버레이 */}
			<div className={`absolute inset-0 bg-black transition-opacity duration-300 ease-in-out ${isAnimating ? 'opacity-50' : 'opacity-0'}`} onClick={onClose}></div>

			{/* 드로어 콘텐츠 */}
			<div
				className={`bg-white dark:bg-dark-card h-full ${width} w-full shadow-xl z-10 transform transition-all duration-300 ease-in-out overflow-y-auto ${
					isAnimating ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
				}`}>
				<div className="flex justify-between items-center border-b dark:border-dark-border px-6 py-4 sticky top-0 bg-white dark:bg-dark-card z-10">
					<h2 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h2>
					<button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
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

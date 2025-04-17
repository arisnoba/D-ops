import React, { useEffect, useState } from 'react';

export default function Modal({ isOpen, onClose, children, title, className = '', ...props }) {
	const [isAnimating, setIsAnimating] = useState(false);

	useEffect(() => {
		if (isOpen) {
			setIsAnimating(true);
		}
	}, [isOpen]);

	const handleBackdropClick = e => {
		if (e.target === e.currentTarget) {
			onClose();
		}
	};

	const handleTransitionEnd = () => {
		if (!isOpen) {
			setIsAnimating(false);
		}
	};

	if (!isOpen && !isAnimating) return null;

	return (
		<div
			className={`
        fixed inset-0 z-50 flex items-center justify-center
        ${isOpen ? 'bg-black/50' : 'bg-black/0'}
        transition-colors duration-300 ease-in-out
      `}
			onClick={handleBackdropClick}>
			<div
				className={`
          bg-white dark:bg-dark-card rounded-lg shadow-xl
          transform transition-all duration-300 ease-in-out
          ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
          ${className}
        `}
				onTransitionEnd={handleTransitionEnd}
				onClick={e => e.stopPropagation()}
				{...props}>
				{title && (
					<div className="px-6 py-4 border-b border-gray-200 dark:border-dark-border">
						<h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{title}</h3>
					</div>
				)}
				<div className="p-6">{children}</div>
			</div>
		</div>
	);
}

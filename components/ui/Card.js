import React from 'react';

export default function Card({ children, className = '', variant = 'default', ...props }) {
	const variants = {
		default: 'bg-white dark:bg-dark-card',
		subtle: 'bg-gray-50 dark:bg-dark-bg/60',
	};

	return (
		<div
			className={`
        rounded-lg p-4 
        ${variants[variant]}
        ${className}
      `}
			{...props}>
			{children}
		</div>
	);
}

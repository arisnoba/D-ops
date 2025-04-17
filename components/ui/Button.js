import React from 'react';

export default function Button({ children, variant = 'primary', size = 'md', className = '', disabled, type = 'button', icon, onClick, ...props }) {
	const baseStyle = 'inline-flex items-center justify-center rounded-lg transition-colors duration-200 font-medium';

	const variants = {
		primary: 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500',
		secondary: 'border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-border/40',
		success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
		warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500',
		danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
	};

	const sizes = {
		sm: 'px-3 py-1.5 text-sm',
		md: 'px-4 py-2',
		lg: 'px-6 py-3 text-lg',
	};

	return (
		<button
			type={type}
			disabled={disabled}
			onClick={onClick}
			className={`
        ${baseStyle}
        ${variants[variant]}
        ${sizes[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
			{...props}>
			{icon && <span className="mr-2">{icon}</span>}
			{children}
		</button>
	);
}

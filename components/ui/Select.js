import React from 'react';

export default function Select({ id, value, onChange, options, className = '', placeholder = '선택해주세요', label, required, error, ...props }) {
	const baseStyle = 'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-bg dark:border-dark-border dark:text-gray-200 appearance-none';

	return (
		<div className="w-full">
			{label && (
				<label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
					{label} {required && <span className="text-red-500">*</span>}
				</label>
			)}
			<div className="relative">
				<select id={id} value={value} onChange={onChange} className={`${baseStyle} ${className}`} {...props}>
					<option value="">{placeholder}</option>
					{options.map(option => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
				<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 dark:text-gray-400">
					<svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
						<path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
					</svg>
				</div>
			</div>
			{error && <p className="mt-1 text-sm text-red-600">{error}</p>}
		</div>
	);
}

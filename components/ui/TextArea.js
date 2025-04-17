import React from 'react';

export default function TextArea({ id, value, onChange, className = '', placeholder, required, label, error, rows = 4, ...props }) {
	const baseStyle = 'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-bg dark:border-dark-border dark:text-gray-200';

	return (
		<div className="w-full">
			{label && (
				<label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
					{label} {required && <span className="text-red-500">*</span>}
				</label>
			)}
			<textarea id={id} value={value} onChange={onChange} className={`${baseStyle} ${className}`} placeholder={placeholder} required={required} rows={rows} {...props} />
			{error && <p className="mt-1 text-sm text-red-600">{error}</p>}
		</div>
	);
}

import React from 'react';

export default function Input({ id, type = 'text', value, onChange, className = '', placeholder, required, min, step, label, error, icon, ...props }) {
	const baseStyle =
		'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-bg dark:border-dark-border dark:text-gray-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';

	return (
		<div className="w-full">
			{label && (
				<label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
					{label} {required && <span className="text-red-500">*</span>}
				</label>
			)}
			<div className="relative">
				<input
					id={id}
					type={type}
					value={value}
					onChange={onChange}
					className={`${baseStyle} ${icon ? 'pr-10' : ''} ${className}`}
					placeholder={placeholder}
					required={required}
					min={min}
					step={step}
					{...props}
				/>
				{icon && <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 dark:text-gray-400">{icon}</div>}
			</div>
			{error && <p className="mt-1 text-sm text-red-600">{error}</p>}
		</div>
	);
}
